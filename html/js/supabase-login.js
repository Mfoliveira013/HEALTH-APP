import { fazerLogin, registrarUsuario, recuperarSenha } from '../../services/authService.js';

// Função para login com Supabase
async function loginWithSupabase(email, senha) {
  try {
    // Mostrar loader
    showLoading(true);
    
    // Chamar o serviço de autenticação
    const result = await fazerLogin(email, senha);
    
    if (result.success) {
      // Salvar token de sessão
      localStorage.setItem('supabase.auth.token', JSON.stringify(result.data.session));
      
      // Redirecionar para a página inicial
      window.location.href = '/html/home.html';
    } else {
      // Mostrar mensagem de erro
      showError(result.error || 'Falha ao fazer login. Verifique suas credenciais.');
    }
  } catch (error) {
    showError('Erro ao conectar com o servidor. Tente novamente mais tarde.');
    console.error('Erro de login:', error);
  } finally {
    // Esconder loader
    showLoading(false);
  }
}

// Função para registro com Supabase
async function registerWithSupabase(nome, email, senha) {
  try {
    // Mostrar loader
    showLoading(true);
    
    // Chamar o serviço de registro
    const result = await registrarUsuario(nome, email, senha);
    
    if (result.success) {
      // Mostrar mensagem de sucesso
      alert('Conta criada com sucesso! Verifique seu email para confirmar o cadastro.');
      
      // Redirecionar para a página de login
      window.location.href = '/html/login.html';
    } else {
      // Mostrar mensagem de erro
      showError(result.error || 'Falha ao criar conta. Tente novamente.');
    }
  } catch (error) {
    showError('Erro ao conectar com o servidor. Tente novamente mais tarde.');
    console.error('Erro de registro:', error);
  } finally {
    // Esconder loader
    showLoading(false);
  }
}

// Função para recuperação de senha com Supabase
async function resetPasswordWithSupabase(email) {
  try {
    // Mostrar loader
    showLoading(true);
    
    // Chamar o serviço de recuperação de senha
    const result = await recuperarSenha(email);
    
    if (result.success) {
      // Mostrar mensagem de sucesso
      alert('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } else {
      // Mostrar mensagem de erro
      showError(result.error || 'Falha ao enviar email de recuperação. Verifique o endereço informado.');
    }
  } catch (error) {
    showError('Erro ao conectar com o servidor. Tente novamente mais tarde.');
    console.error('Erro de recuperação de senha:', error);
  } finally {
    // Esconder loader
    showLoading(false);
  }
}

// Funções auxiliares
function showError(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

function showLoading(isLoading) {
  const buttonText = document.querySelector('.button-text');
  const buttonLoader = document.querySelector('.button-loader');
  
  if (buttonText && buttonLoader) {
    if (isLoading) {
      buttonText.style.display = 'none';
      buttonLoader.style.display = 'inline-block';
    } else {
      buttonText.style.display = 'inline-block';
      buttonLoader.style.display = 'none';
    }
  }
}

// Exportar funções
export { loginWithSupabase, registerWithSupabase, resetPasswordWithSupabase };