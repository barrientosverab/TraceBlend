-- ============================================
-- BACKUP COMPLETO DE BASE DE DATOS TRACEBLEND
-- Fecha: 2026-01-16
-- ============================================
-- Este script exporta TODA la información de todas las tablas
-- Ejecútalo en el SQL Editor de Supabase
-- ============================================

-- BACKUP DE TABLAS DE ORGANIZACIONES Y USUARIOS
-- ============================================
COPY (SELECT * FROM organizations) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM user_roles) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM user_invitations) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM subscription_plans) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM subscriptions) TO STDOUT WITH CSV HEADER;

-- BACKUP DE TABLAS DE FINCAS Y PROVEEDORES
-- ============================================
COPY (SELECT * FROM farms) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM suppliers) TO STDOUT WITH CSV HEADER;

-- BACKUP DE TABLAS DE INVENTARIO
-- ============================================
COPY (SELECT * FROM raw_inventory_batches) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM raw_inventory_transactions) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM prepared_inventory_batches) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM prepared_inventory_transactions) TO STDOUT WITH CSV HEADER;

-- BACKUP DE TABLAS DE LABORATORIO
-- ============================================
COPY (SELECT * FROM lab_analyses) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM lab_analysis_items) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM lab_cupping_items) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM lab_granulometry_items) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM lab_moisture_items) TO STDOUT WITH CSV HEADER;

-- BACKUP DE TABLAS DE TOSTADO
-- ============================================
COPY (SELECT * FROM roasting_profiles) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM roasting_batches) TO STDOUT WITH CSV HEADER;

-- BACKUP DE TABLAS DE PRODUCTOS
-- ============================================
COPY (SELECT * FROM product_categories) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM products) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM product_containers) TO STDOUT WITH CSV HEADER;

-- BACKUP DE TABLAS DE VENTAS
-- ============================================
COPY (SELECT * FROM sales) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM sale_items) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM payment_methods) TO STDOUT WITH CSV HEADER;

-- BACKUP DE TABLAS DE CAJA
-- ============================================
COPY (SELECT * FROM cash_registers) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM cash_register_movements) TO STDOUT WITH CSV HEADER;
COPY (SELECT * FROM cash_closures) TO STDOUT WITH CSV HEADER;

-- ============================================
-- FIN DEL BACKUP
-- ============================================
