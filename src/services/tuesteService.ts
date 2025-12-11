import { supabase } from './supabaseClient';
import { Json } from '../types/supabase';

// Interfaces para los datos de entrada
export interface DatosTueste {
  machine_id: string;
  operador?: string;
  peso_entrada: string | number;
  peso_salida: string | number;
  curva_datos: any; // Objeto JSON de Artisan
  tiempo_total: number;
  temp_final: number;
  ambient_temp?: string | number;
  relative_humidity?: string | number;
  initial_bean_temp?: string | number;
  initial_bean_humidity?: string | number;
}

export interface ConsumoVerde {
  id: string;
  peso_usado: string | number;
}

// Interfaz de Salida para UI
export interface InventarioOroItem {
  id: string;
  nombre: string;
  origen: string;
  variedad: string;
  proceso: string;
  densidad: string | number;
  stock: number;
}

// GET: Inventario de Oro Verde CON DETALLES TÉCNICOS
export const getInventarioOro = async (): Promise<InventarioOroItem[]> => {
  // Bypass de tipado para lectura profunda
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

  // Aplanamos y extraemos la info técnica de forma segura
  return (data || []).map((item: any) => {
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
export const guardarTueste = async (datosTueste: DatosTueste, consumoVerde: ConsumoVerde[], orgId: string, userId: string) => {

  // 1. Crear el Batch
  const { data: batch, error: errBatch } = await supabase
    .from('roast_batches')
    .insert([{
      organization_id: orgId,
      machine_id: datosTueste.machine_id,
      roast_date: new Date().toISOString(),
      operator_name: datosTueste.operador || 'Admin', 
      
      green_weight_input: Number(datosTueste.peso_entrada),
      roasted_weight_output: Number(datosTueste.peso_salida),
      
      roast_log_data: datosTueste.curva_datos as Json, 
      
      total_time_seconds: datosTueste.tiempo_total,
      drop_temp: Number(datosTueste.temp_final),

      // NUEVOS CAMPOS AMBIENTALES
      ambient_temp: Number(datosTueste.ambient_temp) || 0,
      relative_humidity: Number(datosTueste.relative_humidity) || 0,
      initial_bean_temp: Number(datosTueste.initial_bean_temp) || 0,
      initial_bean_humidity: Number(datosTueste.initial_bean_humidity) || 0
    }])
    .select()
    .single();

  if (errBatch) throw errBatch;
  if (!batch) throw new Error("No se pudo crear el batch.");

  // 2. Registrar consumo
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

// GET: Historial de Tuestes Realizados
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
      machines ( name ),
      roast_batch_inputs (
        green_coffee_warehouse ( name_ref )
      )
    `)
    .eq('organization_id', orgId)
    .order('roast_date', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
};