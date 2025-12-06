import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Edit2, CheckCircle, XCircle, Save, X, Phone, Mail, Percent 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { getTodosLosClientes, actualizarCliente, toggleEstadoCliente } from '../services/clientesService';

export function Clientes() {
  const { orgId } = useAuth();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [editingClient, setEditingClient] = useState(null);

  useEffect(() => {
    if (orgId) cargarClientes();
  }, [orgId]);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const data = await getTodosLosClientes(orgId);
      setClientes(data);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await actualizarCliente(editingClient.id, editingClient);
      toast.success("Cliente actualizado", { description: "Los cambios se aplicarán en la próxima venta." });
      setEditingClient(null);
      cargarClientes();
    } catch (e) {
      toast.error("Error al actualizar", { description: e.message });
    }
  };

  const handleToggleStatus = (cliente) => {
    const accion = cliente.is_active ? "desactivar" : "activar";
    toast(`¿Deseas ${accion} a ${cliente.business_name}?`, {
      action: {
        label: 'Confirmar',
        onClick: async () => {
          try {
            await toggleEstadoCliente(cliente.id, !cliente.is_active);
            toast.success(`Cliente ${accion}do`);
            cargarClientes();
          } catch (e) { toast.error(e.message); }
        }
      },
      cancel: { label: 'Cancelar' }
    });
  };

  const filtrados = clientes.filter(c => 
    c.business_name.toLowerCase().includes(filtro.toLowerCase()) || 
    c.tax_id?.includes(filtro)
  );

  if (loading) return <div className="p-8 text-center text-stone-500 animate-pulse">Cargando cartera...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-2">
            <Users className="text-emerald-600"/> Cartera de Clientes
          </h1>
          <p className="text-stone-500">Gestiona contactos y beneficios comerciales.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 text-stone-400" size={18}/>
          <input 
            className="w-full pl-10 p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Buscar por nombre o NIT..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-stone-50 text-stone-500 text-xs font-bold uppercase">
            <tr>
              <th className="p-4">Estado</th>
              <th className="p-4">Cliente / Razón Social</th>
              <th className="p-4">NIT / CI</th>
              <th className="p-4">Contacto</th>
              <th className="p-4 text-center">Descuento</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-sm">
            {filtrados.map(c => (
              <tr key={c.id} className={`hover:bg-stone-50 ${!c.is_active ? 'opacity-60 bg-stone-50' : ''}`}>
                <td className="p-4">
                  {c.is_active ? 
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Activo</span> : 
                    <span className="px-2 py-1 bg-stone-200 text-stone-600 rounded-full text-xs font-bold">Inactivo</span>
                  }
                </td>
                <td className="p-4 font-bold text-stone-800">{c.business_name}</td>
                <td className="p-4 font-mono text-stone-600">{c.tax_id || 'S/N'}</td>
                <td className="p-4 text-xs space-y-1">
                  {c.phone && <div className="flex items-center gap-1"><Phone size={12}/> {c.phone}</div>}
                  {c.email && <div className="flex items-center gap-1"><Mail size={12}/> {c.email}</div>}
                </td>
                <td className="p-4 text-center">
                  {c.discount_rate > 0 ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded font-bold border border-purple-200">
                      -{c.discount_rate}%
                    </span>
                  ) : <span className="text-stone-300">-</span>}
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => setEditingClient({...c})} className="p-2 text-stone-500 hover:text-emerald-600 transition-colors">
                    <Edit2 size={16}/>
                  </button>
                  <button onClick={() => handleToggleStatus(c)} className="p-2 text-stone-400 hover:text-red-500 transition-colors">
                    {c.is_active ? <XCircle size={16}/> : <CheckCircle size={16}/>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Edición */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="bg-stone-50 p-6 border-b border-stone-200 flex justify-between items-center rounded-t-2xl">
              <h3 className="font-bold text-lg text-stone-800">Editar Cliente</h3>
              <button onClick={() => setEditingClient(null)}><X size={20} className="text-stone-400 hover:text-red-500"/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase">Razón Social</label>
                <input className="w-full p-2 border rounded mt-1 font-bold" value={editingClient.business_name} onChange={e => setEditingClient({...editingClient, business_name: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase">NIT / CI</label>
                  <input className="w-full p-2 border rounded mt-1" value={editingClient.tax_id} onChange={e => setEditingClient({...editingClient, tax_id: e.target.value})}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase flex items-center gap-1 text-purple-700"><Percent size={12}/> Descuento %</label>
                  <input type="number" className="w-full p-2 border border-purple-200 bg-purple-50 rounded mt-1 font-bold text-purple-800" value={editingClient.discount_rate} onChange={e => setEditingClient({...editingClient, discount_rate: e.target.value})}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input className="p-2 border rounded" placeholder="Teléfono" value={editingClient.phone || ''} onChange={e => setEditingClient({...editingClient, phone: e.target.value})}/>
                <input className="p-2 border rounded" placeholder="Email" value={editingClient.email || ''} onChange={e => setEditingClient({...editingClient, email: e.target.value})}/>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase">Notas Internas</label>
                <textarea className="w-full p-2 border rounded mt-1 text-sm" rows="2" placeholder="Preferencias, tipo de café, etc." value={editingClient.notes || ''} onChange={e => setEditingClient({...editingClient, notes: e.target.value})}/>
              </div>
            </div>

            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={() => setEditingClient(null)} className="px-4 py-2 text-stone-500 hover:bg-stone-100 rounded-lg">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center gap-2"><Save size={18}/> Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}