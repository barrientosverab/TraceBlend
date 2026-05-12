import { supabase } from './supabaseClient';
import { calculateBreakEven } from './breakEvenService';export interface DashboardData {
  ventasHoy: number;
  gastosMes: number;
  ventasMes: number;
  transaccionesHoy: number;
  ticketPromedio: number;
  alertasStock: any[];
  actividadReciente: any[];
  progresoMeta: number;
  metaDiaria: number;
}

export const getDashboardMetrics = async (orgId: string): Promise<DashboardData> => {
  const hoy = new Date().toISOString().split('T')[0];
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // 1. VENTAS (Hoy y Mes)
  const { data: ventas } = await supabase
    .from('sales')
    .select('total_amount, created_at')
    .eq('organization_id', orgId)
    .eq('status', 'completed')
    .gte('created_at', inicioMes);

  const ventasHoyArr = ventas?.filter(v => v.created_at && v.created_at.startsWith(hoy)) || [];

  const totalVentasHoy = ventasHoyArr.reduce((sum, v) => sum + v.total_amount, 0);
  const totalVentasMes = ventas?.reduce((sum, v) => sum + v.total_amount, 0) || 0;
  const transacciones = ventasHoyArr.length;

  // 2. GASTOS (variables del mes)
  const { data: gastos } = await supabase
    .from('expenses')
    .select('amount')
    .eq('organization_id', orgId)
    .gte('payment_date', inicioMes);

  const totalGastosReales = gastos?.reduce((sum, g) => sum + g.amount, 0) || 0;

  // 3. GASTOS FIJOS: expenses con category type='fixed'
  const { data: gastosFijos } = await supabase
    .from('expenses')
    .select('amount, expense_categories!inner(type)')
    .eq('organization_id', orgId)
    .eq('expense_categories.type', 'fixed')
    .gte('payment_date', inicioMes);

  const metaGastosFijos = gastosFijos?.reduce((sum: number, f: any) => sum + f.amount, 0) || 1000;

  // 4. ALERTAS DE STOCK — usa supply_stock directamente
  const { data: stockAlerts } = await supabase
    .from('supply_stock')
    .select('quantity, min_stock, supplies!inner(name, unit_measure, organization_id)')
    .eq('supplies.organization_id', orgId)
    .limit(20);

  const alertas = (stockAlerts || [])
    .filter((item: any) => item.min_stock && item.quantity <= item.min_stock)
    .map((item: any) => ({
      tipo: 'insumo',
      msg: `${item.supplies?.name} ⚠️ stock bajo (${item.quantity} ${item.supplies?.unit_measure})`
    }))
    .slice(0, 10);

  // 5. ACTIVIDAD RECIENTE — últimas 8 ventas como aproximación
  const { data: recentSales } = await supabase
    .from('sales')
    .select('id, total_amount, created_at, status')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(8);

  const actividadReciente = (recentSales || []).map(s => ({
    activity_type: 'sale',
    description: `Venta por Bs ${s.total_amount.toFixed(2)}`,
    activity_date: s.created_at
  }));

  // 6. CÁLCULOS FINALES
  const breakEven = await calculateBreakEven(orgId);
  const metaDiaria = breakEven.metaVentasDia > 0 ? breakEven.metaVentasDia : (metaGastosFijos / 30);
  const progreso = metaDiaria > 0 ? (totalVentasHoy / metaDiaria) * 100 : 0;

  return {
    ventasHoy: totalVentasHoy,
    ventasMes: totalVentasMes,
    gastosMes: totalGastosReales,
    transaccionesHoy: transacciones,
    ticketPromedio: transacciones > 0 ? totalVentasHoy / transacciones : 0,
    alertasStock: alertas,
    actividadReciente,
    progresoMeta: Math.min(progreso, 100),
    metaDiaria: metaDiaria
  };
};