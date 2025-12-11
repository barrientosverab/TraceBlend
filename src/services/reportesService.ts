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
        hora: new Date(orden.order_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
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