-- Migration: Add takeaway container configuration to products
-- This allows each product to specify which container supply item it uses
-- and what additional cost (if any) to charge for takeaway

-- Add columns to products table for container configuration
ALTER TABLE products
ADD COLUMN IF NOT EXISTS container_supply_id UUID REFERENCES supplies(id),
ADD COLUMN IF NOT EXISTS takeaway_additional_cost DECIMAL(10,2) DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN products.container_supply_id IS 'ID del insumo usado como envase para llevar (ej: vaso desechable)';
COMMENT ON COLUMN products.takeaway_additional_cost IS 'Costo adicional por envase para llevar. Puede ser 0 si ya está incluido en el precio';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_container_supply ON products(container_supply_id) WHERE container_supply_id IS NOT NULL;
