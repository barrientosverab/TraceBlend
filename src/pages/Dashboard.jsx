import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Package, Coffee, AlertCircle, DollarSign, Activity 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getDashboardStats, getActividadReciente } from '../services/dashboardService';

export function Dashboard() {
  // 1. Obtenemos datos del contexto (authLoading es la carga de sesión)
  const { orgId, user, loading: authLoading } = useAuth(); 
  
  const [stats, setStats] = useState({ ventas_mes: 0, stock_verde: 0, stock_producto: 0, lotes_pendientes: 0 });
  const [actividad, setActividad] = useState([]);
  
  // 2. Estado de carga PROPIO del Dashboard (para no confundir con authLoading)
  const [loadingData, setLoadingData] = useState(true); 

  useEffect(() => {
    // Si la autenticación aún está cargando, esperamos.
    if (authLoading) return;

    // Si terminó de cargar auth pero no hay organización, paramos la carga de datos.
    if (!orgId) {
      setLoadingData(false);
      return; 
    }

    async function load() {
      try {
        setLoadingData(true); // <--- CORREGIDO (Antes decía setLoading)
        
        const [s, a] = await Promise.all([
          getDashboardStats(orgId), 
          getActividadReciente(orgId)
        ]);
        setStats(s);
        setActividad(a);
      } catch (e) { 
        console.error("Dashboard error:", e); 
      } finally { 
        setLoadingData(false); // <--- CORREGIDO (Antes decía setLoading)
      }
    }
    load();
  }, [orgId, authLoading]);

  // 3. Renderizado Condicional

  // Caso A: Cargando (Ya sea Auth o Datos del Dashboard)
  if (authLoading || (orgId && loadingData)) {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700 mb-4"></div>
            <span className="text-stone-500 font-medium animate-pulse">
              {authLoading ? 'Verificando sesión...' : 'Sincronizando datos...'}
            </span>
        </div>
    );
  }

  // Caso B: Usuario sin Organización (Error de Datos)
  if (!orgId) {
    return (
      <div className="p-10 max-w-2xl mx-auto mt-10 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-amber-900">Cuenta sin Organización</h2>
        <p className="text-amber-700 mt-2 mb-6">
          El usuario <b>{user?.email}</b> no tiene un perfil vinculado correctamente.
        </p>
        <button 
             onClick={() => window.location.reload()} 
             className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-bold transition-colors shadow-sm"
        >
             Reintentar Conexión
        </button>
      </div>
    );
  }

  // Caso C: Dashboard Normal
  return (
    <div className="max-w-6xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800">Panel de Control</h1>
        <p className="text-stone-500">Resumen operativo de hoy, {new Date().toLocaleDateString()}</p>
      </div>

      {/* KPI CARDS */}
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