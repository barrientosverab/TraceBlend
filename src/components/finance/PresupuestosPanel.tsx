import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';
import { Save, AlertTriangle, CalendarDays } from 'lucide-react';
import { getMonthlyBudgets, setMonthlyBudget, MonthlyBudgetForm } from '../../services/gastosService';

const CATEGORIAS = [
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'nomina', label: 'Nómina (Planilla)' },
  { value: 'servicios', label: 'Servicios (Agua, Luz, Gas)' },
  { value: 'insumos_cafeteria', label: 'Insumos de Cafetería' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'marketing', label: 'Marketing y Ventas' },
  { value: 'impuestos', label: 'Impuestos' },
  { value: 'otros', label: 'Otros Gastos' }
];

const CENTROS_COSTO = [
  { value: 'produccion', label: 'Producción' },
  { value: 'ventas_marketing', label: 'Ventas & Marketing' },
  { value: 'administracion', label: 'Administración' },
  { value: 'otro', label: 'Otro' }
];

export function PresupuestosPanel() {
  const { orgId } = useAuth();
  const [monthYear, setMonthYear] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estado local para los inputs editables
  const [editableBudgets, setEditableBudgets] = useState<Record<string, MonthlyBudgetForm>>({});

  useEffect(() => {
    if (orgId && monthYear) {
      loadBudgets();
    }
  }, [orgId, monthYear]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await getMonthlyBudgets(orgId!, monthYear);
      setBudgets(data);
      
      // Inicializar el estado local con los datos traídos o en cero
      const initialEdits: Record<string, MonthlyBudgetForm> = {};
      CATEGORIAS.forEach(cat => {
        const existing = data.find((b: any) => b.category === cat.value);
        initialEdits[cat.value] = {
          category: cat.value,
          budget_amount: existing ? existing.budget_amount : '',
          cost_center: existing ? existing.cost_center : 'otro',
          month_year: monthYear
        };
      });
      setEditableBudgets(initialEdits);
    } catch (error) {
      toast.error('Error al cargar presupuestos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (category: string, field: keyof MonthlyBudgetForm, value: string) => {
    setEditableBudgets(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const handleSaveBudget = async (category: string) => {
    const budgetData = editableBudgets[category];
    if (!budgetData.budget_amount || Number(budgetData.budget_amount) < 0) {
      toast.warning('Por favor ingresa un monto válido');
      return;
    }
    
    try {
      await setMonthlyBudget(budgetData, orgId!);
      toast.success(`Presupuesto de ${CATEGORIAS.find(c => c.value === category)?.label} actualizado validamente`);
      loadBudgets(); // Recargar para reflejar DB
    } catch (error) {
      toast.error('Error al guardar presupuesto');
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header y Selector de Mes */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Planificación de Presupuestos</h2>
          <p className="text-sm text-stone-500 mt-1">Fija metas de gastos para controlar el flujo de caja del negocio.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-stone-50 p-2 rounded-xl border border-stone-200">
          <CalendarDays className="text-stone-400" size={20} />
          <input 
            type="month" 
            value={monthYear} 
            onChange={(e) => setMonthYear(e.target.value)}
            className="bg-transparent font-bold text-stone-700 outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="p-4 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Categorías de Gasto</h3>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
              Total Presupuestado: Bs {Object.values(editableBudgets).reduce((acc, curr) => acc + Number(curr.budget_amount || 0), 0).toLocaleString()}
            </span>
          </div>
          
          <div className="divide-y divide-stone-100">
            {CATEGORIAS.map(cat => {
              const currentData = editableBudgets[cat.value];
              if (!currentData) return null;
              
              const isSaved = budgets.some(b => b.category === cat.value && b.budget_amount === Number(currentData.budget_amount) && b.cost_center === currentData.cost_center);
              const isEmpty = !currentData.budget_amount || Number(currentData.budget_amount) === 0;

              return (
                <div key={cat.value} className="p-4 flex flex-col md:flex-row items-center gap-4 hover:bg-stone-50 transition-colors">
                  
                  {/* Categoría info */}
                  <div className="w-full md:w-1/3">
                    <p className="font-bold text-stone-800">{cat.label}</p>
                    {isEmpty && <p className="text-[10px] text-stone-400 font-bold uppercase mt-1 flex items-center gap-1"><AlertTriangle size={10} className="text-amber-500"/> Sin presupuesto asignado</p>}
                  </div>

                  {/* Inputs */}
                  <div className="w-full md:w-2/3 flex items-center gap-3">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-3 text-stone-400 font-bold text-xs">Bs</span>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        className="w-full pl-8 p-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-emerald-500 font-mono font-bold text-stone-700"
                        value={currentData.budget_amount}
                        onChange={(e) => handleUpdateField(cat.value, 'budget_amount', e.target.value)}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <select 
                        className="w-full p-2 border border-stone-200 rounded-lg text-sm outline-none bg-white text-stone-600"
                        value={currentData.cost_center}
                        onChange={(e) => handleUpdateField(cat.value, 'cost_center', e.target.value)}
                      >
                        {CENTROS_COSTO.map(cc => <option key={cc.value} value={cc.value}>{cc.label}</option>)}
                      </select>
                    </div>

                    <button 
                      onClick={() => handleSaveBudget(cat.value)}
                      disabled={isSaved && !isEmpty}
                      className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${isSaved && !isEmpty ? 'bg-stone-100 text-stone-400' : 'bg-stone-900 text-white hover:bg-black active:scale-95 shadow-sm'}`}
                      title="Guardar presupuesto"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
