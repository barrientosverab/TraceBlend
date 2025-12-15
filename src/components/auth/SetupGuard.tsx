import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabaseClient';

export const SetupGuard = ({ children }: { children: React.ReactNode }) => {
  const { orgId, loading: authLoading } = useAuth();
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (authLoading) return;
    
    // Si no tiene orgId (ej: error de carga), dejamos que otros componentes manejen el error
    if (!orgId) {
      setChecking(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('setup_completed')
          .eq('id', orgId)
          .single();

        if (error) throw error;
        
        // Si data.setup_completed es true, es un usuario recurrente o invitado -> Pasa
        // Si es false, es un dueño nuevo -> Bloquea
        setIsSetup(data.setup_completed);
      } catch (error) {
        console.error("Error verificando setup:", error);
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
  }, [orgId, authLoading]);

  // Mientras verificamos, mostramos un cargando minimalista
  if (authLoading || checking) {
    return <div className="h-screen w-full flex items-center justify-center bg-stone-50">Cargando...</div>;
  }

  const onOnboardingPage = location.pathname === '/onboarding';

  // CASO A: Usuario Recurrente/Invitado (Setup True) intentando ver Onboarding
  // Lo mandamos al Dashboard porque ya no necesita configurar nada.
  if (isSetup === true && onOnboardingPage) {
    return <Navigate to="/" replace />;
  }

  // CASO B: Nuevo Dueño (Setup False) intentando entrar al Dashboard
  // Lo mandamos a Onboarding obligatoriamente.
  if (isSetup === false && !onOnboardingPage) {
    return <Navigate to="/onboarding" replace />;
  }

  // CASO C: Todo en orden (Recurrente en Dashboard o Nuevo en Onboarding)
  return <>{children}</>;
};