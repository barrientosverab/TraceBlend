-- ============================================================================
-- MIGRACIÓN: Corrección del Flujo de Registro (Fix Registration Flow)
-- Fecha: 2026-05-13
-- Problema: El registro de nuevos usuarios falla con error 500 en Supabase.
-- Causa probable: Falta el trigger handle_new_user() o tiene errores de integridad.
-- ============================================================================

BEGIN;

-- 1. ASEGURAR QUE EL PLAN TRIAL EXISTE
DO $$
DECLARE
    v_trial_plan_id UUID;
BEGIN
    -- Intentar encontrar el plan 'trial'
    SELECT id INTO v_trial_plan_id FROM subscription_plans WHERE code = 'trial';
    
    -- Si no existe, crearlo
    IF v_trial_plan_id IS NULL THEN
        INSERT INTO subscription_plans (name, code, description, monthly_price, max_users)
        VALUES (
            'Trial Gratuito',
            'trial',
            'Plan de prueba gratuito de 14 días con acceso completo',
            0.00,
            NULL
        )
        RETURNING id INTO v_trial_plan_id;
        
        RAISE NOTICE '✅ Plan "trial" creado.';
    END IF;

    -- También crear el alias 'free_trial' si no existe
    IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE code = 'free_trial') THEN
        INSERT INTO subscription_plans (name, code, description, monthly_price, max_users, is_active)
        VALUES ('Plan Gratuito', 'free_trial', 'Plan gratuito por defecto', 0.00, 5, true);
        RAISE NOTICE '✅ Plan "free_trial" creado.';
    END IF;
END $$;

-- 2. CREAR FUNCIÓN PARA MANEJAR NUEVOS USUARIOS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_org_id UUID;
    v_trial_plan_id UUID;
BEGIN
    -- A. Obtener el ID del plan trial
    SELECT id INTO v_trial_plan_id FROM public.subscription_plans WHERE code = 'trial' LIMIT 1;
    
    -- B. Crear la Organización
    INSERT INTO public.organizations (
        name, 
        nit, 
        address,
        subscription_plan_id,
        trial_ends_at,
        setup_completed,
        status
    )
    VALUES (
        COALESCE(new.raw_user_meta_data->>'org_name', 'Mi Tostaduría'),
        COALESCE(new.raw_user_meta_data->>'tax_id', ''),
        'No especificada',
        v_trial_plan_id,
        NOW() + INTERVAL '14 days',
        false,
        'active'
    )
    RETURNING id INTO v_org_id;

    -- C. Crear el Perfil del Usuario
    INSERT INTO public.profiles (
        id, 
        organization_id, 
        first_name, 
        last_name, 
        role,
        is_active
    )
    VALUES (
        new.id,
        v_org_id,
        COALESCE(new.raw_user_meta_data->>'first_name', 'Usuario'),
        COALESCE(new.raw_user_meta_data->>'last_name', 'Nuevo'),
        COALESCE(new.raw_user_meta_data->>'role', 'administrador'),
        true
    );

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREAR EL TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RELAJAR RESTRICCIONES DE ORGANIZATIONS
ALTER TABLE public.organizations ALTER COLUMN address DROP NOT NULL;
ALTER TABLE public.organizations ALTER COLUMN subscription_plan_id DROP NOT NULL;
ALTER TABLE public.organizations ALTER COLUMN nit DROP NOT NULL;

COMMIT;

-- VERIFICACIÓN
SELECT name, code FROM subscription_plans WHERE code IN ('trial', 'free_trial');
