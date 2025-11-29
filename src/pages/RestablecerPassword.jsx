import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Lock, Save, Loader2 } from 'lucide-react';

export function RestablecerPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Actualizamos la contraseña del usuario LOGUEADO (por el link mágico)
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;
      
      alert("✅ ¡Contraseña actualizada! Serás redirigido.");
      navigate('/'); // Vamos al Dashboard
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-emerald-900 mb-2">Nueva Contraseña</h1>
        <p className="text-stone-500 text-sm mb-6">Crea una contraseña segura para tu cuenta.</p>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-stone-700">Nueva Contraseña</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3.5 text-stone-400" size={20} />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Guardar Nueva Contraseña</>}
          </button>
        </form>
      </div>
    </div>
  );
}