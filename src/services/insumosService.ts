import { supabase } from './supabaseClient';

export const getInsumos = async (orgId: string, branchId?: string) => {
  // Obtener insumos con su stock de la sucursal
  const query = supabase
    .from('supplies')
    .select(`
      id, name, unit_measure, unit_cost, is_active,
      supply_stock (id, quantity, min_stock, branch_id)
    `)
    .eq('organization_id', orgId)
    .order('name');

  const { data, error } = await query;
  if (error) throw error;

  // Aplanar: un insumo con su stock de la sucursal actual
  return (data || []).map((s: any) => {
    const stock = branchId
      ? s.supply_stock?.find((ss: any) => ss.branch_id === branchId)
      : s.supply_stock?.[0];

    return {
      id: s.id,
      name: s.name,
      unit_measure: s.unit_measure,
      unit_cost: s.unit_cost || 0,
      is_active: s.is_active ?? true,
      current_stock: stock?.quantity || 0,
      min_stock: stock?.min_stock || 0,
      stock_id: stock?.id || null,
    };
  });
};

export const crearInsumo = async (insumo: any, orgId: string, branchId: string) => {
  // 1. Crear el insumo
  const { data, error } = await supabase
    .from('supplies')
    .insert([{
      organization_id: orgId,
      name: insumo.name,
      unit_measure: insumo.unit_measure,
      unit_cost: insumo.unit_cost || 0,
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;

  // 2. Crear stock inicial para la sucursal
  await supabase
    .from('supply_stock')
    .insert([{
      supply_id: data.id,
      branch_id: branchId,
      quantity: insumo.current_stock || 0,
      min_stock: insumo.min_stock || 0,
    }]);

  return data;
};

export const actualizarInsumo = async (id: string, insumo: any, branchId?: string) => {
  // Actualizar datos del insumo
  const { error } = await supabase
    .from('supplies')
    .update({
      name: insumo.name,
      unit_measure: insumo.unit_measure,
      unit_cost: insumo.unit_cost,
      is_active: insumo.is_active
    })
    .eq('id', id);

  if (error) throw error;

  // Actualizar stock de la sucursal si hay stock_id
  if (insumo.stock_id && branchId) {
    await supabase
      .from('supply_stock')
      .update({
        quantity: insumo.current_stock,
        min_stock: insumo.min_stock
      })
      .eq('id', insumo.stock_id);
  }

  return true;
};

/**
 * Registrar compra de insumo: usa la RPC register_purchase
 */
export const registrarCompraInsumo = async (
  compra: {
    supply_id: string;
    quantity: number;
    unit_cost: number;
    orgId: string;
    branchId: string;
  }
) => {
  const { data, error } = await supabase.rpc('register_purchase', {
    p_org_id: compra.orgId,
    p_branch_id: compra.branchId,
    p_supply_id: compra.supply_id,
    p_quantity: compra.quantity,
    p_unit_cost: compra.unit_cost,
  });

  if (error) throw error;
  return data;
};