import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

type ClientRow = Database['public']['Tables']['clients']['Row'];

export const getTodosLosClientes = async (orgId: string): Promise<ClientRow[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_active', { ascending: false })
    .order('business_name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export interface ClienteForm {
  business_name: string;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  discount_rate: string | number;
  notes: string | null;
}

export const actualizarCliente = async (id: string, datos: ClienteForm) => {
  const { data, error } = await supabase
    .from('clients')
    .update({
      business_name: datos.business_name,
      tax_id: datos.tax_id,
      email: datos.email,
      phone: datos.phone,
      discount_rate: Number(datos.discount_rate) || 0,
      notes: datos.notes
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const toggleEstadoCliente = async (id: string, nuevoEstado: boolean) => {
  const { error } = await supabase
    .from('clients')
    .update({ is_active: nuevoEstado })
    .eq('id', id);

  if (error) throw error;
  return true;
};