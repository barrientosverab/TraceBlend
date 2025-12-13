import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

// Tipos base inferidos
type FixedExpenseRow = Database['public']['Tables']['fixed_expenses']['Row'];

export interface GastoFijoForm {
  name: string;
  amount: number | string;
  category: string;
  frequency: string;
}

export interface RegistroPagoForm {
  expense_id?: string;
  description: string;
  amount_paid: number | string;
  payment_date: string;
  payment_method: string;
}

// 1. Obtener Configuración de Gastos Fijos
export const getGastosFijos = async (orgId: string): Promise<FixedExpenseRow[]> => {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('amount', { ascending: false });

  if (error) throw error;
  return data || [];
};

// 2. Crear Nuevo Gasto Fijo
export const crearGastoFijo = async (datos: GastoFijoForm, orgId: string) => {
  const { data, error } = await supabase
    .from('fixed_expenses')
    .insert([{
      organization_id: orgId,
      name: datos.name,
      amount: Number(datos.amount),
      category: datos.category as any, // Casting seguro para enum
      frequency: datos.frequency as any,
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 3. Registrar un Pago Real (Libro Diario)
export const registrarPago = async (datos: RegistroPagoForm, orgId: string) => {
  const { data, error } = await supabase
    .from('expense_ledger')
    .insert([{
      organization_id: orgId,
      expense_id: datos.expense_id || null,
      description: datos.description,
      amount_paid: Number(datos.amount_paid),
      payment_date: datos.payment_date,
      payment_method: datos.payment_method
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 4. Ver Historial de Pagos (Tipado manual para el join)
export const getHistorialPagos = async (orgId: string) => {
  const { data, error } = await (supabase as any)
    .from('expense_ledger')
    .select(`
      id, payment_date, description, amount_paid, payment_method,
      fixed_expenses ( name, category )
    `)
    .eq('organization_id', orgId)
    .order('payment_date', { ascending: false })
    .limit(50);

  if (error) throw error;
  
  return (data || []).map((p: any) => ({
    id: p.id,
    fecha: p.payment_date,
    descripcion: p.description,
    monto: p.amount_paid,
    metodo: p.payment_method,
    categoria: p.fixed_expenses?.category || 'otros',
    etiqueta: p.fixed_expenses?.name || 'Gasto Extra'
  }));
};

// 5. Eliminar (Soft Delete)
export const eliminarGastoFijo = async (id: string) => {
  const { error } = await supabase
    .from('fixed_expenses')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
};