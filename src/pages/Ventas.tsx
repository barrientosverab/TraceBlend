import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Users, Search, Package, Trash2, CheckCircle, 
  Tag, Gift, Coffee, Utensils, Box, Percent
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth'; 
import { getClientes, getCatalogoVentas, registrarVenta } from '../services/ventasService';
import { toast } from 'sonner';

// Definimos categorías visuales (puedes traerlas de BD dinámicamente luego)
const CATEGORIAS = [
  { id: 'all', label: 'Todo', icon: Box },
  { id: 'cafe', label: 'Bebidas Café', icon: Coffee },
  { id: 'comida', label: 'Pastelería', icon: Utensils },
  { id: 'grano', label: 'Grano / Bolsas', icon: Package },
];

export function Ventas() {
  const { orgId, user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Datos
  const [catalogo, setCatalogo] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  
  // Estado POS
  const [carrito, setCarrito] = useState<any[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [tipoPedido, setTipoPedido] = useState<'dine_in' | 'takeaway'>('dine_in'); // <--- NUEVO: Global
  
  // Filtros UI
  const [catFiltro, setCatFiltro] = useState('all');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (orgId) cargarTodo();
  }, [orgId]);

  const cargarTodo = async () => {
    setLoading(true);
    try {
      const [prod, cli] = await Promise.all([getCatalogoVentas(), getClientes()]);
      setCatalogo(prod);
      setClientes(cli);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  // --- LOGICA CARRITO ---
  const agregarAlCarrito = (producto: any) => {
    // Verificar si ya existe un item idéntico (misma condición de promo/cortesía)
    // Para simplificar V1, si agregas el mismo, suma cantidad.
    const existente = carrito.find(item => item.id === producto.id);
    
    if (existente) {
      setCarrito(carrito.map(item => 
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCarrito([...carrito, { 
        ...producto, 
        cantidad: 1, 
        precio_final: producto.precio, // Precio base
        es_cortesia: false,
        descuento: 0
      }]);
    }
  };

  const aplicarDescuento = (id: string, porcentaje: number) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        const nuevoPrecio = item.precio * (1 - (porcentaje/100));
        return { ...item, descuento: porcentaje, precio_final: nuevoPrecio, es_cortesia: false };
      }
      return item;
    }));
  };

  const aplicarCortesia = (id: string) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        return { ...item, es_cortesia: !item.es_cortesia, precio_final: !item.es_cortesia ? 0 : item.precio, descuento: 0 };
      }
      return item;
    }));
  };

  // Totales
  const total = carrito.reduce((sum, item) => sum + (item.precio_final * item.cantidad), 0);

  const handleFinalizar = async () => {
    if (carrito.length === 0) return toast.warning("Carrito vacío");
    if (!clienteSeleccionado) return toast.warning("Selecciona cliente");

    setLoading(true);
    try {
      // Mapear carrito al formato que espera el servicio actualizado
      // Aquí deberás actualizar registrarVenta para recibir order_type, discounts, etc.
      await registrarVenta({
        cliente_id: clienteSeleccionado,
        carrito: carrito, // El servicio debe manejar precio_final y es_cortesia
        total: total,
        metodoPago: metodoPago,
        tipoPedido: tipoPedido // <--- Enviamos si es para llevar
      }, orgId!, user!.id);

      toast.success("Venta registrada");
      setCarrito([]);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  // Filtrado
  const productosVisibles = catalogo.filter(p => {
    const matchCat = catFiltro === 'all' || (p.category || 'general').toLowerCase().includes(catFiltro);
    const matchText = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchText;
  });

  return (
    <div className="flex h-screen bg-stone-100 overflow-hidden">
      
      {/* IZQUIERDA: CATÁLOGO */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Barra Categorías */}
        <div className="bg-white border-b border-stone-200 p-2 flex gap-2 overflow-x-auto">
          {CATEGORIAS.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setCatFiltro(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                catFiltro === cat.id 
                  ? 'bg-stone-800 text-white shadow-md' 
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              <cat.icon size={16}/> {cat.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="p-4 pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-stone-400" size={20}/>
            <input 
              className="w-full pl-10 p-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {/* Grid Productos */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 content-start">
          {productosVisibles.map(p => (
            <button 
              key={p.id}
              onClick={() => agregarAlCarrito(p)}
              className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-emerald-500 transition-all text-left flex flex-col justify-between h-32"
            >
              <div>
                <h4 className="font-bold text-stone-800 leading-tight line-clamp-2">{p.nombre}</h4>
                <p className="text-xs text-stone-500 mt-1">{p.detalle}</p>
              </div>
              <div className="flex justify-between items-end">
                <span className="font-bold text-emerald-700 text-lg">Bs {p.precio}</span>
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                  <ShoppingCart size={14}/>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DERECHA: TICKET Y PAGO */}
      <div className="w-96 bg-white shadow-2xl z-20 flex flex-col border-l border-stone-200">
        
        {/* Switch Tipo Pedido */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex gap-2">
          <button 
            onClick={() => setTipoPedido('dine_in')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg border ${tipoPedido==='dine_in' ? 'bg-white border-emerald-500 text-emerald-700 shadow-sm' : 'border-transparent text-stone-400'}`}
          >
            🍽️ Mesa
          </button>
          <button 
            onClick={() => setTipoPedido('takeaway')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg border ${tipoPedido==='takeaway' ? 'bg-white border-amber-500 text-amber-700 shadow-sm' : 'border-transparent text-stone-400'}`}
          >
            🥡 Para Llevar
          </button>
        </div>

        {/* Lista Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {carrito.map(item => (
            <div key={item.id} className="border-b border-stone-100 pb-3">
              <div className="flex justify-between items-start mb-1">
                <div className="flex gap-2">
                  <span className="bg-stone-100 px-2 rounded text-sm font-bold h-fit">{item.cantidad}x</span>
                  <div>
                    <p className="text-sm font-bold text-stone-800 leading-tight">{item.nombre}</p>
                    {item.es_cortesia && <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">Cortesía</span>}
                    {item.descuento > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-1 rounded">-{item.descuento}%</span>}
                  </div>
                </div>
                <p className="font-mono font-bold text-stone-700">{(item.precio_final * item.cantidad).toFixed(2)}</p>
              </div>
              
              {/* Acciones Item */}
              <div className="flex gap-2 pl-8">
                <button onClick={() => aplicarCortesia(item.id)} className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded border ${item.es_cortesia ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-stone-200 text-stone-400'}`}>
                  <Gift size={10}/> Cortesía
                </button>
                <button onClick={() => aplicarDescuento(item.id, 10)} className="text-[10px] flex items-center gap-1 px-2 py-1 rounded border border-stone-200 text-stone-400 hover:bg-stone-50">
                  <Tag size={10}/> -10%
                </button>
                <button onClick={() => setCarrito(c => c.filter(i => i.id !== item.id))} className="ml-auto text-red-400 hover:text-red-600">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total y Botón */}
        <div className="p-6 bg-stone-50 border-t border-stone-200">
          <div className="space-y-3 mb-4">
            <select 
              className="w-full p-3 rounded-xl border border-stone-300 bg-white"
              value={clienteSeleccionado}
              onChange={e => setClienteSeleccionado(e.target.value)}
            >
              <option value="">Seleccionar Cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.business_name}</option>)}
            </select>
            
            <div className="flex justify-between items-center text-xl font-bold text-stone-800">
              <span>Total</span>
              <span>Bs {total.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={handleFinalizar}
            disabled={loading} 
            className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:bg-black transition-all flex justify-center items-center gap-2"
          >
            {loading ? 'Procesando...' : <><CheckCircle size={20}/> Cobrar</>}
          </button>
        </div>

      </div>
    </div>
  );
}