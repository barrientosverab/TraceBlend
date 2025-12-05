import React, { useState, useEffect } from 'react';
import { FlaskConical, ClipboardCheck, Scale, Ruler, Coffee } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getLotesParaAnalisis, guardarAnalisis } from '../services/laboratorioService';
import {toast} from 'sonner';

export function Laboratorio() {
  const { orgId } = useAuth();
  const [lotes, setLotes] = useState([]);
  const [selectedLote, setSelectedLote] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estado del Formulario
  const [analisis, setAnalisis] = useState({
    // 1. Análisis Físico General
    peso_muestra: 250, // Estándar de 250g o 300g
    peso_oro: '',      // Cuanto café verde limpio quedó
    humedad: '',
    densidad: '',      // g/ml
    
    // 2. Granulometría (Gramos retenidos por malla)
    malla_18: 0,
    malla_16: 0,
    malla_14: 0,
    base: 0,
    defectos: 0,

    // 3. Análisis Sensorial
    puntaje_cata: '',
    notas_cata: ''
  });

  // Cargar lotes al inicio
  useEffect(() => {
    cargarLotes();
  }, []);

  const cargarLotes = async () => {
    try {
      const data = await getLotesParaAnalisis();
      setLotes(data);
    } catch (e) { console.error(e); }
  };

  // Cálculo automático del Factor de Rendimiento (Visual)
  const factorRendimiento = analisis.peso_muestra && analisis.peso_oro 
    ? ((analisis.peso_oro / analisis.peso_muestra) * 100).toFixed(2) 
    : '0.00';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAnalisis(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    if (!selectedLote) return;
    setLoading(true);
    try {
      await guardarAnalisis(selectedLote.id, analisis, orgId);
      toast.success("✅ Reporte de Laboratorio registrado exitosamente");
      
      // Limpiar y recargar
      setAnalisis({
        peso_muestra: 250, peso_oro: '', humedad: '', densidad: '',
        malla_18: 0, malla_16: 0, malla_14: 0, base: 0, defectos: 0,
        puntaje_cata: '', notas_cata: ''
      });
      setSelectedLote(null);
      cargarLotes();
    } catch (e) {
      toast.error("Error: ",{description: e.message});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-stone-50 overflow-hidden">
      
      {/* SIDEBAR: Lista de Lotes Disponibles */}
      <div className="w-1/3 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-5 bg-emerald-900 text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <FlaskConical className="text-amber-400" /> Muestras Pendientes
          </h2>
          <p className="text-emerald-200 text-xs mt-1">Lotes de materia prima en bodega</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {lotes.length === 0 && <p className="text-center text-stone-400 mt-10">No hay lotes para analizar.</p>}
          {lotes.map(lote => (
            <div 
              key={lote.id}
              onClick={() => setSelectedLote(lote)}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                selectedLote?.id === lote.id 
                  ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                  : 'border-stone-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex justify-between mb-1">
                <span className="font-bold text-stone-800 text-sm">{lote.codigo_lote}</span>
                <span className="text-xs bg-stone-100 px-2 py-1 rounded text-stone-600">{lote.estado_ingreso}</span>
              </div>
              <p className="text-sm text-emerald-800 font-medium">{lote.nombre_finca}</p>
              <p className="text-xs text-stone-400 mt-1">{lote.variedad} - {lote.proceso}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN: Formulario de Laboratorio */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedLote ? (
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b pb-4 border-stone-200">
              <div>
                <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
                  <ClipboardCheck className="text-emerald-600"/> Reporte de Calidad
                </h2>
                <p className="text-stone-500">Lote: <span className="font-mono font-bold text-stone-700">{selectedLote.codigo_lote}</span></p>
              </div>
              <div className="text-right bg-emerald-100 px-4 py-2 rounded-lg">
                <p className="text-xs text-emerald-800 font-bold uppercase">Factor Rendimiento</p>
                <p className="text-2xl font-bold text-emerald-900">{factorRendimiento}%</p>
              </div>
            </div>

            {/* SECCIÓN 1: FÍSICO Y RENDIMIENTO */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="text-sm font-bold text-stone-400 uppercase mb-4 flex items-center gap-2">
                <Scale size={16}/> 1. Rendimiento y Física
              </h3>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Peso Muestra (g)</label>
                  <input type="number" name="peso_muestra" value={analisis.peso_muestra} onChange={handleChange} className="w-full p-2 border rounded font-mono text-center" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Peso Oro (g)</label>
                  <input type="number" name="peso_oro" value={analisis.peso_oro} onChange={handleChange} className="w-full p-2 border rounded border-emerald-300 bg-emerald-50 font-mono text-center font-bold" placeholder="0.00"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">% Humedad Real</label>
                  <input type="number" step="0.1" name="humedad" value={analisis.humedad} onChange={handleChange} className="w-full p-2 border rounded text-center" placeholder="11.5"/>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Densidad (g/ml)</label>
                  <input type="number" step="0.01" name="densidad" value={analisis.densidad} onChange={handleChange} className="w-full p-2 border rounded text-center" placeholder="0.75"/>
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: GRANULOMETRÍA (MALLAS) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="text-sm font-bold text-stone-400 uppercase mb-4 flex items-center gap-2">
                <Ruler size={16}/> 2. Granulometría (Gramos retenidos)
              </h3>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <label className="block text-xs font-bold text-stone-600 mb-1">Malla 18</label>
                  <input type="number" name="malla_18" value={analisis.malla_18} onChange={handleChange} className="w-full p-2 border rounded text-center font-mono"/>
                </div>
                <div className="text-center">
                  <label className="block text-xs font-bold text-stone-600 mb-1">Malla 16</label>
                  <input type="number" name="malla_16" value={analisis.malla_16} onChange={handleChange} className="w-full p-2 border rounded text-center font-mono"/>
                </div>
                <div className="text-center">
                  <label className="block text-xs font-bold text-stone-600 mb-1">Malla 14</label>
                  <input type="number" name="malla_14" value={analisis.malla_14} onChange={handleChange} className="w-full p-2 border rounded text-center font-mono"/>
                </div>
                <div className="text-center">
                  <label className="block text-xs font-bold text-stone-600 mb-1">Base / Pasilla</label>
                  <input type="number" name="base" value={analisis.base} onChange={handleChange} className="w-full p-2 border rounded text-center font-mono bg-red-50"/>
                </div>
                <div className="text-center">
                  <label className="block text-xs font-bold text-stone-600 mb-1">Defectos (g)</label>
                  <input type="number" name="defectos" value={analisis.defectos} onChange={handleChange} className="w-full p-2 border rounded text-center font-mono bg-red-50"/>
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: CATA */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-200">
              <h3 className="text-sm font-bold text-stone-400 uppercase mb-4 flex items-center gap-2">
                <Coffee size={16}/> 3. Análisis Sensorial
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Puntaje SCA</label>
                  <input type="number" step="0.25" name="puntaje_cata" value={analisis.puntaje_cata} onChange={handleChange} className="w-full p-3 border rounded-lg text-xl font-bold text-emerald-700 text-center" placeholder="80.00"/>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-stone-600 mb-1">Notas de Cata</label>
                  <textarea name="notas_cata" rows="2" value={analisis.notas_cata} onChange={handleChange} className="w-full p-3 border rounded-lg resize-none" placeholder="Fragancia floral, acidez cítrica, cuerpo medio..."></textarea>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex justify-end pt-4 pb-12">
              <button 
                onClick={handleGuardar}
                disabled={loading}
                className="bg-emerald-700 text-white px-10 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-800 transition-all flex items-center gap-2"
              >
                {loading ? 'Guardando...' : <><ClipboardCheck size={20}/> Guardar Reporte</>}
              </button>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-300">
            <FlaskConical size={80} strokeWidth={1} className="mb-4 text-stone-200"/>
            <p className="text-xl font-medium text-stone-400">Selecciona un lote para analizar</p>
          </div>
        )}
      </div>
    </div>
  );
}