import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { Coffee, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { RegisterSchema, RegisterFormData } from '../utils/validationSchemas';

export function Registro() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(RegisterSchema),
    mode: 'onChange'
  });

  const handleNextStep = async () => {
    // Validar solo campos del paso 1 antes de avanzar
    const isValid = await trigger(['firstName', 'lastName', 'email', 'password']);
    if (isValid) {
      setStep(2);
    }
  };

  const onSubmit = async (formData: RegisterFormData) => {
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: 'administrador',
            org_name: formData.orgName,
            tax_id: formData.nit
          }
        }
      });

      if (authError) throw authError;

      toast.success("¡Cuenta creada con éxito!");
      navigate('/');

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
        <div className="h-1 bg-stone-100 w-full">
          <div className={`h-full bg-emerald-600 transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <div key="step-1" className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-stone-800 mb-4">1. Tus Datos</h2>
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
                type="button"
                onClick={handleNextStep}
                className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold mt-4 flex justify-center items-center gap-2 hover:bg-black transition-all"
              >
                Siguiente <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div key="step-2" className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-stone-800 mb-4">2. Tu Tostaduría</h2>

              <div>
                <input
                  key="orgName-input"
                  className={`p-3 border rounded-xl w-full ${errors.orgName ? 'border-red-500' : ''}`}
                  placeholder="Nombre de la Empresa"
                  autoComplete="organization"
                  {...register('orgName')}
                />
                {errors.orgName && <p className="text-red-500 text-xs ml-1">{errors.orgName.message}</p>}
              </div>

              <div>
                <input
                  key="nit-input"
                  className="p-3 border rounded-xl w-full"
                  placeholder="NIT / Tax ID (Opcional)"
                  autoComplete="off"
                  {...register('nit')}
                />
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3 items-start">
                <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-emerald-800">
                  <p className="font-bold">Plan Prueba 14 Días</p>
                  <p className="opacity-80">Acceso total a todos los módulos. Sin compromiso.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3 text-stone-500 font-bold hover:bg-stone-50 rounded-xl transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Crear mi Cuenta'}
                </button>
              </div>
            </div>
          )}
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