import { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Search, Package, Trash2, CheckCircle,
  Tag, Gift, Coffee, Utensils, Box,
  UserPlus, X, Users, Percent,
  Clock, AlertCircle, Plus, Minus
} from 'lucide-react';
import { usePOS, ClientePayload, ClientePOS } from '../hooks/usePOS';
import { AperturaCaja } from './AperturaCaja';
import { PagoMixtoModal } from '../components/PagoMixtoModal';
import { toast } from 'sonner';

const CATEGORIAS = [
  { id: 'all', label: 'Todo', icon: Box },
  { id: 'cafe', label: 'Bebidas Café', icon: Coffee, dbValue: 'Café' },
  { id: 'comida', label: 'Pastelería', icon: Utensils, dbValue: 'Pastelería' },
  { id: 'grano', label: 'Grano / Bolsas', icon: Package, dbValue: 'Grano' },
];

export function Ventas() {
  // 1. Separation of Concerns: Inyectando "Dependencias" a través del Custom Hook.
  const { states, actions } = usePOS();
  
  // Extraemos Variables para fácil uso en UI
  const { 
    loading, cajaAbierta, verificandoCaja, carrito, catalogo, clientes, pendientes, 
    clienteSeleccionado, tipoPedido, totalesTicket, esCortesiaGlobal, descuentoManual, convenioActivo 
  } = states;

  // Modales Visuales & Control Local Exclusivo de la Pestaña
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [mostrarResultadosClientes, setMostrarResultadosClientes] = useState(false);
  const [catFiltro, setCatFiltro] = useState('all');
  const [busquedaProd, setBusquedaProd] = useState('');
  
  const [showModalPago, setShowModalPago] = useState(false); 
  const [showModalCliente, setShowModalCliente] = useState(false);
  const [showPendientes, setShowPendientes] = useState(false);
  
  // Referencias a DOM
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [nuevoCliente, setNuevoCliente] = useState<ClientePayload>({ razon_social: '', nit: '', telefono: '' });

  // Atajos de Auto Focus
  useEffect(() => {
    searchInputRef.current?.focus();
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Performance y Búsqueda Frontend Derivada
  const clientesFiltrados = clientes.filter(c => 
    c.business_name.toLowerCase().includes(busquedaCliente.toLowerCase()) || 
    (c.tax_id && c.tax_id.includes(busquedaCliente))
  );

  const productosVisibles = catalogo.filter(p => {
    if (catFiltro !== 'all') {
      const categoriaActual = CATEGORIAS.find(cat => cat.id === catFiltro);
      if (categoriaActual?.dbValue && p.category !== categoriaActual.dbValue) return false;
    }
    return p.nombre.toLowerCase().includes(busquedaProd.toLowerCase());
  });

  const seleccionarClienteUI = (c: ClientePOS) => { 
      actions.setClienteSeleccionado(c); 
      setBusquedaCliente(c.business_name); 
      setMostrarResultadosClientes(false); 
  };

  const handleFinalizar = async (status: 'completed' | 'pending' = 'completed') => {
    if (carrito.length === 0) return toast.warning("Carrito vacío");
    if (!clienteSeleccionado) return toast.warning("Selecciona cliente");

    if (status === 'completed') {
      setShowModalPago(true);
      return;
    }
    
    // Si Pending - Invocar el back directo a través del Hook.
    await actions.procesarVenta([], 'pending');
  };

  const crearClienteDesdeModal = async () => {
      if (!nuevoCliente.razon_social || !nuevoCliente.nit) return toast.warning("Datos faltantes para crear el cliente.");
      const success = await actions.procesarNuevoCliente(nuevoCliente);
      if (success) {
          setShowModalCliente(false);
          setBusquedaCliente(nuevoCliente.razon_social);
          setNuevoCliente({ razon_social: '', nit: '', telefono: '' });
      }
  };

  const ejecutarCargaPedido = async (id: string) => {
      const exito = await actions.recuperarPedidoPendiente(id);
      if (exito) setShowPendientes(false);
  }

  // ==== RENDERIZADO INICIO ====
  if (verificandoCaja) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-stone-500 font-medium">Verificando turno...</span>
      </div>
    );
  }

  if (cajaAbierta === false) {
    return <AperturaCaja onAperturaCompletada={() => {
      actions.setCajaAbierta(true);
      actions.forzarRecargaGlobal();
    }} />;
  }

  if (cajaAbierta === null) return <div className="h-screen flex items-center justify-center text-stone-400">Verificando caja...</div>;

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden relative">
      {/* PANEL IZQUIERDO: CATÁLOGO */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-stone-200 p-2 flex gap-2 overflow-x-auto">
          {CATEGORIAS.map(cat => (
            <button key={cat.id} onClick={() => setCatFiltro(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${catFiltro === cat.id ? 'bg-stone-800 text-white shadow-md' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
              <cat.icon size={16} /> {cat.label}
            </button>
          ))}
        </div>
        
        <div className="p-4 pb-0">
            <div className="relative">
                <Search className="absolute left-3 top-3 text-stone-400" size={20} />
                <input ref={searchInputRef} className="w-full pl-10 p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Buscar producto (Presiona '/' para enfoque rápido)..." value={busquedaProd} onChange={e => setBusquedaProd(e.target.value)} />
            </div>
        </div>

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
            </div>
          ) : (
            productosVisibles.map(p => (
              <button key={p.id} onClick={() => actions.agregarAlCarrito(p)} className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:border-emerald-500 transition-all text-left h-32 flex flex-col justify-between relative overflow-hidden group">
                {p.promo_activa && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold shadow-sm">Oferta</div>}
                <div>
                    <h4 className="font-bold text-stone-800 leading-tight line-clamp-2 group-hover:text-emerald-700 transition-colors">{p.nombre}</h4>
                    <p className="text-xs text-stone-500 mt-1">{p.detalle}</p>
                </div>
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
          <button onClick={() => actions.setTipoPedido('dine_in')} className={`flex-1 py-2 text-sm font-bold rounded-lg border flex items-center justify-center gap-2 transition-all ${tipoPedido === 'dine_in' ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' : 'border-transparent text-stone-400'}`}>🍽️ Mesa</button>
          <button onClick={() => actions.setTipoPedido('takeaway')} className={`flex-1 py-2 text-sm font-bold rounded-lg border flex items-center justify-center gap-2 transition-all ${tipoPedido === 'takeaway' ? 'bg-white border-amber-500 text-amber-700 shadow-sm' : 'border-transparent text-stone-400'}`}>🥡 Para Llevar</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {carrito.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-stone-300"><ShoppingCart size={48} className="mb-2 opacity-50" /><p>Carrito Vacío</p></div> :
            carrito.map(item => (
              <div key={item.id} className="border-b border-stone-100 pb-3">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex gap-2 items-start">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => actions.modificarItem(item.id, 'incrementar')} className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 w-6 h-6 rounded flex items-center justify-center transition-colors"><Plus size={14} /></button>
                      <button onClick={() => actions.modificarItem(item.id, 'decrementar')} className="bg-stone-100 hover:bg-stone-200 text-stone-600 w-6 h-6 rounded flex items-center justify-center transition-colors"><Minus size={14} /></button>
                    </div>
                    <span className="bg-stone-800 text-white px-2 py-1 rounded text-sm font-bold min-w-[2rem] text-center">{item.cantidad}</span>
                    <div>
                        <p className="text-sm font-bold text-stone-800 leading-tight">{item.nombre}</p>
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
                  <button onClick={() => actions.modificarItem(item.id, 'cortesia')} className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded border transition-colors ${item.es_cortesia ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-stone-200 text-stone-400 hover:bg-stone-50'}`}><Gift size={10} /> Cortesía</button>
                  <button onClick={() => actions.modificarItem(item.id, 'descuento')} className="text-[10px] flex items-center gap-1 px-2 py-1 rounded border border-stone-200 text-stone-400 hover:bg-stone-50"><Tag size={10} /> -10%</button>
                  <button onClick={() => actions.modificarItem(item.id, 'eliminar')} className="ml-auto text-stone-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
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
            <button onClick={() => handleFinalizar('pending')} disabled={loading} className="py-2 border border-amber-200 bg-amber-50 text-amber-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors">
              <AlertCircle size={16} /> Dejar Pendiente
            </button>
          </div>

          <div className="border-t border-stone-200"></div>

          {/* DESCUENTOS Y TOTALES */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-stone-400 uppercase flex items-center gap-1"><Users size={12} /> Descuentos</p>
              {(convenioActivo || descuentoManual > 0 || esCortesiaGlobal) && (
                <button onClick={() => { actions.setConvenioActivo(null); actions.setDescuentoManual(0); actions.setEsCortesiaGlobal(false); }} className="text-[10px] text-red-500 hover:underline">Quitar</button>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => { actions.setEsCortesiaGlobal(!esCortesiaGlobal); actions.setDescuentoManual(0); actions.setConvenioActivo(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded border flex items-center justify-center gap-1 transition-all ${esCortesiaGlobal ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-stone-200 text-stone-400 hover:border-emerald-300'}`}
              >
                <Gift size={12} /> {esCortesiaGlobal ? 'Cortesía' : 'Casa Invita'}
              </button>
              <div className="flex items-center gap-1 bg-white border border-stone-200 rounded px-2 w-20">
                <Percent size={12} className="text-stone-400" />
                <input className="w-full text-xs py-1.5 outline-none font-bold text-stone-700 placeholder-stone-300" placeholder="Manual" type="number"
                  value={descuentoManual || ''}
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (val >= 0 && val <= 100) { actions.setDescuentoManual(val); actions.setConvenioActivo(null); actions.setEsCortesiaGlobal(false); }
                  }}
                />
              </div>
            </div>
          </div>

          {/* BUSCADOR CLIENTE */}
          <div className="flex gap-2 mt-2">
            <div ref={wrapperRef} className="flex-1 relative">
              <div className="relative h-full">
                <Search className="absolute left-2 top-3 text-stone-400" size={14} />
                <input className="w-full h-full pl-7 pr-8 py-2 border border-stone-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 bg-white" placeholder="Cliente..." value={busquedaCliente} onChange={e => { setBusquedaCliente(e.target.value); setMostrarResultadosClientes(true); if (!e.target.value) actions.setClienteSeleccionado(null); }} onFocus={() => setMostrarResultadosClientes(true)} />
                {clienteSeleccionado && <CheckCircle className="absolute right-2 top-3 text-emerald-500" size={14} />}
              </div>
              {mostrarResultadosClientes && busquedaCliente && (
                <div className="absolute bottom-full mb-1 w-full bg-white border border-stone-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 left-0">
                  {clientesFiltrados.map(c => <button key={c.id} onClick={() => seleccionarClienteUI(c)} className="w-full text-left p-2 hover:bg-stone-50 border-b border-stone-100"><p className="font-bold text-xs text-stone-800">{c.business_name}</p><p className="text-[10px] text-stone-500">{c.tax_id}</p></button>)}
                  <button onClick={() => setShowModalCliente(true)} className="w-full p-2 bg-stone-50 text-emerald-600 font-bold text-xs flex items-center justify-center gap-1"><UserPlus size={12} /> Nuevo</button>
                </div>
              )}
            </div>
          </div>

          {/* TOTAL FINAL */}
          <div className="flex justify-between items-center text-xl font-bold text-stone-800 pt-2 border-t border-stone-200">
            <span>Total</span>
            <div className="text-right">
              {totalesTicket.porcentajeGlobal > 0 && <span className="block text-xs text-emerald-600 font-normal">Desc. -{totalesTicket.porcentajeGlobal}%</span>}
              <span>Bs {totalesTicket.totalFinal.toFixed(2)}</span>
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
              <button onClick={crearClienteDesdeModal} disabled={loading} className="w-full bg-stone-900 text-white py-2 rounded-lg font-bold text-sm hover:bg-black mt-2">Guardar</button>
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
                <div key={p.id} className="p-4 border border-stone-200 rounded-xl mb-3 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer transition-all bg-white" onClick={() => ejecutarCargaPedido(p.id)}>
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

      {/* Modal de Pago Mixto */}
      {showModalPago && (
        <PagoMixtoModal
          totalAPagar={totalesTicket.totalFinal}
          onConfirm={(paymentsConfirmed) => {
              actions.procesarVenta(paymentsConfirmed, 'completed');
              setShowModalPago(false);
          }}
          onCancel={() => setShowModalPago(false)}
        />
      )}
    </div>
  );
}