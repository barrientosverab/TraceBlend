import React, { Suspense, lazy } from 'react';
// CORRECCIÓN: Agregamos 'Outlet' a la lista de imports
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './hooks/useAuth';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SubscriptionGuard } from './components/auth/SubscriptionGuard';
import { SetupGuard } from './components/auth/SetupGuard';
import { PermissionGuard } from './components/auth/PermissionGuard';

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
const HistorialCierres = lazy(() => import('./pages/HistorialCierres').then(m => ({ default: m.HistorialCierres })));
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
const Promociones = lazy(() => import('./pages/Promociones').then(m => ({ default: m.Promociones })));

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
            <>
              {/* RUTA SUPER ADMIN (Sin bloqueo de pago, para que tú entres siempre) */}
              <Route path="/super-admin" element={<Layout><SuperAdmin /></Layout>} />

              {/* --- ZONA DE CLIENTES (Protegida por Pago) --- */}
              {/* Aquí usamos Outlet para renderizar las rutas hijas dentro del Guard */}
              <Route element={<SubscriptionGuard><Outlet /></SubscriptionGuard>}>
                {/* 1. Ruta de Onboarding (Protegida por SetupGuard para redirección inversa) */}
                <Route path="/onboarding" element={
                  <SetupGuard>
                    <Onboarding />
                  </SetupGuard>
                } />

                <Route element={<SetupGuard><Layout /></SetupGuard>}>
                  <Route path="/" element={<PermissionGuard feature="dashboard"><Dashboard /></PermissionGuard>} />

                  {/* POS & Caja */}
                  <Route element={<ProtectedRoute allowedRoles={['administrador', 'vendedor']} />}>
                    <Route path="/ventas" element={<PermissionGuard feature="pos"><Ventas /></PermissionGuard>} />
                    <Route path="/cierre-caja" element={<PermissionGuard feature="cash_close"><CierreCaja /></PermissionGuard>} />
                    <Route path="/clientes" element={<PermissionGuard feature="crm"><Clientes /></PermissionGuard>} />
                  </Route>

                  {/* Producción */}
                  <Route element={<ProtectedRoute allowedRoles={['administrador', 'operador', 'tostador']} />}>
                    <Route path="/recepcion" element={<PermissionGuard feature="reception"><Recepcion /></PermissionGuard>} />
                    <Route path="/trilla" element={<PermissionGuard feature="milling"><Trilla /></PermissionGuard>} />
                    <Route path="/empaque" element={<PermissionGuard feature="packaging"><Empaque /></PermissionGuard>} />
                    <Route path="/proveedores" element={<PermissionGuard feature="suppliers"><Proveedores /></PermissionGuard>} />
                  </Route>

                  {/* Tueste */}
                  <Route element={<ProtectedRoute allowedRoles={['administrador', 'tostador']} />}>
                    <Route path="/tueste" element={<PermissionGuard feature="roasting"><Tueste /></PermissionGuard>} />
                  </Route>

                  {/* Calidad */}
                  <Route element={<ProtectedRoute allowedRoles={['administrador', 'laboratorio']} />}>
                    <Route path="/laboratorio" element={<PermissionGuard feature="laboratory"><Laboratorio /></PermissionGuard>} />
                  </Route>

                  {/* Administración Avanzada */}
                  <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
                    <Route path="/usuarios" element={<PermissionGuard feature="team"><Usuarios /></PermissionGuard>} />
                    <Route path="/productos" element={<PermissionGuard feature="catalog"><Productos /></PermissionGuard>} />
                    <Route path="/reportes" element={<PermissionGuard feature="reports"><Reportes /></PermissionGuard>} />
                    <Route path="/proyecciones" element={<PermissionGuard feature="projections"><Proyecciones /></PermissionGuard>} />
                    <Route path="/gastos" element={<PermissionGuard feature="finance"><Gastos /></PermissionGuard>} />
                    <Route path="/insumos" element={<PermissionGuard feature="inventory"><Insumos /></PermissionGuard>} />
                    <Route path="/promociones" element={<PermissionGuard feature="promotions"><Promociones /></PermissionGuard>} />
                    <Route path="/cierres-historico" element={<PermissionGuard feature="cash_close"><HistorialCierres /></PermissionGuard>} />
                  </Route>
                </Route> {/* Fin del Layout+SetupGuard */}

              </Route>

              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </>
          )}

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;