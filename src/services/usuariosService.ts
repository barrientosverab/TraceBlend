// src/services/usuariosService.ts
import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

// Definimos el tipo de Rol basado en la BD
type UserRole = Database['public']['Tables']['profiles']['Insert']['role'];

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
  // Generar contraseña temporal
  const tempPassword = `Trace${Math.floor(1000 + Math.random() * 9000)}!`;

  try {
    // PASO 1: Crear el usuario con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: datos.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirmar email para usuarios invitados
      user_metadata: {
        first_name: datos.nombre,
        last_name: '',
        role: datos.rol
      }
    });

    if (authError) {
      // Mensajes de error más descriptivos
      if (authError.message.includes('not allowed') || authError.message.includes('JWT')) {
        throw new Error('Error de configuración: Verifica que estés usando el Service Role Key en Supabase. Contacta al administrador del sistema.');
      }
      if (authError.message.includes('already registered')) {
        throw new Error('Este email ya está registrado en el sistema.');
      }
      throw new Error(`Error al crear usuario: ${authError.message}`);
    }

    if (!authData.user) throw new Error('No se pudo crear el usuario');

    // PASO 2: Crear/actualizar el perfil con organization_id
    // Usar upsert para asegurar que se cree o actualice el perfil
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: datos.email,
        first_name: datos.nombre,
        last_name: '',
        role: datos.rol as UserRole,
        organization_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw new Error(`Error al crear perfil: ${profileError.message}`);
    }

    console.log(`Usuario ${datos.email} invitado exitosamente a org ${orgId}`);

    return { user: authData.user, tempPassword };
  } catch (error: any) {
    console.error('Error en invitarUsuario:', error);
    throw error;
  }
};