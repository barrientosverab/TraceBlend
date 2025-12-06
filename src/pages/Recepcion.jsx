import React, { useState, useEffect } from 'react';
import { Save, SunSnow, Truck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { crearLote } from '../services/lotesService';
import {toast} from 'sonner';
import { getProveedores } from '../services/proveedoresService';

export function Recepcion() {
  const { orgId } = useAuth();
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    finca_id: '', 
    fecha_compra: new Date().toISOString().split('T')[0],
    peso: '', 
    estado: 'pergamino_seco', // <--- CORRECCIÓN: Valor por defecto coincide con BD (minúscula)
    variedad: '', 
    proceso: '', 
    humedad: '', 
    precio_total: '',
    notas: ''
  });

  useEffect(() => {
    async function loadProvs() {
      try {
        const data = await getProveedores();
        setProveedores(data);
      } catch (e) { console.error(e); }
    }
    loadProvs();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.finca_id) return toast.warning("Debes seleccionar un proveedor");
    
    setLoading(true);
    try {
      await crearLote(formData, orgId);
      toast.success("Lote registrado correctamente!");
      
      // <--- CORRECCIÓN: Resetear el formulario correctamente
      setFormData({ 
        finca_id: '', // Antes decía proveedor_id (error)
        fecha_compra: new Date().toISOString().split('T')[0],
        peso: '', 
        estado: 'pergamino_seco', // Vuelta al valor default válido
        variedad: '', 
        proceso: '', 
        humedad: '', 
        notas: ''
      });
    } catch (error) {
      toast.error("Error al registrar lote: ", {description: error.message});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900 flex items-center gap-3">
            <Truck className="text-amber-600" /> Recepción de Lotes
          </h1>
          <p className="text-stone-500">Ingreso de materia prima al almacén.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border-t-4 border-emerald-600 overflow-hidden p-8 space-y-8">
        
        {/* Selección de Proveedor/Finca */}
        <div>
          <label className="block text-sm font-bold text-emerald-800 mb-2 uppercase tracking-wider">
            Origen (Proveedor - Finca)
          </label>
          <select 
            name="finca_id" 
            value={formData.finca_id} 
            onChange={handleChange} 
            className="w-full p-3 border border-stone-300 rounded-lg bg-stone-50 focus:ring-2 focus:ring-emerald-500 text-lg"
            required
          >
            <option value="">-- Selecciona un origen --</option>
            {proveedores.map((p, index) => (
              // Usamos index como key fallback por si hay IDs repetidos en la vista plana
              <option key={`${p.finca_id}-${index}`} value={p.finca_id}>
                {p.nombre_mostrar || `${p.nombre_completo} - ${p.nombre_finca}`} 
              </option>
            ))}
          </select>
          <p className="text-xs text-stone-400 mt-1">* Si no aparece, regístralo en la sección de Proveedores.</p>
        </div>

        {/* Detalles del Lote */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-bold text-stone-700">Fecha de Compra</label>
            <input type="date" name="fecha_compra" value={formData.fecha_compra} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-stone-700">Peso (Kg)</label>
            <input type="number" step="0.01" name="peso" value={formData.peso} onChange={handleChange} className="w-full p-3 border rounded-lg font-mono" placeholder="0.00" required />
          </div>

          <div className="space-y-1">
  <label className="text-sm font-bold text-stone-700">Costo Total (Bs)</label>
  <input 
    type="number" 
    step="0.01" 
    name="precio_total" 
    value={formData.precio_total} 
    onChange={handleChange} 
    className="w-full p-3 border rounded-lg font-mono text-emerald-800 font-bold" 
    placeholder="0.00" 
  />
</div>
          
          {/* CORRECCIÓN: Selector de Estado con valores de Base de Datos */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-stone-700">Estado Ingreso</label>
            <select name="estado" value={formData.estado} onChange={handleChange} className="w-full p-3 border rounded-lg bg-amber-50 font-medium">
              <option value="cereza">🍒 Cereza (Fruta)</option>
              <option value="pergamino_humedo">💧 Pergamino Húmedo</option>
              <option value="pergamino_seco">📜 Pergamino Seco</option>
              <option value="oro_verde">💎 Oro Verde (Ya trillado)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-bold text-stone-700">Variedad</label>
            <input type="text" name="variedad" value={formData.variedad} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Ej: Geisha, Caturra" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-stone-700">Proceso</label>
            <select name="proceso" value={formData.proceso} onChange={handleChange} className="w-full p-3 border rounded-lg bg-white">
              <option value="">Seleccionar...</option>
              <option value="Lavado">Lavado</option>
              <option value="Natural">Natural</option>
              <option value="Honey">Honey</option>
              <option value="Anaerobico">Anaeróbico</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-bold text-stone-700">% Humedad</label>
            <input type="number" step="0.1" name="humedad" value={formData.humedad} onChange={handleChange} className="w-full p-3 border rounded-lg" placeholder="Ej: 11.5" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold text-stone-700">Notas / Observaciones</label>
          <textarea name="notas" value={formData.notas} onChange={handleChange} rows="3" className="w-full p-3 border rounded-lg resize-none" placeholder="Detalles visuales, olor, estado de los sacos..."></textarea>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-emerald-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg">
            {loading ? 'Guardando...' : <><Save size={20}/> Registrar Lote</>}
          </button>
        </div>

      </form>
    </div>
  );
}