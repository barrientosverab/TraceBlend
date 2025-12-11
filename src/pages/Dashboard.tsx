import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Package, Coffee, DollarSign, Activity, 
  Users, Settings, ShoppingBag, Truck, FileText, ChevronRight,
  Building2, ArrowRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getDashboardStats, getActividadReciente, DashboardStats } from '../services/dashboardService';
import { supabase } from '../services/supabaseClient';

interface ActividadItem {
  id: string;
  fecha: string;
  tipo: string;
  texto: string;
}

export function Dashboard() {
  const { orgId, user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<DashboardStats>({ ventas_mes: 0, stock_verde: 0, stock_producto: 0, lotes_pendientes: 0 });
  const [actividad, setActividad] = useState<ActividadItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    // Si no hay sesión o no hay orgId, no intentamos cargar datos para evitar errores 400/500
    if (authLoading || !orgId) {
      setLoadingData(false);
      return; 
    }

    const load = async () => {
      try {
        // Ejecutamos en paralelo para velocidad
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

    load();

    // Realtime: Escuchar cambios en ventas e inventario
    const channel = supabase
      .channel('dashboard-live')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'sales_orders' }, 
        (payload: any) => {
          if (payload.new.organization_id === orgId || payload.old.organization_id === orgId) load(); 
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };

  }, [orgId, authLoading]);

  // Loader inicial
  if (authLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700 mb-4"></div>
        <span className="text-stone-400 font-medium animate-pulse">Iniciando sistema...</span>
      </div>
    );
  }

  // --- SOLUCIÓN DEL BLOQUEO: Pantalla "Terminar Configuración" ---
  // Si el usuario existe pero no tiene orgId, le mostramos el camino al Paso 2.
  if (!orgId) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="max-w-xl w-full bg-white shadow-2xl border border-stone-100 rounded-3xl p-10 text-center relative overflow-hidden">
          {/* Decoración de fondo */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
          
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-sm">
            <Building2 size={40} />
          </div>
          
          <h2 className="text-3xl font-bold text-stone-800 mb-2">¡Cuenta Verificada!</h2>
          <p className="text-stone-500 text-lg mb-8 leading-relaxed">
            Hola <b>{user?.user_metadata?.first_name}</b>, ya tienes acceso al sistema. <br/>
            Solo falta un último paso: configurar tu espacio de trabajo.
          </p>
          
          <button 
            onClick={() => navigate('/registro')} 
            className="w-full bg-stone-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-3 text-lg group"
          >
            Crear mi Organización <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
          </button>
          
          <p className="text-xs text-stone-400 mt-6">
            ¿Fuiste invitado por alguien más? Pídeles que te reenvíen la invitación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">
            Hola, <span className="text-emerald-700">{user?.user_metadata?.first_name || 'Equipo'}</span> 👋
          </h1>
          <p className="text-stone-500 mt-1">Resumen operativo en tiempo real.</p>
        </div>
        <div className="text-right hidden md:block px-4 py-2 bg-white rounded-lg border border-stone-200 shadow-sm">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Organización</p>
          <p className="text-sm font-bold text-stone-700">{/* Nombre org aquí si lo tuvieras en contexto */ 'Tostaduría Principal'}</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard title="Ventas Mes" value={`Bs ${stats.ventas_mes.toLocaleString()}`} icon={DollarSign} color="emerald" />
        <KPICard title="Oro Verde" value={`${stats.stock_verde.toFixed(1)} Kg`} icon={Coffee} color="amber" />
        <KPICard title="Producto Listo" value={`${stats.stock_producto} Uds`} icon={Package} color="purple" />
        <KPICard title="Lotes en Proceso" value={stats.lotes_pendientes} icon={Activity} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Accesos Rápidos */}
        <div className="lg:col-span-2 space-y-8">
          {role === 'administrador' && (
            <div>
              <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
                <Settings size={20} className="text-stone-400"/> Administración Rápida
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickAction to="/usuarios" icon={Users} title="Equipo" desc="Gestionar accesos" color="blue" />
                <QuickAction to="/productos" icon={ShoppingBag} title="Productos" desc="Catálogo y precios" color="emerald" />
                <QuickAction to="/proveedores" icon={Truck} title="Proveedores" desc="Fincas y origen" color="amber" />
                <QuickAction to="/tueste" icon={FileText} title="Producción" desc="Registro de tueste" color="purple" />
              </div>
            </div>
          )}

          {/* Banner Acción Principal */}
          <div className="bg-stone-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                <TrendingUp className="text-emerald-400"/> Punto de Venta Activo
              </h3>
              <p className="text-stone-400 mb-6 max-w-md text-sm">
                Accede rápidamente a la terminal de ventas para registrar pedidos.
              </p>
              <Link to="/ventas" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all inline-flex items-center gap-2 shadow-lg shadow-emerald-900/50">
                Abrir POS <ChevronRight size={18}/>
              </Link>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
              <Coffee size={200} />
            </div>
          </div>
        </div>

        {/* Feed de Actividad */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 h-fit">
          <h3 className="font-bold text-stone-800 mb-6 flex items-center gap-2">
            <Activity size={18} className="text-emerald-600"/> Últimos Movimientos
          </h3>
          <div className="space-y-6 relative pl-2">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-stone-100"></div>
            
            {loadingData ? (
               <p className="text-xs text-stone-400">Cargando...</p>
            ) : actividad.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 italic">No hay actividad reciente.</p>
            ) : (
              actividad.map((item, i) => (
                <div key={i} className="flex gap-4 relative items-start">
                  <div className={`w-4 h-4 mt-1 rounded-full border-2 border-white shadow-sm shrink-0 z-10 
                    ${item.tipo === 'venta' ? 'bg-emerald-500' : item.tipo === 'tueste' ? 'bg-amber-500' : 'bg-blue-500'}`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-stone-700 leading-tight">{item.texto}</p>
                    <p className="text-[10px] text-stone-400 mt-1 font-mono">{new Date(item.fecha).toLocaleString()}</p>
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

// Componentes Auxiliares para limpieza
const KPICard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-stone-800 mt-1">{value}</p>
    </div>
    <div className={`w-10 h-10 bg-${color}-50 rounded-xl flex items-center justify-center text-${color}-600`}>
      <Icon size={20}/>
    </div>
  </div>
);

const QuickAction = ({ to, icon: Icon, title, desc, color }: any) => (
  <Link to={to} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all group">
    <div className={`w-12 h-12 bg-${color}-50 rounded-lg flex items-center justify-center text-${color}-600 group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <div>
      <h3 className="font-bold text-stone-800 text-sm group-hover:text-emerald-700 transition-colors">{title}</h3>
      <p className="text-xs text-stone-400">{desc}</p>
    </div>
  </Link>
);