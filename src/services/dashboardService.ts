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

  // CORRECCIÓN 1: Verificamos que 'v.order_date' exista (&&) antes de usar .startsWith
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

  // 3. ALERTAS DE STOCK
  const { data: insumosBajos } = await supabase
    .from('supplies_inventory')
    .select('name, current_stock, unit_measure')
    .eq('organization_id', orgId)
    .lt('current_stock', 10)
    .limit(5);

  const { data: prodBajos } = await supabase
    .from('finished_inventory')
    .select('current_stock, products(name)')
    .eq('organization_id', orgId)
    .lt('current_stock', 5)
    .limit(5);

  const alertas = [
    ...(insumosBajos || []).map(i => ({ 
      tipo: 'insumo', 
      msg: `${i.name} bajo (${i.current_stock} ${i.unit_measure})` 
    })),
    // CORRECCIÓN 2: Usamos p.products?.name (el signo ? evita el error si es null)
    // Además agregamos || 'Producto' por si el nombre viniera vacío.
    ...(prodBajos || []).map(p => ({ 
      tipo: 'producto', 
      msg: `${p.products?.name || 'Producto'} bajo (${p.current_stock} und)` 
    }))
  ];

  // 4. CÁLCULOS FINALES
  const metaDiaria = metaGastosFijos / 30; 
  const progreso = metaDiaria > 0 ? (totalVentasHoy / metaDiaria) * 100 : 0;

  return {
    ventasHoy: totalVentasHoy,
    ventasMes: totalVentasMes,
    gastosMes: totalGastosReales,
    transaccionesHoy: transacciones,
    ticketPromedio: transacciones > 0 ? totalVentasHoy / transacciones : 0,
    alertasStock: alertas,
    actividadReciente: [],
    progresoMeta: Math.min(progreso, 100)
  };
};