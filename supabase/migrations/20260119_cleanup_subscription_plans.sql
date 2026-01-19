-- ============================================================================
-- LIMPIEZA DE PLANES DE SUSCRIPCIÓN
-- Fecha: 2026-01-19
-- Objetivo: Simplificar a solo 3 planes: Gratuito, Básico, Profesional
-- ============================================================================

-- ============================================================================
-- PASO 1: ASIGNAR FEATURES A LOS 3 PLANES QUE SE CONSERVARÁN
-- ============================================================================

DO $$
DECLARE
    v_plan_gratuito_id UUID;
    v_plan_basico_id UUID;
    v_plan_profesional_id UUID;
BEGIN
    RAISE NOTICE '🔧 Configurando features para los planes que se conservarán...';
    
    -- Obtener IDs de los planes
    SELECT id INTO v_plan_gratuito_id FROM subscription_plans WHERE code = 'free_trial';
    SELECT id INTO v_plan_basico_id FROM subscription_plans WHERE code = 'basic';
    SELECT id INTO v_plan_profesional_id FROM subscription_plans WHERE code = 'professional';
    
    -- ========================================================================
    -- PLAN GRATUITO: Features básicas (7 features)
    -- ========================================================================
    IF v_plan_gratuito_id IS NOT NULL THEN
        DELETE FROM subscription_plan_features WHERE subscription_plan_id = v_plan_gratuito_id;
        
        INSERT INTO subscription_plan_features (subscription_plan_id, feature_code) VALUES
            (v_plan_gratuito_id, 'dashboard'),
            (v_plan_gratuito_id, 'pos'),
            (v_plan_gratuito_id, 'cash_close'),
            (v_plan_gratuito_id, 'catalog'),
            (v_plan_gratuito_id, 'crm'),
            (v_plan_gratuito_id, 'inventory'),
            (v_plan_gratuito_id, 'reports')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Plan Gratuito configurado con 7 features básicas';
    END IF;
    
    -- ========================================================================
    -- PLAN BÁSICO: Features intermedias (12 features)
    -- ========================================================================
    IF v_plan_basico_id IS NOT NULL THEN
        DELETE FROM subscription_plan_features WHERE subscription_plan_id = v_plan_basico_id;
        
        INSERT INTO subscription_plan_features (subscription_plan_id, feature_code) VALUES
            (v_plan_basico_id, 'dashboard'),
            (v_plan_basico_id, 'pos'),
            (v_plan_basico_id, 'cash_close'),
            (v_plan_basico_id, 'reception'),
            (v_plan_basico_id, 'roasting'),
            (v_plan_basico_id, 'packaging'),
            (v_plan_basico_id, 'inventory'),
            (v_plan_basico_id, 'catalog'),
            (v_plan_basico_id, 'team'),
            (v_plan_basico_id, 'crm'),
            (v_plan_basico_id, 'reports'),
            (v_plan_basico_id, 'promotions')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Plan Básico configurado con 12 features intermedias';
    END IF;
    
    -- ========================================================================
    -- PLAN PROFESIONAL: Todas las features (17 features)
    -- ========================================================================
    IF v_plan_profesional_id IS NOT NULL THEN
        DELETE FROM subscription_plan_features WHERE subscription_plan_id = v_plan_profesional_id;
        
        INSERT INTO subscription_plan_features (subscription_plan_id, feature_code) VALUES
            (v_plan_profesional_id, 'dashboard'),
            (v_plan_profesional_id, 'pos'),
            (v_plan_profesional_id, 'cash_close'),
            (v_plan_profesional_id, 'reception'),
            (v_plan_profesional_id, 'milling'),
            (v_plan_profesional_id, 'roasting'),
            (v_plan_profesional_id, 'laboratory'),
            (v_plan_profesional_id, 'packaging'),
            (v_plan_profesional_id, 'finance'),
            (v_plan_profesional_id, 'inventory'),
            (v_plan_profesional_id, 'catalog'),
            (v_plan_profesional_id, 'projections'),
            (v_plan_profesional_id, 'team'),
            (v_plan_profesional_id, 'crm'),
            (v_plan_profesional_id, 'suppliers'),
            (v_plan_profesional_id, 'reports'),
            (v_plan_profesional_id, 'promotions')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '✅ Plan Profesional configurado con 17 features (acceso completo)';
    END IF;
END $$;

-- ============================================================================
-- PASO 2: REASIGNAR ORGANIZACIONES DE PLANES A ELIMINAR
-- ============================================================================

DO $$
DECLARE
    v_plan_profesional_id UUID;
    v_orgs_reasignadas INTEGER := 0;
BEGIN
    RAISE NOTICE '📦 Reasignando organizaciones de planes obsoletos...';
    
    -- Obtener ID del plan profesional (destino)
    SELECT id INTO v_plan_profesional_id FROM subscription_plans WHERE code = 'professional';
    
    IF v_plan_profesional_id IS NULL THEN
        RAISE EXCEPTION 'Error: No se encontró el plan Profesional';
    END IF;
    
    -- Reasignar organizaciones de "Trazabilidad" (2 orgs)
    UPDATE organizations
    SET subscription_plan_id = v_plan_profesional_id
    WHERE subscription_plan_id IN (
        SELECT id FROM subscription_plans WHERE code = 'trazabilidad'
    );
    
    GET DIAGNOSTICS v_orgs_reasignadas = ROW_COUNT;
    RAISE NOTICE '✅ % organizaciones de "Trazabilidad" reasignadas a Plan Profesional', v_orgs_reasignadas;
    
    -- Reasignar organizaciones de "Trial Gratuito" (1 org)
    UPDATE organizations
    SET subscription_plan_id = v_plan_profesional_id,
        trial_ends_at = NULL  -- Remover fecha de trial ya que ahora es plan de pago
    WHERE subscription_plan_id IN (
        SELECT id FROM subscription_plans WHERE code = 'trial'
    );
    
    GET DIAGNOSTICS v_orgs_reasignadas = ROW_COUNT;
    RAISE NOTICE '✅ % organizaciones de "Trial" reasignadas a Plan Profesional', v_orgs_reasignadas;
    
    -- Reasignar organizaciones de "Barista TraceBlend" (si hay alguna)
    UPDATE organizations
    SET subscription_plan_id = v_plan_profesional_id
    WHERE subscription_plan_id IN (
        SELECT id FROM subscription_plans WHERE code = 'barista'
    );
    
    GET DIAGNOSTICS v_orgs_reasignadas = ROW_COUNT;
    IF v_orgs_reasignadas > 0 THEN
        RAISE NOTICE '✅ % organizaciones de "Barista" reasignadas a Plan Profesional', v_orgs_reasignadas;
    END IF;
    
    -- Reasignar organizaciones de "Plan Empresarial" (si hay alguna)
    UPDATE organizations
    SET subscription_plan_id = v_plan_profesional_id
    WHERE subscription_plan_id IN (
        SELECT id FROM subscription_plans WHERE code = 'enterprise'
    );
    
    GET DIAGNOSTICS v_orgs_reasignadas = ROW_COUNT;
    IF v_orgs_reasignadas > 0 THEN
        RAISE NOTICE '✅ % organizaciones de "Empresarial" reasignadas a Plan Profesional', v_orgs_reasignadas;
    END IF;
END $$;

-- ============================================================================
-- PASO 3: ELIMINAR FEATURES DE PLANES A BORRAR
-- ============================================================================

DELETE FROM subscription_plan_features
WHERE subscription_plan_id IN (
    SELECT id FROM subscription_plans 
    WHERE code IN ('barista', 'trazabilidad', 'trial', 'enterprise')
);

-- ============================================================================
-- PASO 4: ELIMINAR TRIGGERS QUE ASIGNAN TRIAL AUTOMÁTICAMENTE
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_assign_trial_to_new_org ON organizations;
DROP FUNCTION IF EXISTS assign_trial_to_organization();

RAISE NOTICE '✅ Trigger de auto-asignación de trial eliminado';

-- ============================================================================
-- PASO 5: ELIMINAR PLANES OBSOLETOS
-- ============================================================================

DELETE FROM subscription_plans
WHERE code IN ('barista', 'trazabilidad', 'trial', 'enterprise');

-- ============================================================================
-- PASO 6: ACTUALIZAR NOMBRES Y PRECIOS DE LOS PLANES RESTANTES
-- ============================================================================

-- Plan Gratuito
UPDATE subscription_plans
SET 
    name = 'Plan Gratuito',
    description = 'Plan gratuito con funciones básicas para iniciar',
    monthly_price = 0.00,
    max_users = 2,
    is_active = true
WHERE code = 'free_trial';

-- Plan Básico
UPDATE subscription_plans
SET 
    name = 'Plan Básico',
    description = 'Plan básico ideal para pequeñas cafeterías',
    monthly_price = 29.99,
    max_users = 5,
    is_active = true
WHERE code = 'basic';

-- Plan Profesional
UPDATE subscription_plans
SET 
    name = 'Plan Profesional',
    description = 'Plan profesional con acceso completo a todas las funcionalidades',
    monthly_price = 79.99,
    max_users = 15,
    is_active = true
WHERE code = 'professional';

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    v_planes_restantes INTEGER;
    v_orgs_sin_plan INTEGER;
BEGIN
    RAISE NOTICE '========== VERIFICACIÓN POST-LIMPIEZA ==========';
    
    -- Contar planes restantes
    SELECT COUNT(*) INTO v_planes_restantes FROM subscription_plans WHERE is_active = true;
    RAISE NOTICE '📊 Planes activos restantes: %', v_planes_restantes;
    
    IF v_planes_restantes != 3 THEN
        RAISE WARNING '⚠️  Se esperaban 3 planes, pero hay %', v_planes_restantes;
    ELSE
        RAISE NOTICE '✅ Cantidad correcta de planes (3)';
    END IF;
    
    -- Verificar organizaciones sin plan
    SELECT COUNT(*) INTO v_orgs_sin_plan 
    FROM organizations 
    WHERE subscription_plan_id IS NULL;
    
    IF v_orgs_sin_plan > 0 THEN
        RAISE WARNING '⚠️  Hay % organizaciones sin plan asignado', v_orgs_sin_plan;
    ELSE
        RAISE NOTICE '✅ Todas las organizaciones tienen plan asignado';
    END IF;
    
    RAISE NOTICE '========== FIN VERIFICACIÓN ==========';
END $$;

-- Ver configuración final
SELECT 
    sp.name,
    sp.code,
    sp.monthly_price,
    sp.max_users,
    COUNT(spf.feature_code) as total_features,
    COUNT(o.id) as total_organizations
FROM subscription_plans sp
LEFT JOIN subscription_plan_features spf ON sp.id = spf.subscription_plan_id
LEFT JOIN organizations o ON o.subscription_plan_id = sp.id
WHERE sp.is_active = true
GROUP BY sp.id, sp.name, sp.code, sp.monthly_price, sp.max_users
ORDER BY sp.monthly_price;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
/*
✅ CAMBIOS REALIZADOS:
1. Configuradas features para Plan Gratuito (7), Básico (12), y Profesional (17)
2. Reasignadas 3 organizaciones al Plan Profesional
3. Eliminados 4 planes obsoletos: Barista, Trazabilidad, Trial, Empresarial
4. Removido trigger de auto-asignación de trial
5. Actualizados nombres y descripciones de planes restantes

📊 PLANES FINALES:
- Plan Gratuito ($0/mes, 2 usuarios, 7 features)
- Plan Básico ($29.99/mes, 5 usuarios, 12 features)
- Plan Profesional ($79.99/mes, 15 usuarios, 17 features)

⚠️  PRÓXIMOS PASOS:
1. Verificar que las 3 organizaciones reasignadas tienen acceso correcto
2. Actualizar documentación de precios si es necesario
3. Considerar crear nuevo flujo de onboarding sin trial automático
*/
