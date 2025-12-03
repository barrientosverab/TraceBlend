import { supabase } from './supabaseClient';

export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id, role, first_name')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  
  return { ...data, id: user.id, email: user.email };
};

// Mantenemos esta por compatibilidad, pero internamente usa la nueva
export const getCurrentOrgId = async () => {
  const profile = await getUserProfile();
  if (!profile?.organization_id) throw new Error("No tienes una organización asignada.");
  return profile.organization_id;
};

export const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};