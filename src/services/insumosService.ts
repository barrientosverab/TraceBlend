import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

type InsumoRow = Database['public']['Tables']['supplies_inventory']['Row'];
type InsumoInsert = Database['public']['Tables']['supplies_inventory']['Insert'];
type InsumoUpdate = Database['public']['Tables']['supplies_inventory']['Update'];

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

export const actualizarInsumo = async (id: string, datos: InsumoUpdate) => {
  const { data, error } = await supabase
    .from('supplies_inventory')
    .update({ ...datos, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --- NUEVO: Función para registrar el historial de compra en Gastos ---
export const registrarHistorialCompra = async (
  orgId: string, 
  descripcion: string, 
  montoTotal: number, 
  fecha: string
) => {
  // Insertamos en 'expense_ledger' para tener el historial de "Cuándo y Cuántos"
  const { error } = await supabase
    .from('expense_ledger')
    .insert([{
      organization_id: orgId,
      description: descripcion, // Ej: "Compra 10 Cajas de Leche"
      amount_paid: montoTotal,
      payment_date: fecha,
      payment_method: 'Efectivo' // Por defecto, o podrías agregarlo al form
    }]);

  if (error) throw error;
};

export const eliminarInsumo = async (id: string) => {
  const { error } = await supabase
    .from('supplies_inventory')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};