import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
            {/* Icono con diseño mejorado */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-stone-100 to-stone-200 
                      flex items-center justify-center shadow-inner mb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"></div>
                <Icon className="w-12 h-12 text-stone-400 relative z-10" strokeWidth={1.5} />
            </div>

            {/* Contenido */}
            <div className="text-center max-w-sm space-y-2 mb-6">
                <h3 className="text-lg font-bold text-stone-700">{title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                    {description}
                </p>
            </div>

            {/* Acciones */}
            {(actionLabel || secondaryActionLabel) && (
                <div className="flex gap-3">
                    {actionLabel && onAction && (
                        <button
                            onClick={onAction}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 
                         rounded-xl font-bold shadow-lg hover:shadow-xl transition-all 
                         flex items-center gap-2 hover:scale-105"
                        >
                            {actionLabel}
                        </button>
                    )}
                    {secondaryActionLabel && onSecondaryAction && (
                        <button
                            onClick={onSecondaryAction}
                            className="bg-white hover:bg-stone-50 text-stone-700 px-6 py-3 
                         rounded-xl font-bold border border-stone-300 transition-all 
                         flex items-center gap-2"
                        >
                            {secondaryActionLabel}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
