import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Edit2, Tag, Coffee, Box, Utensils, 
  Archive, Save, X, DollarSign, Barcode 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { getTodosLosProductos, crearProducto, actualizarProducto, toggleEstadoProducto, ProductoForm } from '../services/productosService';

// Categorías Visuales
const CAT_ICONS: Record <string, any> = {
  'Café': Coffee,
  'Grano': Package,
  'Pastelería': Utensils,
  'Accesorios': Box,
  'General': Tag
};

export function Productos() {
  const { orgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('');
  const [catFiltro, setCatFiltro] = useState('Todas');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Formulario
  const [formData, setFormData] = useState<ProductoForm>({
    name: '', sku: '', sale_price: '', category: 'General', 
    is_roasted: false, package_weight_grams: '', stock_inicial: ''
  });

  useEffect(() => { if (orgId) cargar(); }, [orgId]);

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
        await actualizarProducto(selectedId, formData);
        toast.success("Producto actualizado");
      } else {
        await crearProducto(formData, orgId!);
        toast.success("Producto creado en el catálogo");
      }
      setShowModal(false);
      resetForm();
      cargar();
    } catch (e: any) { toast.error(e.message); }
  };

  const openEdit = (p: any) => {
    setFormData({
      name: p.name,
      sku: p.sku || '',
      sale_price: p.sale_price,
      category: p.category || 'General',
      is_roasted: p.is_roasted,
      package_weight_grams: p.package_weight_grams || '',
      stock_inicial: '' // No editamos stock aquí, solo en inventario/empaque
    });
    setSelectedId(p.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', sku: '', sale_price: '', category: 'General', is_roasted: false, package_weight_grams: '', stock_inicial: '' });
    setIsEditing(false);
    setSelectedId(null);
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
      <div className="bg-white border-b border-stone-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <Package className="text-emerald-600"/> Catálogo Maestro
          </h1>
          <p className="text-xs text-stone-500">Define los productos que vendes en caja o empacas.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-stone-400" size={18}/>
            <input 
              className="w-full pl-9 p-2.5 border rounded-xl bg-stone-50 focus:bg-white outline-none transition-all"
              placeholder="Buscar por nombre o SKU..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            />
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-stone-900 text-white px-4 py-2 rounded-xl hover:bg-black transition-all shadow-lg flex items-center gap-2 font-bold">
            <Plus size={20}/> Nuevo
          </button>
        </div>
      </div>

      {/* FILTROS CATEGORIA */}
      <div className="px-6 py-2 bg-stone-50 border-b border-stone-200 flex gap-2 overflow-x-auto no-scrollbar">
        {categoriasUnicas.map(cat => (
          <button 
            key={cat}
            onClick={() => setCatFiltro(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${catFiltro === cat ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-500 border-stone-200 hover:border-emerald-400'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map(p => {
            const Icon = CAT_ICONS[p.category] || Tag;
            return (
              <div key={p.id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group relative">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.is_roasted ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
                      <Icon size={20}/>
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-800 leading-tight">{p.name}</h3>
                      <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">{p.category}</span>
                    </div>
                  </div>
                  <button onClick={() => openEdit(p)} className="p-2 text-stone-300 hover:text-emerald-600 transition-colors">
                    <Edit2 size={16}/>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-end">
                  <div>
                    {p.sku && <p className="text-xs text-stone-400 font-mono flex items-center gap-1"><Barcode size={10}/> {p.sku}</p>}
                    <p className="text-xs text-stone-500 font-bold mt-1">
                      Stock: <span className={p.stock_actual > 0 ? 'text-emerald-600' : 'text-red-400'}>{p.stock_actual}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-stone-800 flex items-center">
                      <span className="text-xs text-stone-400 mr-1 font-normal">Bs</span>
                      {p.sale_price}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL CREAR/EDITAR */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h3 className="font-bold text-lg text-stone-800">{isEditing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-stone-200"><X size={20}/></button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Nombre y Categoría */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className="text-xs font-bold text-stone-400 uppercase">Categoría</label>
                  <select className="w-full p-2.5 border rounded-lg mt-1 bg-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="General">General</option>
                    <option value="Café">Bebidas Café</option>
                    <option value="Grano">Grano / Bolsas</option>
                    <option value="Pastelería">Pastelería</option>
                    <option value="Accesorios">Accesorios</option>
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1 flex items-end pb-1">
                  {/* Checkbox especial para productos de café que requieren empaque */}
                  <label className="flex items-center gap-2 cursor-pointer p-2 border rounded-lg w-full hover:bg-stone-50 transition-colors">
                    <input type="checkbox" className="accent-emerald-600 w-4 h-4" checked={formData.is_roasted} onChange={e => setFormData({...formData, is_roasted: e.target.checked})}/>
                    <span className="text-sm font-bold text-stone-600">¿Es Café Tostado?</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">Nombre del Producto</label>
                <input className="w-full p-3 border rounded-xl mt-1 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej: Latte Grande" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">Precio Venta (Bs)</label>
                  <div className="relative mt-1">
                    <DollarSign size={16} className="absolute left-3 top-3 text-emerald-600"/>
                    <input type="number" className="w-full pl-9 p-3 border rounded-xl font-bold text-stone-800" placeholder="0.00" value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: e.target.value})}/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">SKU (Código)</label>
                  <input className="w-full p-3 border rounded-xl mt-1" placeholder="Ej: LAT-001" value={formData.sku || ''} onChange={e => setFormData({...formData, sku: e.target.value})}/>
                </div>
              </div>

              {/* Campos condicionales */}
              {formData.is_roasted ? (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <label className="text-xs font-bold text-amber-700 uppercase flex items-center gap-2 mb-1">
                    <Package size={14}/> Peso por Bolsa (Gramos)
                  </label>
                  <input type="number" className="w-full p-2 border border-amber-200 rounded-lg bg-white" placeholder="Ej: 250" value={formData.package_weight_grams || ''} onChange={e => setFormData({...formData, package_weight_grams: e.target.value})}/>
                  <p className="text-[10px] text-amber-600 mt-2 leading-tight">Este producto aparecerá en el módulo de Empaque para llenar stock desde tostadoras.</p>
                </div>
              ) : (
                !isEditing && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <label className="text-xs font-bold text-blue-700 uppercase flex items-center gap-2 mb-1">
                      <Box size={14}/> Stock Inicial (Opcional)
                    </label>
                    <input type="number" className="w-full p-2 border border-blue-200 rounded-lg bg-white" placeholder="0" value={formData.stock_inicial || ''} onChange={e => setFormData({...formData, stock_inicial: e.target.value})}/>
                  </div>
                )
              )}

            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-100 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-stone-500 font-bold hover:bg-stone-200 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-colors flex justify-center gap-2">
                <Save size={18}/> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}