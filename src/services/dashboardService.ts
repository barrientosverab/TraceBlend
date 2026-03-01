import { supabase } from './supabaseClient';

export interface DashboardData {
  ventasHoy: number;
  gastosMes: number;
  ventasMes: number;
  transaccionesHoy: number;
  ticketPromedio: number;
  alertasStock: any[];
  actividadReciente: any[];
  progresoMeta: number;
}

export const getDashboardMetrics = async (orgId: string): Promise<DashboardData> => {
  const hoy = new Date().toISOString().split('T')[0];
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // 1. VENTAS (Hoy y Mes)
  const { data: ventas } = await supabase
    .from('sales_orders')
    .select('total_amount, order_date')
    .eq('organization_id', orgId)
    .gte('order_date', inicioMes);

  const ventasHoyArr = ventas?.filter(v => v.order_date && v.order_date.startsWith(hoy)) || [];

  const totalVentasHoy = ventasHoyArr.reduce((sum, v) => sum + v.total_amount, 0);
  const totalVentasMes = ventas?.reduce((sum, v) => sum + v.total_amount, 0) || 0;
  const transacciones = ventasHoyArr.length;

  // 2. GASTOS
  const { data: gastos } = await supabase
    .from('expense_ledger')
    .select('amount_paid')
    .eq('organization_id', orgId)
    .gte('payment_date', inicioMes);

  const totalGastosReales = gastos?.reduce((sum, g) => sum + g.amount_paid, 0) || 0;

  // Meta (Gastos Fijos)
  const { data: fijos } = await supabase.from('fixed_expenses').select('amount').eq('organization_id', orgId).eq('is_active', true);
  const metaGastosFijos = fijos?.reduce((sum, f) => sum + f.amount, 0) || 1000;

  // 3. ALERTAS DE STOCK — Usa vista vw_inventory_status para query consolidada
  const { data: stockAlerts } = await supabase
    .from('vw_inventory_status')
    .select('inventory_type, name, current_stock, unit_measure, stock_status')
    .eq('organization_id', orgId)
    .in('stock_status', ['critical', 'low'])
    .limit(10);

  const alertas = (stockAlerts || []).map(item => ({
    tipo: item.inventory_type === 'supply' ? 'insumo' : 'producto',
    msg: `${item.name} ${item.stock_status === 'critical' ? '⚠️ crítico' : 'bajo'} (${item.current_stock} ${item.unit_measure})`
  }));

  // 4. ACTIVIDAD RECIENTE — Usa vista vw_recent_activity
  const { data: recentActivity } = await supabase
    .from('vw_recent_activity')
    .select('activity_type, description, activity_date')
    .eq('organization_id', orgId)
    .order('activity_date', { ascending: false })
    .limit(8);

  // 5. CÁLCULOS FINALES
  const metaDiaria = metaGastosFijos / 30;
  const progreso = metaDiaria > 0 ? (totalVentasHoy / metaDiaria) * 100 : 0;

  return {
    ventasHoy: totalVentasHoy,
    ventasMes: totalVentasMes,
    gastosMes: totalGastosReales,
    transaccionesHoy: transacciones,
    ticketPromedio: transacciones > 0 ? totalVentasHoy / transacciones : 0,
    alertasStock: alertas,
    actividadReciente: recentActivity || [],
    progresoMeta: Math.min(progreso, 100)
  };
};