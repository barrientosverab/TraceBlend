import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { getUserProfile } from '../../services/authService'; // <--- Importamos el servicio
import { 
  LayoutDashboard, Truck, FlaskConical, Flame, Package, Users, UserPlus, Settings, ShoppingBag, LogOut, Loader 
} from 'lucide-react';

export function Sidebar() {
  const location = useLocation();
  const [role, setRole] = useState(null); // Estado para el rol
  const [loading, setLoading] = useState(true);

  // Al cargar, preguntamos quién es el usuario
  useEffect(() => {
    async function loadRole() {
      const profile = await getUserProfile();
      if (profile) setRole(profile.role);
      setLoading(false);
    }
    loadRole();
  }, []);

  // DEFINICIÓN DE PERMISOS: ¿Quién puede ver qué?
  const allMenuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['administrador', 'operador', 'tostador', 'vendedor'] },
    { path: '/usuarios', icon: Users, label: 'Usuarios', roles: ['administrador'] },
    { path: '/proveedores', icon: UserPlus, label: 'Proveedores', roles: ['administrador', 'operador'] },
    { path: '/recepcion', icon: Truck, label: 'Recepción', roles: ['administrador', 'operador'] },
    { path: '/laboratorio', icon: FlaskConical, label: 'Laboratorio', roles: ['administrador', 'laboratorio'] },
    { path: '/trilla', icon: Settings, label: 'Trilla', roles: ['administrador', 'operador'] },
    { path: '/tueste', icon: Flame, label: 'Tueste', roles: ['administrador', 'tostador'] },
    { path: '/empaque', icon: Package, label: 'Empaque', roles: ['administrador', 'operador'] },
    { path: '/ventas', icon: ShoppingBag, label: 'Punto de Venta', roles: ['administrador', 'vendedor'] }
  ];

  // Filtramos según el rol actual
  const allowedItems = allMenuItems.filter(item => 
    role === 'administrador' || (role && item.roles.includes(role))
  );

  const handleLogout = async () => {
    if (confirm("¿Salir del sistema?")) await supabase.auth.signOut();
  };

  if (loading) return <div className="w-64 h-screen bg-emerald-900 flex items-center justify-center"><Loader className="text-white animate-spin"/></div>;

  return (
    <aside className="w-64 h-screen bg-emerald-900 text-white flex flex-col shadow-xl transition-all">
      <div className="p-6 border-b border-emerald-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
          <span className="font-bold text-xl text-white">T</span>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wide">Trace Blend</h1>
          <span className="text-xs text-emerald-300 uppercase tracking-wider border border-emerald-700 px-1 rounded">{role || 'Usuario'}</span>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-700">
        {allowedItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                ${isActive 
                  ? 'bg-emerald-800 text-white shadow-md translate-x-1 border-l-4 border-emerald-400' 
                  : 'text-emerald-100 hover:bg-emerald-800/50 hover:text-white'
                }
              `}
            >
              <Icon size={20} className={isActive ? "text-emerald-400" : "group-hover:text-emerald-300 transition-colors"} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-emerald-800 bg-emerald-950/30">
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-emerald-200 hover:bg-red-900/80 hover:text-white transition-all duration-200 group">
          <LogOut size={20} className="group-hover:text-red-200" />
          <span className="font-medium">Salir</span>
        </button>
      </div>
    </aside>
  );
}