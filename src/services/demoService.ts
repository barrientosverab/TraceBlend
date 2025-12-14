import { supabase } from './supabaseClient';

export const generarDatosDemo = async (orgId: string) => {
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  // 1. CREAR INSUMOS (Inventario)
  const insumosData = [
    { name: 'Leche Entera', unit_measure: 'L', current_stock: 50, min_stock: 10, cost_per_unit: 6 },
    { name: 'Café Verde (Caturra)', unit_measure: 'Kg', current_stock: 100, min_stock: 20, cost_per_unit: 45 },
    { name: 'Vasos 8oz', unit_measure: 'Und', current_stock: 500, min_stock: 50, cost_per_unit: 0.5 },
    { name: 'Azúcar Morena', unit_measure: 'Kg', current_stock: 10, min_stock: 2, cost_per_unit: 8 },
  ];

  const { data: insumos } = await supabase
    .from('supplies_inventory')
    .insert(insumosData.map(i => ({ ...i, organization_id: orgId })))
    .select();

  // Mapeamos ID de insumos para usar en recetas
  const leche = insumos?.find(i => i.name === 'Leche Entera');
  const vasos = insumos?.find(i => i.name === 'Vasos 8oz');

  // 2. CREAR PRODUCTOS (Catálogo)
  const productosData = [
    { name: 'Cappuccino Clásico', sale_price: 18, category: 'Café', is_roasted: false },
    { name: 'Latte Vainilla', sale_price: 22, category: 'Café', is_roasted: false },
    { name: 'Espresso Doble', sale_price: 12, category: 'Café', is_roasted: false },
    { name: 'Café Tostado Caturra (250g)', sale_price: 60, category: 'Grano', is_roasted: true, package_weight_grams: 250 },
  ];

  const { data: prods } = await supabase
    .from('products')
    .insert(productosData.map(p => ({ ...p, organization_id: orgId, is_active: true })))
    .select();

  // 3. CREAR RECETAS (Ficha Técnica)
  if (prods && leche && vasos) {
    const cappuccino = prods.find(p => p.name.includes('Cappuccino'));
    if (cappuccino) {
      await supabase.from('product_recipes').insert([
        { organization_id: orgId, product_id: cappuccino.id, supply_id: leche.id, quantity: 0.2 },
        { organization_id: orgId, product_id: cappuccino.id, supply_id: vasos.id, quantity: 1 },
      ]);
    }
  }

  // 4. GENERAR VENTAS (Simuladas)
  for (let i = 0; i < 10; i++) {
    const fecha = Math.random() > 0.5 ? hoy : ayer;
    const total = Math.floor(Math.random() * 100) + 20;
    
    // Cabecera Venta
    const { data: orden } = await supabase
      .from('sales_orders')
      .insert({
        organization_id: orgId,
        total_amount: total,
        payment_method: Math.random() > 0.5 ? 'qr' : 'efectivo',
        order_date: fecha.toISOString(),
        status: 'completed'
      })
      .select()
      .single();

    if (orden && prods && prods.length > 0) {
       // Elegimos producto random y forzamos el precio a number (|| 0)
       const prodRandom = prods[Math.floor(Math.random() * prods.length)];
       const precioUnitario = prodRandom.sale_price || 0; 
       
       await supabase.from('sales_order_items').insert({
         organization_id: orgId,
         sales_order_id: orden.id,
         product_id: prodRandom.id,
         quantity: 1, // Cantidad fija para simplificar demo
         unit_price: precioUnitario, // CORRECCIÓN: Ahora es number seguro
         // Eliminamos subtotal si no existe la columna en BD
       });
    }
  }

  // 5. REGISTRAR GASTOS
  await supabase.from('expense_ledger').insert([
    { organization_id: orgId, description: 'Alquiler Local', amount_paid: 2500, category: 'Operativo', payment_date: ayer.toISOString() },
    { organization_id: orgId, description: 'Pago Luz', amount_paid: 350, category: 'Servicios', payment_date: hoy.toISOString() },
    { organization_id: orgId, description: 'Compra Leche Extra', amount_paid: 120, category: 'Insumos', payment_date: hoy.toISOString() },
  ]);

  return true;
};