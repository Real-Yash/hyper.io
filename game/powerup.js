class PowerUp {
    constructor(id, x, y, type) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type;
        this.spawnTime = Date.now();
        this.duration = this.getTypeDuration();
        this.effect = this.getTypeEffect();
        this.color = this.getTypeColor();
        this.radius = 8;
    }
    
    getTypeDuration() {
        const durations = {
            'speed_boost': 10000, // 10 seconds
            'mass_magnet': 15000, // 15 seconds
            'shield': 8000, // 8 seconds
            'double_mass': 12000, // 12 seconds
            'split_immunity': 6000, // 6 seconds
            'vision_boost': 20000 // 20 seconds
        };
        return durations[this.type] || 10000;
    }
    
    getTypeEffect() {
        const effects = {
            'speed_boost': { speedMultiplier: 2.0, description: 'Double movement speed' },
            'mass_magnet': { magnetRange: 50, description: 'Attracts nearby food' },
            'shield': { damageReduction: 0.5, description: 'Reduces mass loss by 50%' },
            'double_mass': { massMultiplier: 2.0, description: 'Double mass gain from food' },
            'split_immunity': { splitProtection: true, description: 'Cannot be split by viruses' },
            'vision_boost': { visionMultiplier: 1.5, description: 'Increased vision range' }
        };
        return effects[this.type] || {};
    }
    
    getTypeColor() {
        const colors = {
            'speed_boost': '#00FF00', // Green
            'mass_magnet': '#FFD700', // Gold
            'shield': '#0080FF', // Blue
            'double_mass': '#FF8000', // Orange
            'split_immunity': '#FF00FF', // Magenta
            'vision_boost': '#00FFFF' // Cyan
        };
        return colors[this.type] || '#FFFFFF';
    }
    
    serialize() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            type: this.type,
            color: this.color,
            radius: this.radius,
            effect: this.effect
        };
    }
}

class PowerUpSystem {
    constructor() {
        this.powerUps = new Map();
        this.playerEffects = new Map(); // playerId -> Map of active effects
        this.spawnInterval = 15000; // Spawn every 15 seconds
        this.maxPowerUps = 5;
        this.powerUpTypes = ['speed_boost', 'mass_magnet', 'shield', 'double_mass', 'split_immunity', 'vision_boost'];
        this.lastSpawn = 0;
    }
    
    update(config) {
        const now = Date.now();
        
        // Spawn new power-ups
        if (now - this.lastSpawn > this.spawnInterval && this.powerUps.size < this.maxPowerUps) {
            this.spawnPowerUp(config);
            this.lastSpawn = now;
        }
        
        // Clean up expired player effects
        for (const [playerId, effects] of this.playerEffects.entries()) {
            for (const [effectType, data] of effects.entries()) {
                if (now > data.expiryTime) {
                    effects.delete(effectType);
                }
            }
            if (effects.size === 0) {
                this.playerEffects.delete(playerId);
            }
        }
    }
    
    spawnPowerUp(config) {
        const powerUpId = require('uuid').v4();
        const x = Math.random() * config.WORLD_WIDTH;
        const y = Math.random() * config.WORLD_HEIGHT;
        const type = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];
        
        const powerUp = new PowerUp(powerUpId, x, y, type);
        this.powerUps.set(powerUpId, powerUp);
        
        console.log(`Spawned power-up ${type} at (${Math.floor(x)}, ${Math.floor(y)})`);
    }
    
    checkCollision(player) {
        for (const [powerUpId, powerUp] of this.powerUps.entries()) {
            const dx = player.x - powerUp.x;
            const dy = player.y - powerUp.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < player.getRadius() + powerUp.radius) {
                // Player collected the power-up
                this.applyPowerUp(player.id, powerUp);
                this.powerUps.delete(powerUpId);
                return powerUp;
            }
        }
        return null;
    }
    
    applyPowerUp(playerId, powerUp) {
        if (!this.playerEffects.has(playerId)) {
            this.playerEffects.set(playerId, new Map());
        }
        
        const playerEffects = this.playerEffects.get(playerId);
        const expiryTime = Date.now() + powerUp.duration;
        
        playerEffects.set(powerUp.type, {
            effect: powerUp.effect,
            expiryTime: expiryTime,
            type: powerUp.type
        });
        
        console.log(`Player ${playerId} collected ${powerUp.type} power-up`);
    }
    
    getPlayerEffects(playerId) {
        const effects = this.playerEffects.get(playerId);
        return effects ? Array.from(effects.values()) : [];
    }
    
    hasEffect(playerId, effectType) {
        const effects = this.playerEffects.get(playerId);
        return effects && effects.has(effectType);
    }
    
    getEffectMultiplier(playerId, type) {
        const effects = this.playerEffects.get(playerId);
        if (!effects) return 1;
        
        let multiplier = 1;
        for (const [effectType, data] of effects.entries()) {
            if (type === 'speed' && data.effect.speedMultiplier) {
                multiplier *= data.effect.speedMultiplier;
            } else if (type === 'mass' && data.effect.massMultiplier) {
                multiplier *= data.effect.massMultiplier;
            } else if (type === 'vision' && data.effect.visionMultiplier) {
                multiplier *= data.effect.visionMultiplier;
            }
        }
        return multiplier;
    }
    
    getDamageReduction(playerId) {
        const effects = this.playerEffects.get(playerId);
        if (!effects) return 0;
        
        let reduction = 0;
        for (const [effectType, data] of effects.entries()) {
            if (data.effect.damageReduction) {
                reduction = Math.max(reduction, data.effect.damageReduction);
            }
        }
        return reduction;
    }
    
    removePlayer(playerId) {
        this.playerEffects.delete(playerId);
    }
    
    serialize() {
        return Array.from(this.powerUps.values()).map(p => p.serialize());
    }
}

module.exports = { PowerUp, PowerUpSystem };