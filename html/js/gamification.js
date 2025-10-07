const gamification = {
    init: function() {
        console.log('Sistema de gamificação iniciado');
        this.updateLevel();
        this.updateProgress();
        this.checkAchievements();
    },

    updateLevel: function() {
        const level = localStorage.getItem('userLevel') || 1;
        document.getElementById('user-level').textContent = `Nível ${level}`;
    },

    updateProgress: function() {
        const xp = parseInt(localStorage.getItem('userXP')) || 0;
        const nextLevel = 1000; // XP necessário para o próximo nível
        const progress = (xp / nextLevel) * 100;
        
        const progressBar = document.querySelector('.xp-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        const currentXP = document.querySelector('.current-xp');
        if (currentXP) {
            currentXP.textContent = `${xp} XP`;
        }
    },

    checkAchievements: function() {
        // Verificar conquistas baseadas nos dados do localStorage
        const waterTotal = parseInt(localStorage.getItem('totalWater')) || 0;
        const caloriesTotal = parseInt(localStorage.getItem('totalCalories')) || 0;
        
        // Exemplo de verificação de conquistas
        if (waterTotal >= 2000) {
            this.unlockAchievement('water-achievement');
        }
        
        if (caloriesTotal >= 2000) {
            this.unlockAchievement('calories-achievement');
        }
    },

    unlockAchievement: function(achievementId) {
        const achievement = document.getElementById(achievementId);
        if (achievement && !achievement.classList.contains('unlocked')) {
            achievement.classList.add('unlocked');
            this.showNotification(`Conquista desbloqueada: ${achievement.querySelector('.achievement-name').textContent}`);
        }
    },

    showNotification: function(message) {
        const notification = document.getElementById('notification');
        const messageElement = notification.querySelector('.notification-message');
        
        if (notification && messageElement) {
            messageElement.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }
};

// Adicionar ao window para acesso global
window.gamification = gamification; 