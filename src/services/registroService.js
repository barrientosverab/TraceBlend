import { supabase } from './supabaseClient';

export const registrarNuevoCliente = async (datos) => {
  // 1. Registrar Usuario en Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: datos.email,
    password: datos.password,
    options: {
      data: { 
        nombre: datos.nombre, // Metadata para el Trigger inicial
        role: 'administrador'
      }
    }
  });

  if (authError) throw authError;
  
  // SI LA CONFIRMACIÓN DE EMAIL ESTÁ ACTIVADA:
  // authData.session será null. No podemos continuar automáticamente.
  if (!authData.session) {
    throw new Error("Registro exitoso. ¡Revisa tu correo para confirmar tu cuenta antes de continuar!");
  }

  try {
    // 2. LLAMADA MÁGICA: Usamos la RPC segura
    // Esto reemplaza al insert manual y al setTimeout
    const { data: org, error: rpcError } = await supabase.rpc('registrar_tostaduria', {
      nombre_empresa: datos.empresa
    });

    if (rpcError) throw rpcError;

    return { user: authData.user, org };

  } catch (error) {
    console.error("Error en onboarding:", error);
    // Si falla la RPC, es un error de sistema, pero el usuario ya existe.
    throw new Error("Tu usuario fue creado, pero hubo un error configurando la empresa. Intenta iniciar sesión.");
  }
};