import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Vite usa import.meta.env para las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Revisa tu archivo .env');
}

// Cliente estándar (anon key) - para todas las operaciones normales
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Cliente admin (service role key) - SOLO para operaciones de administrador
// Requiere VITE_SUPABASE_SERVICE_ROLE_KEY en el archivo .env
// ⚠️ Nota: En producción, este tipo de operaciones debe hacerse desde un servidor
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;