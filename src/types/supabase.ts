/**
 * Tipos de la base de datos Supabase — TraceBlend
 * Actualizado: 2026-03-01 (optimización v2)
 *
 * TABLAS CONFIRMADAS (32):
 * billing_history, cash_closures, cash_openings, clients,
 * cupping_defects, expense_ledger, farms, finished_inventory,
 * fixed_expenses, green_coffee_warehouse, lab_reports,
 * lab_reports_cupping, lab_reports_physical, machines,
 * milling_inputs, milling_processes, organizations,
 * packaging_logs, product_promotions, product_recipes,
 * products, profiles, raw_inventory_batches,
 * roast_batch_inputs, roast_batches, sales_order_items,
 * sales_order_payments, sales_orders, subscription_plan_features,
 * subscription_plans, suppliers, supplies_inventory
 *
 * ELIMINADAS: supply_movements (sin uso)
 *
 * VISTAS ACTIVAS (9):
 * organization_subscription_details, v_lab_reports_complete,
 * vw_inventory_status, vw_roast_costs, vw_sales_detailed,
 * vw_recent_activity, v_product_seasonality,
 * v_financial_comparison, v_sales_summary
 */

// ─────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────

export type AppRole =
    | 'administrador'
    | 'laboratorio'
    | 'operador'
    | 'tostador'
    | 'vendedor'
    | 'viewer';

export type CoffeeState =
    | 'cereza'
    | 'pergamino_humedo'
    | 'pergamino_seco'
    | 'oro_verde'
    | 'inferior';

export type ExpenseCategory =
    | 'alquiler'
    | 'nomina'
    | 'servicios'
    | 'insumos_cafeteria'
    | 'mantenimiento'
    | 'marketing'
    | 'impuestos'
    | 'otros';

export type FrequencyType = 'mensual' | 'anual' | 'quincenal' | 'unico';

export type ScreenSize =
    | 'malla_18'
    | 'malla_16'
    | 'malla_14'
    | 'caracol'
    | 'base_pasilla'
    | 'cascarilla'
    | 'sin_clasificar';

export type SubscriptionPlanEnum = 'free_trial' | 'barista' | 'tostador' | 'enterprise';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export type SupplierType = 'productor' | 'cooperativa' | 'importador';

// ─────────────────────────────────────────────────────
// TABLAS — Módulo SaaS / Autenticación
// ─────────────────────────────────────────────────────

export interface Organization {
    id: string;
    name: string;
    address?: string | null;
    phone?: string | null;
    tax_id?: string | null;
    logo_url?: string | null;
    currency_symbol?: string | null;
    plan?: SubscriptionPlanEnum | null;
    status?: SubscriptionStatus | null;
    trial_ends_at?: string | null;
    next_payment_date?: string | null;
    setup_completed?: boolean | null;
    subscription_plan_id?: string | null; // FK → subscription_plans
    created_at?: string | null;
    // ELIMINADO: plan_type (no existe en BD real)
}

export interface Profile {
    id: string; // = auth.uid()
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    role?: AppRole | null;
    organization_id?: string | null;
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
// TABLAS — Módulo Suscripciones
// ─────────────────────────────────────────────────────

export interface SubscriptionPlan {
    id: string;
    name: string;
    code: string; // 'free_trial' | 'basic' | 'professional'
    description?: string | null;
    monthly_price: number;
    max_users?: number | null;
    is_active: boolean;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface SubscriptionPlanFeature {
    id: string;
    subscription_plan_id: string;
    feature_code: string;
    created_at?: string | null;
}

// ─────────────────────────────────────────────────────
// TABLAS — Supply Chain (materia prima)
// ─────────────────────────────────────────────────────

export interface Supplier {
    id: string;
    name: string;
    tax_id?: string | null;
    type: SupplierType;
    organization_id: string;
    created_at?: string | null;
}

export interface Farm {
    id: string;
    name: string;
    producer_name?: string | null;
    country_code?: string | null;
    region?: string | null;
    sub_region?: string | null;
    altitude_masl?: number | null;
    certifications?: string[] | null;
    supplier_id?: string | null;
    organization_id: string;
    created_at?: string | null;
}

export interface RawInventoryBatch {
    id: string;
    code_ref?: string | null;
    current_state: CoffeeState;
    initial_quantity: number;
    current_quantity: number;
    unit_of_measure?: string | null;
    humidity_percentage?: number | null;
    process?: string | null;
    variety?: string | null;
    purchase_date?: string | null;
    total_cost_local?: number | null;
    currency_original?: string | null;
    observations?: string | null;
    farm_id?: string | null;
    organization_id: string;
    created_at?: string | null;
}

export interface MillingProcess {
    id: string;
    process_date?: string | null;
    service_provider?: string | null;
    service_cost?: number | null;
    observations?: string | null;
    created_by?: string | null;
    organization_id: string;
}

export interface MillingInput {
    id: string;
    milling_process_id?: string | null;
    raw_inventory_id?: string | null;
    weight_used_kg: number;
    organization_id: string;
}

export interface GreenCoffeeWarehouse {
    id: string;
    name_ref?: string | null;
    quantity_kg: number;
    screen_size: ScreenSize;
    unit_cost_local?: number | null;
    is_available?: boolean | null;
    milling_process_id?: string | null;
    organization_id: string;
    created_at?: string | null;
}

// ─────────────────────────────────────────────────────
// TABLAS — Laboratorio
// ─────────────────────────────────────────────────────

export interface LabReport {
    id: string;
    batch_id?: string | null;
    analysis_date?: string | null;
    green_quantity: number;
    sample_total_grams: number;
    mesh_18?: number | null;
    mesh_16?: number | null;
    mesh_14?: number | null;
    base?: number | null;
    defects?: number | null;
    density?: number | null;
    humidity_percentage?: number | null;
    yield_factor?: number | null;
    cupping_score?: number | null;
    sensory_notes?: string | null;
    organization_id: string;
    created_at?: string | null;
}

/** Cata SCA — columnas confirmadas en BD */
export interface LabReportCupping {
    id: string;
    lab_report_id?: string | null;
    flavor?: number | null;
    aftertaste?: number | null;
    acidity?: number | null;
    body?: number | null;
    balance?: number | null;
    uniformity?: number | null;
    clean_cup?: number | null;
    sweetness?: number | null;
    overall?: number | null;
    total_score?: number | null;
}

export interface LabReportPhysical {
    id: string;
    lab_report_id?: string | null;
    [key: string]: unknown; // columnas pendientes de documentar
}

export interface CuppingDefect {
    id: string;
    [key: string]: unknown; // columnas pendientes de documentar
}

// ─────────────────────────────────────────────────────
// TABLAS — Tueste
// ─────────────────────────────────────────────────────

export interface Machine {
    id: string;
    name: string;
    brand?: string | null;
    model?: string | null;
    capacity_kg?: number | null;
    connection_type?: string | null;
    bridge_ip?: string | null;
    sensor_config?: Record<string, unknown> | null;
    driver_config?: Record<string, unknown> | null;
    is_active?: boolean | null;
    organization_id: string;
    created_at?: string | null;
}

/** Notas de cata post-tueste según protocolo SCA */
export interface CuppingNotes {
    fragrance?: number;
    aroma?: number;
    flavor?: number;
    aftertaste?: number;
    acidity?: number;
    acidity_intensity?: 'alta' | 'media' | 'baja';
    body?: number;
    body_level?: 'pleno' | 'cremoso' | 'ligero';
    balance?: number;
    uniformity?: number;
    clean_cup?: number;
    sweetness?: number;
    overall?: number;
    defects?: number;
    total_score?: number;
    flavor_descriptors?: string[];
    aroma_descriptors?: string[];
    cata_date?: string;
    cupper_name?: string;
}

export interface RoastBatch {
    id: string;
    roast_date?: string | null;
    operator_name?: string | null;
    machine_id?: string | null;
    green_weight_input?: number | null;
    roasted_weight_output?: number | null;
    total_time_seconds?: number | null;
    initial_bean_temp?: number | null;
    initial_bean_humidity?: number | null;
    ambient_temp?: number | null;
    relative_humidity?: number | null;
    drop_temp?: number | null;
    roast_log_data?: Record<string, unknown> | null;
    // Campos IA (migración 2026-02-19) — CONFIRMADOS en BD
    altitude_masl?: number | null;
    apparent_density?: number | null;
    bean_humidity_pct?: number | null;
    water_activity?: number | null;
    variety?: string | null;
    process_method?: string | null;
    ambient_pressure_hpa?: number | null;
    cupping_notes?: CuppingNotes | null;
    roast_color_agtron?: number | null;
    roast_level?: 'Light' | 'Medium-Light' | 'Medium' | 'Medium-Dark' | 'Dark' | null;
    first_crack_time?: number | null;
    first_crack_temp?: number | null;
    development_time_pct?: number | null;
    ror_peak?: number | null;
    ror_at_drop?: number | null;
    batch_notes?: string | null;
    organization_id: string;
    created_at?: string | null;
}

export interface RoastBatchInput {
    id: string;
    roast_batch_id?: string | null;
    green_inventory_id?: string | null;
    quantity_used_kg: number;
    organization_id: string;
}

// ─────────────────────────────────────────────────────
// TABLAS — Producción / Inventario
// ─────────────────────────────────────────────────────

export interface PackagingLog {
    id: string;
    packaging_date?: string | null;
    product_id?: string | null;
    roast_batch_id?: string | null;
    units_created: number;
    operator_id?: string | null;
    organization_id: string;
    created_at?: string | null;
}

export interface FinishedInventory {
    id: string;
    product_id?: string | null;
    current_stock?: number | null;
    last_updated?: string | null;
    organization_id: string;
}

export interface SuppliesInventory {
    id: string;
    name: string;
    unit_measure: string;
    current_stock?: number | null;
    low_stock_threshold?: number | null;
    unit_cost?: number | null;
    organization_id: string;
    updated_at?: string | null;
}

// supply_movements fue eliminada en la optimización v2 (2026-03-01)
// La tabla nunca fue integrada en el frontend

// ─────────────────────────────────────────────────────
// TABLAS — Productos / Ventas
// ─────────────────────────────────────────────────────

export interface Product {
    id: string;
    name: string;
    sku?: string | null;
    category?: string | null;
    is_roasted?: boolean | null;
    is_active?: boolean | null;
    sale_price?: number | null;
    currency_sale?: string | null;
    package_weight_grams?: number | null;
    source_green_inventory_id?: string | null;
    container_supply_id?: string | null;       // ✅ confirmado en BD
    takeaway_additional_cost?: number | null;  // ✅ confirmado en BD
    organization_id: string;
}

export interface ProductRecipe {
    id: string;
    product_id?: string | null;
    supply_id?: string | null;
    quantity: number;
    organization_id?: string | null;
    created_at?: string | null;
}

export interface ProductPromotion {
    id: string;
    name: string;
    product_id?: string | null;
    discount_percent?: number | null;
    is_courtesy?: boolean | null;
    start_date: string;
    end_date: string;
    is_active?: boolean | null;
    organization_id: string;
    created_at?: string | null;
}

export interface Client {
    id: string;
    business_name: string;
    contact_name?: string | null;
    client_type?: string | null;
    email?: string | null;
    phone?: string | null;
    tax_id?: string | null;
    discount_rate?: number | null;
    is_active?: boolean | null;
    notes?: string | null;
    organization_id: string;
    created_at?: string | null;
}

export interface SalesOrder {
    id: string;
    invoice_number?: string | null;
    sale_number?: string | null;       // ✅ agregado en migración 2026-02-23
    order_date?: string | null;
    order_type?: string | null;
    status?: string | null;
    total_amount: number;
    payment_method?: string | null;
    is_mixed_payment?: boolean | null; // ✅ confirmado en BD
    currency_code?: string | null;
    client_id?: string | null;
    seller_id?: string | null;
    organization_id: string;
}

export interface SalesOrderItem {
    id: string;
    sales_order_id?: string | null;
    product_id?: string | null;
    green_inventory_id?: string | null;
    quantity: number;
    unit_price: number;
    subtotal?: number | null;
    product_name?: string | null;      // ✅ agregado en migración 2026-02-23
    discount_amount?: number | null;
    discount_reason?: string | null;
    discount_percent?: number | null;  // ✅ agregado en migración 2026-02-23
    is_courtesy?: boolean | null;
    para_llevar?: boolean | null;      // ✅ confirmado en BD
    container_cost?: number | null;    // ✅ confirmado en BD
    organization_id: string;
}

export interface SalesOrderPayment {
    id: string;
    sales_order_id: string;
    payment_method: 'Efectivo' | 'QR' | 'Tarjeta';
    amount: number;
    organization_id: string;
    created_at?: string | null;
}

// ─────────────────────────────────────────────────────
// TABLAS — Finanzas / Caja
// ─────────────────────────────────────────────────────

export interface FixedExpense {
    id: string;
    name: string;
    amount: number;
    category: ExpenseCategory;
    frequency: FrequencyType;
    cost_center?: 'produccion' | 'ventas_marketing' | 'administracion' | 'otro' | null;
    is_active?: boolean | null;
    organization_id: string;
    created_at?: string | null;
}

export interface ExpenseLedger {
    id: string;
    expense_id?: string | null;
    description: string;
    amount_paid: number;
    payment_date: string;
    payment_method?: string | null;
    cost_center?: 'produccion' | 'ventas_marketing' | 'administracion' | 'otro' | null;
    organization_id: string;
    created_at?: string | null;
}

export interface MonthlyBudget {
    id: string;
    organization_id: string;
    category: string;             // matches ExpenseCategory values
    cost_center?: 'produccion' | 'ventas_marketing' | 'administracion' | 'otro' | null;
    budget_amount: number;
    month_year: string;           // format: 'YYYY-MM'
    notes?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface AccountsReceivable {
    id: string;
    organization_id: string;
    client_id?: string | null;
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
    supplier_id?: string | null;
    invoice_number?: string | null;
    description: string;
    total_amount: number;
    paid_amount?: number | null;
    due_date: string;
    status: 'pendiente' | 'parcial' | 'pagado' | 'vencido';
    created_at?: string | null;
    updated_at?: string | null;
}

export interface CashOpening {
    id: string;
    initial_cash?: number | null;
    notes?: string | null;
    opened_at?: string | null;
    user_id: string;
    organization_id: string;
}

export interface CashClosure {
    id: string;
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
    user_id: string;
    organization_id: string;
}
