import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  getProveedores,
  crearProveedor,
  getProveedorCompleto,
  actualizarProveedor
} from '../services/proveedoresService';
import { ProveedorFormData } from '../utils/validationSchemas';
import { toast } from 'sonner';
import { Truck, Plus, MapPin, User, Loader2, Package, Edit2, Navigation } from 'lucide-react';
import { MapPicker } from '../components/MapPicker';

interface ProveedorForm {
  nombre_completo: string;
  ci_nit: string;
  tipo_proveedor: string;
  nombre_finca: string;
  pais: string;
  region: string;
  sub_region: string;
  altura_msnm: string | number;
  latitude?: number;
  longitude?: number;
}

export function Proveedores() {
  const { orgId } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIds, setEditingIds] = useState<{ supplierId: string; farmId: string } | null>(null);

  const [form, setForm] = useState<ProveedorForm>({
    nombre_completo: '', ci_nit: '', tipo_proveedor: 'productor', nombre_finca: '',
    pais: 'Bolivia', region: '', sub_region: '', altura_msnm: ''
  });

  const [mapCoords, setMapCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => { if (orgId) load(); }, [orgId]);

  const load = () => getProveedores().then(setList);

  const handleNew = () => {
    setIsEditing(false);
    setEditingIds(null);
    setForm({
      nombre_completo: '', ci_nit: '', tipo_proveedor: 'productor', nombre_finca: '',
      pais: 'Bolivia', region: '', sub_region: '', altura_msnm: ''
    });
    setMapCoords(null);
    setShowModal(true);
  };

  const handleEdit = async (supplierId: string, farmId: string) => {
    setIsLoading(true);
    try {
      const data = await getProveedorCompleto(supplierId, farmId);

      setForm({
        nombre_completo: data.supplier.name,
        ci_nit: data.supplier.tax_id,
        tipo_proveedor: data.supplier.type,
        nombre_finca: data.farm.name,
        pais: data.farm.country_code || 'Bolivia',
        region: data.farm.region || '',
        sub_region: data.farm.sub_region || '',
        altura_msnm: data.farm.altitude_masl || ''
      });

      if (data.farm.latitude && data.farm.longitude) {
        setMapCoords({ lat: data.farm.latitude, lng: data.farm.longitude });
      } else {
        setMapCoords(null);
      }

      setIsEditing(true);
      setEditingIds({ supplierId, farmId });
      setShowModal(true);
    } catch (e: any) {
      toast.error('Error al cargar proveedor', { description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validación simple
    if (!form.nombre_completo || !form.ci_nit || !form.nombre_finca) {
      toast.error("Completa los campos requeridos");
      return;
    }

    setIsLoading(true);
    try {
      const formData: ProveedorFormData = {
        nombre_completo: form.nombre_completo,
        ci_nit: form.ci_nit,
        tipo_proveedor: form.tipo_proveedor as 'productor' | 'cooperativa' | 'importador',
        nombre_finca: form.nombre_finca,
        pais: form.pais,
        region: form.region,
        sub_region: form.sub_region,
        altura_msnm: typeof form.altura_msnm === 'string' ? parseFloat(form.altura_msnm) : form.altura_msnm,
        latitude: mapCoords?.lat,
        longitude: mapCoords?.lng
      };

      if (isEditing && editingIds) {
        await actualizarProveedor(editingIds.supplierId, editingIds.farmId, formData);
        toast.success("Proveedor actualizado exitosamente");
      } else {
        await crearProveedor(formData, orgId!);
        toast.success("Proveedor registrado exitosamente");
      }

      setShowModal(false);
      setForm({
        nombre_completo: '', ci_nit: '', tipo_proveedor: 'productor', nombre_finca: '',
        pais: 'Bolivia', region: '', sub_region: '', altura_msnm: ''
      });
      setMapCoords(null);
      setIsEditing(false);
      setEditingIds(null);
      load();
    } catch (e: any) {
      toast.error(isEditing ? "Error al actualizar proveedor" : "Error al guardar proveedor", {
        description: e.message || "Verifica que los datos sean correctos"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-64px)] bg-stone-50 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <Truck className="text-amber-600" /> Proveedores
        </h1>
        <button
          onClick={handleNew}
          className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow hover:bg-black"
        >
          <Plus size={18} /> Nuevo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-20">
        {list.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-16 h-16 text-stone-300 mb-4" />
            <p className="text-stone-500 font-bold text-lg">No hay proveedores registrados</p>
            <p className="text-sm text-stone-400 mt-2">
              Comienza creando tu primer proveedor con el botón "Nuevo"
            </p>
          </div>
        ) : (
          list.map((p, i) => (
            <div key={i} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-stone-800 text-lg flex items-center gap-2">
                  <User size={18} className="text-stone-400" /> {p.nombre_mostrar.split('-')[0]}
                </h3>
                {p.finca_id && (
                  <button
                    onClick={() => handleEdit(p.id, p.finca_id)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                    title="Editar proveedor"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </div>

              {p.finca_id && (
                <div className="mt-3 pl-2 border-l-2 border-amber-200 space-y-1">
                  <p className="text-sm font-bold text-amber-800 flex items-center gap-1">
                    <MapPin size={14} /> {p.nombre_mostrar.split('-')[1] || 'Finca'}
                  </p>
                  {p.hasCoordinates && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <Navigation size={12} /> Ubicación GPS registrada
                    </p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-xl mb-6">
              {isEditing ? 'Editar Proveedor' : 'Registro de Proveedor'}
            </h3>

            {/* Sección: Datos del Proveedor */}
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                <User size={18} /> Datos del Proveedor
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-600">Nombre Completo <span className="text-red-500">*</span></label>
                  <input
                    className="w-full p-2 border rounded-lg mt-1"
                    placeholder="Ej: Juan Pérez"
                    value={form.nombre_completo}
                    onChange={e => setForm({ ...form, nombre_completo: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600">CI / NIT <span className="text-red-500">*</span></label>
                  <input
                    className="w-full p-2 border rounded-lg mt-1"
                    placeholder="Ej: 123456789"
                    value={form.ci_nit}
                    onChange={e => setForm({ ...form, ci_nit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600">Tipo de Proveedor</label>
                  <select
                    className="w-full p-2 border rounded-lg bg-white mt-1"
                    value={form.tipo_proveedor}
                    onChange={e => setForm({ ...form, tipo_proveedor: e.target.value })}
                  >
                    <option value="productor">Productor</option>
                    <option value="cooperativa">Cooperativa</option>
                    <option value="importador">Importador</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sección: Datos de la Finca */}
            <div className="bg-emerald-50 p-4 rounded-lg mb-4">
              <h4 className="font-bold text-emerald-700 mb-3 flex items-center gap-2">
                <MapPin size={18} /> Datos de la Finca
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-stone-600">Nombre de la Finca <span className="text-red-500">*</span></label>
                  <input
                    className="w-full p-2 border rounded-lg mt-1"
                    placeholder="Ej: La Esperanza"
                    value={form.nombre_finca}
                    onChange={e => setForm({ ...form, nombre_finca: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600">País</label>
                  <input
                    className="w-full p-2 border rounded-lg mt-1"
                    placeholder="Bolivia"
                    value={form.pais}
                    onChange={e => setForm({ ...form, pais: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600">Región</label>
                  <input
                    className="w-full p-2 border rounded-lg mt-1"
                    placeholder="La Paz"
                    value={form.region}
                    onChange={e => setForm({ ...form, region: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600">Municipio/Zona</label>
                  <input
                    className="w-full p-2 border rounded-lg mt-1"
                    placeholder="Opcional"
                    value={form.sub_region}
                    onChange={e => setForm({ ...form, sub_region: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-600">Altura (msnm)</label>
                  <input
                    className="w-full p-2 border rounded-lg mt-1"
                    type="number"
                    placeholder="1500"
                    value={form.altura_msnm}
                    onChange={e => setForm({ ...form, altura_msnm: e.target.value })}
                  />
                </div>

                {/* Selector de Mapa */}
                <div className="md:col-span-2 mt-3">
                  <MapPicker
                    value={mapCoords}
                    onChange={setMapCoords}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setIsEditing(false);
                  setEditingIds(null);
                  setMapCoords(null);
                }}
                disabled={isLoading}
                className="flex-1 py-3 text-stone-500 font-bold border rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin" size={18} /> {isEditing ? 'Actualizando...' : 'Guardando...'}</>
                ) : (
                  isEditing ? 'Actualizar Ficha' : 'Guardar Ficha'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}