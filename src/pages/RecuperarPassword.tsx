import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/restablecer-password`,
      });
      if (error) throw error;
      toast.success('Correo enviado', { description: 'Revisa tu bandeja de entrada.' });
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl">
        <Link to="/login" className="flex items-center gap-2 text-stone-400 hover:text-stone-800 mb-6 text-sm font-bold">
          <ArrowLeft size={16}/> Volver
        </Link>
        <h2 className="text-2xl font-bold text-stone-800 mb-2">Recuperar Acceso</h2>
        <p className="text-stone-500 mb-6 text-sm">Te enviaremos un enlace mágico para restablecer tu contraseña.</p>
        
        <form onSubmit={handleRecover} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-stone-400" size={18} />
            <input 
              type="email" 
              className="w-full pl-10 p-3 border rounded-xl outline-none focus:border-emerald-500"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 transition-all">
            <Send size={18}/> {loading ? 'Enviando...' : 'Enviar Enlace'}
          </button>
        </form>
      </div>
    </div>
  );
}