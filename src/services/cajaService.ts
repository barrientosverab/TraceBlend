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
    efectivo: { total: number; count: number };
    qr: { total: number; count: number };
    tarjeta: { total: number; count: number };
  };
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

export const getCierresHistorico = async (orgId: string, filtros?: { fechaDesde?: string; fechaHasta?: string; userId?: string }) => {
  let query = supabase
    .from('cash_closures')
    .select(`
      id,
      user_id,
      closed_at,
      system_cash,
      system_qr,
      system_card,
      declared_cash,
      declared_qr,
      declared_card,
      cash_withdrawals,
      difference,
      notes
    `)
    .eq('organization_id', orgId)
    .order('closed_at', { ascending: false });

  // Aplicar filtros opcionales
  if (filtros?.fechaDesde) {
    query = query.gte('closed_at', filtros.fechaDesde);
  }
  if (filtros?.fechaHasta) {
    query = query.lte('closed_at', filtros.fechaHasta);
  }
  if (filtros?.userId) {
    query = query.eq('user_id', filtros.userId);
  }

  const { data: cierres, error } = await query;
  if (error) throw error;

  // Obtener información de usuario y apertura para cada cierre
  const cierresConInfo = await Promise.all(
    (cierres || []).map(async (cierre: any) => {
      // Obtener nombre del usuario
      const { data: usuario } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', cierre.user_id)
        .single();

      // Obtener apertura más reciente del usuario antes del cierre
      const { data: apertura } = await supabase
        .from('cash_openings')
        .select('initial_cash, opened_at')
        .eq('user_id', cierre.user_id)
        .lte('opened_at', cierre.closed_at)
        .order('opened_at', { ascending: false })
        .limit(1)
        .single();

      // Contar ventas del período
      const { count } = await supabase
        .from('sales_orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', cierre.user_id)
        .gte('order_date', apertura?.opened_at || cierre.closed_at)
        .lte('order_date', cierre.closed_at);

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
  // Obtener cierre
  const { data: cierre, error: cierreError } = await supabase
    .from('cash_closures')
    .select(`
      id,
      user_id,
      closed_at,
      system_cash,
      system_qr,
      system_card,
      declared_cash,
      declared_qr,
      declared_card,
      cash_withdrawals,
      difference,
      notes
    `)
    .eq('id', cierreId)
    .single();

  if (cierreError) throw cierreError;
  if (!cierre) throw new Error('Cierre no encontrado');

  // Obtener usuario
  const { data: usuario } = await supabase
    .from('users')
    .select('first_name, last_name')
    .eq('id', cierre.user_id)
    .single();

  // Obtener apertura
  const { data: apertura } = await supabase
    .from('cash_openings')
    .select('initial_cash, opened_at')
    .eq('user_id', cierre.user_id)
    .lte('opened_at', cierre.closed_at)
    .order('opened_at', { ascending: false })
    .limit(1)
    .single();

  // ✅ ACTUALIZADO: Obtener pagos del período desde sales_order_payments
  // Esto soporta pagos mixtos correctamente
  const inicio = apertura?.opened_at || cierre.closed_at;
  const fin = cierre.closed_at;

  // Primero obtenemos las ventas del período
  const { data: ordenesDelPeriodo } = await supabase
    .from('sales_orders')
    .select('id')
    .eq('seller_id', cierre.user_id)
    .eq('status', 'completed')
    .gte('order_date', inicio)
    .lte('order_date', fin);

  const idsOrdenes = (ordenesDelPeriodo || []).map((o: any) => o.id);

  // Ahora obtenemos los pagos de esas órdenes
  let payments: any[] = [];
  if (idsOrdenes.length > 0) {
    const { data: paymentsData } = await supabase
      .from('sales_order_payments')
      .select('payment_method, amount, sales_order_id')
      .in('sales_order_id', idsOrdenes);
    
    payments = paymentsData || [];
  }

  // Agrupar pagos por método
  const ventasAgrupadas = {
    efectivo: { total: 0, count: 0 },
    qr: { total: 0, count: 0 },
    tarjeta: { total: 0, count: 0 }
  };

  // Contadores de órdenes únicas por método (para pagos mixtos)
  const ordenesContadas = {
    efectivo: new Set<string>(),
    qr: new Set<string>(),
    tarjeta: new Set<string>()
  };

  payments.forEach((pago: any) => {
    const metodo = pago.payment_method.toLowerCase();
    if (metodo === 'efectivo') {
      ventasAgrupadas.efectivo.total += Number(pago.amount);
      ordenesContadas.efectivo.add(pago.sales_order_id);
    } else if (metodo === 'qr') {
      ventasAgrupadas.qr.total += Number(pago.amount);
      ordenesContadas.qr.add(pago.sales_order_id);
    } else if (metodo === 'tarjeta') {
      ventasAgrupadas.tarjeta.total += Number(pago.amount);
      ordenesContadas.tarjeta.add(pago.sales_order_id);
    }
  });

  // Asignar counts (número de órdenes únicas que usaron cada método)
  ventasAgrupadas.efectivo.count = ordenesContadas.efectivo.size;
  ventasAgrupadas.qr.count = ordenesContadas.qr.size;
  ventasAgrupadas.tarjeta.count = ordenesContadas.tarjeta.size;

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