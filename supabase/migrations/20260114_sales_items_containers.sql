-- Migration: Add container tracking columns to sales_order_items
-- This allows tracking which items were sold as takeaway and their container costs

ALTER TABLE sales_order_items
ADD COLUMN IF NOT EXISTS para_llevar BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS container_cost DECIMAL(10,2) DEFAULT 0;

-- Add comments
COMMENT ON COLUMN sales_order_items.para_llevar IS 'Indica si este item fue vendido para llevar';
COMMENT ON COLUMN sales_order_items.container_cost IS 'Costo del envase aplicado a este item';

-- Create index for analytics
CREATE INDEX IF NOT EXISTS idx_sales_items_takeaway ON sales_order_items(para_llevar) WHERE para_llevar = true;
