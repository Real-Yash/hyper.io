// This file is the entry point for the client-side application, initializing the game and UI components.

console.log('Main.js loaded');

// Test if elements exist
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    
    const playButton = document.getElementById('play-button');
    const playerNameInput = document.getElementById('player-name');
    
    console.log('Play button:', playButton);
    console.log('Player name input:', playerNameInput);
    
    if (playButton) {
        playButton.addEventListener('click', () => {
            console.log('Play button clicked!');
            alert('Play button works! Now loading game...');
            
            // Hide menu and show game
            document.getElementById('game-menu').style.display = 'none';
            document.getElementById('game-container').style.display = 'block';
            
            // Initialize game after modules are loaded
            loadGameModules();
        });
    }
    
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                console.log('Enter pressed in name input');
                playButton.click();
            }
        });
    }
});

async function loadGameModules() {
    try {
        console.log('Loading game modules...');
        
        // Dynamic imports to avoid initial loading issues
        const { default: GameEngine } = await import('./game/gameEngine.js');
        const { default: SocketClient } = await import('./network/socketClient.js');
        const { default: GameUI } = await import('./ui/gameUI.js');
        const { default: FriendshipUI } = await import('./ui/friendshipUI.js');
        
        console.log('Modules loaded successfully');
        
        const playerName = document.getElementById('player-name').value.trim() || 'Anonymous';
        
        // Initialize game components
        const socket = new SocketClient();
        const gameEngine = new GameEngine(socket);
        const gameUI = new GameUI();
        const friendshipUI = new FriendshipUI(socket);
        
        // Setup canvas
        setupCanvas();
        
        // Connect to server and join game
        socket.connect(() => {
            socket.joinGame(playerName);
            console.log('Game started successfully');
        });
        
        // Setup event listeners
        setupEventListeners(socket, gameEngine);
        
    } catch (error) {
        console.error('Error loading game modules:', error);
        alert('Error loading game: ' + error.message);
    }
}

function setupCanvas() {
    const canvas = document.getElementById('game-canvas');
    const container = document.getElementById('game-container');
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    });
}

function setupEventListeners(socket, gameEngine) {
    const canvas = document.getElementById('game-canvas');
    
    // Mouse movement
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        gameEngine.handleMouseMove(mouseX, mouseY);
    });
    
    // Right click for friend requests
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        gameEngine.handleRightClick(mouseX, mouseY);
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case ' ':
            case 'space':
                e.preventDefault();
                socket.split();
                break;
            case 'w':
                e.preventDefault();
                socket.eject();
                break;
        }
    });
}
