import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportarExcel = async (data, fileName = 'Reporte') => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Movimientos");

  if (data.length > 0) {
    worksheet.columns = Object.keys(data[0]).map(key => ({
      header: key.toUpperCase().replace('_', ' '),
      key: key,
      width: key === 'producto' ? 30 : 15 // Ajuste de ancho para producto
    }));
  }

  worksheet.addRows(data);

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEEEEEE' }
  };
  
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
};

export const exportarPDF = (data, titulo, orgName = "Mi Tostaduría") => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(titulo, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Empresa: ${orgName}`, 14, 30);
  doc.text(`Fecha Emisión: ${new Date().toLocaleDateString()}`, 14, 36);

  // 1. DEFINIR NUEVAS COLUMNAS (Incluyendo Pago)
  const tableColumn = ["Fecha", "Cliente", "Pago", "Producto", "Cant", "Subtotal"];
  const tableRows = [];

  let totalGeneral = 0;

  data.forEach(row => {
    const rowData = [
      `${row.fecha} ${row.hora}`, // Fecha + Hora
      row.cliente,
      row.metodo_pago, // <--- NUEVA COLUMNA
      row.producto,
      row.cantidad,
      `Bs ${row.subtotal.toFixed(2)}`
    ];
    tableRows.push(rowData);
    totalGeneral += row.subtotal;
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    theme: 'grid',
    styles: { fontSize: 8 }, // Fuente un poco más pequeña para que quepa todo
    headStyles: { fillColor: [16, 185, 129] },
    columnStyles: {
      0: { cellWidth: 25 }, // Fecha
      2: { cellWidth: 20 }, // Pago
      5: { halign: 'right' } // Subtotal alineado derecha
    }
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total Ingresos: Bs ${totalGeneral.toFixed(2)}`, 14, finalY);

  doc.save(`${titulo.replace(/\s+/g, '_')}.pdf`);
};