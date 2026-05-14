import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { Coffee, Loader2 } from 'lucide-react';
import { RegisterSchema, RegisterFormData } from '../utils/validationSchemas';

export function Registro() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    mode: 'onChange'
  });

  const onSubmit = async (formData: RegisterFormData) => {
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      if (authError) throw authError;

      toast.success("¡Cuenta creada con éxito!");
      navigate('/onboarding');

    } catch (error: any) {
      console.error(error);
      toast.error('Error en el registro', { description: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-900/20">
          <Coffee size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-stone-900">Comienza tu Prueba Gratis</h1>
        <p className="text-stone-500 mt-2">Gestiona tu tostaduría como un profesional.</p>
      </div>

      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl overflow-hidden border border-stone-100">
        <div className="h-1 bg-emerald-600 w-full"></div>

        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <h2 className="text-xl font-bold text-stone-800 mb-4">Crea tu Cuenta</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  className={`p-3 border rounded-xl w-full ${errors.firstName ? 'border-red-500' : ''}`}
                  placeholder="Nombre"
                  autoComplete="given-name"
                  {...register('firstName')}
                />
                {errors.firstName && <p className="text-red-500 text-xs ml-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <input
                  className={`p-3 border rounded-xl w-full ${errors.lastName ? 'border-red-500' : ''}`}
                  placeholder="Apellido"
                  autoComplete="family-name"
                  {...register('lastName')}
                />
                {errors.lastName && <p className="text-red-500 text-xs ml-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <input
                type="email"
                className={`p-3 border rounded-xl w-full ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Correo Electrónico"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-red-500 text-xs ml-1">{errors.email.message}</p>}
            </div>

            <div>
              <input
                type="password"
                className={`p-3 border rounded-xl w-full ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Contraseña segura"
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && <p className="text-red-500 text-xs ml-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold mt-4 flex justify-center items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Crear mi Cuenta'}
            </button>
          </form>
        </div>

        <div className="bg-stone-50 p-4 text-center border-t border-stone-100">
          <p className="text-sm text-stone-500">
            ¿Ya tienes cuenta? <Link to="/login" className="text-stone-900 font-bold hover:underline">Iniciar Sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}