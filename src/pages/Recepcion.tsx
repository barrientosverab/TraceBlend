import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getProveedores, ProveedorPlano } from '../services/proveedoresService';
import { crearLote, LoteForm } from '../services/lotesService';
import { toast } from 'sonner';
import { Warehouse, Save, Search, CheckCircle, MapPin, User, X } from 'lucide-react';
import { Input, Button } from '../components/ui';

export function Recepcion() {
  const { orgId } = useAuth();
  const [proveedores, setProveedores] = useState<ProveedorPlano[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<ProveedorPlano | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<LoteForm>({
    finca_id: '', fecha_compra: new Date().toISOString().split('T')[0],
    peso: '', precio_total: '', estado: 'pergamino_seco', variedad: '', proceso: '', humedad: '', notas: ''
  });

  useEffect(() => {
    if (orgId) getProveedores().then(setProveedores);
  }, [orgId]);

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
    } catch (e: any) {
      toast.error(e.message);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
        <Warehouse className="text-emerald-700" /> Recepción de Café
      </h1>

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
    </div>
  );
}