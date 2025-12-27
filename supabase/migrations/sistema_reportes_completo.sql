-- ========================================
-- SISTEMA DE REPORTES Y ANALÍTICAS - VERSIÓN FINAL
-- ========================================
-- Este script crea todas las vistas y funciones necesarias
-- para el sistema de reportes del frontend
-- 
-- CORREGIDO: Nombres de columnas verificados con el esquema real
-- ========================================

-- ========================================
-- PASO 1: LIMPIAR OBJETOS ANTERIORES
-- ========================================

-- Eliminar funciones anteriores
DROP FUNCTION IF EXISTS get_sales_report(UUID, DATE, DATE, TEXT);
DROP FUNCTION IF EXISTS get_top_products(UUID, INT, INT);
DROP FUNCTION IF EXISTS get_product_trends(UUID, UUID, INT);

-- Eliminar vistas anteriores
DROP VIEW IF EXISTS v_sales_summary;
DROP VIEW IF EXISTS v_product_ranking;
DROP VIEW IF EXISTS v_sales_trends;
DROP VIEW IF EXISTS v_production_summary;
DROP VIEW IF EXISTS v_expense_summary;
DROP VIEW IF EXISTS v_financial_comparison;
DROP VIEW IF EXISTS v_product_seasonality;

-- ========================================
-- PASO 2: CREAR VISTAS PARA REPORTES
-- ========================================

-- VISTA 1: Resumen de Ventas por Producto
CREATE OR REPLACE VIEW v_sales_summary AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.category,
    DATE_TRUNC('month', so.order_date) as month,
    COUNT(DISTINCT so.id) as order_count,
    SUM(soi.quantity) as total_quantity_sold,
    SUM(soi.quantity * soi.unit_price) as total_revenue,
    AVG(soi.unit_price) as avg_price,
    so.organization_id
FROM sales_orders so
JOIN sales_order_items soi ON soi.sales_order_id = so.id
JOIN products p ON p.id = soi.product_id
WHERE so.status = 'completed'
GROUP BY p.id, p.name, p.category, DATE_TRUNC('month', so.order_date), so.organization_id;

-- VISTA 2: Ranking de Productos Más Vendidos
CREATE OR REPLACE VIEW v_product_ranking AS
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

-- VISTA 3: Tendencias de Ventas Mensuales
CREATE OR REPLACE VIEW v_sales_trends AS
SELECT 
    DATE_TRUNC('month', so.order_date) as month,
    TO_CHAR(so.order_date, 'YYYY-MM') as month_label,
    EXTRACT(YEAR FROM so.order_date) as year,
    EXTRACT(MONTH FROM so.order_date) as month_number,
    EXTRACT(QUARTER FROM so.order_date) as quarter,
    COUNT(DISTINCT so.id) as total_orders,
    SUM(so.total_amount) as total_revenue,
    AVG(so.total_amount) as avg_ticket,
    SUM(CASE WHEN so.order_type = 'dine_in' THEN 1 ELSE 0 END) as dine_in_count,
    SUM(CASE WHEN so.order_type = 'takeaway' THEN 1 ELSE 0 END) as takeaway_count,
    so.organization_id
FROM sales_orders so
WHERE so.status = 'completed'
GROUP BY DATE_TRUNC('month', so.order_date), TO_CHAR(so.order_date, 'YYYY-MM'), 
         EXTRACT(YEAR FROM so.order_date), EXTRACT(MONTH FROM so.order_date),
         EXTRACT(QUARTER FROM so.order_date), so.organization_id
ORDER BY month DESC;

-- VISTA 4: Resumen de Producción (CORREGIDO)
CREATE OR REPLACE VIEW v_production_summary AS
SELECT 
    DATE_TRUNC('month', rib.purchase_date) as month,
    TO_CHAR(rib.purchase_date, 'YYYY-MM') as month_label,
    f.id as farm_id,
    f.name as farm_name,
    rib.variety,
    rib.process,
    COUNT(rib.id) as batch_count,
    SUM(rib.initial_quantity) as total_weight_received,
    AVG(rib.humidity_percentage) as avg_moisture,
    SUM(rib.total_cost_local) as total_cost,
    AVG(rib.total_cost_local / NULLIF(rib.initial_quantity, 0)) as avg_cost_per_kg,
    rib.organization_id
FROM raw_inventory_batches rib
JOIN farms f ON f.id = rib.farm_id
GROUP BY DATE_TRUNC('month', rib.purchase_date), TO_CHAR(rib.purchase_date, 'YYYY-MM'),
         f.id, f.name, rib.variety, rib.process, rib.organization_id
ORDER BY month DESC;

-- VISTA 5: Resumen de Gastos Mensuales
-- NOTA: Simplificada - la tabla no tiene categoría estándar
CREATE OR REPLACE VIEW v_expense_summary AS
SELECT 
    DATE_TRUNC('month', payment_date) as month,
    TO_CHAR(payment_date, 'YYYY-MM') as month_label,
    'Gastos' as category,
    COUNT(id) as expense_count,
    SUM(amount_paid) as total_amount,
    AVG(amount_paid) as avg_amount,
    organization_id
FROM expense_ledger
GROUP BY DATE_TRUNC('month', payment_date), TO_CHAR(payment_date, 'YYYY-MM'), organization_id
ORDER BY month DESC;

-- VISTA 6: Comparativo Financiero (Ingresos vs Gastos)
CREATE OR REPLACE VIEW v_financial_comparison AS
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', order_date) as month,
        organization_id,
        SUM(total_amount) as revenue
    FROM sales_orders
    WHERE status = 'completed'
    GROUP BY DATE_TRUNC('month', order_date), organization_id
),
monthly_expenses AS (
    SELECT 
        DATE_TRUNC('month', payment_date) as month,
        organization_id,
        SUM(amount_paid) as expenses
    FROM expense_ledger
    GROUP BY DATE_TRUNC('month', payment_date), organization_id
)
SELECT 
    COALESCE(s.month, e.month) as month,
    TO_CHAR(COALESCE(s.month, e.month), 'YYYY-MM') as month_label,
    COALESCE(s.organization_id, e.organization_id) as organization_id,
    COALESCE(s.revenue, 0) as revenue,
    COALESCE(e.expenses, 0) as expenses,
    COALESCE(s.revenue, 0) - COALESCE(e.expenses, 0) as net_profit,
    CASE 
        WHEN COALESCE(e.expenses, 0) > 0 
        THEN ROUND((COALESCE(s.revenue, 0) - COALESCE(e.expenses, 0)) / e.expenses * 100, 2)
        ELSE NULL
    END as profit_margin_percentage
FROM monthly_sales s
FULL OUTER JOIN monthly_expenses e ON s.month = e.month AND s.organization_id = e.organization_id
ORDER BY month DESC;

-- VISTA 7: Análisis Estacional de Productos
CREATE OR REPLACE VIEW v_product_seasonality AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.category,
    EXTRACT(MONTH FROM so.order_date) as month_number,
    TO_CHAR(so.order_date, 'Month') as month_name,
    EXTRACT(QUARTER FROM so.order_date) as quarter,
    SUM(soi.quantity) as quantity_sold,
    SUM(soi.quantity * soi.unit_price) as revenue,
    COUNT(DISTINCT so.id) as order_count,
    AVG(soi.quantity) as avg_quantity_per_order,
    so.organization_id
FROM sales_orders so
JOIN sales_order_items soi ON soi.sales_order_id = so.id
JOIN products p ON p.id = soi.product_id
WHERE so.status = 'completed'
  AND so.order_date >= CURRENT_DATE - INTERVAL '365 days'
GROUP BY p.id, p.name, p.category, EXTRACT(MONTH FROM so.order_date), 
         TO_CHAR(so.order_date, 'Month'), EXTRACT(QUARTER FROM so.order_date), 
         so.organization_id;

-- ========================================
-- PASO 3: CREAR FUNCIONES DINÁMICAS
-- ========================================

-- FUNCIÓN 1: Reporte de Ventas Dinámico
CREATE OR REPLACE FUNCTION get_sales_report(
    p_org_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_group_by TEXT DEFAULT 'day'
)
RETURNS TABLE (
    period TEXT,
    label TEXT,
    total_orders BIGINT,
    total_revenue DECIMAL,
    avg_ticket DECIMAL,
    top_product TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_group_by = 'day' THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(so.order_date, 'YYYY-MM-DD') as period,
            TO_CHAR(so.order_date, 'DD Mon YYYY') as label,
            COUNT(DISTINCT so.id) as total_orders,
            SUM(so.total_amount)::DECIMAL as total_revenue,
            AVG(so.total_amount)::DECIMAL as avg_ticket,
            '' as top_product
        FROM sales_orders so
        WHERE so.organization_id = p_org_id
          AND so.status = 'completed'
          AND so.order_date BETWEEN p_start_date AND p_end_date
        GROUP BY TO_CHAR(so.order_date, 'YYYY-MM-DD'), TO_CHAR(so.order_date, 'DD Mon YYYY')
        ORDER BY period;
        
    ELSIF p_group_by = 'month' THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(so.order_date, 'YYYY-MM') as period,
            TO_CHAR(so.order_date, 'Month YYYY') as label,
            COUNT(DISTINCT so.id) as total_orders,
            SUM(so.total_amount)::DECIMAL as total_revenue,
            AVG(so.total_amount)::DECIMAL as avg_ticket,
            '' as top_product
        FROM sales_orders so
        WHERE so.organization_id = p_org_id
          AND so.status = 'completed'
          AND so.order_date BETWEEN p_start_date AND p_end_date
        GROUP BY TO_CHAR(so.order_date, 'YYYY-MM'), TO_CHAR(so.order_date, 'Month YYYY')
        ORDER BY period;
        
    ELSIF p_group_by = 'product' THEN
        RETURN QUERY
        SELECT 
            p.id::TEXT as period,
            p.name as label,
            COUNT(DISTINCT so.id) as total_orders,
            SUM(soi.quantity * soi.unit_price)::DECIMAL as total_revenue,
            AVG(soi.unit_price)::DECIMAL as avg_ticket,
            SUM(soi.quantity)::TEXT as top_product
        FROM sales_orders so
        JOIN sales_order_items soi ON soi.sales_order_id = so.id
        JOIN products p ON p.id = soi.product_id
        WHERE so.organization_id = p_org_id
          AND so.status = 'completed'
          AND so.order_date BETWEEN p_start_date AND p_end_date
        GROUP BY p.id, p.name
        ORDER BY total_revenue DESC;
    END IF;
END;
$$;

-- FUNCIÓN 2: Top Productos Más Vendidos
CREATE OR REPLACE FUNCTION get_top_products(
    p_org_id UUID,
    p_limit INT DEFAULT 10,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    rank INT,
    product_id UUID,
    product_name TEXT,
    category TEXT,
    quantity_sold BIGINT,
    revenue DECIMAL,
    times_ordered BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER (ORDER BY SUM(soi.quantity) DESC)::INT as rank,
        p.id as product_id,
        p.name as product_name,
        p.category,
        SUM(soi.quantity) as quantity_sold,
        SUM(soi.quantity * soi.unit_price)::DECIMAL as revenue,
        COUNT(DISTINCT so.id) as times_ordered
    FROM sales_orders so
    JOIN sales_order_items soi ON soi.sales_order_id = so.id
    JOIN products p ON p.id = soi.product_id
    WHERE so.organization_id = p_org_id
      AND so.status = 'completed'
      AND so.order_date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    GROUP BY p.id, p.name, p.category
    ORDER BY quantity_sold DESC
    LIMIT p_limit;
END;
$$;

-- FUNCIÓN 3: Tendencias de Producto Específico
CREATE OR REPLACE FUNCTION get_product_trends(
    p_org_id UUID,
    p_product_id UUID,
    p_months INT DEFAULT 12
)
RETURNS TABLE (
    month TEXT,
    month_label TEXT,
    quantity_sold BIGINT,
    revenue DECIMAL,
    order_count BIGINT,
    growth_rate DECIMAL
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT 
            TO_CHAR(so.order_date, 'YYYY-MM') as month,
            TO_CHAR(so.order_date, 'Mon YYYY') as month_label,
            SUM(soi.quantity) as quantity_sold,
            SUM(soi.quantity * soi.unit_price) as revenue,
            COUNT(DISTINCT so.id) as order_count
        FROM sales_orders so
        JOIN sales_order_items soi ON soi.sales_order_id = so.id
        WHERE so.organization_id = p_org_id
          AND soi.product_id = p_product_id
          AND so.status = 'completed'
          AND so.order_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
        GROUP BY TO_CHAR(so.order_date, 'YYYY-MM'), TO_CHAR(so.order_date, 'Mon YYYY')
    )
    SELECT 
        md.month,
        md.month_label,
        md.quantity_sold,
        md.revenue::DECIMAL,
        md.order_count,
        CASE 
            WHEN LAG(md.quantity_sold) OVER (ORDER BY md.month) IS NOT NULL 
            THEN ROUND(
                ((md.quantity_sold - LAG(md.quantity_sold) OVER (ORDER BY md.month))::DECIMAL 
                / NULLIF(LAG(md.quantity_sold) OVER (ORDER BY md.month), 0) * 100), 
                2
            )
            ELSE 0
        END as growth_rate
    FROM monthly_data md
    ORDER BY md.month;
END;
$$;

-- ========================================
-- PASO 4: CREAR ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_sales_orders_order_date 
ON sales_orders(organization_id, order_date DESC) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_sales_order_items_product 
ON sales_order_items(product_id, sales_order_id);

CREATE INDEX IF NOT EXISTS idx_expense_ledger_category 
ON expense_ledger(organization_id, category, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_raw_batches_purchase_date 
ON raw_inventory_batches(organization_id, purchase_date DESC);

-- ========================================
-- FINALIZACIÓN Y VERIFICACIÓN
-- ========================================

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Sistema de Reportes instalado correctamente';
    RAISE NOTICE '📊 7 Vistas creadas';
    RAISE NOTICE '⚡ 3 Funciones dinámicas creadas';
    RAISE NOTICE '🚀 4 Índices de performance creados';
    RAISE NOTICE '';
    RAISE NOTICE 'Puedes probar con:';
    RAISE NOTICE 'SELECT * FROM v_product_ranking WHERE organization_id = ''tu-org-id'' LIMIT 5;';
END $$;
