-- =================================================================
-- CORRECCIÓN: Trigger de Trial - No asignar a usuarios invitados
-- Fecha: 2025-12-27
-- Descripción: Actualiza el trigger para que NO asigne trial
--              a usuarios que ya tienen organization_id
--              (usuarios invitados a organizaciones existentes)
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
    
    -- SOLO asignar trial si:
    -- 1. El plan trial existe
    -- 2. La organización NO tiene plan asignado
    -- 3. Esta NO es una actualización (es un INSERT nuevo)
    IF v_trial_plan_id IS NOT NULL AND NEW.subscription_plan_id IS NULL THEN
        NEW.subscription_plan_id := v_trial_plan_id;
        NEW.trial_ends_at := NOW() + INTERVAL '14 days';
        
        RAISE NOTICE '✅ Trial de 14 días asignado a organización: %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION assign_trial_to_organization() IS 
'Asigna automáticamente un plan trial de 14 días SOLO a nuevas organizaciones (no a usuarios invitados)';
