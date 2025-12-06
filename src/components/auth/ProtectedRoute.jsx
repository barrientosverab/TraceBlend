// src/components/auth/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'sonner';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { role, loading } = useAuth();

  if (loading) return null; // Esperamos a saber quién es

  // Si el rol del usuario NO está en la lista permitida...
  if (!allowedRoles.includes(role)) {
    // 1. Notificamos el intento fallido
    // Usamos setTimeout para evitar conflictos de renderizado con el redirect
    setTimeout(() => {
        toast.error("Acceso Denegado", {
            description: "No tienes permisos para ver esta sección."
        });
    }, 0);
    
    // 2. Lo mandamos de vuelta al Dashboard
    return <Navigate to="/" replace />;
  }

  // Si tiene permiso, renderizamos el contenido (hijos o Outlet)
  return children ? children : <Outlet />;
};