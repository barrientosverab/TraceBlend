-- ========================================
-- SCRIPT DE OPTIMIZACIÓN DE BASE DE DATOS
-- TraceBlend - Supabase
-- ========================================
-- Basado en revisión exhaustiva del Dashboard
-- Fecha: 2025-12-26
-- Total de tablas: 29
-- ========================================

BEGIN;

-- ========================================
-- PARTE 1: ÍNDICES ADICIONALES PARA PERFORMANCE
-- ========================================
-- Estos índices mejoran consultas frecuentes identificadas en los servicios

-- Productos: Búsquedas por organización, nombre y categoría
CREATE INDEX IF NOT EXISTS idx_products_org_name 
ON products(organization_id, name);

CREATE INDEX IF NOT EXISTS idx_products_org_category_active 
ON products(organization_id, category, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_sku 
ON products(organization_id, sku) 
WHERE sku IS NOT NULL;

-- Clientes: Búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_clients_org_business_name 
ON clients(organization_id, business_name);

CREATE INDEX IF NOT EXISTS idx_clients_org_email 
ON clients(organization_id, email) 
WHERE email IS NOT NULL;

-- Perfiles: Búsqueda por email y rol
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(LOWER(email));

CREATE INDEX IF NOT EXISTS idx_profiles_org_role 
ON profiles(organization_id, role);

-- Inventario: Estado y fechas
CREATE INDEX IF NOT EXISTS idx_raw_batches_org_state 
ON raw_inventory_batches(organization_id, current_state, purchase_date DESC);

CREATE INDEX IF NOT EXISTS idx_supplies_org_name 
ON supplies_inventory(organization_id, name);

CREATE INDEX IF NOT EXISTS idx_finished_org_product 
ON finished_inventory(organization_id, product_id);

-- Recetas: Supply lookup
CREATE INDEX IF NOT EXISTS idx_product_recipes_supply 
ON product_recipes(supply_id, product_id);

-- Sales: Mejoras adicionales
CREATE INDEX IF NOT EXISTS idx_sales_orders_client 
ON sales_orders(organization_id, client_id, order_date DESC);

CREATE INDEX IF NOT EXISTS idx_sales_orders_seller 
ON sales_orders(organization_id, seller_id, order_date DESC);

-- ========================================
-- PARTE 2: CONSTRAINTS DE VALIDACIÓN
-- ========================================

-- Validaciones numéricas en raw_inventory_batches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_humidity_valid'
  ) THEN
    ALTER TABLE raw_inventory_batches
    ADD CONSTRAINT chk_humidity_valid 
    CHECK (humidity_percentage >= 0 AND humidity_percentage <= 100);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_quantities_positive'
  ) THEN
    ALTER TABLE raw_inventory_batches
    ADD CONSTRAINT chk_quantities_positive 
    CHECK (initial_quantity > 0 AND current_quantity >= 0);
  END IF;
END$$;

-- Precios positivos en productos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_sale_price_positive'
  ) THEN
    ALTER TABLE products
    ADD CONSTRAINT chk_sale_price_positive 
    CHECK (sale_price > 0);
  END IF;
END$$;

-- Scores de catación válidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_cupping_scores'
  ) THEN
    ALTER TABLE lab_reports_cupping
    ADD CONSTRAINT chk_cupping_scores 
    CHECK (
      aroma_score BETWEEN 0 AND 10 AND
      flavor_score BETWEEN 0 AND 10 AND
      aftertaste_score BETWEEN 0 AND 10 AND
      acidity_score BETWEEN 0 AND 10 AND
      body_score BETWEEN 0 AND 10 AND
      balance_score BETWEEN 0 AND 10 AND
      final_score BETWEEN 0 AND 100
    );
  END IF;
END$$;

-- Stock no negativo en finished_inventory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_finished_stock_positive'
  ) THEN
    ALTER TABLE finished_inventory
    ADD CONSTRAINT chk_finished_stock_positive 
    CHECK (current_stock >= 0);
  END IF;
END$$;

-- Stock no negativo en supplies_inventory
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_supplies_stock_positive'
  ) THEN
    ALTER TABLE supplies_inventory
    ADD CONSTRAINT chk_supplies_stock_positive 
    CHECK (current_stock >= 0);
  END IF;
END$$;

-- ========================================
-- PARTE 3: POLÍTICAS RLS CRÍTICAS
-- ========================================
-- HALLAZGO IMPORTANTE: lab_reports tiene RLS habilitado pero SIN políticas
-- Esto significa que los usuarios normales NO pueden acceder a la tabla

-- Política para lab_reports (CRÍTICO - actualmente sin políticas)
DROP POLICY IF EXISTS org_isolation_lab_reports ON lab_reports;
CREATE POLICY org_isolation_lab_reports ON lab_reports
FOR ALL
USING (organization_id = (
  SELECT organization_id 
  FROM profiles 
  WHERE id = auth.uid()
));

-- Política para lab_reports_physical
DROP POLICY IF EXISTS org_isolation_lab_reports_physical ON lab_reports_physical;
CREATE POLICY org_isolation_lab_reports_physical ON lab_reports_physical
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM lab_reports 
    WHERE lab_reports.id = lab_reports_physical.lab_report_id
    AND lab_reports.organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Política para lab_reports_cupping
DROP POLICY IF EXISTS org_isolation_lab_reports_cupping ON lab_reports_cupping;
CREATE POLICY org_isolation_lab_reports_cupping ON lab_reports_cupping
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM lab_reports 
    WHERE lab_reports.id = lab_reports_cupping.lab_report_id
    AND lab_reports.organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- Política para cupping_defects
DROP POLICY IF EXISTS org_isolation_cupping_defects ON cupping_defects;
CREATE POLICY org_isolation_cupping_defects ON cupping_defects
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM lab_reports_cupping lrc
    JOIN lab_reports lr ON lr.id = lrc.lab_report_id
    WHERE lrc.id = cupping_defects.cupping_report_id
    AND lr.organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- ========================================
-- PARTE 4: CAMPOS DE AUDITORÍA
-- ========================================

-- Agregar updated_at a tablas importantes (si no existe)
DO $$
BEGIN
  -- Products
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Sales Orders
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_orders' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE sales_orders 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Clients
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE clients 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Suppliers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'suppliers' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE suppliers 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END$$;

-- Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas con updated_at
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_orders_updated_at ON sales_orders;
CREATE TRIGGER update_sales_orders_updated_at 
BEFORE UPDATE ON sales_orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at 
BEFORE UPDATE ON suppliers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PARTE 5: OPTIMIZACIÓN DE VISTAS MATERIALIZADAS
-- ========================================

-- Vista materializada para ranking de productos (consulta muy frecuente)
DROP MATERIALIZED VIEW IF EXISTS mv_product_ranking CASCADE;
CREATE MATERIALIZED VIEW mv_product_ranking AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.category,
    p.sale_price,
    SUM(soi.quantity) as total_sold,
    SUM(soi.quantity * soi.unit_price) as total_revenue,
    COUNT(DISTINCT so.id) as times_ordered,
    RANK() OVER (PARTITION BY so.organization_id ORDER BY SUM(soi.quantity) DESC) as rank_by_quantity,
    RANK() OVER (PARTITION BY so.organization_id ORDER BY SUM(soi.quantity * soi.unit_price) DESC) as rank_by_revenue,
    so.organization_id,
    MAX(so.order_date) as last_sold_date
FROM sales_orders so
JOIN sales_order_items soi ON soi.sales_order_id = so.id
JOIN products p ON p.id = soi.product_id
WHERE so.status = 'completed'
  AND so.order_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY p.id, p.name, p.category, p.sale_price, so.organization_id;

-- Índice en vista materializada
CREATE UNIQUE INDEX idx_mv_product_ranking_org_product 
ON mv_product_ranking(organization_id, product_id);

CREATE INDEX idx_mv_product_ranking_rank 
ON mv_product_ranking(organization_id, rank_by_quantity);

-- Función para refrescar la vista materializada
CREATE OR REPLACE FUNCTION refresh_product_ranking()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_product_ranking;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- FINALIZAR TRANSACCIÓN
-- ========================================
COMMIT;

-- ========================================
-- VERIFICACIONES POST-OPTIMIZACIÓN
-- ========================================

-- Verificar que todas las políticas RLS están activas
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '⚠️  RLS Disabled'
  END as rls_status,
  (
    SELECT COUNT(*) 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = pg_tables.tablename
  ) as policy_count
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'v_%'
  AND tablename NOT LIKE 'mv_%'
ORDER BY tablename;

-- Verificar índices creados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Contar constraints por tabla
SELECT 
  tc.table_name,
  COUNT(*) as constraint_count,
  STRING_AGG(tc.constraint_type, ', ') as constraint_types
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('CHECK', 'FOREIGN KEY', 'UNIQUE')
GROUP BY tc.table_name
ORDER BY tc.table_name;

-- ========================================
-- RECOMENDACIONES ADICIONALES
-- ========================================
-- 
-- 1. REFRESCAR VISTA MATERIALIZADA PERIÓDICAMENTE
--    Crear un cron job en Supabase (pg_cron extension):
--    SELECT cron.schedule('refresh-product-ranking', '0 */6 * * *', 'SELECT refresh_product_ranking()');
--
-- 2. MONITOREAR QUERIES LENTAS
--    Habilitar pg_stat_statements en el dashboard de Supabase
--
-- 3. VACUUMING
--    Asegurarse de que autovacuum está habilitado (debería estarlo por defecto)
--
-- 4. CONSIDERAR FOREIGN KEYS
--    Agregar foreign keys explícitas en una migración futura
--    Requiere análisis cuidadoso de datos existentes
--
-- 5. REALTIME (Actualmente deshabilitado en todas las tablas)
--    Si se necesita, habilitar selectivamente solo en tablas críticas
--    Ejemplo: ALTER publication supabase_realtime ADD TABLE products;
--
-- ========================================
