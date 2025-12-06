import { supabase } from './supabaseClient';

export const registrarNuevoCliente = async (datos) => {
  // 1. Registrar Usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: datos.email,
    password: datos.password,
    options: {
      data: { first_name: datos.nombre } // Metadata
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("No se pudo crear el usuario");

  // Esperar un momento para asegurar que el Trigger de base de datos cree el perfil base
  // (A veces es instantáneo, a veces toma milisegundos)
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    // 2. Crear la Organización
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert([{ 
        name: datos.empresa,
        created_at: new Date()
      }])
      .select()
      .single();

    if (orgError) throw orgError;

    // 3. Actualizar el perfil del usuario: Asignar Org y Rol de Admin
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        organization_id: org.id,
        role: 'administrador',
        first_name: datos.nombre
      })
      .eq('id', authData.user.id);

    if (profileError) throw profileError;

    return { user: authData.user, org };

  } catch (error) {
    // Si falla la creación de la empresa, idealmente deberíamos borrar el usuario
    // Para MVP, lanzamos el error
    console.error("Error en onboarding:", error);
    throw new Error("El usuario se creó, pero hubo un error configurando la empresa. Contacta soporte.");
  }
};