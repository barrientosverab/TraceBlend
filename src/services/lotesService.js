import { supabase } from './supabaseClient';

// Crear nuevo lote de ingreso
export const crearLote = async (datos) => {
  // Generamos un código de lote simple: L-{AÑO}-{RANDOM}
  const codigo = `L-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const loteData = {
    codigo_lote: codigo,
    proveedor_id: datos.proveedor_id,
    fecha_compra: datos.fecha_compra,
    peso_ingreso_kg: parseFloat(datos.peso),
    estado_ingreso: datos.estado, // Cereza, Pergamino, etc.
    variedad: datos.variedad,
    proceso: datos.proceso,
    humedad_ingreso: datos.humedad ? parseFloat(datos.humedad) : null,
    notas: datos.notas
  };

  const { data, error } = await supabase
    .from('lotes')
    .insert([loteData])
    .select()
    .single();

  if (error) throw error;
  return data;
};