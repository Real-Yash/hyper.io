// This file defines the Food class, representing food pellets on the map, including methods for spawning and collision detection.

class Food {
    constructor(x, y) {
        this.x = x; // X position of the food pellet
        this.y = y; // Y position of the food pellet
        this.size = 5; // Size of the food pellet
    }

    // Method to draw the food pellet on the canvas
    draw(ctx) {
        ctx.fillStyle = 'green'; // Color of the food pellet
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fill();
    }

    // Method to check if a player has collided with the food pellet
    isColliding(player) {
        const distance = Math.sqrt((this.x - player.x) ** 2 + (this.y - player.y) ** 2);
        return distance < this.size + player.size; // Collision detection logic
    }

    // Method to spawn food pellets at random positions
    static spawnFoodPellet(canvasWidth, canvasHeight) {
        const x = Math.random() * canvasWidth;
        const y = Math.random() * canvasHeight;
        return new Food(x, y); // Return a new Food instance
    }
}