// Game Configuration
const MAPS = [
    // Map 1: Classic (Horizontally Symmetrical)
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
    // Map 2: Tight Corridors
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
        [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1],
        [1,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,1],
        [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
        [1,0,1,1,1,1,0,1,1,3,1,1,0,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,1,3,3,3,1,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
        [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
        [1,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,1],
        [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
        [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
        [1,0,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // Map 3: Cross Roads
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,0,0,0,1,0,1,0,1,1,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1],
        [1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,0,1,0,0,0,1,0,0,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,1,0,0,1,0,0,0,1,0,0,1,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,1],
        [1,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,1],
        [1,0,1,0,0,0,0,0,0,2,0,0,0,0,0,0,1,0,1],
        [1,0,1,1,0,1,0,1,0,0,0,1,0,1,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,1,0,0,1,1,0,1,1,0,0,1,1,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // Map 4: Open Arena
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
        [1,0,0,1,0,0,0,1,1,0,1,1,0,0,0,1,0,0,1],
        [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,0,3,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1,3,3,3,1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,1,1,0,2,0,1,1,0,0,0,0,0,1],
        [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,1,1,1,0,0,1,0,1,0,0,1,1,1,0,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],
    // Map 5: Diamond Pattern
    [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,0,0,1,0,1,0,1,0,0,0,1,1,0,1],
        [1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1],
        [1,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,1],
        [1,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,1],
        [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
        [1,0,1,1,0,0,0,0,1,1,1,0,0,0,0,1,1,0,1],
        [1,0,1,1,1,0,0,1,1,3,1,1,0,0,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,1],
        [1,0,1,1,1,0,0,1,1,1,1,1,0,0,1,1,1,0,1],
        [1,0,1,1,0,0,0,0,1,1,1,0,0,0,0,1,1,0,1],
        [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
        [1,0,0,0,1,1,1,0,0,0,0,0,1,1,1,0,0,0,1],
        [1,0,0,1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,1],
        [1,0,1,1,1,0,1,1,1,2,1,1,1,0,1,1,1,0,1],
        [1,0,1,1,0,0,0,1,0,1,0,1,0,0,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
        [1,1,1,0,0,0,1,1,1,0,1,1,1,0,0,0,1,1,1],
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
let animationId = null;

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

// Ghost AI Strategies
const GHOST_STRATEGY = {
    RANDOM: 'random',
    TERRITORIAL: 'territorial',
    TRACKING: 'tracking'
};

// Difficulty Settings
let currentDifficulty = 1;
const DIFFICULTY_CONFIGS = {
    1: [GHOST_STRATEGY.RANDOM, GHOST_STRATEGY.RANDOM, GHOST_STRATEGY.RANDOM, GHOST_STRATEGY.TRACKING],
    2: [GHOST_STRATEGY.RANDOM, GHOST_STRATEGY.RANDOM, GHOST_STRATEGY.TERRITORIAL, GHOST_STRATEGY.TRACKING],
    3: [GHOST_STRATEGY.RANDOM, GHOST_STRATEGY.TERRITORIAL, GHOST_STRATEGY.TERRITORIAL, GHOST_STRATEGY.TRACKING],
    4: [GHOST_STRATEGY.TERRITORIAL, GHOST_STRATEGY.TERRITORIAL, GHOST_STRATEGY.TRACKING, GHOST_STRATEGY.TRACKING],
    5: [GHOST_STRATEGY.TERRITORIAL, GHOST_STRATEGY.TRACKING, GHOST_STRATEGY.TRACKING, GHOST_STRATEGY.TRACKING],
    6: [GHOST_STRATEGY.TRACKING, GHOST_STRATEGY.TRACKING, GHOST_STRATEGY.TRACKING, GHOST_STRATEGY.TRACKING]
};

// Directions
const DIR = {
    UP: { dx: 0, dy: -1 },
    DOWN: { dx: 0, dy: 1 },
    LEFT: { dx: -1, dy: 0 },
    RIGHT: { dx: 1, dy: 0 }
};

function selectRandomMap() {
    // Store previous index
    const previousIndex = currentMapIndex;
    
    // If we have more than one map, ensure we select a different one
    if (MAPS.length > 1) {
        do {
            currentMapIndex = Math.floor(Math.random() * MAPS.length);
        } while (currentMapIndex === previousIndex);
    } else {
        currentMapIndex = Math.floor(Math.random() * MAPS.length);
    }
    
    MAZE = MAPS[currentMapIndex];
    ROWS = MAZE.length;
    COLS = MAZE[0].length;
    
    console.log(`Selected Map ${currentMapIndex + 1} of ${MAPS.length} (was Map ${previousIndex + 1})`);
    console.log(`Map dimensions: ${COLS}x${ROWS}`);
    
    // Resize canvas if needed
    if (canvas) {
        canvas.width = COLS * CELL_SIZE;
        canvas.height = ROWS * CELL_SIZE;
    }
}

function logAllMaps() {
    console.log("=== VERIFYING ALL 5 PACMAN MAPS ===");
    console.log(`Total maps available: ${MAPS.length}`);
    
    for (let i = 0; i < MAPS.length; i++) {
        console.log(`\n=== MAP ${i + 1} ===`);
        const map = MAPS[i];
        console.log(`Dimensions: ${map[0].length}x${map.length}`);
        
        // Count elements
        let walls = 0, corridors = 0, pacmanCount = 0, ghostCount = 0;
        
        // Log the actual 2D array
        console.log("Binary representation (0=corridor, 1=wall, 2=pacman, 3=ghost):");
        for (let y = 0; y < map.length; y++) {
            let row = "";
            for (let x = 0; x < map[y].length; x++) {
                const cell = map[y][x];
                row += cell + " ";
                if (cell === 0) corridors++;
                else if (cell === 1) walls++;
                else if (cell === 2) pacmanCount++;
                else if (cell === 3) ghostCount++;
            }
            console.log(row);
        }
        
        console.log(`Stats: Walls=${walls}, Corridors=${corridors}, Pacman=${pacmanCount}, Ghosts=${ghostCount}`);
    }
    console.log("\n=== MAP VERIFICATION COMPLETE ===");
}

function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    
    // Log all maps on initialization
    logAllMaps();
    
    // Select a random map on page load
    selectRandomMap();
    
    // Initialize score display
    document.querySelector('.score').textContent = score;
    
    // Initialize difficulty display
    updateDifficulty(currentDifficulty);
    
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
                const ghostIndex = ghosts.length;
                const strategy = DIFFICULTY_CONFIGS[currentDifficulty][ghostIndex];
                
                const ghost = {
                    x: x,
                    y: y,
                    dir: null,  // Start with no direction - will be set by strategy immediately
                    color: GHOST_COLORS[ghostIndex],
                    timer: 0,
                    hasLeftBase: false,
                    strategy: strategy,
                    territory: null,
                    visitedCells: new Set(), // Track all visited cells for random strategy
                    lastPosition: null,
                    dfsPath: [],  // DFS path for territorial patrol
                    dfsIndex: 0,  // Current position in DFS path
                    wasChasing: false,  // Track if territorial ghost was chasing
                    pacmanWasInTerritory: false  // Track if Pacman was in territory last frame
                };
                
                // Assign territory for territorial ghosts
                if (strategy === GHOST_STRATEGY.TERRITORIAL) {
                    ghost.territory = assignTerritory(ghostIndex);
                }
                
                ghosts.push(ghost);
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

// Assign territory quadrants to territorial ghosts
function assignTerritory(ghostIndex) {
    // Get all available territories
    const allTerritories = [0, 1, 2, 3]; // 4 quadrants
    
    // Find which territories are already taken by existing ghosts
    const takenTerritories = new Set();
    for (let i = 0; i < ghostIndex && i < ghosts.length; i++) {
        if (ghosts[i].strategy === GHOST_STRATEGY.TERRITORIAL && ghosts[i].territory) {
            // Determine which territory index this ghost has
            const territory = ghosts[i].territory;
            const midX = Math.floor(COLS / 2);
            const midY = Math.floor(ROWS / 2);
            
            let territoryIndex = -1;
            if (territory.maxX <= midX && territory.maxY <= midY) territoryIndex = 0; // Top-left
            else if (territory.minX >= midX && territory.maxY <= midY) territoryIndex = 1; // Top-right
            else if (territory.maxX <= midX && territory.minY >= midY) territoryIndex = 2; // Bottom-left
            else if (territory.minX >= midX && territory.minY >= midY) territoryIndex = 3; // Bottom-right
            
            if (territoryIndex >= 0) {
                takenTerritories.add(territoryIndex);
            }
        }
    }
    
    // Find first available territory
    for (let i = 0; i < allTerritories.length; i++) {
        if (!takenTerritories.has(i)) {
            return assignTerritoryByIndex(i);
        }
    }
    
    // If all territories are taken (more than 4 territorial ghosts), cycle back
    return assignTerritoryByIndex(ghostIndex % 4);
}

// Random AI: Choose random unvisited cell, backtrack if trapped
function getRandomDirection(ghost) {
    const gx = Math.round(ghost.x);
    const gy = Math.round(ghost.y);
    
    // Initialize visit tracking if needed
    if (!ghost.visitedCells) {
        ghost.visitedCells = new Set();
    }
    
    // Add current position to visited cells
    const posKey = `${gx},${gy}`;
    ghost.visitedCells.add(posKey);
    
    // Find unvisited valid directions
    const unvisitedDirs = [];
    const allValidDirs = [];
    
    for (let dir of Object.values(DIR)) {
        const nx = gx + dir.dx;
        const ny = gy + dir.dy;
        
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && grid[ny][nx] !== 1) {
            const nextPosKey = `${nx},${ny}`;
            allValidDirs.push(dir);
            
            // Check if this cell hasn't been visited
            if (!ghost.visitedCells.has(nextPosKey)) {
                unvisitedDirs.push(dir);
            }
        }
    }
    
    // Prefer unvisited cells
    if (unvisitedDirs.length > 0) {
        // Choose randomly among unvisited cells with equal probability
        return unvisitedDirs[Math.floor(Math.random() * unvisitedDirs.length)];
    }
    
    // If all neighboring cells are visited, we're trapped
    if (allValidDirs.length > 0) {
        // Clear visited cells to start fresh exploration
        // This prevents getting stuck in small loops
        if (ghost.visitedCells.size > 10) {
            ghost.visitedCells.clear();
            ghost.visitedCells.add(posKey); // Keep current position
        }
        
        // Choose any valid direction (which will now be "unvisited" after clear)
        return allValidDirs[Math.floor(Math.random() * allValidDirs.length)];
    }
    
    // No valid moves at all (shouldn't happen in a proper maze)
    return ghost.dir || null;
}

// Get alternative move for tracking ghosts (when not taking shortest path)
function getAlternativeMove(ghost, gx, gy, avoidMove) {
    const validMoves = [];
    
    for (let dir of Object.values(DIR)) {
        const nx = gx + dir.dx;
        const ny = gy + dir.dy;
        
        // Check if valid and not the move we're avoiding
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && 
            grid[ny][nx] !== 1 &&
            !(dir.dx === avoidMove.dx && dir.dy === avoidMove.dy)) {
            
            // Check if not visited recently
            const posKey = `${nx},${ny}`;
            if (!ghost.lastPosition || 
                (ghost.lastPosition.x !== nx || ghost.lastPosition.y !== ny)) {
                validMoves.push(dir);
            }
        }
    }
    
    // Return random valid alternative, or the avoided move if no alternatives
    return validMoves.length > 0 ? 
           validMoves[Math.floor(Math.random() * validMoves.length)] : 
           avoidMove;
}

// Territorial DFS patrol move - only moves within territory subgraph
function getTerritorialDFSMove(ghost) {
    const gx = Math.round(ghost.x);
    const gy = Math.round(ghost.y);
    const territory = ghost.territory;
    
    if (!territory) return null;
    
    // Initialize or regenerate DFS path if needed
    // IMPORTANT: Generate from ghost's CURRENT position, not center
    if (!ghost.dfsPath || ghost.dfsPath.length === 0) {
        ghost.dfsPath = generateDFSPathForTerritory(territory, gx, gy);
        ghost.dfsIndex = 0;
    }
    
    // Get target position from DFS path
    if (ghost.dfsPath && ghost.dfsPath.length > 0) {
        const target = ghost.dfsPath[ghost.dfsIndex];
        
        // If we reached the target, move to next point in path
        if (gx === target.x && gy === target.y) {
            ghost.dfsIndex = (ghost.dfsIndex + 1) % ghost.dfsPath.length; // Loop the path
            const nextTarget = ghost.dfsPath[ghost.dfsIndex];
            return getDirectionTowardInTerritory(gx, gy, nextTarget.x, nextTarget.y, territory);
        }
        
        // Move toward current target, constrained to territory
        return getDirectionTowardInTerritory(gx, gy, target.x, target.y, territory);
    }
    
    return null;
}

// Generate DFS path for patrolling a territory - only includes cells in territory subgraph
function generateDFSPathForTerritory(territory, ghostX, ghostY) {
    const path = [];
    const visited = new Set();
    
    // Start from ghost's current position if in territory, otherwise from center
    let startX, startY;
    if (ghostX >= territory.minX && ghostX < territory.maxX &&
        ghostY >= territory.minY && ghostY < territory.maxY) {
        // Ghost is in territory - start from current position
        startX = ghostX;
        startY = ghostY;
    } else {
        // Ghost outside territory - shouldn't happen but use center as fallback
        startX = Math.floor((territory.minX + territory.maxX) / 2);
        startY = Math.floor((territory.minY + territory.maxY) / 2);
    }
    
    // DFS to visit all accessible cells ONLY within territory bounds
    function dfs(x, y) {
        // IGNORE nodes outside territory - never move there
        if (x < territory.minX || x >= territory.maxX || 
            y < territory.minY || y >= territory.maxY) {
            return; // Outside territory subgraph - ignore
        }
        
        const key = `${x},${y}`;
        if (visited.has(key)) return;
        
        // Check if wall
        if (grid[y][x] === 1) return;
        
        visited.add(key);
        path.push({x, y});
        
        // Visit neighbors in consistent order for predictable patrol
        // But only consider cells within territory
        const dirs = [DIR.UP, DIR.RIGHT, DIR.DOWN, DIR.LEFT];
        for (let dir of dirs) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            // Only recurse if next cell is in territory
            if (nx >= territory.minX && nx < territory.maxX &&
                ny >= territory.minY && ny < territory.maxY) {
                dfs(nx, ny);
            }
        }
    }
    
    // Start DFS from center
    dfs(startX, startY);
    
    // If path is empty or too short, create simple patrol within bounds
    if (path.length < 3) {
        path.length = 0;
        // Just move in a small square within territory
        const cx = Math.floor((territory.minX + territory.maxX) / 2);
        const cy = Math.floor((territory.minY + territory.maxY) / 2);
        
        // Try to create a small patrol loop
        const positions = [
            {x: cx, y: cy},
            {x: cx + 1, y: cy},
            {x: cx + 1, y: cy + 1},
            {x: cx, y: cy + 1}
        ];
        
        for (let pos of positions) {
            if (pos.x >= territory.minX && pos.x < territory.maxX &&
                pos.y >= territory.minY && pos.y < territory.maxY &&
                grid[pos.y] && grid[pos.y][pos.x] !== 1) {
                path.push(pos);
            }
        }
    }
    
    return path;
}

// Get direction to move toward target, but stay within territory bounds
function getDirectionTowardInTerritory(fromX, fromY, toX, toY, territory) {
    const dx = Math.sign(toX - fromX);
    const dy = Math.sign(toY - fromY);
    
    // Helper to check if position is in territory
    const inTerritory = (x, y) => {
        return x >= territory.minX && x < territory.maxX &&
               y >= territory.minY && y < territory.maxY;
    };
    
    // Prioritize the axis with greater distance
    if (Math.abs(toX - fromX) > Math.abs(toY - fromY)) {
        if (dx !== 0 && grid[fromY][fromX + dx] !== 1 && inTerritory(fromX + dx, fromY)) {
            return {dx, dy: 0};
        }
        if (dy !== 0 && grid[fromY + dy][fromX] !== 1 && inTerritory(fromX, fromY + dy)) {
            return {dx: 0, dy};
        }
    } else {
        if (dy !== 0 && grid[fromY + dy][fromX] !== 1 && inTerritory(fromX, fromY + dy)) {
            return {dx: 0, dy};
        }
        if (dx !== 0 && grid[fromY][fromX + dx] !== 1 && inTerritory(fromX + dx, fromY)) {
            return {dx, dy: 0};
        }
    }
    
    // Try any valid direction within territory
    for (let dir of Object.values(DIR)) {
        const nx = fromX + dir.dx;
        const ny = fromY + dir.dy;
        if (grid[ny] && grid[ny][nx] !== 1 && inTerritory(nx, ny)) {
            return dir;
        }
    }
    
    return null;
}

// Get direction to move from current position toward target (general purpose)
function getDirectionToward(fromX, fromY, toX, toY) {
    const dx = Math.sign(toX - fromX);
    const dy = Math.sign(toY - fromY);
    
    // Prioritize the axis with greater distance
    if (Math.abs(toX - fromX) > Math.abs(toY - fromY)) {
        if (dx !== 0 && grid[fromY][fromX + dx] !== 1) {
            return {dx, dy: 0};
        }
        if (dy !== 0 && grid[fromY + dy][fromX] !== 1) {
            return {dx: 0, dy};
        }
    } else {
        if (dy !== 0 && grid[fromY + dy][fromX] !== 1) {
            return {dx: 0, dy};
        }
        if (dx !== 0 && grid[fromY][fromX + dx] !== 1) {
            return {dx, dy: 0};
        }
    }
    
    // Try any valid direction
    for (let dir of Object.values(DIR)) {
        if (grid[fromY + dir.dy] && grid[fromY + dir.dy][fromX + dir.dx] !== 1) {
            return dir;
        }
    }
    
    return null;
}

// New Tracking AI with probability-based movement
function getTrackingDirection(ghost, ghostIndex, pacX, pacY) {
    const gx = Math.round(ghost.x);
    const gy = Math.round(ghost.y);
    
    // Count how many tracking ghosts come before this one
    let trackingIndex = 0;
    for (let i = 0; i < ghostIndex; i++) {
        if (ghosts[i].strategy === GHOST_STRATEGY.TRACKING) {
            trackingIndex++;
        }
    }
    
    // Get shortest path using Dijkstra/BFS
    const path = findShortestPath(gx, gy, pacX, pacY);
    
    if (!path || path.length === 0) {
        // No path found - shouldn't happen in connected maps
        return getRandomDirection(ghost);
    }
    
    // First tracking ghost: always follow shortest path (100% probability)
    if (trackingIndex === 0) {
        return path[0];
    }
    
    // For other tracking ghosts: use probability-based movement
    // Probability of taking shortest path decreases slightly for each ghost
    // 1st = 100%, 2nd = 95%, 3rd = 90%, 4th = 85%
    const shortestPathProbability = Math.max(0.85, 1.0 - (0.05 * trackingIndex));
    
    // Find valid neighboring cells that weren't visited in the last move
    const validAlternatives = [];
    
    for (let dir of Object.values(DIR)) {
        const nx = gx + dir.dx;
        const ny = gy + dir.dy;
        
        // Check if valid cell
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && grid[ny][nx] !== 1) {
            // Check if this wasn't our last position
            if (!ghost.lastPosition || ghost.lastPosition.x !== nx || ghost.lastPosition.y !== ny) {
                // Don't include the shortest path direction in alternatives
                if (dir.dx !== path[0].dx || dir.dy !== path[0].dy) {
                    validAlternatives.push(dir);
                }
            }
        }
    }
    
    // Make probabilistic decision
    const rand = Math.random();
    
    if (rand < shortestPathProbability || validAlternatives.length === 0) {
        // Take shortest path
        return path[0];
    } else {
        // Take an alternative path
        if (validAlternatives.length === 1) {
            return validAlternatives[0];
        } else if (validAlternatives.length > 1) {
            // Choose randomly among alternatives with equal probability
            const randomIndex = Math.floor(Math.random() * validAlternatives.length);
            return validAlternatives[randomIndex];
        } else {
            // No alternatives and can't take shortest - backtrack
            if (ghost.lastPosition) {
                const backDir = {
                    dx: ghost.lastPosition.x - gx,
                    dy: ghost.lastPosition.y - gy
                };
                for (let dir of Object.values(DIR)) {
                    if (dir.dx === backDir.dx && dir.dy === backDir.dy) {
                        return dir;
                    }
                }
            }
            // Last resort: take shortest path
            return path[0];
        }
    }
}

// Count valid directions from a position
function countValidDirections(x, y) {
    let count = 0;
    for (let dir of Object.values(DIR)) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && grid[ny][nx] !== 1) {
            count++;
        }
    }
    return count;
}

function updateGhosts() {
    // Get Pacman's grid position
    const pacX = Math.round(pacman.x);
    const pacY = Math.round(pacman.y);
    
    // Single Dijkstra pass for all ghosts to find shortest path to Pacman
    const ghostPaths = [];
    ghosts.forEach((g) => {
        const gx = Math.round(g.x);
        const gy = Math.round(g.y);
        const path = findShortestPath(gx, gy, pacX, pacY);
        ghostPaths.push(path && path.length > 0 ? path[0] : null);
    });
    
    ghosts.forEach((g, index) => {
        g.timer++;
        
        // Clear visited cells periodically to prevent permanent loops (every 200 moves)
        if (g.visitedCells && g.visitedCells.size > 200) {
            g.visitedCells.clear();
        }
        
        // Check if Pacman just entered territorial ghost's territory
        let pacmanJustEntered = false;
        if (g.strategy === GHOST_STRATEGY.TERRITORIAL && g.territory) {
            const pacmanInTerritory = pacX >= g.territory.minX && pacX < g.territory.maxX &&
                                     pacY >= g.territory.minY && pacY < g.territory.maxY;
            pacmanJustEntered = pacmanInTerritory && !g.pacmanWasInTerritory;
            g.pacmanWasInTerritory = pacmanInTerritory;
        }
        
        // Only update direction at grid centers (or immediately when Pacman enters territory)
        const nearCenter = Math.abs(g.x - Math.round(g.x)) < 0.1 && 
                          Math.abs(g.y - Math.round(g.y)) < 0.1;
        
        // Territorial ghosts can update immediately when Pacman is in their territory
        const canUpdate = (nearCenter && g.timer > 10) || 
                         (pacmanJustEntered && nearCenter) ||
                         (g.strategy === GHOST_STRATEGY.TERRITORIAL && g.pacmanWasInTerritory && nearCenter && g.timer > 2);
        
        if (canUpdate) {
            const gx = Math.round(g.x);
            const gy = Math.round(g.y);
            
            // Update last position for all strategies
            g.lastPosition = { x: gx, y: gy };
            
            // Mark ghost as having left base once it's outside the spawn area
            if (!g.hasLeftBase && (gy < 8 || gy > 12 || gx < 7 || gx > 11)) {
                g.hasLeftBase = true;
            }
            
            // Get Dijkstra result for this ghost
            const dijkstraMove = ghostPaths[index];
            let nextMove = null;
            
            switch (g.strategy) {
                case GHOST_STRATEGY.RANDOM:
                    nextMove = getRandomDirection(g);
                    break;
                    
                case GHOST_STRATEGY.TERRITORIAL:
                    if (g.territory) {
                        const pacmanInTerritory = pacX >= g.territory.minX && pacX < g.territory.maxX &&
                                                 pacY >= g.territory.minY && pacY < g.territory.maxY;
                        const ghostInTerritory = gx >= g.territory.minX && gx < g.territory.maxX &&
                                               gy >= g.territory.minY && gy < g.territory.maxY;
                        
                        // FIRST: If ghost is outside territory, always move to center
                        if (!ghostInTerritory) {
                            const centerX = Math.floor((g.territory.minX + g.territory.maxX) / 2);
                            const centerY = Math.floor((g.territory.minY + g.territory.maxY) / 2);
                            nextMove = getDirectionToward(gx, gy, centerX, centerY);
                            // Clear DFS state for when we return
                            g.dfsPath = null;
                            g.dfsIndex = 0;
                            g.wasChasing = false;
                        }
                        // SECOND: Ghost is IN territory - decide based on Pacman
                        else if (pacmanInTerritory && dijkstraMove) {
                            // Pacman is in our territory - try to chase
                            const nextX = gx + dijkstraMove.dx;
                            const nextY = gy + dijkstraMove.dy;
                            const moveStaysInTerritory = nextX >= g.territory.minX && nextX < g.territory.maxX &&
                                                        nextY >= g.territory.minY && nextY < g.territory.maxY;
                            
                            if (moveStaysInTerritory) {
                                // Dijkstra move keeps us in territory - chase!
                                nextMove = dijkstraMove;
                                // Mark as chasing and clear DFS
                                if (!g.wasChasing) {
                                    g.dfsPath = null;
                                    g.dfsIndex = 0;
                                    g.wasChasing = true;
                                }
                            } else {
                                // Can't chase without leaving territory - patrol instead
                                if (g.wasChasing) {
                                    // Was chasing but now can't - reinit DFS
                                    g.dfsPath = null;
                                    g.dfsIndex = 0;
                                    g.wasChasing = false;
                                }
                                nextMove = getTerritorialDFSMove(g);
                            }
                        }
                        // THIRD: Ghost in territory, Pacman NOT in territory - patrol
                        else {
                            if (g.wasChasing) {
                                // Pacman just left - reinitialize DFS from current position
                                g.dfsPath = null;
                                g.dfsIndex = 0;
                                g.wasChasing = false;
                            }
                            // Do DFS patrol
                            nextMove = getTerritorialDFSMove(g);
                        }
                    }
                    break;
                    
                case GHOST_STRATEGY.TRACKING:
                    // Use the Dijkstra result we already calculated
                    if (dijkstraMove) {
                        // Count tracking ghosts before this one for probability
                        let trackingIndex = 0;
                        for (let i = 0; i < index; i++) {
                            if (ghosts[i].strategy === GHOST_STRATEGY.TRACKING) {
                                trackingIndex++;
                            }
                        }
                        
                        // Apply probability based on tracking index
                        // 1st = 100%, 2nd = 95%, 3rd = 90%, 4th = 85%
                        const shortestPathProbability = Math.max(0.85, 1.0 - (0.05 * trackingIndex));
                        
                        if (trackingIndex === 0 || Math.random() < shortestPathProbability) {
                            // Take shortest path
                            nextMove = dijkstraMove;
                        } else {
                            // Take alternative
                            nextMove = getAlternativeMove(g, gx, gy, dijkstraMove);
                        }
                    } else {
                        nextMove = getRandomDirection(g);
                    }
                    break;
                    
                default:
                    nextMove = getRandomDirection(g);
            }
            
            if (nextMove) {
                // FINAL SAFETY CHECK: Territorial ghosts must NEVER leave territory
                if (g.strategy === GHOST_STRATEGY.TERRITORIAL && g.territory) {
                    const nextX = gx + nextMove.dx;
                    const nextY = gy + nextMove.dy;
                    const ghostInTerritory = gx >= g.territory.minX && gx < g.territory.maxX &&
                                            gy >= g.territory.minY && gy < g.territory.maxY;
                    const moveInTerritory = nextX >= g.territory.minX && nextX < g.territory.maxX &&
                                           nextY >= g.territory.minY && nextY < g.territory.maxY;
                    
                    // If ghost is in territory and move would leave, BLOCK IT
                    if (ghostInTerritory && !moveInTerritory) {
                        nextMove = null; // Cancel the move entirely
                    }
                }
                
                // Check if it's not a reverse (unless no choice)
                if (nextMove && (!g.dir || !(nextMove.dx === -g.dir.dx && nextMove.dy === -g.dir.dy))) {
                    g.dir = nextMove;
                    g.timer = 0;
                } else if (nextMove) {
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
        
        // IMMEDIATE RESPONSE: Territorial ghosts drop DFS and chase when Pacman enters
        // This happens even mid-movement, not just at grid centers
        if (g.strategy === GHOST_STRATEGY.TERRITORIAL && g.territory) {
            const pacmanInTerritory = pacX >= g.territory.minX && pacX < g.territory.maxX &&
                                     pacY >= g.territory.minY && pacY < g.territory.maxY;
            const gx = Math.round(g.x);
            const gy = Math.round(g.y);
            const ghostInTerritory = gx >= g.territory.minX && gx < g.territory.maxX &&
                                    gy >= g.territory.minY && gy < g.territory.maxY;
            
            // If Pacman is in territory, ghost is in territory, and ghost is not already chasing
            // Then immediately switch to chasing, even mid-movement
            if (pacmanInTerritory && ghostInTerritory && !g.wasChasing) {
                // Use the pre-calculated Dijkstra move
                const dijkstraMove = ghostPaths[index];
                
                if (dijkstraMove) {
                    const nextX = gx + dijkstraMove.dx;
                    const nextY = gy + dijkstraMove.dy;
                    
                    // Only switch if the move keeps us in territory
                    if (nextX >= g.territory.minX && nextX < g.territory.maxX &&
                        nextY >= g.territory.minY && nextY < g.territory.maxY) {
                        // Drop DFS immediately and switch to chasing
                        g.dir = dijkstraMove;
                        g.wasChasing = true;
                        g.dfsPath = null;
                        g.dfsIndex = 0;
                        g.timer = 0; // Reset timer to allow continuous updates while chasing
                        
                        // Snap to grid for smoother transition
                        if (Math.abs(g.x - gx) < 0.3 && Math.abs(g.y - gy) < 0.3) {
                            g.x = gx;
                            g.y = gy;
                        }
                    }
                }
            }
            // Also handle when Pacman leaves - immediately resume patrol
            else if (!pacmanInTerritory && ghostInTerritory && g.wasChasing) {
                g.wasChasing = false;
                g.dfsPath = null;  // Will regenerate DFS path from current position
                g.dfsIndex = 0;
                g.timer = 0;
            }
        }
        
        // Move ghost with consistent speed
        if (g.dir && canMove(g.x, g.y, g.dir)) {
            // ABSOLUTE FINAL CHECK: Territorial ghosts cannot move outside territory
            if (g.strategy === GHOST_STRATEGY.TERRITORIAL && g.territory) {
                const currentInTerritory = g.x >= g.territory.minX && g.x < g.territory.maxX &&
                                          g.y >= g.territory.minY && g.y < g.territory.maxY;
                const nextX = g.x + g.dir.dx * 0.05;
                const nextY = g.y + g.dir.dy * 0.05;
                const nextInTerritory = nextX >= g.territory.minX && nextX < g.territory.maxX &&
                                       nextY >= g.territory.minY && nextY < g.territory.maxY;
                
                // Only move if we stay in territory OR we're returning to territory
                if (currentInTerritory && !nextInTerritory) {
                    // Would leave territory - DON'T MOVE
                    g.dir = null;
                }
            }
            
            // Only move if direction is still valid after all checks
            if (g.dir) {
                const speed = 0.05;  // Same speed for all ghosts
                g.x += g.dir.dx * speed;
                g.y += g.dir.dy * speed;
            }
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
        // Cancel animation frame when game is over
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
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
    if (!gameRunning) {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        return;
    }
    
    frame++;
    updatePacman();
    updateGhosts();
    render();
    
    animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    
    // Cancel any existing animation frame
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
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
    // Cancel any existing animation frame
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
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

function reloadMap() {
    // Stop current game
    gameRunning = false;
    
    // Cancel any existing animation frame
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    // Select a new random map
    selectRandomMap();
    
    // Reset game state completely
    score = 0;
    lives = 3;
    document.querySelector('.score').textContent = score;
    
    // Hide any screens that might be showing
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    
    // Reset level and start game
    resetLevel();
    updateLivesDisplay();
    gameRunning = true;
    gameLoop();
}

// Update difficulty setting
function updateDifficulty(value) {
    currentDifficulty = parseInt(value);
    
    const difficultyNames = {
        1: 'Easy',
        2: 'Normal',
        3: 'Medium',
        4: 'Hard',
        5: 'Expert',
        6: 'Insane'
    };
    
    const difficultyValue = document.getElementById('difficulty-value');
    if (difficultyValue) {
        difficultyValue.textContent = difficultyNames[currentDifficulty];
    }
    
    // Reload the level when difficulty changes
    if (gameRunning) {
        // Keep the current map but reset the level
        resetLevel();
        // Don't need to call gameLoop as it's already running
    }
}

// Assign specific territory by index
function assignTerritoryByIndex(index) {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    
    const territories = [
        { minX: 0, maxX: midX, minY: 0, maxY: midY },        // Top-left
        { minX: midX, maxX: COLS, minY: 0, maxY: midY },     // Top-right
        { minX: 0, maxX: midX, minY: midY, maxY: ROWS },     // Bottom-left
        { minX: midX, maxX: COLS, minY: midY, maxY: ROWS }   // Bottom-right
    ];
    
    return territories[index % 4];
}

window.addEventListener('load', init);