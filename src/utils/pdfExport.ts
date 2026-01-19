import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type LabReportComplete } from '../types/laboratorio';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const exportarReporteAPDF = (reporte: LabReportComplete) => {
    const pdf = new jsPDF();

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Reporte de Laboratorio de Café', 105, 20, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Fecha: ${format(new Date(reporte.report_date), 'dd MMMM yyyy', { locale: es })}`, 105, 28, { align: 'center' });

    let yPos = 40;

    // Información General
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Información General', 14, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const generalInfo = [
        ['Tipo de Muestra', reporte.sample_type === 'internal' ? 'Interna' : 'Externa'],
        ['ID Muestra', reporte.sample_type === 'internal' ? reporte.batch_code || '-' : reporte.external_sample_id || '-'],
        ['Origen', reporte.sample_type === 'internal' ? reporte.farm_name || '-' : reporte.external_origin || '-'],
        ['Analista', reporte.analyst_name || '-'],
        ['Estado', reporte.status],
    ];

    autoTable(pdf, {
        startY: yPos,
        head: [],
        body: generalInfo,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        margin: { left: 14, right: 14 }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    yPos = (pdf as any).lastAutoTable.finalY + 10;

    // Análisis Físico
    if (reporte.physical_id) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Análisis Físico', 14, yPos);
        yPos += 8;

        const physicalData = [
            ['Peso Muestra', `${reporte.sample_weight_grams}g`],
            ['Peso Oro Verde', reporte.green_weight_grams ? `${reporte.green_weight_grams}g` : '-'],
            ['Humedad', `${reporte.humidity_percentage}%`],
            ['Densidad', reporte.density_value?.toString() || '-'],
            ['Malla 18', `${reporte.mesh_18}%`],
            ['Malla 16', `${reporte.mesh_16}%`],
            ['Malla 14', `${reporte.mesh_14}%`],
            ['Base', `${reporte.base_mesh}%`],
            ['Defectos Cat. 1', reporte.category_1_defects?.toString() || '0'],
            ['Defectos Cat. 2', reporte.category_2_defects?.toString() || '0'],
        ];

        autoTable(pdf, {
            startY: yPos,
            head: [],
            body: physicalData,
            theme: 'grid',
            margin: { left: 14, right: 14 }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yPos = (pdf as any).lastAutoTable.finalY + 10;
    }

    // Catación SCA
    if (reporte.cupping_id) {
        // Nueva página si es necesario
        if (yPos > 240) {
            pdf.addPage();
            yPos = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Catación SCA', 14, yPos);
        yPos += 8;

        // Puntuación destacada
        pdf.setFillColor(240, 253, 244);
        pdf.rect(14, yPos, 182, 25, 'F');
        pdf.setFontSize(12);
        pdf.setTextColor(16, 185, 129);
        pdf.text('PUNTUACIÓN FINAL', 105, yPos + 10, { align: 'center' });
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text(reporte.final_score?.toFixed(2) || '0', 105, yPos + 20, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
        yPos += 30;

        const cuppingData = [
            ['Fragancia/Aroma', reporte.fragrance_aroma?.toString() || '-'],
            ['Sabor', reporte.flavor?.toString() || '-'],
            ['Residual', reporte.aftertaste?.toString() || '-'],
            ['Acidez', reporte.acidity?.toString() || '-'],
            ['Cuerpo', reporte.body?.toString() || '-'],
            ['Balance', reporte.balance?.toString() || '-'],
            ['General', reporte.overall?.toString() || '-'],
            ['Uniformidad', reporte.uniformity?.toString() || '-'],
            ['Taza Limpia', reporte.clean_cup?.toString() || '-'],
            ['Dulzor', reporte.sweetness?.toString() || '-'],
        ];

        autoTable(pdf, {
            startY: yPos,
            head: [],
            body: cuppingData,
            theme: 'grid',
            margin: { left: 14, right: 14 }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        yPos = (pdf as any).lastAutoTable.finalY + 10;

        // Descriptores
        if (reporte.flavor_descriptors && reporte.flavor_descriptors.length > 0) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Descriptores de Sabor:', 14, yPos);
            yPos += 6;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(reporte.flavor_descriptors.join(', '), 14, yPos, { maxWidth: 182 });
            yPos += 10;
        }

        // Notas
        if (reporte.cupper_notes) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Notas del Catador:', 14, yPos);
            yPos += 6;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text(reporte.cupper_notes, 14, yPos, { maxWidth: 182 });
        }
    }

    // Footer
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

    // Guardar
    const fileName = `Reporte_Lab_${reporte.sample_type === 'internal' ? reporte.batch_code : reporte.external_sample_id}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    pdf.save(fileName);
};
