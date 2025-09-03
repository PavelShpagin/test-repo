// Game Configuration
const GRID = [
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
const ROWS = GRID.length;
const COLS = GRID[0].length;

// Game State
let canvas, ctx;
let score = 0;
let lives = 3;
let gameRunning = false;
let animationFrame = 0;

// Entities
let pacman = {
    gridX: 0,      // Current cell X
    gridY: 0,      // Current cell Y
    targetX: 0,    // Target cell X
    targetY: 0,    // Target cell Y
    x: 0,          // UI position X (for smooth animation)
    y: 0,          // UI position Y (for smooth animation)
    direction: null,
    nextDirection: null,
    speed: 0.1,
    moving: false
};

let ghosts = [];
let pellets = [];
let grid = [];

// Ghost colors
const GHOST_COLORS = ['#ff0000', '#00ffff', '#ffb8ff', '#ffb851'];

// Directions
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Initialize game
function init() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;
    
    setupControls();
    resetLevel();
    updateLives();
    draw();
}

function resetLevel() {
    // Deep copy grid
    grid = GRID.map(row => [...row]);
    
    // Reset entities
    ghosts = [];
    pellets = [];
    
    // Parse grid
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = grid[y][x];
            
            if (cell === 0) {
                // Add pellet
                pellets.push({ x, y });
            } else if (cell === 2) {
                // Set pacman position
                pacman.gridX = x;
                pacman.gridY = y;
                pacman.targetX = x;
                pacman.targetY = y;
                pacman.x = x;
                pacman.y = y;
                pacman.direction = null;
                pacman.nextDirection = null;
                pacman.moving = false;
                grid[y][x] = 0; // Clear cell
                pellets.push({ x, y }); // Add pellet
            } else if (cell === 3) {
                // Add ghost
                ghosts.push({
                    gridX: x,
                    gridY: y,
                    targetX: x,
                    targetY: y,
                    x: x,
                    y: y,
                    direction: DIRECTIONS.UP,
                    speed: 0.05,
                    color: GHOST_COLORS[ghosts.length % GHOST_COLORS.length]
                });
                grid[y][x] = 0; // Clear cell
            }
        }
    }
}

function setupControls() {
    // Touch controls
    document.querySelectorAll('.controls button').forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameRunning) {
                const dir = btn.dataset.dir;
                pacman.nextDirection = DIRECTIONS[dir];
            }
        });
        
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (gameRunning) {
                const dir = btn.dataset.dir;
                pacman.nextDirection = DIRECTIONS[dir];
            }
        });
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (!gameRunning) return;
        
        switch(e.key) {
            case 'ArrowUp':
                pacman.nextDirection = DIRECTIONS.UP;
                break;
            case 'ArrowDown':
                pacman.nextDirection = DIRECTIONS.DOWN;
                break;
            case 'ArrowLeft':
                pacman.nextDirection = DIRECTIONS.LEFT;
                break;
            case 'ArrowRight':
                pacman.nextDirection = DIRECTIONS.RIGHT;
                break;
        }
    });
    
    // Swipe controls
    let touchStart = null;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStart = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
    });
    
    canvas.addEventListener('touchend', (e) => {
        if (!touchStart || !gameRunning) return;
        
        const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
        };
        
        const dx = touchEnd.x - touchStart.x;
        const dy = touchEnd.y - touchStart.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            pacman.nextDirection = dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
        } else {
            pacman.nextDirection = dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
        }
        
        touchStart = null;
    });
}

function canMoveTo(fromX, fromY, direction) {
    if (!direction) return false;
    
    const newX = fromX + direction.x;
    const newY = fromY + direction.y;
    
    // Check bounds
    if (newX < 0 || newX >= COLS || newY < 0 || newY >= ROWS) {
        return false;
    }
    
    // Check if target cell is not a wall
    return grid[newY][newX] !== 1;
}

function updatePacman() {
    // Smooth movement towards target
    const dx = pacman.targetX - pacman.x;
    const dy = pacman.targetY - pacman.y;
    
    if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        // Still moving to target
        pacman.x += dx * pacman.speed * 2;
        pacman.y += dy * pacman.speed * 2;
        pacman.moving = true;
    } else {
        // Reached target cell
        pacman.x = pacman.targetX;
        pacman.y = pacman.targetY;
        pacman.gridX = pacman.targetX;
        pacman.gridY = pacman.targetY;
        
        // Check for direction change
        if (pacman.nextDirection && canMoveTo(pacman.gridX, pacman.gridY, pacman.nextDirection)) {
            pacman.direction = pacman.nextDirection;
            pacman.nextDirection = null;
        }
        
        // Try to continue in current direction
        if (pacman.direction && canMoveTo(pacman.gridX, pacman.gridY, pacman.direction)) {
            pacman.targetX = pacman.gridX + pacman.direction.x;
            pacman.targetY = pacman.gridY + pacman.direction.y;
            pacman.moving = true;
        } else {
            pacman.moving = false;
        }
    }
    
    // Collect pellets (check current grid cell)
    for (let i = pellets.length - 1; i >= 0; i--) {
        const pellet = pellets[i];
        if (pellet.x === pacman.gridX && pellet.y === pacman.gridY) {
            pellets.splice(i, 1);
            score += 10;
            document.querySelector('.score').textContent = score;
            
            // Check win
            if (pellets.length === 0) {
                nextLevel();
            }
        }
    }
}

function updateGhosts() {
    ghosts.forEach(ghost => {
        // Smooth movement towards target
        const dx = ghost.targetX - ghost.x;
        const dy = ghost.targetY - ghost.y;
        
        if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
            // Still moving to target
            ghost.x += dx * ghost.speed * 2;
            ghost.y += dy * ghost.speed * 2;
        } else {
            // Reached target cell
            ghost.x = ghost.targetX;
            ghost.y = ghost.targetY;
            ghost.gridX = ghost.targetX;
            ghost.gridY = ghost.targetY;
            
            // Choose new direction
            const directions = Object.values(DIRECTIONS);
            const possible = directions.filter(dir => {
                // Don't reverse immediately
                if (ghost.direction && 
                    dir.x === -ghost.direction.x && 
                    dir.y === -ghost.direction.y) {
                    return false;
                }
                return canMoveTo(ghost.gridX, ghost.gridY, dir);
            });
            
            if (possible.length > 0) {
                // Random direction change (30% chance to change at intersection)
                if (Math.random() < 0.3 || !canMoveTo(ghost.gridX, ghost.gridY, ghost.direction)) {
                    ghost.direction = possible[Math.floor(Math.random() * possible.length)];
                }
            } else {
                // Can only reverse
                ghost.direction = {
                    x: -ghost.direction.x,
                    y: -ghost.direction.y
                };
            }
            
            // Set new target if can move
            if (ghost.direction && canMoveTo(ghost.gridX, ghost.gridY, ghost.direction)) {
                ghost.targetX = ghost.gridX + ghost.direction.x;
                ghost.targetY = ghost.gridY + ghost.direction.y;
            }
        }
        
        // Check collision with pacman (grid-based)
        if (ghost.gridX === pacman.gridX && ghost.gridY === pacman.gridY) {
            loseLife();
        }
    });
}

function loseLife() {
    lives--;
    updateLives();
    
    if (lives <= 0) {
        gameOver();
    } else {
        resetLevel();
    }
}

function updateLives() {
    const livesContainer = document.querySelector('.lives');
    livesContainer.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const life = document.createElement('div');
        life.className = 'life';
        livesContainer.appendChild(life);
    }
}

function nextLevel() {
    // Increase ghost speed
    ghosts.forEach(ghost => {
        ghost.speed = Math.min(ghost.speed * 1.2, 0.1);
    });
    resetLevel();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw walls
    ctx.fillStyle = '#222';
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (grid[y][x] === 1) {
                ctx.fillRect(
                    x * CELL_SIZE + 1,
                    y * CELL_SIZE + 1,
                    CELL_SIZE - 2,
                    CELL_SIZE - 2
                );
            }
        }
    }
    
    // Draw pellets
    ctx.fillStyle = '#ffd700';
    pellets.forEach(pellet => {
        ctx.beginPath();
        ctx.arc(
            pellet.x * CELL_SIZE + CELL_SIZE / 2,
            pellet.y * CELL_SIZE + CELL_SIZE / 2,
            3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
    
    // Draw pacman
    ctx.fillStyle = '#ffd700';
    ctx.save();
    ctx.translate(
        pacman.x * CELL_SIZE + CELL_SIZE / 2,
        pacman.y * CELL_SIZE + CELL_SIZE / 2
    );
    
    // Animate mouth
    let mouthAngle = 0.2;
    if (pacman.moving) {
        mouthAngle = Math.abs(Math.sin(animationFrame * 0.2)) * 0.3 + 0.1;
    }
    
    // Rotate based on direction
    let rotation = 0;
    if (pacman.direction) {
        if (pacman.direction.x > 0) rotation = 0;
        else if (pacman.direction.x < 0) rotation = Math.PI;
        else if (pacman.direction.y > 0) rotation = Math.PI / 2;
        else if (pacman.direction.y < 0) rotation = -Math.PI / 2;
    }
    ctx.rotate(rotation);
    
    ctx.beginPath();
    ctx.arc(0, 0, CELL_SIZE / 2 - 2, mouthAngle * Math.PI, -mouthAngle * Math.PI);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // Draw ghosts
    ghosts.forEach(ghost => {
        ctx.fillStyle = ghost.color;
        ctx.save();
        ctx.translate(
            ghost.x * CELL_SIZE + CELL_SIZE / 2,
            ghost.y * CELL_SIZE + CELL_SIZE / 2
        );
        
        // Simple ghost shape
        ctx.beginPath();
        ctx.arc(0, -2, CELL_SIZE / 2 - 2, Math.PI, 0, false);
        ctx.lineTo(CELL_SIZE / 2 - 2, CELL_SIZE / 2 - 4);
        
        // Wavy bottom
        for (let i = 0; i < 3; i++) {
            const x = (i - 1) * 6;
            ctx.quadraticCurveTo(x - 3, CELL_SIZE / 2 - 2, x, CELL_SIZE / 2 - 4);
        }
        
        ctx.lineTo(-CELL_SIZE / 2 + 2, CELL_SIZE / 2 - 4);
        ctx.closePath();
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
    
    animationFrame++;
    updatePacman();
    updateGhosts();
    draw();
    
    requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameRunning = true;
    gameLoop();
}

function gameOver() {
    gameRunning = false;
    document.getElementById('final-score').textContent = `SCORE: ${score}`;
    document.getElementById('game-over').classList.remove('hidden');
}

function resetGame() {
    score = 0;
    lives = 3;
    document.querySelector('.score').textContent = score;
    document.getElementById('game-over').classList.add('hidden');
    resetLevel();
    updateLives();
    gameRunning = true;
    gameLoop();
}

// Initialize on load
window.addEventListener('load', init);