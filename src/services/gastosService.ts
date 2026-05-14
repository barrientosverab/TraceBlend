import { supabase } from './supabaseClient';

// ─── Tipos ───

export interface RegistroPagoForm {
  category_id?: string;
  description: string;
  amount: number | string;
  expense_date: string;
  payment_method?: string;
}

export interface HistoricalFinancial {
  month_year: string;
  sales: number;
  expenses: number;
}

// ─── 1. Categorías de Gastos ───

export const getExpenseCategories = async (orgId: string) => {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');

  if (error) throw error;
  return data || [];
};

/**
 * Obtener solo categorías fijas (para configuración de gastos fijos)
 */
export const getFixedCategories = async (orgId: string) => {
  const { data, error } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('organization_id', orgId)
    .eq('type', 'fixed')
    .order('name');

  if (error) throw error;
  return data || [];
};

// ─── 2. Gastos Fijos: Expenses con categoría type='fixed' ───

/**
 * Obtener gastos registrados que son "fijos" (su categoría tiene type='fixed')
 */
export const getGastosFijos = async (orgId: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      id, description, amount, expense_date,
      expense_categories!inner (id, name, type)
    `)
    .eq('organization_id', orgId)
    .eq('expense_categories.type', 'fixed')
    .order('amount', { ascending: false });

  if (error) throw error;

  return (data || []).map((e: any) => ({
    id: e.id,
    name: e.description,
    amount: e.amount,
    category: e.expense_categories?.name || 'General',
    expense_date: e.expense_date,
  }));
};

/**
 * Crear un gasto fijo (inserta en expenses con una categoría fixed)
 */
export const crearGastoFijo = async (
  datos: { name: string; amount: number | string; category_id: string },
  orgId: string,
  branchId: string,
  profileId: string
) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      organization_id: orgId,
      branch_id: branchId,
      profile_id: profileId,
      category_id: datos.category_id,
      description: datos.name,
      amount: Number(datos.amount),
      expense_date: new Date().toISOString().split('T')[0],
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── 3. Registrar un Pago Real (Libro Diario) ───

export const registrarPago = async (
  datos: RegistroPagoForm,
  orgId: string,
  branchId: string,
  profileId: string
) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      organization_id: orgId,
      branch_id: branchId,
      profile_id: profileId,
      category_id: datos.category_id!,
      description: datos.description,
      amount: Number(datos.amount),
      expense_date: datos.expense_date,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── 4. Historial de Pagos (Libro Diario) ───

export const getHistorialPagos = async (orgId: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select(`
      id, expense_date, description, amount,
      expense_categories ( name, type )
    `)
    .eq('organization_id', orgId)
    .order('expense_date', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data || []).map((p: any) => ({
    id: p.id,
    fecha: p.expense_date,
    descripcion: p.description,
    monto: p.amount,
    categoria: p.expense_categories?.name || 'otros',
    tipo: p.expense_categories?.type || 'variable',
    etiqueta: p.expense_categories?.name || 'Gasto Extra'
  }));
};

// ─── 5. Eliminar Gasto ───

export const eliminarGasto = async (id: string) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ─── 6. Ingresos del Mes (para P&L) ───

export const getMonthlySales = async (orgId: string) => {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('sales')
    .select('total, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', firstDay)
    .lte('created_at', lastDay);

  if (error) throw error;

  return (data || []).map((sale: any) => ({
    amount: Number(sale.total),
    date: sale.created_at
  }));
};

// ─── 7. Datos Históricos Financieros ───

export const getHistoricalFinancials = async (orgId: string, monthsAgo: number = 6): Promise<HistoricalFinancial[]> => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const startDate = date.toISOString();

  const [salesReq, expensesReq] = await Promise.all([
    supabase
      .from('sales')
      .select('total, created_at')
      .eq('organization_id', orgId)
      .gte('created_at', startDate),
    supabase
      .from('expenses')
      .select('amount, expense_date')
      .eq('organization_id', orgId)
      .gte('expense_date', startDate)
  ]);

  if (salesReq.error) throw salesReq.error;
  if (expensesReq.error) throw expensesReq.error;

  const summaryData: Record<string, HistoricalFinancial> = {};

  (salesReq.data || []).forEach(sale => {
    const period = sale.created_at.substring(0, 7); // YYYY-MM
    if (!summaryData[period]) summaryData[period] = { month_year: period, sales: 0, expenses: 0 };
    summaryData[period].sales += Number(sale.total);
  });

  (expensesReq.data || []).forEach(exp => {
    const period = exp.expense_date.substring(0, 7);
    if (!summaryData[period]) summaryData[period] = { month_year: period, sales: 0, expenses: 0 };
    summaryData[period].expenses += Number(exp.amount);
  });

  return Object.values(summaryData).sort((a, b) => a.month_year.localeCompare(b.month_year));
};