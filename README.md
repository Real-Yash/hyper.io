# Hyper.io (Friendship Edition)

An enhanced version of the classic Hyper.io game with friendship mechanics and social features.

## Features

### Core Gameplay
- **Classic Hyper.io mechanics**: Control a cell, eat food pellets and smaller players to grow
- **Real-time multiplayer**: Play with other players in real-time
- **Smooth movement**: Mouse-controlled movement with camera following
- **Splitting & Mass Ejection**: Split your cell (SPACE) or eject mass (W) for strategic play
- **Dynamic leaderboard**: See top players in real-time

### Friendship System
- **Friend Requests**: Right-click on other players to send friend requests
- **Mass Protection**: Friends cannot accidentally eat each other
- **Visual Indicators**: Friends are highlighted with special visual effects
- **Session-based**: No login required - friendships last for the session

### Enhanced UI
- **Modern Design**: Beautiful gradient UI with smooth animations
- **Real-time Notifications**: Get notified about friend requests and game events
- **Responsive Layout**: Works on different screen sizes
- **Intuitive Controls**: Easy-to-use interface for managing friendships

## How to Play

1. **Movement**: Move your mouse to control your cell
2. **Eating**: 
   - Consume food pellets (small colored dots) to grow
   - Eat smaller players to absorb their mass
   - You cannot eat friends (mass protection)
3. **Splitting**: Press SPACE to split your cell for speed or tactical advantage
4. **Mass Ejection**: Press W to eject mass (can be used to feed friends or boost speed)
5. **Friendship**:
   - Right-click on another player to send a friend request
   - Accept/decline requests in the friendship panel
   - Break friendships using the 💔 button

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Server Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

### Client Setup
The client is served automatically by the server. No separate setup required.

### Running the Game
1. Start the server (see above)
2. Open your web browser
3. Navigate to `http://localhost:3000`
4. Enter your name and click "Play"
5. Start playing!

## Technical Details

### Architecture
- **Backend**: Node.js with Express and Socket.IO
- **Frontend**: Vanilla JavaScript with HTML5 Canvas
- **Real-time Communication**: WebSockets via Socket.IO
- **Game Loop**: 60 FPS server-side game loop with client-side rendering

### Key Technologies
- **Server**: Node.js, Express, Socket.IO, UUID
- **Client**: HTML5 Canvas, ES6 Modules, WebSocket
- **Styling**: Modern CSS with animations and responsive design

### Game Constants
- World Size: 2000x2000 pixels
- Initial Player Mass: 20
- Food Count: 200 pellets
- Mass Loss Rate: 0.002 per frame
- Minimum Mass: 10

## File Structure

```
├── server/
│   ├── src/
│   │   ├── server.js          # Main server file
│   │   └── game/
│   │       ├── player.js      # Player class
│   │       ├── food.js        # Food class
│   │       └── friendship.js  # Friendship system
│   └── package.json
├── client/
│   ├── index.html             # Main HTML file
│   ├── src/
│   │   ├── css/
│   │   │   └── style.css      # Game styling
│   │   └── js/
│   │       ├── main.js        # Entry point
│   │       ├── game/
│   │       │   └── gameEngine.js  # Game rendering & logic
│   │       ├── network/
│   │       │   └── socketClient.js # WebSocket client
│   │       └── ui/
│   │           ├── gameUI.js      # Game UI management
│   │           └── friendshipUI.js # Friendship UI
└── doc/
    ├── context.md             # Game design document
    └── todo.md               # Development roadmap
```

## Game Mechanics

### Mass System
- Players start with 20 mass
- Eating food pellets increases mass by 1
- Eating other players absorbs their mass
- Mass gradually decreases over time (0.002 per frame)
- Larger players move slower
- Players need >20% mass advantage to consume others

### Friendship System
- Send friend requests by right-clicking on players
- Friends cannot eat each other (mass protection)
- Friends can share mass through ejection
- Friendships are session-based (no persistence)
- Visual indicators show friend status

### Splitting & Ejection
- Split cells move faster but are more vulnerable
- Split cooldown: 2 seconds
- Mass ejection can be used for:
  - Feeding friends
  - Temporary speed boost
  - Strategic play

## Development

### Adding New Features
1. Server-side logic goes in `server/src/game/`
2. Client-side logic goes in `client/src/js/`
3. UI components go in `client/src/js/ui/`
4. Update the game loop in both server and client as needed

### Debugging
- Server logs appear in the terminal
- Client logs appear in browser console
- Use browser DevTools for debugging client-side issues

## Future Enhancements

- [ ] Team mode with predefined teams
- [ ] Power-ups and special abilities
- [ ] Achievements system
- [ ] Spectator mode
- [ ] Mobile compatibility
- [ ] Persistent leaderboards
- [ ] Customizable skins
- [ ] Audio effects and background music

## License

This project is open source and available under the MIT License.

## Contributing

Feel free to contribute to this project by:
1. Reporting bugs
2. Suggesting new features
3. Submitting code improvements
4. Improving documentation

Enjoy playing Hyper.io (Friendship Edition)! 🎮👥

## Tech Stack
- **Frontend**: HTML, CSS, JavaScript, using frameworks like Phaser or PixiJS.
- **Backend**: Node.js with Socket.IO for real-time communication.
- **Database**: Redis for in-memory data storage (optional for V1).

## Setup Instructions
1. **Clone the Repository**:
   ```
   git clone <repository-url>
   cd agar-io-v2-friendship-edition
   ```

2. **Install Dependencies**:
   - For the client:
     ```
     cd client
     npm install
     ```
   - For the server:
     ```
     cd server
     npm install
     ```

3. **Run the Application**:
   - Start the server:
     ```
     cd server
     node src/server.js
     ```
   - Open the client in a web browser:
     ```
     cd client
     open index.html
     ```

## Future Enhancements
- Leaderboard persistence across server resets.
- Achievements system to reward players.
- Spectator mode for watching ongoing games.
- Mobile compatibility for improved user experience.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for details.