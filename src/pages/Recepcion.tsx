import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getProveedores, ProveedorPlano } from '../services/proveedoresService';
import { crearLote, LoteForm } from '../services/lotesService';
import { toast } from 'sonner';
import { Warehouse, Plus, Save } from 'lucide-react';

export function Recepcion() {
  const { orgId } = useAuth();
  const [proveedores, setProveedores] = useState<ProveedorPlano[]>([]);
  const [form, setForm] = useState<LoteForm>({
    finca_id: '', fecha_compra: new Date().toISOString().split('T')[0],
    peso: '', precio_total: '', estado: 'Pergamino', variedad: '', proceso: '', humedad: '', notas: ''
  });

  useEffect(() => { if(orgId) getProveedores().then(setProveedores); }, [orgId]);

  const handleSave = async () => {
    if (!form.finca_id || !form.peso) return toast.warning("Datos incompletos");
    try {
      await crearLote(form, orgId!);
      toast.success("Lote ingresado al almacén");
      setForm({...form, peso: '', precio_total: '', notas: ''}); // Reset parcial
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2"><Warehouse className="text-emerald-700"/> Recepción de Café</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-lg border border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-2">
          <label className="font-bold text-sm text-stone-500">Origen (Finca/Productor)</label>
          <select className="w-full p-3 border rounded-xl mt-1 bg-white" value={form.finca_id} onChange={e=>setForm({...form, finca_id: e.target.value})}>
            <option value="">Seleccionar...</option>
            {proveedores.map(p => <option key={p.finca_id || p.id} value={p.finca_id || p.id}>{p.nombre_mostrar}</option>)}
          </select>
        </div>

        <div>
          <label className="font-bold text-sm text-stone-500">Variedad</label>
          <input className="w-full p-3 border rounded-xl mt-1" value={form.variedad} onChange={e=>setForm({...form, variedad: e.target.value})} placeholder="Ej: Caturra, Geisha"/>
        </div>
        <div>
          <label className="font-bold text-sm text-stone-500">Proceso</label>
          <input className="w-full p-3 border rounded-xl mt-1" value={form.proceso} onChange={e=>setForm({...form, proceso: e.target.value})} placeholder="Ej: Lavado, Natural"/>
        </div>

        <div>
          <label className="font-bold text-sm text-stone-500">Estado Ingreso</label>
          <select className="w-full p-3 border rounded-xl mt-1 bg-white" value={form.estado} onChange={e=>setForm({...form, estado: e.target.value})}>
            <option>Pergamino</option>
            <option>Cereza</option>
            <option>Oro Verde</option>
          </select>
        </div>
        <div>
           <label className="font-bold text-sm text-stone-500">Peso (Kg)</label>
           <input type="number" className="w-full p-3 border rounded-xl mt-1 font-bold text-lg" value={form.peso} onChange={e=>setForm({...form, peso: e.target.value})}/>
        </div>

        <div className="col-span-2">
           <label className="font-bold text-sm text-stone-500">Notas / Observaciones</label>
           <textarea className="w-full p-3 border rounded-xl mt-1" rows={3} value={form.notas} onChange={e=>setForm({...form, notas: e.target.value})}/>
        </div>

        <button onClick={handleSave} className="col-span-2 bg-stone-900 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black transition-all">
          <Save/> Registrar Entrada
        </button>
      </div>
    </div>
  );
}