import { supabase } from './supabaseClient';

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
    .from('sales_orders')
    .select(`
      id, order_date, total_amount, payment_method,
      client:clients(business_name),
      seller:profiles(first_name),
      items:sales_order_items (
        quantity, unit_price,
        product:products(name),
        green:green_coffee_warehouse(name_ref)
      )
    `)
    .eq('organization_id', orgId)
    .gte('order_date', fechaInicio)
    .lte('order_date', fechaFin)
    .order('order_date', { ascending: false });

  if (error) throw error;

  let reportePlano: ReporteItem[] = [];

  (data || []).forEach((orden: any) => {
    orden.items.forEach((item: any) => {
      reportePlano.push({
        fecha: new Date(orden.order_date).toLocaleDateString(),
        hora: new Date(orden.order_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cliente: orden.client?.business_name || 'Consumidor Final',
        vendedor: orden.seller?.first_name || 'Sistema',
        metodo_pago: orden.payment_method || 'Efectivo',
        producto: item.product?.name || item.green?.name_ref || 'Desconocido',
        cantidad: item.quantity,
        precio_unitario: item.unit_price,
        subtotal: item.quantity * item.unit_price
      });
    });
  });

  return reportePlano;
};

// ========================================
// NUEVAS FUNCIONES DE REPORTES AVANZADOS
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
 * Obtener reporte de ventas dinámico usando función SQL
 */
export const getSalesReport = async (
  orgId: string,
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'month' | 'product' = 'month'
): Promise<SalesReportRow[]> => {
  const { data, error } = await supabase.rpc('get_sales_report', {
    p_org_id: orgId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_group_by: groupBy
  });

  if (error) throw error;
  return data || [];
};

/**
 * Obtener top productos más vendidos
 */
export const getTopProducts = async (
  orgId: string,
  limit: number = 10,
  days: number = 30
): Promise<TopProduct[]> => {
  const { data, error } = await supabase.rpc('get_top_products', {
    p_org_id: orgId,
    p_limit: limit,
    p_days: days
  });

  if (error) throw error;
  return data || [];
};

/**
 * Obtener tendencias de un producto específico
 */
export const getProductTrends = async (
  orgId: string,
  productId: string,
  months: number = 12
): Promise<ProductTrend[]> => {
  const { data, error } = await supabase.rpc('get_product_trends', {
    p_org_id: orgId,
    p_product_id: productId,
    p_months: months
  });

  if (error) throw error;
  return data || [];
};

/**
 * Obtener análisis estacional de productos
 */
export const getProductSeasonality = async (
  orgId: string,
  productId?: string
): Promise<ProductSeasonality[]> => {
  let query = supabase
    .from('v_product_seasonality')
    .select('*')
    .eq('organization_id', orgId);

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query.order('month_number');

  if (error) throw error;
  return data || [];
};

/**
 * Obtener comparativo financiero
 */
export const getFinancialComparison = async (
  orgId: string,
  months: number = 12
): Promise<FinancialComparison[]> => {
  const { data, error } = await supabase
    .from('v_financial_comparison')
    .select('*')
    .eq('organization_id', orgId)
    .order('month', { ascending: false })
    .limit(months);

  if (error) throw error;
  return data || [];
};