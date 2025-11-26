import React, { useState } from 'react';
import { UserPlus, MapPin, Phone, FileText, Save } from 'lucide-react';
import { crearProveedor } from '../services/proveedoresService';

export function Proveedores() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: '', ci_nit: '', telefono: '', email: '',
    nombre_finca: '', altura_msnm: '', region: '', departamento: '', pais: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await crearProveedor(formData);
      alert("✅ Proveedor registrado exitosamente");
      setFormData({ // Reset
        nombre_completo: '', ci_nit: '', telefono: '', email: '',
        nombre_finca: '', altura_msnm: '', region: '', departamento: '', pais: ''
      });
    } catch (error) {
      alert("❌ Error: " + error.message);
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
        <p className="text-stone-500">Gestión de productores y fincas aliadas.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden">
        <div className="p-8 space-y-8">
          
          {/* Datos Personales */}
          <div>
            <h2 className="text-lg font-bold text-emerald-800 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
              <FileText size={18}/> Datos de Identificación
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Nombre Completo</label>
                <input required name="nombre_completo" value={formData.nombre_completo} onChange={handleChange} type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej: Juan Pérez" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">CI / NIT</label>
                <input name="ci_nit" value={formData.ci_nit} onChange={handleChange} type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Documento de Identidad" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Teléfono / Celular</label>
                <input required name="telefono" value={formData.telefono} onChange={handleChange} type="tel" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Número de contacto" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Email (Opcional)</label>
                <input name="email" value={formData.email} onChange={handleChange} type="email" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="correo@ejemplo.com" />
              </div>
            </div>
          </div>

          {/* Datos de Finca */}
          <div>
            <h2 className="text-lg font-bold text-emerald-800 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
              <MapPin size={18}/> Datos de la Finca
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Nombre Finca</label>
                <input required name="nombre_finca" value={formData.nombre_finca} onChange={handleChange} type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej: Finca La Esperanza" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Altura (msnm)</label>
                <input required name="altura_msnm" value={formData.altura_msnm} onChange={handleChange} type="number" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej: 1500" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Región / Municipio</label>
                <input required name="region" value={formData.region} onChange={handleChange} type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej: Caranavi" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">Departamento</label>
                <input required name="departamento" value={formData.departamento} onChange={handleChange} type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej: La Paz"/>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-stone-700">País</label>
                <input required name="pais" value={formData.pais} onChange={handleChange} type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ej: Bolivia"/>
              </div>
            </div>
          </div>

        </div>

        <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-end">
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {loading ? 'Guardando...' : <><Save size={20}/> Guardar Proveedor</>}
          </button>
        </div>
      </form>
    </div>
  );
}