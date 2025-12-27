import React, { useState } from 'react';
import { type LabReportComplete } from '../types/laboratorio';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui';
import { RadarCatacion } from './RadarCatacion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { X, Award, Package, Building2 } from 'lucide-react';

interface ComparadorMuestrasProps {
    reportes: LabReportComplete[];
    reportesSeleccionados: string[];
    onRemove: (reportId: string) => void;
}

export function ComparadorMuestras({ reportes, reportesSeleccionados, onRemove }: ComparadorMuestrasProps) {
    const reportesAComparar = reportes.filter(r => reportesSeleccionados.includes(r.id));

    if (reportesAComparar.length === 0) {
        return (
            <Card>
                <CardContent className="p-12 text-center">
                    <p className="text-stone-500">Selecciona al menos un reporte para comparar</p>
                </CardContent>
            </Card>
        );
    }

    // Preparar datos para gráfico comparativo
    const prepararDatosRadar = () => {
        const atributos = ['Fragancia/Aroma', 'Sabor', 'Residual', 'Acidez', 'Cuerpo', 'Balance', 'General'];

        return atributos.map((attr, idx) => {
            const keys = ['fragrance_aroma', 'flavor', 'aftertaste', 'acidity', 'body', 'balance', 'overall'];
            const data: any = { attribute: attr };

            reportesAComparar.forEach((reporte, reporteIdx) => {
                const key = keys[idx] as keyof LabReportComplete;
                data[`muestra${reporteIdx + 1}`] = reporte[key] || 0;
            });

            return data;
        });
    };

    const chartData = prepararDatosRadar();
    const colores = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

    return (
        <div className="space-y-6">
            {/* Header con reportes seleccionados */}
            <Card>
                <CardHeader>
                    <CardTitle>Comparación de Muestras</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        {reportesAComparar.map((reporte, idx) => (
                            <div
                                key={reporte.id}
                                className="flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-lg"
                                style={{ borderLeft: `4px solid ${colores[idx]}` }}
                            >
                                {reporte.sample_type === 'internal' ? (
                                    <Package size={16} className="text-emerald-600" />
                                ) : (
                                    <Building2 size={16} className="text-blue-600" />
                                )}
                                <div className="flex-1">
                                    <p className="font-bold text-sm">
                                        {reporte.sample_type === 'internal' ? reporte.batch_code : reporte.external_client_name}
                                    </p>
                                    <p className="text-xs text-stone-500">
                                        Score: {reporte.final_score?.toFixed(2) || 'N/A'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onRemove(reporte.id)}
                                    className="text-stone-400 hover:text-red-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Gráfico Comparativo */}
            {reportesAComparar.every(r => r.cupping_id) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Perfil Sensorial Comparativo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={450}>
                            <RadarChart data={chartData}>
                                <PolarGrid stroke="#e7e5e4" />
                                <PolarAngleAxis
                                    dataKey="attribute"
                                    tick={{ fill: '#57534e', fontSize: 12, fontWeight: 600 }}
                                />
                                <PolarRadiusAxis
                                    angle={90}
                                    domain={[6, 10]}
                                    tick={{ fill: '#78716c', fontSize: 10 }}
                                />
                                {reportesAComparar.map((reporte, idx) => (
                                    <Radar
                                        key={reporte.id}
                                        name={reporte.sample_type === 'internal' ? reporte.batch_code : reporte.external_client_name}
                                        dataKey={`muestra${idx + 1}`}
                                        stroke={colores[idx]}
                                        fill={colores[idx]}
                                        fillOpacity={0.2}
                                        strokeWidth={2}
                                    />
                                ))}
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '2px solid #e7e5e4',
                                        borderRadius: '12px'
                                    }}
                                />
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Tabla Comparativa */}
            <Card>
                <CardHeader>
                    <CardTitle>Comparación Detallada</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-stone-200">
                                    <th className="text-left p-3 text-xs font-bold text-stone-500 uppercase">Atributo</th>
                                    {reportesAComparar.map((reporte, idx) => (
                                        <th key={reporte.id} className="text-center p-3 text-xs font-bold uppercase" style={{ color: colores[idx] }}>
                                            {reporte.sample_type === 'internal' ? reporte.batch_code : reporte.external_client_name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Puntuación Final */}
                                <tr className="border-b border-stone-100 bg-stone-50">
                                    <td className="p-3 font-bold flex items-center gap-2">
                                        <Award size={16} className="text-amber-600" />
                                        Puntuación Final
                                    </td>
                                    {reportesAComparar.map(reporte => (
                                        <td key={reporte.id} className="p-3 text-center">
                                            <span className="text-xl font-black text-emerald-600">
                                                {reporte.final_score?.toFixed(2) || '-'}
                                            </span>
                                        </td>
                                    ))}
                                </tr>

                                {/* Atributos SCA */}
                                {reportesAComparar.some(r => r.cupping_id) && (
                                    <>
                                        <tr className="border-b border-stone-100">
                                            <td className="p-3 font-semibold text-stone-700">Fragancia/Aroma</td>
                                            {reportesAComparar.map(reporte => (
                                                <td key={reporte.id} className="p-3 text-center font-bold">
                                                    {reporte.fragrance_aroma || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b border-stone-100">
                                            <td className="p-3 font-semibold text-stone-700">Sabor</td>
                                            {reportesAComparar.map(reporte => (
                                                <td key={reporte.id} className="p-3 text-center font-bold">
                                                    {reporte.flavor || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b border-stone-100">
                                            <td className="p-3 font-semibold text-stone-700">Acidez</td>
                                            {reportesAComparar.map(reporte => (
                                                <td key={reporte.id} className="p-3 text-center font-bold">
                                                    {reporte.acidity || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b border-stone-100">
                                            <td className="p-3 font-semibold text-stone-700">Cuerpo</td>
                                            {reportesAComparar.map(reporte => (
                                                <td key={reporte.id} className="p-3 text-center font-bold">
                                                    {reporte.body || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    </>
                                )}

                                {/* Análisis Físico */}
                                {reportesAComparar.some(r => r.physical_id) && (
                                    <>
                                        <tr className="border-b border-stone-100 bg-stone-50">
                                            <td className="p-3 font-semibold text-stone-700">Humedad (%)</td>
                                            {reportesAComparar.map(reporte => (
                                                <td key={reporte.id} className="p-3 text-center font-bold">
                                                    {reporte.humidity_percentage || '-'}
                                                </td>
                                            ))}
                                        </tr>
                                        <tr className="border-b border-stone-100">
                                            <td className="p-3 font-semibold text-stone-700">Defectos Cat. 1</td>
                                            {reportesAComparar.map(reporte => (
                                                <td key={reporte.id} className="p-3 text-center font-bold text-red-600">
                                                    {reporte.category_1_defects || 0}
                                                </td>
                                            ))}
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Descriptores de Sabor */}
            {reportesAComparar.some(r => r.flavor_descriptors && r.flavor_descriptors.length > 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Descriptores de Sabor</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {reportesAComparar.map((reporte, idx) => (
                                <div key={reporte.id}>
                                    <p className="font-bold text-sm mb-2" style={{ color: colores[idx] }}>
                                        {reporte.sample_type === 'internal' ? reporte.batch_code : reporte.external_client_name}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {reporte.flavor_descriptors?.map((desc, descIdx) => (
                                            <span
                                                key={descIdx}
                                                className="px-3 py-1 rounded-full text-sm font-semibold"
                                                style={{
                                                    backgroundColor: `${colores[idx]}20`,
                                                    color: colores[idx]
                                                }}
                                            >
                                                {desc}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
