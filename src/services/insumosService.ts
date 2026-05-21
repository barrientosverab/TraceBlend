import { supabase } from './supabaseClient';

export const getInsumos = async (orgId: string, branchId?: string) => {
  // Obtener insumos con su stock de la sucursal
  // DB columns: supplies uses cost_per_unit and unit
  const query = supabase
    .from('supplies')
    .select(`
      id, name, unit, cost_per_unit, is_active,
      supply_stock (id, quantity, min_quantity, branch_id)
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
      unit: s.unit,
      unit_cost: s.cost_per_unit || 0,
      is_active: s.is_active ?? true,
      current_stock: stock?.quantity || 0,
      min_quantity: stock?.min_quantity || 0,
      stock_id: stock?.id || null,
    };
  });
};

export const crearInsumo = async (insumo: any, orgId: string) => {
  // 1. Crear el insumo (DB: name, unit, cost_per_unit, is_active, organization_id)
  const { data, error } = await supabase
    .from('supplies')
    .insert([{
      organization_id: orgId,
      name: insumo.name,
      unit: insumo.unit,
      cost_per_unit: Number(insumo.unit_cost) || 0,
      is_active: true
    }])
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const getBranches = async (orgId: string) => {
  const { data, error } = await supabase
    .from('branches')
    .select('id, name, is_main')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('is_main', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const actualizarInsumo = async (id: string, insumo: any, branchId?: string) => {
  // Actualizar datos del insumo (DB columns: name, unit, cost_per_unit, is_active)
  const { error } = await supabase
    .from('supplies')
    .update({
      name: insumo.name,
      unit: insumo.unit,
      cost_per_unit: insumo.unit_cost,
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
        min_quantity: insumo.min_quantity
      })
      .eq('id', insumo.stock_id);
  }

  return true;
};

/**
 * Registrar compra de insumo: usa la RPC register_purchase
 * RPC args: p_branch_id, p_profile_id, p_purchase_date, p_quantity, p_supplier_name, p_supply_id, p_unit_cost
 */
export const registrarCompraInsumo = async (compra: {
  supply_id: string;
  branch_id: string;
  profile_id: string;
  supplier_name: string;
  quantity: number;
  unit_cost: number;
  purchase_date: string;
}) => {
  const { data, error } = await supabase.rpc('register_purchase', {
    p_branch_id: compra.branch_id,
    p_profile_id: compra.profile_id,
    p_supply_id: compra.supply_id,
    p_supplier_name: compra.supplier_name,
    p_quantity: compra.quantity,
    p_unit_cost: compra.unit_cost,
    p_purchase_date: compra.purchase_date,
  });
  if (error) throw error;
  return data;
};

export const verificarUsoInsumo = async (supplyId: string) => {
  const [compras, recetas] = await Promise.all([
    supabase
      .from('supply_purchases')
      .select('id')
      .eq('supply_id', supplyId)
      .limit(1),
    supabase
      .from('product_recipes')
      .select('id')
      .eq('supply_id', supplyId)
      .limit(1),
  ]);

  const fueUsado =
    (compras.data?.length ?? 0) > 0 ||
    (recetas.data?.length ?? 0) > 0;

  return fueUsado;
};

export const eliminarInsumo = async (id: string) => {
  const { error } = await supabase
    .from('supplies')
    .delete()
    .eq('id', id);
  if (error) throw error;
};