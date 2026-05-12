import { useState, useEffect } from 'react';
import { Users, UserPlus, CheckCircle, Copy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUsuarios, actualizarRol, invitarUsuario, InvitacionData } from '../services/usuariosService';
import { toast } from 'sonner';

// Definimos la interfaz localmente para tipar el estado
interface UsuarioItem {
  id: string;
  email: string | null;
  first_name: string | null;
  role: string;
  organization_id: string | null;
}

export function Usuarios() {
  const { orgId, user } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState<InvitacionData>({ email: '', nombre: '', rol: 'cashier' });
  const [successInfo, setSuccessInfo] = useState<{email: string, password: string} | null>(null);

  useEffect(() => {
    if (orgId) {
      getUsuarios(orgId).then(data => {
        const safeData = data.map((u: any) => ({
          id: u.id,
          email: u.email,
          first_name: u.first_name,
          role: u.role,
          organization_id: u.organization_id
        }));
        setUsuarios(safeData);
        setLoading(false);
      });
    }
  }, [orgId]);

  const handleInvite = async () => {
    if (!orgId) return;
    try {
      const res = await invitarUsuario(inviteData, orgId);
      if (res) {
        setSuccessInfo({ email: inviteData.email, password: res.tempPassword });
        setShowInvite(false);
        setInviteData({ email: '', nombre: '', rol: 'cashier' });
        const u = await getUsuarios(orgId);
        setUsuarios(u as UsuarioItem[]);
      }
    } catch (e: any) {
      toast.error('Error al invitar', { description: e.message });
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    toast(`¿Cambiar rol a "${newRole}"?`, {
      action: {
        label: 'Confirmar',
        onClick: async () => {
          try {
            await actualizarRol(userId, newRole);
            const u = await getUsuarios(orgId!);
            setUsuarios(u as UsuarioItem[]);
            toast.success("Rol actualizado");
          } catch (e: any) { toast.error(e.message); }
        }
      },
      cancel: { 
        label: 'Cancelar',
        // ✅ CORRECCIÓN: Añadimos una función vacía para cumplir con el tipo Action
        onClick: () => {} 
      }
    });
  };

  if (loading) return <div className="p-8 text-center text-stone-400">Cargando equipo...</div>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 flex items-center gap-2">
            <Users className="text-emerald-600"/> Gestión de Equipo
          </h1>
          <p className="text-stone-500">Administra el acceso y roles.</p>
        </div>
        <button onClick={() => setShowInvite(true)} className="bg-stone-900 hover:bg-black text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
          <UserPlus size={18}/> Invitar Usuario
        </button>
      </div>

      {/* FEEDBACK ÉXITO */}
      {successInfo && (
        <div className="mb-8 bg-emerald-50 border border-emerald-200 rounded-xl p-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle className="text-emerald-600 mt-1" size={24}/>
            <div>
              <h3 className="font-bold text-emerald-800 text-lg">Invitación Creada</h3>
              <p className="text-emerald-700 text-sm">Entrega estas credenciales al usuario:</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-emerald-100 flex justify-between items-center">
            <code className="text-stone-700 font-mono text-lg">{successInfo.password}</code>
            <button onClick={() => navigator.clipboard.writeText(successInfo.password)} className="text-emerald-600 text-xs font-bold flex items-center gap-1 hover:underline">
              <Copy size={14}/> Copiar
            </button>
          </div>
          <button onClick={() => setSuccessInfo(null)} className="mt-4 text-sm font-bold text-emerald-700 hover:underline">Cerrar</button>
        </div>
      )}

      {/* TABLA USUARIOS */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-50 text-stone-500 text-xs font-bold uppercase">
            <tr><th className="p-4">Usuario</th><th className="p-4">Email</th><th className="p-4">Rol</th></tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-sm">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-stone-50">
                <td className="p-4 font-bold text-stone-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold">
                    {u.first_name ? u.first_name[0] : '?'}
                  </div>
                  {u.first_name || 'Sin Nombre'}
                  {u.email === user?.email && <span className="text-[10px] bg-stone-100 px-1 rounded border">Tú</span>}
                </td>
                <td className="p-4 text-stone-500 font-mono text-xs">{u.email}</td>
                <td className="p-4">
                  <select 
                    className="p-1 rounded text-xs font-bold border outline-none cursor-pointer bg-white"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={u.email === user?.email}
                  >
                    <option value="admin">Administrador</option>
                    <option value="cashier">Vendedor</option>
                    <option value="viewer">Visor</option>
                  </select>
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
            <h3 className="text-xl font-bold text-stone-800 mb-4">Invitar Colaborador</h3>
            <div className="space-y-4">
              <input className="w-full p-2 border rounded" placeholder="Nombre" value={inviteData.nombre} onChange={e => setInviteData({...inviteData, nombre: e.target.value})} />
              <input className="w-full p-2 border rounded" type="email" placeholder="Email" value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} />
              <select className="w-full p-2 border rounded bg-white" value={inviteData.rol} onChange={e => setInviteData({...inviteData, rol: e.target.value})}>
                <option value="cashier">Vendedor</option>
                <option value="viewer">Visor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowInvite(false)} className="flex-1 py-2 text-stone-500 font-bold">Cancelar</button>
              <button onClick={handleInvite} className="flex-1 py-2 bg-emerald-600 text-white rounded font-bold">Enviar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}