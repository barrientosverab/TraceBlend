import { supabase } from './supabaseClient';

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────

export interface ResumenCaja {
  session_id: string;
  opening: number;
  system_cash: number;
  system_qr: number;
  system_card: number;
  opened_at: string;
}

export interface CierreData {
  session_id: string;
  closing_cash: number;
  closing_qr: number;
  closing_card: number;
  note?: string;
}

export interface ResultadoCierre {
  success: boolean;
  session_id: string;
  opening: number;
  closing_cash: number;
  closing_qr: number;
  closing_card: number;
  system_cash: number;
  system_qr: number;
  system_card: number;
  diff_cash: number;
  diff_qr: number;
  diff_card: number;
  closed_at: string;
}

export interface CierreHistorico {
  id: string;
  profile_id: string;
  user_name: string;
  branch_id: string;
  opening: number;
  closing_cash: number;
  closing_qr: number;
  closing_card: number;
  system_cash: number;
  system_qr: number;
  system_card: number;
  note: string | null;
  created_at: string;
  closed_at: string | null;
  status: 'open' | 'closed';
}

// ─────────────────────────────────────────────
// APERTURA DE CAJA
// ─────────────────────────────────────────────

export const registrarApertura = async (
  montoInicial: number,
  branchId: string,
  profileId: string
) => {
  const { data, error } = await supabase
    .from('cash_register_sessions')
    .insert([{
      branch_id: branchId,
      profile_id: profileId,
      opening: montoInicial,
      status: 'open',
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ─────────────────────────────────────────────
// VERIFICAR ESTADO DE CAJA
// ─────────────────────────────────────────────

export const verificarEstadoCaja = async (
  profileId: string
): Promise<{ status: 'open' | 'closed'; session_id?: string; opening?: number; opened_at?: string }> => {
  const { data, error } = await supabase
    .from('cash_register_sessions')
    .select('id, opening, created_at, status')
    .eq('profile_id', profileId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle(); // No lanza error si no hay filas

  if (error) throw error;

  if (data) {
    return {
      status: 'open',
      session_id: data.id,
      opening: data.opening,
      opened_at: data.created_at,
    };
  }

  return { status: 'closed' };
};

// ─────────────────────────────────────────────
// RESUMEN DE CAJA ACTIVA (para pantalla de cierre)
// ─────────────────────────────────────────────

export const obtenerResumenCaja = async (
  branchId: string,
  profileId: string
): Promise<ResumenCaja | null> => {
  // 1. Verificar que hay sesión abierta
  const estado = await verificarEstadoCaja(profileId);
  if (estado.status !== 'open' || !estado.session_id) return null;

  // 2. Obtener ventas desde la apertura de esta sesión
  const { data: ventas } = await supabase
    .from('sales')
    .select('id')
    .eq('branch_id', branchId)
    .eq('profile_id', profileId)
    .gte('created_at', estado.opened_at!);

  const saleIds = (ventas || []).map((v: any) => v.id);

  // 3. Agrupar pagos por método
  let system_cash = 0;
  let system_qr = 0;
  let system_card = 0;

  if (saleIds.length > 0) {
    const { data: payments } = await supabase
      .from('sale_payments')
      .select('payment_method, amount')
      .in('sale_id', saleIds);

    (payments || []).forEach((p: any) => {
      switch (p.payment_method) {
        case 'cash':     system_cash  += Number(p.amount); break;
        case 'qr':       system_qr    += Number(p.amount); break;
        case 'card':     system_card  += Number(p.amount); break;
        case 'transfer': system_card  += Number(p.amount); break; // transfer va con card
      }
    });
  }

  return {
    session_id: estado.session_id,
    opening: estado.opening || 0,
    system_cash,
    system_qr,
    system_card,
    opened_at: estado.opened_at!,
  };
};

// ─────────────────────────────────────────────
// CIERRE DE CAJA — vía RPC
// ─────────────────────────────────────────────

export const registrarCierre = async (datos: CierreData): Promise<ResultadoCierre> => {
  const { data, error } = await supabase.rpc('close_register_session', {
    p_session_id:   datos.session_id,
    p_profile_id:   (await supabase.auth.getUser()).data.user?.id || '',
    p_closing_cash: datos.closing_cash,
    p_closing_qr:   datos.closing_qr,
    p_closing_card: datos.closing_card,
    p_note:         datos.note || undefined,
  });

  if (error) throw error;
  return data as unknown as ResultadoCierre;
};

// ─────────────────────────────────────────────
// HISTORIAL DE CIERRES
// ─────────────────────────────────────────────

export const getCierresHistorico = async (
  branchId: string,
  filtros?: { fechaDesde?: string; fechaHasta?: string; profileId?: string }
): Promise<CierreHistorico[]> => {
  let query = supabase
    .from('cash_register_sessions')
    .select(`
      id, profile_id, branch_id, status,
      opening, closing_cash, closing_qr, closing_card,
      system_cash, system_qr, system_card,
      note, created_at, closed_at,
      profiles (first_name, last_name)
    `)
    .eq('branch_id', branchId)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false });

  if (filtros?.fechaDesde) query = query.gte('closed_at', filtros.fechaDesde);
  if (filtros?.fechaHasta) query = query.lte('closed_at', filtros.fechaHasta);
  if (filtros?.profileId)  query = query.eq('profile_id', filtros.profileId);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((s: any) => ({
    id:           s.id,
    profile_id:   s.profile_id,
    user_name:    s.profiles
                    ? `${s.profiles.first_name} ${s.profiles.last_name}`
                    : 'Desconocido',
    branch_id:    s.branch_id,
    opening:      s.opening,
    closing_cash: s.closing_cash,
    closing_qr:   s.closing_qr,
    closing_card: s.closing_card,
    system_cash:  s.system_cash,
    system_qr:    s.system_qr,
    system_card:  s.system_card,
    note:         s.note,
    created_at:   s.created_at,
    closed_at:    s.closed_at,
    status:       s.status,
  }));
};

// ─────────────────────────────────────────────
// DETALLE DE CIERRE
// ─────────────────────────────────────────────

export interface DetalleCierre {
  cierre: {
    user_name: string;
    closed_at: string;
    created_at: string;
    opening: number;
    system_cash: number;
    closing_cash: number;
    note: string | null;
  };
  ventas: {
    cash: { total: number; count: number };
    qr: { total: number; count: number };
    card: { total: number; count: number };
  };
}

export const getDetalleCierre = async (cierreId: string): Promise<DetalleCierre> => {
  const { data: cierre, error } = await supabase
    .from('cash_register_sessions')
    .select(`
      *,
      profiles (first_name, last_name)
    `)
    .eq('id', cierreId)
    .single();

  if (error) throw error;

  return {
    cierre: {
      user_name: cierre.profiles ? `${(cierre.profiles as any).first_name} ${(cierre.profiles as any).last_name}` : 'Desconocido',
      closed_at: (cierre as any).closed_at || '',
      created_at: (cierre as any).created_at || '',
      opening: (cierre as any).opening || 0,
      system_cash: (cierre as any).system_cash || 0,
      closing_cash: (cierre as any).closing_cash || 0,
      note: (cierre as any).note || null,
    },
    ventas: {
      cash: { total: (cierre as any).system_cash || 0, count: 0 },
      qr: { total: (cierre as any).system_qr || 0, count: 0 },
      card: { total: (cierre as any).system_card || 0, count: 0 }
    }
  };
};