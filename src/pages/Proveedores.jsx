import React, { useState } from 'react';
import { UserPlus, MapPin, FileText, Save, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { crearProveedor } from '../services/proveedoresService';

export function Proveedores() {
  const { orgId } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Estado inicial actualizado
  const [formData, setFormData] = useState({
    nombre_completo: '', ci_nit: '', telefono: '', email: '',
    tipo_proveedor: 'productor', // Valor por defecto
    nombre_finca: '', 
    nombre_productor: '', // <--- NUEVO CAMPO: Para el nombre del socio/granjero real
    altura_msnm: '', 
    region: '', 
    sub_region: '', // Antes "departamento"
    pais: 'BO' // Por defecto Bolivia
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
    await crearProveedor(formData, orgId);
    alert("✅ Proveedor y Finca registrados exitosamente");
    
    // RESET COMPLETO (Todos los campos vuelven a su estado inicial)
    setFormData({
      nombre_completo: '', 
      ci_nit: '', 
      telefono: '', 
      email: '',
      tipo_proveedor: 'productor', // Volvemos al default
      nombre_finca: '', 
      altura_msnm: '', 
      region: '', 
      sub_region: '', 
      pais: 'BO' // Volvemos al default
    });
  } catch (error) {
    alert("Error: " + error.message);
  } finally {
    setLoading(false);
  }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-900 flex items-center gap-3">
          <UserPlus className="text-amber-600" /> Registro de Proveedores
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-stone-100 p-8 space-y-8">
        
        {/* SECCIÓN 1: DATOS COMERCIALES */}
        <div>
          <h2 className="text-lg font-bold text-emerald-800 border-b pb-2 mb-4 flex items-center gap-2">
            <FileText size={18}/> Datos del Proveedor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2">
              <label className="text-sm font-semibold text-stone-700">Nombre / Razón Social</label>
              <input required name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Ej: Juan Pérez o Cooperativa El Sol" />
            </div>
            
            {/* SELECTOR DE TIPO DE PROVEEDOR */}
            <div>
              <label className="text-sm font-bold text-emerald-700">Tipo de Proveedor</label>
              <select name="tipo_proveedor" value={formData.tipo_proveedor} onChange={handleChange} className="w-full p-3 border rounded-lg bg-emerald-50 border-emerald-200 font-medium">
                <option value="productor">Productor (Finca)</option>
                <option value="cooperativa">Cooperativa</option>
                <option value="importador">Importador / Empresa</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-stone-700">CI / NIT / TAX ID</label>
              <input name="ci_nit" value={formData.ci_nit} onChange={handleChange} className="w-full p-3 border rounded-lg" />
            </div>
            {/* ... (Teléfono y Email igual que antes) */}
          </div>
        </div>

        {/* SECCIÓN 2: DATOS DE ORIGEN (FINCA) */}
        <div>
          <h2 className="text-lg font-bold text-emerald-800 border-b pb-2 mb-4 flex items-center gap-2">
            <MapPin size={18}/> Datos de Origen (Finca Principal)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2">
              <label className="text-sm font-semibold text-stone-700">Nombre Finca / Origen</label>
              <input required name="nombre_finca" value={formData.nombre_finca} onChange={handleChange} className="w-full p-3 border rounded-lg" />
            </div>

            {/* NUEVO CAMPO: Productor Real */}
            {/* Solo mostramos este label diferente si es Cooperativa o Importador para dar contexto */}
            <div className="col-span-2">
              <label className="text-sm font-semibold text-stone-700">
                {formData.tipo_proveedor === 'productor' ? 'Propietario (Opcional)' : 'Nombre del Socio / Productor Origen'}
              </label>
              <input 
                name="nombre_productor" 
                value={formData.nombre_productor} 
                onChange={handleChange} 
                className="w-full p-3 border rounded-lg" 
                placeholder={formData.tipo_proveedor === 'productor' ? 'Mismo del proveedor' : 'Ej: Pedro Gómez (Socio)'}
              />
            </div>
            
            {/* SELECTOR DE PAÍS */}
            <div>
              <label className="text-sm font-semibold text-stone-700 flex items-center gap-1"><Globe size={14}/> País</label>
              <select name="pais" value={formData.pais} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white">
                <option value="BO">🇧🇴 Bolivia</option>
                <option value="CO">🇨🇴 Colombia</option>
                <option value="PE">🇵🇪 Perú</option>
                <option value="BR">🇧🇷 Brasil</option>
                <option value="GT">🇬🇹 Guatemala</option>
                <option value="ET">Eh 🇪🇹 Etiopía</option>
                <option value="XX">Otro</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-stone-700">Región</label>
              <input required name="region" value={formData.region} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Ej: Caranavi" />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-700">Sub-Región / Vereda</label>
              <input name="sub_region" value={formData.sub_region} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Ej: Taypiplaya" />
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-700">Altura (msnm)</label>
              <input name="altura_msnm" type="number" value={formData.altura_msnm} onChange={handleChange} className="w-full p-3 border rounded-lg" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2">
            {loading ? 'Guardando...' : <><Save size={20}/> Registrar</>}
          </button>
        </div>
      </form>
    </div>
  );
}