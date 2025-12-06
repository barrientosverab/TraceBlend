import React, { useState, useEffect } from 'react';
import { 
  Calculator, DollarSign, QrCode, CreditCard, Save, AlertTriangle, CheckCircle, ArrowUpRight, Lock, Unlock 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { obtenerResumenCaja, registrarCierre, registrarApertura } from '../services/cajaService';

export function CierreCaja() {
  const { orgId, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [estadoCaja, setEstadoCaja] = useState('checking'); // checking | closed | open
  
  // Datos del Sistema (Cuando está abierta)
  const [sistema, setSistema] = useState({ 
    base_efectivo: 0, efectivo: 0, qr: 0, tarjeta: 0, inicio: null 
  });
  
  // Formulario Cierre
  const [conteo, setConteo] = useState({ efectivo: '', retiros: '', qr: '', tarjeta: '', notas: '' });
  
  // Formulario Apertura
  const [montoBase, setMontoBase] = useState('');

  useEffect(() => {
    if (orgId && user) verificarEstado();
  }, [orgId, user]);

  const verificarEstado = async () => {
    try {
      setLoading(true);
      const data = await obtenerResumenCaja(orgId, user.id);
      
      if (data.status === 'closed') {
        setEstadoCaja('closed');
      } else {
        setEstadoCaja('open');
        setSistema(data);
        // Pre-llenar digitales
        setConteo(prev => ({ ...prev, qr: data.qr, tarjeta: data.tarjeta, efectivo: '', retiros: '' }));
      }
    } catch (e) {
      console.error(e);
      toast.error("Error consultando caja");
    } finally {
      setLoading(false);
    }
  };

  // --- ACCIÓN: ABRIR CAJA ---
  const handleAbrirCaja = async (e) => {
    e.preventDefault();
    const base = parseFloat(montoBase);
    if (isNaN(base)) return toast.warning("Ingresa un monto válido");

    try {
      await registrarApertura(base, orgId, user.id);
      toast.success("Turno iniciado", { description: `Base inicial: Bs ${base.toFixed(2)}` });
      verificarEstado(); // Recargar para mostrar pantalla de cierre
    } catch (e) { toast.error(e.message); }
  };

  // --- ACCIÓN: CERRAR CAJA ---
  const calcularDiferencia = () => {
    const efectivoFisico = parseFloat(conteo.efectivo) || 0;
    const retiros = parseFloat(conteo.retiros) || 0;
    
    // Lo que tengo = Billetes + Vales de retiro
    const totalTengo = efectivoFisico + retiros;
    
    // Lo que debería tener = Base Inicial + Ventas Efectivo
    const totalEspero = sistema.base_efectivo + sistema.efectivo;
    
    return totalTengo - totalEspero;
  };

  const handleCerrarCaja = async () => {
    const dif = calcularDiferencia();
    const confirmar = Math.abs(dif) > 10 
      ? window.confirm(`⚠️ Diferencia de Bs ${dif.toFixed(2)}. ¿Cerrar turno igualmente?`)
      : true;

    if (!confirmar) return;

    try {
      // OJO: Enviamos el "system_cash" como (Ventas + Base) para que cuadre el arqueo en BD
      // O podemos enviar solo ventas y dejar que la diferencia matemática hable. 
      // Para consistencia con el reporte anterior:
      const totalSystemCash = sistema.base_efectivo + sistema.efectivo;

      await registrarCierre({
        system_cash: totalSystemCash, // Esperamos Ventas + Base
        system_qr: sistema.qr,
        system_card: sistema.tarjeta,
        declared_cash: parseFloat(conteo.efectivo) || 0,
        declared_qr: parseFloat(conteo.qr) || 0,
        declared_card: parseFloat(conteo.tarjeta) || 0,
        cash_withdrawals: parseFloat(conteo.retiros) || 0,
        notes: conteo.notas
      }, orgId, user.id);

      toast.success("Turno cerrado exitosamente");
      setEstadoCaja('closed'); // Volver a pantalla de apertura
      setMontoBase('');
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-stone-400 animate-pulse">Sincronizando caja...</div>;

  // --- VISTA 1: APERTURA DE CAJA ---
  if (estadoCaja === 'closed') {
    return (
      <div className="max-w-md mx-auto mt-10">
        <div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-emerald-500 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <Unlock size={32}/>
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Apertura de Turno</h1>
          <p className="text-stone-500 mb-6 text-sm">Ingresa el monto de efectivo inicial (cambio) para comenzar a vender.</p>
          
          <form onSubmit={handleAbrirCaja}>
            <div className="relative mb-6">
              <span className="absolute left-4 top-3 text-stone-400 font-bold">Bs</span>
              <input 
                type="number" 
                autoFocus
                step="0.50"
                className="w-full pl-10 p-3 border-2 border-stone-200 rounded-xl text-2xl font-bold text-center focus:border-emerald-500 outline-none text-stone-800"
                placeholder="0.00"
                value={montoBase}
                onChange={e => setMontoBase(e.target.value)}
              />
            </div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-lg transition-all flex justify-center items-center gap-2">
              <CheckCircle size={20}/> ABRIR CAJA
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- VISTA 2: CIERRE DE CAJA (La que ya tenías, mejorada) ---
  const diferencia = calcularDiferencia();
  
  return (
    <div className="max-w-4xl mx-auto p-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-2">
            <Lock className="text-amber-600"/> Cierre de Turno
          </h1>
          <p className="text-stone-500 text-xs mt-1">
            Abierto el: {new Date(sistema.inicio_periodo).toLocaleString()}
          </p>
        </div>
        <div className="bg-emerald-100 px-4 py-2 rounded-lg text-emerald-800 text-sm font-bold border border-emerald-200">
          Base Inicial: Bs {sistema.base_efectivo.toFixed(2)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* COLUMNA SISTEMA */}
        <div className="bg-stone-100 p-6 rounded-2xl border border-stone-200 h-fit">
          <h3 className="font-bold text-stone-500 mb-4 uppercase text-xs tracking-wider">Flujo de Sistema</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-2 border-b border-stone-200/50">
              <span className="text-stone-500">Base Inicial</span>
              <span className="font-mono font-bold text-stone-700">Bs {sistema.base_efectivo.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-2 border-b border-stone-200/50">
              <span className="text-stone-500 flex items-center gap-2"><DollarSign size={14}/> Ventas Efectivo</span>
              <span className="font-mono font-bold text-emerald-600">+ {sistema.efectivo.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-3 bg-white rounded-lg border border-stone-200 mt-2">
              <span className="font-bold text-stone-700">Total Esperado en Caja</span>
              <span className="font-mono font-bold text-xl">
                Bs {(sistema.base_efectivo + sistema.efectivo).toFixed(2)}
              </span>
            </div>
            
            <div className="pt-4 mt-2">
              <p className="text-xs text-stone-400 uppercase font-bold mb-2">Digitales (Banco)</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded border text-center">
                  <span className="block text-xs text-stone-400">QR</span>
                  <span className="font-mono font-bold text-stone-700">{sistema.qr.toFixed(2)}</span>
                </div>
                <div className="bg-white p-2 rounded border text-center">
                  <span className="block text-xs text-stone-400">Tarjeta</span>
                  <span className="font-mono font-bold text-stone-700">{sistema.tarjeta.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA ARQUEO */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-stone-200">
          <h3 className="font-bold text-emerald-800 mb-4 uppercase text-xs tracking-wider">Conteo Físico</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase mb-1 block">Efectivo en Cajón</label>
              <div className="relative">
                <DollarSign size={18} className="absolute left-3 top-3 text-emerald-600"/>
                <input type="number" className="w-full pl-10 p-3 border-2 border-emerald-100 rounded-xl font-bold text-lg focus:border-emerald-500 outline-none" placeholder="0.00" value={conteo.efectivo} onChange={e => setConteo({...conteo, efectivo: e.target.value})}/>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
              <label className="text-[10px] font-bold text-amber-700 uppercase mb-1 flex items-center gap-1">
                <ArrowUpRight size={12}/> Retiros / Gastos (Vales)
              </label>
              <input type="number" className="w-full p-2 bg-white border border-amber-200 rounded-lg text-sm" placeholder="0.00" value={conteo.retiros} onChange={e => setConteo({...conteo, retiros: e.target.value})}/>
            </div>

            <div className="grid grid-cols-2 gap-3 opacity-80">
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase">Validar QR</label>
                <input type="number" className="w-full p-2 border rounded-lg text-xs" value={conteo.qr} onChange={e => setConteo({...conteo, qr: e.target.value})}/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase">Validar Tarjeta</label>
                <input type="number" className="w-full p-2 border rounded-lg text-xs" value={conteo.tarjeta} onChange={e => setConteo({...conteo, tarjeta: e.target.value})}/>
              </div>
            </div>

            <textarea rows="2" className="w-full p-2 border rounded-lg text-xs" placeholder="Notas del turno..." value={conteo.notas} onChange={e => setConteo({...conteo, notas: e.target.value})}/>
          </div>

          <div className={`mt-6 p-3 rounded-xl flex justify-between items-center border ${diferencia === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
            <span className="font-bold text-sm flex items-center gap-2">
              {diferencia === 0 ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>} 
              {diferencia === 0 ? 'Cuadre Perfecto' : 'Diferencia'}
            </span>
            <span className="font-mono font-bold text-lg">{diferencia > 0 ? '+' : ''}{diferencia.toFixed(2)}</span>
          </div>

          <button onClick={handleCerrarCaja} className="w-full mt-4 bg-stone-900 text-white py-3 rounded-xl font-bold shadow hover:bg-black transition-all">
            FINALIZAR TURNO
          </button>
        </div>

      </div>
    </div>
  );
}