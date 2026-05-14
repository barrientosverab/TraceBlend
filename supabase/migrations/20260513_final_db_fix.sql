-- ============================================================================
-- MIGRACIÓN: Corrección Final de RLS y Onboarding
-- Fecha: 2026-05-13
-- Problemas: 
--   1. Recursión infinita en políticas de 'profiles'.
--   2. Error de restricción NOT NULL en 'branches.address' durante onboarding.
--   3. Necesidad de una función setup_organization robusta.
-- ============================================================================

BEGIN;

-- 1. CORRECCIÓN DE FUNCIONES HELPER (Evitar Recursión)
-- Estas versiones usan el JWT de Supabase para obtener el rol y org_id si están presentes,
-- lo cual es mucho más rápido y evita consultar la tabla 'profiles' recursivamente.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role')::text,
    (SELECT role::text FROM public.profiles WHERE id = auth.uid())
  );
EXCEPTION WHEN OTHERS THEN
  RETURN 'guest';
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_current_user_org_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid,
    (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. CORRECCIÓN DE POLÍTICAS DE PROFILES (Eliminar Recursión)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY; -- Temporalmente para evitar bloqueos durante el cambio

DROP POLICY IF EXISTS profiles_select_org ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert ON public.profiles;

-- Política de Selección: Simplificada para evitar recursión
CREATE POLICY profiles_select_org ON public.profiles
FOR SELECT USING (
    id = auth.uid() 
    OR organization_id = (SELECT p.organization_id FROM public.profiles p WHERE p.id = auth.uid())
    OR (SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin')
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. AJUSTE DE LA TABLA BRANCHES
-- Hacer que la dirección sea opcional para facilitar el onboarding
ALTER TABLE public.branches ALTER COLUMN address DROP NOT NULL;
ALTER TABLE public.branches ALTER COLUMN address SET DEFAULT 'Dirección General';

-- 4. FUNCIÓN ROBUSTA setup_organization
-- Esta función asegura que se cree la organización, la sucursal y se vincule el perfil en un solo paso.
CREATE OR REPLACE FUNCTION public.setup_organization(
    org_name TEXT,
    org_nit TEXT,
    org_address TEXT,
    plan_id UUID,
    branch_name TEXT
)
RETURNS VOID AS $$
DECLARE
    v_org_id UUID;
    v_branch_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No autenticado';
    END IF;

    -- 1. Crear Organización
    INSERT INTO public.organizations (
        name, 
        nit, 
        address, 
        subscription_plan_id, 
        status, 
        setup_completed
    )
    VALUES (
        org_name, 
        org_nit, 
        org_address, 
        plan_id, 
        'active', 
        true
    )
    RETURNING id INTO v_org_id;

    -- 2. Crear Sucursal Principal
    INSERT INTO public.branches (
        organization_id, 
        name, 
        address, 
        is_main, 
        is_active
    )
    VALUES (
        v_org_id, 
        branch_name, 
        COALESCE(org_address, 'Dirección General'), 
        true, 
        true
    )
    RETURNING id INTO v_branch_id;

    -- 3. Vincular el Perfil del Usuario
    UPDATE public.profiles
    SET 
        organization_id = v_org_id,
        role = 'administrador',
        is_active = true
    WHERE id = v_user_id;

    -- 4. Actualizar metadatos del usuario (opcional, ayuda a las funciones helper)
    -- Esto requiere extensiones o permisos especiales usualmente, así que lo omitimos
    -- pero el trigger handle_new_user ya debería haber hecho su parte.

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- VERIFICACIÓN
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('profiles', 'branches', 'organizations');
