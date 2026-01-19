import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getProveedores, ProveedorPlano } from '../services/proveedoresService';
import { crearLote, actualizarLote, eliminarLote, type LoteForm, type RawInventoryBatch } from '../services/lotesService';
import { toast } from 'sonner';
import { Warehouse, Save, Search, CheckCircle, MapPin, User, X, Package, Filter, Edit2, Trash2 } from 'lucide-react';
import { Input, Button } from '../components/ui';
import { supabase } from '../services/supabaseClient';

type TabType = 'registro' | 'inventario';

export function Recepcion() {
  const { orgId } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('registro');
  const [proveedores, setProveedores] = useState<ProveedorPlano[]>([]);
  const [inventario, setInventario] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<ProveedorPlano | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filtros para inventario
  const [filtroFinca, setFiltroFinca] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Modal de edición
  const [loteEditando, setLoteEditando] = useState<any | null>(null);
  const [formEdit, setFormEdit] = useState<Partial<LoteForm>>({});

  const [form, setForm] = useState<LoteForm>({
    finca_id: '', fecha_compra: new Date().toISOString().split('T')[0],
    peso: '', precio_total: '', estado: 'pergamino_seco', variedad: '', proceso: '', humedad: '', notas: ''
  });

  useEffect(() => {
    if (orgId) {
      getProveedores().then(setProveedores);
      if (activeTab === 'inventario') {
        cargarInventario();
      }
    }
  }, [orgId, activeTab]);

  const cargarInventario = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('raw_inventory_batches')
        .select(`
          id, code_ref, current_quantity, current_state, variety, process, 
          created_at, total_cost_local,
          farms ( name )
        `)
        .eq('organization_id', orgId)
        .gt('current_quantity', 0)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventario(data || []);
    } catch (error) {
      console.error('Error cargando inventario:', error);
      toast.error('Error al cargar inventario');
    } finally {
      setIsLoading(false);
    }
  };

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setMostrarResultados(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = async () => {
    if (!form.finca_id || !form.peso) return toast.warning("Datos incompletos");

    setIsLoading(true);
    try {
      await crearLote(form, orgId!);
      toast.success("Lote ingresado al almacén");

      // Limpieza completa del formulario
      setForm({
        finca_id: '',
        fecha_compra: new Date().toISOString().split('T')[0],
        peso: '',
        precio_total: '',
        estado: 'pergamino_seco',
        variedad: '',
        proceso: '',
        humedad: '',
        notas: ''
      });
      setProveedorSeleccionado(null);
      setBusquedaProveedor('');

      // Recargar inventario si estamos en esa pestaña
      if (activeTab === 'inventario') {
        cargarInventario();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear lote';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const seleccionarProveedor = (proveedor: ProveedorPlano) => {
    setProveedorSeleccionado(proveedor);
    setForm({ ...form, finca_id: proveedor.finca_id || proveedor.id });
    setBusquedaProveedor(proveedor.nombre_mostrar);
    setMostrarResultados(false);
  };

  const limpiarProveedor = () => {
    setProveedorSeleccionado(null);
    setForm({ ...form, finca_id: '' });
    setBusquedaProveedor('');
  };

  // Filtrar proveedores solo con finca
  const proveedoresConFinca = proveedores.filter(p => p.finca_id);
  const proveedoresFiltrados = proveedoresConFinca.filter(p =>
    p.nombre_mostrar.toLowerCase().includes(busquedaProveedor.toLowerCase())
  );

  // Filtrar inventario
  const inventarioFiltrado = inventario.filter(item => {
    const matchFinca = !filtroFinca || item.farms?.name.toLowerCase().includes(filtroFinca.toLowerCase());
    const matchEstado = filtroEstado === 'todos' || item.current_state === filtroEstado;
    return matchFinca && matchEstado;
  });

  // Calcular totales por estado
  const totalesPorEstado = inventario.reduce((acc: any, item) => {
    const estado = item.current_state || 'sin_clasificar';
    acc[estado] = (acc[estado] || 0) + item.current_quantity;
    return acc;
  }, {});

  // Handlers para editar/eliminar inventario
  const handleEditarLote = (lote: any) => {
    setLoteEditando(lote);
    setFormEdit({
      peso: lote.current_quantity.toString(),
      precio_total: lote.total_cost_local?.toString() || '',
      estado: lote.current_state,
      variedad: lote.variety || '',
      proceso: lote.process || '',
      humedad: lote.humidity_percentage?.toString() || '',
      notas: lote.notes || ''
    });
  };

  const handleGuardarEdicion = async () => {
    if (!loteEditando) return;

    setIsLoading(true);
    try {
      await actualizarLote(loteEditando.id, formEdit);
      toast.success('Lote actualizado correctamente');
      setLoteEditando(null);
      setFormEdit({});
      cargarInventario();
    } catch (error: any) {
      toast.error('Error al actualizar: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminarLote = async (loteId: string, codigoLote: string) => {
    toast.promise(
      eliminarLote(loteId),
      {
        loading: `Eliminando lote ${codigoLote}...`,
        success: () => {
          cargarInventario();
          return `Lote ${codigoLote} eliminado correctamente`;
        },
        error: (err) => err.message || 'Error al eliminar el lote'
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
        <Warehouse className="text-emerald-700" /> Recepción de Café
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-stone-200">
        <button
          onClick={() => setActiveTab('registro')}
          className={`px-6 py-3 font-bold transition-all ${activeTab === 'registro'
            ? 'border-b-2 border-emerald-600 text-emerald-700'
            : 'text-stone-500 hover:text-stone-700'
            }`}
        >
          <Save className="inline mr-2" size={18} />
          Registrar Entrada
        </button>
        <button
          onClick={() => setActiveTab('inventario')}
          className={`px-6 py-3 font-bold transition-all ${activeTab === 'inventario'
            ? 'border-b-2 border-emerald-600 text-emerald-700'
            : 'text-stone-500 hover:text-stone-700'
            }`}
        >
          <Package className="inline mr-2" size={18} />
          Inventario Disponible
        </button>
      </div>

      {/* Vista Registro */}
      {activeTab === 'registro' && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-stone-100 space-y-6">

          {/* Búsqueda de Proveedor */}
          <div>
            <label className="font-bold text-sm text-stone-500 mb-2 block">
              Origen (Finca/Productor) <span className="text-red-500">*</span>
            </label>

            <div ref={wrapperRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 text-stone-400" size={20} />
                <input
                  className="w-full pl-10 pr-10 p-3 border-2 border-stone-200 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Buscar proveedor o finca..."
                  value={busquedaProveedor}
                  onChange={e => {
                    setBusquedaProveedor(e.target.value);
                    setMostrarResultados(true);
                    if (!e.target.value) setProveedorSeleccionado(null);
                  }}
                  onFocus={() => setMostrarResultados(true)}
                />
                {proveedorSeleccionado && (
                  <button
                    onClick={limpiarProveedor}
                    className="absolute right-3 top-3.5 text-stone-400 hover:text-red-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Resultados de búsqueda */}
              {mostrarResultados && busquedaProveedor && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-stone-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  {proveedoresFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-stone-400">
                      <p className="text-sm">No se encontraron proveedores</p>
                      <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                    </div>
                  ) : (
                    proveedoresFiltrados.map(p => {
                      const [proveedor, finca] = p.nombre_mostrar.split(' - ');
                      return (
                        <button
                          key={p.finca_id || p.id}
                          onClick={() => seleccionarProveedor(p)}
                          className="w-full text-left p-3 hover:bg-emerald-50 border-b border-stone-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <User size={16} className="text-stone-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-stone-800 truncate">{proveedor}</p>
                              {finca && (
                                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                                  <MapPin size={12} />
                                  {finca}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Proveedor seleccionado */}
            {proveedorSeleccionado && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-800">{proveedorSeleccionado.nombre_mostrar}</p>
                </div>
              </div>
            )}

            <p className="text-xs text-stone-400 mt-2">
              {proveedoresConFinca.length} proveedores disponibles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Variedad"
              value={form.variedad}
              onChange={e => setForm({ ...form, variedad: e.target.value })}
              placeholder="Ej: Caturra, Geisha, Bourbon"
              hint="Especifica la variedad del café recibido"
            />
            <Input
              label="Proceso"
              value={form.proceso}
              onChange={e => setForm({ ...form, proceso: e.target.value })}
              placeholder="Ej: Lavado, Natural, Honey"
              hint="Método de procesamiento del café"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="font-bold text-sm text-stone-500 mb-2 block">Estado Ingreso</label>
              <select
                className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white focus:border-emerald-500 outline-none transition-colors"
                value={form.estado}
                onChange={e => setForm({ ...form, estado: e.target.value })}
              >
                <option value="cereza">Cereza</option>
                <option value="pergamino_humedo">Pergamino Húmedo</option>
                <option value="pergamino_seco">Pergamino Seco</option>
                <option value="oro_verde">Oro Verde</option>
                <option value="inferior">Inferior/Descarte</option>
              </select>
            </div>

            <Input
              label="Peso (Kg)"
              type="number"
              value={form.peso}
              onChange={e => setForm({ ...form, peso: e.target.value })}
              placeholder="0.0"
              required
              error={form.peso && Number(form.peso) <= 0 ? 'El peso debe ser mayor a 0' : ''}
              className="font-bold text-lg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Precio Total (Bs)"
              type="number"
              value={form.precio_total}
              onChange={e => setForm({ ...form, precio_total: e.target.value })}
              placeholder="0.00"
              hint="Monto pagado por este lote"
            />

            <Input
              label="% Humedad"
              type="number"
              value={form.humedad}
              onChange={e => setForm({ ...form, humedad: e.target.value })}
              placeholder="12.5"
              hint="Nivel de humedad del café (opcional)"
            />
          </div>

          <div>
            <label className="font-bold text-sm text-stone-500 mb-2 block">Notas / Observaciones</label>
            <textarea
              className="w-full p-3 border-2 border-stone-200 rounded-xl focus:border-emerald-500 outline-none transition-colors resize-none"
              rows={3}
              value={form.notas}
              onChange={e => setForm({ ...form, notas: e.target.value })}
              placeholder="Ej: Calidad excepcional, aroma a chocolate..."
            />
          </div>

          <Button
            onClick={handleSave}
            isLoading={isLoading}
            icon={Save}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!form.finca_id || !form.peso}
          >
            Registrar Entrada
          </Button>
        </div>
      )}

      {/* Vista Inventario */}
      {activeTab === 'inventario' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white p-4 rounded-xl shadow border border-stone-200 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-stone-400" />
              <span className="font-bold text-sm text-stone-600">Filtros:</span>
            </div>

            <input
              type="text"
              placeholder="Buscar por finca..."
              value={filtroFinca}
              onChange={(e) => setFiltroFinca(e.target.value)}
              className="px-4 py-2 border border-stone-300 rounded-lg text-sm focus:border-emerald-500 outline-none"
            />

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-stone-300 rounded-lg text-sm focus:border-emerald-500 outline-none bg-white"
            >
              <option value="todos">Todos los estados</option>
              <option value="cereza">Cereza</option>
              <option value="pergamino_humedo">Pergamino Húmedo</option>
              <option value="pergamino_seco">Pergamino Seco</option>
              <option value="oro_verde">Oro Verde</option>
              <option value="inferior">Inferior/Descarte</option>
            </select>

            <span className="ml-auto text-sm text-stone-500">
              {inventarioFiltrado.length} lote(s) encontrado(s)
            </span>
          </div>

          {/* Totales por estado */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(totalesPorEstado).map(([estado, cantidad]: [string, any]) => (
              <div key={estado} className="bg-white p-4 rounded-xl border border-stone-200 text-center">
                <p className="text-xs font-bold text-stone-500 uppercase mb-1">
                  {estado.replace('_', ' ')}
                </p>
                <p className="text-2xl font-black text-emerald-600">{cantidad.toFixed(1)} kg</p>
              </div>
            ))}
          </div>

          {/* Tabla de inventario */}
          <div className="bg-white rounded-xl shadow border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-stone-600 uppercase">Código</th>
                    <th className="text-left p-4 text-xs font-bold text-stone-600 uppercase">Finca</th>
                    <th className="text-left p-4 text-xs font-bold text-stone-600 uppercase">Variedad</th>
                    <th className="text-left p-4 text-xs font-bold text-stone-600 uppercase">Proceso</th>
                    <th className="text-left p-4 text-xs font-bold text-stone-600 uppercase">Estado</th>
                    <th className="text-right p-4 text-xs font-bold text-stone-600 uppercase">Stock (kg)</th>
                    <th className="text-right p-4 text-xs font-bold text-stone-600 uppercase">Costo Total</th>
                    <th className="text-left p-4 text-xs font-bold text-stone-600 uppercase">Fecha Ingreso</th>
                    <th className="text-right p-4 text-xs font-bold text-stone-600 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : inventarioFiltrado.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-stone-400">
                        No hay lotes en inventario
                      </td>
                    </tr>
                  ) : (
                    inventarioFiltrado.map((item) => (
                      <tr key={item.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                        <td className="p-4 font-mono text-sm font-bold text-stone-800">{item.code_ref}</td>
                        <td className="p-4 text-sm text-stone-700">{item.farms?.name || 'N/A'}</td>
                        <td className="p-4 text-sm text-stone-600">{item.variety || '-'}</td>
                        <td className="p-4 text-sm text-stone-600">{item.process || '-'}</td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                            {item.current_state?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-right font-bold text-emerald-700">{item.current_quantity.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono text-sm text-stone-700">
                          {item.total_cost_local ? `Bs ${item.total_cost_local.toFixed(2)}` : '-'}
                        </td>
                        <td className="p-4 text-sm text-stone-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditarLote(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar lote"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleEliminarLote(item.id, item.code_ref)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar lote"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {loteEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-800">Editar Lote {loteEditando.code_ref}</h2>
              <button
                onClick={() => {
                  setLoteEditando(null);
                  setFormEdit({});
                }}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Peso (Kg)"
                  type="number"
                  value={formEdit.peso || ''}
                  onChange={(e) => setFormEdit({ ...formEdit, peso: e.target.value })}
                />
                <Input
                  label="Precio Total (Bs)"
                  type="number"
                  value={formEdit.precio_total || ''}
                  onChange={(e) => setFormEdit({ ...formEdit, precio_total: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Variedad"
                  value={formEdit.variedad || ''}
                  onChange={(e) => setFormEdit({ ...formEdit, variedad: e.target.value })}
                />
                <Input
                  label="Proceso"
                  value={formEdit.proceso || ''}
                  onChange={(e) => setFormEdit({ ...formEdit, proceso: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-sm text-stone-500 mb-2 block">Estado</label>
                  <select
                    className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white focus:border-emerald-500 outline-none"
                    value={formEdit.estado || ''}
                    onChange={(e) => setFormEdit({ ...formEdit, estado: e.target.value })}
                  >
                    <option value="cereza">Cereza</option>
                    <option value="pergamino_humedo">Pergamino Húmedo</option>
                    <option value="pergamino_seco">Pergamino Seco</option>
                    <option value="oro_verde">Oro Verde</option>
                    <option value="inferior">Inferior/Descarte</option>
                  </select>
                </div>

                <Input
                  label="% Humedad"
                  type="number"
                  value={formEdit.humedad || ''}
                  onChange={(e) => setFormEdit({ ...formEdit, humedad: e.target.value })}
                />
              </div>

              <div>
                <label className="font-bold text-sm text-stone-500 mb-2 block">Notas</label>
                <textarea
                  className="w-full p-3 border-2 border-stone-200 rounded-xl focus:border-emerald-500 outline-none resize-none"
                  rows={3}
                  value={formEdit.notas || ''}
                  onChange={(e) => setFormEdit({ ...formEdit, notas: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setLoteEditando(null);
                    setFormEdit({});
                  }}
                  fullWidth
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGuardarEdicion}
                  isLoading={isLoading}
                  disabled={isLoading}
                  fullWidth
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}