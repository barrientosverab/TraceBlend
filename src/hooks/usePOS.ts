import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

import {
  getClientes, getCatalogoVentas, registrarVenta,
  crearCliente, getPedidosPendientes, getDetallePedidoPendiente,
  marcarPedidoComoCompletado, ItemCarrito
} from '../services/ventasService';
import { verificarEstadoCaja } from '../services/cajaService';
// Promociones removed for MVP
import { Payment } from '../types/payments';

// --------------------------------------------------------------------------
// INTERFACES (Definimos un contrato estricto - Clean Architecture & Lint Skill)
// --------------------------------------------------------------------------
export interface PromoPOS {
  nombre: string;
  es_cortesia: boolean;
  descuento: number;
}

export interface ProductoPOS {
  id: string;
  nombre: string;
  detalle?: string;
  precio: number;
  category: string;
  promo_activa?: PromoPOS;
}

export interface ClientePayload {
  razon_social: string;
  nit: string;
  telefono?: string;
}

export interface ClientePOS {
  id: string;
  business_name: string;
  tax_id: string;
  telefono?: string;
}

export interface ConvenioPOS {
  id: string;
  discount_percent: number;
  product_id: string | null;
  is_active: boolean;
  end_date: string;
}

export interface PedidoPendientePOS {
  id: string;
  client_name: string;
  order_date: string;
  total_amount: number;
}

export interface CartItem extends ProductoPOS {
  cantidad: number;
  precio_final: number;
  es_cortesia: boolean;
  descuento: number;
  nombre_promo?: string | null;
}

export function usePOS() {
  const { orgId, branchId, user } = useAuth();

  // Estados Base
  const [loading, setLoading] = useState(false);
  const [cajaAbierta, setCajaAbierta] = useState<boolean | null>(null);
  const [verificandoCaja, setVerificandoCaja] = useState(true);

  // Datos
  const [catalogo, setCatalogo] = useState<ProductoPOS[]>([]);
  const [clientes, setClientes] = useState<ClientePOS[]>([]);
  const [convenios, setConvenios] = useState<ConvenioPOS[]>([]);
  const [pendientes, setPendientes] = useState<PedidoPendientePOS[]>([]);

  // Carrito de Compras (POS State)
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClientePOS | null>(null);
  const [tipoPedido, setTipoPedido] = useState<'dine_in' | 'takeaway'>('dine_in');
  
  // Descuentos Globales
  const [convenioActivo, setConvenioActivo] = useState<ConvenioPOS | null>(null);
  const [descuentoManual, setDescuentoManual] = useState<number>(0);
  const [esCortesiaGlobal, setEsCortesiaGlobal] = useState(false);

  // Inicialización (Caja y Datos)
  const cargarTodo = useCallback(async () => {
    try {
      if (!orgId) return;
      const [prod, cli, pend] = await Promise.all([
        getCatalogoVentas(orgId),
        getClientes(orgId),
        getPedidosPendientes(orgId)
      ]);
      setCatalogo(prod as ProductoPOS[]);
      setClientes(cli as ClientePOS[]);
      setPendientes((pend || []) as PedidoPendientePOS[]);

      // Edge Case / Logic Validator Fix: 
      // Calculamos el inicio del día local en lugar del UTC mundial. 
      // "format" local soluciona fallos de vigencia de las promos en Bolivia.
      // const hoyLocalFormato = format(new Date(), 'yyyy-MM-dd') + 'T00:00:00.000Z'; 
      const promosVigentes: ConvenioPOS[] = [];
      setConvenios(promosVigentes);
    } catch (e: unknown) {
      console.error(e);
      toast.error('Ocurrió un error al cargar catálogos.');
    }
  }, [orgId]);

  const initSystem = useCallback(async () => {
    if (!orgId || !user) return;
    setVerificandoCaja(true);
    try {
        // Validación de Apertura (Caja Abierta/Cerrada)
      const respuesta = await verificarEstadoCaja(orgId, user.id);
      const estado = respuesta as { status: string };
      const estaAbierta = estado?.status === 'open';
      setCajaAbierta(estaAbierta);

      if (estaAbierta) {
        await cargarTodo();
      }
    } catch (e: unknown) {
      console.error("Error verificando caja:", e);
      setCajaAbierta(false);
    } finally {
      setVerificandoCaja(false);
    }
  }, [orgId, user, cargarTodo]);

  useEffect(() => {
    initSystem();
  }, [initSystem]);

  // Manipulación Local de Carrito (Puro JS - Mapeo Mutativo)
  const agregarAlCarrito = useCallback((producto: ProductoPOS) => {
    setCarrito((carritoActual) => {
        const existente = carritoActual.find(item => item.id === producto.id);
        let precioBase = producto.precio;
        let nombrePromo = null;

        if (producto.promo_activa) {
        if (producto.promo_activa.es_cortesia) precioBase = 0;
        else precioBase = Math.round((producto.precio * (1 - (producto.promo_activa.descuento / 100))) * 100) / 100;
        nombrePromo = producto.promo_activa.nombre;
        }

        if (existente) {
            toast.success(`${producto.nombre}`, { description: `Cantidad: ${existente.cantidad + 1}`, duration: 1500 });
            return carritoActual.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
        } else {
            toast.success('Agregado al carrito', { description: `${producto.nombre} - Bs ${precioBase.toFixed(2)}`, duration: 1500 });
            return [...carritoActual, {
                ...producto,
                cantidad: 1,
                precio_final: precioBase,
                es_cortesia: producto.promo_activa?.es_cortesia || false,
                descuento: producto.promo_activa?.descuento || 0,
                nombre_promo: nombrePromo
            }];
        }
    });
  }, []);

  const modificarItem = useCallback((id: string, accion: 'cortesia' | 'descuento' | 'eliminar' | 'incrementar' | 'decrementar') => {
    setCarrito((carritoActual) => {
        if (accion === 'eliminar') return carritoActual.filter(i => i.id !== id);

        return carritoActual.map(item => {
            if (item.id !== id) return item;
            
            switch(accion) {
                case 'incrementar': 
                    return { ...item, cantidad: item.cantidad + 1 };
                case 'decrementar': {
                    const nuevaCant = item.cantidad - 1;
                    return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : item;
                }
                case 'cortesia': {
                    const nuevoEst = !item.es_cortesia;
                    return { ...item, es_cortesia: nuevoEst, precio_final: nuevoEst ? 0 : item.precio, descuento: 0 };
                }
                case 'descuento': {
                    const nuevoDesc = item.descuento === 10 ? 0 : 10;
                    return { ...item, descuento: nuevoDesc, precio_final: Math.round((item.precio * (1 - nuevoDesc / 100)) * 100) / 100, es_cortesia: false };
                }
                default: return item;
            }
        });
    });
  }, []);

  // Performance (Pilar: Refactor Expert): Memoización del Total Numérico.
  // Evita cálculos innecesarios en la matriz cada vez que se abre un modal de UI.
  const totalesTicket = useMemo(() => {
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio_final * item.cantidad), 0);
    let porcentajeGlobal = 0;

    if (esCortesiaGlobal) porcentajeGlobal = 100;
    else if (descuentoManual > 0) porcentajeGlobal = descuentoManual;
    else if (convenioActivo) porcentajeGlobal = convenioActivo.discount_percent;

    // Fix precisión punto flotante en cálculo de precios
    const totalFinal = Math.round((subtotal * (1 - (porcentajeGlobal / 100))) * 100) / 100;
    
    return { subtotal, totalFinal, porcentajeGlobal };
  }, [carrito, esCortesiaGlobal, descuentoManual, convenioActivo]);

  // Transacciones Financieras / Back-end (Database & Edge Cases)
  const procesarVenta = async (paymentsConfirmed: Payment[], status: 'completed' | 'pending' = 'completed') => {
    if (!orgId || !user) throw new Error("Requiere autenticación");

    setLoading(true);
    try {
      const carritoFinal: ItemCarrito[] = carrito.map(item => {
        let precioRef = item.precio_final;
        let descRef = item.descuento || 0;
        let cortesiaRef = item.es_cortesia;

        if (totalesTicket.porcentajeGlobal > 0) {
          precioRef = Math.round(item.precio_final * (1 - (totalesTicket.porcentajeGlobal / 100)) * 100) / 100;
          descRef = (item.descuento || 0) + totalesTicket.porcentajeGlobal;
          cortesiaRef = esCortesiaGlobal || item.es_cortesia;
        }
        
        return {
            id: item.id,
            tipo: 'PRODUCTO',
            cantidad: item.cantidad,
            precio_venta: item.precio,
            precio_final: precioRef,
            es_cortesia: cortesiaRef,
            descuento: descRef
        };
      });

      // El Guardado en sí a Base de datos
      await registrarVenta({
        customer_id: clienteSeleccionado!.id,
        carrito: carritoFinal,
        total: totalesTicket.totalFinal,
        payments: paymentsConfirmed,
        tipoPedido: tipoPedido
      }, orgId, user.id, branchId || '', status);

      if (status === 'completed') {
        toast.success("Venta cobrada correctamente");
      } else {
        toast.info("Pedido guardado en espera");
        cargarTodo(); // Recargar listado de pendientes
      }

      // Reinicio Seguro / Limpieza Completa al Finalizar
      setCarrito([]);
      setConvenioActivo(null); setDescuentoManual(0); setEsCortesiaGlobal(false);
      setClienteSeleccionado(null);

      return true;
    } catch (e: unknown) {
      toast.error((e as Error).message || "Fallo en la transacción");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const procesarNuevoCliente = async (nuevoCliente: ClientePayload) => {
    setLoading(true);
    try {
        if (!orgId) throw new Error("Requisitos Incompletos");
        const c = await crearCliente(nuevoCliente, orgId) as ClientePOS;
        setClientes([...clientes, c]); 
        setClienteSeleccionado(c);
        toast.success("Cliente creado");
        return true;
    } catch(e: unknown) {
        toast.error((e as Error).message || "Fallo guardando cliente");
        return false;
    } finally {
        setLoading(false);
    }
  };

  const recuperarPedidoPendiente = async (pedidoId: string) => {
    setLoading(true);
    try {
      const { order, items } = await getDetallePedidoPendiente(pedidoId);
      setCarrito(items);
      // Supabase devuelve `clients` como objeto (no como array) en la cláusula .select()
      const clienteData = Array.isArray(order.customers) ? order.customers[0] : order.customers;
      setClienteSeleccionado({
        id: clienteData?.id ?? '',
        business_name: clienteData?.business_name ?? 'Cliente Casual',
        tax_id: clienteData?.tax_id ?? ''
      });
      setTipoPedido(order.order_type);
      await marcarPedidoComoCompletado(pedidoId);
      setPendientes(prev => prev.filter(p => p.id !== pedidoId));
      toast.success("Pedido cargado al carrito lista para su cobro");
      return true;
    } catch (e: unknown) {
      toast.error((e as Error).message || "Error cargando pedido");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    states: { loading, cajaAbierta, verificandoCaja, carrito, catalogo, clientes, convenios, pendientes, clienteSeleccionado, tipoPedido, totalesTicket, esCortesiaGlobal, descuentoManual, convenioActivo },
    actions: { 
        setTipoPedido, agregarAlCarrito, modificarItem, procesarVenta, procesarNuevoCliente, recuperarPedidoPendiente,
        setClienteSeleccionado, setDescuentoManual, setEsCortesiaGlobal, setConvenioActivo, forzarRecargaGlobal: cargarTodo, setCajaAbierta
    }
  };
}
