import { supabase } from './supabaseClient';

export interface LoteProyeccion {
  id: string;
  codigo: string;
  origen: string;
  variedad: string | null;
  notas: string;
  stock_actual: number;
  costo_total: number;
  rendimiento_lab: number | null;
}

export const getLotesParaProyeccion = async (orgId: string): Promise<LoteProyeccion[]> => {
  const { data, error } = await supabase
    .from('raw_inventory_batches')
    .select(`
      id, code_ref, current_quantity, total_cost_local, variety, observations, 
      farms ( name ),
      lab_reports ( sample_total_grams, green_quantity )
    `)
    .eq('organization_id', orgId)
    .gt('current_quantity', 0)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((d: any) => {
    // Calculamos rendimiento real si existe reporte de lab
    let rendimientoReal: number | null = null;
    const reporte = d.lab_reports?.[0];
    
    if (reporte && reporte.sample_total_grams > 0) {
      rendimientoReal = (reporte.green_quantity / reporte.sample_total_grams) * 100;
    }

    return {
      id: d.id,
      codigo: d.code_ref,
      origen: d.farms?.name || 'Desconocido',
      variedad: d.variety,
      notas: d.observations || '',
      stock_actual: d.current_quantity,
      costo_total: d.total_cost_local || 0,
      rendimiento_lab: rendimientoReal
    };
  });
};