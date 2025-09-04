// Game Configuration
const MAPS = [
    // Map 1: Classic
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
        [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
        [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
        [1,1,1,1,0,1,0,0,0,0,0,0,0,1,0,1,1,1,1],
        [1,1,1,1,0,1,0,1,1,3,1,1,0,1,0,1,1,1,1],
        [1,0,0,0,0,0,0,1,3,3,3,1,0,0,0,0,0,0,1],
        [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
        [1,1,1,1,0,1,0,0,0,0,0,0,0,1,0,1,1,1,1],
        [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
        [1,0,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,0,1],
        [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
        [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // Map 2: Symmetrical
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,0,1],
        [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
        [1,1,1,0,1,1,0,1,1,3,1,1,0,1,1,0,1,1,1],
        [1,0,0,0,0,0,0,1,3,3,3,1,0,0,0,0,0,0,1],
        [1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1],
        [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1],
        [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // Map 3: Maze
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
        [1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1],
        [1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
        [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
        [1,1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0,1,1],
        [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
        [1,0,1,0,1,0,1,0,1,3,1,0,1,0,1,0,1,0,1],
        [1,0,1,0,0,0,1,0,3,3,3,0,1,0,0,0,1,0,1],
        [1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1],
        [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
        [1,1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0,1,1],
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
        [1,0,1,0,0,0,1,0,0,2,0,0,1,0,0,0,1,0,1],
        [1,0,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1],
        [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
        [1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,1,0,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // Map 4: Open
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,0,0,0,0,0,1,0,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,0,3,0,1,0,1,0,1,1,0,1],
        [1,0,0,0,0,0,0,1,3,3,3,1,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,1,2,1,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,0,0,0,0,0,1,0,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // Map 5: Cross
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1],
        [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
        [1,0,1,0,1,1,0,1,0,3,0,1,0,1,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,1,0,1,1,1,1,1,0,1,1,0,1,0,1],
        [1,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
        [1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
        [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,1],
        [1,0,1,0,1,0,0,0,1,1,1,0,0,0,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ]
];

let currentMapIndex = 0;
let MAZE = MAPS[currentMapIndex];

const CELL_SIZE = 20;
let ROWS = MAZE.length;
let COLS = MAZE[0].length;

// Game State
let canvas, ctx;
let score = 0;
let lives = 3;
let gameRunning = false;
let frame = 0;

// Binary grid
let grid = [];
let pellets = [];

// Pacman - position in grid units (0-18 for x, 0-20 for y)
let pacman = {
    x: 0,
    y: 0,
    dir: null,
    nextDir: null,
    speed: 0.1
};

// Ghosts
let ghosts = [];
const GHOST_COLORS = ['#ff0000', '#00ffff', '#ffb8ff', '#ffb851'];

// Directions
const DIR = {
    UP: { dx: 0, dy: -1 },
    DOWN: { dx: 0, dy: 1 },
    LEFT: { dx: -1, dy: 0 },
    RIGHT: { dx: 1, dy: 0 }
};

function selectRandomMap() {
    currentMapIndex = Math.floor(Math.random() * MAPS.length);
    MAZE = MAPS[currentMapIndex];
    ROWS = MAZE.length;
    COLS = MAZE[0].length;
    
    // Resize canvas if needed
    if (canvas) {
        canvas.width = COLS * CELL_SIZE;
        canvas.height = ROWS * CELL_SIZE;
    }
}

function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    
    // Don't select a random map on init, just set canvas size
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;
    
    // Initialize score display
    document.querySelector('.score').textContent = score;
    
    setupControls();
    resetLevel();
    updateLivesDisplay();
    render();
}

function resetLevel() {
    // Copy maze to grid
    grid = MAZE.map(row => [...row]);
    pellets = [];
    ghosts = [];
    
    // Setup entities
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = grid[y][x];
            
            if (cell === 0) {
                pellets.push({ x, y });
            } else if (cell === 2) {
                pacman.x = x;
                pacman.y = y;
                pacman.dir = null;
                pacman.nextDir = null;
                grid[y][x] = 0;
                pellets.push({ x, y });
            } else if (cell === 3) {
                ghosts.push({
                    x: x,
                    y: y,
                    dir: DIR.UP,
                    color: GHOST_COLORS[ghosts.length],
                    timer: 0,
                    hasLeftBase: false
                });
                grid[y][x] = 0;
            }
        }
    }
}

function setupControls() {
    // Touch/click controls
    document.querySelectorAll('.controls button').forEach(btn => {
        const setDir = () => {
            if (!gameRunning) return;
            const d = btn.dataset.dir;
            pacman.nextDir = DIR[d];
        };
        btn.addEventListener('touchstart', e => { e.preventDefault(); setDir(); });
        btn.addEventListener('mousedown', e => { e.preventDefault(); setDir(); });
    });
    
    // Keyboard
    document.addEventListener('keydown', e => {
        if (!gameRunning) return;
        switch(e.key) {
            case 'ArrowUp': pacman.nextDir = DIR.UP; break;
            case 'ArrowDown': pacman.nextDir = DIR.DOWN; break;
            case 'ArrowLeft': pacman.nextDir = DIR.LEFT; break;
            case 'ArrowRight': pacman.nextDir = DIR.RIGHT; break;
        }
    });
}

function canMove(x, y, dir) {
    if (!dir) return false;
    
    // Calculate the cell we're trying to enter
    let checkX = Math.floor(x + dir.dx * 0.5 + 0.5);
    let checkY = Math.floor(y + dir.dy * 0.5 + 0.5);
    
    // Bounds check
    if (checkX < 0 || checkX >= COLS || checkY < 0 || checkY >= ROWS) {
        return false;
    }
    
    // Wall check
    return grid[checkY][checkX] !== 1;
}

function updatePacman() {
    // Try to turn if requested
    if (pacman.nextDir) {
        // Check if near grid center (within 0.3 of center)
        const dx = pacman.x - Math.round(pacman.x);
        const dy = pacman.y - Math.round(pacman.y);
        
        if (Math.abs(dx) < 0.3 && Math.abs(dy) < 0.3) {
            if (canMove(Math.round(pacman.x), Math.round(pacman.y), pacman.nextDir)) {
                pacman.dir = pacman.nextDir;
                pacman.nextDir = null;
                // Snap to grid for smooth turns
                pacman.x = Math.round(pacman.x);
                pacman.y = Math.round(pacman.y);
            }
        }
    }
    
    // Move forward
    if (pacman.dir && canMove(pacman.x, pacman.y, pacman.dir)) {
        pacman.x += pacman.dir.dx * pacman.speed;
        pacman.y += pacman.dir.dy * pacman.speed;
    }
    
    // Collect pellets
    const gridX = Math.round(pacman.x);
    const gridY = Math.round(pacman.y);
    
    for (let i = pellets.length - 1; i >= 0; i--) {
        if (pellets[i].x === gridX && pellets[i].y === gridY) {
            pellets.splice(i, 1);
            score += 10;
            document.querySelector('.score').textContent = score;
            
            if (pellets.length === 0) {
                resetLevel(); // Next level
            }
            break;
        }
    }
}

// Find shortest path using BFS (more efficient for single shortest path)
function findShortestPath(startX, startY, targetX, targetY) {
    const queue = [{x: startX, y: startY, path: []}];
    const visited = new Set();
    visited.add(`${startX},${startY}`);
    
    while (queue.length > 0) {
        const {x, y, path} = queue.shift();
        
        if (x === targetX && y === targetY) {
            return path;
        }
        
        for (let dir of Object.values(DIR)) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            const key = `${nx},${ny}`;
            
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && 
                grid[ny][nx] !== 1 && !visited.has(key)) {
                visited.add(key);
                queue.push({x: nx, y: ny, path: [...path, dir]});
            }
        }
    }
    
    return null;
}

// Find paths with strategic divergence points for each ghost
function findStrategicPaths(startX, startY, targetX, targetY, ghostIndex) {
    // First, find the absolute shortest path from current position
    const shortestPath = findShortestPath(startX, startY, targetX, targetY);
    
    if (!shortestPath || shortestPath.length === 0) {
        return null;
    }
    
    // Ghost 0: Always take the direct shortest path
    if (ghostIndex === 0) {
        return shortestPath[0];
    }
    
    // For other ghosts, find alternative paths that diverge at specific steps:
    // Ghost 1: Take different FIRST move, then shortest from there
    // Ghost 2: Follow shortest for 1 move, then different SECOND move, then shortest
    // Ghost 3: Follow shortest for 2 moves, then different THIRD move, then shortest
    
    // Build the full alternative path
    const alternativePath = [];
    const divergeAtStep = ghostIndex; // Ghost 1 diverges at step 1, Ghost 2 at step 2, etc.
    
    // Follow the shortest path up to (but not including) the divergence point
    let currentX = startX;
    let currentY = startY;
    
    for (let step = 0; step < divergeAtStep - 1 && step < shortestPath.length; step++) {
        alternativePath.push(shortestPath[step]);
        currentX += shortestPath[step].dx;
        currentY += shortestPath[step].dy;
    }
    
    // Now we're at the position where we need to diverge
    // Find all valid directions that are NOT the shortest path direction
    const shortestNextMove = shortestPath[divergeAtStep - 1];
    let bestAlternative = null;
    let bestTotalLength = Infinity;
    
    if (shortestNextMove) {
        for (let dir of Object.values(DIR)) {
            const nx = currentX + dir.dx;
            const ny = currentY + dir.dy;
            
            // Skip the shortest path direction at this divergence point
            if (dir.dx === shortestNextMove.dx && dir.dy === shortestNextMove.dy) {
                continue;
            }
            
            // Check if this direction is valid
            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && grid[ny][nx] !== 1) {
                // Find shortest path from this alternative position to target
                const pathFromAlt = findShortestPath(nx, ny, targetX, targetY);
                
                if (pathFromAlt) {
                    const totalLength = alternativePath.length + 1 + pathFromAlt.length;
                    
                    if (totalLength < bestTotalLength) {
                        bestTotalLength = totalLength;
                        bestAlternative = [...alternativePath, dir, ...pathFromAlt];
                    }
                }
            }
        }
    }
    
    // Return the first move of the best alternative path, or shortest if no alternative
    if (bestAlternative && bestAlternative.length > 0) {
        return bestAlternative[0];
    }
    
    // Fallback: if can't diverge at specified point, try to take any different first move
    for (let dir of Object.values(DIR)) {
        const nx = startX + dir.dx;
        const ny = startY + dir.dy;
        
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && grid[ny][nx] !== 1) {
            if (dir.dx !== shortestPath[0].dx || dir.dy !== shortestPath[0].dy) {
                return dir;
            }
        }
    }
    
    return shortestPath[0];
}

function updateGhosts() {
    // Get Pacman's grid position
    const pacX = Math.round(pacman.x);
    const pacY = Math.round(pacman.y);
    
    ghosts.forEach((g, index) => {
        g.timer++;
        
        // Only update direction at grid centers
        const nearCenter = Math.abs(g.x - Math.round(g.x)) < 0.1 && 
                          Math.abs(g.y - Math.round(g.y)) < 0.1;
        
        if (nearCenter && g.timer > 10) {
            const gx = Math.round(g.x);
            const gy = Math.round(g.y);
            
            // Check if ghost just left the base (around row 10, moving up)
            if (!g.hasLeftBase && gy <= 10 && gy >= 8) {
                // Check if we're at the exit point (row 10, center area)
                if (gy === 10 && gx >= 8 && gx <= 10) {
                    g.hasLeftBase = true;
                    
                    // Blue ghost (index 1) turns left, Orange (index 3) turns right
                    if (index === 1) {
                        g.dir = DIR.LEFT;
                        g.timer = 0;
                    } else if (index === 3) {
                        g.dir = DIR.RIGHT;
                        g.timer = 0;
                    }
                    // Red (0) and Pink (2) continue with normal pathfinding
                }
            }
            
            // Skip strategic pathfinding if we just did an initial turn
            if ((index === 1 || index === 3) && g.timer === 0) {
                // Just set the initial direction, skip pathfinding this frame
            } else {
                // Find strategic path for this ghost
                const nextMove = findStrategicPaths(gx, gy, pacX, pacY, index);
                
                if (nextMove) {
                    // Check if it's not a reverse (unless no choice)
                    if (!g.dir || !(nextMove.dx === -g.dir.dx && nextMove.dy === -g.dir.dy)) {
                        g.dir = nextMove;
                        g.timer = 0;
                    } else {
                        // Try to find alternative that's not reverse
                        const validDirs = [];
                        for (let dir of Object.values(DIR)) {
                            const nx = gx + dir.dx;
                            const ny = gy + dir.dy;
                            
                            if (dir.dx === -g.dir.dx && dir.dy === -g.dir.dy) continue;
                            
                            if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && grid[ny][nx] !== 1) {
                                validDirs.push(dir);
                            }
                        }
                        
                        if (validDirs.length > 0) {
                            g.dir = validDirs[0];
                        } else {
                            // Must reverse
                            g.dir = nextMove;
                        }
                        g.timer = 0;
                    }
                } else {
                    // No path found (shouldn't happen) - find any valid move
                    const validDirs = [];
                    for (let dir of Object.values(DIR)) {
                        const nx = gx + dir.dx;
                        const ny = gy + dir.dy;
                        
                        // Don't reverse unless necessary
                        if (g.dir && dir.dx === -g.dir.dx && dir.dy === -g.dir.dy) {
                            continue;
                        }
                        
                        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && grid[ny][nx] !== 1) {
                            validDirs.push(dir);
                        }
                    }
                    
                    if (validDirs.length > 0) {
                        // Take first valid direction (deterministic)
                        g.dir = validDirs[0];
                    } else if (g.dir) {
                        // Must reverse
                        g.dir = { dx: -g.dir.dx, dy: -g.dir.dy };
                    }
                    g.timer = 0;
                }
            }
        }
        
        // Move ghost with consistent speed
        if (g.dir && canMove(g.x, g.y, g.dir)) {
            const speed = 0.05;  // Same speed for all ghosts
            g.x += g.dir.dx * speed;
            g.y += g.dir.dy * speed;
        }
        
        // Check collision
        if (Math.round(g.x) === pacX && Math.round(g.y) === pacY) {
            loseLife();
        }
    });
}

function loseLife() {
    lives--;
    updateLivesDisplay();
    
    if (lives <= 0) {
        gameRunning = false;
        document.getElementById('final-score').textContent = score;
        document.getElementById('game-over').classList.remove('hidden');
    } else {
        resetLevel();
    }
}

function updateLivesDisplay() {
    const container = document.querySelector('.lives');
    container.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const life = document.createElement('div');
        life.className = 'life';
        container.appendChild(life);
    }
}

function render() {
    if (!ctx) return;
    
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw maze
    ctx.fillStyle = '#0044ff';  // Bright blue for walls
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x] === 1) {
                ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, 
                           CELL_SIZE - 2, CELL_SIZE - 2);
            }
        }
    }
    
    // Draw pellets
    ctx.fillStyle = '#ffd700';
    pellets.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * CELL_SIZE + CELL_SIZE/2, 
               p.y * CELL_SIZE + CELL_SIZE/2, 3, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw Pacman
    const px = pacman.x * CELL_SIZE + CELL_SIZE/2;
    const py = pacman.y * CELL_SIZE + CELL_SIZE/2;
    
    ctx.save();
    ctx.translate(px, py);
    
    // Rotation
    let rot = 0;
    if (pacman.dir) {
        if (pacman.dir.dx > 0) rot = 0;
        else if (pacman.dir.dx < 0) rot = Math.PI;
        else if (pacman.dir.dy > 0) rot = Math.PI/2;
        else if (pacman.dir.dy < 0) rot = -Math.PI/2;
    }
    ctx.rotate(rot);
    
    // Mouth animation
    const mouth = Math.abs(Math.sin(frame * 0.15)) * 0.3 + 0.1;
    
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, 0, CELL_SIZE/2 - 2, mouth * Math.PI, -mouth * Math.PI);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.restore();
    
    // Draw ghosts
    ghosts.forEach(g => {
        const gx = g.x * CELL_SIZE + CELL_SIZE/2;
        const gy = g.y * CELL_SIZE + CELL_SIZE/2;
        
        ctx.save();
        ctx.translate(gx, gy);
        ctx.fillStyle = g.color;
        
        // Body
        ctx.beginPath();
        ctx.arc(0, -2, CELL_SIZE/2 - 2, Math.PI, 0);
        ctx.lineTo(CELL_SIZE/2 - 2, CELL_SIZE/2 - 4);
        for (let i = 0; i < 3; i++) {
            const x = (i - 1) * 6;
            ctx.quadraticCurveTo(x - 3, CELL_SIZE/2 - 2, x, CELL_SIZE/2 - 4);
        }
        ctx.lineTo(-CELL_SIZE/2 + 2, CELL_SIZE/2 - 4);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-4, -2, 3, 0, Math.PI * 2);
        ctx.arc(4, -2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-3, -2, 1.5, 0, Math.PI * 2);
        ctx.arc(5, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    });
}

function gameLoop() {
    if (!gameRunning) return;
    
    frame++;
    updatePacman();
    updateGhosts();
    render();
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    
    // Select a random map for the new game
    selectRandomMap();
    
    // Initialize game state
    score = 0;
    lives = 3;
    document.querySelector('.score').textContent = score;
    resetLevel();
    updateLivesDisplay();
    
    gameRunning = true;
    gameLoop();
}

function resetGame() {
    // Select a new random map when restarting after game over
    selectRandomMap();
    
    score = 0;
    lives = 3;
    document.querySelector('.score').textContent = score;
    document.getElementById('game-over').classList.add('hidden');
    resetLevel();
    updateLivesDisplay();
    gameRunning = true;
    gameLoop();
}

window.addEventListener('load', init);