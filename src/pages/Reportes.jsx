import React, { useState } from 'react';
import { FileText, Download, Calendar, DollarSign, FileSpreadsheet, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner'; // Usamos Toasts como pediste
import { getReporteVentas } from '../services/reportesService';
import { exportarExcel, exportarPDF } from '../utils/exportUtils';

export function Reportes() {
  const { orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Fechas por defecto: Primer y último día del mes actual
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = today.toISOString().split('T')[0];

  const [filtros, setFiltros] = useState({ inicio: firstDay, fin: lastDay });
  const [reporteData, setReporteData] = useState([]);
  const [resumen, setResumen] = useState({ total: 0, items: 0 });

  const handleGenerarVistaPrevia = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await getReporteVentas(filtros.inicio, filtros.fin, orgId);
      setReporteData(data);
      
      // Calcular resumen rápido para las tarjetas
      const total = data.reduce((acc, curr) => acc + curr.subtotal, 0);
      const items = data.length;
      setResumen({ total, items });

      if (data.length === 0) {
        toast.info("No hay ventas en este rango de fechas.");
      } else {
        toast.success("Datos cargados correctamente");
      }

    } catch (err) {
      toast.error("Error al cargar reporte", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDescargar = (tipo) => {
    if (reporteData.length === 0) {
        return toast.warning("Genera la vista previa primero");
    }
    
    const nombreArchivo = `Ventas_${filtros.inicio}_al_${filtros.fin}`;

    if (tipo === 'pdf') {
      exportarPDF(reporteData, `Reporte de Ventas`, "Trace Blend");
      toast.success("PDF generado correctamente");
    } else {
      // Usamos toast.promise para feedback visual durante la generación
      toast.promise(
        exportarExcel(reporteData, nombreArchivo),
        {
          loading: 'Generando Excel...',
          success: 'Archivo Excel descargado',
          error: 'Error al generar Excel'
        }
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-2">
          <FileText className="text-emerald-600"/> Reportes Financieros
        </h1>
        <p className="text-stone-500">Consulta y exporta el historial de movimientos.</p>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-8">
        <form onSubmit={handleGenerarVistaPrevia} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Fecha Inicio</label>
            <input 
              type="date" 
              className="w-full p-2 border rounded-lg bg-stone-50" 
              value={filtros.inicio} 
              onChange={e => setFiltros({...filtros, inicio: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Fecha Fin</label>
            <input 
              type="date" 
              className="w-full p-2 border rounded-lg bg-stone-50" 
              value={filtros.fin} 
              onChange={e => setFiltros({...filtros, fin: e.target.value})}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-stone-800 hover:bg-black text-white px-6 py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 transition-all shadow-md"
          >
            {loading ? 'Cargando...' : <><Search size={18}/> Buscar</>}
          </button>
        </form>
      </div>

      {/* RESULTADOS */}
      {reporteData.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          
          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-emerald-800 text-xs font-bold uppercase tracking-wide">Ingresos Totales</p>
                <p className="text-3xl font-bold text-emerald-900 mt-1">Bs {resumen.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="p-3 bg-white/50 rounded-full text-emerald-600">
                <DollarSign size={32}/>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-stone-200 flex justify-between items-center shadow-sm">
              <div>
                <p className="text-stone-500 text-xs font-bold uppercase tracking-wide">Transacciones</p>
                <p className="text-3xl font-bold text-stone-800 mt-1">{resumen.items}</p>
              </div>
              <div className="p-3 bg-stone-100 rounded-full text-stone-500">
                <FileText size={32}/>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-4">
            <button 
              onClick={() => handleDescargar('excel')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-md transition-all"
            >
              <FileSpreadsheet size={20}/> Descargar Excel Completo
            </button>
            <button 
              onClick={() => handleDescargar('pdf')}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-md transition-all"
            >
              <Download size={20}/> Descargar PDF
            </button>
          </div>

          {/* Tabla de Vista Previa */}
          <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
              <span className="font-bold text-stone-600 text-sm">Vista Previa (Últimos movimientos)</span>
              <span className="text-xs text-stone-400">Mostrando 5 de {reporteData.length} registros</span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-stone-500 font-bold border-b border-stone-100 bg-stone-50/50">
                <tr>
                  <th className="p-3 pl-4">Fecha</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Producto</th>
                  <th className="p-3 text-right">Cantidad</th>
                  <th className="p-3 text-right pr-4">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {reporteData.slice(0, 5).map((row, i) => (
                  <tr key={i} className="hover:bg-stone-50 transition-colors">
                    <td className="p-3 pl-4 font-mono text-xs text-stone-500">{row.fecha}</td>
                    <td className="p-3 font-medium text-stone-800">{row.cliente}</td>
                    <td className="p-3 text-stone-600">{row.producto}</td>
                    <td className="p-3 text-right font-mono">{row.cantidad}</td>
                    <td className="p-3 text-right pr-4 font-bold text-emerald-700">Bs {row.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reporteData.length > 5 && (
              <div className="p-3 text-center text-xs text-stone-400 bg-stone-50 italic border-t border-stone-100">
                Descarga el archivo para ver el detalle completo.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}