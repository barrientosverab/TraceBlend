import { supabase, supabaseAdmin } from './supabaseClient';
import { Tables } from '../types/supabase';

type UserRole = Tables<'profiles'>['role'];

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
  rol: string;
  branchId?: string;
}

export const invitarUsuario = async (datos: InvitacionData, orgId: string) => {
  const tempPassword = `Trace${Math.floor(1000 + Math.random() * 9000)}!`;

  try {
    if (!supabaseAdmin) {
      throw new Error(
        'Para invitar usuarios necesitas configurar VITE_SUPABASE_SERVICE_ROLE_KEY en tu archivo .env. ' +
        'Encuéntrala en Supabase Dashboard → Project Settings → API → service_role secret.'
      );
    }

    // PASO 1: Crear el usuario con el cliente admin (service role key)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: datos.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: datos.nombre,
        last_name: '',
        role: datos.rol
      }
    });

    if (authError) {
      if (authError.message.includes('not allowed') || authError.message.includes('JWT')) {
        throw new Error('Error de configuración: Verifica que estés usando el Service Role Key en Supabase.');
      }
      if (authError.message.includes('already registered')) {
        throw new Error('Este email ya está registrado en el sistema.');
      }
      throw new Error(`Error al crear usuario: ${authError.message}`);
    }

    if (!authData.user) throw new Error('No se pudo crear el usuario');

    // PASO 2: Crear/actualizar el perfil con organization_id y branch_id
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        first_name: datos.nombre,
        last_name: '',
        role: datos.rol as UserRole,
        organization_id: orgId,
        branch_id: datos.branchId || null
      } as any, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw new Error(`Error al crear perfil: ${profileError.message}`);
    }

    return { user: authData.user, tempPassword };
  } catch (error: any) {
    console.error('Error en invitarUsuario:', error);
    throw error;
  }
};