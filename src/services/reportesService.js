import { supabase } from './supabaseClient';

export const getReporteVentas = async (fechaInicio, fechaFin, orgId) => {
  // Traemos las órdenes con sus items, clientes y vendedores
  const { data, error } = await supabase
    .from('sales_orders')
    .select(`
      id,
      order_date,
      total_amount,
      client:clients(business_name),
      seller:profiles(first_name),
      items:sales_order_items (
        quantity,
        unit_price,
        product:products(name),
        green:green_coffee_warehouse(name_ref)
      )
    `)
    .eq('organization_id', orgId)
    .gte('order_date', fechaInicio)
    .lte('order_date', fechaFin)
    .order('order_date', { ascending: false });

  if (error) throw error;

  // "Aplanamos" la data: convertimos la estructura jerárquica en una lista plana para Excel
  let reportePlano = [];

  data.forEach(orden => {
    orden.items.forEach(item => {
      reportePlano.push({
        fecha: new Date(orden.order_date).toLocaleDateString(),
        cliente: orden.client?.business_name || 'Consumidor Final',
        vendedor: orden.seller?.first_name || 'Sistema',
        producto: item.product?.name || item.green?.name_ref || 'Desconocido',
        cantidad: item.quantity,
        precio_unitario: item.unit_price,
        subtotal: item.quantity * item.unit_price
      });
    });
  });

  return reportePlano;
};