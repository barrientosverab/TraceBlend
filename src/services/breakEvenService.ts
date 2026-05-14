import { supabase } from './supabaseClient';

export interface BreakEvenConfig {
  margenContribucionPct: number; // Ej. 60
  diasAperturaMes: number; // Ej. 22
}

export interface BreakEvenMetrics {
  gastosFijosMes: number;
  puntoEquilibrioMes: number;
  metaVentasDia: number;
  ticketPromedio: number;
  tazasNecesariasDia: number;
}

const DEFAULT_CONFIG: BreakEvenConfig = {
  margenContribucionPct: 60,
  diasAperturaMes: 22
};

export const getBreakEvenConfig = (orgId: string): BreakEvenConfig => {
  const saved = localStorage.getItem(`traceblend_be_config_${orgId}`);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parseando config de PE', e);
    }
  }
  return DEFAULT_CONFIG;
};

export const saveBreakEvenConfig = (orgId: string, config: BreakEvenConfig) => {
  localStorage.setItem(`traceblend_be_config_${orgId}`, JSON.stringify(config));
};

export const calculateBreakEven = async (orgId: string): Promise<BreakEvenMetrics> => {
  const config = getBreakEvenConfig(orgId);
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  // 1. Gastos Fijos: expenses cuya categoría tiene type='fixed'
  const { data: fijos } = await supabase
    .from('expenses')
    .select('amount, expense_categories!inner(type)')
    .eq('organization_id', orgId)
    .eq('expense_categories.type', 'fixed')
    .gte('payment_date', inicioMes);
  
  const gastosFijosMes = fijos?.reduce((sum: number, f: any) => sum + f.amount, 0) || 1200; // Valor fallback si no hay datos

  // 2. Obtener Ticket Promedio (Promedio de todas las ventas del mes)
  const { data: ventas } = await supabase
    .from('sales')
    .select('total')
    .eq('organization_id', orgId)
    .eq('status', 'completed')
    .gte('created_at', inicioMes);

  let ticketPromedio = 15; // Valor fallback
  if (ventas && ventas.length > 0) {
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0);
    ticketPromedio = totalVentas / ventas.length;
  }

  // 3. Matemáticas del Punto de Equilibrio
  const margenDecimal = config.margenContribucionPct / 100;
  
  // Para compensar los costos fijos, debemos vender (Gastos Fijos / Margen de Contribución)
  // Ej: 1200 fijos / 0.60 margen = 2000 en ventas necesarias al mes.
  const puntoEquilibrioMes = margenDecimal > 0 ? gastosFijosMes / margenDecimal : 0;
  
  // Meta diaria
  const metaVentasDia = config.diasAperturaMes > 0 ? puntoEquilibrioMes / config.diasAperturaMes : 0;

  // Tazas/Ventas necesarias
  const tazasNecesariasDia = ticketPromedio > 0 ? metaVentasDia / ticketPromedio : 0;

  return {
    gastosFijosMes,
    puntoEquilibrioMes,
    metaVentasDia,
    ticketPromedio,
    tazasNecesariasDia: Math.ceil(tazasNecesariasDia) // Redondeamos hacia arriba porque no se vende media taza
  };
};
