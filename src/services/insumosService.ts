import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

type InsumoRow = Database['public']['Tables']['supplies_inventory']['Row'];
type InsumoInsert = Database['public']['Tables']['supplies_inventory']['Insert'];

export const getInsumos = async (orgId: string): Promise<InsumoRow[]> => {
  const { data, error } = await supabase
    .from('supplies_inventory')
    .select('*')
    .eq('organization_id', orgId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const crearInsumo = async (datos: InsumoInsert) => {
  const { data, error } = await supabase
    .from('supplies_inventory')
    .insert([datos])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const actualizarStockInsumo = async (id: string, nuevoStock: number, nuevoCosto?: number) => {
  // Preparamos el objeto de actualización
  const updates: any = { 
    current_stock: nuevoStock,
    updated_at: new Date().toISOString() 
  };
  
  if (nuevoCosto !== undefined) {
    updates.unit_cost = nuevoCosto;
  }

  const { data, error } = await supabase
    .from('supplies_inventory')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const eliminarInsumo = async (id: string) => {
  const { error } = await supabase
    .from('supplies_inventory')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};