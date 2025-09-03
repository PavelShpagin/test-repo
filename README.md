# 🎮 Pacman JavaScript Game

A fully functional Pacman game built with vanilla JavaScript, featuring advanced ghost AI, sound effects, level progression, and mobile support.

## 🚀 How to Run the App

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the game server:**
   ```bash
   npm start
   ```
   The game will automatically open in your browser at `http://localhost:8080`

### Development Mode with Auto-Reload

For development with automatic server reload on file changes:

```bash
npm run dev
```

This uses `nodemon` to watch for changes in `.js`, `.html`, and `.css` files and automatically restarts the server.

For verbose logging during development:
```bash
npm run dev:verbose
```

## 🎮 Game Features

### Core Gameplay
- **Classic Pacman mechanics** - Eat all dots to complete levels
- **Power pellets** - Turn the tables on ghosts and eat them for bonus points
- **Fruit bonuses** - Appear at certain points for extra score
- **Level progression** - Difficulty increases with each level
- **High score tracking** - Persistent high scores using localStorage

### Advanced Ghost AI
Each ghost has unique personality and behavior:
- **Blinky (Red)** - Directly chases Pacman
- **Pinky (Pink)** - Tries to ambush by targeting ahead of Pacman
- **Inky (Cyan)** - Unpredictable movement patterns
- **Clyde (Orange)** - Shy, keeps distance when too close

### Visual & Audio Effects
- **Sound effects** using Web Audio API
  - Dot eating sounds
  - Power-up activation
  - Ghost eating
  - Death sound
  - Level completion fanfare
- **Particle effects** for visual feedback
- **Score popups** when eating ghosts or fruit
- **Smooth animations** with pulsing dots and power pellets
- **Ghost animations** with wavy movement and eyes that follow Pacman

### Game States
- **Ready** - Press any arrow key to start
- **Playing** - Active gameplay
- **Dying** - Death animation
- **Level Complete** - Transition between levels
- **Game Over** - Final score display

## 🕹️ Controls

### Keyboard Controls
- **Arrow Keys** or **WASD** - Move Pacman
- **Space** or **P** - Pause/Resume game

### Mobile Controls
- Touch-friendly on-screen directional buttons
- Pause button for game control
- Responsive design for all screen sizes

## 📱 Mobile Support

The game is fully responsive and works on mobile devices:
- Touch controls automatically appear on mobile
- Prevents accidental zooming and scrolling
- Optimized canvas scaling for different screen sizes

## 🏆 Scoring System

- **Dot**: 10 points
- **Power Pellet**: 50 points
- **Ghost** (when powered up):
  - 1st ghost: 200 points
  - 2nd ghost: 400 points
  - 3rd ghost: 800 points
  - 4th ghost: 1600 points
- **Fruit Bonuses** (varies by level):
  - Cherry: 100 points
  - Strawberry: 300 points
  - Orange: 500 points
  - Apple: 700 points
  - Melon: 1000 points
- **Level Completion**: 1000 × level number
- **Extra Life**: Every 10,000 points

## 🔧 Technical Details

### Technologies Used
- **Pure JavaScript** - No frameworks or libraries
- **HTML5 Canvas** - For game rendering
- **Web Audio API** - For sound effects
- **LocalStorage** - For high score persistence

### File Structure
```
/workspace/
├── index.html           # Game UI and layout
├── pacman-improved.js   # Enhanced game logic with all features
├── pacman.js           # Original simpler version
├── server.js           # Node.js server
├── package.json        # Project dependencies and scripts
└── README.md          # This file
```

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Web Audio API support recommended for sound effects

## 🎯 Tips for Playing

1. **Learn ghost patterns** - Each ghost behaves differently
2. **Use power pellets strategically** - Save them for when ghosts are clustered
3. **Chain ghost eating** - Eat multiple ghosts during one power-up for maximum points
4. **Watch for fruit** - They appear twice per level at specific dot counts
5. **Corner turns** - Pre-turn by pressing the direction before reaching the corner
6. **Use the tunnels** - Side tunnels let you wrap around the maze

## 🔄 Development Notes

### Auto-Reload Setup
The project uses `nodemon` for automatic server restart during development. When you run `npm run dev`, the server will:
- Watch all `.js`, `.html`, and `.css` files
- Automatically restart when changes are detected
- Preserve the port (8080 by default)

### Customization
You can easily customize the game by modifying `pacman-improved.js`:
- Adjust `gameSpeed` for overall game speed
- Modify ghost `speed` values for difficulty
- Change colors in the `ghosts` array
- Adjust scoring values
- Modify map layout in `initializeMap()`

## 📝 License

MIT License - Feel free to use and modify for your own projects!

## 🎉 Have Fun!

Enjoy playing this classic arcade game recreation! Try to beat your high score and reach higher levels. The difficulty increases with each level, making it progressively more challenging.

**Pro tip**: The game saves your high score locally, so you can always come back and try to beat it!