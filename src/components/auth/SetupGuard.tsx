import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut } from 'lucide-react'; 
import { supabase } from '../../services/supabaseClient';

export const SetupGuard = ({ children }: { children: React.ReactNode }) => {
  const { orgId, user, loading: authLoading } = useAuth();
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const verifyStatus = async () => {
      // 1. Si todavía cargamos sesión, esperar.
      if (authLoading) return;

      // 2. CASO CRÍTICO: Usuario logueado pero sin OrgId (Race Condition del Trigger)
      if (user && !orgId) {
        // Mantenemos el estado de "Verificando" y reintentamos en 1 segundo
        // Esto da tiempo a que el Trigger de BD termine de crear la empresa
        console.log("⏳ Esperando creación de empresa...");
        return; 
      }

      // 3. Si no hay usuario ni org (Logout), dejamos de verificar y pasamos control
      if (!user) {
        setIsChecking(false);
        return;
      }

      // 4. Ya tenemos OrgId, verificamos el estado del Setup
      if (orgId) {
        try {
          const { data, error } = await supabase
            .from('organizations')
            .select('setup_completed')
            .eq('id', orgId)
            .single();

          if (data) {
            setIsSetup(data.setup_completed);
            setIsChecking(false); // ¡Listo! Dejamos de cargar
          }
        } catch (e) {
          console.error("Error verificando setup:", e);
          setIsChecking(false);
        }
      }
    };

    // Ejecutamos la verificación
    verifyStatus();

    // Si estamos en el caso crítico (user sin org), hacemos polling cada 1s
    if (user && !orgId && !authLoading) {
        intervalId = setInterval(() => {
            // Forzamos una recarga de la página si detectamos que esto tarda mucho
            // O idealmente llamamos a una función refreshSession() si existiera
            // Por simplicidad, recargamos la página tras 3 segundos para que useAuth tome los datos nuevos
            window.location.reload(); 
        }, 3000);
    }

    return () => {
        if (intervalId) clearInterval(intervalId);
    };
  }, [orgId, user, authLoading]);

  // PANTALLA DE CARGA (Mientras esperamos al Trigger)
  // PANTALLA DE CARGA (Modificada con botón de salida)
  if (authLoading || (user && !orgId) || isChecking) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-50 p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
        
        <p className="text-stone-500 font-medium animate-pulse mb-6">
            {!orgId ? "Configurando tu tostaduría..." : "Verificando cuenta..."}
        </p>

        {/* --- BOTÓN DE SALIDA DE EMERGENCIA --- */}
        <button 
            onClick={() => {
                supabase.auth.signOut();
                window.location.href = '/login';
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
            <LogOut size={16} />
            Cancelar y Salir
        </button>
      </div>
    );
  }

  const onOnboardingPage = location.pathname === '/onboarding';

  // REDIRECCIONES (Semáforos)

  // A. Si ya configuró (TRUE) y quiere ver Onboarding -> Al Dashboard
  if (isSetup === true && onOnboardingPage) {
    return <Navigate to="/" replace />;
  }

  // B. Si NO ha configurado (FALSE) y quiere entrar al sistema -> Al Onboarding
  if (isSetup === false && !onOnboardingPage) {
    return <Navigate to="/onboarding" replace />;
  }

  // C. Todo correcto -> Renderizar contenido
  return <>{children}</>;
};