-- ========================================================
-- OPTIMIZACIÓN DE BASE DE DATOS V2 — TraceBlend
-- Fecha: 2026-03-01
-- ========================================================
-- CAMBIOS:
-- 1. Eliminar tabla supply_movements (sin uso)
-- 2. Eliminar columna plan_type de organizations (legacy)
-- 3. Eliminar vistas huérfanas del DB (vw_*, recent_activity_view)
-- 4. Crear/Recrear 4 vistas útiles para dashboard y reportes
-- 5. Agregar índices de rendimiento adicionales
-- 6. Implementar RLS por rol (Nivel 2 Seguridad)
-- ========================================================

BEGIN;

-- ========================================================
-- PARTE 1: LIMPIEZA — Eliminar elementos sin uso
-- ========================================================

-- 1a. Eliminar tabla supply_movements (nunca integrada en frontend)
DROP TABLE IF EXISTS supply_movements CASCADE;

-- 1b. Eliminar columna legacy plan_type de organizations
-- La app usa subscription_plan_id (FK) como mecanismo autorizado
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE organizations DROP COLUMN plan_type;
  END IF;
END$$;

-- 1c. Eliminar vistas huérfanas (creadas en DB pero sin uso en servicios)
DROP VIEW IF EXISTS vw_inventory_status CASCADE;
DROP VIEW IF EXISTS vw_roast_costs CASCADE;
DROP VIEW IF EXISTS vw_sales_detailed CASCADE;
DROP VIEW IF EXISTS recent_activity_view CASCADE;

-- ========================================================
-- PARTE 2: CREAR VISTAS ÚTILES
-- ========================================================

-- VISTA 1: Estado de Inventario Completo
-- Consolida supplies_inventory + finished_inventory en una sola vista
CREATE OR REPLACE VIEW vw_inventory_status AS
SELECT
    'supply' AS inventory_type,
    si.id,
    si.name,
    si.unit_measure,
    si.current_stock,
    si.low_stock_threshold,
    si.unit_cost,
    CASE
        WHEN si.current_stock <= COALESCE(si.low_stock_threshold, 0) THEN 'critical'
        WHEN si.current_stock <= COALESCE(si.low_stock_threshold, 0) * 2 THEN 'low'
        ELSE 'ok'
    END AS stock_status,
    si.organization_id,
    si.updated_at
FROM supplies_inventory si
UNION ALL
SELECT
    'finished' AS inventory_type,
    fi.id,
    p.name,
    'und' AS unit_measure,
    fi.current_stock,
    5 AS low_stock_threshold,  -- default threshold para productos
    p.sale_price AS unit_cost,
    CASE
        WHEN fi.current_stock <= 0 THEN 'critical'
        WHEN fi.current_stock <= 5 THEN 'low'
        ELSE 'ok'
    END AS stock_status,
    fi.organization_id,
    fi.last_updated AS updated_at
FROM finished_inventory fi
JOIN products p ON p.id = fi.product_id;

-- VISTA 2: Costos de Tueste
-- Calcula el costo real de cada lote de tueste incluyendo café verde usado
CREATE OR REPLACE VIEW vw_roast_costs AS
SELECT
    rb.id AS roast_batch_id,
    rb.roast_date,
    rb.operator_name,
    m.name AS machine_name,
    rb.green_weight_input,
    rb.roasted_weight_output,
    rb.total_time_seconds,
    CASE
        WHEN rb.green_weight_input > 0 AND rb.roasted_weight_output > 0
        THEN ROUND((1 - rb.roasted_weight_output / rb.green_weight_input) * 100, 2)
        ELSE NULL
    END AS shrinkage_pct,
    COALESCE(SUM(rbi.quantity_used_kg * gcw.unit_cost_local), 0) AS total_green_cost,
    CASE
        WHEN rb.roasted_weight_output > 0
        THEN ROUND(COALESCE(SUM(rbi.quantity_used_kg * gcw.unit_cost_local), 0) / rb.roasted_weight_output, 2)
        ELSE NULL
    END AS cost_per_kg_roasted,
    rb.organization_id,
    rb.created_at
FROM roast_batches rb
LEFT JOIN machines m ON m.id = rb.machine_id
LEFT JOIN roast_batch_inputs rbi ON rbi.roast_batch_id = rb.id
LEFT JOIN green_coffee_warehouse gcw ON gcw.id = rbi.green_inventory_id
GROUP BY rb.id, rb.roast_date, rb.operator_name, m.name,
         rb.green_weight_input, rb.roasted_weight_output,
         rb.total_time_seconds, rb.organization_id, rb.created_at;

-- VISTA 3: Ventas Detalladas
-- Une orders + items + productos + clientes para reportes
CREATE OR REPLACE VIEW vw_sales_detailed AS
SELECT
    so.id AS order_id,
    so.sale_number,
    so.order_date,
    so.order_type,
    so.status,
    so.total_amount,
    so.payment_method,
    so.is_mixed_payment,
    c.business_name AS client_name,
    pr.first_name AS seller_name,
    soi.id AS item_id,
    soi.quantity,
    soi.unit_price,
    soi.subtotal,
    soi.discount_amount,
    soi.discount_percent,
    soi.is_courtesy,
    soi.para_llevar,
    COALESCE(soi.product_name, p.name, gcw.name_ref) AS product_name,
    p.category AS product_category,
    so.organization_id
FROM sales_orders so
LEFT JOIN clients c ON c.id = so.client_id
LEFT JOIN profiles pr ON pr.id = so.seller_id
JOIN sales_order_items soi ON soi.sales_order_id = so.id
LEFT JOIN products p ON p.id = soi.product_id
LEFT JOIN green_coffee_warehouse gcw ON gcw.id = soi.green_inventory_id;

-- VISTA 4: Actividad Reciente
-- Últimas acciones en la organización para el dashboard
CREATE OR REPLACE VIEW vw_recent_activity AS
SELECT * FROM (
    -- Ventas recientes
    SELECT
        so.id,
        'venta' AS activity_type,
        'Venta ' || COALESCE(so.sale_number, so.invoice_number, '#' || LEFT(so.id::text, 8)) ||
        ' por ' || so.total_amount AS description,
        so.order_date AS activity_date,
        so.organization_id
    FROM sales_orders so
    WHERE so.order_date >= CURRENT_DATE - INTERVAL '7 days'

    UNION ALL

    -- Tuestes recientes
    SELECT
        rb.id,
        'tueste' AS activity_type,
        'Tueste ' || COALESCE(rb.green_weight_input::text, '?') || 'kg' ||
        COALESCE(' → ' || rb.roasted_weight_output::text || 'kg', '') AS description,
        rb.roast_date AS activity_date,
        rb.organization_id
    FROM roast_batches rb
    WHERE rb.roast_date >= CURRENT_DATE - INTERVAL '7 days'

    UNION ALL

    -- Empaques recientes
    SELECT
        pl.id,
        'empaque' AS activity_type,
        'Empaque ' || pl.units_created || ' unidades' AS description,
        pl.packaging_date AS activity_date,
        pl.organization_id
    FROM packaging_logs pl
    WHERE pl.packaging_date >= CURRENT_DATE - INTERVAL '7 days'

    UNION ALL

    -- Reportes de laboratorio recientes
    SELECT
        lr.id,
        'laboratorio' AS activity_type,
        'Análisis ' || COALESCE(lr.report_type::text, 'lab') ||
        COALESCE(' — ' || lr.analyst_name, '') AS description,
        lr.report_date::timestamp AS activity_date,
        lr.organization_id
    FROM lab_reports lr
    WHERE lr.report_date >= CURRENT_DATE - INTERVAL '7 days'
) AS activity
ORDER BY activity_date DESC;

-- ========================================================
-- PARTE 3: ÍNDICES DE RENDIMIENTO
-- ========================================================

-- Ventas por fecha y estado (consulta más frecuente)
CREATE INDEX IF NOT EXISTS idx_sales_orders_org_date_status
ON sales_orders(organization_id, order_date DESC, status);

-- Pagos mixtos: búsqueda por orden
CREATE INDEX IF NOT EXISTS idx_sales_order_payments_order
ON sales_order_payments(sales_order_id, organization_id);

-- Empaque por fecha
CREATE INDEX IF NOT EXISTS idx_packaging_logs_org_date
ON packaging_logs(organization_id, packaging_date DESC);

-- Tueste por fecha
CREATE INDEX IF NOT EXISTS idx_roast_batches_org_date
ON roast_batches(organization_id, roast_date DESC);

-- Lab reports por lote
CREATE INDEX IF NOT EXISTS idx_lab_reports_batch
ON lab_reports(batch_id, organization_id);

-- Cierres de caja por fecha
CREATE INDEX IF NOT EXISTS idx_cash_closures_org_date
ON cash_closures(organization_id, closed_at DESC);

-- Aperturas de caja por fecha
CREATE INDEX IF NOT EXISTS idx_cash_openings_org_date
ON cash_openings(organization_id, opened_at DESC);

-- ========================================================
-- PARTE 4: RLS POR ROL (Nivel 2 Seguridad)
-- ========================================================
-- Modelo: Cada rol solo accede a los módulos que le corresponden
-- administrador = todo, viewer = solo lectura

-- Función helper: obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Función helper: obtener org_id del usuario actual
CREATE OR REPLACE FUNCTION get_current_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- --------------------------------------------------------
-- MACRO: Política base por organización
-- Todas las tablas con organization_id usan este patrón
-- --------------------------------------------------------

-- organizations: solo admin y viewer pueden ver, solo super_admin puede modificar
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_select_own ON organizations;
CREATE POLICY org_select_own ON organizations
FOR SELECT USING (
    id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS org_update_admin ON organizations;
CREATE POLICY org_update_admin ON organizations
FOR UPDATE USING (
    (id = get_current_user_org_id() AND get_current_user_role() = 'administrador')
    OR is_super_admin()
);

-- profiles: cada usuario ve los de su org, solo admin puede modificar otros
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select_org ON profiles;
CREATE POLICY profiles_select_org ON profiles
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR id = auth.uid()
    OR is_super_admin()
);
DROP POLICY IF EXISTS profiles_update_own ON profiles;
CREATE POLICY profiles_update_own ON profiles
FOR UPDATE USING (
    id = auth.uid()
    OR (organization_id = get_current_user_org_id() AND get_current_user_role() = 'administrador')
    OR is_super_admin()
);
DROP POLICY IF EXISTS profiles_insert ON profiles;
CREATE POLICY profiles_insert ON profiles
FOR INSERT WITH CHECK (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);

-- --------------------------------------------------------
-- MÓDULO VENTAS: vendedor, administrador
-- Tablas: sales_orders, sales_order_items, sales_order_payments, clients
-- --------------------------------------------------------

-- sales_orders
ALTER TABLE sales_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sales_orders_select ON sales_orders;
CREATE POLICY sales_orders_select ON sales_orders
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS sales_orders_insert ON sales_orders;
CREATE POLICY sales_orders_insert ON sales_orders
FOR INSERT WITH CHECK (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'vendedor')
    OR is_super_admin()
);
DROP POLICY IF EXISTS sales_orders_update ON sales_orders;
CREATE POLICY sales_orders_update ON sales_orders
FOR UPDATE USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'vendedor')
    OR is_super_admin()
);
DROP POLICY IF EXISTS sales_orders_delete ON sales_orders;
CREATE POLICY sales_orders_delete ON sales_orders
FOR DELETE USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() = 'administrador'
    OR is_super_admin()
);

-- sales_order_items
ALTER TABLE sales_order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sales_order_items_select ON sales_order_items;
CREATE POLICY sales_order_items_select ON sales_order_items
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS sales_order_items_write ON sales_order_items;
CREATE POLICY sales_order_items_write ON sales_order_items
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'vendedor')
    OR is_super_admin()
);

-- sales_order_payments
ALTER TABLE sales_order_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sales_order_payments_select ON sales_order_payments;
CREATE POLICY sales_order_payments_select ON sales_order_payments
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS sales_order_payments_write ON sales_order_payments;
CREATE POLICY sales_order_payments_write ON sales_order_payments
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'vendedor')
    OR is_super_admin()
);

-- clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clients_select ON clients;
CREATE POLICY clients_select ON clients
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS clients_write ON clients;
CREATE POLICY clients_write ON clients
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'vendedor')
    OR is_super_admin()
);

-- --------------------------------------------------------
-- MÓDULO CAJA: vendedor, administrador
-- Tablas: cash_openings, cash_closures
-- --------------------------------------------------------

ALTER TABLE cash_openings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cash_openings_select ON cash_openings;
CREATE POLICY cash_openings_select ON cash_openings
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS cash_openings_write ON cash_openings;
CREATE POLICY cash_openings_write ON cash_openings
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'vendedor')
    OR is_super_admin()
);

ALTER TABLE cash_closures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cash_closures_select ON cash_closures;
CREATE POLICY cash_closures_select ON cash_closures
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS cash_closures_write ON cash_closures;
CREATE POLICY cash_closures_write ON cash_closures
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'vendedor')
    OR is_super_admin()
);

-- --------------------------------------------------------
-- MÓDULO TUESTE: tostador, administrador
-- Tablas: roast_batches, roast_batch_inputs, machines
-- --------------------------------------------------------

ALTER TABLE roast_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS roast_batches_select ON roast_batches;
CREATE POLICY roast_batches_select ON roast_batches
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS roast_batches_write ON roast_batches;
CREATE POLICY roast_batches_write ON roast_batches
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'tostador')
    OR is_super_admin()
);

ALTER TABLE roast_batch_inputs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS roast_batch_inputs_select ON roast_batch_inputs;
CREATE POLICY roast_batch_inputs_select ON roast_batch_inputs
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS roast_batch_inputs_write ON roast_batch_inputs;
CREATE POLICY roast_batch_inputs_write ON roast_batch_inputs
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'tostador')
    OR is_super_admin()
);

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS machines_select ON machines;
CREATE POLICY machines_select ON machines
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS machines_write ON machines;
CREATE POLICY machines_write ON machines
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() = 'administrador'
    OR is_super_admin()
);

-- --------------------------------------------------------
-- MÓDULO LABORATORIO: laboratorio, tostador, administrador
-- Tablas: lab_reports, lab_reports_cupping, lab_reports_physical, cupping_defects
-- --------------------------------------------------------

ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lab_reports_select ON lab_reports;
CREATE POLICY lab_reports_select ON lab_reports
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS lab_reports_write ON lab_reports;
CREATE POLICY lab_reports_write ON lab_reports
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'laboratorio', 'tostador')
    OR is_super_admin()
);

-- lab_reports_cupping (hereda aislamiento desde lab_reports)
ALTER TABLE lab_reports_cupping ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lab_reports_cupping_access ON lab_reports_cupping;
CREATE POLICY lab_reports_cupping_access ON lab_reports_cupping
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM lab_reports lr
        WHERE lr.id = lab_reports_cupping.lab_report_id
        AND lr.organization_id = get_current_user_org_id()
    )
    OR is_super_admin()
);

-- lab_reports_physical
ALTER TABLE lab_reports_physical ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS lab_reports_physical_access ON lab_reports_physical;
CREATE POLICY lab_reports_physical_access ON lab_reports_physical
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM lab_reports lr
        WHERE lr.id = lab_reports_physical.lab_report_id
        AND lr.organization_id = get_current_user_org_id()
    )
    OR is_super_admin()
);

-- cupping_defects
ALTER TABLE cupping_defects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cupping_defects_access ON cupping_defects;
CREATE POLICY cupping_defects_access ON cupping_defects
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM lab_reports_cupping lrc
        JOIN lab_reports lr ON lr.id = lrc.lab_report_id
        WHERE lrc.id = cupping_defects.cupping_report_id
        AND lr.organization_id = get_current_user_org_id()
    )
    OR is_super_admin()
);

-- --------------------------------------------------------
-- MÓDULO SUPPLY CHAIN: operador, tostador, administrador
-- Tablas: suppliers, farms, raw_inventory_batches,
--         milling_processes, milling_inputs, green_coffee_warehouse
-- --------------------------------------------------------

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS suppliers_select ON suppliers;
CREATE POLICY suppliers_select ON suppliers
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS suppliers_write ON suppliers;
CREATE POLICY suppliers_write ON suppliers
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'operador')
    OR is_super_admin()
);

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS farms_select ON farms;
CREATE POLICY farms_select ON farms
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS farms_write ON farms;
CREATE POLICY farms_write ON farms
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'operador')
    OR is_super_admin()
);

ALTER TABLE raw_inventory_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS raw_inventory_select ON raw_inventory_batches;
CREATE POLICY raw_inventory_select ON raw_inventory_batches
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS raw_inventory_write ON raw_inventory_batches;
CREATE POLICY raw_inventory_write ON raw_inventory_batches
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'operador', 'tostador')
    OR is_super_admin()
);

ALTER TABLE milling_processes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS milling_processes_select ON milling_processes;
CREATE POLICY milling_processes_select ON milling_processes
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS milling_processes_write ON milling_processes;
CREATE POLICY milling_processes_write ON milling_processes
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'operador')
    OR is_super_admin()
);

ALTER TABLE milling_inputs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS milling_inputs_select ON milling_inputs;
CREATE POLICY milling_inputs_select ON milling_inputs
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS milling_inputs_write ON milling_inputs;
CREATE POLICY milling_inputs_write ON milling_inputs
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'operador')
    OR is_super_admin()
);

ALTER TABLE green_coffee_warehouse ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS green_coffee_select ON green_coffee_warehouse;
CREATE POLICY green_coffee_select ON green_coffee_warehouse
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS green_coffee_write ON green_coffee_warehouse;
CREATE POLICY green_coffee_write ON green_coffee_warehouse
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'operador', 'tostador')
    OR is_super_admin()
);

-- --------------------------------------------------------
-- MÓDULO PRODUCCIÓN / INVENTARIO: operador, administrador
-- Tablas: packaging_logs, finished_inventory, supplies_inventory
-- --------------------------------------------------------

ALTER TABLE packaging_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS packaging_logs_select ON packaging_logs;
CREATE POLICY packaging_logs_select ON packaging_logs
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS packaging_logs_write ON packaging_logs;
CREATE POLICY packaging_logs_write ON packaging_logs
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'operador')
    OR is_super_admin()
);

ALTER TABLE finished_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS finished_inventory_select ON finished_inventory;
CREATE POLICY finished_inventory_select ON finished_inventory
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS finished_inventory_write ON finished_inventory;
CREATE POLICY finished_inventory_write ON finished_inventory
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'operador', 'vendedor')
    OR is_super_admin()
);

ALTER TABLE supplies_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS supplies_inventory_select ON supplies_inventory;
CREATE POLICY supplies_inventory_select ON supplies_inventory
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS supplies_inventory_write ON supplies_inventory;
CREATE POLICY supplies_inventory_write ON supplies_inventory
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'operador')
    OR is_super_admin()
);

-- --------------------------------------------------------
-- MÓDULO PRODUCTOS / CATÁLOGO: administrador
-- Tablas: products, product_recipes, product_promotions
-- --------------------------------------------------------

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS products_select ON products;
CREATE POLICY products_select ON products
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS products_write ON products;
CREATE POLICY products_write ON products
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() = 'administrador'
    OR is_super_admin()
);

ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_recipes_select ON product_recipes;
CREATE POLICY product_recipes_select ON product_recipes
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS product_recipes_write ON product_recipes;
CREATE POLICY product_recipes_write ON product_recipes
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() = 'administrador'
    OR is_super_admin()
);

ALTER TABLE product_promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS product_promotions_select ON product_promotions;
CREATE POLICY product_promotions_select ON product_promotions
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS product_promotions_write ON product_promotions;
CREATE POLICY product_promotions_write ON product_promotions
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() = 'administrador'
    OR is_super_admin()
);

-- --------------------------------------------------------
-- MÓDULO FINANZAS: administrador
-- Tablas: fixed_expenses, expense_ledger
-- --------------------------------------------------------

ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fixed_expenses_select ON fixed_expenses;
CREATE POLICY fixed_expenses_select ON fixed_expenses
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS fixed_expenses_write ON fixed_expenses;
CREATE POLICY fixed_expenses_write ON fixed_expenses
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() = 'administrador'
    OR is_super_admin()
);

ALTER TABLE expense_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS expense_ledger_select ON expense_ledger;
CREATE POLICY expense_ledger_select ON expense_ledger
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    OR is_super_admin()
);
DROP POLICY IF EXISTS expense_ledger_write ON expense_ledger;
CREATE POLICY expense_ledger_write ON expense_ledger
FOR ALL USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() IN ('administrador', 'operador')
    OR is_super_admin()
);

-- --------------------------------------------------------
-- MÓDULO SUSCRIPCIONES: solo super_admin puede modificar
-- Tablas: subscription_plans, subscription_plan_features, billing_history
-- --------------------------------------------------------

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscription_plans_select ON subscription_plans;
CREATE POLICY subscription_plans_select ON subscription_plans
FOR SELECT USING (true);  -- todos pueden ver los planes
DROP POLICY IF EXISTS subscription_plans_write ON subscription_plans;
CREATE POLICY subscription_plans_write ON subscription_plans
FOR ALL USING (is_super_admin());

ALTER TABLE subscription_plan_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS subscription_plan_features_select ON subscription_plan_features;
CREATE POLICY subscription_plan_features_select ON subscription_plan_features
FOR SELECT USING (true);  -- todos pueden leer features
DROP POLICY IF EXISTS subscription_plan_features_write ON subscription_plan_features;
CREATE POLICY subscription_plan_features_write ON subscription_plan_features
FOR ALL USING (is_super_admin());

ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS billing_history_select ON billing_history;
CREATE POLICY billing_history_select ON billing_history
FOR SELECT USING (
    organization_id = get_current_user_org_id()
    AND get_current_user_role() = 'administrador'
    OR is_super_admin()
);
DROP POLICY IF EXISTS billing_history_write ON billing_history;
CREATE POLICY billing_history_write ON billing_history
FOR ALL USING (is_super_admin());

COMMIT;

-- ========================================================
-- VERIFICACIONES POST-MIGRACIÓN
-- ========================================================

-- 1. Verificar tabla eliminada
SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'supply_movements' AND schemaname = 'public')
    THEN '✅ supply_movements eliminada correctamente'
    ELSE '❌ supply_movements aún existe'
END AS check_supply_movements;

-- 2. Verificar columna eliminada
SELECT CASE
    WHEN NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organizations' AND column_name = 'plan_type'
    )
    THEN '✅ plan_type eliminada de organizations'
    ELSE '❌ plan_type aún existe'
END AS check_plan_type;

-- 3. Verificar vistas creadas
SELECT table_name, '✅' AS status
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN ('vw_inventory_status', 'vw_roast_costs', 'vw_sales_detailed', 'vw_recent_activity')
ORDER BY table_name;

-- 4. Verificar RLS habilitado en todas las tablas
SELECT
    tablename,
    CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '⚠️ RLS OFF' END AS rls_status,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = pg_tables.tablename AND schemaname = 'public') AS policy_count
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'vw_%'
AND tablename NOT LIKE 'v_%'
AND tablename NOT LIKE 'mv_%'
ORDER BY tablename;

-- 5. Contar índices nuevos
SELECT COUNT(*) AS new_indexes_count
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%';
