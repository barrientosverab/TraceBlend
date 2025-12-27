-- ========================================
-- MIGRACIÓN: Sistema Completo de Reportes de Laboratorio de Café
-- ========================================
-- Versión: 1.0
-- Fecha: 2025-12-25
-- Descripción: Sistema de análisis físico y sensorial (SCA) para café
--              con soporte para muestras internas y externas
-- ========================================

-- ========================================
-- PASO 1: CREAR ENUMS
-- ========================================

DO $$ BEGIN
    CREATE TYPE sample_type_enum AS ENUM ('internal', 'external');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_type_enum AS ENUM ('physical', 'cupping', 'complete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status_enum AS ENUM ('draft', 'completed', 'approved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cupping_defect_type_enum AS ENUM ('taint', 'fault');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- PASO 2: CREAR TABLA MAESTRA lab_reports
-- ========================================

CREATE TABLE IF NOT EXISTS lab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Información general del reporte
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    analyst_name TEXT,
    report_type report_type_enum NOT NULL DEFAULT 'physical',
    status report_status_enum NOT NULL DEFAULT 'draft',
    
    -- Tipo de muestra
    sample_type sample_type_enum NOT NULL DEFAULT 'internal',
    
    -- Para muestras INTERNAS (del inventario)
    batch_id UUID REFERENCES raw_inventory_batches(id) ON DELETE SET NULL,
    
    -- Para muestras EXTERNAS (clientes externos)
    external_client_name TEXT,
    external_sample_id TEXT,
    external_origin TEXT,
    external_variety TEXT,
    external_process TEXT,
    external_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Restricciones de validación
    CONSTRAINT sample_internal_requires_batch 
        CHECK (
            (sample_type = 'internal' AND batch_id IS NOT NULL) OR
            (sample_type = 'external')
        ),
    CONSTRAINT sample_external_requires_client 
        CHECK (
            (sample_type = 'external' AND external_client_name IS NOT NULL AND external_sample_id IS NOT NULL) OR
            (sample_type = 'internal')
        )
);

-- ========================================
-- PASO 3: CREAR TABLA lab_reports_physical
-- ========================================

CREATE TABLE IF NOT EXISTS lab_reports_physical (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_report_id UUID NOT NULL REFERENCES lab_reports(id) ON DELETE CASCADE,
    
    -- Pesos de la muestra
    sample_weight_grams DECIMAL(10,2) NOT NULL CHECK (sample_weight_grams > 0),
    green_weight_grams DECIMAL(10,2) CHECK (green_weight_grams > 0),
    
    -- Humedad y densidad
    humidity_percentage DECIMAL(5,2) NOT NULL 
        CHECK (humidity_percentage >= 8 AND humidity_percentage <= 14),
    density_value DECIMAL(10,4),
    
    -- Granulometría (análisis de mallas en porcentajes)
    mesh_18 DECIMAL(5,2) DEFAULT 0 CHECK (mesh_18 >= 0 AND mesh_18 <= 100),
    mesh_16 DECIMAL(5,2) DEFAULT 0 CHECK (mesh_16 >= 0 AND mesh_16 <= 100),
    mesh_14 DECIMAL(5,2) DEFAULT 0 CHECK (mesh_14 >= 0 AND mesh_14 <= 100),
    base_mesh DECIMAL(5,2) DEFAULT 0 CHECK (base_mesh >= 0 AND base_mesh <= 100),
    
    -- Análisis de defectos
    category_1_defects INTEGER DEFAULT 0 CHECK (category_1_defects >= 0),
    category_2_defects INTEGER DEFAULT 0 CHECK (category_2_defects >= 0),
    defects_notes TEXT,
    
    -- Factor de rendimiento (calculado)
    yield_factor DECIMAL(10,4),
    
    -- Notas adicionales de evaluación visual
    color_notes TEXT,
    aroma_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Un reporte solo puede tener un análisis físico
    CONSTRAINT unique_physical_per_report UNIQUE (lab_report_id)
);

-- ========================================
-- PASO 4: CREAR TABLA lab_reports_cupping
-- ========================================

CREATE TABLE IF NOT EXISTS lab_reports_cupping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_report_id UUID NOT NULL REFERENCES lab_reports(id) ON DELETE CASCADE,
    
    -- Parámetros de preparación de la catación
    coffee_grams DECIMAL(6,2) NOT NULL DEFAULT 8.25 CHECK (coffee_grams > 0),
    water_ml DECIMAL(6,2) NOT NULL DEFAULT 150 CHECK (water_ml > 0),
    water_temp_celsius DECIMAL(4,1) NOT NULL DEFAULT 92.0 
        CHECK (water_temp_celsius >= 85 AND water_temp_celsius <= 96),
    cups_evaluated INTEGER NOT NULL DEFAULT 5 
        CHECK (cups_evaluated BETWEEN 1 AND 10),
    
    -- ATRIBUTOS PUNTUABLES (escala 6.00 - 10.00)
    -- Incrementos de 0.25 según protocolo SCA
    fragrance_aroma DECIMAL(4,2) NOT NULL 
        CHECK (fragrance_aroma >= 6.00 AND fragrance_aroma <= 10.00),
    flavor DECIMAL(4,2) NOT NULL 
        CHECK (flavor >= 6.00 AND flavor <= 10.00),
    aftertaste DECIMAL(4,2) NOT NULL 
        CHECK (aftertaste >= 6.00 AND aftertaste <= 10.00),
    acidity DECIMAL(4,2) NOT NULL 
        CHECK (acidity >= 6.00 AND acidity <= 10.00),
    body DECIMAL(4,2) NOT NULL 
        CHECK (body >= 6.00 AND body <= 10.00),
    balance DECIMAL(4,2) NOT NULL 
        CHECK (balance >= 6.00 AND balance <= 10.00),
    overall DECIMAL(4,2) NOT NULL 
        CHECK (overall >= 6.00 AND overall <= 10.00),
    
    -- ATRIBUTOS DE PRESENCIA (0-10, en múltiplos de 2)
    -- 2 puntos por cada taza sin defecto
    uniformity INTEGER NOT NULL DEFAULT 0 
        CHECK (uniformity >= 0 AND uniformity <= 10 AND uniformity % 2 = 0),
    clean_cup INTEGER NOT NULL DEFAULT 0 
        CHECK (clean_cup >= 0 AND clean_cup <= 10 AND clean_cup % 2 = 0),
    sweetness INTEGER NOT NULL DEFAULT 0 
        CHECK (sweetness >= 0 AND sweetness <= 10 AND sweetness % 2 = 0),
    
    -- PUNTUACIONES (calculadas)
    total_score DECIMAL(5,2),
    defects_score DECIMAL(5,2) DEFAULT 0,
    final_score DECIMAL(5,2),
    
    -- Notas y descriptores
    flavor_descriptors JSONB DEFAULT '[]'::jsonb,
    cupper_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Un reporte solo puede tener un análisis de catación
    CONSTRAINT unique_cupping_per_report UNIQUE (lab_report_id)
);

-- ========================================
-- PASO 5: CREAR TABLA cupping_defects
-- ========================================

CREATE TABLE IF NOT EXISTS cupping_defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cupping_report_id UUID NOT NULL REFERENCES lab_reports_cupping(id) ON DELETE CASCADE,
    
    cup_number INTEGER NOT NULL CHECK (cup_number >= 1 AND cup_number <= 10),
    defect_type cupping_defect_type_enum NOT NULL,
    defect_intensity INTEGER NOT NULL CHECK (defect_intensity IN (2, 4)),
    description TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- PASO 6: CREAR FUNCIÓN PARA CALCULAR PUNTUACIONES
-- ========================================

CREATE OR REPLACE FUNCTION calculate_cupping_scores()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular total_score (suma de todos los atributos)
    NEW.total_score := 
        NEW.fragrance_aroma + 
        NEW.flavor + 
        NEW.aftertaste + 
        NEW.acidity + 
        NEW.body + 
        NEW.balance + 
        NEW.overall + 
        NEW.uniformity + 
        NEW.clean_cup + 
        NEW.sweetness;
    
    -- Calcular defects_score (suma de defectos registrados)
    SELECT COALESCE(SUM(defect_intensity), 0)
    INTO NEW.defects_score
    FROM cupping_defects
    WHERE cupping_report_id = NEW.id;
    
    -- Calcular final_score (total - defectos)
    NEW.final_score := NEW.total_score - NEW.defects_score;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PASO 7: CREAR TRIGGERS
-- ========================================

-- Trigger para calcular puntuaciones al insertar/actualizar catación
DROP TRIGGER IF EXISTS trg_calculate_cupping_scores ON lab_reports_cupping;
CREATE TRIGGER trg_calculate_cupping_scores
    BEFORE INSERT OR UPDATE ON lab_reports_cupping
    FOR EACH ROW
    EXECUTE FUNCTION calculate_cupping_scores();

-- Trigger para recalcular puntuación cuando cambian defectos
CREATE OR REPLACE FUNCTION update_cupping_scores_on_defects()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lab_reports_cupping
    SET defects_score = (
        SELECT COALESCE(SUM(defect_intensity), 0)
        FROM cupping_defects
        WHERE cupping_report_id = COALESCE(NEW.cupping_report_id, OLD.cupping_report_id)
    ),
    final_score = total_score - (
        SELECT COALESCE(SUM(defect_intensity), 0)
        FROM cupping_defects
        WHERE cupping_report_id = COALESCE(NEW.cupping_report_id, OLD.cupping_report_id)
    )
    WHERE id = COALESCE(NEW.cupping_report_id, OLD.cupping_report_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_cupping_scores_on_defects ON cupping_defects;
CREATE TRIGGER trg_update_cupping_scores_on_defects
    AFTER INSERT OR UPDATE OR DELETE ON cupping_defects
    FOR EACH ROW
    EXECUTE FUNCTION update_cupping_scores_on_defects();

-- Trigger para actualizar updated_at en lab_reports
CREATE OR REPLACE FUNCTION update_lab_report_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_lab_report_timestamp ON lab_reports;
CREATE TRIGGER trg_update_lab_report_timestamp
    BEFORE UPDATE ON lab_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_report_timestamp();

-- ========================================
-- PASO 8: CREAR ÍNDICES
-- ========================================

-- Índices para lab_reports
CREATE INDEX IF NOT EXISTS idx_lab_reports_org_date 
    ON lab_reports(organization_id, report_date DESC);

CREATE INDEX IF NOT EXISTS idx_lab_reports_batch 
    ON lab_reports(batch_id) WHERE batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lab_reports_external_client 
    ON lab_reports(external_client_name) WHERE sample_type = 'external';

CREATE INDEX IF NOT EXISTS idx_lab_reports_status 
    ON lab_reports(organization_id, status, report_date DESC);

-- Índices para lab_reports_physical
CREATE INDEX IF NOT EXISTS idx_physical_report 
    ON lab_reports_physical(lab_report_id);

-- Índices para lab_reports_cupping
CREATE INDEX IF NOT EXISTS idx_cupping_report 
    ON lab_reports_cupping(lab_report_id);

CREATE INDEX IF NOT EXISTS idx_cupping_final_score 
    ON lab_reports_cupping(final_score DESC);

-- Índices para cupping_defects
CREATE INDEX IF NOT EXISTS idx_cupping_defects_report 
    ON cupping_defects(cupping_report_id);

-- ========================================
-- PASO 9: CREAR VISTA COMPLETA
-- ========================================

CREATE OR REPLACE VIEW v_lab_reports_complete AS
SELECT 
    lr.id,
    lr.organization_id,
    lr.report_date,
    lr.analyst_name,
    lr.report_type,
    lr.status,
    lr.sample_type,
    
    -- Información de muestra interna
    lr.batch_id,
    rib.code_ref as batch_code,
    rib.variety as batch_variety,
    rib.process as batch_process,
    f.name as farm_name,
    
    -- Información de muestra externa
    lr.external_client_name,
    lr.external_sample_id,
    lr.external_origin,
    lr.external_variety,
    lr.external_process,
    lr.external_notes,
    
    -- Datos de análisis físico
    lrp.id as physical_id,
    lrp.sample_weight_grams,
    lrp.green_weight_grams,
    lrp.humidity_percentage,
    lrp.density_value,
    lrp.mesh_18,
    lrp.mesh_16,
    lrp.mesh_14,
    lrp.base_mesh,
    lrp.category_1_defects,
    lrp.category_2_defects,
    lrp.defects_notes,
    lrp.yield_factor,
    
    -- Datos de catación
    lrc.id as cupping_id,
    lrc.coffee_grams,
    lrc.water_ml,
    lrc.cups_evaluated,
    lrc.fragrance_aroma,
    lrc.flavor,
    lrc.aftertaste,
    lrc.acidity,
    lrc.body,
    lrc.balance,
    lrc.overall,
    lrc.uniformity,
    lrc.clean_cup,
    lrc.sweetness,
    lrc.total_score,
    lrc.defects_score,
    lrc.final_score,
    lrc.flavor_descriptors,
    lrc.cupper_notes,
    
    -- Clasificación de calidad
    CASE 
        WHEN lrc.final_score >= 90 THEN 'Outstanding'
        WHEN lrc.final_score >= 85 THEN 'Excellent'
        WHEN lrc.final_score >= 80 THEN 'Very Good (Specialty)'
        WHEN lrc.final_score >= 70 THEN 'Good'
        ELSE 'Commercial'
    END as quality_classification,
    
    lr.created_at,
    lr.updated_at
    
FROM lab_reports lr
LEFT JOIN raw_inventory_batches rib ON lr.batch_id = rib.id
LEFT JOIN farms f ON rib.farm_id = f.id
LEFT JOIN lab_reports_physical lrp ON lrp.lab_report_id = lr.id
LEFT JOIN lab_reports_cupping lrc ON lrc.lab_report_id = lr.id;

-- ========================================
-- PASO 10: CREAR FUNCIÓN PARA HISTORIAL DE CALIDAD
-- ========================================

CREATE OR REPLACE FUNCTION get_batch_quality_history(p_batch_id UUID)
RETURNS TABLE (
    report_date DATE,
    report_id UUID,
    final_score DECIMAL,
    humidity_percentage DECIMAL,
    category_1_defects INTEGER,
    category_2_defects INTEGER,
    analyst_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lr.report_date,
        lr.id as report_id,
        lrc.final_score,
        lrp.humidity_percentage,
        lrp.category_1_defects,
        lrp.category_2_defects,
        lr.analyst_name
    FROM lab_reports lr
    LEFT JOIN lab_reports_cupping lrc ON lrc.lab_report_id = lr.id
    LEFT JOIN lab_reports_physical lrp ON lrp.lab_report_id = lr.id
    WHERE lr.batch_id = p_batch_id
    ORDER BY lr.report_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PASO 11: HABILITAR ROW LEVEL SECURITY
-- ========================================

ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports_physical ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reports_cupping ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupping_defects ENABLE ROW LEVEL SECURITY;

-- Política para lab_reports
CREATE POLICY lab_reports_org_isolation ON lab_reports
    FOR ALL
    USING (organization_id = current_setting('app.current_organization_id')::uuid);

-- Política para lab_reports_physical
CREATE POLICY lab_reports_physical_org_isolation ON lab_reports_physical
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM lab_reports 
            WHERE id = lab_report_id 
            AND organization_id = current_setting('app.current_organization_id')::uuid
        )
    );

-- Política para lab_reports_cupping
CREATE POLICY lab_reports_cupping_org_isolation ON lab_reports_cupping
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM lab_reports 
            WHERE id = lab_report_id 
            AND organization_id = current_setting('app.current_organization_id')::uuid
        )
    );

-- Política para cupping_defects
CREATE POLICY cupping_defects_org_isolation ON cupping_defects
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM lab_reports_cupping lrc
            JOIN lab_reports lr ON lr.id = lrc.lab_report_id
            WHERE lrc.id = cupping_report_id 
            AND lr.organization_id = current_setting('app.current_organization_id')::uuid
        )
    );

-- ========================================
-- FINALIZACIÓN
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migración de Sistema de Reportes de Laboratorio completada';
    RAISE NOTICE '📊 4 Tablas creadas: lab_reports, lab_reports_physical, lab_reports_cupping, cupping_defects';
    RAISE NOTICE '🔧 3 Funciones creadas';
    RAISE NOTICE '⚡ 4 Triggers creados';
    RAISE NOTICE '📈 1 Vista creada: v_lab_reports_complete';
    RAISE NOTICE '🔒 Row Level Security habilitado';
    RAISE NOTICE '';
    RAISE NOTICE 'El sistema está listo para registrar reportes de laboratorio.';
END $$;
