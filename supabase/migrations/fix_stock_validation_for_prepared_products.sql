-- ========================================
-- MIGRACIÓN: Corregir validación de stock solo para productos "Grano"
-- ========================================
-- Propósito: Los productos preparados (pastelería, bebidas) no requieren
--            validación de stock. Solo productos de categoría "Grano" deben validarse.

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
    v_current_stock INT;
    v_product_category TEXT;
    v_product_name TEXT;
BEGIN
    -- 1. Insertar orden de venta
    INSERT INTO sales_orders (organization_id, client_id, seller_id, total_amount, payment_method, order_type, status)
    VALUES (p_org_id, p_client_id, p_seller_id, p_total, p_payment_method, p_order_type, p_status)
    RETURNING id INTO v_order_id;

    -- 2. Procesar cada item
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
            (v_item->>'is_courtesy')::BOOLEAN
        );

        -- 4. VALIDACIÓN DE STOCK - SOLO PARA PRODUCTOS "Grano"
        IF p_status = 'completed' THEN
            -- Obtener stock actual y categoría del producto
            SELECT 
                COALESCE(fi.current_stock, 0),
                p.category,
                p.name
            INTO 
                v_current_stock,
                v_product_category,
                v_product_name
            FROM products p
            LEFT JOIN finished_inventory fi ON fi.product_id = p.id
            WHERE p.id = v_product_id;

            -- Solo validar stock para productos de categoría "Grano"
            IF v_product_category = 'Grano' AND v_current_stock < v_cantidad THEN
                RAISE EXCEPTION 'Stock insuficiente para "%" (Categoría: %). Tienes: %, Piden: %',
                    v_product_name, v_product_category, v_current_stock, v_cantidad;
            END IF;

            -- Si es producto de categoría "Grano", descontar del inventario
            IF v_product_category = 'Grano' THEN
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
-- 1. Solo valida stock para productos de categoría "Grano"
-- 2. Los productos de "Pastelería" y "Café" no tienen validación de stock
-- 3. Solo descuenta inventario de productos "Grano"
--
-- Para ejecutar:
-- 1. Ve a Supabase Dashboard > SQL Editor
-- 2. Copia y pega este script
-- 3. Haz clic en "Run"
-- 4. Verifica que no haya errores
