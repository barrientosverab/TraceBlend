import { supabase } from './supabaseClient';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from '../types/payments';

export interface ReporteItem {
  fecha: string;
  hora: string;
  cliente: string;
  vendedor: string;
  metodo_pago: string;
  producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export const getReporteVentas = async (fechaInicio: string, fechaFin: string, orgId: string): Promise<ReporteItem[]> => {
  const { data, error } = await supabase
    .from('sales')
    .select(`
      id, created_at, total_amount,
      customer:customers(business_name),
      seller:profiles(first_name),
      items:sale_items (
        quantity, unit_price,
        product:products(name)
      ),
      payments:sale_payments(payment_method, amount)
    `)
    .eq('organization_id', orgId)
    .eq('status', 'completed')
    .gte('created_at', fechaInicio)
    .lte('created_at', fechaFin)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const reportePlano: ReporteItem[] = [];

  (data || []).forEach((orden: any) => {
    // Determinar método de pago principal
    const primaryPayment = orden.payments?.[0]?.payment_method || 'cash';
    const metodoLabel = PAYMENT_METHOD_LABELS[primaryPayment as PaymentMethod] || primaryPayment;

    orden.items.forEach((item: any) => {
      reportePlano.push({
        fecha: new Date(orden.created_at).toLocaleDateString(),
        hora: new Date(orden.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cliente: orden.customer?.business_name || 'Consumidor Final',
        vendedor: orden.seller?.first_name || 'Sistema',
        metodo_pago: metodoLabel,
        producto: item.product?.name || 'Desconocido',
        cantidad: item.quantity,
        precio_unitario: item.unit_price,
        subtotal: item.quantity * item.unit_price
      });
    });
  });

  return reportePlano;
};

// ========================================
// REPORTES AVANZADOS
// ========================================

export interface SalesReportRow {
  period: string;
  label: string;
  total_orders: number;
  total_revenue: number;
  avg_ticket: number;
}

export interface TopProduct {
  rank: number;
  product_id: string;
  product_name: string;
  category: string;
  quantity_sold: number;
  revenue: number;
  times_ordered: number;
}

export interface ProductTrend {
  month: string;
  month_label: string;
  quantity_sold: number;
  revenue: number;
  order_count: number;
  growth_rate: number;
}

export interface ProductSeasonality {
  product_id: string;
  product_name: string;
  category: string;
  month_number: number;
  month_name: string;
  quarter: number;
  quantity_sold: number;
  revenue: number;
}

export interface FinancialComparison {
  month: string;
  month_label: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  profit_margin_percentage: number;
}

/**
 * Reporte de ventas (usa RPC si existe, o fallback a query directa)
 */
export const getSalesReport = async (
  orgId: string,
  startDate: string,
  endDate: string,
  _groupBy: 'day' | 'month' | 'product' = 'month'
): Promise<SalesReportRow[]> => {
  // Fallback: query directa agrupando manualmente
  const { data, error } = await supabase
    .from('sales')
    .select('total_amount, created_at')
    .eq('organization_id', orgId)
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at');

  if (error) throw error;

  // Agrupar por mes
  const grouped: Record<string, { total: number; count: number }> = {};
  (data || []).forEach(s => {
    const period = s.created_at.substring(0, 7);
    if (!grouped[period]) grouped[period] = { total: 0, count: 0 };
    grouped[period].total += s.total_amount;
    grouped[period].count += 1;
  });

  return Object.entries(grouped).map(([period, vals]) => ({
    period,
    label: period,
    total_orders: vals.count,
    total_revenue: vals.total,
    avg_ticket: vals.count > 0 ? vals.total / vals.count : 0
  }));
};

/**
 * Top productos más vendidos
 */
export const getTopProducts = async (
  orgId: string,
  limit: number = 10,
  days: number = 30
): Promise<TopProduct[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('sale_items')
    .select(`
      quantity, unit_price, product_id,
      products!inner (name, organization_id)
    `)
    .eq('products.organization_id', orgId)
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  // Agrupar por producto
  const productMap: Record<string, { name: string; qty: number; revenue: number; orders: number }> = {};
  (data || []).forEach((item: any) => {
    const pid = item.product_id;
    if (!productMap[pid]) {
      productMap[pid] = { name: item.products?.name || 'Desconocido', qty: 0, revenue: 0, orders: 0 };
    }
    productMap[pid].qty += item.quantity;
    productMap[pid].revenue += item.quantity * item.unit_price;
    productMap[pid].orders += 1;
  });

  return Object.entries(productMap)
    .map(([id, vals], _idx) => ({
      rank: 0,
      product_id: id,
      product_name: vals.name,
      category: '',
      quantity_sold: vals.qty,
      revenue: vals.revenue,
      times_ordered: vals.orders
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((p, idx) => ({ ...p, rank: idx + 1 }));
};

/**
 * Tendencias de un producto específico
 */
export const getProductTrends = async (
  _orgId: string,
  productId: string,
  months: number = 12
): Promise<ProductTrend[]> => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from('sale_items')
    .select('quantity, unit_price, created_at')
    .eq('product_id', productId)
    .gte('created_at', startDate.toISOString());

  if (error) throw error;

  const monthlyData: Record<string, { qty: number; revenue: number; count: number }> = {};
  (data || []).forEach(item => {
    const month = item.created_at.substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { qty: 0, revenue: 0, count: 0 };
    monthlyData[month].qty += item.quantity;
    monthlyData[month].revenue += item.quantity * item.unit_price;
    monthlyData[month].count += 1;
  });

  const sorted = Object.entries(monthlyData).sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([month, vals], idx) => ({
    month,
    month_label: month,
    quantity_sold: vals.qty,
    revenue: vals.revenue,
    order_count: vals.count,
    growth_rate: idx > 0
      ? ((vals.revenue - sorted[idx - 1][1].revenue) / (sorted[idx - 1][1].revenue || 1)) * 100
      : 0
  }));
};

/**
 * Análisis estacional (placeholder — requiere vista o datos históricos)
 */
export const getProductSeasonality = async (
  _orgId: string,
  _productId?: string
): Promise<ProductSeasonality[]> => {
  // TODO: Crear vista v_product_seasonality cuando haya datos históricos suficientes
  return [];
};

/**
 * Comparativo financiero (placeholder — usar getHistoricalFinancials de gastosService)
 */
export const getFinancialComparison = async (
  _orgId: string,
  _months: number = 12
): Promise<FinancialComparison[]> => {
  // TODO: Crear vista v_financial_comparison
  return [];
};