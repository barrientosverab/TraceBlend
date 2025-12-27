-- ========================================
-- SCRIPT DE VERIFICACIÓN PARA MIGRACIÓN DE LABORATORIO
-- ========================================
-- Ejecuta este script COMPLETO en Supabase SQL Editor
-- Te mostrará todo lo que necesitas saber antes de migrar
-- ========================================

-- 1. VERIFICAR TABLAS EXISTENTES RELACIONADAS CON LABORATORIO
SELECT '========== TABLAS EXISTENTES (lab_*) ==========' as seccion;
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'lab%'
ORDER BY table_name;

-- 2. VERIFICAR TABLAS REQUERIDAS (DEPENDENCIAS)
SELECT '========== VERIFICAR DEPENDENCIAS ==========' as seccion;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') 
        THEN '✅ organizations existe'
        ELSE '❌ organizations NO EXISTE - REQUERIDA'
    END as organizations,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'raw_inventory_batches') 
        THEN '✅ raw_inventory_batches existe'
        ELSE '❌ raw_inventory_batches NO EXISTE - REQUERIDA'
    END as raw_inventory_batches,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'farms') 
        THEN '✅ farms existe'
        ELSE '⚠️  farms NO EXISTE - Opcional (para vista completa)'
    END as farms;

-- 3. SI EXISTE lab_reports ANTIGUA, VER SU ESTRUCTURA
SELECT '========== ESTRUCTURA DE lab_reports ANTIGUA (SI EXISTE) ==========' as seccion;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'lab_reports'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. CONTAR REGISTROS EN lab_reports (SI EXISTE)
SELECT '========== DATOS EXISTENTES ==========' as seccion;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_reports') THEN
        EXECUTE 'SELECT COUNT(*) as total_reportes FROM lab_reports';
        RAISE NOTICE 'Tabla lab_reports encontrada. Ejecuta: SELECT COUNT(*) FROM lab_reports;';
    ELSE
        RAISE NOTICE '✅ No existe tabla lab_reports antigua - Puedes proceder seguro';
    END IF;
END $$;

-- 5. VERIFICAR TIPOS ENUM EXISTENTES
SELECT '========== TIPOS ENUM RELACIONADOS ==========' as seccion;
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as valores
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%sample%' 
   OR t.typname LIKE '%report%' 
   OR t.typname LIKE '%cupping%'
   OR t.typname LIKE '%defect%'
GROUP BY t.typname
ORDER BY t.typname;

-- 6. VERIFICAR FUNCIONES EXISTENTES
SELECT '========== FUNCIONES RELACIONADAS ==========' as seccion;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%lab%' OR routine_name LIKE '%cupping%')
ORDER BY routine_name;

-- 7. VERIFICAR VISTAS RELACIONADAS
SELECT '========== VISTAS RELACIONADAS ==========' as seccion;
SELECT 
    table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE '%lab%'
ORDER BY table_name;

-- 8. RESUMEN FINAL Y RECOMENDACIONES
SELECT '========== RESUMEN Y RECOMENDACIONES ==========' as seccion;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lab_reports')
        THEN '⚠️  CUIDADO: Existe tabla lab_reports antigua. Verifica si tiene datos importantes.'
        ELSE '✅ SEGURO: No existe lab_reports antigua. Puedes ejecutar la migración sin riesgo.'
    END as estado_lab_reports,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations')
             AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'raw_inventory_batches')
        THEN '✅ LISTO: Todas las dependencias existen'
        ELSE '❌ FALTA: Necesitas crear primero las tablas de dependencias'
    END as estado_dependencias;

-- ========================================
-- FIN DEL SCRIPT DE VERIFICACIÓN
-- ========================================
-- IMPORTANTE: Si la tabla lab_reports existe Y tiene datos:
-- Ejecuta también este query para ver los datos:
-- 
-- SELECT * FROM lab_reports LIMIT 5;
-- 
-- Si necesitas hacer backup:
-- SELECT * FROM lab_reports; -- Luego exporta como CSV
-- ========================================
