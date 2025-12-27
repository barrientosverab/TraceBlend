-- ========================================
-- MIGRACIÓN: Sistema Inteligente de Control de Inventario
-- ========================================
-- Propósito: Validar y descontar stock según tipo de producto:
--   1. Productos con receta → Valida/descuenta INSUMOS
--   2. Productos simples/bolsas → Valida/descuenta INVENTARIO TERMINADO

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
-- COMENTARIOS Y NOTAS
-- ========================================
-- Esta función ahora:
-- 1. Detecta automáticamente si un producto tiene receta
-- 2. Si tiene receta: Valida y descuenta INSUMOS de supplies_inventory
-- 3. Si NO tiene receta: Valida y descuenta de finished_inventory
-- 4. Proporciona mensajes de error claros indicando qué falta
--
-- Para ejecutar:
-- 1. Ve a Supabase Dashboard > SQL Editor
-- 2. Copia y pega este script
-- 3. Haz clic en "Run"
-- 4. Verifica que no haya errores
--
-- REEMPLAZA el script anterior: fix_stock_validation_for_prepared_products.sql
