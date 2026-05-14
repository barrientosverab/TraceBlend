import { useState, useEffect } from 'react';
import {
  Calendar, Plus, Trash2, TrendingDown, CreditCard,
  LayoutList, Settings, Wallet, X, TrendingUp, Calculator
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import {
  getGastosFijos, crearGastoFijo, registrarPago, getHistorialPagos, eliminarGasto,
  getMonthlySales, RegistroPagoForm
} from '../services/gastosService';
import { PricingCalculator } from '../components/finance/PricingCalculator';

// ProyeccionesPanel removed for MVP

export function Gastos() {
  const { orgId } = useAuth();
  const [activeTab, setActiveTab] = useState<'libro' | 'presupuestos' | 'proyecciones' | 'config' | 'calculador'>('libro');
  const [loading, setLoading] = useState(false);

  // Datos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [fijos, setFijos] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [historial, setHistorial] = useState<any[]>([]);

  const [totalSales, setTotalSales] = useState(0);

  // Formularios
  const [nuevoFijo, setNuevoFijo] = useState<any>({ name: '', amount: '', category: 'otros', frequency: 'mensual', cost_center: 'otro' });
  const [nuevoPago, setNuevoPago] = useState<RegistroPagoForm>({ description: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_method: 'transferencia', expense_category_id: '' });

  useEffect(() => {
    if (orgId) cargarDatos();
  }, [orgId, activeTab]);

  const cargarDatos = async () => {
    try {
      const [f, h, sales] = await Promise.all([
        getGastosFijos(orgId!),
        getHistorialPagos(orgId!),
        getMonthlySales(orgId!)
      ]);
      setFijos(f);
      setHistorial(h);
      setTotalSales(sales.reduce((acc: number, sale: any) => acc + sale.amount, 0));
    } catch (e) { console.error(e); }
  };

  const handleCrearFijo = async () => {
    if (!nuevoFijo.name || !nuevoFijo.amount) return toast.warning("Datos incompletos");
    setLoading(true);
    try {
      await crearGastoFijo(nuevoFijo, orgId!);
      toast.success("Gasto recurrente guardado");
      setNuevoFijo({ name: '', amount: '', category: 'otros', frequency: 'mensual', cost_center: 'otro' });
      cargarDatos();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear gasto';
      toast.error(message);
    }
    finally { setLoading(false); }
  };

  const handleRegistrarPago = async () => {
    if (!nuevoPago.amount || !nuevoPago.description) return toast.warning("Indica monto y concepto");
    setLoading(true);
    try {
      await registrarPago(nuevoPago, orgId!);
      toast.success("Pago registrado");
      setNuevoPago({ ...nuevoPago, description: '', amount: '', expense_category_id: '' });
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
      expense_category_id: gastoFijo.id,
      description: `Pago: ${gastoFijo.name}`,
      amount: gastoFijo.amount
    });
    setActiveTab('libro');
    toast.info(`Confirma el pago de: ${gastoFijo.name}`);
  };

  // --- C�LCULOS M�TRICAS CLAVE (KPIs) ---
  const currentMonth = new Date().getMonth();
  const gastosMesActual = historial.filter(h => new Date(h.fecha).getMonth() === currentMonth);
  
  // 1. Margen de Contribuci�n: Ventas - Costos de Producci�n
  const costosVariables = gastosMesActual
    .filter(h => h.description === 'produccion')
    .reduce((sum, h) => sum + h.monto, 0);
  
  const margenContribucion = totalSales - costosVariables;
  const margenContribPorcentaje = totalSales > 0 ? (margenContribucion / totalSales) : 0;
  
  // 2. Punto de Equilibrio: Gastos Fijos / Margen de Contribuci�n %
  const totalGastosFijos = fijos.reduce((sum, f) => sum + f.amount, 0);
  const puntoEquilibrio = margenContribPorcentaje > 0 ? (totalGastosFijos / margenContribPorcentaje) : 0;
  
  // 3. Relaci�n Insumos vs Ventas
  const costoInsumos = gastosMesActual
    .filter(h => h.categoria === 'insumos_cafeteria')
    .reduce((sum, h) => sum + h.monto, 0);
  const relacionInsumosVentas = totalSales > 0 ? (costoInsumos / totalSales) * 100 : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-stone-50 overflow-hidden">

      {/* HEADER TABS RESPONSIVO */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between shadow-sm z-10 gap-3">
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setActiveTab('libro')} className={`flex-1 md:flex-none justify-center px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'libro' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-500'}`}>
            <LayoutList size={18} /> Libro Diario
          </button>

          <button onClick={() => setActiveTab('presupuestos')} className={`flex-1 md:flex-none justify-center px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'presupuestos' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-500'}`}>
            <Wallet size={18} /> Presupuestos
          </button>
          <button onClick={() => setActiveTab('proyecciones')} className={`flex-1 md:flex-none justify-center px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'proyecciones' ? 'bg-emerald-600 text-white shadow-md' : 'bg-stone-100 text-stone-500'}`}>
            <TrendingUp size={18} /> Proyecciones
          </button>
          <button onClick={() => setActiveTab('calculador')} className={`flex-1 md:flex-none justify-center px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'calculador' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-500'}`}>
            <Calculator size={18} /> Calculador
          </button>
          <button onClick={() => setActiveTab('config')} className={`flex-1 md:flex-none justify-center px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'config' ? 'bg-stone-900 text-white shadow-md' : 'bg-stone-100 text-stone-500'}`}>
            <Settings size={18} /> Configuraci�n
          </button>
        </div>

        {/* Tarjetas P&L (Solo visibles en Libro Diario o Calculador) */}
        {activeTab !== 'config' && (
          <div className="flex bg-stone-50 rounded-lg border border-stone-200 divide-x divide-stone-200">
            <div className="px-4 py-2">
              <span className="text-[10px] uppercase text-emerald-600 font-bold block">Ingresos Mes</span>
              <span className="text-sm font-mono font-bold text-emerald-700">Bs {totalSales.toLocaleString()}</span>
            </div>
            <div className="px-4 py-2">
              <span className="text-[10px] uppercase text-red-500 font-bold block">Gastos Mes</span>
              <span className="text-sm font-mono font-bold text-red-600">Bs {historial.reduce((sum, h) => sum + h.monto, 0).toLocaleString()}</span>
            </div>
            <div className="px-4 py-2 bg-stone-100 rounded-r-lg">
              <span className="text-[10px] uppercase text-stone-500 font-bold block">Neto Mes</span>
              <span className={`text-sm font-mono font-bold ${totalSales - historial.reduce((sum, h) => sum + h.monto, 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                Bs {(totalSales - historial.reduce((sum, h) => sum + h.monto, 0)).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">

        {/* --- PESTA�A 1: LIBRO DIARIO (REGISTRO) --- */}
        {activeTab === 'libro' && (
          <div className="max-w-5xl mx-auto space-y-6">

            {/* M�TRICAS CLAVE DE CRECIMIENTO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Punto de Equilibrio</h4>
                <p className="text-2xl font-black text-stone-800">Bs {puntoEquilibrio.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                <div className="w-full bg-stone-100 h-1.5 mt-3 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${Math.min((totalSales / (puntoEquilibrio || 1)) * 100, 100)}%` }}></div>
                </div>
                <p className="text-[10px] text-stone-500 mt-2 font-bold">{((totalSales / (puntoEquilibrio || 1)) * 100).toFixed(1)}% alcanzado este mes</p>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Margen Contribuci�n</h4>
                <p className="text-2xl font-black text-emerald-600">{(margenContribPorcentaje * 100).toFixed(1)}%</p>
                <p className="text-sm font-bold text-stone-500">Bs {margenContribucion.toLocaleString()}</p>
                <p className="text-[10px] text-stone-500 mt-1 font-bold">Ventas netas menos costos de prod.</p>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-200">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Insumos vs Ventas</h4>
                <p className={`text-2xl font-black ${relacionInsumosVentas > 35 ? 'text-red-500' : 'text-stone-800'}`}>
                  {relacionInsumosVentas.toFixed(1)}%
                </p>
                <p className="text-sm font-bold text-stone-500">Bs {costoInsumos.toLocaleString()}</p>
                <p className="text-[10px] text-stone-500 mt-1 font-bold">Porcentaje del ingreso usado en insumos</p>
              </div>
            </div>

            {/* GR�FICO DE BALANCE FINANCIERO */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
              <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <TrendingUp size={16} className="text-emerald-500" /> Balance Financiero del Mes
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Ingresos', valor: totalSales, color: '#10b981' }, // emerald-500
                    { name: 'Gastos', valor: historial.reduce((sum, h) => sum + h.monto, 0), color: '#ef4444' } // red-500
                  ]} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#78716c', fontWeight: 'bold' }} />
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Tooltip cursor={{ fill: '#f5f5f4' }} formatter={(value: any) => [`Bs ${Number(value).toLocaleString()}`, 'Monto']} />
                    <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={32}>
                      {
                        [{ name: 'Ingresos', valor: totalSales, color: '#10b981' }, { name: 'Gastos', valor: historial.reduce((sum, h) => sum + h.monto, 0), color: '#ef4444' }].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Formulario Registro */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 h-fit order-1">
                <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <CreditCard size={16} className="text-red-500" /> Nueva Salida
                </h3>

                <div className="space-y-4">
                  {nuevoPago.expense_category_id && (
                    <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-sm flex justify-between items-center animate-in fade-in zoom-in">
                      <span className="truncate mr-2">Pagar: <b>{nuevoPago.description.replace('Pago: ', '')}</b></span>
                      <button onClick={() => setNuevoPago({ ...nuevoPago, expense_category_id: '', description: '', amount: '' })} className="bg-blue-100 p-1 rounded-full hover:bg-blue-200"><X size={14} /></button>
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
                        <input type="number" className="w-full pl-8 p-3 border rounded-xl font-bold text-red-600 outline-none" placeholder="0.00" value={nuevoPago.amount} onChange={e => setNuevoPago({ ...nuevoPago, amount: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-400 uppercase">Fecha</label>
                      <input type="date" className="w-full p-3 border rounded-xl mt-1 text-sm bg-white outline-none" value={nuevoPago.payment_date} onChange={e => setNuevoPago({ ...nuevoPago, payment_date: e.target.value })} />
                    </div>
                  </div>

                  <button onClick={handleRegistrarPago} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white py-4 rounded-xl font-bold shadow-lg transition-all flex justify-center gap-2 mt-2">
                    {loading ? '...' : <><TrendingDown size={20} /> Registrar Gasto</>}
                  </button>
                </div>
              </div>

              {/* Historial (Responsive: Cards en m�vil, Tabla en PC) */}
              <div className="lg:col-span-2 order-2">
                <h3 className="font-bold text-stone-500 text-xs uppercase mb-3 ml-1">�ltimos Movimientos</h3>

                {/* Vista M�vil (Cards) */}
                <div className="md:hidden space-y-3">
                  {historial.map(h => (
                    <div key={h.id} className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex justify-between items-center">
                      <div>
                        <p className="font-bold text-stone-800 text-sm">{h.descripcion}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{new Date(h.fecha).toLocaleDateString()} � {h.categoria} � C.C: {h.description || 'N/A'}</p>
                      </div>
                      <span className="font-bold text-red-600 font-mono text-lg">- {h.monto}</span>
                    </div>
                  ))}
                </div>

                {/* Vista Desktop (Tabla) */}
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-stone-50 text-stone-400 font-bold border-b border-stone-100">
                      <tr><th className="p-4">Fecha</th><th className="p-4">Concepto</th><th className="p-4">Categor�a</th><th className="p-4">C. Costo</th><th className="p-4 text-right">Monto</th></tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {historial.map(h => (
                        <tr key={h.id} className="hover:bg-stone-50">
                          <td className="p-4 text-stone-500 font-mono text-xs">{h.fecha}</td>
                          <td className="p-4 font-medium text-stone-800">{h.descripcion}</td>
                          <td className="p-4"><span className="px-2 py-1 bg-stone-100 rounded-full text-[10px] uppercase font-bold text-stone-500">{h.categoria}</span></td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">{h.description === 'ventas_marketing' ? 'Ventas Mkt.' : (h.description || 'N/A')}</span>
                          </td>
                          <td className="p-4 text-right font-bold text-red-600">- {h.monto}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {historial.length === 0 && <div className="text-center p-8 text-stone-400 italic bg-white rounded-xl border border-dashed">No hay gastos registrados.</div>}
              </div>
            </div>
          </div>
        )}

        {/* --- PESTA�A 2: CONFIGURACI�N FIJOS --- */}
        {activeTab === 'config' && (
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Formulario Crear (Stack en m�vil, Row en PC) */}
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
                <label className="text-xs font-bold text-stone-400 uppercase">Categor�a</label>
                <select className="w-full p-3 border rounded-xl bg-white" value={nuevoFijo.category} onChange={e => setNuevoFijo({ ...nuevoFijo, category: e.target.value })}>
                  <option value="alquiler">Alquiler</option>
                  <option value="nomina">N�mina</option>
                  <option value="servicios">Servicios</option>
                  <option value="insumos_cafeteria">Insumos</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div className="w-full md:w-40 space-y-1">
                <label className="text-xs font-bold text-stone-400 uppercase">Centro Costo</label>
                <select className="w-full p-3 border rounded-xl bg-white" value={nuevoFijo.description} onChange={e => setNuevoFijo({ ...nuevoFijo, cost_center: e.target.value })}>
                  <option value="produccion">Producci�n</option>
                  <option value="ventas_marketing">Ventas & Mkt</option>
                  <option value="administracion">Admin.</option>
                  <option value="otro">Otro</option>
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
                      <Calendar size={12} /> {f.frequency} � {f.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-stone-700 text-xl">Bs {f.amount}</p>
                    <div className="flex gap-3 justify-end mt-2">
                      <button onClick={() => prellenarPago(f)} className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg hover:bg-emerald-200 font-bold transition-colors">
                        Pagar Ahora
                      </button>
                      <button onClick={() => { if (confirm('�Borrar?')) eliminarGasto(f.id).then(cargarDatos); }} className="text-stone-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* --- PESTAÑA 6: CALCULADOR DE PRECIOS --- */}
        {activeTab === 'calculador' && (
          <PricingCalculator />
        )}

      </div>
    </div>
  );
}