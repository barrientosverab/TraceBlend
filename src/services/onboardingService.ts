import { supabase } from './supabaseClient';

// Paso 1: Registrar Usuario (Auth)
export const registrarUsuarioInicial = async (datos: { email: string, password: string, nombre: string, inviteOrgId?: string }) => {
  const { data, error } = await supabase.auth.signUp({
    email: datos.email,
    password: datos.password,
    options: {
      data: {
        first_name: datos.nombre,
        // Si viene con invitación, guardamos el ID para usarlo luego
        invited_org_id: datos.inviteOrgId || null 
      }
    }
  });

  if (error) throw error;
  
  // Si fue invitado, lo vinculamos inmediatamente a la organización
  if (data.user && datos.inviteOrgId) {
    await supabase
      .from('profiles')
      .update({ organization_id: datos.inviteOrgId, role: 'operador' }) // Rol por defecto
      .eq('id', data.user.id);
  }

  return data;
};

// Paso 2: Crear Organización (Solo para fundadores)
export const crearOrganizacionYVincular = async (userId: string, nombreEmpresa: string) => {
  // 1. Crear Org
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert([{ name: nombreEmpresa, plan_type: 'free' }])
    .select()
    .single();

  if (orgError) throw orgError;

  // 2. Actualizar Perfil del Dueño
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ organization_id: org.id, role: 'administrador' })
    .eq('id', userId);

  if (profileError) throw profileError;

  return org;
};