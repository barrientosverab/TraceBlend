-- ============================================================
-- SCRIPT DE LIMPIEZA FINAL: ELIMINACIÓN DE TRIGGERS HUÉRFANOS
-- ============================================================
-- Este script destruye las 4 funciones (y los triggers unidos
-- a ellas) que todavía intentaban interactuar con `finished_inventory`
-- cada vez que se registraba una venta o empaque.

BEGIN;

DROP FUNCTION IF EXISTS public.decrement_inventory_on_sale() CASCADE;
DROP FUNCTION IF EXISTS public.increase_finished_inventory() CASCADE;
DROP FUNCTION IF EXISTS public.process_sale_inventory() CASCADE;
DROP FUNCTION IF EXISTS public.update_finished_inventory() CASCADE;

-- Refrescar el caché de PostgREST
NOTIFY pgrst, 'reload schema';

COMMIT;
