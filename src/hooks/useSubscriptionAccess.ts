import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';

// Email del super admin
const SUPER_ADMIN_EMAIL = "barrientosverab@gmail.com";

export interface OrganizationSubscription {
    plan_name: string | null;
    plan_code: string | null;
    is_trial_active: boolean;
}

interface UseSubscriptionAccessResult {
    hasAccess: boolean;
    loading: boolean;
    subscription: OrganizationSubscription | null;
}

/**
 * Hook simplificado para MVP: Todos los features están disponibles.
 * El acceso se restringe solo por roles (admin/cashier/viewer) via ProtectedRoute.
 * La suscripción solo controla max_users y max_branches.
 */
export function useSubscriptionAccess(_featureCode?: string): UseSubscriptionAccessResult {
    const { user, orgId, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);

    const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

    useEffect(() => {
        if (!authLoading) {
            setLoading(false);
        }
    }, [authLoading, isSuperAdmin, orgId]);

    // MVP: Acceso total a todas las features. 
    // El control real se hace via roles en ProtectedRoute y Sidebar.
    return {
        hasAccess: true,
        loading: loading || authLoading,
        subscription: null
    };
}
