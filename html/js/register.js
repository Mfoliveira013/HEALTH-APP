document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const form = document.getElementById('cadastroForm');
    const steps = document.querySelectorAll('.step');
    const formSteps = document.querySelectorAll('.form-step');
    const progressBar = document.querySelector('.progress');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('[data-prev]');
    const submitButton = document.getElementById('submitBtn');
    const passwordInput = document.getElementById('senha');
    const confirmPasswordInput = document.getElementById('confirmarSenha');
    const passwordMatch = document.querySelector('.password-match');
    const passwordStrength = document.querySelector('.strength-meter-fill');
    const strengthText = document.querySelector('.strength-text span');
    const passwordRequirements = document.querySelectorAll('.requirement');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('successMessage');
    const countdownElement = document.getElementById('countdown');
    
    // Variáveis
    let currentStep = 1;
    const totalSteps = steps.length;
    
    // Inicialização
    updateProgressBar();
    showStep(currentStep);
    
    // Event Listeners
    nextButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const nextStep = parseInt(button.getAttribute('data-next'));
            if (validateStep(currentStep)) {
                goToStep(nextStep);
            }
        });
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const prevStep = parseInt(button.getAttribute('data-prev'));
            goToStep(prevStep);
        });
    });
    
    // Validação de senha em tempo real
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePassword);
    }
    
    // Confirmação de senha em tempo real
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
    
    // Alternar visibilidade da senha
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Envio do formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            try {
                // Simular envio do formulário
                await simulateFormSubmission(data);
                
                // Mostrar mensagem de sucesso
                showSuccessMessage();
                
                // Redirecionar após a contagem regressiva
                let countdown = 5;
                countdownElement.textContent = countdown;
                
                const countdownInterval = setInterval(() => {
                    countdown--;
                    countdownElement.textContent = countdown;
                    
                    if (countdown <= 0) {
                        clearInterval(countdownInterval);
                        window.location.href = 'login.html';
                    }
                }, 1000);
                
            } catch (error) {
                showError('Ocorreu um erro ao processar seu cadastro. Por favor, tente novamente.');
                console.error('Erro no cadastro:', error);
            }
        }
    });
    
    // Funções auxiliares
    function showStep(stepNumber) {
        // Esconder todos os passos
        formSteps.forEach(step => {
            step.classList.add('d-none');
            step.classList.remove('active');
        });
        
        // Mostrar o passo atual
        const currentFormStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
        if (currentFormStep) {
            currentFormStep.classList.remove('d-none');
            currentFormStep.classList.add('active');
        }
        
        // Atualizar a barra de progresso
        updateProgressBar();
        
        // Rolar para o topo do formulário
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function goToStep(stepNumber) {
        if (stepNumber < 1 || stepNumber > totalSteps) return;
        
        // Atualizar a classe ativa dos passos
        steps.forEach((step, index) => {
            if (index + 1 === stepNumber) {
                step.classList.add('active');
                step.classList.add('completed');
            } else if (index + 1 < stepNumber) {
                step.classList.remove('active');
                step.classList.add('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        
        currentStep = stepNumber;
        showStep(stepNumber);
    }
    
    function updateProgressBar() {
        const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    function validateStep(step) {
        let isValid = true;
        const currentStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
        
        if (!currentStepElement) return false;
        
        // Validar campos obrigatórios
        const requiredInputs = currentStepElement.querySelectorAll('[required]');
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
            } else {
                input.classList.remove('error');
                
                // Validação de email
                if (input.type === 'email' && !isValidEmail(input.value)) {
                    isValid = false;
                    input.classList.add('error');
                    showError('Por favor, insira um email válido.');
                }
                
                // Validação de telefone
                if (input.id === 'telefone' && !isValidPhone(input.value)) {
                    isValid = false;
                    input.classList.add('error');
                    showError('Por favor, insira um telefone válido.');
                }
            }
        });
        
        if (!isValid) {
            showError('Por favor, preencha todos os campos obrigatórios.');
        } else {
            hideError();
        }
        
        return isValid;
    }
    
    function validateForm() {
        let isValid = true;
        
        // Validar todos os passos
        for (let i = 1; i <= totalSteps; i++) {
            if (!validateStep(i)) {
                isValid = false;
                goToStep(i);
                break;
            }
        }
        
        // Validar confirmação de senha
        if (passwordInput && confirmPasswordInput && passwordInput.value !== confirmPasswordInput.value) {
            isValid = false;
            showError('As senhas não coincidem.');
            goToStep(3); // Vá para a etapa de senha
        }
        
        return isValid;
    }
    
    function validatePassword() {
        const password = passwordInput.value;
        let strength = 0;
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%&*]/.test(password)
        };
        
        // Atualizar ícones de requisitos
        Object.keys(requirements).forEach(key => {
            const requirementElement = document.querySelector(`[data-requirement="${key}"]`);
            if (requirementElement) {
                const icon = requirementElement.querySelector('i');
                if (requirements[key]) {
                    requirementElement.classList.add('valid');
                    icon.classList.remove('fa-circle');
                    icon.classList.add('fa-check-circle');
                    strength++;
                } else {
                    requirementElement.classList.remove('valid');
                    icon.classList.remove('fa-check-circle');
                    icon.classList.add('fa-circle');
                }
            }
        });
        
        // Atualizar barra de força
        const strengthPercent = (strength / 5) * 100;
        passwordStrength.style.width = `${strengthPercent}%`;
        
        // Atualizar texto de força
        let strengthLabel = 'Fraca';
        let strengthClass = 'weak';
        
        if (strength >= 4) {
            strengthLabel = 'Forte';
            strengthClass = 'strong';
        } else if (strength >= 2) {
            strengthLabel = 'Média';
            strengthClass = 'medium';
        }
        
        // Atualizar classes de cor
        passwordStrength.className = 'strength-meter-fill';
        passwordStrength.classList.add(strengthClass);
        
        // Atualizar texto
        if (strengthText) {
            strengthText.textContent = strengthLabel;
            strengthText.className = '';
            strengthText.classList.add(strengthClass);
        }
        
        // Habilitar/desabilitar botão de envio
        if (submitButton) {
            const allRequirementsMet = Object.values(requirements).every(met => met);
            submitButton.disabled = !allRequirementsMet;
        }
    }
    
    function validatePasswordMatch() {
        if (!passwordInput || !confirmPasswordInput) return;
        
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword === '') {
            passwordMatch.classList.remove('valid');
            return;
        }
        
        if (password === confirmPassword) {
            passwordMatch.classList.add('valid');
            passwordMatch.querySelector('i').classList.remove('d-none');
        } else {
            passwordMatch.classList.remove('valid');
            passwordMatch.querySelector('i').classList.add('d-none');
        }
    }
    
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    function isValidPhone(phone) {
        // Formato: (00) 00000-0000 ou (00) 0000-0000
        return /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(phone);
    }
    
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.add('show');
            
            // Rolar até a mensagem de erro
            errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Esconder mensagem após 5 segundos
            setTimeout(hideError, 5000);
        }
    }
    
    function hideError() {
        if (errorMessage) {
            errorMessage.classList.remove('show');
        }
    }
    
    function showSuccessMessage() {
        if (successMessage) {
            successMessage.classList.add('show');
        }
    }
    
    // Função simulada de envio do formulário
    async function simulateFormSubmission(data) {
        // Simular atraso de rede
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Dados do formulário enviados:', data);
                resolve({ success: true });
            }, 1500);
        });
    }
    
    // Máscara para telefone
    const phoneInput = document.getElementById('telefone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 11) {
                value = value.substring(0, 11);
            }
            
            if (value.length > 10) {
                // Formato: (00) 00000-0000
                value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
            } else if (value.length > 5) {
                // Formato: (00) 0000-0000
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
            } else if (value.length > 2) {
                // Formato: (00) 0
                value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            } else if (value.length > 0) {
                // Formato: (00
                value = value.replace(/^(\d*)/, '($1');
            }
            
            e.target.value = value;
        });
    }
    
    // Tema escuro/claro
    const toggleThemeButton = document.getElementById('toggle-theme');
    const htmlElement = document.documentElement;
    
    if (toggleThemeButton) {
        toggleThemeButton.addEventListener('click', function() {
            const icon = this.querySelector('i');
            
            if (htmlElement.classList.contains('dark-theme')) {
                // Mudar para tema claro
                htmlElement.classList.remove('dark-theme');
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                localStorage.setItem('theme', 'light');
            } else {
                // Mudar para tema escuro
                htmlElement.classList.add('dark-theme');
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                localStorage.setItem('theme', 'dark');
            }
        });
        
        // Verificar tema salvo
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            htmlElement.classList.add('dark-theme');
            const icon = toggleThemeButton.querySelector('i');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
    
    // Controles de acessibilidade de fonte
    const increaseFontButton = document.getElementById('increase-font');
    const decreaseFontButton = document.getElementById('decrease-font');
    const resetFontButton = document.getElementById('reset-font');
    
    const minFontSize = 14; // 14px
    const maxFontSize = 24; // 24px
    const defaultFontSize = 16; // 16px
    
    function updateFontSize(change) {
        const html = document.documentElement;
        const currentSize = parseFloat(window.getComputedStyle(html).fontSize);
        let newSize = currentSize + change;
        
        // Limitar tamanho mínimo e máximo
        newSize = Math.max(minFontSize, Math.min(maxFontSize, newSize));
        
        // Aplicar novo tamanho
        html.style.fontSize = `${newSize}px`;
        
        // Salvar preferência
        localStorage.setItem('fontSize', newSize);
        
        // Atualizar estado dos botões
        if (increaseFontButton) {
            increaseFontButton.disabled = newSize >= maxFontSize;
        }
        if (decreaseFontButton) {
            decreaseFontButton.disabled = newSize <= minFontSize;
        }
    }
    
    function resetFontSize() {
        const html = document.documentElement;
        html.style.fontSize = ''; // Remover estilo inline para herdar do CSS
        localStorage.setItem('fontSize', defaultFontSize);
        
        if (increaseFontButton) increaseFontButton.disabled = false;
        if (decreaseFontButton) decreaseFontButton.disabled = false;
    }
    
    if (increaseFontButton) {
        increaseFontButton.addEventListener('click', () => updateFontSize(1));
    }
    
    if (decreaseFontButton) {
        decreaseFontButton.addEventListener('click', () => updateFontSize(-1));
    }
    
    if (resetFontButton) {
        resetFontButton.addEventListener('click', resetFontSize);
    }
    
    // Aplicar tamanho de fonte salvo ao carregar a página
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        const size = parseFloat(savedFontSize);
        document.documentElement.style.fontSize = `${size}px`;
        
        // Atualizar estado dos botões
        if (increaseFontButton) {
            increaseFontButton.disabled = size >= maxFontSize;
        }
        if (decreaseFontButton) {
            decreaseFontButton.disabled = size <= minFontSize;
        }
    }
});
