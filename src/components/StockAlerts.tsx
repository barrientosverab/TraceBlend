import React, { useState, useEffect } from 'react';
import { AlertTriangle, Package, ShoppingBag } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';

interface StockAlert {
    type: 'insumo' | 'producto';
    id: string;
    name: string;
    current_stock: number;
    min_stock: number;
    unit_measure: string;
    deficit: number;
    severity: 'critical' | 'high' | 'medium';
}

export function StockAlerts() {
    const { orgId } = useAuth();
    const [alerts, setAlerts] = useState<StockAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;

        const fetchAlerts = async () => {
            try {
                const { data, error } = await supabase
                    .from('v_stock_alerts')
                    .select('*')
                    .eq('organization_id', orgId)
                    .limit(10); // Mostrar solo las 10 más críticas

                if (error) throw error;
                setAlerts(data || []);
            } catch (e) {
                console.error('Error cargando alertas:', e);
            } finally {
                setLoading(false);
            }
        };

        fetchAlerts();

        // Actualizar cada 30 segundos
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, [orgId]);

    if (loading) {
        return (
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl animate-pulse">
                <div className="h-6 bg-stone-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-stone-200 rounded w-full"></div>
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h3 className="font-bold text-emerald-900 flex items-center gap-2">
                    <Package size={18} />
                    Inventario en Orden
                </h3>
                <p className="text-sm text-emerald-700 mt-1">
                    Todos los productos e insumos tienen stock suficiente
                </p>
            </div>
        );
    }

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-50 border-red-300 text-red-900';
            case 'high':
                return 'bg-orange-50 border-orange-300 text-orange-900';
            default:
                return 'bg-amber-50 border-amber-300 text-amber-900';
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-700';
            case 'high':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-amber-100 text-amber-700';
        }
    };

    return (
        <div className={`p-4 border rounded-xl ${getSeverityStyles(alerts[0]?.severity)}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2">
                    <AlertTriangle size={18} />
                    Stock Bajo ({alerts.length})
                </h3>
                {alerts.some(a => a.severity === 'critical') && (
                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full font-bold animate-pulse">
                        ¡URGENTE!
                    </span>
                )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className="flex items-center justify-between p-2 bg-white bg-opacity-60 rounded-lg border border-stone-200"
                    >
                        <div className="flex items-center gap-2 flex-1">
                            {alert.type === 'insumo' ? (
                                <Package size={16} className="text-stone-500 flex-shrink-0" />
                            ) : (
                                <ShoppingBag size={16} className="text-stone-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{alert.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${getSeverityBadge(alert.severity)}`}>
                                        {alert.type === 'insumo' ? 'Insumo' : 'Producto'}
                                    </span>
                                    <span className="text-xs text-stone-600">
                                        Stock: {alert.current_stock} {alert.unit_measure}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                            <p className="text-xs text-stone-500">Mínimo</p>
                            <p className="font-bold text-sm">{alert.min_stock}</p>
                        </div>
                    </div>
                ))}
            </div>

            {alerts.length > 0 && (
                <p className="text-xs mt-2 text-center opacity-70">
                    Actualizado automáticamente cada 30 segundos
                </p>
            )}
        </div>
    );
}
