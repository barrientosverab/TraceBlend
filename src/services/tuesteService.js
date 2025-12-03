import { supabase } from './supabaseClient';
import { getCurrentOrgId, getCurrentUserId } from './authService';

// GET: Inventario de Oro Verde CON DETALLES TÉCNICOS
export const getInventarioOro = async () => {
  const { data, error } = await supabase
    .from('green_coffee_warehouse')
    .select(`
      id,
      name_ref,
      screen_size,
      quantity_kg,
      milling_processes (
        milling_inputs (
          raw_inventory_batches (
            code_ref,
            variety,
            process,
            farms ( name ),
            lab_reports ( density ) 
          )
        )
      )
    `)
    .gt('quantity_kg', 0)
    .eq('is_available', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Aplanamos y extraemos la info técnica
  return data.map(item => {
    const inputs = item.milling_processes?.milling_inputs || [];
    const loteOriginal = inputs[0]?.raw_inventory_batches; // Tomamos el primero como referencia
    
    // Extraemos densidad del reporte de laboratorio (si existe)
    const densidad = loteOriginal?.lab_reports?.[0]?.density || 'N/D';

    return {
      id: item.id,
      nombre: `${item.name_ref} (${item.screen_size})`,
      origen: loteOriginal?.farms?.name || 'Blend',
      
      // DATOS TÉCNICOS PARA EL TOSTADOR
      variedad: loteOriginal?.variety || 'Varios',
      proceso: loteOriginal?.process || 'Varios',
      densidad: densidad,
      
      stock: item.quantity_kg
    };
  });
};

// POST: Guardar Batch (Actualizado con nuevos campos)
export const guardarTueste = async (datosTueste, consumoVerde) => {
  const orgId = await getCurrentOrgId();
  const userId = await getCurrentUserId();

  // 1. Crear el Batch
  const { data: batch, error: errBatch } = await supabase
    .from('roast_batches')
    .insert([{
      organization_id: orgId,
      machine_id: datosTueste.machine_id,
      roast_date: new Date(),
      operator_name: datosTueste.operador || 'Admin', 
      
      green_weight_input: parseFloat(datosTueste.peso_entrada),
      roasted_weight_output: parseFloat(datosTueste.peso_salida),
      
      roast_log_data: datosTueste.curva_datos, 
      
      total_time_seconds: datosTueste.tiempo_total,
      drop_temp: parseFloat(datosTueste.temp_final),

      // NUEVOS CAMPOS AMBIENTALES
      ambient_temp: parseFloat(datosTueste.ambient_temp),
      relative_humidity: parseFloat(datosTueste.relative_humidity),
      initial_bean_temp: parseFloat(datosTueste.initial_bean_temp),
      initial_bean_humidity: parseFloat(datosTueste.initial_bean_humidity)
    }])
    .select()
    .single();

  if (errBatch) throw errBatch;

  // 2. Registrar consumo
  const inputs = consumoVerde.map(item => ({
    organization_id: orgId,
    roast_batch_id: batch.id,
    green_inventory_id: item.id,
    quantity_used_kg: parseFloat(item.peso_usado)
  }));

  const { error: errInputs } = await supabase
    .from('roast_batch_inputs')
    .insert(inputs);

  if (errInputs) throw errInputs;

  return batch;
};