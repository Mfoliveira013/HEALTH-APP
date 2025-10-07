// Elementos do DOM
const loginForm = document.getElementById('formLogin');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('senha');
const rememberMe = document.getElementById('lembrar');
const errorMessage = document.getElementById('error-message');
const loginButton = document.getElementById('loginButton');
const buttonText = document.querySelector('.button-text');
const buttonLoader = document.querySelector('.button-loader');
const toggleThemeBtn = document.getElementById('toggle-theme');
const increaseFontBtn = document.getElementById('increase-font');
const decreaseFontBtn = document.getElementById('decrease-font');
const htmlElement = document.documentElement;
let currentFontSize = 16; // Tamanho de fonte padrão em pixels

// Verificar se há credenciais salvas
function checkSavedCredentials() {
    const savedEmail = localStorage.getItem('savedEmail');
    const savedPassword = localStorage.getItem('savedPassword');
    
    if (savedEmail && savedPassword) {
        emailInput.value = savedEmail;
        passwordInput.value = savedPassword;
        rememberMe.checked = true;
    }
}

// Mostrar/ocultar senha
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', function() {
        const input = this.closest('.password-field').querySelector('input');
        const icon = this.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            this.setAttribute('aria-label', 'Ocultar senha');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            this.setAttribute('aria-label', 'Mostrar senha');
        }
    });
});

// Validar formulário
function validateForm() {
    let isValid = true;
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Resetar mensagens de erro
    document.querySelectorAll('.input-error').forEach(el => el.remove());
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');
    
    // Validar email
    if (!email) {
        showFieldError(emailInput, 'Por favor, insira seu email');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError(emailInput, 'Por favor, insira um email válido');
        isValid = false;
    }
    
    // Validar senha
    if (!password) {
        showFieldError(passwordInput, 'Por favor, insira sua senha');
        isValid = false;
    } else if (password.length < 8) {
        showFieldError(passwordInput, 'A senha deve ter pelo menos 8 caracteres');
        isValid = false;
    }
    
    // Verificar reCAPTCHA
    const recaptchaResponse = grecaptcha && grecaptcha.getResponse();
    if (!recaptchaResponse || recaptchaResponse.length === 0) {
        showNotification('Por favor, complete a verificação reCAPTCHA', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Mostrar erro em um campo
function showFieldError(input, message) {
    input.classList.add('error');
    const errorElement = document.createElement('div');
    errorElement.className = 'input-error';
    errorElement.textContent = message;
    errorElement.style.color = 'var(--error)';
    errorElement.style.fontSize = '0.8rem';
    errorElement.style.marginTop = '0.25rem';
    input.parentNode.insertBefore(errorElement, input.nextSibling);
    
    // Adiciona foco ao campo com erro
    input.focus();
}

// Validar formato de email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Mostrar notificação
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    // Esconder notificação após 5 segundos
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
}

// Mostrar/ocultar loading
function setLoading(isLoading) {
    if (isLoading) {
        loginButton.disabled = true;
        buttonText.style.visibility = 'hidden';
        buttonLoader.style.display = 'block';
    } else {
        loginButton.disabled = false;
        buttonText.style.visibility = 'visible';
        buttonLoader.style.display = 'none';
    }
}

// Manipular envio do formulário
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validar formulário
    if (!validateForm()) {
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Salvar credenciais se "Lembrar de mim" estiver marcado
    if (rememberMe.checked) {
        localStorage.setItem('savedEmail', email);
        localStorage.setItem('savedPassword', password);
    } else {
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('savedPassword');
    }
    
    // Preparar dados para envio
    const formData = {
        email,
        senha: password,
        recaptcha: grecaptcha.getResponse()
    };
    
    try {
        // Mostrar loading
        setLoading(true);
        
        // Fazer requisição de login
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Salvar token no localStorage
            localStorage.setItem('token', data.token);
            
            // Mostrar mensagem de sucesso
            showNotification('Login realizado com sucesso!', 'success');
            
            // Redirecionar após um pequeno atraso para mostrar a mensagem
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } else {
            // Mostrar mensagem de erro
            const errorMsg = data.message || 'Erro ao fazer login. Verifique suas credenciais.';
            showNotification(errorMsg, 'error');
            
            //Destacar campos com erro
            if (data.field) {
                const input = document.getElementById(data.field);
                if (input) {
                    input.classList.add('error');
                    input.focus();
                }
            }
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showNotification('Erro na conexão com o servidor. Tente novamente mais tarde.', 'error');
    } finally {
        // Esconder loading
        setLoading(false);
        
        // Resetar reCAPTCHA
        if (window.grecaptcha) {
            grecaptcha.reset();
        }
    }
});

// Função para alternar entre tema claro e escuro
function toggleTheme() {
    const isDark = htmlElement.classList.toggle('dark-theme');
    const theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    
    // Atualizar ícone do botão
    const icon = toggleThemeBtn.querySelector('i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    
    // Atualizar cores do formulário
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.style.backgroundColor = isDark ? '#333' : '#fff';
        input.style.color = isDark ? '#fff' : '#333';
    });
}

// Função para ajustar o tamanho da fonte
function updateFontSize() {
    htmlElement.style.fontSize = `${currentFontSize}px`;
    localStorage.setItem('fontSize', currentFontSize);
    
    // Atualizar tamanho da fonte do formulário
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.style.fontSize = `${currentFontSize}px`;
    });
}

// Função para aumentar a fonte
function increaseFont() {
    if (currentFontSize < 20) {
        currentFontSize += 1;
        updateFontSize();
    }
}

// Função para diminuir a fonte
function decreaseFont() {
    if (currentFontSize > 12) {
        currentFontSize -= 1;
        updateFontSize();
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Verificar credenciais salvas
    checkSavedCredentials();
    
    // Configurar reCAPTCHA
    if (typeof grecaptcha !== 'undefined') {
        grecaptcha.ready(function() {
            // reCAPTCHA já está pronto
        });
    }
    
    // Carregar tema salvo
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark-theme');
        const icon = toggleThemeBtn.querySelector('i');
        icon.className = 'fas fa-sun';
    }
    
    // Carregar tamanho da fonte salvo
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        currentFontSize = parseInt(savedFontSize, 10);
        updateFontSize();
    }
    
    // Adicionar focao ao primeiro campo
    emailInput.focus();
    
    // Event Listeners
    toggleThemeBtn.addEventListener('click', toggleTheme);
    increaseFontBtn.addEventListener('click', increaseFont);
    decreaseFontBtn.addEventListener('click', decreaseFont);
    
    // Validar campos quando o usuário digita
    emailInput.addEventListener('input', () => {
        emailInput.classList.remove('error');
    });
    
    passwordInput.addEventListener('input', () => {
        passwordInput.classList.remove('error');
    });
    
    // Adicionar atalhos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl + + para aumentar a fonte
        if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
            e.preventDefault();
            increaseFont();
        }
        
        // Ctrl + - para diminuir a fonte
        if ((e.ctrlKey || e.metaKey) && e.key === '-') {
            e.preventDefault();
            decreaseFont();
        }
        
        // Ctrl + 0 para resetar a fonte
        if ((e.ctrlKey || e.metaKey) && e.key === '0') {
            e.preventDefault();
            currentFontSize = 16;
            updateFontSize();
        }
    });
});

// Lidar com o botão de login com Google
const googleLoginBtn = document.querySelector('.btn-google');
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification('Login com Google em breve disponível!', 'info');
    });
}