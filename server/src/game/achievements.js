class AchievementSystem {
    constructor() {
        this.achievements = {
            // Size-based achievements
            'tiny_titan': {
                id: 'tiny_titan',
                name: 'Tiny Titan',
                description: 'Reach 100 mass',
                requirement: { type: 'mass', value: 100 },
                reward: 'Mass boost: +10'
            },
            'medium_mogul': {
                id: 'medium_mogul',
                name: 'Medium Mogul',
                description: 'Reach 500 mass',
                requirement: { type: 'mass', value: 500 },
                reward: 'Mass boost: +25'
            },
            'giant_guardian': {
                id: 'giant_guardian',
                name: 'Giant Guardian',
                description: 'Reach 1000 mass',
                requirement: { type: 'mass', value: 1000 },
                reward: 'Mass boost: +50'
            },
            
            // Combat achievements
            'first_blood': {
                id: 'first_blood',
                name: 'First Blood',
                description: 'Eat your first player',
                requirement: { type: 'kills', value: 1 },
                reward: 'Speed boost for 10 seconds'
            },
            'serial_consumer': {
                id: 'serial_consumer',
                name: 'Serial Consumer',
                description: 'Eat 5 players',
                requirement: { type: 'kills', value: 5 },
                reward: 'Temporary immunity to splitting'
            },
            'apex_predator': {
                id: 'apex_predator',
                name: 'Apex Predator',
                description: 'Eat 10 players',
                requirement: { type: 'kills', value: 10 },
                reward: 'Mass magnet for 30 seconds'
            },
            
            // Survival achievements
            'survivor': {
                id: 'survivor',
                name: 'Survivor',
                description: 'Survive for 5 minutes',
                requirement: { type: 'survival_time', value: 300000 }, // 5 minutes in ms
                reward: 'Damage resistance for 1 minute'
            },
            'marathon_runner': {
                id: 'marathon_runner',
                name: 'Marathon Runner',
                description: 'Survive for 15 minutes',
                requirement: { type: 'survival_time', value: 900000 }, // 15 minutes in ms
                reward: 'Permanent speed boost'
            },
            'survivor_novice': {
                id: 'survivor_novice',
                name: 'Survivor Novice',
                description: 'Survive for 5 minutes',
                requirement: { type: 'survival_time', value: 5 * 60 * 1000 },
                reward: 'Shield for 15 seconds'
            },
            'survivor_expert': {
                id: 'survivor_expert',
                name: 'Survivor Expert',
                description: 'Survive for 15 minutes',
                requirement: { type: 'survival_time', value: 15 * 60 * 1000 },
                reward: 'Permanent speed boost'
            },
            
            // Social achievements
            'friendly_giant': {
                id: 'friendly_giant',
                name: 'Friendly Giant',
                description: 'Have 3 friends simultaneously',
                requirement: { type: 'friends', value: 3 },
                reward: 'Friend protection aura'
            },
            'team_player': {
                id: 'team_player',
                name: 'Team Player',
                description: 'Help teammates gain 500 total mass',
                requirement: { type: 'team_assist', value: 500 },
                reward: 'Team mass sharing efficiency +50%'
            },
            
            // Special achievements
            'split_master': {
                id: 'split_master',
                name: 'Split Master',
                description: 'Successfully split 20 times',
                requirement: { type: 'splits', value: 20 },
                reward: 'Reduced split cooldown'
            },
            'food_collector': {
                id: 'food_collector',
                name: 'Food Collector',
                description: 'Eat 100 food pellets',
                requirement: { type: 'food_eaten', value: 100 },
                reward: 'Food gives double mass for 1 minute'
            },
            
            // Strategic achievements
            'strategic_striker': {
                id: 'strategic_striker',
                name: 'Strategic Striker',
                description: 'Capture your first player with a strategic split',
                requirement: { type: 'strategic_kills', value: 1 },
                reward: 'Enhanced split velocity for 60 seconds'
            },
            'tactical_master': {
                id: 'tactical_master',
                name: 'Tactical Master',
                description: 'Capture 5 players with strategic splits',
                requirement: { type: 'strategic_kills', value: 5 },
                reward: 'Permanent strategic split cooldown reduction'
            },
            'split_assassin': {
                id: 'split_assassin',
                name: 'Split Assassin',
                description: 'Capture 10 players with strategic splits',
                requirement: { type: 'strategic_kills', value: 10 },
                reward: 'Strategic splits grant 50% bonus mass'
            },
        };
        
        this.playerProgress = new Map(); // playerId -> progress data
    }
    
    initializePlayer(playerId) {
        this.playerProgress.set(playerId, {
            achievements: new Set(),
            stats: {
                mass: 0,
                kills: 0,
                survival_time: 0,
                friends: 0,
                team_assist: 0,
                splits: 0,
                food_eaten: 0,
                start_time: Date.now()
            },
            activeRewards: new Map() // achievementId -> expiry time
        });
    }
    
    updatePlayerStat(playerId, statType, value) {
        const progress = this.playerProgress.get(playerId);
        if (!progress) return [];
        
        const newAchievements = [];
        
        if (statType === 'survival_time') {
            progress.stats.survival_time = Date.now() - progress.stats.start_time;
        } else {
            progress.stats[statType] = Math.max(progress.stats[statType], value);
        }
        
        // Check for new achievements
        Object.values(this.achievements).forEach(achievement => {
            if (!progress.achievements.has(achievement.id)) {
                const req = achievement.requirement;
                if (progress.stats[req.type] >= req.value) {
                    progress.achievements.add(achievement.id);
                    newAchievements.push(achievement);
                    
                    // Apply reward
                    this.applyReward(playerId, achievement);
                }
            }
        });
        
        return newAchievements;
    }
    
    applyReward(playerId, achievement) {
        const progress = this.playerProgress.get(playerId);
        if (!progress) return;
        
        const expiryTime = Date.now() + this.getRewardDuration(achievement.id);
        progress.activeRewards.set(achievement.id, expiryTime);
    }
    
    getRewardDuration(achievementId) {
        const durations = {
            'first_blood': 10000, // 10 seconds
            'survivor': 60000, // 1 minute
            'food_collector': 60000, // 1 minute
            'apex_predator': 30000, // 30 seconds
            'marathon_runner': -1, // Permanent
            'friendly_giant': -1, // Permanent
            'team_player': -1, // Permanent
            'split_master': -1, // Permanent
            'strategic_striker': 60000, // 60 seconds
            'tactical_master': -1, // Permanent
            'split_assassin': -1 // Permanent
        };
        return durations[achievementId] || 30000; // Default 30 seconds
    }
    
    getActiveRewards(playerId) {
        const progress = this.playerProgress.get(playerId);
        if (!progress) return [];
        
        const now = Date.now();
        const activeRewards = [];
        
        // Clean up expired rewards
        for (const [achievementId, expiryTime] of progress.activeRewards.entries()) {
            if (expiryTime === -1 || now < expiryTime) {
                activeRewards.push(this.achievements[achievementId]);
            } else {
                progress.activeRewards.delete(achievementId);
            }
        }
        
        return activeRewards;
    }
    
    getPlayerAchievements(playerId) {
        const progress = this.playerProgress.get(playerId);
        if (!progress) return [];
        
        return Array.from(progress.achievements).map(id => this.achievements[id]);
    }
    
    removePlayer(playerId) {
        this.playerProgress.delete(playerId);
    }
}

module.exports = AchievementSystem;
