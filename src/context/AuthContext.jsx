import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. TRUCO DE MEMORIA: Leemos el caché inmediatamente al iniciar.
  // Esto evita que 'profile' sea null durante la recarga (F5).
  const [profile, setProfile] = useState(() => {
    const cached = localStorage.getItem('traceblend_profile');
    return cached ? JSON.parse(cached) : null;
  });

  // Helper para buscar datos frescos y actualizar el caché
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, organization_id, first_name')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        // 2. GUARDAMOS EN CACHÉ: Para la próxima recarga
        localStorage.setItem('traceblend_profile', JSON.stringify(data));
      }
    } catch (e) {
      console.error("Auth: Error buscando perfil", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Válvula de seguridad: Si todo falla, liberamos en 3 seg
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) setLoading(false);
    }, 3000);

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          
          // 3. ESTRATEGIA HÍBRIDA:
          // Si NO tenemos datos en caché, ESPERAMOS (await) obligatoriamente.
          // Si YA tenemos caché, cargamos en segundo plano (rápido).
          if (!profile) {
            await fetchProfile(session.user.id);
          } else {
            fetchProfile(session.user.id);
          }
        } else {
          // Si no hay sesión, limpiamos basura antigua
          localStorage.removeItem('traceblend_profile');
        }
      } catch (error) {
        console.error("Auth Init Error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      }
    };

    initializeAuth();

    // Listener de eventos (Login, Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return; // Ya manejado arriba

      if (session?.user) {
        setUser(session.user);
        // Al hacer login nuevo, buscamos el perfil
        fetchProfile(session.user.id);
      } else {
        // Al salir, limpiamos todo
        setUser(null);
        setProfile(null);
        localStorage.removeItem('traceblend_profile');
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []); // Dependencias vacías para correr solo una vez

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) { console.error(e); }
    
    // Limpieza total
    setUser(null);
    setProfile(null);
    localStorage.removeItem('traceblend_profile');
    setLoading(false);
    window.location.href = '/login';
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