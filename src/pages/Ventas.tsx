import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Search, Package, Trash2, CheckCircle,
  Tag, Gift, Coffee, Utensils, Box,
  CreditCard, QrCode, Banknote, UserPlus, X, User, Users, Percent,
  Clock, RotateCcw, AlertCircle, Plus, Minus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getClientes, getCatalogoVentas, registrarVenta, crearCliente, getPedidosPendientes, getDetallePedidoPendiente, marcarPedidoComoCompletado } from '../services/ventasService';
import { verificarEstadoCaja } from '../services/cajaService';
import { getPromociones } from '../services/promocionesService';
import { AperturaCaja } from './AperturaCaja'; // <--- Importamos la pantalla de bloqueo
import { toast } from 'sonner';

const CATEGORIAS = [
  { id: 'all', label: 'Todo', icon: Box },
  { id: 'cafe', label: 'Bebidas Café', icon: Coffee, dbValue: 'Café' },
  { id: 'comida', label: 'Pastelería', icon: Utensils, dbValue: 'Pastelería' },
  { id: 'grano', label: 'Grano / Bolsas', icon: Package, dbValue: 'Grano' },
];

export function Ventas() {
  const { orgId, user } = useAuth();
  const [loading, setLoading] = useState(false);

  // --- CONTROL DE CAJA ---
  const [cajaAbierta, setCajaAbierta] = useState<boolean | null>(null); // null = cargando, false = cerrada, true = abierta

  // Datos
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [convenios, setConvenios] = useState<any[]>([]);
  const [pendientes, setPendientes] = useState<any[]>([]); // Pedidos en espera

  // Estado POS
  const [carrito, setCarrito] = useState<any[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);

  // UI
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [mostrarResultadosClientes, setMostrarResultadosClientes] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Configuración Venta
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [tipoPedido, setTipoPedido] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [catFiltro, setCatFiltro] = useState('all');
  const [busquedaProd, setBusquedaProd] = useState('');
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ razon_social: '', nit: '', telefono: '' });
  const [showPendientes, setShowPendientes] = useState(false); // Modal lista pendientes

  // Descuentos Globales
  const [convenioActivo, setConvenioActivo] = useState<any>(null);
  const [descuentoManual, setDescuentoManual] = useState<number>(0);
  const [esCortesiaGlobal, setEsCortesiaGlobal] = useState(false);
  const [verificandoCaja, setVerificandoCaja] = useState(true);

  // 1. AL MONTAR: Verificar estado de caja y cargar datos
  useEffect(() => {
    if (orgId && user) {
      initSystem();
    }
  }, [orgId, user]);

  const initSystem = async () => {
    setVerificandoCaja(true); // Iniciamos verificación
    try {
      // 1. Verificar Caja
      const respuesta = await verificarEstadoCaja(orgId!, user!.id);

      if (respuesta) {
        const estado = respuesta as { status: string };
        const estaAbierta = estado.status === 'open';
        setCajaAbierta(estaAbierta);

        // 2. Si está abierta, cargar productos INMEDIATAMENTE
        if (estaAbierta) {
          await cargarTodo();
        }
      } else {
        setCajaAbierta(false);
      }
    } catch (e) {
      console.error("Error iniciando sistema:", e);
      setCajaAbierta(false); // Por seguridad, si falla, pedimos abrir
    } finally {
      setVerificandoCaja(false); // Terminamos de verificar
    }
  };

  const cargarTodo = async () => {
    try {
      const [prod, cli, promos, pend] = await Promise.all([
        getCatalogoVentas(),
        getClientes(),
        getPromociones(),
        getPedidosPendientes(orgId!)
      ]);
      setCatalogo(prod);
      setClientes(cli);
      setPendientes(pend);

      const hoy = new Date().toISOString();
      setConvenios(promos.filter((p: any) => !p.product_id && p.is_active && p.end_date >= hoy));
    } catch (e) { console.error(e); }
  };

  // Autofocus y atajo de teclado para búsqueda
  useEffect(() => {
    // Focus automático al montar
    searchInputRef.current?.focus();

    // Atajo de teclado: presionar '/' para enfocar búsqueda
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // --- LÓGICA CARRITO ---
  const agregarAlCarrito = (producto: any) => {
    const existente = carrito.find(item => item.id === producto.id);
    let precioBase = producto.precio;
    let nombrePromo = null;

    if (producto.promo_activa) {
      if (producto.promo_activa.es_cortesia) precioBase = 0;
      else precioBase = producto.precio * (1 - (producto.promo_activa.descuento / 100));
      nombrePromo = producto.promo_activa.nombre;
    }

    if (existente) {
      setCarrito(carrito.map(item =>
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
      toast.success(`${producto.nombre}`, {
        description: `Cantidad: ${existente.cantidad + 1}`,
        duration: 1500
      });
    } else {
      setCarrito([...carrito, {
        ...producto,
        cantidad: 1,
        precio_final: precioBase,
        es_cortesia: producto.promo_activa?.es_cortesia || false,
        descuento: producto.promo_activa?.descuento || 0,
        nombre_promo: nombrePromo
      }]);
      toast.success('Agregado al carrito', {
        description: `${producto.nombre} - Bs ${precioBase.toFixed(2)}`,
        duration: 1500
      });
    }
  };

  const modificarItem = (id: string, accion: 'cortesia' | 'descuento' | 'eliminar' | 'incrementar' | 'decrementar') => {
    if (accion === 'eliminar') {
      setCarrito(c => c.filter(i => i.id !== id));
      return;
    }

    if (accion === 'incrementar') {
      setCarrito(carrito.map(item =>
        item.id === id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
      return;
    }

    if (accion === 'decrementar') {
      setCarrito(carrito.map(item => {
        if (item.id === id) {
          const nuevaCantidad = item.cantidad - 1;
          return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item;
        }
        return item;
      }).filter(item => item.cantidad > 0));
      return;
    }

    setCarrito(carrito.map(item => {
      if (item.id === id) {
        if (accion === 'cortesia') {
          const nuevoEstado = !item.es_cortesia;
          return { ...item, es_cortesia: nuevoEstado, precio_final: nuevoEstado ? 0 : item.precio, descuento: 0 };
        }
        if (accion === 'descuento') {
          const nuevoDesc = item.descuento === 10 ? 0 : 10;
          return { ...item, descuento: nuevoDesc, precio_final: item.precio * (1 - nuevoDesc / 100), es_cortesia: false };
        }
      }
      return item;
    }));
  };

  // --- CÁLCULO TOTALES ---
  const calcularTotales = () => {
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio_final * item.cantidad), 0);
    let porcentajeGlobal = 0;

    if (esCortesiaGlobal) porcentajeGlobal = 100;
    else if (descuentoManual > 0) porcentajeGlobal = descuentoManual;
    else if (convenioActivo) porcentajeGlobal = convenioActivo.discount_percent;

    const totalFinal = subtotal * (1 - (porcentajeGlobal / 100));
    return { subtotal, totalFinal, porcentajeGlobal };
  };

  const { totalFinal, porcentajeGlobal } = calcularTotales();

  // --- ACCIONES FINALES ---
  const handleFinalizar = async (status: 'completed' | 'pending' = 'completed') => {
    if (carrito.length === 0) return toast.warning("Carrito vacío");
    if (!clienteSeleccionado) return toast.warning("Selecciona cliente");

    setLoading(true);
    try {
      const carritoFinal = carrito.map(item => {
        if (porcentajeGlobal > 0) {
          const precioConGlobal = item.precio_final * (1 - (porcentajeGlobal / 100));
          return {
            ...item,
            precio_final: precioConGlobal,
            descuento: (item.descuento || 0) + porcentajeGlobal,
            es_cortesia: esCortesiaGlobal || item.es_cortesia
          };
        }
        return item;
      });

      // Enviamos el 'status' al servicio
      await registrarVenta({
        cliente_id: clienteSeleccionado.id,
        carrito: carritoFinal,
        total: totalFinal,
        metodoPago: status === 'pending' ? 'Pendiente' : metodoPago,
        tipoPedido: tipoPedido
      }, orgId!, user!.id, status);

      if (status === 'completed') {
        toast.success("Venta cobrada correctamente");
      } else {
        toast.info("Pedido guardado en espera");
      }

      // Limpieza
      setCarrito([]);
      setConvenioActivo(null); setDescuentoManual(0); setEsCortesiaGlobal(false);
      setMetodoPago('Efectivo'); setClienteSeleccionado(null); setBusquedaCliente('');

      // Si fue pendiente, recargamos la lista
      if (status === 'pending') cargarTodo();

    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  // --- FILTROS ---
  const clientesFiltrados = clientes.filter(c => c.business_name.toLowerCase().includes(busquedaCliente.toLowerCase()) || (c.tax_id && c.tax_id.includes(busquedaCliente)));

  const productosVisibles = catalogo.filter(p => {
    // Filtro de categoría
    if (catFiltro !== 'all') {
      const categoriaActual = CATEGORIAS.find(cat => cat.id === catFiltro);
      if (categoriaActual?.dbValue && p.category !== categoriaActual.dbValue) {
        return false;
      }
    }
    // Filtro de búsqueda
    return p.nombre.toLowerCase().includes(busquedaProd.toLowerCase());
  });

  const seleccionarCliente = (c: any) => { setClienteSeleccionado(c); setBusquedaCliente(c.business_name); setMostrarResultadosClientes(false); };

  const guardarNuevoCliente = async () => {
    if (!nuevoCliente.razon_social || !nuevoCliente.nit) return toast.warning("Datos faltantes");
    setLoading(true);
    try {
      const c = await crearCliente(nuevoCliente, orgId!);
      setClientes([...clientes, c]); seleccionarCliente(c); setShowModalCliente(false); setNuevoCliente({ razon_social: '', nit: '', telefono: '' });
      toast.success("Cliente creado");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  };

  // --- CARGAR PEDIDO PENDIENTE ---
  const cargarPedidoPendiente = async (pedidoId: string) => {
    setLoading(true);
    try {
      const { order, items } = await getDetallePedidoPendiente(pedidoId);

      // Cargar items al carrito
      setCarrito(items);

      // Seleccionar cliente
      const cliente = {
        id: order.clients.id,
        business_name: order.clients.business_name,
        tax_id: order.clients.tax_id
      };
      setClienteSeleccionado(cliente);
      setBusquedaCliente(cliente.business_name);

      // Configurar tipo de pedido
      setTipoPedido(order.order_type);

      // Marcar pedido como completado en la base de datos
      await marcarPedidoComoCompletado(pedidoId);

      // Remover pedido de la lista de pendientes
      setPendientes(pendientes.filter(p => p.id !== pedidoId));

      // Cerrar modal de pendientes
      setShowPendientes(false);

      toast.success("Pedido cargado al carrito");
    } catch (e: any) {
      toast.error(e.message || "Error al cargar pedido");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // RENDERIZADO CONDICIONAL (Aquí ocurre la magia de la Apertura)
  // ----------------------------------------------------

  // 1. Si estamos verificando, mostramos spinner (Evita parpadeo de "Caja Cerrada")
  if (verificandoCaja) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-stone-500 font-medium">Verificando turno...</span>
      </div>
    );
  }

  // 2. Si la caja está cerrada, mostramos Apertura
  if (cajaAbierta === false) {
    return <AperturaCaja onAperturaCompletada={() => {
      setCajaAbierta(true);
      cargarTodo(); // Cargar productos apenas abra
    }} />;
  }

  if (cajaAbierta === null) return <div className="h-screen flex items-center justify-center text-stone-400">Verificando caja...</div>;

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden relative">

      {/* PANEL IZQUIERDO: CATÁLOGO (Igual que antes) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-stone-200 p-2 flex gap-2 overflow-x-auto">
          {CATEGORIAS.map(cat => (
            <button key={cat.id} onClick={() => setCatFiltro(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${catFiltro === cat.id ? 'bg-stone-800 text-white shadow-md' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
              <cat.icon size={16} /> {cat.label}
            </button>
          ))}
        </div>
        <div className="p-4 pb-0"><div className="relative"><Search className="absolute left-3 top-3 text-stone-400" size={20} /><input className="w-full pl-10 p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Buscar producto..." value={busquedaProd} onChange={e => setBusquedaProd(e.target.value)} /></div></div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
          {productosVisibles.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <Package className="w-20 h-20 text-stone-300 mb-4" />
              <p className="text-stone-600 font-bold text-lg">No hay productos disponibles</p>
              <p className="text-sm text-stone-400 mt-2 max-w-sm">
                {busquedaProd ?
                  `No se encontraron productos que coincidan con "${busquedaProd}"` :
                  'Agrega productos al catálogo para empezar a vender'
                }
              </p>
              {catFiltro !== 'all' && (
                <button
                  onClick={() => setCatFiltro('all')}
                  className="mt-4 text-sm text-emerald-600 hover:underline font-bold"
                >
                  Ver todos los productos
                </button>
              )}
            </div>
          ) : (
            productosVisibles.map(p => (
              <button key={p.id} onClick={() => agregarAlCarrito(p)} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-500 transition-all text-left h-32 flex flex-col justify-between relative overflow-hidden group">
                {p.promo_activa && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold shadow-sm">Oferta</div>}
                <div><h4 className="font-bold text-stone-800 leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">{p.nombre}</h4><p className="text-xs text-stone-500 mt-1">{p.detalle}</p></div>
                <div className="flex justify-between items-end">
                  <div>
                    {p.promo_activa ? (
                      <div className="flex flex-col"><span className="text-xs text-stone-400 line-through">Bs {p.precio}</span><span className="font-bold text-blue-600 text-lg">{p.promo_activa.es_cortesia ? 'GRATIS' : `Bs ${(p.precio * (1 - p.promo_activa.descuento / 100)).toFixed(2)}`}</span></div>
                    ) : (<span className="font-bold text-emerald-700 text-lg">Bs {p.precio}</span>)}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-emerald-100 group-hover:text-emerald-600 flex items-center justify-center text-stone-400 transition-colors"><ShoppingCart size={14} /></div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* PANEL DERECHO: TICKET */}
      <div className="w-96 bg-white shadow-2xl z-20 flex flex-col border-l border-stone-200">
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex gap-2">
          <button onClick={() => setTipoPedido('dine_in')} className={`flex-1 py-2 text-sm font-bold rounded-lg border flex items-center justify-center gap-2 transition-all ${tipoPedido === 'dine_in' ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' : 'border-transparent text-stone-400'}`}>🍽️ Mesa</button>
          <button onClick={() => setTipoPedido('takeaway')} className={`flex-1 py-2 text-sm font-bold rounded-lg border flex items-center justify-center gap-2 transition-all ${tipoPedido === 'takeaway' ? 'bg-white border-amber-500 text-amber-700 shadow-sm' : 'border-transparent text-stone-400'}`}>🥡 Para Llevar</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {carrito.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-stone-300"><ShoppingCart size={48} className="mb-2 opacity-50" /><p>Carrito Vacío</p></div> :
            carrito.map(item => (
              <div key={item.id} className="border-b border-stone-100 pb-3">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex gap-2 items-start">
                    {/* Controles de cantidad */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => modificarItem(item.id, 'incrementar')}
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 w-6 h-6 rounded flex items-center justify-center transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() => modificarItem(item.id, 'decrementar')}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-600 w-6 h-6 rounded flex items-center justify-center transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                    </div>
                    <span className="bg-stone-800 text-white px-2 py-1 rounded text-sm font-bold min-w-[2rem] text-center">{item.cantidad}</span>
                    <div><p className="text-sm font-bold text-stone-800 leading-tight">{item.nombre}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.es_cortesia && <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded font-bold">Cortesía</span>}
                        {item.descuento > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded font-bold">-{item.descuento}%</span>}
                        {item.nombre_promo && <span className="text-[10px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100 flex items-center">✨ {item.nombre_promo}</span>}
                      </div>
                    </div>
                  </div>
                  <p className="font-mono font-bold text-stone-700">{(item.precio_final * item.cantidad).toFixed(2)}</p>
                </div>
                <div className="flex gap-2 pl-16">
                  <button onClick={() => modificarItem(item.id, 'cortesia')} className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded border transition-colors ${item.es_cortesia ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-stone-200 text-stone-400 hover:bg-stone-50'}`}><Gift size={10} /> Cortesía</button>
                  <button onClick={() => modificarItem(item.id, 'descuento')} className="text-[10px] flex items-center gap-1 px-2 py-1 rounded border border-stone-200 text-stone-400 hover:bg-stone-50"><Tag size={10} /> -10%</button>
                  <button onClick={() => modificarItem(item.id, 'eliminar')} className="ml-auto text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
        </div>

        {/* ZONA DE PAGO */}
        <div className="p-5 bg-stone-50 border-t border-stone-200 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">

          {/* BOTONES PENDIENTES */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowPendientes(true)} className="py-2 border border-stone-300 rounded-xl text-stone-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-stone-100 transition-colors relative">
              <Clock size={16} /> Recuperar
              {pendientes.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-sm animate-pulse">{pendientes.length}</span>}
            </button>
            <button onClick={() => handleFinalizar('pending')} className="py-2 border border-amber-200 bg-amber-50 text-amber-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors">
              <AlertCircle size={16} /> Dejar Pendiente
            </button>
          </div>

          <div className="border-t border-stone-200"></div>

          {/* DESCUENTOS Y TOTALES */}
          <div className="flex flex-col gap-2">
            {/* ... Descuentos Globales ... */}
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-stone-400 uppercase flex items-center gap-1"><Users size={12} /> Descuentos</p>
              {(convenioActivo || descuentoManual > 0 || esCortesiaGlobal) && (
                <button onClick={() => { setConvenioActivo(null); setDescuentoManual(0); setEsCortesiaGlobal(false); }} className="text-[10px] text-red-500 hover:underline">Quitar</button>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setEsCortesiaGlobal(!esCortesiaGlobal); setDescuentoManual(0); setConvenioActivo(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded border flex items-center justify-center gap-1 transition-all ${esCortesiaGlobal ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-stone-200 text-stone-400 hover:border-emerald-300'}`}>
                <Gift size={12} /> {esCortesiaGlobal ? 'Cortesía' : 'Casa Invita'}
              </button>
              {/* Input Manual */}
              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded px-2 w-20">
                <Percent size={12} className="text-stone-400" />
                <input className="w-full text-xs py-1.5 outline-none font-bold text-stone-700 placeholder-stone-300" placeholder="Manual" type="number"
                  value={descuentoManual || ''}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (val >= 0 && val <= 100) { setDescuentoManual(val); setConvenioActivo(null); setEsCortesiaGlobal(false); }
                  }}
                />
              </div>
            </div>
          </div>

          {/* SELECTOR PAGO Y CLIENTE */}
          <div className="flex gap-2 mt-2">
            <div className="flex-1 bg-white border border-stone-200 rounded-xl flex overflow-hidden">
              {['Efectivo', 'QR', 'Tarjeta'].map(m => (
                <button key={m} onClick={() => setMetodoPago(m)} className={`flex-1 py-2 text-[10px] font-bold uppercase transition-all ${metodoPago === m ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-50'}`}>
                  {m === 'Efectivo' && <Banknote size={14} className="mx-auto mb-0.5" />}
                  {m === 'QR' && <QrCode size={14} className="mx-auto mb-0.5" />}
                  {m === 'Tarjeta' && <CreditCard size={14} className="mx-auto mb-0.5" />}
                  <span className="hidden sm:inline">{m}</span>
                </button>
              ))}
            </div>
            {/* Buscador Cliente */}
            <div ref={wrapperRef} className="flex-1 relative">
              <div className="relative h-full">
                <Search className="absolute left-2 top-3 text-stone-400" size={14} />
                <input className="w-full h-full pl-7 pr-8 py-2 border border-stone-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 bg-white" placeholder="Cliente..." value={busquedaCliente} onChange={e => { setBusquedaCliente(e.target.value); setMostrarResultadosClientes(true); if (!e.target.value) setClienteSeleccionado(null); }} onFocus={() => setMostrarResultadosClientes(true)} />
                {clienteSeleccionado && <CheckCircle className="absolute right-2 top-3 text-emerald-500" size={14} />}
              </div>
              {mostrarResultadosClientes && busquedaCliente && (
                <div className="absolute bottom-full mb-1 w-64 bg-white border border-stone-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 left-0">
                  {clientesFiltrados.map(c => <button key={c.id} onClick={() => seleccionarCliente(c)} className="w-full text-left p-2 hover:bg-stone-50 border-b border-stone-100"><p className="font-bold text-xs text-stone-800">{c.business_name}</p><p className="text-[10px] text-stone-500">{c.tax_id}</p></button>)}
                  <button onClick={() => setShowModalCliente(true)} className="w-full p-2 bg-stone-50 text-emerald-600 font-bold text-xs flex items-center justify-center gap-1"><UserPlus size={12} /> Nuevo</button>
                </div>
              )}
            </div>
          </div>

          {/* TOTAL FINAL */}
          <div className="flex justify-between items-center text-xl font-bold text-stone-800 pt-2 border-t border-stone-200">
            <span>Total</span>
            <div className="text-right">
              {porcentajeGlobal > 0 && <span className="block text-xs text-emerald-600 font-normal">Desc. -{porcentajeGlobal}%</span>}
              <span>Bs {totalFinal.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={() => handleFinalizar('completed')} disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:shadow-none">
            {loading ? 'Procesando...' : <><CheckCircle size={20} /> Cobrar</>}
          </button>
        </div>
      </div>

      {/* MODALES: Cliente y Pendientes */}
      {showModalCliente && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5">
            <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><UserPlus size={18} className="text-emerald-600" /> Cliente Rápido</h3>
            <div className="space-y-3">
              <input className="w-full p-2 border rounded-lg text-sm" placeholder="Nombre" autoFocus value={nuevoCliente.razon_social} onChange={e => setNuevoCliente({ ...nuevoCliente, razon_social: e.target.value })} />
              <input className="w-full p-2 border rounded-lg text-sm" placeholder="NIT/CI" value={nuevoCliente.nit} onChange={e => setNuevoCliente({ ...nuevoCliente, nit: e.target.value })} />
              <button onClick={guardarNuevoCliente} disabled={loading} className="w-full bg-stone-900 text-white py-2 rounded-lg font-bold text-sm hover:bg-black mt-2">Guardar</button>
              <button onClick={() => setShowModalCliente(false)} className="w-full text-stone-400 text-xs hover:underline">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showPendientes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-80 bg-white h-full p-4 overflow-y-auto shadow-2xl animate-in slide-in-from-right">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-stone-800 flex items-center gap-2"><Clock size={18} /> Pendientes</h3>
              <button onClick={() => setShowPendientes(false)}><X size={20} className="text-stone-400" /></button>
            </div>
            {pendientes.length === 0 ? <p className="text-stone-400 text-center text-sm">No hay pedidos en espera</p> :
              pendientes.map(p => (
                <div key={p.id} className="p-4 border border-stone-200 rounded-xl mb-3 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-all bg-white" onClick={() => cargarPedidoPendiente(p.id)}>
                  <div className="flex justify-between mb-1">
                    <p className="font-bold text-stone-800">{p.client_name}</p>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">En Espera</span>
                  </div>
                  <p className="text-xs text-stone-500 mb-2">{new Date(p.order_date).toLocaleTimeString()} - {new Date(p.order_date).toLocaleDateString()}</p>
                  <div className="flex justify-between items-center border-t border-stone-100 pt-2">
                    <span className="text-xs text-stone-400">Total a cobrar</span>
                    <span className="font-bold text-emerald-600">Bs {p.total_amount}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}