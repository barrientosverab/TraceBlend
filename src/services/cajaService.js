import { supabase } from './supabaseClient';

export const obtenerResumenCaja = async (orgId, userId) => {
  const { data, error } = await supabase.rpc('get_pending_cash_summary', {
    p_org_id: orgId,
    p_user_id: userId
  });

  if (error) throw error;
  return data;
};

export const registrarCierre = async (datos, orgId, userId) => {
  // Cálculo ajustado:
  // Diferencia = (Lo que hay físico + Lo que se llevó el dueño) - Lo que vendió el sistema
  const totalSystem = datos.system_cash + datos.system_qr + datos.system_card;
  
  // El dinero "declarado" es la suma de lo que está en caja + los recibos de retiro
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
      
      cash_withdrawals: datos.cash_withdrawals, // <--- NUEVO CAMPO
      
      difference: difference,
      notes: datos.notes
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const registrarApertura = async (montoBase, orgId, userId) => {
  const { error } = await supabase
    .from('cash_openings')
    .insert([{
      organization_id: orgId,
      user_id: userId,
      initial_cash: parseFloat(montoBase),
      opened_at: new Date()
    }]);

  if (error) throw error;
  return true;
};

    