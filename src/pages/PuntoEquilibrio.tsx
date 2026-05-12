import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TrendingUp, Info, Save, Calculator, CheckCircle } from 'lucide-react';
import { 
  getBreakEvenConfig, 
  saveBreakEvenConfig, 
  calculateBreakEven, 
  BreakEvenConfig, 
  BreakEvenMetrics 
} from '../services/breakEvenService';
import { toast } from 'sonner';

export function PuntoEquilibrio() {
  const { orgId } = useAuth();
  const [config, setConfig] = useState<BreakEvenConfig>({ margenContribucionPct: 60, diasAperturaMes: 22 });
  const [metrics, setMetrics] = useState<BreakEvenMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    const savedConfig = getBreakEvenConfig(orgId);
    setConfig(savedConfig);
    const calculatedMetrics = await calculateBreakEven(orgId);
    setMetrics(calculatedMetrics);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  const handleSave = async () => {
    if (!orgId) return;
    saveBreakEvenConfig(orgId, config);
    toast.success('Configuración guardada correctamente.');
    await loadData(); // Recargar métricas
  };

  if (loading) return <div className="p-8 text-stone-400 animate-pulse">Cargando métricas...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
          <TrendingUp className="text-emerald-600" size={32} />
          Punto de Equilibrio
        </h1>
        <p className="text-stone-500 mt-2 text-sm max-w-2xl">
          Configura tus parámetros operativos para descubrir exactamente cuántas ventas necesitas cada día para cubrir tus gastos fijos (alquiler, sueldos, etc.) y empezar a generar ganancias.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PARÁMETROS CONFIGURABLES */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 col-span-1">
          <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
            <Calculator className="text-amber-500" />
            Configuración
          </h2>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs font-bold text-stone-500 uppercase">Margen de Contribución (%)</label>
                <div className="relative group flex items-center">
                  <Info className="text-emerald-500 cursor-help" size={16} />
                  {/* Tooltip personalizado */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-64 bg-stone-900 text-white text-xs p-3 rounded-xl shadow-xl z-10 pointer-events-none fade-in">
                    <p className="font-bold text-emerald-400 mb-1">Ejemplo práctico:</p>
                    <p>Si vendes un café en Bs 20, y los ingredientes (leche, café, vaso) te cuestan Bs 8, te quedan Bs 12.</p>
                    <p className="mt-1">Tus Bs 12 representan un <strong>60% de Margen</strong> para "contribuir" a pagar el alquiler y los sueldos fijos.</p>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-stone-900 rotate-45"></div>
                  </div>
                </div>
              </div>
              <input 
                type="number" 
                value={config.margenContribucionPct}
                onChange={(e) => setConfig({...config, margenContribucionPct: Number(e.target.value)})}
                className="w-full p-3 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-500 uppercase block mb-2">Días de Apertura al Mes</label>
              <input 
                type="number" 
                value={config.diasAperturaMes}
                onChange={(e) => setConfig({...config, diasAperturaMes: Number(e.target.value)})}
                className="w-full p-3 font-bold text-stone-700 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                placeholder="Ej. 22"
              />
            </div>

            <button 
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 py-3 bg-stone-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-all mt-4"
            >
              <Save size={18} /> Guardar Parámetros
            </button>
          </div>
        </div>

        {/* MÉTRICAS CALCULADAS */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-stone-900 p-6 or p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-5">
              <TrendingUp size={150} />
            </div>

            <p className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-2">Tu Meta Diaria de Supervivencia</p>
            <div className="flex items-end gap-3 mb-6">
              <h2 className="text-5xl font-mono font-bold">Bs {metrics?.metaVentasDia.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
              <span className="text-stone-400 font-bold tracking-wider mb-2">/ día</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-4">
                <p className="text-stone-400 text-xs font-bold uppercase mb-1">Tazas/Ventas Mínimas</p>
                <p className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-amber-400">{metrics?.tazasNecesariasDia}</span> 
                  <span className="text-sm text-stone-500 mt-1">unidades</span>
                </p>
              </div>
              <div className="bg-stone-800/50 border border-stone-700 rounded-xl p-4">
                <p className="text-stone-400 text-xs font-bold uppercase mb-1">Punto Equilibrio Mensual</p>
                <p className="text-2xl font-bold">Bs {metrics?.puntoEquilibrioMes.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              </div>
            </div>
          </div>

          {/* DESGLOSE MATEMÁTICO */}
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-stone-50 p-4 border-b border-stone-200">
              <h3 className="font-bold text-stone-700 text-sm">Resumen de Cálculo</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center text-sm p-2 hover:bg-stone-50 rounded-lg">
                <span className="text-stone-500 font-bold">Gastos Fijos Activos (mes)</span>
                <span className="font-mono text-stone-800 font-bold">Bs {metrics?.gastosFijosMes.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-2 hover:bg-stone-50 rounded-lg">
                <span className="text-stone-500 font-bold">Ticket Promedio (mes actual)</span>
                <span className="font-mono text-emerald-700 font-bold">Bs {metrics?.ticketPromedio.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center text-sm p-2 hover:bg-stone-50 rounded-lg">
                <span className="text-stone-500 font-bold">Margen de Rentabilidad</span>
                <span className="font-mono text-amber-600 font-bold">{config.margenContribucionPct}%</span>
              </div>
              <div className="mt-4 p-3 bg-emerald-50 rounded-xl flex items-start gap-3 border border-emerald-100">
                <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={18} />
                <p className="text-xs text-emerald-800 font-medium">
                  Hemos cruzado tus gastos con el desempeño real de esta cuenta. Cualquier boliviano (Bs) ganado por encima de <strong>Bs {metrics?.metaVentasDia.toLocaleString(undefined, {maximumFractionDigits: 0})}</strong> hoy, es ganancia neta para tu bolsillo.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
