import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';
import { Lock, CreditCard, LogOut } from 'lucide-react';

export const SubscriptionGuard = ({ children }: { children: React.ReactNode }) => {
  const { orgId, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    if (orgId) checkSubscription();
  }, [orgId]);

  const checkSubscription = async () => {
    if (!orgId) return;

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('status, trial_ends_at')
        .eq('id', orgId)
        .single();

      if (error) throw error;
      setStatus(data);
    } catch (e) {
      console.error("Error verificando suscripción", e);
    } finally {
      setLoading(false);
    }
  };

  // Mientras carga la autenticación o la validación de suscripción
  if (authLoading || (loading && orgId)) {
    return <div className="h-screen bg-stone-50 flex items-center justify-center text-stone-500 font-bold animate-pulse">Verificando acceso...</div>;
  }

  // Si no cargó el estado (ej. error de red) o no hay orgId, dejamos pasar
  if (!status) return <>{children}</>;

  const now = new Date();
  const trialEnd = status.trial_ends_at ? new Date(status.trial_ends_at) : null;

  // Lógica de Bloqueo
  let isLocked = false;
  let message = "";

  // Caso 1: Prueba Gratuita Vencida
  if (status.status === 'trial' && trialEnd && now > trialEnd) {
    isLocked = true;
    message = "Tu periodo de prueba de 14 días ha finalizado.";
  }

  // Caso 2: Suscripción Vencida (Impago)
  if (status.status === 'past_due' || status.status === 'canceled') {
    isLocked = true;
    message = "Tu suscripción ha vencido. Realiza el pago para continuar.";
  }

  // Si está bloqueado, mostramos pantalla de pago (Paywall)
  if (isLocked) {
    return (
      <div className="h-screen w-full bg-stone-900 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center shadow-2xl animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 shadow-sm">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Acceso Restringido</h1>
          <p className="text-stone-500 mb-8 leading-relaxed">{message}</p>

          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-left mb-6 shadow-inner">
            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-2 text-sm">
              <CreditCard size={16} className="text-emerald-600" /> Cómo reactivar:
            </h3>
            <p className="text-xs text-stone-600 mb-3">Realiza una transferencia o pago QR a la cuenta corporativa y envía el comprobante.</p>
            <div className="font-mono text-xs bg-white p-3 border border-stone-200 rounded-lg text-center text-stone-600">
              <p>Cuenta BNB: <span className="font-bold text-stone-800">123-456789</span></p>
              <p>NIT: <span className="font-bold text-stone-800">1020304050</span></p>
            </div>
          </div>

          <a
            href="https://wa.me/591XXXXXXXX?text=Hola,%20quiero%20reactivar%20mi%20cuenta%20TraceBlend"
            target="_blank"
            rel="noreferrer"
            className="block w-full bg-stone-900 hover:bg-black text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Contactar Soporte para Pagar
          </a>

          <button
            onClick={handleLogout}
            className="mt-3 flex items-center justify-center gap-2 w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 rounded-xl transition-all border border-stone-200"
          >
            <LogOut size={16} />
            Volver al Login
          </button>
          <p className="mt-2 text-xs text-stone-400">¿Eres un nuevo usuario? Cierra esta sesión y crea una cuenta nueva.</p>
        </div>
      </div>
    );
  }

  // Acceso concedido
  return <>{children}</>;
};
