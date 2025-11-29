import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient'; // Importamos Supabase para hacer logout
import { 
  LayoutDashboard, 
  Truck, 
  FlaskConical, 
  Flame, 
  Package, 
  Users,
  UserPlus,
  Settings,
  LogOut // Nuevo ícono para salir
} from 'lucide-react';

export function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/proveedores', icon: UserPlus, label: 'Proveedores' },
    { path: '/recepcion', icon: Truck, label: 'Recepción (Lotes)' },
    { path: '/laboratorio', icon: FlaskConical, label: 'Laboratorio' },
    { path: '/trilla', icon: Settings, label: 'Trilla y Clasificación' },
    { path: '/tueste', icon: Flame, label: 'Producción Tueste' },
    { path: '/inventario', icon: Package, label: 'Bodega Oro Verde' },
    { path: '/clientes', icon: Users, label: 'Gestión Clientes' },
  ];

  // Función para cerrar sesión
  const handleLogout = async () => {
    if (confirm("¿Estás seguro de que quieres salir?")) {
      await supabase.auth.signOut();
      // App.jsx detectará el cambio y te mandará al Login automáticamente
    }
  };

  return (
    <aside className="w-64 h-screen bg-emerald-900 text-white flex flex-col shadow-xl">
      <div className="p-6 border-b border-emerald-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <span className="font-bold text-xl">T</span>
        </div>
        <h1 className="text-xl font-bold tracking-wide">Trace Blend</h1>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-emerald-700 text-white shadow-md translate-x-1' 
                  : 'text-emerald-100 hover:bg-emerald-800 hover:text-white'
                }
              `}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Botón de Logout en el pie del Sidebar */}
      <div className="p-4 border-t border-emerald-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-emerald-200 hover:bg-red-900/50 hover:text-red-200 transition-all duration-200 group"
        >
          <LogOut size={20} className="group-hover:text-red-200" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
        <div className="mt-4 text-xs text-emerald-500 text-center opacity-60">
          v1.5.0 - Producción
        </div>
      </div>
    </aside>
  );
}