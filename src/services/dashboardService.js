import { supabase } from './supabaseClient';
import { getCurrentOrgId } from './authService';

export const getDashboardStats = async () => {
  const orgId = await getCurrentOrgId();
  
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  // 1. Total Ventas del Mes (Dinero)
  const { data: ventas } = await supabase
    .from('sales_orders')
    .select('total_amount')
    .eq('organization_id', orgId)
    .gte('order_date', firstDayOfMonth);
  
  const totalVentasMes = ventas?.reduce((sum, v) => sum + v.total_amount, 0) || 0;

  // 2. Inventario de Oro Verde (Materia Prima)
  const { data: verde } = await supabase
    .from('green_coffee_warehouse')
    .select('quantity_kg')
    .eq('organization_id', orgId)
    .eq('is_available', true);
  
  const stockVerdeKg = verde?.reduce((sum, v) => sum + v.quantity_kg, 0) || 0;

  // 3. Inventario de Producto Terminado (Bolsas)
  const { data: producto } = await supabase
    .from('finished_inventory')
    .select('current_stock')
    .eq('organization_id', orgId);
  
  const stockProductoUnidades = producto?.reduce((sum, p) => sum + p.current_stock, 0) || 0;

  // 4. Lotes en Proceso (Sin Trillar)
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

export const getActividadReciente = async () => {
  const orgId = await getCurrentOrgId();

  // Traemos los últimos 5 movimientos de empaque como "actividad de ejemplo"
  // (En un sistema real haríamos una union de varias tablas, pero esto basta por ahora)
  const { data } = await supabase
    .from('packaging_logs')
    .select(`
      packaging_date, 
      units_created,
      products ( name )
    `)
    .eq('organization_id', orgId)
    .order('packaging_date', { ascending: false })
    .limit(5);

  return data?.map(d => ({
    fecha: d.packaging_date,
    descripcion: `Empacadas ${d.units_created} uds de ${d.products?.name}`,
    tipo: 'produccion'
  })) || [];
};