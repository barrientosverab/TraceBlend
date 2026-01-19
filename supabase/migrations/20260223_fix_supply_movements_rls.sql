-- ============================================================
-- Migración: Crear tabla supply_movements con RLS correcto
-- Fecha: 2026-02-23
-- Descripción: La tabla supply_movements existe en la BD
--              pero no tiene políticas RLS que permitan acceso
--              a usuarios autenticados. Esta migración verifica
--              y asegura la estructura y políticas correctas.
-- ============================================================

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS public.supply_movements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  supply_id         UUID NOT NULL REFERENCES public.supplies_inventory(id) ON DELETE CASCADE,
  movement_type     TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'waste', 'return')),
  quantity          NUMERIC(10,3) NOT NULL,
  unit_cost         NUMERIC(10,2) DEFAULT 0,
  notes             TEXT,
  created_by        UUID REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.supply_movements IS 
  'Movimientos de inventario de insumos. Registra entradas, salidas y ajustes de supplies_inventory.';
COMMENT ON COLUMN public.supply_movements.movement_type IS 
  'Tipo: purchase=compra/ingreso, sale=venta/consumo, adjustment=ajuste, waste=merma, return=devolución';

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_supply_movements_org 
  ON public.supply_movements (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_supply_movements_supply 
  ON public.supply_movements (supply_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE public.supply_movements ENABLE ROW LEVEL SECURITY;

-- Política: Ver movimientos de su organización
DROP POLICY IF EXISTS "Users can view own org supply movements" ON public.supply_movements;
CREATE POLICY "Users can view own org supply movements"
  ON public.supply_movements FOR SELECT
  TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Política: Super admin ve todo
DROP POLICY IF EXISTS "Super admins can view all supply movements" ON public.supply_movements;
CREATE POLICY "Super admins can view all supply movements"
  ON public.supply_movements FOR SELECT
  TO authenticated
  USING (is_super_admin());

-- Política: Insertar en su propia organización
DROP POLICY IF EXISTS "Users can insert own org supply movements" ON public.supply_movements;
CREATE POLICY "Users can insert own org supply movements"
  ON public.supply_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- Verificación
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supply_movements') THEN
    RAISE NOTICE '✅ supply_movements - tabla OK con RLS habilitado';
  ELSE
    RAISE WARNING '❌ supply_movements - tabla NO creada';
  END IF;
END $$;
