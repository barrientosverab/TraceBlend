import { Suspense, lazy } from 'react';
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
const CambiarPassword = lazy(() => import('./pages/CambiarPassword').then(m => ({ default: m.CambiarPassword })));

// Super Admin (SaaS)
const SuperAdmin = lazy(() => import('./pages/SuperAdmin').then(m => ({ default: m.SuperAdmin })));

// Núcleo
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));

// Ventas & Caja
const Ventas = lazy(() => import('./pages/Ventas').then(m => ({ default: m.Ventas })));
const CierreCaja = lazy(() => import('./pages/CierreCaja').then(m => ({ default: m.CierreCaja })));
const HistorialCierres = lazy(() => import('./pages/HistorialCierres').then(m => ({ default: m.HistorialCierres })));
const Clientes = lazy(() => import('./pages/Clientes').then(m => ({ default: m.Clientes })));

// Administración & Maestros
const Usuarios = lazy(() => import('./pages/Usuarios').then(m => ({ default: m.Usuarios })));
const Productos = lazy(() => import('./pages/Productos').then(m => ({ default: m.Productos })));
const Reportes = lazy(() => import('./pages/Reportes').then(m => ({ default: m.Reportes })));
const ReporteVentasDia = lazy(() => import('./pages/ReporteVentasDia').then(m => ({ default: m.ReporteVentasDia })));

// Finanzas
const Gastos = lazy(() => import('./pages/Gastos').then(m => ({ default: m.Gastos })));
const Insumos = lazy(() => import('./pages/Insumos').then(m => ({ default: m.Insumos })));
const PuntoEquilibrio = lazy(() => import('./pages/PuntoEquilibrio').then(m => ({ default: m.PuntoEquilibrio })));

// Componente de Carga
const PageLoader = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-stone-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
    <span className="text-stone-400 text-sm font-medium animate-pulse">Cargando módulo...</span>
  </div>
);

function App() {
  const { isAuthenticated, profile, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <BrowserRouter>
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

          {/* --- RUTAS PRIVADAS --- */}
          {isAuthenticated && (
            <>
              {/* ONBOARDING: Requiere usuario autenticado, NO requiere organización */}
              <Route path="/onboarding" element={
                profile && profile.organization_id
                  ? <Navigate to="/" replace />
                  : <Onboarding />
              } />

              {/* SUPER ADMIN */}
              <Route path="/super-admin" element={<Layout><SuperAdmin /></Layout>} />

              {/* CAMBIAR CONTRASEÑA */}
              <Route path="/cambiar-password" element={<Layout><CambiarPassword /></Layout>} />

              {/* --- ZONA DE CLIENTES (Protegida por Suscripción) --- */}
              <Route element={<SubscriptionGuard><Outlet /></SubscriptionGuard>}>
                <Route element={<SetupGuard><Layout /></SetupGuard>}>
                  <Route path="/" element={<PermissionGuard feature="dashboard"><Dashboard /></PermissionGuard>} />

                  {/* POS & Caja — admin + cashier */}
                  <Route element={<ProtectedRoute allowedRoles={['admin', 'cashier']} />}>
                    <Route path="/ventas" element={<PermissionGuard feature="pos"><Ventas /></PermissionGuard>} />
                    <Route path="/cierre-caja" element={<PermissionGuard feature="cash_close"><CierreCaja /></PermissionGuard>} />
                    <Route path="/clientes" element={<PermissionGuard feature="crm"><Clientes /></PermissionGuard>} />
                  </Route>

                  {/* Administración — admin only */}
                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/usuarios" element={<PermissionGuard feature="team"><Usuarios /></PermissionGuard>} />
                    <Route path="/productos" element={<PermissionGuard feature="catalog"><Productos /></PermissionGuard>} />
                    <Route path="/reportes" element={<PermissionGuard feature="reports"><Reportes /></PermissionGuard>} />
                    <Route path="/reporte-ventas-dia" element={<PermissionGuard feature="reports"><ReporteVentasDia /></PermissionGuard>} />
                    <Route path="/punto-equilibrio" element={<PermissionGuard feature="finance"><PuntoEquilibrio /></PermissionGuard>} />
                    <Route path="/gastos" element={<PermissionGuard feature="finance"><Gastos /></PermissionGuard>} />
                    <Route path="/insumos" element={<PermissionGuard feature="inventory"><Insumos /></PermissionGuard>} />
                    <Route path="/cierres-historico" element={<PermissionGuard feature="cash_close"><HistorialCierres /></PermissionGuard>} />
                  </Route>
                </Route>

              </Route>

              {/* Redirección: usuario sin org → onboarding; con org → dashboard */}
              <Route path="*" element={
                profile && !profile.organization_id
                  ? <Navigate to="/onboarding" replace />
                  : <Navigate to="/" replace />
              } />

            </>
          )}

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
