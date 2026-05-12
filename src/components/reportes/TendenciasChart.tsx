import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface TendenciasChartProps {
    titulo: string;
    datos: any[];
    dataKeyX: string;
    dataKeyY: string;
    labelY?: string;
    tipo?: 'linea' | 'barra';
    loading?: boolean;
}

export function TendenciasChart({
    titulo,
    datos,
    dataKeyX,
    dataKeyY,
    labelY = 'Cantidad',
    tipo = 'linea',
    loading = false
}: TendenciasChartProps) {

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl border border-stone-200">
                <div className="h-8 bg-stone-200 rounded w-64 mb-4 animate-pulse"></div>
                <div className="h-64 bg-stone-100 rounded animate-pulse"></div>
            </div>
        );
    }

    if (datos.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl border border-stone-200">
                <h3 className="font-bold text-lg text-stone-800 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} />
                    {titulo}
                </h3>
                <div className="h-64 flex items-center justify-center text-stone-400">
                    No hay datos suficientes para generar la gráfica
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="font-bold text-lg text-stone-800 mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-emerald-600" />
                {titulo}
            </h3>

            <ResponsiveContainer width="100%" height={300}>
                {tipo === 'linea' ? (
                    <LineChart data={datos}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey={dataKeyX}
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey={dataKeyY}
                            name={labelY}
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: '#10b981', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                ) : (
                    <BarChart data={datos}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey={dataKeyX}
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '12px'
                            }}
                        />
                        <Legend />
                        <Bar
                            dataKey={dataKeyY}
                            name={labelY}
                            fill="#10b981"
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}
