import { supabase } from './supabaseClient';
import { Database } from '../types/supabase';

// 1. Extraemos el tipo exacto de la columna 'type' de la tabla 'suppliers'
type SupplierType = Database['public']['Tables']['suppliers']['Insert']['type'];

export interface ProveedorForm {
  nombre_completo: string;
  ci_nit: string;
  tipo_proveedor: string; 
  nombre_finca: string;
  nombre_productor?: string;
  pais: string;
  region: string;
  sub_region: string;
  altura_msnm: string | number;
}

export interface ProveedorPlano {
  id: string;
  finca_id: string | null;
  nombre_mostrar: string;
}

export const crearProveedor = async (formData: ProveedorForm, orgId: string) => {
  const { data: supplier, error: errSup } = await supabase
    .from('suppliers')
    .insert([{
      organization_id: orgId,
      name: formData.nombre_completo,
      tax_id: formData.ci_nit,
      // 2. CORRECCIÓN: Hacemos casting (as SupplierType)
      type: formData.tipo_proveedor as SupplierType, 
    }])
    .select()
    .single();

  if (errSup) throw errSup;
  if (!supplier) throw new Error("Error al crear el proveedor base.");

  const { error: errFarm } = await supabase
    .from('farms')
    .insert([{
      organization_id: orgId,
      supplier_id: supplier.id,
      name: formData.nombre_finca,
      producer_name: formData.nombre_productor || (formData.tipo_proveedor === 'productor' ? formData.nombre_completo : null),
      country_code: formData.pais,
      region: formData.region,
      sub_region: formData.sub_region,
      altitude_masl: Number(formData.altura_msnm) || 0
    }]);

  if (errFarm) throw errFarm;
  return true;
};

export const getProveedores = async (): Promise<ProveedorPlano[]> => {
  const { data, error } = await (supabase as any)
    .from('suppliers') 
    .select(`id, name, type, farms ( id, name, region )`) 
    .order('name');
  
  if (error) throw error;

  let listaPlana: ProveedorPlano[] = [];
  
  (data || []).forEach((prov: any) => {
    if (prov.farms && Array.isArray(prov.farms) && prov.farms.length > 0) {
      prov.farms.forEach((finca: any) => {
        listaPlana.push({
          id: prov.id,
          finca_id: finca.id,
          nombre_mostrar: `${prov.name} - ${finca.name} (${finca.region})`
        });
      });
    } else {
      listaPlana.push({
        id: prov.id,
        finca_id: null,
        nombre_mostrar: `${prov.name} (Sin Finca)`
      });
    }
  });
  return listaPlana;
};