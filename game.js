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

// Ghosts with different behaviors
let ghosts = [];
const GHOST_COLORS = ['#ff0000', '#00ffff', '#ffb8ff', '#ffb851'];
const GHOST_MODES = ['chase', 'ambush', 'patrol', 'random'];

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
                    homeX: x,
                    homeY: y,
                    dir: DIR.UP,
                    color: GHOST_COLORS[ghosts.length],
                    mode: GHOST_MODES[ghosts.length],
                    timer: 0,
                    scatterTimer: 0
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

function updateGhosts() {
    ghosts.forEach((g, index) => {
        g.timer++;
        g.scatterTimer++;
        
        // Switch between chase and scatter mode
        const inScatterMode = g.scatterTimer < 200;
        
        // Change direction at intersections
        const nearCenter = Math.abs(g.x - Math.round(g.x)) < 0.1 && 
                          Math.abs(g.y - Math.round(g.y)) < 0.1;
        
        if (nearCenter && g.timer > 10) {
            const gx = Math.round(g.x);
            const gy = Math.round(g.y);
            
            // Get valid directions (no reverse unless stuck)
            const dirs = Object.values(DIR);
            const valid = dirs.filter(d => {
                // No reverse
                if (g.dir && d.dx === -g.dir.dx && d.dy === -g.dir.dy) {
                    return false;
                }
                return canMove(gx, gy, d);
            });
            
            if (valid.length > 0) {
                // Need to change direction?
                const needChange = !canMove(g.x, g.y, g.dir) || 
                                 (valid.length > 1 && g.timer > 15);
                
                if (needChange) {
                    // Choose direction based on ghost AI mode
                    let targetX, targetY;
                    
                    if (inScatterMode) {
                        // Scatter to corners
                        targetX = g.homeX;
                        targetY = g.homeY;
                    } else {
                        // Different chase behaviors
                        switch (g.mode) {
                            case 'chase':
                                // Red ghost - direct chase
                                targetX = Math.round(pacman.x);
                                targetY = Math.round(pacman.y);
                                break;
                            
                            case 'ambush':
                                // Cyan ghost - aim ahead of Pacman
                                targetX = Math.round(pacman.x);
                                targetY = Math.round(pacman.y);
                                if (pacman.dir) {
                                    targetX += pacman.dir.dx * 4;
                                    targetY += pacman.dir.dy * 4;
                                }
                                break;
                            
                            case 'patrol':
                                // Pink ghost - patrol area near Pacman
                                const angle = (frame + index * 100) * 0.05;
                                targetX = Math.round(pacman.x + Math.cos(angle) * 5);
                                targetY = Math.round(pacman.y + Math.sin(angle) * 5);
                                break;
                            
                            case 'random':
                                // Orange ghost - random with occasional chase
                                if (Math.random() < 0.3) {
                                    targetX = Math.round(pacman.x);
                                    targetY = Math.round(pacman.y);
                                } else {
                                    targetX = Math.floor(Math.random() * COLS);
                                    targetY = Math.floor(Math.random() * ROWS);
                                }
                                break;
                        }
                    }
                    
                    // Pick direction that gets closer to target
                    let bestDir = valid[0];
                    let bestDist = Infinity;
                    
                    valid.forEach(d => {
                        const nextX = gx + d.dx;
                        const nextY = gy + d.dy;
                        const dist = Math.abs(nextX - targetX) + Math.abs(nextY - targetY);
                        
                        if (dist < bestDist) {
                            bestDist = dist;
                            bestDir = d;
                        }
                    });
                    
                    g.dir = bestDir;
                    g.timer = 0;
                }
            } else if (!canMove(g.x, g.y, g.dir)) {
                // Must reverse if stuck
                g.dir = { dx: -g.dir.dx, dy: -g.dir.dy };
                g.timer = 0;
            }
        }
        
        // Move ghost
        if (g.dir && canMove(g.x, g.y, g.dir)) {
            // Speed varies by mode
            let speed = 0.05;
            if (!inScatterMode && g.mode === 'chase') {
                speed = 0.055; // Red ghost slightly faster when chasing
            }
            g.x += g.dir.dx * speed;
            g.y += g.dir.dy * speed;
        }
        
        // Reset scatter timer periodically
        if (g.scatterTimer > 400) {
            g.scatterTimer = 0;
        }
        
        // Check collision
        if (Math.round(g.x) === Math.round(pacman.x) && 
            Math.round(g.y) === Math.round(pacman.y)) {
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