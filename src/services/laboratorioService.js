import { supabase } from './supabaseClient';

// Obtener lotes que están pendientes (no procesados aun)
export const getLotesPendientes = async () => {
  const { data, error } = await supabase
    .from('lotes')
    .select(`
      *,
      proveedores ( nombre_completo, nombre_finca )
    `)
    .eq('en_inventario', true) // Solo los que están en recepción
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Guardar la clasificación (Trilla)
export const guardarClasificacion = async (loteId, datosMallas) => {
  // datosMallas es un array de objetos con la info de cada malla
  
  // 1. Insertar en almacen_oro_verde
  const registros = datosMallas.map(m => ({
    lote_padre_id: loteId,
    malla: m.nombre,
    peso_kg: parseFloat(m.peso),
    porcentaje_defectos: m.defectos ? parseFloat(m.defectos) : 0,
    humedad_actual: m.humedad ? parseFloat(m.humedad) : null,
    id_cata_ref: m.idCata || null
  }));

  const { error: errorInsert } = await supabase
    .from('almacen_oro_verde')
    .insert(registros);

  if (errorInsert) throw errorInsert;

  // 2. Marcar el lote original como "Procesado" (ya no está en recepción bruta)
  const { error: errorUpdate } = await supabase
    .from('lotes')
    .update({ en_inventario: false }) 
    .eq('id', loteId);

  if (errorUpdate) throw errorUpdate;

  return true;
};