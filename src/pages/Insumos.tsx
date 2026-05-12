import { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Edit2, AlertTriangle, 
  Trash2, X, Calculator, Calendar, History, ArrowRight 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { getInsumos, crearInsumo, actualizarInsumo } from '../services/insumosService';


interface Insumo { id: string; name: string; unit_measure: string | null; unit_cost: number; is_active: boolean; current_stock: number; min_stock: number; stock_id: string | null; }

export function Insumos() {
  const { orgId, branchId } = useAuth();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  // Control del Modal
  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  // --- ESTADO DEL FORMULARIO ---
  const [form, setForm] = useState({
    id: '',
    name: '',
    unit_measure: 'ml',
    min_stock: 1000,
    
    // DATOS DE COMPRA (Calculadora)
    presentacion_nombre: 'Unidad', 
    contenido_neto: 1000,       
    costo_presentacion: 0,      
    cantidad_comprada: 1,       
    fecha_compra: new Date().toISOString().split('T')[0], // Default: Hoy

    // RESULTADOS
    costo_unitario_calculado: 0,
    stock_calculado: 0
  });

  const [stockActualBD, setStockActualBD] = useState(0);

  useEffect(() => {
    if (orgId) cargarDatos();
  }, [orgId]);

  // --- CALCULADORA AUTOM�TICA ---
  useEffect(() => {
    const costo = Number(form.costo_presentacion) || 0;
    const contenido = Number(form.contenido_neto) || 1; 
    const cantidad = Number(form.cantidad_comprada) || 0;

    const costoPorUnidad = contenido > 0 ? (costo / contenido) : 0;
    const stockCompra = contenido * cantidad;

    setForm(prev => ({
      ...prev,
      costo_unitario_calculado: costoPorUnidad,
      stock_calculado: stockCompra
    }));
  }, [form.costo_presentacion, form.contenido_neto, form.cantidad_comprada]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getInsumos(orgId!);
      setInsumos(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const abrirModalCrear = () => {
    setModoEdicion(false);
    setStockActualBD(0);
    setForm({
      id: '', name: '', unit_measure: 'ml', min_stock: 500,
      presentacion_nombre: 'Paquete', contenido_neto: 1000, costo_presentacion: 0, cantidad_comprada: 1,
      fecha_compra: new Date().toISOString().split('T')[0],
      costo_unitario_calculado: 0, stock_calculado: 0
    });
    setShowModal(true);
  };

  const abrirModalEditar = (item: Insumo) => {
    setModoEdicion(true);
    setStockActualBD(item.current_stock ?? 0);
    
    setForm({
      id: item.id,
      name: item.name,
      unit_measure: item.unit_measure || 'und',
      min_stock: item.min_stock ?? 0,
      
      presentacion_nombre: 'Unidad', // Reseteamos para nueva compra
      contenido_neto: 1, 
      costo_presentacion: item.unit_cost ?? 0, // Sugerimos costo anterior
      cantidad_comprada: 0, // 0 para no sumar accidentalmente
      fecha_compra: new Date().toISOString().split('T')[0],

      costo_unitario_calculado: item.unit_cost ?? 0,
      stock_calculado: 0
    });
    setShowModal(true);
  };

  const handleGuardar = async () => {
    if (!form.name) return toast.warning("El nombre es obligatorio");
    setLoading(true);

    try {


      if (modoEdicion) {
        // ACTUALIZAR
        const nuevoStockTotal = stockActualBD + form.stock_calculado;
        // Si hay compra nueva, usamos el nuevo costo, sino mantenemos el anterior
        const nuevoCosto = form.cantidad_comprada > 0 ? form.costo_unitario_calculado : form.costo_unitario_calculado;

        await actualizarInsumo(form.id, {
          name: form.name,
          unit_measure: form.unit_measure,
          min_stock: form.min_stock,
          current_stock: nuevoStockTotal,
          unit_cost: nuevoCosto
        });

        // Registrar Historial solo si hubo compra
        if (form.cantidad_comprada > 0) {
            // registrarHistorialCompra removed for MVP - use register_purchase RPC
        }

        toast.success(`Stock actualizado. Total: ${nuevoStockTotal} ${form.unit_measure}`);

      } else {
        // CREAR
        await crearInsumo({
          organization_id: orgId!,
          name: form.name,
          unit_measure: form.unit_measure,
          min_stock: form.min_stock,
          current_stock: form.stock_calculado,
          unit_cost: form.costo_unitario_calculado
        }, orgId!, branchId || '');

        // Registrar Historial Inicial
        if (form.cantidad_comprada > 0) {
            // registrarHistorialCompra removed for MVP - use register_purchase RPC
        }
        
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
              const umbral = item.min_stock ?? 0;
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
                      Costo Base: <strong>Bs {(item.unit_cost ?? 0).toFixed(5)}</strong> / {item.unit_measure}
                    </p>

                    <div className="flex justify-between items-end border-t border-stone-100 pt-4">
                      <div>
                        <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">En Stock</p>
                        <p className={`text-2xl font-mono font-bold ${isLow ? 'text-amber-600' : 'text-stone-700'}`}>
                          {stock.toLocaleString()} <span className="text-sm font-sans font-normal text-stone-400">{item.unit_measure}</span>
                        </p>
                      </div>
                      <div className="flex gap-1">
                          <button onClick={() => abrirModalEditar(item)} className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                              <Edit2 size={18}/>
                          </button>
                          <button onClick={() => { if(confirm('�Eliminar?')) actualizarInsumo(item.id, { is_active: false }).then(cargarDatos) }} className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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

      {/* --- MODAL REDISE�ADO --- */}
      {showModal && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-50 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col md:flex-row max-h-[90vh]">
            
            {/* LADO IZQUIERDO: DATOS DEL INSUMO */}
            <div className="w-full md:w-1/3 bg-white p-8 border-r border-stone-200 overflow-y-auto">
                <h3 className="font-bold text-lg text-stone-800 mb-1 flex items-center gap-2">
                    <Package className="text-emerald-600"/> Insumo
                </h3>
                <p className="text-xs text-stone-400 mb-6">Informaci�n b�sica del producto.</p>
                
                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Nombre del Insumo</label>
                        <input className="w-full p-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-stone-50 focus:bg-white transition-all" 
                            placeholder="Ej: Leche Entera" autoFocus
                            value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Unidad de Medida (Receta)</label>
                        <select className="w-full p-3 border border-stone-200 rounded-xl outline-none bg-stone-50 focus:bg-white"
                            value={form.unit_measure} onChange={e => setForm({...form, unit_measure: e.target.value})}>
                            <option value="ml">Mililitros (ml)</option>
                            <option value="g">Gramos (g)</option>
                            <option value="kg">Kilogramos (kg)</option>
                            <option value="lt">Litros (l)</option>
                            <option value="und">Unidades (und)</option>
                        </select>
                        <p className="text-[10px] text-stone-400 mt-1 leading-tight">Define c�mo se descontar� este insumo en las recetas.</p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Stock M�nimo (Alerta)</label>
                        <input type="number" className="w-full p-3 border border-stone-200 rounded-xl outline-none bg-stone-50 focus:bg-white" 
                            value={form.min_stock} onChange={e => setForm({...form, min_stock: Number(e.target.value)})} />
                    </div>

                    {modoEdicion && (
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                            <p className="text-xs text-emerald-800 font-bold uppercase mb-1">Stock Actual en Sistema</p>
                            <p className="text-2xl font-mono text-emerald-700 font-bold">{stockActualBD.toLocaleString()} <span className="text-sm">{form.unit_measure}</span></p>
                        </div>
                    )}
                </div>
            </div>

            {/* LADO DERECHO: CALCULADORA DE COMPRA */}
            <div className="flex-1 p-8 bg-stone-50 overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                            <Calculator className="text-stone-600"/> Registrar Compra
                        </h3>
                        <p className="text-xs text-stone-400">Calcula el costo real y actualiza inventario.</p>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-stone-200 rounded-full text-stone-400 transition-colors"><X size={20}/></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Tarjeta de Entrada */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200 space-y-4">
                        <div className="flex items-center gap-2 text-stone-800 font-bold text-sm border-b border-stone-100 pb-2">
                           <span className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-xs">1</span> Datos de Compra
                        </div>
                        
                        <div>
                           <label className="text-[10px] font-bold text-stone-400 uppercase">Fecha Compra</label>
                           <div className="relative">
                             <Calendar className="absolute left-3 top-2.5 text-stone-400" size={14}/>
                             <input type="date" className="w-full pl-9 p-2 border rounded-lg text-sm bg-stone-50 outline-none"
                               value={form.fecha_compra} onChange={e => setForm({...form, fecha_compra: e.target.value})} />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] font-bold text-stone-400 uppercase">Presentaci�n</label>
                                <input className="w-full p-2 border rounded-lg text-sm bg-stone-50 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500" placeholder="Ej: Caja" 
                                    value={form.presentacion_nombre} onChange={e => setForm({...form, presentacion_nombre: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-stone-400 uppercase">Cant. Comprada</label>
                                <input type="number" className="w-full p-2 border rounded-lg text-sm bg-stone-50 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500" placeholder="0" 
                                    value={form.cantidad_comprada} onChange={e => setForm({...form, cantidad_comprada: Number(e.target.value)})} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                             <div>
                                <label className="text-[10px] font-bold text-stone-400 uppercase">Contenido ({form.unit_measure})</label>
                                <input type="number" className="w-full p-2 border rounded-lg text-sm bg-stone-50 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500" placeholder="Ej: 1000" 
                                    value={form.contenido_neto} onChange={e => setForm({...form, contenido_neto: Number(e.target.value)})} />
                             </div>
                             <div>
                                <label className="text-[10px] font-bold text-stone-400 uppercase">Costo Presentaci�n</label>
                                <div className="relative">
                                    <span className="absolute left-2 top-2 text-stone-400 text-xs font-bold">Bs</span>
                                    <input type="number" className="w-full pl-6 p-2 border rounded-lg text-sm bg-stone-50 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500" placeholder="0.00" 
                                        value={form.costo_presentacion} onChange={e => setForm({...form, costo_presentacion: Number(e.target.value)})} />
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Tarjeta de Salida (Calculado) */}
                    <div className="bg-stone-800 text-stone-200 p-5 rounded-2xl shadow-lg flex flex-col justify-between">
                         <div>
                            <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-stone-600 pb-2 mb-4">
                                <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">2</span> Resultado
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-stone-400">Stock a Agregar</span>
                                    <span className="text-xl font-mono font-bold text-white">+{form.stock_calculado.toLocaleString()} <span className="text-xs text-stone-400">{form.unit_measure}</span></span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-stone-400">Costo Unit. Real</span>
                                    <span className="text-xl font-mono font-bold text-emerald-400">Bs {form.costo_unitario_calculado.toFixed(5)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-stone-600">
                                    <span className="text-xs text-stone-400">Gasto Total</span>
                                    <span className="text-lg font-bold text-white">Bs {(form.cantidad_comprada * form.costo_presentacion).toFixed(2)}</span>
                                </div>
                            </div>
                         </div>
                         
                         <div className="mt-4 pt-4 border-t border-stone-600 text-[10px] text-stone-400 flex items-center gap-2">
                            <History size={12}/> Se registrar� en Historial de Gastos
                         </div>
                    </div>
                </div>

                {/* Footer del Modal */}
                <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-stone-500 hover:bg-stone-200 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleGuardar} disabled={loading} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xl shadow-emerald-200 transition-all flex items-center gap-2">
                        {loading ? 'Procesando...' : <>{modoEdicion ? 'Actualizar Stock' : 'Guardar Insumo'} <ArrowRight size={18}/></>}
                    </button>
                </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}