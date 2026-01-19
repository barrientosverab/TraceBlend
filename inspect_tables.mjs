import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gcxsrvvmfhhvbxwhknau.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjeHNydnZtZmhodmJ4d2hrbmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2Njk0NTcsImV4cCI6MjA3OTI0NTQ1N30.zf9v_4vobD_kwINjA28Ceyed4MUeqYdiKp9P_5QQjYc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Obtenemos el conteo real de filas para cada tabla
const TABLES = [
    'organizations', 'profiles', 'billing_history',
    'subscription_plans', 'subscription_plan_features',
    'suppliers', 'farms', 'raw_inventory_batches',
    'milling_processes', 'milling_inputs', 'green_coffee_warehouse',
    'lab_reports', 'lab_reports_cupping', 'lab_reports_physical', 'cupping_defects',
    'machines', 'roast_batches', 'roast_batch_inputs',
    'products', 'packaging_logs', 'finished_inventory',
    'supplies_inventory', 'supply_movements', 'product_recipes',
    'clients', 'sales_orders', 'sales_order_items', 'sales_order_payments',
    'product_promotions',
    'fixed_expenses', 'expense_ledger',
    'cash_openings', 'cash_closures'
];

async function getTableInfo(table) {
    // Row count
    const { count, error: cErr } = await supabase
        .from(table).select('*', { count: 'exact', head: true });

    // Sample row to get columns
    const { data: sample, error: sErr } = await supabase
        .from(table).select('*').limit(1);

    let columns = [];
    if (!sErr && sample !== null) {
        if (sample.length > 0) {
            columns = Object.entries(sample[0]).map(([k, v]) => ({
                name: k,
                type: v === null ? 'null' : typeof v === 'object' ? 'jsonb/array' : typeof v
            }));
        } else {
            // Empty table — try to infer from error of bad column
            columns = [{ name: '(sin datos)', type: '-' }];
        }
    } else if (sErr) {
        columns = [{ name: 'ERROR', type: sErr.message }];
    }

    return {
        table,
        rowCount: cErr ? 'RLS?' : count,
        columns,
        hasError: !!sErr
    };
}

async function main() {
    console.log('# REVISIÓN POR TABLA — TraceBlend Supabase');
    console.log(`Fecha: ${new Date().toISOString()}\n`);
    console.log('='.repeat(70));

    const results = [];
    for (const table of TABLES) {
        const info = await getTableInfo(table);
        results.push(info);

        const rowStr = String(info.rowCount).padEnd(6);
        const colStr = info.columns.length;
        console.log(`\n### ${table}`);
        console.log(`  Filas: ${rowStr}  Columnas detectadas: ${colStr}`);

        if (info.columns.length > 0 && info.columns[0].name !== '(sin datos)') {
            info.columns.forEach(c => {
                console.log(`    - ${c.name.padEnd(30)} [${c.type}]`);
            });
        } else {
            console.log('    (tabla vacía — columnas no visibles sin datos)');
        }
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n## RESUMEN');
    console.log(`Total tablas revisadas: ${results.length}`);
    console.log(`Con datos: ${results.filter(r => r.rowCount > 0).length}`);
    console.log(`Vacías: ${results.filter(r => r.rowCount === 0).length}`);
    console.log(`Con error RLS: ${results.filter(r => r.rowCount === 'RLS?').length}`);

    // Tables with data
    console.log('\nTablas con datos:');
    results.filter(r => typeof r.rowCount === 'number' && r.rowCount > 0)
        .forEach(r => console.log(`  - ${r.table}: ${r.rowCount} filas`));
}

main().catch(console.error);
