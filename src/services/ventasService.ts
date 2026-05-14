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
    .select('customer_id, customers(id, full_name, nit, phone, email)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((link: any) => ({
    id: link.customers?.id,
    business_name: link.customers?.full_name,
    tax_id: link.customers?.nit,
    phone: link.customers?.phone,
    email: link.customers?.email,
    discount_rate: 0,
  }));
};

export const crearCliente = async (cliente: ClienteForm, orgId: string) => {
  // 1. Buscar si el cliente ya existe globalmente por NIT
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('nit', cliente.nit)
    .single();

  let customerId: string;

  if (existing) {
    customerId = existing.id;
  } else {
    // 2. Crear cliente global
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert([{
        full_name: cliente.razon_social,
        nit: cliente.nit,
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

// --- FUNCIÓN CLAVE: Registrar Venta (con soporte sale_status) ---
export const registrarVenta = async (
  datosVenta: DatosVenta,
  _orgId: string,
  userId: string,
  branchId: string,
  status: 'completado' | 'pendiente' = 'completado'
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

  // Llamamos a la función SQL register_sale con p_sale_status
  const { data, error } = await supabase.rpc('register_sale', {
    p_branch_id: branchId,
    p_customer_id: datosVenta.customer_id,
    p_profile_id: userId,
    p_items: itemsPayload as any,
    p_payments: paymentsPayload as any,
    p_notes: '',
    p_sale_status: status,
  });

  if (error) {
    if (error.message.includes('Stock insuficiente')) throw new Error(error.message);
    throw error;
  }
  return data;
};

// --- Pedidos Pendientes ---

export const getPedidosPendientes = async (orgId: string) => {
  // Cast needed: sale_status exists in DB but supabase.ts types haven't been regenerated
  const { data, error } = await (supabase
    .from('sales')
    .select(`
      id, total, created_at, customer_id,
      customers ( id, full_name, nit )
    `)
    .eq('organization_id', orgId) as any)
    .eq('sale_status', 'pendiente')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((sale: any) => ({
    id: sale.id,
    client_name: sale.customers?.full_name || 'Cliente Casual',
    order_date: sale.created_at,
    total_amount: sale.total,
  }));
};

export const marcarPedidoComoCompletado = async (orderId: string) => {
  // Cast needed: sale_status exists in DB but supabase.ts types haven't been regenerated
  const { error } = await supabase
    .from('sales')
    .update({ sale_status: 'completado' } as any)
    .eq('id', orderId);

  if (error) throw error;
};