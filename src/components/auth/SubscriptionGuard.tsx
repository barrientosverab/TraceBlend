import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';
import { Lock, CreditCard } from 'lucide-react';

export const SubscriptionGuard = ({ children }: { children: React.ReactNode }) => {
  const { orgId, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    if (orgId) checkSubscription();
  }, [orgId]);

  const checkSubscription = async () => {
    // CORRECCIÓN AQUÍ: 
    // Esta línea le asegura a TypeScript que si pasamos de aquí, orgId tiene valor.
    if (!orgId) return; 

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('plan, status, trial_ends_at, next_payment_date')
        .eq('id', orgId) // Ahora TypeScript sabe que orgId es 'string' seguro
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

  // Si no cargó el estado (ej. error de red) o no hay orgId, dejamos pasar o mostramos loading
  if (!status) return <>{children}</>; 

  const now = new Date();
  const trialEnd = new Date(status.trial_ends_at);
  const paymentDue = status.next_payment_date ? new Date(status.next_payment_date) : null;

  // Lógica de Bloqueo
  let isLocked = false;
  let message = "";

  // Caso 1: Prueba Gratuita Vencida
  if (status.plan === 'free_trial' && now > trialEnd) {
    isLocked = true;
    message = "Tu periodo de prueba de 14 días ha finalizado.";
  }

  // Caso 2: Suscripción Vencida (Impago)
  if (status.status === 'past_due' || (status.status === 'active' && paymentDue && now > paymentDue)) {
    isLocked = true;
    message = "Tu suscripción ha vencido. Realiza el pago para continuar.";
  }

  // Si está bloqueado, mostramos pantalla de pago (Paywall)
  if (isLocked) {
    return (
      <div className="h-screen w-full bg-stone-900 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center shadow-2xl animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 shadow-sm">
            <Lock size={32}/>
          </div>
          <h1 className="text-2xl font-bold text-stone-800 mb-2">Acceso Restringido</h1>
          <p className="text-stone-500 mb-8 leading-relaxed">{message}</p>
          
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-left mb-6 shadow-inner">
            <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-2 text-sm">
              <CreditCard size={16} className="text-emerald-600"/> Cómo reactivar:
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
        </div>
      </div>
    );
  }

  // Acceso concedido
  return <>{children}</>;
};