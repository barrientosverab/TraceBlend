import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

type ProductRow = Database['public']['Tables']['products']['Row'];

// Tipos auxiliares
export interface IngredienteReceta {
  supply_id: string;
  quantity: number;
  nombre_insumo?: string; // Para mostrar en UI
  unidad?: string;        // Para mostrar en UI
}

export interface ProductoForm {
  name: string;
  sku: string | null;
  sale_price: string | number;
  category: string;
  is_roasted: boolean;
  package_weight_grams?: string | number;
  stock_inicial?: string | number;
  receta?: IngredienteReceta[]; // <--- NUEVO CAMPO
}

// 1. Obtener lista de insumos disponibles (para el select del modal)
export const getInsumosDisponibles = async (orgId: string) => {
  const { data, error } = await supabase
    .from('supplies_inventory')
    .select('id, name, unit_measure, current_stock')
    .eq('organization_id', orgId)
    .order('name');
  if (error) throw error;
  return data || [];
};

// 2. Obtener receta de un producto
export const getRecetaProducto = async (productId: string) => {
  const { data, error } = await supabase
    .from('product_recipes')
    .select(`
      supply_id, quantity,
      supplies_inventory ( name, unit_measure )
    `)
    .eq('product_id', productId);
    
  if (error) throw error;
  
  return data.map((r: any) => ({
    supply_id: r.supply_id,
    quantity: r.quantity,
    nombre_insumo: r.supplies_inventory?.name,
    unidad: r.supplies_inventory?.unit_measure
  }));
};

export const getTodosLosProductos = async (orgId: string): Promise<ProductRow[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(`*, finished_inventory ( current_stock )`)
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data.map((p: any) => ({
    ...p,
    stock_actual: p.finished_inventory?.[0]?.current_stock || 0
  }));
};

export const crearProducto = async (datos: ProductoForm, orgId: string) => {
  // A. Insertar Producto
  const { data: prod, error: errProd } = await supabase
    .from('products')
    .insert([{
      organization_id: orgId,
      name: datos.name,
      sku: datos.sku,
      sale_price: Number(datos.sale_price),
      category: datos.category,
      is_roasted: datos.is_roasted,
      package_weight_grams: datos.is_roasted ? Number(datos.package_weight_grams) : null,
      is_active: true
    }])
    .select()
    .single();

  if (errProd) throw errProd;

  // B. Guardar Receta (Si tiene ingredientes)
  if (datos.receta && datos.receta.length > 0) {
    const recetaPayload = datos.receta.map(r => ({
      organization_id: orgId,
      product_id: prod.id,
      supply_id: r.supply_id,
      quantity: r.quantity
    }));
    await supabase.from('product_recipes').insert(recetaPayload);
  }

  // C. Inicializar Inventario Físico (Solo si NO es café tostado ni preparado, ej: Pastelería externa)
  // Si tiene receta, se asume que no maneja stock físico directo, sino calculado.
  // Pero creamos la entrada en 0 por consistencia.
  await supabase.from('finished_inventory').insert([{
    organization_id: orgId,
    product_id: prod.id,
    current_stock: (!datos.is_roasted && datos.stock_inicial && datos.receta?.length === 0) ? Number(datos.stock_inicial) : 0
  }]);

  return prod;
};

export const actualizarProducto = async (id: string, datos: Partial<ProductoForm>, orgId: string) => {
  // 1. Update básico
  const { error } = await supabase
    .from('products')
    .update({
      name: datos.name,
      sku: datos.sku,
      sale_price: Number(datos.sale_price),
      category: datos.category
    })
    .eq('id', id);

  if (error) throw error;

  // 2. Actualizar Receta (Borrar y Crear nueva)
  if (datos.receta) {
    await supabase.from('product_recipes').delete().eq('product_id', id);
    if (datos.receta.length > 0) {
       const recetaPayload = datos.receta.map(r => ({
        organization_id: orgId,
        product_id: id,
        supply_id: r.supply_id,
        quantity: r.quantity
      }));
      await supabase.from('product_recipes').insert(recetaPayload);
    }
  }
};

export const toggleEstadoProducto = async (id: string, nuevoEstado: boolean) => {
  const { data, error } = await supabase.from('products').update({ is_active: nuevoEstado }).eq('id', id).select().single();
  if (error) throw error;
  return data;
};