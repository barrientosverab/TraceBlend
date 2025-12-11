import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

// Helper para extraer tipos de filas (útil para retornos de función)
type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

// Interfaz para los datos que vienen de la UI (Tu formulario)
export interface ProductoForm {
  name: string;
  sku: string | null;
  sale_price: string | number;
}

export const getTodosLosProductos = async (orgId: string): Promise<ProductRow[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_active', { ascending: false })
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const actualizarProducto = async (id: string, datos: ProductoForm) => {
  // Preparamos el objeto con el tipo correcto de la BD
  const updates: ProductUpdate = {
    name: datos.name,
    sku: datos.sku,
    sale_price: Number(datos.sale_price),
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