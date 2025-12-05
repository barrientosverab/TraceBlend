import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Mail, CheckCircle, Edit2, AlertCircle, Copy 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUsuarios, actualizarRol, invitarUsuario } from '../services/usuariosService';
import { toast } from 'sonner';

export function Usuarios() {
  const { orgId, user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', nombre: '', rol: 'operador' });
  const [successInfo, setSuccessInfo] = useState(null); // Para mostrar la contraseña temp

  useEffect(() => {
    if (orgId) cargarUsuarios();
  }, [orgId]);

  const cargarUsuarios = async () => {
    setLoading(true);
    try {
      const data = await getUsuarios(orgId);
      setUsuarios(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteData.email || !inviteData.nombre) return toast.error('Datos incompletos');
    
    try {
      const res = await invitarUsuario(inviteData, orgId);
      
      // Mostrar éxito y contraseña temporal
      setSuccessInfo({
        email: inviteData.email,
        password: res.tempPassword
      });
      
      setShowInvite(false);
      setInviteData({ email: '', nombre: '', rol: 'operador' });
      cargarUsuarios(); // Recargar lista
    } catch (e) {
      toast.error('No se pudo enviar la invitación', { description: e.message });
    }
  };

  const handleRoleChange = (userId, newRole) => {
    // Lanzamos el Toast de confirmación
    toast(`¿Deseas cambiar el rol a "${newRole}"?`, {
      description: "El usuario tendrá nuevos permisos en el sistema.",
      action: {
        label: 'Confirmar Cambio',
        onClick: async () => {
          // --- AQUÍ SE MUEVE TU LÓGICA ---
          try {
            await actualizarRol(userId, newRole);
            await cargarUsuarios(); // Esperamos a que recargue para ver el cambio
            toast.success(`Rol actualizado a ${newRole}`);
          } catch (e) {
            toast.error("Error al actualizar rol", { description: e.message });
          }
          // -------------------------------
        },
      },
      cancel: {
        label: 'Cancelar',
      },
      duration: 5000, // Tiempo para decidir
    });
  };

  if (loading) return <div className="p-8 text-center text-stone-400">Cargando equipo...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-2">
            <Users className="text-emerald-600"/> Gestión de Equipo
          </h1>
          <p className="text-stone-500">Administra el acceso y roles de tus colaboradores.</p>
        </div>
        <button 
          onClick={() => setShowInvite(true)} 
          className="bg-stone-900 hover:bg-black text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <UserPlus size={18}/> Invitar Usuario
        </button>
      </div>

      {/* FEEDBACK DE ÉXITO (Contraseña Temporal) */}
      {successInfo && (
        <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-emerald-600 mt-1" size={24}/>
            <div>
              <h3 className="font-bold text-emerald-800 text-lg">¡Invitación Creada con Éxito!</h3>
              <p className="text-emerald-700 text-sm">
                El usuario <b>{successInfo.email}</b> ha sido registrado. Comparte estas credenciales con él:
              </p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-emerald-100 flex items-center justify-between shadow-sm">
            <div className="font-mono text-stone-600">
              <span className="text-stone-400 select-none">Password: </span> 
              <span className="font-bold text-lg text-stone-900 bg-stone-100 px-2 py-1 rounded">{successInfo.password}</span>
            </div>
            <button 
              onClick={() => {navigator.clipboard.writeText(successInfo.password); toast.success('Contraseña copiada');}}
              className="text-emerald-600 hover:bg-emerald-50 p-2 rounded flex gap-1 items-center text-xs font-bold"
            >
              <Copy size={14}/> Copiar
            </button>
          </div>
          
          <div className="flex justify-end">
            <button onClick={() => setSuccessInfo(null)} className="text-sm font-bold text-emerald-700 hover:underline">Cerrar</button>
          </div>
        </div>
      )}

      {/* TABLA DE USUARIOS */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50 text-stone-500 text-xs font-bold uppercase">
            <tr>
              <th className="p-4">Usuario</th>
              <th className="p-4">Email</th>
              <th className="p-4">Rol</th>
              <th className="p-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-sm">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-stone-50">
                <td className="p-4 font-bold text-stone-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold">
                    {u.first_name ? u.first_name[0] : 'U'}
                  </div>
                  {u.first_name || 'Sin Nombre'}
                  {u.email === user?.email && <span className="text-[10px] bg-stone-100 px-1 rounded border border-stone-200">Tú</span>}
                </td>
                <td className="p-4 text-stone-500 font-mono text-xs">{u.email}</td>
                <td className="p-4">
                  <select 
                    className={`
                      p-1 rounded text-xs font-bold border outline-none cursor-pointer
                      ${u.role === 'administrador' ? 'bg-purple-50 text-purple-700 border-purple-100' : ''}
                      ${u.role === 'operador' ? 'bg-blue-50 text-blue-700 border-blue-100' : ''}
                      ${u.role === 'tostador' ? 'bg-orange-50 text-orange-700 border-orange-100' : ''}
                      ${u.role === 'vendedor' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : ''}
                    `}
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={u.email === user?.email} // No puedes cambiar tu propio rol
                  >
                    <option value="administrador">Administrador</option>
                    <option value="operador">Operador</option>
                    <option value="tostador">Tostador</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="laboratorio">Laboratorio</option>
                  </select>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                    <CheckCircle size={12}/> Activo
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL INVITAR */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
              <Mail className="text-emerald-600"/> Invitar Colaborador
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">Nombre</label>
                <input 
                  className="w-full p-2 border rounded mt-1" 
                  placeholder="Ej: Juan Pérez"
                  value={inviteData.nombre}
                  onChange={e => setInviteData({...inviteData, nombre: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">Correo Electrónico</label>
                <input 
                  className="w-full p-2 border rounded mt-1" 
                  placeholder="juan@empresa.com"
                  type="email"
                  value={inviteData.email}
                  onChange={e => setInviteData({...inviteData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase">Rol Inicial</label>
                <select 
                  className="w-full p-2 border rounded mt-1 bg-white"
                  value={inviteData.rol}
                  onChange={e => setInviteData({...inviteData, rol: e.target.value})}
                >
                  <option value="operador">Operador (General)</option>
                  <option value="tostador">Tostador (Producción)</option>
                  <option value="vendedor">Vendedor (POS)</option>
                  <option value="laboratorio">Catador (Calidad)</option>
                  <option value="administrador">Administrador (Total)</option>
                </select>
              </div>
              
              <div className="bg-amber-50 p-3 rounded text-amber-800 text-xs flex gap-2">
                <AlertCircle size={16} className="shrink-0"/>
                <p>Se creará una contraseña temporal que deberás compartir con el usuario.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowInvite(false)} className="flex-1 py-2 text-stone-500 hover:bg-stone-100 rounded-lg font-bold">Cancelar</button>
              <button onClick={handleInvite} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold">Enviar Invitación</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}