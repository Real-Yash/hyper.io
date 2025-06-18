// server/src/server.js

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const Player = require('./game/player');
const Food = require('./game/food');
const Friendship = require('./game/friendship');
const AchievementSystem = require('./game/achievements');
const { PowerUpSystem } = require('./game/powerup');

const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware to serve static files
app.use(express.static(path.join(__dirname, '../../client')));

// Game constants
const GAME_CONFIG = {
    WORLD_WIDTH: 5000,
    WORLD_HEIGHT: 5000,
    FOOD_COUNT: 2000,
    INITIAL_MASS: 25, // Slightly higher starting mass
    SPLIT_MASS_RATIO: 0.5,
    MASS_LOSS_RATE: 0.0001, // Much slower mass loss for better gameplay
    MIN_MASS: 15, // Higher minimum mass
    FOOD_MASS: 3, // Increased from 1 for faster growth and better visibility
    MAX_SPEED: 0.167, // 10 pixels per second (10/60 at 60 FPS)
    EJECT_MASS: 2,
    UPDATE_RATE: 120, // Increased to 120 FPS for ultra-responsive movement
    MOVEMENT_SMOOTHING: 1, // Full movement for precise control
    TEAMS: {
        RED: { name: 'Red Team', color: '#FF4444', maxPlayers: 10 },
        BLUE: { name: 'Blue Team', color: '#4444FF', maxPlayers: 10 },
        GREEN: { name: 'Green Team', color: '#44FF44', maxPlayers: 10 },
        YELLOW: { name: 'Yellow Team', color: '#FFFF44', maxPlayers: 10 }
    }
};

// Game state
const gameState = {
    players: new Map(),
    food: new Map(),
    friendships: new Map(), // playerId -> Set of friend playerIds
    friendRequests: new Map(), // playerId -> Set of pending request playerIds
    teams: new Map(), // teamId -> Set of player IDs
    teamScores: new Map() // teamId -> total team mass
};

// Initialize game systems
const achievementSystem = new AchievementSystem();
const powerUpSystem = new PowerUpSystem();

// Initialize food and teams
function initializeFood() {
    gameState.food.clear();
    for (let i = 0; i < GAME_CONFIG.FOOD_COUNT; i++) {
        const foodId = uuidv4();
        gameState.food.set(foodId, new Food(
            foodId,
            Math.random() * GAME_CONFIG.WORLD_WIDTH,
            Math.random() * GAME_CONFIG.WORLD_HEIGHT,
            GAME_CONFIG.FOOD_MASS
        ));
    }
}

function initializeTeams() {
    // Initialize team data structures
    Object.keys(GAME_CONFIG.TEAMS).forEach(teamId => {
        gameState.teams.set(teamId, new Set());
        gameState.teamScores.set(teamId, 0);
    });
}

function getBalancedTeam() {
    // Find the team with the least players
    let smallestTeam = null;
    let smallestSize = Infinity;
    
    Object.keys(GAME_CONFIG.TEAMS).forEach(teamId => {
        const teamSize = gameState.teams.get(teamId).size;
        const maxPlayers = GAME_CONFIG.TEAMS[teamId].maxPlayers;
        
        if (teamSize < maxPlayers && teamSize < smallestSize) {
            smallestSize = teamSize;
            smallestTeam = teamId;
        }
    });
    
    return smallestTeam;
}

// Socket connection handling
io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    // Handle player joining
    socket.on('joinGame', (data) => {
        if (!gameState.players.has(socket.id)) {
            const playerName = data.playerName || `Player${Math.floor(Math.random() * 1000)}`;
            const teamMode = data.teamMode || false;
            let assignedTeam = null;
            
            // Assign team if team mode is enabled
            if (teamMode) {
                assignedTeam = getBalancedTeam();
                if (assignedTeam) {
                    gameState.teams.get(assignedTeam).add(socket.id);
                    console.log(`Player ${playerName} assigned to team ${assignedTeam}`);
                } else {
                    console.log(`No available teams for player ${playerName}`);
                }
            } else {
                console.log(`Player ${playerName} joined in regular mode`);
            }
            
            // Initialize achievement tracking for new player
            achievementSystem.initializePlayer(socket.id);
            
            const player = new Player(
                socket.id,
                playerName,
                Math.random() * GAME_CONFIG.WORLD_WIDTH,
                Math.random() * GAME_CONFIG.WORLD_HEIGHT,
                GAME_CONFIG.INITIAL_MASS,
                assignedTeam
            );
            
            gameState.players.set(socket.id, player);
            gameState.friendships.set(socket.id, new Set());
            gameState.friendRequests.set(socket.id, new Set());
            
            // Send initial game state to the new player
            socket.emit('gameState', {
                playerId: socket.id,
                players: Array.from(gameState.players.values()).map(p => p.serialize()),
                food: Array.from(gameState.food.values()).map(f => f.serialize()),
                powerUps: powerUpSystem.serialize(),
                config: GAME_CONFIG,
                teamScores: Object.fromEntries(gameState.teamScores),
                achievements: achievementSystem.getPlayerAchievements(socket.id)
            });
            
            console.log(`Player ${playerName} (${socket.id}) joined the game${assignedTeam ? ` on team ${assignedTeam}` : ''}`);
        }
    });

    // Handle player movement
    socket.on('move', (data) => {
        const player = gameState.players.get(socket.id);
        if (player) {
            player.updateDirection(data.x, data.y);
        }
    });

    // Handle splitting
    socket.on('split', () => {
        const player = gameState.players.get(socket.id);
        console.log(`Split request from player: ${player ? player.name : 'unknown'}`);
        if (player && player.canSplit()) {
            const success = player.split();
            console.log(`Split result: ${success}`);
        } else {
            console.log(`Split denied: player=${!!player}, canSplit=${player ? player.canSplit() : false}`);
        }
    });

    // Handle strategic splitting
    socket.on('strategicSplit', (data) => {
        const player = gameState.players.get(socket.id);
        console.log(`Strategic split request from player: ${player ? player.name : 'unknown'} towards (${data.targetX}, ${data.targetY})`);
        if (player && player.canSplit()) {
            const success = player.strategicSplit(data.targetX, data.targetY);
            console.log(`Strategic split result: ${success}`);
        } else {
            console.log(`Strategic split denied: player=${!!player}, canSplit=${player ? player.canSplit() : false}`);
        }
    });

    // Handle mass ejection
    socket.on('eject', () => {
        const player = gameState.players.get(socket.id);
        if (player && player.mass > GAME_CONFIG.EJECT_MASS + GAME_CONFIG.MIN_MASS) {
            const ejectedMass = player.ejectMass(GAME_CONFIG.EJECT_MASS);
            if (ejectedMass) {
                const foodId = uuidv4();
                gameState.food.set(foodId, ejectedMass);
            }
        }
    });

    // Handle friend requests
    socket.on('sendFriendRequest', (targetPlayerId) => {
        const friendship = new Friendship();
        friendship.sendFriendRequest(socket.id, targetPlayerId, gameState, io);
    });

    // Handle friend request response
    socket.on('respondToFriendRequest', (data) => {
        const friendship = new Friendship();
        friendship.respondToFriendRequest(socket.id, data.senderId, data.accept, gameState, io);
    });

    // Handle breaking friendship
    socket.on('breakFriendship', (friendId) => {
        const friendship = new Friendship();
        friendship.breakFriendship(socket.id, friendId, gameState, io);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        const player = gameState.players.get(socket.id);
        
        if (player) {
            // Remove from team if applicable
            if (player.teamId && gameState.teams.has(player.teamId)) {
                gameState.teams.get(player.teamId).delete(socket.id);
            }
            
            gameState.players.delete(socket.id);
            gameState.friendships.delete(socket.id);
            gameState.friendRequests.delete(socket.id);
            
            // Clean up friendships with this player
            gameState.friendships.forEach(friendSet => {
                friendSet.delete(socket.id);
            });
            
            console.log(`Player disconnected: ${socket.id}`);
        }
    });
});

// Game loop
function gameLoop() {
    // Update power-up system
    powerUpSystem.update(GAME_CONFIG);
    
    // Update all players
    gameState.players.forEach(player => {
        // Apply power-up effects to movement
        const speedMultiplier = powerUpSystem.getEffectMultiplier(player.id, 'speed');
        const modifiedConfig = { ...GAME_CONFIG, MAX_SPEED: GAME_CONFIG.MAX_SPEED * speedMultiplier };
        
        player.update(modifiedConfig);
        
        // Check power-up collisions
        const collectedPowerUp = powerUpSystem.checkCollision(player);
        if (collectedPowerUp) {
            io.to(player.id).emit('powerUpCollected', {
                type: collectedPowerUp.type,
                effect: collectedPowerUp.effect,
                duration: collectedPowerUp.duration
            });
        }
        
        // Check food collisions
        gameState.food.forEach((food, foodId) => {
            if (player.checkCollision(food)) {
                // Apply power-up mass multiplier
                const massMultiplier = powerUpSystem.getEffectMultiplier(player.id, 'mass');
                const massGain = food.mass * massMultiplier;
                
                player.mass += massGain;
                gameState.food.delete(foodId);
                
                // Update achievement progress
                const newAchievements = achievementSystem.updatePlayerStat(player.id, 'food_eaten', 
                    achievementSystem.playerProgress.get(player.id)?.stats.food_eaten + 1 || 1);
                
                if (newAchievements.length > 0) {
                    io.to(player.id).emit('achievementUnlocked', newAchievements);
                }
                
                // Check mass achievement
                const massAchievements = achievementSystem.updatePlayerStat(player.id, 'mass', player.mass);
                if (massAchievements.length > 0) {
                    io.to(player.id).emit('achievementUnlocked', massAchievements);
                }
                
                // Spawn new food
                const newFoodId = uuidv4();
                gameState.food.set(newFoodId, new Food(
                    newFoodId,
                    Math.random() * GAME_CONFIG.WORLD_WIDTH,
                    Math.random() * GAME_CONFIG.WORLD_HEIGHT,
                    GAME_CONFIG.FOOD_MASS
                ));
            }
        });
        
        // Check player collisions (including split cells)
        gameState.players.forEach(otherPlayer => {
            if (player.id !== otherPlayer.id) {
                // Check if they are friends
                const areFriends = gameState.friendships.has(player.id) && 
                                 gameState.friendships.get(player.id).has(otherPlayer.id);
                
                // Check if they are teammates
                const areTeammates = player.teamId && otherPlayer.teamId && 
                                   player.teamId === otherPlayer.teamId;
                
                // Get all cells from current player
                const playerCells = player.getAllCells();
                
                // Check collision between each cell of current player and other player's main cell
                playerCells.forEach(cell => {
                    const dx = cell.x - otherPlayer.x;
                    const dy = cell.y - otherPlayer.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDistance = cell.radius + otherPlayer.getRadius();
                    
                    if (distance < minDistance) {
                        // Cannot consume friends or teammates
                        if (!areFriends && !areTeammates && cell.mass > otherPlayer.mass * 1.2) {
                            // Apply damage reduction from shield power-up
                            const damageReduction = powerUpSystem.getDamageReduction(otherPlayer.id);
                            const actualMassGain = otherPlayer.mass * (1 - damageReduction);
                            
                            // Strategic cells get bonus mass for successful captures
                            const massBonus = cell.isStrategic ? actualMassGain * 0.2 : 0;
                            
                            // Add mass to the cell that made the capture
                            if (cell.isMainCell) {
                                player.mass += actualMassGain + massBonus;
                            } else {
                                // Split cell captures: merge back some mass to main cell
                                player.mass += (actualMassGain + massBonus) * 0.7;
                                cell.mass += (actualMassGain + massBonus) * 0.3;
                            }
                            
                            // Update achievement progress for killer
                            const killAchievements = achievementSystem.updatePlayerStat(player.id, 'kills', 
                                achievementSystem.playerProgress.get(player.id)?.stats.kills + 1 || 1);
                            
                            if (killAchievements.length > 0) {
                                io.to(player.id).emit('achievementUnlocked', killAchievements);
                            }
                            
                            // Strategic kill achievement
                            if (cell.isStrategic) {
                                const strategicKillAchievements = achievementSystem.updatePlayerStat(player.id, 'strategic_kills', 
                                    achievementSystem.playerProgress.get(player.id)?.stats.strategic_kills + 1 || 1);
                                
                                if (strategicKillAchievements.length > 0) {
                                    io.to(player.id).emit('achievementUnlocked', strategicKillAchievements);
                                }
                            }
                            
                            // Update team scores if applicable
                            if (player.teamId) {
                                gameState.teamScores.set(player.teamId, 
                                    gameState.teamScores.get(player.teamId) + actualMassGain + massBonus);
                            }
                            
                            // Clean up consumed player's systems
                            achievementSystem.removePlayer(otherPlayer.id);
                            powerUpSystem.removePlayer(otherPlayer.id);
                            
                            // Respawn the consumed player
                            otherPlayer.respawn(GAME_CONFIG);
                            
                            // Re-initialize achievement tracking for respawned player
                            achievementSystem.initializePlayer(otherPlayer.id);
                            
                            // Notify players
                            io.to(otherPlayer.id).emit('playerDied', { killerId: player.id, strategicKill: cell.isStrategic });
                            if (cell.isStrategic) {
                                io.to(player.id).emit('strategicKillSuccess', { 
                                    victimName: otherPlayer.name, 
                                    massGained: actualMassGain + massBonus 
                                });
                            }
                        }
                    }
                });
            }
        });
    });
    
    // Update survival time achievements for all players
    gameState.players.forEach(player => {
        const survivalAchievements = achievementSystem.updatePlayerStat(player.id, 'survival_time', 0);
        if (survivalAchievements.length > 0) {
            io.to(player.id).emit('achievementUnlocked', survivalAchievements);
        }
    });
    
    // Update team scores based on total team mass
    if (gameState.teams.size > 0) {
        gameState.teamScores.forEach((score, teamId) => {
            gameState.teamScores.set(teamId, 0); // Reset score
        });
        
        gameState.players.forEach(player => {
            if (player.teamId) {
                const currentScore = gameState.teamScores.get(player.teamId) || 0;
                gameState.teamScores.set(player.teamId, currentScore + player.mass);
            }
        });
    }
    
    // Broadcast game state to all players
    const gameStateData = {
        players: Array.from(gameState.players.values()).map(p => p.serialize()),
        food: Array.from(gameState.food.values()).map(f => f.serialize()),
        powerUps: powerUpSystem.serialize(),
        leaderboard: Array.from(gameState.players.values())
            .sort((a, b) => b.mass - a.mass)
            .slice(0, 10)
            .map(p => ({ name: p.name, mass: p.mass, teamId: p.teamId })),
        teamScores: Object.fromEntries(gameState.teamScores)
    };
    
    io.emit('gameUpdate', gameStateData);
}

// Initialize the game
initializeFood();
initializeTeams();

// Start game loop (60 FPS for ultra-smooth movement)
setInterval(gameLoop, 1000 / GAME_CONFIG.UPDATE_RATE);

// Start the server
const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

server.listen(PORT, HOST, () => {
    console.log(`🚀 Hyper.io server running on ${HOST}:${PORT}`);
    console.log(`🎮 Game available at: http://${HOST}:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
});