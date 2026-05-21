import { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Edit2, AlertTriangle, 
  Trash2, X, Calendar, ArrowRight,
  ShoppingCart
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { getInsumos, crearInsumo, actualizarInsumo, eliminarInsumo, verificarUsoInsumo, getBranches, registrarCompraInsumo } from '../services/insumosService';

interface Insumo { id: string; name: string; unit: string | null; unit_cost: number; is_active: boolean; current_stock: number; min_quantity: number; stock_id: string | null; }

export function Insumos() {
  const { orgId, branchId, profile } = useAuth();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  // Control del Modal
  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // Control del Modal de Compra
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);

  // --- ESTADO DEL FORMULARIO DE INSUMO ---
  const [form, setForm] = useState({
    id: '',
    name: '',
    unit: 'ml',
    min_quantity: '1000',
    unit_cost: '0'
  });

  // --- ESTADO DEL FORMULARIO DE COMPRA ---
  const [compraForm, setCompraForm] = useState({
    branch_id: branchId || '',
    supplier_name: '',
    quantity: '1',
    unit_cost: '0',
    purchase_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (orgId) {
      cargarDatos();
      cargarSucursales();
    }
  }, [orgId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getInsumos(orgId!);
      setInsumos(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const cargarSucursales = async () => {
    try {
      const data = await getBranches(orgId!);
      setBranches(data);
      if (data.length > 0 && !compraForm.branch_id) {
        setCompraForm(prev => ({ ...prev, branch_id: data[0].id }));
      }
    } catch (e) { console.error(e); }
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setForm({
      id: '', name: '', unit: 'ml', min_quantity: '500', unit_cost: '0'
    });
    setShowModal(true);
  };

  const abrirModalEditar = (item: Insumo) => {
    setModoEdicion(true);
    setForm({
      id: item.id,
      name: item.name,
      unit: item.unit || 'und',
      min_quantity: String(item.min_quantity ?? 0),
      unit_cost: String(item.unit_cost ?? 0)
    });
    setShowModal(true);
  };

  const abrirModalCompra = (item: Insumo) => {
    setSelectedInsumo(item);
    setCompraForm({
      branch_id: branchId || (branches.length > 0 ? branches[0].id : ''),
      supplier_name: '',
      quantity: '1',
      unit_cost: String(item.unit_cost || 0),
      purchase_date: new Date().toISOString().split('T')[0]
    });
    setShowCompraModal(true);
  };

  const handleGuardar = async () => {
    if (!form.name) return toast.warning("El nombre es obligatorio");
    setLoading(true);

    try {
      if (modoEdicion) {
        // ACTUALIZAR
        await actualizarInsumo(form.id, {
          name: form.name,
          unit: form.unit,
          min_quantity: Number(form.min_quantity) || 0,
          unit_cost: Number(form.unit_cost) || 0,
          is_active: true
        });
        toast.success("Insumo actualizado exitosamente");
      } else {
        // CREAR
        await crearInsumo({
          organization_id: orgId!,
          name: form.name,
          unit: form.unit,
          min_quantity: Number(form.min_quantity) || 0,
          unit_cost: Number(form.unit_cost) || 0,
          current_stock: 0
        }, orgId!);
        
        toast.success("Insumo creado exitosamente");
      }
      
      setShowModal(false);
      cargarDatos();
    } catch (e: any) { 
        toast.error("Error al guardar");
        console.error(e);
    } finally { 
        setLoading(false); 
    }
  };

  const handleRegistrarCompra = async () => {
    if (!selectedInsumo) return;
    if (!compraForm.branch_id) return toast.warning("Debe seleccionar una sucursal");
    if (!profile?.id) return toast.error("Error de perfil");

    setLoading(true);
    try {
      await registrarCompraInsumo({
        supply_id: selectedInsumo.id,
        branch_id: compraForm.branch_id,
        profile_id: profile.id,
        supplier_name: compraForm.supplier_name,
        quantity: Number(compraForm.quantity) || 0,
        unit_cost: Number(compraForm.unit_cost) || 0,
        purchase_date: compraForm.purchase_date
      });
      toast.success("Compra registrada exitosamente");
      setShowCompraModal(false);
      cargarDatos();
    } catch (e: any) {
      toast.error("Error al registrar la compra");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: Insumo) => {
    if (item.current_stock > 0) {
      toast.error("No se puede eliminar un insumo con stock > 0");
      return;
    }
    
    setLoading(true);
    try {
      const enUso = await verificarUsoInsumo(item.id);
      if (enUso) {
        toast.error("No se puede eliminar un insumo que ya fue utilizado");
        return;
      }
      
      if(confirm(`¿Eliminar definitivamente el insumo ${item.name}?`)) {
        await eliminarInsumo(item.id);
        toast.success("Insumo eliminado exitosamente");
        cargarDatos();
      }
    } catch(e) {
      toast.error("Error al eliminar el insumo");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtrados = insumos.filter(i => i.name.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-stone-50 overflow-hidden">
      
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Package className="text-emerald-600"/> Inventario de Insumos
          </h1>
          <p className="text-sm text-stone-500">Gestiona stock y costos de materia prima.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-3 text-stone-400" size={18}/>
            <input 
              className="w-full pl-10 p-2.5 border rounded-xl bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-sm"
              placeholder="Buscar insumo..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>
          <button onClick={abrirModalCrear} className="bg-stone-900 hover:bg-black text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-stone-200 flex items-center gap-2 font-bold">
            <Plus size={20}/> <span className="hidden md:inline">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Grid de Insumos */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && insumos.length === 0 ? (
            <div className="flex justify-center items-center h-40 text-stone-400 gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full"/> Cargando...
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtrados.map(item => {
              const stock = item.current_stock ?? 0;
              const umbral = item.min_quantity ?? 0;
              const isLow = stock <= umbral;
              
              return (
                <div key={item.id} className={`bg-white p-5 rounded-2xl border transition-all group relative overflow-hidden ${isLow ? 'border-amber-200 shadow-amber-100' : 'border-stone-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-50'}`}>
                  
                  {isLow && <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 rounded-bl-full -mr-8 -mt-8 z-0"></div>}

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center text-stone-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <Package size={20}/>
                      </div>
                      {isLow && (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <AlertTriangle size={10}/> BAJO
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-stone-800 text-lg mb-1">{item.name}</h3>
                    <p className="text-xs text-stone-500 mb-4 bg-stone-50 inline-block px-2 py-1 rounded-lg border border-stone-100">
                      Costo Base: <strong>Bs {(item.unit_cost ?? 0).toFixed(5)}</strong> / {item.unit}
                    </p>

                    <div className="flex justify-between items-end border-t border-stone-100 pt-4">
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">En Stock</p>
                        <p className={`text-2xl font-mono font-bold ${isLow ? 'text-amber-600' : 'text-stone-700'}`}>
                          {stock.toLocaleString()} <span className="text-sm font-sans font-normal text-stone-400">{item.unit}</span>
                        </p>
                      </div>
                      <div className="flex gap-1">
                          <button onClick={() => abrirModalCompra(item)} className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Registrar Compra">
                              <ShoppingCart size={18}/>
                          </button>
                          <button onClick={() => abrirModalEditar(item)} className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                              <Edit2 size={18}/>
                          </button>
                          <button onClick={() => handleDelete(item)} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                              <Trash2 size={18}/>
                          </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL CREAR/EDITAR INSUMO --- */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-50 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
            
            <div className="bg-white p-8 border-b border-stone-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                            <Package className="text-emerald-600"/> {modoEdicion ? 'Editar Insumo' : 'Nuevo Insumo'}
                        </h3>
                        <p className="text-xs text-stone-400">Información básica del catálogo.</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-stone-200 rounded-full text-stone-400 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Nombre del Insumo</label>
                        <input className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 focus:bg-white transition-all" 
                            placeholder="Ej: Leche Entera" autoFocus
                            value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Unidad de Medida</label>
                        <select className="w-full p-3 border border-stone-200 rounded-xl outline-none bg-stone-50 focus:bg-white"
                            value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                            <option value="ml">Mililitros (ml)</option>
                            <option value="g">Gramos (g)</option>
                            <option value="kg">Kilogramos (kg)</option>
                            <option value="l">Litros (l)</option>
                            <option value="unidades">Unidades (und)</option>
                            <option value="oz">Onzas (oz)</option>
                            <option value="lb">Libras (lb)</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Stock Mínimo (Alerta)</label>
                        <input type="text" inputMode="decimal" className="w-full p-3 border border-stone-200 rounded-xl outline-none bg-stone-50 focus:bg-white" 
                            value={form.min_quantity} onChange={e => {
                              const val = e.target.value;
                              if (/^\d*\.?\d*$/.test(val) || val === '') {
                                setForm({...form, min_quantity: val});
                              }
                            }} />
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Costo Unitario Base</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-stone-400 text-sm font-bold">Bs</span>
                            <input type="text" inputMode="decimal" className="w-full pl-9 p-3 border border-stone-200 rounded-xl outline-none bg-stone-50 focus:bg-white" 
                                value={form.unit_cost} onChange={e => {
                                  const val = e.target.value;
                                  if (/^\d*\.?\d*$/.test(val) || val === '') {
                                    setForm({...form, unit_cost: val});
                                  }
                                }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 flex justify-end gap-3 bg-stone-50">
                <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-200 transition-colors">
                    Cancelar
                </button>
                <button onClick={handleGuardar} disabled={loading} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xl shadow-emerald-200 transition-all flex items-center gap-2">
                    {loading ? 'Procesando...' : <>{modoEdicion ? 'Actualizar' : 'Guardar'} <ArrowRight size={18}/></>}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL REGISTRAR COMPRA --- */}
      {showCompraModal && selectedInsumo && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-50 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 flex flex-col">
            
            <div className="bg-white p-8 border-b border-stone-200">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                            <ShoppingCart className="text-emerald-600"/> Registrar Compra
                        </h3>
                        <p className="text-xs text-stone-400">Actualiza el inventario de <strong>{selectedInsumo.name}</strong></p>
                    </div>
                    <button onClick={() => setShowCompraModal(false)} className="p-2 hover:bg-stone-200 rounded-full text-stone-400 transition-colors"><X size={20}/></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Sucursal</label>
                        <select className="w-full p-3 border border-stone-200 rounded-xl outline-none bg-stone-50 focus:bg-white text-sm"
                            value={compraForm.branch_id} onChange={e => setCompraForm({...compraForm, branch_id: e.target.value})}>
                            <option value="">Seleccione una sucursal...</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name} {b.is_main ? '(Principal)' : ''}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Proveedor (Opcional)</label>
                        <input className="w-full p-3 border border-stone-200 rounded-xl outline-none bg-stone-50 focus:bg-white text-sm" 
                            placeholder="Nombre del proveedor"
                            value={compraForm.supplier_name} onChange={e => setCompraForm({...compraForm, supplier_name: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Cantidad Comprada ({selectedInsumo.unit})</label>
                            <input type="text" inputMode="decimal" className="w-full p-3 border border-stone-200 rounded-xl outline-none bg-stone-50 focus:bg-white text-sm" 
                                value={compraForm.quantity} onChange={e => {
                                  const val = e.target.value;
                                  if (/^\d*\.?\d*$/.test(val) || val === '') {
                                    setCompraForm({...compraForm, quantity: val});
                                  }
                                }} />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Costo Unitario (Bs)</label>
                            <input type="text" inputMode="decimal" className="w-full p-3 border border-stone-200 rounded-xl outline-none bg-stone-50 focus:bg-white text-sm" 
                                value={compraForm.unit_cost} onChange={e => {
                                  const val = e.target.value;
                                  if (/^\d*\.?\d*$/.test(val) || val === '') {
                                    setCompraForm({...compraForm, unit_cost: val});
                                  }
                                }} />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Fecha Compra</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 text-stone-400" size={16}/>
                            <input type="date" className="w-full pl-10 p-3 border border-stone-200 rounded-xl outline-none bg-stone-50 focus:bg-white text-sm"
                                value={compraForm.purchase_date} onChange={e => setCompraForm({...compraForm, purchase_date: e.target.value})} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 flex justify-between items-center bg-stone-50">
                <div className="text-sm font-bold text-stone-500">
                    Total: <span className="text-emerald-600">Bs {(Number(compraForm.quantity || 0) * Number(compraForm.unit_cost || 0)).toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowCompraModal(false)} className="px-4 py-2 rounded-xl font-bold text-stone-500 hover:bg-stone-200 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleRegistrarCompra} disabled={loading} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2">
                        {loading ? '...' : 'Registrar'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
