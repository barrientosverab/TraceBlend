import { supabase } from './supabaseClient';

/**
 * Interface para el plan de suscripción
 */
export interface SubscriptionPlan {
    id: string;
    name: string;
    code: string;
    description: string | null;
    price_monthly: number;
    max_users: number | null;
    is_active: boolean;
}

/**
 * Interface para la información de suscripción de una organización
 */
export interface OrganizationSubscription {
    organization_id: string;
    organization_name: string;
    plan_id: string | null;
    plan_name: string | null;
    plan_code: string | null;
    price_monthly: number | null;
    max_users: number | null;
    trial_ends_at: string | null;
    is_trial_active: boolean;
    available_features: string[];
}

/**
 * Caché en memoria para evitar consultas repetidas
 */
const featureCache = new Map<string, Set<string>>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutos
let cacheTimestamp = 0;

/**
 * Limpia el caché de features
 */
export function clearFeatureCache() {
    featureCache.clear();
    cacheTimestamp = 0;
}

/**
 * Obtiene el plan de suscripción activo de una organización
 */
export async function getOrganizationPlan(organizationId: string): Promise<SubscriptionPlan | null> {
    try {
        const { data, error } = await supabase
            .from('organizations')
            .select(`
        subscription_plan_id,
        subscription_plans:subscription_plan_id (
          id,
          name,
          code,
          description,
          price_monthly,
          max_users,
          is_active
        )
      `)
            .eq('id', organizationId)
            .single();

        if (error) {
            console.error('[SubscriptionService] Error obteniendo plan:', error);
            return null;
        }

        if (!data?.subscription_plans) {
            return null;
        }

        return data.subscription_plans as unknown as SubscriptionPlan;
    } catch (error) {
        console.error('[SubscriptionService] Error obteniendo plan:', error);
        return null;
    }
}

/**
 * Obtiene todas las features disponibles para un plan específico
 */
export async function getPlanFeatures(planId: string): Promise<string[]> {
    try {
        const { data, error } = await (supabase as any)
            .from('subscription_plan_features')
            .select('feature_name')
            .eq('plan_id', planId)
            .eq('has_access', true);

        if (error) {
            console.error('[SubscriptionService] Error obteniendo features del plan:', error);
            return [];
        }

        return data?.map((f: any) => f.feature_name) || [];
    } catch (error) {
        console.error('[SubscriptionService] Error obteniendo features del plan:', error);
        return [];
    }
}

/**
 * Obtiene información completa de suscripción de una organización
 * Usa la vista optimizada de la base de datos
 */
export async function getOrganizationSubscription(
    organizationId: string
): Promise<OrganizationSubscription | null> {
    try {
        const { data, error } = await (supabase as any)
            .from('organization_subscription_details')
            .select('*')
            .eq('organization_id', organizationId)
            .single();

        if (error) {
            console.error('[SubscriptionService] Error obteniendo suscripción:', error);
            return null;
        }

        return data as OrganizationSubscription;
    } catch (error) {
        console.error('[SubscriptionService] Error obteniendo suscripción:', error);
        return null;
    }
}

/**
 * Verifica si una organización tiene acceso a una feature específica
 * Usa caché para optimizar rendimiento
 */
export async function hasFeatureAccess(
    organizationId: string,
    featureCode: string
): Promise<boolean> {
    // Verificar caché
    const now = Date.now();
    if (now - cacheTimestamp < CACHE_DURATION_MS && featureCache.has(organizationId)) {
        const features = featureCache.get(organizationId)!;
        return features.has(featureCode.toLowerCase());
    }

    // Si no hay caché válido, consultar base de datos
    try {
        const subscription = await getOrganizationSubscription(organizationId);

        if (!subscription) {
            return false;
        }

        // Si está en período de trial activo, tiene acceso a todo
        if (subscription.is_trial_active) {
            return true;
        }

        // Si tiene features disponibles, verificar acceso específico
        // Obtenemos del plan:
        if (subscription.plan_id) {
            const features = await getPlanFeatures(subscription.plan_id);
            if (features.length === 0) return false;
            
            // Actualizar caché
            featureCache.set(organizationId, new Set(features));
            cacheTimestamp = now;

            return features.includes(featureCode.toLowerCase());
        }

        return false;
    } catch (error) {
        console.error('[SubscriptionService] Error verificando acceso:', error);
        return false;
    }
}

/**
 * Obtiene todas las rutas accesibles para una organización
 * basándose en su plan de suscripción
 */
export async function getAccessibleRoutes(organizationId: string): Promise<string[]> {
    try {
        const subscription = await getOrganizationSubscription(organizationId);

        if (!subscription || !subscription.plan_id) {
            return [];
        }
        
        const available_features = await getPlanFeatures(subscription.plan_id);

        // Mapeo de features a rutas
        const featureToRoutes: Record<string, string[]> = {
            'pos': ['/ventas'],
            'cash_close': ['/cierre-caja', '/historial-cierres'],
            'dashboard': ['/'],
            'inventory': ['/insumos'],
            'catalog': ['/productos'],
            'team': ['/usuarios'],
            'reports': ['/reportes'],
            'reception': ['/recepcion'],
            'milling': ['/trilla'],
            'roasting': ['/tueste'],
            'laboratory': ['/laboratorio'],
            'packaging': ['/empaque'],
            'projections': ['/proyecciones'],
            'suppliers': ['/proveedores'],
            'crm': ['/clientes'],
            'promotions': ['/promociones'],
            'finance': ['/gastos']
        };

        const accessibleRoutes: string[] = [];
        available_features.forEach(feature => {
            const routes = featureToRoutes[feature];
            if (routes) {
                accessibleRoutes.push(...routes);
            }
        });

        return accessibleRoutes;
    } catch (error) {
        console.error('[SubscriptionService] Error obteniendo rutas accesibles:', error);
        return [];
    }
}

/**
 * Mapea una ruta a su código de feature correspondiente
 */
export function getFeatureFromRoute(route: string): string | null {
    const routeToFeature: Record<string, string> = {
        '/ventas': 'pos',
        '/cierre-caja': 'cash_close',
        '/historial-cierres': 'cash_close',
        '/': 'dashboard',
        '/insumos': 'inventory',
        '/productos': 'catalog',
        '/usuarios': 'team',
        '/reportes': 'reports',
        '/recepcion': 'reception',
        '/trilla': 'milling',
        '/tueste': 'roasting',
        '/laboratorio': 'laboratory',
        '/empaque': 'packaging',
        '/proyecciones': 'projections',
        '/proveedores': 'suppliers',
        '/clientes': 'crm',
        '/promociones': 'promotions',
        '/gastos': 'finance'
    };

    return routeToFeature[route] || null;
}

/**
 * Actualiza el plan de suscripción de una organización
 * (Solo para SuperAdmin)
 */
export async function updateOrganizationPlan(
    organizationId: string,
    planId: string
): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('organizations')
            .update({ subscription_plan_id: planId })
            .eq('id', organizationId);

        if (error) {
            console.error('[SubscriptionService] Error actualizando plan:', error);
            return false;
        }

        // Limpiar caché para esta organización
        featureCache.delete(organizationId);

        return true;
    } catch (error) {
        console.error('[SubscriptionService] Error actualizando plan:', error);
        return false;
    }
}

/**
 * Obtiene todos los planes de suscripción disponibles
 */
export async function getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('price_monthly', { ascending: true });

        if (error) {
            console.error('[SubscriptionService] Error obteniendo planes:', error);
            return [];
        }

        return data as unknown as SubscriptionPlan[];
    } catch (error) {
        console.error('[SubscriptionService] Error obteniendo planes:', error);
        return [];
    }
}
