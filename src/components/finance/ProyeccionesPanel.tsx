import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, RefreshCcw, AlertTriangle, CalendarDays
} from 'lucide-react';
import { 
  getHistoricalFinancials, getPendingAccounts, HistoricalFinancial
} from '../../services/gastosService';

export function ProyeccionesPanel() {
  const { orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Data
  interface FormattedHistory extends HistoricalFinancial {
    label: string;
    profit: number;
  }
  const [history, setHistory] = useState<FormattedHistory[]>([]);
  const [projectedBalance, setProjectedBalance] = useState({ current: 0, pendingIn: 0, pendingOut: 0, final: 0 });

  useEffect(() => {
    if (orgId) {
      cargarDashboard();
    }
  }, [orgId]);

  const cargarDashboard = async () => {
    setLoading(true);
    try {
      // 1. Histórico de 6 meses
      const histData = await getHistoricalFinancials(orgId!, 6);
      
      // Añadir la utilidad neta a los datos históricos para el gráfico
      const formattedHistory = histData.map(d => ({
        ...d,
        label: formatMonth(d.month_year),
        profit: d.sales - d.expenses
      }));
      setHistory(formattedHistory);

      // 2. Cuentas Pendientes para Cash Flow de Corto Plazo
      const pending = await getPendingAccounts(orgId!);
      
      const totalIn = pending.receivables.reduce((acc, current) => acc + (current.total_amount - (current.paid_amount || 0)), 0);
      const totalOut = pending.payables.reduce((acc, current) => acc + (current.total_amount - (current.paid_amount || 0)), 0);
      
      // Asumiremos que el saldo actual de caja disponible del mes actual proviene del historial más reciente
      const currentMonthData = formattedHistory.length > 0 ? formattedHistory[formattedHistory.length - 1] : { profit: 0 };
      const baseCash = Math.max(0, currentMonthData.profit); // Solo como referencia simplificada

      setProjectedBalance({
        current: baseCash,
        pendingIn: totalIn,
        pendingOut: totalOut,
        final: baseCash + totalIn - totalOut
      });

    } catch (error) {
      console.error(error);
      toast.error('Error al cargar proyecciones');
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (period: string) => {
    if (!period) return '';
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('es-ES', { month: 'short', year: '2-digit' }).toUpperCase();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-stone-200 shadow-xl rounded-lg text-sm">
          <p className="font-bold text-stone-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="font-bold text-xs flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span>Bs {entry.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200">
        <div>
          <h2 className="text-lg font-black text-stone-800">Proyecciones y Flujo de Caja</h2>
          <p className="text-xs text-stone-500">Basado en datos históricos y cuentas pendientes cruzadas</p>
        </div>
        <button 
          disabled={loading}
          onClick={cargarDashboard}
          className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Tarjetas de Cash Flow de Corto Plazo */}
      <h3 className="font-bold text-stone-800 text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
        <CalendarDays size={16} className="text-stone-400" /> Flujo de Caja Esperado (Corto Plazo)
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
          <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Base de Caja Estimada</h4>
          <p className="text-2xl font-black text-stone-800">Bs {projectedBalance.current.toLocaleString()}</p>
          <p className="text-[10px] text-stone-400 mt-2 font-medium">Beneficio del mes en curso</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-0"></div>
          <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 relative z-10 flex items-center gap-1">
            <TrendingUp size={12}/> Por Cobrar (In)
          </h4>
          <p className="text-2xl font-black text-emerald-600 relative z-10">+ Bs {projectedBalance.pendingIn.toLocaleString()}</p>
          <p className="text-[10px] text-stone-500 mt-2 font-medium relative z-10">De clientes B2B pendientes</p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-50 rounded-bl-full -z-0"></div>
          <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1 relative z-10 flex items-center gap-1">
            <TrendingDown size={12}/> Por Pagar (Out)
          </h4>
          <p className="text-2xl font-black text-red-600 relative z-10">- Bs {projectedBalance.pendingOut.toLocaleString()}</p>
          <p className="text-[10px] text-stone-500 mt-2 font-medium relative z-10">Deudas a proveedores</p>
        </div>

        <div className="bg-stone-900 p-4 rounded-2xl shadow-lg border border-stone-800 relative overflow-hidden">
          <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Cash Flow Proyectado</h4>
          <p className={`text-2xl font-black ${projectedBalance.final < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            Bs {projectedBalance.final.toLocaleString()}
          </p>
          <p className="text-[10px] text-stone-400 mt-2 font-medium">Liquidez estimada final</p>
        </div>
      </div>

      {/* Gráfico de Proyección Histórica (Medio Plazo) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-stone-800 flex items-center gap-2 text-sm uppercase tracking-wider">
              <TrendingUp size={16} className="text-stone-400" /> Histórico y Tendencia (Últimos 6 meses)
            </h3>
            <p className="text-xs text-stone-500 mt-1">Evolución de Beneficios y Gastos para predecir el próximo mes.</p>
          </div>
          {history.length > 0 && history[history.length - 1].profit < 0 && (
            <div className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-1">
              <AlertTriangle size={14} /> El último mes registró pérdidas
            </div>
          )}
        </div>

        {history.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-stone-400">
            <TrendingUp size={48} className="mb-2 opacity-20" />
            <p>No hay suficientes datos históricos para graficar.</p>
          </div>
        ) : (
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7E5E4" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#78716C', fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#A8A29E' }} tickFormatter={(value) => `Bs ${(value / 1000).toFixed(0)}k`} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                
                <Line type="monotone" dataKey="sales" name="Ventas Reales" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expenses" name="Gastos Salientes" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} />
                <Line type="monotone" dataKey="profit" name="Beneficio Neto" stroke="#3B82F6" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </div>
  );
}
