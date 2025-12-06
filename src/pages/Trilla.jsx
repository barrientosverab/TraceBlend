import React, { useState, useEffect } from 'react';
import { Settings, ArrowRight, Scale, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getLotesParaTrilla, procesarTrilla } from '../services/trillaService';
import {toast} from 'sonner';

export function Trilla() {
  const { orgId, user } = useAuth(); // Necesita user.id también
  const [lotes, setLotes] = useState([]);
  const [selectedLote, setSelectedLote] = useState(null);
  const [loading, setLoading] = useState(false);

  const [pesoEntrada, setPesoEntrada] = useState(''); 
  
  const [mallas, setMallas] = useState([
    { nombre: 'Malla 18 (Premium)', peso: '' },
    { nombre: 'Malla 16 (Segunda)', peso: '' },
    { nombre: 'Malla 14 (Tercera)', peso: '' },
    { nombre: 'Caracol / Peaberry', peso: '' },
    { nombre: 'Base / Pasilla', peso: '' },
    { nombre: 'Cascarilla (Residuo)', peso: '' }, // Este es el que separaremos
  ]);

  // --- NUEVA LÓGICA DE CÁLCULO ---
  const entradaNum = parseFloat(pesoEntrada) || 0;

  // 1. Identificar qué es Oro y qué es Residuo
  const isResiduo = (nombre) => nombre.includes('Cascarilla');

  // 2. Sumar solo el Café Oro (Ventas)
  const totalOro = mallas
    .filter(m => !isResiduo(m.nombre))
    .reduce((acc, m) => acc + (parseFloat(m.peso) || 0), 0);

  // 3. Sumar el Residuo Físico (Cascarilla pesada)
  const totalCascarilla = mallas
    .filter(m => isResiduo(m.nombre))
    .reduce((acc, m) => acc + (parseFloat(m.peso) || 0), 0);

  // 4. Calcular Merma Invisible (Lo que falta para cuadrar)
  // Ecuación: Entrada = Oro + Cascarilla + MermaInvisible
  const mermaInvisible = entradaNum - (totalOro + totalCascarilla);
  
  // 5. Porcentaje de Rendimiento (Oro sobre Entrada)
  const rendimiento = entradaNum > 0 ? ((totalOro / entradaNum) * 100).toFixed(2) : '0.00';

  useEffect(() => {
    cargarLotes();
  }, []);

  const cargarLotes = async () => {
    try {
      const data = await getLotesParaTrilla();
      setLotes(data);
    } catch (e) { console.error(e); }
  };

  const handleMallaChange = (index, val) => {
    const newMallas = [...mallas];
    newMallas[index].peso = val;
    setMallas(newMallas);
  };

  const handleProcesar = async () => {
    if (!selectedLote) return;
    if (entradaNum <= 0) { toast.warning("Ingresa un peso de entrada válido"); return;}
    if (entradaNum > selectedLote.stock_actual) { toast.warning("No tienes suficiente stock"); return;}
    
    // Validación Física: No puedes sacar más kilos de los que metiste
    if (mermaInvisible < -0.1) { toast.error("¡Error Físico! La suma de salidas supera la entrada."); return;}

    toast(`¿Confirmas procesar ${entradaNum}kg?`, {
      description: `Lote: ${selectedLote.codigo_lote} - Finca: ${selectedLote.nombre_finca}`,
      action: {
        label: 'Procesar',
        onClick: async () => {
          // --- AQUÍ SE MUEVE TU LÓGICA DE GUARDADO ---
          setLoading(true);
          try {
            // Asegúrate de pasar orgId y user.id si ya aplicaste la refactorización anterior
            await procesarTrilla(selectedLote.id, entradaNum, mallas, orgId, user.id);
            
            toast.success("Trilla procesada correctamente", {
                description: "Inventario actualizado."
            });

            // Reset del formulario
            setPesoEntrada('');
            setMallas(mallas.map(m => ({ ...m, peso: '' })));
            setSelectedLote(null);
            cargarLotes();
          } catch (error) {
            toast.error("Error al procesar", { description: error.message });
          } finally {
            setLoading(false);
          }
          // ---------------------------------------------
        },
      },
      cancel: {
        label: 'Cancelar',
      },
      duration: 8000, // Damos tiempo suficiente para leer
    });
    setLoading(true);
    try {
      await procesarTrilla(selectedLote.id, entradaNum, mallas, orgId, user.id);
      toast.success("✅ Trilla procesada correctamente.");
      setPesoEntrada('');
      setMallas(mallas.map(m => ({ ...m, peso: '' })));
      setSelectedLote(null);
      cargarLotes();
    } catch (error) {
      toast.error("❌ Error: ",{description: error.message});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-stone-50 overflow-hidden">
      
      {/* SIDEBAR (Igual que antes) */}
      <div className="w-1/3 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-5 bg-stone-800 text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Settings className="text-emerald-400" /> Ordenes de Trilla
          </h2>
          <p className="text-stone-400 text-xs mt-1">Selecciona Materia Prima</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {lotes.map(lote => (
            <div 
              key={lote.id}
              onClick={() => setSelectedLote(lote)}
              className={`p-4 rounded-xl border cursor-pointer hover:shadow-md ${
                selectedLote?.id === lote.id 
                  ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                  : 'border-stone-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex justify-between mb-1">
                <span className="font-bold text-stone-800">{lote.codigo_lote}</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">
                  {lote.stock_actual} Kg
                </span>
              </div>
              <p className="text-sm text-stone-600 font-medium">{lote.nombre_finca}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedLote ? (
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-stone-800">Procesar Lote</h1>
                <p className="text-stone-500">Origen: <span className="font-semibold text-emerald-700">{selectedLote.nombre_finca}</span></p>
              </div>
              <div className="text-right">
                <p className="text-sm text-stone-400">Disponible</p>
                <p className="text-3xl font-mono font-bold text-stone-800">{selectedLote.stock_actual} Kg</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* ENTRADA Y SALIDAS */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-500">
                  <label className="block text-sm font-bold text-stone-700 mb-2 uppercase">Peso Entrada (Materia Prima)</label>
                  <input 
                    type="number" value={pesoEntrada} onChange={e => setPesoEntrada(e.target.value)}
                    className="w-full p-4 text-2xl font-bold border rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
                  <h3 className="font-bold text-stone-700 mb-4 flex items-center gap-2"><Scale size={18}/> Clasificación</h3>
                  <div className="space-y-3">
                    {mallas.map((malla, idx) => {
                      const esCascarilla = isResiduo(malla.nombre);
                      return (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${esCascarilla ? 'bg-red-50 border border-red-100' : 'hover:bg-stone-50'}`}>
                          <span className={`text-sm font-medium ${esCascarilla ? 'text-red-700 flex items-center gap-1' : 'text-stone-600'}`}>
                            {esCascarilla && <Trash2 size={14}/>} {malla.nombre}
                          </span>
                          <div className="w-32 relative">
                            <input 
                              type="number" value={malla.peso} onChange={(e) => handleMallaChange(idx, e.target.value)}
                              className="w-full p-2 border rounded-lg text-right font-mono outline-none focus:border-emerald-500"
                              placeholder="0.00"
                            />
                            <span className="absolute right-8 top-2 text-xs text-stone-300">Kg</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BALANCE DE MASAS (CORREGIDO) */}
              <div className="space-y-6">
                <div className="bg-stone-900 text-white p-6 rounded-2xl shadow-lg">
                  <h3 className="font-bold text-stone-400 mb-6 uppercase text-xs tracking-wider border-b border-stone-700 pb-2">Balance de Materia</h3>
                  
                  {/* Fila 1: Entrada */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-stone-300">Entrada Total</span>
                    <span className="text-xl font-mono">{entradaNum.toFixed(2)} Kg</span>
                  </div>

                  {/* Fila 2: Café Oro (Lo valioso) */}
                  <div className="flex justify-between items-center mb-4 p-3 bg-emerald-900/30 rounded-lg border border-emerald-900">
                    <span className="text-emerald-400 font-bold">Total Café Oro</span>
                    <div className="text-right">
                      <span className="text-2xl font-mono text-emerald-400 block">{totalOro.toFixed(2)} Kg</span>
                      <span className="text-xs text-emerald-200/60">Rendimiento: {rendimiento}%</span>
                    </div>
                  </div>

                  {/* Fila 3: Desperdicios */}
                  <div className="space-y-2 text-sm text-stone-400 mt-6">
                    <div className="flex justify-between">
                      <span className="flex items-center gap-2"><Trash2 size={14}/> Cascarilla (Pesada)</span>
                      <span className="font-mono">{totalCascarilla.toFixed(2)} Kg</span>
                    </div>
                    <div className="flex justify-between text-amber-500">
                      <span className="flex items-center gap-2"><AlertTriangle size={14}/> Merma Invisible (Volátil)</span>
                      <span className="font-mono font-bold">{mermaInvisible.toFixed(2)} Kg</span>
                    </div>
                  </div>

                  {/* Fila 4: Total Merma Global */}
                  <div className="mt-4 pt-4 border-t border-stone-700 flex justify-between text-xs text-stone-500">
                    <span>Pérdida Total (Cáscara + Merma)</span>
                    <span>{(totalCascarilla + mermaInvisible).toFixed(2)} Kg</span>
                  </div>
                </div>

                <button 
                  onClick={handleProcesar}
                  disabled={loading || entradaNum <= 0 || mermaInvisible < -0.5}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-bold rounded-xl shadow-xl flex justify-center items-center gap-2 text-lg transition-all"
                >
                  {loading ? 'Guardando...' : <><CheckCircle size={24}/> Confirmar Trilla</>}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-300">
            <Settings size={80} strokeWidth={1} className="mb-4 text-stone-200"/>
            <p>Selecciona un lote</p>
          </div>
        )}
      </div>
    </div>
  );
}