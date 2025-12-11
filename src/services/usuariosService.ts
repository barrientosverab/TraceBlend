// src/services/usuariosService.ts
import { supabase } from './supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// 1. Definimos el tipo de Rol basado en tu BD
type UserRole = Database['public']['Tables']['profiles']['Insert']['role'];

// Cliente temporal para invitaciones (sin sesión persistente)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const getUsuarios = async (orgId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const actualizarRol = async (userId: string, nuevoRol: string) => {
  const { data, error } = await supabase
    .from('profiles')
    // 2. Aquí también hacemos el casting para asegurar que 'nuevoRol' es válido
    .update({ role: nuevoRol as UserRole }) 
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export interface InvitacionData {
  email: string;
  nombre: string;
  rol: string; // En el formulario sigue siendo string
}

export const invitarUsuario = async (datos: InvitacionData, orgId: string) => {
  const tempClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  const tempPassword = `Trace${Math.floor(1000 + Math.random() * 9000)}!`;

  // 3. Creamos el usuario
  const { data: authData, error: authError } = await tempClient.auth.signUp({
    email: datos.email,
    password: tempPassword,
    options: {
      data: {
        first_name: datos.nombre,
        organization_id: orgId,
        role: datos.rol as UserRole 
      }
    }
  });

  if (authError) throw authError;

  if (authData.user) {
    // 4. Actualizamos perfil (mismo fix aquí)
    await supabase
      .from('profiles')
      .update({ 
        role: datos.rol as UserRole, // <--- Casting aquí también
        first_name: datos.nombre,
        organization_id: orgId 
      })
      .eq('id', authData.user.id);
    
    return { user: authData.user, tempPassword };
  }
};