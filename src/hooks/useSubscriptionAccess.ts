import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { hasFeatureAccess, getOrganizationSubscription, OrganizationSubscription } from '../services/subscriptionService';

// Email del super admin
const SUPER_ADMIN_EMAIL = "barrientosverab@gmail.com";

interface UseSubscriptionAccessResult {
    hasAccess: boolean;
    loading: boolean;
    subscription: OrganizationSubscription | null;
}

/**
 * Hook personalizado para verificar acceso a features según plan de suscripción
 * 
 * SUPER ADMIN: El super admin tiene acceso total a todas las features sin restricciones.
 * 
 * @param featureCode - Código de la feature a verificar (ej: 'pos', 'laboratory', 'reports')
 * @returns Estado de acceso, carga y datos de suscripción
 * 
 * @example
 * ```tsx
 * const { hasAccess, loading, subscription } = useSubscriptionAccess('laboratory');
 * 
 * if (loading) return <Spinner />;
 * if (!hasAccess) return <UpgradePrompt />;
 * return <LaboratoryModule />;
 * ```
 */
export function useSubscriptionAccess(featureCode?: string): UseSubscriptionAccessResult {
    const { user, orgId, loading: authLoading } = useAuth();
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);

    // Super Admin tiene acceso total inmediato
    const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

    useEffect(() => {
        // Si es super admin, acceso total sin verificaciones
        if (isSuperAdmin) {
            setHasAccess(true);
            setLoading(false);
            return;
        }

        async function checkAccess() {
            // Si no hay orgId, no hay acceso
            if (!orgId) {
                setHasAccess(false);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Obtener información de suscripción
                const subscriptionData = await getOrganizationSubscription(orgId);
                setSubscription(subscriptionData);

                // Si no se especifica feature, solo cargamos la suscripción
                if (!featureCode) {
                    setHasAccess(true);
                    setLoading(false);
                    return;
                }

                // Verificar acceso a la feature específica
                const access = await hasFeatureAccess(orgId, featureCode);
                setHasAccess(access);
            } catch (error) {
                console.error('[useSubscriptionAccess] Error:', error);
                setHasAccess(false);
            } finally {
                setLoading(false);
            }
        }

        // Solo ejecutar si no está cargando la autenticación
        if (!authLoading) {
            checkAccess();
        }
    }, [user, orgId, featureCode, authLoading, isSuperAdmin]);

    return { hasAccess, loading, subscription };
}
