-- ============================================================
-- Migración: Correcciones críticas post-auditoría BD
-- Fecha: 2026-02-23
-- Descripción: Agrega columnas faltantes que la función
--              registrar_venta_transaccion intenta usar pero
--              que no existen en la BD real, causando errores
--              al registrar ventas.
-- ============================================================

-- ============================================================
-- 1. sales_orders: agregar sale_number
--    La función genera un código VTA-YYYYMMDD-XXXX pero la
--    columna no existe en la tabla.
-- ============================================================
ALTER TABLE public.sales_orders
  ADD COLUMN IF NOT EXISTS sale_number TEXT;

-- Índice único para evitar duplicados de número de venta
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_orders_sale_number
  ON public.sales_orders (sale_number)
  WHERE sale_number IS NOT NULL;

COMMENT ON COLUMN public.sales_orders.sale_number
  IS 'Número de venta único generado automáticamente. Formato: VTA-YYYYMMDD-XXXX';

-- ============================================================
-- 2. sales_order_items: agregar product_name y discount_percent
--    La función inserta estos campos pero las columnas no existen.
-- ============================================================
ALTER TABLE public.sales_order_items
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) DEFAULT 0;

COMMENT ON COLUMN public.sales_order_items.product_name
  IS 'Nombre del producto al momento de la venta (desnormalizado para historial)';

COMMENT ON COLUMN public.sales_order_items.discount_percent
  IS 'Porcentaje de descuento aplicado al ítem';

-- ============================================================
-- 3. Rellenar product_name en registros históricos (si los hay)
--    Para mantener consistencia con registros existentes
-- ============================================================
UPDATE public.sales_order_items soi
SET product_name = p.name
FROM public.products p
WHERE soi.product_id = p.id
  AND soi.product_name IS NULL;

-- ============================================================
-- 4. Verificación final
-- ============================================================
DO $$
BEGIN
  -- Verificar sale_number
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_orders'
      AND column_name = 'sale_number'
  ) THEN
    RAISE NOTICE '✅ sales_orders.sale_number creada correctamente';
  ELSE
    RAISE WARNING '❌ sales_orders.sale_number NO fue creada';
  END IF;

  -- Verificar product_name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_order_items'
      AND column_name = 'product_name'
  ) THEN
    RAISE NOTICE '✅ sales_order_items.product_name creada correctamente';
  ELSE
    RAISE WARNING '❌ sales_order_items.product_name NO fue creada';
  END IF;

  -- Verificar discount_percent
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sales_order_items'
      AND column_name = 'discount_percent'
  ) THEN
    RAISE NOTICE '✅ sales_order_items.discount_percent creada correctamente';
  ELSE
    RAISE WARNING '❌ sales_order_items.discount_percent NO fue creada';
  END IF;
END $$;
