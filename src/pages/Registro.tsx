import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../services/supabaseClient';
import { Coffee, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

export function Registro() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Usuario, 2: Organización
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '',
    orgName: '', nit: ''
  });

  const handleRegister = async () => {
    setLoading(true);
    try {
      // 1. Crear Usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: { first_name: formData.firstName, last_name: formData.lastName }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      // 2. Crear Organización (SaaS Inicialización)
      // Calculamos fecha fin de prueba (14 días)
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: formData.orgName,
          plan: 'free_trial',        // <--- CLAVE SAAS
          status: 'trialing',        // <--- CLAVE SAAS
          trial_ends_at: trialEnd.toISOString(),
          setup_completed: false
        }])
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Crear Perfil y Vincular (Dueño)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          organization_id: orgData.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'administrador',
          email: formData.email
        }]);

      if (profileError) throw profileError;

      toast.success("¡Cuenta creada con éxito!");
      // Login automático o redirigir a login
      navigate('/login');

    } catch (error: any) {
      toast.error('Error en el registro', { description: error.message });
    } finally {
      setLoading(false);
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
        {/* Barra de Progreso */}
        <div className="h-1 bg-stone-100 w-full">
          <div className={`h-full bg-emerald-600 transition-all duration-500 ${step === 1 ? 'w-1/2' : 'w-full'}`}></div>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-stone-800 mb-4">1. Tus Datos</h2>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  className="p-3 border rounded-xl w-full" 
                  placeholder="Nombre" 
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                />
                <input 
                  className="p-3 border rounded-xl w-full" 
                  placeholder="Apellido" 
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                />
              </div>
              <input 
                type="email"
                className="p-3 border rounded-xl w-full" 
                placeholder="Correo Electrónico" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
              <input 
                type="password"
                className="p-3 border rounded-xl w-full" 
                placeholder="Contraseña segura" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              
              <button 
                onClick={() => setStep(2)}
                disabled={!formData.email || !formData.password}
                className="w-full bg-stone-900 text-white py-3 rounded-xl font-bold mt-4 flex justify-center items-center gap-2 hover:bg-black disabled:opacity-50 transition-all"
              >
                Siguiente <ArrowRight size={18}/>
              </button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-bold text-stone-800 mb-4">2. Tu Tostaduría</h2>
              <input 
                className="p-3 border rounded-xl w-full" 
                placeholder="Nombre de la Empresa" 
                value={formData.orgName}
                onChange={e => setFormData({...formData, orgName: e.target.value})}
              />
              
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex gap-3 items-start">
                 <CheckCircle className="text-emerald-600 shrink-0 mt-0.5" size={18}/>
                 <div className="text-sm text-emerald-800">
                    <p className="font-bold">Plan Prueba 14 Días</p>
                    <p className="opacity-80">Acceso total a todos los módulos. Sin compromiso.</p>
                 </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setStep(1)}
                  className="px-4 py-3 text-stone-500 font-bold hover:bg-stone-50 rounded-xl transition-colors"
                >
                  Volver
                </button>
                <button 
                  onClick={handleRegister}
                  disabled={loading || !formData.orgName}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-200"
                >
                  {loading ? <Loader2 className="animate-spin"/> : 'Crear mi Cuenta'}
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