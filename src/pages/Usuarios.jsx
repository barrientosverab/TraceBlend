import React, { useState, useEffect } from 'react';
import { Users, Save, Shield } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { getCurrentOrgId } from '../services/authService';

export function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { cargarEquipo(); }, []);

  const cargarEquipo = async () => {
    try {
      const orgId = await getCurrentOrgId();
      // Consultamos perfiles de MI organización
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, role, email:id(email)') // Join con auth simulado (requiere vista) o simple select
        // Nota: Por seguridad, 'auth.users' no es accesible directamente.
        // TRUCO: Vamos a mostrar solo los datos del perfil público.
        .eq('organization_id', orgId);

      if (error) throw error;
      setUsuarios(data);
    } catch (e) { console.error(e); }
  };

  const actualizarRol = async (id, nuevoRol) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: nuevoRol })
        .eq('id', id);
      if (error) throw error;
      alert("Rol actualizado");
      cargarEquipo();
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-8 bg-stone-50 min-h-screen">
      <h1 className="text-2xl font-bold text-stone-800 mb-6 flex items-center gap-2">
        <Users className="text-emerald-600"/> Gestión de Equipo
      </h1>
      
      <div className="bg-white rounded-xl shadow border border-stone-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-stone-100 text-stone-500 font-bold uppercase text-xs">
            <tr>
              <th className="p-4">Nombre</th>
              <th className="p-4">Rol Actual</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-stone-50">
                <td className="p-4 font-medium">{u.first_name || 'Sin Nombre'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase 
                    ${u.role === 'administrador' ? 'bg-purple-100 text-purple-700' : 
                      u.role === 'tostador' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <select 
                    className="p-2 border rounded text-sm"
                    value={u.role}
                    onChange={(e) => actualizarRol(u.id, e.target.value)}
                    disabled={loading}
                  >
                    <option value="viewer">Visor</option>
                    <option value="tostador">Tostador</option>
                    <option value="operador">Operador</option>
                    <option value="vendedor">Vendedor</option>
                    <option value="laboratorio">Laboratorio</option>
                    <option value="administrador">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios.length === 0 && <p className="p-8 text-center text-stone-400">No hay otros usuarios en tu organización.</p>}
      </div>
      
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-800">
        <strong>Nota de Seguridad:</strong> Para agregar un usuario nuevo, pídele que se registre (Sign Up) en la aplicación. Luego aparecerá en esta lista y podrás asignarle su rol y organización.
      </div>
    </div>
  );
}