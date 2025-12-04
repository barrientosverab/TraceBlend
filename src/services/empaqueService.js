import { supabase } from './supabaseClient';

// --- GESTIÓN DE PRODUCTOS (SKUs) ---

export const getProductos = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data;
};
export const getLotesVerdesParaVenta = async () => {
  const { data, error } = await supabase
    .from('green_coffee_warehouse')
    .select('id, name_ref, quantity_kg')
    .eq('is_available', true)
    .gt('quantity_kg', 0);
  
  if (error) throw error;
  return data;
};
export const crearProducto = async (producto, orgId) => {
  
  const { data, error } = await supabase
    .from('products')
    .insert([{
      organization_id: orgId,
      name: producto.nombre,
      sku: producto.sku,
      package_weight_grams: parseFloat(producto.peso_gramos),
      sale_price: parseFloat(producto.precio),
      
      // NUEVOS CAMPOS LÓGICOS
      is_roasted: producto.tipo === 'tostado', // true/false
      source_green_inventory_id: producto.tipo === 'verde' ? producto.green_id : null,
      
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --- OPERACIÓN DE EMPAQUE ---

// Obtener lotes tostados recientes y calcular cuánto les queda por empacar
export const getBatchesDisponibles = async () => {
  // 1. Traemos los lotes con un Deep Join para llegar a la variedad
  const { data: batches, error } = await supabase
    .from('roast_batches')
    .select(`
      id, 
      roast_date, 
      roasted_weight_output, 
      machine_id,
      roast_batch_inputs (
        green_coffee_warehouse (
          name_ref,
          milling_processes (
            milling_inputs (
              raw_inventory_batches (
                variety,
                process,
                farms ( name )
              )
            )
          )
        )
      )
    `)
    .order('roast_date', { ascending: false })
    .limit(50);

  if (error) throw error;

  // 2. Traemos lo ya empacado (igual que antes)
  const batchIds = batches.map(b => b.id);
  const { data: empacado } = await supabase
    .from('packaging_logs')
    .select('roast_batch_id, product_id, units_created, products(package_weight_grams)')
    .in('roast_batch_id', batchIds);

  // 3. Procesamos la data para que sea fácil de leer en el frontend
  return batches.map(batch => {
    // Calculamos saldo (igual que antes)
    const logsDelBatch = empacado.filter(log => log.roast_batch_id === batch.id);
    const pesoGastadoKg = logsDelBatch.reduce((acc, log) => {
      const pesoBolsaKg = (log.products?.package_weight_grams || 0) / 1000;
      return acc + (log.units_created * pesoBolsaKg);
    }, 0);
    const saldo = batch.roasted_weight_output - pesoGastadoKg;

    // --- MAGIA: Extraer datos del grano original ---
    // Navegamos por el objeto anidado (puede ser array si hubo blend, tomamos el principal)
    const inputPrincipal = batch.roast_batch_inputs[0];
    const bodega = inputPrincipal?.green_coffee_warehouse;
    const loteOriginal = bodega?.milling_processes?.milling_inputs[0]?.raw_inventory_batches;

    return {
      id: batch.id,
      fecha: batch.roast_date,
      // Datos visuales clave
      origen_nombre: loteOriginal?.farms?.name || 'Origen Desconocido',
      variedad: loteOriginal?.variety || 'Blend / Varios', // <--- NUEVO
      proceso: loteOriginal?.process || 'N/D',             // <--- NUEVO
      peso_inicial: batch.roasted_weight_output,
      peso_disponible: saldo < 0 ? 0 : saldo
    };
  }).filter(b => b.peso_disponible > 0.1); 
};

export const registrarEmpaque = async (datos, orgId, userId) => {

  const { error } = await supabase
    .from('packaging_logs')
    .insert([{
      organization_id: orgId,
      roast_batch_id: datos.batch_id,
      product_id: datos.product_id,
      units_created: parseInt(datos.cantidad),
      operator_id: userId,
      packaging_date: new Date()
    }]);

  if (error) throw error;
  
  // El Trigger 'increase_finished_inventory' actualizará el stock de producto terminado automáticamente
  return true;
};