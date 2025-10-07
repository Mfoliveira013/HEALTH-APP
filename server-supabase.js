import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './config/supabaseClient.js';

// Configuração do ambiente
dotenv.config();

// Configuração do Express
const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'html')));

// Rotas da API
app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    
    // Registrar o usuário na autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha
    });
    
    if (authError) throw authError;
    
    // Adicionar informações adicionais na tabela de usuários
    const { error } = await supabase
      .from('usuarios')
      .insert([
        { 
          id: authData.user.id,
          nome, 
          email
        }
      ]);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Usuário registrado com sucesso!' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) throw error;
    
    res.json({ success: true, message: 'Email de recuperação enviado!' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/user', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    if (!data.user) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }
    
    // Buscar informações adicionais do usuário
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', data.user.id)
      .single();
    
    if (userError) throw userError;
    
// Rota para a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'login.html'));
});

    res.json({ success: true, user: { ...data.user, ...userData } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});