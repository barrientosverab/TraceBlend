import { supabase } from './supabaseClient';

// ─── Tipos ───

export interface RegistroPagoForm {
  expense_category_id?: string;
  description: string;
  amount: number | string;
  payment_date: string;
  payment_method: string;
}

export interface AccountReceivableForm {
  customer_id?: string;
  invoice_number?: string;
  description: string;
  total_amount: number | string;
  due_date: string;
}

export interface AccountPayableForm {
  supplier_id?: string;
  invoice_number?: string;
  description: string;
  total_amount: number | string;
  due_date: string;
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
      id, description, amount, payment_date, payment_method,
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
    payment_date: e.payment_date,
    payment_method: e.payment_method,
  }));
};

/**
 * Crear un gasto fijo (inserta en expenses con una categoría fixed)
 */
export const crearGastoFijo = async (
  datos: { name: string; amount: number | string; category_id: string },
  orgId: string
) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      organization_id: orgId,
      expense_category_id: datos.category_id,
      description: datos.name,
      amount: Number(datos.amount),
      payment_date: new Date().toISOString().split('T')[0],
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── 3. Registrar un Pago Real (Libro Diario) ───

export const registrarPago = async (datos: RegistroPagoForm, orgId: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{
      organization_id: orgId,
      expense_category_id: datos.expense_category_id || null,
      description: datos.description,
      amount: Number(datos.amount),
      payment_date: datos.payment_date,
      payment_method: datos.payment_method,
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
      id, payment_date, description, amount, payment_method,
      expense_categories ( name, type )
    `)
    .eq('organization_id', orgId)
    .order('payment_date', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data || []).map((p: any) => ({
    id: p.id,
    fecha: p.payment_date,
    descripcion: p.description,
    monto: p.amount,
    metodo: p.payment_method,
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
    .select('total_amount, created_at')
    .eq('organization_id', orgId)
    .eq('status', 'completed')
    .gte('created_at', firstDay)
    .lte('created_at', lastDay);

  if (error) throw error;

  return (data || []).map((sale: any) => ({
    amount: Number(sale.total_amount),
    date: sale.created_at
  }));
};

// ─── 7. Cuentas por Cobrar (Accounts Receivable) ───

export const getAccountsReceivable = async (orgId: string) => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .select('*, customers(business_name)')
    .eq('organization_id', orgId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createAccountReceivable = async (datos: AccountReceivableForm, orgId: string) => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .insert([{
      organization_id: orgId,
      customer_id: datos.customer_id || null,
      invoice_number: datos.invoice_number || null,
      description: datos.description,
      total_amount: Number(datos.total_amount),
      due_date: datos.due_date,
      status: 'pendiente'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAccountReceivableStatus = async (id: string, status: string, paidAmount: number = 0) => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .update({ 
      status, 
      paid_amount: paidAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── 8. Cuentas por Pagar (Accounts Payable) ───

export const getAccountsPayable = async (orgId: string) => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .select('*')
    .eq('organization_id', orgId)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createAccountPayable = async (datos: AccountPayableForm, orgId: string) => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .insert([{
      organization_id: orgId,
      invoice_number: datos.invoice_number || null,
      description: datos.description,
      total_amount: Number(datos.total_amount),
      due_date: datos.due_date,
      status: 'pendiente'
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAccountPayableStatus = async (id: string, status: string, paidAmount: number = 0) => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .update({ 
      status, 
      paid_amount: paidAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─── 9. Datos Históricos Financieros ───

export const getHistoricalFinancials = async (orgId: string, monthsAgo: number = 6): Promise<HistoricalFinancial[]> => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const startDate = date.toISOString();

  const [salesReq, expensesReq] = await Promise.all([
    supabase
      .from('sales')
      .select('total_amount, created_at')
      .eq('organization_id', orgId)
      .eq('status', 'completed')
      .gte('created_at', startDate),
    supabase
      .from('expenses')
      .select('amount, payment_date')
      .eq('organization_id', orgId)
      .gte('payment_date', startDate)
  ]);

  if (salesReq.error) throw salesReq.error;
  if (expensesReq.error) throw expensesReq.error;

  const summaryData: Record<string, HistoricalFinancial> = {};

  (salesReq.data || []).forEach(sale => {
    const period = sale.created_at.substring(0, 7); // YYYY-MM
    if (!summaryData[period]) summaryData[period] = { month_year: period, sales: 0, expenses: 0 };
    summaryData[period].sales += Number(sale.total_amount);
  });

  (expensesReq.data || []).forEach(exp => {
    const period = exp.payment_date.substring(0, 7);
    if (!summaryData[period]) summaryData[period] = { month_year: period, sales: 0, expenses: 0 };
    summaryData[period].expenses += Number(exp.amount);
  });

  return Object.values(summaryData).sort((a, b) => a.month_year.localeCompare(b.month_year));
};

// ─── 10. Cuentas Pendientes Consolidadas ───

export const getPendingAccounts = async (orgId: string) => {
  const [arReq, apReq] = await Promise.all([
    supabase
      .from('accounts_receivable')
      .select('total_amount, paid_amount, due_date, status')
      .eq('organization_id', orgId)
      .neq('status', 'pagado')
      .order('due_date', { ascending: true }),
    supabase
      .from('accounts_payable')
      .select('total_amount, paid_amount, due_date, status')
      .eq('organization_id', orgId)
      .neq('status', 'pagado')
      .order('due_date', { ascending: true })
  ]);

  return {
    receivables: arReq.data || [],
    payables: apReq.data || []
  };
};