import { supabase } from './supabaseClient';
import type {
  LabReport,
  LabReportComplete,
  PhysicalAnalysis,
  CuppingAnalysis,
  CuppingDefect,
  BatchQualityHistory,
  ExternalClient,
  LabReportFilters,
} from '../types/laboratorio';
import type {
  LabReportFormData,
  PhysicalAnalysisFormData,
  CuppingAnalysisFormData,
  CuppingDefectFormData,
} from '../utils/validationSchemas';

// ============================================
// TIPOS AUXILIARES
// ============================================

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

// ============================================
// FUNCIONES EXISTENTES (MANTENIDAS)
// ============================================

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

/**
 * @deprecated Use createInternalReport + createPhysicalAnalysis + createCuppingAnalysis instead
 */
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

// ============================================
// FUNCIONES NUEVAS: LAB REPORTS
// ============================================

/**
 * Crear un reporte de laboratorio para muestra interna (del inventario)
 */
export const createInternalReport = async (
  formData: LabReportFormData,
  orgId: string
): Promise<string> => {
  if (formData.sample_type !== 'internal' || !formData.batch_id) {
    throw new Error('Debe especificar un batch_id para muestras internas');
  }

  const { data, error } = await supabase
    .from('lab_reports')
    .insert([{
      organization_id: orgId,
      report_date: formData.report_date,
      analyst_name: formData.analyst_name,
      sample_type: 'internal',
      batch_id: formData.batch_id,
      report_type: formData.report_type,
      status: 'draft',
    }])
    .select('id')
    .single();

  if (error) throw error;
  if (!data) throw new Error('No se pudo crear el reporte');

  return data.id;
};

/**
 * Crear un reporte de laboratorio para muestra externa (cliente externo)
 */
export const createExternalReport = async (
  formData: LabReportFormData,
  orgId: string
): Promise<string> => {
  if (formData.sample_type !== 'external' || !formData.external_client_name || !formData.external_sample_id) {
    throw new Error('Debe especificar cliente y ID de muestra para muestras externas');
  }

  const { data, error } = await supabase
    .from('lab_reports')
    .insert([{
      organization_id: orgId,
      report_date: formData.report_date,
      analyst_name: formData.analyst_name,
      sample_type: 'external',
      external_client_name: formData.external_client_name,
      external_sample_id: formData.external_sample_id,
      external_origin: formData.external_origin || null,
      external_variety: formData.external_variety || null,
      external_process: formData.external_process || null,
      external_notes: formData.external_notes || null,
      report_type: formData.report_type,
      status: 'draft',
    }])
    .select('id')
    .single();

  if (error) throw error;
  if (!data) throw new Error('No se pudo crear el reporte');

  return data.id;
};

/**
 * Agregar análisis físico a un reporte existente
 */
export const createPhysicalAnalysis = async (
  reportId: string,
  formData: PhysicalAnalysisFormData
): Promise<void> => {
  // Calcular factor de rendimiento si tenemos ambos pesos
  let yieldFactor: number | null = null;
  if (formData.green_weight_grams && formData.sample_weight_grams) {
    yieldFactor = Number(formData.green_weight_grams) / Number(formData.sample_weight_grams);
  }

  const { error } = await supabase
    .from('lab_reports_physical')
    .insert([{
      lab_report_id: reportId,
      sample_weight_grams: Number(formData.sample_weight_grams),
      green_weight_grams: formData.green_weight_grams ? Number(formData.green_weight_grams) : null,
      humidity_percentage: Number(formData.humidity_percentage),
      density_value: formData.density_value ? Number(formData.density_value) : null,
      mesh_18: Number(formData.mesh_18) || 0,
      mesh_16: Number(formData.mesh_16) || 0,
      mesh_14: Number(formData.mesh_14) || 0,
      base_mesh: Number(formData.base_mesh) || 0,
      category_1_defects: Number(formData.category_1_defects) || 0,
      category_2_defects: Number(formData.category_2_defects) || 0,
      defects_notes: formData.defects_notes || null,
      yield_factor: yieldFactor,
      color_notes: formData.color_notes || null,
      aroma_notes: formData.aroma_notes || null,
    }]);

  if (error) throw error;

  // Actualizar report_type si es necesario
  await updateReportTypeIfComplete(reportId);
};

/**
 * Agregar análisis de catación a un reporte existente
 */
export const createCuppingAnalysis = async (
  reportId: string,
  formData: CuppingAnalysisFormData
): Promise<string> => {
  const { data, error } = await supabase
    .from('lab_reports_cupping')
    .insert([{
      lab_report_id: reportId,
      coffee_grams: Number(formData.coffee_grams),
      water_ml: Number(formData.water_ml),
      water_temp_celsius: Number(formData.water_temp_celsius),
      cups_evaluated: Number(formData.cups_evaluated),
      fragrance_aroma: Number(formData.fragrance_aroma),
      flavor: Number(formData.flavor),
      aftertaste: Number(formData.aftertaste),
      acidity: Number(formData.acidity),
      body: Number(formData.body),
      balance: Number(formData.balance),
      overall: Number(formData.overall),
      uniformity: Number(formData.uniformity) || 0,
      clean_cup: Number(formData.clean_cup) || 0,
      sweetness: Number(formData.sweetness) || 0,
      flavor_descriptors: formData.flavor_descriptors || [],
      cupper_notes: formData.cupper_notes || null,
    }])
    .select('id')
    .single();

  if (error) throw error;
  if (!data) throw new Error('No se pudo crear el análisis de catación');

  // Actualizar report_type si es necesario
  await updateReportTypeIfComplete(reportId);

  return data.id;
};

/**
 * Agregar defecto de catación
 */
export const addCuppingDefect = async (
  cuppingReportId: string,
  formData: CuppingDefectFormData
): Promise<void> => {
  const { error } = await supabase
    .from('cupping_defects')
    .insert([{
      cupping_report_id: cuppingReportId,
      cup_number: Number(formData.cup_number),
      defect_type: formData.defect_type,
      defect_intensity: formData.defect_intensity,
      description: formData.description || null,
    }]);

  if (error) throw error;
};

/**
 * Eliminar defecto de catación
 */
export const removeCuppingDefect = async (defectId: string): Promise<void> => {
  const { error } = await supabase
    .from('cupping_defects')
    .delete()
    .eq('id', defectId);

  if (error) throw error;
};

// ============================================
// FUNCIONES DE CONSULTA
// ============================================

/**
 * Obtener reporte completo por ID
 */
export const getReportById = async (reportId: string): Promise<LabReportComplete | null> => {
  const { data, error } = await supabase
    .from('v_lab_reports_complete')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw error;
  }

  return data as LabReportComplete;
};

/**
 * Obtener todos los reportes con filtros opcionales
 */
export const getReports = async (filters?: LabReportFilters): Promise<LabReportComplete[]> => {
  let query = supabase
    .from('v_lab_reports_complete')
    .select('*')
    .order('report_date', { ascending: false });

  if (filters) {
    if (filters.sample_type) query = query.eq('sample_type', filters.sample_type);
    if (filters.report_type) query = query.eq('report_type', filters.report_type);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.start_date) query = query.gte('report_date', filters.start_date);
    if (filters.end_date) query = query.lte('report_date', filters.end_date);
    if (filters.batch_id) query = query.eq('batch_id', filters.batch_id);
    if (filters.external_client_name) query = query.ilike('external_client_name', `%${filters.external_client_name}%`);
    if (filters.min_score !== undefined) query = query.gte('final_score', filters.min_score);
    if (filters.max_score !== undefined) query = query.lte('final_score', filters.max_score);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data || []) as LabReportComplete[];
};

/**
 * Obtener reportes por lote (solo muestras internas)
 */
export const getReportsByBatch = async (batchId: string): Promise<LabReportComplete[]> => {
  return await getReports({ batch_id: batchId });
};

/**
 * Obtener reportes por cliente externo
 */
export const getReportsByClient = async (clientName: string): Promise<LabReportComplete[]> => {
  return await getReports({
    sample_type: 'external',
    external_client_name: clientName
  });
};

/**
 * Obtener lista de clientes externos únicos con estadísticas
 */
export const getExternalClients = async (): Promise<ExternalClient[]> => {
  const { data, error } = await supabase
    .rpc('get_external_clients_stats');

  if (error) {
    // Si la función no existe, hacer consulta manual
    const { data: reports, error: err2 } = await supabase
      .from('v_lab_reports_complete')
      .select('external_client_name, final_score, report_date')
      .eq('sample_type', 'external')
      .not('external_client_name', 'is', null);

    if (err2) throw err2;

    // Agrupar manualmente
    const clientMap = new Map<string, ExternalClient>();
    reports?.forEach((r: any) => {
      if (!clientMap.has(r.external_client_name)) {
        clientMap.set(r.external_client_name, {
          client_name: r.external_client_name,
          total_samples: 0,
          avg_score: null,
          last_sample_date: r.report_date,
        });
      }
      const client = clientMap.get(r.external_client_name)!;
      client.total_samples++;
      if (r.report_date > client.last_sample_date) {
        client.last_sample_date = r.report_date;
      }
    });

    return Array.from(clientMap.values());
  }

  return data as ExternalClient[];
};

/**
 * Obtener historial de calidad de un lote
 */
export const getBatchQualityHistory = async (batchId: string): Promise<BatchQualityHistory[]> => {
  const { data, error } = await supabase
    .rpc('get_batch_quality_history', { p_batch_id: batchId });

  if (error) throw error;
  return (data || []) as BatchQualityHistory[];
};

/**
 * Obtener defectos de una catación
 */
export const getCuppingDefects = async (cuppingReportId: string): Promise<CuppingDefect[]> => {
  const { data, error } = await supabase
    .from('cupping_defects')
    .select('*')
    .eq('cupping_report_id', cuppingReportId)
    .order('cup_number');

  if (error) throw error;
  return (data || []) as CuppingDefect[];
};

// ============================================
// FUNCIONES DE ACTUALIZACIÓN
// ============================================

/**
 * Actualizar estado del reporte
 */
export const updateReportStatus = async (
  reportId: string,
  status: 'draft' | 'completed' | 'approved'
): Promise<void> => {
  const { error } = await supabase
    .from('lab_reports')
    .update({ status })
    .eq('id', reportId);

  if (error) throw error;
};

/**
 * Actualizar análisis físico
 */
export const updatePhysicalAnalysis = async (
  physicalId: string,
  formData: Partial<PhysicalAnalysisFormData>
): Promise<void> => {
  const updateData: any = {};

  if (formData.sample_weight_grams !== undefined) {
    updateData.sample_weight_grams = Number(formData.sample_weight_grams);
  }
  if (formData.green_weight_grams !== undefined) {
    updateData.green_weight_grams = formData.green_weight_grams ? Number(formData.green_weight_grams) : null;
  }
  if (formData.humidity_percentage !== undefined) {
    updateData.humidity_percentage = Number(formData.humidity_percentage);
  }
  if (formData.density_value !== undefined) {
    updateData.density_value = formData.density_value ? Number(formData.density_value) : null;
  }
  if (formData.mesh_18 !== undefined) updateData.mesh_18 = Number(formData.mesh_18) || 0;
  if (formData.mesh_16 !== undefined) updateData.mesh_16 = Number(formData.mesh_16) || 0;
  if (formData.mesh_14 !== undefined) updateData.mesh_14 = Number(formData.mesh_14) || 0;
  if (formData.base_mesh !== undefined) updateData.base_mesh = Number(formData.base_mesh) || 0;
  if (formData.category_1_defects !== undefined) {
    updateData.category_1_defects = Number(formData.category_1_defects) || 0;
  }
  if (formData.category_2_defects !== undefined) {
    updateData.category_2_defects = Number(formData.category_2_defects) || 0;
  }
  if (formData.defects_notes !== undefined) updateData.defects_notes = formData.defects_notes || null;
  if (formData.color_notes !== undefined) updateData.color_notes = formData.color_notes || null;
  if (formData.aroma_notes !== undefined) updateData.aroma_notes = formData.aroma_notes || null;

  // Recalcular yield_factor si se actualizan los pesos
  if (updateData.sample_weight_grams && updateData.green_weight_grams) {
    updateData.yield_factor = updateData.green_weight_grams / updateData.sample_weight_grams;
  }

  const { error } = await supabase
    .from('lab_reports_physical')
    .update(updateData)
    .eq('id', physicalId);

  if (error) throw error;
};

/**
 * Actualizar análisis de catación
 */
export const updateCuppingAnalysis = async (
  cuppingId: string,
  formData: Partial<CuppingAnalysisFormData>
): Promise<void> => {
  const updateData: any = {};

  // Preparación
  if (formData.coffee_grams !== undefined) updateData.coffee_grams = Number(formData.coffee_grams);
  if (formData.water_ml !== undefined) updateData.water_ml = Number(formData.water_ml);
  if (formData.water_temp_celsius !== undefined) updateData.water_temp_celsius = Number(formData.water_temp_celsius);
  if (formData.cups_evaluated !== undefined) updateData.cups_evaluated = Number(formData.cups_evaluated);

  // Atributos puntuables
  if (formData.fragrance_aroma !== undefined) updateData.fragrance_aroma = Number(formData.fragrance_aroma);
  if (formData.flavor !== undefined) updateData.flavor = Number(formData.flavor);
  if (formData.aftertaste !== undefined) updateData.aftertaste = Number(formData.aftertaste);
  if (formData.acidity !== undefined) updateData.acidity = Number(formData.acidity);
  if (formData.body !== undefined) updateData.body = Number(formData.body);
  if (formData.balance !== undefined) updateData.balance = Number(formData.balance);
  if (formData.overall !== undefined) updateData.overall = Number(formData.overall);

  // Atributos de presencia
  if (formData.uniformity !== undefined) updateData.uniformity = Number(formData.uniformity) || 0;
  if (formData.clean_cup !== undefined) updateData.clean_cup = Number(formData.clean_cup) || 0;
  if (formData.sweetness !== undefined) updateData.sweetness = Number(formData.sweetness) || 0;

  // Notas
  if (formData.flavor_descriptors !== undefined) updateData.flavor_descriptors = formData.flavor_descriptors || [];
  if (formData.cupper_notes !== undefined) updateData.cupper_notes = formData.cupper_notes || null;

  const { error } = await supabase
    .from('lab_reports_cupping')
    .update(updateData)
    .eq('id', cuppingId);

  if (error) throw error;
};

/**
 * Eliminar reporte completo (cascade)
 */
export const deleteReport = async (reportId: string): Promise<void> => {
  const { error } = await supabase
    .from('lab_reports')
    .delete()
    .eq('id', reportId);

  if (error) throw error;
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Actualizar report_type si el reporte tiene ambos análisis
 */
const updateReportTypeIfComplete = async (reportId: string): Promise<void> => {
  const { data: report, error: err1 } = await supabase
    .from('lab_reports')
    .select('report_type')
    .eq('id', reportId)
    .single();

  if (err1 || !report) return;

  // Verificar si tiene análisis físico
  const { data: physical } = await supabase
    .from('lab_reports_physical')
    .select('id')
    .eq('lab_report_id', reportId)
    .single();

  // Verificar si tiene catación
  const { data: cupping } = await supabase
    .from('lab_reports_cupping')
    .select('id')
    .eq('lab_report_id', reportId)
    .single();

  let newType: 'physical' | 'cupping' | 'complete' = 'physical';

  if (physical && cupping) {
    newType = 'complete';
  } else if (cupping) {
    newType = 'cupping';
  } else if (physical) {
    newType = 'physical';
  }

  if (newType !== report.report_type) {
    await supabase
      .from('lab_reports')
      .update({ report_type: newType })
      .eq('id', reportId);
  }
};

/**
 * Calcular puntuación de catación manual (para testing)
 */
export const calculateCuppingScore = (
  attributes: {
    fragrance_aroma: number;
    flavor: number;
    aftertaste: number;
    acidity: number;
    body: number;
    balance: number;
    overall: number;
    uniformity: number;
    clean_cup: number;
    sweetness: number;
  },
  defects: number = 0
): number => {
  const total =
    attributes.fragrance_aroma +
    attributes.flavor +
    attributes.aftertaste +
    attributes.acidity +
    attributes.body +
    attributes.balance +
    attributes.overall +
    attributes.uniformity +
    attributes.clean_cup +
    attributes.sweetness;

  return total - defects;
};

/**
 * Calcular factor de rendimiento
 */
export const calculateYieldFactor = (
  greenWeight: number,
  sampleWeight: number
): number => {
  if (sampleWeight === 0) return 0;
  return greenWeight / sampleWeight;
};