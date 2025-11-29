import { supabase } from './supabaseClient';
import { getCurrentOrgId } from './authService';

export const crearProveedor = async (formData) => {
  const orgId = await getCurrentOrgId();

  // 1. Insertar Proveedor (suppliers)
  const { data: supplier, error: errSup } = await supabase
    .from('suppliers')
    .insert([{
      organization_id: orgId,
      name: formData.nombre_completo,
      tax_id: formData.ci_nit,
      type: formData.tipo_proveedor, // 'productor', 'cooperativa', etc.
    }])
    .select()
    .single();

  if (errSup) throw errSup;

  // 2. Insertar Finca (farms)
  const { error: errFarm } = await supabase
    .from('farms')
    .insert([{
      organization_id: orgId,
      supplier_id: supplier.id,
      name: formData.nombre_finca,
      // Si el usuario no escribió nada y es productor, asumimos que es él mismo.
      producer_name: formData.nombre_productor || (formData.tipo_proveedor === 'productor' ? formData.nombre_completo : null),
      country_code: formData.pais, // Guardamos el código ISO
      region: formData.region,
      sub_region: formData.sub_region,
      altitude_masl: parseInt(formData.altura_msnm) || 0
    }]);

  if (errFarm) throw errFarm;
  return true;
};

// Actualizar el GET para traer fincas correctamente
export const getProveedores = async () => {
  const { data, error } = await supabase
    .from('suppliers') 
    .select(`id, name, type, farms ( id, name, region )`) // Traemos las fincas
    .order('name');
  
  if (error) throw error;

  // Aplanamos para facilitar el uso en el Select de Recepción
  let listaPlana = [];
  data.forEach(prov => {
    // Si el proveedor tiene fincas, creamos una entrada por cada finca
    if (prov.farms && prov.farms.length > 0) {
      prov.farms.forEach(finca => {
        listaPlana.push({
          id: prov.id, // ID del proveedor
          finca_id: finca.id, // ID de la finca (VITAL para el lote)
          nombre_mostrar: `${prov.name} - ${finca.name} (${finca.region})`
        });
      });
    } else {
      // Proveedor sin finca (caso raro, pero posible)
      listaPlana.push({
        id: prov.id,
        finca_id: null,
        nombre_mostrar: `${prov.name} (Sin Finca)`
      });
    }
  });
  return listaPlana;
};