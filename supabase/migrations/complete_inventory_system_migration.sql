-- ========================================
-- MIGRACIÓN COMPLETA: Sistema Inteligente de Control de Inventario
-- VERSIÓN CORREGIDA - Sin dependencia de min_stock
-- ========================================

-- ========================================
-- PASO 1: Eliminar función anterior
-- ========================================
DROP FUNCTION IF EXISTS registrar_venta_transaccion(
    UUID, UUID, UUID, DECIMAL, JSONB, TEXT, TEXT, TEXT
);

-- ========================================
-- PASO 2: Crear nueva función con lógica inteligente
-- ========================================
CREATE OR REPLACE FUNCTION registrar_venta_transaccion(
    p_org_id UUID,
    p_client_id UUID,
    p_seller_id UUID,
    p_total DECIMAL(10,2),
    p_items JSONB,
    p_payment_method TEXT,
    p_order_type TEXT,
    p_status TEXT DEFAULT 'completed'
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_product_id UUID;
    v_cantidad INT;
    v_current_stock DECIMAL;
    v_product_name TEXT;
    v_tiene_receta BOOLEAN;
    v_receta RECORD;
    v_supply_name TEXT;
    v_cantidad_requerida DECIMAL;
BEGIN
    -- 1. Insertar orden de venta
    INSERT INTO sales_orders (
        organization_id, 
        client_id, 
        seller_id, 
        total_amount, 
        payment_method, 
        order_type, 
        status
    )
    VALUES (
        p_org_id, 
        p_client_id, 
        p_seller_id, 
        p_total, 
        p_payment_method, 
        p_order_type, 
        p_status
    )
    RETURNING id INTO v_order_id;

    -- 2. Procesar cada item del pedido
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_cantidad := (v_item->>'cantidad')::INT;

        -- 3. Insertar item de la orden
        INSERT INTO sales_order_items (
            organization_id,
            sales_order_id,
            product_id,
            quantity,
            unit_price,
            is_courtesy
        ) VALUES (
            p_org_id,
            v_order_id,
            v_product_id,
            v_cantidad,
            (v_item->>'unit_price')::DECIMAL(10,2),
            COALESCE((v_item->>'is_courtesy')::BOOLEAN, false)
        );

        -- 4. VALIDACIÓN Y DESCUENTO DE INVENTARIO (solo si está completada)
        IF p_status = 'completed' THEN
            
            -- Obtener nombre del producto para mensajes de error
            SELECT name INTO v_product_name
            FROM products
            WHERE id = v_product_id;
            
            -- Detectar si el producto tiene receta
            SELECT EXISTS (
                SELECT 1 
                FROM product_recipes 
                WHERE product_id = v_product_id
            ) INTO v_tiene_receta;
            
            IF v_tiene_receta THEN
                -- ========================================
                -- PRODUCTOS CON RECETA: Validar y descontar INSUMOS
                -- ========================================
                FOR v_receta IN 
                    SELECT pr.supply_id, pr.quantity, si.name as supply_name
                    FROM product_recipes pr
                    JOIN supplies_inventory si ON si.id = pr.supply_id
                    WHERE pr.product_id = v_product_id
                LOOP
                    v_cantidad_requerida := v_receta.quantity * v_cantidad;
                    
                    -- Obtener stock actual del insumo
                    SELECT current_stock INTO v_current_stock
                    FROM supplies_inventory
                    WHERE id = v_receta.supply_id;
                    
                    -- Validar stock suficiente
                    IF v_current_stock < v_cantidad_requerida THEN
                        RAISE EXCEPTION 'Insumo insuficiente para "%": %. Stock actual: %, Se requiere: %',
                            v_product_name,
                            v_receta.supply_name,
                            v_current_stock,
                            v_cantidad_requerida;
                    END IF;
                    
                    -- Descontar del inventario de insumos
                    UPDATE supplies_inventory
                    SET current_stock = current_stock - v_cantidad_requerida
                    WHERE id = v_receta.supply_id;
                    
                END LOOP;
                
            ELSE
                -- ========================================
                -- PRODUCTOS SIN RECETA: Validar y descontar FINISHED_INVENTORY
                -- ========================================
                
                -- Obtener stock actual del producto terminado
                SELECT COALESCE(fi.current_stock, 0) INTO v_current_stock
                FROM finished_inventory fi
                WHERE fi.product_id = v_product_id;
                
                -- Validar stock suficiente
                IF v_current_stock < v_cantidad THEN
                    RAISE EXCEPTION 'Stock insuficiente para "%". Stock actual: %, Se requiere: %',
                        v_product_name,
                        v_current_stock,
                        v_cantidad;
                END IF;
                
                -- Descontar del inventario de productos terminados
                UPDATE finished_inventory
                SET current_stock = current_stock - v_cantidad
                WHERE product_id = v_product_id;
                
            END IF;
            
        END IF;
    END LOOP;
END;
$$;

-- ========================================
-- PASO 3: Eliminar vista anterior (si existe)
-- ========================================
DROP VIEW IF EXISTS v_stock_alerts;

-- ========================================
-- PASO 4: Crear vista de alertas de stock
-- CORREGIDO: Sin usar min_stock (usar 10 como default)
-- ========================================
CREATE OR REPLACE VIEW v_stock_alerts AS
-- Insumos con stock bajo (comparando con umbral fijo de 10)
SELECT 
    'insumo' as type,
    id,
    organization_id,
    name,
    current_stock,
    10 as min_stock, -- Umbral por defecto
    unit_measure,
    (10 - current_stock) as deficit,
    CASE 
        WHEN current_stock <= 0 THEN 'critical'
        WHEN current_stock <= 5 THEN 'high'
        ELSE 'medium'
    END as severity
FROM supplies_inventory
WHERE current_stock <= 10

UNION ALL

-- Productos terminados con stock bajo (solo los que NO tienen receta)
SELECT
    'producto' as type,
    p.id,
    p.organization_id,
    p.name,
    fi.current_stock,
    5 as min_stock, -- Valor por defecto
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
-- FINALIZACIÓN
-- ========================================
-- ✅ Script completado exitosamente
-- 
-- Cambios aplicados:
-- ✅ Función registrar_venta_transaccion() actualizada
-- ✅ Vista v_stock_alerts creada (sin depender de min_stock)
-- ✅ Sistema listo para validar inventario inteligentemente
--
-- NOTA: La vista usa umbrales fijos:
-- - Insumos: Alerta si stock <= 10
-- - Productos: Alerta si stock <= 5
--
-- Si deseas umbrales personalizados por insumo, deberás:
-- 1. Agregar columna min_stock a supplies_inventory
-- 2. Actualizar la vista para usar esa columna
