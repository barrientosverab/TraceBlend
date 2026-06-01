import { supabase } from './supabaseClient';

// Tipos auxiliares para el Formulario de React
export interface IngredienteReceta {
  supply_id: string;
  quantity: number;
  nombre_insumo?: string; // Solo para visualización en UI
  unidad?: string;        // Solo para visualización en UI
}

export interface ProductoForm {
  name: string;
  sku: string | null;
  sale_price: string | number;
  category_id?: string | null;
  package_weight_grams?: string | number;
  stock_inicial?: string | number;
  receta?: IngredienteReceta[]; // Array de ingredientes
  takeaway_additional_cost?: string | number; // Costo adicional por envase
  is_active?: boolean;
  is_roasted?: boolean;
  container_supply_id?: string | null;
}

/**
 * 1. OBTENER INSUMOS
 * Para llenar el select del modal de Recetas
 */
export const getInsumosDisponibles = async (orgId: string) => {
  const { data, error } = await supabase
    .from('supplies')
    .select('id, name, unit, cost_per_unit')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return data || [];
};

/**
 * 2. OBTENER RECETA EXISTENTE
 * Cuando editamos un producto, necesitamos cargar sus ingredientes
 */
export const getRecetaProducto = async (productId: string): Promise<IngredienteReceta[]> => {
  const { data, error } = await supabase
    .from('product_recipes')
    .select(`
      supply_id,
      quantity_used,
      supplies (name, unit)
    `)
    .eq('product_id', productId);
  if (error) throw error;
  return (data || []).map((r: any) => ({
    supply_id: r.supply_id,
    quantity: r.quantity_used,
    nombre_insumo: r.supplies?.name,
    unidad: r.supplies?.unit,
  }));
};

/**
 * 3. CREAR PRODUCTO (MAESTRO + DETALLE)
 * Guarda el producto y sus ingredientes en una sola operación lógica
 */
export const crearProducto = async (datos: ProductoForm, orgId: string) => {
  // A. Insertar el Producto Padre
  const { data: prod, error } = await supabase
    .from('products')
    .insert([{
      organization_id: orgId,
      name: datos.name,
      sku: datos.sku,
      sale_price: Number(datos.sale_price),
      category_id: datos.category_id || null,
      package_weight_grams: datos.package_weight_grams ? Number(datos.package_weight_grams) : null,
      takeaway_additional_cost: datos.takeaway_additional_cost ? Number(datos.takeaway_additional_cost) : 0,
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;

  // B. Insertar la Receta (ingredientes con supply_id válido)
  if (datos.receta && datos.receta.length > 0) {
    const recetaItems = datos.receta
      .filter(ing => ing.supply_id)
      .map(ing => ({
        product_id: prod.id,
        supply_id: ing.supply_id,
        quantity_used: Number(ing.quantity),
        organization_id: orgId,
      }));

    if (recetaItems.length > 0) {
      const { error: recetaError } = await supabase
        .from('product_recipes')
        .insert(recetaItems);
      if (recetaError) throw recetaError;
    }
  }

  return prod;
};

/**
 * 4. ACTUALIZAR PRODUCTO
 * Usa la estrategia "Borrar y Recrear" para la receta
 */
export const actualizarProducto = async (id: string, datos: Partial<ProductoForm>, _orgId: string) => {
  // A. Actualizar datos básicos
  const { error } = await supabase
    .from('products')
    .update({
      name: datos.name,
      sku: datos.sku,
      sale_price: Number(datos.sale_price),
      category_id: datos.category_id || null,
      takeaway_additional_cost: datos.takeaway_additional_cost ? Number(datos.takeaway_additional_cost) : 0
    })
    .eq('id', id);

  if (error) throw error;

  // B. Borrar receta existente
  await supabase
    .from('product_recipes')
    .delete()
    .eq('product_id', id);

  // C. Recrear con nuevos ingredientes
  if (datos.receta && datos.receta.length > 0) {
    const recetaItems = datos.receta
      .filter(ing => ing.supply_id)
      .map(ing => ({
        product_id: id,
        supply_id: ing.supply_id,
        quantity_used: Number(ing.quantity),
        organization_id: _orgId,
      }));

    if (recetaItems.length > 0) {
      await supabase
        .from('product_recipes')
        .insert(recetaItems);
    }
  }
};

/**
 * 5. OBTENER TODOS (LISTADO)
 */
export const getTodosLosProductos = async (orgId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select(`*`)
    .eq('organization_id', orgId)
    .eq('is_active', true) // Solo activos
    .order('name');

  if (error) throw error;
  return data || [];
};