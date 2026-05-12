import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { Coffee, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { LoginSchema, LoginFormData } from '../utils/validationSchemas';

export function Login() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      toast.error('Error de acceso', { description: error.message || 'Credenciales incorrectas' });
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          <div className="space-y-4">
            {/* Campo Email */}
            <div>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-stone-400" size={18} />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  autoComplete="email"
                  className={`w-full pl-10 p-3 border rounded-xl outline-none transition-colors ${errors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-emerald-500'
                    }`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>
              )}
            </div>

            {/* Campo Password */}
            <div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-stone-400" size={18} />
                <input
                  type="password"
                  placeholder="Contraseña"
                  autoComplete="current-password"
                  className={`w-full pl-10 p-3 border rounded-xl outline-none transition-colors ${errors.password ? 'border-red-500 focus:border-red-500' : 'focus:border-emerald-500'
                    }`}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/recuperar" className="text-xs font-bold text-stone-500 hover:text-emerald-600">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <>Ingresar <ArrowRight size={18} /></>}
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