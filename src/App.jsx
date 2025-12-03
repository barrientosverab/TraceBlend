import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabaseClient';

// Componentes
import { Login } from './pages/Login';
import { Layout } from './components/layout/Layout';

// Páginas
import { Dashboard } from './pages/Dashboard';
import { Recepcion } from './pages/Recepcion';
import { Proveedores } from './pages/Proveedores';
import { Laboratorio } from './pages/Laboratorio';
import { Trilla } from './pages/Trilla';
import { Tueste }from './pages/Tueste';
import { Empaque } from './pages/Empaque';
import { Ventas } from './pages/Ventas';
import { RecuperarPassword } from './pages/RecuperarPassword';
import { RestablecerPassword } from './pages/RestablecerPassword';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Verificar sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Escuchar cambios (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  // Si no hay sesión, manejamos Login Y Recuperación
  if (!session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar" element={<RecuperarPassword />} />
          {/* Cualquier otra cosa va a Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Si hay sesión, mostramos la App completa
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route index element={<Dashboard />} />
          <Route path="proveedores" element={<Proveedores />} />
          <Route path="recepcion" element={<Recepcion />} />
          <Route path="laboratorio" element={<Laboratorio />} />
          <Route path="trilla" element={<Trilla />} />
          <Route path="tueste" element={<Tueste/>} />
          <Route path="empaque" element={<Empaque />} />
          <Route path="ventas" element={<Ventas />} />
          <Route path="*" element={<div className="text-red-500">Página no encontrada</div>} />
        </Route>
        {/* Ruta Especial: Restablecer Password (requiere sesión pero no layout completo) */}
        <Route path="/restablecer-password" element={<RestablecerPassword />} />
        <Route path="*" element={<div className="text-red-500">Página no encontrada</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;