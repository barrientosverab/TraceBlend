import { supabase } from './supabaseClient';

export const registrarNuevoCliente = async (datos) => {
  // Solo registramos al usuario. 
  // La Base de Datos (Trigger) se encargará de crearle su empresa automáticamente.
  const { data, error } = await supabase.auth.signUp({
    email: datos.email,
    password: datos.password,
    options: {
      data: { 
        nombre: datos.nombre,
        nombre_empresa: datos.empresa, // <--- ¡AQUÍ ESTÁ LA CLAVE! Enviamos lo que escribió.
        role: 'administrador'
      }
    }
  });

  if (error) throw error;

  // Si hay confirmación de correo, data.session será null, pero no importa.
  // La organización YA FUE CREADA en segundo plano por el trigger.
  return data;
};