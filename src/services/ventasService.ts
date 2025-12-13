import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];

export interface ItemCarrito {
  id: string;
  tipo: 'PRODUCTO' | 'VERDE';
  cantidad: number;
  precio_venta: number; // Precio base
  precio_final: number; // Precio con descuento
  nombre?: string;
  es_cortesia?: boolean; // <--- NUEVO
  descuento?: number;    // <--- NUEVO
}

export interface DatosVenta {
  cliente_id: string;
  carrito: ItemCarrito[];
  total: number;
  metodoPago: string;
  tipoPedido: 'dine_in' | 'takeaway'; // <--- NUEVO: Soluciona tu línea roja
}

// ... (Interfaces de cliente se mantienen igual) ...
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
  const { data: productos, error } = await supabase
    .from('products')
    .select(`id, name, sku, sale_price, category, package_weight_grams, is_roasted, finished_inventory ( current_stock )`)
    .eq('is_active', true);

  if (error) throw error;

  return (productos || []).map((p: any) => ({
    id: p.id,
    tipo: 'PRODUCTO',
    nombre: p.name,
    category: p.category,
    detalle: p.is_roasted ? `SKU: ${p.sku}` : `GRANEL`,
    precio: p.sale_price,
    stock: p.finished_inventory?.[0]?.current_stock || 0,
    unidad: 'und'
  }));
};

export const registrarVenta = async (datosVenta: DatosVenta, orgId: string, userId: string) => {
  // Preparamos el payload
  const itemsPayload = datosVenta.carrito.map(item => ({
    product_id: item.tipo === 'PRODUCTO' ? item.id : null,
    green_inventory_id: item.tipo !== 'PRODUCTO' ? item.id : null,
    cantidad: Number(item.cantidad),
    unit_price: Number(item.precio_final), // Usamos precio final (con descuento)
    is_courtesy: item.es_cortesia || false,
    discount_val: item.descuento || 0
  }));

  // Llamada a RPC actualizada
  const { data, error } = await supabase.rpc('registrar_venta_transaccion', {
    p_org_id: orgId,
    p_client_id: datosVenta.cliente_id,
    p_seller_id: userId,
    p_total: datosVenta.total,
    p_items: itemsPayload as any,
    p_payment_method: datosVenta.metodoPago,
    p_order_type: datosVenta.tipoPedido // <--- Pasamos el dato a la BD
  });

  if (error) {
    if (error.message.includes('check_stock')) throw new Error("⛔ STOCK INSUFICIENTE: Verifique inventario.");
    throw error;
  }
  return data;
};