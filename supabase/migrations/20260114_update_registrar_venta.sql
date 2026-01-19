-- Migration: Update registrar_venta_transaccion to handle takeaway containers
-- This function now deducts container supplies from inventory when items are marked as takeaway

CREATE OR REPLACE FUNCTION registrar_venta_transaccion(
  p_org_id UUID,
  p_client_id UUID,
  p_seller_id UUID,
  p_total DECIMAL,
  p_items JSONB,
  p_payment_method TEXT,
  p_order_type TEXT,
  p_status TEXT DEFAULT 'completed'
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_sale_id UUID;
  v_sale_number TEXT;
  v_item JSONB;
  v_product RECORD;
  v_container_stock INTEGER;
  v_container_name TEXT;
BEGIN
  -- Generate unique sale number
  v_sale_number := 'VTA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  -- Insert sale order
  INSERT INTO sales_orders (
    organization_id,
    client_id,
    seller_id,
    sale_number,
    total_amount,
    payment_method,
    order_type,
    status,
    order_date
  ) VALUES (
    p_org_id,
    p_client_id,
    p_seller_id,
    v_sale_number,
    p_total,
    p_payment_method,
    p_order_type,
    p_status,
    NOW()
  ) RETURNING id INTO v_sale_id;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    DECLARE
      v_product_id UUID := (v_item->>'product_id')::UUID;
      v_quantity INTEGER := (v_item->>'cantidad')::INTEGER;
      v_unit_price DECIMAL := (v_item->>'unit_price')::DECIMAL;
      v_is_courtesy BOOLEAN := COALESCE((v_item->>'is_courtesy')::BOOLEAN, false);
      v_discount DECIMAL := COALESCE((v_item->>'discount_val')::DECIMAL, 0);
      v_para_llevar BOOLEAN := COALESCE((v_item->>'para_llevar')::BOOLEAN, false);
      v_costo_envase DECIMAL := COALESCE((v_item->>'costo_envase')::DECIMAL, 0);
    BEGIN
      -- Get product details including container configuration
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

      -- Check product stock
      IF v_product.current_stock IS NOT NULL AND v_product.current_stock < v_quantity THEN
        RAISE EXCEPTION 'Stock insuficiente para %: disponible=%, solicitado=%', 
          v_product.name, v_product.current_stock, v_quantity;
      END IF;

      -- Insert sale item
      INSERT INTO sales_order_items (
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
        v_sale_id,
        v_product_id,
        v_product.name,
        v_quantity,
        v_unit_price,
        v_unit_price * v_quantity + v_costo_envase * v_quantity,
        v_is_courtesy,
        v_discount,
        v_para_llevar,
        v_costo_envase
      );

      -- Deduct product from finished inventory
      IF v_product.current_stock IS NOT NULL THEN
        UPDATE finished_inventory
        SET 
          current_stock = current_stock - v_quantity,
          updated_at = NOW()
        WHERE product_id = v_product_id;
      END IF;

      -- Handle takeaway containers
      IF v_para_llevar AND v_product.container_supply_id IS NOT NULL THEN
        -- Get container info
        SELECT current_stock, name
        INTO v_container_stock, v_container_name
        FROM supplies
        WHERE id = v_product.container_supply_id;

        -- Check container stock
        IF v_container_stock < v_quantity THEN
          RAISE WARNING 'Stock bajo de envases para %: quedan % unidades', 
            v_product.name, v_container_stock;
        END IF;

        -- Deduct containers from supplies inventory
        UPDATE supplies
        SET 
          current_stock = current_stock - v_quantity,
          updated_at = NOW()
        WHERE id = v_product.container_supply_id;

        -- Log container usage
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
          -v_quantity,
          0,
          'Envase usado en venta ' || v_sale_number || ' para ' || v_product.name,
          p_seller_id
        );
      END IF;
    END;
  END LOOP;

  RETURN v_sale_number;
END;
$$;

COMMENT ON FUNCTION registrar_venta_transaccion IS 'Registra venta y descuenta productos e insumos (envases) del inventario';
