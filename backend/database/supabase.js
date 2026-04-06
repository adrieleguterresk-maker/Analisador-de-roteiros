const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;

// Só tenta criar o cliente se as variáveis existirem.
// Isso evita que o servidor da Vercel "morra" (Erro 500) logo no início se houver erro de ENV.
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.error('ERRO ao inicializar Supabase:', err.message);
  }
} else {
  console.error('AVISO: SUPABASE_URL ou SUPABASE_ANON_KEY não detectados. O banco de dados não funcionará.');
}

module.exports = { supabase };
