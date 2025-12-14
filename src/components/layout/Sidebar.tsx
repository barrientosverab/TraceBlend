import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, ShoppingBag, Users, Settings, LogOut, 
  Menu, X, Coffee, Calculator, UserPlus, 
  Truck, FlaskConical, Flame, Package, Archive, DollarSign, List, TrendingUp,
  Shield // <--- NUEVO IMPORT
} from 'lucide-react';

// TU EMAIL DE SUPER ADMIN (Debe coincidir con el de SuperAdmin.tsx)
const SUPER_ADMIN_EMAIL = "barrientosverab@gmail.com"; 

const MENU_GROUPS = [
  {
    title: 'Principal',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['all'] },
      { path: '/ventas', icon: ShoppingBag, label: 'Punto de Venta', roles: ['administrador', 'vendedor'] },
      { path: '/cierre-caja', icon: Calculator, label: 'Cierre de Caja', roles: ['administrador', 'vendedor'] },
    ]
  },
  {
    title: 'Producción',
    items: [
      { path: '/recepcion', icon: Truck, label: 'Recepción MP', roles: ['administrador', 'operador'] },
      { path: '/trilla', icon: Settings, label: 'Trilla', roles: ['administrador', 'operador'] },
      { path: '/tueste', icon: Flame, label: 'Tueste', roles: ['administrador', 'tostador'] },
      { path: '/laboratorio', icon: FlaskConical, label: 'Laboratorio', roles: ['administrador', 'laboratorio'] },
      { path: '/empaque', icon: Package, label: 'Empaque', roles: ['administrador', 'operador'] },
    ]
  },
  {
    title: 'Gestión',
    items: [
      { path: '/gastos', icon: DollarSign, label: 'Finanzas', roles: ['administrador'] },
      { path: '/insumos', icon: List, label: 'Inventario Insumos', roles: ['administrador'] },
      { path: '/productos', icon: Package, label: 'Catálogo Maestro', roles: ['administrador'] },
      { path: '/proyecciones', icon: TrendingUp, label: 'Simulador ROI', roles: ['administrador'] },
    ]
  },
  {
    title: 'Director',
    items: [
      { path: '/usuarios', icon: Users, label: 'Equipo', roles: ['administrador'] },
      { path: '/clientes', icon: UserPlus, label: 'CRM Clientes', roles: ['administrador', 'vendedor'] },
      { path: '/proveedores', icon: Truck, label: 'Proveedores', roles: ['administrador'] },
      { path: '/reportes', icon: Archive, label: 'Reportes', roles: ['administrador'] },
    ]
  }
];

export function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const userRole = profile?.role || 'viewer';

  const hasPermission = (roles: string[]) => {
    return roles.includes('all') || roles.includes(userRole);
  };

  // Verificamos si es Super Admin
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-stone-900 text-white rounded-lg shadow-lg hover:bg-black transition-colors"
      >
        {isOpen ? <X size={24}/> : <Menu size={24}/>}
      </button>

      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />}

      <div className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-stone-900 text-stone-300 flex flex-col h-screen
        transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
      `}>
        
        {/* LOGO CORPORATIVO */}
        <div className="p-6 border-b border-stone-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-900/50">
            <Coffee size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">Trace Blend</h1>
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">ERP System</span>
          </div>
        </div>

        {/* NAVEGACIÓN CON SCROLL ESTILIZADO */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-stone-700 hover:scrollbar-thumb-emerald-600 transition-colors">
          
          {/* --- BOTÓN ESPECIAL SUPER ADMIN --- */}
          {isSuperAdmin && (
            <div className="mb-6">
               <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3 px-3 flex items-center gap-1">
                 <Shield size={10}/> Modo Dios
               </h3>
               <ul>
                 <li>
                    <Link
                      to="/super-admin"
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm font-bold
                        ${location.pathname === '/super-admin' 
                          ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' 
                          : 'hover:bg-stone-800 hover:text-white text-emerald-200/70'}
                      `}
                    >
                      <Shield size={18} />
                      <span>Panel Maestro</span>
                    </Link>
                 </li>
               </ul>
               <div className="mx-3 mt-4 border-b border-stone-800"></div>
            </div>
          )}

          {/* MENÚS NORMALES */}
          {MENU_GROUPS.map((group, groupIdx) => {
            const visibleItems = group.items.filter(item => hasPermission(item.roles));
            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx}>
                <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3 px-3">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={() => setIsOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-sm font-medium
                            ${isActive 
                              ? 'bg-stone-800 text-emerald-400 border-l-2 border-emerald-500' 
                              : 'hover:bg-stone-800 hover:text-white border-l-2 border-transparent'}
                          `}
                        >
                          <item.icon size={18} className={isActive ? 'text-emerald-400' : 'text-stone-500 group-hover:text-amber-500 transition-colors'} />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* PIE DE PÁGINA (USUARIO) */}
        <div className="p-4 border-t border-stone-800 bg-stone-950">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center text-emerald-100 font-bold border border-emerald-700">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{profile?.first_name || 'Usuario'}</p>
              <p className="text-[10px] text-stone-500 uppercase tracking-wide">{userRole}</p>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-stone-400 hover:bg-stone-800 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-wider"
          >
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}