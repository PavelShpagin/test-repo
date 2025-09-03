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
    x: 0,          // Actual position (for smooth movement)
    y: 0,          // Actual position (for smooth movement)
    direction: null,
    nextDirection: null,
    speed: 0.08,   // Constant speed
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
                    x: x,
                    y: y,
                    direction: DIRECTIONS.UP,
                    speed: 0.06,
                    color: GHOST_COLORS[ghosts.length % GHOST_COLORS.length],
                    changeTimer: 0
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
    // Update current grid position
    const oldGridX = pacman.gridX;
    const oldGridY = pacman.gridY;
    pacman.gridX = Math.round(pacman.x);
    pacman.gridY = Math.round(pacman.y);
    
    // Check for direction change when near grid center
    if (pacman.nextDirection) {
        const nearCenterX = Math.abs(pacman.x - pacman.gridX) < 0.3;
        const nearCenterY = Math.abs(pacman.y - pacman.gridY) < 0.3;
        
        // Can only turn at grid intersections
        if (nearCenterX && nearCenterY) {
            if (canMoveTo(pacman.gridX, pacman.gridY, pacman.nextDirection)) {
                pacman.direction = pacman.nextDirection;
                pacman.nextDirection = null;
                // Snap to grid for clean turns
                pacman.x = pacman.gridX;
                pacman.y = pacman.gridY;
            }
        }
    }
    
    // Continuous movement
    if (pacman.direction) {
        const nextX = pacman.x + pacman.direction.x * pacman.speed;
        const nextY = pacman.y + pacman.direction.y * pacman.speed;
        
        // Check if the next position would enter a wall
        const nextGridX = Math.round(nextX);
        const nextGridY = Math.round(nextY);
        
        // Only block if we're moving into a new cell that's a wall
        let canContinue = true;
        if (nextGridX !== pacman.gridX || nextGridY !== pacman.gridY) {
            // About to enter a new cell
            if (grid[nextGridY] && grid[nextGridY][nextGridX] === 1) {
                canContinue = false;
            }
        }
        
        if (canContinue) {
            pacman.x = nextX;
            pacman.y = nextY;
            pacman.moving = true;
        } else {
            // Align to grid edge when hitting wall
            pacman.x = pacman.gridX;
            pacman.y = pacman.gridY;
            pacman.moving = false;
        }
    }
    
    // Collect pellets when entering new cell
    if (pacman.gridX !== oldGridX || pacman.gridY !== oldGridY) {
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
                break;
            }
        }
    }
}

function updateGhosts() {
    ghosts.forEach(ghost => {
        // Update grid position
        ghost.gridX = Math.round(ghost.x);
        ghost.gridY = Math.round(ghost.y);
        
        // Check if at grid center for direction change
        const nearCenterX = Math.abs(ghost.x - ghost.gridX) < 0.1;
        const nearCenterY = Math.abs(ghost.y - ghost.gridY) < 0.1;
        
        ghost.changeTimer++;
        
        // Change direction at intersections
        if (nearCenterX && nearCenterY && ghost.changeTimer > 20) {
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
            
            // Change direction randomly or if can't continue
            if (possible.length > 0) {
                if (Math.random() < 0.3 || !canMoveTo(ghost.gridX, ghost.gridY, ghost.direction)) {
                    ghost.direction = possible[Math.floor(Math.random() * possible.length)];
                    ghost.changeTimer = 0;
                }
            } else if (!canMoveTo(ghost.gridX, ghost.gridY, ghost.direction)) {
                // Must reverse
                ghost.direction = {
                    x: -ghost.direction.x,
                    y: -ghost.direction.y
                };
                ghost.changeTimer = 0;
            }
        }
        
        // Continuous movement
        if (ghost.direction) {
            const nextX = ghost.x + ghost.direction.x * ghost.speed;
            const nextY = ghost.y + ghost.direction.y * ghost.speed;
            
            // Check if next position would enter a wall
            const nextGridX = Math.round(nextX);
            const nextGridY = Math.round(nextY);
            
            let canContinue = true;
            if (nextGridX !== ghost.gridX || nextGridY !== ghost.gridY) {
                if (grid[nextGridY] && grid[nextGridY][nextGridX] === 1) {
                    canContinue = false;
                }
            }
            
            if (canContinue) {
                ghost.x = nextX;
                ghost.y = nextY;
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
    // Increase speed slightly for next level
    pacman.speed = Math.min(pacman.speed * 1.05, 0.12);
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