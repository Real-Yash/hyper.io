// This file manages the overall game UI, including displaying scores and player stats.

class GameUI {
    constructor() {
        this.initialized = false;
        this.init();
    }

    init() {
        // Initialize UI elements if they exist
        this.scoreElement = document.getElementById('score');
        this.playerStatsElement = document.getElementById('player-stats');
        this.initialized = true;
    }

    updateScore(score) {
        if (this.scoreElement) {
            this.scoreElement.innerText = `Score: ${score}`;
        }
    }

    updatePlayerStats(player) {
        if (this.playerStatsElement) {
            this.playerStatsElement.innerText = `Mass: ${player.mass} | Friends: ${player.friends ? player.friends.length : 0}`;
        }
        // Mobile floating mass display (now using player-stats panel instead)
        const mobileMass = document.getElementById('player-mass-mobile');
        if (mobileMass) {
            if (/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)) {
                mobileMass.style.display = 'none'; // Hide the circle, use stats panel instead
                // Show desktop mass display and player-stats
                const desktopMass = document.getElementById('player-mass-display');
                if (desktopMass) desktopMass.style.display = '';
                const statsPanel = document.getElementById('player-stats');
                if (statsPanel) statsPanel.style.display = '';
            } else {
                mobileMass.style.display = 'none';
                // Show desktop mass display and player-stats
                const desktopMass = document.getElementById('player-mass-display');
                if (desktopMass) desktopMass.style.display = '';
                const statsPanel = document.getElementById('player-stats');
                if (statsPanel) statsPanel.style.display = '';
            }
        }
    }

    updateTeamScores(teamScores, config) {
        const teamScoresPanel = document.getElementById('team-scores');
        const teamScoresList = document.getElementById('team-scores-list');
        
        if (!teamScoresList) return;
        
        // Show team scores panel if there are teams
        if (teamScores && Object.keys(teamScores).length > 0) {
            teamScoresPanel.style.display = 'block';
            
            // Clear existing scores
            teamScoresList.innerHTML = '';
            
            // Sort teams by score
            const sortedTeams = Object.entries(teamScores)
                .sort(([,a], [,b]) => b - a);
            
            // Display team scores
            sortedTeams.forEach(([teamId, score]) => {
                if (config && config.TEAMS && config.TEAMS[teamId]) {
                    const teamInfo = config.TEAMS[teamId];
                    
                    const teamItem = document.createElement('div');
                    teamItem.className = 'team-score-item';
                    
                    teamItem.innerHTML = `
                        <div class="team-name">
                            <div class="team-color-indicator" style="background-color: ${teamInfo.color}"></div>
                            ${teamInfo.name}
                        </div>
                        <div class="team-score">${Math.floor(score)}</div>
                    `;
                    
                    teamScoresList.appendChild(teamItem);
                }
            });
        } else {
            teamScoresPanel.style.display = 'none';
        }
    }

    displayMessage(message, type = 'info', duration = 3000) {
        const notifications = document.getElementById('notifications');
        if (!notifications) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notifications.appendChild(notification);
        
        // Remove notification after specified duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, duration);
    }

    showGameOver(finalScore, killer) {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            z-index: 1000;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        `;
        
        gameOverDiv.innerHTML = `
            <h2 style="margin-bottom: 15px; color: #ff6b6b;">Game Over!</h2>
            <p style="margin-bottom: 10px;">Final Mass: ${Math.floor(finalScore)}</p>
            ${killer ? `<p style="margin-bottom: 20px;">Eaten by: ${killer}</p>` : ''}
            <button onclick="location.reload()" style="
                padding: 10px 20px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 25px;
                cursor: pointer;
                font-size: 16px;
            ">Play Again</button>
        `;
        
        document.body.appendChild(gameOverDiv);
    }
}

export default GameUI;