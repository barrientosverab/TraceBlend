import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: number; // Porcentaje de cambio
        period: string; // ej: "vs ayer", "vs semana anterior"
    };
    variant?: 'default' | 'dark' | 'success' | 'warning' | 'danger';
    subtitle?: string;
}

export function MetricCard({
    title,
    value,
    icon,
    trend,
    variant = 'default',
    subtitle
}: MetricCardProps) {
    const variantStyles = {
        default: 'bg-white border-stone-200',
        dark: 'bg-stone-900 text-white border-stone-800',
        success: 'bg-emerald-50 border-emerald-200',
        warning: 'bg-amber-50 border-amber-200',
        danger: 'bg-red-50 border-red-200'
    };

    const getTrendColor = (value: number) => {
        if (value > 0) return 'text-emerald-600';
        if (value < 0) return 'text-red-600';
        return 'text-stone-400';
    };

    const getTrendIcon = (value: number) => {
        if (value > 0) return <TrendingUp size={12} />;
        if (value < 0) return <TrendingDown size={12} />;
        return <Minus size={12} />;
    };

    return (
        <div className={`p-6 rounded-2xl border shadow-sm transition-smooth hover:shadow-md relative overflow-hidden ${variantStyles[variant]}`}>
            {/* Background Icon Decoration */}
            <div className={`absolute right-[-20px] top-[-20px] opacity-10 transition-opacity group-hover:opacity-20`}>
                {icon}
            </div>

            {/* Title */}
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${variant === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                {title}
            </p>

            {/* Main Value */}
            <h3 className={`text-3xl font-mono font-bold mb-2 ${variant === 'dark' ? 'text-white' : 'text-stone-800'}`}>
                {value}
            </h3>

            {/* Trend or Subtitle */}
            {trend ? (
                <div className={`flex items-center gap-1 text-xs font-bold ${getTrendColor(trend.value)}`}>
                    {getTrendIcon(trend.value)}
                    <span>
                        {trend.value > 0 ? '+' : ''}{trend.value}% {trend.period}
                    </span>
                </div>
            ) : subtitle ? (
                <p className={`text-xs ${variant === 'dark' ? 'text-stone-400' : 'text-stone-500'}`}>
                    {subtitle}
                </p>
            ) : null}
        </div>
    );
}
