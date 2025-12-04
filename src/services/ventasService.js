import { supabase } from './supabaseClient';

export const getClientes = async () => {
  const { data, error } = await supabase.from('clients').select('*').order('business_name');
  if (error) throw error;
  return data;
};

// RECIBIR orgId COMO PARÁMETRO
export const crearCliente = async (cliente, orgId) => {
  const { data, error } = await supabase
    .from('clients')
    .insert([{
      organization_id: orgId, // Usar parámetro
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
       stockVisual = '∞'; 
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

// RECIBIR orgId y userId COMO PARÁMETROS
export const registrarVenta = async (datosVenta, orgId, userId) => {
  // Eliminamos las llamadas await getCurrentOrgId();
  
  // 1. Crear Cabecera
  const { data: orden, error: errOrden } = await supabase
    .from('sales_orders')
    .insert([{
      organization_id: orgId, // Usar parámetro
      client_id: datosVenta.cliente_id,
      seller_id: userId,      // Usar parámetro
      order_date: new Date(),
      status: 'completed',
      total_amount: datosVenta.total,
      payment_method: 'efectivo' 
    }])
    .select().single();

  if (errOrden) throw errOrden;

  // 2. Crear Detalle
  const items = datosVenta.carrito.map(item => {
    const baseItem = {
      organization_id: orgId, // Usar parámetro
      sales_order_id: orden.id,
      quantity: parseInt(item.cantidad),
      unit_price: parseFloat(item.precio_venta)
    };
    if (item.tipo === 'PRODUCTO') {
      return { ...baseItem, product_id: item.id, green_inventory_id: null };
    } else {
      return { ...baseItem, product_id: null, green_inventory_id: item.id };
    }
  });

  const { error: errItems } = await supabase.from('sales_order_items').insert(items);
  if (errItems) throw errItems;
  return true;
};