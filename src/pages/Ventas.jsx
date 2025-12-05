import React, { useState, useEffect } from 'react';
import { ShoppingCart, Users, Plus, Trash2, CheckCircle, Search, DollarSign, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth'; 
import { getClientes, crearCliente, getCatalogoVentas, registrarVenta } from '../services/ventasService';

export function Ventas() {
  const { orgId, user } = useAuth(); // Inyección de dependencias
  const [activeTab, setActiveTab] = useState('pos');
  const [loading, setLoading] = useState(false);
  
  // Datos
  const [catalogo, setCatalogo] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carrito, setCarrito] = useState([]);
  
  // Selección
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  
  // Totales
  const [totalVenta, setTotalVenta] = useState(0);
  const [montoPagado, setMontoPagado] = useState('');
  const [cambio, setCambio] = useState(0);

  // Modal Cliente
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ razon_social: '', nit: '', email: '', telefono: '' });

  // 1. Cargar Datos al iniciar (Filtrado por OrgID)
  useEffect(() => {
    if (orgId) cargarTodo();
  }, [orgId]);

  // Recalcular totales cuando cambia el carrito
  useEffect(() => {
    const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    setTotalVenta(total);
  }, [carrito]);

  // Calcular cambio en tiempo real
  useEffect(() => {
    const pagado = parseFloat(montoPagado) || 0;
    setCambio(Math.max(0, pagado - totalVenta));
  }, [montoPagado, totalVenta]);

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [prod, cli] = await Promise.all([getCatalogoVentas(), getClientes()]);
      setCatalogo(prod);
      setClientes(cli);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA CORE DEL CARRITO (Aquí estaba el error) ---
  const handleAgregarProducto = (producto) => {
    // 1. Buscar si ya existe en el carrito
    const existente = carrito.find(item => item.id === producto.id);
    const cantidadActual = existente ? existente.cantidad : 0;

    // 2. Validar Stock Visual (El Backend volverá a validar al guardar)
    if (cantidadActual + 1 > producto.stock) {
      alert(`⚠️ Stock insuficiente. Solo hay ${producto.stock} disponibles.`);
      return;
    }

    // 3. Actualizar Estado
    if (existente) {
      setCarrito(carrito.map(item => 
        item.id === producto.id 
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
    } else {
      // Agregamos propiedades clave: precio_venta (para backend) y precio (visual)
      setCarrito([...carrito, { 
        ...producto, 
        cantidad: 1, 
        precio_venta: producto.precio // Aseguramos compatibilidad con el servicio
      }]);
    }
  };

  const handleQuitarProducto = (id) => {
    const existente = carrito.find(item => item.id === id);
    if (existente.cantidad > 1) {
      setCarrito(carrito.map(item => item.id === id ? { ...item, cantidad: item.cantidad - 1 } : item));
    } else {
      setCarrito(carrito.filter(item => item.id !== id));
    }
  };

  const handleEliminarItem = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  // --- FINALIZAR VENTA (Transacción Atómica) ---
  const handleFinalizarVenta = async () => {
    if (carrito.length === 0) return alert("El carrito está vacío");
    if (!clienteSeleccionado) return alert("Seleccione un cliente");
    if ((parseFloat(montoPagado) || 0) < totalVenta) return alert("El monto pagado es insuficiente");

    try {
      await registrarVenta({
        cliente_id: clienteSeleccionado,
        carrito: carrito, // El servicio transformará esto
        total: totalVenta
      }, orgId, user.id); // <--- ID Críticos

      alert("✅ Venta registrada exitosamente!");
      
      // Reset
      setCarrito([]);
      setMontoPagado('');
      setClienteSeleccionado('');
      cargarTodo(); // Recargar stock actualizado
    } catch (e) {
      alert("❌ Error: " + e.message);
    }
  };

  const handleCrearCliente = async () => {
    if(!newClient.razon_social || !newClient.nit) return alert("Datos incompletos");
    try {
      const creado = await crearCliente(newClient, orgId);
      setClientes([...clientes, creado]);
      setClienteSeleccionado(creado.id);
      setShowNewClient(false);
      setNewClient({ razon_social: '', nit: '', email: '', telefono: '' });
    } catch (e) { alert(e.message); }
  };

  // Filtros visuales
  const productosFiltrados = catalogo.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    p.detalle.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-stone-500">Cargando catálogo...</div>;

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden">
      
      {/* SECCIÓN IZQUIERDA: CATÁLOGO */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Barra de Búsqueda */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-stone-400" size={20}/>
            <input 
              className="w-full pl-10 p-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:border-emerald-500 transition-colors"
              placeholder="Buscar producto o café..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 px-4 rounded-lg border border-emerald-100">
            <Users size={18} className="text-emerald-700"/>
            <select 
              className="bg-transparent text-emerald-800 font-bold outline-none text-sm w-48"
              value={clienteSeleccionado}
              onChange={e => setClienteSeleccionado(e.target.value)}
            >
              <option value="">Cliente Final (Anónimo)</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
            <button onClick={() => setShowNewClient(true)} className="bg-emerald-600 text-white p-1 rounded hover:bg-emerald-700 ml-2">
              <Plus size={16}/>
            </button>
          </div>
        </div>

        {/* Grid de Productos */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start pb-20">
          {productosFiltrados.map(item => (
            <button 
              key={item.id}
              onClick={() => handleAgregarProducto(item)}
              disabled={item.stock <= 0}
              className={`
                flex flex-col items-start p-4 rounded-xl border text-left transition-all relative group
                ${item.stock > 0 
                  ? 'bg-white border-stone-200 hover:border-emerald-500 hover:shadow-md cursor-pointer' 
                  : 'bg-stone-50 border-stone-100 opacity-60 cursor-not-allowed'}
              `}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Package size={20}/>
              </div>
              <h3 className="font-bold text-stone-800 leading-tight">{item.nombre}</h3>
              <p className="text-xs text-stone-500 mt-1">{item.detalle}</p>
              
              <div className="mt-4 flex justify-between items-end w-full">
                <span className="font-bold text-lg text-emerald-700">Bs {item.precio}</span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${item.stock > 10 ? 'bg-stone-100 text-stone-600' : 'bg-red-100 text-red-600'}`}>
                  {item.stock > 1000 ? '+1k' : item.stock} {item.unidad}
                </span>
              </div>
              
              {/* Overlay Stock Agotado */}
              {item.stock <= 0 && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
                  <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform -rotate-12">AGOTADO</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SECCIÓN DERECHA: CARRITO (SIDEBAR) */}
      <div className="w-96 bg-white shadow-2xl border-l border-stone-200 flex flex-col z-20">
        <div className="p-5 border-b border-stone-100 bg-emerald-900 text-white">
          <div className="flex items-center gap-3 mb-1">
            <ShoppingCart className="text-emerald-400"/>
            <h2 className="text-lg font-bold">Orden de Venta</h2>
          </div>
          <p className="text-emerald-200 text-xs">
            {carrito.length} items • {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Lista de Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-300 gap-2">
              <ShoppingCart size={48} strokeWidth={1}/>
              <p>El carrito está vacío</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} className="flex gap-3 items-center bg-stone-50 p-3 rounded-lg border border-stone-100">
                <div className="w-10 h-10 bg-white rounded flex items-center justify-center text-stone-400 border border-stone-100 font-bold text-xs">
                  x{item.cantidad}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-stone-800 leading-tight">{item.nombre}</p>
                  <p className="text-xs text-stone-500">Bs {item.precio} / {item.unidad}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-stone-800">{(item.precio * item.cantidad).toFixed(2)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => handleAgregarProducto(item)} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded"><Plus size={14}/></button>
                  <button onClick={() => handleQuitarProducto(item.id)} className="p-1 text-amber-600 hover:bg-amber-100 rounded"><div className="w-3 h-0.5 bg-current"></div></button>
                </div>
                <button onClick={() => handleEliminarItem(item.id)} className="p-2 text-stone-400 hover:text-red-500 transition-colors">
                  <Trash2 size={16}/>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Resumen Financiero */}
        <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-stone-500 font-medium">Subtotal</span>
            <span className="font-bold text-stone-800 text-xl">Bs {totalVenta.toFixed(2)}</span>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-400 uppercase">Monto Recibido</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-3 text-stone-400"/>
              <input 
                type="number" 
                className="w-full pl-9 p-2 border rounded-lg font-mono font-bold text-stone-800 focus:border-emerald-500 outline-none"
                placeholder="0.00"
                value={montoPagado}
                onChange={e => setMontoPagado(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-stone-200">
            <span className="text-sm font-bold text-stone-600">Cambio</span>
            <span className={`font-mono font-bold text-lg ${cambio < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              Bs {cambio.toFixed(2)}
            </span>
          </div>

          <button 
            onClick={handleFinalizarVenta}
            disabled={carrito.length === 0}
            className={`
              w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all
              ${carrito.length > 0 ? 'bg-stone-900 hover:bg-black hover:scale-[1.02]' : 'bg-stone-300 cursor-not-allowed'}
            `}
          >
            <CheckCircle size={20}/> CONFIRMAR VENTA
          </button>
        </div>
      </div>

      {/* MODAL NUEVO CLIENTE */}
      {showNewClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-stone-800 mb-4">Registrar Cliente</h3>
            <div className="space-y-3">
              <input className="w-full p-2 border rounded" placeholder="Razón Social / Nombre" value={newClient.razon_social} onChange={e=>setNewClient({...newClient, razon_social:e.target.value})}/>
              <input className="w-full p-2 border rounded" placeholder="NIT / CI" value={newClient.nit} onChange={e=>setNewClient({...newClient, nit:e.target.value})}/>
              <input className="w-full p-2 border rounded" placeholder="Email (Opcional)" value={newClient.email} onChange={e=>setNewClient({...newClient, email:e.target.value})}/>
              <input className="w-full p-2 border rounded" placeholder="Teléfono" value={newClient.telefono} onChange={e=>setNewClient({...newClient, telefono:e.target.value})}/>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>setShowNewClient(false)} className="flex-1 py-2 text-stone-500 hover:bg-stone-100 rounded-lg">Cancelar</button>
              <button onClick={handleCrearCliente} className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}