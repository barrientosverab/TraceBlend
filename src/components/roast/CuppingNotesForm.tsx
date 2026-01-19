import React, { useState } from 'react';
import { Plus, X, Coffee, Star } from 'lucide-react';
import type { CuppingNotes } from '../../services/tuesteService';

const FLAVOR_OPTIONS = [
    'Chocolate', 'Caramelo', 'Nuez', 'Avellana', 'Vainilla',
    'Manzana', 'Durazno', 'Cereza', 'Uva', 'Cítrico', 'Limón', 'Naranja',
    'Miel', 'Panela', 'Azúcar morena', 'Almendra', 'Maní',
    'Floral', 'Jazmín', 'Rosa', 'Lavanda',
    'Té negro', 'Hierba', 'Terroso', 'Ahumado', 'Especias',
];

const AROMA_OPTIONS = [
    'Floral', 'Frutal', 'Herbal', 'Especiado', 'Caramelizado',
    'Chocolate', 'Nuez', 'Tostado', 'Ahumado', 'Terroso',
    'Cítrico', 'Fermento', 'Vino', 'Miel',
];

interface ScoreSliderProps {
    label: string;
    value: number;
    onChange: (v: number) => void;
}

const ScoreSlider = ({ label, value, onChange }: ScoreSliderProps) => {
    const pct = ((value - 6) / 4) * 100;
    const color = value >= 9 ? '#10b981' : value >= 8 ? '#3b82f6' : value >= 7 ? '#f59e0b' : '#ef4444';

    return (
        <div className="space-y-1">
            <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-stone-600 uppercase tracking-wide">{label}</span>
                <span className="text-sm font-bold" style={{ color }}>{value.toFixed(1)}</span>
            </div>
            <input
                type="range" min={6} max={10} step={0.25}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: color }}
            />
        </div>
    );
};

interface Props {
    onSave: (notes: CuppingNotes) => void;
    cuppingNotes: CuppingNotes | null;
    disabled?: boolean;
}

const defaultNotes = (): CuppingNotes => ({
    fragrance: 7.5, aroma: 7.5, flavor: 7.5, aftertaste: 7.0,
    acidity: 7.5, acidity_intensity: 'media',
    body: 7.5, body_level: 'cremoso',
    balance: 7.5, uniformity: 10, clean_cup: 10, sweetness: 10,
    overall: 7.5, defects: 0,
    total_score: 0,
    flavor_descriptors: [], aroma_descriptors: [],
    cata_date: new Date().toISOString().split('T')[0],
    cupper_name: '',
});

function calcTotal(n: Omit<CuppingNotes, 'total_score'>): number {
    return (
        n.fragrance + n.aroma + n.flavor + n.aftertaste +
        n.acidity + n.body + n.balance +
        n.uniformity + n.clean_cup + n.sweetness +
        n.overall - n.defects
    );
}

export function CuppingNotesForm({ onSave, cuppingNotes, disabled }: Props) {
    const [notes, setNotes] = useState<CuppingNotes>(cuppingNotes ?? defaultNotes());
    const [customFlavor, setCustomFlavor] = useState('');
    const [customAroma, setCustomAroma] = useState('');

    const update = (field: keyof CuppingNotes, val: any) => {
        setNotes(prev => {
            const updated = { ...prev, [field]: val };
            updated.total_score = calcTotal(updated);
            return updated;
        });
    };

    const toggleDescriptor = (list: 'flavor_descriptors' | 'aroma_descriptors', item: string) => {
        setNotes(prev => {
            const current = prev[list];
            const updated = current.includes(item)
                ? current.filter(x => x !== item)
                : [...current, item];
            return { ...prev, [list]: updated };
        });
    };

    const addCustom = (type: 'flavor' | 'aroma') => {
        const val = type === 'flavor' ? customFlavor.trim() : customAroma.trim();
        if (!val) return;
        const field = type === 'flavor' ? 'flavor_descriptors' : 'aroma_descriptors';
        toggleDescriptor(field, val);
        if (type === 'flavor') setCustomFlavor('');
        else setCustomAroma('');
    };

    const totalScore = calcTotal(notes);
    const scoreColor = totalScore >= 90 ? '#10b981' : totalScore >= 85 ? '#3b82f6' : totalScore >= 80 ? '#f59e0b' : '#ef4444';

    return (
        <div className="space-y-6">

            {/* Score Total */}
            <div className="bg-stone-900 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: scoreColor + '20', border: `2px solid ${scoreColor}` }}>
                        <Star size={20} style={{ color: scoreColor }} />
                    </div>
                    <div>
                        <p className="text-xs text-stone-400 uppercase tracking-wide">Score SCA</p>
                        <p className="text-3xl font-black" style={{ color: scoreColor }}>{totalScore.toFixed(2)}</p>
                    </div>
                </div>
                <div className="text-right text-xs text-stone-400 space-y-1">
                    <div>{totalScore >= 90 ? '☕ Outstanding' : totalScore >= 85 ? '☕ Excellent' : totalScore >= 80 ? '☕ Very Good' : '☕ Good'}</div>
                </div>
            </div>

            {/* Atributos SCA */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Atributos SCA</h4>

                <div className="grid grid-cols-1 gap-4">
                    <ScoreSlider label="Fragancia / Aroma" value={notes.fragrance} onChange={v => update('fragrance', v)} />
                    <ScoreSlider label="Sabor" value={notes.flavor} onChange={v => update('flavor', v)} />
                    <ScoreSlider label="Aftertaste" value={notes.aftertaste} onChange={v => update('aftertaste', v)} />

                    <div className="space-y-1">
                        <ScoreSlider label="Acidez" value={notes.acidity} onChange={v => update('acidity', v)} />
                        <div className="flex gap-2">
                            {(['alta', 'media', 'baja'] as const).map(opt => (
                                <button key={opt} onClick={() => update('acidity_intensity', opt)}
                                    className={`flex-1 text-[10px] font-bold py-1 rounded-md uppercase ${notes.acidity_intensity === opt ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <ScoreSlider label="Cuerpo" value={notes.body} onChange={v => update('body', v)} />
                        <div className="flex gap-2">
                            {(['pleno', 'cremoso', 'ligero'] as const).map(opt => (
                                <button key={opt} onClick={() => update('body_level', opt)}
                                    className={`flex-1 text-[10px] font-bold py-1 rounded-md capitalize ${notes.body_level === opt ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'}`}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <ScoreSlider label="Balance" value={notes.balance} onChange={v => update('balance', v)} />
                    <ScoreSlider label="Overall" value={notes.overall} onChange={v => update('overall', v)} />
                </div>

                {/* Atributos fijos */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100">
                    {['uniformity', 'clean_cup', 'sweetness'].map(field => (
                        <div key={field} className="text-center">
                            <p className="text-[9px] uppercase text-stone-400 font-bold">{field.replace('_', ' ')}</p>
                            <div className="flex justify-center gap-1 mt-1">
                                {[0, 2, 4, 6, 8, 10].map(v => (
                                    <button key={v}
                                        onClick={() => update(field as keyof CuppingNotes, v === (notes as any)[field] ? (notes as any)[field] : v)}
                                        className={`w-4 h-4 rounded-sm text-[8px] font-bold ${(notes as any)[field] >= v && v > 0 ? 'bg-emerald-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                                        {v === 0 ? '×' : ''}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs font-bold text-stone-700 mt-1">{(notes as any)[field]}</p>
                        </div>
                    ))}
                </div>

                {/* Defectos */}
                <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
                    <span className="text-xs font-bold text-stone-500 uppercase">Defectos (−2pt c/u)</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => update('defects', Math.max(0, notes.defects - 2))} className="w-7 h-7 bg-stone-100 rounded-full font-bold text-stone-600 hover:bg-red-100">−</button>
                        <span className="font-bold w-6 text-center text-red-600">{notes.defects}</span>
                        <button onClick={() => update('defects', notes.defects + 2)} className="w-7 h-7 bg-stone-100 rounded-full font-bold text-stone-600 hover:bg-red-100">+</button>
                    </div>
                </div>
            </div>

            {/* Descriptores de Sabor */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Descriptores de Sabor</h4>
                <div className="flex flex-wrap gap-2">
                    {FLAVOR_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => toggleDescriptor('flavor_descriptors', opt)}
                            className={`px-2 py-1 rounded-full text-xs font-semibold transition-all ${notes.flavor_descriptors.includes(opt) ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-500 hover:bg-amber-100'}`}>
                            {opt}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input value={customFlavor} onChange={e => setCustomFlavor(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom('flavor')}
                        placeholder="Otro sabor..." className="flex-1 text-xs p-2 border border-stone-200 rounded-lg" />
                    <button onClick={() => addCustom('flavor')} className="p-2 bg-amber-500 text-white rounded-lg"><Plus size={14} /></button>
                </div>
            </div>

            {/* Descriptores de Aroma */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest">Descriptores de Aroma</h4>
                <div className="flex flex-wrap gap-2">
                    {AROMA_OPTIONS.map(opt => (
                        <button key={opt} onClick={() => toggleDescriptor('aroma_descriptors', opt)}
                            className={`px-2 py-1 rounded-full text-xs font-semibold transition-all ${notes.aroma_descriptors.includes(opt) ? 'bg-purple-500 text-white' : 'bg-stone-100 text-stone-500 hover:bg-purple-100'}`}>
                            {opt}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input value={customAroma} onChange={e => setCustomAroma(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom('aroma')}
                        placeholder="Otro aroma..." className="flex-1 text-xs p-2 border border-stone-200 rounded-lg" />
                    <button onClick={() => addCustom('aroma')} className="p-2 bg-purple-500 text-white rounded-lg"><Plus size={14} /></button>
                </div>
            </div>

            {/* Catador y Fecha */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Catador</label>
                    <input value={notes.cupper_name} onChange={e => update('cupper_name', e.target.value)}
                        placeholder="Nombre..." className="w-full text-sm p-2 border border-stone-200 rounded-lg" />
                </div>
                <div>
                    <label className="text-xs font-bold text-stone-500 uppercase block mb-1">Fecha de Cata</label>
                    <input type="date" value={notes.cata_date} onChange={e => update('cata_date', e.target.value)}
                        className="w-full text-sm p-2 border border-stone-200 rounded-lg" />
                </div>
            </div>

            {/* Guardar */}
            <button
                onClick={() => { update('total_score', calcTotal(notes)); onSave({ ...notes, total_score: totalScore }); }}
                disabled={disabled}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                <Coffee size={18} /> Guardar Notas de Cata
            </button>
        </div>
    );
}
