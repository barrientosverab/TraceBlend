import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper robusto para cargar perfil
  const fetchProfile = async (userId) => {
    console.log(`Auth: Fetching profile for ${userId}...`);
    try {
      // Usamos .maybeSingle() para evitar errores 406 si no existe
      const { data, error } = await supabase
        .from('profiles')
        .select('role, organization_id, first_name')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("Auth: Error DB fetching profile:", error.message);
        return null;
      }
      
      if (data) {
        console.log("Auth: Profile loaded:", data);
        setProfile(data);
        return data;
      } else {
        console.warn("Auth: Profile not found via API (Check RLS)");
        return null;
      }
    } catch (e) {
      console.error("Auth: Network error fetching profile:", e);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Lógica de Inicialización
    const initializeAuth = async () => {
      console.log("Auth: Initializing...");
      try {
        // Obtenemos sesión
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log("Auth: Session found");
          setUser(session.user);
          // Intentamos cargar perfil, pero NO bloqueamos el 'loading' por siempre si falla
          await fetchProfile(session.user.id); 
        }
      } catch (error) {
        console.error("Auth: Init error:", error);
      } finally {
        if (mounted) {
          setLoading(false); // Siempre terminamos de cargar
        }
      }
    };

    initializeAuth();

    // 2. Escuchar cambios en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth Event: ${event}`);
      
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        // Si es un login o refresh y no tenemos perfil, búscalo
        // IMPORTANTE: No usamos 'await' bloqueante aquí para no congelar la UI
        fetchProfile(session.user.id); 
      } else {
        setUser(null);
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
    role: profile?.role || null,
    orgId: profile?.organization_id || null,
    userName: profile?.first_name || user?.email
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};