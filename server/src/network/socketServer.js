// This file manages the WebSocket server, handling connections and communication with clients.

const WebSocket = require('ws');

class SocketServer {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Set();

        this.wss.on('connection', (ws) => {
            this.handleConnection(ws);
        });
    }

    handleConnection(ws) {
        this.clients.add(ws);
        console.log('New client connected');

        ws.on('message', (message) => {
            this.handleMessage(ws, message);
        });

        ws.on('close', () => {
            this.handleDisconnection(ws);
        });
    }

    handleMessage(ws, message) {
        console.log(`Received message: ${message}`);
        // Handle incoming messages from clients here
    }

    handleDisconnection(ws) {
        this.clients.delete(ws);
        console.log('Client disconnected');
    }

    broadcast(data) {
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
}

module.exports = SocketServer;