/**
 * Tipos de la base de datos Supabase — TraceBlend
 * Actualizado: 2026-04-30 (migración a nueva BD)
 *
 * MÓDULO 1 — Núcleo SaaS:
 *   subscription_plans, organizations, branches, profiles, billing_history
 *
 * MÓDULO 2 — Clientes globales:
 *   customers, customer_org_links
 *
 * MÓDULO 3 — Insumos y Recetas:
 *   product_categories, supplies, supply_stock, products, product_recipes
 *
 * MÓDULO 4 — Ventas / POS:
 *   sales, sale_items, sale_payments
 *
 * MÓDULO 5 — Gastos:
 *   expense_categories, expenses, supply_purchases
 *
 * CAJA:
 *   cash_openings, cash_closures
 *
 * CUENTAS:
 *   accounts_receivable, accounts_payable
 */

// ─────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────

/** org_status ENUM en BD */
export type OrgStatus = 'trial' | 'active' | 'past_due' | 'canceled';

/** user_role ENUM en BD */
export type UserRole = 'admin' | 'cashier' | 'viewer';

/** payment_method_type ENUM en BD */
export type PaymentMethodType = 'cash' | 'card' | 'qr' | 'transfer';

// ─────────────────────────────────────────────────────
// MÓDULO 1 — Núcleo SaaS
// ─────────────────────────────────────────────────────

export interface SubscriptionPlan {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    monthly_price: number;
    max_users?: number | null;
    max_branches?: number | null;
    is_active: boolean;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface Organization {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    tax_id?: string | null;
    logo_url?: string | null;
    currency_symbol?: string | null;
    status?: OrgStatus | null;
    trial_ends_at?: string | null;
    subscription_plan_id?: string | null;
    setup_completed?: boolean | null;
    created_at?: string | null;
}

export interface Branch {
    id: string;
    organization_id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    is_main: boolean;
    created_at?: string | null;
}

export interface Profile {
    id: string;               // = auth.uid()
    organization_id?: string | null;
    branch_id?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    role?: UserRole | null;
    created_at?: string | null;
}

export interface BillingHistory {
    id: string;
    organization_id?: string | null;
    amount: number;
    method?: string | null;
    payment_date?: string | null;
    receipt_url?: string | null;
}

// ─────────────────────────────────────────────────────
// MÓDULO 2 — Clientes Globales
// ─────────────────────────────────────────────────────

export interface Customer {
    id: string;
    business_name: string;
    contact_name?: string | null;
    email?: string | null;
    phone?: string | null;
    tax_id?: string | null;
    country_code?: string | null;
    created_at?: string | null;
}

export interface CustomerOrgLink {
    id: string;
    customer_id: string;
    organization_id: string;
    discount_rate?: number | null;
    notes?: string | null;
    is_active?: boolean | null;
    created_at?: string | null;
}

// ─────────────────────────────────────────────────────
// MÓDULO 3 — Insumos y Recetas
// ─────────────────────────────────────────────────────

export interface ProductCategory {
    id: string;
    organization_id: string;
    name: string;
    parent_id?: string | null;
    created_at?: string | null;
}

export interface Supply {
    id: string;
    organization_id: string;
    name: string;
    unit_measure?: string | null;
    unit_cost?: number | null;
    is_active?: boolean | null;
    created_at?: string | null;
}

export interface SupplyStock {
    id: string;
    supply_id: string;
    branch_id: string;
    quantity: number;
    min_stock?: number | null;
    updated_at?: string | null;
}

export interface Product {
    id: string;
    organization_id: string;
    name: string;
    sku?: string | null;
    category_id?: string | null;
    sale_price?: number | null;
    is_active?: boolean | null;
    takeaway_additional_cost?: number | null;
    package_weight_grams?: number | null;
    created_at?: string | null;
}

export interface ProductRecipe {
    id: string;
    product_id: string;
    supply_id: string;
    quantity_required: number;
    condition?: 'always' | 'takeaway' | 'dine_in' | null;
    created_at?: string | null;
}

// ─────────────────────────────────────────────────────
// MÓDULO 4 — Ventas / POS
// ─────────────────────────────────────────────────────

export interface Sale {
    id: string;
    organization_id: string;
    branch_id?: string | null;
    customer_id?: string | null;
    seller_id?: string | null;
    sale_number?: string | null;
    total_amount: number;
    status?: string | null;
    order_type?: string | null;
    created_at?: string | null;
}

export interface SaleItem {
    id: string;
    sale_id: string;
    product_id?: string | null;
    product_name?: string | null;
    quantity: number;
    unit_price: number;
    subtotal?: number | null;
    discount_amount?: number | null;
    discount_percent?: number | null;
    is_courtesy?: boolean | null;
    created_at?: string | null;
}

export interface SalePayment {
    id: string;
    sale_id: string;
    payment_method: PaymentMethodType;
    amount: number;
    created_at?: string | null;
}

// ─────────────────────────────────────────────────────
// MÓDULO 5 — Gastos
// ─────────────────────────────────────────────────────

export interface ExpenseCategory {
    id: string;
    organization_id: string;
    name: string;
    type: 'fixed' | 'variable';
    created_at?: string | null;
}

export interface Expense {
    id: string;
    organization_id: string;
    branch_id?: string | null;
    expense_category_id?: string | null;
    description: string;
    amount: number;
    payment_date?: string | null;
    payment_method?: PaymentMethodType | null;
    created_at?: string | null;
}

export interface SupplyPurchase {
    id: string;
    organization_id: string;
    branch_id?: string | null;
    supply_id: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    purchase_date?: string | null;
    created_at?: string | null;
}

// ─────────────────────────────────────────────────────
// Caja
// ─────────────────────────────────────────────────────

export interface CashOpening {
    id: string;
    branch_id: string;
    user_id: string;
    initial_cash?: number | null;
    notes?: string | null;
    opened_at?: string | null;
    closed?: boolean | null;
}

export interface CashClosure {
    id: string;
    branch_id: string;
    opening_id?: string | null;
    user_id: string;
    system_cash?: number | null;
    system_card?: number | null;
    system_qr?: number | null;
    declared_cash?: number | null;
    declared_card?: number | null;
    declared_qr?: number | null;
    cash_withdrawals?: number | null;
    difference?: number | null;
    notes?: string | null;
    closed_at?: string | null;
}

// ─────────────────────────────────────────────────────
// Cuentas por Cobrar / Pagar
// ─────────────────────────────────────────────────────

export interface AccountsReceivable {
    id: string;
    organization_id: string;
    customer_id?: string | null;
    invoice_number?: string | null;
    description: string;
    total_amount: number;
    paid_amount?: number | null;
    due_date: string;
    status: 'pendiente' | 'parcial' | 'pagado' | 'vencido';
    created_at?: string | null;
    updated_at?: string | null;
}

export interface AccountsPayable {
    id: string;
    organization_id: string;
    invoice_number?: string | null;
    description: string;
    total_amount: number;
    paid_amount?: number | null;
    due_date: string;
    status: 'pendiente' | 'parcial' | 'pagado' | 'vencido';
    created_at?: string | null;
    updated_at?: string | null;
}

// ─────────────────────────────────────────────────────
// Tipos utilitarios (compatibilidad con Supabase generado)
// ─────────────────────────────────────────────────────
export type Database = any;
export type Json = any;
