import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

// Definimos los tipos basados en la base de datos para máxima seguridad
type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductRecipeInsert = Database['public']['Tables']['product_recipes']['Insert'];

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
  category: string;
  is_roasted: boolean;
  package_weight_grams?: string | number;
  stock_inicial?: string | number;
  receta?: IngredienteReceta[]; // Array de ingredientes
}

/**
 * 1. OBTENER INSUMOS
 * Para llenar el select del modal de Recetas
 */
export const getInsumosDisponibles = async (orgId: string) => {
  const { data, error } = await supabase
    .from('supplies_inventory')
    .select('id, name, unit_measure, current_stock')
    .eq('organization_id', orgId)
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
      supply_id, quantity,
      supplies_inventory ( name, unit_measure )
    `)
    .eq('product_id', productId);

  if (error) throw error;

  // Transformamos la respuesta de Supabase al formato que usa nuestro formulario
  return (data || []).map((r: any) => ({
    supply_id: r.supply_id,
    quantity: r.quantity,
    nombre_insumo: r.supplies_inventory?.name,
    unidad: r.supplies_inventory?.unit_measure
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
      category: datos.category,
      is_roasted: datos.is_roasted,
      package_weight_grams: datos.is_roasted ? Number(datos.package_weight_grams) : null
    }])
    .select()
    .single();

  if (error) throw error;

  // B. Insertar la Receta (Si existe)
  if (datos.receta && datos.receta.length > 0) {
    const recetaPayload: ProductRecipeInsert[] = datos.receta.map(r => ({
      organization_id: orgId,   // ¡IMPORTANTE! Vincular a la organización
      product_id: prod.id,      // Usamos el ID del producto recién creado
      supply_id: r.supply_id,
      quantity: r.quantity
    }));

    const { error: errorReceta } = await supabase
      .from('product_recipes')
      .insert(recetaPayload);
    
    if (errorReceta) console.error("Error guardando receta:", errorReceta);
  }

  // C. Lógica de Stock Inicial (Solo para productos simples NO tostados y SIN receta)
  // Ejemplo: Una galleta comprada a proveedor, un filtro de papel, etc.
  const esProductoSimple = !datos.is_roasted && (!datos.receta || datos.receta.length === 0);
  
  // Siempre creamos una entrada en inventario, aunque sea en 0, para evitar errores de FK
  await supabase.from('finished_inventory').insert([{
    organization_id: orgId,
    product_id: prod.id,
    current_stock: (esProductoSimple && datos.stock_inicial) ? Number(datos.stock_inicial) : 0
  }]);

  return prod;
};

/**
 * 4. ACTUALIZAR PRODUCTO
 * Usa la estrategia "Borrar y Recrear" para la receta
 */
export const actualizarProducto = async (id: string, datos: Partial<ProductoForm>, orgId: string) => {
  // A. Actualizar datos básicos
  const { error } = await supabase
    .from('products')
    .update({
      name: datos.name,
      sku: datos.sku,
      sale_price: Number(datos.sale_price),
      category: datos.category,
      // Nota: is_roasted no se suele cambiar tras crear por las implicaciones de inventario
    })
    .eq('id', id);

  if (error) throw error;

  // B. Actualizar Receta (Estrategia: Nuclear ☢️ -> Borrar todo y reinsertar)
  if (datos.receta) {
    // 1. Borramos ingredientes viejos
    await supabase
      .from('product_recipes')
      .delete()
      .eq('product_id', id);

    // 2. Insertamos los nuevos (si hay)
    if (datos.receta.length > 0) {
       const recetaPayload: ProductRecipeInsert[] = datos.receta.map(r => ({
        organization_id: orgId,
        product_id: id,
        supply_id: r.supply_id,
        quantity: r.quantity
      }));

      await supabase.from('product_recipes').insert(recetaPayload);
    }
  }
};

/**
 * 5. OBTENER TODOS (LISTADO)
 */
export const getTodosLosProductos = async (orgId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      finished_inventory ( current_stock )
    `)
    .eq('organization_id', orgId)
    .eq('is_active', true) // Solo activos
    .order('name');

  if (error) throw error;
  return data || [];
};