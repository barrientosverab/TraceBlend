import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Edit2, Trash2, CheckCircle, XCircle, AlertTriangle, Save, X 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {toast} from 'sonner';
import { getTodosLosProductos, actualizarProducto, toggleEstadoProducto } from '../services/productosService';

export function Productos() {
  const { orgId } = useAuth();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  
  // Estado del Modal
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    if (orgId) cargarProductos();
  }, [orgId]);

  const cargarProductos = async () => {
    setLoading(true);
    try {
      const data = await getTodosLosProductos(orgId);
      setProductos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prod) => {
    setEditingProduct({ ...prod }); // Copia para editar
  };

  const handleSave = async () => {
    try {
      await actualizarProducto(editingProduct.id, editingProduct);
      toast.success("Producto actualizado correctamente");
      setEditingProduct(null);
      cargarProductos();
    } catch (e) {
      toast.error("Error al actualizar: ",{ description: error.message});
    }
  };

  const handleToggleStatus = (prod) => {
    const accion = prod.is_active ? "desactivar" : "activar";
    
    // Lanzamos la pregunta. El código sigue ejecutándose, no se detiene aquí.
    toast(`¿Deseas ${accion} el producto "${prod.name}"?`, {
      description: "Si lo desactivas, no aparecerá en nuevas ventas.",
      action: {
        label: 'Confirmar',
        // La magia ocurre AQUÍ, solo si el usuario hace clic:
        onClick: async () => {
          try {
            // 1. Llamamos a la API
            await toggleEstadoProducto(prod.id, !prod.is_active);
            
            // 2. Recargamos la tabla
            await cargarProductos();
            
            // 3. Feedback de éxito
            toast.success(`Producto ${accion}do correctamente`);
          } catch (e) {
            toast.error("Error al cambiar estado", { description: e.message });
          }
        },
      },
      cancel: {
        label: 'Cancelar', // Solo cierra el toast, no hace nada más
      },
      duration: 5000, // Damos tiempo suficiente para leer
    });
  };

  const filtrados = productos.filter(p => 
    p.name.toLowerCase().includes(filtro.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(filtro.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-center text-stone-500 animate-pulse">Cargando catálogo...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-2">
            <Package className="text-emerald-600"/> Catálogo de Productos
          </h1>
          <p className="text-stone-500">Gestiona precios, nombres y disponibilidad.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-3 text-stone-400" size={18}/>
          <input 
            className="w-full pl-10 p-2 border border-stone-300 rounded-lg focus:border-emerald-500 outline-none"
            placeholder="Buscar SKU o Nombre..."
            value={filtro}
            onChange={e => setFiltro(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-stone-50 text-stone-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4 border-b border-stone-100">Estado</th>
              <th className="p-4 border-b border-stone-100">SKU / Código</th>
              <th className="p-4 border-b border-stone-100">Nombre</th>
              <th className="p-4 border-b border-stone-100">Tipo</th>
              <th className="p-4 border-b border-stone-100 text-right">Precio (Bs)</th>
              <th className="p-4 border-b border-stone-100 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-sm">
            {filtrados.length === 0 ? (
              <tr><td colSpan="6" className="p-8 text-center text-stone-400">No se encontraron productos.</td></tr>
            ) : (
              filtrados.map(p => (
                <tr key={p.id} className={`hover:bg-stone-50 transition-colors ${!p.is_active ? 'opacity-60 bg-stone-50' : ''}`}>
                  <td className="p-4">
                    {p.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                        <CheckCircle size={12}/> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-stone-200 text-stone-600 rounded-full text-xs font-bold">
                        <XCircle size={12}/> Inactivo
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-mono text-stone-600">{p.sku || '---'}</td>
                  <td className="p-4 font-bold text-stone-800">{p.name}</td>
                  <td className="p-4 text-stone-500">
                    {p.is_roasted ? 'Café Tostado' : 'Insumo / Otro'}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-emerald-700">
                    {p.sale_price?.toFixed(2)}
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    <button 
                      onClick={() => handleEdit(p)}
                      className="p-2 text-stone-500 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16}/>
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(p)}
                      className={`p-2 rounded-lg transition-colors ${p.is_active ? 'text-stone-400 hover:bg-red-50 hover:text-red-500' : 'text-emerald-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                      title={p.is_active ? "Desactivar (Borrar)" : "Reactivar"}
                    >
                      {p.is_active ? <Trash2 size={16}/> : <CheckCircle size={16}/>}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDICIÓN */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                <Edit2 size={18} className="text-emerald-600"/> Editar Producto
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-stone-400 hover:text-red-500"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase">Nombre del Producto</label>
                <input 
                  className="w-full p-2 border border-stone-300 rounded-lg mt-1 focus:border-emerald-500 outline-none font-bold text-stone-800"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase">SKU / Código</label>
                  <input 
                    className="w-full p-2 border border-stone-300 rounded-lg mt-1 focus:border-emerald-500 outline-none font-mono"
                    value={editingProduct.sku || ''}
                    onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-500 uppercase text-emerald-700">Precio de Venta</label>
                  <input 
                    type="number"
                    step="0.50"
                    className="w-full p-2 border border-emerald-200 bg-emerald-50/30 rounded-lg mt-1 focus:border-emerald-500 outline-none font-bold text-emerald-800"
                    value={editingProduct.sale_price}
                    onChange={e => setEditingProduct({...editingProduct, sale_price: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-500 uppercase">Descripción</label>
                <textarea 
                  className="w-full p-2 border border-stone-300 rounded-lg mt-1 focus:border-emerald-500 outline-none text-sm"
                  rows="3"
                  value={editingProduct.description || ''}
                  onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-3 text-amber-800 text-xs">
                 <AlertTriangle size={16} className="shrink-0"/>
                 <p>Nota: Para mantener la integridad del inventario, no es posible editar el peso del paquete ni el tipo de producto desde aquí.</p>
              </div>

            </div>

            <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex justify-end gap-3">
              <button onClick={() => setEditingProduct(null)} className="px-4 py-2 text-stone-600 hover:bg-stone-200 rounded-lg font-bold">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-bold flex items-center gap-2">
                <Save size={18}/> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}