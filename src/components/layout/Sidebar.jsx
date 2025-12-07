import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, ShoppingBag, Users, Settings, LogOut, 
  Menu, X, Coffee, ClipboardCheck, Factory, Calculator, UserPlus, Truck, FlaskConical, Flame, Package, Archive// Iconos
} from 'lucide-react';

export function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // Estado para abrir/cerrar menú móvil

  // Definición de Menús (Igual que antes)
 const allMenuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['administrador', 'operador', 'tostador', 'vendedor'] },
    { path: '/cierre-caja', icon: Calculator, label: 'Cierre de Caja', roles: ['administrador', 'vendedor'] },
    { path: '/usuarios', icon: Users, label: 'Usuarios', roles: ['administrador'] },
    { path: '/proveedores', icon: UserPlus, label: 'Proveedores', roles: ['administrador', 'operador'] },
    { path: '/recepcion', icon: Truck, label: 'Recepción', roles: ['administrador', 'operador'] },
    { path: '/laboratorio', icon: FlaskConical, label: 'Laboratorio', roles: ['administrador', 'laboratorio'] },
    { path: '/trilla', icon: Settings, label: 'Trilla', roles: ['administrador', 'operador'] },
    { path: '/proyecciones', icon: Calculator, label: 'Simulador ROI', roles: ['administrador', 'tostador'] },
    { path: '/tueste', icon: Flame, label: 'Tueste', roles: ['administrador', 'tostador'] },
    { path: '/empaque', icon: Package, label: 'Empaque', roles: ['administrador', 'operador'] },
    { path: '/ventas', icon: ShoppingBag, label: 'Punto de Venta', roles: ['administrador', 'vendedor'] },
    { path: '/clientes', icon: Users, label: 'Clientes CRM', roles: ['administrador', 'vendedor'] },
    { path: '/productos', icon: Package, label: 'Catálogo', roles: ['administrador'] },
    { path: '/reportes', icon: Archive, label: 'Reportes', roles: ['administrador'] }
  ];

  const userRole = profile?.role || 'vendedor';
  const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

  return (
    <>
      {/* 1. BOTÓN HAMBURGUESA (Solo visible en Móvil 'md:hidden') */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-stone-900 text-white rounded-lg shadow-lg hover:bg-stone-800 transition-colors"
      >
        {isOpen ? <X size={24}/> : <Menu size={24}/>}
      </button>

      {/* 2. FONDO OSCURO (Backdrop) - Para cerrar al tocar fuera */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 3. EL SIDEBAR REAL */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-stone-900 text-stone-300 flex flex-col h-screen
        transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
      `}>
        
        {/* Logo */}
        <div className="p-6 border-b border-stone-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <Coffee size={20} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Trace Blend</h1>
        </div>

        {/* Lista de Menú */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)} // Cerrar menú al hacer clic
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 font-medium' 
                        : 'hover:bg-stone-800 hover:text-white'}
                    `}
                  >
                    <item.icon size={20} className={isActive ? 'animate-pulse' : ''} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer Usuario */}
        <div className="p-4 border-t border-stone-800 bg-stone-900/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-stone-700 flex items-center justify-center text-stone-400 font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{profile?.first_name || 'Usuario'}</p>
              <p className="text-xs text-stone-500 capitalize">{userRole}</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-stone-400 hover:bg-red-500/10 hover:text-red-500 transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}
 