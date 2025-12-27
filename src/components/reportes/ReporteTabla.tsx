import React from 'react';
import { Download, FileText } from 'lucide-react';

interface Column {
    key: string;
    label: string;
    formato?: 'numero' | 'moneda' | 'fecha' | 'porcentaje';
}

interface ReporteTablaProps {
    titulo: string;
    columnas: Column[];
    datos: any[];
    loading?: boolean;
    onExportar?: () => void;
}

export function ReporteTabla({
    titulo,
    columnas,
    datos,
    loading = false,
    onExportar
}: ReporteTablaProps) {

    const formatearValor = (valor: any, formato?: string) => {
        if (valor === null || valor === undefined) return '-';

        switch (formato) {
            case 'moneda':
                return `Bs ${Number(valor).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`;
            case 'numero':
                return Number(valor).toLocaleString('es-BO');
            case 'porcentaje':
                return `${Number(valor).toFixed(2)}%`;
            case 'fecha':
                return new Date(valor).toLocaleDateString('es-BO');
            default:
                return valor;
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-6 rounded-xl border border-stone-200">
                <div className="h-8 bg-stone-200 rounded w-48 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-stone-100 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (datos.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl border border-stone-200">
                <h3 className="font-bold text-lg text-stone-800 mb-4 flex items-center gap-2">
                    <FileText size={20} />
                    {titulo}
                </h3>
                <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-stone-300 mb-3" />
                    <p className="text-stone-500">No hay datos disponibles para este período</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
                    <FileText size={20} />
                    {titulo}
                </h3>
                {onExportar && (
                    <button
                        onClick={onExportar}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium text-sm"
                    >
                        <Download size={16} />
                        Exportar CSV
                    </button>
                )}
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-stone-200">
                            {columnas.map((col) => (
                                <th
                                    key={col.key}
                                    className="text-left py-3 px-4 font-bold text-sm text-stone-700 uppercase tracking-wide"
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {datos.map((fila, idx) => (
                            <tr
                                key={idx}
                                className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                            >
                                {columnas.map((col) => (
                                    <td key={col.key} className="py-3 px-4 text-sm text-stone-600">
                                        {formatearValor(fila[col.key], col.formato)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer con contador */}
            <div className="mt-4 pt-4 border-t border-stone-200">
                <p className="text-sm text-stone-500 text-center">
                    Mostrando <span className="font-bold">{datos.length}</span> registro{datos.length !== 1 ? 's' : ''}
                </p>
            </div>
        </div>
    );
}
