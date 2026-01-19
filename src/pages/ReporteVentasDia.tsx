import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';
import { Calendar, DollarSign, ShoppingCart, TrendingUp, Package, CreditCard, Banknote, ArrowLeft, Download } from 'lucide-react';
import { Button } from '../components/ui';
import { useNavigate } from 'react-router-dom';
import { exportarReporteVentasDiaAPDF } from '../utils/reportesPdfExport';

interface VentaDelDia {
    id: string;
    sale_number: string;
    total_amount: number;
    payment_method: string;
    created_at: string;
    items: {
        product_name: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
    }[];
}

export function ReporteVentasDia() {
    const { orgId } = useAuth();
    const navigate = useNavigate();
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [ventas, setVentas] = useState<VentaDelDia[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (orgId) {
            cargarVentas();
        }
    }, [orgId, fecha]);

    const cargarVentas = async () => {
        setIsLoading(true);
        try {
            const fechaInicio = `${fecha} 00:00:00`;
            const fechaFin = `${fecha} 23:59:59`;

            const { data, error } = await supabase
                .from('sales')
                .select(`
          id,
          sale_number,
          total_amount,
          payment_method,
          created_at,
          sale_items (
            product_name,
            quantity,
            unit_price,
            subtotal
          )
        `)
                .eq('organization_id', orgId)
                .gte('created_at', fechaInicio)
                .lte('created_at', fechaFin)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVentas(data || []);
        } catch (error) {
            console.error('Error cargando ventas:', error);
            toast.error('Error al cargar ventas del día');
        } finally {
            setIsLoading(false);
        }
    };

    // Cálculos de resumen
    const totalVentas = ventas.reduce((sum, v) => sum + v.total_amount, 0);
    const totalTransacciones = ventas.length;
    const ticketPromedio = totalTransacciones > 0 ? totalVentas / totalTransacciones : 0;
    const totalProductos = ventas.reduce((sum, v) =>
        sum + v.items.reduce((s, i) => s + i.quantity, 0), 0
    );

    // Ventas por método de pago
    const ventasPorMetodo = ventas.reduce((acc: any, v) => {
        const metodo = v.payment_method || 'Efectivo';
        acc[metodo] = (acc[metodo] || 0) + v.total_amount;
        return acc;
    }, {});

    const metodosIconos: any = {
        'Efectivo': Banknote,
        'Tarjeta': CreditCard,
        'QR': Package
    };

    const exportarPDF = () => {
        if (ventas.length === 0) {
            toast.error('No hay datos para exportar');
            return;
        }

        try {
            exportarReporteVentasDiaAPDF(
                ventas,
                fecha,
                totalVentas,
                totalTransacciones,
                ticketPromedio,
                totalProductos,
                ventasPorMetodo
            );
            toast.success('Reporte PDF exportado exitosamente');
        } catch (error) {
            console.error('Error exportando PDF:', error);
            toast.error('Error al exportar PDF');
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
                        <ShoppingCart className="text-emerald-600" size={32} />
                        Reporte de Ventas del Día
                    </h1>
                    <p className="text-stone-600 mt-2">Resumen detallado de transacciones diarias</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        icon={Download}
                        variant="primary"
                        onClick={exportarPDF}
                        disabled={ventas.length === 0}
                    >
                        Exportar PDF
                    </Button>
                    <Button
                        icon={ArrowLeft}
                        variant="secondary"
                        onClick={() => navigate('/reportes')}
                    >
                        Volver
                    </Button>
                </div>
            </div>

            {/* Selector de Fecha */}
            <div className="bg-white p-4 rounded-xl shadow border border-stone-200 mb-6">
                <div className="flex items-center gap-4">
                    <Calendar className="text-stone-400" size={20} />
                    <label className="font-bold text-sm text-stone-600">Fecha:</label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        className="px-4 py-2 border-2 border-stone-200 rounded-lg focus:border-emerald-500 outline-none"
                    />
                    <span className="text-sm text-stone-500">
                        {new Date(fecha).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </span>
                </div>
            </div>

            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-6 rounded-xl shadow border border-stone-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <DollarSign className="text-emerald-600" size={24} />
                        </div>
                        <p className="text-xs font-bold text-stone-500 uppercase">Total Ventas</p>
                    </div>
                    <p className="text-3xl font-black text-emerald-600">Bs {totalVentas.toFixed(2)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-stone-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <ShoppingCart className="text-blue-600" size={24} />
                        </div>
                        <p className="text-xs font-bold text-stone-500 uppercase">Transacciones</p>
                    </div>
                    <p className="text-3xl font-black text-blue-600">{totalTransacciones}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-stone-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <TrendingUp className="text-purple-600" size={24} />
                        </div>
                        <p className="text-xs font-bold text-stone-500 uppercase">Ticket Promedio</p>
                    </div>
                    <p className="text-3xl font-black text-purple-600">Bs {ticketPromedio.toFixed(2)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow border border-stone-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Package className="text-amber-600" size={24} />
                        </div>
                        <p className="text-xs font-bold text-stone-500 uppercase">Productos Vendidos</p>
                    </div>
                    <p className="text-3xl font-black text-amber-600">{totalProductos}</p>
                </div>
            </div>

            {/* Ventas por Método de Pago */}
            <div className="bg-white p-6 rounded-xl shadow border border-stone-200 mb-6">
                <h2 className="text-xl font-bold text-stone-800 mb-4">Ventas por Método de Pago</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(ventasPorMetodo).map(([metodo, total]: [string, any]) => {
                        const Icon = metodosIconos[metodo] || DollarSign;
                        return (
                            <div key={metodo} className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg">
                                <Icon className="text-emerald-600" size={24} />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-stone-600">{metodo}</p>
                                    <p className="text-2xl font-black text-stone-800">Bs {total.toFixed(2)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tabla de Transacciones */}
            <div className="bg-white rounded-xl shadow border border-stone-200 overflow-hidden">
                <div className="p-6 border-b border-stone-200">
                    <h2 className="text-xl font-bold text-stone-800">Detalle de Transacciones</h2>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    </div>
                ) : ventas.length === 0 ? (
                    <div className="p-12 text-center text-stone-400">
                        <p>No hay ventas registradas para esta fecha</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-stone-50">
                                <tr>
                                    <th className="text-left p-4 text-xs font-bold text-stone-600 uppercase">Nro. Venta</th>
                                    <th className="text-left p-4 text-xs font-bold text-stone-600 uppercase">Hora</th>
                                    <th className="text-left p-4 text-xs font-bold text-stone-600 uppercase">Productos</th>
                                    <th className="text-left p-4 text-xs font-bold text-stone-600 uppercase">Método de Pago</th>
                                    <th className="text-right p-4 text-xs font-bold text-stone-600 uppercase">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ventas.map((venta) => (
                                    <tr key={venta.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                                        <td className="p-4 font-mono text-sm font-bold text-stone-800">{venta.sale_number}</td>
                                        <td className="p-4 text-sm text-stone-600">
                                            {new Date(venta.created_at).toLocaleTimeString('es-ES', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                {venta.items.map((item, idx) => (
                                                    <div key={idx} className="text-sm">
                                                        <span className="font-semibold text-stone-800">{item.quantity}x</span>{' '}
                                                        <span className="text-stone-600">{item.product_name}</span>{' '}
                                                        <span className="text-stone-400">@ Bs {item.unit_price.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                                                {venta.payment_method || 'Efectivo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-emerald-700 text-lg">
                                            Bs {venta.total_amount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
