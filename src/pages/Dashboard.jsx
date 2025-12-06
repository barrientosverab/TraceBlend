import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Package, Coffee, AlertCircle, DollarSign, Activity, 
  Users, Settings, ShoppingBag, Truck, FileText, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom'; // Para navegación rápida
import { useAuth } from '../hooks/useAuth';
import { getDashboardStats, getActividadReciente } from '../services/dashboardService';
import { supabase } from '../services/supabaseClient';

export function Dashboard() {
  const { orgId, user, role, loading: authLoading } = useAuth();
  
  const [stats, setStats] = useState({ ventas_mes: 0, stock_verde: 0, stock_producto: 0, lotes_pendientes: 0 });
  const [actividad, setActividad] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading || !orgId) {
      if (!authLoading && !orgId) setLoadingData(false);
      return; 
    }

    async function load() {
      try {
        setLoadingData(true);
        const [s, a] = await Promise.all([
          getDashboardStats(orgId), 
          getActividadReciente(orgId)
        ]);
        setStats(s);
        setActividad(a);
      } catch (e) { 
        console.error("Dashboard error:", e); 
      } finally { 
        setLoadingData(false); 
      }
    }
    load();
  }, [orgId, authLoading]);
  
  useEffect(() => {
    if (authLoading) return;
    if (!orgId) {
      setLoadingData(false);
      return; 
    }

    // Función de carga (extraída para poder reutilizarla)
    const load = async () => {
      // Nota: Opcionalmente puedes quitar el setLoadingData(true) aquí si quieres 
      // que la actualización sea "silenciosa" sin spinner.
      try {
        const [s, a] = await Promise.all([
          getDashboardStats(orgId), 
          getActividadReciente(orgId)
        ]);
        setStats(s);
        setActividad(a);
      } catch (e) { 
        console.error("Dashboard error:", e); 
      } finally { 
        setLoadingData(false); 
      }
    };

    load(); // Carga inicial

    // --- MAGIA REAL-TIME ---
    // Escuchamos cambios en ventas e inventario
    const channel = supabase
      .channel('dashboard-live')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'sales_orders' }, 
        (payload) => {
          // Si hay una nueva venta (INSERT) o se borra, recargamos
          if (payload.new.organization_id === orgId || payload.old.organization_id === orgId) {
             load(); 
          }
        }
      )
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'green_coffee_warehouse' }, 
        () => load() // Recargar si cambia el stock verde
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // Limpieza al salir
    };

  }, [orgId, authLoading]);

  // Componente de Tarjeta de Acceso Rápido (UX Improvement)
  const QuickAction = ({ to, icon: Icon, title, desc, color }) => (
    <Link to={to} className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-stone-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
      <div className="relative z-10">
        <div className={`w-12 h-12 bg-${color}-100 rounded-xl flex items-center justify-center text-${color}-600 mb-4 group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <h3 className="font-bold text-stone-800 text-lg group-hover:text-${color}-700">{title}</h3>
        <p className="text-stone-500 text-xs mt-1">{desc}</p>
      </div>
      <ChevronRight className="absolute bottom-6 right-6 text-stone-300 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" size={20}/>
    </Link>
  );

  if (authLoading || (orgId && loadingData)) {
    return (
        <div className="h-full flex flex-col items-center justify-center pt-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700 mb-4"></div>
            <span className="text-stone-400 font-medium animate-pulse">Sincronizando métricas...</span>
        </div>
    );
  }

  if (!orgId) {
    return (
      <div className="p-10 max-w-2xl mx-auto mt-10 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-amber-900">Bienvenido a Trace Blend</h2>
        <p className="text-amber-700 mt-2 mb-6">Tu cuenta está activa pero necesitamos configurar tu organización.</p>
        <button onClick={() => window.location.reload()} className="bg-amber-600 text-white px-6 py-2 rounded-lg">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-2">
      
      {/* Header con Bienvenida Personalizada */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">
            Hola, <span className="text-emerald-700">{user?.user_metadata?.first_name || 'Equipo'}</span> 👋
          </h1>
          <p className="text-stone-500 mt-1">Aquí tienes el resumen operativo de hoy.</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Organización</p>
          <p className="text-lg font-bold text-stone-700">Tostaduría Principal</p>
        </div>
      </div>

      {/* KPI STATS (Diseño Limpio) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Ventas Mes</p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">Bs {stats.ventas_mes.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600"><DollarSign size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Oro Verde</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{stats.stock_verde.toFixed(1)} <span className="text-sm font-normal">Kg</span></p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600"><Coffee size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Producto Listo</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{stats.stock_producto} <span className="text-sm font-normal">Uds</span></p>
          </div>
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600"><Package size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Lotes en Proceso</p>
            <p className="text-2xl font-bold text-stone-800 mt-1">{stats.lotes_pendientes}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Activity size={24}/></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: CONTROLADORES & GRÁFICOS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SECCIÓN ADMINISTRATIVA (Solo visible para Admins) */}
          {role === 'administrador' && (
            <div>
              <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Settings size={20} className="text-emerald-600"/> Administración
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickAction to="/usuarios" icon={Users} title="Gestionar Equipo" desc="Invitar usuarios y asignar roles" color="blue" />
                <QuickAction to="/productos" icon={ShoppingBag} title="Catálogo de Productos" desc="Editar precios y SKUs" color="emerald" />
                <QuickAction to="/proveedores" icon={Truck} title="Proveedores" desc="Base de datos de fincas" color="amber" />
                <QuickAction to="/tueste" icon={FileText} title="Configuración Tostadoras" desc="Gestionar máquinas y curvas" color="purple" />
              </div>
            </div>
          )}

          {/* Gráfica Rápida */}
          <div className="bg-stone-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2"><TrendingUp className="text-emerald-400"/> Rendimiento Operativo</h3>
              <p className="text-stone-400 mb-6 max-w-md">
                El inventario de materia prima cubre el <b>100%</b> de la demanda proyectada para esta semana.
              </p>
              <Link to="/ventas" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold transition-colors inline-block">
                Ir al Punto de Venta
              </Link>
            </div>
            <div className="absolute -right-10 -bottom-20 opacity-10"><Coffee size={300} /></div>
          </div>
        </div>

        {/* COLUMNA DERECHA: FEED DE ACTIVIDAD */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 h-fit">
          <h3 className="font-bold text-stone-800 mb-6 flex items-center gap-2">
            <Activity size={18} className="text-emerald-600"/> Actividad en Tiempo Real
          </h3>
          <div className="space-y-6 relative">
            {/* Línea de tiempo vertical */}
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-stone-100"></div>

            {actividad.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-4">No hay actividad reciente.</p>
            ) : (
              actividad.map((item, i) => (
                <div key={i} className="flex gap-4 relative">
                  <div className={`w-5 h-5 rounded-full border-4 border-white shadow-sm shrink-0 z-10 
                    ${item.tipo === 'venta' ? 'bg-emerald-500' : item.tipo === 'tueste' ? 'bg-amber-500' : 'bg-blue-500'}`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-stone-700 leading-tight">{item.texto}</p>
                    <p className="text-xs text-stone-400 mt-1">{new Date(item.fecha).toLocaleString()}</p>
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