# Classic Pacman Game

A browser-based implementation of the classic Pacman arcade game with modern web technologies.

## Features

- **Classic Gameplay**: Navigate through the maze, collect pellets, and avoid ghosts
- **3 Lives System**: Start with 3 lives, lose one when caught by a ghost
- **Score Tracking**: Earn points by collecting pellets, high score saved locally
- **Progressive Difficulty**: Ghost speed increases with each level
- **Responsive Controls**: Smooth keyboard controls with arrow keys
- **Polished UI**: Retro arcade styling with modern visual effects

## How to Play

1. Open `index.html` in a web browser
2. Click "START GAME" to begin
3. Use arrow keys to control Pacman:
   - ↑ Arrow Up - Move up
   - ↓ Arrow Down - Move down
   - ← Arrow Left - Move left
   - → Arrow Right - Move right
4. Collect all yellow pellets to advance to the next level
5. Avoid the colorful ghosts - they move randomly through the maze
6. Game ends when all lives are lost

## Game Mechanics

### Grid Layout
- **0**: Corridor with pellet
- **1**: Wall
- **2**: Pacman starting position
- **3-6**: Ghost starting positions
- **9**: Empty corridor

### Scoring
- Each pellet collected: 10 points
- High score is saved in browser's local storage

### Ghost AI
- Ghosts move randomly through the maze
- They change direction at intersections
- Speed increases with each level

## Technical Details

- Pure JavaScript implementation
- HTML5 Canvas for rendering
- CSS3 for styling and animations
- No external dependencies (except Google Fonts)

## Files

- `index.html` - Main game page
- `game.js` - Game logic and mechanics
- `style.css` - Visual styling and animations

## Browser Compatibility

Works on all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript
- CSS3 animations

## License

This is a educational implementation of the classic Pacman game for learning purposes.