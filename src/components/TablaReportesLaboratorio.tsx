import { type LabReportComplete } from '../types/laboratorio';
import { Eye, FileText, Building2, Package, Calendar, Award, CheckCircle2, Clock, FileCheck, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TablaReportesLaboratorioProps {
    reportes: LabReportComplete[];
    onViewReport: (reportId: string) => void;
    onDeleteReport?: (reportId: string) => void;
    isLoading?: boolean;
}

export function TablaReportesLaboratorio({
    reportes,
    onViewReport,
    onDeleteReport,
    isLoading = false
}: TablaReportesLaboratorioProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (reportes.length === 0) {
        return (
            <div className="text-center p-12 bg-stone-50 rounded-2xl">
                <FileText className="mx-auto text-stone-300 mb-4" size={48} />
                <h3 className="text-lg font-bold text-stone-600 mb-2">No hay reportes</h3>
                <p className="text-sm text-stone-500">Comienza creando un nuevo reporte de laboratorio</p>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        const badges = {
            draft: { icon: Clock, text: 'Borrador', bg: 'bg-stone-100', textColor: 'text-stone-700' },
            completed: { icon: FileCheck, text: 'Completado', bg: 'bg-blue-100', textColor: 'text-blue-700' },
            approved: { icon: CheckCircle2, text: 'Aprobado', bg: 'bg-emerald-100', textColor: 'text-emerald-700' }
        };
        const badge = badges[status as keyof typeof badges] || badges.draft;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.textColor}`}>
                <Icon size={12} />
                {badge.text}
            </span>
        );
    };

    const getScoreBadge = (score: number | null | undefined) => {
        if (!score) return null;

        const getColor = () => {
            if (score >= 90) return 'bg-purple-100 text-purple-700';
            if (score >= 85) return 'bg-blue-100 text-blue-700';
            if (score >= 80) return 'bg-emerald-100 text-emerald-700';
            if (score >= 70) return 'bg-amber-100 text-amber-700';
            return 'bg-stone-100 text-stone-700';
        };

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-black font-mono ${getColor()}`}>
                <Award size={14} />
                {score.toFixed(2)}
            </span>
        );
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b-2 border-stone-200">
                        <th className="text-left p-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Tipo</th>
                        <th className="text-left p-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Muestra</th>
                        <th className="text-left p-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Fecha</th>
                        <th className="text-left p-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Análisis</th>
                        <th className="text-left p-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Score</th>
                        <th className="text-left p-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Estado</th>
                        <th className="text-right p-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {reportes.map((reporte) => (
                        <tr
                            key={reporte.id}
                            className="border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer"
                            onClick={() => onViewReport(reporte.id)}
                        >
                            <td className="p-4">
                                {reporte.sample_type === 'internal' ? (
                                    <div className="flex items-center gap-2">
                                        <Package size={16} className="text-emerald-600" />
                                        <span className="text-xs font-semibold text-emerald-700">Interna</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Building2 size={16} className="text-blue-600" />
                                        <span className="text-xs font-semibold text-blue-700">Externa</span>
                                    </div>
                                )}
                            </td>

                            <td className="p-4">
                                <div>
                                    <p className="font-bold text-sm text-stone-800">
                                        {reporte.sample_type === 'internal'
                                            ? reporte.batch_code || 'Lote sin código'
                                            : reporte.external_client_name
                                        }
                                    </p>
                                    <p className="text-xs text-stone-500">
                                        {reporte.sample_type === 'internal'
                                            ? reporte.farm_name || 'Finca desconocida'
                                            : `ID: ${reporte.external_sample_id}`
                                        }
                                    </p>
                                </div>
                            </td>

                            <td className="p-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-stone-400" />
                                    <span className="text-sm text-stone-700">
                                        {format(new Date(reporte.report_date), 'dd MMM yyyy', { locale: es })}
                                    </span>
                                </div>
                                {reporte.analyst_name && (
                                    <p className="text-xs text-stone-500 mt-1">
                                        {reporte.analyst_name}
                                    </p>
                                )}
                            </td>

                            <td className="p-4">
                                <div className="flex gap-1">
                                    {reporte.physical_id && (
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                            Físico
                                        </span>
                                    )}
                                    {reporte.cupping_id && (
                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold">
                                            Catación
                                        </span>
                                    )}
                                </div>
                            </td>

                            <td className="p-4">
                                {getScoreBadge(reporte.final_score)}
                            </td>

                            <td className="p-4">
                                {getStatusBadge(reporte.status)}
                            </td>

                            <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewReport(reporte.id);
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold text-sm"
                                    >
                                        <Eye size={16} />
                                        Ver
                                    </button>

                                    {/* Solo mostrar eliminar para reportes en borrador */}
                                    {reporte.status === 'draft' && onDeleteReport && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteReport(reporte.id);
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold text-sm border border-red-200"
                                            title="Eliminar reporte"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
