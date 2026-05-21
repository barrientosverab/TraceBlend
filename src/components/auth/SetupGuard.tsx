import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut } from 'lucide-react'; 
import { supabase } from '../../services/supabaseClient';

export const SetupGuard = ({ children }: { children: React.ReactNode }) => {
  const { orgId, user, profile, loading: authLoading } = useAuth();
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyStatus = async () => {
      // 1. Si todavía cargamos sesión de auth, esperar.
      if (authLoading) return;

      // 2. Si no hay usuario, dejamos pasar (el routing se encarga)
      if (!user) {
        setIsChecking(false);
        return;
      }

      // Si el usuario existe pero el perfil aún no ha cargado, esperar
      if (user && profile === null) {
        return;
      }

      // 3. Si usuario sin org → redirigir a onboarding
      if (user && profile && !orgId) {
        setIsChecking(false);
        return;
      }

      // 4. Ya tenemos OrgId, verificamos el estado del Setup
      if (orgId) {
        try {
          const { data } = await supabase
            .from('organizations')
            .select('setup_completed')
            .eq('id', orgId)
            .single();

          if (data) {
            setIsSetup(data.setup_completed);
          }
        } catch (e) {
          console.error("Error verificando setup:", e);
        } finally {
          setIsChecking(false);
        }
      }
    };

    verifyStatus();
  }, [orgId, user, profile, authLoading]);

  const isProfileLoading = user && profile === null;
  const loading = authLoading || isChecking || isProfileLoading;

  // PANTALLA DE CARGA
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-50 p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
        
        <p className="text-stone-500 font-medium animate-pulse mb-6">
            Verificando acceso...
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

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user && !profile?.organization_id) {
    return <Navigate to="/onboarding" replace />;
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
  if (user && profile?.organization_id) {
    return <>{children}</>;
  }

  return <>{children}</>;
};
