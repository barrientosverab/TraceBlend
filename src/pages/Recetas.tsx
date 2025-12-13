import React, { useState, useEffect } from 'react';
import { 
  ChefHat, Plus, Trash2, ArrowRight, DollarSign, Scale, Search, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { getInsumos } from '../services/insumosService';
import { 
  getProductosParaRecetas, getIngredientesProducto, agregarIngrediente, eliminarIngrediente,
  ProductoConReceta, RecetaItem 
} from '../services/recetasService';

export function Recetas() {
  const { orgId } = useAuth();
  
  // Datos Maestros
  const [productos, setProductos] = useState<ProductoConReceta[]>([]);
  const [insumos, setInsumos] = useState<any[]>([]);
  
  // Estado Selección
  const [selectedProd, setSelectedProd] = useState<ProductoConReceta | null>(null);
  const [ingredientes, setIngredientes] = useState<RecetaItem[]>([]);
  const [filtro, setFiltro] = useState('');

  // Formulario Nuevo Ingrediente
  const [newIngredient, setNewIngredient] = useState({ supply_id: '', quantity: '', condition: 'always' });

  useEffect(() => {
    if (orgId) {
      cargarProductos();
      getInsumos(orgId).then(setInsumos);
    }
  }, [orgId]);

  // Al seleccionar producto, cargamos sus ingredientes
  useEffect(() => {
    if (selectedProd) {
      getIngredientesProducto(selectedProd.id).then(setIngredientes);
    } else {
      setIngredientes([]);
    }
  }, [selectedProd]);

  const cargarProductos = () => {
    getProductosParaRecetas(orgId!).then(setProductos).catch(console.error);
  };

  const handleAgregar = async () => {
    if (!selectedProd || !newIngredient.supply_id || !newIngredient.quantity) return toast.warning("Faltan datos");
    
    try {
      await agregarIngrediente(selectedProd.id, newIngredient.supply_id, Number(newIngredient.quantity), newIngredient.condition as any);
      toast.success("Ingrediente agregado");
      
      // Recargar datos
      getIngredientesProducto(selectedProd.id).then(setIngredientes);
      cargarProductos(); // Actualizar costo total en la lista
      setNewIngredient({ supply_id: '', quantity: '', condition: 'always' });
    } catch (e: any) { toast.error(e.message); }
  };

  const handleEliminar = async (id: string) => {
    if(!confirm('¿Quitar ingrediente?')) return;
    try {
      await eliminarIngrediente(id);
      getIngredientesProducto(selectedProd!.id).then(setIngredientes);
      cargarProductos();
    } catch (e: any) { toast.error(e.message); }
  };

  // Filtrado
  const prodFiltrados = productos.filter(p => p.name.toLowerCase().includes(filtro.toLowerCase()));

  // Cálculos visuales
  const costoTotalReceta = ingredientes.reduce((sum, i) => sum + (i.quantity_required * i.insumo_costo), 0);
  const margenBruto = selectedProd ? selectedProd.sale_price - costoTotalReceta : 0;
  const porcentajeCosto = selectedProd && selectedProd.sale_price > 0 
    ? (costoTotalReceta / selectedProd.sale_price) * 100 
    : 0;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-stone-50 overflow-hidden">
      
      {/* PANEL IZQUIERDO: PRODUCTOS */}
      <div className="w-1/3 min-w-[300px] bg-white border-r border-stone-200 flex flex-col">
        <div className="p-4 border-b border-stone-100 bg-stone-50">
          <h2 className="font-bold text-stone-800 flex items-center gap-2 text-lg mb-3">
            <ChefHat className="text-emerald-600"/> Definir Recetas
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-stone-400" size={16}/>
            <input 
              className="w-full pl-9 p-2 text-sm border rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="Buscar producto..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {prodFiltrados.map(p => (
            <div 
              key={p.id} 
              onClick={() => setSelectedProd(p)}
              className={`p-3 rounded-xl cursor-pointer border transition-all ${
                selectedProd?.id === p.id 
                  ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500' 
                  : 'bg-white border-stone-100 hover:border-emerald-200'
              }`}
            >
              <div className="flex justify-between font-bold text-stone-800">
                <span>{p.name}</span>
                <span>Bs {p.sale_price}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-stone-500">Costo: Bs {p.costo_estimado.toFixed(2)}</span>
                <span className={`${(p.costo_estimado/p.sale_price) > 0.4 ? 'text-red-500' : 'text-emerald-600'} font-bold`}>
                  {p.sale_price > 0 ? ((p.costo_estimado/p.sale_price)*100).toFixed(0) : 0}% Costo
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PANEL DERECHO: DETALLE RECETA */}
      <div className="flex-1 overflow-y-auto bg-stone-50 p-6">
        {selectedProd ? (
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Header Producto */}
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-stone-800">{selectedProd.name}</h1>
                <p className="text-stone-500 text-sm flex items-center gap-1">
                  Precio de Venta: <span className="font-bold text-stone-700">Bs {selectedProd.sale_price}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase text-stone-400 font-bold">Margen Bruto Unitario</p>
                <p className={`text-3xl font-mono font-bold ${margenBruto < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  Bs {margenBruto.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Lista de Ingredientes */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <div className="p-4 border-b border-stone-100 bg-stone-50 flex justify-between items-center">
                <h3 className="font-bold text-stone-700 text-sm uppercase">Ingredientes Requeridos</h3>
                <span className="text-xs font-bold bg-stone-200 text-stone-600 px-2 py-1 rounded">
                  Total Costo: Bs {costoTotalReceta.toFixed(2)}
                </span>
              </div>
              
              {ingredientes.length === 0 ? (
                <div className="p-8 text-center text-stone-400 flex flex-col items-center">
                  <AlertCircle size={32} className="mb-2 opacity-20"/>
                  <p>Este producto no tiene receta definida.</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="text-stone-400 font-bold border-b border-stone-100">
                    <tr><th className="p-3 pl-4">Insumo</th><th className="p-3">Cantidad</th><th className="p-3 text-right">Costo Calc.</th><th className="w-10"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {ingredientes.map(ing => (
                      <tr key={ing.id} className="hover:bg-stone-50">
                        <td className="p-3 pl-4 font-medium text-stone-700">{ing.insumo_nombre}</td>
                        <td className="p-3 font-mono text-stone-600">{ing.quantity_required} {ing.insumo_medida}</td>
                        <td className="p-3 text-right font-mono text-stone-500">Bs {(ing.quantity_required * ing.insumo_costo).toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleEliminar(ing.id)} className="text-stone-300 hover:text-red-500"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Agregar Nuevo */}
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-stone-400 uppercase">Agregar Insumo</label>
                <select 
                  className="w-full p-2.5 border rounded-lg mt-1 bg-stone-50"
                  value={newIngredient.supply_id}
                  onChange={e => setNewIngredient({...newIngredient, supply_id: e.target.value})}
                >
                  <option value="">-- Seleccionar --</option>
                  {insumos.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Bs {i.unit_cost}/{i.unit_measure})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-32">
                <label className="text-xs font-bold text-stone-400 uppercase">Cantidad</label>
                <input 
                  type="number" 
                  className="w-full p-2.5 border rounded-lg mt-1" 
                  placeholder="0.00"
                  value={newIngredient.quantity}
                  onChange={e => setNewIngredient({...newIngredient, quantity: e.target.value})}
                />
              </div>
              <button onClick={handleAgregar} className="bg-stone-900 text-white p-2.5 rounded-lg hover:bg-black transition-colors flex items-center gap-2">
                <Plus size={18}/> <span className="text-sm font-bold">Añadir</span>
              </button>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-300">
            <ChefHat size={64} className="mb-4 opacity-20"/>
            <p className="text-lg font-medium">Selecciona un producto para editar su receta</p>
          </div>
        )}
      </div>
    </div>
  );
}