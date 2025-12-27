import React, { useState, useEffect } from 'react';
import {
  Package, Search, Plus, Edit2, Tag, Coffee, Box, Utensils,
  Save, X, DollarSign, Barcode, List, Trash2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import {
  getTodosLosProductos, crearProducto, actualizarProducto,
  getInsumosDisponibles, getRecetaProducto,
  ProductoForm, IngredienteReceta
} from '../services/productosService';
import { EmptyState, Button } from '../components/ui';

// Categorías Visuales
const CAT_ICONS: Record<string, any> = {
  'Café': Coffee, 'Grano': Package, 'Pastelería': Utensils, 'Accesorios': Box, 'General': Tag
};

export function Productos() {
  const { orgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<any[]>([]);
  const [insumos, setInsumos] = useState<any[]>([]); // Lista de insumos disponibles

  const [filtro, setFiltro] = useState('');
  const [catFiltro, setCatFiltro] = useState('Todas');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Formulario Principal
  const [formData, setFormData] = useState<ProductoForm>({
    name: '', sku: '', sale_price: '', category: 'General',
    is_roasted: false, package_weight_grams: '', stock_inicial: '',
    receta: []
  });

  // Estado temporal para agregar ingrediente
  const [newIngrediente, setNewIngrediente] = useState<{ id: string, qty: string }>({ id: '', qty: '' });

  useEffect(() => {
    if (orgId) {
      cargar();
      getInsumosDisponibles(orgId).then(setInsumos);
    }
  }, [orgId]);

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await getTodosLosProductos(orgId!);
      setProductos(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sale_price) return toast.warning("Nombre y Precio requeridos");
    try {
      if (isEditing && selectedId) {
        await actualizarProducto(selectedId, formData, orgId!);
        toast.success("Producto actualizado");
      } else {
        await crearProducto(formData, orgId!);
        toast.success("Producto creado");
      }
      setShowModal(false);
      resetForm();
      cargar();
    } catch (e: any) { toast.error(e.message); }
  };

  const openEdit = async (p: any) => {
    // Cargar receta existente
    let recetaActual: IngredienteReceta[] = [];
    try {
      recetaActual = await getRecetaProducto(p.id);
    } catch (e) { console.error("Error cargando receta", e); }

    setFormData({
      name: p.name,
      sku: p.sku || '',
      sale_price: p.sale_price,
      category: p.category || 'General',
      is_roasted: p.is_roasted,
      package_weight_grams: p.package_weight_grams || '',
      stock_inicial: '',
      receta: recetaActual
    });
    setSelectedId(p.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', sku: '', sale_price: '', category: 'General',
      is_roasted: false, package_weight_grams: '', stock_inicial: '', receta: []
    });
    setNewIngrediente({ id: '', qty: '' });
    setIsEditing(false);
    setSelectedId(null);
  };

  // --- Helpers de Receta ---
  const agregarIngrediente = () => {
    if (!newIngrediente.id || !newIngrediente.qty) return;
    const insumoReal = insumos.find(i => i.id === newIngrediente.id);
    if (!insumoReal) return;

    const item: IngredienteReceta = {
      supply_id: newIngrediente.id,
      quantity: Number(newIngrediente.qty),
      nombre_insumo: insumoReal.name,
      unidad: insumoReal.unit_measure
    };

    setFormData({ ...formData, receta: [...(formData.receta || []), item] });
    setNewIngrediente({ id: '', qty: '' });
  };

  const quitarIngrediente = (index: number) => {
    const nuevaReceta = [...(formData.receta || [])];
    nuevaReceta.splice(index, 1);
    setFormData({ ...formData, receta: nuevaReceta });
  };

  // Filtrado
  const filtrados = productos.filter(p => {
    const matchText = p.name.toLowerCase().includes(filtro.toLowerCase()) || p.sku?.toLowerCase().includes(filtro.toLowerCase());
    const matchCat = catFiltro === 'Todas' || p.category === catFiltro;
    return matchText && matchCat;
  });
  const categoriasUnicas = ['Todas', ...new Set(productos.map(p => p.category || 'General'))];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-stone-50 overflow-hidden">

      {/* HEADER */}
      <div className="bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center gap-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Package className="text-emerald-600" /> Catálogo Maestro
          </h1>
          <p className="text-xs text-stone-500">Define productos y sus fichas técnicas.</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-stone-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-black transition-all">
          <Plus size={20} /> Nuevo
        </button>
      </div>

      {/* FILTROS */}
      <div className="px-6 py-2 bg-stone-50 border-b border-stone-200 flex gap-2 overflow-x-auto no-scrollbar items-center">
        <div className="relative w-64 mr-4">
          <Search className="absolute left-3 top-2.5 text-stone-400" size={16} />
          <input className="w-full pl-9 p-2 border rounded-lg bg-white text-sm" placeholder="Buscar..." value={filtro} onChange={e => setFiltro(e.target.value)} />
        </div>
        {categoriasUnicas.map(cat => (
          <button key={cat} onClick={() => setCatFiltro(cat)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border ${catFiltro === cat ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* GRID PRODUCTOS */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtrados.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay productos registrados"
            description={
              filtro
                ? `No se encontraron productos que coincidan con "${filtro}". Intenta con otro término.`
                : catFiltro !== 'Todas'
                  ? `No hay productos en la categoría "${catFiltro}". Prueba con otra categoría.`
                  : 'Comienza creando tu primer producto para empezar a vender.'
            }
            actionLabel="Crear Producto"
            onAction={() => { resetForm(); setShowModal(true); }}
            secondaryActionLabel={catFiltro !== 'Todas' || filtro ? 'Limpiar Filtros' : undefined}
            onSecondaryAction={catFiltro !== 'Todas' || filtro ? () => { setCatFiltro('Todas'); setFiltro(''); } : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtrados.map(p => {
              const Icon = CAT_ICONS[p.category] || Tag;
              return (
                <div key={p.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md transition-smooth group relative flex flex-col justify-between animate-fade-in">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.is_roasted ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-stone-800 leading-tight">{p.name}</h3>
                          <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">{p.category}</span>
                        </div>
                      </div>
                    </div>
                    {p.sku && <p className="text-xs text-stone-400 font-mono flex items-center gap-1 mb-2"><Barcode size={10} /> {p.sku}</p>}
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex justify-between items-end">
                    <button onClick={() => openEdit(p)} className="text-stone-400 hover:text-emerald-600 font-bold text-xs flex items-center gap-1 transition-smooth">
                      <Edit2 size={12} /> Editar
                    </button>
                    <p className="text-xl font-bold text-stone-800">Bs {p.sale_price}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h3 className="font-bold text-lg text-stone-800">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-stone-200"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* DATOS BÁSICOS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-stone-400 uppercase">Nombre</label>
                  <input className="w-full p-2 border rounded-lg mt-1" placeholder="Ej: Cappuccino" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">Categoría</label>
                  <select className="w-full p-2 border rounded-lg mt-1 bg-white" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                    <option value="General">General</option>
                    <option value="Café">Bebidas Café</option>
                    <option value="Grano">Grano / Bolsas</option>
                    <option value="Pastelería">Pastelería</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">Precio (Bs)</label>
                  <div className="relative mt-1">
                    <DollarSign size={14} className="absolute left-2 top-3 text-stone-400" />
                    <input type="number" className="w-full pl-6 p-2 border rounded-lg font-bold" value={formData.sale_price} onChange={e => setFormData({ ...formData, sale_price: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* SECCIÓN FICHA TÉCNICA (RECETA) */}
              {!formData.is_roasted && (
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                  <h4 className="font-bold text-stone-700 mb-3 flex items-center gap-2">
                    <List size={16} className="text-emerald-600" /> Ficha Técnica (Receta)
                  </h4>
                  <p className="text-xs text-stone-500 mb-4">Define qué insumos se descuentan al vender este producto.</p>

                  {/* Agregar Item */}
                  <div className="flex gap-2 mb-4">
                    <select className="flex-1 p-2 border rounded-lg text-sm" value={newIngrediente.id} onChange={e => setNewIngrediente({ ...newIngrediente, id: e.target.value })}>
                      <option value="">+ Agregar Insumo...</option>
                      {insumos.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit_measure})</option>)}
                    </select>
                    <input
                      type="number"
                      className="w-20 p-2 border rounded-lg text-sm"
                      placeholder="Cant."
                      value={newIngrediente.qty}
                      onChange={e => setNewIngrediente({ ...newIngrediente, qty: e.target.value })}
                    />
                    <button onClick={agregarIngrediente} className="bg-stone-800 text-white px-3 rounded-lg font-bold hover:bg-black">+</button>
                  </div>

                  {/* Lista Items */}
                  {formData.receta && formData.receta.length > 0 ? (
                    <div className="space-y-2">
                      {formData.receta.map((r, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-stone-200 text-sm">
                          <span>{r.nombre_insumo}</span>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-stone-600">{r.quantity} {r.unidad}</span>
                            <button onClick={() => quitarIngrediente(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-stone-400 italic border-2 border-dashed border-stone-200 rounded-lg">
                      No hay ingredientes definidos.
                    </div>
                  )}
                </div>
              )}

              {/* CHECKBOX CAFÉ TOSTADO */}
              <div className="pt-2 border-t border-stone-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-emerald-600" checked={formData.is_roasted} onChange={e => setFormData({ ...formData, is_roasted: e.target.checked })} />
                  <span className="text-sm font-bold text-stone-600">Es Café Tostado (Bolsa para venta)</span>
                </label>
                {formData.is_roasted && (
                  <div className="mt-2 ml-6">
                    <label className="text-xs font-bold text-stone-400 uppercase">Peso Neto (Gramos)</label>
                    <input type="number" className="block w-32 p-2 border rounded-lg mt-1" value={formData.package_weight_grams} onChange={e => setFormData({ ...formData, package_weight_grams: e.target.value })} />
                  </div>
                )}
              </div>

            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-stone-500 font-bold hover:bg-stone-200 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-colors flex justify-center gap-2">
                <Save size={18} /> Guardar Producto
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}