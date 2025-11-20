import { supabase } from './supabaseClient'; // Asegúrate que este archivo existe desde pasos anteriores

export const crearLoteCompra = async (datosFormulario) => {
  // Mapeamos los nombres del formulario a las columnas de la BD
  const loteParaGuardar = {
    proveedor: datosFormulario.proveedor,
    origen: datosFormulario.origen,
    peso_kg: parseFloat(datosFormulario.peso), // Convertimos texto a número
    variedad: datosFormulario.variedad,
    humedad_porcentaje: datosFormulario.humedad ? parseFloat(datosFormulario.humedad) : null,
    notas: datosFormulario.notas
  };

  const { data, error } = await supabase
    .from('lotes_compra')
    .insert([loteParaGuardar])
    .select();

  if (error) {
    console.error("Error guardando lote:", error);
    throw error;
  }

  return data;
};