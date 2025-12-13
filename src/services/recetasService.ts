import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

// Tipos para facilitar el uso en la UI
export interface RecetaItem {
  id: string;
  supply_id: string;
  quantity_required: number;
  // Datos del insumo (Join)
  insumo_nombre: string;
  insumo_medida: string;
  insumo_costo: number;
}

export interface ProductoConReceta {
  id: string;
  name: string;
  sale_price: number;
  costo_estimado: number; // Suma de costos de ingredientes
}

// 1. Obtener productos con su costo calculado
export const getProductosParaRecetas = async (orgId: string): Promise<ProductoConReceta[]> => {
  // Traemos productos y sus recetas
  const { data: productos, error } = await (supabase as any)
    .from('products')
    .select(`
      id, name, sale_price,
      product_recipes (
        quantity_required,
        supplies_inventory ( unit_cost )
      )
    `)
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;

  // Calculamos el costo total sumando (cantidad * costo_unitario) de cada ingrediente
  return (productos || []).map((p: any) => {
    const costoTotal = p.product_recipes?.reduce((sum: number, r: any) => {
      const cantidad = r.quantity_required || 0;
      const costoUnitario = r.supplies_inventory?.unit_cost || 0;
      return sum + (cantidad * costoUnitario);
    }, 0);

    return {
      id: p.id,
      name: p.name,
      sale_price: p.sale_price || 0,
      costo_estimado: costoTotal
    };
  });
};

// 2. Obtener ingredientes de un producto específico
export const getIngredientesProducto = async (productId: string): Promise<RecetaItem[]> => {
  const { data, error } = await (supabase as any)
    .from('product_recipes')
    .select(`
      id, supply_id, quantity_required,
      supplies_inventory ( name, unit_measure, unit_cost )
    `)
    .eq('product_id', productId);

  if (error) throw error;

  return (data || []).map((r: any) => ({
    id: r.id,
    supply_id: r.supply_id,
    quantity_required: r.quantity_required,
    insumo_nombre: r.supplies_inventory?.name || 'Desconocido',
    insumo_medida: r.supplies_inventory?.unit_measure || '',
    insumo_costo: r.supplies_inventory?.unit_cost || 0
  }));
};

// 3. Agregar Ingrediente
export const agregarIngrediente = async (productId: string, supplyId: string, cantidad: number, condicion: 'always' | 'takeaway' | 'dine_in' = 'always') => {
  const { data, error } = await supabase
    .from('product_recipes')
    .insert([{
      product_id: productId,
      supply_id: supplyId,
      quantity_required: cantidad,
      condition: condicion
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 4. Eliminar Ingrediente
export const eliminarIngrediente = async (recetaId: string) => {
  const { error } = await supabase
    .from('product_recipes')
    .delete()
    .eq('id', recetaId);
  
  if (error) throw error;
};