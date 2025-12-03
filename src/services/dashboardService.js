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

  // ESTRATEGIA REAL: Consultamos las 3 tablas principales en paralelo y las mezclamos en JS
  // (Hacer UNION en Supabase JS es complejo, esta es la forma eficiente en cliente)
  
  const [empaques, tuestes, ventas] = await Promise.all([
    supabase.from('packaging_logs').select('created_at, units_created, products(name)').eq('organization_id', orgId).limit(5).order('created_at', {ascending:false}),
    supabase.from('roast_batches').select('created_at, roasted_weight_output, machine_id').eq('organization_id', orgId).limit(5).order('created_at', {ascending:false}),
    supabase.from('sales_orders').select('order_date, total_amount, clients(business_name)').eq('organization_id', orgId).limit(5).order('order_date', {ascending:false})
  ]);

  // Normalizamos los datos
  const listaEmpaques = (empaques.data || []).map(x => ({
    fecha: new Date(x.created_at),
    tipo: 'empaque',
    texto: `Empacadas ${x.units_created} uds de ${x.products?.name}`
  }));

  const listaTuestes = (tuestes.data || []).map(x => ({
    fecha: new Date(x.created_at),
    tipo: 'tueste',
    texto: `Tostado de ${x.roasted_weight_output}kg finalizado`
  }));

  const listaVentas = (ventas.data || []).map(x => ({
    fecha: new Date(x.order_date),
    tipo: 'venta',
    texto: `Venta por Bs ${x.total_amount} a ${x.clients?.business_name || 'Cliente Final'}`
  }));

  // Unir, Ordenar por fecha descendente y tomar los últimos 10
  const mix = [...listaEmpaques, ...listaTuestes, ...listaVentas]
    .sort((a, b) => b.fecha - a.fecha)
    .slice(0, 10);

  return mix;
};