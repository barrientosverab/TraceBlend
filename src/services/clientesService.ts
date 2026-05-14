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
      customers (id, business_name, contact_name, tax_id, email, phone)
    `)
    .eq('organization_id', orgId);

  if (error) throw error;

  return (data || []).map((link: any) => ({
    id: link.customers?.id,
    link_id: link.id,
    business_name: link.customers?.business_name,
    contact_name: link.customers?.contact_name,
    tax_id: link.customers?.tax_id,
    email: link.customers?.email,
    phone: link.customers?.phone,
  }));
};

export interface ClienteForm {
  business_name: string;
  tax_id: string | null;
  email: string | null;
  phone: string | null;
}

/**
 * Actualiza datos del cliente global
 */
export const actualizarCliente = async (id: string, _linkId: string, datos: ClienteForm) => {
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

  return data;
};