import { supabase } from './supabaseClient';
import { Payment, formatPaymentsForDB } from '../types/payments';

export interface ItemCarrito {
  id: string;
  tipo: 'PRODUCTO' | 'VERDE';
  cantidad: number;
  precio_venta: number;
  precio_final: number;
  nombre?: string;
  es_cortesia?: boolean;
  descuento?: number;
  para_llevar?: boolean;  // Flag individual por item
  costo_envase?: number;   // Costo del envase si para_llevar = true
}

export interface DatosVenta {
  customer_id: string;
  carrito: ItemCarrito[];
  total: number;
  payments: Payment[];
  tipoPedido: 'dine_in' | 'takeaway';
}

export interface ClienteForm {
  razon_social: string;
  nit: string;
  email?: string;
  telefono?: string;
}

export const getClientes = async (orgId: string) => {
  // Clientes vinculados a esta organización via customer_org_links
  const { data, error } = await supabase
    .from('customer_org_links')
    .select('customer_id, discount_rate, customers(id, business_name, tax_id, phone, email)')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((link: any) => ({
    id: link.customers?.id,
    business_name: link.customers?.business_name,
    tax_id: link.customers?.tax_id,
    phone: link.customers?.phone,
    email: link.customers?.email,
    discount_rate: link.discount_rate || 0,
  }));
};

export const crearCliente = async (cliente: ClienteForm, orgId: string) => {
  // 1. Buscar si el cliente ya existe globalmente por NIT
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('tax_id', cliente.nit)
    .single();

  let customerId: string;

  if (existing) {
    customerId = existing.id;
  } else {
    // 2. Crear cliente global
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert([{
        business_name: cliente.razon_social,
        tax_id: cliente.nit,
        email: cliente.email || null,
        phone: cliente.telefono || null,
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error("Ya existe un cliente con este NIT/CI.");
      throw error;
    }
    customerId = newCustomer.id;
  }

  // 3. Vincular a la organización
  const { error: linkError } = await supabase
    .from('customer_org_links')
    .insert([{
      customer_id: customerId,
      organization_id: orgId,
      is_active: true,
    }]);

  if (linkError && linkError.code !== '23505') throw linkError; // ignorar duplicados

  return { id: customerId, business_name: cliente.razon_social, tax_id: cliente.nit };
};

export const getCatalogoVentas = async (orgId: string) => {
  const { data: productos, error } = await supabase
    .from('products')
    .select(`id, name, sku, sale_price, category_id, package_weight_grams`)
    .eq('organization_id', orgId)
    .eq('is_active', true);

  if (error) throw error;

  return (productos || []).map((p: any) => {
    return {
      id: p.id,
      tipo: 'PRODUCTO',
      nombre: p.name,
      category: p.category_id,
      detalle: p.sku ? `SKU: ${p.sku}` : '',
      precio: p.sale_price,
      stock: 0,
      unidad: 'und',
      promo_activa: undefined
    };
  });
};

// --- FUNCIÓN CLAVE ACTUALIZADA ---
export const registrarVenta = async (
  datosVenta: DatosVenta,
  orgId: string,
  userId: string,
  branchId: string,
  status: 'completed' | 'pending' = 'completed'
) => {
  // Preparamos los items para enviarlos al SQL
  const itemsPayload = datosVenta.carrito.map(item => ({
    product_id: item.tipo === 'PRODUCTO' ? item.id : null,
    cantidad: Number(item.cantidad),
    unit_price: Number(item.precio_final),
    is_courtesy: item.es_cortesia || false,
    discount_val: item.descuento || 0
  }));

  // Preparar pagos
  const paymentsPayload = datosVenta.payments && datosVenta.payments.length > 0
    ? formatPaymentsForDB(datosVenta.payments)
    : [{ method: 'cash', amount: datosVenta.total }];

  // Llamamos a la función SQL register_sale
  const { data, error } = await supabase.rpc('register_sale', {
    p_org_id: orgId,
    p_branch_id: branchId,
    p_customer_id: datosVenta.customer_id,
    p_seller_id: userId,
    p_total: datosVenta.total,
    p_items: itemsPayload as any,
    p_payments: paymentsPayload as any,
    p_order_type: datosVenta.tipoPedido,
    p_status: status
  });

  if (error) {
    if (error.message.includes('Stock insuficiente')) throw new Error(error.message);
    throw error;
  }
  return data;
};

// --- RECUPERAR PENDIENTES ---
export const getPedidosPendientes = async (orgId: string) => {
  const { data, error } = await supabase
    .from('sales')
    .select('id, total_amount, created_at, customers(business_name)')
    .eq('organization_id', orgId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((d: any) => ({
    ...d,
    client_name: d.customers?.business_name || 'Cliente Casual'
  }));
};

// --- DETALLE COMPLETO DE PEDIDO PENDIENTE ---
export const getDetallePedidoPendiente = async (orderId: string) => {
  const { data: order, error: orderError } = await supabase
    .from('sales')
    .select(`
      id,
      customer_id,
      total_amount,
      order_type,
      customers (id, business_name, tax_id)
    `)
    .eq('id', orderId)
    .eq('status', 'pending')
    .single();

  if (orderError) throw orderError;
  if (!order) throw new Error("Pedido no encontrado");

  const { data: items, error: itemsError } = await supabase
    .from('sale_items')
    .select(`
      id,
      product_id,
      quantity,
      unit_price,
      is_courtesy,
      products (id, name, sale_price, category_id)
    `)
    .eq('sale_id', orderId);

  if (itemsError) throw itemsError;

  return {
    order,
    items: (items || []).map(item => {
      const prod: any = item.products;
      return {
        id: item.product_id,
        tipo: 'PRODUCTO' as const,
        nombre: prod?.name || 'Producto',
        cantidad: item.quantity,
        precio: prod?.sale_price || 0,
        precio_final: item.unit_price,
        es_cortesia: item.is_courtesy,
        descuento: 0,
        category: prod?.category_id
      };
    })
  };
};

// --- MARCAR PEDIDO COMO COMPLETADO ---
export const marcarPedidoComoCompletado = async (orderId: string) => {
  const { error } = await supabase
    .from('sales')
    .update({ status: 'completed' })
    .eq('id', orderId);

  if (error) throw error;
};