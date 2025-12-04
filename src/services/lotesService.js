import { supabase } from './supabaseClient';

export const crearLote = async (datos, orgId) => {  
  // Generamos referencia
  const code = `LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Mapeo Frontend (Español) -> Backend ENUM (Inglés)
  const estadoMap = {
    'Cereza': 'cereza',
    'Pergamino': 'pergamino_seco',
    'Oro Verde': 'oro_verde'
  };

  const loteData = {
    organization_id: orgId,
    farm_id: datos.finca_id, 
    code_ref: code,
    purchase_date: datos.fecha_compra,
    initial_quantity: parseFloat(datos.peso),
    current_quantity: parseFloat(datos.peso), 
    // MAPEO DE PRECIO (Costos)
    total_cost_local: parseFloat(datos.precio_total) || 0,
    
    current_state: estadoMap[datos.estado] || 'pergamino_seco',
    variety: datos.variedad,
    process: datos.proceso,
    humidity_percentage: datos.humedad ? parseFloat(datos.humedad) : null,
    observations: datos.notas, 
    unit_of_measure: 'Kg'
  };

  const { data, error } = await supabase
    .from('raw_inventory_batches') // Tabla Correcta
    .insert([loteData])
    .select()
    .single();

  if (error) throw error;
  return data;
};