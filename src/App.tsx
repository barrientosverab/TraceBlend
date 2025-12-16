import React, { Suspense, lazy } from 'react';
// CORRECCIÓN: Agregamos 'Outlet' a la lista de imports
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SubscriptionGuard } from './components/auth/SubscriptionGuard';
import { SetupGuard } from './components/auth/SetupGuard';

// --- IMPORTS DE PÁGINAS (Lazy Loading) ---
// Autenticación & Onboarding
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const Registro = lazy(() => import('./pages/Registro').then(m => ({ default: m.Registro })));
const RecuperarPassword = lazy(() => import('./pages/RecuperarPassword').then(m => ({ default: m.RecuperarPassword })));
const RestablecerPassword = lazy(() => import('./pages/RestablecerPassword').then(m => ({ default: m.RestablecerPassword })));

// Super Admin (SaaS)
const SuperAdmin = lazy(() => import('./pages/SuperAdmin').then(m => ({ default: m.SuperAdmin })));

// Núcleo
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));

// Ventas & Caja
const Ventas = lazy(() => import('./pages/Ventas').then(m => ({ default: m.Ventas })));
const CierreCaja = lazy(() => import('./pages/CierreCaja').then(m => ({ default: m.CierreCaja })));
const Clientes = lazy(() => import('./pages/Clientes').then(m => ({ default: m.Clientes })));

// Producción
const Recepcion = lazy(() => import('./pages/Recepcion').then(m => ({ default: m.Recepcion })));
const Trilla = lazy(() => import('./pages/Trilla').then(m => ({ default: m.Trilla })));
const Tueste = lazy(() => import('./pages/Tueste').then(m => ({ default: m.Tueste })));
const Empaque = lazy(() => import('./pages/Empaque').then(m => ({ default: m.Empaque })));
const Laboratorio = lazy(() => import('./pages/Laboratorio').then(m => ({ default: m.Laboratorio })));
const Proveedores = lazy(() => import('./pages/Proveedores').then(m => ({ default: m.Proveedores })));

// Administración & Maestros
const Usuarios = lazy(() => import('./pages/Usuarios').then(m => ({ default: m.Usuarios })));
const Productos = lazy(() => import('./pages/Productos').then(m => ({ default: m.Productos })));
const Reportes = lazy(() => import('./pages/Reportes').then(m => ({ default: m.Reportes })));
const Proyecciones = lazy(() => import('./pages/Proyecciones').then(m => ({ default: m.Proyecciones })));

// Finanzas
const Gastos = lazy(() => import('./pages/Gastos').then(m => ({ default: m.Gastos })));
const Insumos = lazy(() => import('./pages/Insumos').then(m => ({ default: m.Insumos })));

// Componente de Carga
const PageLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
    <span className="text-stone-400 text-sm font-medium animate-pulse">Cargando módulo...</span>
  </div>
);

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
      {/* Notificaciones Toast Globales */}
      <Toaster position="top-center" richColors expand={true} style={{ zIndex: 99999 }} />
      
      <Suspense fallback={<PageLoader />}>
        <Routes>
          
          {/* --- RUTA HÍBRIDA (Accesible siempre) --- */}
          <Route path="/registro" element={<Registro />} />

          {/* --- RUTAS PÚBLICAS (Solo no autenticados) --- */}
          {!isAuthenticated && (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/recuperar" element={<RecuperarPassword />} />
              <Route path="/restablecer-password" element={<RestablecerPassword />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}

          {/* --- RUTAS PRIVADAS (Layout con Sidebar) --- */}
          {isAuthenticated && (
            <Route element={<Layout />}>
              
              {/* RUTA SUPER ADMIN (Sin bloqueo de pago, para que tú entres siempre) */}
              <Route path="/super-admin" element={<SuperAdmin />} />

              {/* --- ZONA DE CLIENTES (Protegida por Pago) --- */}
              {/* Aquí usamos Outlet para renderizar las rutas hijas dentro del Guard */}
                {/* 1. Ruta de Onboarding (Protegida por SetupGuard para redirección inversa) */}
                <Route path="/onboarding" element={
                  <SetupGuard>
                    <Onboarding />
                  </SetupGuard>
                } />

                <Route element={<SetupGuard><Layout /></SetupGuard>}>
                <Route path="/" element={<Dashboard />} />
                
                {/* POS & Caja */}
                <Route element={<ProtectedRoute allowedRoles={['administrador', 'vendedor']} />}>
                  <Route path="/ventas" element={<Ventas />} />
                  <Route path="/cierre-caja" element={<CierreCaja />} />
                  <Route path="/clientes" element={<Clientes />} />
                </Route>

                {/* Producción */}
                <Route element={<ProtectedRoute allowedRoles={['administrador', 'operador', 'tostador']} />}>
                  <Route path="/recepcion" element={<Recepcion />} />
                  <Route path="/trilla" element={<Trilla />} />
                  <Route path="/empaque" element={<Empaque />} />
                  <Route path="/proveedores" element={<Proveedores />} />
                </Route>

                {/* Tueste */}
                <Route element={<ProtectedRoute allowedRoles={['administrador', 'tostador']} />}>
                  <Route path="/tueste" element={<Tueste />} />
                </Route>

                {/* Calidad */}
                <Route element={<ProtectedRoute allowedRoles={['administrador', 'laboratorio']} />}>
                  <Route path="/laboratorio" element={<Laboratorio />} />
                </Route>

                {/* Administración Avanzada */}
                <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
                  <Route path="/usuarios" element={<Usuarios />} />
                  <Route path="/productos" element={<Productos />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="/proyecciones" element={<Proyecciones />} />
                  <Route path="/gastos" element={<Gastos />} />
                  <Route path="/insumos" element={<Insumos />} />
                </Route>

              </Route>

              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          )}

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;