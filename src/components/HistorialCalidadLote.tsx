import React, { useEffect, useState } from 'react';
import { getBatchQualityHistory, type BatchQualityHistory } from '../services/laboratorioService';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar, Award, Droplet, Bug } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistorialCalidadLoteProps {
    batchId: string;
    batchCode?: string;
}

export function HistorialCalidadLote({ batchId, batchCode }: HistorialCalidadLoteProps) {
    const [historial, setHistorial] = useState<BatchQualityHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        cargarHistorial();
    }, [batchId]);

    const cargarHistorial = async () => {
        setIsLoading(true);
        try {
            const data = await getBatchQualityHistory(batchId);
            setHistorial(data);
        } catch (error) {
            console.error('Error cargando historial:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                    <p className="text-sm text-stone-500 mt-4">Cargando historial...</p>
                </CardContent>
            </Card>
        );
    }

    if (historial.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <TrendingUp className="mx-auto text-stone-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-stone-600 mb-2">Sin Historial</h3>
                    <p className="text-sm text-stone-500">
                        Este lote aún no tiene análisis de calidad registrados
                    </p>
                </CardContent>
            </Card>
        );
    }

    // Preparar datos para el gráfico
    const chartData = historial.map(h => ({
        fecha: format(new Date(h.report_date), 'dd/MM', { locale: es }),
        puntuacion: h.final_score || 0,
        humedad: h.humidity_percentage || 0,
    })).reverse(); // Más antiguo primero

    const promedioPuntuacion = historial.reduce((sum, h) => sum + (h.final_score || 0), 0) / historial.length;
    const promedioHumedad = historial.reduce((sum, h) => sum + (h.humidity_percentage || 0), 0) / historial.length;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="text-emerald-600" size={24} />
                        Historial de Calidad
                        {batchCode && <span className="text-stone-500 font-normal text-sm">• {batchCode}</span>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Estadísticas Resumen */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-stone-50 p-4 rounded-xl">
                            <p className="text-xs text-stone-500 mb-1">Total Análisis</p>
                            <p className="text-2xl font-black text-stone-800">{historial.length}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl">
                            <p className="text-xs text-emerald-700 mb-1 flex items-center gap-1">
                                <Award size={12} />
                                Promedio Score
                            </p>
                            <p className="text-2xl font-black text-emerald-600">{promedioPuntuacion.toFixed(1)}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl">
                            <p className="text-xs text-blue-700 mb-1 flex items-center gap-1">
                                <Droplet size={12} />
                                Promedio Humedad
                            </p>
                            <p className="text-2xl font-black text-blue-600">{promedioHumedad.toFixed(1)}%</p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-xl">
                            <p className="text-xs text-amber-700 mb-1">Último Análisis</p>
                            <p className="text-sm font-bold text-amber-800">
                                {format(new Date(historial[0].report_date), 'dd MMM yyyy', { locale: es })}
                            </p>
                        </div>
                    </div>

                    {/* Gráfico de Tendencia */}
                    {chartData.length > 1 && (
                        <div className="mb-6">
                            <h5 className="font-bold text-sm text-stone-700 mb-3">Tendencia de Puntuación</h5>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                                    <XAxis
                                        dataKey="fecha"
                                        tick={{ fill: '#78716c', fontSize: 12 }}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        domain={[70, 90]}
                                        tick={{ fill: '#78716c', fontSize: 12 }}
                                        label={{ value: 'Score SCA', angle: -90, position: 'insideLeft', style: { fill: '#10b981' } }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        domain={[9, 13]}
                                        tick={{ fill: '#78716c', fontSize: 12 }}
                                        label={{ value: 'Humedad %', angle: 90, position: 'insideRight', style: { fill: '#3b82f6' } }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '2px solid #e7e5e4',
                                            borderRadius: '12px'
                                        }}
                                    />
                                    <Legend />
                                    <Line
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="puntuacion"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ fill: '#10b981', r: 5 }}
                                        name="Puntuación SCA"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="humedad"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={{ fill: '#3b82f6', r: 4 }}
                                        name="Humedad %"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Tabla de Historial */}
                    <div>
                        <h5 className="font-bold text-sm text-stone-700 mb-3">Detalle de Análisis</h5>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-stone-200">
                                        <th className="text-left p-3 text-xs font-bold text-stone-500 uppercase">
                                            <Calendar size={12} className="inline mr-1" />
                                            Fecha
                                        </th>
                                        <th className="text-left p-3 text-xs font-bold text-stone-500 uppercase">
                                            <Award size={12} className="inline mr-1" />
                                            Score
                                        </th>
                                        <th className="text-left p-3 text-xs font-bold text-stone-500 uppercase">
                                            <Droplet size={12} className="inline mr-1" />
                                            Humedad
                                        </th>
                                        <th className="text-left p-3 text-xs font-bold text-stone-500 uppercase">
                                            <Bug size={12} className="inline mr-1" />
                                            Defectos
                                        </th>
                                        <th className="text-left p-3 text-xs font-bold text-stone-500 uppercase">Analista</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historial.map((item, idx) => (
                                        <tr key={idx} className="border-b border-stone-100 hover:bg-stone-50">
                                            <td className="p-3 font-medium text-stone-700">
                                                {format(new Date(item.report_date), 'dd MMM yyyy', { locale: es })}
                                            </td>
                                            <td className="p-3">
                                                {item.final_score ? (
                                                    <span className={`font-black ${item.final_score >= 85 ? 'text-emerald-600' :
                                                            item.final_score >= 80 ? 'text-blue-600' :
                                                                'text-amber-600'
                                                        }`}>
                                                        {item.final_score.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-stone-400">-</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {item.humidity_percentage ? (
                                                    <span className="font-semibold">{item.humidity_percentage.toFixed(1)}%</span>
                                                ) : (
                                                    <span className="text-stone-400">-</span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <span className="text-red-600 font-semibold">{item.category_1_defects || 0}</span>
                                                {' / '}
                                                <span className="text-amber-600 font-semibold">{item.category_2_defects || 0}</span>
                                            </td>
                                            <td className="p-3 text-stone-600 text-xs">{item.analyst_name || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
