// Função para alternar o menu lateral
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebar && mainContent) {
        // Alternar a classe 'collapsed' no menu e 'expanded' no conteúdo principal
        const isCollapsing = !sidebar.classList.contains('collapsed');
        
        if (isCollapsing) {
            // Fechando o menu
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        } else {
            // Abrindo o menu
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
        }
        
        // Salvar o estado do menu no localStorage
        localStorage.setItem('sidebarCollapsed', isCollapsing);
    }
}

// Função para fechar o menu ao clicar em um item
function setupMenuItems() {
    const menuItems = document.querySelectorAll('.sidebar-item');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remover a classe 'active' de todos os itens
            menuItems.forEach(i => i.classList.remove('active'));
            // Adicionar a classe 'active' ao item clicado
            this.classList.add('active');
            
            // Fechar o menu em telas menores
            if (window.innerWidth <= 1024) {
                toggleSidebar();
            }
        });
    });
}

// Função para inicializar o menu
function initMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    
    // Adicionar evento de clique ao botão do menu
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleSidebar();
        });
    }
    
    // Configurar itens do menu
    setupMenuItems();
    
    // Verificar estado salvo do menu
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    
    if (isCollapsed && sidebar && mainContent) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
    }
    
    // Fechar o menu ao clicar fora dele em telas menores
    document.addEventListener('click', function(e) {
        const sidebar = document.getElementById('sidebar');
        const menuToggle = document.getElementById('menu-toggle');
        
        if (window.innerWidth <= 1024 && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('collapsed');
            document.querySelector('.main-content').classList.remove('expanded');
        }
    });
}

// Função para verificar o tamanho da tela e ajustar o menu
function checkScreenSize() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (!sidebar || !mainContent) return;
    
    if (window.innerWidth > 1024) {
        // Em telas grandes, garantir que o menu esteja visível
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
    } else {
        // Em telas pequenas, verificar se o menu estava aberto
        const wasCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (wasCollapsed) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        }
    }
}

// Inicializar o menu quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initMenu();
    checkScreenSize();
});

// Atualizar o menu quando a janela for redimensionada
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(checkScreenSize, 250);
});
