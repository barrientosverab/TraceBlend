// src/services/usuariosService.js
import { supabase } from './supabaseClient';
import { createClient } from '@supabase/supabase-js';

// Obtenemos las credenciales públicas del cliente original para clonarlo
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const getUsuarios = async (orgId) => {
  // Obtenemos los perfiles filtrados por organización
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const actualizarRol = async (userId, nuevoRol) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: nuevoRol })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Simula una invitación creando el usuario directamente.
 * Usa un cliente temporal para no cerrar la sesión del admin.
 */
export const invitarUsuario = async (datos, orgId) => {
  // 1. Crear cliente temporal (sin persistencia para no afectar al admin)
  const tempClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // ¡Clave! No guardar cookies
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  // 2. Generar contraseña temporal segura
  const tempPassword = `Trace${Math.floor(1000 + Math.random() * 9000)}!`;

  // 3. Registrar usuario (Esto envía el email de confirmación de Supabase)
  const { data: authData, error: authError } = await tempClient.auth.signUp({
    email: datos.email,
    password: tempPassword,
    options: {
      data: {
        first_name: datos.nombre, // Metadata inicial
        role: datos.rol // Metadata inicial
      }
    }
  });

  if (authError) throw authError;

  if (authData.user) {
    // 4. Asegurar que el perfil tenga el rol y org correctos
    // (El trigger lo crea, pero aquí forzamos la actualización inmediata)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        role: datos.rol, 
        first_name: datos.nombre,
        organization_id: orgId 
      })
      .eq('id', authData.user.id); // Usamos el ID generado por Auth

    // Si falla el update (ej: trigger lento), no es crítico, el usuario ya existe.
    if (profileError) console.warn("Aviso: Perfil actualizado con retraso", profileError);
    
    return { user: authData.user, tempPassword };
  }
};