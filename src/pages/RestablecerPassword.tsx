import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { Lock, CheckCircle } from 'lucide-react';

export function RestablecerPassword() {
  const navigate = useNavigate();
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) throw error;
      toast.success('Contraseña actualizada');
      navigate('/');
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Nueva Contraseña</h2>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-stone-400" size={18} />
            <input 
              type="password" 
              className="w-full pl-10 p-3 border rounded-xl outline-none focus:border-emerald-500"
              placeholder="Nueva contraseña segura"
              value={pass}
              onChange={e => setPass(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button disabled={loading} className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2">
            <CheckCircle size={18}/> Actualizar
          </button>
        </form>
      </div>
    </div>
  );
}