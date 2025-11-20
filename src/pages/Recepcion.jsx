import { crearLoteCompra } from '../services/lotesService';
import React, { useState } from 'react'; // Agregamos useState
import { Save, Truck } from 'lucide-react';

export function Recepcion() {
  // 1. Aquí guardamos los datos del formulario
  const [formData, setFormData] = useState({
    proveedor: '',
    origen: '',
    peso: '',
    variedad: '',
    humedad: '',
    notas: ''
  });

  // 2. Función que se ejecuta cuando el usuario escribe
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 3. Función para simular el guardado
  const handleSubmit = async () => {
    try {
      // Feedback visual simple
      const btn = document.activeElement;
      if(btn) btn.innerText = "Guardando...";

      // Llamamos al backend
      await crearLoteCompra(formData);
      
      alert("✅ ¡Lote registrado en la nube exitosamente!");
      
      // Limpiamos el formulario
      setFormData({
        proveedor: '', origen: '', peso: '', variedad: '', humedad: '', notas: ''
      });
      
    } catch (error) {
      alert("❌ Error al guardar: " + error.message);
    } finally {
      if(btn) btn.innerText = "Guardar Lote"; // Restauramos texto
    }
  };
  return (
    <div className="max-w-4xl mx-auto">
      {/* Encabezado de la Página */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Recepción de Materia Prima</h1>
          <p className="text-gray-500">Registra el ingreso de café pergamino al almacén.</p>
        </div>
        <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
          <Truck size={24} />
        </div>
      </div>

      {/* Formulario Principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          
          {/* Sección 1: Datos del Proveedor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nombre del Proveedor / Finca</label>
              <input 
                type="text"
                name="proveedor"   // <--- IMPORTANTE: Debe coincidir con el estado
                value={formData.proveedor} // <--- Conecta con el estado
                onChange={handleChange}    // <--- Escucha cambios
                placeholder="Ej: Finca Santa Cruz"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Ubicación / Origen</label>
              <input 
                type="text" 
                name="origen"   // <--- IMPORTANTE: Debe coincidir con el estado
                value={formData.origen} // <--- Conecta con el estado
                onChange={handleChange}    // <--- Escucha cambios
                placeholder="Ej: Caranavi, La Paz"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Sección 2: Datos del Lote */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Peso Ingreso (Kg)</label>
              <input 
                type="number" 
                name="peso"   // <--- IMPORTANTE: Debe coincidir con el estado
                value={formData.peso} // <--- Conecta con el estado
                onChange={handleChange}    // <--- Escucha cambios
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Variedad</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                <option value="">Seleccionar...</option>
                <option value="blend">Blend</option>
                <option value="typica">Typica</option>
                <option value="caturra">Caturra</option>
                <option value="geisha">Geisha</option>
                <option value="catuai">Catuai</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">% Humedad (Opcional)</label>
              <input 
                type="number"
                name="humedad"   // <--- IMPORTANTE: Debe coincidir con el estado
                value={formData.humedad} // <--- Conecta con el estado
                onChange={handleChange}    // <--- Escucha cambios
                placeholder="10-12%"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Sección 3: Notas */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Observaciones de Ingreso</label>
            <textarea 
              rows="3"
              placeholder="Estado de los sacos, olor, color..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            ></textarea>
          </div>

        </div>

        {/* Footer del Formulario (Botones) */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 shadow-sm hover:shadow transition-all active:scale-95">
            <Save size={18} />
            Guardar Lote
          </button>
        </div>
      </div>
    </div>
  );
}