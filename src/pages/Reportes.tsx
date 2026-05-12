import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { FiltrosReporte, TipoReporte } from '../components/reportes/FiltrosReporte';
import { ReporteTabla, Column } from '../components/reportes/ReporteTabla';
import { TendenciasChart } from '../components/reportes/TendenciasChart';
import {
  getSalesReport,
  getTopProducts,
  getProductSeasonality,
  getFinancialComparison
} from '../services/reportesService';
import {
  exportarReporteVentasAPDF,
  exportarReporteProductosAPDF,
  exportarReporteGastosAPDF
} from '../utils/reportesPdfExport';
import { toast } from 'sonner';
import { BarChart3, FileText, ExternalLink } from 'lucide-react';

export function Reportes() {
  const { orgId } = useAuth();
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('ventas');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(false);
  const [datosTabla, setDatosTabla] = useState<any[]>([]);
  const [datosGrafica, setDatosGrafica] = useState<any[]>([]);

  const generarReporte = async () => {
    if (!orgId || !fechaInicio || !fechaFin) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      switch (tipoReporte) {
        case 'ventas':
          await generarReporteVentas();
          break;
        case 'produccion':
          await generarReporteProduccion();
          break;
        case 'gastos':
          await generarReporteGastos();
          break;
        case 'productos':
          await generarReporteProductos();
          break;
      }
      toast.success('Reporte generado exitosamente');
    } catch (error) {
      console.error('Error generando reporte:', error);
      toast.error('Error al generar reporte');
    } finally {
      setLoading(false);
    }
  };

  const generarReporteVentas = async () => {
    const datos = await getSalesReport(orgId!, fechaInicio, fechaFin, 'month');
    setDatosTabla(datos);
    setDatosGrafica(datos.map(d => ({
      mes: d.label,
      ingreso: Number(d.total_revenue)
    })));
  };

  const generarReporteProduccion = async () => {
    // Por ahora mostrar mensaje
    toast('Vista de producción en construcción', { icon: '🚧' });
    setDatosTabla([]);
    setDatosGrafica([]);
  };

  const generarReporteGastos = async () => {
    const datos = await getFinancialComparison(orgId!, 12);
    const filtrados = datos.filter(d => {
      const fecha = new Date(d.month);
      return fecha >= new Date(fechaInicio) && fecha <= new Date(fechaFin);
    });

    setDatosTabla(filtrados);
    setDatosGrafica(filtrados.map(d => ({
      mes: d.month_label,
      gastos: Number(d.expenses),
      ingresos: Number(d.revenue)
    })));
  };

  const generarReporteProductos = async () => {
    const topProductos = await getTopProducts(orgId!, 10, 90);
    const estacionalidad = await getProductSeasonality(orgId!);

    setDatosTabla(topProductos);

    // Agrupar estacionalidad por mes
    const porMes = estacionalidad.reduce((acc: any, curr) => {
      const mes = curr.month_name.trim();
      if (!acc[mes]) {
        acc[mes] = { mes, cantidad: 0 };
      }
      acc[mes].cantidad += Number(curr.quantity_sold);
      return acc;
    }, {});

    setDatosGrafica(Object.values(porMes));
  };

  const exportarPDF = () => {
    if (datosTabla.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    try {
      switch (tipoReporte) {
        case 'ventas':
          exportarReporteVentasAPDF(datosTabla, fechaInicio, fechaFin);
          break;
        case 'productos':
          exportarReporteProductosAPDF(datosTabla);
          break;
        case 'gastos':
          exportarReporteGastosAPDF(datosTabla);
          break;
        default:
          toast.error('Tipo de reporte no soportado');
          return;
      }
      toast.success('Reporte PDF exportado exitosamente');
    } catch (error) {
      console.error('Error exportando PDF:', error);
      toast.error('Error al exportar PDF');
    }
  };

  // Configuración de columnas según tipo de reporte
  const getColumnas = (): Column[] => {
    switch (tipoReporte) {
      case 'ventas':
        return [
          { key: 'label', label: 'Período' },
          { key: 'total_orders', label: 'Órdenes', formato: 'numero' },
          { key: 'total_revenue', label: 'Ingresos', formato: 'moneda' },
          { key: 'avg_ticket', label: 'Ticket Prom.', formato: 'moneda' }
        ];
      case 'gastos':
        return [
          { key: 'month_label', label: 'Mes' },
          { key: 'revenue', label: 'Ingresos', formato: 'moneda' },
          { key: 'expenses', label: 'Gastos', formato: 'moneda' },
          { key: 'net_profit', label: 'Ganancia', formato: 'moneda' },
          { key: 'profit_margin_percentage', label: 'Margen %', formato: 'porcentaje' }
        ];
      case 'productos':
        return [
          { key: 'rank', label: '#' },
          { key: 'product_name', label: 'Producto' },
          { key: 'category', label: 'Categoría' },
          { key: 'quantity_sold', label: 'Vendidos', formato: 'numero' },
          { key: 'revenue', label: 'Ingresos', formato: 'moneda' },
          { key: 'times_ordered', label: 'Pedidos', formato: 'numero' }
        ];
      default:
        return [];
    }
  };

  const getTituloTabla = () => {
    const titulos = {
      ventas: 'Reporte de Ventas',
      produccion: 'Reporte de Producción',
      gastos: 'Comparativo Financiero',
      productos: 'Top Productos Más Vendidos'
    };
    return titulos[tipoReporte];
  };

  const getTituloGrafica = () => {
    const titulos = {
      ventas: 'Tendencia de Ingresos',
      produccion: 'Producción Mensual',
      gastos: 'Ingresos vs Gastos',
      productos: 'Ventas por Mes'
    };
    return titulos[tipoReporte];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
          <BarChart3 className="text-emerald-700" /> Reportes y Análisis
        </h1>

        {/* Link to Daily Sales Report */}
        <Link
          to="/reporte-ventas-dia"
          className="block mb-6 bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <FileText size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Reporte de Ventas del Día</h2>
                <p className="text-emerald-100 text-sm">Ver transacciones detalladas de hoy</p>
              </div>
            </div>
            <ExternalLink size={24} className="text-emerald-200" />
          </div>
        </Link>

        <p className="text-stone-500 mt-1">
          Genera reportes personalizados y analiza tendencias
        </p>
      </div>

      {/* Filtros */}
      <FiltrosReporte
        tipoReporte={tipoReporte}
        onTipoChange={setTipoReporte}
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        onFechaInicioChange={setFechaInicio}
        onFechaFinChange={setFechaFin}
        onGenerar={generarReporte}
        loading={loading}
      />

      {/* Gráfica */}
      {datosGrafica.length > 0 && (
        <TendenciasChart
          titulo={getTituloGrafica()}
          datos={datosGrafica}
          dataKeyX={tipoReporte === 'productos' ? 'mes' : 'mes'}
          dataKeyY={tipoReporte === 'ventas' ? 'ingreso' : tipoReporte === 'gastos' ? 'ingresos' : 'cantidad'}
          labelY={tipoReporte === 'ventas' ? 'Ingresos (Bs)' : tipoReporte === 'gastos' ? 'Monto (Bs)' : 'Cantidad'}
          tipo={tipoReporte === 'productos' ? 'barra' : 'linea'}
          loading={loading}
        />
      )}

      {/* Tabla */}
      {datosTabla.length > 0 && (
        <ReporteTabla
          titulo={getTituloTabla()}
          columnas={getColumnas()}
          datos={datosTabla}
          loading={loading}
          onExportar={exportarPDF}
        />
      )}

      {/* Estado vacío inicial */}
      {!loading && datosTabla.length === 0 && datosGrafica.length === 0 && (
        <div className="bg-white p-12 rounded-xl border border-stone-200 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-stone-800 mb-2">
            Selecciona un período y genera tu reporte
          </h3>
          <p className="text-stone-500">
            Elige el tipo de reporte, las fechas y haz clic en "Generar Reporte"
          </p>
        </div>
      )}
    </div>
  );
}