// src/services/productosService.js
import { supabase } from './supabaseClient';

// Obtener todos los productos (activos e inactivos) para gestión
export const getTodosLosProductos = async (orgId) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_active', { ascending: false }) // Activos primero
    .order('name', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Actualizar datos básicos (Precio, Nombre, SKU)
export const actualizarProducto = async (id, datos) => {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: datos.name,
      sku: datos.sku,
      sale_price: parseFloat(datos.sale_price),
      description: datos.description
      // No permitimos editar peso o tipo aquí para no romper stock
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Soft Delete (Activar/Desactivar)
export const toggleEstadoProducto = async (id, nuevoEstado) => {
  const { data, error } = await supabase
    .from('products')
    .update({ is_active: nuevoEstado })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};