import { supabase } from './supabaseClient';
import { getCurrentOrgId, getCurrentUserId } from './authService';

// --- CLIENTES (CRM) ---

export const getClientes = async () => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('business_name');
  if (error) throw error;
  return data;
};

export const crearCliente = async (cliente) => {
  const orgId = await getCurrentOrgId();
  const { data, error } = await supabase
    .from('clients')
    .insert([{
      organization_id: orgId,
      business_name: cliente.razon_social,
      tax_id: cliente.nit,
      email: cliente.email,
      phone: cliente.telefono,
      client_type: 'retail' // Default
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

// --- CATÁLOGO UNIFICADO (Bolsas + Oro Verde) ---

export const getCatalogoVentas = async () => {
  // Ahora solo traemos PRODUCTOS (ya sean tostados o verdes)
  // El trigger de base de datos se encarga de saber de dónde restar
  const { data: productos, error } = await supabase
    .from('products')
    .select('id, name, sku, sale_price, package_weight_grams, is_roasted, finished_inventory(current_stock), source_green_inventory_id')
    .eq('is_active', true);

  if (error) throw error;

  return productos.map(p => {
    // Calculamos stock visual
    // Si es tostado, viene de finished_inventory.
    // Si es verde, tendríamos que consultar el lote verde (Opcional: hacer un join extra si quieres ver stock en tiempo real aquí)
    // Por simplicidad ahora, mostramos stock si es tostado.
    
    let stockVisual = 0;
    if (p.is_roasted) {
       stockVisual = p.finished_inventory?.reduce((acc, i) => acc + i.current_stock, 0) || 0;
    } else {
       // Para verde, idealmente mostraríamos "Stock en Lote", pero requiere otra query.
       // Dejémoslo como "A Granel" visualmente.
       stockVisual = '∞'; 
    }

    return {
      id: p.id,
      tipo: 'PRODUCTO', // Todo es producto ahora
      nombre: p.name,
      detalle: p.is_roasted ? `SKU: ${p.sku}` : `GRANEL - ${p.package_weight_grams/1000}Kg`,
      precio: p.sale_price,
      stock: stockVisual,
      unidad: p.is_roasted ? 'und' : 'unid' // Vendemos "unidades" de X kilos
    };
  });
};

// --- CREACIÓN DE LA VENTA (La Transacción Compleja) ---

export const registrarVenta = async (datosVenta) => {
  const orgId = await getCurrentOrgId();
  const userId = await getCurrentUserId();

  // 1. Crear Cabecera (La Factura)
  const { data: orden, error: errOrden } = await supabase
    .from('sales_orders')
    .insert([{
      organization_id: orgId,
      client_id: datosVenta.cliente_id,
      seller_id: userId,
      order_date: new Date(),
      status: 'completed', // O 'pending' si manejas caja
      total_amount: datosVenta.total,
      payment_method: 'efectivo' 
    }])
    .select()
    .single();

  if (errOrden) throw errOrden;

  // 2. Crear Detalle (Los Ítems)
  // Aquí usamos el polimorfismo que diseñamos en la BD
  const items = datosVenta.carrito.map(item => {
    const baseItem = {
      organization_id: orgId,
      sales_order_id: orden.id,
      quantity: parseInt(item.cantidad), // O float si es kilos
      unit_price: parseFloat(item.precio_venta)
    };

    // DECISIÓN CLAVE: ¿Llenamos product_id o green_inventory_id?
    if (item.tipo === 'PRODUCTO') {
      return { ...baseItem, product_id: item.id, green_inventory_id: null };
    } else {
      return { ...baseItem, product_id: null, green_inventory_id: item.id };
    }
  });

  const { error: errItems } = await supabase
    .from('sales_order_items')
    .insert(items);

  if (errItems) throw errItems;

  return true;
};