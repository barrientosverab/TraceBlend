-- ============================================================================
-- FIX: Corregir acceso para usuarios con planes de pago
-- Fecha: 2026-01-19
-- Problema: Usuarios con Plan Profesional siguen viendo "Función Premium"
-- Solución: Recrear vista de suscripciones y verificar features
-- ============================================================================

-- ============================================================================
-- PASO 1: RECREAR VISTA DE SUSCRIPCIONES
-- ============================================================================

-- Eliminar vista existente
DROP VIEW IF EXISTS organization_subscription_details CASCADE;

-- Recrear vista con la estructura correcta
CREATE VIEW organization_subscription_details AS
SELECT 
    o.id AS organization_id,
    o.name AS organization_name,
    sp.id AS plan_id,
    sp.name AS plan_name,
    sp.code AS plan_code,
    sp.monthly_price,
    sp.max_users,
    o.trial_ends_at,
    CASE 
        WHEN o.trial_ends_at IS NOT NULL AND o.trial_ends_at > NOW() THEN true
        ELSE false
    END AS is_trial_active,
    ARRAY_AGG(spf.feature_code ORDER BY spf.feature_code) FILTER (WHERE spf.feature_code IS NOT NULL) AS available_features
FROM organizations o
LEFT JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
LEFT JOIN subscription_plan_features spf ON sp.id = spf.subscription_plan_id
GROUP BY o.id, o.name, sp.id, sp.name, sp.code, sp.monthly_price, sp.max_users, o.trial_ends_at;

COMMENT ON VIEW organization_subscription_details IS 
'Vista consolidada con información de suscripción incluyendo features disponibles';

-- ============================================================================
-- PASO 2: VERIFICAR QUE LAS ORGANIZACIONES TIENEN FEATURES
-- ============================================================================

-- Ver el estado actual de las organizaciones
SELECT 
    organization_id,
    organization_name,
    plan_name,
    plan_code,
    COALESCE(ARRAY_LENGTH(available_features, 1), 0) as feature_count,
    available_features
FROM organization_subscription_details
ORDER BY organization_name;

-- ============================================================================
-- PASO 3: ACTUALIZAR FUNCIÓN has_feature_access EN LA BASE DE DATOS
-- ============================================================================

-- Esta función se usa desde el backend de Supabase
CREATE OR REPLACE FUNCTION has_feature_access(p_organization_id UUID, p_feature_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
    v_trial_ends_at TIMESTAMPTZ;
    v_plan_code TEXT;
    v_features TEXT[];
BEGIN
    -- Obtener información de la organización usando la vista
    SELECT trial_ends_at, plan_code, available_features
    INTO v_trial_ends_at, v_plan_code, v_features
    FROM organization_subscription_details
    WHERE organization_id = p_organization_id;
    
    -- Si no existe la organización, no tiene acceso
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Si está en período de trial válido, tiene acceso a todo
    IF v_trial_ends_at IS NOT NULL AND v_trial_ends_at > NOW() THEN
        RETURN TRUE;
    END IF;
    
    -- Si el trial expiró pero aún tiene el plan trial, no tiene acceso
    IF v_plan_code = 'trial' AND (v_trial_ends_at IS NULL OR v_trial_ends_at <= NOW()) THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar si tiene la feature específica
    IF v_features IS NULL OR ARRAY_LENGTH(v_features, 1) = 0 THEN
        RETURN FALSE;
    END IF;
    
    RETURN LOWER(p_feature_code) = ANY(v_features);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION has_feature_access(UUID, TEXT) IS 
'Verifica acceso a features considerando: 1) Trial activo (acceso total), 2) Trial expirado (sin acceso), 3) Plan de pago con features específicas';

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    v_orgs_with_features INTEGER;
    v_orgs_without_plan INTEGER;
    v_features_total INTEGER;
BEGIN
    RAISE NOTICE '========== VERIFICACIÓN POST-CORRECCIÓN ==========';
    
    -- Contar organizaciones con features
    SELECT COUNT(*) INTO v_orgs_with_features
    FROM organization_subscription_details
    WHERE available_features IS NOT NULL 
      AND ARRAY_LENGTH(available_features, 1) > 0;
    
    RAISE NOTICE '✅ Organizaciones con features: %', v_orgs_with_features;
    
    -- Contar organizaciones sin plan
    SELECT COUNT(*) INTO v_orgs_without_plan
    FROM organizations
    WHERE subscription_plan_id IS NULL;
    
    IF v_orgs_without_plan > 0 THEN
        RAISE WARNING '⚠️  Organizaciones sin plan: %', v_orgs_without_plan;
    ELSE
        RAISE NOTICE '✅ Todas las organizaciones tienen plan asignado';
    END IF;
    
    -- Total de features configuradas
    SELECT COUNT(*) INTO v_features_total
    FROM subscription_plan_features;
    
    RAISE NOTICE '📊 Total de features configuradas: %', v_features_total;
    
    RAISE NOTICE '========== FIN VERIFICACIÓN ==========';
END $$;

-- Ver detalle de organizaciones con Plan Profesional
SELECT 
    organization_name,
    plan_name,
    plan_code,
    ARRAY_LENGTH(available_features, 1) as total_features,
    available_features
FROM organization_subscription_details
WHERE plan_code = 'professional';

-- ============ FIN DEL SCRIPT ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
/*
✅ CAMBIOS REALIZADOS:
1. Vista organization_subscription_details recreada
2. Función has_feature_access actualizada para usar la vista
3. Verificación de que todas las organizaciones tienen features

📝 DESPUÉS DE EJECUTAR ESTE SCRIPT:
1. Los usuarios deben hacer HARD REFRESH (Ctrl+F5) en el navegador
2. Esto limpiará el caché del frontend
3. La aplicación volverá a consultar las features actualizadas
4. Los usuarios con Plan Profesional tendrán acceso a todas las 17 features

⚠️  SI AÚN NO FUNCIONA:
1. Verificar que el Plan Profesional tiene features asignadas:
   SELECT * FROM subscription_plan_features 
   WHERE subscription_plan_id = (SELECT id FROM subscription_plans WHERE code = 'professional');

2. Verificar que las organizaciones tienen el plan asignado:
   SELECT o.name, sp.name as plan
   FROM organizations o
   LEFT JOIN subscription_plans sp ON o.subscription_plan_id = sp.id;

3. Limpiar caché del lado del servidor:
   - Reiniciar el servidor de desarrollo (npm run dev)
*/
