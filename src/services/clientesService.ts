import { supabase } from './supabaseClient';
// Types imported directly from Supabase response

/**
 * Obtiene clientes vinculados a la organización (via customer_org_links)
 */
export const getTodosLosClientes = async (orgId: string) => {
  const { data, error } = await supabase
    .from('customer_org_links')
    .select(`
      id,
      discount_rate,
      notes,
      is_active,
      customers (id, business_name, contact_name, tax_id, email, phone)
    `)
    .eq('organization_id', orgId)
    .order('is_active', { ascending: false });

  if (error) throw error;

  return (data || []).map((link: any) => ({
    id: link.customers?.id,
    link_id: link.id,
    business_name: link.customers?.business_name,
    contact_name: link.customers?.contact_name,
    tax_id: link.customers?.tax_id,
    email: link.customers?.email,
    phone: link.customers?.phone,
    discount_rate: link.discount_rate || 0,
    notes: link.notes,
    is_active: link.is_active ?? true,
  }));
};

export interface ClienteForm {
  business_name: string;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  discount_rate: string | number;
  notes: string | null;
}

/**
 * Actualiza datos del cliente global y el vínculo con la org
 */
export const actualizarCliente = async (id: string, linkId: string, datos: ClienteForm) => {
  // Actualizar datos globales del cliente
  const { data, error } = await supabase
    .from('customers')
    .update({
      business_name: datos.business_name,
      tax_id: datos.tax_id,
      email: datos.email,
      phone: datos.phone,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  // Actualizar datos del vínculo (descuento, notas)
  if (linkId) {
    await supabase
      .from('customer_org_links')
      .update({
        discount_rate: Number(datos.discount_rate) || 0,
        notes: datos.notes
      })
      .eq('id', linkId);
  }

  return data;
};

/**
 * Desactivar/activar vínculo del cliente con la org
 */
export const toggleEstadoCliente = async (linkId: string, nuevoEstado: boolean) => {
  const { error } = await supabase
    .from('customer_org_links')
    .update({ is_active: nuevoEstado })
    .eq('id', linkId);

  if (error) throw error;
  return true;
};