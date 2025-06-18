// This file is the entry point for the client-side application, initializing the game and UI components.

console.log('Main.js loaded');

// Mobile detection and coming soon message
function detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && window.innerHeight <= 1024);
}

function showMobileMessage() {
    const mobileMessage = document.getElementById('mobile-message');
    const desktopContent = document.getElementById('desktop-content');
    
    if (mobileMessage && desktopContent) {
        mobileMessage.style.display = 'flex';
        desktopContent.style.display = 'none';
        
        // Add continue anyway functionality
        const continueBtn = document.getElementById('mobile-continue-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                mobileMessage.style.display = 'none';
                desktopContent.style.display = 'block';
            });
        }
    }
}

// Test if elements exist
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
    
    // Check if mobile and show message
    if (detectMobile()) {
        showMobileMessage();
    }

    const playButton = document.getElementById('play-button');
    const playerNameInput = document.getElementById('player-name');
    const teamModeCheckbox = document.getElementById('team-mode-checkbox');
    
    console.log('Play button:', playButton);
    console.log('Player name input:', playerNameInput);
    
    // Simple test first
    if (playButton) {
        console.log('Adding click listener to play button');        playButton.addEventListener('click', (event) => {
            console.log('Play button clicked!', event);
            
            const playerName = playerNameInput ? playerNameInput.value.trim() : '';
            if (!playerName) {
                alert('Please enter your name');
                return;
            }
            
            const teamMode = teamModeCheckbox ? teamModeCheckbox.checked : false;
            
            // Try to hide menu and show game
            try {
                console.log('Attempting to switch views...');
                const gameMenu = document.getElementById('game-menu');
                const gameContainer = document.getElementById('game-container');
                
                console.log('Game menu element:', gameMenu);
                console.log('Game container element:', gameContainer);
                
                if (gameMenu && gameContainer) {
                    gameMenu.style.display = 'none';
                    gameContainer.style.display = 'block';
                    console.log('Successfully switched to game view');                        // Try to load modules
                        loadGameModules();
                } else {
                    console.error('Could not find game menu or container elements');
                    alert('Error: Could not find game elements');
                }
            } catch (error) {
                console.error('Error switching views:', error);
                alert('Error switching views: ' + error.message);
            }
        });
        console.log('Click listener added successfully');
    } else {
        console.error('Play button not found!');
        alert('ERROR: Play button not found in DOM');
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
        
        // Import modules
        const [SocketClientModule, GameEngineModule] = await Promise.all([
            import('./network/socketClient.js'),
            import('./game/gameEngine.js')
        ]);
        const SocketClient = SocketClientModule.default || SocketClientModule;
        const GameEngine = GameEngineModule.default || GameEngineModule;
        
        // Setup canvas
        setupCanvas();
        
        // Get game parameters
        const playerNameInput = document.getElementById('player-name');
        const teamModeCheckbox = document.getElementById('team-mode-checkbox');
        const playerName = playerNameInput ? playerNameInput.value.trim() : '';
        const teamMode = teamModeCheckbox ? teamModeCheckbox.checked : false;
        
        // Initialize socket and game engine
        const socket = new SocketClient();
        const gameEngine = new GameEngine(socket);
        // Expose gameEngine globally for joystick
        window.gameEngine = gameEngine;
        
        // Connect and join game
        socket.connect(() => {
            socket.joinGame({ playerName, teamMode });
            console.log('Game started successfully');
        });
        
        // Setup event listeners
        setupEventListeners(socket, gameEngine);        // Initialize joystick if on mobile
        if (/Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)) {
            console.log('Mobile device detected, initializing joystick...');
            const { default: VirtualJoystick } = await import('./ui/joystick.js');
            const container = document.getElementById('game-container');
            if (!container) {
                console.error('Game container not found for joystick');
                return;
            }
            
            // Show mobile controls
            const mobileControls = document.getElementById('mobile-controls');
            if (mobileControls) {
                mobileControls.style.display = 'block';
                
                // Add split button event
                const splitButton = document.getElementById('split-button');
                if (splitButton) {
                    splitButton.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        socket.split();
                        // Visual feedback
                        splitButton.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            splitButton.style.transform = 'scale(1)';
                        }, 100);
                    }, { passive: false });
                }
                
                // Add eject button event
                const ejectButton = document.getElementById('eject-button');
                if (ejectButton) {
                    ejectButton.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        socket.eject();
                        // Visual feedback
                        ejectButton.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            ejectButton.style.transform = 'scale(1)';
                        }, 100);
                    }, { passive: false });
                }

                // Add strategic split button event
                const strategicSplitButton = document.getElementById('strategic-split-button');
                if (strategicSplitButton) {
                    strategicSplitButton.addEventListener('touchstart', (e) => {
                        e.preventDefault();
                        gameEngine.performStrategicSplit();
                        // Visual feedback
                        strategicSplitButton.style.transform = 'scale(0.9)';
                        setTimeout(() => {
                            strategicSplitButton.style.transform = 'scale(1)';
                        }, 100);
                    }, { passive: false });
                }
            }
              if (!window._joystick) {
                console.log('Creating new joystick instance...');
                window._joystick = new VirtualJoystick(container, ({ dx, dy }) => {
                    if (window.gameEngine && window.gameEngine.myPlayer) {
                        // Calculate movement based on screen center and joystick direction
                        const canvas = document.getElementById('game-canvas');
                        if (!canvas) return;
                        
                        const centerX = canvas.width / 2;
                        const centerY = canvas.height / 2;
                        
                        // Convert joystick direction to screen movement
                        const moveDistance = 150; // Distance from center to move
                        const targetX = centerX + dx * moveDistance;
                        const targetY = centerY + dy * moveDistance;
                        
                        // Send movement to game engine
                        window.gameEngine.handleMouseMove(targetX, targetY);
                    }
                });
                window._joystick.show();
                console.log('Joystick initialized and shown');
            } else {
                console.log('Joystick already exists, showing it');
                window._joystick.show();
            }
        }
    } catch (error) {
        console.error('Error loading game modules:', error);
        alert('Error loading game: ' + error.message);
    }
}

function setupCanvas() {
    const canvas = document.getElementById('game-canvas');
    const container = document.getElementById('game-container');
    
    console.log('Setting up canvas...');
    console.log('Canvas element:', canvas);
    console.log('Container element:', container);
    
    if (!canvas || !container) {
        console.error('Canvas or container not found!');
        return;
    }
    
    // Set canvas to full container size
    canvas.width = container.clientWidth || window.innerWidth;
    canvas.height = container.clientHeight || window.innerHeight;
    
    console.log('Canvas size set to:', canvas.width, 'x', canvas.height);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        canvas.width = container.clientWidth || window.innerWidth;
        canvas.height = container.clientHeight || window.innerHeight;
        console.log('Canvas resized to:', canvas.width, 'x', canvas.height);
    });
}

function setupEventListeners(socket, gameEngine) {
    const canvas = document.getElementById('game-canvas');
    const isMobile = /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('Mobile device detected - setting up mobile event handlers');
        // Only block canvas touch events, but allow them for joystick
        canvas.addEventListener('touchstart', (e) => {
            // Allow touch events from joystick elements
            if (e.target.closest('.virtual-joystick-base')) {
                return; // Don't block joystick touches
            }
            e.stopPropagation();
            e.preventDefault();
        }, { passive: false });
        
        canvas.addEventListener('touchmove', (e) => {
            // Allow touch events from joystick elements
            if (e.target.closest('.virtual-joystick-base')) {
                return; // Don't block joystick touches
            }
            e.stopPropagation();
            e.preventDefault();
        }, { passive: false });
        
        canvas.addEventListener('touchend', (e) => {
            // Allow touch events from joystick elements
            if (e.target.closest('.virtual-joystick-base')) {
                return; // Don't block joystick touches
            }
            e.stopPropagation();
            e.preventDefault();
        }, { passive: false });
        
        // Block other mouse/pointer events on mobile
        ['mousedown', 'mousemove', 'mouseup', 'pointerdown', 'pointermove', 'pointerup'].forEach(evt => {
            canvas.addEventListener(evt, (e) => {
                e.stopPropagation();
                e.preventDefault();
            }, { passive: false });
        });
    } else {
        // Desktop controls
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            gameEngine.handleMouseMove(mouseX, mouseY);
        });
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            gameEngine.handleRightClick(mouseX, mouseY);
        });
        
        // Add strategic split with Shift+Space
        document.addEventListener('keydown', (e) => {
            console.log('Key pressed:', e.key, e.code, e.keyCode); // Debug logging
            // Handle spacebar properly
            if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
                e.preventDefault();
                if (e.shiftKey) {
                    // Strategic split towards mouse position
                    console.log('Strategic split key pressed, calling strategic split');
                    gameEngine.performStrategicSplit();
                } else {
                    console.log('Split key pressed, calling socket.split()');
                    socket.split();
                }
                return;
            }
            
            switch(e.key.toLowerCase()) {
                case 'w':
                    e.preventDefault();
                    console.log('Eject key pressed, calling socket.eject()');
                    socket.eject();
                    break;
            }
        });
    }
}


