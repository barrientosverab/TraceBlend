import { supabase } from './supabaseClient';

// Obtener lista de todos los proveedores
export const getProveedores = async () => {
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('nombre_completo', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Crear nuevo proveedor
export const crearProveedor = async (datos) => {
  const { data, error } = await supabase
    .from('proveedores')
    .insert([datos])
    .select()
    .single();

  if (error) throw error;
  return data;
};