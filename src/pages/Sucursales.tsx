import { useState, useEffect } from 'react';
import {
  Building2, Plus, Search, Edit2, X,
  ArrowRight, MapPin, Phone, ToggleLeft, ToggleRight, Star
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { getSucursales, crearSucursal, actualizarSucursal } from '../services/sucursalesService';

interface Sucursal {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_main: boolean;
  is_active: boolean;
}

export function Sucursales() {
  const { orgId } = useAuth();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  // Control del Modal
  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Estado del Formulario
  const [form, setForm] = useState({
    id: '',
    name: '',
    address: '',
    phone: '',
    is_main: false,
  });

  useEffect(() => {
    if (orgId) cargarDatos();
  }, [orgId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getSucursales(orgId!);
      setSucursales(data);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar sucursales');
    } finally {
      setLoading(false);
    }
  };

  // Determinar si se puede mostrar el checkbox "principal"
  const puedeSerPrincipal = () => {
    const principalExistente = sucursales.find(s => s.is_main);
    // Sin principal existente → se puede marcar
    if (!principalExistente) return true;
    // En edición y esta sucursal ya es la principal → se puede desmarcar/mantener
    if (modoEdicion && principalExistente.id === form.id) return true;
    return false;
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setForm({ id: '', name: '', address: '', phone: '', is_main: false });
    setShowModal(true);
  };

  const abrirModalEditar = (item: Sucursal) => {
    setModoEdicion(true);
    setForm({
      id: item.id,
      name: item.name,
      address: item.address || '',
      phone: item.phone || '',
      is_main: item.is_main,
    });
    setShowModal(true);
  };

  const handleGuardar = async () => {
    if (!form.name.trim()) return toast.warning('El nombre es obligatorio');
    setLoading(true);

    try {
      if (modoEdicion) {
        await actualizarSucursal(form.id, {
          name: form.name.trim(),
          address: form.address.trim() || undefined,
          phone: form.phone.trim() || undefined,
          is_main: form.is_main,
        });
        toast.success('Sucursal actualizada');
      } else {
        await crearSucursal(
          {
            name: form.name.trim(),
            address: form.address.trim() || undefined,
            phone: form.phone.trim() || undefined,
            is_main: form.is_main,
          },
          orgId!
        );
        toast.success('Sucursal creada');
      }
      setShowModal(false);
      cargarDatos();
    } catch (e: any) {
      toast.error(e?.message || 'Error al guardar');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActiva = async (item: Sucursal) => {
    if (item.is_main && item.is_active) {
      return toast.warning('No se puede desactivar la sucursal principal');
    }
    setLoading(true);
    try {
      await actualizarSucursal(item.id, { is_active: !item.is_active });
      toast.success(item.is_active ? 'Sucursal desactivada' : 'Sucursal activada');
      cargarDatos();
    } catch (e: any) {
      toast.error('Error al cambiar estado');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtradas = sucursales.filter(s =>
    s.name.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-stone-50 overflow-hidden">

      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Building2 className="text-emerald-600" /> Sucursales
          </h1>
          <p className="text-sm text-stone-500">Gestiona las sedes de tu organización.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-3 text-stone-400" size={18} />
            <input
              className="w-full pl-10 p-2.5 border rounded-xl bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm"
              placeholder="Buscar sucursal..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>
          <button onClick={abrirModalCrear} className="bg-stone-900 hover:bg-black text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-stone-200 flex items-center gap-2 font-bold">
            <Plus size={20} /> <span className="hidden md:inline">Nueva</span>
          </button>
        </div>
      </div>

      {/* Grid de Sucursales */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && sucursales.length === 0 ? (
          <div className="flex justify-center items-center h-40 text-stone-400 gap-2">
            <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" /> Cargando...
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-stone-400 gap-2">
            <Building2 size={40} className="text-stone-300" />
            <p className="text-sm">{filtro ? 'Sin resultados' : 'No hay sucursales registradas'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtradas.map(item => (
              <div
                key={item.id}
                className={`bg-white p-5 rounded-2xl border transition-all group relative overflow-hidden ${
                  !item.is_active
                    ? 'border-stone-200 opacity-60'
                    : item.is_main
                    ? 'border-emerald-200 shadow-emerald-50 shadow-md'
                    : 'border-stone-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-50'
                }`}
              >
                {/* Decoración esquina para principal */}
                {item.is_main && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 rounded-bl-full -mr-8 -mt-8 z-0" />
                )}

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      <Building2 size={20} />
                    </div>
                    <div className="flex gap-1.5">
                      {item.is_main && (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <Star size={10} /> PRINCIPAL
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        item.is_active
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        {item.is_active ? 'ACTIVA' : 'INACTIVA'}
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-stone-800 text-lg mb-2">{item.name}</h3>

                  {item.address && (
                    <p className="text-xs text-stone-500 flex items-center gap-1.5 mb-1">
                      <MapPin size={12} className="text-stone-400 flex-shrink-0" /> {item.address}
                    </p>
                  )}
                  {item.phone && (
                    <p className="text-xs text-stone-500 flex items-center gap-1.5 mb-1">
                      <Phone size={12} className="text-stone-400 flex-shrink-0" /> {item.phone}
                    </p>
                  )}

                  <div className="flex justify-end items-end border-t border-stone-100 pt-4 mt-3 gap-1">
                    <button
                      onClick={() => abrirModalEditar(item)}
                      className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleToggleActiva(item)}
                      className={`p-2 rounded-lg transition-colors ${
                        item.is_active
                          ? 'text-stone-400 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={item.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {item.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL CREAR/EDITAR --- */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-50 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">

            <div className="bg-white p-8 border-b border-stone-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                    <Building2 className="text-emerald-600" /> {modoEdicion ? 'Editar Sucursal' : 'Nueva Sucursal'}
                  </h3>
                  <p className="text-xs text-stone-400">Información de la sede.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-stone-200 rounded-full text-stone-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Nombre de la Sucursal</label>
                  <input
                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 focus:bg-white transition-all"
                    placeholder="Ej: Sede Centro" autoFocus
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Dirección (Opcional)</label>
                  <input
                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 focus:bg-white transition-all"
                    placeholder="Ej: Av. Sucre #123"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Teléfono (Opcional)</label>
                  <input
                    className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 focus:bg-white transition-all"
                    placeholder="Ej: +591 70012345"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                {puedeSerPrincipal() && (
                  <label className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={form.is_main}
                      onChange={e => setForm({ ...form, is_main: e.target.checked })}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <div>
                      <span className="text-sm font-bold text-emerald-800">Sucursal principal</span>
                      <p className="text-[10px] text-emerald-600">Solo puede haber una por organización.</p>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="p-4 flex justify-end gap-3 bg-stone-50">
              <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-200 transition-colors">
                Cancelar
              </button>
              <button onClick={handleGuardar} disabled={loading} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xl shadow-emerald-200 transition-all flex items-center gap-2">
                {loading ? 'Procesando...' : <>{modoEdicion ? 'Actualizar' : 'Guardar'} <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
