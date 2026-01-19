-- Migration: Add weight columns for granulometry in lab_reports_physical
-- This allows storing the actual weight measurements and calculating percentages automatically

ALTER TABLE lab_reports_physical
ADD COLUMN IF NOT EXISTS peso_malla_18 NUMERIC,
ADD COLUMN IF NOT EXISTS peso_malla_16 NUMERIC,
ADD COLUMN IF NOT EXISTS peso_malla_14 NUMERIC,
ADD COLUMN IF NOT EXISTS peso_base_malla NUMERIC;

-- Add comments for clarity
COMMENT ON COLUMN lab_reports_physical.peso_malla_18 IS 'Peso en gramos retenido en malla 18';
COMMENT ON COLUMN lab_reports_physical.peso_malla_16 IS 'Peso en gramos retenido en malla 16';
COMMENT ON COLUMN lab_reports_physical.peso_malla_14 IS 'Peso en gramos retenido en malla 14';
COMMENT ON COLUMN lab_reports_physical.peso_base_malla IS 'Peso en gramos en la base (fondo)';

-- Note: The existing columns (mesh_18, mesh_16, mesh_14, base_mesh) will continue to store
-- the calculated percentages, maintaining backward compatibility
