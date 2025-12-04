import { supabase } from './supabaseClient';

// GET: Listar máquinas activas
export const getMaquinas = async () => {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data;
};

// POST: Registrar nueva máquina
export const crearMaquina = async (datos, orgId) => {

  const { data, error } = await supabase
    .from('machines')
    .insert([{
      organization_id: orgId,
      name: datos.nombre,      // Ej: "La Consentida"
      brand: datos.marca,      // Ej: Probat
      model: datos.modelo,     // Ej: UG-22
      capacity_kg: parseFloat(datos.capacidad), // Ej: 22.5
      connection_type: 'manual', // Por ahora manual, luego 'artisan'
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};