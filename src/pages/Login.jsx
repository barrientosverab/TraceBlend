import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';
import { Coffee, Lock, Mail, Loader2 } from 'lucide-react';
import {toast} from 'sonner';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // La redirección es automática gracias a App.jsx
    } catch (error) {
      toast.error("Error de acceso: ",{description: error.message});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header Decorativo */}
        <div className="bg-emerald-900 p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Coffee size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">Trace Blend</h1>
          <p className="text-emerald-200 text-sm mt-2">Sistema de Trazabilidad de Café</p>
        </div>

        {/* Formulario */}
        <div className="p-8 pt-10">
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-600 ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-stone-400" size={20} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-stone-600 ml-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-stone-400" size={20} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Enlace de recuperación */}
            <div className="flex justify-end">
              <Link to="/recuperar" className="text-sm text-emerald-600 hover:underline font-medium">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transform active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Ingresar al Sistema'}
            </button>

          </form>
        </div>
        
        <div className="bg-stone-50 p-4 text-center text-xs text-stone-400 border-t border-stone-100">
          Acceso exclusivo para personal autorizado
        </div>
      </div>
    </div>
  );
}