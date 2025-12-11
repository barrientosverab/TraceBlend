import { supabase } from './supabaseClient';

export interface DashboardStats {
  ventas_mes: number;
  stock_verde: number;
  stock_producto: number;
  lotes_pendientes: number;
}

export const getDashboardStats = async (orgId: string): Promise<DashboardStats> => {
  if (!orgId) throw new Error("OrgID requerido");
  
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  // 1. Ventas
  const { data: ventas } = await supabase
    .from('sales_orders')
    .select('total_amount')
    .eq('organization_id', orgId)
    .gte('order_date', firstDayOfMonth);
  const totalVentasMes = ventas?.reduce((sum, v) => sum + v.total_amount, 0) || 0;

  // 2. Verde
  const { data: verde } = await supabase
    .from('green_coffee_warehouse')
    .select('quantity_kg')
    .eq('organization_id', orgId)
    .eq('is_available', true);
  const stockVerdeKg = verde?.reduce((sum, v) => sum + v.quantity_kg, 0) || 0;

  // 3. Producto
  const { data: producto } = await supabase
    .from('finished_inventory')
    .select('current_stock')
    .eq('organization_id', orgId);
  const stockProductoUnidades = producto?.reduce((sum, p) => sum + (p.current_stock || 0), 0) || 0;

  // 4. Pendientes
  const { count } = await supabase
    .from('raw_inventory_batches')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gt('current_quantity', 0);

  return {
    ventas_mes: totalVentasMes,
    stock_verde: stockVerdeKg,
    stock_producto: stockProductoUnidades,
    lotes_pendientes: count || 0
  };
};

export const getActividadReciente = async (orgId: string) => {
  // Nota: Asegúrate de que la vista 'recent_activity_view' exista en supabase.ts
  // Si no existe en los tipos generados, usa 'as any' en .from('recent_activity_view')
  const { data, error } = await (supabase as any)
    .from('recent_activity_view')
    .select('*')
    .eq('organization_id', orgId)
    .order('activity_date', { ascending: false })
    .limit(10);

  if (error) throw error;

  return (data || []).map((item: any) => ({
    id: item.id,
    fecha: item.activity_date,
    tipo: item.activity_type,
    texto: item.description 
  }));
};