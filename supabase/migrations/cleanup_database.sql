-- ========================================
-- SCRIPT DE LIMPIEZA DE BASE DE DATOS
-- TraceBlend - Supabase (VERSIÓN FINAL)
-- ========================================
-- ADVERTENCIA: Este script eliminará TODOS los datos pero mantendrá la estructura
-- Ejecutar con precaución y asegúrate de tener un respaldo si es necesario
-- ========================================

BEGIN;

-- ========================================
-- FUNCIÓN AUXILIAR: Limpia tabla si existe
-- ========================================
CREATE OR REPLACE FUNCTION safe_truncate(table_name text) 
RETURNS void AS $$
BEGIN
    EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
EXCEPTION
    WHEN undefined_table THEN
        -- La tabla no existe, ignorar
        NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PASO 1: LIMPIAR DATOS DE VENTAS
-- ========================================
SELECT safe_truncate('sales_order_items');
SELECT safe_truncate('sales_orders');

-- ========================================
-- PASO 2: LIMPIAR DATOS DE INVENTARIO
-- ========================================
SELECT safe_truncate('finished_inventory');
SELECT safe_truncate('supplies_inventory');
SELECT safe_truncate('raw_inventory_batches');
SELECT safe_truncate('raw_inventory_transactions');

-- Tablas de trilla y tueste
SELECT safe_truncate('milling_processes');
SELECT safe_truncate('milling_inputs');
SELECT safe_truncate('green_coffee_warehouse');
SELECT safe_truncate('roast_batches');
SELECT safe_truncate('roast_batch_inputs');

-- ========================================
-- PASO 3: LIMPIAR DATOS DE PRODUCTOS Y RECETAS
-- ========================================
SELECT safe_truncate('product_recipes');
SELECT safe_truncate('products');
SELECT safe_truncate('product_promotions');

-- ========================================
-- PASO 4: LIMPIAR DATOS DE LABORATORIO
-- ========================================
SELECT safe_truncate('cupping_defects');
SELECT safe_truncate('lab_reports_cupping');
SELECT safe_truncate('lab_reports_physical');
SELECT safe_truncate('lab_reports');

-- ========================================
-- PASO 5: LIMPIAR DATOS DE MAESTROS
-- ========================================
SELECT safe_truncate('farms');
SELECT safe_truncate('suppliers');
SELECT safe_truncate('clients');

-- ========================================
-- PASO 6: LIMPIAR USUARIOS (EXCEPTO ADMINISTRADORES)
-- ========================================
-- NOTA: Esto mantiene tu usuario administrador actual
-- Si quieres eliminar TODOS los usuarios, descomenta la opción 2 o 3

-- Opción 1: Eliminar solo usuarios que no sean administradores
DELETE FROM profiles WHERE role != 'administrador';

-- Opción 2: Eliminar TODOS excepto el primer administrador (descomenta si necesitas)
-- DELETE FROM profiles WHERE id NOT IN (
--     SELECT id FROM profiles WHERE role = 'administrador' ORDER BY created_at LIMIT 1
-- );

-- Opción 3: Eliminar TODOS los perfiles (descomenta si necesitas)
-- SELECT safe_truncate('profiles');

-- ========================================
-- PASO 7: LIMPIAR USUARIOS DE SUPABASE AUTH
-- ========================================
-- IMPORTANTE: Para eliminar usuarios de Supabase Auth, hazlo manualmente desde el Dashboard:
-- 1. Ve a: https://supabase.com/dashboard/project/gcxsrvvmfhhvbxwhknau/auth/users
-- 2. Selecciona los usuarios que deseas eliminar
-- 3. Click en "Delete user"
--
-- O ejecuta este comando SQL si tienes permisos (requiere service_role):
-- DELETE FROM auth.users WHERE created_at > NOW() - INTERVAL '24 hours';

-- ========================================
-- PASO 8: LIMPIAR FUNCIÓN AUXILIAR
-- ========================================
DROP FUNCTION IF EXISTS safe_truncate(text);

-- ========================================
-- FINALIZAR TRANSACCIÓN
-- ========================================
COMMIT;

-- ========================================
-- VERIFICACIÓN POST-LIMPIEZA (OPCIONAL)
-- ========================================
-- Ejecuta estas consultas después para verificar que se limpiaron los datos:
/*
SELECT 'sales_orders' as tabla, COUNT(*) as registros FROM sales_orders
UNION ALL
SELECT 'sales_order_items', COUNT(*) FROM sales_order_items
UNION ALL
SELECT 'finished_inventory', COUNT(*) FROM finished_inventory
UNION ALL
SELECT 'supplies_inventory', COUNT(*) FROM supplies_inventory
UNION ALL
SELECT 'raw_inventory_batches', COUNT(*) FROM raw_inventory_batches
UNION ALL
SELECT 'roast_batches', COUNT(*) FROM roast_batches
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'product_recipes', COUNT(*) FROM product_recipes
UNION ALL
SELECT 'lab_reports', COUNT(*) FROM lab_reports
UNION ALL
SELECT 'farms', COUNT(*) FROM farms
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'clients', COUNT(*) FROM clients
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;
*/

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
-- 
-- 1. Este script usa una función safe_truncate() que:
--    - Intenta hacer TRUNCATE CASCADE en cada tabla
--    - Si la tabla no existe, ignora el error silenciosamente
--    - Limpia la función auxiliar al finalizar
--
-- 2. La limpieza de usuarios de auth.users debe hacerse:
--    - Manualmente desde el Dashboard de Supabase
--    - O con permisos de service_role
--
-- 3. USUARIOS: Por defecto preserva administradores
--    - Cambia la línea 79 si necesitas otra lógica
--
-- 4. Si necesitas agregar más tablas:
--    - Agrega SELECT safe_truncate('nombre_tabla');
--    - No es necesario verificar si existe
--
-- ========================================
