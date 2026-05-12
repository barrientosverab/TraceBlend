import { supabase } from './supabaseClient';

/**
 * Registrar usuario con Auth y crear perfil automáticamente
 * (El trigger handle_new_user() en BD crea el perfil)
 */
export const registrarUsuarioInicial = async (datos: { email: string, password: string, nombre: string, inviteOrgId?: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email: datos.email,
    password: datos.password,
    options: {
      data: {
        first_name: datos.nombre,
        invited_org_id: datos.inviteOrgId || null
      }
    }
  });

  if (error) throw error;

  // Si fue invitado, lo vinculamos inmediatamente a la organización
  if (data.user && datos.inviteOrgId) {
    await supabase
      .from('profiles')
      .update({ organization_id: datos.inviteOrgId, role: 'cashier' })
      .eq('id', data.user.id);
  }

  return data;
};

/**
 * Crear organización + sucursal principal + vincular perfil
 * Usa la RPC setup_organization si existe, o lo hace manualmente
 */
export const crearOrganizacionYVincular = async (userId: string, nombreEmpresa: string) => {
  // 1. Crear Org
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert([{ name: nombreEmpresa, status: 'trial' }])
    .select()
    .single();

  if (orgError) throw orgError;

  // 2. Crear Sucursal Principal
  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .insert([{
      organization_id: org.id,
      name: 'Principal',
      is_main: true
    }])
    .select()
    .single();

  if (branchError) throw branchError;

  // 3. Actualizar Perfil del Dueño
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      organization_id: org.id,
      branch_id: branch.id,
      role: 'admin'
    })
    .eq('id', userId);

  if (profileError) throw profileError;

  return org;
};