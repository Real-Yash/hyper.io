// This file defines the server-side Player class, managing player states and interactions.

class Player {
    constructor(id, name, x, y, mass, teamId = null) {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.teamId = teamId;
        this.directionX = 0; // Continuous movement direction
        this.directionY = 0; // Continuous movement direction
        this.cells = [{ x, y, mass }]; // Support for splitting
        this.isAlive = true;
        this.lastSplitTime = 0;
        this.color = this.generateColor();
    }

    generateColor() {
        // If player has a team, use team color
        if (this.teamId) {
            const teamColors = {
                'RED': '#FF4444',
                'BLUE': '#4444FF', 
                'GREEN': '#44FF44',
                'YELLOW': '#FFFF44'
            };
            return teamColors[this.teamId] || this.generateRandomColor();
        }
        return this.generateRandomColor();
    }

    generateRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#FF7675', '#6C5CE7', '#A29BFE', '#FD79A8'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateDirection(mouseX, mouseY) {
        // Store last target for split direction
        this.lastTargetX = mouseX;
        this.lastTargetY = mouseY;
        
        // Calculate direction from player to mouse (normalized)
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) { // Small dead zone to prevent jitter
            this.directionX = dx / distance;
            this.directionY = dy / distance;
        } else {
            // Stop movement when very close to target
            this.directionX = 0;
            this.directionY = 0;
        }
    }

    update(config) {
        if (!this.isAlive) return;

        // Continuous movement in the set direction
        if (this.directionX !== 0 || this.directionY !== 0) {
            // Enhanced speed calculation for responsiveness
            const basePixelsPerSecond = 80; // Increased base speed
            const massSpeedFactor = Math.max(0.2, 120 / Math.sqrt(this.mass)); // Better scaling
            const pixelsPerFrame = (basePixelsPerSecond * config.MAX_SPEED * massSpeedFactor) / config.UPDATE_RATE;
            
            // Move continuously in the current direction
            const moveX = this.directionX * pixelsPerFrame;
            const moveY = this.directionY * pixelsPerFrame;
            
            this.x += moveX;
            this.y += moveY;
            
            // Keep player within bounds
            this.x = Math.max(this.getRadius(), Math.min(config.WORLD_WIDTH - this.getRadius(), this.x));
            this.y = Math.max(this.getRadius(), Math.min(config.WORLD_HEIGHT - this.getRadius(), this.y));
        }
        
        // Very gradual mass loss (much slower)
        if (this.mass > config.MIN_MASS) {
            this.mass = Math.max(config.MIN_MASS, this.mass - config.MASS_LOSS_RATE);
        }

        // Update split cells with momentum
        for (let i = 1; i < this.cells.length; i++) {
            const cell = this.cells[i];
            if (cell.velocityX !== undefined && cell.velocityY !== undefined) {
                // Apply velocity with decay
                const timeSinceSplit = Date.now() - cell.splitTime;
                let velocityDecay = Math.max(0.1, 1 - (timeSinceSplit / 3000)); // Decay over 3 seconds
                
                // Strategic cells maintain momentum longer
                if (cell.isStrategic) {
                    velocityDecay = Math.max(0.2, 1 - (timeSinceSplit / 4000)); // 4 seconds for strategic
                }
                
                cell.x += cell.velocityX * velocityDecay;
                cell.y += cell.velocityY * velocityDecay;
                
                // Keep split cells within bounds
                cell.x = Math.max(cell.mass / 10, Math.min(config.WORLD_WIDTH - cell.mass / 10, cell.x));
                cell.y = Math.max(cell.mass / 10, Math.min(config.WORLD_HEIGHT - cell.mass / 10, cell.y));
                
                // Remove velocity when it's too small
                if (velocityDecay < 0.2) {
                    cell.velocityX = 0;
                    cell.velocityY = 0;
                }
            }
        }
        
        // Update main cell
        this.cells[0] = { x: this.x, y: this.y, mass: this.mass };
    }

    getRadius() {
        return Math.sqrt(this.mass) * 2;
    }

    checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = this.getRadius() + (other.getRadius ? other.getRadius() : other.radius || 5);
        
        return distance < minDistance;
    }

    // Check collision for split cells
    checkCellCollision(cellIndex, other) {
        if (cellIndex >= this.cells.length) return false;
        
        const cell = this.cells[cellIndex];
        const cellRadius = Math.sqrt(cell.mass) * 2;
        
        const dx = cell.x - other.x;
        const dy = cell.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = cellRadius + (other.getRadius ? other.getRadius() : other.radius || 5);
        
        return distance < minDistance;
    }

    // Get all cells (main + split cells) for collision detection
    getAllCells() {
        return this.cells.map((cell, index) => ({
            ...cell,
            radius: Math.sqrt(cell.mass) * 2,
            isMainCell: index === 0,
            cellIndex: index
        }));
    }

    canSplit() {
        return this.mass > 30 && Date.now() - this.lastSplitTime > 1000; // 1 second cooldown, minimum 30 mass
    }

    split() {
        if (!this.canSplit()) {
            console.log(`Player ${this.name} cannot split: mass=${this.mass}, cooldown=${Date.now() - this.lastSplitTime}ms`);
            return false;
        }
        
        console.log(`Player ${this.name} is splitting: mass=${this.mass}, direction=(${this.directionX}, ${this.directionY})`);
        
        // Split the current mass in half
        const splitMass = Math.floor(this.mass / 2);
        this.mass = splitMass;
        
        // Create split cell in the movement direction, or forward if no movement
        let splitDirX = this.directionX;
        let splitDirY = this.directionY;
        
        // If not moving, split in the direction of the last known target
        if (splitDirX === 0 && splitDirY === 0) {
            // Use last target direction or default forward
            splitDirX = this.lastTargetX !== undefined ? this.lastTargetX - this.x : 1;
            splitDirY = this.lastTargetY !== undefined ? this.lastTargetY - this.y : 0;
        }
        
        // Normalize direction
        const magnitude = Math.sqrt(splitDirX * splitDirX + splitDirY * splitDirY);
        if (magnitude > 0) {
            splitDirX /= magnitude;
            splitDirY /= magnitude;
        }
        
        // Calculate split distance and velocity based on mass
        const baseDistance = this.getRadius() * 2;
        const splitVelocity = Math.max(8, 15 - splitMass * 0.1); // Smaller cells move faster
        const splitDistance = baseDistance + splitVelocity * 2;
        
        const newX = this.x + splitDirX * splitDistance;
        const newY = this.y + splitDirY * splitDistance;
        
        // Create the split cell with momentum
        const splitCell = { 
            x: newX, 
            y: newY, 
            mass: splitMass,
            id: this.id + '_split_' + Date.now(),
            directionX: splitDirX,
            directionY: splitDirY,
            // Add velocity for strategic movement
            velocityX: splitDirX * splitVelocity,
            velocityY: splitDirY * splitVelocity,
            splitTime: Date.now(),
            isMainCell: false
        };
        
        this.cells.push(splitCell);
        
        // Mark this as the main cell
        this.isMainCell = true;
        
        this.lastSplitTime = Date.now();
        console.log(`Player ${this.name} split successfully! Split cell velocity: (${splitCell.velocityX}, ${splitCell.velocityY})`);
        return true;
    }

    // Strategic split towards a specific target
    strategicSplit(targetX, targetY) {
        if (!this.canSplit()) {
            console.log(`Player ${this.name} cannot split strategically: mass=${this.mass}, cooldown=${Date.now() - this.lastSplitTime}ms`);
            return false;
        }
        
        console.log(`Player ${this.name} is strategically splitting towards (${targetX}, ${targetY})`);
        
        // Split the current mass in half
        const splitMass = Math.floor(this.mass / 2);
        this.mass = splitMass;
        
        // Calculate direction towards target
        let splitDirX = targetX - this.x;
        let splitDirY = targetY - this.y;
        
        // Normalize direction
        const magnitude = Math.sqrt(splitDirX * splitDirX + splitDirY * splitDirY);
        if (magnitude > 0) {
            splitDirX /= magnitude;
            splitDirY /= magnitude;
        }
        
        // Enhanced split distance and velocity for strategic play
        const baseDistance = this.getRadius() * 1.5;
        const splitVelocity = Math.max(12, 20 - splitMass * 0.08); // Faster for strategic splits
        const splitDistance = baseDistance + splitVelocity * 1.8;
        
        const newX = this.x + splitDirX * splitDistance;
        const newY = this.y + splitDirY * splitDistance;
        
        // Create the strategic split cell with enhanced momentum
        const splitCell = { 
            x: newX, 
            y: newY, 
            mass: splitMass,
            id: this.id + '_strategic_' + Date.now(),
            directionX: splitDirX,
            directionY: splitDirY,
            // Enhanced velocity for strategic movement
            velocityX: splitDirX * splitVelocity * 1.5,
            velocityY: splitDirY * splitVelocity * 1.5,
            splitTime: Date.now(),
            isMainCell: false,
            isStrategic: true, // Mark as strategic split
            targetX: targetX,
            targetY: targetY
        };
        
        this.cells.push(splitCell);
        
        // Mark this as the main cell
        this.isMainCell = true;
        
        this.lastSplitTime = Date.now();
        console.log(`Player ${this.name} strategic split successful! Target: (${targetX}, ${targetY}), Velocity: (${splitCell.velocityX}, ${splitCell.velocityY})`);
        return true;
    }

    ejectMass(amount) {
        if (this.mass <= amount) return null;
        
        this.mass -= amount;
        
        // Eject in the opposite direction of movement
        let ejectX = this.x;
        let ejectY = this.y;
        
        if (this.directionX !== 0 || this.directionY !== 0) {
            const ejectDistance = this.getRadius() + 10;
            ejectX = this.x - this.directionX * ejectDistance;
            ejectY = this.y - this.directionY * ejectDistance;
        }
        
        // Create ejected mass as food
        const Food = require('./food');
        return new Food(`eject_${Date.now()}`, ejectX, ejectY, amount);
    }

    respawn(config) {
        this.x = Math.random() * config.WORLD_WIDTH;
        this.y = Math.random() * config.WORLD_HEIGHT;
        this.mass = config.INITIAL_MASS;
        this.cells = [{ x: this.x, y: this.y, mass: this.mass }];
        this.isAlive = true;
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            x: this.x,
            y: this.y,
            mass: this.mass,
            radius: this.getRadius(),
            color: this.color,
            cells: this.cells,
            isAlive: this.isAlive,
            directionX: this.directionX,
            directionY: this.directionY,
            teamId: this.teamId
        };
    }

    // Method to get player data for client
    getData() {
        return this.serialize();
    }
}

module.exports = Player;