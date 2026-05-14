import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabaseClient';
import { toast } from 'sonner';
import { Coffee, Loader2, Building2, Store, CheckCircle } from 'lucide-react';

const TRIAL_PLAN_ID = 'dbe792a3-f1ea-4e17-873f-1cfe234ac55e';

export function Onboarding() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    org_name: '',
    nit: '',
    branch_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.org_name.trim()) {
      return toast.warning('El nombre de la empresa es obligatorio');
    }
    if (!form.branch_name.trim()) {
      return toast.warning('El nombre de la sucursal es obligatorio');
    }

    setLoading(true);

    try {
      const { error } = await supabase.rpc('setup_organization', {
        org_name: form.org_name.trim(),
        org_nit: form.nit.trim(),
        org_address: 'Dirección General',
        plan_id: TRIAL_PLAN_ID,
        branch_name: form.branch_name.trim(),
      });

      if (error) throw error;

      toast.success('¡Todo listo! Bienvenido a TraceBlend.');
      // Recarga completa para que AuthContext cargue el perfil con organization_id
      window.location.href = '/';

    } catch (error: any) {
      console.error(error);
      toast.error('Error al configurar la organización', {
        description: error.message,
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">

        {/* Panel lateral */}
        <div className="bg-stone-900 w-full md:w-1/3 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-6">
              <Coffee size={24} />
            </div>
            <h1 className="text-xl font-bold">Bienvenido, {profile?.first_name}</h1>
            <p className="text-stone-400 text-sm mt-2">Configura tu tostaduría para comenzar a trabajar.</p>
          </div>
          <div className="hidden md:block mt-8 space-y-3 text-stone-500 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-emerald-500" />
              <span>Cuenta creada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full border-2 border-emerald-500 animate-pulse" />
              <span className="text-white font-medium">Configurar empresa</span>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8 flex-1 space-y-5">
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase flex items-center gap-1.5">
              <Building2 size={14} /> Nombre de la Empresa
            </label>
            <input
              className="w-full p-3 border rounded-xl mt-1 bg-stone-50 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
              placeholder="Ej: Café Altura Bolivia"
              value={form.org_name}
              onChange={e => setForm({ ...form, org_name: e.target.value })}
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-400 uppercase">NIT (Opcional)</label>
            <input
              className="w-full p-3 border rounded-xl mt-1 bg-stone-50 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
              placeholder="Ej: 1020304050"
              value={form.nit}
              onChange={e => setForm({ ...form, nit: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-400 uppercase flex items-center gap-1.5">
              <Store size={14} /> Nombre de la Sucursal Principal
            </label>
            <input
              className="w-full p-3 border rounded-xl mt-1 bg-stone-50 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none transition-all"
              placeholder="Ej: Sucursal Centro"
              value={form.branch_name}
              onChange={e => setForm({ ...form, branch_name: e.target.value })}
            />
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3 items-start">
            <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-emerald-800">
              <p className="font-bold">Plan Prueba 14 Días</p>
              <p className="opacity-80">Acceso total a todos los módulos. Sin compromiso.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 flex justify-center items-center gap-2 mt-2 transition-all shadow-lg shadow-emerald-200"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Crear mi Tostaduría'}
          </button>
        </form>
      </div>
    </div>
  );
}