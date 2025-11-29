import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';

export function RecuperarPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleRecover = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Supabase envía un correo mágico para resetear
      // REDIRECT_TO es vital: A dónde va el usuario cuando da click en el email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'http://localhost:5173/restablecer-password', 
      });

      if (error) throw error;
      setMessage({ type: 'success', text: '¡Correo enviado! Revisa tu bandeja de entrada.' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8">
        <Link to="/login" className="text-stone-500 hover:text-emerald-600 flex items-center gap-1 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Volver al Login
        </Link>

        <h1 className="text-2xl font-bold text-emerald-900 mb-2">Recuperar Acceso</h1>
        <p className="text-stone-500 text-sm mb-6">Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleRecover} className="space-y-6">
          <div>
            <label className="text-sm font-bold text-stone-700">Correo Electrónico</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3.5 text-stone-400" size={20} />
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="ejemplo@empresa.com"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Enviar Enlace'}
          </button>
        </form>
      </div>
    </div>
  );
}