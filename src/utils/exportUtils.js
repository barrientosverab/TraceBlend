import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Generación Profesional de Excel con ExcelJS
export const exportarExcel = async (data, fileName = 'Reporte') => {
  // 1. Crear el libro y la hoja
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Movimientos");

  // 2. Definir Columnas (Automático basado en la data)
  if (data.length > 0) {
    worksheet.columns = Object.keys(data[0]).map(key => ({
      header: key.toUpperCase(),
      key: key,
      width: 25 // Ancho más cómodo para leer
    }));
  }

  // 3. Agregar filas
  worksheet.addRows(data);

  // 4. Estilos Profesionales (Bonus: Encabezado en Negrita)
  worksheet.getRow(1).font = { bold: true };
  
  // 5. Generar y Descargar (Buffer)
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  saveAs(blob, `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
};

// Generación de PDF (Se mantiene igual, solo revisamos imports)
export const exportarPDF = (data, titulo, orgName = "Mi Tostaduría") => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(titulo, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Empresa: ${orgName}`, 14, 30);
  doc.text(`Fecha Emisión: ${new Date().toLocaleDateString()}`, 14, 36);

  const tableColumn = ["Fecha", "Cliente", "Producto", "Cant", "P. Unit", "Subtotal"];
  const tableRows = [];

  let totalGeneral = 0;

  data.forEach(row => {
    const rowData = [
      row.fecha,
      row.cliente,
      row.producto,
      row.cantidad,
      `Bs ${row.precio_unitario.toFixed(2)}`,
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
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] }
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total Ingresos: Bs ${totalGeneral.toFixed(2)}`, 14, finalY);

  doc.save(`${titulo.replace(/\s+/g, '_')}.pdf`);
};