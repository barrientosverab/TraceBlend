import { supabase } from './supabaseClient';

export const generarDatosDemo = async (orgId: string, branchId: string) => {
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  // 1. CREAR INSUMOS
  const insumosData = [
    { name: 'Leche Entera', unit_measure: 'L', unit_cost: 6 },
    { name: 'Café Verde (Caturra)', unit_measure: 'Kg', unit_cost: 45 },
    { name: 'Vasos 8oz', unit_measure: 'Und', unit_cost: 0.5 },
    { name: 'Azúcar Morena', unit_measure: 'Kg', unit_cost: 8 },
  ];

  const { data: insumos } = await supabase
    .from('supplies')
    .insert(insumosData.map(i => ({ ...i, organization_id: orgId, is_active: true })))
    .select();

  // Crear stock inicial por sucursal
  if (insumos) {
    const stockData = insumos.map((ins: any, idx: number) => ({
      supply_id: ins.id,
      branch_id: branchId,
      quantity: [50, 100, 500, 10][idx] || 0,
      min_stock: [10, 20, 50, 2][idx] || 0,
    }));

    await supabase.from('supply_stock').insert(stockData);
  }

  // Mapeamos ID de insumos para usar en recetas
  const leche = insumos?.find(i => i.name === 'Leche Entera');
  const vasos = insumos?.find(i => i.name === 'Vasos 8oz');

  // 2. CREAR PRODUCTOS
  const productosData = [
    { name: 'Cappuccino Clásico', sale_price: 18, is_active: true },
    { name: 'Latte Vainilla', sale_price: 22, is_active: true },
    { name: 'Espresso Doble', sale_price: 12, is_active: true },
    { name: 'Café Tostado Caturra (250g)', sale_price: 60, is_active: true, package_weight_grams: 250 },
  ];

  const { data: prods } = await supabase
    .from('products')
    .insert(productosData.map(p => ({ ...p, organization_id: orgId })))
    .select();

  // 3. CREAR RECETAS
  if (prods && leche && vasos) {
    const cappuccino = prods.find(p => p.name.includes('Cappuccino'));
    if (cappuccino) {
      await supabase.from('product_recipes').insert([
        { product_id: cappuccino.id, supply_id: leche.id, quantity_required: 0.2 },
        { product_id: cappuccino.id, supply_id: vasos.id, quantity_required: 1 },
      ]);
    }
  }

  // 4. GENERAR VENTAS SIMULADAS
  for (let i = 0; i < 10; i++) {
    const fecha = Math.random() > 0.5 ? hoy : ayer;
    const total = Math.floor(Math.random() * 100) + 20;

    const { data: sale } = await supabase
      .from('sales')
      .insert({
        organization_id: orgId,
        branch_id: branchId,
        total: total,
        created_at: fecha.toISOString(),
        sale_status: 'completed'
      } as any)
      .select()
      .single();

    if (sale && prods && prods.length > 0) {
      const prodRandom = prods[Math.floor(Math.random() * prods.length)];
      const precioUnitario = prodRandom.sale_price || 0;

      await supabase.from('sale_items').insert({
        sale_id: sale.id,
        product_id: prodRandom.id,
        product_name: prodRandom.name,
        quantity: 1,
        unit_price: precioUnitario,
        subtotal: precioUnitario
      });

      // Registrar pago
      const metodo = Math.random() > 0.5 ? 'qr' : 'cash';
      await supabase.from('sale_payments').insert({
        sale_id: sale.id,
        payment_method: metodo,
        amount: total
      });
    }
  }

  await supabase.from('expenses').insert([
    { organization_id: orgId, description: 'Alquiler Local', amount: 2500, expense_date: ayer.toISOString().split('T')[0] } as any,
    { organization_id: orgId, description: 'Pago Luz', amount: 350, expense_date: hoy.toISOString().split('T')[0] } as any,
    { organization_id: orgId, description: 'Compra Leche Extra', amount: 120, expense_date: hoy.toISOString().split('T')[0] } as any,
  ]);

  return true;
};