-- ================================================================
-- SCRIPT DE MIGRACIÓN: Sistema de Pagos Mixtos
-- Ejecutar en: Supabase SQL Editor
-- Fecha: 2026-01-22
-- ================================================================

-- ================================================================
-- PASO 0: Crear función helper is_super_admin (si no existe)
-- ================================================================
CREATE OR REPLACE FUNCTION is_super_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  ) = current_setting('app.super_admin_email', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- PASO 1: Crear tabla sales_order_payments
-- ================================================================
CREATE TABLE IF NOT EXISTS sales_order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Efectivo', 'QR', 'Tarjeta')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_payment_per_order UNIQUE(sales_order_id, payment_method, amount)
);

COMMENT ON TABLE sales_order_payments IS 'Registra los métodos de pago utilizados en cada venta. Permite pagos mixtos (split payments).';
COMMENT ON COLUMN sales_order_payments.payment_method IS 'Método de pago: Efectivo, QR, o Tarjeta';
COMMENT ON COLUMN sales_order_payments.amount IS 'Monto pagado con este método específico';

-- ================================================================
-- PASO 2: Crear índices para rendimiento
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_sop_sales_order_id 
ON sales_order_payments(sales_order_id);

CREATE INDEX IF NOT EXISTS idx_sop_organization_date 
ON sales_order_payments(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sop_payment_method 
ON sales_order_payments(organization_id, payment_method, created_at DESC);

-- ================================================================
-- PASO 3: Habilitar RLS (Row Level Security)
-- ================================================================
ALTER TABLE sales_order_payments ENABLE ROW LEVEL SECURITY;

-- Política: Super Admin puede ver todo
DROP POLICY IF EXISTS "Super admins can view all payment records" ON sales_order_payments;
CREATE POLICY "Super admins can view all payment records"
ON sales_order_payments
FOR SELECT
TO authenticated
USING (is_super_admin());

-- Política: Usuarios solo ven pagos de su organización
DROP POLICY IF EXISTS "Users can view payments from their organization" ON sales_order_payments;
CREATE POLICY "Users can view payments from their organization"
ON sales_order_payments
FOR SELECT
TO authenticated
USING (
  organization_id = (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Política: Solo usuarios autenticados pueden insertar
DROP POLICY IF EXISTS "Authenticated users can insert payments" ON sales_order_payments;
CREATE POLICY "Authenticated users can insert payments"
ON sales_order_payments
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Política: Bloquear UPDATE y DELETE (inmutabilidad de pagos)
DROP POLICY IF EXISTS "Block updates on payments" ON sales_order_payments;
CREATE POLICY "Block updates on payments"
ON sales_order_payments
FOR UPDATE
TO authenticated
USING (false);

DROP POLICY IF EXISTS "Block deletes on payments" ON sales_order_payments;
CREATE POLICY "Block deletes on payments"
ON sales_order_payments
FOR DELETE
TO authenticated
USING (false);

-- ================================================================
-- PASO 4: Modificar tabla sales_orders
-- ================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_orders' 
    AND column_name = 'is_mixed_payment'
  ) THEN
    ALTER TABLE sales_orders 
    ADD COLUMN is_mixed_payment BOOLEAN DEFAULT false;
    
    COMMENT ON COLUMN sales_orders.is_mixed_payment IS 'Indica si la venta utilizó múltiples métodos de pago';
  END IF;
END $$;

-- ================================================================
-- PASO 5: Migrar datos existentes
-- ================================================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Contar ventas existentes sin registro de pago
  SELECT COUNT(*) INTO v_count
  FROM sales_orders so
  WHERE NOT EXISTS (
    SELECT 1 FROM sales_order_payments sop 
    WHERE sop.sales_order_id = so.id
  )
  AND so.status = 'completed'
  AND so.payment_method IN ('Efectivo', 'QR', 'Tarjeta');  -- ✅ Solo métodos válidos

  -- Si existen ventas históricas, migrarlas
  IF v_count > 0 THEN
    INSERT INTO sales_order_payments (
      organization_id,
      sales_order_id,
      payment_method,
      amount,
      created_at
    )
    SELECT 
      so.organization_id,
      so.id,
      so.payment_method,  -- ✅ Usar directamente payment_method (ya validado en WHERE)
      so.total_amount,
      so.order_date
    FROM sales_orders so
    WHERE NOT EXISTS (
      SELECT 1 FROM sales_order_payments sop 
      WHERE sop.sales_order_id = so.id
    )
    AND so.status = 'completed'
    AND so.payment_method IN ('Efectivo', 'QR', 'Tarjeta');  -- ✅ Solo métodos válidos
    
    RAISE NOTICE 'Migradas % ventas históricas a sales_order_payments', v_count;
  ELSE
    RAISE NOTICE 'No hay ventas históricas para migrar';
  END IF;
END $$;

-- ================================================================
-- PASO 6: Actualizar función registrar_venta_transaccion
-- ================================================================

-- Eliminar versión anterior
DROP FUNCTION IF EXISTS registrar_venta_transaccion(UUID, UUID, UUID, DECIMAL, JSONB, TEXT, TEXT, TEXT);

-- Crear nueva versión con soporte para pagos mixtos
CREATE OR REPLACE FUNCTION registrar_venta_transaccion(
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
    v_current_stock DECIMAL;
    v_product_name TEXT;
    v_tiene_receta BOOLEAN;
    v_receta RECORD;
    v_cantidad_requerida DECIMAL;
    v_total_pagos DECIMAL := 0;
    v_payment_count INT;
    v_payment_method_legacy TEXT;
    v_container_stock INTEGER;
    v_container_name TEXT;
    v_product RECORD;
    v_para_llevar BOOLEAN;
    v_costo_envase DECIMAL;
BEGIN
    -- Validar que payments sea un array
    IF jsonb_typeof(p_payments) != 'array' THEN
        RAISE EXCEPTION 'p_payments debe ser un array JSON válido';
    END IF;
    
    -- Contar métodos de pago
    SELECT COUNT(*) INTO v_payment_count
    FROM jsonb_array_elements(p_payments);
    
    IF v_payment_count = 0 THEN
        RAISE EXCEPTION 'Debe especificar al menos un método de pago';
    END IF;
    
    -- Sumar y validar total de pagos
    SELECT SUM((p->>'amount')::DECIMAL) INTO v_total_pagos
    FROM jsonb_array_elements(p_payments) p;
    
    IF ABS(v_total_pagos - p_total) > 0.01 THEN
        RAISE EXCEPTION 'La suma de pagos (%) no coincide con el total (%). Diferencia: %',
            v_total_pagos, p_total, ABS(v_total_pagos - p_total);
    END IF;
    
    -- Generar número de venta único
    v_sale_number := 'VTA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Determinar payment_method legacy
    IF v_payment_count > 1 THEN
        v_payment_method_legacy := 'Mixto';
    ELSE
        SELECT p->>'method' INTO v_payment_method_legacy
        FROM jsonb_array_elements(p_payments) p
        LIMIT 1;
    END IF;
    
    -- Insertar orden de venta
    INSERT INTO sales_orders (
        organization_id, 
        client_id, 
        seller_id, 
        sale_number,
        total_amount, 
        payment_method,
        is_mixed_payment,
        order_type, 
        status,
        order_date
    )
    VALUES (
        p_org_id, 
        p_client_id, 
        p_seller_id,
        v_sale_number,
        p_total, 
        v_payment_method_legacy,
        (v_payment_count > 1),
        p_order_type, 
        p_status,
        NOW()
    )
    RETURNING id INTO v_order_id;
    
    -- Insertar métodos de pago
    FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
    LOOP
        INSERT INTO sales_order_payments (
            organization_id,
            sales_order_id,
            payment_method,
            amount,
            created_at
        ) VALUES (
            p_org_id,
            v_order_id,
            v_payment->>'method',
            (v_payment->>'amount')::DECIMAL,
            NOW()
        );
    END LOOP;
    
    -- Procesar items del pedido
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::UUID;
        v_cantidad := (v_item->>'cantidad')::INT;
        v_para_llevar := COALESCE((v_item->>'para_llevar')::BOOLEAN, false);
        v_costo_envase := COALESCE((v_item->>'costo_envase')::DECIMAL, 0);
        
        -- Obtener nombre del producto
        SELECT name INTO v_product_name
        FROM products
        WHERE id = v_product_id;
        
        -- Obtener detalles del producto
        SELECT 
            p.id,
            p.name,
            p.container_supply_id,
            p.takeaway_additional_cost,
            fi.current_stock
        INTO v_product
        FROM products p
        LEFT JOIN finished_inventory fi ON fi.product_id = p.id
        WHERE p.id = v_product_id;
        
        -- Insertar item de la orden
        INSERT INTO sales_order_items (
            organization_id,
            sales_order_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            subtotal,
            is_courtesy,
            discount_percent,
            para_llevar,
            container_cost
        ) VALUES (
            p_org_id,
            v_order_id,
            v_product_id,
            v_product_name,
            v_cantidad,
            (v_item->>'unit_price')::DECIMAL(10,2),
            (v_item->>'unit_price')::DECIMAL(10,2) * v_cantidad + v_costo_envase * v_cantidad,
            COALESCE((v_item->>'is_courtesy')::BOOLEAN, false),
            COALESCE((v_item->>'discount_val')::DECIMAL, 0),
            v_para_llevar,
            v_costo_envase
        );
        
        -- Validar y descontar inventario (solo si completed)
        IF p_status = 'completed' THEN
            
            -- Detectar si el producto tiene receta
            SELECT EXISTS (
                SELECT 1 
                FROM product_recipes 
                WHERE product_id = v_product_id
            ) INTO v_tiene_receta;
            
            IF v_tiene_receta THEN
                -- PRODUCTOS CON RECETA: Validar y descontar INSUMOS
                FOR v_receta IN 
                    SELECT pr.supply_id, pr.quantity, s.name as supply_name
                    FROM product_recipes pr
                    JOIN supplies s ON s.id = pr.supply_id
                    WHERE pr.product_id = v_product_id
                LOOP
                    v_cantidad_requerida := v_receta.quantity * v_cantidad;
                    
                    SELECT current_stock INTO v_current_stock
                    FROM supplies
                    WHERE id = v_receta.supply_id;
                    
                    IF v_current_stock < v_cantidad_requerida THEN
                        RAISE EXCEPTION 'Insumo insuficiente para "%": %. Stock actual: %, Se requiere: %',
                            v_product_name,
                            v_receta.supply_name,
                            v_current_stock,
                            v_cantidad_requerida;
                    END IF;
                    
                    UPDATE supplies
                    SET current_stock = current_stock - v_cantidad_requerida,
                        updated_at = NOW()
                    WHERE id = v_receta.supply_id;
                    
                END LOOP;
                
            ELSE
                -- PRODUCTOS SIN RECETA: Validar y descontar FINISHED_INVENTORY
                IF v_product.current_stock IS NOT NULL THEN
                    IF v_product.current_stock < v_cantidad THEN
                        RAISE EXCEPTION 'Stock insuficiente para "%". Stock actual: %, Se requiere: %',
                            v_product_name,
                            v_product.current_stock,
                            v_cantidad;
                    END IF;
                    
                    UPDATE finished_inventory
                    SET current_stock = current_stock - v_cantidad,
                        updated_at = NOW()
                    WHERE product_id = v_product_id;
                END IF;
            END IF;
            
            -- Manejar envases para llevar
            IF v_para_llevar AND v_product.container_supply_id IS NOT NULL THEN
                SELECT current_stock, name
                INTO v_container_stock, v_container_name
                FROM supplies
                WHERE id = v_product.container_supply_id;

                IF v_container_stock < v_cantidad THEN
                    RAISE WARNING 'Stock bajo de envases para %: quedan % unidades', 
                        v_product_name, v_container_stock;
                END IF;

                UPDATE supplies
                SET 
                    current_stock = current_stock - v_cantidad,
                    updated_at = NOW()
                WHERE id = v_product.container_supply_id;

                INSERT INTO supply_movements (
                    organization_id,
                    supply_id,
                    movement_type,
                    quantity,
                    unit_cost,
                    notes,
                    created_by
                ) VALUES (
                    p_org_id,
                    v_product.container_supply_id,
                    'sale',
                    -v_cantidad,
                    0,
                    'Envase usado en venta ' || v_sale_number || ' para ' || v_product_name,
                    p_seller_id
                );
            END IF;
            
        END IF;
    END LOOP;
    
    RETURN v_sale_number;
END;
$$;

COMMENT ON FUNCTION registrar_venta_transaccion IS 
'Registra una venta con soporte para pagos mixtos. Acepta múltiples métodos de pago y valida que la suma coincida con el total.';

-- ================================================================
-- VERIFICACIÓN FINAL
-- ================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migración completada exitosamente';
    RAISE NOTICE '✅ Tabla sales_order_payments creada';
    RAISE NOTICE '✅ Políticas RLS implementadas';
    RAISE NOTICE '✅ Índices de rendimiento agregados';
    RAISE NOTICE '✅ Función registrar_venta_transaccion actualizada';
    RAISE NOTICE '✅ Datos históricos migrados';
END $$;

-- Verificar que todo se aplicó correctamente
SELECT 
    'sales_order_payments' as tabla,
    COUNT(*) as registros_migrados
FROM sales_order_payments
UNION ALL
SELECT 
    'sales_orders con is_mixed_payment' as tabla,
    COUNT(*) as registros
FROM sales_orders
WHERE is_mixed_payment IS NOT NULL;
