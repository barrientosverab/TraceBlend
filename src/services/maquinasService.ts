import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

type MachineRow = Database['public']['Tables']['machines']['Row'];

export interface MaquinaForm {
  nombre: string;
  marca: string;
  modelo?: string;
  capacidad: string | number;
}

export const getMaquinas = async (): Promise<MachineRow[]> => {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const crearMaquina = async (datos: MaquinaForm, orgId: string) => {
  const { data, error } = await supabase
    .from('machines')
    .insert([{
      organization_id: orgId,
      name: datos.nombre,
      brand: datos.marca || null,
      model: datos.modelo || null,
      capacity_kg: Number(datos.capacidad),
      connection_type: 'manual', // Por ahora manual
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};