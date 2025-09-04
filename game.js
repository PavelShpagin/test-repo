// Game Configuration
const MAZE = [
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
];

const CELL_SIZE = 20;
const ROWS = MAZE.length;
const COLS = MAZE[0].length;

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

function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;
    
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
                    timer: 0
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

// BFS to find paths from ghosts to Pacman
function findPathBFS(startX, startY, targetX, targetY) {
    const queue = [{x: startX, y: startY, path: []}];
    const visited = new Set();
    visited.add(`${startX},${startY}`);
    
    while (queue.length > 0) {
        const {x, y, path} = queue.shift();
        
        // Found target
        if (x === targetX && y === targetY) {
            return path;
        }
        
        // Try all directions
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
    
    return null; // No path found
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
            
            // Find path to Pacman using BFS
            const path = findPathBFS(gx, gy, pacX, pacY);
            
            if (path && path.length > 0) {
                // Use the actual BFS path!
                // First ghost takes optimal path
                // Other ghosts try alternate routes
                
                if (index === 0) {
                    // Ghost 0: Take the optimal BFS path
                    g.dir = path[0];
                    g.timer = 0;
                } else {
                    // Other ghosts: Find alternate paths
                    // Get all valid directions
                    const validDirs = [];
                    for (let dir of Object.values(DIR)) {
                        const nx = gx + dir.dx;
                        const ny = gy + dir.dy;
                        
                        // Don't reverse
                        if (g.dir && dir.dx === -g.dir.dx && dir.dy === -g.dir.dy) {
                            continue;
                        }
                        
                        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && grid[ny][nx] !== 1) {
                            validDirs.push(dir);
                        }
                    }
                    
                    // Prefer directions that are NOT the optimal path
                    const nonOptimal = validDirs.filter(d => d !== path[0]);
                    
                    if (nonOptimal.length > 0 && index <= nonOptimal.length) {
                        // Take an alternate route
                        g.dir = nonOptimal[Math.min(index - 1, nonOptimal.length - 1)];
                    } else if (validDirs.length > 0) {
                        // Fall back to any valid direction
                        g.dir = validDirs[0];
                    }
                    g.timer = 0;
                }
            } else {
                // No path found or same position - pick random valid direction
                const dirs = Object.values(DIR);
                const valid = dirs.filter(d => {
                    if (g.dir && d.dx === -g.dir.dx && d.dy === -g.dir.dy) {
                        return false;
                    }
                    return canMove(gx, gy, d);
                });
                
                if (valid.length > 0) {
                    g.dir = valid[Math.floor(Math.random() * valid.length)];
                    g.timer = 0;
                } else if (g.dir) {
                    // Must reverse
                    g.dir = { dx: -g.dir.dx, dy: -g.dir.dy };
                    g.timer = 0;
                }
            }
        }
        
        // Move ghost
        if (g.dir && canMove(g.x, g.y, g.dir)) {
            // Vary speed slightly per ghost
            const speed = 0.05 + (index * 0.002);
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
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw maze
    ctx.fillStyle = '#222';
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
    gameRunning = true;
    gameLoop();
}

function resetGame() {
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