import React, { useState, useEffect } from 'react';
import { 
  Save, Upload, FileJson, Activity, Flame, Settings, Thermometer, 
  Info, Wind, Droplets, History, Eye 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot, ReferenceLine, Label 
} from 'recharts';
import { getMaquinas, crearMaquina } from '../services/maquinasService';
import { getInventarioOro, guardarTueste, getHistorialTuestes } from '../services/tuesteService';

// Colores Profesionales (Estilo Artisan)
const COLORS = {
  bg: '#1a1a1a',        
  grid: '#333333',      
  text: '#a3a3a3',      
  bean: '#ef4444',      // Grano (Rojo)
  air: '#3b82f6',       // Aire (Azul)
  events: '#f59e0b',    // Eventos (Naranja)
  tooltip: 'rgba(0,0,0,0.9)'
};

export function Tueste() {
  const [activeTab, setActiveTab] = useState('cockpit'); // 'cockpit', 'history', 'machines'
  
  // Datos Maestros
  const [maquinas, setMaquinas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [historial, setHistorial] = useState([]); // Estado para el historial
  
  // Formulario
  const [config, setConfig] = useState({ machineId: '', greenId: '', pesoEntrada: '' });
  const [pesoSalida, setPesoSalida] = useState('');
  const [envData, setEnvData] = useState({ 
    ambient_temp: '', relative_humidity: '', bean_temp: '', bean_humidity: '' 
  });
  
  // Datos del Archivo y Gráfica
  const [fileName, setFileName] = useState('');
  const [dataPoints, setDataPoints] = useState([]); 
  const [events, setEvents] = useState([]); 
  const [fileStats, setFileStats] = useState({ duration: 0, maxTemp: 0 });
  const [xAxisTicks, setXAxisTicks] = useState([]);

  // Información del grano seleccionado
  const selectedCoffeeData = inventario.find(i => i.id === config.greenId);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cargar historial cuando se entra a esa pestaña
  useEffect(() => {
    if (activeTab === 'history') cargarHistorial();
  }, [activeTab]);

  const cargarDatos = async () => {
    try {
      setMaquinas(await getMaquinas());
      setInventario(await getInventarioOro());
    } catch (e) { console.error(e); }
  };

  const cargarHistorial = async () => {
    try {
      const data = await getHistorialTuestes();
      setHistorial(data);
    } catch (e) { console.error("Error cargando historial:", e); }
  };

  // --- PROCESADOR DE DATOS (LÓGICA COMÚN) ---
  const procesarDatosDeCurva = (data) => {
    // Mapeo de Variables (Soporte Artisan 3.2+)
    const times = data.timex || data.time || data.x || [];
    
    // CORRECCIÓN: temp2 es Grano (curva con caída TP) y temp1 es Aire
    const beans = data.temp2 || data.bean_temp || []; 
    const airs = data.temp1 || data.air_temp || [];

    if (!Array.isArray(times) || times.length === 0) {
      throw new Error("Sin datos de tiempo.");
    }

    // Procesar Puntos
    const points = times.map((t, i) => ({
      time: t,
      bean: beans[i] !== undefined ? parseFloat(beans[i].toFixed(1)) : null,
      air: airs[i] !== undefined ? parseFloat(airs[i].toFixed(1)) : null
    })).filter(p => p.time > 0);

    // Procesar Eventos
    const eventosDetectados = [];
    
    // A. Fases
    if (data.computed) {
      const c = data.computed;
      const add = (type, time, temp, label, color) => {
        if (time && time > 0) eventosDetectados.push({ type, time, temp, label, color });
      };
      add('CHARGE', c.CHARGE_time, 0, 'Carga', '#6b7280');
      add('TP', c.TP_time, c.TP_BT, 'TP', '#6b7280');
      add('DRY', c.DRY_time, c.DRY_BT, 'Secado', '#d97706');
      add('FCs', c.FCs_time, c.FCs_BT, '1er Crack', '#dc2626');
      add('DROP', c.DROP_time, c.DROP_BT, 'Salida', '#000000');
    }

    // B. Controles (specialevents)
    if (Array.isArray(data.specialevents) && Array.isArray(data.specialeventsStrings)) {
      data.specialevents.forEach((timeIndex, i) => {
        const label = data.specialeventsStrings[i];
        // Validar si timeIndex es índice o tiempo (Artisan varía)
        let time = timeIndex;
        if (timeIndex < times.length && Number.isInteger(timeIndex)) {
             time = times[timeIndex]; 
        }
        
        if (label && time > 0) {
          eventosDetectados.push({
            type: 'CTRL',
            time: time,
            temp: beans[Number.isInteger(timeIndex) ? timeIndex : 0] || 0, 
            label: label, 
            isControl: true, 
            color: '#3b82f6'
          });
        }
      });
    }
    eventosDetectados.sort((a, b) => a.time - b.time);

    // Eje X (Minutos)
    const maxTime = Math.max(...times);
    const ticks = [];
    for (let i = 0; i <= maxTime; i += 60) ticks.push(i);

    return { points, eventosDetectados, ticks, maxTime, maxTemp: Math.max(...beans) };
  };

  // --- LECTOR DE ARCHIVOS (.json / .alog) ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let data = null;
        try {
          data = JSON.parse(text);
        } catch (jsonError) {
          const fixedText = text.replace(/'/g, '"').replace(/False/g, 'false').replace(/True/g, 'true').replace(/None/g, 'null').replace(/,\s*([\]}])/g, '$1'); 
          data = JSON.parse(fixedText);
        }

        const resultado = procesarDatosDeCurva(data);
        
        setDataPoints(resultado.points);
        setEvents(resultado.eventosDetectados);
        setXAxisTicks(resultado.ticks);
        setFileStats({ duration: resultado.maxTime, maxTemp: resultado.maxTemp });

        if (data.ambientTemp) setEnvData(prev => ({ ...prev, ambient_temp: data.ambientTemp }));

      } catch (error) {
        alert("Error leyendo archivo: " + error.message);
        setFileName(''); setDataPoints([]);
      }
    };
    reader.readAsText(file);
  };

  // --- CARGAR DESDE HISTORIAL ---
  const cargarDesdeHistorial = (batch) => {
    try {
      const data = batch.roast_log_data;
      if (!data) return alert("Este registro no tiene datos.");

      // Si ya está en formato TraceBlend (points, events)
      if (data.points) {
        setDataPoints(data.points);
        setEvents(data.events || []);
        const maxT = Math.max(...data.points.map(p=>p.bean));
        const dur = Math.max(...data.points.map(p=>p.time));
        setFileStats({ duration: dur, maxTemp: maxT });
        
        const ticks = []; for(let i=0; i<=dur; i+=60) ticks.push(i);
        setXAxisTicks(ticks);
      } else {
        // Formato crudo antiguo
        const resultado = procesarDatosDeCurva(data);
        setDataPoints(resultado.points);
        setEvents(resultado.eventosDetectados);
        setXAxisTicks(resultado.ticks);
        setFileStats({ duration: resultado.maxTime, maxTemp: resultado.maxTemp });
      }

      setFileName(`Historial: ${new Date(batch.roast_date).toLocaleString()}`);
      setActiveTab('cockpit'); // Volver al visor

    } catch (e) { alert("Error cargando historial: " + e.message); }
  };

  const handleSave = async () => {
    if (!config.machineId || !config.greenId || !config.pesoEntrada || !pesoSalida) {
      return alert("Completa todos los datos.");
    }
    if (dataPoints.length === 0) return alert("Carga un perfil válido.");

    if (selectedCoffeeData && parseFloat(config.pesoEntrada) > selectedCoffeeData.stock) {
      return alert(`Stock insuficiente: Solo tienes ${selectedCoffeeData.stock}kg.`);
    }

    try {
      const payload = {
        machine_id: config.machineId,
        operador: 'Admin', 
        peso_entrada: config.pesoEntrada,
        peso_salida: pesoSalida,
        curva_datos: { points: dataPoints, events }, // Guardamos la estructura limpia
        tiempo_total: Math.round(fileStats.duration),
        temp_final: fileStats.maxTemp,
        ambient_temp: parseFloat(envData.ambient_temp) || 0,
        relative_humidity: parseFloat(envData.relative_humidity) || 0,
        initial_bean_temp: parseFloat(envData.bean_temp) || 0,
        initial_bean_humidity: parseFloat(envData.bean_humidity) || 0
      };

      const consumo = [{ id: config.greenId, peso_usado: config.pesoEntrada }];
      
      await guardarTueste(payload, consumo);
      alert("✅ Lote registrado correctamente");
      
      setFileName(''); setDataPoints([]); setEvents([]); setPesoSalida('');
      setConfig({ ...config, pesoEntrada: '' });
      cargarDatos();
    } catch (e) { alert(e.message); }
  };

  // Sub-componente Máquina
  const MachineForm = () => {
    const [m, setM] = useState({nombre:'', marca:'', capacidad:''});
    const save = async () => {
      if(!m.nombre) return alert("Nombre requerido");
      await crearMaquina(m); 
      alert("Máquina creada"); 
      cargarDatos(); 
      setM({nombre:'', marca:'', capacidad:''});
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
      
      {/* HEADER TABS */}
      <div className="flex bg-white border-b border-stone-200 px-6 py-2 gap-4 shadow-sm z-10">
        <button onClick={()=>setActiveTab('cockpit')} className={`px-4 py-2 font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab==='cockpit'?'bg-stone-800 text-white':'text-stone-500 hover:bg-stone-100'}`}>
          <Flame size={16}/> Registro
        </button>
        <button onClick={()=>setActiveTab('history')} className={`px-4 py-2 font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab==='history'?'bg-stone-800 text-white':'text-stone-500 hover:bg-stone-100'}`}>
          <History size={16}/> Historial
        </button>
        <button onClick={()=>setActiveTab('machines')} className={`px-4 py-2 font-bold rounded-lg flex items-center gap-2 transition-all ${activeTab==='machines'?'bg-stone-800 text-white':'text-stone-500 hover:bg-stone-100'}`}>
          <Settings size={16}/> Máquinas
        </button>
      </div>

      <div className="flex-1 flex h-full overflow-hidden">
        
        {/* VISTA: MÁQUINAS */}
        {activeTab === 'machines' && <div className="w-full p-8"><MachineForm/></div>}

        {/* VISTA: HISTORIAL */}
        {activeTab === 'history' && (
          <div className="w-full p-8 overflow-y-auto">
            <h2 className="text-xl font-bold text-stone-800 mb-6">Historial de Producción</h2>
            <div className="bg-white rounded-xl shadow border border-stone-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-stone-100 text-stone-500 font-bold text-xs uppercase">
                  <tr>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Máquina</th>
                    <th className="p-4">Café Origen</th>
                    <th className="p-4 text-center">Salida (Kg)</th>
                    <th className="p-4 text-center">Temp Max</th>
                    <th className="p-4">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-sm">
                  {historial.map(h => (
                    <tr key={h.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-4 font-mono text-stone-600">
                        {new Date(h.roast_date).toLocaleDateString()} <span className="text-xs text-stone-400">{new Date(h.roast_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="p-4 font-bold text-stone-700">{h.machines?.name}</td>
                      <td className="p-4 text-emerald-700">
                        {h.roast_batch_inputs[0]?.green_coffee_warehouse?.name_ref || 'Desconocido'}
                      </td>
                      <td className="p-4 text-center font-mono font-bold">{h.roasted_weight_output}</td>
                      <td className="p-4 text-center">
                        {h.drop_temp ? `${h.drop_temp}°C` : '-'}
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => cargarDesdeHistorial(h)}
                          className="flex items-center gap-2 px-3 py-1 bg-stone-800 text-white rounded-lg hover:bg-black transition-colors text-xs font-bold"
                        >
                          <Eye size={14}/> Ver Curva
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {historial.length === 0 && (
                <div className="p-12 text-center text-stone-400">No hay registros de tueste aún.</div>
              )}
            </div>
          </div>
        )}

        {/* VISTA: COCKPIT (REGISTRO) */}
        {activeTab === 'cockpit' && (
          <>
            {/* PANEL IZQUIERDO: FORMULARIO */}
            <div className="w-80 bg-white border-r border-stone-200 p-5 flex flex-col gap-5 overflow-y-auto shadow-xl z-10">
              
              {/* UPLOAD */}
              <div className="bg-stone-100 p-4 rounded-xl border border-stone-200 text-center relative cursor-pointer hover:bg-stone-200 transition-colors group">
                <input type="file" accept=".json,.alog" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer"/>
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-stone-400 group-hover:text-stone-600"/>
                  <span className="text-xs font-bold text-stone-500 uppercase">
                    {fileName ? <span className="text-emerald-600">{fileName}</span> : "Subir Archivo Artisan"}
                  </span>
                </div>
              </div>

              {/* INFO DE LOTE */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Configuración</label>
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
                    <div className="flex justify-between font-bold text-emerald-800 border-b border-emerald-200 pb-1">
                      <span>Stock:</span><span>{selectedCoffeeData.stock} Kg</span>
                    </div>
                    <div className="flex justify-between"><span>Var:</span> {selectedCoffeeData.variedad}</div>
                    <div className="flex justify-between"><span>Proc:</span> {selectedCoffeeData.proceso}</div>
                    <div className="flex justify-between"><span>Dens:</span> {selectedCoffeeData.densidad}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase">Entrada</label>
                    <input type="number" className="w-full p-2 border rounded font-mono text-stone-800" placeholder="Kg" value={config.pesoEntrada} onChange={e=>setConfig({...config, pesoEntrada:e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-emerald-600 uppercase">Salida</label>
                    <input type="number" className="w-full p-2 border border-emerald-300 rounded font-mono font-bold text-emerald-800" placeholder="Kg" value={pesoSalida} onChange={e=>setPesoSalida(e.target.value)}/>
                  </div>
                </div>

                {/* AMBIENTE */}
                <div className="grid grid-cols-4 gap-1">
                   <div className="col-span-4 text-[10px] font-bold text-stone-400 uppercase mb-1">Ambiente & Grano</div>
                   <input className="p-1 border rounded text-xs text-center" placeholder="°Amb" title="Temp Ambiente" value={envData.ambient_temp} onChange={e=>setEnvData({...envData, ambient_temp:e.target.value})}/>
                   <input className="p-1 border rounded text-xs text-center" placeholder="%Amb" title="Hum Ambiente" value={envData.relative_humidity} onChange={e=>setEnvData({...envData, relative_humidity:e.target.value})}/>
                   <input className="p-1 border rounded text-xs text-center" placeholder="°Gra" title="Temp Grano" value={envData.bean_temp} onChange={e=>setEnvData({...envData, bean_temp:e.target.value})}/>
                   <input className="p-1 border rounded text-xs text-center" placeholder="%Gra" title="Hum Grano" value={envData.bean_humidity} onChange={e=>setEnvData({...envData, bean_humidity:e.target.value})}/>
                </div>
              </div>

              <button onClick={handleSave} disabled={dataPoints.length===0} className="mt-auto w-full py-3 bg-stone-800 text-white rounded-lg font-bold shadow-lg hover:bg-black transition-all flex justify-center gap-2">
                <Save size={18}/> REGISTRAR
              </button>
            </div>

            {/* PANEL DERECHO: VISUALIZADOR */}
            <div className="flex-1 bg-[#1a1a1a] relative flex flex-col overflow-hidden">
              
              {/* Stats Flotantes */}
              {fileStats.maxTemp > 0 && (
                <div className="absolute top-4 right-4 z-20 flex gap-3 text-xs font-mono">
                  <div className="bg-black/50 px-3 py-1 rounded text-red-400 border border-red-900/30">
                    Max BT: {fileStats.maxTemp.toFixed(1)}°C
                  </div>
                  <div className="bg-black/50 px-3 py-1 rounded text-stone-400 border border-stone-800">
                    Tiempo: {Math.floor(fileStats.duration/60)}:{(fileStats.duration%60).toFixed(0).padStart(2,'0')}
                  </div>
                </div>
              )}

              {dataPoints.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataPoints} margin={{ top: 40, right: 40, bottom: 40, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                    
                    <XAxis 
                      dataKey="time" type="number" domain={['dataMin', 'dataMax']}
                      ticks={xAxisTicks}
                      tickFormatter={t => Math.floor(t / 60)} 
                      stroke={COLORS.text}
                      tick={{ fontSize: 12, fill: COLORS.text }}
                    />
                    <YAxis 
                      domain={['auto', 'auto']} stroke={COLORS.text} 
                      tick={{ fontSize: 12, fill: COLORS.text }} 
                      label={{ value: '°C', position: 'insideTopLeft', fill: COLORS.text, fontSize: 10, dy: -30 }}
                    />
                    
                    <Tooltip 
                      labelFormatter={t => `${Math.floor(t / 60)}:${(t % 60).toFixed(0).padStart(2, '0')}`}
                      contentStyle={{ backgroundColor: COLORS.tooltip, border: '1px solid #333', borderRadius: '4px', color: '#fff' }}
                    />
                    
                    {/* CURVAS */}
                    <Line type="monotone" dataKey="air" stroke={COLORS.air} strokeWidth={2} dot={false} name="Aire (ET)" />
                    <Line type="monotone" dataKey="bean" stroke={COLORS.bean} strokeWidth={2.5} dot={false} name="Grano (BT)" />

                    {/* EVENTOS */}
                    {events.map((ev, i) => (
                      <React.Fragment key={i}>
                        {!ev.isControl && <ReferenceLine x={ev.time} stroke={COLORS.grid} strokeDasharray="3 3" />}
                        <ReferenceDot x={ev.time} y={ev.temp} r={ev.isControl ? 3 : 5} fill={ev.color || COLORS.events} stroke="none">
                          <Label 
                            value={ev.label} position="top" offset={10} 
                            fill={COLORS.text} fontSize={10} angle={ev.isControl ? -45 : 0} 
                          />
                        </ReferenceDot>
                      </React.Fragment>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-stone-600">
                  <Activity size={80} strokeWidth={1} className="mb-4 opacity-20"/>
                  <p className="text-sm font-mono uppercase tracking-widest">Esperando archivo...</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}