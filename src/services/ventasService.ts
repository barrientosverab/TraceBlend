import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];

// 1. Interfaces para el Carrito de Ventas
export interface ItemCarrito {
  tipo: 'PRODUCTO' | 'VERDE'; // O lo que uses en tu lógica
  id: string;
  cantidad: number;
  precio_venta: number;
  nombre?: string;
}

export interface DatosVenta {
  cliente_id: string;
  carrito: ItemCarrito[];
  total: number;
  metodoPago: string;
}

// 2. Interfaces para Clientes
export interface ClienteForm {
  razon_social: string;
  nit: string;
  email?: string;
  telefono?: string;
}

export const getClientes = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('business_name');
  
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

  const { data, error } = await supabase
    .from('clients')
    .insert([nuevoCliente])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error("Ya existe un cliente con este NIT/CI.");
    }
    throw error;
  }
  return data;
};

// Adaptador para el catálogo (Mapea BD a formato UI)
export const getCatalogoVentas = async () => {
  const { data: productos, error } = await supabase
    .from('products')
    .select(`
      id, 
      name, 
      sku, 
      sale_price, 
      package_weight_grams, 
      is_roasted, 
      source_green_inventory_id,
      finished_inventory ( current_stock )
    `)
    .eq('is_active', true);

  if (error) throw error;

  return (productos || []).map((p: any) => {
    let stockVisual = 0;
    
    // Lógica segura para leer stock anidado
    if (p.is_roasted && p.finished_inventory) {
       // finished_inventory puede ser un array o un objeto según tu relación (normalmente array)
       const inv = Array.isArray(p.finished_inventory) ? p.finished_inventory : [p.finished_inventory];
       stockVisual = inv.reduce((acc: number, i: any) => acc + (i?.current_stock || 0), 0);
    } else {
       stockVisual = 9999; 
    }
    
    return {
      id: p.id,
      tipo: 'PRODUCTO',
      nombre: p.name,
      detalle: p.is_roasted ? `SKU: ${p.sku}` : `GRANEL - ${(p.package_weight_grams || 0)/1000}Kg`,
      precio: p.sale_price,
      stock: stockVisual,
      unidad: p.is_roasted ? 'und' : 'unid'
    };
  });
};

export const registrarVenta = async (datosVenta: DatosVenta, orgId: string, userId: string) => {
  // Preparamos el payload para la función RPC de postgres
  const itemsPayload = datosVenta.carrito.map(item => ({
    product_id: item.tipo === 'PRODUCTO' ? item.id : null,
    green_inventory_id: item.tipo !== 'PRODUCTO' ? item.id : null,
    cantidad: Number(item.cantidad),
    unit_price: Number(item.precio_venta)
  }));

  // Llamada a RPC tipada
  // NOTA: Si 'registrar_venta_transaccion' no está en tu supabase.ts (Functions), 
  // tendrás que usar <any> o regenerar tipos si la función existe en la BD.
  const { data, error } = await supabase.rpc('registrar_venta_transaccion', {
    p_org_id: orgId,
    p_client_id: datosVenta.cliente_id,
    p_seller_id: userId,
    p_total: datosVenta.total,
    p_items: itemsPayload as any, // Postgres espera JSON/Array, a veces TS se queja aquí
    p_payment_method: datosVenta.metodoPago
  });

  if (error) {
    if (error.message.includes('check_stock')) {
      throw new Error("⛔ STOCK INSUFICIENTE: Verifique inventario.");
    }
    throw error;
  }

  return data;
};