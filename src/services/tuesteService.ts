import { supabase } from './supabaseClient';
import { Json } from '../types/supabase';

// =============================================
// INTERFACES
// =============================================

export interface DatosTueste {
  machine_id: string;
  operador?: string;
  peso_entrada: string | number;
  peso_salida: string | number;
  curva_datos: any;
  tiempo_total: number;
  temp_final: number;

  // Condiciones ambientales (existentes)
  ambient_temp?: string | number;
  relative_humidity?: string | number;
  initial_bean_temp?: string | number;
  initial_bean_humidity?: string | number;
  ambient_pressure_hpa?: string | number;

  // Variables agronómicas del grano (NUEVAS — dataset IA)
  altitude_masl?: number | null;
  apparent_density?: number | null;       // g/L
  bean_humidity_pct?: number | null;      // %
  water_activity?: number | null;         // Aw 0–1
  variety?: string | null;
  process_method?: string | null;

  // Métricas de la curva (NUEVAS — dataset IA)
  first_crack_time?: number | null;       // segundos
  first_crack_temp?: number | null;       // °C
  development_time_pct?: number | null;   // %
  ror_peak?: number | null;               // °C/min
  ror_at_drop?: number | null;            // °C/min
  roast_level?: string | null;
  roast_color_agtron?: number | null;

  // Notas y cata
  batch_notes?: string | null;
  cupping_notes?: CuppingNotes | null;
}

export interface CuppingNotes {
  // Atributos SCA (6.0–10.0)
  fragrance: number;
  aroma: number;
  flavor: number;
  aftertaste: number;
  acidity: number;
  acidity_intensity: 'alta' | 'media' | 'baja';
  body: number;
  body_level: 'pleno' | 'cremoso' | 'ligero';
  balance: number;
  uniformity: number;
  clean_cup: number;
  sweetness: number;
  overall: number;
  defects: number;
  total_score: number;

  flavor_descriptors: string[];
  aroma_descriptors: string[];
  cata_date: string;
  cupper_name: string;
}

export interface ConsumoVerde {
  id: string;
  peso_usado: string | number;
}

export interface InventarioOroItem {
  id: string;
  nombre: string;
  origen: string;
  variedad: string;
  proceso: string;
  densidad: string | number;
  stock: number;
}

// =============================================
// GET: Inventario de Oro Verde
// =============================================
export const getInventarioOro = async (): Promise<InventarioOroItem[]> => {
  const { data, error } = await (supabase as any)
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

  return (data || []).map((item: any) => {
    const inputs = item.milling_processes?.milling_inputs || [];
    const loteOriginal = inputs[0]?.raw_inventory_batches;
    const densidad = loteOriginal?.lab_reports?.[0]?.density || 'N/D';

    return {
      id: item.id,
      nombre: `${item.name_ref} (${item.screen_size})`,
      origen: loteOriginal?.farms?.name || 'Blend',
      variedad: loteOriginal?.variety || 'Varios',
      proceso: loteOriginal?.process || 'Varios',
      densidad: densidad,
      stock: item.quantity_kg
    };
  });
};

// =============================================
// POST: Guardar Batch con todos los campos IA
// =============================================
export const guardarTueste = async (
  datosTueste: DatosTueste,
  consumoVerde: ConsumoVerde[],
  orgId: string,
  _userId: string
) => {
  const { data: batch, error: errBatch } = await supabase
    .from('roast_batches')
    .insert([{
      organization_id: orgId,
      machine_id: datosTueste.machine_id,
      roast_date: new Date().toISOString(),
      operator_name: datosTueste.operador || 'Staff',

      // Pesos
      green_weight_input: Number(datosTueste.peso_entrada),
      roasted_weight_output: Number(datosTueste.peso_salida),

      // Curva
      roast_log_data: datosTueste.curva_datos as Json,
      total_time_seconds: datosTueste.tiempo_total,
      drop_temp: Number(datosTueste.temp_final),

      // Condiciones ambientales (existentes)
      ambient_temp: Number(datosTueste.ambient_temp) || 0,
      relative_humidity: Number(datosTueste.relative_humidity) || 0,
      initial_bean_temp: Number(datosTueste.initial_bean_temp) || 0,
      initial_bean_humidity: Number(datosTueste.initial_bean_humidity) || 0,
      ambient_pressure_hpa: datosTueste.ambient_pressure_hpa
        ? Number(datosTueste.ambient_pressure_hpa)
        : null,

      // Variables agronómicas (Dataset IA)
      altitude_masl: datosTueste.altitude_masl ?? null,
      apparent_density: datosTueste.apparent_density ?? null,
      bean_humidity_pct: datosTueste.bean_humidity_pct ?? null,
      water_activity: datosTueste.water_activity ?? null,
      variety: datosTueste.variety || null,
      process_method: datosTueste.process_method || null,

      // Métricas de curva (Dataset IA)
      first_crack_time: datosTueste.first_crack_time ?? null,
      first_crack_temp: datosTueste.first_crack_temp ?? null,
      development_time_pct: datosTueste.development_time_pct ?? null,
      ror_peak: datosTueste.ror_peak ?? null,
      ror_at_drop: datosTueste.ror_at_drop ?? null,
      roast_level: datosTueste.roast_level || null,
      roast_color_agtron: datosTueste.roast_color_agtron ?? null,

      // Notas
      batch_notes: datosTueste.batch_notes || null,
      cupping_notes: datosTueste.cupping_notes
        ? (datosTueste.cupping_notes as unknown as Json)
        : null,
    }])
    .select()
    .single();

  if (errBatch) throw errBatch;
  if (!batch) throw new Error('No se pudo crear el batch.');

  // Registrar consumo de verde
  const inputs = consumoVerde.map(item => ({
    organization_id: orgId,
    roast_batch_id: batch.id,
    green_inventory_id: item.id,
    quantity_used_kg: Number(item.peso_usado)
  }));

  const { error: errInputs } = await supabase
    .from('roast_batch_inputs')
    .insert(inputs);

  if (errInputs) throw errInputs;

  return batch;
};

// =============================================
// PATCH: Guardar notas de cata en un batch existente
// =============================================
export const guardarNotasCata = async (
  batchId: string,
  cuppingNotes: CuppingNotes,
  roastLevel?: string,
  agtron?: number,
  batchNotes?: string
) => {
  const { data, error } = await supabase
    .from('roast_batches')
    .update({
      cupping_notes: cuppingNotes as unknown as Json,
      roast_level: roastLevel || null,
      roast_color_agtron: agtron ?? null,
      batch_notes: batchNotes || null,
    })
    .eq('id', batchId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// =============================================
// GET: Historial de Tuestes
// =============================================
export const getHistorialTuestes = async (orgId: string) => {
  const { data, error } = await (supabase as any)
    .from('roast_batches')
    .select(`
      id,
      roast_date,
      total_time_seconds,
      drop_temp,
      roasted_weight_output,
      roast_log_data,
      roast_level,
      variety,
      process_method,
      altitude_masl,
      cupping_notes,
      machines ( name ),
      roast_batch_inputs (
        green_coffee_warehouse ( name_ref )
      )
    `)
    .eq('organization_id', orgId)
    .order('roast_date', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
};