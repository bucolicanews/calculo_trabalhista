import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Adicionando logs para depuração
console.log("Supabase URL from .env (client.ts):", supabaseUrl);
console.log("Supabase Anon Key from .env (client.ts):", supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is not defined in environment variables. Please check your .env file.");
  // Lançar um erro para parar a execução se as chaves não estiverem presentes
  throw new Error("Supabase URL or Anon Key is required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);