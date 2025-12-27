import React, { InputHTMLAttributes, forwardRef } from 'react';
import { AlertCircle, LucideIcon } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    icon?: LucideIcon;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    hint,
    icon: Icon,
    fullWidth = true,
    className = '',
    ...props
}, ref) => {
    const hasError = !!error;

    return (
        <div className={fullWidth ? 'w-full' : ''}>
            {/* Label */}
            {label && (
                <label
                    htmlFor={props.id || props.name}
                    className="flex items-center justify-between mb-1"
                >
                    <span className="font-bold text-sm text-stone-700">{label}</span>
                    {props.required && (
                        <span className="text-xs text-red-500 font-bold">Requerido</span>
                    )}
                </label>
            )}

            {/* Input Container */}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                        <Icon size={18} />
                    </div>
                )}

                <input
                    ref={ref}
                    className={`
            w-full p-3 border rounded-xl transition-smooth focus-ring
            ${Icon ? 'pl-10' : ''}
            ${hasError
                            ? 'border-red-500 focus:ring-red-500 bg-red-50/50'
                            : 'border-stone-300 focus:border-emerald-500 bg-white'
                        }
            ${props.disabled ? 'bg-stone-100 cursor-not-allowed opacity-60' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-red-600 animate-slide-in-up">
                    <AlertCircle size={12} />
                    <span>{error}</span>
                </div>
            )}

            {/* Hint */}
            {hint && !error && (
                <p className="text-xs text-stone-400 mt-1.5">{hint}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
