import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CuppingAnalysisSchema, type CuppingAnalysisFormData } from '../utils/validationSchemas';
import { Button } from './ui';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Save, Coffee, Award, X } from 'lucide-react';

interface FormularioCatacionSCAProps {
    onSubmit: (data: CuppingAnalysisFormData) => Promise<void>;
    initialData?: Partial<CuppingAnalysisFormData>;
    isLoading?: boolean;
}

const SCA_ATTRIBUTES = [
    { key: 'fragrance_aroma', label: 'Fragancia/Aroma', min: 6, max: 10, step: 0.25 },
    { key: 'flavor', label: 'Sabor', min: 6, max: 10, step: 0.25 },
    { key: 'aftertaste', label: 'Residual', min: 6, max: 10, step: 0.25 },
    { key: 'acidity', label: 'Acidez', min: 6, max: 10, step: 0.25 },
    { key: 'body', label: 'Cuerpo', min: 6, max: 10, step: 0.25 },
    { key: 'balance', label: 'Balance', min: 6, max: 10, step: 0.25 },
    { key: 'overall', label: 'General', min: 6, max: 10, step: 0.25 },
] as const;

const PRESENCE_ATTRIBUTES = [
    { key: 'uniformity', label: 'Uniformidad', max: 10 },
    { key: 'clean_cup', label: 'Taza Limpia', max: 10 },
    { key: 'sweetness', label: 'Dulzor', max: 10 },
] as const;

export function FormularioCatacionSCA({
    onSubmit,
    initialData,
    isLoading = false
}: FormularioCatacionSCAProps) {
    const [flavorInput, setFlavorInput] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { isValid }
    } = useForm<CuppingAnalysisFormData>({
        resolver: zodResolver(CuppingAnalysisSchema) as any,
        mode: 'onChange',
        defaultValues: {
            coffee_grams: initialData?.coffee_grams ?? 8.25,
            water_ml: initialData?.water_ml ?? 150,
            water_temp_celsius: initialData?.water_temp_celsius ?? 92,
            cups_evaluated: initialData?.cups_evaluated ?? 5,
            fragrance_aroma: initialData?.fragrance_aroma ?? 7,
            flavor: initialData?.flavor ?? 7,
            aftertaste: initialData?.aftertaste ?? 7,
            acidity: initialData?.acidity ?? 7,
            body: initialData?.body ?? 7,
            balance: initialData?.balance ?? 7,
            overall: initialData?.overall ?? 7,
            uniformity: initialData?.uniformity ?? 10,
            clean_cup: initialData?.clean_cup ?? 10,
            sweetness: initialData?.sweetness ?? 10,
            flavor_descriptors: initialData?.flavor_descriptors || [],
            cupper_notes: initialData?.cupper_notes || ''
        }
    });

    // Watch all scoring values
    const fragranceAroma = Number(watch('fragrance_aroma')) || 0;
    const flavor = Number(watch('flavor')) || 0;
    const aftertaste = Number(watch('aftertaste')) || 0;
    const acidity = Number(watch('acidity')) || 0;
    const body = Number(watch('body')) || 0;
    const balance = Number(watch('balance')) || 0;
    const overall = Number(watch('overall')) || 0;
    const uniformity = Number(watch('uniformity')) || 0;
    const cleanCup = Number(watch('clean_cup')) || 0;
    const sweetness = Number(watch('sweetness')) || 0;
    const flavorDescriptors = watch('flavor_descriptors') || [];

    // Calculate total score
    const totalScore = fragranceAroma + flavor + aftertaste + acidity + body + balance + overall + uniformity + cleanCup + sweetness;

    // Get score color
    const getScoreColor = (score: number) => {
        if (score < 7) return 'text-red-500';
        if (score < 7.5) return 'text-amber-500';
        if (score < 8.5) return 'text-emerald-500';
        return 'text-emerald-600';
    };

    // Get quality classification
    const getQualityClass = (score: number) => {
        if (score >= 90) return { text: 'Outstanding', color: 'text-purple-600', bg: 'bg-purple-50' };
        if (score >= 85) return { text: 'Excellent', color: 'text-blue-600', bg: 'bg-blue-50' };
        if (score >= 80) return { text: 'Very Good (Specialty) ⭐', color: 'text-emerald-600', bg: 'bg-emerald-50' };
        if (score >= 70) return { text: 'Good', color: 'text-amber-600', bg: 'bg-amber-50' };
        return { text: 'Commercial', color: 'text-stone-600', bg: 'bg-stone-50' };
    };

    const qualityClass = getQualityClass(totalScore);

    // Add flavor descriptor
    const addFlavor = () => {
        if (flavorInput.trim()) {
            const currentDescriptors = watch('flavor_descriptors') || [];
            setValue('flavor_descriptors', [...currentDescriptors, flavorInput.trim()], { shouldValidate: true });
            setFlavorInput('');
        }
    };

    // Remove flavor descriptor
    const removeFlavor = (index: number) => {
        const currentDescriptors = watch('flavor_descriptors') || [];
        setValue('flavor_descriptors', currentDescriptors.filter((_, i) => i !== index), { shouldValidate: true });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit as any)}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Coffee className="text-amber-600" size={24} />
                        Catación SCA
                    </CardTitle>
                    <p className="text-sm text-stone-500 mt-2">
                        Análisis sensorial según protocolo SCA (Specialty Coffee Association)
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Live Score Display */}
                    <div className={`p-6 rounded-2xl border-2 ${qualityClass.bg} border-${qualityClass.color.split('-')[1]}-200`}>
                        <div className="text-center">
                            <p className="text-sm font-bold text-stone-500 uppercase tracking-wider mb-2">Puntuación Total</p>
                            <h2 className={`text-5xl font-black font-mono mb-2 ${qualityClass.color}`}>
                                {totalScore.toFixed(2)}
                            </h2>
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${qualityClass.bg} border ${qualityClass.color}`}>
                                <Award size={18} />
                                <span className="font-bold">{qualityClass.text}</span>
                            </div>
                        </div>
                    </div>

                    {/* Preparation Parameters */}
                    <div>
                        <h4 className="font-bold text-sm text-stone-700 mb-3">Parámetros de Preparación</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-stone-600 mb-2">Café (g)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('coffee_grams')}
                                    className="w-full p-2 border-2 border-stone-200 rounded-lg outline-none focus:border-emerald-500 font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-600 mb-2">Agua (ml)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('water_ml')}
                                    className="w-full p-2 border-2 border-stone-200 rounded-lg outline-none focus:border-emerald-500 font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-600 mb-2">Temp (°C)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    {...register('water_temp_celsius')}
                                    className="w-full p-2 border-2 border-stone-200 rounded-lg outline-none focus:border-emerald-500 font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-stone-600 mb-2">Tazas</label>
                                <input
                                    type="number"
                                    {...register('cups_evaluated')}
                                    className="w-full p-2 border-2 border-stone-200 rounded-lg outline-none focus:border-emerald-500 font-mono text-sm"
                                    min="1"
                                    max="10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Scorable Attributes (6-10) */}
                    <div>
                        <h4 className="font-bold text-sm text-stone-700 mb-3">Atributos Puntuables (6.0 - 10.0)</h4>
                        <div className="space-y-4">
                            {SCA_ATTRIBUTES.map((attr) => {
                                const value = Number(watch(attr.key)) || 6;
                                return (
                                    <div key={attr.key}>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-semibold text-stone-700">{attr.label}</label>
                                            <span className={`text-xl font-black font-mono ${getScoreColor(value)}`}>
                                                {value.toFixed(2)}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min={attr.min}
                                            max={attr.max}
                                            step={attr.step}
                                            {...register(attr.key)}
                                            className="w-full h-3 bg-gradient-to-r from-red-200 via-amber-200 via-emerald-200 to-emerald-400 rounded-lg appearance-none cursor-pointer slider"
                                            style={{
                                                background: `linear-gradient(to right, 
                          #fca5a5 0%, 
                          #fcd34d ${((value - 6) / 4) * 50}%, 
                          #86efac ${((value - 6) / 4) * 75}%, 
                          #34d399 100%
                        )`
                                            }}
                                        />
                                        <div className="flex justify-between text-xs text-stone-400 mt-1">
                                            <span>6.0</span>
                                            <span>10.0</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Presence Attributes (0-10, multiples of 2) */}
                    <div>
                        <h4 className="font-bold text-sm text-stone-700 mb-3">Atributos de Presencia (2 pts por taza perfecta)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {PRESENCE_ATTRIBUTES.map((attr) => {
                                const value = Number(watch(attr.key)) || 0;
                                const cups = value / 2;
                                return (
                                    <div key={attr.key} className="bg-stone-50 p-4 rounded-xl">
                                        <label className="block text-sm font-semibold text-stone-700 mb-3">{attr.label}</label>
                                        <div className="flex gap-1 mb-2">
                                            {[0, 2, 4, 6, 8, 10].map((val) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setValue(attr.key, val, { shouldValidate: true })}
                                                    className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${value === val
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-white text-stone-600 hover:bg-stone-100'
                                                        }`}
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-stone-500 text-center">
                                            {cups} / 5 tazas perfectas
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Flavor Descriptors */}
                    <div>
                        <h4 className="font-bold text-sm text-stone-700 mb-3">Descriptores de Sabor</h4>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={flavorInput}
                                onChange={(e) => setFlavorInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFlavor())}
                                className="flex-1 p-3 border-2 border-stone-200 rounded-xl outline-none focus:border-emerald-500"
                                placeholder="Ej: Chocolate, Caramelo, Frutas Rojas..."
                            />
                            <button
                                type="button"
                                onClick={addFlavor}
                                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-bold"
                            >
                                Agregar
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {flavorDescriptors.map((descriptor, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold"
                                >
                                    {descriptor}
                                    <button
                                        type="button"
                                        onClick={() => removeFlavor(index)}
                                        className="hover:text-red-600 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        {flavorDescriptors.length === 0 && (
                            <p className="text-xs text-stone-400 mt-2">No hay descriptores agregados</p>
                        )}
                    </div>

                    {/* Cupper Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Notas del Catador
                        </label>
                        <textarea
                            {...register('cupper_notes')}
                            className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none focus:border-emerald-500 resize-none"
                            rows={4}
                            placeholder="Observaciones generales sobre la catación..."
                        />
                    </div>
                </CardContent>

                <CardFooter>
                    <Button
                        type="submit"
                        isLoading={isLoading}
                        icon={Save}
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={!isValid || isLoading}
                    >
                        Guardar Catación SCA
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
