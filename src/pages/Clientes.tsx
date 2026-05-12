import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getTodosLosClientes, actualizarCliente, toggleEstadoCliente, ClienteForm } from '../services/clientesService';
import { toast } from 'sonner';
import { Users, Search, Edit2, CheckCircle, XCircle } from 'lucide-react';
// crearCliente - disponible en ventasService para uso futuro

export function Clientes() {
  const { orgId } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado formulario edición/creación
  const [form, setForm] = useState<ClienteForm>({
    business_name: '', tax_id: '', email: '', phone: '', discount_rate: 0, notes: ''
  });

  useEffect(() => { if(orgId) cargar(); }, [orgId]);

  const cargar = () => getTodosLosClientes(orgId!).then(setClientes);

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      business_name: c.business_name,
      tax_id: c.tax_id,
      email: c.email,
      phone: c.phone,
      discount_rate: c.discount_rate || 0,
      notes: c.notes
    });
  };

  const handleSave = async () => {
    if (!editingId) return; // Solo edición por ahora en esta vista rápida
    try {
      await actualizarCliente(editingId, editingId, form);
      toast.success("Cliente actualizado");
      setEditingId(null);
      cargar();
    } catch (e: any) { toast.error(e.message); }
  };

  const filtered = clientes.filter(c => c.business_name.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div className="p-6 bg-stone-50 h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2"><Users className="text-blue-600"/> Directorio Clientes</h1>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-stone-400" size={18}/>
          <input className="pl-10 p-2 border rounded-xl" placeholder="Buscar..." value={filtro} onChange={e=>setFiltro(e.target.value)}/>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden flex-1 overflow-y-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 font-bold uppercase">
            <tr><th className="p-4">Cliente</th><th className="p-4">Contacto</th><th className="p-4">NIT/CI</th><th className="p-4">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-stone-50">
                <td className="p-4 font-bold text-stone-800">{c.business_name}</td>
                <td className="p-4 text-stone-500">{c.phone} <br/> <span className="text-xs">{c.email}</span></td>
                <td className="p-4 font-mono">{c.tax_id || '-'}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => handleEdit(c)} className="p-2 hover:bg-blue-50 text-blue-600 rounded"><Edit2 size={16}/></button>
                  <button onClick={() => toggleEstadoCliente(c.id, !c.is_active).then(cargar)} className={`p-2 rounded ${c.is_active ? 'text-green-600 hover:bg-green-50' : 'text-red-400 hover:bg-red-50'}`}>
                    {c.is_active ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Edición Rápida */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl">
            <h3 className="font-bold text-lg mb-4">Editar Cliente</h3>
            <div className="space-y-3">
              <input className="w-full p-2 border rounded" placeholder="Razón Social" value={form.business_name} onChange={e=>setForm({...form, business_name: e.target.value})}/>
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full p-2 border rounded" placeholder="NIT/CI" value={form.tax_id || ''} onChange={e=>setForm({...form, tax_id: e.target.value})}/>
                <input className="w-full p-2 border rounded" placeholder="Teléfono" value={form.phone || ''} onChange={e=>setForm({...form, phone: e.target.value})}/>
              </div>
              <input className="w-full p-2 border rounded" placeholder="Email" value={form.email || ''} onChange={e=>setForm({...form, email: e.target.value})}/>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingId(null)} className="flex-1 py-2 text-stone-500 font-bold">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-2 bg-stone-900 text-white rounded font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
