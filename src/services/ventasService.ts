import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

// Definimos los tipos para TypeScript
type ProductRow = Database['public']['Tables']['products']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];

export interface ItemCarrito {
  id: string;
  tipo: 'PRODUCTO' | 'VERDE';
  cantidad: number;
  precio_venta: number;
  precio_final: number;
  nombre?: string;
  es_cortesia?: boolean;
  descuento?: number;
}

export interface DatosVenta {
  cliente_id: string;
  carrito: ItemCarrito[];
  total: number;
  metodoPago: string;
  tipoPedido: 'dine_in' | 'takeaway';
}

export interface ClienteForm {
  razon_social: string;
  nit: string;
  email?: string;
  telefono?: string;
}

export const getClientes = async () => {
  const { data, error } = await supabase.from('clients').select('*').order('business_name');
  if (error) throw error;
  return data || [];
};

export const crearCliente = async (cliente: ClienteForm, orgId: string) => {
  const nuevoCliente: ClientInsert = {
    organization_id: orgId,
    business_name: cliente.razon_social,
    tax_id: cliente.nit,
    email: cliente.email || null,
    phone: cliente.telefono || null,
    client_type: 'retail'
  };
  const { data, error } = await supabase.from('clients').insert([nuevoCliente]).select().single();
  if (error) {
    if (error.code === '23505') throw new Error("Ya existe un cliente con este NIT/CI.");
    throw error;
  }
  return data;
};

export const getCatalogoVentas = async () => {
  const hoy = new Date().toISOString();
  const { data: productos, error } = await supabase
    .from('products')
    .select(`
      id, name, sku, sale_price, category, package_weight_grams, is_roasted,
      finished_inventory ( current_stock ),
      product_promotions (
        id, name, discount_percent, is_courtesy, start_date, end_date
      )
    `)
    .eq('is_active', true)
    .filter('product_promotions.is_active', 'eq', true)
    .filter('product_promotions.end_date', 'gte', hoy)
    .filter('product_promotions.start_date', 'lte', hoy);

  if (error) throw error;

  return (productos || []).map((p: any) => {
    const promocionesActivas = p.product_promotions || [];
    const mejorPromo = promocionesActivas.sort((a: any, b: any) => {
      const descA = a.is_courtesy ? 100 : a.discount_percent;
      const descB = b.is_courtesy ? 100 : b.discount_percent;
      return descB - descA;
    })[0];

    return {
      id: p.id,
      tipo: 'PRODUCTO',
      nombre: p.name,
      category: p.category,
      detalle: p.is_roasted ? `SKU: ${p.sku}` : `GRANEL`,
      precio: p.sale_price,
      stock: p.finished_inventory?.[0]?.current_stock || 0,
      unidad: 'und',
      promo_activa: mejorPromo ? {
        nombre: mejorPromo.name,
        descuento: mejorPromo.is_courtesy ? 0 : mejorPromo.discount_percent,
        es_cortesia: mejorPromo.is_courtesy
      } : null
    };
  });
};

// --- FUNCIÓN CLAVE ACTUALIZADA ---
export const registrarVenta = async (
  datosVenta: DatosVenta,
  orgId: string,
  userId: string,
  // Nuevo parámetro: por defecto es 'completed', pero puede ser 'pending'
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

  // Llamamos a la función SQL que actualizamos en el paso anterior
  const { data, error } = await supabase.rpc('registrar_venta_transaccion', {
    p_org_id: orgId,
    p_client_id: datosVenta.cliente_id,
    p_seller_id: userId,
    p_total: datosVenta.total,
    p_items: itemsPayload as any,
    p_payment_method: datosVenta.metodoPago,
    p_order_type: datosVenta.tipoPedido,
    p_status: status // <--- Aquí pasamos el estado
  });

  if (error) {
    // Traducimos el error de SQL a algo legible para el usuario
    if (error.message.includes('Stock insuficiente')) throw new Error(error.message);
    throw error;
  }
  return data;
};

// --- NUEVA FUNCIÓN: RECUPERAR PENDIENTES ---
export const getPedidosPendientes = async (orgId: string) => {
  const { data, error } = await supabase
    .from('sales_orders')
    .select('id, total_amount, order_date, clients(business_name)')
    .eq('organization_id', orgId)
    .eq('status', 'pending') // Solo traemos los pendientes
    .order('order_date', { ascending: false });

  if (error) throw error;

  // Simplificamos la respuesta para la vista
  return data.map((d: any) => ({
    ...d,
    client_name: d.clients?.business_name || 'Cliente Casual'
  }));
};

// --- FUNCIÓN: OBTENER DETALLE COMPLETO DE PEDIDO PENDIENTE ---
export const getDetallePedidoPendiente = async (orderId: string) => {
  // 1. Traer datos del pedido
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select(`
      id,
      client_id,
      total_amount,
      order_type,
      clients (id, business_name, tax_id)
    `)
    .eq('id', orderId)
    .eq('status', 'pending')
    .single();

  if (orderError) throw orderError;
  if (!order) throw new Error("Pedido no encontrado");

  // 2. Traer items del pedido con detalles del producto
  const { data: items, error: itemsError } = await supabase
    .from('sales_order_items')
    .select(`
      id,
      product_id,
      quantity,
      unit_price,
      is_courtesy,
      products (id, name, sale_price, category)
    `)
    .eq('sales_order_id', orderId);

  if (itemsError) throw itemsError;

  return {
    order,
    items: (items || []).map(item => ({
      id: item.product_id,
      tipo: 'PRODUCTO' as const,
      nombre: item.products?.name || 'Producto',
      cantidad: item.quantity,
      precio: item.products?.sale_price || 0,
      precio_final: item.unit_price,
      es_cortesia: item.is_courtesy,
      descuento: 0, // El descuento ya está aplicado en unit_price
      category: item.products?.category
    }))
  };
};

// --- FUNCIÓN: MARCAR PEDIDO COMO COMPLETADO ---
export const marcarPedidoComoCompletado = async (orderId: string) => {
  const { error } = await supabase
    .from('sales_orders')
    .update({ status: 'completed' })
    .eq('id', orderId);

  if (error) throw error;
};