import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { hasFeatureAccess, getOrganizationSubscription, OrganizationSubscription } from '../services/subscriptionService';

interface UseSubscriptionAccessResult {
    hasAccess: boolean;
    loading: boolean;
    subscription: OrganizationSubscription | null;
}

/**
 * Hook personalizado para verificar acceso a features según plan de suscripción
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
    const { orgId, loading: authLoading } = useAuth();
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);

    useEffect(() => {
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
    }, [orgId, featureCode, authLoading]);

    return { hasAccess, loading, subscription };
}
