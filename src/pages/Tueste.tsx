import React, { useState, useEffect } from 'react';
import {
  Save, Activity, Flame, Settings, History, Thermometer, Usb, Square, Coffee, Database
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot
} from 'recharts';
import { toast } from 'sonner';

import { useAuth } from '../hooks/useAuth';
import { useRoastLogger } from '../hooks/useRoastLogger';
import { getMaquinas, crearMaquina, MaquinaForm } from '../services/maquinasService';
import {
  getInventarioOro, guardarTueste, guardarNotasCata, getHistorialTuestes,
  InventarioOroItem, CuppingNotes
} from '../services/tuesteService';
import { parseArtisanFile, processArtisanData } from '../utils/artisanParser';
import { CuppingNotesForm } from '../components/roast/CuppingNotesForm';
import {
  RoastVariablesForm, RoastVariables, defaultRoastVariables
} from '../components/roast/RoastVariablesForm';

const COLORS = {
  bg: '#1a1a1a', grid: '#333333', text: '#a3a3a3',
  bean: '#ef4444', air: '#3b82f6', events: '#f59e0b',
};

// ─── Machine Form ───────────────────────────────────────────────────────────
const MachineForm = ({ orgId, onSuccess }: { orgId: string; onSuccess: () => void }) => {
  const [m, setM] = useState<MaquinaForm>({ nombre: '', marca: '', capacidad: '' });
  const save = async () => {
    if (!m.nombre) return toast.warning('Nombre requerido');
    try {
      await crearMaquina(m, orgId);
      toast.success('Máquina creada');
      onSuccess();
      setM({ nombre: '', marca: '', capacidad: '' });
    } catch (e: any) { toast.error('Error', { description: e.message }); }
  };
  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-xl shadow space-y-4">
      <h3 className="font-bold text-emerald-800">Nueva Tostadora</h3>
      <input className="w-full p-2 border rounded" placeholder="Nombre" value={m.nombre} onChange={e => setM({ ...m, nombre: e.target.value })} />
      <input className="w-full p-2 border rounded" placeholder="Marca" value={m.marca} onChange={e => setM({ ...m, marca: e.target.value })} />
      <input className="w-full p-2 border rounded" type="number" placeholder="Capacidad (Kg)" value={m.capacidad} onChange={e => setM({ ...m, capacidad: e.target.value })} />
      <button onClick={save} className="w-full bg-emerald-600 text-white p-2 rounded font-bold">Guardar</button>
    </div>
  );
};

// ─── Cupping Score Badge ────────────────────────────────────────────────────
const ScoreBadge = ({ score }: { score: number }) => {
  const color = score >= 90 ? '#10b981' : score >= 85 ? '#3b82f6' : score >= 80 ? '#f59e0b' : '#6b7280';
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: color }}>
      {score.toFixed(1)} SCA
    </span>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
export function Tueste() {
  const { orgId, user } = useAuth();
  const [activeTab, setActiveTab] = useState('cockpit');

  const { connectToRoaster, startRoast, stopRoast, isConnected, isRoasting, liveData, roastLog } = useRoastLogger();

  // Datos base
  const [maquinas, setMaquinas] = useState<any[]>([]);
  const [inventario, setInventario] = useState<InventarioOroItem[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);

  // Formulario principal
  const [config, setConfig] = useState({ machineId: '', greenId: '', pesoEntrada: '' });
  const [pesoSalida, setPesoSalida] = useState('');
  const [envData, setEnvData] = useState({ ambient_temp: '', relative_humidity: '', bean_temp: '', bean_humidity: '' });

  // Gráfica
  const [staticData, setStaticData] = useState<any[]>([]);
  const [fileStats, setFileStats] = useState({ duration: 0, maxTemp: 0 });
  const [xAxisTicks, setXAxisTicks] = useState<number[]>([]);
  const [fileName, setFileName] = useState('');

  // Dataset IA — Variables del grano y notas de cata
  const [roastVars, setRoastVars] = useState<RoastVariables>(defaultRoastVariables());
  const [cuppingNotes, setCuppingNotes] = useState<CuppingNotes | null>(null);
  const [lastSavedBatchId, setLastSavedBatchId] = useState<string | null>(null);
  const [savingCupping, setSavingCupping] = useState(false);

  const selectedCoffeeData = inventario.find(i => i.id === config.greenId);
  const displayData = isConnected ? (isRoasting ? roastLog : [liveData]) : staticData;
  const hasData = displayData.length > 1;

  useEffect(() => { if (orgId) cargarDatos(); }, [orgId]);
  useEffect(() => { if (activeTab === 'history' && orgId) cargarHistorial(); }, [activeTab, orgId]);

  const cargarDatos = async () => {
    try {
      const [m, i] = await Promise.all([getMaquinas(), getInventarioOro()]);
      setMaquinas(m); setInventario(i);
    } catch (e) { console.error(e); }
  };

  const cargarHistorial = async () => {
    try {
      if (orgId) setHistorial(await getHistorialTuestes(orgId));
    } catch (e) { console.error(e); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setFileName(file.name);
      const result = await parseArtisanFile(file);
      setStaticData(result.points);
      setXAxisTicks(result.ticks);
      setFileStats({ duration: result.duration, maxTemp: result.maxTemp });
      if (result.ambientTemp) setEnvData(prev => ({ ...prev, ambient_temp: String(result.ambientTemp) }));
    } catch (error: any) { toast.error('Error', { description: error.message }); }
  };

  const cargarDesdeHistorial = (batch: any) => {
    const data = batch.roast_log_data;
    if (!data) return toast.warning('Registro sin datos.');
    let points: any[] = [], evs: any[] = [];
    if (Array.isArray(data)) { points = data; }
    else if (data.points) { points = data.points; evs = data.events || []; }
    else { const res = processArtisanData(data); points = res.points; evs = res.events; }
    void evs; // stored in local for legacy support

    setStaticData(points);
    const maxT = points.length > 0 ? Math.max(...points.map((p: any) => p.bean)) : 0;
    const dur = points.length > 0 ? points[points.length - 1].time : 0;
    setFileStats({ duration: dur, maxTemp: maxT });
    const ticks: number[] = []; for (let i = 0; i <= dur; i += 60) ticks.push(i);
    setXAxisTicks(ticks);
    setFileName(`Historial: ${new Date(batch.roast_date).toLocaleDateString()}`);
    setLastSavedBatchId(batch.id);
    setActiveTab('cockpit');

    // Cargar notas si existen
    if (batch.cupping_notes) setCuppingNotes(batch.cupping_notes as CuppingNotes);

    // Pre-llenar variables si vienen del historial
    setRoastVars(prev => ({
      ...prev,
      variety: batch.variety || '',
      process_method: batch.process_method || '',
      altitude_masl: batch.altitude_masl ? String(batch.altitude_masl) : '',
    }));
  };

  const handleSave = async () => {
    if (!config.machineId || !config.greenId || !config.pesoEntrada || !pesoSalida) {
      return toast.warning('Completa los datos del lote.');
    }

    let finalLog = staticData;
    if (isRoasting) { finalLog = stopRoast(); }
    else if (isConnected && roastLog.length > 0) { finalLog = roastLog; }

    if (finalLog.length === 0) return toast.warning('No hay datos de curva para guardar.');

    try {
      const maxTemp = Math.max(...finalLog.map((p: any) => p.bean));
      const duration = finalLog[finalLog.length - 1].time;

      const payload = {
        machine_id: config.machineId,
        operador: user?.email || 'Staff',
        peso_entrada: config.pesoEntrada,
        peso_salida: pesoSalida,
        curva_datos: finalLog,
        tiempo_total: Math.round(duration),
        temp_final: maxTemp,

        // Ambientales
        ambient_temp: envData.ambient_temp,
        relative_humidity: envData.relative_humidity,
        initial_bean_temp: envData.bean_temp,
        initial_bean_humidity: envData.bean_humidity,
        ambient_pressure_hpa: roastVars.ambient_pressure_hpa || undefined,

        // Dataset IA — Agronómicas
        altitude_masl: roastVars.altitude_masl ? Number(roastVars.altitude_masl) : null,
        apparent_density: roastVars.apparent_density ? Number(roastVars.apparent_density) : null,
        bean_humidity_pct: roastVars.bean_humidity_pct ? Number(roastVars.bean_humidity_pct) : null,
        water_activity: roastVars.water_activity ? Number(roastVars.water_activity) : null,
        variety: roastVars.variety || null,
        process_method: roastVars.process_method || null,

        // Dataset IA — Métricas curva
        first_crack_time: roastVars.first_crack_time ? Number(roastVars.first_crack_time) : null,
        first_crack_temp: roastVars.first_crack_temp ? Number(roastVars.first_crack_temp) : null,
        development_time_pct: roastVars.development_time_pct ? Number(roastVars.development_time_pct) : null,
        ror_peak: roastVars.ror_peak ? Number(roastVars.ror_peak) : null,
        ror_at_drop: roastVars.ror_at_drop ? Number(roastVars.ror_at_drop) : null,
        roast_level: roastVars.roast_level || null,
        roast_color_agtron: roastVars.roast_color_agtron ? Number(roastVars.roast_color_agtron) : null,
        batch_notes: roastVars.batch_notes || null,
        cupping_notes: cuppingNotes,
      };

      const consumo = [{ id: config.greenId, peso_usado: config.pesoEntrada }];

      if (orgId && user?.id) {
        const batch = await guardarTueste(payload, consumo, orgId, user.id);
        setLastSavedBatchId(batch.id);
        toast.success('Tueste registrado exitosamente');
        toast.info('Puedes agregar notas de cata en la pestaña "Cata & Notas"');
        setStaticData([]); setPesoSalida(''); setConfig({ ...config, pesoEntrada: '' });
      }
    } catch (e: any) { toast.error('Error al guardar', { description: e.message }); }
  };

  const handleSaveCupping = async (notes: CuppingNotes) => {
    setCuppingNotes(notes);
    if (!lastSavedBatchId) {
      toast.info('Las notas se guardarán junto con el tueste al presionar "Registrar"');
      return;
    }
    setSavingCupping(true);
    try {
      await guardarNotasCata(
        lastSavedBatchId, notes,
        roastVars.roast_level || undefined,
        roastVars.roast_color_agtron ? Number(roastVars.roast_color_agtron) : undefined,
        roastVars.batch_notes || undefined
      );
      toast.success('Notas de cata guardadas');
    } catch (e: any) {
      toast.error('Error al guardar cata', { description: e.message });
    } finally { setSavingCupping(false); }
  };

  // ─── Tabs Config ──────────────────────────────────────────────────────────
  const tabs = [
    { id: 'cockpit', label: 'Registro', icon: Flame },
    { id: 'dataset', label: 'Variables', icon: Database },
    { id: 'cupping', label: 'Cata & Notas', icon: Coffee },
    { id: 'history', label: 'Historial', icon: History },
    { id: 'machines', label: 'Máquinas', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen bg-stone-50 overflow-hidden">

      {/* Header Tabs */}
      <div className="flex bg-white border-b border-stone-200 px-4 py-2 gap-1 shadow-sm z-10 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 font-bold rounded-lg flex items-center gap-1.5 whitespace-nowrap text-sm transition-all ${active ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>
              <Icon size={14} />
              {t.label}
              {t.id === 'cupping' && cuppingNotes && (
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              )}
              {t.id === 'dataset' && roastVars.altitude_masl && (
                <span className="w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex h-full overflow-hidden">

        {/* ─── TAB: MÁQUINAS ─────────────────────────────────────────────── */}
        {activeTab === 'machines' && orgId && (
          <div className="w-full p-8"><MachineForm orgId={orgId} onSuccess={cargarDatos} /></div>
        )}

        {/* ─── TAB: HISTORIAL ────────────────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="w-full p-6 overflow-y-auto">
            <h2 className="text-lg font-bold text-stone-800 mb-4 flex items-center gap-2">
              <History size={20} /> Historial de Tuestes
            </h2>
            <div className="bg-white rounded-xl shadow border border-stone-200 overflow-hidden">
              {historial.length === 0 ? (
                <div className="p-8 text-center text-stone-400">No hay registros aún.</div>
              ) : (
                <div>
                  {historial.map(h => {
                    const cupping = h.cupping_notes as CuppingNotes | null;
                    return (
                      <div key={h.id} className="p-4 border-b border-stone-100 flex items-center justify-between hover:bg-stone-50 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-800">{new Date(h.roast_date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            {h.roast_level && (
                              <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-semibold">{h.roast_level}</span>
                            )}
                            {cupping && <ScoreBadge score={cupping.total_score} />}
                          </div>
                          <div className="text-xs text-stone-400 flex gap-3">
                            {h.machines?.name && <span>🏭 {h.machines.name}</span>}
                            {h.variety && <span>🌱 {h.variety}</span>}
                            {h.altitude_masl && <span>⛰️ {h.altitude_masl} m.s.n.m.</span>}
                            <span>⏱ {Math.round(h.total_time_seconds / 60)} min</span>
                            <span>💧 Drop: {h.drop_temp}°C</span>
                          </div>
                        </div>
                        <button onClick={() => cargarDesdeHistorial(h)}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 px-3 py-1.5 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">
                          Ver Gráfica
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: VARIABLES (Dataset IA) ───────────────────────────────── */}
        {activeTab === 'dataset' && (
          <div className="w-full overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Database size={20} className="text-amber-700" />
                </div>
                <div>
                  <h2 className="font-bold text-stone-800">Variables del Dataset</h2>
                  <p className="text-xs text-stone-400">Estos datos se guardan junto al tueste para entrenar la IA futura</p>
                </div>
              </div>

              {/* Info Rob Hoos */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
                <p className="font-bold">📖 Basado en Rob Hoos — Modulating the Flavor Profile of Coffee</p>
                <p>Altitud, densidad y % Tiempo de Desarrollo son los tres factores más correlacionados con el perfil de sabor final. Documentar la altitud es especialmente valioso en orígenes de montaña con poca investigación publicada.</p>
              </div>

              <RoastVariablesForm variables={roastVars} onChange={setRoastVars} />

              {hasData && !lastSavedBatchId && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                  💡 Guarda el tueste desde la pestaña <strong>Registro</strong> para persistir estas variables.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: CATA & NOTAS ─────────────────────────────────────────── */}
        {activeTab === 'cupping' && (
          <div className="w-full overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Coffee size={20} className="text-purple-700" />
                </div>
                <div>
                  <h2 className="font-bold text-stone-800">Notas de Cata</h2>
                  <p className="text-xs text-stone-400">Protocolo SCA — la correlación con la curva es el corazón del dataset</p>
                </div>
              </div>

              {!hasData && !lastSavedBatchId && (
                <div className="bg-stone-100 border border-stone-200 rounded-xl p-6 text-center text-stone-400 text-sm">
                  Primero carga o realiza un tueste para vincularlo a las notas de cata.
                </div>
              )}

              {(hasData || lastSavedBatchId) && (
                <CuppingNotesForm
                  cuppingNotes={cuppingNotes}
                  onSave={handleSaveCupping}
                  disabled={savingCupping}
                />
              )}
            </div>
          </div>
        )}

        {/* ─── TAB: COCKPIT (Registro) ────────────────────────────────────── */}
        {activeTab === 'cockpit' && (
          <>
            {/* Panel Lateral de Control */}
            <div className="w-80 bg-white border-r border-stone-200 p-5 flex flex-col gap-4 overflow-y-auto shadow-xl z-10">

              {/* Conexión USB / Archivo */}
              <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
                {!isConnected ? (
                  <>
                    <button onClick={() => connectToRoaster()}
                      className="w-full py-6 border-2 border-dashed border-stone-300 rounded-lg flex flex-col items-center justify-center text-stone-500 hover:border-emerald-500 hover:text-emerald-600 transition-all mb-2">
                      <Usb size={24} className="mb-1" />
                      <span className="text-xs font-bold">CONECTAR USB</span>
                    </button>
                    <div className="text-center text-xs text-stone-400 mb-2">O sube un archivo Artisan:</div>
                    <input type="file" accept=".json,.alog" onChange={handleFileUpload} className="w-full text-xs" />
                    {fileName && (
                      <p className="text-[10px] text-emerald-700 font-semibold mt-2 truncate">✅ {fileName}</p>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase border-b pb-2 border-stone-200">
                      <Activity size={14} /> Conexión Activa
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
                        <Flame size={16} /> INICIAR TUESTE
                      </button>
                    ) : (
                      <button onClick={handleSave} className="w-full py-3 bg-red-600 text-white rounded-lg font-bold shadow flex justify-center gap-2 text-sm">
                        <Square size={16} /> PARAR Y GUARDAR
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Config del Lote */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Datos del Lote</p>
                <select className="w-full p-2 border rounded text-sm" value={config.machineId} onChange={e => setConfig({ ...config, machineId: e.target.value })}>
                  <option value="">Máquina...</option>
                  {maquinas.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <select className="w-full p-2 border rounded text-sm" value={config.greenId} onChange={e => setConfig({ ...config, greenId: e.target.value })}>
                  <option value="">Café Verde...</option>
                  {inventario.map(i => <option key={i.id} value={i.id}>{i.origen} — {i.nombre}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Entrada Kg" className="w-full p-2 border rounded text-sm" value={config.pesoEntrada} onChange={e => setConfig({ ...config, pesoEntrada: e.target.value })} />
                  <input type="number" placeholder="Salida Kg" className="w-full p-2 border border-emerald-300 rounded text-sm font-bold" value={pesoSalida} onChange={e => setPesoSalida(e.target.value)} />
                </div>
              </div>

              {/* Condiciones Ambientales */}
              <div className="space-y-3 pt-2 border-t border-stone-200">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1"><Thermometer size={11} /> Ambiente</p>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Temp amb °C" className="p-2 border rounded text-xs" value={envData.ambient_temp} onChange={e => setEnvData({ ...envData, ambient_temp: e.target.value })} />
                  <input type="number" placeholder="Humedad amb %" className="p-2 border rounded text-xs" value={envData.relative_humidity} onChange={e => setEnvData({ ...envData, relative_humidity: e.target.value })} />
                  <input type="number" placeholder="Temp grano °C" className="p-2 border rounded text-xs" value={envData.bean_temp} onChange={e => setEnvData({ ...envData, bean_temp: e.target.value })} />
                  <input type="number" placeholder="Hum grano %" className="p-2 border rounded text-xs" value={envData.bean_humidity} onChange={e => setEnvData({ ...envData, bean_humidity: e.target.value })} />
                </div>
              </div>

              {/* Datos rápidos del café seleccionado */}
              {selectedCoffeeData && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Info del Café</p>
                  <div className="text-xs text-stone-600 space-y-0.5">
                    <p>🌱 Variedad: <strong>{selectedCoffeeData.variedad}</strong></p>
                    <p>💧 Proceso: <strong>{selectedCoffeeData.proceso}</strong></p>
                    <p>⚖️ Densidad: <strong>{selectedCoffeeData.densidad} g/L</strong></p>
                    <p>📦 Stock: <strong>{selectedCoffeeData.stock} kg</strong></p>
                  </div>
                </div>
              )}

              {/* Indicador Dataset */}
              <div className="border-t border-stone-200 pt-3 space-y-2">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                  <Database size={11} /> Estado del Dataset
                </p>
                <div className="grid grid-cols-2 gap-1 text-[10px]">
                  <span className={`flex items-center gap-1 ${roastVars.altitude_masl ? 'text-emerald-600' : 'text-stone-300'}`}>
                    {roastVars.altitude_masl ? '✅' : '○'} Altitud
                  </span>
                  <span className={`flex items-center gap-1 ${roastVars.apparent_density ? 'text-emerald-600' : 'text-stone-300'}`}>
                    {roastVars.apparent_density ? '✅' : '○'} Densidad
                  </span>
                  <span className={`flex items-center gap-1 ${roastVars.bean_humidity_pct ? 'text-emerald-600' : 'text-stone-300'}`}>
                    {roastVars.bean_humidity_pct ? '✅' : '○'} Hum. grano
                  </span>
                  <span className={`flex items-center gap-1 ${roastVars.variety ? 'text-emerald-600' : 'text-stone-300'}`}>
                    {roastVars.variety ? '✅' : '○'} Variedad
                  </span>
                  <span className={`flex items-center gap-1 ${roastVars.development_time_pct ? 'text-emerald-600' : 'text-stone-300'}`}>
                    {roastVars.development_time_pct ? '✅' : '○'} DT%
                  </span>
                  <span className={`flex items-center gap-1 ${cuppingNotes ? 'text-emerald-600' : 'text-stone-300'}`}>
                    {cuppingNotes ? '✅' : '○'} Cata
                  </span>
                </div>
              </div>

              {/* Botón Guardar Manual */}
              {!isRoasting && !isConnected && (
                <button onClick={handleSave} className="mt-auto w-full py-3 bg-stone-800 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                  <Save size={18} /> REGISTRAR LOTE
                </button>
              )}
            </div>

            {/* Gráfica */}
            <div className="flex-1 bg-[#1a1a1a] p-4 relative flex flex-col">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} />
                    <XAxis dataKey="time" type="number" domain={['auto', 'auto']} stroke={COLORS.text} ticks={xAxisTicks} tickFormatter={v => `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`} />
                    <YAxis domain={['auto', 'auto']} stroke={COLORS.text} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#fff', fontSize: 12 }}
                      formatter={(value: any) => [`${Number(value).toFixed(1)}°C`]}
                      labelFormatter={v => `⏱ ${Math.floor(Number(v) / 60)}:${String(Number(v) % 60).padStart(2, '0')}`}
                    />
                    <Line type="monotone" dataKey="bean" stroke={COLORS.bean} strokeWidth={3} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="air" stroke={COLORS.air} strokeWidth={2} dot={false} isAnimationActive={false} />
                    {roastVars.first_crack_time && (
                      <ReferenceDot
                        x={Number(roastVars.first_crack_time)}
                        y={roastVars.first_crack_temp ? Number(roastVars.first_crack_temp) : fileStats.maxTemp * 0.9}
                        r={8} fill="#f59e0b" stroke="#fff" strokeWidth={2}
                        label={{ value: '1C', fill: '#f59e0b', fontSize: 10, dy: -14 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Footer */}
              {hasData && (
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="text-stone-400">⏱ {Math.round(fileStats.duration / 60)} min {fileStats.duration % 60} seg</span>
                  <span className="text-red-400">🌡 Drop: {fileStats.maxTemp.toFixed(1)}°C</span>
                  {roastVars.development_time_pct && <span className="text-amber-400">⚡ DT: {roastVars.development_time_pct}%</span>}
                  {roastVars.altitude_masl && <span className="text-emerald-400">⛰️ {roastVars.altitude_masl} m.s.n.m.</span>}
                  {cuppingNotes && <span className="text-purple-400">☕ Score: {cuppingNotes.total_score.toFixed(1)}</span>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}