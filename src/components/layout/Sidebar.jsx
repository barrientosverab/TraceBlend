import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck,  
  FlaskConical, 
  Flame, 
  Package, 
  Users 
} from 'lucide-react'; // Importamos íconos bonitos

export function Sidebar() {
  const location = useLocation(); // Para saber en qué página estamos

  // Definimos las rutas del sistema basándonos en tu Diagrama ER
  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/recepcion', icon: Truck, label: 'Recepción (Compras)' },
    { path: '/laboratorio', icon: FlaskConical, label: 'Laboratorio y Calidad' },
    { path: '/tueste', icon: Flame, label: 'Producción Tueste' },
    { path: '/inventario', icon: Package, label: 'Inventario General' },
    { path: '/clientes', icon: Users, label: 'Gestión Clientes' },
  ];

  return (
    <aside className="w-64 h-screen bg-emerald-900 text-white flex flex-col shadow-xl">
      {/* Header del Menú */}
      <div className="p-6 border-b border-emerald-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <span className="font-bold text-xl">T</span>
        </div>
        <h1 className="text-xl font-bold tracking-wide">Trace Blend</h1>
      </div>

      {/* Lista de Navegación */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          // Verificamos si esta es la ruta activa para pintarla diferente
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

      {/* Footer del Menú */}
      <div className="p-4 border-t border-emerald-800 text-xs text-emerald-300 text-center">
        v1.0.0 - Nov 2025
      </div>
    </aside>
  );
}