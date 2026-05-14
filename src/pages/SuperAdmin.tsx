import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { Shield, CheckCircle, XCircle, DollarSign, Wand2 } from 'lucide-react';
import { generarDatosDemo } from '../services/demoService';
import { Tables } from '../types/supabase';

type Organization = Tables<'organizations'>;
// subscriptionService removed for MVP

// Definimos un tipo local para facilitar el manejo de la UI basado en la DB real
type OrganizationRow = Organization;

// Tipo para la organización con el plan de suscripción expandido
type OrganizationWithPlan = OrganizationRow & {
  subscription_plan?: {
    id: string;
    name: string;
    code: string;
    price_monthly: number;
  } | null;
  subscription_plan_id?: string | null;
};

// Tu email de Super Admin
const SUPER_ADMIN_EMAIL = "barrientosverab@gmail.com";

export function SuperAdmin() {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<OrganizationWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<{ id: string; name: string; price_monthly: number }[]>([]);

  const cargarPlanes = useCallback(async () => {
    const { data: availablePlans } = await supabase.from('subscription_plans').select('id, name, price_monthly').order('price_monthly'); 
    setPlans(availablePlans || []);
  }, []);

  const cargarOrganizaciones = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        subscription_plan:subscription_plan_id (
          id,
          name,
          code,
          price_monthly
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Error cargando organizaciones");
      console.error(error);
    } else {
      setOrgs((data || []) as OrganizationWithPlan[]);
    }
    setLoading(false);
  }, []);


  useEffect(() => {
    if (user?.email === SUPER_ADMIN_EMAIL) {
      cargarOrganizaciones();
      cargarPlanes();
    }
  }, [user, cargarOrganizaciones, cargarPlanes]);

  const handlePoblarDemo = async (orgId: string, orgName: string) => {
    if (!window.confirm(`¿Seguro que deseas inyectar datos falsos en "${orgName}"? Esto ensuciará su base de datos.`)) return;

    const toastId = toast.loading("Generando simulación...");
    try {
      await generarDatosDemo(orgId, 'placeholder-branch');
      toast.success("¡Datos Demo Cargados!", { id: toastId });
    } catch (e) {
      toast.error("Error generando datos", { id: toastId });
      console.error(e);
    }
  };



  const cambiarPlan = async (orgId: string, planId: string) => {
    const { error: updateError } = await supabase.from('organizations').update({ subscription_plan_id: planId }).eq('id', orgId); const success = !updateError;

    if (success) {
      toast.success('Plan actualizado correctamente');
      cargarOrganizaciones();
    } else {
      toast.error('Error al actualizar el plan');
    }
  };

  const extenderSuscripcion = async (orgId: string, meses: number) => {
    const nuevaFecha = new Date();
    nuevaFecha.setMonth(nuevaFecha.getMonth() + meses);

    const { error } = await supabase
      .from('organizations')
      .update({
        status: 'active',
        plan: 'tostador',
        next_payment_date: nuevaFecha.toISOString()
      })
      .eq('id', orgId);

    if (error) {
      toast.error("Error al actualizar: " + error.message);
    } else {
      toast.success(`Suscri pción extendida ${meses} mes(es)`);
      cargarOrganizaciones();
    }
  };

  if (user?.email !== SUPER_ADMIN_EMAIL) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold text-stone-800">Acceso Restringido</h1>
          <p className="text-stone-500">Esta área es solo para administración global.</p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-10 text-center font-bold text-stone-400">Cargando panel maestro...</div>;

  return (
    <div className="p-6 bg-stone-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-stone-900 mb-6 flex items-center gap-2">
          <Shield className="text-emerald-600" /> Panel Super Admin
        </h1>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 font-bold uppercase">
              <tr>
                <th className="p-4">Organización</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Plan de Suscripción</th>
                <th className="p-4">Precio</th>
                <th className="p-4">Vencimiento</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orgs.map(org => {
                // Lógica robusta de fechas
                const fechaFin = org.trial_ends_at;
                const fechaObj = fechaFin ? new Date(fechaFin) : new Date();
                const esVencido = fechaObj < new Date();

                return (
                  <tr key={org.id} className="hover:bg-stone-50 transition-colors">
                    <td className="p-4 font-bold text-stone-800">
                      {org.name} <br />
                      <span className="text-xs text-stone-400 font-normal font-mono">{org.id.split('-')[0]}...</span>
                    </td>
                    <td className="p-4">
                      {esVencido
                        ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><XCircle size={12} /> Vencido</span>
                        : <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1"><CheckCircle size={12} /> Activo</span>
                      }
                    </td>
                    <td className="p-4">
                      <select
                        value={org.subscription_plan_id || ''}
                        onChange={(e) => cambiarPlan(org.id, e.target.value)}
                        className="text-xs font-bold border border-stone-300 px-3 py-2 rounded-lg bg-white hover:border-emerald-500 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-all"
                      >
                        <option value="">Sin plan asignado</option>
                        {plans.map(plan => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 font-mono text-sm text-stone-700">
                      {org.subscription_plan?.price_monthly
                        ? `$${org.subscription_plan.price_monthly}/mes`
                        : '-'}
                    </td>
                    <td className="p-4 font-mono text-stone-600">
                      {fechaFin ? new Date(fechaFin).toLocaleDateString() : 'Indefinido'}
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => extenderSuscripcion(org.id, 1)}
                        className="bg-white border border-stone-300 text-stone-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-stone-50 hover:border-stone-400 transition-all flex items-center gap-1 shadow-sm"
                        title="Activar 1 Mes"
                      >
                        <DollarSign size={12} /> 1 Mes
                      </button>
                      <button
                        onClick={() => extenderSuscripcion(org.id, 12)}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm shadow-emerald-200"
                        title="Activar 1 Año"
                      >
                        <DollarSign size={12} /> 1 Año
                      </button>
                      <div className="w-px h-6 bg-stone-300 mx-1"></div>
                      <button
                        onClick={() => handlePoblarDemo(org.id, org.name)}
                        className="bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 transition-all flex items-center gap-1 shadow-sm"
                        title="Inyectar Datos Demo"
                      >
                        <Wand2 size={12} /> Demo
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {orgs.length === 0 && <div className="p-12 text-center text-stone-400">No hay organizaciones registradas en el sistema.</div>}
        </div>
      </div>
    </div>
  );
}