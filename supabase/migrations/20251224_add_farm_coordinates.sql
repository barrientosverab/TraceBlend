-- Migration: Add Geographic Coordinates to Farms Table
-- Purpose: Enable precise geolocation of coffee farms for EU traceability compliance
-- Date: 2025-12-24

-- Add latitude and longitude columns to farms table
ALTER TABLE public.farms
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comments for documentation
COMMENT ON COLUMN public.farms.latitude IS 'Geographic latitude in decimal degrees (-90 to 90)';
COMMENT ON COLUMN public.farms.longitude IS 'Geographic longitude in decimal degrees (-180 to 180)';

-- Optional: Create index for geographic queries (if needed in the future)
CREATE INDEX IF NOT EXISTS idx_farms_coordinates ON public.farms(latitude, longitude);
