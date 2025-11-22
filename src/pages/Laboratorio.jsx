import React, { useState, useEffect } from 'react';
import { FlaskConical, ArrowRight, Scale, CheckCircle } from 'lucide-react';
import { getLotesPendientes, guardarClasificacion } from '../services/laboratorioService';

export function Laboratorio() {
  const [lotes, setLotes] = useState([]);
  const [selectedLote, setSelectedLote] = useState(null);
  const [loading, setLoading] = useState(false);

  // Mallas predefinidas según requerimiento
  const [mallas, setMallas] = useState([
    { nombre: 'Malla 18', peso: '', defectos: '', humedad: '', idCata: '' },
    { nombre: 'Malla 16', peso: '', defectos: '', humedad: '', idCata: '' },
    { nombre: 'Malla 14', peso: '', defectos: '', humedad: '', idCata: '' },
    { nombre: 'Malla Base', peso: '', defectos: '', humedad: '', idCata: '' },
  ]);

  const [pesoTotalOro, setPesoTotalOro] = useState(0);

  useEffect(() => {
    cargarLotes();
  }, []);

  // Calcular peso total automáticamente
  useEffect(() => {
    const total = mallas.reduce((acc, curr) => acc + (parseFloat(curr.peso) || 0), 0);
    setPesoTotalOro(total);
  }, [mallas]);

  const cargarLotes = async () => {
    try {
      const data = await getLotesPendientes();
      setLotes(data);
    } catch (e) { console.error(e); }
  };

  const handleMallaChange = (index, field, value) => {
    const nuevasMallas = [...mallas];
    nuevasMallas[index][field] = value;
    setMallas(nuevasMallas);
  };

  const handleGuardar = async () => {
    if (!selectedLote) return;
    if (pesoTotalOro <= 0) return alert("El peso total no puede ser 0");

    setLoading(true);
    try {
      // Filtramos solo las mallas que tienen datos
      const mallasValidas = mallas.filter(m => parseFloat(m.peso) > 0);
      await guardarClasificacion(selectedLote.id, mallasValidas);
      
      alert("✅ Clasificación guardada y enviada a Bodega Oro Verde");
      setSelectedLote(null);
      // Limpiar mallas
      setMallas(mallas.map(m => ({ ...m, peso: '', defectos: '', humedad: '', idCata: '' })));
      cargarLotes(); // Recargar lista
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-stone-50">
      
      {/* SIDEBAR: Lista de Lotes Pendientes */}
      <div className="w-1/3 bg-white border-r border-stone-200 flex flex-col">
        <div className="p-5 bg-emerald-900 text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <FlaskConical className="text-amber-400" /> Lotes para Procesar
          </h2>
          <p className="text-emerald-200 text-xs mt-1">Selecciona un lote para trillar/clasificar</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {lotes.length === 0 && <p className="text-center text-stone-400 mt-10">No hay lotes pendientes.</p>}
          {lotes.map(lote => (
            <div 
              key={lote.id}
              onClick={() => setSelectedLote(lote)}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                selectedLote?.id === lote.id ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' : 'border-stone-200 bg-white hover:border-emerald-300'
              }`}
            >
              <div className="flex justify-between mb-1">
                <span className="font-bold text-stone-800">{lote.codigo_lote}</span>
                <span className="text-xs font-mono bg-stone-200 px-2 py-1 rounded">{lote.fecha_compra}</span>
              </div>
              <p className="text-sm text-emerald-800 font-medium">{lote.proveedores?.nombre_finca}</p>
              <div className="flex justify-between mt-2 text-xs text-stone-500">
                <span>{lote.estado_ingreso}</span>
                <span className="font-bold">{lote.peso_ingreso_kg} Kg</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN: Formulario de Clasificación */}
      <div className="flex-1 overflow-y-auto p-8">
        {selectedLote ? (
          <div className="max-w-4xl mx-auto">
            
            {/* Header del Lote Seleccionado */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-stone-800 mb-1">Procesamiento de Lote</h2>
                  <p className="text-stone-500">Proveedor: <strong className="text-emerald-700">{selectedLote.proveedores?.nombre_completo}</strong></p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-500">Peso Ingreso:</p>
                  <p className="text-2xl font-mono font-bold text-stone-800">{selectedLote.peso_ingreso_kg} <span className="text-sm text-stone-400">Kg</span></p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm bg-stone-50 p-3 rounded-lg border border-stone-100">
                <div><span className="text-stone-400 block">Proceso</span> {selectedLote.proceso}</div>
                <div><span className="text-stone-400 block">Variedad</span> {selectedLote.variedad}</div>
                <div><span className="text-stone-400 block">Nota</span> {selectedLote.notas || '-'}</div>
              </div>
            </div>

            {/* Tabla de Clasificación */}
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
              <div className="p-4 bg-stone-800 text-white flex justify-between items-center">
                <span className="font-bold flex items-center gap-2"><Scale size={18}/> Clasificación por Mallas (Trilla)</span>
                <span className="text-amber-400 font-mono">Total Oro: {pesoTotalOro.toFixed(2)} Kg</span>
              </div>
              
              <div className="p-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-bold text-stone-500 uppercase border-b border-stone-200">
                      <th className="pb-3 pl-2">Malla / Tamaño</th>
                      <th className="pb-3 w-32">Peso (Kg)</th>
                      <th className="pb-3 w-24">% Defectos</th>
                      <th className="pb-3 w-24">% Humedad</th>
                      <th className="pb-3 w-32">ID Cata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {mallas.map((malla, index) => (
                      <tr key={index} className="group hover:bg-stone-50">
                        <td className="py-3 pl-2 font-medium text-stone-700">{malla.nombre}</td>
                        <td className="py-3">
                          <input 
                            type="number" step="0.01" 
                            value={malla.peso}
                            onChange={(e) => handleMallaChange(index, 'peso', e.target.value)}
                            className="w-full p-2 border border-stone-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input 
                            type="number" step="0.1"
                            value={malla.defectos}
                            onChange={(e) => handleMallaChange(index, 'defectos', e.target.value)}
                            className="w-full p-2 border border-stone-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                            placeholder="%"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input 
                            type="number" step="0.1"
                            value={malla.humedad}
                            onChange={(e) => handleMallaChange(index, 'humedad', e.target.value)}
                            className="w-full p-2 border border-stone-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                            placeholder="%"
                          />
                        </td>
                        <td className="py-3">
                          <input 
                            type="text"
                            value={malla.idCata}
                            onChange={(e) => handleMallaChange(index, 'idCata', e.target.value)}
                            className="w-full p-2 border border-stone-300 rounded focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Opcional"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Resumen de Merma */}
                <div className="mt-6 p-4 bg-amber-50 rounded-lg flex justify-between items-center text-amber-900 text-sm">
                  <span><strong>Peso Ingreso:</strong> {selectedLote.peso_ingreso_kg} Kg</span>
                  <ArrowRight size={16} className="text-amber-400" />
                  <span><strong>Peso Salida (Oro):</strong> {pesoTotalOro.toFixed(2)} Kg</span>
                  <span className="font-bold border-l border-amber-200 pl-4 ml-4">
                    Merma: {((1 - (pesoTotalOro / selectedLote.peso_ingreso_kg)) * 100).toFixed(2)}%
                  </span>
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={handleGuardar}
                    disabled={loading}
                    className="bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-800 transition-all flex items-center gap-2 active:scale-95"
                  >
                    {loading ? 'Procesando...' : <><CheckCircle size={20}/> Confirmar y Enviar a Bodega</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-stone-300">
            <FlaskConical size={80} strokeWidth={1} className="mb-4 text-stone-200"/>
            <p className="text-xl font-medium text-stone-400">Selecciona un lote para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
}