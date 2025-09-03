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
const SPEED = 0.08;  // Grid units per frame
const GHOST_SPEED = 0.06;

// Game State
let canvas, ctx;
let score = 0;
let lives = 3;
let gameRunning = false;
let animationFrame = 0;

// Entities - using grid coordinates (not pixels!)
let pacman = {
    gridX: 0,      // Grid position (can be 5.7 for between cells)
    gridY: 0,      
    direction: null,
    nextDirection: null,
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
                // Set pacman position (center of cell)
                pacman.gridX = x + 0.5;
                pacman.gridY = y + 0.5;
                pacman.direction = null;
                pacman.nextDirection = null;
                pacman.moving = false;
                grid[y][x] = 0; // Clear cell
                pellets.push({ x, y }); // Add pellet
            } else if (cell === 3) {
                // Add ghost (center of cell)
                ghosts.push({
                    gridX: x + 0.5,
                    gridY: y + 0.5,
                    direction: DIRECTIONS.UP,
                    color: GHOST_COLORS[ghosts.length % GHOST_COLORS.length],
                    turnTimer: Math.random() * 30
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

// Get current cell from grid position
function getCurrentCell(gridX, gridY) {
    return {
        x: Math.floor(gridX),
        y: Math.floor(gridY)
    };
}

// Check if we can move into a cell
function canEnterCell(cellX, cellY) {
    if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) {
        return false;
    }
    return grid[cellY][cellX] !== 1;
}

// Check if near center of cell (for turning)
function nearCellCenter(gridX, gridY) {
    const fracX = gridX % 1;
    const fracY = gridY % 1;
    return Math.abs(fracX - 0.5) < 0.2 && Math.abs(fracY - 0.5) < 0.2;
}

function updatePacman() {
    const currentCell = getCurrentCell(pacman.gridX, pacman.gridY);
    
    // Check for direction change at cell centers
    if (pacman.nextDirection && nearCellCenter(pacman.gridX, pacman.gridY)) {
        // Check if we can turn in the desired direction
        const nextCell = {
            x: currentCell.x + pacman.nextDirection.x,
            y: currentCell.y + pacman.nextDirection.y
        };
        
        if (canEnterCell(nextCell.x, nextCell.y)) {
            pacman.direction = pacman.nextDirection;
            pacman.nextDirection = null;
            // Snap to center for clean turns
            pacman.gridX = currentCell.x + 0.5;
            pacman.gridY = currentCell.y + 0.5;
        }
    }
    
    // Move in current direction
    if (pacman.direction) {
        // Calculate next position
        const nextX = pacman.gridX + pacman.direction.x * SPEED;
        const nextY = pacman.gridY + pacman.direction.y * SPEED;
        
        // Check what cell we'd be entering
        const nextCell = getCurrentCell(
            nextX + pacman.direction.x * 0.4,
            nextY + pacman.direction.y * 0.4
        );
        
        // Only stop if we'd enter a wall
        if (canEnterCell(nextCell.x, nextCell.y)) {
            pacman.gridX = nextX;
            pacman.gridY = nextY;
            pacman.moving = true;
        } else {
            // Align to cell edge
            if (pacman.direction.x > 0) pacman.gridX = currentCell.x + 0.99;
            else if (pacman.direction.x < 0) pacman.gridX = currentCell.x + 0.01;
            if (pacman.direction.y > 0) pacman.gridY = currentCell.y + 0.99;
            else if (pacman.direction.y < 0) pacman.gridY = currentCell.y + 0.01;
            pacman.moving = false;
        }
    }
    
    // Collect pellets
    const cell = getCurrentCell(pacman.gridX, pacman.gridY);
    for (let i = pellets.length - 1; i >= 0; i--) {
        const pellet = pellets[i];
        if (pellet.x === cell.x && pellet.y === cell.y) {
            pellets.splice(i, 1);
            score += 10;
            document.querySelector('.score').textContent = score;
            
            // Check win
            if (pellets.length === 0) {
                nextLevel();
            }
            break;
        }
    }
}

function updateGhosts() {
    ghosts.forEach(ghost => {
        ghost.turnTimer++;
        
        const currentCell = getCurrentCell(ghost.gridX, ghost.gridY);
        
        // Change direction at cell centers
        if (nearCellCenter(ghost.gridX, ghost.gridY) && ghost.turnTimer > 15) {
            // Get possible directions
            const directions = Object.values(DIRECTIONS);
            const possible = directions.filter(dir => {
                // Don't reverse
                if (ghost.direction && 
                    dir.x === -ghost.direction.x && 
                    dir.y === -ghost.direction.y) {
                    return false;
                }
                
                const nextCell = {
                    x: currentCell.x + dir.x,
                    y: currentCell.y + dir.y
                };
                return canEnterCell(nextCell.x, nextCell.y);
            });
            
            // Change direction randomly or if hitting wall
            if (possible.length > 0) {
                const canContinue = canEnterCell(
                    currentCell.x + ghost.direction.x,
                    currentCell.y + ghost.direction.y
                );
                
                if (!canContinue || Math.random() < 0.3) {
                    ghost.direction = possible[Math.floor(Math.random() * possible.length)];
                    ghost.turnTimer = 0;
                }
            } else {
                // Must reverse
                ghost.direction = {
                    x: -ghost.direction.x,
                    y: -ghost.direction.y
                };
                ghost.turnTimer = 0;
            }
        }
        
        // Move ghost
        if (ghost.direction) {
            const nextX = ghost.gridX + ghost.direction.x * GHOST_SPEED;
            const nextY = ghost.gridY + ghost.direction.y * GHOST_SPEED;
            
            const nextCell = getCurrentCell(
                nextX + ghost.direction.x * 0.4,
                nextY + ghost.direction.y * 0.4
            );
            
            if (canEnterCell(nextCell.x, nextCell.y)) {
                ghost.gridX = nextX;
                ghost.gridY = nextY;
            }
        }
        
        // Check collision with pacman
        const pacmanCell = getCurrentCell(pacman.gridX, pacman.gridY);
        if (currentCell.x === pacmanCell.x && currentCell.y === pacmanCell.y) {
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
    
    // Draw pacman - grid position maps directly to UI!
    ctx.fillStyle = '#ffd700';
    ctx.save();
    ctx.translate(
        pacman.gridX * CELL_SIZE,
        pacman.gridY * CELL_SIZE
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
    
    // Draw ghosts - grid position maps directly to UI!
    ghosts.forEach(ghost => {
        ctx.fillStyle = ghost.color;
        ctx.save();
        ctx.translate(
            ghost.gridX * CELL_SIZE,
            ghost.gridY * CELL_SIZE
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