import { supabase } from './supabaseClient';

export const getLotesParaProyeccion = async (orgId) => {
  const { data, error } = await supabase
    .from('raw_inventory_batches')
    .select(`
      id,
      code_ref,
      current_quantity,
      total_cost_local,
      variety,
      observations, 
      farms ( name ),
      lab_reports ( 
        sample_total_grams, 
        green_quantity 
      )
    `)
    .eq('organization_id', orgId)
    .gt('current_quantity', 0)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map(d => {
    // Calculamos el rendimiento real si existe reporte
    let rendimientoReal = null;
    const reporte = d.lab_reports?.[0]; // Tomamos el primer reporte (el más reciente)
    
    if (reporte && reporte.sample_total_grams > 0) {
      rendimientoReal = (reporte.green_quantity / reporte.sample_total_grams) * 100;
    }

    return {
      id: d.id,
      codigo: d.code_ref,
      origen: d.farms?.name || 'Desconocido',
      variedad: d.variety,
      notas: d.observations || '', // <--- Mapeamos la descripción
      stock_actual: d.current_quantity,
      costo_total: d.total_cost_local || 0,
      rendimiento_lab: rendimientoReal // <--- Dato clave para la proyección
    };
  });
};