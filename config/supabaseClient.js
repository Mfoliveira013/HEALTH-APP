import { createClient } from '@supabase/supabase-js'

// Substitua estas variáveis pelas suas credenciais do Supabase
// Você encontrará estas informações no painel do Supabase em Settings > API
const supabaseUrl = 'SUA_URL_DO_SUPABASE'
const supabaseKey = 'SUA_CHAVE_ANON_DO_SUPABASE'

// Cria o cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase