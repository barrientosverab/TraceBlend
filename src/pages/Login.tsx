import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { Coffee, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState({ email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(creds);
      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      toast.error('Error de acceso', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-emerald-900 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Coffee size={32} className="text-emerald-100" />
          </div>
          <h1 className="text-2xl font-bold text-white">Trace Blend</h1>
          <p className="text-emerald-200 text-sm">Sistema de Gestión de Tostaduría</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-stone-400" size={18} />
              <input 
                type="email" 
                placeholder="Correo electrónico" 
                className="w-full pl-10 p-3 border rounded-xl outline-none focus:border-emerald-500 transition-colors"
                value={creds.email}
                onChange={e => setCreds({...creds, email: e.target.value})}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-stone-400" size={18} />
              <input 
                type="password" 
                placeholder="Contraseña" 
                className="w-full pl-10 p-3 border rounded-xl outline-none focus:border-emerald-500 transition-colors"
                value={creds.password}
                onChange={e => setCreds({...creds, password: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/recuperar" className="text-xs font-bold text-stone-500 hover:text-emerald-600">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Ingresar <ArrowRight size={18} /></>}
          </button>

          <div className="text-center pt-4 border-t border-stone-100">
            <p className="text-sm text-stone-500">
              ¿Aún no tienes cuenta? <Link to="/registro" className="font-bold text-emerald-600 hover:underline">Regístrate gratis</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}