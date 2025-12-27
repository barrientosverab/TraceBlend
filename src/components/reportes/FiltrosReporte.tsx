import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

export type TipoReporte = 'ventas' | 'produccion' | 'gastos' | 'productos';

interface FiltrosReporteProps {
    tipoReporte: TipoReporte;
    onTipoChange: (tipo: TipoReporte) => void;
    fechaInicio: string;
    fechaFin: string;
    onFechaInicioChange: (fecha: string) => void;
    onFechaFinChange: (fecha: string) => void;
    onGenerar: () => void;
    loading?: boolean;
}

export function FiltrosReporte({
    tipoReporte,
    onTipoChange,
    fechaInicio,
    fechaFin,
    onFechaInicioChange,
    onFechaFinChange,
    onGenerar,
    loading = false
}: FiltrosReporteProps) {
    const tiposReporte: { value: TipoReporte; label: string }[] = [
        { value: 'ventas', label: '📊 Ventas' },
        { value: 'produccion', label: '🌱 Producción' },
        { value: 'gastos', label: '💸 Gastos' },
        { value: 'productos', label: '📦 Análisis de Productos' }
    ];

    return (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="font-bold text-lg text-stone-800 mb-4">
                Configurar Reporte
            </h3>

            {/* Selector de Tipo de Reporte */}
            <div className="mb-4">
                <label className="block text-sm font-bold text-stone-700 mb-2">
                    Tipo de Reporte
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {tiposReporte.map((tipo) => (
                        <button
                            key={tipo.value}
                            onClick={() => onTipoChange(tipo.value)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${tipoReporte === tipo.value
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                        >
                            {tipo.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selectores de Fecha */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">
                        Fecha Inicio
                    </label>
                    <div className="relative">
                        <Calendar
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                            size={18}
                        />
                        <input
                            type="date"
                            value={fechaInicio}
                            onChange={(e) => onFechaInicioChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">
                        Fecha Fin
                    </label>
                    <div className="relative">
                        <Calendar
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                            size={18}
                        />
                        <input
                            type="date"
                            value={fechaFin}
                            onChange={(e) => onFechaFinChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                </div>
            </div>

            {/* Botón Generar */}
            <button
                onClick={onGenerar}
                disabled={loading || !fechaInicio || !fechaFin}
                className={`w-full py-3 rounded-lg font-bold text-white transition-all ${loading || !fechaInicio || !fechaFin
                        ? 'bg-stone-300 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg'
                    }`}
            >
                {loading ? 'Generando...' : '🔍 Generar Reporte'}
            </button>
        </div>
    );
}
