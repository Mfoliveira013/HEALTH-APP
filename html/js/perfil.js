let totalAgua = 0;
let totalCalorias = 0;
let registrosAgua = [];
let registrosCalorias = [];

// Configurações de gamificação
const XP_PER_ML = 0.1;
const XP_PER_CALORIE = 0.05;
const XP_PER_DAY = 100;
const LEVEL_THRESHOLDS = [0, 1000, 2500, 5000, 10000, 20000];

let userData = {
    xp: 0,
    level: 1,
    streak: 0,
    lastLogin: null,
    achievements: {
        waterMaster: false,
        calorieControl: false,
        consistency: false
    }
};

// Inicializa o sistema
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    updateStreak();
    gamification.init(); // Inicializa o sistema de gamificação
    addXP(XP_PER_DAY); // XP diário por login
});

// Load user data from localStorage
async function loadUserData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('Usuário não está logado');
            return;
        }

        // Carregar dados do usuário
        const userResponse = await fetch('http://localhost:3000/usuarios/perfil', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (userResponse.ok) {
            const userData = await userResponse.json();
            document.getElementById('nome').textContent = userData.nome;
            document.getElementById('email').textContent = userData.email;
            document.getElementById('peso').textContent = userData.peso;
            document.getElementById('altura').textContent = userData.altura;
            document.getElementById('idade').textContent = userData.idade;
            
            // Atualizar avatar se existir
            if (userData.avatar_url) {
                document.getElementById('user-avatar').src = userData.avatar_url;
            }
        }

        // Carregar nível do usuário
        const levelResponse = await fetch('http://localhost:3000/nivel', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (levelResponse.ok) {
            const levelData = await levelResponse.json();
            updateLevelDisplay(levelData.nivel_usu);
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
    }
}

// Função para atualizar a exibição do nível
function updateLevelDisplay(nivel) {
    // Atualizar o badge de nível
    const levelBadge = document.querySelector('.level-badge');
    const userLevel = document.getElementById('user-level');
    
    if (levelBadge) {
        const oldLevel = parseInt(levelBadge.textContent);
        levelBadge.textContent = nivel;
        
        // Adicionar animação quando subir de nível
        if (nivel > oldLevel) {
            levelBadge.classList.add('level-up');
            setTimeout(() => {
                levelBadge.classList.remove('level-up');
            }, 1000);
        }
    }
    
    if (userLevel) {
        userLevel.textContent = `Nível ${nivel}`;
    }
}

// Função para atualizar o nível do usuário
async function updateUserLevel(newLevel) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:3000/nivel', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nivel_usu: newLevel
            })
        });

        if (response.ok) {
            const levelData = await response.json();
            updateLevelDisplay(levelData.nivel_usu);
        }
    } catch (error) {
        console.error('Erro ao atualizar nível:', error);
    }
}

// Save user data to localStorage
function saveUserData() {
    localStorage.setItem('userData', JSON.stringify(userData));
}

// Update XP and level
function addXP(amount) {
    userData.xp += amount;
    userData.level = calculateLevel(userData.xp);
    saveUserData();
    updateLevelAndXP();
}

// Calculate level based on XP
function calculateLevel(xp) {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
}

// Função para atualizar a interface do nível e XP
function updateLevelAndXP() {
    // Atualizar a barra de progresso de XP
    const xpProgress = document.querySelector('.xp-progress');
    const currentXP = document.querySelector('.current-xp');
    const nextLevel = document.querySelector('.next-level');
    const levelBadge = document.querySelector('.level-badge');

    if (xpProgress && currentXP && nextLevel && levelBadge) {
        // Calcular o progresso para o próximo nível
        const currentLevelThreshold = LEVEL_THRESHOLDS[userData.level - 1] || 0;
        const nextLevelThreshold = LEVEL_THRESHOLDS[userData.level] || (currentLevelThreshold + 1000);
        const xpForNextLevel = nextLevelThreshold - currentLevelThreshold;
        const currentLevelXP = userData.xp - currentLevelThreshold;
        const progress = (currentLevelXP / xpForNextLevel) * 100;

        // Atualizar a barra de progresso
        xpProgress.style.width = `${Math.min(progress, 100)}%`;

        // Atualizar o texto de XP atual
        currentXP.textContent = `${userData.xp} XP`;

        // Atualizar o texto do próximo nível
        nextLevel.textContent = `Próximo nível: ${nextLevelThreshold} XP`;

        // Atualizar o badge de nível
        levelBadge.textContent = userData.level;

        // Adicionar animação quando subir de nível
        if (userData.level > parseInt(levelBadge.dataset.lastLevel || '1')) {
            levelBadge.classList.add('level-up');
            setTimeout(() => {
                levelBadge.classList.remove('level-up');
            }, 1000);
            levelBadge.dataset.lastLevel = userData.level;
        }
    }
}

// Update streak
function updateStreak() {
    const today = new Date().toDateString();
    if (userData.lastLogin !== today) {
        if (isConsecutiveDay(userData.lastLogin)) {
            userData.streak++;
            if (userData.streak >= 7) {
                unlockAchievement('consistency');
            }
        } else {
            userData.streak = 1;
        }
        userData.lastLogin = today;
        saveUserData();
    }
}

// Check if date is consecutive
function isConsecutiveDay(lastLogin) {
    if (!lastLogin) return false;
    const last = new Date(lastLogin);
    const today = new Date();
    const diffTime = Math.abs(today - last);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 1;
}

// Update UI elements
function updateGamificationUI() {
    try {
        const userLevelElement = document.getElementById('user-level');
        if (userLevelElement) {
            userLevelElement.textContent = `Nível ${userData.level}`;
        }

        const streakCountElement = document.getElementById('streak-count');
        if (streakCountElement) {
            streakCountElement.textContent = userData.streak;
        }
        
        // Atualizar conquistas
        Object.keys(userData.achievements).forEach(achievement => {
            const element = document.getElementById(`${achievement}-achievement`);
            if (element && userData.achievements[achievement]) {
                element.classList.add('unlocked');
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar interface de gamificação:', error);
    }
}

// Adiciona XP ao registrar água ou calorias
function registerWater(amount) {
    const record = {
        amount,
        timestamp: new Date().toISOString()
    };
    registrosAgua.push(record);
    saveRecords('water');
    addXP(amount * XP_PER_ML);
    checkAchievements();
    updateDailyTotals();
    document.getElementById('water-amount').value = '';
}

function registerCalories(amount) {
    const record = {
        amount,
        timestamp: new Date().toISOString()
    };
    registrosCalorias.push(record);
    saveRecords('calories');
    addXP(amount * XP_PER_CALORIE);
    checkAchievements();
    updateDailyTotals();
    document.getElementById('calorie-amount').value = '';
}

// Atualizar metas
function updateGoals() {
    const waterTotal = calculateDailyTotal('water');
    const calorieTotal = calculateDailyTotal('calories');
    
    // Atualizar meta de água
    const waterGoal = document.querySelector('.goal-card:first-child');
    const waterProgress = waterGoal.querySelector('.goal-fill');
    const waterValue = waterGoal.querySelector('.goal-value');
    const waterPercentage = Math.min((waterTotal / 2000) * 100, 100);
    
    waterProgress.style.width = `${waterPercentage}%`;
    waterValue.innerHTML = `
        <span>${waterTotal}/2000ml</span>
        <span>${Math.round(waterPercentage)}%</span>
    `;
    
    // Atualizar meta de calorias
    const calorieGoal = document.querySelector('.goal-card:last-child');
    const calorieProgress = calorieGoal.querySelector('.goal-fill');
    const calorieValue = calorieGoal.querySelector('.goal-value');
    const caloriePercentage = Math.min((calorieTotal / 2000) * 100, 100);
    
    calorieProgress.style.width = `${caloriePercentage}%`;
    calorieValue.innerHTML = `
        <span>${calorieTotal}/2000 kcal</span>
        <span>${Math.round(caloriePercentage)}%</span>
    `;
}

// Função para carregar os dados do Local Storage
async function carregarDados() {
    try {
        console.log('Iniciando carregamento de dados...');
        
        // Verifica se há token de autenticação
        const token = localStorage.getItem('token');
        console.log('Token encontrado:', token ? 'Sim' : 'Não');
        
        if (!token) {
            console.log('Usuário não está logado, redirecionando...');
            alert('Você precisa estar logado para visualizar os dados.');
            window.location.href = '../auth/login.html';
            return;
        }

        console.log('Fazendo requisição para /usuarios/perfil...');
        // Busca os dados do usuário logado do servidor
        const response = await fetch('http://localhost:3000/usuarios/perfil', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Status da resposta:', response.status);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Erro na resposta:', errorData);
            throw new Error(errorData.message || 'Erro ao carregar dados do usuário');
        }

        const usuarioData = await response.json();
        console.log('Dados recebidos:', usuarioData);
        
        // Atualiza a interface com os dados do usuário
        document.getElementById("peso").innerText = usuarioData.peso || "0";
        document.getElementById("altura").innerText = usuarioData.altura || "0";
        document.getElementById("idade").innerText = usuarioData.idade || "0";
        document.getElementById("nome").innerText = usuarioData.nome || "Usuário";
        document.getElementById("email").innerText = usuarioData.email || "email@exemplo.com";
        
        console.log('Interface atualizada com sucesso');

        // Carregar metas após carregar dados do usuário
        await carregarMetas();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados do usuário');
    }
}

// Função para carregar registros do usuário
async function carregarRegistros() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Carrega registros de hidratação
        const resHidratacao = await fetch('http://localhost:3000/registro/hidratacao/historico', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (resHidratacao.ok) {
            const dataHidratacao = await resHidratacao.json();
            registrosAgua = dataHidratacao.registros || [];
        }

        // Carrega registros de calorias
        const resCalorias = await fetch('http://localhost:3000/registro/calorias/historico', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (resCalorias.ok) {
            const dataCalorias = await resCalorias.json();
            registrosCalorias = dataCalorias.registros || [];
        }
    } catch (error) {
        console.error('Erro ao carregar registros:', error);
    }
}

// Função para salvar os dados no Local Storage e no banco de dados
async function salvarDados() {
    try {
        const form = document.getElementById("editForm");
        if (!form) {
            throw new Error('Formulário não encontrado');
        }

        // Verifica se há token de autenticação
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Você precisa estar logado para atualizar seus dados.');
            window.location.href = '../auth/login.html';
            return;
        }

        // Obtém os valores dos campos
        const nome = document.getElementById("editNome")?.value;
        const email = document.getElementById("editEmail")?.value;
        const peso = document.getElementById("editPeso")?.value;
        const altura = document.getElementById("editAltura")?.value;
        const idade = document.getElementById("editIdade")?.value;

        // Prepara os dados para enviar (apenas campos preenchidos)
        const dadosAtualizados = {};
        if (nome) dadosAtualizados.nome = nome;
        if (email) dadosAtualizados.email = email;
        if (peso) dadosAtualizados.peso = parseFloat(peso);
        if (altura) dadosAtualizados.altura = parseFloat(altura);
        if (idade) dadosAtualizados.idade = parseInt(idade);

        // Verifica se há algum dado para atualizar
        if (Object.keys(dadosAtualizados).length === 0) {
            alert('Preencha pelo menos um campo para atualizar.');
            return;
        }

        // Envia os dados para o servidor
        const response = await fetch('http://localhost:3000/usuarios/atualizar', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dadosAtualizados)
        });

        // Se a resposta não for ok, lança um erro
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Recarrega os dados do usuário para atualizar a interface
        await carregarDados();

        // Limpa o formulário e fecha
        form.reset();
        toggleEditForm();

        alert('Dados atualizados com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        alert(`Erro ao salvar dados: ${error.message}`);
    }
}

// Funções para gerenciar o formulário de edição
function toggleEditForm() {
    const editForm = document.getElementById("editForm");
    editForm.style.display = editForm.style.display === "none" ? "flex" : "none";
}



// Função para calcular total diário
function calcularTotalDiario(tipo) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const registros = tipo === 'agua' ? registrosAgua : registrosCalorias;
    const total = registros
        .filter(registro => {
            const dataRegistro = new Date(registro.data);
            return dataRegistro >= hoje;
        })
        .reduce((total, registro) => total + registro.quantidade, 0);
    
    return total;
}

// Função para atualizar os totais diários na interface
function atualizarTotaisDiarios() {
    const totalAgua = calcularTotalDiario('agua');
    const totalCalorias = calcularTotalDiario('calorias');
    
    // Atualiza o resumo do dashboard
    const totalAguaElement = document.getElementById('totalAguaResumo');
    const totalCaloriasElement = document.getElementById('totalCaloriasResumo');
    
    if (totalAguaElement) {
        totalAguaElement.textContent = `${totalAgua} ml`;
    } else {
        console.error('Elemento totalAguaResumo não encontrado');
    }
    
    if (totalCaloriasElement) {
        totalCaloriasElement.textContent = `${totalCalorias} calorias`;
    } else {
        console.error('Elemento totalCaloriasResumo não encontrado');
    }
}

// Função para mostrar registros
function mostrarRegistros(tipo) {
    try {
        const listaRegistros = document.getElementById('listaRegistros');
        const tituloModal = document.getElementById('tituloModal');
        const modal = document.getElementById('myModal');
        
        if (!listaRegistros || !tituloModal || !modal) {
            console.error('Elementos do modal não encontrados');
            return;
        }
        
        listaRegistros.innerHTML = '';
        
        const registros = tipo === 'agua' ? registrosAgua : registrosCalorias;
        tituloModal.textContent = tipo === 'agua' ? 'Histórico de Hidratação' : 'Histórico de Calorias';

        if (registros.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Nenhum registro encontrado.';
            li.style.textAlign = 'center';
            li.style.color = '#666';
            listaRegistros.appendChild(li);
            modal.style.display = 'block';
            return;
        }

        // Agrupa registros por data
        const registrosPorData = {};
        registros.forEach(registro => {
            const data = new Date(registro.data);
            const dataFormatada = data.toLocaleDateString('pt-BR');
            if (!registrosPorData[dataFormatada]) {
                registrosPorData[dataFormatada] = [];
            }
            registrosPorData[dataFormatada].push({
                ...registro,
                hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            });
        });

        // Exibe registros agrupados
        Object.entries(registrosPorData).reverse().forEach(([data, registrosDoDia]) => {
            const dataHeader = document.createElement('li');
            dataHeader.className = 'data-header';
            dataHeader.textContent = data;
            listaRegistros.appendChild(dataHeader);

            registrosDoDia.reverse().forEach(registro => {
                const li = document.createElement('li');
                li.className = 'registro-item';
                
                if (tipo === 'agua') {
                    const litros = (registro.quantidade).toFixed(2);
                    li.textContent = `${litros} litros • ${registro.hora}`;
                } else {
                    li.textContent = `${registro.quantidade} calorias • ${registro.hora}`;
                }
                
                listaRegistros.appendChild(li);
            });
        });

        // Adiciona estilos CSS para melhorar a apresentação
        const style = document.createElement('style');
        style.textContent = `
            .data-header {
                background-color: #f5f5f5;
                padding: 8px 15px;
                font-weight: bold;
                border-bottom: 1px solid #ddd;
                margin-top: 10px;
            }
            .registro-item {
                padding: 8px 15px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .registro-item:hover {
                background-color: #f9f9f9;
            }
        `;
        document.head.appendChild(style);

        modal.style.display = 'block';
    } catch (error) {
        console.error('Erro ao mostrar registros:', error);
    }
}

// Função para fechar o modal
function fecharModal() {
    try {
        const modal = document.getElementById("myModal");
        if (modal) {
            modal.style.display = "none";
            console.log('Modal fechado com sucesso');
        } else {
            console.error('Elemento modal não encontrado');
        }
    } catch (error) {
        console.error('Erro ao fechar modal:', error);
    }
}

// Função para alternar o modo escuro
function toggleDarkMode() {
    try {
        const modoEscuroAtivo = document.body.classList.toggle("modo-escuro");
        localStorage.setItem("modoEscuro", modoEscuroAtivo);
        console.log(`Modo escuro ${modoEscuroAtivo ? 'ativado' : 'desativado'}`);
    } catch (error) {
        console.error('Erro ao alternar modo escuro:', error);
    }
}

// Adicionando listener para botão de alternância do tema
const toggleTemaBtn = document.getElementById("toggle-tema");
if (toggleTemaBtn) {
    toggleTemaBtn.addEventListener("click", toggleDarkMode);
} else {
    console.error('Botão de alternar tema não encontrado');
}

const increaseFontButton = document.getElementById('increase-font');
const decreaseFontButton = document.getElementById('decrease-font');

if (increaseFontButton) {
    increaseFontButton.addEventListener('click', () => {
        try {
            const currentSize = parseFloat(getComputedStyle(document.body).fontSize);
            document.body.style.fontSize = `${currentSize + 1}px`;
            console.log(`Fonte aumentada para ${currentSize + 1}px`);
        } catch (error) {
            console.error('Erro ao aumentar fonte:', error);
        }
    });
} else {
    console.error('Botão de aumentar fonte não encontrado');
}

if (decreaseFontButton) {
    decreaseFontButton.addEventListener('click', () => {
        try {
            const currentSize = parseFloat(getComputedStyle(document.body).fontSize);
            document.body.style.fontSize = `${currentSize - 1}px`;
            console.log(`Fonte diminuída para ${currentSize - 1}px`);
        } catch (error) {
            console.error('Erro ao diminuir fonte:', error);
        }
    });
} else {
    console.error('Botão de diminuir fonte não encontrado');
}

// Adicionando um listener de evento para fechar o modal ao clicar fora dele
window.onclick = function(event) {
    try {
        const modal = document.getElementById("myModal");
        if (event.target === modal) {
            modal.style.display = "none";
            console.log('Modal fechado ao clicar fora dele');
        }
    } catch (error) {
        console.error('Erro ao fechar modal ao clicar fora:', error);
    }
}

// Carrega os dados ao iniciar a página
document.addEventListener('DOMContentLoaded', function() {
    // Carrega o modo escuro
    const modoEscuroAtivo = localStorage.getItem("modoEscuro") === "true";
    if (modoEscuroAtivo) {
        document.body.classList.add("modo-escuro");
    }
    
    // Carrega os dados do usuário
    carregarDados();
});

// Função para salvar registros no localStorage
function salvarRegistros() {
    try {
        localStorage.setItem('registrosAgua', JSON.stringify(registrosAgua));
        localStorage.setItem('registrosCalorias', JSON.stringify(registrosCalorias));
        console.log('Registros salvos com sucesso:', { agua: registrosAgua, calorias: registrosCalorias });
    } catch (error) {
        console.error('Erro ao salvar registros:', error);
    }
}

// Função para formatar data
function formatarData(data) {
    try {
        return data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return 'Data inválida';
    }
}

function checkAchievements() {
    const today = new Date().toISOString().split('T')[0];
    const waterRecords = JSON.parse(localStorage.getItem('waterRecords') || '[]');
    const calorieRecords = JSON.parse(localStorage.getItem('calorieRecords') || '[]');
    
    // Verificar meta diária de água
    const todayWater = waterRecords
        .filter(record => record.date === today)
        .reduce((sum, record) => sum + record.amount, 0);
    
    if (todayWater >= 2000 && !userData.achievements.waterMaster) {
        userData.achievements.waterMaster = true;
        showNotification('Conquista desbloqueada: Mestre da Hidratação!');
    }
    
    // Verificar streak de calorias
    const last7Days = Array.from({length: 7}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
    });
    
    const hasCalorieStreak = last7Days.every(date => 
        calorieRecords.some(record => record.date === date)
    );
    
    if (hasCalorieStreak && !userData.achievements.calorieControl) {
        userData.achievements.calorieControl = true;
        showNotification('Conquista desbloqueada: Controle Calórico!');
    }
    
    // Verificar consistência
    if (userData.streak >= 30 && !userData.achievements.consistency) {
        userData.achievements.consistency = true;
        showNotification('Conquista desbloqueada: Consistência!');
    }
    
    saveUserData();
    updateGamificationUI();
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-message">${message}</div>
    `;
    document.body.appendChild(notification);
    
    // Mostrar a notificação
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Remover a notificação após 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Função para salvar metas
async function salvarMetas() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Você precisa estar logado para salvar metas!');
        return;
    }

    const metaAgua = document.getElementById('metaAgua').value;
    const metaCalorias = document.getElementById('metaCalorias').value;
    const metaPeso = document.getElementById('metaPeso').value;

    try {
        const response = await fetch('http://localhost:3000/metas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                metaAgua: parseFloat(metaAgua),
                metaCalorias: parseFloat(metaCalorias),
                metaPeso: parseFloat(metaPeso)
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Metas salvas com sucesso!');
            carregarMetas(); // Função para recarregar as metas na tela
        } else {
            alert(data.message || 'Erro ao salvar metas');
        }
    } catch (error) {
        console.error('Erro ao salvar metas:', error);
        alert('Erro ao conectar com o servidor');
    }
}

// Função para carregar metas
async function carregarMetas() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('http://localhost:3000/metas', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            atualizarMetasNaTela(data.metas);
        }
    } catch (error) {
        console.error('Erro ao carregar metas:', error);
    }
}

// Função para atualizar metas na tela
function atualizarMetasNaTela(metas) {
    if (!metas) return;

    // Atualizar meta de água
    const aguaCard = document.querySelector('.goal-card:first-child');
    if (aguaCard) {
        const progressBar = aguaCard.querySelector('.progress-bar');
        const currentValue = aguaCard.querySelector('.current-value');
        const targetValue = aguaCard.querySelector('.target-value');

        if (progressBar && currentValue && targetValue) {
            const progress = (metas.meta_hid_atual / metas.meta_hid) * 100;
            progressBar.style.width = `${Math.min(progress, 100)}%`;
            currentValue.textContent = `${metas.meta_hid_atual} ml`;
            targetValue.textContent = `${metas.meta_hid} ml`;

            // Adicionar XP se a meta de água for cumprida
            if (metas.meta_hid_atual >= metas.meta_hid) {
                addXP(500);
                showNotification('Meta de água cumprida! +500 XP');
            }
        }
    }

    // Atualizar meta de calorias
    const caloriasCard = document.querySelector('.goal-card:last-child');
    if (caloriasCard) {
        const progressBar = caloriasCard.querySelector('.progress-bar');
        const currentValue = caloriasCard.querySelector('.current-value');
        const targetValue = caloriasCard.querySelector('.target-value');

        if (progressBar && currentValue && targetValue) {
            const progress = (metas.meta_cal_atual / metas.meta_cal) * 100;
            progressBar.style.width = `${Math.min(progress, 100)}%`;
            currentValue.textContent = `${metas.meta_cal_atual} kcal`;
            targetValue.textContent = `${metas.meta_cal} kcal`;

            // Adicionar XP se a meta de calorias for cumprida
            if (metas.meta_cal_atual >= metas.meta_cal) {
                addXP(500);
                showNotification('Meta de calorias cumprida! +500 XP');
            }
        }
    }
}

// Função para atualizar XP de nível
function atualizarXP(quantidade) {
    const xpAtual = parseInt(localStorage.getItem('xp') || '0');
    const novoXP = xpAtual + quantidade;
    localStorage.setItem('xp', novoXP.toString());

    // Calcular nível baseado no XP
    const nivel = Math.floor(novoXP / 1000) + 1;
    const xpParaProximoNivel = nivel * 1000;
    const xpRestante = novoXP % 1000;
    const progresso = (xpRestante / 1000) * 100;

    // Atualizar interface
    document.getElementById('nivel').textContent = nivel;
    document.getElementById('xp-progress').style.width = `${progresso}%`;
    document.getElementById('xp-text').textContent = `${xpRestante}/${xpParaProximoNivel} XP`;

    // Verificar se subiu de nível
    if (nivel > parseInt(localStorage.getItem('nivel') || '1')) {
        localStorage.setItem('nivel', nivel.toString());
        mostrarNotificacao(`Parabéns! Você subiu para o nível ${nivel}!`);
    }
}

// Função para mostrar notificação
function mostrarNotificacao(mensagem) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <div class="notification-message">${mensagem}</div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function togglePerfilInfo() {
    const perfilInfo = document.getElementById('perfilInfo');
    if (perfilInfo.style.display === 'none') {
        perfilInfo.style.display = 'block';
    } else {
        perfilInfo.style.display = 'none';
    }
}

// Função para lidar com o upload de foto
document.getElementById('avatar-input').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        // Verificar o tipo MIME do arquivo
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione apenas arquivos de imagem (jpg, jpeg, png, gif)');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await fetch('http://localhost:3000/upload-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                document.getElementById('user-avatar').src = data.avatarUrl;
                alert('Avatar atualizado com sucesso!');
            } else {
                const errorData = await response.json();
                alert(errorData.message || 'Erro ao fazer upload da foto');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao fazer upload da foto');
        }
    }
});
