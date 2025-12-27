import { supabase } from './supabaseClient';
import { LoteFormData } from '../utils/validationSchemas';

export const crearLote = async (datos: LoteFormData, orgId: string) => {
  const code = `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const loteData = {
    organization_id: orgId,
    farm_id: datos.finca_id,
    code_ref: code,
    purchase_date: datos.fecha_compra,
    initial_quantity: Number(datos.peso) || 0,
    current_quantity: Number(datos.peso) || 0,
    total_cost_local: datos.precio_total ? Number(datos.precio_total) : null, // null si está vacío
    current_state: datos.estado, // Ya validado como enum correcto por Zod
    variety: datos.variedad,
    process: datos.proceso,
    humidity_percentage: datos.humedad ? Number(datos.humedad) : null,
    observations: datos.notas || '',
    unit_of_measure: 'Kg'
  };

  const { data, error } = await supabase
    .from('raw_inventory_batches')
    .insert([loteData])
    .select()
    .single();

  if (error) throw error;
  return data;
};