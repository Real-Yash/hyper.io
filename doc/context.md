## Game Design Document: Hyper.io (Friendship Edition)

### 1. Introduction

This document outlines the core features, game logic, and developmental considerations for a new .io game, inspired by Hyper.io but with enhanced social mechanics and additional features. The goal is to create a more engaging and collaborative experience while retaining the highly addictive gameplay of the original.

### 2. Core Gameplay (Hyper.io Foundation)

* **Player Representation:** Players control a circular cell on a large, open map.
* **Movement:** Cells move based on mouse input, following the cursor.
* **Eating Mechanics:**
    * **Food Pellets:** Small, static food pellets are scattered across the map. Consuming them increases cell mass.
    * **Other Players:** Players can consume smaller players by moving over them. Consuming a player adds their mass to the consumer's cell.
* **Mass Loss:** Players gradually lose a small amount of mass over time, encouraging active play.
* **Splitting:** Players can split their cell into multiple smaller cells. This is useful for:
    * **Speed Boost:** Smaller cells move faster.
    * **Offensive Maneuvers:** Splitting to quickly consume a smaller, nearby player.
* **Mass Ejection:** Players can eject a small portion of their mass. This is used for:
    * **Feeding Other Players:** Helping larger players grow, or intentionally feeding smaller players.
    * **Boosting:** Ejecting mass behind the cell can provide a temporary speed boost.
* **Leaderboard:** A real-time leaderboard displays the top players by mass.

### 3. Key Differentiating Features

#### 3.1. Friendship System

This is the primary new social mechanic that distinguishes our game.

* **Adding Friends:**
    * Players can send **friend requests** to other players on the same server.
    * A simple UI element (e.g., clicking on another player and selecting "Add Friend") will initiate the request.
    * The receiving player gets a notification and can accept or decline the request.
    * **No login required:** Friendship status is session-based. If players leave the server, the friendship is lost.
* **Friendship Benefits (Mass Protection):**
    * **Accidental Consumption Prevention:** A core feature: **Friends cannot accidentally eat each other's mass.** If a larger friend moves over a smaller friend, the smaller friend's mass will **not** be consumed.
    * **Intentional Mass Transfer (Smaller Chunks):** A smaller friend can **purposely send mass** (eject) to a larger friend, allowing them to grow. This encourages strategic cooperation.
    * **Visual Indication:** Friends' cells should have a distinct visual indicator (e.g., a colored outline, a small icon) to easily identify them.
* **Breaking Friendship:**
    * Players can **break friendships** at any time through a simple UI option.
    * Breaking a friendship immediately removes the mass protection and visual indicator.

#### 3.2. Additional Features

* **Team Mode (Beyond Friendship):**
    * Introduce a dedicated **team mode** where players can join pre-defined teams (e.g., Red vs. Blue).
    * Team members cannot eat each other.
    * Mass ejected by team members can be collected by other team members.
    * Team scores based on combined mass.
* **Special Abilities/Power-ups (Optional for V1, but good for future)**:
    * Consider temporary power-ups scattered on the map or gained through certain achievements:
        * **Temporary Speed Boost:** Significantly increases movement speed for a short duration.
        * **Mass Magnet:** Attracts nearby food pellets.
        * **Virus Immunity:** Temporarily immune to virus splitting effects.
* **Rejoin Last Server (QoL):** If a player disconnects and rejoins quickly, attempt to place them back on their previous server. This is not persistent storage, just a short-term memory.
* **Customizable Skins (Client-Side Only):**
    * Allow players to select from a variety of pre-defined skins for their cell.
    * No persistent storage, selected for the current session only.

### 4. Game Logic & Technical Considerations

* **Server-Authoritative:** The server will handle all game logic (movement, collisions, mass updates) to prevent cheating.
* **Real-time Communication:** WebSocket technology will be crucial for low-latency communication between clients and the server.
* **Scalability:** The server architecture should be designed to handle a large number of concurrent players across multiple game instances (servers).
* **Mass Calculation:** Precise calculation of mass changes during consumption, splitting, and ejection.
* **Collision Detection:** Efficient algorithms for detecting collisions between cells and food pellets.
* **Spawning:** Algorithm for randomly spawning food pellets and new players on the map.
* **"No Login Required" Implementation:**
    * Player identity will be session-based, likely using a unique session ID.
    * No user accounts, passwords, or persistent data storage for player progression.

### 5. Tech Stack

For a real-time multiplayer `.io` game, both client-side and server-side components are required.

#### 5.1. Frontend (Client-Side)

* **Core Technologies:** HTML, CSS, JavaScript.
* **Recommended Game Framework/Library:** To handle rendering, game loop, input, and potentially physics.
    * **Phaser:** A robust 2D HTML5 game framework, excellent for sprites, animations, physics, and input.
    * **PixiJS:** A fast 2D WebGL renderer, suitable for highly optimized graphics (requires more manual game logic implementation).
    * *(Alternative: Direct HTML5 Canvas API for building from scratch, but more development effort).*

#### 5.2. Backend (Server-Side)

* **Server-Side Language/Runtime:** To manage game logic, player states, collisions, and real-time communication.
    * **Node.js:** Highly recommended due to its asynchronous nature and strong WebSocket support. Often paired with Socket.IO.
    * *(Alternatives: Python with frameworks like FastAPI/Flask-SocketIO, Go for concurrency/performance, C# with ASP.NET Core SignalR).*
* **Real-time Communication Library:** Essential for low-latency data exchange between client and server.
    * **Socket.IO:** A widely used library that builds on WebSockets, offering features like re-connection, fallback options, and room management.
    * *(Alternative: Raw WebSockets API for more direct control).*
* **Database (Optional for V1):** For persistent leaderboards or more complex future features. Not strictly necessary for V1 given "no login" and session-based friends.
    * **Redis:** Ideal for high-speed, in-memory data (e.g., real-time leaderboards, temporary game state).
    * *(Alternatives: MongoDB for NoSQL flexibility, PostgreSQL for relational data).*

### 6. Hosting Strategy

Hosting a real-time multiplayer game requires different considerations for the frontend and backend.

#### 6.1. Frontend Hosting (Client-Side HTML, CSS, JavaScript)

* **GitHub Pages:**
    * **Pros:** Free, easy setup directly from a GitHub repository.
    * **Cons:** Purely for static content; cannot host server-side logic.
* **Vercel:**
    * **Pros:** Excellent for frontend deployment, generous free tier.
    * **Cons:** While it supports serverless functions, it's generally not ideal or free for persistent, long-lived WebSocket connections required by a game server.

#### 6.2. Backend (Game Server) Hosting

* **Requirement:** Requires a platform that supports persistent server processes and WebSocket connections.
* **Recommended Options (Starting with Free/Affordable):**
    1.  **Heroku:**
        * **Pros:** Easy deployment for Node.js (and other languages), free tier available for prototyping.
        * **Cons:** Free tier has limitations (e.g., dyno sleeping); requires upgrade for continuous operation.
    2.  **Render:**
        * **Pros:** Modern platform with a good free tier for web services and databases, good WebSocket support.
        * **Cons:** Paid plans needed for scaling.
    3.  **DigitalOcean:**
        * **Pros:** Provides virtual private servers (droplets) with full control at affordable rates ($4-$6/month for smallest).
        * **Cons:** Requires more manual server setup and management.
    4.  **Google Cloud Platform (GCP) / Amazon Web Services (AWS) / Microsoft Azure:**
        * **Pros:** Industry-leading, highly scalable, robust infrastructure with free tiers/credits for new users (often for a year).
        * **Cons:** Can be more complex to learn and manage; costs can increase with scale after free tier.
    * *(Advanced: Specialized game hosting platforms like PlayFab or Unity Gaming Services for very large-scale needs).*

**Overall Hosting Approach:** Host the **frontend** on GitHub Pages or Vercel, and the **backend game server** on Heroku or Render's free tiers to begin, with options to scale to DigitalOcean, AWS, or GCP as the project grows.

### 7. Future Enhancements (Post-Launch Ideas)

* **Leaderboard Persistence:** Save top scores across server resets.
* **Achievements System:** Reward players for specific actions (e.g., eating X players, surviving for Y minutes).
* **Spectator Mode:** Allow players to watch ongoing games.
* **Mobile Compatibility:** Optimize UI and controls for mobile devices.