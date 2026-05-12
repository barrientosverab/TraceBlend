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

export interface CierreHistorico {
  id: string;
  user_id: string;
  user_name: string;
  opened_at: string;
  closed_at: string;
  initial_cash: number;
  system_cash: number;
  system_qr: number;
  system_card: number;
  declared_cash: number;
  declared_qr: number;
  declared_card: number;
  cash_withdrawals: number;
  difference: number;
  notes: string | null;
  sales_count: number;
}

export interface DetalleCierre {
  cierre: CierreHistorico;
  ventas: {
    cash: { total: number; count: number };
    qr: { total: number; count: number };
    card: { total: number; count: number };
  };
}

export const registrarApertura = async (montoInicial: number, branchId: string, userId: string) => {
  const { data, error } = await supabase
    .from('cash_openings')
    .insert([{
      branch_id: branchId,
      user_id: userId,
      initial_cash: montoInicial,
      opened_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const verificarEstadoCaja = async (branchId: string, userId: string) => {
  // Buscar apertura no cerrada para esta sucursal/usuario
  const { data, error } = await supabase
    .from('cash_openings')
    .select('id, initial_cash, opened_at, closed')
    .eq('branch_id', branchId)
    .eq('user_id', userId)
    .eq('closed', false)
    .order('opened_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

  if (data) {
    return { status: 'open', opening_id: data.id, initial_cash: data.initial_cash, opened_at: data.opened_at };
  }
  return { status: 'closed' };
};

export const obtenerResumenCaja = async (branchId: string, userId: string) => {
  // Obtener apertura activa
  const estadoCaja = await verificarEstadoCaja(branchId, userId);
  if (estadoCaja.status !== 'open') {
    return { system_cash: 0, system_qr: 0, system_card: 0, initial_cash: 0 };
  }

  // Obtener ventas desde la apertura
  const { data: ventas } = await supabase
    .from('sales')
    .select('id')
    .eq('branch_id', branchId)
    .eq('seller_id', userId)
    .eq('status', 'completed')
    .gte('created_at', estadoCaja.opened_at!);

  const saleIds = (ventas || []).map((v: any) => v.id);

  if (saleIds.length === 0) {
    return { 
      system_cash: 0, system_qr: 0, system_card: 0, 
      initial_cash: estadoCaja.initial_cash || 0 
    };
  }

  // Obtener pagos agrupados por método
  const { data: payments } = await supabase
    .from('sale_payments')
    .select('payment_method, amount')
    .in('sale_id', saleIds);

  const resumen = { system_cash: 0, system_qr: 0, system_card: 0, initial_cash: estadoCaja.initial_cash || 0 };

  (payments || []).forEach((p: any) => {
    switch (p.payment_method) {
      case 'cash': resumen.system_cash += Number(p.amount); break;
      case 'qr': resumen.system_qr += Number(p.amount); break;
      case 'card': resumen.system_card += Number(p.amount); break;
    }
  });

  return resumen;
};

export const registrarCierre = async (datos: CierreData, branchId: string, userId: string) => {
  const totalSystem = datos.system_cash + datos.system_qr + datos.system_card;
  const totalDeclared = (datos.declared_cash + datos.cash_withdrawals) + datos.declared_qr + datos.declared_card;
  const difference = totalDeclared - totalSystem;

  // Obtener apertura activa para vincular
  const estadoCaja = await verificarEstadoCaja(branchId, userId);

  const { data, error } = await supabase
    .from('cash_closures')
    .insert([{
      branch_id: branchId,
      opening_id: estadoCaja.status === 'open' ? estadoCaja.opening_id : null,
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

  // Marcar apertura como cerrada
  if (estadoCaja.status === 'open') {
    await supabase
      .from('cash_openings')
      .update({ closed: true })
      .eq('id', estadoCaja.opening_id);
  }

  return data;
};

export const getCierresHistorico = async (branchId: string, filtros?: { fechaDesde?: string; fechaHasta?: string; userId?: string }) => {
  let query = supabase
    .from('cash_closures')
    .select(`
      id, user_id, closed_at, opening_id,
      system_cash, system_qr, system_card,
      declared_cash, declared_qr, declared_card,
      cash_withdrawals, difference, notes
    `)
    .eq('branch_id', branchId)
    .order('closed_at', { ascending: false });

  if (filtros?.fechaDesde) query = query.gte('closed_at', filtros.fechaDesde);
  if (filtros?.fechaHasta) query = query.lte('closed_at', filtros.fechaHasta);
  if (filtros?.userId) query = query.eq('user_id', filtros.userId);

  const { data: cierres, error } = await query;
  if (error) throw error;

  const cierresConInfo = await Promise.all(
    (cierres || []).map(async (cierre: any) => {
      // Obtener nombre del usuario desde profiles
      const { data: usuario } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', cierre.user_id)
        .single();

      // Obtener apertura vinculada
      let apertura: any = null;
      if (cierre.opening_id) {
        const { data: ap } = await supabase
          .from('cash_openings')
          .select('initial_cash, opened_at')
          .eq('id', cierre.opening_id)
          .single();
        apertura = ap;
      }

      // Contar ventas del período
      const { count } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', cierre.user_id)
        .eq('status', 'completed')
        .gte('created_at', apertura?.opened_at || cierre.closed_at)
        .lte('created_at', cierre.closed_at);

      return {
        id: cierre.id,
        user_id: cierre.user_id,
        user_name: usuario ? `${usuario.first_name} ${usuario.last_name}` : 'Desconocido',
        opened_at: apertura?.opened_at || cierre.closed_at,
        closed_at: cierre.closed_at,
        initial_cash: apertura?.initial_cash || 0,
        system_cash: cierre.system_cash,
        system_qr: cierre.system_qr,
        system_card: cierre.system_card,
        declared_cash: cierre.declared_cash,
        declared_qr: cierre.declared_qr,
        declared_card: cierre.declared_card,
        cash_withdrawals: cierre.cash_withdrawals,
        difference: cierre.difference,
        notes: cierre.notes,
        sales_count: count || 0
      };
    })
  );

  return cierresConInfo as CierreHistorico[];
};

export const getDetalleCierre = async (cierreId: string): Promise<DetalleCierre> => {
  const { data: cierre, error: cierreError } = await supabase
    .from('cash_closures')
    .select(`
      id, user_id, closed_at, opening_id,
      system_cash, system_qr, system_card,
      declared_cash, declared_qr, declared_card,
      cash_withdrawals, difference, notes
    `)
    .eq('id', cierreId)
    .single();

  if (cierreError) throw cierreError;
  if (!cierre) throw new Error('Cierre no encontrado');

  const { data: usuario } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', cierre.user_id)
    .single();

  let apertura: any = null;
  if (cierre.opening_id) {
    const { data: ap } = await supabase
      .from('cash_openings')
      .select('initial_cash, opened_at')
      .eq('id', cierre.opening_id)
      .single();
    apertura = ap;
  }

  // Obtener pagos de ventas del período
  const inicio = apertura?.opened_at || cierre.closed_at;
  const fin = cierre.closed_at;

  const { data: ordenesDelPeriodo } = await supabase
    .from('sales')
    .select('id')
    .eq('seller_id', cierre.user_id)
    .eq('status', 'completed')
    .gte('created_at', inicio)
    .lte('created_at', fin);

  const idsOrdenes = (ordenesDelPeriodo || []).map((o: any) => o.id);

  let payments: any[] = [];
  if (idsOrdenes.length > 0) {
    const { data: paymentsData } = await supabase
      .from('sale_payments')
      .select('payment_method, amount, sale_id')
      .in('sale_id', idsOrdenes);

    payments = paymentsData || [];
  }

  // Agrupar pagos por método (usando nuevos valores ENUM)
  const ventasAgrupadas = {
    cash: { total: 0, count: 0 },
    qr: { total: 0, count: 0 },
    card: { total: 0, count: 0 }
  };

  const ordenesContadas = {
    cash: new Set<string>(),
    qr: new Set<string>(),
    card: new Set<string>()
  };

  payments.forEach((pago: any) => {
    const metodo = pago.payment_method as string;
    if (metodo === 'cash') {
      ventasAgrupadas.cash.total += Number(pago.amount);
      ordenesContadas.cash.add(pago.sale_id);
    } else if (metodo === 'qr') {
      ventasAgrupadas.qr.total += Number(pago.amount);
      ordenesContadas.qr.add(pago.sale_id);
    } else if (metodo === 'card') {
      ventasAgrupadas.card.total += Number(pago.amount);
      ordenesContadas.card.add(pago.sale_id);
    }
  });

  ventasAgrupadas.cash.count = ordenesContadas.cash.size;
  ventasAgrupadas.qr.count = ordenesContadas.qr.size;
  ventasAgrupadas.card.count = ordenesContadas.card.size;

  const cierreConInfo: CierreHistorico = {
    id: cierre.id,
    user_id: cierre.user_id,
    user_name: usuario ? `${usuario.first_name} ${usuario.last_name}` : 'Desconocido',
    opened_at: apertura?.opened_at || cierre.closed_at,
    closed_at: cierre.closed_at,
    initial_cash: apertura?.initial_cash || 0,
    system_cash: cierre.system_cash,
    system_qr: cierre.system_qr,
    system_card: cierre.system_card,
    declared_cash: cierre.declared_cash,
    declared_qr: cierre.declared_qr,
    declared_card: cierre.declared_card,
    cash_withdrawals: cierre.cash_withdrawals,
    difference: cierre.difference,
    notes: cierre.notes,
    sales_count: (ordenesDelPeriodo || []).length
  };

  return {
    cierre: cierreConInfo,
    ventas: ventasAgrupadas
  };
};