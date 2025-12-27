-- =================================================================
-- MIGRACIÓN: Sistema de Planes de Suscripción para TraceBlend
-- Fecha: 2025-12-26
-- Descripción: Implementa dos planes de suscripción con control
--              de acceso a features basado en el plan activo
-- =================================================================

-- Verificación pre-migración
DO $$
BEGIN
    RAISE NOTICE '========== INICIANDO MIGRACIÓN DE SUSCRIPCIONES ==========';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
        RAISE EXCEPTION '❌ La tabla subscription_plans ya existe. Esta migración ya fue ejecutada.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        RAISE EXCEPTION '❌ La tabla organizations no existe. Ejecuta primero las migraciones base.';
    END IF;
    
    RAISE NOTICE '✅ Verificaciones completadas. Procediendo con la migración...';
END $$;

-- =================================================================
-- PASO 1: CREAR TABLA DE PLANES DE SUSCRIPCIÓN
-- =================================================================

CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    max_users INTEGER, -- NULL significa ilimitado
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT subscription_plans_code_lowercase CHECK (code = LOWER(code))
);

-- Índices para optimizar consultas
CREATE INDEX idx_subscription_plans_code ON subscription_plans(code);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_plans_updated_at();

-- =================================================================
-- PASO 2: CREAR TABLA DE FEATURES POR PLAN
-- =================================================================

CREATE TABLE subscription_plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    feature_code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT subscription_plan_features_unique UNIQUE (subscription_plan_id, feature_code),
    CONSTRAINT subscription_plan_features_code_lowercase CHECK (feature_code = LOWER(feature_code))
);

-- Índices para consultas rápidas
CREATE INDEX idx_plan_features_plan_id ON subscription_plan_features(subscription_plan_id);
CREATE INDEX idx_plan_features_feature_code ON subscription_plan_features(feature_code);

-- =================================================================
-- PASO 3: AGREGAR COLUMNA A ORGANIZATIONS
-- =================================================================

-- Agregar columna para plan de suscripción (nullable por ahora)
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL;

-- Índice para optimizar joins
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_plan 
ON organizations(subscription_plan_id);

-- =================================================================
-- PASO 4: POBLAR DATOS DE LOS PLANES
-- =================================================================

DO $$
DECLARE
    v_barista_plan_id UUID;
    v_trazabilidad_plan_id UUID;
BEGIN
    RAISE NOTICE '📦 Insertando planes de suscripción...';
    
    -- Plan 1: Barista TraceBlend
    INSERT INTO subscription_plans (name, code, description, monthly_price, max_users)
    VALUES (
        'Barista TraceBlend',
        'barista',
        'Plan básico con acceso a punto de venta, cierre de caja, dashboard, inventario, catálogo, equipo y reportes',
        99.00,
        5
    )
    RETURNING id INTO v_barista_plan_id;
    
    RAISE NOTICE '✅ Plan "Barista TraceBlend" creado con ID: %', v_barista_plan_id;
    
    -- Plan 2: Trazabilidad
    INSERT INTO subscription_plans (name, code, description, monthly_price, max_users)
    VALUES (
        'Trazabilidad',
        'trazabilidad',
        'Plan completo con acceso total a toda la plataforma de trazabilidad',
        299.00,
        NULL -- Usuarios ilimitados
    )
    RETURNING id INTO v_trazabilidad_plan_id;
    
    RAISE NOTICE '✅ Plan "Trazabilidad" creado con ID: %', v_trazabilidad_plan_id;
    
    -- =================================================================
    -- PASO 5: POBLAR FEATURES DEL PLAN BARISTA
    -- =================================================================
    
    RAISE NOTICE '🔧 Insertando features del plan Barista...';
    
    INSERT INTO subscription_plan_features (subscription_plan_id, feature_code) VALUES
        (v_barista_plan_id, 'pos'),           -- Punto de Venta
        (v_barista_plan_id, 'cash_close'),    -- Cierre de Caja
        (v_barista_plan_id, 'dashboard'),     -- Dashboard
        (v_barista_plan_id, 'inventory'),     -- Inventario Insumos
        (v_barista_plan_id, 'catalog'),       -- Catálogo Maestro
        (v_barista_plan_id, 'team'),          -- Equipo (Usuarios)
        (v_barista_plan_id, 'reports');       -- Reportes
    
    RAISE NOTICE '✅ 7 features asignadas al plan Barista';
    
    -- =================================================================
    -- PASO 6: POBLAR FEATURES DEL PLAN TRAZABILIDAD (TODAS)
    -- =================================================================
    
    RAISE NOTICE '🔧 Insertando features del plan Trazabilidad (acceso completo)...';
    
    INSERT INTO subscription_plan_features (subscription_plan_id, feature_code) VALUES
        -- Features básicas (mismo que Barista)
        (v_trazabilidad_plan_id, 'pos'),
        (v_trazabilidad_plan_id, 'cash_close'),
        (v_trazabilidad_plan_id, 'dashboard'),
        (v_trazabilidad_plan_id, 'inventory'),
        (v_trazabilidad_plan_id, 'catalog'),
        (v_trazabilidad_plan_id, 'team'),
        (v_trazabilidad_plan_id, 'reports'),
        
        -- Features avanzadas (exclusivas de Trazabilidad)
        (v_trazabilidad_plan_id, 'reception'),    -- Recepción MP
        (v_trazabilidad_plan_id, 'milling'),      -- Trilla
        (v_trazabilidad_plan_id, 'roasting'),     -- Tueste
        (v_trazabilidad_plan_id, 'laboratory'),   -- Laboratorio
        (v_trazabilidad_plan_id, 'packaging'),    -- Empaque
        (v_trazabilidad_plan_id, 'projections'),  -- Simulador ROI
        (v_trazabilidad_plan_id, 'suppliers'),    -- Proveedores
        (v_trazabilidad_plan_id, 'crm'),          -- CRM Clientes
        (v_trazabilidad_plan_id, 'promotions'),   -- Promociones
        (v_trazabilidad_plan_id, 'finance');      -- Finanzas
    
    RAISE NOTICE '✅ 17 features asignadas al plan Trazabilidad (acceso completo)';
    
    -- =================================================================
    -- PASO 7: ASIGNAR PLAN POR DEFECTO A ORGANIZACIONES EXISTENTES
    -- =================================================================
    
    RAISE NOTICE '🏢 Asignando plan por defecto a organizaciones existentes...';
    
    UPDATE organizations
    SET subscription_plan_id = v_trazabilidad_plan_id
    WHERE subscription_plan_id IS NULL;
    
    RAISE NOTICE '✅ Organizaciones existentes asignadas al plan "Trazabilidad" por defecto';
    
END $$;

-- =================================================================
-- PASO 8: CREAR FUNCIÓN HELPER PARA VERIFICAR ACCESO
-- =================================================================

CREATE OR REPLACE FUNCTION has_feature_access(p_organization_id UUID, p_feature_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM organizations o
        INNER JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
        INNER JOIN subscription_plan_features spf ON sp.id = spf.subscription_plan_id
        WHERE o.id = p_organization_id
          AND spf.feature_code = LOWER(p_feature_code)
          AND sp.is_active = true
    ) INTO v_has_access;
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario de la función
COMMENT ON FUNCTION has_feature_access(UUID, TEXT) IS 
'Verifica si una organización tiene acceso a una feature específica según su plan de suscripción activo';

-- =================================================================
-- PASO 9: CREAR VISTA PARA CONSULTAS RÁPIDAS
-- =================================================================

CREATE OR REPLACE VIEW organization_subscription_details AS
SELECT 
    o.id AS organization_id,
    o.name AS organization_name,
    sp.id AS plan_id,
    sp.name AS plan_name,
    sp.code AS plan_code,
    sp.monthly_price,
    sp.max_users,
    ARRAY_AGG(spf.feature_code ORDER BY spf.feature_code) AS available_features
FROM organizations o
LEFT JOIN subscription_plans sp ON o.subscription_plan_id = sp.id
LEFT JOIN subscription_plan_features spf ON sp.id = spf.subscription_plan_id
GROUP BY o.id, o.name, sp.id, sp.name, sp.code, sp.monthly_price, sp.max_users;

COMMENT ON VIEW organization_subscription_details IS 
'Vista consolidada de organizaciones con sus planes y features disponibles';

-- =================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =================================================================

DO $$
DECLARE
    v_plans_count INTEGER;
    v_barista_features_count INTEGER;
    v_trazabilidad_features_count INTEGER;
BEGIN
    RAISE NOTICE '========== VERIFICANDO MIGRACIÓN ==========';
    
    -- Contar planes
    SELECT COUNT(*) INTO v_plans_count FROM subscription_plans;
    RAISE NOTICE '📊 Planes creados: %', v_plans_count;
    
    IF v_plans_count != 2 THEN
        RAISE EXCEPTION '❌ Error: Se esperaban 2 planes, se encontraron %', v_plans_count;
    END IF;
    
    -- Contar features de Barista
    SELECT COUNT(*) INTO v_barista_features_count 
    FROM subscription_plan_features spf
    INNER JOIN subscription_plans sp ON spf.subscription_plan_id = sp.id
    WHERE sp.code = 'barista';
    
    RAISE NOTICE '📊 Features del plan Barista: %', v_barista_features_count;
    
    IF v_barista_features_count != 7 THEN
        RAISE WARNING '⚠️  Se esperaban 7 features para Barista, se encontraron %', v_barista_features_count;
    END IF;
    
    -- Contar features de Trazabilidad
    SELECT COUNT(*) INTO v_trazabilidad_features_count 
    FROM subscription_plan_features spf
    INNER JOIN subscription_plans sp ON spf.subscription_plan_id = sp.id
    WHERE sp.code = 'trazabilidad';
    
    RAISE NOTICE '📊 Features del plan Trazabilidad: %', v_trazabilidad_features_count;
    
    IF v_trazabilidad_features_count != 17 THEN
        RAISE WARNING '⚠️  Se esperaban 17 features para Trazabilidad, se encontraron %', v_trazabilidad_features_count;
    END IF;
    
    RAISE NOTICE '✅ Migración completada exitosamente';
    RAISE NOTICE '========== FIN DE VERIFICACIÓN ==========';
END $$;
