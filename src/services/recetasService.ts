import { supabase } from './supabaseClient';

interface RecetaItem {
  supply_id: string;
  supply_name?: string;
  unit_measure?: string;
  unit_cost?: number;
  quantity_required: number;
}

/**
 * Obtener productos con sus recetas expandidas (costos de insumos)
 */
export const getProductosParaRecetas = async (orgId: string) => {
  const { data: productos, error } = await supabase
    .from('products')
    .select(`
      id, name, sale_price, is_active, category_id,
      product_recipes (
        id, supply_id, quantity_required, condition,
        supplies ( name, unit_measure, unit_cost )
      )
    `)
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;

  return (productos || []).map((p: any) => {
    const recetas = p.product_recipes || [];
    const costoTotal = recetas.reduce((sum: number, r: any) => {
      const costoInsumo = (r.supplies?.unit_cost || 0) * (r.quantity_required || 0);
      return sum + costoInsumo;
    }, 0);

    return {
      id: p.id,
      name: p.name,
      sale_price: p.sale_price || 0,
      category_id: p.category_id,
      costo_receta: costoTotal,
      margen: p.sale_price ? ((p.sale_price - costoTotal) / p.sale_price * 100) : 0,
      recetas: recetas.map((r: any) => ({
        id: r.id,
        supply_id: r.supply_id,
        supply_name: r.supplies?.name || 'Insumo',
        unit_measure: r.supplies?.unit_measure || 'und',
        unit_cost: r.supplies?.unit_cost || 0,
        quantity_required: r.quantity_required,
        condition: r.condition || 'always',
        costo_linea: (r.supplies?.unit_cost || 0) * (r.quantity_required || 0)
      }))
    };
  });
};

/**
 * Guardar recetas de un producto (reemplaza todas las existentes)
 */
export const guardarRecetas = async (productId: string, items: RecetaItem[], _orgId: string) => {
  // 1. Eliminar recetas existentes
  const { error: deleteError } = await supabase
    .from('product_recipes')
    .delete()
    .eq('product_id', productId);

  if (deleteError) throw deleteError;

  // 2. Insertar nuevas recetas
  if (items.length > 0) {
    const recetas = items.map(item => ({
      product_id: productId,
      supply_id: item.supply_id,
      quantity_required: item.quantity_required,
    }));

    const { error: insertError } = await supabase
      .from('product_recipes')
      .insert(recetas);

    if (insertError) throw insertError;
  }

  return true;
};

/**
 * Obtener solo los insumos disponibles (para el select de recetas)
 */
export const getInsumosParaRecetas = async (orgId: string) => {
  const { data, error } = await supabase
    .from('supplies')
    .select('id, name, unit_measure, unit_cost')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};