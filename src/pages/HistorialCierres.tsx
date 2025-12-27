import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getCierresHistorico, getDetalleCierre, CierreHistorico, DetalleCierre } from '../services/cajaService';
import { toast } from 'sonner';
import {
    FileText, Search, Calendar, User, X, TrendingUp,
    AlertCircle, CheckCircle, Banknote, QrCode, CreditCard,
    Clock, DollarSign, Package, ChevronDown
} from 'lucide-react';

export function HistorialCierres() {
    const { orgId } = useAuth();
    const [cierres, setCierres] = useState<CierreHistorico[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDetalle, setShowDetalle] = useState(false);
    const [cierreSeleccionado, setCierreSeleccionado] = useState<DetalleCierre | null>(null);
    const [loadingDetalle, setLoadingDetalle] = useState(false);

    // Filtros
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [cajeroFiltro, setCajeroFiltro] = useState('');

    // Lista de cajeros únicos
    const cajerosUnicos = Array.from(new Set(cierres.map(c => c.user_name)));

    useEffect(() => {
        if (orgId) cargarCierres();
    }, [orgId]);

    const cargarCierres = async () => {
        setLoading(true);
        try {
            const filtros: any = {};
            if (fechaDesde) filtros.fechaDesde = new Date(fechaDesde).toISOString();
            if (fechaHasta) {
                const fecha = new Date(fechaHasta);
                fecha.setHours(23, 59, 59);
                filtros.fechaHasta = fecha.toISOString();
            }
            if (cajeroFiltro) {
                // Buscar el user_id del cajero seleccionado
                const cajero = cierres.find(c => c.user_name === cajeroFiltro);
                if (cajero) filtros.userId = cajero.user_id;
            }

            const data = await getCierresHistorico(orgId!, filtros);
            setCierres(data);
        } catch (e: any) {
            toast.error('Error al cargar cierres', { description: e.message });
        } finally {
            setLoading(false);
        }
    };

    const verDetalle = async (cierreId: string) => {
        setLoadingDetalle(true);
        setShowDetalle(true);
        try {
            const detalle = await getDetalleCierre(cierreId);
            setCierreSeleccionado(detalle);
        } catch (e: any) {
            toast.error('Error al cargar detalle', { description: e.message });
            setShowDetalle(false);
        } finally {
            setLoadingDetalle(false);
        }
    };

    const formatearFecha = (fecha: string) => {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-BO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-6 bg-stone-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-2">
                    <FileText className="text-emerald-600" />
                    Historial de Cierres de Caja
                </h1>
                <p className="text-stone-500 mt-1">
                    Consulta y revisa los movimientos de caja de cada cajero
                </p>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-bold text-stone-600 mb-2 flex items-center gap-1">
                            <Calendar size={12} />
                            Desde
                        </label>
                        <input
                            type="date"
                            className="w-full p-2 border border-stone-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                            value={fechaDesde}
                            onChange={e => setFechaDesde(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-stone-600 mb-2 flex items-center gap-1">
                            <Calendar size={12} />
                            Hasta
                        </label>
                        <input
                            type="date"
                            className="w-full p-2 border border-stone-200 rounded-lg text-sm focus:border-emerald-500 outline-none"
                            value={fechaHasta}
                            onChange={e => setFechaHasta(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-stone-600 mb-2 flex items-center gap-1">
                            <User size={12} />
                            Cajero
                        </label>
                        <div className="relative">
                            <select
                                className="w-full p-2 border border-stone-200 rounded-lg text-sm focus:border-emerald-500 outline-none appearance-none pr-8 bg-white"
                                value={cajeroFiltro}
                                onChange={e => setCajeroFiltro(e.target.value)}
                            >
                                <option value="">Todos</option>
                                {cajerosUnicos.map(cajero => (
                                    <option key={cajero} value={cajero}>{cajero}</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-2 top-3 text-stone-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={cargarCierres}
                            disabled={loading}
                            className="w-full bg-stone-900 text-white py-2 rounded-lg font-bold text-sm hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Buscando...
                                </>
                            ) : (
                                <>
                                    <Search size={16} />
                                    Buscar
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla de Cierres */}
            <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                {cierres.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Package className="w-16 h-16 text-stone-300 mb-4" />
                        <p className="text-stone-500 font-bold text-lg">No hay cierres registrados</p>
                        <p className="text-sm text-stone-400 mt-2">
                            {fechaDesde || fechaHasta || cajeroFiltro
                                ? 'No se encontraron cierres con los filtros seleccionados'
                                : 'Los cierres de caja aparecerán aquí una vez que se registren'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-stone-50 border-b border-stone-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-stone-600 uppercase">Fecha/Hora</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-stone-600 uppercase">Cajero</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-stone-600 uppercase">Apertura</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-stone-600 uppercase">Ventas</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-stone-600 uppercase">Efectivo Esp.</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-stone-600 uppercase">Diferencia</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-stone-600 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {cierres.map((cierre) => {
                                    const totalVentas = cierre.system_cash - cierre.initial_cash;
                                    const cuadrado = Math.abs(cierre.difference) < 0.5;

                                    return (
                                        <tr key={cierre.id} className="hover:bg-stone-50 transition-colors">
                                            <td className="px-4 py-3 text-sm text-stone-700">
                                                <div className="flex items-center gap-2">
                                                    <Clock size={14} className="text-stone-400" />
                                                    {formatearFecha(cierre.closed_at)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-stone-800">
                                                {cierre.user_name}
                                                <span className="text-xs text-stone-400 ml-2">({cierre.sales_count} ventas)</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-mono text-stone-700">
                                                Bs {cierre.initial_cash.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-mono text-emerald-600 font-bold">
                                                Bs {totalVentas.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-mono text-stone-700">
                                                Bs {cierre.system_cash.toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${cuadrado
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {cuadrado ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                                    {cierre.difference > 0 ? '+' : ''}{cierre.difference.toFixed(2)} Bs
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => verDetalle(cierre.id)}
                                                    className="text-blue-600 hover:text-blue-800 font-bold text-xs hover:underline"
                                                >
                                                    Ver Detalle
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Detalle */}
            {showDetalle && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Header del Modal */}
                        <div className="sticky top-0 bg-white border-b border-stone-200 p-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-stone-800">Detalle de Cierre</h2>
                                {cierreSeleccionado && (
                                    <p className="text-sm text-stone-500 mt-1">
                                        {cierreSeleccionado.cierre.user_name} - {formatearFecha(cierreSeleccionado.cierre.closed_at)}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setShowDetalle(false)}
                                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-stone-400" />
                            </button>
                        </div>

                        {loadingDetalle ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            </div>
                        ) : cierreSeleccionado && (
                            <div className="p-6 space-y-6">
                                {/* Sección Apertura */}
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                                        <TrendingUp size={18} />
                                        Apertura de Caja
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-blue-600 mb-1">Monto Inicial</p>
                                            <p className="text-2xl font-bold font-mono text-blue-900">
                                                Bs {cierreSeleccionado.cierre.initial_cash.toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-600 mb-1">Hora de Apertura</p>
                                            <p className="text-sm font-medium text-blue-900">
                                                {formatearFecha(cierreSeleccionado.cierre.opened_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sección Ventas */}
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                                        <DollarSign size={18} />
                                        Ventas del Turno
                                    </h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white p-3 rounded-lg border border-emerald-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Banknote size={16} className="text-emerald-600" />
                                                <p className="text-xs text-emerald-700 font-bold">Efectivo</p>
                                            </div>
                                            <p className="text-lg font-bold font-mono text-emerald-900">
                                                Bs {cierreSeleccionado.ventas.efectivo.total.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-emerald-600">
                                                {cierreSeleccionado.ventas.efectivo.count} transacciones
                                            </p>
                                        </div>

                                        <div className="bg-white p-3 rounded-lg border border-emerald-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <QrCode size={16} className="text-emerald-600" />
                                                <p className="text-xs text-emerald-700 font-bold">QR</p>
                                            </div>
                                            <p className="text-lg font-bold font-mono text-emerald-900">
                                                Bs {cierreSeleccionado.ventas.qr.total.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-emerald-600">
                                                {cierreSeleccionado.ventas.qr.count} transacciones
                                            </p>
                                        </div>

                                        <div className="bg-white p-3 rounded-lg border border-emerald-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CreditCard size={16} className="text-emerald-600" />
                                                <p className="text-xs text-emerald-700 font-bold">Tarjeta</p>
                                            </div>
                                            <p className="text-lg font-bold font-mono text-emerald-900">
                                                Bs {cierreSeleccionado.ventas.tarjeta.total.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-emerald-600">
                                                {cierreSeleccionado.ventas.tarjeta.count} transacciones
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t border-emerald-200">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-bold text-emerald-800">Total Ventas</p>
                                            <p className="text-xl font-bold font-mono text-emerald-900">
                                                Bs {(
                                                    cierreSeleccionado.ventas.efectivo.total +
                                                    cierreSeleccionado.ventas.qr.total +
                                                    cierreSeleccionado.ventas.tarjeta.total
                                                ).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Sección Cierre */}
                                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                                    <h3 className="font-bold text-stone-800 mb-3 flex items-center gap-2">
                                        <FileText size={18} />
                                        Cierre de Caja
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-stone-600">Efectivo Esperado</p>
                                            <p className="font-mono font-bold text-stone-800">
                                                Bs {cierreSeleccionado.cierre.system_cash.toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <p className="text-sm text-stone-600">Efectivo Declarado</p>
                                            <p className="font-mono font-bold text-stone-800">
                                                Bs {cierreSeleccionado.cierre.declared_cash.toFixed(2)}
                                            </p>
                                        </div>

                                        {cierreSeleccionado.cierre.cash_withdrawals > 0 && (
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm text-stone-600">Gastos/Retiros</p>
                                                <p className="font-mono font-bold text-red-600">
                                                    - Bs {cierreSeleccionado.cierre.cash_withdrawals.toFixed(2)}
                                                </p>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t border-stone-200">
                                            <div className={`flex justify-between items-center p-3 rounded-lg ${Math.abs(cierreSeleccionado.cierre.difference) < 0.5
                                                ? 'bg-emerald-100'
                                                : 'bg-red-100'
                                                }`}>
                                                <p className="font-bold text-sm flex items-center gap-2">
                                                    {Math.abs(cierreSeleccionado.cierre.difference) < 0.5 ? (
                                                        <CheckCircle size={18} className="text-emerald-700" />
                                                    ) : (
                                                        <AlertCircle size={18} className="text-red-700" />
                                                    )}
                                                    <span className={Math.abs(cierreSeleccionado.cierre.difference) < 0.5 ? 'text-emerald-800' : 'text-red-800'}>
                                                        Diferencial
                                                    </span>
                                                </p>
                                                <p className={`text-xl font-bold font-mono ${Math.abs(cierreSeleccionado.cierre.difference) < 0.5
                                                    ? 'text-emerald-700'
                                                    : 'text-red-700'
                                                    }`}>
                                                    {cierreSeleccionado.cierre.difference > 0 ? '+' : ''}
                                                    {cierreSeleccionado.cierre.difference.toFixed(2)} Bs
                                                </p>
                                            </div>
                                        </div>

                                        {cierreSeleccionado.cierre.notes && (
                                            <div className="pt-3 border-t border-stone-200">
                                                <p className="text-xs font-bold text-stone-600 mb-2">Notas del Cajero</p>
                                                <p className="text-sm text-stone-700 bg-white p-3 rounded-lg border border-stone-200">
                                                    {cierreSeleccionado.cierre.notes}
                                                </p>
                                            </div>
                                        )}

                                        <div className="text-xs text-stone-500 text-right pt-2">
                                            Cerrado: {formatearFecha(cierreSeleccionado.cierre.closed_at)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
