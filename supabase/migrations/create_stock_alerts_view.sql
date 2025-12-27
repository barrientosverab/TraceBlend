-- ========================================
-- Vista: Alertas de Stock Bajo
-- ========================================
-- Propósito: Mostrar insumos y productos con stock por debajo del mínimo

CREATE OR REPLACE VIEW v_stock_alerts AS
-- Insumos con stock bajo
SELECT 
    'insumo' as type,
    id,
    organization_id,
    name,
    current_stock,
    min_stock,
    unit_measure,
    (min_stock - current_stock) as deficit,
    CASE 
        WHEN current_stock <= 0 THEN 'critical'
        WHEN current_stock <= (min_stock * 0.5) THEN 'high'
        ELSE 'medium'
    END as severity
FROM supplies_inventory
WHERE current_stock <= min_stock

UNION ALL

-- Productos terminados con stock bajo (solo los que NO tienen receta)
SELECT
    'producto' as type,
    p.id,
    p.organization_id,
    p.name,
    fi.current_stock,
    5 as min_stock, -- Valor por defecto, puede ajustarse
    'und' as unit_measure,
    (5 - fi.current_stock) as deficit,
    CASE 
        WHEN fi.current_stock <= 0 THEN 'critical'
        WHEN fi.current_stock <= 2 THEN 'high'
        ELSE 'medium'
    END as severity
FROM products p
JOIN finished_inventory fi ON fi.product_id = p.id
LEFT JOIN product_recipes pr ON pr.product_id = p.id
WHERE pr.product_id IS NULL -- Solo productos SIN receta
AND fi.current_stock <= 5
AND p.is_active = true

ORDER BY severity DESC, deficit DESC;

-- ========================================
-- COMENTARIOS
-- ========================================
-- Esta vista combina alertas de:
-- 1. Insumos (leche, café, etc.) con stock <= min_stock
-- 2. Productos terminados sin receta (pasteles, bolsas) con stock <= 5
--
-- Severidad:
-- - critical: Stock en 0
-- - high: Stock muy bajo
-- - medium: Stock bajo
--
-- Para usar en el frontend:
-- SELECT * FROM v_stock_alerts WHERE organization_id = 'xxx';
