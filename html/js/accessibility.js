// Função para alternar o tema escuro
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// Função para aumentar o tamanho da fonte
function increaseFontSize() {
    const currentSize = parseInt(getComputedStyle(document.body).fontSize);
    if (currentSize < 24) { // Limite máximo de 24px
        document.body.style.fontSize = (currentSize + 2) + 'px';
        localStorage.setItem('fontSize', currentSize + 2);
    }
}

// Função para diminuir o tamanho da fonte
function decreaseFontSize() {
    const currentSize = parseInt(getComputedStyle(document.body).fontSize);
    if (currentSize > 12) { // Limite mínimo de 12px
        document.body.style.fontSize = (currentSize - 2) + 'px';
        localStorage.setItem('fontSize', currentSize - 2);
    }
}

// Função para aplicar as configurações salvas
function applySavedSettings() {
    // Recuperar tema salvo
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }

    // Recuperar tamanho da fonte salvo
    const savedFontSize = localStorage.getItem('fontSize');
    if (savedFontSize) {
        document.body.style.fontSize = savedFontSize + 'px';
    }
}

// Função para inicializar as configurações de acessibilidade
function initAccessibility() {
    // Aplicar configurações salvas em todas as páginas
    applySavedSettings();

    // Adicionar event listeners aos botões apenas se eles existirem na página
    const toggleTemaBtn = document.getElementById('toggle-tema');
    const increaseFontBtn = document.getElementById('increase-font');
    const decreaseFontBtn = document.getElementById('decrease-font');

    if (toggleTemaBtn) {
        toggleTemaBtn.addEventListener('click', toggleDarkMode);
    }
    if (increaseFontBtn) {
        increaseFontBtn.addEventListener('click', increaseFontSize);
    }
    if (decreaseFontBtn) {
        decreaseFontBtn.addEventListener('click', decreaseFontSize);
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initAccessibility); 