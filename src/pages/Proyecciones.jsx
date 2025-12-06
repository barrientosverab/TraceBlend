import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, Calculator, ArrowRight, Package, Droplets, Flame, FileText, Info 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner'; // Feedback visual
import { getLotesParaProyeccion } from '../services/proyeccionesService';

export function Proyecciones() {
  const { orgId } = useAuth();
  const [lotes, setLotes] = useState([]);
  const [selectedLote, setSelectedLote] = useState(null);
  
  const [params, setParams] = useState({
    rendimiento_trilla: 80, 
    merma_tueste: 18,       
    peso_empaque: 250,      
    precio_venta: 60        
  });

  useEffect(() => {
    if (orgId) cargarDatos();
  }, [orgId]);

  const cargarDatos = async () => {
    try {
      const data = await getLotesParaProyeccion(orgId);
      setLotes(data);
    } catch (e) { console.error(e); }
  };

  // --- LOGICA DE SELECCIÓN INTELIGENTE ---
  const handleSelectLote = (lote) => {
    setSelectedLote(lote);
    
    // Si el lote tiene datos reales de laboratorio, los usamos
    if (lote.rendimiento_lab) {
      setParams(prev => ({
        ...prev,
        rendimiento_trilla: parseFloat(lote.rendimiento_lab.toFixed(2))
      }));
      toast.info("Datos de laboratorio cargados", {
        description: `Rendimiento físico real: ${lote.rendimiento_lab.toFixed(2)}%`
      });
    } else {
      // Si no, volvemos al estándar o mantenemos el último (opcional: resetear a 80)
      // setParams(prev => ({ ...prev, rendimiento_trilla: 80 }));
    }
  };

  const calcularEscenario = () => {
    if (!selectedLote) return null;

    const pesoEntrada = selectedLote.stock_actual;
    const pesoOro = pesoEntrada * (params.rendimiento_trilla / 100);
    const mermaTrilla = pesoEntrada - pesoOro;

    const pesoTostado = pesoOro * (1 - (params.merma_tueste / 100));
    const mermaTueste = pesoOro - pesoTostado;

    const pesoBolsaKg = params.peso_empaque / 1000;
    const totalBolsas = Math.floor(pesoTostado / pesoBolsaKg);
    const remanente = pesoTostado - (totalBolsas * pesoBolsaKg);

    const ingresoBruto = totalBolsas * params.precio_venta;
    const costoLote = selectedLote.costo_total; 
    
    const gananciaBruta = ingresoBruto - costoLote;
    const margen = ingresoBruto > 0 ? (gananciaBruta / ingresoBruto) * 100 : 0;

    return {
      pesoOro, mermaTrilla,
      pesoTostado, mermaTueste,
      totalBolsas, remanente,
      ingresoBruto, gananciaBruta, margen
    };
  };

  const results = calcularEscenario();

  return (
    <div className="flex h-[calc(100vh-64px)] bg-stone-50 overflow-hidden">
      
      {/* SIDEBAR: SELECCIÓN */}
      <div className="w-80 bg-white border-r border-stone-200 flex flex-col shrink-0 z-20">
        <div className="p-5 border-b border-stone-100">
          <h2 className="font-bold text-lg text-stone-800 flex items-center gap-2">
            <Calculator className="text-emerald-600"/> Proyecciones
          </h2>
          <p className="text-stone-400 text-xs mt-1">Selecciona para simular ROI</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {lotes.map(lote => (
            <div 
              key={lote.id} 
              onClick={() => handleSelectLote(lote)} // <--- Usamos el nuevo handler
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedLote?.id === lote.id ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-stone-200 hover:border-emerald-300'}`}
            >
              <div className="flex justify-between font-bold text-stone-800 mb-1">
                <span>{lote.codigo}</span>
                <span className="text-emerald-600">{lote.stock_actual.toFixed(0)} Kg</span>
              </div>
              <div className="flex justify-between items-center text-xs text-stone-500">
                <span>{lote.origen}</span>
                {/* Badge si tiene datos de lab */}
                {lote.rendimiento_lab && (
                  <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
                    <Droplets size={10}/> Lab
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedLote && results ? (
          <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* HEADER DEL LOTE CON DESCRIPCIÓN (NUEVO) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                  {selectedLote.codigo} 
                  <span className="text-sm font-normal text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
                    {selectedLote.variedad}
                  </span>
                </h3>
                {/* Aquí mostramos la descripción del lote */}
                {selectedLote.notas && (
                  <p className="text-stone-500 mt-2 text-sm flex items-start gap-2 max-w-2xl">
                    <FileText size={16} className="shrink-0 mt-0.5"/> 
                    {selectedLote.notas}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-stone-400 uppercase font-bold">Inversión Inicial</p>
                <p className="text-2xl font-mono text-stone-800 font-bold">Bs {selectedLote.costo_total.toLocaleString()}</p>
              </div>
            </div>

            {/* CONTROLES (Con indicador de dato real) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1 flex justify-between">
                    Rendimiento Trilla (%)
                    {selectedLote.rendimiento_lab && <span className="text-blue-600 text-[10px] flex items-center gap-1"><Info size={10}/> Real (Lab)</span>}
                  </label>
                  <div className="relative">
                    <Droplets size={16} className={`absolute left-3 top-3 ${selectedLote.rendimiento_lab ? 'text-blue-500' : 'text-stone-400'}`}/>
                    <input type="number" 
                      className={`w-full pl-9 p-2 border rounded-lg font-bold ${selectedLote.rendimiento_lab ? 'border-blue-200 bg-blue-50 text-blue-900' : 'text-stone-700'}`}
                      value={params.rendimiento_trilla} 
                      onChange={e => setParams({...params, rendimiento_trilla: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                {/* ... (Resto de inputs iguales: Merma Tueste, Peso, Precio) ... */}
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Merma Tueste (%)</label>
                  <div className="relative">
                    <Flame size={16} className="absolute left-3 top-3 text-amber-500"/>
                    <input type="number" className="w-full pl-9 p-2 border rounded-lg font-bold text-stone-700" 
                      value={params.merma_tueste} 
                      onChange={e => setParams({...params, merma_tueste: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Peso Empaque (g)</label>
                  <div className="relative">
                    <Package size={16} className="absolute left-3 top-3 text-purple-400"/>
                    <input type="number" className="w-full pl-9 p-2 border rounded-lg font-bold text-stone-700" 
                      value={params.peso_empaque} 
                      onChange={e => setParams({...params, peso_empaque: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Precio Venta (Bs)</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-3 top-3 text-emerald-500"/>
                    <input type="number" className="w-full pl-9 p-2 border-2 border-emerald-100 bg-emerald-50/50 rounded-lg font-bold text-emerald-700" 
                      value={params.precio_venta} 
                      onChange={e => setParams({...params, precio_venta: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* FLUJO Y RESULTADOS (Igual que antes) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl border-l-4 border-blue-400 shadow-sm">
                <p className="text-xs font-bold text-blue-900 uppercase mb-1">1. Trilla</p>
                <p className="text-3xl font-bold text-stone-800">{results.pesoOro.toFixed(1)} <span className="text-sm font-normal text-stone-400">Kg Oro</span></p>
              </div>
              <div className="bg-white p-6 rounded-2xl border-l-4 border-amber-400 shadow-sm">
                <p className="text-xs font-bold text-amber-900 uppercase mb-1">2. Tueste</p>
                <p className="text-3xl font-bold text-stone-800">{results.pesoTostado.toFixed(1)} <span className="text-sm font-normal text-stone-400">Kg Tostado</span></p>
              </div>
              <div className="bg-white p-6 rounded-2xl border-l-4 border-purple-400 shadow-sm">
                <p className="text-xs font-bold text-purple-900 uppercase mb-1">3. Producto</p>
                <p className="text-3xl font-bold text-stone-800">{results.totalBolsas} <span className="text-sm font-normal text-stone-400">Uds</span></p>
              </div>
            </div>

            <div className="bg-stone-900 text-white rounded-2xl p-8 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div>
                  <p className="text-stone-400 text-xs font-bold uppercase mb-1">Ingreso Bruto</p>
                  <p className="text-3xl font-bold text-white">Bs {results.ingresoBruto.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-emerald-400 text-xs font-bold uppercase mb-1">Ganancia Estimada</p>
                  <p className="text-4xl font-bold text-emerald-400">Bs {results.gananciaBruta.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-4 py-2 rounded-lg font-bold text-xl ${results.margen > 30 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    ROI: {results.margen.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-300">
            <Calculator size={80} strokeWidth={1} className="mb-6 opacity-50"/>
            <h2 className="text-xl font-bold text-stone-400">Simulador de Rentabilidad</h2>
            <p className="text-sm mt-2">Selecciona un lote para proyectar sus ganancias.</p>
          </div>
        )}
      </div>
    </div>
  );
}