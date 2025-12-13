import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getReporteVentas, ReporteItem } from '../services/reportesService';
import { toast } from 'sonner';
import { Download, Search, FileText } from 'lucide-react';

export function Reportes() {
  const { orgId } = useAuth();
  const [data, setData] = useState<ReporteItem[]>([]);
  const [fechas, setFechas] = useState({ inicio: '', fin: '' });

  const generar = async () => {
    if (!fechas.inicio || !fechas.fin) return toast.warning("Selecciona fechas");
    try {
      const res = await getReporteVentas(fechas.inicio, fechas.fin, orgId!);
      setData(res);
    } catch (e: any) { toast.error(e.message); }
  };

  const exportarCSV = () => {
    // Lógica simple de CSV
    const headers = ["Fecha", "Cliente", "Producto", "Cantidad", "Total"];
    const rows = data.map(d => [d.fecha, d.cliente, d.producto, d.cantidad, d.subtotal]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    window.open(encodedUri);
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-stone-50">
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm mb-6 flex gap-4 items-end">
        <div><label className="text-xs font-bold text-stone-400">Desde</label><input type="date" className="block p-2 border rounded-lg" onChange={e=>setFechas({...fechas, inicio: e.target.value})}/></div>
        <div><label className="text-xs font-bold text-stone-400">Hasta</label><input type="date" className="block p-2 border rounded-lg" onChange={e=>setFechas({...fechas, fin: e.target.value})}/></div>
        <button onClick={generar} className="bg-stone-900 text-white px-4 py-2.5 rounded-lg font-bold flex gap-2"><Search size={18}/> Generar</button>
        {data.length > 0 && <button onClick={exportarCSV} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg font-bold flex gap-2 ml-auto"><Download size={18}/> Exportar</button>}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 font-bold">
            <tr><th className="p-4">Fecha</th><th className="p-4">Cliente</th><th className="p-4">Item</th><th className="p-4 text-right">Cant</th><th className="p-4 text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.map((r, i) => (
              <tr key={i} className="hover:bg-stone-50">
                <td className="p-4 text-stone-500 font-mono text-xs">{r.fecha} {r.hora}</td>
                <td className="p-4 font-bold text-stone-700">{r.cliente}</td>
                <td className="p-4">{r.producto}</td>
                <td className="p-4 text-right">{r.cantidad}</td>
                <td className="p-4 text-right font-bold text-emerald-600">Bs {r.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}