// src/services/ventasService.js
import { supabase } from './supabaseClient';

export const getClientes = async () => {
  const { data, error } = await supabase.from('clients').select('*').order('business_name');
  if (error) throw error;
  return data;
};

export const crearCliente = async (cliente, orgId) => {
  const { data, error } = await supabase
    .from('clients')
    .insert([{
      organization_id: orgId,
      business_name: cliente.razon_social,
      tax_id: cliente.nit,
      email: cliente.email,
      phone: cliente.telefono,
      client_type: 'retail'
    }])
    .select().single();
  if (error) throw error;
  return data;
};

export const getCatalogoVentas = async () => {
  const { data: productos, error } = await supabase
    .from('products')
    .select('id, name, sku, sale_price, package_weight_grams, is_roasted, finished_inventory(current_stock), source_green_inventory_id')
    .eq('is_active', true);

  if (error) throw error;

  return productos.map(p => {
    let stockVisual = 0;
    if (p.is_roasted) {
       stockVisual = p.finished_inventory?.reduce((acc, i) => acc + i.current_stock, 0) || 0;
    } else {
       stockVisual = 9999; // Café verde se maneja distinto, simplificado para POS
    }
    
    return {
      id: p.id,
      tipo: 'PRODUCTO',
      nombre: p.name,
      detalle: p.is_roasted ? `SKU: ${p.sku}` : `GRANEL - ${p.package_weight_grams/1000}Kg`,
      precio: p.sale_price,
      stock: stockVisual,
      unidad: p.is_roasted ? 'und' : 'unid'
    };
  });
};

/**
 * Registra la venta usando una transacción atómica RPC.
 * Si falla el stock, falla toda la venta.
 */
export const registrarVenta = async (datosVenta, orgId, userId) => {
  // Preparamos el payload limpio para la función SQL
  const itemsPayload = datosVenta.carrito.map(item => ({
    product_id: item.tipo === 'PRODUCTO' ? item.id : null,
    green_inventory_id: item.tipo !== 'PRODUCTO' ? item.id : null,
    cantidad: parseInt(item.cantidad),
    unit_price: parseFloat(item.precio_venta)
  }));

  const { data, error } = await supabase.rpc('registrar_venta_transaccion', {
    p_org_id: orgId,
    p_client_id: datosVenta.cliente_id,
    p_seller_id: userId,
    p_total: datosVenta.total,
    p_items: itemsPayload
  });

  if (error) {
    // Detectamos el error específico de la constraint
    if (error.message.includes('check_stock_no_negativo') || error.message.includes('check_verde_no_negativo')) {
      throw new Error("⛔ STOCK INSUFICIENTE: Alguien compró estos productos segundos antes que tú.");
    }
    throw error;
  }

  return data; // Retorna el ID de la orden
};