-- ============================================================================
-- FIX: Asignar automáticamente Plan Gratuito a nuevas organizaciones
-- Fecha: 2026-01-22
-- Problema: Nuevas organizaciones se crean sin plan asignado
-- Solución: Recrear trigger para asignar plan gratuito automáticamente
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR FUNCIÓN PARA ASIGNAR PLAN GRATUITO
-- ============================================================================

CREATE OR REPLACE FUNCTION assign_free_plan_to_organization()
RETURNS TRIGGER AS $$
DECLARE
    v_free_plan_id UUID;
BEGIN
    -- Obtener el ID del plan gratuito
    SELECT id INTO v_free_plan_id 
    FROM subscription_plans 
    WHERE code = 'free_trial' AND is_active = true
    LIMIT 1;
    
    -- Si el plan gratuito existe y la organización no tiene plan asignado
    IF v_free_plan_id IS NOT NULL AND NEW.subscription_plan_id IS NULL THEN
        NEW.subscription_plan_id := v_free_plan_id;
        
        RAISE NOTICE '✅ Plan Gratuito asignado a organización: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION assign_free_plan_to_organization() IS 
'Asigna automáticamente el Plan Gratuito a nuevas organizaciones al momento de crearse';

-- ============================================================================
-- PASO 2: CREAR TRIGGER PARA AUTO-ASIGNACIÓN DE PLAN GRATUITO
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_assign_free_plan_to_new_org ON organizations;

CREATE TRIGGER trigger_assign_free_plan_to_new_org
    BEFORE INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION assign_free_plan_to_organization();

COMMENT ON TRIGGER trigger_assign_free_plan_to_new_org ON organizations IS 
'Trigger que asigna automáticamente el Plan Gratuito a nuevas organizaciones';

-- ============================================================================
-- PASO 3: ASIGNAR PLAN GRATUITO A ORGANIZACIONES EXISTENTES SIN PLAN
-- ============================================================================

DO $$
DECLARE
    v_free_plan_id UUID;
    v_updated_count INTEGER;
BEGIN
    RAISE NOTICE '🏢 Asignando plan gratuito a organizaciones existentes sin plan...';
    
    -- Obtener el ID del plan gratuito
    SELECT id INTO v_free_plan_id 
    FROM subscription_plans 
    WHERE code = 'free_trial' AND is_active = true;
    
    IF v_free_plan_id IS NOT NULL THEN
        -- Actualizar organizaciones que no tienen plan asignado
        WITH updated AS (
            UPDATE organizations
            SET subscription_plan_id = v_free_plan_id
            WHERE subscription_plan_id IS NULL
            RETURNING id
        )
        SELECT COUNT(*) INTO v_updated_count FROM updated;
        
        RAISE NOTICE '✅ % organizaciones asignadas al Plan Gratuito', v_updated_count;
    ELSE
        RAISE EXCEPTION '❌ No se pudo encontrar el Plan Gratuito';
    END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================

DO $$
DECLARE
    v_trigger_exists BOOLEAN;
    v_orgs_without_plan INTEGER;
BEGIN
    RAISE NOTICE '========== VERIFICANDO CORRECCIÓN =========='';
    
    -- Verificar que el trigger existe
    SELECT EXISTS(
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_assign_free_plan_to_new_org'
    ) INTO v_trigger_exists;
    
    IF v_trigger_exists THEN
        RAISE NOTICE '✅ Trigger de auto-asignación creado correctamente';
    ELSE
        RAISE EXCEPTION '❌ Error: Trigger no fue creado';
    END IF;
    
    -- Contar organizaciones sin plan
    SELECT COUNT(*) INTO v_orgs_without_plan
    FROM organizations
    WHERE subscription_plan_id IS NULL;
    
    IF v_orgs_without_plan > 0 THEN
        RAISE WARNING '⚠️  Aún hay % organizaciones sin plan', v_orgs_without_plan;
    ELSE
        RAISE NOTICE '✅ Todas las organizaciones tienen plan asignado';
    END IF;
    
    RAISE NOTICE '✅ Corrección completada exitosamente';
    RAISE NOTICE '========== FIN DE VERIFICACIÓN ==========';
END $$;
