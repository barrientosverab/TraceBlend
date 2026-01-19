import React, { useState, useEffect } from 'react';
import {
  Calendar, Plus, Trash2, TrendingDown, CreditCard,
  LayoutList, Settings, Wallet, X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import {
  getGastosFijos, crearGastoFijo, registrarPago, getHistorialPagos, eliminarGastoFijo,
  GastoFijoForm, RegistroPagoForm
} from '../services/gastosService';

export function Gastos() {
  const { orgId } = useAuth();
  const [activeTab, setActiveTab] = useState<'libro' | 'config'>('libro');
  const [loading, setLoading] = useState(false);

  // Datos - using any for complex database records
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fijos, setFijos] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [historial, setHistorial] = useState<any[]>([]);

  // Formularios
  const [nuevoFijo, setNuevoFijo] = useState<GastoFijoForm>({ name: '', amount: '', category: 'otros', frequency: 'mensual' });
  const [nuevoPago, setNuevoPago] = useState<RegistroPagoForm>({ description: '', amount_paid: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'transferencia', expense_id: '' });

  useEffect(() => {
    if (orgId) cargarDatos();
  }, [orgId, activeTab]);

  const cargarDatos = async () => {
    try {
      const [f, h] = await Promise.all([getGastosFijos(orgId!), getHistorialPagos(orgId!)]);
      setFijos(f);
      setHistorial(h);
    } catch (e) { console.error(e); }
  };

  const handleCrearFijo = async () => {
    if (!nuevoFijo.name || !nuevoFijo.amount) return toast.warning("Datos incompletos");
    setLoading(true);
    try {
      await crearGastoFijo(nuevoFijo, orgId!);
      toast.success("Gasto recurrente guardado");
      setNuevoFijo({ name: '', amount: '', category: 'otros', frequency: 'mensual' });
      cargarDatos();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear gasto';
      toast.error(message);
    }
    finally { setLoading(false); }
  };

  const handleRegistrarPago = async () => {
    if (!nuevoPago.amount_paid || !nuevoPago.description) return toast.warning("Indica monto y concepto");
    setLoading(true);
    try {
      await registrarPago(nuevoPago, orgId!);
      toast.success("Pago registrado");
      setNuevoPago({ ...nuevoPago, description: '', amount_paid: '', expense_id: '' });
      cargarDatos();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al registrar pago';
      toast.error(message);
    }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prellenarPago = (gastoFijo: any) => {
    setNuevoPago({
      ...nuevoPago,
      expense_id: gastoFijo.id,
      description: `Pago: ${gastoFijo.name}`,
      amount_paid: gastoFijo.amount
    });
    setActiveTab('libro');
    toast.info(`Confirma el pago de: ${gastoFijo.name}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-stone-50 overflow-hidden">

      {/* HEADER TABS RESPONSIVO */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between shadow-sm z-10 gap-3">
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setActiveTab('libro')} className={`flex-1 md:flex-none justify-center px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'libro' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-500'}`}>
            <LayoutList size={18} /> Libro Diario
          </button>
          <button onClick={() => setActiveTab('config')} className={`flex-1 md:flex-none justify-center px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'config' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-500'}`}>
            <Settings size={18} /> Configuración
          </button>
        </div>

        {/* Total Gastos (Visible en móvil como tarjeta compacta) */}
        <div className="flex items-center justify-between md:justify-end bg-red-50 px-7 py-2 rounded-lg border border-red-100 w-full md:w-auto">
          <span className="text-xs uppercase text-red-400 font-bold flex items-left gap-1"><Wallet size={14} /> Salidas Mes : </span>
          <span className="text-lg font-mono font-bold text-red-600">Bs {historial.reduce((sum, h) => sum + h.monto, 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">

        {/* --- PESTAÑA 1: LIBRO DIARIO (REGISTRO) --- */}
        {activeTab === 'libro' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Formulario Registro */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 h-fit order-1">
              <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <CreditCard size={16} className="text-red-500" /> Nueva Salida
              </h3>

              <div className="space-y-4">
                {nuevoPago.expense_id && (
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-sm flex justify-between items-center animate-in fade-in zoom-in">
                    <span className="truncate mr-2">Pagar: <b>{nuevoPago.description.replace('Pago: ', '')}</b></span>
                    <button onClick={() => setNuevoPago({ ...nuevoPago, expense_id: '', description: '', amount_paid: '' })} className="bg-blue-100 p-1 rounded-full hover:bg-blue-200"><X size={14} /></button>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">Concepto</label>
                  <input className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej: Compra de Leche" value={nuevoPago.description} onChange={e => setNuevoPago({ ...nuevoPago, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase">Monto</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-3 text-stone-400 font-bold text-xs">Bs</span>
                      <input type="number" className="w-full pl-8 p-3 border rounded-xl font-bold text-red-600 outline-none" placeholder="0.00" value={nuevoPago.amount_paid} onChange={e => setNuevoPago({ ...nuevoPago, amount_paid: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase">Fecha</label>
                    <input type="date" className="w-full p-3 border rounded-xl mt-1 text-sm bg-white" value={nuevoPago.payment_date} onChange={e => setNuevoPago({ ...nuevoPago, payment_date: e.target.value })} />
                  </div>
                </div>

                <button onClick={handleRegistrarPago} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white py-4 rounded-xl font-bold shadow-lg transition-all flex justify-center gap-2 mt-2">
                  {loading ? '...' : <><TrendingDown size={20} /> Registrar Gasto</>}
                </button>
              </div>
            </div>

            {/* Historial (Responsive: Cards en móvil, Tabla en PC) */}
            <div className="lg:col-span-2 order-2">
              <h3 className="font-bold text-stone-500 text-xs uppercase mb-3 ml-1">Últimos Movimientos</h3>

              {/* Vista Móvil (Cards) */}
              <div className="md:hidden space-y-3">
                {historial.map(h => (
                  <div key={h.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold text-stone-800 text-sm">{h.descripcion}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{new Date(h.fecha).toLocaleDateString()} • {h.categoria}</p>
                    </div>
                    <span className="font-bold text-red-600 font-mono text-lg">- {h.monto}</span>
                  </div>
                ))}
              </div>

              {/* Vista Desktop (Tabla) */}
              <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-stone-400 font-bold border-b border-stone-100">
                    <tr><th className="p-4">Fecha</th><th className="p-4">Concepto</th><th className="p-4">Categoría</th><th className="p-4 text-right">Monto</th></tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {historial.map(h => (
                      <tr key={h.id} className="hover:bg-stone-50">
                        <td className="p-4 text-stone-500 font-mono text-xs">{h.fecha}</td>
                        <td className="p-4 font-medium text-stone-800">{h.descripcion}</td>
                        <td className="p-4"><span className="px-2 py-1 bg-stone-100 rounded-full text-[10px] uppercase font-bold text-stone-500">{h.categoria}</span></td>
                        <td className="p-4 text-right font-bold text-red-600">- {h.monto}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {historial.length === 0 && <div className="text-center p-8 text-stone-400 italic bg-white rounded-xl border border-dashed">No hay gastos registrados.</div>}
            </div>
          </div>
        )}

        {/* --- PESTAÑA 2: CONFIGURACIÓN FIJOS --- */}
        {activeTab === 'config' && (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Formulario Crear (Stack en móvil, Row en PC) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Nombre del Gasto</label>
                <input className="w-full p-3 border rounded-xl bg-stone-50 focus:bg-white transition-colors outline-none" placeholder="Ej: Alquiler Local" value={nuevoFijo.name} onChange={e => setNuevoFijo({ ...nuevoFijo, name: e.target.value })} />
              </div>
              <div className="w-full md:w-32 space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Monto Fijo</label>
                <input type="number" className="w-full p-3 border rounded-xl" placeholder="0" value={nuevoFijo.amount} onChange={e => setNuevoFijo({ ...nuevoFijo, amount: e.target.value })} />
              </div>
              <div className="w-full md:w-40 space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Categoría</label>
                <select className="w-full p-3 border rounded-xl bg-white" value={nuevoFijo.category} onChange={e => setNuevoFijo({ ...nuevoFijo, category: e.target.value })}>
                  <option value="alquiler">Alquiler</option>
                  <option value="nomina">Nómina</option>
                  <option value="servicios">Servicios</option>
                  <option value="insumos_cafeteria">Insumos</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <button onClick={handleCrearFijo} className="w-full md:w-auto bg-stone-900 text-white p-3 rounded-xl hover:bg-black transition-colors flex justify-center items-center">
                <Plus size={24} /> <span className="md:hidden ml-2 font-bold">Agregar Gasto</span>
              </button>
            </div>

            {/* Lista Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fijos.map(f => (
                <div key={f.id} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex justify-between items-center group hover:border-emerald-400 transition-colors relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-stone-200 group-hover:bg-emerald-400 transition-colors"></div>
                  <div>
                    <h4 className="font-bold text-stone-800 text-lg">{f.name}</h4>
                    <p className="text-xs text-stone-500 uppercase tracking-wide mt-1 flex items-center gap-2">
                      <Calendar size={12} /> {f.frequency} • {f.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-stone-700 text-xl">Bs {f.amount}</p>
                    <div className="flex gap-3 justify-end mt-2">
                      <button onClick={() => prellenarPago(f)} className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-200 font-bold transition-colors">
                        Pagar Ahora
                      </button>
                      <button onClick={() => { if (confirm('¿Borrar?')) eliminarGastoFijo(f.id).then(cargarDatos); }} className="text-stone-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}