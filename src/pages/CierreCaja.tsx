import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { registrarCierre, obtenerResumenCaja } from '../services/cajaService';
import { toast } from 'sonner';
import { Calculator, Save, Lock, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';


export function CierreCaja() {
  const { orgId, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [opening, setOpening] = useState<number>(0);
  
  // Estado del Sistema (Lo que dice la BD)
  const [sistema, setSistema] = useState({
    efectivo: 0,
    qr: 0,
    tarjeta: 0
  });

  // Estado del Cajero (Lo que cuenta manualmente)
  const [declarado, setDeclarado] = useState({
    efectivo: '', // Usamos string para permitir vacíos al escribir
    qr: '',
    tarjeta: '',
    gastos: '',
    notas: ''
  });

  useEffect(() => {
    if (orgId && user) cargarDatos();
  }, [orgId, user]);

  const cargarDatos = async () => {
    try {
      const datosDB = await obtenerResumenCaja(orgId!, user!.id);
      
      if (datosDB && datosDB.session_id) {
        setSessionId(datosDB.session_id);
        setOpening(datosDB.opening || 0);
        setSistema({
          efectivo: datosDB.system_cash || 0,
          qr: datosDB.system_qr || 0,
          tarjeta: datosDB.system_card || 0
        });
      } else {
        toast.info("No hay una caja abierta actualmente");
      }
    } catch (e) {
      toast.error("Error cargando datos de caja");
    }
  };

  const handleCierre = async () => {
    if (!sessionId) return toast.error("No hay una sesión de caja activa");
    if (!declarado.efectivo) return toast.warning("Debes contar el efectivo");
    
    setLoading(true);
    try {
        await registrarCierre({
          session_id: sessionId,
          closing_cash: Number(declarado.efectivo) || 0,
          closing_qr: Number(declarado.qr) || 0,
          closing_card: Number(declarado.tarjeta) || 0,
          note: declarado.notas || undefined,
        });

        toast.success("Caja cerrada correctamente");
        // Reiniciar o redirigir
        setDeclarado({ efectivo: '', qr: '', tarjeta: '', gastos: '', notas: '' });
        setSessionId(null);
        setOpening(0);
        setSistema({ efectivo: 0, qr: 0, tarjeta: 0 });
        cargarDatos();
    } catch (error: any) {
        toast.error("Error al cerrar caja");
    } finally {
        setLoading(false);
    }
  };

  // Cálculos en tiempo real
  const efectivoReal = Number(declarado.efectivo) || 0;
  const gastosCaja = Number(declarado.gastos) || 0;
  
  // Diferencia: (Lo que tengo + Lo que gasté) - (Lo que debería tener + apertura)
  const diferencia = (efectivoReal + gastosCaja) - (opening + sistema.efectivo);
  const cuadraPerfecto = Math.abs(diferencia) < 0.5; // Margen pequeño por redondeos

  return (
    <div className="p-6 bg-stone-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-2">
          <Lock className="text-emerald-600"/> Cierre de Caja
        </h1>
        <p className="text-stone-500">Verifica y cuadra los ingresos del turno.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        
        {/* COLUMNA 1: LO QUE DICE EL SISTEMA (SOLO LECTURA) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-200">
            <h2 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Calculator size={16}/> Reporte del Sistema
            </h2>

            <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                    <span className="text-stone-500 text-sm">Fondo inicial</span>
                    <span className="font-mono font-bold text-stone-600">Bs {opening.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100">
                    <span className="text-stone-600 font-medium">Ventas Efectivo</span>
                    <span className="text-2xl font-mono font-bold text-stone-800">Bs {sistema.efectivo.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center px-4">
                    <span className="text-stone-500 text-sm">Ventas QR</span>
                    <span className="font-mono font-bold text-stone-600">Bs {sistema.qr.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center px-4">
                    <span className="text-stone-500 text-sm">Ventas Tarjeta</span>
                    <span className="font-mono font-bold text-stone-600">Bs {sistema.tarjeta.toFixed(2)}</span>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-stone-100">
                <div className="flex justify-between items-center">
                    <span className="text-stone-800 font-bold">Total Esperado</span>
                    <span className="text-3xl font-bold text-emerald-600">Bs {(opening + sistema.efectivo + sistema.qr + sistema.tarjeta).toFixed(2)}</span>
                </div>
            </div>
        </div>

        {/* COLUMNA 2: LO QUE CUENTA EL CAJERO (INPUTS) */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-emerald-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
            
            <h2 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-6 flex items-center gap-2">
                <Save size={16}/> Declaración Real
            </h2>

            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-stone-500 uppercase ml-1">Efectivo en Caja</label>
                    <input 
                        type="number" 
                        autoFocus
                        placeholder="0.00"
                        className="w-full p-4 text-right text-2xl font-mono font-bold border-2 border-stone-200 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all"
                        value={declarado.efectivo}
                        onChange={e => setDeclarado({...declarado, efectivo: e.target.value})}
                    />
                    <p className="text-[10px] text-stone-400 mt-1 text-right">Cuenta los billetes y monedas físicos.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-bold text-stone-400 uppercase">Salidas / Gastos</label>
                        <div className="relative">
                            <TrendingDown size={14} className="absolute left-3 top-3.5 text-red-400"/>
                            <input 
                                type="number" 
                                placeholder="0"
                                className="w-full pl-8 p-3 text-sm font-bold border border-stone-200 rounded-xl focus:border-red-400 outline-none text-red-600"
                                value={declarado.gastos}
                                onChange={e => setDeclarado({...declarado, gastos: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-stone-400 uppercase">Validar QR/Tarjeta</label>
                        <input 
                            type="number" 
                            placeholder="Opcional"
                            className="w-full p-3 text-sm border border-stone-200 rounded-xl focus:border-emerald-500 outline-none"
                            value={declarado.qr}
                            onChange={e => setDeclarado({...declarado, qr: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-stone-400 uppercase">Notas del Turno</label>
                    <textarea 
                        rows={2}
                        className="w-full p-3 text-sm border border-stone-200 rounded-xl focus:border-stone-400 outline-none resize-none"
                        placeholder="Ej: Faltaron 2bs por cambio..."
                        value={declarado.notas}
                        onChange={e => setDeclarado({...declarado, notas: e.target.value})}
                    />
                </div>
            </div>

            {/* FEEDBACK VISUAL DE DIFERENCIA */}
            <div className={`mt-6 p-4 rounded-xl flex justify-between items-center ${cuadraPerfecto ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                <div className="flex items-center gap-2">
                    {cuadraPerfecto ? <CheckCircle2 size={24}/> : <AlertTriangle size={24}/>}
                    <span className="font-bold text-sm">
                        {cuadraPerfecto ? "Caja Cuadrada" : "Diferencia detectada"}
                    </span>
                </div>
                <span className="text-xl font-bold font-mono">
                    {diferencia > 0 ? '+' : ''}{diferencia.toFixed(2)} Bs
                </span>
            </div>

            <button 
                onClick={handleCierre}
                disabled={loading}
                className="w-full mt-6 bg-stone-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl shadow-stone-200 flex justify-center items-center gap-2 disabled:opacity-50"
            >
                {loading ? 'Cerrando...' : 'Confirmar Cierre'}
            </button>
        </div>

      </div>
    </div>
  );
}
