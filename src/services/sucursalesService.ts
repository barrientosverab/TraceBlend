import { supabase } from './supabaseClient';

export const getSucursales = async (orgId: string) => {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name, address, phone, is_main, is_active')
    .eq('organization_id', orgId)
    .order('is_main', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const crearSucursal = async (
  sucursal: {
    name: string;
    address?: string;
    phone?: string;
    is_main?: boolean;
  },
  orgId: string
) => {
  const { data, error } = await supabase
    .from('branches')
    .insert({
      organization_id: orgId,
      name: sucursal.name,
      address: sucursal.address || '',
      phone: sucursal.phone || undefined,
      is_main: sucursal.is_main || false,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const actualizarSucursal = async (
  id: string,
  sucursal: Partial<{
    name: string;
    address: string;
    phone: string;
    is_main: boolean;
    is_active: boolean;
  }>
) => {
  const { error } = await supabase
    .from('branches')
    .update(sucursal)
    .eq('id', id);
  if (error) throw error;
};
