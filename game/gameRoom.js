// This file manages game rooms, handling player connections and game state.

class GameRoom {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = new Map(); // Map to store players by their IDs
        this.foodPellets = []; // Array to store food pellets in the room
        this.isActive = true; // Indicates if the game room is active
    }

    // Method to add a player to the game room
    addPlayer(player) {
        if (!this.players.has(player.id)) {
            this.players.set(player.id, player);
            this.broadcastPlayerUpdate();
        }
    }

    // Method to remove a player from the game room
    removePlayer(playerId) {
        if (this.players.has(playerId)) {
            this.players.delete(playerId);
            this.broadcastPlayerUpdate();
        }
    }

    // Method to broadcast player updates to all players in the room
    broadcastPlayerUpdate() {
        const playerData = Array.from(this.players.values()).map(player => player.getData());
        this.players.forEach(player => {
            player.socket.emit('playerUpdate', playerData);
        });
    }

    // Method to update the game state
    update() {
        // Update game logic, such as player movements and food interactions
        this.players.forEach(player => player.update());
        this.checkCollisions();
    }

    // Method to check collisions between players and food
    checkCollisions() {
        // Implement collision detection logic here
    }

    // Method to get the current state of the game room
    getState() {
        return {
            roomId: this.roomId,
            players: Array.from(this.players.values()).map(player => player.getData()),
            foodPellets: this.foodPellets,
        };
    }

    // Method to clean up the game room when it's no longer active
    cleanup() {
        this.isActive = false;
        this.players.clear();
        this.foodPellets = [];
    }
}

export default GameRoom;