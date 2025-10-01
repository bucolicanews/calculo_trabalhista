import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Adicionando logs para depuração
console.log("Supabase URL from .env:", supabaseUrl);
console.log("Supabase Anon Key from .env:", supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is not defined in environment variables.");
  // Você pode querer lançar um erro ou lidar com isso de forma mais elegante em um aplicativo de produção
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);