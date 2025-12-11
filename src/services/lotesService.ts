import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

// 1. Extraemos el tipo exacto para el estado del lote
type BatchState = Database['public']['Tables']['raw_inventory_batches']['Insert']['current_state'];

export interface LoteForm {
  finca_id: string;
  fecha_compra: string;
  peso: string | number;
  precio_total: string | number;
  estado: string;
  variedad: string;
  proceso: string;
  humedad: string | number;
  notas: string;
}

export const crearLote = async (datos: LoteForm, orgId: string) => {  
  const code = `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const estadoMap: Record<string, string> = {
    'Cereza': 'cereza',
    'Pergamino': 'pergamino_seco',
    'Oro Verde': 'oro_verde'
  };

  const loteData = {
    organization_id: orgId,
    farm_id: datos.finca_id, 
    code_ref: code,
    purchase_date: datos.fecha_compra,
    initial_quantity: Number(datos.peso),
    current_quantity: Number(datos.peso), 
    total_cost_local: Number(datos.precio_total) || 0,
    
    // 2. CORRECCIÓN: Hacemos casting (as BatchState)
    // Esto garantiza que el valor, aunque venga de un mapa de strings, es válido para la BD
    current_state: (estadoMap[datos.estado] || 'pergamino_seco') as BatchState,
    
    variety: datos.variedad,
    process: datos.proceso,
    humidity_percentage: datos.humedad ? Number(datos.humedad) : null,
    observations: datos.notas, 
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