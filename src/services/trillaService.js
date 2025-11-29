import { supabase } from './supabaseClient';
import { getCurrentOrgId } from './authService'; // Asegúrate de tener este helper creado

// 1. GET: Obtener lotes disponibles para trillar (Materia Prima con saldo > 0)
export const getLotesParaTrilla = async () => {
  const { data, error } = await supabase
    .from('raw_inventory_batches')
    .select(`
      id,
      code_ref,
      current_quantity,
      current_state,
      farms ( name )
    `)
    .gt('current_quantity', 0) // Solo lo que tiene existencia física
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Formateamos para la UI
  return data.map(d => ({
    id: d.id,
    codigo_lote: d.code_ref,
    stock_actual: d.current_quantity,
    estado: d.current_state,
    nombre_finca: d.farms?.name || 'Origen Desconocido'
  }));
};

// 2. POST: Ejecutar la Trilla (Transaction Script)
export const procesarTrilla = async (loteId, pesoEntrada, mallas) => {
  const orgId = await getCurrentOrgId();
  
  // A. Obtener el ID del usuario actual para auditoría
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuario no autenticado");

  // B. VALIDACIÓN DE STOCK (Critical Check)
  const { data: lote, error: errLote } = await supabase
    .from('raw_inventory_batches')
    .select('current_quantity')
    .eq('id', loteId)
    .single();

  if (errLote) throw errLote;

  const stockDisponible = parseFloat(lote.current_quantity);
  const pesoAProcesar = parseFloat(pesoEntrada);

  if (pesoAProcesar <= 0) throw new Error("El peso a trillar debe ser mayor a 0");
  if (pesoAProcesar > stockDisponible) {
    throw new Error(`Stock insuficiente. Quieres trillar ${pesoAProcesar}kg pero solo tienes ${stockDisponible}kg.`);
  }

  // C. Crear el Proceso Padre (La "Olla")
  const { data: proceso, error: errProc } = await supabase
    .from('milling_processes')
    .insert([{
      organization_id: orgId,
      service_provider: 'Interno', // Podrías hacerlo dinámico si usas maquila externa
      created_by: user.id,
      process_date: new Date(),
      observations: `Trilla parcial de ${pesoAProcesar}kg`
    }])
    .select()
    .single();

  if (errProc) throw errProc;

  // D. Registrar el Consumo (Input) - Restamos del inventario lógico aquí
  const { error: errInput } = await supabase
    .from('milling_inputs')
    .insert([{
      organization_id: orgId,
      milling_process_id: proceso.id,
      raw_inventory_id: loteId,
      weight_used_kg: pesoAProcesar
    }]);

  if (errInput) throw errInput;

  // E. Registrar los Productos Resultantes (Outputs) - Café Oro
  // Filtramos solo las mallas que tienen peso > 0
  const salidasValidas = mallas
    .filter(m => parseFloat(m.peso) > 0)
    .map(m => ({
      organization_id: orgId,
      milling_process_id: proceso.id,
      screen_size: mapMallaToEnum(m.nombre),
      name_ref: `ORO-${proceso.id.slice(0, 4)}-${mapMallaToEnum(m.nombre)}`, // Generamos un SKU temporal
      quantity_kg: parseFloat(m.peso),
      is_available: true
    }));

  if (salidasValidas.length > 0) {
    const { error: errOut } = await supabase
      .from('green_coffee_warehouse')
      .insert(salidasValidas);
    
    if (errOut) throw errOut;
  }

  // F. ACTUALIZAR INVENTARIO ORIGINAL (Resta)
  const nuevoSaldo = stockDisponible - pesoAProcesar;
  // Ajuste de precisión para evitar 0.0000001
  const saldoFinal = nuevoSaldo < 0.01 ? 0 : nuevoSaldo;

  const { error: errUpdate } = await supabase
    .from('raw_inventory_batches')
    .update({ current_quantity: saldoFinal })
    .eq('id', loteId);

  if (errUpdate) throw errUpdate;

  return true;
};

// Helper para mapear nombres de UI a ENUM de Postgres
const mapMallaToEnum = (nombreUI) => {
  const n = nombreUI.toLowerCase();
  if (n.includes('18')) return 'malla_18';
  if (n.includes('16')) return 'malla_16';
  if (n.includes('14')) return 'malla_14';
  if (n.includes('caracol')) return 'caracol';
  if (n.includes('base') || n.includes('pasilla')) return 'base_pasilla';
  if (n.includes('cascarilla')) return 'cascarilla';
  return 'sin_clasificar';
};