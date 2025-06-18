// This file manages the WebSocket connection to the server, handling sending and receiving messages.

class SocketClient {
    constructor() {
        this.socket = null;
        this.callbacks = new Map();
    }

    connect(onConnected) {
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Connected to server');
            if (onConnected) onConnected();
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });

        // Game events
        this.socket.on('gameState', (data) => {
            this.emit('gameState', data);
        });

        this.socket.on('gameUpdate', (data) => {
            this.emit('gameUpdate', data);
        });

        this.socket.on('playerDied', (data) => {
            this.emit('playerDied', data);
        });

        // Friendship events
        this.socket.on('friendRequest', (data) => {
            this.emit('friendRequest', data);
        });

        this.socket.on('friendRequestSent', (data) => {
            this.emit('friendRequestSent', data);
        });

        this.socket.on('friendshipEstablished', (data) => {
            this.emit('friendshipEstablished', data);
        });

        this.socket.on('friendRequestDeclined', (data) => {
            this.emit('friendRequestDeclined', data);
        });

        this.socket.on('friendshipBroken', (data) => {
            this.emit('friendshipBroken', data);
        });

        // Achievement and power-up events
        this.socket.on('achievementUnlocked', (data) => {
            this.emit('achievementUnlocked', data);
        });

        this.socket.on('powerUpCollected', (data) => {
            this.emit('powerUpCollected', data);
        });

        // Strategic kill events
        this.socket.on('strategicKillSuccess', (data) => {
            this.emit('strategicKillSuccess', data);
        });
    }

    // Event emitter functionality
    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    emit(event, data) {
        if (this.callbacks.has(event)) {
            this.callbacks.get(event).forEach(callback => callback(data));
        }
    }

    // Game actions
    joinGame({ playerName, teamMode }) {
        this.socket.emit('joinGame', { playerName, teamMode });
    }

    move(x, y) {
        this.socket.emit('move', { x, y });
    }

    split() {
        this.socket.emit('split');
    }

    // Strategic split towards a target position
    strategicSplit(targetX, targetY) {
        this.socket.emit('strategicSplit', { targetX, targetY });
    }

    eject() {
        this.socket.emit('eject');
    }

    // Friendship actions
    sendFriendRequest(targetPlayerId) {
        this.socket.emit('sendFriendRequest', targetPlayerId);
    }

    respondToFriendRequest(senderId, accept) {
        this.socket.emit('respondToFriendRequest', { senderId, accept });
    }

    breakFriendship(friendId) {
        this.socket.emit('breakFriendship', friendId);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

export default SocketClient;