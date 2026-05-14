import { supabase } from './supabaseClient';


// Definimos la interfaz de lo que devuelve TU función (mezcla Auth + Base de datos)
export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  organization_id: string | null;
  branch_id: string | null;
  is_active: boolean | null;
  email?: string | undefined;
}

export const getUserProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Como ya conectamos el cliente, TypeScript sabe que 'profiles' existe
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id, first_name, last_name, role, organization_id, branch_id, is_active')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    console.error("Error fetching profile:", error);
    return null;
  }
  
  return { 
    id: data.id || user.id, 
    email: user.email,
    organization_id: data.organization_id,
    branch_id: data.branch_id,
    role: data.role,
    first_name: data.first_name,
    last_name: data.last_name,
    is_active: data.is_active
  };
};

export const getCurrentOrgId = async (): Promise<string> => {
  const profile = await getUserProfile();
  // Validamos explícitamente porque organization_id puede ser null en la BD
  if (!profile?.organization_id) {
    throw new Error("No tienes una organización asignada.");
  }
  return profile.organization_id;
};

export const getCurrentUserId = async (): Promise<string | undefined> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
};