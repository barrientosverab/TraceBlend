import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';
import { format, parse, startOfDay, endOfDay } from 'date-fns';

export interface VentaItem {
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface VentaDelDia {
    id: string;
    sale_number: string;
    total_amount: number;
    payment_method: string;
    created_at: string;
    items: VentaItem[];
}

export interface ResumenMetodosPago {
    [metodo: string]: number;
}

export function useVentasDia(orgId: string | null | undefined) {
    // Solucionado error de huso horario UTC vs Local. Se setea a la fecha actual local estricta.
    const [fecha, setFecha] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
    const [ventas, setVentas] = useState<VentaDelDia[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // useCallback para evitar que la función se recree y cause loops en el useEffect
    const cargarVentas = useCallback(async () => {
        if (!orgId) return;

        setIsLoading(true);
        try {
            // Conversión estricta a ISO UTC respetando el inicio y fin de la fecha LOCAL del usuario
            const fechaParseada = parse(fecha, 'yyyy-MM-dd', new Date());
            const fechaInicioUTC = startOfDay(fechaParseada).toISOString();
            const fechaFinUTC = endOfDay(fechaParseada).toISOString();

            const { data, error } = await supabase
                .from('sales')
                .select(`
                    id,
                    sale_number,
                    total_amount,
                    payment_method,
                    created_at,
                    items:sale_items (
                        product_name,
                        quantity,
                        unit_price,
                        subtotal
                    )
                `)
                .eq('organization_id', orgId)
                .gte('created_at', fechaInicioUTC)
                .lte('created_at', fechaFinUTC)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Tipado rígido para prevenir el Any generalista de PostgreSQL
            type SupabaseSaleData = { id: string, sale_number: string, total_amount: number, payment_method: string, created_at: string, items: VentaItem[] };
            const ventasTipadas: VentaDelDia[] = (data || []).map((v: unknown) => {
                const row = v as SupabaseSaleData;
                return {
                id: row.id,
                sale_number: row.sale_number,
                total_amount: row.total_amount,
                payment_method: row.payment_method,
                created_at: row.created_at,
                // Garantizamos que si hay items vacíos o no fetchea, sea array vacío preventivo
                items: (row.items || []) as VentaItem[]
            };
            });

            setVentas(ventasTipadas);
        } catch (error: unknown) {
            console.error('Error cargando ventas:', error);
            const err = error as Error;
            // Manejo de Error de des-conexion (Edge Case)
            toast.error(err?.message === 'Failed to fetch' 
                ? 'Error de conexión. Revisa tu internet.' 
                : 'Error al cargar ventas del día.');
        } finally {
            setIsLoading(false);
        }
    }, [orgId, fecha]);

    useEffect(() => {
        cargarVentas();
    }, [cargarVentas]);

    // Clean Architecture & Performance: Memorizamos las reducciones para aligerar la UI
    const resumen = useMemo(() => {
        const totalVentas = ventas.reduce((sum, v) => sum + v.total_amount, 0);
        const totalTransacciones = ventas.length;
        // Evitamos división por cero (Edge Case)
        const ticketPromedio = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0;
        
        const totalProductos = ventas.reduce((sum, v) =>
            sum + (v.items).reduce((s, i) => s + (i.quantity || 0), 0), 0
        );

        const ventasPorMetodo = ventas.reduce<ResumenMetodosPago>((acc, v) => {
            // Manejamos nulos o valores rotos en método de pago
            const metodo = v.payment_method || 'Efectivo';
            acc[metodo] = (acc[metodo] || 0) + v.total_amount;
            return acc;
        }, {});

        return {
            totalVentas,
            totalTransacciones,
            ticketPromedio,
            totalProductos,
            ventasPorMetodo
        };
    }, [ventas]);

    return {
        fecha,
        setFecha,
        ventas,
        isLoading,
        recargar: cargarVentas,
        ...resumen
    };
}
