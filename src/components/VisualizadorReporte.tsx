import React, { useState } from 'react';
import { type LabReportComplete } from '../types/laboratorio';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui';
import { RadarCatacion } from './RadarCatacion';
import { exportarReporteAPDF } from '../utils/pdfExport';
import { Package, Building2, Award, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface VisualizadorReporteProps {
    reporte: LabReportComplete;
}

export function VisualizadorReporte({ reporte }: VisualizadorReporteProps) {
    const [tabActiva, setTabActiva] = useState<'resumen' | 'fisico' | 'cata' | 'radar'>('resumen');

    const tabs = [
        { id: 'resumen', label: 'Resumen' },
        { id: 'fisico', label: 'Análisis Físico', disabled: !reporte.physical_id },
        { id: 'cata', label: 'Catación SCA', disabled: !reporte.cupping_id },
        { id: 'radar', label: 'Perfil Sensorial', disabled: !reporte.cupping_id },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {reporte.sample_type === 'internal' ? (
                                    <><Package className="text-emerald-600" /> Muestra Interna</>
                                ) : (
                                    <><Building2 className="text-blue-600" /> Muestra Externa</>
                                )}
                            </CardTitle>
                            <p className="text-stone-500 text-sm mt-2">
                                {reporte.sample_type === 'internal'
                                    ? `Lote: ${reporte.batch_code} - ${reporte.farm_name}`
                                    : `Cliente: ${reporte.external_client_name} - ID: ${reporte.external_sample_id}`
                                }
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-xs text-stone-500">Fecha Reporte</p>
                                <p className="font-bold">{format(new Date(reporte.report_date), 'dd MMMM yyyy', { locale: es })}</p>
                            </div>
                            <Button
                                icon={FileDown}
                                variant="primary"
                                onClick={() => {
                                    exportarReporteAPDF(reporte);
                                    toast.success('PDF generado correctamente');
                                }}
                            >
                                Exportar PDF
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-stone-200 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => !tab.disabled && setTabActiva(tab.id as any)}
                        disabled={tab.disabled}
                        className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${tabActiva === tab.id
                            ? 'border-b-2 border-emerald-600 text-emerald-600'
                            : tab.disabled
                                ? 'text-stone-300 cursor-not-allowed'
                                : 'text-stone-600 hover:text-emerald-600'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {tabActiva === 'resumen' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardContent className="space-y-4">
                            <h4 className="font-bold text-stone-700">Información General</h4>
                            <div className="space-y-2 text-sm">
                                <div><span className="text-stone-500">Tipo de Análisis:</span> <strong>{reporte.report_type}</strong></div>
                                <div><span className="text-stone-500">Estado:</span> <strong>{reporte.status}</strong></div>
                                <div><span className="text-stone-500">Analista:</span> <strong>{reporte.analyst_name}</strong></div>
                                {reporte.cupping_id && (
                                    <div>
                                        <span className="text-stone-500">Puntuación Final:</span>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Award className="text-emerald-600" size={24} />
                                            <strong className="text-4xl font-black text-emerald-600">{reporte.final_score?.toFixed(2)}</strong>
                                        </div>
                                        <p className="text-xs text-stone-500 mt-1">{reporte.quality_classification}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {reporte.sample_type === 'external' && (
                        <Card>
                            <CardContent className="space-y-4">
                                <h4 className="font-bold text-stone-700">Detalles de la Muestra</h4>
                                <div className="space-y-2 text-sm">
                                    <div><span className="text-stone-500">Origen:</span> <strong>{reporte.external_origin}</strong></div>
                                    <div><span className="text-stone-500">Variedad:</span> <strong>{reporte.external_variety}</strong></div>
                                    <div><span className="text-stone-500">Proceso:</span> <strong>{reporte.external_process}</strong></div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {tabActiva === 'fisico' && reporte.physical_id && (
                <Card>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="font-bold mb-3">Pesos y Rendimiento</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-stone-500">Muestra</p>
                                    <p className="text-lg font-bold">{reporte.sample_weight_grams}g</p>
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500">Oro Verde</p>
                                    <p className="text-lg font-bold">{reporte.green_weight_grams}g</p>
                                </div>
                                {reporte.yield_factor && (
                                    <div className="col-span-2 bg-emerald-50 p-4 rounded-xl">
                                        <p className="text-xs text-emerald-700 mb-1">Factor de Rendimiento</p>
                                        <p className="text-2xl font-black text-emerald-600">{(reporte.yield_factor * 100).toFixed(1)}%</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold mb-3">Humedad y Densidad</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-stone-500">Humedad</p>
                                    <p className="text-lg font-bold">{reporte.humidity_percentage}%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500">Densidad</p>
                                    <p className="text-lg font-bold">{reporte.density_value || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold mb-3">Granulometría</h4>
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-stone-500">Malla 18</p>
                                    <p className="font-bold">{reporte.mesh_18}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500">Malla 16</p>
                                    <p className="font-bold">{reporte.mesh_16}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500">Malla 14</p>
                                    <p className="font-bold">{reporte.mesh_14}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-stone-500">Base</p>
                                    <p className="font-bold">{reporte.base_mesh}%</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold mb-3">Defectos</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-stone-500">Categoría 1</p>
                                    <p className="text-lg font-bold text-red-600">{reporte.category_1_defects}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500">Categoría 2</p>
                                    <p className="text-lg font-bold text-amber-600">{reporte.category_2_defects}</p>
                                </div>
                            </div>
                            {reporte.defects_notes && (
                                <p className="text-sm text-stone-600 mt-2 p-3 bg-stone-50 rounded-lg">{reporte.defects_notes}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {tabActiva === 'cata' && reporte.cupping_id && (
                <Card>
                    <CardContent className="space-y-6">
                        <div className="text-center p-6 bg-emerald-50 rounded-xl">
                            <p className="text-sm text-stone-600 mb-2">Puntuación Final</p>
                            <p className="text-5xl font-black text-emerald-600">{reporte.final_score?.toFixed(2)}</p>
                            <p className="text-sm font-bold text-stone-600 mt-2">{reporte.quality_classification}</p>
                        </div>

                        <div>
                            <h4 className="font-bold mb-3">Atributos Puntuables</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-stone-500">Fragancia/Aroma</p>
                                    <p className="font-bold text-lg">{reporte.fragrance_aroma}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500">Sabor</p>
                                    <p className="font-bold text-lg">{reporte.flavor}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500">Residual</p>
                                    <p className="font-bold text-lg">{reporte.aftertaste}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500">Acidez</p>
                                    <p className="font-bold text-lg">{reporte.acidity}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500">Cuerpo</p>
                                    <p className="font-bold text-lg">{reporte.body}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-stone-500">Balance</p>
                                    <p className="font-bold text-lg">{reporte.balance}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold mb-3">Atributos de Presencia</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-emerald-50 p-4 rounded-xl text-center">
                                    <p className="text-xs text-emerald-700 mb-1">Uniformidad</p>
                                    <p className="text-2xl font-black text-emerald-600">{reporte.uniformity}</p>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl text-center">
                                    <p className="text-xs text-blue-700 mb-1">Taza Limpia</p>
                                    <p className="text-2xl font-black text-blue-600">{reporte.clean_cup}</p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-xl text-center">
                                    <p className="text-xs text-amber-700 mb-1">Dulzor</p>
                                    <p className="text-2xl font-black text-amber-600">{reporte.sweetness}</p>
                                </div>
                            </div>
                        </div>

                        {reporte.flavor_descriptors && reporte.flavor_descriptors.length > 0 && (
                            <div>
                                <h4 className="font-bold mb-3">Descriptores de Sabor</h4>
                                <div className="flex flex-wrap gap-2">
                                    {reporte.flavor_descriptors.map((desc, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-semibold text-sm">
                                            {desc}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {reporte.cupper_notes && (
                            <div>
                                <h4 className="font-bold mb-3">Notas del Catador</h4>
                                <p className="text-stone-700 p-4 bg-stone-50 rounded-lg">{reporte.cupper_notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {tabActiva === 'radar' && reporte.cupping_id && (
                <RadarCatacion
                    data={{
                        fragrance_aroma: reporte.fragrance_aroma || 0,
                        flavor: reporte.flavor || 0,
                        aftertaste: reporte.aftertaste || 0,
                        acidity: reporte.acidity || 0,
                        body: reporte.body || 0,
                        balance: reporte.balance || 0,
                        overall: reporte.overall || 0,
                    }}
                    title="Perfil Sensorial SCA"
                />
            )}
        </div>
    );
}
