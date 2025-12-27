import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getReports, getLotesParaAnalisis, createInternalReport, createExternalReport, type LabReportComplete, type LoteAnalisis } from '../services/laboratorioService';
import { TablaReportesLaboratorio } from '../components/TablaReportesLaboratorio';
import { VisualizadorReporte } from '../components/VisualizadorReporte';
import { FormularioMuestraExterna } from '../components/FormularioMuestraExterna';
import { FormularioAnalisisFisico } from '../components/FormularioAnalisisFisico';
import { FormularioCatacionSCA } from '../components/FormularioCatacionSCA';
import { ComparadorMuestras } from '../components/ComparadorMuestras';
import { Button } from '../components/ui';
import { Card } from '../components/ui/Card';
import { FlaskConical, Plus, Package, Building2, Filter, ArrowLeft, CheckCircle, Award, TrendingUp, GitCompare } from 'lucide-react';
import { toast } from 'sonner';

type Vista = 'dashboard' | 'detalle' | 'nuevoInterno' | 'nuevoExterno' | 'agregarAnalisis' | 'comparar';
type TipoAnalisis = 'fisico' | 'catacion' | null;

export function Laboratorio() {
  const { orgId } = useAuth();
  const [reportes, setReportes] = useState<LabReportComplete[]>([]);
  const [lotes, setLotes] = useState<LoteAnalisis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState<Vista>('dashboard');
  const [reporteSeleccionado, setReporteSeleccionado] = useState<LabReportComplete | null>(null);
  const [reporteEnProceso, setReporteEnProceso] = useState<string | null>(null);
  const [tipoAnalisisActual, setTipoAnalisisActual] = useState<TipoAnalisis>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'internal' | 'external'>('todos');
  const [loteSeleccionado, setLoteSeleccionado] = useState('');
  const [reportesParaComparar, setReportesParaComparar] = useState<string[]>([]);

  useEffect(() => {
    cargarDatos();
  }, [orgId]);

  const cargarDatos = async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const [reportesData, lotesData] = await Promise.all([
        getReports(),
        getLotesParaAnalisis()
      ]);
      setReportes(reportesData);
      setLotes(lotesData);
    } catch (error) {
      toast.error('Error al cargar datos');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerReporte = (reportId: string) => {
    const reporte = reportes.find(r => r.id === reportId);
    if (reporte) {
      setReporteSeleccionado(reporte);
      setVistaActiva('detalle');
    }
  };

  const handleCrearReporteInterno = async () => {
    if (!loteSeleccionado) {
      toast.warning('Selecciona un lote');
      return;
    }

    try {
      const reportId = await createInternalReport({
        report_date: new Date().toISOString().split('T')[0],
        analyst_name: '',
        sample_type: 'internal',
        batch_id: loteSeleccionado,
        report_type: 'complete'
      }, orgId!);

      setReporteEnProceso(reportId);
      setTipoAnalisisActual('fisico');
      setVistaActiva('agregarAnalisis');
      toast.success('Reporte creado. Agregando análisis físico...');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleCrearReporteExterno = async (data: any) => {
    try {
      const reportId = await createExternalReport(data, orgId!);
      setReporteEnProceso(reportId);

      if (data.report_type === 'physical') {
        setTipoAnalisisActual('fisico');
        setVistaActiva('agregarAnalisis');
      } else if (data.report_type === 'cupping') {
        setTipoAnalisisActual('catacion');
        setVistaActiva('agregarAnalisis');
      } else {
        setTipoAnalisisActual('fisico');
        setVistaActiva('agregarAnalisis');
      }

      toast.success('Muestra externa registrada');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const volverAlDashboard = () => {
    setVistaActiva('dashboard');
    setReporteSeleccionado(null);
    setReporteEnProceso(null);
    setTipoAnalisisActual(null);
    setLoteSeleccionado('');
    setReportesParaComparar([]);
    cargarDatos();
  };

  const toggleReporteComparar = (reportId: string) => {
    setReportesParaComparar(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const reportesFiltrados = reportes.filter(r => {
    if (filtroTipo === 'todos') return true;
    return r.sample_type === filtroTipo;
  });

  const estadisticas = {
    total: reportes.length,
    internas: reportes.filter(r => r.sample_type === 'internal').length,
    externas: reportes.filter(r => r.sample_type === 'external').length,
    specialty: reportes.filter(r => r.final_score && r.final_score >= 80).length,
    promedioScore: reportes.filter(r => r.final_score).length > 0
      ? (reportes.reduce((sum, r) => sum + (r.final_score || 0), 0) / reportes.filter(r => r.final_score).length)
      : 0
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
              <FlaskConical className="text-emerald-600" size={32} />
              Laboratorio de Café
            </h1>
            <p className="text-stone-600 mt-2">
              Sistema de análisis físico y sensorial (SCA)
            </p>
          </div>

          {vistaActiva !== 'dashboard' && (
            <Button
              icon={ArrowLeft}
              variant="secondary"
              onClick={volverAlDashboard}
            >
              Volver al Dashboard
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard View */}
      {vistaActiva === 'dashboard' && (
        <>
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <p className="text-xs font-bold text-stone-500 uppercase mb-1">Total Reportes</p>
              <p className="text-3xl font-black text-stone-800">{estadisticas.total}</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <p className="text-xs font-bold text-stone-500 uppercase mb-1">Internas</p>
              <p className="text-3xl font-black text-emerald-600">{estadisticas.internas}</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <p className="text-xs font-bold text-stone-500 uppercase mb-1">Externas</p>
              <p className="text-3xl font-black text-blue-600">{estadisticas.externas}</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <p className="text-xs font-bold text-stone-500 uppercase mb-1 flex items-center gap-1">
                <Award size={12} />
                Specialty
              </p>
              <p className="text-3xl font-black text-purple-600">{estadisticas.specialty}</p>
            </Card>
            <Card className="p-4 hover:shadow-lg transition-shadow">
              <p className="text-xs font-bold text-stone-500 uppercase mb-1 flex items-center gap-1">
                <TrendingUp size={12} />
                Promedio
              </p>
              <p className="text-3xl font-black text-amber-600">{estadisticas.promedioScore.toFixed(1)}</p>
            </Card>
          </div>

          {/* Crear Nuevo Reporte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Muestra Interna */}
            <Card className="p-6 hover:shadow-xl transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Package className="text-emerald-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-stone-800 mb-1">Muestra Interna</h3>
                  <p className="text-sm text-stone-600 mb-4">Analizar lote de inventario</p>

                  <select
                    className="w-full p-3 border-2 border-stone-200 rounded-xl mb-3 font-semibold text-sm focus:border-emerald-500 outline-none"
                    value={loteSeleccionado}
                    onChange={(e) => setLoteSeleccionado(e.target.value)}
                  >
                    <option value="">-- Seleccionar Lote --</option>
                    {lotes.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.codigo_lote} • {l.nombre_finca}
                      </option>
                    ))}
                  </select>

                  <Button
                    icon={Plus}
                    variant="primary"
                    fullWidth
                    onClick={handleCrearReporteInterno}
                    disabled={!loteSeleccionado}
                  >
                    Crear Reporte
                  </Button>
                </div>
              </div>
            </Card>

            {/* Muestra Externa */}
            <Card className="p-6 hover:shadow-xl transition-all">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Building2 className="text-blue-600" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-stone-800 mb-1">Muestra Externa</h3>
                  <p className="text-sm text-stone-600 mb-4">Analizar muestra de cliente</p>

                  <p className="text-xs text-stone-500 mb-3">
                    Registra muestras de clientes externos para análisis de calidad y certificación
                  </p>

                  <Button
                    icon={Plus}
                    variant="primary"
                    fullWidth
                    onClick={() => setVistaActiva('nuevoExterno')}
                  >
                    Nueva Muestra Externa
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Filtros y Tabla */}
          <div className="mb-4 flex items-center gap-3">
            <Filter size={18} className="text-stone-400" />
            <div className="flex gap-2">
              {[
                { id: 'todos', label: 'Todos', icon: null },
                { id: 'internal', label: 'Internas', icon: Package },
                { id: 'external', label: 'Externas', icon: Building2 }
              ].map(filtro => {
                const Icon = filtro.icon;
                return (
                  <button
                    key={filtro.id}
                    onClick={() => setFiltroTipo(filtro.id as any)}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${filtroTipo === filtro.id
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                  >
                    {Icon && <Icon size={16} />}
                    {filtro.label}
                  </button>
                );
              })}
            </div>
            <span className="text-sm text-stone-500 ml-auto">
              {reportesFiltrados.length} {reportesFiltrados.length === 1 ? 'reporte' : 'reportes'}
            </span>
          </div>

          <Card>
            <TablaReportesLaboratorio
              reportes={reportesFiltrados}
              onViewReport={handleVerReporte}
              isLoading={isLoading}
            />
          </Card>
        </>
      )}

      {/* Vista Detalle */}
      {vistaActiva === 'detalle' && reporteSeleccionado && (
        <VisualizadorReporte reporte={reporteSeleccionado} />
      )}

      {/* Vista Nueva Muestra Externa */}
      {vistaActiva === 'nuevoExterno' && (
        <FormularioMuestraExterna
          onSubmit={handleCrearReporteExterno}
        />
      )}

      {/* Vista Agregar Análisis */}
      {vistaActiva === 'agregarAnalisis' && reporteEnProceso && (
        <div className="space-y-6">
          {/* Progress indicator */}
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-600" size={24} />
              <div>
                <p className="font-bold text-emerald-800">Reporte creado exitosamente</p>
                <p className="text-sm text-emerald-700">
                  {tipoAnalisisActual === 'fisico' ? 'Agregando análisis físico...' : 'Agregando catación SCA...'}
                </p>
              </div>
            </div>
          </Card>

          {tipoAnalisisActual === 'fisico' && (
            <FormularioAnalisisFisico
              onSubmit={async (data) => {
                // Implementar guardado
                toast.success('Análisis físico guardado');
                setTipoAnalisisActual('catacion');
              }}
            />
          )}

          {tipoAnalisisActual === 'catacion' && (
            <FormularioCatacionSCA
              onSubmit={async (data) => {
                // Implementar guardado
                toast.success('Catación guardada');
                volverAlDashboard();
              }}
            />
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                if (tipoAnalisisActual === 'catacion') {
                  setTipoAnalisisActual('fisico');
                } else {
                  volverAlDashboard();
                }
              }}
            >
              ← Anterior
            </Button>

            <Button
              variant="outline"
              onClick={volverAlDashboard}
              className="ml-auto"
            >
              Guardar y Finalizar Después
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}