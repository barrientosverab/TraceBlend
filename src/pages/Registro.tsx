import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { User, Building2, Mail, Lock, ArrowRight, Loader2, CheckCircle, Inbox } from 'lucide-react';
import { registrarUsuarioInicial, crearOrganizacionYVincular } from '../services/onboardingService';
import { useAuth } from '../hooks/useAuth';

export function Registro() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth(); // Para detectar si ya completó el paso 1 (login automático)
  
  // Si hay 'inviteCode' en la URL, asumimos que es el ID de la organización
  const inviteOrgId = searchParams.get('invite'); 

  // Estado del Wizard
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  // NUEVO ESTADO: Controla si mostramos la pantalla de "Ve a tu correo"
  const [pendingVerification, setPendingVerification] = useState(false);

  // Datos
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    nombreEmpresa: ''
  });

  // EFECTO: Si el usuario ya está logueado...
 useEffect(() => {
    if (user) {
      if (inviteOrgId) {
        navigate('/');
      } else {
        setStep(2); // ¡Aquí está la magia! Al volver del correo, pasa al paso 2.
      }
    }
  }, [user, inviteOrgId, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // PASO 1: CREAR USUARIO
const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return toast.error("Contraseñas no coinciden");
    
    setLoading(true);
    try {
      const data  = await registrarUsuarioInicial({
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        inviteOrgId: inviteOrgId || undefined
      });
      
      // Si Supabase devuelve usuario pero NO sesión, significa que requiere confirmación
      if (data.user && !data.session) {
        setPendingVerification(true);
        toast.success("Registro iniciado. Revisa tu bandeja de entrada.");
      } else {
        // Flujo antiguo (si confirmación está apagada)
        if (inviteOrgId) navigate('/');
        else setStep(2);
      }

    } catch (error: any) {
      toast.error("Error en registro", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // PASO 2: CREAR EMPRESA
  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Sesión no detectada. Recarga la página.");
    
    setLoading(true);
    try {
      await crearOrganizacionYVincular(user.id, formData.nombreEmpresa);
      toast.success("¡Bienvenido! Tostaduría configurada.");
      // Forzamos recarga completa para que el AuthContext refresque el profile con la nueva org
      window.location.href = '/'; 
    } catch (error: any) {
      toast.error("Error al crear empresa", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-8 text-center animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 animate-bounce">
            <Inbox size={40} />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">¡Revisa tu Correo!</h2>
          <p className="text-stone-500 mb-6">
            Hemos enviado un enlace de confirmación a <strong>{formData.email}</strong>.
            <br/>Por favor, haz clic en él para activar tu cuenta y continuar.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-6">
            <p><strong>Nota:</strong> No cierres esta pestaña. Al confirmar, serás redirigido automáticamente.</p>
          </div>

          <button onClick={() => window.location.reload()} className="text-emerald-600 font-bold hover:underline text-sm">
            ¿Ya confirmaste? Haz clic aquí para recargar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-500">
        
        <div className="bg-emerald-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/coffee.png')]"></div>
          <h1 className="text-2xl font-bold text-white relative z-10">
            {step === 1 ? (inviteOrgId ? 'Únete al Equipo' : 'Crea tu Cuenta') : 'Tu Tostaduría'}
          </h1>
          <p className="text-emerald-200 text-sm mt-2 relative z-10">
            {step === 1 ? 'Paso 1: Tus Credenciales' : 'Paso 2: Nombre del Negocio'}
          </p>
        </div>

        {/* --- FORMULARIO PASO 1 --- */}
        {step === 1 && (
          <form onSubmit={handleRegisterUser} className="p-8 space-y-5 animate-in fade-in slide-in-from-right-8">
            {inviteOrgId && (
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2 items-center mb-4">
                <Info size={16}/> Te estás uniendo a una organización existente.
              </div>
            )}
            
            <div className="space-y-4">
              <div className="relative">
                <User size={18} className="absolute left-3 top-3 text-stone-400"/>
                <input name="nombre" onChange={handleChange} className="w-full pl-10 p-3 border rounded-lg focus:border-emerald-500 outline-none" placeholder="Tu Nombre" required />
              </div>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-stone-400"/>
                <input type="email" name="email" onChange={handleChange} className="w-full pl-10 p-3 border rounded-lg focus:border-emerald-500 outline-none" placeholder="correo@ejemplo.com" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-stone-400"/>
                  <input type="password" name="password" onChange={handleChange} className="w-full pl-10 p-3 border rounded-lg focus:border-emerald-500 outline-none" placeholder="Contraseña" required />
                </div>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-stone-400"/>
                  <input type="password" name="confirmPassword" onChange={handleChange} className="w-full pl-10 p-3 border rounded-lg focus:border-emerald-500 outline-none" placeholder="Confirmar" required />
                </div>
              </div>
            </div>

            <button disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2 mt-6 transition-all">
              {loading ? <Loader2 className="animate-spin"/> : <>{inviteOrgId ? 'Registrarme y Unirme' : 'Siguiente'} <ArrowRight size={18}/></>}
            </button>
          </form>
        )}

        {/* --- FORMULARIO PASO 2 --- */}
        {step === 2 && (
          <form onSubmit={handleCreateOrg} className="p-8 space-y-6 animate-in fade-in slide-in-from-right-8">
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                <Building2 size={32}/>
              </div>
              <h3 className="text-stone-800 font-bold text-lg">¡Hola, {user?.user_metadata.first_name || 'Fundador'}!</h3>
              <p className="text-stone-500 text-sm">Estás a un paso. ¿Cómo se llama tu empresa?</p>
            </div>

            <input 
              name="nombreEmpresa" 
              onChange={handleChange} 
              className="w-full p-4 text-xl border-2 border-emerald-100 rounded-xl outline-none focus:border-emerald-500 text-center font-bold text-stone-800 placeholder:text-stone-300 placeholder:font-normal transition-all focus:shadow-lg" 
              placeholder="Ej: Café Los Andes" 
              autoFocus
              required 
            />

            <button disabled={loading} className="w-full bg-stone-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center gap-2 transition-all">
              {loading ? <Loader2 className="animate-spin"/> : <><CheckCircle size={20}/> Finalizar y Entrar</>}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

// Icono extra necesario
import { Info } from 'lucide-react';