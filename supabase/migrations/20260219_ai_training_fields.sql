-- ============================================================
-- Migración: Campos para dataset de entrenamiento de IA
-- Módulo: Tostado (roast_batches)
-- Fecha: 2026-02-19
-- Descripción: Agrega variables agronómicas, ambientales y notas
--              de cata para recopilar datos estructurados que
--              serán usados para entrenar una IA especializada
--              en tueste de café de altura.
-- ============================================================

-- Variables agronómicas del grano verde
ALTER TABLE public.roast_batches
  ADD COLUMN IF NOT EXISTS altitude_masl        integer,       -- Altitud de la finca en m.s.n.m.
  ADD COLUMN IF NOT EXISTS apparent_density     numeric(6,2),  -- Densidad aparente g/L (ej: 680.50)
  ADD COLUMN IF NOT EXISTS bean_humidity_pct    numeric(5,2),  -- Humedad del grano % (ej: 11.50)
  ADD COLUMN IF NOT EXISTS water_activity       numeric(4,3),  -- Actividad del agua Aw 0.000–1.000 (opcional)
  ADD COLUMN IF NOT EXISTS variety              text,          -- Variedad: Caturra, Gesha, Bourbon, etc.
  ADD COLUMN IF NOT EXISTS process_method       text,          -- Beneficio: Lavado, Natural, Honey, Anaeróbico

-- Variables ambientales del día (complementan ambient_temp y relative_humidity existentes)
  ADD COLUMN IF NOT EXISTS ambient_pressure_hpa numeric(7,2), -- Presión barométrica hPa (opcional)

-- Notas de cata post-tueste (estructura SCA)
  ADD COLUMN IF NOT EXISTS cupping_notes        jsonb,         -- Ver estructura abajo

-- Metadatos adicionales para dataset
  ADD COLUMN IF NOT EXISTS roast_color_agtron   integer,       -- Lectura Agtron real (si tienen el equipo)
  ADD COLUMN IF NOT EXISTS roast_level          text,          -- Light / Medium-Light / Medium / Medium-Dark / Dark
  ADD COLUMN IF NOT EXISTS first_crack_time     integer,       -- Tiempo en segundos del primer crack
  ADD COLUMN IF NOT EXISTS first_crack_temp     numeric(6,2),  -- Temperatura del primer crack °C
  ADD COLUMN IF NOT EXISTS development_time_pct numeric(5,2),  -- % Tiempo de desarrollo (DT%)
  ADD COLUMN IF NOT EXISTS ror_peak             numeric(5,2),  -- ROR máximo °C/min
  ADD COLUMN IF NOT EXISTS ror_at_drop          numeric(5,2),  -- ROR al momento del Drop °C/min
  ADD COLUMN IF NOT EXISTS batch_notes          text;          -- Notas libres del operador

-- ============================================================
-- Estructura esperada de cupping_notes (JSONB):
-- {
--   "fragrance":  8.0,   -- 6.0 – 10.0
--   "aroma":      8.0,
--   "flavor":     8.0,
--   "aftertaste": 7.5,
--   "acidity":    8.0,   -- incluye intensity: "alta"|"media"|"baja"
--   "acidity_intensity": "alta",
--   "body":       7.5,   -- incluye level: "pleno"|"cremoso"|"ligero"
--   "body_level": "cremoso",
--   "balance":    8.0,
--   "uniformity": 10.0,
--   "clean_cup":  10.0,
--   "sweetness":  10.0,
--   "overall":    8.0,
--   "defects":    0,
--   "total_score": 84.5,
--   "flavor_descriptors": ["chocolate", "caramelo", "nuez"],
--   "aroma_descriptors":  ["floral", "frutal"],
--   "cata_date": "2026-02-19",
--   "cupper_name": "nombre"
-- }
-- ============================================================

-- Validaciones de rango
ALTER TABLE public.roast_batches
  ADD CONSTRAINT IF NOT EXISTS chk_altitude_masl
    CHECK (altitude_masl IS NULL OR (altitude_masl >= 0 AND altitude_masl <= 6000)),
  ADD CONSTRAINT IF NOT EXISTS chk_apparent_density
    CHECK (apparent_density IS NULL OR (apparent_density >= 400 AND apparent_density <= 1000)),
  ADD CONSTRAINT IF NOT EXISTS chk_bean_humidity
    CHECK (bean_humidity_pct IS NULL OR (bean_humidity_pct >= 7 AND bean_humidity_pct <= 25)),
  ADD CONSTRAINT IF NOT EXISTS chk_water_activity
    CHECK (water_activity IS NULL OR (water_activity >= 0 AND water_activity <= 1)),
  ADD CONSTRAINT IF NOT EXISTS chk_development_time_pct
    CHECK (development_time_pct IS NULL OR (development_time_pct >= 0 AND development_time_pct <= 100)),
  ADD CONSTRAINT IF NOT EXISTS chk_roast_level
    CHECK (roast_level IS NULL OR roast_level IN ('Light','Medium-Light','Medium','Medium-Dark','Dark'));

-- Índices para consultas del dataset de entrenamiento
CREATE INDEX IF NOT EXISTS idx_roast_batches_altitude   ON public.roast_batches (altitude_masl);
CREATE INDEX IF NOT EXISTS idx_roast_batches_variety    ON public.roast_batches (variety);
CREATE INDEX IF NOT EXISTS idx_roast_batches_process    ON public.roast_batches (process_method);
CREATE INDEX IF NOT EXISTS idx_roast_batches_roast_level ON public.roast_batches (roast_level);

COMMENT ON COLUMN public.roast_batches.altitude_masl
  IS 'Altitud de la finca de origen en metros sobre el nivel del mar. Clave para correlacionar densidad del grano con comportamiento de tueste (Rob Hoos).';
COMMENT ON COLUMN public.roast_batches.apparent_density
  IS 'Densidad aparente del café verde en g/L. Determina la transferencia de calor y estructura del tueste.';
COMMENT ON COLUMN public.roast_batches.cupping_notes
  IS 'Notas de cata estructuradas según protocolo SCA. Base del dataset de entrenamiento de IA.';
COMMENT ON COLUMN public.roast_batches.development_time_pct
  IS 'Porcentaje del tiempo total de tueste dedicado a la fase de desarrollo (post primer crack). Indicador clave según Rob Hoos.';
