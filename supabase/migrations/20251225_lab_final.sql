-- ========================================
-- SISTEMA DE REPORTES DE LABORATORIO DE CAFÉ
-- ========================================
-- VERSIÓN SIMPLIFICADA - SIN ERRORES DE LIMPIEZA
-- Ejecuta este script completo en el SQL Editor de Supabase
-- ========================================

-- PASO 1: Limpiar todo lo antiguo (ignorando errores)
DO $$ 
BEGIN
    -- Eliminar tablas (CASCADE elimina todo lo relacionado automáticamente)
    DROP TABLE IF EXISTS cupping_defects CASCADE;
    DROP TABLE IF EXISTS lab_reports_cupping CASCADE;
    DROP TABLE IF EXISTS lab_reports_physical CASCADE;
    DROP TABLE IF EXISTS lab_reports CASCADE;
    
    -- Eliminar tipos ENUM
    DROP TYPE IF EXISTS cupping_defect_type_enum CASCADE;
    DROP TYPE IF EXISTS report_status_enum CASCADE;
    DROP TYPE IF EXISTS report_type_enum CASCADE;
    DROP TYPE IF EXISTS sample_type_enum CASCADE;
END $$;

-- PASO 2: Crear ENUMs
CREATE TYPE sample_type_enum AS ENUM ('internal', 'external');
CREATE TYPE report_type_enum AS ENUM ('physical', 'cupping', 'complete');
CREATE TYPE report_status_enum AS ENUM ('draft', 'completed', 'approved');
CREATE TYPE cupping_defect_type_enum AS ENUM ('taint', 'fault');

-- PASO 3: Crear tabla principal lab_reports
CREATE TABLE lab_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    analyst_name TEXT,
    report_type report_type_enum NOT NULL DEFAULT 'physical',
    status report_status_enum NOT NULL DEFAULT 'draft',
    sample_type sample_type_enum NOT NULL DEFAULT 'internal',
    batch_id UUID REFERENCES raw_inventory_batches(id) ON DELETE SET NULL,
    external_client_name TEXT,
    external_sample_id TEXT,
    external_origin TEXT,
    external_variety TEXT,
    external_process TEXT,
    external_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT sample_internal_requires_batch 
        CHECK ((sample_type = 'internal' AND batch_id IS NOT NULL) OR (sample_type = 'external')),
    CONSTRAINT sample_external_requires_client 
        CHECK ((sample_type = 'external' AND external_client_name IS NOT NULL AND external_sample_id IS NOT NULL) OR (sample_type = 'internal'))
);

-- PASO 4: Crear tabla de análisis físico
CREATE TABLE lab_reports_physical (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_report_id UUID NOT NULL REFERENCES lab_reports(id) ON DELETE CASCADE,
    sample_weight_grams DECIMAL(10,2) NOT NULL CHECK (sample_weight_grams > 0),
    green_weight_grams DECIMAL(10,2) CHECK (green_weight_grams > 0),
    humidity_percentage DECIMAL(5,2) NOT NULL CHECK (humidity_percentage >= 8 AND humidity_percentage <= 14),
    density_value DECIMAL(10,4),
    mesh_18 DECIMAL(5,2) DEFAULT 0 CHECK (mesh_18 >= 0 AND mesh_18 <= 100),
    mesh_16 DECIMAL(5,2) DEFAULT 0 CHECK (mesh_16 >= 0 AND mesh_16 <= 100),
    mesh_14 DECIMAL(5,2) DEFAULT 0 CHECK (mesh_14 >= 0 AND mesh_14 <= 100),
    base_mesh DECIMAL(5,2) DEFAULT 0 CHECK (base_mesh >= 0 AND base_mesh <= 100),
    category_1_defects INTEGER DEFAULT 0 CHECK (category_1_defects >= 0),
    category_2_defects INTEGER DEFAULT 0 CHECK (category_2_defects >= 0),
    defects_notes TEXT,
    yield_factor DECIMAL(10,4),
    color_notes TEXT,
    aroma_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_physical_per_report UNIQUE (lab_report_id)
);

-- PASO 5: Crear tabla de catación SCA
CREATE TABLE lab_reports_cupping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_report_id UUID NOT NULL REFERENCES lab_reports(id) ON DELETE CASCADE,
    coffee_grams DECIMAL(6,2) NOT NULL DEFAULT 8.25 CHECK (coffee_grams > 0),
    water_ml DECIMAL(6,2) NOT NULL DEFAULT 150 CHECK (water_ml > 0),
    water_temp_celsius DECIMAL(4,1) NOT NULL DEFAULT 92.0 CHECK (water_temp_celsius >= 85 AND water_temp_celsius <= 96),
    cups_evaluated INTEGER NOT NULL DEFAULT 5 CHECK (cups_evaluated BETWEEN 1 AND 10),
    fragrance_aroma DECIMAL(4,2) NOT NULL CHECK (fragrance_aroma >= 6.00 AND fragrance_aroma <= 10.00),
    flavor DECIMAL(4,2) NOT NULL CHECK (flavor >= 6.00 AND flavor <= 10.00),
    aftertaste DECIMAL(4,2) NOT NULL CHECK (aftertaste >= 6.00 AND aftertaste <= 10.00),
    acidity DECIMAL(4,2) NOT NULL CHECK (acidity >= 6.00 AND acidity <= 10.00),
    body DECIMAL(4,2) NOT NULL CHECK (body >= 6.00 AND body <= 10.00),
    balance DECIMAL(4,2) NOT NULL CHECK (balance >= 6.00 AND balance <= 10.00),
    overall DECIMAL(4,2) NOT NULL CHECK (overall >= 6.00 AND overall <= 10.00),
    uniformity INTEGER NOT NULL DEFAULT 0 CHECK (uniformity >= 0 AND uniformity <= 10 AND uniformity % 2 = 0),
    clean_cup INTEGER NOT NULL DEFAULT 0 CHECK (clean_cup >= 0 AND clean_cup <= 10 AND clean_cup % 2 = 0),
    sweetness INTEGER NOT NULL DEFAULT 0 CHECK (sweetness >= 0 AND sweetness <= 10 AND sweetness % 2 = 0),
    total_score DECIMAL(5,2),
    defects_score DECIMAL(5,2) DEFAULT 0,
    final_score DECIMAL(5,2),
    flavor_descriptors JSONB DEFAULT '[]'::jsonb,
    cupper_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_cupping_per_report UNIQUE (lab_report_id)
);

-- PASO 6: Crear tabla de defectos
CREATE TABLE cupping_defects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cupping_report_id UUID NOT NULL REFERENCES lab_reports_cupping(id) ON DELETE CASCADE,
    cup_number INTEGER NOT NULL CHECK (cup_number >= 1 AND cup_number <= 10),
    defect_type cupping_defect_type_enum NOT NULL,
    defect_intensity INTEGER NOT NULL CHECK (defect_intensity IN (2, 4)),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PASO 7: Crear función para calcular scores
CREATE OR REPLACE FUNCTION calculate_cupping_scores()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_score := NEW.fragrance_aroma + NEW.flavor + NEW.aftertaste + NEW.acidity + NEW.body + NEW.balance + NEW.overall + NEW.uniformity + NEW.clean_cup + NEW.sweetness;
    SELECT COALESCE(SUM(defect_intensity), 0) INTO NEW.defects_score FROM cupping_defects WHERE cupping_report_id = NEW.id;
    NEW.final_score := NEW.total_score - NEW.defects_score;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_cupping_scores
    BEFORE INSERT OR UPDATE ON lab_reports_cupping
    FOR EACH ROW EXECUTE FUNCTION calculate_cupping_scores();

-- PASO 8: Trigger para actualizar scores cuando cambian defectos
CREATE OR REPLACE FUNCTION update_cupping_scores_on_defects()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lab_reports_cupping SET 
        defects_score = (SELECT COALESCE(SUM(defect_intensity), 0) FROM cupping_defects WHERE cupping_report_id = COALESCE(NEW.cupping_report_id, OLD.cupping_report_id)),
        final_score = total_score - (SELECT COALESCE(SUM(defect_intensity), 0) FROM cupping_defects WHERE cupping_report_id = COALESCE(NEW.cupping_report_id, OLD.cupping_report_id))
    WHERE id = COALESCE(NEW.cupping_report_id, OLD.cupping_report_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_cupping_scores_on_defects
    AFTER INSERT OR UPDATE OR DELETE ON cupping_defects
    FOR EACH ROW EXECUTE FUNCTION update_cupping_scores_on_defects();

-- PASO 9: Trigger para timestamps
CREATE OR REPLACE FUNCTION update_lab_report_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_lab_report_timestamp
    BEFORE UPDATE ON lab_reports
    FOR EACH ROW EXECUTE FUNCTION update_lab_report_timestamp();

-- PASO 10: Crear índices
CREATE INDEX idx_lab_reports_org_date ON lab_reports(organization_id, report_date DESC);
CREATE INDEX idx_lab_reports_batch ON lab_reports(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_lab_reports_external_client ON lab_reports(external_client_name) WHERE sample_type = 'external';
CREATE INDEX idx_lab_reports_status ON lab_reports(organization_id, status, report_date DESC);
CREATE INDEX idx_physical_report ON lab_reports_physical(lab_report_id);
CREATE INDEX idx_cupping_report ON lab_reports_cupping(lab_report_id);
CREATE INDEX idx_cupping_final_score ON lab_reports_cupping(final_score DESC);
CREATE INDEX idx_cupping_defects_report ON cupping_defects(cupping_report_id);

-- PASO 11: Crear vista completa
CREATE OR REPLACE VIEW v_lab_reports_complete AS
SELECT 
    lr.id, lr.organization_id, lr.report_date, lr.analyst_name, lr.report_type, lr.status, lr.sample_type,
    lr.batch_id, rib.code_ref as batch_code, rib.variety as batch_variety, rib.process as batch_process, f.name as farm_name,
    lr.external_client_name, lr.external_sample_id, lr.external_origin, lr.external_variety, lr.external_process, lr.external_notes,
    lrp.id as physical_id, lrp.sample_weight_grams, lrp.green_weight_grams, lrp.humidity_percentage, lrp.density_value,
    lrp.mesh_18, lrp.mesh_16, lrp.mesh_14, lrp.base_mesh, lrp.category_1_defects, lrp.category_2_defects, lrp.defects_notes, lrp.yield_factor,
    lrc.id as cupping_id, lrc.coffee_grams, lrc.water_ml, lrc.cups_evaluated, lrc.fragrance_aroma, lrc.flavor, lrc.aftertaste,
    lrc.acidity, lrc.body, lrc.balance, lrc.overall, lrc.uniformity, lrc.clean_cup, lrc.sweetness,
    lrc.total_score, lrc.defects_score, lrc.final_score, lrc.flavor_descriptors, lrc.cupper_notes,
    CASE 
        WHEN lrc.final_score >= 90 THEN 'Outstanding'
        WHEN lrc.final_score >= 85 THEN 'Excellent'
        WHEN lrc.final_score >= 80 THEN 'Very Good (Specialty)'
        WHEN lrc.final_score >= 70 THEN 'Good'
        ELSE 'Commercial'
    END as quality_classification,
    lr.created_at, lr.updated_at
FROM lab_reports lr
LEFT JOIN raw_inventory_batches rib ON lr.batch_id = rib.id
LEFT JOIN farms f ON rib.farm_id = f.id
LEFT JOIN lab_reports_physical lrp ON lrp.lab_report_id = lr.id
LEFT JOIN lab_reports_cupping lrc ON lrc.lab_report_id = lr.id;

-- PASO 12: Función de historial
CREATE OR REPLACE FUNCTION get_batch_quality_history(p_batch_id UUID)
RETURNS TABLE (
    report_date DATE, report_id UUID, final_score DECIMAL, humidity_percentage DECIMAL,
    category_1_defects INTEGER, category_2_defects INTEGER, analyst_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT lr.report_date, lr.id as report_id, lrc.final_score, lrp.humidity_percentage,
           lrp.category_1_defects, lrp.category_2_defects, lr.analyst_name
    FROM lab_reports lr
    LEFT JOIN lab_reports_cupping lrc ON lrc.lab_report_id = lr.id
    LEFT JOIN lab_reports_physical lrp ON lrp.lab_report_id = lr.id
    WHERE lr.batch_id = p_batch_id
    ORDER BY lr.report_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ¡Listo!
SELECT '✅ Sistema de Laboratorio instalado correctamente' as resultado;
