# Pacman Game

A classic Pacman game implementation with 5 diverse, manually created binary maps.

## Features

- 🎮 **5 Unique Maps**: Classic, Tight Corridors, Spiral Maze, Very Open, and Diamond Pattern
- 🔄 **Reload Button**: Click the reload button (🔄) to randomly select a new map and reset the game
- 📱 **Mobile Support**: Touch controls for mobile devices
- 🎯 **Classic Gameplay**: Collect pellets while avoiding ghosts
- 💯 **Score System**: Track your score and lives

## Maps

All 5 maps are manually created using binary format:
- `0` = Corridor (pellet)
- `1` = Wall
- `2` = Pacman spawn point
- `3` = Ghost spawn point

Each map offers a different challenge:
1. **Classic**: Traditional symmetrical layout
2. **Tight Corridors**: Narrow passages for challenging navigation
3. **Spiral Maze**: Unique spiral pattern
4. **Very Open**: Large open spaces with strategic obstacles
5. **Diamond Pattern**: Geometric diamond-shaped layout

## Controls

- **Desktop**: Arrow keys or WASD
- **Mobile**: On-screen directional buttons
- **Reload**: Click the 🔄 button to get a new random map

## Deployment

### GitHub Pages

This game is configured for automatic deployment to GitHub Pages.

#### Automatic Deployment (Recommended)

1. Push your code to the `main` or `master` branch
2. Go to your repository Settings → Pages
3. Under "Build and deployment", select "GitHub Actions" as the source
4. The game will automatically deploy when you push changes

#### Manual Deployment

1. Go to Settings → Pages in your GitHub repository
2. Under "Build and deployment", select "Deploy from a branch"
3. Choose `main` (or `master`) branch and `/ (root)` folder
4. Click Save
5. Your game will be available at: `https://[your-username].github.io/[repository-name]/`

## Local Development

1. Clone the repository
2. Open `index.html` in a web browser
3. Or use a local server: `python3 -m http.server 8080`

## Technical Details

- Pure JavaScript (no frameworks)
- Canvas-based rendering
- Responsive design
- Binary map generation for efficient storage
- Animation using requestAnimationFrame

## Bug Fixes Applied

- ✅ Prevented multiple game loops from running simultaneously
- ✅ Proper cleanup of animation frames on game over/reset
- ✅ Consistent map randomization on reload
- ✅ Proper game state management