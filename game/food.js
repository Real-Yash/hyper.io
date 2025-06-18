// This file defines the Food class for consumable items in the game.

class Food {
    constructor(id, x, y, mass) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.mass = mass || 3; // Increased default mass
        this.radius = Math.max(5, Math.sqrt(this.mass) * 2.5); // Larger visual size
        this.color = this.generateRandomColor();
    }

    generateRandomColor() {
        const colors = [
            '#FFE66D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
            '#FFEAA7', '#DDA0DD', '#FF7675', '#6C5CE7', '#A29BFE'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Method to spawn food at a random position
    static spawnFood(maxWidth, maxHeight, id) {
        const x = Math.random() * maxWidth;
        const y = Math.random() * maxHeight;
        return new Food(id, x, y, 3); // Increased mass for new spawned food
    }

    getRadius() {
        return this.radius;
    }

    serialize() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            mass: this.mass,
            radius: this.radius,
            color: this.color
        };
    }
}

module.exports = Food;