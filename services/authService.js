import supabase from '../config/supabaseClient.js';

// Função para registrar um novo usuário
export async function registrarUsuario(nome, email, senha) {
  try {
    // Registrar o usuário na autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: senha
    });

    if (authError) throw authError;

    // Adicionar informações adicionais na tabela de usuários
    const { data, error } = await supabase
      .from('usuarios')
      .insert([
        { 
          id: authData.user.id,
          nome, 
          email,
          senha: 'HASH_PROTEGIDO' // Nunca armazenamos a senha real, o Supabase já cuida disso
        }
      ]);

    if (error) throw error;
    
    return { success: true, data: authData };
  } catch (error) {
    console.error('Erro ao registrar usuário:', error.message);
    return { success: false, error: error.message };
  }
}

// Função para fazer login
export async function fazerLogin(email, senha) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao fazer login:', error.message);
    return { success: false, error: error.message };
  }
}

// Função para fazer logout
export async function fazerLogout() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao fazer logout:', error.message);
    return { success: false, error: error.message };
  }
}

// Função para recuperar senha
export async function recuperarSenha(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao recuperar senha:', error.message);
    return { success: false, error: error.message };
  }
}

// Função para obter o usuário atual
export async function getUsuarioAtual() {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error.message);
    return { success: false, error: error.message };
  }
}

// Função para atualizar perfil do usuário
export async function atualizarPerfil(userId, dados) {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .update(dados)
      .eq('id', userId);
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error.message);
    return { success: false, error: error.message };
  }
}

// Função para fazer upload de avatar
export async function uploadAvatar(userId, file) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Obter URL pública do avatar
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Atualizar URL do avatar no perfil do usuário
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ avatar_url: data.publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { success: true, avatarUrl: data.publicUrl };
  } catch (error) {
    console.error('Erro ao fazer upload de avatar:', error.message);
    return { success: false, error: error.message };
  }
}