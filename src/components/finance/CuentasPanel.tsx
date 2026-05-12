import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { 
  Building2, Users, AlertCircle, CheckCircle2,
  Clock, Plus, Search, ArrowRightLeft, CalendarClock
} from 'lucide-react';
import { 
  getAccountsReceivable, createAccountReceivable, updateAccountReceivableStatus,
  getAccountsPayable, createAccountPayable, updateAccountPayableStatus,
  AccountReceivableForm, AccountPayableForm
} from '../../services/gastosService';
import { supabase } from '../../services/supabaseClient';

export function CuentasPanel() {
  const { orgId } = useAuth();
  const [activeTab, setActiveTab] = useState<'cobrar' | 'pagar'>('cobrar');
  const [loading, setLoading] = useState(false);
  
  // Data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cuentasCobrar, setCuentasCobrar] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cuentasPagar, setCuentasPagar] = useState<any[]>([]);
  
  // Selectores
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [clientes, setClientes] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [proveedores, setProveedores] = useState<any[]>([]);

  // Formularios
  const [showFormRow, setShowFormRow] = useState(false);
  const [nuevoCobro, setNuevoCobro] = useState<AccountReceivableForm>({
    customer_id: '',
    invoice_number: '',
    description: '',
    total_amount: '',
    due_date: new Date().toISOString().split('T')[0]
  });
  const [nuevoPago, setNuevoPago] = useState<AccountPayableForm>({
    supplier_id: '',
    invoice_number: '',
    description: '',
    total_amount: '',
    due_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (orgId) {
      cargarCuentas();
      cargarEntidades();
    }
  }, [orgId]);

  const cargarCuentas = async () => {
    setLoading(true);
    try {
      const [ar, ap] = await Promise.all([
        getAccountsReceivable(orgId!),
        getAccountsPayable(orgId!)
      ]);
      setCuentasCobrar(ar);
      setCuentasPagar(ap);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar cuentas');
    } finally {
      setLoading(false);
    }
  };

  const cargarEntidades = async () => {
    try {
      const [resClientes, resProveedores] = await Promise.all([
        supabase.from('customers').select('id, business_name').eq('organization_id', orgId!).order('business_name'),
        supabase.from('suppliers').select('id, name').eq('organization_id', orgId!).order('name')
      ]);
      
      if (resClientes.data) setClientes(resClientes.data);
      if (resProveedores.data) setProveedores(resProveedores.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handeCrearCobro = async () => {
    if (!nuevoCobro.description || !nuevoCobro.total_amount || !nuevoCobro.due_date) {
      toast.warning('Concepto, monto y fecha límite son obligatorios');
      return;
    }
    try {
      setLoading(true);
      await createAccountReceivable(nuevoCobro, orgId!);
      toast.success('Cuenta por cobrar registrada');
      setShowFormRow(false);
      setNuevoCobro({
        customer_id: '', invoice_number: '', description: '', total_amount: '', due_date: new Date().toISOString().split('T')[0]
      });
      cargarCuentas();
    } catch (e) {
      toast.error('Error guardando registro');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearPago = async () => {
    if (!nuevoPago.description || !nuevoPago.total_amount || !nuevoPago.due_date) {
      toast.warning('Concepto, monto y fecha límite son obligatorios');
      return;
    }
    try {
      setLoading(true);
      await createAccountPayable(nuevoPago, orgId!);
      toast.success('Cuenta por pagar registrada');
      setShowFormRow(false);
      setNuevoPago({
        supplier_id: '', invoice_number: '', description: '', total_amount: '', due_date: new Date().toISOString().split('T')[0]
      });
      cargarCuentas();
    } catch (e) {
      toast.error('Error guardando registro');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, type: 'ar' | 'ap', currentMonto: number) => {
    const action = prompt('Escribe "PAGAR" para marcar como completado, o el monto pagado para pago parcial:', 'PAGAR');
    if (!action) return;

    let status = 'pagado';
    let paidAmount = currentMonto;

    if (action.toUpperCase() !== 'PAGAR') {
      const partial = Number(action);
      if (!isNaN(partial) && partial > 0 && partial < currentMonto) {
        status = 'parcial';
        paidAmount = partial;
      } else if (isNaN(partial)) {
        return toast.warning('Entrada inválida');
      }
    }

    try {
      setLoading(true);
      if (type === 'ar') {
        await updateAccountReceivableStatus(id, status, paidAmount);
      } else {
        await updateAccountPayableStatus(id, status, paidAmount);
      }
      toast.success('Estado actualizado exitosamente');
      cargarCuentas();
    } catch (e) {
      toast.error('Error al actualizar cuenta');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'pagado';
    if (isOverdue) return <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] uppercase font-bold rounded-full border border-red-200 flex items-center gap-1 w-max"><AlertCircle size={10}/> Vencido</span>;
    if (status === 'pagado') return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] uppercase font-bold rounded-full border border-emerald-200 flex items-center gap-1 w-max"><CheckCircle2 size={10}/> Pagado</span>;
    if (status === 'parcial') return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] uppercase font-bold rounded-full border border-blue-200 flex items-center gap-1 w-max"><ArrowRightLeft size={10}/> Parcial</span>;
    return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] uppercase font-bold rounded-full border border-amber-200 flex items-center gap-1 w-max"><Clock size={10}/> Pendiente</span>;
  };

  // Cálculos de Totales
  const tCobrarPendiente = cuentasCobrar.filter(c => c.status !== 'pagado').reduce((sum, c) => sum + (c.total_amount - (c.paid_amount || 0)), 0);
  const tPagarPendiente = cuentasPagar.filter(c => c.status !== 'pagado').reduce((sum, c) => sum + (c.total_amount - (c.paid_amount || 0)), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Resumen de Cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-emerald-100 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
              <Users size={16} /> Cuentas por Cobrar (AR)
            </h3>
            <p className="text-3xl font-black mt-2">Bs {tCobrarPendiente.toLocaleString()}</p>
            <p className="text-xs text-emerald-100 mt-1">Saldo pendiente de clientes a favor</p>
          </div>
          <Users size={120} className="absolute -right-6 -bottom-6 text-white opacity-10" />
        </div>

        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-red-100 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
              <Building2 size={16} /> Cuentas por Pagar (AP)
            </h3>
            <p className="text-3xl font-black mt-2">Bs {tPagarPendiente.toLocaleString()}</p>
            <p className="text-xs text-red-100 mt-1">Saldo pendiente a proveedores</p>
          </div>
          <Building2 size={120} className="absolute -right-6 -bottom-6 text-white opacity-10" />
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-col min-h-[500px]">
        {/* SubTabs */}
        <div className="flex border-b border-stone-100 bg-stone-50">
          <button 
            onClick={() => { setActiveTab('cobrar'); setShowFormRow(false); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'cobrar' ? 'text-emerald-600 bg-white border-b-2 border-emerald-500' : 'text-stone-500 hover:text-stone-700'}`}
          >
            A Favor (Clientes)
          </button>
          <button 
            onClick={() => { setActiveTab('pagar'); setShowFormRow(false); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'pagar' ? 'text-red-600 bg-white border-b-2 border-red-500' : 'text-stone-500 hover:text-stone-700'}`}
          >
            En Contra (Proveedores)
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-stone-100 flex justify-between items-center">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-stone-400" />
            <input type="text" placeholder="Buscar concepto o # doc..." className="pl-9 pr-4 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-stone-400 bg-stone-50 w-64" />
          </div>
          <button onClick={() => setShowFormRow(!showFormRow)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${showFormRow ? 'bg-stone-200 text-stone-700' : 'bg-stone-900 text-white hover:bg-black'}`}>
            <Plus size={16} /> Nuevo Registro
          </button>
        </div>

        {/* Formulario Inline */}
        {showFormRow && (
          <div className={`p-4 border-b ${activeTab === 'cobrar' ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-3">Registrar Nueva Cuenta ({(activeTab === 'cobrar' ? 'AR' : 'AP')})</h4>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase">{activeTab === 'cobrar' ? 'Cliente' : 'Proveedor'}</label>
                <select 
                  className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none"
                  value={activeTab === 'cobrar' ? nuevoCobro.customer_id : nuevoPago.supplier_id}
                  onChange={(e) => activeTab === 'cobrar' ? setNuevoCobro({...nuevoCobro, customer_id: e.target.value}) : setNuevoPago({...nuevoPago, supplier_id: e.target.value})}
                >
                  <option value="">Selecciona (Opcional)</option>
                  {activeTab === 'cobrar' 
                    ? clientes.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)
                    : proveedores.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                  }
                </select>
              </div>
              <div className="flex-1 w-full space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase">Concepto / Detalle</label>
                <input 
                  type="text" placeholder="Ej: Lote 041" className="w-full p-2.5 border rounded-lg text-sm outline-none"
                  value={activeTab === 'cobrar' ? nuevoCobro.description : nuevoPago.description}
                  onChange={(e) => activeTab === 'cobrar' ? setNuevoCobro({...nuevoCobro, description: e.target.value}) : setNuevoPago({...nuevoPago, description: e.target.value})}
                />
              </div>
              <div className="w-full md:w-32 space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase">Documento</label>
                <input 
                  type="text" placeholder="# FACT" className="w-full p-2.5 border rounded-lg text-sm outline-none"
                  value={activeTab === 'cobrar' ? nuevoCobro.invoice_number : nuevoPago.invoice_number}
                  onChange={(e) => activeTab === 'cobrar' ? setNuevoCobro({...nuevoCobro, invoice_number: e.target.value}) : setNuevoPago({...nuevoPago, invoice_number: e.target.value})}
                />
              </div>
              <div className="w-full md:w-40 space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase">Fecha Límite</label>
                <input 
                  type="date" className="w-full p-2.5 border rounded-lg text-sm outline-none bg-white"
                  value={activeTab === 'cobrar' ? nuevoCobro.due_date : nuevoPago.due_date}
                  onChange={(e) => activeTab === 'cobrar' ? setNuevoCobro({...nuevoCobro, due_date: e.target.value}) : setNuevoPago({...nuevoPago, due_date: e.target.value})}
                />
              </div>
              <div className="w-full md:w-40 space-y-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase">Monto (Bs)</label>
                <input 
                  type="number" placeholder="0.00" className={`w-full p-2.5 border rounded-lg text-sm outline-none font-bold ${activeTab === 'cobrar' ? 'text-emerald-700' : 'text-red-700'}`}
                  value={activeTab === 'cobrar' ? nuevoCobro.total_amount : nuevoPago.total_amount}
                  onChange={(e) => activeTab === 'cobrar' ? setNuevoCobro({...nuevoCobro, total_amount: e.target.value}) : setNuevoPago({...nuevoPago, total_amount: e.target.value})}
                />
              </div>
              <button 
                disabled={loading}
                onClick={activeTab === 'cobrar' ? handeCrearCobro : handleCrearPago}
                className={`w-full md:w-auto p-2.5 rounded-lg text-white font-bold transition-colors ${activeTab === 'cobrar' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* Tabla Dinámica */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-stone-400 font-bold border-b border-stone-200 sticky top-0">
              <tr>
                <th className="p-4 uppercase text-[10px] tracking-wider">Fecha Límite</th>
                <th className="p-4 uppercase text-[10px] tracking-wider">{activeTab === 'cobrar' ? 'Cliente' : 'Proveedor'}</th>
                <th className="p-4 uppercase text-[10px] tracking-wider">Concepto</th>
                <th className="p-4 uppercase text-[10px] tracking-wider">Estado</th>
                <th className="p-4 uppercase text-[10px] tracking-wider text-right">Balance</th>
                <th className="p-4 uppercase text-[10px] tracking-wider text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(activeTab === 'cobrar' ? cuentasCobrar : cuentasPagar).length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-12 text-stone-400">
                    <CalendarClock size={40} className="mx-auto mb-3 opacity-20" />
                    No hay registros de cuentas por {activeTab}
                  </td>
                </tr>
              ) : (
                (activeTab === 'cobrar' ? cuentasCobrar : cuentasPagar).map((c) => {
                  const balance = c.total_amount - (c.paid_amount || 0);
                  const isAr = activeTab === 'cobrar';
                  
                  return (
                    <tr key={c.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-4 text-stone-600 font-mono text-xs">{new Date(c.due_date).toLocaleDateString()}</td>
                      <td className="p-4 font-bold text-stone-800">
                        {isAr ? (c.clients?.business_name || 'Sin especificar') : (c.suppliers?.name || 'Sin especificar')}
                      </td>
                      <td className="p-4 text-stone-600">
                        <p className="font-medium">{c.description}</p>
                        {c.invoice_number && <p className="text-[10px] text-stone-400 font-mono">Doc: {c.invoice_number}</p>}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(c.status, c.due_date)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`font-bold ${c.status === 'pagado' ? 'text-stone-300 line-through' : (isAr ? 'text-emerald-600' : 'text-red-600')}`}>
                            Bs {c.total_amount.toLocaleString()}
                          </span>
                          {c.paid_amount > 0 && <span className="text-[10px] text-stone-400">Pagado: Bs {c.paid_amount.toLocaleString()}</span>}
                          {c.status === 'parcial' && <span className="text-xs font-bold text-stone-800">Pendiente: Bs {balance.toLocaleString()}</span>}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {c.status !== 'pagado' && (
                          <button 
                            onClick={() => handleUpdateStatus(c.id, isAr ? 'ar' : 'ap', c.total_amount)}
                            className="bg-stone-100 hover:bg-stone-900 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold text-stone-600 transition-colors"
                          >
                            Actualizar
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
