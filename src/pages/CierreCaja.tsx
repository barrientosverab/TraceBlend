import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { registrarCierre, registrarApertura, obtenerResumenCaja, CierreData } from '../services/cajaService';
import { toast } from 'sonner';
import { Calculator, Save, Lock } from 'lucide-react';


interface ResumenCajaDB {
  total_cash: number;
  total_qr: number;
  total_card: number;
}

export function CierreCaja() {
  const { orgId, user } = useAuth();
  const [resumen, setResumen] = useState<any>(null);
  const [form, setForm] = useState<CierreData>({
    system_cash: 0, system_qr: 0, system_card: 0,
    declared_cash: 0, declared_qr: 0, declared_card: 0,
    cash_withdrawals: 0, notes: ''
  });
  

  useEffect(() => {
    if (orgId && user) {
      obtenerResumenCaja(orgId, user.id).then(data => {
        
        const datosDB = data as unknown as ResumenCajaDB;

        if (datosDB) {
            setForm(prev => ({
                ...prev,
                system_cash: datosDB.total_cash || 0,
                system_qr: datosDB.total_qr || 0,
                system_card: datosDB.total_card || 0
            }));
            setResumen(datosDB);
        }
      });
    }
  }, [orgId, user]);

  const handleCierre = async () => {
    try {
      await registrarCierre(form, orgId!, user!.id);
      toast.success("Caja cerrada correctamente");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-stone-800 mb-8 flex items-center gap-2"><Calculator/> Arqueo de Caja</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sistema */}
        <div className="bg-stone-100 p-6 rounded-2xl border border-stone-200">
          <h3 className="font-bold text-stone-500 uppercase text-sm mb-4">Esperado por Sistema</h3>
          <div className="space-y-4">
            <div className="flex justify-between"><span>Efectivo:</span> <span className="font-bold">Bs {form.system_cash}</span></div>
            <div className="flex justify-between"><span>QR:</span> <span className="font-bold">Bs {form.system_qr}</span></div>
            <div className="flex justify-between"><span>Tarjeta:</span> <span className="font-bold">Bs {form.system_card}</span></div>
            <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total:</span> <span>Bs {form.system_cash + form.system_qr + form.system_card}</span>
            </div>
          </div>
        </div>

        {/* Declarado */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-stone-100">
           <h3 className="font-bold text-emerald-600 uppercase text-sm mb-4">Declaración Real</h3>
           <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-400">Efectivo en Caja</label>
                <input type="number" className="w-full p-2 border rounded font-bold text-lg" value={form.declared_cash} onChange={e=>setForm({...form, declared_cash: Number(e.target.value)})}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-stone-400">QR Real</label>
                    <input type="number" className="w-full p-2 border rounded" value={form.declared_qr} onChange={e=>setForm({...form, declared_qr: Number(e.target.value)})}/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-400">Tarjeta Real</label>
                    <input type="number" className="w-full p-2 border rounded" value={form.declared_card} onChange={e=>setForm({...form, declared_card: Number(e.target.value)})}/>
                  </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400">Retiros / Gastos Caja</label>
                <input type="number" className="w-full p-2 border rounded text-red-500 font-bold" value={form.cash_withdrawals} onChange={e=>setForm({...form, cash_withdrawals: Number(e.target.value)})}/>
              </div>
              <textarea className="w-full p-2 border rounded" placeholder="Notas / Observaciones" value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})}/>
           </div>
        </div>
      </div>

      <button onClick={handleCierre} className="w-full mt-8 bg-stone-900 text-white py-4 rounded-xl font-bold text-xl shadow-xl hover:bg-black transition-all flex justify-center gap-2">
        <Lock/> Cerrar Turno
      </button>
    </div>
  );
}