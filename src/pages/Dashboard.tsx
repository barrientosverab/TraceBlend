import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getDashboardMetrics, DashboardData } from '../services/dashboardService';
import { StockAlerts } from '../components/StockAlerts';
import { TopProductsRanking } from '../components/TopProductsRanking';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Activity, Calendar, ClipboardList
} from 'lucide-react';
import { MetricCard } from '../components/ui';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const { user, profile, orgId } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orgId) {
      getDashboardMetrics(orgId)
        .then(setData)
        .finally(() => setLoading(false));
    }
  }, [orgId]);

  if (loading) return <div className="p-8 text-stone-400 animate-pulse">Cargando tablero de control...</div>;
  if (!data) return <div className="p-8">Sin datos disponibles.</div>;

  // Calculamos salud financiera
  const balance = data.ventasMes - data.gastosMes;
  const esPositivo = balance >= 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* 1. BIENVENIDA Y RESUMEN RÁPIDO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">
            Hola, {profile?.first_name || 'Admin'} 👋
          </h1>
          <p className="text-stone-500 mt-1">Aquí tienes el pulso de tu tostaduría hoy.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-full border border-stone-200 shadow-sm flex items-center gap-2 text-sm font-bold text-stone-600">
          <Calendar size={16} className="text-emerald-600" />
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* 2. TARJETAS KPI (FINANCIERAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Ventas Hoy */}
        <div className="bg-stone-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
          <div className="absolute right-[-20px] top-[-20px] opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={100} />
          </div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-1">Ventas Hoy</p>
          <h3 className="text-3xl font-mono font-bold">Bs {data.ventasHoy.toLocaleString()}</h3>
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 w-fit px-2 py-1 rounded-lg">
            <ShoppingBag size={12} /> {data.transaccionesHoy} transacciones
          </div>
        </div>

        {/* Balance Mes */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
          <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Balance Mensual</p>
          <h3 className={`text-3xl font-mono font-bold ${esPositivo ? 'text-emerald-600' : 'text-red-500'}`}>
            {esPositivo ? '+' : ''}Bs {balance.toLocaleString()}
          </h3>
          <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
            {esPositivo ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            Ingresos vs Gastos
          </p>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Ticket Promedio</p>
          <h3 className="text-3xl font-mono font-bold text-stone-800">Bs {data.ticketPromedio.toFixed(1)}</h3>
          <p className="text-xs text-stone-400 mt-2">Promedio por cliente hoy</p>
        </div>

        {/* Gastos Mes */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <p className="text-stone-500 text-xs font-bold uppercase tracking-wider mb-1">Gastos Ejecutados</p>
          <h3 className="text-3xl font-mono font-bold text-red-500">- Bs {data.gastosMes.toLocaleString()}</h3>
          <p className="text-xs text-stone-400 mt-2">Salidas registradas este mes</p>
        </div>
      </div>

      {/* 3. SECCIÓN MIXTA (META + ALERTAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Columna Izquierda: Meta Diaria Visual */}
        <div className="lg:col-span-2 bg-gradient-to-br from-emerald-50 to-white p-6 rounded-3xl border border-emerald-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-xl text-stone-800 flex items-center gap-2">
                <Activity className="text-emerald-600" /> Cobertura Diaria
              </h3>
              <p className="text-sm text-stone-500">Progreso para cubrir costos operativos del día.</p>
            </div>
            <span className="text-3xl font-bold text-emerald-700">{data.progresoMeta.toFixed(0)}%</span>
          </div>

          {/* Barra de Progreso Custom */}
          <div className="h-6 w-full bg-stone-200 rounded-full overflow-hidden shadow-inner relative">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
              style={{ width: `${data.progresoMeta}%` }}
            >
              {data.progresoMeta > 20 && <span className="text-[10px] font-bold text-white shadow-sm">META</span>}
            </div>
            {/* Marca del 100% */}
            <div className="absolute top-0 bottom-0 left-[100%] w-0.5 bg-stone-400 z-10 border-l border-dashed"></div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-emerald-50">
              <p className="text-[10px] uppercase font-bold text-stone-400">Estado</p>
              <p className="font-bold text-emerald-700">{data.progresoMeta >= 100 ? 'Ganancia 🚀' : 'Cubriendo ⏳'}</p>
            </div>
            {/* Puedes agregar más métricas derivadas aquí */}
          </div>
        </div>

        {/* Columna Derecha: Alertas de Stock con Componente Mejorado */}
        <StockAlerts />

      </div>

      {/* 4. TOP PRODUCTOS MÁS VENDIDOS */}
      <TopProductsRanking days={30} limit={10} />

      {/* 5. ACCESOS RÁPIDOS ADMINISTRATIVOS */}
      {profile?.role === 'administrador' && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
          <h3 className="font-bold text-lg text-stone-800 mb-4">Accesos Rápidos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.location.href = '/cierres-historico'}
              className="p-4 bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200 hover:border-emerald-400 transition-all hover:shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                  <ClipboardList size={24} className="text-emerald-700" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-stone-800 group-hover:text-emerald-700 transition-colors">Cierres de Caja</p>
                  <p className="text-xs text-stone-500">Historial y reportes</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}