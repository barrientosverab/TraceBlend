import { supabase } from './supabaseClient';

export interface LoteTrilla {
  id: string;
  codigo_lote: string;
  stock_actual: number;
  estado: string;
  nombre_finca: string;
}

export interface MallaInput {
  nombre: string;
  peso: string | number;
}

export const getLotesParaTrilla = async (): Promise<LoteTrilla[]> => {
  const { data, error } = await supabase
    .from('raw_inventory_batches')
    .select(`id, code_ref, current_quantity, current_state, farms ( name )`)
    .gt('current_quantity', 0)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((d: any) => ({
    id: d.id,
    codigo_lote: d.code_ref,
    stock_actual: d.current_quantity,
    estado: d.current_state,
    nombre_finca: d.farms?.name || 'Origen Desconocido'
  }));
};

export const procesarTrilla = async (loteId: string, pesoEntrada: number, mallas: MallaInput[], orgId: string, userId: string) => {
  // Validaciones
  const { data: lote, error: errLote } = await supabase
    .from('raw_inventory_batches')
    .select('current_quantity')
    .eq('id', loteId)
    .single();

  if (errLote || !lote) throw new Error("Error leyendo lote");
  if (pesoEntrada > lote.current_quantity) throw new Error("Stock insuficiente");

  // 1. Proceso Padre
  const { data: proceso, error: errProc } = await supabase
    .from('milling_processes')
    .insert([{
      organization_id: orgId,
      service_provider: 'Interno',
      created_by: userId,
      process_date: new Date().toISOString(),
      observations: `Trilla parcial de ${pesoEntrada}kg`
    }])
    .select()
    .single();

  if (errProc || !proceso) throw errProc;

  // 2. Consumo Input
  await supabase.from('milling_inputs').insert([{
    organization_id: orgId,
    milling_process_id: proceso.id,
    raw_inventory_id: loteId,
    weight_used_kg: pesoEntrada
  }]);

  // 3. Outputs (Mallas)
  const salidas = mallas
    .filter(m => Number(m.peso) > 0)
    .map(m => ({
      organization_id: orgId,
      milling_process_id: proceso.id,
      screen_size: mapMallaToEnum(m.nombre),
      name_ref: `ORO-${proceso.id.slice(0, 4)}-${mapMallaToEnum(m.nombre)}`,
      quantity_kg: Number(m.peso),
      is_available: true
    }));

  if (salidas.length > 0) {
    await (supabase as any).from('green_coffee_warehouse').insert(salidas);
  }

  // 4. Actualizar Stock Original
  const nuevoSaldo = Math.max(0, lote.current_quantity - pesoEntrada);
  await supabase
    .from('raw_inventory_batches')
    .update({ current_quantity: nuevoSaldo })
    .eq('id', loteId);

  return true;
};

const mapMallaToEnum = (nombreUI: string): string => {
  const n = nombreUI.toLowerCase();
  if (n.includes('18')) return 'malla_18';
  if (n.includes('16')) return 'malla_16';
  if (n.includes('14')) return 'malla_14';
  if (n.includes('caracol')) return 'caracol';
  if (n.includes('base') || n.includes('pasilla')) return 'base_pasilla';
  if (n.includes('cascarilla')) return 'cascarilla';
  return 'sin_clasificar';
};