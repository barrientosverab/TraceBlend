import React, { useState, useEffect } from 'react';
import { 
  Save, Upload, Activity, Flame, Settings, History, Eye, Thermometer, Usb, Square 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine, Label 
} from 'recharts';
import { toast } from 'sonner';

import { useAuth } from '../hooks/useAuth';
import { useRoastLogger } from '../hooks/useRoastLogger';
import { getMaquinas, crearMaquina, MaquinaForm } from '../services/maquinasService';
import { getInventarioOro, guardarTueste, getHistorialTuestes, InventarioOroItem } from '../services/tuesteService';
import { parseArtisanFile, processArtisanData } from '../utils/artisanParser';

const COLORS = {
  bg: '#1a1a1a', grid: '#333333', text: '#a3a3a3', bean: '#ef4444', air: '#3b82f6', events: '#f59e0b', tooltip: 'rgba(0,0,0,0.9)'
};

const MachineForm = ({ orgId, onSuccess }: { orgId: string, onSuccess: () => void }) => {
  const [m, setM] = useState<MaquinaForm>({ nombre: '', marca: '', capacidad: '' });
  const save = async () => {
    if(!m.nombre) return toast.warning("Nombre requerido");
    try {
      await crearMaquina(m, orgId); 
      toast.success("Máquina creada"); 
      onSuccess();
      setM({ nombre:'', marca:'', capacidad:'' });
    } catch(e: any) { toast.error("Error", { description: e.message }); }
  };
  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow space-y-4">
      <h3 className="font-bold text-emerald-800">Nueva Tostadora</h3>
      <input className="w-full p-2 border rounded" placeholder="Nombre" value={m.nombre} onChange={e=>setM({...m, nombre:e.target.value})}/>
      <input className="w-full p-2 border rounded" placeholder="Marca" value={m.marca} onChange={e=>setM({...m, marca:e.target.value})}/>
      <input className="w-full p-2 border rounded" type="number" placeholder="Capacidad (Kg)" value={m.capacidad} onChange={e=>setM({...m, capacidad:e.target.value})}/>
      <button onClick={save} className="w-full bg-emerald-600 text-white p-2 rounded font-bold">Guardar</button>
    </div>
  );
};

export function Tueste() {
  const { orgId, user } = useAuth();
  const [activeTab, setActiveTab] = useState('cockpit');
  
  // Hook Web Serial
  const { 
    connectToRoaster, startRoast, stopRoast, 
    isConnected, isRoasting, liveData, roastLog 
  } = useRoastLogger();

  // Datos
  const [maquinas, setMaquinas] = useState<any[]>([]);
  const [inventario, setInventario] = useState<InventarioOroItem[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  
  // Formulario
  const [config, setConfig] = useState({ machineId: '', greenId: '', pesoEntrada: '' });
  const [pesoSalida, setPesoSalida] = useState('');
  
  const [envData, setEnvData] = useState({ 
    ambient_temp: '', relative_humidity: '', bean_temp: '', bean_humidity: '' 
  });
  
  // Gráfica Estática (Archivos/Historial)
  const [staticData, setStaticData] = useState<any[]>([]); 
  const [events, setEvents] = useState<any[]>([]); 
  const [fileStats, setFileStats] = useState({ duration: 0, maxTemp: 0 });
  const [xAxisTicks, setXAxisTicks] = useState<number[]>([]);
  const [fileName, setFileName] = useState('');

  const selectedCoffeeData = inventario.find(i => i.id === config.greenId);

  // Decidimos qué datos mostrar en la gráfica
  const displayData = isConnected ? (isRoasting ? roastLog : [liveData]) : staticData;

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
      if (orgId) {
        const data = await getHistorialTuestes(orgId);
        setHistorial(data);
      }
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setFileName(file.name);
      const result = await parseArtisanFile(file);
      setStaticData(result.points);
      setEvents(result.events);
      setXAxisTicks(result.ticks);
      setFileStats({ duration: result.duration, maxTemp: result.maxTemp });
      if (result.ambientTemp) setEnvData(prev => ({ ...prev, ambient_temp: String(result.ambientTemp) }));
    } catch (error: any) {
      toast.error("Error", { description: error.message });
    }
  };

  const cargarDesdeHistorial = (batch: any) => {
    const data = batch.roast_log_data;
    if (!data) return toast.warning("Registro sin datos.");

    let points = [];
    let evs = [];
    
    // Soporte para estructura nueva (Web Serial) o vieja (Artisan)
    if (Array.isArray(data)) {
        points = data; // Es un array directo de puntos
    } else if (data.points) {
        points = data.points;
        evs = data.events || [];
    } else {
        const res = processArtisanData(data);
        points = res.points;
        evs = res.events;
    }

    setStaticData(points);
    setEvents(evs);
    
    // Recalcular stats
    const maxT = points.length > 0 ? Math.max(...points.map((p:any) => p.bean)) : 0;
    const dur = points.length > 0 ? points[points.length-1].time : 0;
    
    setFileStats({ duration: dur, maxTemp: maxT });
    const ticks = []; for(let i=0; i<=dur; i+=60) ticks.push(i);
    setXAxisTicks(ticks);

    setFileName(`Historial: ${new Date(batch.roast_date).toLocaleDateString()}`);
    setActiveTab('cockpit');
  };

  const handleSave = async () => {
    if (!config.machineId || !config.greenId || !config.pesoEntrada || !pesoSalida) {
      return toast.warning("Completa los datos del lote.");
    }
    
    // Si estamos tostando, detenemos primero
    let finalLog = staticData;
    if (isRoasting) {
       finalLog = stopRoast(); // Detiene y obtiene los datos
    } else if (isConnected && roastLog.length > 0) {
       finalLog = roastLog; // Si ya paró pero no guardó
    }

    if (finalLog.length === 0) return toast.warning("No hay datos de curva para guardar.");

    try {
      const maxTemp = Math.max(...finalLog.map((p: any) => p.bean));
      const duration = finalLog[finalLog.length - 1].time;

      const payload = {
        machine_id: config.machineId,
        operador: user?.email || 'Staff',
        peso_entrada: config.pesoEntrada,
        peso_salida: pesoSalida,
        curva_datos: finalLog, // Guardamos el array limpio
        tiempo_total: Math.round(duration),
        temp_final: maxTemp,
        ambient_temp: envData.ambient_temp,
        relative_humidity: envData.relative_humidity,
        initial_bean_temp: envData.bean_temp,
        initial_bean_humidity: envData.bean_humidity
      };

      const consumo = [{ id: config.greenId, peso_usado: config.pesoEntrada }];
      
      if (orgId && user?.id) {
        await guardarTueste(payload, consumo, orgId, user.id);
        toast.success("Tueste registrado exitosamente");
        // Reset
        setStaticData([]); setPesoSalida(''); setConfig({...config, pesoEntrada: ''});
      }
    } catch (e: any) { toast.error("Error al guardar", { description: e.message }); }
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
        {activeTab === 'machines' && orgId && <div className="w-full p-8"><MachineForm orgId={orgId} onSuccess={cargarDatos}/></div>}

        {activeTab === 'history' && (
          <div className="w-full p-8 overflow-y-auto">
            {/* Tabla Historial (Igual que antes) */}
            <div className="bg-white rounded-xl shadow border border-stone-200 overflow-hidden">
                {historial.map(h => (
                    <div key={h.id} className="p-4 border-b flex justify-between">
                        <span>{new Date(h.roast_date).toLocaleDateString()}</span>
                        <button onClick={() => cargarDesdeHistorial(h)} className="text-blue-600 font-bold">Ver Gráfica</button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'cockpit' && (
          <>
            {/* PANEL IZQUIERDO DE CONTROL */}
            <div className="w-80 bg-white border-r border-stone-200 p-5 flex flex-col gap-4 overflow-y-auto shadow-xl z-10">
              
              {/* ZONA DE CONEXIÓN */}
              <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
                {!isConnected ? (
                  <>
                    <button onClick={() => connectToRoaster()} className="w-full py-6 border-2 border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center text-stone-500 hover:border-emerald-500 hover:text-emerald-600 transition-all mb-2">
                        <Usb size={24} className="mb-1"/>
                        <span className="text-xs font-bold">CONECTAR USB</span>
                    </button>
                    <div className="text-center text-xs text-stone-400">O sube un archivo:</div>
                    <input type="file" accept=".json,.alog" onChange={handleFileUpload} className="w-full text-xs mt-2"/>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase border-b pb-2 border-stone-200">
                        <Activity size={14}/> Conexión Activa
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-stone-800 p-2 rounded text-center">
                            <span className="text-[10px] text-stone-400 block">GRANO</span>
                            <span className="text-xl font-bold text-red-500">{liveData.bean.toFixed(1)}°</span>
                        </div>
                        <div className="bg-stone-800 p-2 rounded text-center">
                            <span className="text-[10px] text-stone-400 block">AIRE</span>
                            <span className="text-xl font-bold text-blue-500">{liveData.air.toFixed(1)}°</span>
                        </div>
                    </div>
                    
                    {!isRoasting ? (
                        <button onClick={startRoast} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold shadow animate-pulse flex justify-center gap-2 text-sm">
                            <Flame size={16}/> INICIAR TUESTE
                        </button>
                    ) : (
                        <button onClick={handleSave} className="w-full py-3 bg-red-600 text-white rounded-lg font-bold shadow flex justify-center gap-2 text-sm">
                            <Square size={16}/> PARAR Y GUARDAR
                        </button>
                    )}
                  </div>
                )}
              </div>

              {/* ... (Resto de inputs de configuración igual que antes) ... */}
              <div className="space-y-4 pt-4 border-t">
                  <select className="w-full p-2 border rounded text-sm" value={config.machineId} onChange={e => setConfig({...config, machineId: e.target.value})}>
                    <option value="">Máquina...</option>
                    {maquinas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <select className="w-full p-2 border rounded text-sm" value={config.greenId} onChange={e => setConfig({...config, greenId: e.target.value})}>
                    <option value="">Café Verde...</option>
                    {inventario.map(i => <option key={i.id} value={i.id}>{i.origen} - {i.nombre}</option>)}
                  </select>
                  
                  <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Entrada Kg" className="w-full p-2 border rounded text-sm" value={config.pesoEntrada} onChange={e => setConfig({...config, pesoEntrada: e.target.value})}/>
                      <input type="number" placeholder="Salida Kg" className="w-full p-2 border border-emerald-300 rounded text-sm font-bold" value={pesoSalida} onChange={e => setPesoSalida(e.target.value)}/>
                  </div>
              </div>

              {/* Botón de Guardar Manual (si no se usó el automático) */}
              {!isRoasting && !isConnected && (
                  <button onClick={handleSave} className="mt-auto w-full py-3 bg-stone-800 text-white rounded-lg font-bold">
                      <Save size={18} className="inline mr-2"/> REGISTRAR MANUAL
                  </button>
              )}
            </div>

            {/* GRAFICA */}
            <div className="flex-1 bg-[#1a1a1a] p-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                    <XAxis dataKey="time" type="number" domain={['auto', 'auto']} stroke={COLORS.text} />
                    <YAxis domain={['auto', 'auto']} stroke={COLORS.text} />
                    <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }} />
                    <Line type="monotone" dataKey="bean" stroke={COLORS.bean} strokeWidth={3} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="air" stroke={COLORS.air} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}