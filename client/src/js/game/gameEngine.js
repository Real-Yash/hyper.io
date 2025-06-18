// This file contains the GameEngine class, which manages the game loop, updates game state, and handles interactions.

class GameEngine {
    constructor(socketClient) {
        this.socket = socketClient;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        
        console.log('GameEngine constructor - Canvas:', this.canvas);
        console.log('GameEngine constructor - Context:', this.ctx);
        
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        
        if (!this.ctx) {
            console.error('Canvas context not available!');
            return;
        }
        
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
        this.lastMoveTime = 0; // For throttling server updates
        this.predictedPosition = { x: 0, y: 0 }; // Client-side prediction
        this.serverPosition = { x: 0, y: 0 }; // Last confirmed server position
        this.targetDirection = { x: 0, y: 0 }; // Target movement direction
        
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
            
            // Update my player reference and sync with server
            if (this.myPlayer) {
                const serverPlayer = data.players.find(p => p.id === this.myPlayer.id);
                if (serverPlayer) {
                    // Store server position for reconciliation
                    this.serverPosition.x = serverPlayer.x;
                    this.serverPosition.y = serverPlayer.y;
                    
                    // Smooth reconciliation between predicted and server position
                    const dx = serverPlayer.x - this.myPlayer.x;
                    const dy = serverPlayer.y - this.myPlayer.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // If difference is small, smoothly interpolate
                    if (distance < 50) {
                        this.myPlayer.x += dx * 0.3; // Smooth correction
                        this.myPlayer.y += dy * 0.3;
                    } else {
                        // Large difference, snap to server position
                        this.myPlayer.x = serverPlayer.x;
                        this.myPlayer.y = serverPlayer.y;
                    }
                    
                    // Update other properties from server
                    this.myPlayer.mass = serverPlayer.mass;
                    this.myPlayer.radius = serverPlayer.radius;
                    this.myPlayer.color = serverPlayer.color;
                }
            }
            
            // Update UI
            this.updateUI();
        });

        this.socket.on('playerDied', (data) => {
            this.showNotification('You were eaten!', 'error');
        });

        // Achievement system events
        this.socket.on('achievementUnlocked', (achievements) => {
            this.showAchievementNotification(achievements);
        });

        // Power-up system events
        this.socket.on('powerUpCollected', (data) => {
            this.showPowerUpNotification(data);
        });

        // Strategic kill events
        this.socket.on('strategicKillSuccess', (data) => {
            this.showNotification(`Strategic Kill! Captured ${data.victimName} (+${Math.floor(data.massGained)} mass)`, 'success');
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
            // Client-side movement prediction
            if (this.targetDirection.x !== 0 || this.targetDirection.y !== 0) {
                const speed = Math.min(6, 120 / Math.sqrt(this.myPlayer.mass));
                const moveDistance = speed * (deltaTime / 16.67); // Normalize to 60fps
                
                this.myPlayer.x += this.targetDirection.x * moveDistance;
                this.myPlayer.y += this.targetDirection.y * moveDistance;
                
                // Update direction for visual arrow
                this.myPlayer.directionX = this.targetDirection.x;
                this.myPlayer.directionY = this.targetDirection.y;
            }
            
            // Ultra-smooth camera movement
            const targetX = this.myPlayer.x - this.canvas.width / 2;
            const targetY = this.myPlayer.y - this.canvas.height / 2;
            const targetScale = Math.max(0.5, Math.min(1.2, 40 / Math.sqrt(this.myPlayer.mass)));
            
            // Ultra-smooth interpolation for camera (higher smoothing)
            const smoothingFactor = 0.15; // Increased for smoother camera
            const scaleSmoothingFactor = 0.08; // Smoother scaling
            
            this.camera.x += (targetX - this.camera.x) * smoothingFactor;
            this.camera.y += (targetY - this.camera.y) * smoothingFactor;
            this.camera.scale += (targetScale - this.camera.scale) * scaleSmoothingFactor;
        }
    }

    render() {
        if (!this.canvas || !this.ctx) {
            console.error('Canvas or context not available for rendering');
            return;
        }
        
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
        this.gameState.food.forEach(food => this.drawFood(food));
        
        // Draw power-ups
        if (this.gameState.powerUps) {
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
        this.ctx.save();
        
        // Draw the main power-up circle
        this.ctx.beginPath();
        this.ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = powerUp.color || '#fff';
        this.ctx.globalAlpha = 0.8;
        this.ctx.fill();
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = '#222';
        this.ctx.stroke();
        
        // Add pulsing glow effect
        const pulseIntensity = 1 + 0.3 * Math.sin(Date.now() * 0.005);
        this.ctx.shadowColor = powerUp.color;
        this.ctx.shadowBlur = 10 * pulseIntensity;
        this.ctx.globalAlpha = 0.6;
        this.ctx.fill();
        
        // Reset for icon drawing
        this.ctx.globalAlpha = 1.0;
        this.ctx.shadowBlur = 0;
        
        // Get icon for power-up type
        const powerUpIcons = {
            'speed_boost': '⚡',
            'mass_magnet': '🧲',
            'shield': '🛡️',
            'double_mass': '✨',
            'split_immunity': '🔒',
            'vision_boost': '👁️'
        };
        
        const icon = powerUpIcons[powerUp.type] || '❓';
        
        // Draw the icon in the center of the power-up
        this.ctx.font = `${powerUp.radius * 1.2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#fff';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.strokeText(icon, powerUp.x, powerUp.y);
        this.ctx.fillText(icon, powerUp.x, powerUp.y);
        
        // Draw type name below the power-up
        this.ctx.font = '10px Arial';
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = '#fff';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        const typeName = powerUp.type.replace('_', ' ').toUpperCase();
        this.ctx.strokeText(typeName, powerUp.x, powerUp.y + powerUp.radius + 4);
        this.ctx.fillText(typeName, powerUp.x, powerUp.y + powerUp.radius + 4);
        
        this.ctx.restore();
    }

    drawPlayer(player) {
        if (!player.isAlive) return;
        
        // Draw team ring if player has a team
        if (player.teamId) {
            this.ctx.strokeStyle = player.color;
            this.ctx.lineWidth = 6;
            this.ctx.setLineDash([10, 5]); // Dashed line for team indicator
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]); // Reset line dash
        }
        
        // Draw main cell
        this.ctx.fillStyle = player.color;
        this.ctx.strokeStyle = player.teamId ? player.color : '#fff';
        this.ctx.lineWidth = player.teamId ? 4 : 3;
        
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        // Draw split cells if they exist
        if (player.cells && player.cells.length > 1) {
            for (let i = 1; i < player.cells.length; i++) {
                const cell = player.cells[i];
                
                // Draw split cell
                this.ctx.fillStyle = player.color;
                this.ctx.strokeStyle = cell.isStrategic ? '#ff0000' : '#fff'; // Red border for strategic cells
                this.ctx.lineWidth = cell.isStrategic ? 4 : 2;
                
                const cellRadius = Math.sqrt(cell.mass) * 2;
                this.ctx.beginPath();
                this.ctx.arc(cell.x, cell.y, cellRadius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // Draw velocity indicator for strategic cells
                if (cell.isStrategic && cell.velocityX && cell.velocityY) {
                    this.ctx.strokeStyle = '#ff0000';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(cell.x, cell.y);
                    this.ctx.lineTo(
                        cell.x + cell.velocityX * 10, 
                        cell.y + cell.velocityY * 10
                    );
                    this.ctx.stroke();
                }
                
                // Draw connection line between main cell and split cells
                this.ctx.strokeStyle = player.color;
                this.ctx.lineWidth = 1;
                this.ctx.globalAlpha = 0.3;
                this.ctx.beginPath();
                this.ctx.moveTo(player.x, player.y);
                this.ctx.lineTo(cell.x, cell.y);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
        }
        
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
        
        // Draw team name if in team mode
        if (player.teamId) {
            this.ctx.fillStyle = player.color;
            this.ctx.font = `${Math.max(8, player.radius / 5)}px Arial`;
            this.ctx.fillText(`[${player.teamId}]`, player.x, player.y - player.radius - 15);
        }
        
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
            
            // Calculate movement direction
            const dx = worldX - this.myPlayer.x;
            const dy = worldY - this.myPlayer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) { // Dead zone
                // Normalize direction for client prediction
                this.targetDirection.x = dx / distance;
                this.targetDirection.y = dy / distance;
            } else {
                // Stop movement
                this.targetDirection.x = 0;
                this.targetDirection.y = 0;
            }
            
            // Throttle server updates to reduce network load
            if (!this.lastMoveTime || Date.now() - this.lastMoveTime > 50) { // 20 FPS for network
                this.socket.move(worldX, worldY);
                this.lastMoveTime = Date.now();
            }
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

    // Perform strategic split towards mouse position
    performStrategicSplit() {
        if (!this.myPlayer) return;
        
        // Use last known mouse position
        const worldX = (this.mousePos.x / this.camera.scale) + this.camera.x;
        const worldY = (this.mousePos.y / this.camera.scale) + this.camera.y;
        
        console.log(`Strategic split towards world position: (${worldX}, ${worldY})`);
        this.socket.strategicSplit(worldX, worldY);
        this.showNotification('Strategic split activated!', 'info');
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

    showAchievementNotification(achievements) {
        const notifications = document.getElementById('notifications');
        if (!notifications) return;
        
        achievements.forEach(achievement => {
            const notification = document.createElement('div');
            notification.className = 'notification achievement';
            notification.textContent = `Achievement unlocked: ${achievement.name}`;
            
            notifications.appendChild(notification);
            
            // Remove notification after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        });
    }

    showPowerUpNotification(powerUp) {
        const notifications = document.getElementById('notifications');
        if (!notifications) return;
        
        // Get icon for power-up type
        const powerUpIcons = {
            'speed_boost': '⚡',
            'mass_magnet': '🧲',
            'shield': '🛡️',
            'double_mass': '✨',
            'split_immunity': '🔒',
            'vision_boost': '👁️'
        };
        
        const icon = powerUpIcons[powerUp.type] || '❓';
        const typeName = powerUp.type.replace('_', ' ').toUpperCase();
        const description = powerUp.effect?.description || '';
        
        const notification = document.createElement('div');
        notification.className = 'notification powerup';
        notification.innerHTML = `
            <span style="font-size: 18px; margin-right: 8px;">${icon}</span>
            <strong>${typeName}</strong><br>
            <small>${description}</small>
        `;
        notification.style.cssText = `
            background: linear-gradient(135deg, ${powerUp.effect?.color || '#4a5568'}, rgba(0,0,0,0.8));
            border-left: 4px solid ${powerUp.effect?.color || '#fff'};
            color: white;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        notifications.appendChild(notification);
        
        // Remove notification after 4 seconds (longer for power-ups)
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }
}

// Export the GameEngine class
export default GameEngine;