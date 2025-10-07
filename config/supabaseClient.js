import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carrega as variáveis de ambiente
dotenv.config()

// Usa as variáveis de ambiente para as credenciais do Supabase
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_KEY || ''

// Cria o cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase