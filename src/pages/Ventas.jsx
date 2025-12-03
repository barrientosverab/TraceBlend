import React, { useState, useEffect } from 'react';
import { ShoppingCart, Users, Plus, Trash2, CheckCircle, Search, DollarSign } from 'lucide-react';
import { getClientes, crearCliente, getCatalogoVentas, registrarVenta } from '../services/ventasService';

export function Ventas() {
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'clients'
  
  // Data
  const [clientes, setClientes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Estado POS (Carrito)
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [carrito, setCarrito] = useState([]);
  
  // Estado Clientes
  const [newClient, setNewClient] = useState({ razon_social: '', nit: '', telefono: '' });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => { cargarTodo(); }, []);

  const cargarTodo = async () => {
    try {
      const [c, cat] = await Promise.all([getClientes(), getCatalogoVentas()]);
      setClientes(c);
      setCatalogo(cat);
    } catch (e) { console.error(e); }
  };

  // --- LÓGICA CARRITO ---
  const agregarAlCarrito = (producto) => {
    const cantidad = prompt(`Cantidad a vender (${producto.unidad}):\nStock disponible: ${producto.stock}`);
    if (!cantidad) return;
    
    const cantNum = parseFloat(cantidad);
    if (cantNum > producto.stock) return alert("No hay suficiente stock.");

    setCarrito([...carrito, { ...producto, cantidad: cantNum, precio_venta: precioFinal }]);
  };

  const quitarDelCarrito = (index) => {
    const newCart = [...carrito];
    newCart.splice(index, 1);
    setCarrito(newCart);
  };

  const totalVenta = carrito.reduce((acc, item) => acc + (item.cantidad * item.precio_venta), 0);

  const handleFinalizarVenta = async () => {
    if (!clienteSeleccionado || carrito.length === 0) return alert("Selecciona cliente y productos.");
    if (!confirm(`¿Confirmar venta por Bs ${totalVenta.toFixed(2)}?`)) return;

    setLoading(true);
    try {
      await registrarVenta({
        cliente_id: clienteSeleccionado,
        carrito: carrito,
        total: totalVenta
      });
      alert("✅ Venta registrada exitosamente!");
      setCarrito([]);
      setClienteSeleccionado('');
      cargarTodo(); // Actualizar stocks
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  // --- LÓGICA CLIENTES ---
  const handleCrearCliente = async () => {
    if (!newClient.razon_social) return;
    try {
      await crearCliente(newClient);
      alert("Cliente creado");
      setNewClient({ razon_social: '', nit: '', telefono: '' });
      cargarTodo();
    } catch (e) { alert(e.message); }
  };

  // Filtrado de catálogo
  const catalogoFiltrado = catalogo.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-stone-50 overflow-hidden">
      
      {/* HEADER TABS */}
      <div className="flex bg-white border-b border-stone-200 px-6 py-2 gap-4">
        <button onClick={() => setActiveTab('pos')} className={`px-4 py-2 font-bold rounded-lg flex gap-2 ${activeTab === 'pos' ? 'bg-emerald-100 text-emerald-800' : 'text-stone-500 hover:bg-stone-100'}`}>
          <ShoppingCart size={18}/> Punto de Venta
        </button>
        <button onClick={() => setActiveTab('clients')} className={`px-4 py-2 font-bold rounded-lg flex gap-2 ${activeTab === 'clients' ? 'bg-emerald-100 text-emerald-800' : 'text-stone-500 hover:bg-stone-100'}`}>
          <Users size={18}/> Clientes
        </button>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        
        {/* VISTA POS */}
        {activeTab === 'pos' && (
          <div className="flex h-full gap-6">
            
            {/* IZQUIERDA: CATÁLOGO */}
            <div className="w-2/3 flex flex-col bg-white rounded-2xl shadow border border-stone-200 overflow-hidden">
              <div className="p-4 border-b border-stone-200 flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-stone-400" size={20}/>
                  <input 
                    className="w-full pl-10 p-2 border rounded-lg bg-stone-50 outline-none focus:ring-2 focus:ring-emerald-500" 
                    placeholder="Buscar producto o café..." 
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-4 content-start">
                {catalogoFiltrado.map(prod => (
                  <div 
                    key={`${prod.tipo}-${prod.id}`} 
                    onClick={() => agregarAlCarrito(prod)}
                    className="p-4 rounded-xl border border-stone-200 hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all bg-white group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded ${prod.tipo === 'PRODUCTO' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                        {prod.tipo === 'PRODUCTO' ? 'BOLSA' : 'GRANEL'}
                      </span>
                      <span className="font-mono text-xs text-stone-400 font-bold">{prod.stock} {prod.unidad}</span>
                    </div>
                    <h3 className="font-bold text-stone-800 leading-tight mb-1 group-hover:text-emerald-700">{prod.nombre}</h3>
                    <p className="text-xs text-stone-500">{prod.detalle}</p>
                    <div className="mt-3 font-bold text-lg text-emerald-800">
                      {prod.precio > 0 ? `Bs ${prod.precio}` : 'Precio Variable'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DERECHA: TICKET / CARRITO */}
            <div className="w-1/3 flex flex-col bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
              <div className="p-4 bg-stone-800 text-white">
                <h2 className="font-bold flex items-center gap-2"><ShoppingCart/> Orden de Venta</h2>
              </div>
              
              {/* Selector Cliente */}
              <div className="p-4 border-b border-stone-100 bg-stone-50">
                <select 
                  className="w-full p-2 border rounded bg-white text-sm"
                  value={clienteSeleccionado}
                  onChange={e => setClienteSeleccionado(e.target.value)}
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
                </select>
              </div>

              {/* Lista Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {carrito.length === 0 && <p className="text-center text-stone-400 text-sm mt-10">Carrito vacío</p>}
                {carrito.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-stone-100 pb-2">
                    <div>
                      <p className="font-bold text-stone-700">{item.nombre}</p>
                      <p className="text-xs text-stone-500">{item.cantidad} {item.unidad} x {item.precio_venta}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold">{(item.cantidad * item.precio_venta).toFixed(2)}</span>
                      <button onClick={() => quitarDelCarrito(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total y Botón */}
              <div className="p-6 bg-stone-50 border-t border-stone-200">
                <div className="flex justify-between items-center mb-4 text-xl font-bold text-stone-800">
                  <span>Total</span>
                  <span>Bs {totalVenta.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleFinalizarVenta}
                  disabled={loading || carrito.length === 0}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-bold rounded-xl flex justify-center items-center gap-2"
                >
                  <CheckCircle size={20}/> Finalizar Venta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VISTA CLIENTES */}
        {activeTab === 'clients' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow border border-stone-200">
            <h3 className="font-bold text-lg mb-6">Nuevo Cliente</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input className="col-span-2 p-3 border rounded" placeholder="Razón Social / Nombre" value={newClient.razon_social} onChange={e => setNewClient({...newClient, razon_social: e.target.value})} />
              <input className="p-3 border rounded" placeholder="NIT / CI" value={newClient.nit} onChange={e => setNewClient({...newClient, nit: e.target.value})} />
              <input className="p-3 border rounded" placeholder="Teléfono" value={newClient.telefono} onChange={e => setNewClient({...newClient, telefono: e.target.value})} />
            </div>
            <button onClick={handleCrearCliente} className="w-full py-2 bg-stone-800 text-white rounded font-bold hover:bg-black">Guardar Cliente</button>
            
            <div className="mt-8">
              <h4 className="font-bold text-sm text-stone-500 uppercase mb-3">Directorio</h4>
              <div className="space-y-2">
                {clientes.map(c => (
                  <div key={c.id} className="p-3 border rounded flex justify-between">
                    <span className="font-bold">{c.business_name}</span>
                    <span className="text-stone-500 font-mono text-sm">{c.tax_id || 'S/N'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}