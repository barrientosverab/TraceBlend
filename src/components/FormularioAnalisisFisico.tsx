import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PhysicalAnalysisSchema, type PhysicalAnalysisFormData } from '../utils/validationSchemas';
import { Button } from './ui';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Save, AlertCircle, CheckCircle2, Droplet, Scale, Grid, Bug } from 'lucide-react';

interface FormularioAnalisisFisicoProps {
    onSubmit: (data: PhysicalAnalysisFormData) => Promise<void>;
    initialData?: Partial<PhysicalAnalysisFormData>;
    isLoading?: boolean;
}

export function FormularioAnalisisFisico({
    onSubmit,
    initialData,
    isLoading = false
}: FormularioAnalisisFisicoProps) {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isValid }
    } = useForm<PhysicalAnalysisFormData>({
        resolver: zodResolver(PhysicalAnalysisSchema) as any,
        mode: 'onChange',
        defaultValues: {
            sample_weight_grams: initialData?.sample_weight_grams || '',
            green_weight_grams: initialData?.green_weight_grams || '',
            humidity_percentage: initialData?.humidity_percentage || '',
            density_value: initialData?.density_value || '',
            mesh_18: initialData?.mesh_18 || '0',
            mesh_16: initialData?.mesh_16 || '0',
            mesh_14: initialData?.mesh_14 || '0',
            base_mesh: initialData?.base_mesh || '0',
            category_1_defects: initialData?.category_1_defects || '0',
            category_2_defects: initialData?.category_2_defects || 0,
            defects_notes: initialData?.defects_notes || '',
            color_notes: initialData?.color_notes || '',
            aroma_notes: initialData?.aroma_notes || ''
        } as any
    });

    // Watch mesh values for auto-calculation
    const mesh18 = watch('mesh_18');
    const mesh16 = watch('mesh_16');
    const mesh14 = watch('mesh_14');
    const baseMesh = watch('base_mesh');
    const humidity = watch('humidity_percentage');

    // Calculate total mesh percentage
    const totalMesh = (Number(mesh18) || 0) + (Number(mesh16) || 0) + (Number(mesh14) || 0) + (Number(baseMesh) || 0);

    // Get humidity status
    const getHumidityStatus = (value: number) => {
        if (value < 10.5) return { text: 'Baja', color: 'text-amber-600', bg: 'bg-amber-50' };
        if (value > 12) return { text: 'Alta', color: 'text-red-600', bg: 'bg-red-50' };
        return { text: 'Ideal', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    };

    const humidityValue = Number(humidity) || 0;
    const humidityStatus = humidityValue > 0 ? getHumidityStatus(humidityValue) : null;

    return (
        <form onSubmit={handleSubmit(onSubmit as any)}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scale className="text-emerald-600" size={24} />
                        Análisis Físico
                    </CardTitle>
                    <p className="text-sm text-stone-500 mt-2">
                        Registro de características físicas de la muestra de café
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Pesos */}
                    <div>
                        <h4 className="font-bold text-sm text-stone-700 mb-3 flex items-center gap-2">
                            <Scale size={16} />
                            Pesos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Peso Muestra (g) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('sample_weight_grams')}
                                    className={`w-full p-3 border-2 rounded-xl outline-none transition-colors font-mono text-lg ${errors.sample_weight_grams
                                            ? 'border-red-300 focus:border-red-500'
                                            : 'border-stone-200 focus:border-emerald-500'
                                        }`}
                                    placeholder="350.00"
                                />
                                {errors.sample_weight_grams && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {errors.sample_weight_grams.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Peso Oro Verde (g)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('green_weight_grams')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-emerald-500 font-mono text-lg"
                                    placeholder="315.50"
                                />
                                {errors.green_weight_grams && (
                                    <p className="text-xs text-red-600 mt-1">{errors.green_weight_grams.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Humedad y Densidad */}
                    <div>
                        <h4 className="font-bold text-sm text-stone-700 mb-3 flex items-center gap-2">
                            <Droplet size={16} />
                            Humedad y Densidad
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Humedad (%) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('humidity_percentage')}
                                    className={`w-full p-3 border-2 rounded-xl outline-none transition-colors font-mono text-lg ${errors.humidity_percentage
                                            ? 'border-red-300 focus:border-red-500'
                                            : 'border-stone-200 focus:border-emerald-500'
                                        }`}
                                    placeholder="11.5"
                                />
                                {humidityStatus && (
                                    <div className={`mt-2 px-3 py-2 rounded-lg ${humidityStatus.bg} flex items-center gap-2`}>
                                        <CheckCircle2 size={14} className={humidityStatus.color} />
                                        <span className={`text-xs font-bold ${humidityStatus.color}`}>
                                            {humidityStatus.text} (Ideal: 10.5-12%)
                                        </span>
                                    </div>
                                )}
                                {errors.humidity_percentage && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        {errors.humidity_percentage.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Densidad
                                </label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    {...register('density_value')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-emerald-500 font-mono text-lg"
                                    placeholder="0.7245"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Granulometría */}
                    <div>
                        <h4 className="font-bold text-sm text-stone-700 mb-3 flex items-center gap-2">
                            <Grid size={16} />
                            Granulometría (%)
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Malla 18
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('mesh_18')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-emerald-500 font-mono"
                                    placeholder="45.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Malla 16
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('mesh_16')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-emerald-500 font-mono"
                                    placeholder="30.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Malla 14
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('mesh_14')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-emerald-500 font-mono"
                                    placeholder="20.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Base
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('base_mesh')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-emerald-500 font-mono"
                                    placeholder="5.00"
                                />
                            </div>
                        </div>
                        {/* Total mesh indicator */}
                        <div className={`mt-3 p-3 rounded-lg ${Math.abs(totalMesh - 100) < 0.5 ? 'bg-emerald-50' : 'bg-amber-50'
                            }`}>
                            <p className={`text-sm font-bold ${Math.abs(totalMesh - 100) < 0.5 ? 'text-emerald-700' : 'text-amber-700'
                                }`}>
                                Total: {totalMesh.toFixed(2)}%
                                {Math.abs(totalMesh - 100) < 0.5 ? ' ✓' : ` (debe sumar 100%)`}
                            </p>
                        </div>
                        {errors.mesh_18 && (
                            <p className="text-xs text-red-600 mt-2">{errors.mesh_18.message}</p>
                        )}
                    </div>

                    {/* Defectos */}
                    <div>
                        <h4 className="font-bold text-sm text-stone-700 mb-3 flex items-center gap-2">
                            <Bug size={16} />
                            Análisis de Defectos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Defectos Categoría 1
                                </label>
                                <input
                                    type="number"
                                    {...register('category_1_defects')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-emerald-500 font-mono"
                                    placeholder="0"
                                    min="0"
                                />
                                <p className="text-xs text-stone-400 mt-1">Granos negros, agrios, etc.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Defectos Categoría 2
                                </label>
                                <input
                                    type="number"
                                    {...register('category_2_defects')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-emerald-500 font-mono"
                                    placeholder="0"
                                    min="0"
                                />
                                <p className="text-xs text-stone-400 mt-1">Granos partidos, inmaturos, etc.</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-semibold text-stone-600 mb-2">
                                Notas sobre Defectos
                            </label>
                            <textarea
                                {...register('defects_notes')}
                                className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-emerald-500 resize-none"
                                rows={2}
                                placeholder="Descripción detallada de los defectos encontrados..."
                            />
                        </div>
                    </div>

                    {/* Notas Adicionales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-stone-600 mb-2">
                                Notas de Color
                            </label>
                            <textarea
                                {...register('color_notes')}
                                className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-emerald-500 resize-none"
                                rows={2}
                                placeholder="Ej: Verde azulado uniforme"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-stone-600 mb-2">
                                Notas de Aroma
                            </label>
                            <textarea
                                {...register('aroma_notes')}
                                className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-emerald-500 resize-none"
                                rows={2}
                                placeholder="Ej: Herbáceo, dulce"
                            />
                        </div>
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
                        Guardar Análisis Físico
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
