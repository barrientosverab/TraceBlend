-- =================================================================
-- MIGRACIÓN: Plan de Prueba Gratuito de 14 Días
-- Fecha: 2025-12-27
-- Descripción: Implementa un sistema de trial de 14 días que se asigna
--              automáticamente a nuevas organizaciones al registrarse
-- =================================================================

-- =================================================================
-- PASO 1: AGREGAR COLUMNA TRIAL_ENDS_AT A ORGANIZATIONS
-- =================================================================

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

COMMENT ON COLUMN organizations.trial_ends_at IS 
'Fecha de finalización del período de prueba gratuito de 14 días';

-- Índice para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_organizations_trial_ends_at 
ON organizations(trial_ends_at) 
WHERE trial_ends_at IS NOT NULL;

-- =================================================================
-- PASO 2: CREAR PLAN "TRIAL GRATUITO"
-- =================================================================

DO $$
DECLARE
    v_trial_plan_id UUID;
BEGIN
    RAISE NOTICE '📦 Creando plan "Trial Gratuito"...';
    
    -- Verificar si ya existe el plan trial
    SELECT id INTO v_trial_plan_id 
    FROM subscription_plans 
    WHERE code = 'trial';
    
    -- Si no existe, crearlo
    IF v_trial_plan_id IS NULL THEN
        INSERT INTO subscription_plans (name, code, description, monthly_price, max_users)
        VALUES (
            'Trial Gratuito',
            'trial',
            'Plan de prueba gratuito de 14 días con acceso completo a toda la plataforma',
            0.00,
            NULL -- Usuarios ilimitados durante el trial
        )
        RETURNING id INTO v_trial_plan_id;
        
        RAISE NOTICE '✅ Plan "Trial Gratuito" creado con ID: %', v_trial_plan_id;
        
        -- Asignar TODAS las features al plan trial
        INSERT INTO subscription_plan_features (subscription_plan_id, feature_code) VALUES
            (v_trial_plan_id, 'pos'),
            (v_trial_plan_id, 'cash_close'),
            (v_trial_plan_id, 'dashboard'),
            (v_trial_plan_id, 'inventory'),
            (v_trial_plan_id, 'catalog'),
            (v_trial_plan_id, 'team'),
            (v_trial_plan_id, 'reports'),
            (v_trial_plan_id, 'reception'),
            (v_trial_plan_id, 'milling'),
            (v_trial_plan_id, 'roasting'),
            (v_trial_plan_id, 'laboratory'),
            (v_trial_plan_id, 'packaging'),
            (v_trial_plan_id, 'projections'),
            (v_trial_plan_id, 'suppliers'),
            (v_trial_plan_id, 'crm'),
            (v_trial_plan_id, 'promotions'),
            (v_trial_plan_id, 'finance');
        
        RAISE NOTICE '✅ 17 features asignadas al plan Trial (acceso completo)';
    ELSE
        RAISE NOTICE '⚠️  El plan Trial ya existe con ID: %', v_trial_plan_id;
    END IF;
END $$;

-- =================================================================
-- PASO 3: FUNCIÓN PARA ASIGNAR TRIAL A NUEVAS ORGANIZACIONES
-- =================================================================

CREATE OR REPLACE FUNCTION assign_trial_to_organization()
RETURNS TRIGGER AS $$
DECLARE
    v_trial_plan_id UUID;
BEGIN
    -- Obtener el ID del plan trial
    SELECT id INTO v_trial_plan_id 
    FROM subscription_plans 
    WHERE code = 'trial' AND is_active = true
    LIMIT 1;
    
    -- Si el plan trial existe y la organización no tiene plan asignado
    IF v_trial_plan_id IS NOT NULL AND NEW.subscription_plan_id IS NULL THEN
        NEW.subscription_plan_id := v_trial_plan_id;
        NEW.trial_ends_at := NOW() + INTERVAL '14 days';
        
        RAISE NOTICE '✅ Trial de 14 días asignado a organización: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION assign_trial_to_organization() IS 
'Asigna automáticamente un plan trial de 14 días a nuevas organizaciones al momento de crearse';

-- =================================================================
-- PASO 4: CREAR TRIGGER PARA AUTO-ASIGNACIÓN DE TRIAL
-- =================================================================

DROP TRIGGER IF EXISTS trigger_assign_trial_to_new_org ON organizations;

CREATE TRIGGER trigger_assign_trial_to_new_org
    BEFORE INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION assign_trial_to_organization();

COMMENT ON TRIGGER trigger_assign_trial_to_new_org ON organizations IS 
'Trigger que asigna automáticamente un plan trial de 14 días a nuevas organizaciones';

-- =================================================================
-- PASO 5: ACTUALIZAR FUNCIÓN has_feature_access PARA CONSIDERAR TRIAL
-- =================================================================

CREATE OR REPLACE FUNCTION has_feature_access(p_organization_id UUID, p_feature_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
    v_trial_ends_at TIMESTAMPTZ;
    v_plan_code TEXT;
BEGIN
    -- Obtener información de la organización
    SELECT o.trial_ends_at, sp.code
    INTO v_trial_ends_at, v_plan_code
    FROM organizations o
    LEFT JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
    WHERE o.id = p_organization_id;
    
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
    
    -- Verificar acceso normal según el plan
    SELECT EXISTS (
        SELECT 1
        FROM organizations o
        INNER JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
        INNER JOIN subscription_plan_features spf ON sp.id = spf.subscription_plan_id
        WHERE o.id = p_organization_id
          AND spf.feature_code = LOWER(p_feature_code)
          AND sp.is_active = true
          AND sp.code != 'trial' -- Excluir plan trial, ya se manejó arriba
    ) INTO v_has_access;
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION has_feature_access(UUID, TEXT) IS 
'Verifica acceso a features considerando: 1) Trial activo (acceso total), 2) Trial expirado (sin acceso), 3) Plan de pago normal';

-- =================================================================
-- PASO 6: ASIGNAR TRIAL A ORGANIZACIONES EXISTENTES SIN PLAN
-- =================================================================

DO $$
DECLARE
    v_trial_plan_id UUID;
    v_updated_count INTEGER;
BEGIN
    RAISE NOTICE '🏢 Asignando trial a organizaciones existentes sin plan...';
    
    -- Obtener el ID del plan trial
    SELECT id INTO v_trial_plan_id 
    FROM subscription_plans 
    WHERE code = 'trial' AND is_active = true;
    
    IF v_trial_plan_id IS NOT NULL THEN
        -- Actualizar organizaciones que no tienen plan asignado
        WITH updated AS (
            UPDATE organizations
            SET 
                subscription_plan_id = v_trial_plan_id,
                trial_ends_at = NOW() + INTERVAL '14 days'
            WHERE subscription_plan_id IS NULL
            RETURNING id
        )
        SELECT COUNT(*) INTO v_updated_count FROM updated;
        
        RAISE NOTICE '✅ % organizaciones asignadas al plan Trial', v_updated_count;
    ELSE
        RAISE EXCEPTION '❌ No se pudo encontrar el plan Trial';
    END IF;
END $$;

-- =================================================================
-- PASO 7: ACTUALIZAR VISTA organization_subscription_details
-- =================================================================

-- Primero eliminar la vista existente para evitar conflictos de columnas
DROP VIEW IF EXISTS organization_subscription_details;

-- Recrear la vista con los nuevos campos de trial
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
'Vista consolidada con información de suscripción incluyendo estado del trial';

-- =================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =================================================================

DO $$
DECLARE
    v_trial_plan_exists BOOLEAN;
    v_trial_features_count INTEGER;
    v_orgs_with_trial INTEGER;
BEGIN
    RAISE NOTICE '========== VERIFICANDO MIGRACIÓN DE TRIAL ==========';
    
    -- Verificar plan trial
    SELECT EXISTS(SELECT 1 FROM subscription_plans WHERE code = 'trial') 
    INTO v_trial_plan_exists;
    
    IF v_trial_plan_exists THEN
        RAISE NOTICE '✅ Plan Trial creado correctamente';
        
        -- Contar features del trial
        SELECT COUNT(*) INTO v_trial_features_count
        FROM subscription_plan_features spf
        INNER JOIN subscription_plans sp ON spf.subscription_plan_id = sp.id
        WHERE sp.code = 'trial';
        
        RAISE NOTICE '📊 Features del plan Trial: %', v_trial_features_count;
    ELSE
        RAISE EXCEPTION '❌ Error: Plan Trial no fue creado';
    END IF;
    
    -- Contar organizaciones con trial activo
    SELECT COUNT(*) INTO v_orgs_with_trial
    FROM organizations o
    INNER JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
    WHERE sp.code = 'trial' AND o.trial_ends_at > NOW();
    
    RAISE NOTICE '📊 Organizaciones con trial activo: %', v_orgs_with_trial;
    
    RAISE NOTICE '✅ Migración de Trial completada exitosamente';
    RAISE NOTICE '========== FIN DE VERIFICACIÓN ==========';
END $$;
