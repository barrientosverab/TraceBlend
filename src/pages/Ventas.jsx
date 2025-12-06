import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Users, Plus, QrCode, CreditCard, Banknote, Trash2, CheckCircle, Search, DollarSign, Package, 
  X, Check, UserPlus, Minus, Lock // Iconos adicionales importados
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth'; 
import { getClientes, crearCliente, getCatalogoVentas, registrarVenta } from '../services/ventasService';
import { toast } from 'sonner';
import { obtenerResumenCaja } from '../services/cajaService'; // <--- Importar servicio caja

export function Ventas() {
  const { orgId, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // <--- Hook de navegación
  const [cajaAbierta, setCajaAbierta] = useState(null); // null = verificando, true = abierta, false = cerrada
  
  // --- DATOS ---
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [catalogo, setCatalogo] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [carrito, setCarrito] = useState([]);
  
  // --- SELECCIÓN Y BÚSQUEDA ---
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  
  // Estados para el Buscador de Clientes
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  
  // --- TOTALES ---
  const [totalVenta, setTotalVenta] = useState(0);
  const [montoPagado, setMontoPagado] = useState('');
  const [cambio, setCambio] = useState(0);

  // --- MODAL NUEVO CLIENTE ---
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ razon_social: '', nit: '', email: '', telefono: '' });
  const [creatingClient, setCreatingClient] = useState(false); // Estado para bloquear botón (Double Submit)

  // 1. Cargar Datos Iniciales
  useEffect(() => {
    if (orgId) cargarTodo();
  }, [orgId]);

  // 2. Recalcular Totales
  useEffect(() => {
    const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    setTotalVenta(total);
  }, [carrito]);

  // 3. Calcular Cambio
  useEffect(() => {
    const pagado = parseFloat(montoPagado) || 0;
    setCambio(Math.max(0, pagado - totalVenta));
  }, [montoPagado, totalVenta]);

  useEffect(() => {
    if (metodoPago !== 'Efectivo') {
      setMontoPagado(totalVenta.toFixed(2));
    } else {
      setMontoPagado(''); // Limpiar para que escriban el efectivo recibido
    }
  }, [metodoPago, totalVenta]);

  useEffect(() => {
    if (orgId && user) {
      verificarCaja();
    }
  }, [orgId, user]);

  const verificarCaja = async () => {
    try {
      const data = await obtenerResumenCaja(orgId, user.id);
      // Si el status es 'closed', bloqueamos. Si es 'open', permitimos.
      setCajaAbierta(data.status === 'open');
      if (data.status === 'open') {
        cargarTodo(); // Solo cargamos productos si la caja está abierta
      } else {
        setLoading(false); // Dejamos de cargar para mostrar el bloqueo
      }
    } catch (e) {
      console.error(e);
      toast.error("Error verificando turno");
    }
  };

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [prod, cli] = await Promise.all([getCatalogoVentas(), getClientes()]);
      setCatalogo(prod);
      setClientes(cli);
    } catch (e) {
      console.error(e);
      toast.error("Error cargando datos del POS");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DEL CARRITO ---
  const handleAgregarProducto = (producto) => {
    const existente = carrito.find(item => item.id === producto.id);
    const cantidadActual = existente ? existente.cantidad : 0;

    if (cantidadActual + 1 > producto.stock) {
      toast.warning("Stock insuficiente", {
        description: `Solo quedan ${producto.stock} disponibles.`
      });
      return;
    }

    if (existente) {
      setCarrito(carrito.map(item => 
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCarrito([...carrito, { 
        ...producto, 
        cantidad: 1, 
        precio_venta: producto.precio 
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

  // --- FINALIZAR VENTA ---
  const handleFinalizarVenta = async () => {
    if (carrito.length === 0) return toast.warning("El carrito está vacío");
    if (!clienteSeleccionado) return toast.warning("Seleccione un cliente");
    if ((parseFloat(montoPagado) || 0) < totalVenta) return toast.warning("El monto pagado es insuficiente");

    try {
      await registrarVenta({
        cliente_id: clienteSeleccionado,
        carrito: carrito,
        total: totalVenta,
        metodoPago: metodoPago
      }, orgId, user.id);

      toast.success('Venta registrada', {
        description: `Total procesado: Bs ${totalVenta.toFixed(2)}`,
        duration: 4000,
      });
      
      // Reset POS
      setCarrito([]);
      setMontoPagado('');
      setClienteSeleccionado('');
      cargarTodo(); 
    } catch (e) {
      toast.error('Error al registrar venta', { description: e.message });
    }
  };

  // --- CREAR CLIENTE (Con protección Double Submit) ---
  const handleCrearCliente = async () => {
    if (creatingClient) return; // Bloqueo si ya se está guardando

    if (!newClient.razon_social || !newClient.nit) {
        return toast.warning("Nombre y NIT son obligatorios");
    }

    setCreatingClient(true); // Activar bloqueo
    try {
      const creado = await crearCliente(newClient, orgId);
      
      setClientes([...clientes, creado]);
      setClienteSeleccionado(creado.id);
      
      setShowNewClient(false);
      setNewClient({ razon_social: '', nit: '', email: '', telefono: '' });
      toast.success("Cliente registrado correctamente");
    } catch (e) {
      toast.error("Error al crear cliente", { description: e.message });
    } finally {
      setCreatingClient(false); // Liberar bloqueo
    }
  };

  const productosFiltrados = catalogo.filter(p => 
    p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) || 
    p.detalle.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  if (loading) return <div className="h-screen flex items-center justify-center text-stone-400 animate-pulse">Cargando Punto de Venta...</div>;

  if (cajaAbierta === false) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-stone-100 p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl text-center max-w-md border-t-8 border-amber-500">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-600">
            <Lock size={48} />
          </div>
          <h1 className="text-3xl font-bold text-stone-800 mb-2">Punto de Venta Bloqueado</h1>
          <p className="text-stone-500 mb-8">
            Para realizar ventas, primero debes realizar la <b>Apertura de Caja</b> indicando tu efectivo inicial.
          </p>
          <button 
            onClick={() => navigate('/cierre-caja')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all flex justify-center items-center gap-2"
          >
            IR A APERTURA DE CAJA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden">
      
      {/* --- COLUMNA IZQUIERDA: PRODUCTOS --- */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        
        {/* Barra Superior: Buscador Productos + Selector Cliente Inteligente */}
        <div className="flex gap-4">
          {/* Buscador de Productos */}
          <div className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-stone-200 flex items-center gap-3">
            <Search className="text-stone-400" size={20}/>
            <input 
              className="w-full bg-transparent outline-none text-stone-700 placeholder:text-stone-400"
              placeholder="Buscar producto..."
              value={busquedaProducto}
              onChange={e => setBusquedaProducto(e.target.value)}
            />
          </div>

          {/* Selector de Cliente (Botón Trigger) */}
          <div 
            onClick={() => { setTerminoBusqueda(''); setShowClientSearch(true); }}
            className="flex-1 bg-white p-3 rounded-xl shadow-sm border border-stone-200 flex items-center justify-between cursor-pointer hover:border-emerald-500 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${clienteSeleccionado ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                <Users size={20}/>
              </div>
              <div>
                {clienteSeleccionado ? (
                  <>
                    <p className="font-bold text-stone-800 text-sm leading-tight">
                      {clientes.find(c => c.id === clienteSeleccionado)?.business_name}
                    </p>
                    <p className="text-[10px] text-stone-500 font-mono leading-tight">
                      NIT: {clientes.find(c => c.id === clienteSeleccionado)?.tax_id || 'S/N'}
                    </p>
                  </>
                ) : (
                  <p className="text-stone-400 font-medium text-sm">Seleccionar Cliente...</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Search size={16} className="text-stone-300 group-hover:text-emerald-500"/>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowNewClient(true); }}
                className="bg-emerald-600 text-white p-1.5 rounded-lg hover:bg-emerald-700 shadow-sm"
                title="Nuevo Cliente"
              >
                <Plus size={16}/>
              </button>
            </div>
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
                flex flex-col items-start p-4 rounded-xl border text-left transition-all relative
                ${item.stock > 0 
                  ? 'bg-white border-stone-200 hover:border-emerald-500 hover:shadow-md cursor-pointer' 
                  : 'bg-stone-50 border-stone-100 opacity-60 cursor-not-allowed'}
              `}
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 mb-3">
                <Package size={20}/>
              </div>
              <h3 className="font-bold text-stone-800 leading-tight text-sm">{item.nombre}</h3>
              <p className="text-xs text-stone-500 mt-1">{item.detalle}</p>
              
              <div className="mt-4 flex justify-between items-end w-full">
                <span className="font-bold text-lg text-emerald-700">Bs {item.precio}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.stock > 10 ? 'bg-stone-100 text-stone-600' : 'bg-red-100 text-red-600'}`}>
                  {item.stock > 1000 ? '+1k' : item.stock} {item.unidad}
                </span>
              </div>
              
              {item.stock <= 0 && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm transform -rotate-12">AGOTADO</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* --- COLUMNA DERECHA: CARRITO --- */}
      <div className="w-96 bg-white shadow-2xl border-l border-stone-200 flex flex-col z-20">
        <div className="p-5 border-b border-stone-100 bg-stone-900 text-white">
          <div className="flex items-center gap-3 mb-1">
            <ShoppingCart className="text-emerald-400"/>
            <h2 className="text-lg font-bold">Orden Actual</h2>
          </div>
          <p className="text-stone-400 text-xs">
            {carrito.length} items • {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Lista de Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-stone-50/50">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-300 gap-3">
              <ShoppingCart size={48} strokeWidth={1} className="opacity-50"/>
              <p className="text-sm">El carrito está vacío</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                <div className="w-8 h-8 bg-stone-100 rounded flex items-center justify-center text-stone-500 font-bold text-xs border border-stone-200">
                  {item.cantidad}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-stone-800 leading-tight">{item.nombre}</p>
                  <p className="text-xs text-stone-500">Bs {item.precio}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-stone-800">{(item.precio * item.cantidad).toFixed(2)}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => handleAgregarProducto(item)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Plus size={14}/></button>
                  <button onClick={() => handleQuitarProducto(item.id)} className="p-1 text-amber-600 hover:bg-amber-50 rounded"><Minus size={14}/></button>
                </div>
                <button onClick={() => handleEliminarItem(item.id)} className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                  <Trash2 size={16}/>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Resumen Financiero */}
        <div className="p-6 bg-white border-t border-stone-200 space-y-4 shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center text-sm">
            <span className="text-stone-500">Total a Pagar</span>
            <span className="font-bold text-stone-800 text-2xl">Bs {totalVenta.toFixed(2)}</span>
          </div>
          {/* SELECCIÓN DE MÉTODO DE PAGO */}
<div className="space-y-2 mb-4">
  <label className="text-xs font-bold text-stone-400 uppercase">Método de Pago</label>
  <div className="grid grid-cols-3 gap-2">
    {[
      { id: 'Efectivo', icon: Banknote, label: 'Efectivo' },
      { id: 'QR', icon: QrCode, label: 'QR' },
      { id: 'Tarjeta', icon: CreditCard, label: 'Tarjeta' }
    ].map((m) => (
      <button
        key={m.id}
        onClick={() => setMetodoPago(m.id)}
        className={`
          flex flex-col items-center justify-center p-2 rounded-lg border transition-all
          ${metodoPago === m.id 
            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' 
            : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-50'}
        `}
      >
        <m.icon size={20} className="mb-1"/>
        <span className="text-[10px] font-bold">{m.label}</span>
      </button>
    ))}
  </div>
</div>
          <div className="space-y-2">
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-3 text-stone-400"/>
              <input 
                type="number" 
                className="w-full pl-9 p-3 bg-stone-50 border border-stone-200 rounded-xl font-mono font-bold text-stone-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Monto Recibido"
                value={montoPagado}
                onChange={e => setMontoPagado(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100">
            <span className="text-xs font-bold text-stone-500 uppercase">Cambio</span>
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

      {/* --- MODAL DE BÚSQUEDA INTELIGENTE --- */}
      {showClientSearch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Buscador */}
            <div className="p-4 border-b border-stone-100 flex items-center gap-3 bg-stone-50">
              <Search className="text-stone-400" size={20}/>
              <input 
                autoFocus
                placeholder="Buscar por Nombre, Razón Social o NIT..." 
                className="flex-1 bg-transparent outline-none text-lg font-medium text-stone-700 placeholder:text-stone-400"
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
              />
              <button onClick={() => setShowClientSearch(false)} className="p-1 hover:bg-stone-200 rounded-full transition-colors">
                <X className="text-stone-500" size={20}/>
              </button>
            </div>

            {/* Resultados */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {clientes
                .filter(c => 
                  c.business_name.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
                  (c.tax_id && c.tax_id.includes(terminoBusqueda))
                )
                .map((cliente) => (
                  <div 
                    key={cliente.id}
                    onClick={() => {
                      setClienteSeleccionado(cliente.id);
                      setShowClientSearch(false);
                    }}
                    className={`p-3 rounded-xl cursor-pointer flex justify-between items-center transition-all ${
                      clienteSeleccionado === cliente.id 
                        ? 'bg-emerald-50 border border-emerald-200' 
                        : 'hover:bg-stone-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        clienteSeleccionado === cliente.id ? 'bg-emerald-200 text-emerald-800' : 'bg-stone-100 text-stone-500'
                      }`}>
                        {cliente.business_name.charAt(0)}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${clienteSeleccionado === cliente.id ? 'text-emerald-900' : 'text-stone-700'}`}>
                          {cliente.business_name}
                        </p>
                        <p className="text-xs text-stone-400 font-mono">
                          {cliente.tax_id ? `NIT: ${cliente.tax_id}` : 'Sin NIT'}
                        </p>
                      </div>
                    </div>
                    {clienteSeleccionado === cliente.id && <Check size={18} className="text-emerald-600"/>}
                  </div>
                ))}

              {/* Estado Vacío */}
              {clientes.filter(c => 
                c.business_name.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
                (c.tax_id && c.tax_id.includes(terminoBusqueda))
              ).length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-stone-400 mb-2">No se encontraron clientes</p>
                  <button 
                    onClick={() => {
                      setShowClientSearch(false);
                      setNewClient({ ...newClient, razon_social: terminoBusqueda }); // Prellenar nombre
                      setShowNewClient(true);
                    }}
                    className="text-emerald-600 font-bold hover:underline text-sm"
                  >
                    + Registrar "{terminoBusqueda}" ahora
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL NUEVO CLIENTE --- */}
      {showNewClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <UserPlus className="text-emerald-600"/> Registrar Cliente
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">Razón Social</label>
                <input className="w-full p-2.5 border rounded-lg mt-1 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Nombre completo" value={newClient.razon_social} onChange={e=>setNewClient({...newClient, razon_social:e.target.value})}/>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">NIT / CI</label>
                <input className="w-full p-2.5 border rounded-lg mt-1 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Documento de identidad" value={newClient.nit} onChange={e=>setNewClient({...newClient, nit:e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">Email</label>
                  <input className="w-full p-2.5 border rounded-lg mt-1 outline-none" placeholder="Opcional" value={newClient.email} onChange={e=>setNewClient({...newClient, email:e.target.value})}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase">Teléfono</label>
                  <input className="w-full p-2.5 border rounded-lg mt-1 outline-none" placeholder="Opcional" value={newClient.telefono} onChange={e=>setNewClient({...newClient, telefono:e.target.value})}/>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowNewClient(false)} 
                disabled={creatingClient}
                className="flex-1 py-2.5 text-stone-500 hover:bg-stone-100 rounded-lg font-bold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCrearCliente} 
                disabled={creatingClient}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:bg-stone-400 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {creatingClient ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    Guardando...
                  </>
                ) : (
                  "Guardar Cliente"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}