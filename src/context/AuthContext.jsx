// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper para cargar perfil sin bloquear
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, organization_id, first_name')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setProfile(data);
      }
    } catch (e) {
      console.error("Auth: Error cargando perfil (no crítico)", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. TIMEOUT DE SEGURIDAD
    // Si Supabase se cuelga por extensiones, a los 2 seg forzamos la entrada
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("Auth: Timeout de seguridad activado. Forzando fin de carga.");
        setLoading(false);
      }
    }, 2000);

    const initAuth = async () => {
      console.log("Auth: Iniciando verificación...");
      try {
        // Intentamos obtener sesión
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user && mounted) {
          console.log("Auth: Sesión encontrada vía getSession");
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error("Auth: Error en getSession:", error.message);
      } finally {
        if (mounted) {
          console.log("Auth: Finalizando carga (vía initAuth)");
          setLoading(false);
          clearTimeout(safetyTimer); // Cancelamos el timer si esto terminó bien
        }
      }
    };

    initAuth();

    // 2. ESCUCHA DE EVENTOS (Plan B que suele ser más rápido)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth Event: ${event}`);
      
      if (mounted) {
        if (session?.user) {
          setUser(session.user);
          // Solo buscamos perfil si no lo tenemos ya (para evitar parpadeos)
          if (!profile) {
             await fetchProfile(session.user.id);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        
        // Si llega un evento, desbloqueamos inmediatamente
        setLoading(false);
        clearTimeout(safetyTimer); 
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []); // Array vacío para correr solo al montar

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