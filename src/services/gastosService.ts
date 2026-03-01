import { supabase } from './supabaseClient';
import { FixedExpense } from '../types/supabase';

// Tipos base inferidos
type FixedExpenseRow = FixedExpense;

export interface GastoFijoForm {
  name: string;
  amount: number | string;
  category: string;
  frequency: string;
  cost_center: string;
}

export interface RegistroPagoForm {
  expense_id?: string;
  description: string;
  amount_paid: number | string;
  payment_date: string;
  payment_method: string;
  cost_center: string;
}

export interface MonthlyBudgetForm {
  category: string;
  cost_center: string;
  budget_amount: number | string;
  month_year: string;
}

export interface AccountReceivableForm {
  client_id?: string;
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
      cost_center: datos.cost_center as any,
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
      payment_method: datos.payment_method,
      cost_center: datos.cost_center as any
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
      id, payment_date, description, amount_paid, payment_method, cost_center,
      fixed_expenses ( name, category, cost_center )
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
    cost_center: p.cost_center || p.fixed_expenses?.cost_center || 'otro',
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

// 6. Obtener Ingresos (Ventas) del Mes Actual para el P&L
export const getMonthlySales = async (orgId: string) => {
  // Obtener el primer y último día del mes actual
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data, error } = await supabase
    .from('sales_orders')
    .select('total_amount, order_date')
    .eq('organization_id', orgId)
    .eq('status', 'completada')
    .gte('order_date', firstDay)
    .lte('order_date', lastDay);

  if (error) throw error;

  return (data || []).map((sale: any) => ({
    amount: Number(sale.total_amount),
    date: sale.order_date
  }));
};

// 7. Obtener Presupuestos del Mes
export const getMonthlyBudgets = async (orgId: string, monthYear: string) => {
  const { data, error } = await supabase
    .from('monthly_budgets')
    .select('*')
    .eq('organization_id', orgId)
    .eq('month_year', monthYear);

  if (error) throw error;
  return data || [];
};

// 8. Establecer/Actualizar Presupuesto (Upsert no nativo, así que buscamos primero y actualizamos o insertamos)
export const setMonthlyBudget = async (datos: MonthlyBudgetForm, orgId: string) => {
  // Check if exists
  const { data: existing } = await supabase
    .from('monthly_budgets')
    .select('id')
    .eq('organization_id', orgId)
    .eq('category', datos.category)
    .eq('month_year', datos.month_year)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .update({
        budget_amount: Number(datos.budget_amount),
        cost_center: datos.cost_center,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('monthly_budgets')
      .insert([{
        organization_id: orgId,
        category: datos.category,
        cost_center: datos.cost_center,
        budget_amount: Number(datos.budget_amount),
        month_year: datos.month_year
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

// 9. Funciones para Cuentas por Cobrar (Accounts Receivable)
export const getAccountsReceivable = async (orgId: string) => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .select('*, clients(business_name)')
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
      client_id: datos.client_id || null,
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

// 10. Funciones para Cuentas por Pagar (Accounts Payable)
export const getAccountsPayable = async (orgId: string) => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .select('*, suppliers(business_name)')
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
      supplier_id: datos.supplier_id || null,
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

// 11. Funciones para Proyecciones y Cash Flow
export interface HistoricalFinancial {
  month_year: string;
  sales: number;
  expenses: number;
}

export const getHistoricalFinancials = async (orgId: string, monthsAgo: number = 6): Promise<HistoricalFinancial[]> => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  const startDate = date.toISOString();

  const [salesReq, expensesReq] = await Promise.all([
    supabase
      .from('sales_orders')
      .select('total_amount, order_date')
      .eq('organization_id', orgId)
      .eq('status', 'completada')
      .gte('order_date', startDate),
    supabase
      .from('expense_ledger')
      .select('amount_paid, payment_date')
      .eq('organization_id', orgId)
      .gte('payment_date', startDate)
  ]);

  if (salesReq.error) throw salesReq.error;
  if (expensesReq.error) throw expensesReq.error;

  const summaryData: Record<string, HistoricalFinancial> = {};

  (salesReq.data || []).forEach(sale => {
    const period = sale.order_date.substring(0, 7); // YYYY-MM
    if (!summaryData[period]) summaryData[period] = { month_year: period, sales: 0, expenses: 0 };
    summaryData[period].sales += Number(sale.total_amount);
  });

  (expensesReq.data || []).forEach(exp => {
    const period = exp.payment_date.substring(0, 7);
    if (!summaryData[period]) summaryData[period] = { month_year: period, sales: 0, expenses: 0 };
    summaryData[period].expenses += Number(exp.amount_paid);
  });

  return Object.values(summaryData).sort((a, b) => a.month_year.localeCompare(b.month_year));
};

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