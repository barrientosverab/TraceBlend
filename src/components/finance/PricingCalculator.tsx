import { useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Calculator, Settings, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const ingredientSchema = z.object({
    name: z.string().min(1, 'Requerido'),
    type: z.enum(['peso', 'volumen', 'unidad']),
    quantity: z.number().min(0.0001, 'Debe ser > 0'),
    costPrice: z.number().min(0, 'Costo inválido'),
    merma: z.number().min(0).max(99),
});

const recipeSchema = z.object({
    productName: z.string().min(1, 'Nombre requerido'),
    sellingPrice: z.number().min(0),
    ingredients: z.array(ingredientSchema),
    overhead: z.number().min(0),
    laborMinutes: z.number().min(0).optional(),
    laborRatePerMinute: z.number().min(0).optional(),
});

type RecipeForm = z.infer<typeof recipeSchema>;

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b', '#ef4444'];
const PROFIT_COLOR = '#10b981'; // Emerald
const OVERHEAD_COLOR = '#94a3b8'; // Slate

export function PricingCalculator() {
    const { register, control, watch, formState: { errors } } = useForm<RecipeForm>({
        resolver: zodResolver(recipeSchema),
        defaultValues: {
            productName: '',
            sellingPrice: 0,
            ingredients: [
                { name: '', type: 'peso', quantity: 0, costPrice: 0, merma: 0 }
            ],
            overhead: 0,
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'ingredients'
    });

    const formValues = watch();

    // Calcular costos en tiempo real
    const calculations = useMemo(() => {
        let totalDirectCost = 0;
        const ingredientCosts = formValues.ingredients.map(ing => {
            let baseCost = 0;
            if (ing.type === 'peso' || ing.type === 'volumen') {
                baseCost = (ing.quantity / 1000) * ing.costPrice;
            } else {
                baseCost = ing.quantity * ing.costPrice;
            }

            const realCost = baseCost / (1 - (ing.merma || 0) / 100);
            totalDirectCost += realCost;
            return { name: ing.name, cost: realCost };
        });

        const totalCost = totalDirectCost + (formValues.overhead || 0);
        const profit = Math.max(0, (formValues.sellingPrice || 0) - totalCost);
        const loss = Math.max(0, totalCost - (formValues.sellingPrice || 0));
        const profitMargin = (formValues.sellingPrice || 0) > 0
            ? ((formValues.sellingPrice || 0) - totalCost) / (formValues.sellingPrice || 0) * 100
            : 0;

        return {
            totalDirectCost,
            totalCost,
            profit,
            loss,
            profitMargin,
            ingredientCosts
        };
    }, [formValues]);

    // Datos para el gráfico
    const chartData = useMemo(() => {
        const data = [...calculations.ingredientCosts.filter(ic => ic.cost > 0)];
        if (formValues.overhead > 0) {
            data.push({ name: 'Costos Indirectos (Fijos)', cost: formValues.overhead });
        }
        if (calculations.profit > 0) {
            data.push({ name: 'Ganancia Neta', cost: calculations.profit });
        }
        return data;
    }, [calculations, formValues.overhead]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Columna Izquierda: El Constructor */}
            <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-stone-200">
                <div className="flex items-center gap-2 mb-6">
                    <Calculator className="text-emerald-600" size={24} />
                    <h2 className="text-lg font-bold text-stone-800">Constructor de Receta</h2>
                </div>

                <div className="space-y-6">
                    {/* Header del Producto */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-stone-500 uppercase">Nombre del Producto</label>
                            <input
                                {...register('productName')}
                                className={`w-full p-3 border rounded-xl mt-1 outline-none ${errors.productName ? 'border-red-400 focus:ring-red-500' : 'focus:ring-2 focus:ring-emerald-500 bg-stone-50 focus:bg-white transition-colors'}`}
                                placeholder="Ej: Cappuccino 8oz o Miel con Eucalipto"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-stone-500 uppercase">Precio de Venta (Bs)</label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('sellingPrice', { valueAsNumber: true })}
                                className={`w-full p-3 border rounded-xl mt-1 font-bold text-emerald-600 outline-none ${errors.sellingPrice ? 'border-red-400' : 'focus:ring-2 focus:ring-emerald-500 bg-stone-50 focus:bg-white transition-colors'}`}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <hr className="border-stone-100" />

                    {/* Lista de Ingredientes */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <h3 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Ingredientes / Insumos</h3>
                        </div>

                        <div className="space-y-3">
                            {fields.map((field, index) => {
                                const type = watch(`ingredients.${index}.type`);
                                return (
                                    <div key={field.id} className="bg-stone-50 border border-stone-200 rounded-xl p-3 relative group">
                                        <button
                                            type="button"
                                            onClick={() => remove(index)}
                                            className="absolute -right-2 -top-2 bg-white text-stone-300 hover:text-red-500 border border-stone-200 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                        >
                                            <Trash2 size={14} />
                                        </button>

                                        <div className="grid grid-cols-12 gap-3 items-end">
                                            <div className="col-span-4">
                                                <label className="text-[10px] font-bold text-stone-400 uppercase">Ingrediente</label>
                                                <input {...register(`ingredients.${index}.name`)} className="w-full mt-1 p-2 text-sm border rounded-lg bg-white outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Ej: Espresso" />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="text-[10px] font-bold text-stone-400 uppercase">Tipo</label>
                                                <select {...register(`ingredients.${index}.type`)} className="w-full mt-1 p-2 text-sm border rounded-lg bg-white outline-none focus:ring-1 focus:ring-emerald-500">
                                                    <option value="peso">Peso (g)</option>
                                                    <option value="volumen">Volumen (ml)</option>
                                                    <option value="unidad">Unidad (uds)</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-[10px] font-bold text-stone-400 uppercase">
                                                    CANT. ({type === 'peso' ? 'g' : type === 'volumen' ? 'ml' : 'uds'})
                                                </label>
                                                <input type="number" step="any" {...register(`ingredients.${index}.quantity`, { valueAsNumber: true })} className="w-full mt-1 p-2 text-sm border rounded-lg bg-white outline-none focus:ring-1 focus:ring-emerald-500" placeholder="0" />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="text-[10px] font-bold text-stone-400 uppercase">
                                                    COSTO Bs / {type === 'peso' ? 'Kg' : type === 'volumen' ? 'Litro' : 'Ud'}
                                                </label>
                                                <input type="number" step="any" {...register(`ingredients.${index}.costPrice`, { valueAsNumber: true })} className="w-full mt-1 p-2 text-sm border rounded-lg bg-white outline-none focus:ring-1 focus:ring-emerald-500" placeholder="0.00" />
                                            </div>
                                        </div>
                                        {/* Sección Avanzada (Merma) */}
                                        <div className="mt-2 text-right">
                                            <label className="text-[10px] font-bold text-stone-400 mr-2">Merma / Pérdida (%):</label>
                                            <input type="number" step="any" {...register(`ingredients.${index}.merma`, { valueAsNumber: true })} className="w-16 p-1 text-xs border rounded bg-white text-right" placeholder="0" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={() => append({ name: '', type: 'peso', quantity: 0, costPrice: 0, merma: 0 })}
                            className="mt-4 w-full py-3 border-2 border-dashed border-stone-200 text-stone-500 font-bold rounded-xl hover:bg-stone-50 hover:border-emerald-300 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            <Plus size={16} /> Añadir Ingrediente o Insumo
                        </button>
                    </div>

                    <hr className="border-stone-100" />

                    {/* Costos Indirectos */}
                    <div>
                        <div className="flex justify-between items-center bg-stone-50 p-3 rounded-xl border border-stone-200">
                            <div className="flex items-center gap-2">
                                <Settings size={16} className="text-stone-400" />
                                <div>
                                    <h3 className="text-sm font-bold text-stone-700">Costos Indirectos (Overhead)</h3>
                                    <p className="text-xs text-stone-500">Monto fijo a sumar por preparación (Luz, agua, desgaste)</p>
                                </div>
                            </div>
                            <div className="relative w-28">
                                <span className="absolute left-2 top-2 text-sm font-bold text-stone-400">Bs</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('overhead', { valueAsNumber: true })}
                                    className="w-full pl-7 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 text-right font-bold text-stone-700"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Columna Derecha: El Analizador Visual */}
            <div className="bg-stone-900 p-5 md:p-6 rounded-2xl shadow-xl border border-stone-800 text-white sticky top-4">
                <div className="flex items-center gap-2 mb-6">
                    <PieChartIcon className="text-emerald-400" size={24} />
                    <h2 className="text-lg font-bold">Análisis de Rentabilidad</h2>
                </div>

                {/* Cajas de Resumen */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-stone-800 p-4 rounded-xl border border-stone-700">
                        <p className="text-xs text-stone-400 font-bold uppercase">Costo Total Producto</p>
                        <p className="text-2xl font-mono font-bold mt-1">Bs {calculations.totalCost.toFixed(2)}</p>
                    </div>
                    <div className="bg-emerald-900/30 p-4 rounded-xl border border-emerald-800/50">
                        <p className="text-xs text-emerald-400 font-bold uppercase">Margen de Ganancia</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className={`text-2xl font-mono font-bold ${calculations.profitMargin < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {calculations.profitMargin.toFixed(1)}%
                            </p>
                            {calculations.profit > 0 && (
                                <span className="text-sm text-emerald-500 font-bold">Bs {calculations.profit.toFixed(2)} neta</span>
                            )}
                        </div>
                    </div>
                </div>

                {calculations.loss > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm flex items-start gap-2">
                        <div className="bg-red-500/20 p-1 rounded">⚠️</div>
                        <p><strong>Cuidado:</strong> Estás perdiendo <b>Bs {calculations.loss.toFixed(2)}</b> por cada unidad vendida. Ajusta el precio o reduce costos.</p>
                    </div>
                )}

                {/* Gráfico */}
                {chartData.length > 0 && (
                    <div className="h-64 mt-4 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={2}
                                    dataKey="cost"
                                >
                                    {chartData.map((entry, index) => {
                                        let color = COLORS[index % COLORS.length];
                                        if (entry.name === 'Ganancia Neta') color = PROFIT_COLOR;
                                        if (entry.name === 'Costos Indirectos (Fijos)') color = OVERHEAD_COLOR;
                                        return <Cell key={`cell-${index}`} fill={color} />;
                                    })}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => [`Bs ${Number(value).toFixed(2)}`, 'Monto']}
                                    contentStyle={{ backgroundColor: '#1c1917', border: '1px solid #44403c', borderRadius: '8px', color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Texto en el centro del Donut */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[10px] text-stone-400 font-bold uppercase">Utilidad Bruta</span>
                            <span className={`text-lg font-bold font-mono ${calculations.profitMargin > 20 ? 'text-emerald-400' : calculations.profitMargin >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                                Bs {calculations.profit.toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Detalles Lineales */}
                <div className="mt-6 bg-stone-800 rounded-xl p-4 border border-stone-700">
                    <h4 className="text-xs font-bold text-stone-400 uppercase mb-3">Desglose de Costos</h4>
                    <div className="space-y-2">
                        {calculations.ingredientCosts.map((ic, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-stone-300">{ic.name || `Ingrediente ${i + 1}`}</span>
                                <span className="font-mono text-stone-400 text-xs">Bs {ic.cost.toFixed(2)}</span>
                            </div>
                        ))}
                        {formValues.overhead > 0 && (
                            <div className="flex justify-between text-sm border-t border-stone-700 pt-2 mt-2">
                                <span className="text-stone-400">Costos Indirectos</span>
                                <span className="font-mono text-stone-400 text-xs">Bs {formValues.overhead.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm font-bold border-t border-stone-600 pt-2 mt-2">
                            <span className="text-white">Costo Total</span>
                            <span className="font-mono text-white text-xs">Bs {calculations.totalCost.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
