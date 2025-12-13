import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getProveedores, crearProveedor, ProveedorForm } from '../services/proveedoresService';
import { toast } from 'sonner';
import { Truck, Plus, MapPin, User } from 'lucide-react';

export function Proveedores() {
  const { orgId } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<ProveedorForm>({
    nombre_completo: '', ci_nit: '', tipo_proveedor: 'productor', nombre_finca: '',
    pais: 'Bolivia', region: '', sub_region: '', altura_msnm: ''
  });

  useEffect(() => { if(orgId) load(); }, [orgId]);

  const load = () => getProveedores().then(setList); // Nota: getProveedores devuelve lista plana, ajusta si necesitas raw

  const handleSave = async () => {
    try {
      await crearProveedor(form, orgId!);
      toast.success("Proveedor registrado");
      setShowModal(false);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] bg-stone-50 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2"><Truck className="text-amber-600"/> Proveedores</h1>
        <button onClick={() => setShowModal(true)} className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow hover:bg-black"><Plus size={18}/> Nuevo</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-20">
        {list.map((p, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="font-bold text-stone-800 text-lg flex items-center gap-2">
              <User size={18} className="text-stone-400"/> {p.nombre_mostrar.split('-')[0]}
            </h3>
            {p.finca_id && (
              <div className="mt-3 pl-2 border-l-2 border-amber-200">
                <p className="text-sm font-bold text-amber-800 flex items-center gap-1"><MapPin size={14}/> {p.nombre_mostrar.split('-')[1] || 'Finca'}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-2xl shadow-2xl h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-xl mb-4">Registro de Proveedor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="p-2 border rounded" placeholder="Nombre Completo" value={form.nombre_completo} onChange={e=>setForm({...form, nombre_completo: e.target.value})}/>
              <input className="p-2 border rounded" placeholder="CI / NIT" value={form.ci_nit} onChange={e=>setForm({...form, ci_nit: e.target.value})}/>
              <select className="p-2 border rounded bg-white" value={form.tipo_proveedor} onChange={e=>setForm({...form, tipo_proveedor: e.target.value})}>
                <option value="productor">Productor</option>
                <option value="cooperativa">Cooperativa</option>
                <option value="importador">Importador</option>
              </select>
              <input className="p-2 border rounded" placeholder="Nombre Finca" value={form.nombre_finca} onChange={e=>setForm({...form, nombre_finca: e.target.value})}/>
              <input className="p-2 border rounded" placeholder="País" value={form.pais} onChange={e=>setForm({...form, pais: e.target.value})}/>
              <input className="p-2 border rounded" placeholder="Región" value={form.region} onChange={e=>setForm({...form, region: e.target.value})}/>
              <input className="p-2 border rounded" placeholder="Municipio/Zona" value={form.sub_region} onChange={e=>setForm({...form, sub_region: e.target.value})}/>
              <input className="p-2 border rounded" type="number" placeholder="Altura (msnm)" value={form.altura_msnm} onChange={e=>setForm({...form, altura_msnm: e.target.value})}/>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-stone-500 font-bold border rounded-xl">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold">Guardar Ficha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}