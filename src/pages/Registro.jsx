import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Coffee, User, Building2, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { registrarNuevoCliente } from '../services/registroService';

export function Registro() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    empresa: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Las contraseñas no coinciden");
    }
    if (formData.password.length < 6) {
      return toast.warning("La contraseña debe tener al menos 6 caracteres");
    }

    setLoading(true);
    try {
      await registrarNuevoCliente(formData);
      toast.success("¡Cuenta creada exitosamente!", {
        description: "Revisa tu correo para verificar tu usuario"
      });
      // Redirigir al Dashboard (el AuthContext detectará la sesión automáticamente)
      navigate('/'); 
    } catch (error) {
      toast.error("Error en el registro", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-emerald-900 p-8 text-center relative overflow-hidden">
          <Coffee className="text-white/10 absolute -left-4 -bottom-4 w-32 h-32" />
          <h1 className="text-2xl font-bold text-white relative z-10">Comienza Gratis</h1>
          <p className="text-emerald-200 text-sm mt-2 relative z-10">Crea tu cuenta y gestiona tu tostaduría hoy mismo.</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase">Tu Nombre</label>
              <div className="relative mt-1">
                <User size={18} className="absolute left-3 top-3 text-stone-400"/>
                <input required name="nombre" onChange={handleChange} className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Juan Pérez" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase">Nombre Tostaduría</label>
              <div className="relative mt-1">
                <Building2 size={18} className="absolute left-3 top-3 text-stone-400"/>
                <input required name="empresa" onChange={handleChange} className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Café Los Andes" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-stone-500 uppercase">Correo Electrónico</label>
            <div className="relative mt-1">
              <Mail size={18} className="absolute left-3 top-3 text-stone-400"/>
              <input required type="email" name="email" onChange={handleChange} className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="juan@tostaduria.com" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase">Contraseña</label>
              <div className="relative mt-1">
                <Lock size={18} className="absolute left-3 top-3 text-stone-400"/>
                <input required type="password" name="password" onChange={handleChange} className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="••••••" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase">Confirmar</label>
              <div className="relative mt-1">
                <Lock size={18} className="absolute left-3 top-3 text-stone-400"/>
                <input required type="password" name="confirmPassword" onChange={handleChange} className="w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="••••••" />
              </div>
            </div>
          </div>

          <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 mt-4">
            {loading ? <Loader2 className="animate-spin"/> : <>Crear Cuenta <ArrowRight size={18}/></>}
          </button>

          <p className="text-center text-sm text-stone-500 mt-4">
            ¿Ya tienes cuenta? <Link to="/login" className="text-emerald-600 font-bold hover:underline">Inicia Sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}