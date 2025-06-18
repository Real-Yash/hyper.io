// This file contains the GameEngine class, which manages the game loop, updates game state, and handles interactions.

class GameEngine {
    constructor(socketClient) {
        this.socket = socketClient;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        console.log('GameEngine constructor - Canvas:', this.canvas);
        console.log('GameEngine constructor - Context:', this.ctx);
        console.log('GameEngine constructor - Canvas size:', this.canvas.width, 'x', this.canvas.height);
        
        this.gameState = {
            players: [],
            food: [],
            leaderboard: []
        };
        
        this.camera = {
            x: 0,
            y: 0,
            scale: 1,
            targetX: 0,
            targetY: 0,
            targetScale: 1
        };
        
        this.myPlayer = null;
        this.isRunning = false;
        this.mousePos = { x: 0, y: 0 };
        this.lastRenderTime = 0;
        this.renderDelta = 0;
        
        // Performance optimization
        this.frameSkip = 0;
        this.maxFPS = 60;
        this.minFrameTime = 1000 / this.maxFPS;
        
        this.setupSocketEvents();
    }

    setupSocketEvents() {
        this.socket.on('gameState', (data) => {
            console.log('Received gameState:', data);
            this.gameState = data;
            this.myPlayer = data.players.find(p => p.id === data.playerId);
            console.log('My player:', this.myPlayer);
            this.start();
        });

        this.socket.on('gameUpdate', (data) => {
            console.log('Received gameUpdate:', data);
            this.gameState.players = data.players;
            this.gameState.food = data.food;
            this.gameState.powerUps = data.powerUps || [];
            this.gameState.leaderboard = data.leaderboard;
            this.gameState.teamScores = data.teamScores;
            
            console.log('Players count:', data.players.length);
            console.log('Food count:', data.food.length);
            console.log('Power-ups count:', this.gameState.powerUps.length);
            
            // Update my player reference
            if (this.myPlayer) {
                this.myPlayer = data.players.find(p => p.id === this.myPlayer.id);
            }
            
            // Update UI
            this.updateUI();
        });

        this.socket.on('playerDied', (data) => {
            this.showNotification('You were eaten!', 'error');
        });

        // Achievement system events
        this.socket.on('achievementUnlocked', (achievements) => {
            achievements.forEach(achievement => {
                this.showAchievementNotification(achievement);
            });
        });

        // Power-up system events
        this.socket.on('powerUpCollected', (powerUp) => {
            this.showPowerUpNotification(powerUp);
        });
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.gameLoop();
    }

    stop() {
        this.isRunning = false;
    }

    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;

        // Frame rate limiting
        this.renderDelta = currentTime - this.lastRenderTime;
        
        if (this.renderDelta >= this.minFrameTime) {
            this.update(this.renderDelta);
            this.render();
            this.lastRenderTime = currentTime;
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        if (this.myPlayer) {
            // Ultra-smooth camera movement
            const targetX = this.myPlayer.x - this.canvas.width / 2;
            const targetY = this.myPlayer.y - this.canvas.height / 2;
            const targetScale = Math.max(0.5, Math.min(1.2, 40 / Math.sqrt(this.myPlayer.mass)));
            
            // Ultra-smooth interpolation for camera (higher smoothing)
            const smoothingFactor = 0.12; // Increased for smoother camera
            const scaleSmoothingFactor = 0.05; // Smoother scaling
            
            this.camera.x += (targetX - this.camera.x) * smoothingFactor;
            this.camera.y += (targetY - this.camera.y) * smoothingFactor;
            this.camera.scale += (targetScale - this.camera.scale) * scaleSmoothingFactor;
        }
    }

    render() {
        // Clear canvas with a background color
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for transformations
        this.ctx.save();
        
        // Apply camera transformations
        this.ctx.scale(this.camera.scale, this.camera.scale);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Enable image smoothing for better performance
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'medium';
        
        // Draw grid (only if zoomed in enough)
        if (this.camera.scale > 0.5) {
            this.drawGrid();
        }
        
        // Draw food
        console.log('Drawing food, count:', this.gameState.food.length);
        this.gameState.food.forEach(food => this.drawFood(food));
        
        // Draw power-ups
        if (this.gameState.powerUps) {
            console.log('Drawing power-ups, count:', this.gameState.powerUps.length);
            this.gameState.powerUps.forEach(powerUp => this.drawPowerUp(powerUp));
        }
        
        // Draw players (others first, then own player)
        const otherPlayers = this.gameState.players.filter(p => p.id !== (this.myPlayer ? this.myPlayer.id : null));
        const myPlayerArray = this.myPlayer ? [this.myPlayer] : [];
        
        console.log('Drawing players - others:', otherPlayers.length, 'me:', myPlayerArray.length);
        [...otherPlayers, ...myPlayerArray].forEach(player => this.drawPlayer(player));
        
        // Restore context
        this.ctx.restore();
        
        // Draw UI elements (not affected by camera)
        this.drawUI();
    }

    drawGrid() {
        const gridSize = 50;
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endX = this.camera.x + this.canvas.width / this.camera.scale;
        const endY = this.camera.y + this.canvas.height / this.camera.scale;
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1 / this.camera.scale; // Scale-aware line width
        this.ctx.globalAlpha = Math.min(0.3, this.camera.scale * 0.5); // Fade out when zoomed out
        
        this.ctx.beginPath();
        
        // Limit number of grid lines for performance
        const maxLines = 50;
        const stepX = Math.max(gridSize, (endX - startX) / maxLines);
        const stepY = Math.max(gridSize, (endY - startY) / maxLines);
        
        for (let x = startX; x <= endX; x += stepX) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }
        for (let y = startY; y <= endY; y += stepY) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
    }

    drawFood(food) {
        this.ctx.fillStyle = food.color;
        this.ctx.beginPath();
        this.ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawPowerUp(powerUp) {
        // Draw power-up with pulsing effect
        const pulseIntensity = Math.sin(Date.now() / 200) * 0.3 + 0.7;
        const radius = powerUp.radius * pulseIntensity;
        
        // Outer glow
        this.ctx.shadowColor = powerUp.color;
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = powerUp.color;
        this.ctx.beginPath();
        this.ctx.arc(powerUp.x, powerUp.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Inner core
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.beginPath();
        this.ctx.arc(powerUp.x, powerUp.y, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Power-up type indicator
        this.ctx.fillStyle = '#000000';
        this.ctx.font = `${Math.max(8, radius / 2)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(powerUp.type.charAt(0).toUpperCase(), powerUp.x, powerUp.y);
    }

    drawPlayer(player) {
        if (!player.isAlive) return;
        
        // Draw main cell
        this.ctx.fillStyle = player.color;
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw directional arrow for own player
        if (this.myPlayer && player.id === this.myPlayer.id) {
            this.drawDirectionArrow(player);
        }
        
        // Helper function to format name for display inside cell
        const getDisplayName = (name) => {
            const words = name.trim().split(/\s+/);
            
            if (words.length === 1) {
                // Single word
                if (words[0].length === 1) {
                    // Single character - keep it
                    return words[0];
                } else if (words[0].length === 2) {
                    // Two characters - keep both
                    return words[0].toUpperCase();
                } else {
                    // More than two characters - keep first initial only
                    return words[0].charAt(0).toUpperCase();
                }
            } else if (words.length === 2) {
                // Two words - keep both initials
                return words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
            } else {
                // More than two words - keep first initial only
                return words[0].charAt(0).toUpperCase();
            }
        };

        // Draw abbreviated player name inside cell
        this.ctx.fillStyle = '#fff';
        this.ctx.font = `${Math.max(12, player.radius / 3)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(getDisplayName(player.name), player.x, player.y);
        
        // Draw full player name below the cell
        this.ctx.fillStyle = '#fff';
        this.ctx.font = `${Math.max(10, player.radius / 4)}px Arial`;
        this.ctx.fillText(player.name, player.x, player.y + player.radius + 15);
    }

    drawDirectionArrow(player) {
        // Use the player's current direction instead of calculating from mouse
        if (player.directionX === 0 && player.directionY === 0) {
            return; // Don't draw arrow if no movement
        }
        
        const dx = player.directionX;
        const dy = player.directionY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0.01) { // Only draw if there's significant direction
            // Normalize direction
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Arrow position (on the edge of the cell)
            const arrowDistance = player.radius + 15;
            const arrowX = player.x + dirX * arrowDistance;
            const arrowY = player.y + dirY * arrowDistance;
            
            // Arrow size based on cell size
            const arrowSize = Math.max(8, Math.min(15, player.radius / 3));
            
            // Draw arrow
            this.ctx.save();
            this.ctx.translate(arrowX, arrowY);
            this.ctx.rotate(Math.atan2(dy, dx));
            
            // Arrow style
            this.ctx.fillStyle = '#ffffff';
            this.ctx.strokeStyle = player.color;
            this.ctx.lineWidth = 2;
            
            // Draw arrow shape
            this.ctx.beginPath();
            this.ctx.moveTo(arrowSize, 0);
            this.ctx.lineTo(-arrowSize/2, -arrowSize/2);
            this.ctx.lineTo(-arrowSize/4, 0);
            this.ctx.lineTo(-arrowSize/2, arrowSize/2);
            this.ctx.closePath();
            
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }

    drawUI() {
        // UI is handled by separate UI classes
    }

    handleMouseMove(x, y) {
        this.mousePos.x = x;
        this.mousePos.y = y;
        
        if (this.myPlayer) {
            // Convert screen coordinates to world coordinates
            const worldX = (x / this.camera.scale) + this.camera.x;
            const worldY = (y / this.camera.scale) + this.camera.y;
            
            this.socket.move(worldX, worldY);
        }
    }

    handleRightClick(x, y) {
        if (!this.myPlayer) return;
        
        // Convert screen coordinates to world coordinates
        const worldX = (x / this.camera.scale) + this.camera.x;
        const worldY = (y / this.camera.scale) + this.camera.y;
        
        // Find player at click position
        const clickedPlayer = this.gameState.players.find(player => {
            if (player.id === this.myPlayer.id) return false;
            
            const dx = worldX - player.x;
            const dy = worldY - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance <= player.radius;
        });
        
        if (clickedPlayer) {
            this.socket.sendFriendRequest(clickedPlayer.id);
            this.showNotification(`Friend request sent to ${clickedPlayer.name}`, 'info');
        }
    }

    updateUI() {
        // Update player stats
        if (this.myPlayer) {
            const nameDisplay = document.getElementById('player-name-display');
            const massDisplay = document.getElementById('player-mass-display');
            const posDisplay = document.getElementById('player-position-display');
            
            if (nameDisplay) nameDisplay.textContent = this.myPlayer.name;
            if (massDisplay) massDisplay.textContent = `Mass: ${Math.floor(this.myPlayer.mass)}`;
            if (posDisplay) posDisplay.textContent = `Position: (${Math.floor(this.myPlayer.x)}, ${Math.floor(this.myPlayer.y)})`;
        }
        
        // Update leaderboard
        const leaderboardList = document.getElementById('leaderboard-list');
        if (leaderboardList && this.gameState.leaderboard) {
            leaderboardList.innerHTML = '';
            this.gameState.leaderboard.forEach((entry, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${index + 1}. ${entry.name}</span>
                    <span>${Math.floor(entry.mass)}</span>
                `;
                leaderboardList.appendChild(li);
            });
        }
        
        // Update team scores
        if (this.gameState.teamScores && this.gameState.config) {
            this.updateTeamScores(this.gameState.teamScores, this.gameState.config);
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
    }

    showNotification(message, type = 'info') {
        const notifications = document.getElementById('notifications');
        if (!notifications) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notifications.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    showAchievementNotification(achievement) {
        const notifications = document.getElementById('notifications');
        if (!notifications) return;
        
        const notification = document.createElement('div');
        notification.className = 'notification achievement';
        notification.innerHTML = `
            <strong>🏆 Achievement Unlocked!</strong><br>
            <span>${achievement.name}</span><br>
            <small>${achievement.description}</small>
        `;
        
        notifications.appendChild(notification);
        
        // Remove notification after 5 seconds for achievements
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    showPowerUpNotification(powerUp) {
        const notifications = document.getElementById('notifications');
        if (!notifications) return;
        
        const notification = document.createElement('div');
        notification.className = 'notification power-up';
        notification.innerHTML = `
            <strong>⚡ Power-up Activated!</strong><br>
            <span>${powerUp.type.replace('_', ' ').toUpperCase()}</span><br>
            <small>${powerUp.effect.description}</small>
        `;
        
        notifications.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

export default GameEngine;