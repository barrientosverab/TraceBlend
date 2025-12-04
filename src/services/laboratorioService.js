import { supabase } from './supabaseClient';

// GET: Lotes Disponibles (Sin cambios)
export const getLotesParaAnalisis = async () => {
  const { data, error } = await supabase
    .from('raw_inventory_batches')
    .select(`
      id,
      code_ref,
      current_quantity, 
      current_state,
      variety,
      process,
      farms ( name )
    `)
    .gt('current_quantity', 0)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(d => ({
    id: d.id,
    codigo_lote: d.code_ref,
    stock_actual: d.current_quantity, // Dato útil para validar
    estado_ingreso: d.current_state,
    variedad: d.variety,
    proceso: d.process,
    nombre_finca: d.farms?.name || 'Desconocido'
  }));
};

// POST: Guardar Análisis y Descontar Muestra
export const guardarAnalisis = async (loteId, datos, orgId) => {
  
  // 1. DESCONTAR LA MUESTRA DEL INVENTARIO FÍSICO
  // Convertimos gramos a Kilos (ej: 300g = 0.3kg)
  const pesoMuestraKg = parseFloat(datos.peso_muestra) / 1000;

  // Consultamos stock actual para asegurar consistencia
  const { data: lote, error: errLote } = await supabase
    .from('raw_inventory_batches')
    .select('current_quantity')
    .eq('id', loteId)
    .single();

  if (errLote) throw new Error("No se pudo leer el lote para descontar la muestra.");

  if (lote.current_quantity < pesoMuestraKg) {
    throw new Error(`Error: No hay suficiente stock para tomar una muestra de ${datos.peso_muestra}g.`);
  }

  // Actualizamos el inventario
  const nuevoSaldo = lote.current_quantity - pesoMuestraKg;
  
  const { error: errUpdate } = await supabase
    .from('raw_inventory_batches')
    .update({ current_quantity: nuevoSaldo })
    .eq('id', loteId);

  if (errUpdate) throw new Error("Error al descontar la muestra del inventario.");

  // 2. GUARDAR EL REPORTE (Esto queda igual)
  const { error } = await supabase
    .from('lab_reports')
    .insert([{
      organization_id: orgId,
      batch_id: loteId,
      analysis_date: new Date(),
      
      // Datos Físicos
      sample_total_grams: parseFloat(datos.peso_muestra),
      green_quantity: parseFloat(datos.peso_oro),
      humidity_percentage: parseFloat(datos.humedad),
      density: parseFloat(datos.densidad),

      // Granulometría
      mesh_18: parseFloat(datos.malla_18) || 0,
      mesh_16: parseFloat(datos.malla_16) || 0,
      mesh_14: parseFloat(datos.malla_14) || 0,
      base: parseFloat(datos.base) || 0,
      defects: parseFloat(datos.defectos) || 0,

      // Cata
      cupping_score: parseFloat(datos.puntaje_cata),
      sensory_notes: datos.notas_cata
    }]);

  if (error) {
    // OJO: Si falla el reporte, deberíamos "devolver" el inventario (Rollback manual)
    // Para simplificar ahora, lanzamos el error, pero en sistemas críticos usaríamos RPC.
    throw error;
  }
  
  return true;
};