import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Edit2, AlertTriangle, 
  Trash2, X, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { getInsumos, crearInsumo, actualizarStockInsumo, eliminarInsumo } from '../services/insumosService';
import { Database } from '../types/supabase';

type Insumo = Database['public']['Tables']['supplies_inventory']['Row'];

export function Insumos() {
  const { orgId } = useAuth();
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');

  // Modales
  const [showCreate, setShowCreate] = useState(false);
  const [editingItem, setEditingItem] = useState<Insumo | null>(null);

  // Formulario Creación
  const [newItem, setNewItem] = useState({
    name: '', unit_measure: 'unidades', current_stock: '', unit_cost: '', low_stock_threshold: '5'
  });

  useEffect(() => {
    if (orgId) cargarDatos();
  }, [orgId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await getInsumos(orgId!);
      setInsumos(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleCrear = async () => {
    if (!newItem.name) return toast.warning("Nombre requerido");
    try {
      await crearInsumo({
        organization_id: orgId!,
        name: newItem.name,
        unit_measure: newItem.unit_measure,
        current_stock: Number(newItem.current_stock) || 0,
        unit_cost: Number(newItem.unit_cost) || 0,
        low_stock_threshold: Number(newItem.low_stock_threshold) || 5
      });
      toast.success("Insumo creado");
      setShowCreate(false);
      setNewItem({ name: '', unit_measure: 'unidades', current_stock: '', unit_cost: '', low_stock_threshold: '5' });
      cargarDatos();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleUpdateStock = async () => {
    if (!editingItem) return;
    try {
      // CORRECCIÓN 1: Aseguramos que no enviamos null al servicio
      await actualizarStockInsumo(
        editingItem.id, 
        editingItem.current_stock ?? 0, 
        editingItem.unit_cost ?? 0
      );
      toast.success("Inventario actualizado");
      setEditingItem(null);
      cargarDatos();
    } catch (e: any) { toast.error(e.message); }
  };

  const filtrados = insumos.filter(i => i.name.toLowerCase().includes(filtro.toLowerCase()));

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-stone-50 overflow-hidden">
      
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-stone-800 flex items-center gap-2">
            <Package className="text-emerald-600"/> Inventario de Insumos
          </h1>
          <p className="text-xs text-stone-500">Materiales, envases y suministros.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-stone-400" size={18}/>
            <input 
              className="w-full pl-9 p-2 border rounded-lg bg-stone-50 focus:bg-white transition-colors outline-none text-sm"
              placeholder="Buscar insumo..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>
          <button onClick={() => setShowCreate(true)} className="bg-stone-900 text-white p-2 rounded-lg hover:bg-black transition-colors shadow-md">
            <Plus size={20}/>
          </button>
        </div>
      </div>

      {/* Lista Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {loading ? <p className="text-center text-stone-400 mt-10">Cargando inventario...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map(item => {
              // CORRECCIÓN 2: Usamos ?? 0 para comparaciones seguras
              const stock = item.current_stock ?? 0;
              const umbral = item.low_stock_threshold ?? 0;
              const isLow = stock <= umbral;
              
              return (
                <div key={item.id} className={`bg-white p-4 rounded-xl border shadow-sm transition-all relative group ${isLow ? 'border-amber-200 bg-amber-50/30' : 'border-stone-200 hover:border-emerald-300'}`}>
                  
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-stone-800">{item.name}</h3>
                      {/* CORRECCIÓN 3: Formateo seguro de precio */}
                      <p className="text-xs text-stone-500">
                        Costo: Bs {(item.unit_cost ?? 0).toFixed(2)} / {item.unit_measure}
                      </p>
                    </div>
                    {isLow && (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <AlertTriangle size={10}/> BAJO
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-bold">En Stock</p>
                      {/* CORRECCIÓN 4: Visualización segura */}
                      <p className={`text-2xl font-mono font-bold ${isLow ? 'text-amber-600' : 'text-stone-700'}`}>
                        {stock} <span className="text-sm font-sans font-normal text-stone-400">{item.unit_measure}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => setEditingItem(item)}
                      className="bg-stone-100 hover:bg-emerald-100 text-stone-600 hover:text-emerald-700 p-2 rounded-lg transition-colors"
                    >
                      <Edit2 size={18}/>
                    </button>
                  </div>
                </div>
              );
            })}
            
            {filtrados.length === 0 && (
              <div className="col-span-full text-center py-10 text-stone-400 border-2 border-dashed border-stone-200 rounded-xl">
                No hay insumos registrados.
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- MODAL CREAR --- */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-lg text-stone-800 mb-4">Nuevo Insumo</h3>
            <div className="space-y-4">
              <input className="w-full p-2 border rounded-lg" placeholder="Nombre (Ej: Leche Entera)" value={newItem.name} onChange={e=>setNewItem({...newItem, name: e.target.value})}/>
              <div className="grid grid-cols-2 gap-3">
                <select className="w-full p-2 border rounded-lg bg-white" value={newItem.unit_measure} onChange={e=>setNewItem({...newItem, unit_measure: e.target.value})}>
                  <option value="unidades">Unidades</option>
                  <option value="litros">Litros</option>
                  <option value="kg">Kilogramos</option>
                  <option value="gramos">Gramos</option>
                  <option value="ml">Mililitros</option>
                </select>
                <input type="number" className="w-full p-2 border rounded-lg" placeholder="Stock Inicial" value={newItem.current_stock} onChange={e=>setNewItem({...newItem, current_stock: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="w-full p-2 border rounded-lg" placeholder="Costo Unitario" value={newItem.unit_cost} onChange={e=>setNewItem({...newItem, unit_cost: e.target.value})}/>
                <input type="number" className="w-full p-2 border rounded-lg" placeholder="Alerta Mínima" value={newItem.low_stock_threshold} onChange={e=>setNewItem({...newItem, low_stock_threshold: e.target.value})}/>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 text-stone-500 font-bold">Cancelar</button>
              <button onClick={handleCrear} className="flex-1 py-2 bg-stone-900 text-white rounded-lg font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL AJUSTAR STOCK --- */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-stone-800">Ajustar Inventario</h3>
              <button onClick={() => setEditingItem(null)}><X size={20} className="text-stone-400"/></button>
            </div>
            
            <div className="bg-stone-50 p-3 rounded-lg mb-4 text-center">
              <p className="text-sm text-stone-500">{editingItem.name}</p>
              {/* CORRECCIÓN 5: Visualización en modal */}
              <p className="text-2xl font-bold text-stone-800">{editingItem.current_stock ?? 0} <span className="text-sm font-normal">{editingItem.unit_measure}</span></p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">Nuevo Stock Real</label>
                <input 
                  type="number" 
                  autoFocus
                  className="w-full p-3 border-2 border-emerald-100 rounded-xl text-center text-xl font-bold outline-none focus:border-emerald-500" 
                  // CORRECCIÓN 6: Input value con fallback a '' (string vacío) si es null
                  value={editingItem.current_stock ?? ''} 
                  onChange={e => setEditingItem({...editingItem, current_stock: parseFloat(e.target.value) || 0})}
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">Costo Unitario Actualizado</label>
                <input 
                  type="number" 
                  className="w-full p-2 border rounded-lg text-center" 
                  // CORRECCIÓN 7: Input value con fallback
                  value={editingItem.unit_cost ?? ''} 
                  onChange={e => setEditingItem({...editingItem, unit_cost: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
               <button 
                onClick={() => { if(confirm('¿Eliminar insumo?')) eliminarInsumo(editingItem.id).then(()=>{toast.success('Eliminado'); setEditingItem(null); cargarDatos();}) }}
                className="p-3 text-red-400 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={20}/>
              </button>
              <button onClick={handleUpdateStock} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 flex justify-center items-center gap-2">
                <RefreshCw size={18}/> Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}