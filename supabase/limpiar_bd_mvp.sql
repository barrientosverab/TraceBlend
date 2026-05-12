-- ============================================================
-- LIMPIEZA DE BASE DE DATOS PARA MVP — TraceBlend
-- ============================================================
-- Fecha: 2026-04-14
-- Proyecto: gcxsrvvmfhhvbxwhknau
--
-- OBJETIVO: Eliminar todas las tablas, vistas, triggers e
-- índices que NO son necesarios para el MVP.
--
-- TABLAS QUE SE MANTIENEN (MVP Core):
--   organizations, profiles, billing_history,
--   subscription_plans, subscription_plan_features,
--   products, sales_orders, sales_order_items,
--   sales_order_payments, clients,
--   fixed_expenses, expense_ledger,
--   cash_openings, cash_closures
--
-- ¡EJECUTAR DESPUÉS DE HACER BACKUP COMPLETO!
-- ============================================================

-- ============================================================
-- PASO 1: Eliminar VISTAS dependientes primero
-- ============================================================
DROP VIEW IF EXISTS v_lab_reports_complete CASCADE;
DROP VIEW IF EXISTS vw_inventory_status CASCADE;
DROP VIEW IF EXISTS vw_roast_costs CASCADE;
DROP VIEW IF EXISTS v_product_seasonality CASCADE;

-- ============================================================
-- PASO 2: Eliminar tablas de LABORATORIO
-- (Módulo oculto en MVP)
-- ============================================================
DROP TABLE IF EXISTS cupping_defects CASCADE;
DROP TABLE IF EXISTS lab_reports_cupping CASCADE;
DROP TABLE IF EXISTS lab_reports_physical CASCADE;
DROP TABLE IF EXISTS lab_reports CASCADE;

-- ============================================================
-- PASO 3: Eliminar tablas de TUESTE y MAQUINARIA
-- (Módulo oculto en MVP)
-- ============================================================
DROP TABLE IF EXISTS roast_batch_inputs CASCADE;
DROP TABLE IF EXISTS roast_batches CASCADE;
DROP TABLE IF EXISTS machines CASCADE;

-- ============================================================
-- PASO 4: Eliminar tablas de MATERIA PRIMA / SUPPLY CHAIN
-- (Módulo oculto en MVP)
-- ============================================================
DROP TABLE IF EXISTS milling_inputs CASCADE;
DROP TABLE IF EXISTS milling_processes CASCADE;
DROP TABLE IF EXISTS green_coffee_warehouse CASCADE;
DROP TABLE IF EXISTS raw_inventory_batches CASCADE;
DROP TABLE IF EXISTS farms CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- ============================================================
-- PASO 5: Eliminar tablas de PRODUCCIÓN / EMPAQUE
-- (Módulo oculto en MVP)
-- ============================================================
DROP TABLE IF EXISTS packaging_logs CASCADE;
DROP TABLE IF EXISTS finished_inventory CASCADE;
DROP TABLE IF EXISTS supplies_inventory CASCADE;
DROP TABLE IF EXISTS product_recipes CASCADE;

-- ============================================================
-- PASO 6: Eliminar tablas de MARKETING
-- (Módulo oculto en MVP)
-- ============================================================
DROP TABLE IF EXISTS product_promotions CASCADE;

-- ============================================================
-- PASO 7: Limpiar columnas FK huérfanas en products
-- (source_green_inventory_id y container_supply_id ya no
--  apuntan a ninguna tabla)
-- ============================================================
ALTER TABLE products DROP COLUMN IF EXISTS source_green_inventory_id;
ALTER TABLE products DROP COLUMN IF EXISTS container_supply_id;

-- ============================================================
-- VERIFICACIÓN: Listar tablas restantes
-- ============================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
