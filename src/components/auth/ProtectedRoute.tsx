import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  allowedRoles?: string[]; // Array opcional de roles permitidos
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // 1. Si no está logueado -> Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si hay roles restringidos y el usuario no tiene el rol adecuado -> Dashboard (o 403)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Si es un intento de acceso no autorizado, lo mandamos al home
    return <Navigate to="/" replace />;
  }

  // 3. Acceso concedido -> Renderizar la ruta hija
  return <Outlet />;
};
