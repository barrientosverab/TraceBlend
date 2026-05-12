import { Lock, Zap, CheckCircle } from 'lucide-react';
import { useSubscriptionAccess } from '../../hooks/useSubscriptionAccess';
import { useAuth } from '../../hooks/useAuth';

// Email del super admin
const SUPER_ADMIN_EMAIL = "barrientosverab@gmail.com";

interface PermissionGuardProps {
    children: React.ReactNode;
    feature: string;
    fallback?: React.ReactNode;
}

/**
 * Componente de protección basado en features del plan de suscripción
 * 
 * Verifica que la organización tenga acceso a una feature específica.
 * Si no tiene acceso, muestra una pantalla de upgrade.
 * 
 * SUPER ADMIN: El super admin tiene acceso total a todas las features sin restricciones.
 * 
 * @param feature - Código de la feature requerida
 * @param children - Contenido a renderizar si tiene acceso
 * @param fallback - Componente personalizado a mostrar si no tiene acceso (opcional)
 * 
 * @example
 * ```tsx
 * <PermissionGuard feature="laboratory">
 *   <LaboratoryPage />
 * </PermissionGuard>
 * ```
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    feature,
    fallback
}) => {
    const { user } = useAuth();
    const { hasAccess, loading, subscription } = useSubscriptionAccess(feature);

    // Super Admin tiene acceso total, sin verificación de plan
    const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;
    if (isSuperAdmin) {
        return <>{children}</>;
    }

    // Mientras carga
    if (loading) {
        return (
            <div className="h-screen bg-stone-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-stone-300 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-stone-500 font-medium">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    // Si tiene acceso, renderizar contenido
    if (hasAccess) {
        return <>{children}</>;
    }

    // Si hay fallback personalizado, usarlo
    if (fallback) {
        return <>{fallback}</>;
    }

    // Pantalla de upgrade por defecto
    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-amber-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-900 p-8 text-center">
                    <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Lock size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Función Premium
                    </h1>
                    <p className="text-stone-300 text-sm">
                        Esta función requiere un plan superior
                    </p>
                </div>

                {/* Contenido */}
                <div className="p-8">
                    {/* Plan actual o Trial Info */}
                    {subscription?.plan_name && (
                        <div className={`mb-6 p-4 rounded-xl border ${subscription.plan_code === 'trial' && !subscription.is_trial_active
                                ? 'bg-red-50 border-red-200'
                                : 'bg-stone-100 border-stone-200'
                            }`}>
                            <p className="text-xs text-stone-500 uppercase tracking-wider font-bold mb-1">
                                {subscription.plan_code === 'trial' && !subscription.is_trial_active
                                    ? 'Tu prueba gratuita ha finalizado'
                                    : 'Tu plan actual'}
                            </p>
                            <p className="text-lg font-bold text-stone-800">
                                {subscription.plan_name}
                            </p>
                            {subscription.plan_code === 'trial' && !subscription.is_trial_active && (
                                <p className="text-sm text-red-700 mt-1">
                                    Para seguir usando TraceBlend, actualiza a un plan de pago
                                </p>
                            )}
                        </div>
                    )}

                    {/* Beneficios del upgrade */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items center gap-2">
                            <Zap className="text-amber-500" size={24} />
                            Actualiza para desbloquear
                        </h2>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-semibold text-stone-800">Trazabilidad Completa</p>
                                    <p className="text-sm text-stone-600">
                                        Acceso a todos los módulos de producción, laboratorio y análisis
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-semibold text-stone-800">Usuarios Ilimitados</p>
                                    <p className="text-sm text-stone-600">
                                        Agrega todos los miembros de tu equipo sin restricciones
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <CheckCircle className="text-emerald-600 flex-shrink-0 mt-0.5" size={20} />
                                <div>
                                    <p className="font-semibold text-stone-800">Soporte Prioritario</p>
                                    <p className="text-sm text-stone-600">
                                        Asistencia técnica dedicada y actualizaciones anticipadas
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Precio */}
                    <div className="bg-gradient-to-br from-emerald-50 to-amber-50 rounded-2xl p-6 mb-6 border-2 border-emerald-200">
                        <div className="text-center">
                            <p className="text-sm text-stone-600 mb-1">Plan Trazabilidad</p>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-5xl font-bold text-stone-900">$299</span>
                                <span className="text-stone-600">/mes</span>
                            </div>
                        </div>
                    </div>

                    {/* Acciones */}
                    <div className="space-y-3">
                        <a
                            href="https://wa.me/591XXXXXXXX?text=Hola,%20quiero%20actualizar%20mi%20plan%20a%20Trazabilidad"
                            target="_blank"
                            rel="noreferrer"
                            className="block w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-center"
                        >
                            Contactar para Actualizar Plan
                        </a>

                        <button
                            onClick={() => window.history.back()}
                            className="w-full py-3 text-stone-600 hover:text-stone-800 font-medium transition-colors text-center"
                        >
                            Volver atrás
                        </button>
                    </div>

                    {/* Garantía */}
                    <p className="text-center text-xs text-stone-500 mt-6">
                        🔒 Pago seguro • Activación inmediata • Sin compromisos de permanencia
                    </p>
                </div>
            </div>
        </div>
    );
};
