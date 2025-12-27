import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { getUserProfile, UserProfile } from '../services/authService';
import { getOrganizationSubscription, OrganizationSubscription } from '../services/subscriptionService';

// Definimos QUÉ datos expone nuestro contexto
export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  role: string | null;
  orgId: string | null;
  userName: string | null | undefined;
  subscription: OrganizationSubscription | null;
  planFeatures: string[];
}

// Creamos el contexto tipado (inicialmente undefined)
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Tipado explícito para el perfil
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const cached = localStorage.getItem('traceblend_profile');
    return cached ? JSON.parse(cached) : null;
  });

  // Estado para suscripción
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const data = await getUserProfile();
      if (data) {
        setProfile(data);
        localStorage.setItem('traceblend_profile', JSON.stringify(data));

        // Cargar información de suscripción
        if (data.organization_id) {
          const subscriptionData = await getOrganizationSubscription(data.organization_id);
          setSubscription(subscriptionData);
        }
      }
    } catch (e) {
      console.error("Auth: Error buscando perfil", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety timer
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) setLoading(false);
    }, 3000);

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          if (!profile) {
            await fetchProfile(session.user.id);
          } else {
            fetchProfile(session.user.id);
          }
        } else {
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'INITIAL_SESSION') return;

      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      } else {
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
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) { console.error(e); }

    setUser(null);
    setProfile(null);
    localStorage.removeItem('traceblend_profile');
    setLoading(false);
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
    role: profile?.role || null,
    orgId: profile?.organization_id || null,
    userName: profile?.first_name || user?.email,
    subscription,
    planFeatures: subscription?.available_features || []
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};