import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

// Extraemos el tipo de fila de 'profiles' directamente de tu archivo generado
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Definimos la interfaz de lo que devuelve TU función (mezcla Auth + Base de datos)
export interface UserProfile {
  id: string;
  email: string | undefined;
  organization_id: string | null;
  role: string | null; // El tipo generado probablemente sea un string o un enum
  first_name: string | null;
}

export const getUserProfile = async (): Promise<UserProfile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Como ya conectamos el cliente, TypeScript sabe que 'profiles' existe
  const { data, error } = await supabase
    .from('profiles')
    .select('organization_id, role, first_name') // TS validará que estos campos existan
    .eq('id', user.id)
    .single();

  if (error || !data) {
    console.error("Error fetching profile:", error);
    return null;
  }
  
  return { 
    id: user.id, 
    email: user.email,
    organization_id: data.organization_id,
    role: data.role,
    first_name: data.first_name
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