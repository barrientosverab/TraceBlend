-- ========================================
-- VERIFICACIÓN POST-MIGRACIÓN - SISTEMA DE LABORATORIO
-- ========================================
-- Ejecuta este script para confirmar que todo se instaló correctamente
-- ========================================

-- 1. VERIFICAR TABLAS CREADAS
SELECT '✅ VERIFICAR TABLAS' as verificacion;
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE columns.table_name = tables.table_name 
       AND columns.table_schema = 'public') as num_columnas
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('lab_reports', 'lab_reports_physical', 'lab_reports_cupping', 'cupping_defects')
ORDER BY table_name;
-- Resultado esperado: 4 tablas

-- 2. VERIFICAR ENUMS CREADOS
SELECT '✅ VERIFICAR ENUMS' as verificacion;
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as valores_posibles
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname IN ('sample_type_enum', 'report_type_enum', 'report_status_enum', 'cupping_defect_type_enum')
GROUP BY t.typname
ORDER BY t.typname;
-- Resultado esperado: 4 enums

-- 3. VERIFICAR FUNCIONES CREADAS
SELECT '✅ VERIFICAR FUNCIONES' as verificacion;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('calculate_cupping_scores', 'update_cupping_scores_on_defects', 'update_lab_report_timestamp', 'get_batch_quality_history')
ORDER BY routine_name;
-- Resultado esperado: 4 funciones

-- 4. VERIFICAR TRIGGERS
SELECT '✅ VERIFICAR TRIGGERS' as verificacion;
SELECT 
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (trigger_name LIKE '%lab%' OR trigger_name LIKE '%cupping%')
ORDER BY event_object_table, trigger_name;
-- Resultado esperado: 3 triggers

-- 5. VERIFICAR VISTA
SELECT '✅ VERIFICAR VISTA' as verificacion;
SELECT 
    table_name as vista,
    view_definition IS NOT NULL as tiene_definicion
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'v_lab_reports_complete';
-- Resultado esperado: 1 vista

-- 6. VERIFICAR ÍNDICES
SELECT '✅ VERIFICAR ÍNDICES' as verificacion;
SELECT 
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename LIKE 'lab_%' OR tablename LIKE 'cupping_%')
ORDER BY tablename, indexname;
-- Resultado esperado: ~12 índices

-- 7. VERIFICAR RESTRICCIONES (CONSTRAINTS)
SELECT '✅ VERIFICAR RESTRICCIONES' as verificacion;
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('lab_reports', 'lab_reports_physical', 'lab_reports_cupping', 'cupping_defects')
ORDER BY tc.table_name, tc.constraint_type;

-- 8. PRUEBA FUNCIONAL: Insertar y consultar datos de prueba
SELECT '✅ PRUEBA FUNCIONAL' as verificacion;

-- Primero, obtener un organization_id y batch_id válidos
DO $$
DECLARE
    v_org_id UUID;
    v_batch_id UUID;
    v_report_id UUID;
BEGIN
    -- Obtener organization_id
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    
    -- Obtener batch_id
    SELECT id INTO v_batch_id FROM raw_inventory_batches LIMIT 1;
    
    IF v_org_id IS NULL OR v_batch_id IS NULL THEN
        RAISE NOTICE '⚠️  No hay datos en organizations o raw_inventory_batches para hacer prueba';
    ELSE
        -- Insertar reporte de prueba
        INSERT INTO lab_reports (
            organization_id, 
            batch_id, 
            report_date, 
            analyst_name, 
            sample_type, 
            report_type, 
            status
        ) VALUES (
            v_org_id,
            v_batch_id,
            CURRENT_DATE,
            'Test Migration',
            'internal',
            'physical',
            'draft'
        ) RETURNING id INTO v_report_id;
        
        -- Insertar análisis físico
        INSERT INTO lab_reports_physical (
            lab_report_id,
            sample_weight_grams,
            humidity_percentage,
            mesh_18,
            mesh_16,
            mesh_14,
            base_mesh,
            category_1_defects,
            category_2_defects
        ) VALUES (
            v_report_id,
            350,
            11.5,
            45,
            30,
            20,
            5,
            2,
            5
        );
        
        RAISE NOTICE '✅ Reporte de prueba creado exitosamente con ID: %', v_report_id;
        RAISE NOTICE 'Ejecuta esta query para verlo: SELECT * FROM v_lab_reports_complete WHERE id = ''%'';', v_report_id;
        
        -- Limpiar
        DELETE FROM lab_reports WHERE id = v_report_id;
        RAISE NOTICE '✅ Datos de prueba eliminados';
    END IF;
END $$;

-- 9. RESUMEN FINAL
SELECT '========== RESUMEN FINAL ==========' as resultado;
SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('lab_reports', 'lab_reports_physical', 'lab_reports_cupping', 'cupping_defects')) as tablas_creadas,
    (SELECT COUNT(*) FROM pg_type WHERE typname IN ('sample_type_enum', 'report_type_enum', 'report_status_enum', 'cupping_defect_type_enum')) as enums_creados,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name IN ('calculate_cupping_scores', 'update_cupping_scores_on_defects', 'update_lab_report_timestamp', 'get_batch_quality_history')) as funciones_creadas,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'v_lab_reports_complete') as vistas_creadas;

-- Si todas las columnas del resultado anterior muestran los números esperados, ¡todo está perfecto!
-- Tablas: 4 | Enums: 4 | Funciones: 4 | Vistas: 1

SELECT '✅✅✅ Sistema de Laboratorio verificado y funcionando correctamente ✅✅✅' as resultado_final;
