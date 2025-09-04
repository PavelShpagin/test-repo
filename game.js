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

// Constants
const CELL_SIZE = 20;  // UI pixels per grid cell
const ROWS = GRID.length;
const COLS = GRID[0].length;
const SPEED = 0.08;  // Grid units per frame
const GHOST_SPEED = 0.06;

// Game State
let canvas, ctx;
let score = 0;
let lives = 3;
let gameRunning = false;
let animationFrame = 0;

// Binary grid (walls and corridors)
let binaryGrid = [];

// Entities with proper coordinate system
let pacman = {
    // Integer cell position (which cell am I in?)
    cellX: 0,
    cellY: 0,
    
    // Float grid coordinates (exact position in grid space)
    floatX: 0.0,
    floatY: 0.0,
    
    // Movement
    direction: null,
    nextDirection: null,
    moving: false
};

let ghosts = [];
let pellets = [];

// Ghost colors
const GHOST_COLORS = ['#ff0000', '#00ffff', '#ffb8ff', '#ffb851'];

// Directions
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Linear transformation: Grid → UI
function gridToUI(gridCoord) {
    return gridCoord * CELL_SIZE;
}

// Update integer cell position from float coordinates
function updateCellPosition(entity) {
    entity.cellX = Math.floor(entity.floatX);
    entity.cellY = Math.floor(entity.floatY);
}

// Check if position is near cell center (for turning)
function isNearCellCenter(floatX, floatY) {
    const fracX = floatX - Math.floor(floatX);
    const fracY = floatY - Math.floor(floatY);
    return Math.abs(fracX - 0.5) < 0.3 && Math.abs(fracY - 0.5) < 0.3;
}

// Check if a cell is walkable
function isWalkable(cellX, cellY) {
    if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) {
        return false;
    }
    return binaryGrid[cellY][cellX] === 0;
}

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
    // Initialize binary grid (0 = walkable, 1 = wall)
    binaryGrid = GRID.map(row => row.map(cell => cell === 1 ? 1 : 0));
    
    // Reset entities
    ghosts = [];
    pellets = [];
    
    // Parse initial positions
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            const cell = GRID[y][x];
            
            if (cell === 0) {
                // Add pellet
                pellets.push({ cellX: x, cellY: y });
            } else if (cell === 2) {
                // Initialize Pacman at center of cell
                pacman.cellX = x;
                pacman.cellY = y;
                pacman.floatX = x + 0.5;
                pacman.floatY = y + 0.5;
                pacman.direction = null;
                pacman.nextDirection = null;
                pacman.moving = false;
                pellets.push({ cellX: x, cellY: y });
            } else if (cell === 3) {
                // Add ghost at center of cell
                ghosts.push({
                    cellX: x,
                    cellY: y,
                    floatX: x + 0.5,
                    floatY: y + 0.5,
                    direction: DIRECTIONS.UP,
                    color: GHOST_COLORS[ghosts.length % GHOST_COLORS.length],
                    turnCooldown: 0
                });
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

function updatePacman() {
    // Update cell position from float coordinates
    const oldCellX = pacman.cellX;
    const oldCellY = pacman.cellY;
    updateCellPosition(pacman);
    
    // Try to change direction if near cell center
    if (pacman.nextDirection && isNearCellCenter(pacman.floatX, pacman.floatY)) {
        const nextCellX = pacman.cellX + pacman.nextDirection.x;
        const nextCellY = pacman.cellY + pacman.nextDirection.y;
        
        if (isWalkable(nextCellX, nextCellY)) {
            pacman.direction = pacman.nextDirection;
            pacman.nextDirection = null;
            // Snap to cell center for clean turns
            pacman.floatX = pacman.cellX + 0.5;
            pacman.floatY = pacman.cellY + 0.5;
        }
    }
    
    // Move in current direction
    if (pacman.direction) {
        // Calculate next float position
        const nextFloatX = pacman.floatX + pacman.direction.x * SPEED;
        const nextFloatY = pacman.floatY + pacman.direction.y * SPEED;
        
        // Check which cell we're moving into
        const movingIntoCellX = Math.floor(nextFloatX + pacman.direction.x * 0.4);
        const movingIntoCellY = Math.floor(nextFloatY + pacman.direction.y * 0.4);
        
        if (isWalkable(movingIntoCellX, movingIntoCellY)) {
            // Move forward
            pacman.floatX = nextFloatX;
            pacman.floatY = nextFloatY;
            pacman.moving = true;
        } else {
            // Hit wall - align to cell boundary
            if (pacman.direction.x > 0) {
                pacman.floatX = Math.floor(pacman.floatX) + 0.99;
            } else if (pacman.direction.x < 0) {
                pacman.floatX = Math.ceil(pacman.floatX) - 0.99;
            }
            if (pacman.direction.y > 0) {
                pacman.floatY = Math.floor(pacman.floatY) + 0.99;
            } else if (pacman.direction.y < 0) {
                pacman.floatY = Math.ceil(pacman.floatY) - 0.99;
            }
            pacman.moving = false;
        }
    }
    
    // Collect pellets when entering new cell
    if (pacman.cellX !== oldCellX || pacman.cellY !== oldCellY) {
        for (let i = pellets.length - 1; i >= 0; i--) {
            if (pellets[i].cellX === pacman.cellX && pellets[i].cellY === pacman.cellY) {
                pellets.splice(i, 1);
                score += 10;
                document.querySelector('.score').textContent = score;
                
                if (pellets.length === 0) {
                    nextLevel();
                }
                break;
            }
        }
    }
}

function updateGhosts() {
    ghosts.forEach(ghost => {
        // Update cell position
        updateCellPosition(ghost);
        
        if (ghost.turnCooldown > 0) ghost.turnCooldown--;
        
        // Try to change direction at cell centers
        if (isNearCellCenter(ghost.floatX, ghost.floatY) && ghost.turnCooldown === 0) {
            const directions = Object.values(DIRECTIONS);
            const validDirections = [];
            
            for (let dir of directions) {
                // Skip reverse direction
                if (ghost.direction && 
                    dir.x === -ghost.direction.x && 
                    dir.y === -ghost.direction.y) {
                    continue;
                }
                
                const nextCellX = ghost.cellX + dir.x;
                const nextCellY = ghost.cellY + dir.y;
                
                if (isWalkable(nextCellX, nextCellY)) {
                    validDirections.push(dir);
                }
            }
            
            if (validDirections.length > 0) {
                // Check if current direction is still valid
                const canContinue = ghost.direction && 
                    isWalkable(ghost.cellX + ghost.direction.x, ghost.cellY + ghost.direction.y);
                
                // Change direction randomly or if hitting wall
                if (!canContinue || Math.random() < 0.3) {
                    ghost.direction = validDirections[Math.floor(Math.random() * validDirections.length)];
                    ghost.turnCooldown = 10;
                }
            } else if (ghost.direction) {
                // Can only reverse
                ghost.direction = { x: -ghost.direction.x, y: -ghost.direction.y };
                ghost.turnCooldown = 10;
            }
        }
        
        // Move ghost
        if (ghost.direction) {
            const nextFloatX = ghost.floatX + ghost.direction.x * GHOST_SPEED;
            const nextFloatY = ghost.floatY + ghost.direction.y * GHOST_SPEED;
            
            const movingIntoCellX = Math.floor(nextFloatX + ghost.direction.x * 0.4);
            const movingIntoCellY = Math.floor(nextFloatY + ghost.direction.y * 0.4);
            
            if (isWalkable(movingIntoCellX, movingIntoCellY)) {
                ghost.floatX = nextFloatX;
                ghost.floatY = nextFloatY;
            }
        }
        
        // Check collision with Pacman (same cell)
        if (ghost.cellX === pacman.cellX && ghost.cellY === pacman.cellY) {
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
    resetLevel();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw walls from binary grid
    ctx.fillStyle = '#222';
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (binaryGrid[y][x] === 1) {
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
            gridToUI(pellet.cellX + 0.5),
            gridToUI(pellet.cellY + 0.5),
            3,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
    
    // Draw Pacman using linear transformation
    const pacmanUIX = gridToUI(pacman.floatX);
    const pacmanUIY = gridToUI(pacman.floatY);
    
    ctx.fillStyle = '#ffd700';
    ctx.save();
    ctx.translate(pacmanUIX, pacmanUIY);
    
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
    
    // Draw ghosts using linear transformation
    ghosts.forEach(ghost => {
        const ghostUIX = gridToUI(ghost.floatX);
        const ghostUIY = gridToUI(ghost.floatY);
        
        ctx.fillStyle = ghost.color;
        ctx.save();
        ctx.translate(ghostUIX, ghostUIY);
        
        // Ghost body
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