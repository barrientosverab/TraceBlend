import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos para los reportes
interface SalesReportRow {
  label: string;
  total_orders: number;
  total_revenue: number;
  avg_ticket: number;
}

interface ProductReportRow {
  rank: number;
  product_name: string;
  category: string;
  quantity_sold: number;
  revenue: number;
  times_ordered: number;
}

interface ExpenseReportRow {
  month_label: string;
  revenue: number;
  expenses: number;
  net_profit: number;
  profit_margin_percentage: number;
}

interface DailySaleItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface DailySale {
  sale_number: string;
  created_at: string;
  payment_method: string;
  total_amount: number;
  items: DailySaleItem[];
}

/**
 * Exportar reporte de ventas a PDF
 */
export const exportarReporteVentasAPDF = (
  datos: SalesReportRow[],
  fechaInicio: string,
  fechaFin: string
) => {
  const pdf = new jsPDF();

  // Header con fondo de color
  pdf.setFillColor(16, 185, 129);
  pdf.rect(0, 0, 210, 35, 'F');
  
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('📊 REPORTE DE VENTAS', 105, 15, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Período: ${format(new Date(fechaInicio), 'dd/MM/yyyy', { locale: es })} - ${format(new Date(fechaFin), 'dd/MM/yyyy', { locale: es })}`,
    105,
    25,
    { align: 'center' }
  );
  
  pdf.setTextColor(0, 0, 0);

  // Calcular totales
  const totalOrdenes = datos.reduce((sum, d) => sum + Number(d.total_orders), 0);
  const totalIngresos = datos.reduce((sum, d) => sum + Number(d.total_revenue), 0);
  const promedioTicket = totalOrdenes > 0 ? totalIngresos / totalOrdenes : 0;

  // Resumen destacado con cajas de colores
  let yPos = 45;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text('💰 Resumen del Período', 14, yPos);
  yPos += 10;

  // Caja destacada para métricas principales
  const boxWidth = 60;
  const boxHeight = 25;
  const spacing = 2;
  
  // Total Órdenes
  pdf.setFillColor(239, 246, 255);
  pdf.rect(14, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Total de Órdenes', 14 + boxWidth/2, yPos + 8, { align: 'center' });
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(59, 130, 246);
  pdf.text(totalOrdenes.toLocaleString('es-BO'), 14 + boxWidth/2, yPos + 20, { align: 'center' });

  // Ingresos Totales
  pdf.setFillColor(236, 253, 245);
  pdf.rect(14 + boxWidth + spacing, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Ingresos Totales', 14 + boxWidth + spacing + boxWidth/2, yPos + 8, { align: 'center' });
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(16, 185, 129);
  pdf.text(`Bs ${totalIngresos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14 + boxWidth + spacing + boxWidth/2, yPos + 20, { align: 'center' });

  // Ticket Promedio
  pdf.setFillColor(254, 249, 235);
  pdf.rect(14 + (boxWidth + spacing) * 2, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Ticket Promedio', 14 + (boxWidth + spacing) * 2 + boxWidth/2, yPos + 8, { align: 'center' });
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(245, 158, 11);
  pdf.text(`Bs ${promedioTicket.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14 + (boxWidth + spacing) * 2 + boxWidth/2, yPos + 20, { align: 'center' });

  yPos += boxHeight + 15;
  
  pdf.setTextColor(0, 0, 0);

  // Línea separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(14, yPos, 196, yPos);
  yPos += 10;

  // Detalle por período
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📈 Detalle por Período', 14, yPos);
  yPos += 2;

  const tableData = datos.map((d) => [
    d.label,
    d.total_orders.toLocaleString('es-BO'),
    `Bs ${Number(d.total_revenue).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `Bs ${Number(d.avg_ticket).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ]);

  autoTable(pdf, {
    startY: yPos,
    head: [['Período', 'Cant. Órdenes', 'Ingresos Totales', 'Ticket Promedio']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [16, 185, 129],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
      3: { halign: 'right' }
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [249, 250, 251] }
  });

  // Footer
  agregarFooter(pdf);

  // Guardar
  const fileName = `Reporte_Ventas_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  pdf.save(fileName);
};

/**
 * Exportar reporte de productos a PDF
 */
export const exportarReporteProductosAPDF = (datos: ProductReportRow[]) => {
  const pdf = new jsPDF();

  // Header con fondo de color
  pdf.setFillColor(139, 92, 246);
  pdf.rect(0, 0, 210, 35, 'F');
  
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('🏆 TOP PRODUCTOS MÁS VENDIDOS', 105, 15, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
    105,
    25,
    { align: 'center' }
  );
  
  pdf.setTextColor(0, 0, 0);

  // Calcular totales
  const totalVendidos = datos.reduce((sum, d) => sum + Number(d.quantity_sold), 0);
  const totalIngresos = datos.reduce((sum, d) => sum + Number(d.revenue), 0);
  const totalPedidos = datos.reduce((sum, d) => sum + Number(d.times_ordered), 0);

  // Resumen destacado
  let yPos = 45;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📊 Resumen de Ventas', 14, yPos);
  yPos += 10;

  const boxWidth = 60;
  const boxHeight = 25;
  const spacing = 2;
  
  // Total Productos Vendidos
  pdf.setFillColor(254, 243, 199);
  pdf.rect(14, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Unidades Vendidas', 14 + boxWidth/2, yPos + 8, { align: 'center' });
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(245, 158, 11);
  pdf.text(totalVendidos.toLocaleString('es-BO'), 14 + boxWidth/2, yPos + 20, { align: 'center' });

  // Total Ingresos
  pdf.setFillColor(236, 253, 245);
  pdf.rect(14 + boxWidth + spacing, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Ingresos Generados', 14 + boxWidth + spacing + boxWidth/2, yPos + 8, { align: 'center' });
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(16, 185, 129);
  pdf.text(`Bs ${totalIngresos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14 + boxWidth + spacing + boxWidth/2, yPos + 20, { align: 'center' });

  // Total Pedidos
  pdf.setFillColor(239, 246, 255);
  pdf.rect(14 + (boxWidth + spacing) * 2, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Total de Pedidos', 14 + (boxWidth + spacing) * 2 + boxWidth/2, yPos + 8, { align: 'center' });
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(59, 130, 246);
  pdf.text(totalPedidos.toLocaleString('es-BO'), 14 + (boxWidth + spacing) * 2 + boxWidth/2, yPos + 20, { align: 'center' });

  yPos += boxHeight + 15;
  pdf.setTextColor(0, 0, 0);

  // Línea separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(14, yPos, 196, yPos);
  yPos += 10;

  // Tabla de productos
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('🥇 Ranking de Productos', 14, yPos);
  yPos += 2;

  const tableData = datos.map((d, index) => {
    // Emoji para top 3
    const rankDisplay = index === 0 ? '🥇 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : d.rank.toString();
    return [
      rankDisplay,
      d.product_name,
      d.category || '-',
      d.quantity_sold.toLocaleString('es-BO'),
      `Bs ${Number(d.revenue).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      d.times_ordered.toLocaleString('es-BO'),
    ];
  });

  autoTable(pdf, {
    startY: yPos,
    head: [['#', 'Producto', 'Categoría', 'Unidades', 'Ingresos', 'Pedidos']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [139, 92, 246],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', fontStyle: 'bold' },
      1: { fontStyle: 'bold', halign: 'left' },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
      5: { halign: 'center' }
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [249, 250, 251] }
  });

  // Footer
  agregarFooter(pdf);

  // Guardar
  const fileName = `Reporte_Productos_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  pdf.save(fileName);
};

/**
 * Exportar reporte de gastos/financiero a PDF
 */
export const exportarReporteGastosAPDF = (datos: ExpenseReportRow[]) => {
  const pdf = new jsPDF();

  // Header con fondo de color
  pdf.setFillColor(234, 88, 12);
  pdf.rect(0, 0, 210, 35, 'F');
  
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('💼 COMPARATIVO FINANCIERO', 105, 15, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
    105,
    25,
    { align: 'center' }
  );
  
  pdf.setTextColor(0, 0, 0);

  // Calcular totales
  const totalIngresos = datos.reduce((sum, d) => sum + Number(d.revenue), 0);
  const totalGastos = datos.reduce((sum, d) => sum + Number(d.expenses), 0);
  const gananciaNeta = totalIngresos - totalGastos;
  const margenPromedio = totalIngresos > 0 ? (gananciaNeta / totalIngresos) * 100 : 0;

  // Resumen destacado
  let yPos = 45;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('💰 Resumen Financiero', 14, yPos);
  yPos += 10;

  const boxWidth = 45;
  const boxHeight = 25;
  const spacing = 2;
  
  // Ingresos Totales
  pdf.setFillColor(236, 253, 245);
  pdf.rect(14, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Ingresos', 14 + boxWidth/2, yPos + 7, { align: 'center' });
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(16, 185, 129);
  pdf.text(`Bs ${totalIngresos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14 + boxWidth/2, yPos + 20, { align: 'center' });

  // Gastos Totales
  pdf.setFillColor(254, 242, 242);
  pdf.rect(14 + boxWidth + spacing, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Gastos', 14 + boxWidth + spacing + boxWidth/2, yPos + 7, { align: 'center' });
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(220, 38, 38);
  pdf.text(`Bs ${totalGastos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14 + boxWidth + spacing + boxWidth/2, yPos + 20, { align: 'center' });

  // Ganancia Neta
  const gananciaColor = gananciaNeta >= 0 ? [16, 185, 129] : [220, 38, 38];
  const gananciaBg = gananciaNeta >= 0 ? [240, 253, 244] : [254, 242, 242];
  pdf.setFillColor(gananciaBg[0], gananciaBg[1], gananciaBg[2]);
  pdf.rect(14 + (boxWidth + spacing) * 2, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Ganancia', 14 + (boxWidth + spacing) * 2 + boxWidth/2, yPos + 7, { align: 'center' });
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(gananciaColor[0], gananciaColor[1], gananciaColor[2]);
  pdf.text(`Bs ${gananciaNeta.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14 + (boxWidth + spacing) * 2 + boxWidth/2, yPos + 20, { align: 'center' });

  // Margen Promedio
  pdf.setFillColor(239, 246, 255);
  pdf.rect(14 + (boxWidth + spacing) * 3, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Margen %', 14 + (boxWidth + spacing) * 3 + boxWidth/2, yPos + 7, { align: 'center' });
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(59, 130, 246);
  pdf.text(`${margenPromedio.toFixed(2)}%`, 14 + (boxWidth + spacing) * 3 + boxWidth/2, yPos + 20, { align: 'center' });

  yPos += boxHeight + 15;
  pdf.setTextColor(0, 0, 0);

  // Línea separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(14, yPos, 196, yPos);
  yPos += 10;

  // Detalle mensual
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📅 Detalle Mensual', 14, yPos);
  yPos += 2;

  const tableData = datos.map((d) => {
    const ganancia = Number(d.net_profit);
    return [
      d.month_label,
      `Bs ${Number(d.revenue).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Bs ${Number(d.expenses).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Bs ${ganancia.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${Number(d.profit_margin_percentage).toFixed(2)}%`,
    ];
  });

  autoTable(pdf, {
    startY: yPos,
    head: [['Mes', 'Ingresos', 'Gastos', 'Ganancia Neta', 'Margen %']],
    body: tableData,
    theme: 'striped',
    headStyles: { 
      fillColor: [234, 88, 12],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { halign: 'right', textColor: [16, 185, 129] },
      2: { halign: 'right', textColor: [220, 38, 38] },
      3: { halign: 'right', fontStyle: 'bold' },
      4: { halign: 'center' }
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    didParseCell: function(data) {
      // Colorear ganancias positivas en verde y negativas en rojo
      if (data.column.index === 3 && data.section === 'body') {
        const valor = data.cell.text[0];
        if (valor.includes('-')) {
          data.cell.styles.textColor = [220, 38, 38];
        } else {
          data.cell.styles.textColor = [16, 185, 129];
        }
      }
    }
  });

  // Footer
  agregarFooter(pdf);

  // Guardar
  const fileName = `Reporte_Financiero_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
  pdf.save(fileName);
};

/**
 * Exportar reporte de ventas del día a PDF
 */
export const exportarReporteVentasDiaAPDF = (
  ventas: DailySale[],
  fecha: string,
  totalVentas: number,
  totalTransacciones: number,
  ticketPromedio: number,
  totalProductos: number,
  ventasPorMetodo: Record<string, number>
) => {
  const pdf = new jsPDF();

  // Header con fondo de color
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, 210, 35, 'F');
  
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('🛒 REPORTE DE VENTAS DEL DÍA', 105, 15, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  const fechaFormateada = format(new Date(fecha), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
  pdf.text(
    fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1),
    105,
    25,
    { align: 'center' }
  );
  
  pdf.setTextColor(0, 0, 0);

  // Resumen destacado con cajas de colores
  let yPos = 45;
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📊 Resumen del Día', 14, yPos);
  yPos += 10;

  const boxWidth = 45;
  const boxHeight = 25;
  const spacing = 2;
  
  // Total Ventas
  pdf.setFillColor(236, 253, 245);
  pdf.rect(14, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Total Ventas', 14 + boxWidth/2, yPos + 7, { align: 'center' });
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(16, 185, 129);
  pdf.text(`Bs ${totalVentas.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14 + boxWidth/2, yPos + 20, { align: 'center' });

  // Transacciones
  pdf.setFillColor(239, 246, 255);
  pdf.rect(14 + boxWidth + spacing, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Transacciones', 14 + boxWidth + spacing + boxWidth/2, yPos + 7, { align: 'center' });
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(59, 130, 246);
  pdf.text(totalTransacciones.toString(), 14 + boxWidth + spacing + boxWidth/2, yPos + 20, { align: 'center' });

  // Ticket Promedio
  pdf.setFillColor(254, 249, 235);
  pdf.rect(14 + (boxWidth + spacing) * 2, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Ticket Prom.', 14 + (boxWidth + spacing) * 2 + boxWidth/2, yPos + 7, { align: 'center' });
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(245, 158, 11);
  pdf.text(`Bs ${ticketPromedio.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 14 + (boxWidth + spacing) * 2 + boxWidth/2, yPos + 20, { align: 'center' });

  // Productos Vendidos
  pdf.setFillColor(243, 232, 255);
  pdf.rect(14 + (boxWidth + spacing) * 3, yPos, boxWidth, boxHeight, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Productos', 14 + (boxWidth + spacing) * 3 + boxWidth/2, yPos + 7, { align: 'center' });
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(139, 92, 246);
  pdf.text(totalProductos.toString(), 14 + (boxWidth + spacing) * 3 + boxWidth/2, yPos + 20, { align: 'center' });

  yPos += boxHeight + 15;
  pdf.setTextColor(0, 0, 0);

  // Línea separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(14, yPos, 196, yPos);
  yPos += 10;

  // Ventas por método de pago
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('💳 Métodos de Pago', 14, yPos);
  yPos += 2;

  const metodosPagoData = Object.entries(ventasPorMetodo).map(([metodo, total]) => {
    // Iconos para métodos de pago
    const iconos: Record<string, string> = {
      'Efectivo': '💵',
      'Tarjeta': '💳',
      'QR': '📱',
      'Transferencia': '🏦'
    };
    const icono = iconos[metodo] || '💰';
    return [
      `${icono} ${metodo}`,
      `Bs ${Number(total).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ];
  });

  autoTable(pdf, {
    startY: yPos,
    head: [['Método de Pago', 'Total']],
    body: metodosPagoData,
    theme: 'grid',
    headStyles: { 
      fillColor: [59, 130, 246],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'left' },
      1: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], fontSize: 11 }
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [249, 250, 251] }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yPos = (pdf as any).lastAutoTable.finalY + 15;

  // Verificar si necesitamos nueva página
  if (yPos > 240) {
    pdf.addPage();
    yPos = 20;
  }

  // Línea separadora
  pdf.setDrawColor(200, 200, 200);
  pdf.line(14, yPos, 196, yPos);
  yPos += 10;

  // Detalle de transacciones
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('📋 Detalle de Transacciones', 14, yPos);
  yPos += 2;

  const transaccionesData = ventas.map((venta) => {
    const hora = format(new Date(venta.created_at), 'HH:mm');
    const productos = venta.items
      .map((item) => `${item.quantity}x ${item.product_name}`)
      .join(', ');
    
    // Iconos para métodos
    const iconoMetodo: Record<string, string> = {
      'Efectivo': '💵',
      'Tarjeta': '💳',
      'QR': '📱'
    };
    const metodoDisplay = iconoMetodo[venta.payment_method || 'Efectivo'] || '💰';
    
    return [
      venta.sale_number,
      hora,
      productos.substring(0, 35) + (productos.length > 35 ? '...' : ''),
      metodoDisplay,
      `Bs ${venta.total_amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ];
  });

  autoTable(pdf, {
    startY: yPos,
    head: [['Nro. Venta', 'Hora', 'Productos', 'Pago', 'Total']],
    body: transaccionesData,
    theme: 'striped',
    headStyles: { 
      fillColor: [59, 130, 246],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { fontStyle: 'bold', halign: 'center', fontSize: 8 },
      1: { halign: 'center', fontSize: 8 },
      2: { halign: 'left', fontSize: 7 },
      3: { halign: 'center', fontSize: 9 },
      4: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129], fontSize: 9 }
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [249, 250, 251] }
  });

  // Footer
  agregarFooter(pdf);

  // Guardar
  const fileName = `Reporte_Ventas_Dia_${format(new Date(fecha), 'yyyyMMdd')}.pdf`;
  pdf.save(fileName);
};

/**
 * Agregar footer a todas las páginas del PDF
 */
function agregarFooter(pdf: jsPDF) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pageCount = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    pdf.text(
      `Página ${i} de ${pageCount} • Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      105,
      285,
      { align: 'center' }
    );
  }
}
