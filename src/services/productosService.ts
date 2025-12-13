import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

// Interfaz unificada para el formulario
export interface ProductoForm {
  name: string;
  sku: string | null;
  sale_price: string | number;
  category: string;
  is_roasted: boolean;
  package_weight_grams?: string | number;
  stock_inicial?: string | number; // Opcional para productos que no son de café (ej: galletas)
}

// 1. Obtener Todo el Catálogo
export const getTodosLosProductos = async (orgId: string): Promise<ProductRow[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      finished_inventory ( current_stock )
    `)
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true });
  
  if (error) throw error;

  // Aplanamos el stock para facilitar la UI
  return data.map((p: any) => ({
    ...p,
    stock_actual: p.finished_inventory?.[0]?.current_stock || 0
  }));
};

// 2. Crear Producto (Unificado)
export const crearProducto = async (datos: ProductoForm, orgId: string) => {
  // A. Insertar Producto
  const newProduct: ProductInsert = {
    organization_id: orgId,
    name: datos.name,
    sku: datos.sku,
    sale_price: Number(datos.sale_price),
    category: datos.category,
    is_roasted: datos.is_roasted,
    package_weight_grams: datos.is_roasted ? Number(datos.package_weight_grams) : null,
    is_active: true
  };

  const { data: prod, error: errProd } = await supabase
    .from('products')
    .insert([newProduct])
    .select()
    .single();

  if (errProd) throw errProd;

  // B. Inicializar Inventario (Para items que no vienen de producción, ej: Pastelería)
  if (!datos.is_roasted && datos.stock_inicial) {
    await supabase.from('finished_inventory').insert([{
      organization_id: orgId,
      product_id: prod.id,
      current_stock: Number(datos.stock_inicial)
    }]);
  } else {
    // Crear entrada de inventario en 0 para café (se llenará desde Empaque)
    await supabase.from('finished_inventory').insert([{
      organization_id: orgId,
      product_id: prod.id,
      current_stock: 0
    }]);
  }

  return prod;
};

// 3. Actualizar
export const actualizarProducto = async (id: string, datos: Partial<ProductoForm>) => {
  const updates: ProductUpdate = {
    name: datos.name,
    sku: datos.sku,
    sale_price: Number(datos.sale_price),
    category: datos.category
  };

  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// 4. Eliminar (Soft Delete)
export const toggleEstadoProducto = async (id: string, nuevoEstado: boolean) => {
  const { data, error } = await supabase
    .from('products')
    .update({ is_active: nuevoEstado })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};