import { supabase } from './supabaseClient';

export const registrarNuevoCliente = async (datos) => {
  // Solo registramos al usuario enviando la "metadata" necesaria.
  // El Trigger SQL se encargará de crear la organización y el perfil automáticamente.
  
  const { data, error } = await supabase.auth.signUp({
    email: datos.email,
    password: datos.password,
    options: {
      data: { 
        // Estos nombres deben coincidir con lo que lee el Trigger SQL
        nombre: datos.nombre, 
        nombre_empresa: datos.empresa 
      }
    }
  });

  if (error) throw error;

  // No hacemos nada más. La base de datos ya hizo el trabajo sucio.
  return data;
};