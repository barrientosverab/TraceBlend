import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2, LucideIcon } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    icon?: LucideIcon;
    children: ReactNode;
    fullWidth?: boolean;
}

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon: Icon,
    children,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = "font-bold rounded-xl transition-smooth flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden";

    const variantStyles = {
        primary: "bg-stone-900 text-white hover:bg-black shadow-md hover:shadow-lg active:scale-95",
        secondary: "bg-white text-stone-700 border-2 border-stone-300 hover:bg-stone-50 hover:border-stone-400",
        success: "btn-success shadow-md hover:shadow-lg active:scale-95",
        warning: "btn-warning shadow-md hover:shadow-lg active:scale-95",
        danger: "btn-error shadow-md hover:shadow-lg active:scale-95",
        ghost: "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
    };

    const sizeStyles = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2.5 text-base",
        lg: "px-6 py-3 text-lg"
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {/* Estado normal */}
            <span className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                {Icon && <Icon size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />}
                {children}
            </span>

            {/* Estado de carga */}
            {isLoading && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin" size={size === 'sm' ? 16 : size === 'lg' ? 22 : 18} />
                    <span className="ml-2">{typeof children === 'string' ? `${children}...` : 'Cargando...'}</span>
                </span>
            )}
        </button>
    );
}
