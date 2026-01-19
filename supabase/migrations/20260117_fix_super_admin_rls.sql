-- ============================================================================
-- FIX: Permitir al Super Admin acceder a todos los datos
-- Fecha: 2026-01-17
-- Problema: RLS bloquea acceso porque super admin no tiene organization_id
-- Solución: Crear políticas especiales para super admin
-- ============================================================================

-- Email del super admin (cambiar si es diferente)
-- IMPORTANTE: Reemplazar con el email correcto del super admin
DO $$
BEGIN
  -- Crear variable de configuración para el email del super admin
  -- Esto permitirá verificar si el usuario actual es el super admin
  PERFORM set_config('app.super_admin_email', 'barrientosverab@gmail.com', false);
END $$;

-- ============================================================================
-- OPCIÓN 1: Políticas especiales para Super Admin (RECOMENDADO)
-- ============================================================================

-- Función helper para verificar si el usuario es super admin
CREATE OR REPLACE FUNCTION is_super_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  ) = current_setting('app.super_admin_email', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Agregar políticas de super admin a TODAS las tablas críticas
-- ============================================================================

-- ORGANIZATIONS
CREATE POLICY "super_admin_full_access" ON public.organizations
  FOR ALL USING (is_super_admin());

-- PROFILES  
CREATE POLICY "super_admin_full_access" ON public.profiles
  FOR ALL USING (is_super_admin());

-- SALES_ORDERS
CREATE POLICY "super_admin_full_access" ON public.sales_orders
  FOR ALL USING (is_super_admin());

-- SALES_ORDER_ITEMS
CREATE POLICY "super_admin_full_access" ON public.sales_order_items
  FOR ALL USING (is_super_admin());

-- CLIENTS
CREATE POLICY "super_admin_full_access" ON public.clients
  FOR ALL USING (is_super_admin());

-- PRODUCTS
CREATE POLICY "super_admin_full_access" ON public.products
  FOR ALL USING (is_super_admin());

-- ROAST_BATCHES
CREATE POLICY "super_admin_full_access" ON public.roast_batches
  FOR ALL USING (is_super_admin());

-- FARMS
CREATE POLICY "super_admin_full_access" ON public.farms
  FOR ALL USING (is_super_admin());

-- SUPPLIERS
CREATE POLICY "super_admin_full_access" ON public.suppliers
  FOR ALL USING (is_super_admin());

-- GREEN_COFFEE_WAREHOUSE
CREATE POLICY "super_admin_full_access" ON public.green_coffee_warehouse
  FOR ALL USING (is_super_admin());

-- RAW_INVENTORY_BATCHES
CREATE POLICY "super_admin_full_access" ON public.raw_inventory_batches
  FOR ALL USING (is_super_admin());

-- FINISHED_INVENTORY
CREATE POLICY "super_admin_full_access" ON public.finished_inventory
  FOR ALL USING (is_super_admin());

-- PRODUCT_RECIPES
CREATE POLICY "super_admin_full_access" ON public.product_recipes
  FOR ALL USING (is_super_admin());

-- PACKAGING_LOGS
CREATE POLICY "super_admin_full_access" ON public.packaging_logs
  FOR ALL USING (is_super_admin());

-- MILLING_PROCESSES
CREATE POLICY "super_admin_full_access" ON public.milling_processes
  FOR ALL USING (is_super_admin());

-- MILLING_INPUTS
CREATE POLICY "super_admin_full_access" ON public.milling_inputs
  FOR ALL USING (is_super_admin());

-- ROAST_BATCH_INPUTS
CREATE POLICY "super_admin_full_access" ON public.roast_batch_inputs
  FOR ALL USING (is_super_admin());

-- LAB_REPORTS
CREATE POLICY "super_admin_full_access" ON public.lab_reports
  FOR ALL USING (is_super_admin());

-- LAB_REPORTS_CUPPING
CREATE POLICY "super_admin_full_access" ON public.lab_reports_cupping
  FOR ALL USING (is_super_admin());

-- LAB_REPORTS_PHYSICAL
CREATE POLICY "super_admin_full_access" ON public.lab_reports_physical
  FOR ALL USING (is_super_admin());

-- CUPPING_DEFECTS
CREATE POLICY "super_admin_full_access" ON public.cupping_defects
  FOR ALL USING (is_super_admin());

-- CASH_CLOSURES
CREATE POLICY "super_admin_full_access" ON public.cash_closures
  FOR ALL USING (is_super_admin());

-- CASH_OPENINGS (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cash_openings') THEN
    EXECUTE 'CREATE POLICY "super_admin_full_access" ON public.cash_openings FOR ALL USING (is_super_admin())';
  END IF;
END $$;

-- BILLING_HISTORY
CREATE POLICY "super_admin_full_access" ON public.billing_history
  FOR ALL USING (is_super_admin());

-- EXPENSE_LEDGER
CREATE POLICY "super_admin_full_access" ON public.expense_ledger
  FOR ALL USING (is_super_admin());

-- FIXED_EXPENSES
CREATE POLICY "super_admin_full_access" ON public.fixed_expenses
  FOR ALL USING (is_super_admin());

-- MACHINES
CREATE POLICY "super_admin_full_access" ON public.machines
  FOR ALL USING (is_super_admin());

-- PRODUCT_PROMOTIONS
CREATE POLICY "super_admin_full_access" ON public.product_promotions
  FOR ALL USING (is_super_admin());

-- SUPPLIES_INVENTORY
CREATE POLICY "super_admin_full_access" ON public.supplies_inventory
  FOR ALL USING (is_super_admin());

-- SUBSCRIPTION_PLANS
CREATE POLICY "super_admin_full_access" ON public.subscription_plans
  FOR ALL USING (is_super_admin());

-- SUBSCRIPTION_PLAN_FEATURES
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_plan_features') THEN
    EXECUTE 'CREATE POLICY "super_admin_full_access" ON public.subscription_plan_features FOR ALL USING (is_super_admin())';
  END IF;
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Función para verificar que las políticas de super admin están activas
CREATE OR REPLACE FUNCTION verify_super_admin_policies()
RETURNS TABLE(table_name TEXT, has_super_admin_policy BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    EXISTS (
      SELECT 1 
      FROM pg_policies p 
      WHERE p.tablename = t.tablename 
        AND p.policyname = 'super_admin_full_access'
    ) as has_super_admin_policy
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar verificación (comentar después de confirmar)
-- SELECT * FROM verify_super_admin_policies();

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

/*
1. El email del super admin está configurado en la variable:
   'app.super_admin_email'
   
2. Para cambiar el email del super admin, modificar la línea 12 de este script

3. Estas políticas permiten al super admin:
   - Ver todos los datos de todas las organizaciones
   - Modificar cualquier registro
   - Eliminar cualquier registro
   - Insertar en cualquier tabla

4. Las políticas RLS normales siguen aplicando para usuarios regulares

5. Orden de evaluación de políticas:
   - Postgres evalúa TODAS las políticas con OR
   - Si CUALQUIER política permite el acceso, se concede
   - Por lo tanto, super admin siempre tendrá acceso

6. Para revocar acceso de super admin (no recomendado):
   DROP POLICY "super_admin_full_access" ON public.<tabla>;
*/
