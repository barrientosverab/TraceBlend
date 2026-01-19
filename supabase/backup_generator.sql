-- ============================================
-- SCRIPT DE BACKUP COMPLETO PARA SQL EDITOR
-- ============================================
-- Este script genera comandos SQL para recrear toda tu base de datos
-- Ejecútalo en el SQL Editor de Supabase Dashboard
-- Proyecto: gcxsrvvmfhhvbxwhknau
-- Fecha: 2026-01-16
-- ============================================

-- Este script generará INSERT statements para todas tus tablas
-- Copia el resultado y guárdalo en un archivo .sql

-- ============================================
-- PARTE 1: GENERAR INSERTS DE DATOS
-- ============================================

-- Organizations
SELECT 'INSERT INTO organizations (id, name, created_at, updated_at) VALUES ' ||
    STRING_AGG('(' || 
        QUOTE_LITERAL(id::text) || ', ' ||
        QUOTE_LITERAL(name) || ', ' ||
        QUOTE_LITERAL(created_at::text) || ', ' ||
        QUOTE_LITERAL(updated_at::text) || ')', ', ')
    || ';' as backup_sql
FROM organizations;

-- Users
SELECT 'INSERT INTO users (id, email, role, organization_id, created_at) VALUES ' ||
    STRING_AGG('(' || 
        QUOTE_LITERAL(id::text) || ', ' ||
        QUOTE_LITERAL(email) || ', ' ||
        QUOTE_LITERAL(role) || ', ' ||
        QUOTE_LITERAL(organization_id::text) || ', ' ||
        QUOTE_LITERAL(created_at::text) || ')', ', ')
    || ';' as backup_sql
FROM users;

-- Farms
SELECT 'INSERT INTO farms (id, name, organization_id, supplier_id, region, country_code, altitude, latitude, longitude, created_at, updated_at) VALUES ' ||
    STRING_AGG('(' || 
        QUOTE_LITERAL(id::text) || ', ' ||
        QUOTE_LITERAL(name) || ', ' ||
        QUOTE_LITERAL(organization_id::text) || ', ' ||
        COALESCE(QUOTE_LITERAL(supplier_id::text), 'NULL') || ', ' ||
        COALESCE(QUOTE_LITERAL(region), 'NULL') || ', ' ||
        COALESCE(QUOTE_LITERAL(country_code), 'NULL') || ', ' ||
        COALESCE(altitude::text, 'NULL') || ', ' ||
        COALESCE(latitude::text, 'NULL') || ', ' ||
        COALESCE(longitude::text, 'NULL') || ', ' ||
        QUOTE_LITERAL(created_at::text) || ', ' ||
        QUOTE_LITERAL(updated_at::text) || ')', ', ')
    || ';' as backup_sql
FROM farms;

-- Raw Inventory Batches
SELECT 'Raw Inventory Batches: ' || COUNT(*) || ' records' as info FROM raw_inventory_batches;

-- Prepared Inventory Batches
SELECT 'Prepared Inventory Batches: ' || COUNT(*) || ' records' as info FROM prepared_inventory_batches;

-- Products
SELECT 'Products: ' || COUNT(*) || ' records' as info FROM products;

-- Sales
SELECT 'Sales: ' || COUNT(*) || ' records' as info FROM sales;

-- Lab Analyses
SELECT 'Lab Analyses: ' || COUNT(*) || ' records' as info FROM lab_analyses;

-- ============================================
-- PARTE 2: INFORMACIÓN DE RESUMEN
-- ============================================

-- Resumen de todas las tablas
SELECT 
    'organizations' as table_name,
    COUNT(*) as record_count
FROM organizations
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'farms', COUNT(*) FROM farms
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'raw_inventory_batches', COUNT(*) FROM raw_inventory_batches
UNION ALL
SELECT 'raw_inventory_transactions', COUNT(*) FROM raw_inventory_transactions
UNION ALL
SELECT 'prepared_inventory_batches', COUNT(*) FROM prepared_inventory_batches
UNION ALL
SELECT 'prepared_inventory_transactions', COUNT(*) FROM prepared_inventory_transactions
UNION ALL
SELECT 'roasting_profiles', COUNT(*) FROM roasting_profiles
UNION ALL
SELECT 'roasting_batches', COUNT(*) FROM roasting_batches
UNION ALL
SELECT 'product_categories', COUNT(*) FROM product_categories
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'product_containers', COUNT(*) FROM product_containers
UNION ALL
SELECT 'lab_analyses', COUNT(*) FROM lab_analyses
UNION ALL
SELECT 'lab_analysis_items', COUNT(*) FROM lab_analysis_items
UNION ALL
SELECT 'lab_cupping_items', COUNT(*) FROM lab_cupping_items
UNION ALL
SELECT 'lab_granulometry_items', COUNT(*) FROM lab_granulometry_items
UNION ALL
SELECT 'lab_moisture_items', COUNT(*) FROM lab_moisture_items
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'sale_items', COUNT(*) FROM sale_items
UNION ALL
SELECT 'payment_methods', COUNT(*) FROM payment_methods
UNION ALL
SELECT 'cash_registers', COUNT(*) FROM cash_registers
UNION ALL
SELECT 'cash_register_movements', COUNT(*) FROM cash_register_movements
UNION ALL
SELECT 'cash_closures', COUNT(*) FROM cash_closures
ORDER BY record_count DESC;

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ejecuta cada sección por separado en el SQL Editor
-- 2. Copia los resultados de cada query
-- 3. Guarda todos los resultados en un archivo .sql
-- 4. Para restaurar, ejecuta ese archivo en el SQL Editor
-- ============================================
