import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getLotesParaTrilla, procesarTrilla, LoteTrilla, MallaInput } from '../services/trillaService';
import { toast } from 'sonner';
import { Settings, ArrowRight } from 'lucide-react';

export function Trilla() {
  const { orgId, user } = useAuth();
  const [lotes, setLotes] = useState<LoteTrilla[]>([]);
  const [selectedLote, setSelectedLote] = useState<string>('');
  const [pesoEntrada, setPesoEntrada] = useState('');
  
  // Mallas
  const [mallas, setMallas] = useState<MallaInput[]>([
    { nombre: 'Malla 18+', peso: '' },
    { nombre: 'Malla 16', peso: '' },
    { nombre: 'Malla 14', peso: '' },
    { nombre: 'Base/Pasilla', peso: '' },
    { nombre: 'Cascarilla (Merma)', peso: '' }
  ]);

  useEffect(() => { if(orgId) getLotesParaTrilla().then(setLotes); }, [orgId]);

  const handleMallaChange = (idx: number, val: string) => {
    const newMallas = [...mallas];
    newMallas[idx].peso = val;
    setMallas(newMallas);
  };

  const handleProcesar = async () => {
    if (!selectedLote || !pesoEntrada) return toast.warning("Selecciona lote y peso");
    try {
      await procesarTrilla(selectedLote, Number(pesoEntrada), mallas, orgId!, user!.id);
      toast.success("Trilla registrada. Inventario actualizado.");
      setPesoEntrada('');
      setMallas(mallas.map(m => ({...m, peso: ''})));
      getLotesParaTrilla().then(setLotes);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2"><Settings className="text-stone-600"/> Proceso de Trilla</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <h3 className="font-bold text-stone-500 text-sm uppercase mb-4">1. Selección de Materia Prima</h3>
        <select className="w-full p-3 border rounded-xl mb-4 bg-white" value={selectedLote} onChange={e=>setSelectedLote(e.target.value)}>
          <option value="">Seleccionar Lote...</option>
          {lotes.map(l => (
            <option key={l.id} value={l.id}>{l.codigo_lote} - {l.nombre_finca} ({l.stock_actual}kg)</option>
          ))}
        </select>
        <input type="number" placeholder="Peso a Trillar (Kg)" className="w-full p-3 border rounded-xl font-bold" value={pesoEntrada} onChange={e=>setPesoEntrada(e.target.value)}/>

        <div className="my-6 border-t border-stone-100"></div>

        <h3 className="font-bold text-stone-500 text-sm uppercase mb-4">2. Resultado (Clasificación)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {mallas.map((m, i) => (
             <div key={i}>
                <label className="text-xs font-bold text-stone-400">{m.nombre}</label>
                <input type="number" className="w-full p-2 border rounded-lg mt-1" value={m.peso} onChange={e=>handleMallaChange(i, e.target.value)} placeholder="0.00"/>
             </div>
          ))}
        </div>

        <button onClick={handleProcesar} className="w-full mt-8 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2">
           Procesar y Guardar Oro <ArrowRight/>
        </button>
      </div>
    </div>
  );
}