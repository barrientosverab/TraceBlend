import { useState, useEffect } from 'react';
import { TrendingUp, Award, Package, DollarSign } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getTopProducts, TopProduct } from '../services/reportesService';

interface TopProductsProps {
    days?: number;
    limit?: number;
}

export function TopProductsRanking({ days = 30, limit = 10 }: TopProductsProps) {
    const { orgId } = useAuth();
    const [products, setProducts] = useState<TopProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orgId) return;

        const fetchData = async () => {
            try {
                const data = await getTopProducts(orgId, limit, days);
                setProducts(data);
            } catch (error) {
                console.error('Error cargando top productos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orgId, limit, days]);

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl border border-stone-200 animate-pulse">
                <div className="h-6 bg-stone-200 rounded w-48 mb-4"></div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-stone-100 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl border border-stone-200">
                <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2">
                    <Award className="text-amber-500" size={20} />
                    Top Productos
                </h3>
                <p className="text-stone-400 text-center py-8">
                    No hay datos de ventas en este período
                </p>
            </div>
        );
    }

    const getMedalColor = (rank: number) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white';
            case 2:
                return 'bg-gradient-to-br from-gray-300 to-gray-400 text-white';
            case 3:
                return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
            default:
                return 'bg-stone-100 text-stone-600';
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl text-stone-800 flex items-center gap-2">
                    <Award className="text-amber-500" size={24} />
                    Top {limit} Productos
                </h3>
                <span className="text-xs text-stone-500 bg-stone-50 px-3 py-1 rounded-full">
                    Últimos {days} días
                </span>
            </div>

            <div className="space-y-3">
                {products.map((product) => (
                    <div
                        key={product.product_id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors"
                    >
                        {/* Ranking Badge */}
                        <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0 ${getMedalColor(
                                product.rank
                            )}`}
                        >
                            {product.rank}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-stone-800 truncate">
                                {product.product_name}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                                    {product.category}
                                </span>
                                <span className="text-xs text-stone-400 flex items-center gap-1">
                                    <Package size={12} />
                                    {product.times_ordered} pedidos
                                </span>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="text-right flex-shrink-0">
                            <p className="font-mono font-bold text-emerald-600 flex items-center gap-1 justify-end">
                                <DollarSign size={14} />
                                {product.revenue.toLocaleString()}
                            </p>
                            <p className="text-xs text-stone-500 flex items-center gap-1 justify-end mt-1">
                                <TrendingUp size={12} />
                                {product.quantity_sold} und
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {products.length >= limit && (
                <p className="text-xs text-center text-stone-400 mt-4">
                    Mostrando top {limit} productos más vendidos
                </p>
            )}
        </div>
    );
}
