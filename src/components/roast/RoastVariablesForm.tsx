import React from 'react';
import { Mountain, Droplets, Scale, FlaskConical, Layers, Info } from 'lucide-react';

const VARIETIES = [
    'Caturra', 'Castillo', 'Colombia', 'Gesha / Geisha', 'Bourbon',
    'Typica', 'Pacamara', 'Sidra', 'Tabi', 'Cenicafé 1',
    'Pink Bourbon', 'Moca', 'Laurina', 'SL28', 'SL34', 'Otro',
];

const PROCESSES = [
    'Lavado', 'Natural', 'Honey (amarillo)', 'Honey (rojo)',
    'Honey (negro)', 'Anaeróbico lavado', 'Anaeróbico natural',
    'Doble fermentación', 'Semi-lavado', 'Wet-hulled (Giling Basah)',
];

const ROAST_LEVELS = [
    { value: 'Light', label: 'Light', color: '#c4a265', agtron: '75–95' },
    { value: 'Medium-Light', label: 'Med-Light', color: '#a07040', agtron: '60–74' },
    { value: 'Medium', label: 'Medium', color: '#7a4f25', agtron: '45–59' },
    { value: 'Medium-Dark', label: 'Med-Dark', color: '#5a3010', agtron: '35–44' },
    { value: 'Dark', label: 'Dark', color: '#2a1005', agtron: '25–34' },
];

export interface RoastVariables {
    // Agronómicas
    altitude_masl: string;
    apparent_density: string;
    bean_humidity_pct: string;
    water_activity: string;
    variety: string;
    process_method: string;

    // Ambiental extra
    ambient_pressure_hpa: string;

    // Métricas de la curva
    first_crack_time: string;
    first_crack_temp: string;
    development_time_pct: string;
    ror_peak: string;
    ror_at_drop: string;
    roast_level: string;
    roast_color_agtron: string;

    // Notas libres
    batch_notes: string;
}

export const defaultRoastVariables = (): RoastVariables => ({
    altitude_masl: '', apparent_density: '', bean_humidity_pct: '', water_activity: '',
    variety: '', process_method: '',
    ambient_pressure_hpa: '',
    first_crack_time: '', first_crack_temp: '', development_time_pct: '',
    ror_peak: '', ror_at_drop: '',
    roast_level: '', roast_color_agtron: '',
    batch_notes: '',
});

interface FieldProps {
    label: string;
    unit?: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    tip?: string;
}

const Field = ({ label, unit, value, onChange, type = 'number', placeholder, min, max, step = 1, tip }: FieldProps) => (
    <div className="space-y-1">
        <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">{label}</label>
            {unit && <span className="text-[10px] text-stone-400 font-mono">{unit}</span>}
        </div>
        <input
            type={type} value={value} min={min} max={max} step={step}
            placeholder={placeholder}
            onChange={e => onChange(e.target.value)}
            className="w-full p-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
        />
        {tip && <p className="text-[10px] text-stone-400 italic">{tip}</p>}
    </div>
);

interface Props {
    variables: RoastVariables;
    onChange: (v: RoastVariables) => void;
}

export function RoastVariablesForm({ variables, onChange }: Props) {
    const set = (field: keyof RoastVariables, val: string) =>
        onChange({ ...variables, [field]: val });

    return (
        <div className="space-y-5">

            {/* Sección: Grano Verde */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-50 px-4 py-3 border-b border-stone-200 flex items-center gap-2">
                    <Mountain size={16} className="text-emerald-700" />
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Variables del Grano Verde</h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <Field
                            label="Altitud de la Finca"
                            unit="m.s.n.m."
                            value={variables.altitude_masl}
                            onChange={v => set('altitude_masl', v)}
                            min={0} max={3500}
                            tip="Clave: a mayor altitud, mayor densidad y mayor tiempo de carga (Rob Hoos)"
                        />
                    </div>
                    <Field
                        label="Densidad Aparente"
                        unit="g/L"
                        value={variables.apparent_density}
                        onChange={v => set('apparent_density', v)}
                        min={400} max={950} step={0.1}
                        placeholder="ej: 720"
                    />
                    <Field
                        label="Humedad del Grano"
                        unit="%"
                        value={variables.bean_humidity_pct}
                        onChange={v => set('bean_humidity_pct', v)}
                        min={7} max={25} step={0.1}
                        placeholder="ej: 11.5"
                    />
                    <div className="col-span-2">
                        <Field
                            label="Actividad del Agua (Aw)"
                            unit="0.0 – 1.0"
                            value={variables.water_activity}
                            onChange={v => set('water_activity', v)}
                            min={0} max={1} step={0.001}
                            placeholder="ej: 0.550 (opcional)"
                            tip="Si tienes higrómetro Aw. Complementa la humedad %"
                        />
                    </div>
                </div>
            </div>

            {/* Variedad y Beneficio */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-amber-50 px-4 py-3 border-b border-stone-200 flex items-center gap-2">
                    <Layers size={16} className="text-amber-700" />
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-widest">Variedad y Beneficio</h4>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wide block mb-1">Variedad</label>
                        <select value={variables.variety} onChange={e => set('variety', e.target.value)}
                            className="w-full p-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                            <option value="">Seleccionar variedad...</option>
                            {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wide block mb-1">Proceso / Beneficio</label>
                        <select value={variables.process_method} onChange={e => set('process_method', e.target.value)}
                            className="w-full p-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400">
                            <option value="">Seleccionar proceso...</option>
                            {PROCESSES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Condiciones Ambientales */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-blue-50 px-4 py-3 border-b border-stone-200 flex items-center gap-2">
                    <Droplets size={16} className="text-blue-700" />
                    <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest">Ambiente (Día del Tueste)</h4>
                </div>
                <div className="p-4">
                    <Field
                        label="Presión Barométrica"
                        unit="hPa"
                        value={variables.ambient_pressure_hpa}
                        onChange={v => set('ambient_pressure_hpa', v)}
                        min={600} max={1100} step={0.1}
                        placeholder="ej: 870 (opcional)"
                        tip="Relevante en tostaderías de gran altitud. Modifica el punto de ebullición del agua en el grano"
                    />
                </div>
            </div>

            {/* Métricas de la Curva */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-red-50 px-4 py-3 border-b border-stone-200 flex items-center gap-2">
                    <FlaskConical size={16} className="text-red-700" />
                    <h4 className="text-xs font-bold text-red-800 uppercase tracking-widest">Métricas del Perfil (Post-Tueste)</h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                    <Field label="1st Crack – Tiempo" unit="seg" value={variables.first_crack_time} onChange={v => set('first_crack_time', v)} placeholder="ej: 480" />
                    <Field label="1st Crack – Temp" unit="°C" value={variables.first_crack_temp} onChange={v => set('first_crack_temp', v)} placeholder="ej: 196" step={0.1} />
                    <Field
                        label="% Tiempo Desarrollo"
                        unit="DT%"
                        value={variables.development_time_pct}
                        onChange={v => set('development_time_pct', v)}
                        min={0} max={100} step={0.1}
                        placeholder="ej: 21.5"
                        tip="Rob Hoos: 20-25% = equilibrio óptimo en la mayoría de orígenes"
                    />
                    <Field label="ROR Pico" unit="°C/min" value={variables.ror_peak} onChange={v => set('ror_peak', v)} placeholder="ej: 14.2" step={0.1} />
                    <Field label="ROR al Drop" unit="°C/min" value={variables.ror_at_drop} onChange={v => set('ror_at_drop', v)} placeholder="ej: 6.5" step={0.1} />
                    <Field label="Color Agtron" unit="Agtron" value={variables.roast_color_agtron} onChange={v => set('roast_color_agtron', v)} placeholder="ej: 68 (opcional)" min={25} max={95} />
                </div>

                {/* Nivel de Tueste */}
                <div className="px-4 pb-4 space-y-2">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wide block">Nivel de Tueste (visual)</label>
                    <div className="flex gap-2 flex-wrap">
                        {ROAST_LEVELS.map(lvl => (
                            <button key={lvl.value}
                                onClick={() => set('roast_level', lvl.value)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border-2 transition-all ${variables.roast_level === lvl.value ? 'border-stone-700 shadow-md scale-105' : 'border-stone-200 hover:border-stone-400'}`}
                                style={{ backgroundColor: variables.roast_level === lvl.value ? lvl.color + '20' : 'white' }}>
                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: lvl.color }} />
                                <span>{lvl.label}</span>
                                <span className="text-[9px] font-mono text-stone-400">{lvl.agtron}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notas Libres */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="bg-stone-50 px-4 py-3 border-b border-stone-200 flex items-center gap-2">
                    <Info size={16} className="text-stone-500" />
                    <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Notas del Operador</h4>
                </div>
                <div className="p-4">
                    <textarea
                        value={variables.batch_notes}
                        onChange={e => set('batch_notes', e.target.value)}
                        rows={3}
                        placeholder="Observaciones del tueste: comportamiento de la carga, eventos anómalos, intervenciones manuales..."
                        className="w-full p-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
                    />
                </div>
            </div>

        </div>
    );
}
