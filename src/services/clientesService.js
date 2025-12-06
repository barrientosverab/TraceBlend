import { supabase } from './supabaseClient';

export const getTodosLosClientes = async (orgId) => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_active', { ascending: false })
    .order('business_name', { ascending: true });

  if (error) throw error;
  return data;
};

export const actualizarCliente = async (id, datos) => {
  const { data, error } = await supabase
    .from('clients')
    .update({
      business_name: datos.business_name,
      tax_id: datos.tax_id,
      email: datos.email,
      phone: datos.phone,
      discount_rate: parseFloat(datos.discount_rate) || 0, // Nuevo campo
      notes: datos.notes
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Soft Delete (Activar/Desactivar)
export const toggleEstadoCliente = async (id, nuevoEstado) => {
  const { error } = await supabase
    .from('clients')
    .update({ is_active: nuevoEstado })
    .eq('id', id);

  if (error) throw error;
  return true;
};