import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Package, Coffee, AlertCircle, Calendar, DollarSign, Activity 
} from 'lucide-react';
// 1. IMPORTAMOS EL HOOK DE AUTH
import { useAuth } from '../hooks/useAuth';
import { getDashboardStats, getActividadReciente } from '../services/dashboardService';

export function Dashboard() {
  // 2. OBTENEMOS EL ID DE LA ORGANIZACIÓN DEL CONTEXTO (INSTANTÁNEO)
  const { orgId } = useAuth();
  
  const [stats, setStats] = useState({ ventas_mes: 0, stock_verde: 0, stock_producto: 0, lotes_pendientes: 0 });
  const [actividad, setActividad] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Si no hay orgId (raro, pero posible), no hacemos nada aún
      if (!orgId) return;

      try {
        // 3. PASAMOS EL ORGID COMO ARGUMENTO
        const [s, a] = await Promise.all([
          getDashboardStats(orgId), 
          getActividadReciente(orgId)
        ]);
        setStats(s);
        setActividad(a);
      } catch (e) { 
        console.error("Error cargando dashboard:", e); 
      } finally { 
        setLoading(false); 
      }
    }
    load();
  }, [orgId]); // Ejecutar cuando tengamos el orgId

  if (loading) return <div className="p-8 text-stone-400 animate-pulse">Cargando indicadores...</div>;

  return (
    // ... (El resto del JSX (return) se mantiene exactamente igual)
    <div className="max-w-6xl mx-auto">
      {/* ...contenido existente... */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800">Panel de Control</h1>
        <p className="text-stone-500">Resumen operativo de hoy, {new Date().toLocaleDateString()}</p>
      </div>

      {/* TARJETAS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Ventas */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Ventas Mes</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">Bs {stats.ventas_mes.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <DollarSign size={24}/>
          </div>
        </div>

        {/* Stock Verde */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Stock Oro Verde</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{stats.stock_verde.toFixed(1)} <span className="text-sm font-normal">Kg</span></p>
          </div>
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
            <Coffee size={24}/>
          </div>
        </div>

        {/* Producto Terminado */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Bolsas Listas</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{stats.stock_producto} <span className="text-sm font-normal">Uds</span></p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
            <Package size={24}/>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Lotes por Procesar</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{stats.lotes_pendientes}</p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
            <AlertCircle size={24}/>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfica Rápida / Resumen */}
        <div className="lg:col-span-2 bg-stone-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
              <TrendingUp className="text-emerald-400"/> Rendimiento
            </h3>
            <p className="text-stone-400 mb-6 max-w-md">
              Tu tostaduría ha procesado <b>{stats.stock_producto} unidades</b> de producto terminado. 
              El inventario de materia prima está al <b>{(stats.stock_verde > 1000 ? 'Alto' : 'Normal')}</b> nivel.
            </p>
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition-colors">
              Ver Reporte Completo
            </button>
          </div>
          {/* Decoración de fondo */}
          <div className="absolute -right-10 -bottom-20 opacity-10">
            <Coffee size={300} />
          </div>
        </div>

        {/* Feed de Actividad */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
          <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-stone-400"/> Actividad Reciente
          </h3>
          <div className="space-y-4">
            {actividad.length === 0 ? (
              <p className="text-sm text-stone-400">No hay actividad registrada aún.</p>
            ) : (
              actividad.map((item, i) => (
                <div key={i} className="flex gap-3 items-start border-b border-stone-50 pb-3 last:border-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-emerald-500 shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-stone-700">{item.descripcion || item.texto}</p>
                    <p className="text-xs text-stone-400">{new Date(item.fecha).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}