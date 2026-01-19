import { supabase } from './supabaseClient';

export interface LoteForm {
  finca_id: string;
  fecha_compra: string;
  peso: string;
  precio_total: string;
  estado: string;
  variedad: string;
  proceso: string;
  humedad: string;
  notas: string;
}

export interface RawInventoryBatch {
  id: string;
  code_ref: string;
  current_quantity: number;
  current_state: string;
  variety: string | null;
  process: string | null;
  humidity_percentage: number | null;
  notes: string | null;
  total_cost_local: number | null;
  farms?: { name: string };
}

export const crearLote = async (form: LoteForm, orgId: string) => {
  const pesoNum = parseFloat(form.peso);
  const precioNum = form.precio_total ? parseFloat(form.precio_total) : null;

  if (isNaN(pesoNum) || pesoNum <= 0) {
    throw new Error('El peso debe ser un número mayor a 0');
  }

  const { data, error } = await supabase
    .from('raw_inventory_batches')
    .insert({
      organization_id: orgId,
      farm_id: form.finca_id,
      initial_quantity: pesoNum,
      current_quantity: pesoNum,
      current_state: form.estado,
      variety: form.variedad || null,
      process: form.proceso || null,
      humidity_percentage: form.humedad ? parseFloat(form.humedad) : null,
      notes: form.notas || null,
      total_cost_local: precioNum,
      purchase_date: form.fecha_compra
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Actualizar lote de materia prima
export const actualizarLote = async (loteId: string, form: Partial<LoteForm>) => {
  const updates: any = {};

  if (form.peso) {
    const pesoNum = parseFloat(form.peso);
    if (isNaN(pesoNum) || pesoNum <= 0) {
      throw new Error('El peso debe ser un número mayor a 0');
    }
    updates.current_quantity = pesoNum;
    updates.initial_quantity = pesoNum;
  }

  if (form.precio_total) {
    updates.total_cost_local = parseFloat(form.precio_total);
  }

  if (form.estado) updates.current_state = form.estado;
  if (form.variedad !== undefined) updates.variety = form.variedad || null;
  if (form.proceso !== undefined) updates.process = form.proceso || null;
  if (form.humedad !== undefined) {
    updates.humidity_percentage = form.humedad ? parseFloat(form.humedad) : null;
  }
  if (form.notas !== undefined) updates.notes = form.notas || null;
  if (form.fecha_compra) updates.purchase_date = form.fecha_compra;

  const { error } = await supabase
    .from('raw_inventory_batches')
    .update(updates)
    .eq('id', loteId);

  if (error) throw error;
};

// Eliminar lote de materia prima (solo si no se ha usado)
export const eliminarLote = async (loteId: string) => {
  // Primero verificar que la cantidad actual sea igual a la inicial (no se ha procesado)
  const { data: lote, error: fetchError } = await supabase
    .from('raw_inventory_batches')
    .select('initial_quantity, current_quantity')
    .eq('id', loteId)
    .single();

  if (fetchError) throw fetchError;

  if (lote.current_quantity < lote.initial_quantity) {
    throw new Error('No se puede eliminar un lote que ya ha sido procesado parcialmente');
  }

  const { error } = await supabase
    .from('raw_inventory_batches')
    .delete()
    .eq('id', loteId);

  if (error) throw error;
};