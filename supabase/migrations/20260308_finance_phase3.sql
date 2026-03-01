-- Migración para la Fase 3 de Finanzas: Cuentas por Cobrar y Cuentas por Pagar

-- 1. Tabla de Cuentas por Cobrar (Accounts Receivable - AR)
CREATE TABLE IF NOT EXISTS public.accounts_receivable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL, -- Cliente B2B asociado (opcional, pero recomendado)
    invoice_number TEXT,
    description TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pendiente', 'parcial', 'pagado', 'vencido')) DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabla de Cuentas por Pagar (Accounts Payable - AP)
CREATE TABLE IF NOT EXISTS public.accounts_payable (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL, -- Proveedor asociado (opcional)
    invoice_number TEXT,
    description TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pendiente', 'parcial', 'pagado', 'vencido')) DEFAULT 'pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Políticas RLS
ALTER TABLE public.accounts_receivable ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_payable ENABLE ROW LEVEL SECURITY;

-- accounts_receivable policies
CREATE POLICY "Users can view accounts_receivable in their organization"
    ON public.accounts_receivable FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert accounts_receivable in their organization"
    ON public.accounts_receivable FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update accounts_receivable in their organization"
    ON public.accounts_receivable FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    ));

-- accounts_payable policies
CREATE POLICY "Users can view accounts_payable in their organization"
    ON public.accounts_payable FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert accounts_payable in their organization"
    ON public.accounts_payable FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update accounts_payable in their organization"
    ON public.accounts_payable FOR UPDATE
    USING (organization_id IN (
        SELECT organization_id FROM user_roles WHERE user_id = auth.uid()
    ));

-- Triggers for updated_at
CREATE TRIGGER update_accounts_receivable_modtime
    BEFORE UPDATE ON public.accounts_receivable
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_accounts_payable_modtime
    BEFORE UPDATE ON public.accounts_payable
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
