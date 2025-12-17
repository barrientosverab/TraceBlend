import { supabase } from './supabaseClient';

export interface CierreData {
  system_cash: number;
  system_qr: number;
  system_card: number;
  declared_cash: number;
  declared_qr: number;
  declared_card: number;
  cash_withdrawals: number;
  notes: string;
}

export const registrarApertura = async (montoInicial: number, orgId: string, userId: string) => {
  const { data, error } = await supabase
    .from('cash_openings')
    .insert([{
      organization_id: orgId,
      user_id: userId,
      initial_cash: montoInicial,
      opened_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const verificarEstadoCaja = async (orgId: string, userId: string) => {
  const { data, error } = await supabase.rpc('get_cash_status', {
    p_org_id: orgId,
    p_user_id: userId
  });
  if (error) throw error;
  return data; // { status: 'open' | 'closed', ... }
};

export const obtenerResumenCaja = async (orgId: string, userId: string) => {
  const { data, error } = await supabase.rpc('get_pending_cash_summary', {
    p_org_id: orgId,
    p_user_id: userId
  });

  if (error) throw error;
  return data;
};

export const registrarCierre = async (datos: CierreData, orgId: string, userId: string) => {
  // El total del sistema es el efectivo inicial + ventas efectivo
  const totalSystem = datos.system_cash + datos.system_qr + datos.system_card;
  const totalDeclared = (datos.declared_cash + datos.cash_withdrawals) + datos.declared_qr + datos.declared_card;
  const difference = totalDeclared - totalSystem;

  const { data, error } = await supabase
    .from('cash_closures')
    .insert([{
      organization_id: orgId,
      user_id: userId,
      system_cash: datos.system_cash,
      system_qr: datos.system_qr,
      system_card: datos.system_card,
      declared_cash: datos.declared_cash,
      declared_qr: datos.declared_qr,
      declared_card: datos.declared_card,
      cash_withdrawals: datos.cash_withdrawals,
      difference: difference,
      notes: datos.notes,
      closed_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};