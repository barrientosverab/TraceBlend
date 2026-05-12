-- Script de diagnóstico para encontrar referencias ocultas a finished_inventory
-- 1. Buscar en todas las funciones y triggers de la base de datos
SELECT 
    proname AS nombre_funcion, 
    prosrc AS codigo_fuente
FROM 
    pg_proc
WHERE 
    prosrc ILIKE '%finished_inventory%'
    AND pronamespace = 'public'::regnamespace;

-- 2. Buscar en las políticas RLS (Row Level Security)
SELECT 
    polname AS nombre_politica,
    polqual AS expresion_usada
FROM 
    pg_policy
WHERE 
    polqual::text ILIKE '%finished_inventory%';
