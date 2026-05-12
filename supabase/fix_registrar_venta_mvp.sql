-- ============================================================
-- FIX: REESCRIBIR FUNCION DE VENTAS PARA MVP (PODA COMPLETA)
-- ============================================================
-- Se eliminan TODAS las versiones antiguas de esta función para 
-- asegurar que la Base de Datos no retenga lógicas obsoletas 
-- en caché que busquen el "finished_inventory".
-- ============================================================

-- 1. DROPEAR FIRMAS ANTIGUAS (Evita colisiones)
DROP FUNCTION IF EXISTS public.registrar_venta_transaccion(UUID, UUID, UUID, NUMERIC, JSONB, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.registrar_venta_transaccion(UUID, UUID, UUID, NUMERIC, JSONB, JSONB, TEXT, TEXT);

-- 2. RECREAR LA ÚNICA FUNCIÓN VÁLIDA
CREATE OR REPLACE FUNCTION public.registrar_venta_transaccion(
    p_org_id UUID,
    p_client_id UUID,
    p_seller_id UUID,
    p_total DECIMAL(10,2),
    p_items JSONB,
    p_payments JSONB,
    p_order_type TEXT,
    p_status TEXT DEFAULT 'completed'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id UUID;
    v_sale_number TEXT;
    v_item JSONB;
    v_payment JSONB;
    v_product_id UUID;
    v_cantidad INT;
    v_product_name TEXT;
    v_total_pagos DECIMAL := 0;
    v_payment_count INT;
    v_payment_method_legacy TEXT;
    v_para_llevar BOOLEAN;
    v_costo_envase DECIMAL;
BEGIN
    -- Validaciones
    IF jsonb_typeof(p_payments) != 'array' THEN
        RAISE EXCEPTION 'p_payments debe ser un array JSON válido';
    END IF;
    
    SELECT COUNT(*) INTO v_payment_count FROM jsonb_array_elements(p_payments);
    
    IF v_payment_count = 0 THEN
        RAISE EXCEPTION 'Debe especificar al menos un método de pago';
    END IF;
    
    SELECT SUM((p->>'amount')::DECIMAL) INTO v_total_pagos FROM jsonb_array_elements(p_payments) p;
    
    IF ABS(v_total_pagos - p_total) > 0.01 THEN
        RAISE EXCEPTION 'La suma de pagos (%) no coincide con el total (%). Diferencia: %',
            v_total_pagos, p_total, ABS(v_total_pagos - p_total);
    END IF;
    
    v_sale_number := 'VTA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    IF v_payment_count > 1 THEN
        v_payment_method_legacy := 'Mixto';
    ELSE
        SELECT p->>'method' INTO v_payment_method_legacy FROM jsonb_array_elements(p_payments) p LIMIT 1;
    END IF;
    
    -- Insertar Cabecera de Orden
    INSERT INTO sales_orders (
        organization_id, client_id, seller_id, sale_number,
        total_amount, payment_method, is_mixed_payment, order_type, status, order_date
    ) VALUES (
        p_org_id, p_client_id, p_seller_id, v_sale_number,
        p_total, v_payment_method_legacy, (v_payment_count > 1), p_order_type, p_status, NOW()
    ) RETURNING id INTO v_order_id;
    
    -- Insertar Pagos Multiples
    FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments) LOOP
        INSERT INTO sales_order_payments (
            organization_id, sales_order_id, payment_method, amount, created_at
        ) VALUES (
            p_org_id, v_order_id, v_payment->>'method', (v_payment->>'amount')::DECIMAL, NOW()
        );
    END LOOP;
    
    -- Insertar Items del Carrito
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_cantidad := (v_item->>'cantidad')::INT;
        v_para_llevar := COALESCE((v_item->>'para_llevar')::BOOLEAN, false);
        v_costo_envase := COALESCE((v_item->>'costo_envase')::DECIMAL, 0);
        
        -- Obtener solo el nombre de los productos
        SELECT name INTO v_product_name FROM products WHERE id = v_product_id;
        
        -- OMITIMOS el "subtotal" porque Supabase lo auto-calcula (Generated Column)
        INSERT INTO sales_order_items (
            organization_id, sales_order_id, product_id, product_name,
            quantity, unit_price, is_courtesy, discount_percent,
            para_llevar, container_cost
        ) VALUES (
            p_org_id, v_order_id, v_product_id, v_product_name,
            v_cantidad, (v_item->>'unit_price')::DECIMAL(10,2),
            COALESCE((v_item->>'is_courtesy')::BOOLEAN, false),
            COALESCE((v_item->>'discount_val')::DECIMAL, 0),
            v_para_llevar, v_costo_envase
        );
    END LOOP;
    
    RETURN v_sale_number;
END;
$$;

-- 3. GARANTIZAR PERMISOS PARA LA API
GRANT EXECUTE ON FUNCTION public.registrar_venta_transaccion(UUID, UUID, UUID, DECIMAL, JSONB, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_venta_transaccion(UUID, UUID, UUID, DECIMAL, JSONB, JSONB, TEXT, TEXT) TO service_role;

-- 4. FORZAR LA RECARGA DE CACHÉ DE POSTGREST
NOTIFY pgrst, 'reload schema';
