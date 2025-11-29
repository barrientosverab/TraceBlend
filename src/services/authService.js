import { supabase } from './supabaseClient';

export const getCurrentOrgId = async () => {
  // 1. Ver quién es el usuario
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión");

  // 2. Ver a qué empresa pertenece
  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (error || !data?.organization_id) throw new Error("No tienes una organización asignada. Contacta al Admin.");
  
  return data.organization_id;
};

export const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};