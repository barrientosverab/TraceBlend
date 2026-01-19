import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getPromociones, crearPromocion, toggleEstadoPromocion, eliminarPromocion, Promocion } from '../services/promocionesService';
import { getTodosLosProductos as getProductos } from '../services/productosService';
import { toast } from 'sonner';
import { Plus, Trash2, Tag, Power, X, Users, Calendar } from 'lucide-react';

export function Promociones() {
  const { orgId } = useAuth();
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Formulario y Tipo de Promoción
  const [tipoPromo, setTipoPromo] = useState<'producto' | 'convenio'>('producto');
  const [form, setForm] = useState({
    name: '',
    product_id: '' as string | null,
    discount_percent: 0,
    is_courtesy: false,
    start_date: new Date().toISOString().slice(0, 16), // Formato para input datetime-local
    end_date: ''
  });

  useEffect(() => {
    if (orgId) cargarDatos();
  }, [orgId]);

  const cargarDatos = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [promos, prods] = await Promise.all([
        getPromociones(),
        getProductos(orgId)
      ]);
      setPromociones(promos);
      setProductos(prods);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleGuardar = async () => {
    if (!form.name || !form.start_date || !form.end_date) return toast.warning("Datos incompletos");
    if (tipoPromo === 'producto' && !form.product_id) return toast.warning("Selecciona un producto");

    try {
      await crearPromocion({
        name: form.name,
        // Lógica clave: Si es convenio, product_id es null
        product_id: tipoPromo === 'producto' ? form.product_id : null,
        discount_percent: form.discount_percent,
        is_courtesy: form.is_courtesy,
        start_date: form.start_date,
        end_date: form.end_date,
        is_active: true
      }, orgId!);

      toast.success(tipoPromo === 'convenio' ? "Convenio Global Creado" : "Oferta de Producto Creada");
      setShowModal(false);

      // Reset del formulario
      setForm({
        name: '',
        product_id: '',
        discount_percent: 0,
        is_courtesy: false,
        start_date: new Date().toISOString().slice(0, 16),
        end_date: ''
      });
      cargarDatos();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleToggle = async (p: Promocion) => {
    try { await toggleEstadoPromocion(p.id, p.is_active); cargarDatos(); } catch (e) { toast.error("Error"); }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    try { await eliminarPromocion(id); cargarDatos(); } catch (e) { toast.error("Error"); }
  };

  return (
    <div className="p-6 bg-stone-50 min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Promociones y Convenios</h1>
          <p className="text-stone-500">Gestiona ofertas automáticas y descuentos globales.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-stone-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-stone-200">
          <Plus size={20} /> Nuevo
        </button>
      </div>

      {/* Grid de Promociones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promociones.map(p => (
          <div key={p.id} className={`bg-white p-5 rounded-2xl border relative transition-all ${p.is_active ? 'border-stone-200 shadow-sm hover:shadow-md' : 'border-stone-100 opacity-60 grayscale'}`}>

            {/* Badge Tipo */}
            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider ${p.product_id ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
              {p.product_id ? 'Producto' : 'Convenio Global'}
            </div>

            <div className="flex justify-between items-start mb-4 mt-2">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${p.product_id ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                  {p.product_id ? <Tag size={24} /> : <Users size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-stone-800 leading-tight text-lg">{p.name}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">{p.products?.name || 'Aplica a toda la cuenta'}</p>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 p-3 rounded-xl text-sm space-y-2 mb-4 border border-stone-100">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Beneficio:</span>
                <span className={`font-bold px-2 py-0.5 rounded ${p.is_courtesy ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-800'}`}>
                  {p.is_courtesy ? '100% GRATIS' : `-${p.discount_percent}% OFF`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 flex items-center gap-1"><Calendar size={12} /> Vence:</span>
                <span className="font-medium text-stone-700">{new Date(p.end_date).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button onClick={() => handleToggle(p)} className={`p-2 rounded-lg transition-colors ${p.is_active ? 'text-emerald-600 hover:bg-emerald-50' : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100'}`} title={p.is_active ? "Desactivar" : "Activar"}>
                <Power size={20} />
              </button>
              <button onClick={() => handleEliminar(p.id)} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}

        {promociones.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-stone-400 border-2 border-dashed border-stone-200 rounded-2xl">
            <Tag size={40} className="mx-auto mb-2 opacity-20" />
            <p>No hay promociones registradas</p>
          </div>
        )}
      </div>

      {/* MODAL CREAR */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h3 className="font-bold text-lg text-stone-800">Nueva Promoción</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-stone-200 rounded-full transition-colors"><X size={20} className="text-stone-400" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Switch Tipo */}
              <div className="flex bg-stone-100 p-1 rounded-xl">
                <button onClick={() => setTipoPromo('producto')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tipoPromo === 'producto' ? 'bg-white shadow text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}>
                  <Tag size={16} /> Oferta Producto
                </button>
                <button onClick={() => setTipoPromo('convenio')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${tipoPromo === 'convenio' ? 'bg-white shadow text-purple-700' : 'text-stone-400 hover:text-stone-600'}`}>
                  <Users size={16} /> Convenio Global
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-500 uppercase ml-1">Nombre</label>
                <input className="w-full p-3 border border-stone-200 rounded-xl mt-1 focus:ring-2 focus:ring-stone-800 outline-none transition-all"
                  placeholder={tipoPromo === 'convenio' ? "Ej: Convenio Librería, Club de Lectura..." : "Ej: Happy Hour, 2x1..."}
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>

              {tipoPromo === 'producto' && (
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase ml-1">Producto</label>
                  <select className="w-full p-3 border border-stone-200 rounded-xl mt-1 bg-white outline-none"
                    value={form.product_id || ''} onChange={e => setForm({ ...form, product_id: e.target.value })}>
                    <option value="">Seleccionar producto...</option>
                    {productos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase ml-1">Beneficio</label>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => setForm({ ...form, is_courtesy: false })} className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${!form.is_courtesy ? 'border-stone-800 bg-stone-50 text-stone-800' : 'border-stone-200 text-stone-400'}`}>
                      % Off
                    </button>
                    <button onClick={() => setForm({ ...form, is_courtesy: true, discount_percent: 100 })} className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${form.is_courtesy ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-200 text-stone-400'}`}>
                      Gratis
                    </button>
                  </div>
                </div>
                {!form.is_courtesy && (
                  <div>
                    <label className="text-xs font-bold text-stone-500 uppercase ml-1">Porcentaje</label>
                    <div className="relative mt-1">
                      <input type="number" className="w-full p-3 border border-stone-200 rounded-xl outline-none text-center font-bold text-lg" placeholder="20"
                        value={form.discount_percent} onChange={e => setForm({ ...form, discount_percent: Number(e.target.value) })} />
                      <span className="absolute right-4 top-4 text-stone-400 font-bold">%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase ml-1">Desde</label>
                  <input type="datetime-local" className="w-full p-3 border border-stone-200 rounded-xl mt-1 text-sm bg-white"
                    value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase ml-1">Hasta</label>
                  <input type="datetime-local" className="w-full p-3 border border-stone-200 rounded-xl mt-1 text-sm bg-white"
                    value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>

              <button onClick={handleGuardar} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-stone-200 mt-2 flex justify-center items-center gap-2">
                Guardar Promoción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}