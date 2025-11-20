// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Reemplaza con tus credenciales de Supabase
const supabaseUrl = process.en
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);