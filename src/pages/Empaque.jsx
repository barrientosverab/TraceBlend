import React, { useState, useEffect } from 'react';
import { Package, Plus, Save, Box, ArrowRight, ShoppingBag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProductos, crearProducto, getBatchesDisponibles, registrarEmpaque } from '../services/empaqueService';
import { getLotesVerdesParaVenta } from '../services/empaqueService';

export function Empaque() {
  const { orgId, user } = useAuth();
  const [activeTab, setActiveTab] = useState('pack'); // 'pack' | 'products'
  
  // Datos
  const [productos, setProductos] = useState([]);
  const [batches, setBatches] = useState([]);
  const [lotesVerdes, setLotesVerdes] = useState([]);
  const [tipoProducto, setTipoProducto] = useState('tostado'); // 'tostado' | 'verde'
  
  // Formulario Empaque
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [cantidad, setCantidad] = useState('');
  
  // Formulario Producto Nuevo
  const [newProd, setNewProd] = useState({ nombre: '', sku: '', peso_gramos: '', precio: '' });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

const cargarDatos = async () => {
  try {
    const [prods, lotes, verdes] = await Promise.all([
      getProductos(), 
      getBatchesDisponibles(),
      getLotesVerdesParaVenta() // <--- Nuevo
    ]);
    setProductos(prods);
    setBatches(lotes);
    setLotesVerdes(verdes);
  } catch (e) { console.error(e); }
};

  // --- LÓGICA DE EMPAQUE ---
  const batchSeleccionado = batches.find(b => b.id === selectedBatchId);
  const prodSeleccionado = productos.find(p => p.id === selectedProductId);
  
  // Cálculo predictivo
  const pesoTotalEmpaqueKg = (cantidad && prodSeleccionado) 
    ? (cantidad * prodSeleccionado.package_weight_grams / 1000) 
    : 0;

  const handleEmpacar = async () => {
    if (!selectedBatchId || !selectedProductId || !cantidad) return alert("Completa los datos");
    if (pesoTotalEmpaqueKg > batchSeleccionado.peso_disponible) return alert("No hay suficiente café en este lote tostado.");

    setLoading(true);
    try {
      await registrarEmpaque({
        batch_id: selectedBatchId,
        product_id: selectedProductId,
        cantidad: cantidad
      }, orgId, user.id);
      alert("✅ Producto Empacado y sumado al Inventario Final");
      setCantidad('');
      cargarDatos(); // Recargar saldos
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  // --- LÓGICA DE PRODUCTOS ---
const handleCrearProducto = async () => {
  if (!newProd.nombre || !newProd.peso_gramos) return alert("Faltan datos");
  if (tipoProducto === 'verde' && !newProd.green_id) return alert("Selecciona el lote de origen");

  setLoading(true);
  try {
    await crearProducto({
      ...newProd, 
      tipo: tipoProducto // Enviamos el tipo
    }, orgId);
    alert("Producto Creado");
    setNewProd({ nombre: '', sku: '', peso_gramos: '', precio: '', green_id: '' });
    cargarDatos();
  } catch (e) { alert(e.message); }
  finally { setLoading(false); }
};

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-stone-50 overflow-hidden">
      
      {/* HEADER TABS */}
      <div className="flex bg-white border-b border-stone-200 px-6 py-2 gap-4">
        <button onClick={() => setActiveTab('pack')} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'pack' ? 'bg-emerald-100 text-emerald-800' : 'text-stone-500 hover:bg-stone-100'}`}>
          <Package size={16}/> Estación de Empaque
        </button>
        <button onClick={() => setActiveTab('products')} className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'products' ? 'bg-emerald-100 text-emerald-800' : 'text-stone-500 hover:bg-stone-100'}`}>
          <ShoppingBag size={16}/> Catálogo de Productos
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        
        {/* VISTA 1: EMPAQUE */}
       {activeTab === 'pack' && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-stone-100 space-y-6">
              <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2 border-b pb-4">
                <Box className="text-amber-500"/> Registrar Empaque
              </h2>

              {/* 1. SELECCIÓN DE LOTE */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">1. Lote Tostado (Origen)</label>
                <select 
                  className="w-full p-3 border rounded-xl bg-stone-50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                  value={selectedBatchId} 
                  onChange={e => setSelectedBatchId(e.target.value)}
                >
                  <option value="">-- Seleccionar Lote --</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {/* En el dropdown mostramos info resumida */}
                      {new Date(b.fecha).toLocaleDateString()} — {b.variedad} ({b.peso_disponible.toFixed(1)}kg)
                    </option>
                  ))}
                </select>
              </div>

              {/* --- TARJETA DE SEGURIDAD (NUEVO) --- */}
              {batchSeleccionado && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg animate-fade-in-up">
                  <h3 className="text-amber-800 font-bold text-xs uppercase mb-2 flex items-center gap-2">
                    <span className="bg-amber-200 px-2 py-0.5 rounded text-[10px]">VERIFICAR CONTENIDO</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-y-1 text-sm">
                    <span className="text-stone-500">Variedad:</span>
                    <span className="font-bold text-stone-800 text-lg">{batchSeleccionado.variedad}</span>
                    
                    <span className="text-stone-500">Proceso:</span>
                    <span className="font-bold text-stone-800">{batchSeleccionado.proceso}</span>
                    
                    <span className="text-stone-500">Finca:</span>
                    <span className="text-stone-800">{batchSeleccionado.origen_nombre}</span>
                  </div>
                </div>
              )}

              {/* 2. SELECCIÓN DE PRODUCTO */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">2. Tipo de Bolsa (Destino)</label>
                <select className="w-full p-3 border rounded-xl bg-stone-50" value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}>
                  <option value="">-- Seleccionar SKU --</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.package_weight_grams}g)
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. CANTIDAD */}
              <div>
                <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">3. Cantidad de Unidades</label>
                <input 
                  type="number" 
                  className="w-full p-3 border rounded-xl font-mono text-lg font-bold outline-none focus:border-emerald-500" 
                  placeholder="0"
                  value={cantidad}
                  onChange={e => setCantidad(e.target.value)}
                />
              </div>

              <button 
                onClick={handleEmpacar}
                disabled={loading || !selectedBatchId || !selectedProductId}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-bold rounded-xl shadow-md transition-all flex justify-center gap-2"
              >
                {loading ? 'Guardando...' : 'Confirmar Empaque'}
              </button>
            </div>

            {/* COLUMNA DERECHA: RESUMEN Y AYUDA */}
            <div className="space-y-6">
              
              {/* Resumen de Movimiento */}
              <div className={`p-6 rounded-2xl border-2 border-dashed transition-all ${batchSeleccionado && pesoTotalEmpaqueKg > 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-stone-200'}`}>
                <h3 className="font-bold text-stone-400 uppercase text-xs mb-4">Simulación de Inventario</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-500 text-sm">Stock Actual (Tostado)</span>
                    <span className="font-mono font-bold text-stone-700">
                      {batchSeleccionado ? `${batchSeleccionado.peso_disponible.toFixed(2)} Kg` : '--'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-red-500">
                    <span className="text-sm flex items-center gap-2"><ArrowRight size={14}/> A descontar</span>
                    <span className="font-mono font-bold">
                      - {pesoTotalEmpaqueKg > 0 ? pesoTotalEmpaqueKg.toFixed(2) : '0.00'} Kg
                    </span>
                  </div>

                  <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
                    <span className="text-emerald-700 font-bold text-sm">Nuevo Stock Estimado</span>
                    <span className={`font-mono font-bold ${batchSeleccionado && (batchSeleccionado.peso_disponible - pesoTotalEmpaqueKg) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {batchSeleccionado 
                        ? (batchSeleccionado.peso_disponible - pesoTotalEmpaqueKg).toFixed(2) 
                        : '--'} Kg
                    </span>
                  </div>
                </div>

                {batchSeleccionado && (batchSeleccionado.peso_disponible - pesoTotalEmpaqueKg) < 0 && (
                  <div className="mt-4 bg-red-100 text-red-800 text-xs p-2 rounded text-center font-bold">
                    ⛔ Error: No hay suficiente café para empacar esta cantidad.
                  </div>
                )}
              </div>

              {/* Ilustración */}
              <div className="flex justify-center opacity-20">
                <Package size={120} />
              </div>
            </div>

          </div>
        )}

        {/* VISTA 2: PRODUCTOS */}
        {activeTab === 'products' && (
  <div className="max-w-2xl mx-auto">
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-100 mb-8">
      <h3 className="font-bold text-lg text-emerald-800 mb-6 border-b pb-2">Crear Nuevo Item de Venta</h3>
      
      {/* Selector de Tipo */}
      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" checked={tipoProducto === 'tostado'} onChange={() => setTipoProducto('tostado')} />
          <span className="font-bold text-stone-700">Café Tostado</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="radio" checked={tipoProducto === 'verde'} onChange={() => setTipoProducto('verde')} />
          <span className="font-bold text-stone-700">Oro Verde (Granel)</span>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Si es Verde, mostramos el selector de lote */}
        {tipoProducto === 'verde' && (
          <div className="col-span-2">
            <label className="text-xs font-bold text-stone-500 uppercase">Lote de Origen</label>
            <select 
              className="w-full p-3 border rounded-lg bg-emerald-50"
              value={newProd.green_id}
              onChange={e => setNewProd({...newProd, green_id: e.target.value})}
            >
              <option value="">-- Seleccionar Lote de Oro --</option>
              {lotesVerdes.map(l => (
                <option key={l.id} value={l.id}>{l.name_ref} ({l.quantity_kg}kg)</option>
              ))}
            </select>
          </div>
        )}

        <input className="col-span-2 p-3 border rounded-lg" placeholder="Nombre (Ej: Saco Exportación 10kg)" value={newProd.nombre} onChange={e => setNewProd({...newProd, nombre: e.target.value})} />
        <input className="p-3 border rounded-lg" placeholder="SKU / Código" value={newProd.sku} onChange={e => setNewProd({...newProd, sku: e.target.value})} />
        <input className="p-3 border rounded-lg" type="number" placeholder={tipoProducto==='verde'?"Peso Kilos (Ej: 1 = 1Kg)":"Peso Gramos (Ej: 250)"} value={newProd.peso_gramos} onChange={e => setNewProd({...newProd, peso_gramos: e.target.value})} />
        
        <div className="col-span-2 relative">
          <span className="absolute left-3 top-3 text-stone-400">Bs</span>
          <input className="w-full pl-8 p-3 border rounded-lg" type="number" placeholder="Precio de Venta" value={newProd.precio} onChange={e => setNewProd({...newProd, precio: e.target.value})} />
        </div>
      </div>
      
      <button onClick={handleCrearProducto} className="bg-stone-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-black w-full flex justify-center gap-2">
        <Plus size={18}/> Crear Producto
      </button>
    </div>

    {/* Lista existente... igual que antes */}
  </div>
)}

      </div>
    </div>
  );
}