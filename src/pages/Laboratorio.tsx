import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getLotesParaAnalisis, guardarAnalisis, AnalisisForm, LoteAnalisis } from '../services/laboratorioService';
import { toast } from 'sonner';
import { FlaskConical, Save, Calculator, Activity, Droplets } from 'lucide-react';

export function Laboratorio() {
  const { orgId } = useAuth();
  const [lotes, setLotes] = useState<LoteAnalisis[]>([]);
  const [selected, setSelected] = useState('');
  
  const [form, setForm] = useState<AnalisisForm>({
    peso_muestra: 250, // Estándar SCA suele ser 250g o 300g
    peso_oro: '', // Lo que queda después de trillar la muestra
    humedad: '', 
    densidad: '', 
    malla_18: '', malla_16: '', malla_14: '', base: '', defectos: '', 
    puntaje_cata: '', notas_cata: ''
  });

  useEffect(() => { if(orgId) getLotesParaAnalisis().then(setLotes); }, [orgId]);

  // --- CÁLCULOS AUTOMÁTICOS EN TIEMPO REAL ---
  const calcularRendimiento = () => {
    const entrada = Number(form.peso_muestra) || 0;
    const salida = Number(form.peso_oro) || 0;
    
    if (entrada === 0) return { rendimiento: 0, merma: 0, factor: 0 };

    const rendimiento = (salida / entrada) * 100;
    const merma = 100 - rendimiento;
    
    // Factor de Rendimiento (Cuántos Kilos de pergamino necesito para 1 saco de 70kg Oro)
    // Fórmula común: (Peso Muestra / Peso Oro) * 70 (o la base que usen, ej. 85)
    // Usaremos base 70kg exportable estándar.
    const factor = salida > 0 ? (entrada / salida) * 70 : 0;

    return { 
      rendimiento: rendimiento.toFixed(2), 
      merma: merma.toFixed(2),
      factor: factor.toFixed(1)
    };
  };

  const stats = calcularRendimiento();

  const handleSave = async () => {
    if(!selected) return toast.warning("Selecciona lote");
    try {
      await guardarAnalisis(selected, form, orgId!);
      toast.success("Reporte de Calidad Guardado");
      setForm({ ...form, peso_oro: '', humedad: '', puntaje_cata: '', notas_cata: '' });
      setSelected('');
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
          <FlaskConical className="text-emerald-600" size={32}/> 
          Laboratorio de Calidad
        </h1>
        <div className="px-4 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-700">
          Análisis Físico & Sensorial
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: SELECCIÓN Y CÁLCULOS (ESTILO NEGRO) */}
        <div className="lg:col-span-1 space-y-6">
           {/* Selector */}
           <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
              <label className="font-bold text-stone-500 text-xs uppercase tracking-wider">Lote a Analizar</label>
              <select 
                className="w-full mt-2 p-3 border rounded-xl bg-stone-50 font-medium outline-none focus:ring-2 focus:ring-emerald-500" 
                value={selected} 
                onChange={e=>setSelected(e.target.value)}
              >
                <option value="">-- Seleccionar Lote --</option>
                {lotes.map(l => <option key={l.id} value={l.id}>{l.codigo_lote} • {l.nombre_finca}</option>)}
              </select>
           </div>

           {/* TARJETA DE CÁLCULOS (ESTILO CONTRASTE) */}
           <div className="bg-stone-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Calculator size={64}/></div>
              
              <h3 className="text-emerald-400 font-bold text-sm uppercase mb-6 flex items-center gap-2">
                <Activity size={16}/> Resultados Físicos
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-end border-b border-stone-700 pb-2">
                  <span className="text-stone-400 text-sm">Rendimiento</span>
                  <span className="text-2xl font-mono font-bold text-white">{stats.rendimiento}%</span>
                </div>
                <div className="flex justify-between items-end border-b border-stone-700 pb-2">
                  <span className="text-stone-400 text-sm">Merma Trilla</span>
                  <span className="text-2xl font-mono font-bold text-amber-500">{stats.merma}%</span>
                </div>
                <div>
                  <span className="text-stone-400 text-xs uppercase font-bold">Factor (Base 70kg)</span>
                  <div className="text-4xl font-mono font-bold text-emerald-400 mt-1">{stats.factor}</div>
                  <p className="text-[10px] text-stone-500 mt-1">Kilos pergamino para 1 saco exportable</p>
                </div>
              </div>
           </div>
        </div>

        {/* COLUMNA 2: FORMULARIO DE DATOS */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-lg border border-stone-100 space-y-8">
           
           {/* Análisis Físico */}
           <div>
             <h4 className="font-bold text-stone-800 border-b-2 border-emerald-100 pb-2 mb-4 flex items-center gap-2">
                <Droplets size={18} className="text-emerald-600"/> Variables Físicas
             </h4>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">Muestra (g)</label>
                  <input type="number" className="w-full p-3 bg-stone-50 border rounded-xl font-bold" value={form.peso_muestra} onChange={e=>setForm({...form, peso_muestra: e.target.value})}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">Oro (g)</label>
                  <input type="number" className="w-full p-3 border-2 border-emerald-100 bg-emerald-50/30 rounded-xl font-bold text-emerald-800" value={form.peso_oro} onChange={e=>setForm({...form, peso_oro: e.target.value})}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">% Humedad</label>
                  <input type="number" className="w-full p-3 border rounded-xl" value={form.humedad} onChange={e=>setForm({...form, humedad: e.target.value})}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">Densidad</label>
                  <input type="number" className="w-full p-3 border rounded-xl" value={form.densidad} onChange={e=>setForm({...form, densidad: e.target.value})}/>
                </div>
             </div>
           </div>

           {/* Granulometría (Mallas) - Opcional, comprimido */}
           <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
              <label className="text-xs font-bold text-stone-400 uppercase mb-2 block">Granulometría (Gramos retenidos)</label>
              <div className="grid grid-cols-4 gap-2">
                 <input placeholder="#18" className="p-2 border rounded text-xs text-center" value={form.malla_18} onChange={e=>setForm({...form, malla_18: e.target.value})}/>
                 <input placeholder="#16" className="p-2 border rounded text-xs text-center" value={form.malla_16} onChange={e=>setForm({...form, malla_16: e.target.value})}/>
                 <input placeholder="#14" className="p-2 border rounded text-xs text-center" value={form.malla_14} onChange={e=>setForm({...form, malla_14: e.target.value})}/>
                 <input placeholder="Defectos" className="p-2 border border-red-200 bg-red-50 text-red-600 rounded text-xs text-center font-bold" value={form.defectos} onChange={e=>setForm({...form, defectos: e.target.value})}/>
              </div>
           </div>
           
           {/* Análisis Sensorial (Cata) */}
           <div>
             <h4 className="font-bold text-stone-800 border-b-2 border-amber-100 pb-2 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-amber-600"/> Evaluación Sensorial
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-amber-600 uppercase">Puntaje SCA</label>
                  <div className="relative mt-1">
                    <input 
                      type="number" 
                      className="w-full p-4 border-2 border-amber-200 bg-amber-50 rounded-2xl text-3xl font-bold text-amber-800 text-center outline-none focus:border-amber-400" 
                      placeholder="80+"
                      value={form.puntaje_cata} 
                      onChange={e=>setForm({...form, puntaje_cata: e.target.value})}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-stone-400 uppercase">Notas de Cata</label>
                  <textarea 
                    className="w-full p-3 border rounded-xl mt-1 h-24 text-sm" 
                    placeholder="Chocolate, cítricos, cuerpo medio..."
                    value={form.notas_cata} 
                    onChange={e=>setForm({...form, notas_cata: e.target.value})}
                  />
                </div>
             </div>
           </div>

           <button onClick={handleSave} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-black transition-all flex justify-center items-center gap-2">
              <Save size={20}/> Guardar Reporte Oficial
           </button>
        </div>
      </div>
    </div>
  );
}