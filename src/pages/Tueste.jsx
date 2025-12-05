import React, { useState, useEffect } from 'react';
import { 
  Save, Upload, Activity, Flame, Settings, History, Eye, Thermometer, Droplets 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine, Label 
} from 'recharts';
import {toast} from 'sonner';

// Hooks y Servicios
import { useAuth } from '../hooks/useAuth';
import { getMaquinas, crearMaquina } from '../services/maquinasService';
import { getInventarioOro, guardarTueste, getHistorialTuestes } from '../services/tuesteService';
import { parseArtisanFile, processArtisanData } from '../utils/artisanParser';

const COLORS = {
  bg: '#1a1a1a', grid: '#333333', text: '#a3a3a3', bean: '#ef4444', air: '#3b82f6', events: '#f59e0b', tooltip: 'rgba(0,0,0,0.9)'
};

export function Tueste() {
  const { orgId, user } = useAuth();
  const [activeTab, setActiveTab] = useState('cockpit');
  
  // Datos Maestros
  const [maquinas, setMaquinas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [historial, setHistorial] = useState([]);
  
  // Formulario
  const [config, setConfig] = useState({ machineId: '', greenId: '', pesoEntrada: '' });
  const [pesoSalida, setPesoSalida] = useState('');
  
  // CORRECCIÓN: Estado para variables ambientales (Ya existía, pero ahora tendrá inputs)
  const [envData, setEnvData] = useState({ 
    ambient_temp: '', 
    relative_humidity: '', 
    bean_temp: '', 
    bean_humidity: '' 
  });
  
  // Gráfica
  const [fileName, setFileName] = useState('');
  const [dataPoints, setDataPoints] = useState([]); 
  const [events, setEvents] = useState([]); 
  const [fileStats, setFileStats] = useState({ duration: 0, maxTemp: 0 });
  const [xAxisTicks, setXAxisTicks] = useState([]);

  const selectedCoffeeData = inventario.find(i => i.id === config.greenId);

  useEffect(() => {
    if (orgId) cargarDatos();
  }, [orgId]);

  useEffect(() => {
    if (activeTab === 'history' && orgId) cargarHistorial();
  }, [activeTab, orgId]);

  const cargarDatos = async () => {
    try {
      const [m, i] = await Promise.all([getMaquinas(), getInventarioOro()]);
      setMaquinas(m);
      setInventario(i);
    } catch (e) { console.error(e); }
  };

  const cargarHistorial = async () => {
    try {
      const data = await getHistorialTuestes(orgId);
      setHistorial(data);
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setFileName(file.name);
      const result = await parseArtisanFile(file);
      
      setDataPoints(result.points);
      setEvents(result.events);
      setXAxisTicks(result.ticks);
      setFileStats({ duration: result.duration, maxTemp: result.maxTemp });

      // Si el archivo trae temperatura ambiente, la autocompletamos
      if (result.ambientTemp) {
        setEnvData(prev => ({ ...prev, ambient_temp: result.ambientTemp }));
      }
    } catch (error) {
      toast.error("Error: ",{description: error.message});
      setFileName('');
    }
  };

  const cargarDesdeHistorial = (batch) => {
    try {
      const data = batch.roast_log_data;
      if (!data) return toast.warning("Registro sin datos.");

      if (data.points) {
        setDataPoints(data.points);
        setEvents(data.events || []);
        
        const maxT = Math.max(...data.points.map(p=>p.bean));
        const dur = Math.max(...data.points.map(p=>p.time));
        
        setFileStats({ duration: dur, maxTemp: maxT });
        const ticks = []; for(let i=0; i<=dur; i+=60) ticks.push(i);
        setXAxisTicks(ticks);
      } else {
        const result = processArtisanData(data);
        setDataPoints(result.points);
        setEvents(result.events);
        setXAxisTicks(result.ticks);
        setFileStats({ duration: result.duration, maxTemp: result.maxTemp });
      }
      // Cargar también variables ambientales del historial si existen
      setEnvData({
        ambient_temp: batch.ambient_temp || '',
        relative_humidity: batch.relative_humidity || '',
        bean_temp: batch.initial_bean_temp || '',
        bean_humidity: batch.initial_bean_humidity || ''
      });

      setFileName(`Historial: ${new Date(batch.roast_date).toLocaleString()}`);
      setActiveTab('cockpit');
    } catch (e) { toast.error(e.message); }
  };

  const handleSave = async () => {
    if (!config.machineId || !config.greenId || !config.pesoEntrada || !pesoSalida) {
      return toast.warning("Completa los datos del lote.");
    }
    if (dataPoints.length === 0) return toast.warning("Carga un perfil de tueste.");

    try {
      const payload = {
        machine_id: config.machineId,
        operador: user.email || 'Staff',
        peso_entrada: config.pesoEntrada,
        peso_salida: pesoSalida,
        curva_datos: { points: dataPoints, events }, 
        tiempo_total: Math.round(fileStats.duration),
        temp_final: fileStats.maxTemp,
        // Guardamos las variables ambientales
        ambient_temp: parseFloat(envData.ambient_temp) || 0,
        relative_humidity: parseFloat(envData.relative_humidity) || 0,
        initial_bean_temp: parseFloat(envData.bean_temp) || 0,
        initial_bean_humidity: parseFloat(envData.bean_humidity) || 0
      };

      const consumo = [{ id: config.greenId, peso_usado: config.pesoEntrada }];
      
      await guardarTueste(payload, consumo, orgId, user.id);
      
      toast.success("Tueste registrado exitosamente");
      setFileName(''); setDataPoints([]); setEvents([]); setPesoSalida('');
      setConfig({ ...config, pesoEntrada: '' });
      setEnvData({ ambient_temp: '', relative_humidity: '', bean_temp: '', bean_humidity: '' });
      cargarDatos();
    } catch (e) { toast.error("Error al guardar: ",{description: e.message}); }
  };

  const MachineForm = () => {
    const [m, setM] = useState({nombre:'', marca:'', capacidad:''});
    const save = async () => {
      if(!m.nombre) return toast.warning("Nombre requerido");
      try {
        await crearMaquina(m, orgId); 
        toast.success("Máquina creada"); 
        cargarDatos(); 
        setM({nombre:'', marca:'', capacidad:''});
      } catch(e) { toast.error({description: e.message}); }
    };
    return (
      <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow space-y-4">
        <h3 className="font-bold text-emerald-800">Nueva Tostadora</h3>
        <input className="w-full p-2 border rounded" placeholder="Nombre (Ej: Probat 5)" value={m.nombre} onChange={e=>setM({...m, nombre:e.target.value})}/>
        <input className="w-full p-2 border rounded" placeholder="Marca" value={m.marca} onChange={e=>setM({...m, marca:e.target.value})}/>
        <input className="w-full p-2 border rounded" type="number" placeholder="Capacidad (Kg)" value={m.capacidad} onChange={e=>setM({...m, capacidad:e.target.value})}/>
        <button onClick={save} className="w-full bg-emerald-600 text-white p-2 rounded font-bold">Guardar</button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50 overflow-hidden">
      {/* Header Tabs */}
      <div className="flex bg-white border-b border-stone-200 px-6 py-2 gap-4 shadow-sm z-10">
        <button onClick={()=>setActiveTab('cockpit')} className={`px-4 py-2 font-bold rounded-lg flex gap-2 ${activeTab==='cockpit'?'bg-stone-800 text-white':'text-stone-500 hover:bg-stone-100'}`}><Flame size={16}/> Registro</button>
        <button onClick={()=>setActiveTab('history')} className={`px-4 py-2 font-bold rounded-lg flex gap-2 ${activeTab==='history'?'bg-stone-800 text-white':'text-stone-500 hover:bg-stone-100'}`}><History size={16}/> Historial</button>
        <button onClick={()=>setActiveTab('machines')} className={`px-4 py-2 font-bold rounded-lg flex gap-2 ${activeTab==='machines'?'bg-stone-800 text-white':'text-stone-500 hover:bg-stone-100'}`}><Settings size={16}/> Máquinas</button>
      </div>

      <div className="flex-1 flex h-full overflow-hidden">
        {activeTab === 'machines' && <div className="w-full p-8"><MachineForm/></div>}

        {activeTab === 'history' && (
          <div className="w-full p-8 overflow-y-auto">
            <h2 className="text-xl font-bold text-stone-800 mb-6">Historial de Producción</h2>
            <div className="bg-white rounded-xl shadow border border-stone-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-100 text-stone-500 font-bold text-xs uppercase">
                  <tr>
                    <th className="p-4">Fecha</th><th className="p-4">Máquina</th><th className="p-4">Origen</th><th className="p-4 text-center">Salida</th><th className="p-4">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {historial.map(h => (
                    <tr key={h.id} className="hover:bg-stone-50">
                      <td className="p-4 font-mono">{new Date(h.roast_date).toLocaleDateString()}</td>
                      <td className="p-4 font-bold">{h.machines?.name}</td>
                      <td className="p-4 text-emerald-700">{h.roast_batch_inputs[0]?.green_coffee_warehouse?.name_ref || 'N/D'}</td>
                      <td className="p-4 text-center font-bold">{h.roasted_weight_output} kg</td>
                      <td className="p-4"><button onClick={() => cargarDesdeHistorial(h)} className="px-3 py-1 bg-stone-800 text-white rounded text-xs font-bold flex gap-2"><Eye size={14}/> Ver</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {historial.length === 0 && <div className="p-12 text-center text-stone-400">Sin registros.</div>}
            </div>
          </div>
        )}

        {activeTab === 'cockpit' && (
          <>
            {/* Panel Izquierdo */}
            <div className="w-80 bg-white border-r border-stone-200 p-5 flex flex-col gap-4 overflow-y-auto shadow-xl z-10 scrollbar-thin">
              <div className="bg-stone-100 p-4 rounded-xl border border-stone-200 text-center relative hover:bg-stone-200 transition-colors group">
                <input type="file" accept=".json,.alog" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-stone-400 group-hover:text-stone-600"/>
                  <span className="text-xs font-bold text-stone-500 uppercase">{fileName ? <span className="text-emerald-600">{fileName}</span> : "Subir Archivo"}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase">Configuración</label>
                  <select className="w-full p-2 border rounded text-sm mt-1 bg-white" value={config.machineId} onChange={e => setConfig({...config, machineId: e.target.value})}>
                    <option value="">Máquina...</option>
                    {maquinas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <select className="w-full p-2 border rounded text-sm mt-2 bg-white" value={config.greenId} onChange={e => setConfig({...config, greenId: e.target.value})}>
                    <option value="">Café Verde...</option>
                    {inventario.map(i => <option key={i.id} value={i.id}>{i.origen} - {i.nombre}</option>)}
                  </select>
                </div>
                
                {selectedCoffeeData && (
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-100 text-[10px] space-y-1">
                    <div className="flex justify-between font-bold text-emerald-800 border-b border-emerald-200 pb-1"><span>Stock:</span><span>{selectedCoffeeData.stock} Kg</span></div>
                    <div className="flex justify-between"><span>Var:</span> {selectedCoffeeData.variedad}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-bold text-stone-400 uppercase">Entrada</label><input type="number" className="w-full p-2 border rounded font-mono" placeholder="Kg" value={config.pesoEntrada} onChange={e=>setConfig({...config, pesoEntrada:e.target.value})}/></div>
                  <div><label className="text-[10px] font-bold text-emerald-600 uppercase">Salida</label><input type="number" className="w-full p-2 border border-emerald-300 rounded font-mono font-bold text-emerald-800" placeholder="Kg" value={pesoSalida} onChange={e=>setPesoSalida(e.target.value)}/></div>
                </div>

                {/* CORRECCIÓN AQUÍ: INPUTS DE AMBIENTE RESTAURADOS */}
                <div className="pt-2 border-t border-stone-100">
                  <label className="text-[10px] font-bold text-stone-400 uppercase flex items-center gap-1 mb-2"><Thermometer size={12}/> Ambiente & Grano</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input type="number" placeholder="T. Amb °C" className="w-full p-2 border rounded font-mono text-xs" value={envData.ambient_temp} onChange={e => setEnvData({...envData, ambient_temp: e.target.value})}/>
                    </div>
                    <div>
                      <input type="number" placeholder="H. Rel %" className="w-full p-2 border rounded font-mono text-xs" value={envData.relative_humidity} onChange={e => setEnvData({...envData, relative_humidity: e.target.value})}/>
                    </div>
                    <div>
                      <input type="number" placeholder="T. Grano °C" className="w-full p-2 border rounded font-mono text-xs" value={envData.bean_temp} onChange={e => setEnvData({...envData, bean_temp: e.target.value})}/>
                    </div>
                    <div>
                      <input type="number" placeholder="H. Grano %" className="w-full p-2 border rounded font-mono text-xs" value={envData.bean_humidity} onChange={e => setEnvData({...envData, bean_humidity: e.target.value})}/>
                    </div>
                  </div>
                </div>

              </div>

              <button onClick={handleSave} disabled={dataPoints.length===0} className="mt-auto w-full py-3 bg-stone-800 text-white rounded-lg font-bold shadow-lg hover:bg-black transition-all flex justify-center gap-2"><Save size={18}/> REGISTRAR</button>
            </div>

            {/* Visualizador */}
            <div className="flex-1 bg-[#1a1a1a] relative flex flex-col overflow-hidden">
              {fileStats.maxTemp > 0 && (
                <div className="absolute top-4 right-4 z-20 flex gap-3 text-xs font-mono">
                  <div className="bg-black/50 px-3 py-1 rounded text-red-400 border border-red-900/30">Max BT: {fileStats.maxTemp.toFixed(1)}°C</div>
                  <div className="bg-black/50 px-3 py-1 rounded text-stone-400 border border-stone-800">Time: {Math.floor(fileStats.duration/60)}:{(fileStats.duration%60).toFixed(0).padStart(2,'0')}</div>
                </div>
              )}
              {dataPoints.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataPoints} margin={{ top: 40, right: 40, bottom: 40, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                    <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} ticks={xAxisTicks} tickFormatter={t => Math.floor(t / 60)} stroke={COLORS.text} tick={{ fontSize: 12, fill: COLORS.text }} />
                    <YAxis domain={['auto', 'auto']} stroke={COLORS.text} tick={{ fontSize: 12, fill: COLORS.text }} label={{ value: '°C', position: 'insideTopLeft', fill: COLORS.text, fontSize: 10, dy: -30 }} />
                    <Tooltip labelFormatter={t => `${Math.floor(t / 60)}:${(t % 60).toFixed(0).padStart(2, '0')}`} contentStyle={{ backgroundColor: COLORS.tooltip, border: '1px solid #333', borderRadius: '4px', color: '#fff' }} />
                    <Line type="monotone" dataKey="air" stroke={COLORS.air} strokeWidth={2} dot={false} name="Aire (ET)" />
                    <Line type="monotone" dataKey="bean" stroke={COLORS.bean} strokeWidth={2.5} dot={false} name="Grano (BT)" />
                    {events.map((ev, i) => (
                      <React.Fragment key={i}>
                        {!ev.isControl && <ReferenceLine x={ev.time} stroke={COLORS.grid} strokeDasharray="3 3" />}
                        <ReferenceDot x={ev.time} y={ev.temp} r={ev.isControl ? 3 : 5} fill={ev.color || COLORS.events} stroke="none">
                          <Label value={ev.label} position="top" offset={10} fill={COLORS.text} fontSize={10} angle={ev.isControl ? -45 : 0} />
                        </ReferenceDot>
                      </React.Fragment>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-600"><Activity size={80} strokeWidth={1} className="mb-4 opacity-20"/><p className="text-sm font-mono uppercase tracking-widest">Esperando archivo...</p></div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}