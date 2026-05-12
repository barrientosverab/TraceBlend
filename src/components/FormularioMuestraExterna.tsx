import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LabReportSchema, type LabReportFormData } from '../utils/validationSchemas';
import { Button } from './ui';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Building2, Save, MapPin, User, Coffee } from 'lucide-react';

interface FormularioMuestraExternaProps {
    onSubmit: (data: LabReportFormData) => Promise<void>;
    initialData?: Partial<LabReportFormData>;
    isLoading?: boolean;
}

export function FormularioMuestraExterna({
    onSubmit,
    initialData,
    isLoading = false
}: FormularioMuestraExternaProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid }
    } = useForm<LabReportFormData>({
        resolver: zodResolver(LabReportSchema),
        mode: 'onChange',
        defaultValues: {
            report_date: initialData?.report_date || new Date().toISOString().split('T')[0],
            analyst_name: initialData?.analyst_name || '',
            sample_type: 'external',
            report_type: initialData?.report_type || 'cupping',
            external_client_name: initialData?.external_client_name || '',
            external_sample_id: initialData?.external_sample_id || '',
            external_origin: initialData?.external_origin || '',
            external_variety: initialData?.external_variety || '',
            external_process: initialData?.external_process || '',
            external_notes: initialData?.external_notes || ''
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="text-blue-600" size={24} />
                        Muestra Externa
                    </CardTitle>
                    <p className="text-sm text-stone-500 mt-2">
                        Registro de muestras recibidas de clientes externos para análisis de laboratorio
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Client Information */}
                    <div>
                        <h4 className="font-bold text-sm text-stone-700 mb-3 flex items-center gap-2">
                            <User size={16} />
                            Información del Cliente
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Nombre del Cliente <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    {...register('external_client_name')}
                                    className={`w-full p-3 border-2 rounded-xl outline-none transition-colors ${errors.external_client_name
                                            ? 'border-red-300 focus:border-red-500'
                                            : 'border-stone-200 focus:border-blue-500'
                                        }`}
                                    placeholder="Ej: Café El Roble S.A."
                                />
                                {errors.external_client_name && (
                                    <p className="text-xs text-red-600 mt-1">{errors.external_client_name.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    ID de Muestra <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    {...register('external_sample_id')}
                                    className={`w-full p-3 border-2 rounded-xl outline-none transition-colors font-mono ${errors.external_sample_id
                                            ? 'border-red-300 focus:border-red-500'
                                            : 'border-stone-200 focus:border-blue-500'
                                        }`}
                                    placeholder="Ej: ER-2025-001"
                                />
                                {errors.external_sample_id && (
                                    <p className="text-xs text-red-600 mt-1">{errors.external_sample_id.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sample Details */}
                    <div>
                        <h4 className="font-bold text-sm text-stone-700 mb-3 flex items-center gap-2">
                            <Coffee size={16} />
                            Detalles de la Muestra
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Origen <MapPin size={14} className="inline" />
                                </label>
                                <input
                                    type="text"
                                    {...register('external_origin')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-blue-500"
                                    placeholder="Ej: Colombia - Huila"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Variedad
                                </label>
                                <input
                                    type="text"
                                    {...register('external_variety')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-blue-500"
                                    placeholder="Ej: Caturra, Geisha"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Proceso
                                </label>
                                <input
                                    type="text"
                                    {...register('external_process')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-blue-500"
                                    placeholder="Ej: Lavado, Natural, Honey"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Tipo de Análisis <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('report_type')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl bg-white outline-none transition-colors focus:border-blue-500 font-semibold"
                                >
                                    <option value="physical">Solo Físico</option>
                                    <option value="cupping">Solo Catación</option>
                                    <option value="complete">Completo (Físico + Catación)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Report Information */}
                    <div>
                        <h4 className="font-bold text-sm text-stone-700 mb-3">Información del Reporte</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Fecha de Recepción <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    {...register('report_date')}
                                    className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-stone-600 mb-2">
                                    Analista Asignado <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    {...register('analyst_name')}
                                    className={`w-full p-3 border-2 rounded-xl outline-none transition-colors ${errors.analyst_name
                                            ? 'border-red-300 focus:border-red-500'
                                            : 'border-stone-200 focus:border-blue-500'
                                        }`}
                                    placeholder="Nombre del analista"
                                />
                                {errors.analyst_name && (
                                    <p className="text-xs text-red-600 mt-1">{errors.analyst_name.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-semibold text-stone-600 mb-2">
                            Notas / Observaciones
                        </label>
                        <textarea
                            {...register('external_notes')}
                            className="w-full p-3 border-2 border-stone-200 rounded-xl outline-none transition-colors focus:border-blue-500 resize-none"
                            rows={3}
                            placeholder="Ej: Cliente solicita análisis para certificación de exportación..."
                        />
                    </div>

                    {/* Info box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800">
                            <strong>ℹ️ Nota:</strong> Esta muestra será registrada como externa. Después de crear el reporte,
                            podrás agregar los análisis físico y/o de catación según el tipo seleccionado.
                        </p>
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
                        Crear Reporte de Muestra Externa
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
