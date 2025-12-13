import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar'; // Asegúrate de que Sidebar ya sea .tsx

export const Layout = () => {
  return (
    <div className="flex h-screen w-full bg-stone-50 overflow-hidden">
      {/* Barra Lateral */}
      <Sidebar />

      {/* Contenido Principal */}
      <main className="flex-1 h-full overflow-y-auto relative flex flex-col">
        {/* Outlet renderiza la página hija correspondiente (Dashboard, Ventas, etc.) */}
        <Outlet />
      </main>
    </div>
  );
};