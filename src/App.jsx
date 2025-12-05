import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner'; // <--- IMPORTANTE: Notificaciones
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';

// --- 1. IMPORTACIONES LAZY (Optimización de Velocidad) ---
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Usuarios = lazy(() => import('./pages/Usuarios').then(m => ({ default: m.Usuarios })));
const Recepcion = lazy(() => import('./pages/Recepcion').then(m => ({ default: m.Recepcion })));
const Proveedores = lazy(() => import('./pages/Proveedores').then(m => ({ default: m.Proveedores })));
const Laboratorio = lazy(() => import('./pages/Laboratorio').then(m => ({ default: m.Laboratorio })));
const Trilla = lazy(() => import('./pages/Trilla').then(m => ({ default: m.Trilla })));
const Tueste = lazy(() => import('./pages/Tueste').then(m => ({ default: m.Tueste })));
const Empaque = lazy(() => import('./pages/Empaque').then(m => ({ default: m.Empaque })));
const Ventas = lazy(() => import('./pages/Ventas').then(m => ({ default: m.Ventas })));
const Productos = lazy(() => import('./pages/Productos').then(m => ({ default: m.Productos })));
const RecuperarPassword = lazy(() => import('./pages/RecuperarPassword').then(m => ({ default: m.RecuperarPassword })));
const RestablecerPassword = lazy(() => import('./pages/RestablecerPassword').then(m => ({ default: m.RestablecerPassword })));

// --- 2. COMPONENTE DE CARGA (Spinner elegante entre páginas) ---
const PageLoader = () => (
  <div className="h-full w-full flex flex-col items-center justify-center p-20">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mb-4"></div>
    <span className="text-stone-400 text-sm font-medium animate-pulse">Cargando módulo...</span>
  </div>
);

function App() {
  const { isAuthenticated, loading } = useAuth();

  // Loader de pantalla completa para la sesión inicial
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* --- 3. CONFIGURACIÓN DE NOTIFICACIONES (TOAST) --- */}
      {/* Esto habilita toast.success() y toast.error() en TODA la app */}
      <Toaster 
        position="top-center" 
        richColors 
        expand={true}
        style={{ zIndex: 99999 }} // Asegura que se vea sobre modales y sidebar
      />
      
      {/* Suspense maneja la carga de los componentes Lazy */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          
          {/* CASO A: NO AUTENTICADO (Login y Recuperación) */}
          {!isAuthenticated && (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/recuperar" element={<RecuperarPassword />} />
              {/* Cualquier otra ruta redirige al login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}

          {/* CASO B: AUTENTICADO (App Principal) */}
          {isAuthenticated && (
            <>
              {/* Rutas con Sidebar (Layout) */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="usuarios" element={<Usuarios />} />
                <Route path="proveedores" element={<Proveedores />} />
                <Route path="recepcion" element={<Recepcion />} />
                <Route path="laboratorio" element={<Laboratorio />} />
                <Route path="trilla" element={<Trilla />} />
                <Route path="tueste" element={<Tueste />} />
                <Route path="empaque" element={<Empaque />} />
                <Route path="ventas" element={<Ventas />} />
                <Route path="productos" element={<Productos />} />
              </Route>

              {/* Rutas sin Sidebar (Pantalla completa) */}
              <Route path="/restablecer-password" element={<RestablecerPassword />} />
              
              {/* Redirección por defecto al Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;