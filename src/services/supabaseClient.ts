import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Vite usa import.meta.env para las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Revisa tu archivo .env');
}

// ✨ LA MAGIA: Pasamos <Database> aquí y todo el proyecto se entera
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);