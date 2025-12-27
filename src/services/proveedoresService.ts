import { supabase } from './supabaseClient';
import { ProveedorFormData } from '../utils/validationSchemas';

export interface ProveedorPlano {
  id: string;
  finca_id: string | null;
  nombre_mostrar: string;
  hasCoordinates?: boolean;
}

export interface ProveedorCompleto {
  supplier: {
    id: string;
    name: string;
    tax_id: string;
    type: 'productor' | 'cooperativa' | 'importador';
  };
  farm: {
    id: string;
    name: string;
    producer_name: string | null;
    country_code: string;
    region: string | null;
    sub_region: string | null;
    altitude_masl: number | null;
    latitude: number | null;
    longitude: number | null;
  };
}

export const crearProveedor = async (formData: ProveedorFormData, orgId: string) => {
  // 1. Insertar Proveedor
  const { data: supplier, error: errSup } = await supabase
    .from('suppliers')
    .insert([{
      organization_id: orgId,
      name: formData.nombre_completo,
      tax_id: formData.ci_nit,
      type: formData.tipo_proveedor as "productor" | "cooperativa" | "importador", // Validado previamente por Zod
    }])
    .select()
    .single();

  if (errSup) throw errSup;
  if (!supplier) throw new Error("Error al crear el proveedor base.");

  // 2. Insertar Finca asociada
  const { error: errFarm } = await supabase
    .from('farms')
    .insert([{
      organization_id: orgId,
      supplier_id: supplier.id,
      name: formData.nombre_finca,
      producer_name: formData.nombre_productor || (formData.tipo_proveedor === 'productor' ? formData.nombre_completo : null),
      country_code: formData.pais,
      region: formData.region,
      sub_region: formData.sub_region || null,
      altitude_masl: formData.altura_msnm,
      latitude: formData.latitude || null,
      longitude: formData.longitude || null
    }]);

  if (errFarm) throw errFarm;
  return true;
};

export const getProveedores = async (): Promise<ProveedorPlano[]> => {
  // Consulta segura con tipos inferidos por Supabase Client
  const { data, error } = await supabase
    .from('suppliers')
    .select(`
      id, 
      name, 
      type, 
      farms ( id, name, region, latitude, longitude )
    `)
    .order('name');

  if (error) throw error;

  // Transformación segura de datos
  const listaPlana: ProveedorPlano[] = [];

  data?.forEach((prov) => {
    // Verificamos si tiene fincas (como array)
    const fincas = prov.farms;

    if (Array.isArray(fincas) && fincas.length > 0) {
      fincas.forEach((finca: any) => {
        listaPlana.push({
          id: prov.id,
          finca_id: finca.id,
          nombre_mostrar: `${prov.name} - ${finca.name} (${finca.region})`,
          hasCoordinates: !!(finca.latitude && finca.longitude)
        });
      });
    } else {
      listaPlana.push({
        id: prov.id,
        finca_id: null,
        nombre_mostrar: `${prov.name} (Sin Finca)`,
        hasCoordinates: false
      });
    }
  });

  return listaPlana;
};

export const getProveedorCompleto = async (supplierId: string, farmId: string): Promise<ProveedorCompleto> => {
  // Obtener datos del proveedor
  const { data: supplier, error: errSupplier } = await supabase
    .from('suppliers')
    .select('id, name, tax_id, type')
    .eq('id', supplierId)
    .single();

  if (errSupplier) throw errSupplier;
  if (!supplier) throw new Error('Proveedor no encontrado');

  // Obtener datos de la finca
  const { data: farm, error: errFarm } = await supabase
    .from('farms')
    .select('id, name, producer_name, country_code, region, sub_region, altitude_masl, latitude, longitude')
    .eq('id', farmId)
    .single();

  if (errFarm) throw errFarm;
  if (!farm) throw new Error('Finca no encontrada');

  return {
    supplier: {
      id: supplier.id,
      name: supplier.name,
      tax_id: supplier.tax_id,
      type: supplier.type as 'productor' | 'cooperativa' | 'importador'
    },
    farm: {
      id: farm.id,
      name: farm.name,
      producer_name: farm.producer_name,
      country_code: farm.country_code,
      region: farm.region,
      sub_region: farm.sub_region,
      altitude_masl: farm.altitude_masl,
      latitude: farm.latitude,
      longitude: farm.longitude
    }
  };
};

export const actualizarProveedor = async (supplierId: string, farmId: string, formData: ProveedorFormData) => {
  // 1. Actualizar datos del proveedor
  const { error: errSupplier } = await supabase
    .from('suppliers')
    .update({
      name: formData.nombre_completo,
      tax_id: formData.ci_nit,
      type: formData.tipo_proveedor as "productor" | "cooperativa" | "importador"
    })
    .eq('id', supplierId);

  if (errSupplier) throw errSupplier;

  // 2. Actualizar datos de la finca
  const { error: errFarm } = await supabase
    .from('farms')
    .update({
      name: formData.nombre_finca,
      producer_name: formData.nombre_productor || (formData.tipo_proveedor === 'productor' ? formData.nombre_completo : null),
      country_code: formData.pais,
      region: formData.region,
      sub_region: formData.sub_region || null,
      altitude_masl: formData.altura_msnm,
      latitude: formData.latitude || null,
      longitude: formData.longitude || null
    })
    .eq('id', farmId);

  if (errFarm) throw errFarm;
  return true;
};