import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSubscriptionAccess } from '../../hooks/useSubscriptionAccess';
import {
  LayoutDashboard, ShoppingBag, Users, Settings, LogOut,
  Menu, X, Coffee, Calculator, UserPlus,
  Truck, FlaskConical, Flame, Package, Archive, DollarSign, List, TrendingUp,
  Shield, Percent
} from 'lucide-react';

const SUPER_ADMIN_EMAIL = "barrientosverab@gmail.com";

const MENU_GROUPS = [
  {
    title: 'Principal',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['all'], feature: 'dashboard' },
      { path: '/ventas', icon: ShoppingBag, label: 'Punto de Venta', roles: ['administrador', 'vendedor'], feature: 'pos' },
      { path: '/cierre-caja', icon: Calculator, label: 'Cierre de Caja', roles: ['administrador', 'vendedor'], feature: 'cash_close' },
    ]
  },
  {
    title: 'Producción',
    items: [
      { path: '/recepcion', icon: Truck, label: 'Recepción MP', roles: ['administrador', 'operador'], feature: 'reception' },
      { path: '/trilla', icon: Settings, label: 'Trilla', roles: ['administrador', 'operador'], feature: 'milling' },
      { path: '/tueste', icon: Flame, label: 'Tueste', roles: ['administrador', 'tostador'], feature: 'roasting' },
      { path: '/laboratorio', icon: FlaskConical, label: 'Laboratorio', roles: ['administrador', 'laboratorio'], feature: 'laboratory' },
      { path: '/empaque', icon: Package, label: 'Empaque', roles: ['administrador', 'operador'], feature: 'packaging' },
    ]
  },
  {
    title: 'Gestión',
    items: [
      { path: '/gastos', icon: DollarSign, label: 'Finanzas', roles: ['administrador'], feature: 'finance' },
      { path: '/insumos', icon: List, label: 'Inventario Insumos', roles: ['administrador'], feature: 'inventory' },
      { path: '/productos', icon: Package, label: 'Catálogo Maestro', roles: ['administrador'], feature: 'catalog' },
      // { path: '/proyecciones', icon: TrendingUp, label: 'Simulador ROI', roles: ['administrador'], feature: 'projections' }, // OCULTO PARA LANZAMIENTO
    ]
  },
  {
    title: 'Director',
    items: [
      { path: '/usuarios', icon: Users, label: 'Equipo', roles: ['administrador'], feature: 'team' },
      { path: '/clientes', icon: UserPlus, label: 'CRM Clientes', roles: ['administrador', 'vendedor'], feature: 'crm' },
      { path: '/proveedores', icon: Truck, label: 'Proveedores', roles: ['administrador'], feature: 'suppliers' },
      { path: '/reportes', icon: Archive, label: 'Reportes', roles: ['administrador'], feature: 'reports' },
      // { path: '/promociones', icon: Percent, label: 'Promociones', roles: ['administrador'], feature: 'promotions' }, // OCULTO PARA LANZAMIENTO
    ]
  }
];

export function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const userRole = profile?.role || 'viewer';

  // Obtener información de suscripción (sin feature específica)
  const { subscription, loading } = useSubscriptionAccess();
  const availableFeatures = new Set(subscription?.available_features || []);

  // DEBUG: Log subscription data
  console.log('[Sidebar] DEBUG - Subscription:', subscription);
  console.log('[Sidebar] DEBUG - Loading:', loading);
  console.log('[Sidebar] DEBUG - Available Features:', Array.from(availableFeatures));
  console.log('[Sidebar] DEBUG - User Role:', userRole);

  // Verificamos si es Super Admin
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  /**
   * Verifica si el usuario tiene permiso basado en:
   * 1. Si es Super Admin → Acceso total (bypass de features)
   * 2. El plan de suscripción de la organización (features disponibles)
   * 3. El rol del usuario
   */
  const hasPermission = (roles: string[], feature?: string) => {
    // Super Admin tiene acceso total sin restricciones
    if (isSuperAdmin) {
      return true;
    }

    // Para usuarios normales, verificar si el plan incluye la feature
    // o si se encuentra en un periodo de prueba gratis activo.
    if (feature && !subscription?.is_trial_active && !availableFeatures.has(feature)) {
      console.log(`[Sidebar] DEBUG - Feature '${feature}' NOT in availableFeatures`);
      return false; // El plan no incluye esta feature
    }

    // Luego verificar el rol del usuario
    const hasRole = roles.includes('all') || roles.includes(userRole);
    console.log(`[Sidebar] DEBUG - Feature '${feature}' - hasRole: ${hasRole}`);
    return hasRole;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-stone-900 text-white rounded-lg shadow-lg hover:bg-black transition-colors"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
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
                <Shield size={10} /> Modo Dios
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
            const visibleItems = group.items.filter(item => hasPermission(item.roles, item.feature));
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

          {/* Cambiar Contraseña */}
          <Link
            to="/cambiar-password"
            onClick={() => setIsOpen(false)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-stone-400 hover:bg-stone-800 hover:text-emerald-400 transition-colors text-xs font-bold uppercase tracking-wider mb-2"
          >
            <Settings size={14} /> Cambiar Contraseña
          </Link>

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