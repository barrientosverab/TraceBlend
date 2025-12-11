import { supabase } from './supabaseClient';

export interface LoteAnalisis {
  id: string;
  codigo_lote: string;
  stock_actual: number;
  estado_ingreso: string;
  variedad: string | null;
  proceso: string | null;
  nombre_finca: string;
}

export interface AnalisisForm {
  peso_muestra: string | number;
  peso_oro: string | number;
  humedad: string | number;
  densidad: string | number;
  malla_18: string | number;
  malla_16: string | number;
  malla_14: string | number;
  base: string | number;
  defectos: string | number;
  puntaje_cata: string | number;
  notas_cata: string;
}

export const getLotesParaAnalisis = async (): Promise<LoteAnalisis[]> => {
  const { data, error } = await supabase
    .from('raw_inventory_batches')
    .select(`
      id, code_ref, current_quantity, current_state, variety, process,
      farms ( name )
    `)
    .gt('current_quantity', 0)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((d: any) => ({
    id: d.id,
    codigo_lote: d.code_ref,
    stock_actual: d.current_quantity,
    estado_ingreso: d.current_state,
    variedad: d.variety,
    proceso: d.process,
    nombre_finca: d.farms?.name || 'Desconocido'
  }));
};

export const guardarAnalisis = async (loteId: string, datos: AnalisisForm, orgId: string) => {
  const pesoMuestraKg = Number(datos.peso_muestra) / 1000;

  // 1. Validar Stock
  const { data: lote, error: errLote } = await supabase
    .from('raw_inventory_batches')
    .select('current_quantity')
    .eq('id', loteId)
    .single();

  if (errLote || !lote) throw new Error("No se pudo leer el lote.");
  if (lote.current_quantity < pesoMuestraKg) {
    throw new Error(`Stock insuficiente para muestra.`);
  }

  // 2. Actualizar Stock
  const { error: errUpdate } = await supabase
    .from('raw_inventory_batches')
    .update({ current_quantity: lote.current_quantity - pesoMuestraKg })
    .eq('id', loteId);

  if (errUpdate) throw errUpdate;

  // 3. Guardar Reporte
  const { error } = await supabase
    .from('lab_reports')
    .insert([{
      organization_id: orgId,
      batch_id: loteId,
      analysis_date: new Date().toISOString(),
      sample_total_grams: Number(datos.peso_muestra),
      green_quantity: Number(datos.peso_oro),
      humidity_percentage: Number(datos.humedad),
      density: Number(datos.densidad),
      mesh_18: Number(datos.malla_18) || 0,
      mesh_16: Number(datos.malla_16) || 0,
      mesh_14: Number(datos.malla_14) || 0,
      base: Number(datos.base) || 0,
      defects: Number(datos.defectos) || 0,
      cupping_score: Number(datos.puntaje_cata),
      sensory_notes: datos.notas_cata
    }]);

  if (error) throw error;
  return true;
};