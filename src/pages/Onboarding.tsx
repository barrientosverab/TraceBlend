import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';
import { Building2, Save, Upload, Coffee } from 'lucide-react';

export function Onboarding() {
  const { orgId, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    address: '',
    phone: '',
    currency_symbol: 'Bs',
    logo_file: null as File | null
  });

  const handleSave = async () => {
    if (!form.address || !form.phone) return toast.warning("Por favor completa los campos");
    if (!orgId) return;
    setLoading(true);

    try {
      let logoUrl = null;

      // 1. Subir Logo (si el usuario seleccionó uno)
      if (form.logo_file && orgId) {
        const fileExt = form.logo_file.name.split('.').pop();
        const fileName = `${orgId}-logo.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(fileName, form.logo_file, { upsert: true });

        if (uploadError) throw uploadError;
        
        const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);
        logoUrl = urlData.publicUrl;
      }

      // 2. Actualizar Organización y Marcar como COMPLETADO
      const { error } = await supabase
        .from('organizations')
        .update({
          address: form.address,
          phone: form.phone,
          currency_symbol: form.currency_symbol,
          logo_url: logoUrl,
          
          setup_completed: true // <--- LA LLAVE QUE ABRE EL SISTEMA
        })
        .eq('id', orgId);

      if (error) throw error;

      toast.success("¡Todo listo! Bienvenido a TraceBlend.");
      // Recarga completa para refrescar el estado del Guardia y el Sidebar
      window.location.href = "/"; 

    } catch (e) {
      console.error(e);
      toast.error("Error al guardar la configuración");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        <div className="bg-stone-900 w-full md:w-1/3 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <Coffee size={24}/>
            </div>
            <h1 className="text-xl font-bold">Bienvenido, {profile?.first_name}</h1>
            <p className="text-stone-400 text-sm mt-2">Configura los datos básicos de tu tostaduría para comenzar.</p>
          </div>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <div className="w-2 h-2 rounded-full bg-stone-700"></div>
          </div>
        </div>

        <div className="p-8 flex-1 space-y-5">
           <div>
             <label className="text-xs font-bold text-stone-400 uppercase">Moneda</label>
             <div className="flex gap-2 mt-2">
                {['Bs', '$us', '€'].map(sym => (
                  <button key={sym} onClick={() => setForm({...form, currency_symbol: sym})}
                    className={`px-3 py-2 rounded-lg border text-sm font-bold ${form.currency_symbol === sym ? 'bg-stone-800 text-white' : 'hover:bg-stone-50'}`}>
                    {sym}
                  </button>
                ))}
             </div>
           </div>

           <div>
             <label className="text-xs font-bold text-stone-400 uppercase">Dirección</label>
             <input className="w-full p-3 border rounded-xl mt-1 bg-stone-50" 
               placeholder="Ej: Av. Principal #123"
               value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
           </div>

           <div>
             <label className="text-xs font-bold text-stone-400 uppercase">Teléfono</label>
             <input className="w-full p-3 border rounded-xl mt-1 bg-stone-50" 
               placeholder="+591 ..."
               value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
           </div>

           <div>
             <label className="text-xs font-bold text-stone-400 uppercase">Logo</label>
             <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 mt-1 text-center cursor-pointer hover:border-emerald-500 relative">
               <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                 onChange={e => setForm({...form, logo_file: e.target.files?.[0] || null})} />
               {form.logo_file ? <span className="text-emerald-600 font-bold">{form.logo_file.name}</span> : <span className="text-stone-400 text-xs">Subir imagen...</span>}
             </div>
           </div>

           <button onClick={handleSave} disabled={loading}
             className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 flex justify-center items-center gap-2 mt-2">
             {loading ? 'Guardando...' : <>Guardar y Entrar <Save size={18}/></>}
           </button>
        </div>
      </div>
    </div>
  );
}