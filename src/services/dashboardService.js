import { supabase } from './supabaseClient';

export const getDashboardStats = async (orgId) => {
  if (!orgId) throw new Error("OrgID requerido para dashboard");
  
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  // Mantenemos las estadísticas agregadas (son ligeras)
  // 1. Ventas del Mes
  const { data: ventas } = await supabase
    .from('sales_orders')
    .select('total_amount')
    .eq('organization_id', orgId)
    .gte('order_date', firstDayOfMonth);
  
  const totalVentasMes = ventas?.reduce((sum, v) => sum + v.total_amount, 0) || 0;

  // 2. Stock Verde
  const { data: verde } = await supabase
    .from('green_coffee_warehouse')
    .select('quantity_kg')
    .eq('organization_id', orgId)
    .eq('is_available', true);
  
  const stockVerdeKg = verde?.reduce((sum, v) => sum + v.quantity_kg, 0) || 0;

  // 3. Stock Producto Terminado
  const { data: producto } = await supabase
    .from('finished_inventory')
    .select('current_stock')
    .eq('organization_id', orgId);
  
  const stockProductoUnidades = producto?.reduce((sum, p) => sum + p.current_stock, 0) || 0;

  // 4. Pendientes
  const { count: lotesPendientes } = await supabase
    .from('raw_inventory_batches')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gt('current_quantity', 0);

  return {
    ventas_mes: totalVentasMes,
    stock_verde: stockVerdeKg,
    stock_producto: stockProductoUnidades,
    lotes_pendientes: lotesPendientes || 0
  };
};

export const getActividadReciente = async (orgId) => {
  if (!orgId) throw new Error("OrgID requerido para actividad");

  // AHORA: Una sola consulta simple y paginada a la Vista SQL
  const { data, error } = await supabase
    .from('recent_activity_view') // <--- Nuestra nueva vista
    .select('*')
    .eq('organization_id', orgId)
    .order('activity_date', { ascending: false })
    .limit(10); // Paginación nativa de base de datos

  if (error) throw error;

  // Adaptador ligero para que el Frontend no se rompa
  return data.map(item => ({
    id: item.id,
    fecha: item.activity_date,
    tipo: item.activity_type,
    texto: item.description // Mapeamos la columna calculada SQL al nombre que espera la UI
  }));
};