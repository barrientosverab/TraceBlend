import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

// 1. Definimos qué propiedades puede recibir el Layout
interface LayoutProps {
  children?: React.ReactNode; // El "?" significa que es opcional
}

// 2. Recibimos "children" en las props
export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen w-full bg-stone-50 overflow-hidden">
      {/* Barra Lateral */}
      <Sidebar />

      {/* Contenido Principal */}
      <main className="flex-1 h-full overflow-y-auto relative flex flex-col">
        {/* LÓGICA FLEXIBLE: */}
        {/* Si le pasamos un hijo directo (como en SuperAdmin), renderiza eso. */}
        {/* Si no (como en Dashboard), usa el Outlet del Router. */}
        {children || <Outlet />}
      </main>
    </div>
  );
};
