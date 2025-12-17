import { supabase } from './supabaseClient';

export interface Promocion {
  id: string;
  product_id: string | null;    // Puede ser null si es Convenio Global
  name: string;
  discount_percent: number;
  is_courtesy: boolean;
  start_date: string;
  end_date: string;
  is_active: boolean;
  products?: { name: string } | null;
}

export const getPromociones = async () => {
  const { data, error } = await supabase
    .from('product_promotions')
    .select(`*, products ( name )`)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []) as Promocion[];
};

// Usamos Omit para excluir campos automáticos como ID
export const crearPromocion = async (promo: Omit<Promocion, 'id' | 'products'>, orgId: string) => {
  const { data, error } = await supabase
    .from('product_promotions')
    .insert([{ 
      organization_id: orgId,
      product_id: promo.product_id || null, // Aseguramos que vaya NULL si está vacío
      name: promo.name,
      discount_percent: promo.discount_percent,
      is_courtesy: promo.is_courtesy,
      start_date: promo.start_date,
      end_date: promo.end_date,
      is_active: promo.is_active
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const toggleEstadoPromocion = async (id: string, estadoActual: boolean) => {
  const { error } = await supabase
    .from('product_promotions')
    .update({ is_active: !estadoActual })
    .eq('id', id);
  if (error) throw error;
};

export const eliminarPromocion = async (id: string) => {
  const { error } = await supabase.from('product_promotions').delete().eq('id', id);
  if (error) throw error;
};