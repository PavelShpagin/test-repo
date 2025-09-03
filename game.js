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
    gridX: 0,
    gridY: 0,
    x: 0,
    y: 0,
    direction: null,
    nextDirection: null,
    speed: 0.15,
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
                    speed: 0.08,
                    color: GHOST_COLORS[ghosts.length % GHOST_COLORS.length],
                    moveTimer: Math.random() * 30
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

function canMove(x, y, direction) {
    if (!direction) return false;
    
    // Calculate next position
    const nextX = x + direction.x * pacman.speed;
    const nextY = y + direction.y * pacman.speed;
    
    // Check the cell we're moving into
    let checkX, checkY;
    
    if (direction.x > 0) checkX = Math.floor(nextX + 0.4);
    else if (direction.x < 0) checkX = Math.floor(nextX - 0.4 + 1);
    else checkX = Math.floor(nextX);
    
    if (direction.y > 0) checkY = Math.floor(nextY + 0.4);
    else if (direction.y < 0) checkY = Math.floor(nextY - 0.4 + 1);
    else checkY = Math.floor(nextY);
    
    // Bounds check
    if (checkX < 0 || checkX >= COLS || checkY < 0 || checkY >= ROWS) {
        return false;
    }
    
    return grid[checkY][checkX] !== 1;
}

function updatePacman() {
    // Update grid position
    pacman.gridX = Math.round(pacman.x);
    pacman.gridY = Math.round(pacman.y);
    
    // Check for direction change at grid intersections
    if (pacman.nextDirection) {
        const atIntersection = Math.abs(pacman.x - pacman.gridX) < 0.2 && 
                              Math.abs(pacman.y - pacman.gridY) < 0.2;
        
        if (atIntersection) {
            // Test if we can move in the new direction
            const testX = pacman.gridX;
            const testY = pacman.gridY;
            const nextX = testX + pacman.nextDirection.x;
            const nextY = testY + pacman.nextDirection.y;
            
            if (nextX >= 0 && nextX < COLS && nextY >= 0 && nextY < ROWS &&
                grid[nextY][nextX] !== 1) {
                pacman.direction = pacman.nextDirection;
                pacman.nextDirection = null;
                // Snap to grid for smooth turning
                pacman.x = pacman.gridX;
                pacman.y = pacman.gridY;
            }
        }
    }
    
    // Move pacman continuously until hitting a wall
    if (pacman.direction) {
        const nextX = pacman.x + pacman.direction.x * pacman.speed;
        const nextY = pacman.y + pacman.direction.y * pacman.speed;
        
        // Check if next position would hit a wall
        if (canMove(pacman.x, pacman.y, pacman.direction)) {
            pacman.x = nextX;
            pacman.y = nextY;
            pacman.moving = true;
        } else {
            // Align to grid edge when hitting wall
            if (pacman.direction.x > 0) pacman.x = Math.floor(pacman.x + 0.5);
            else if (pacman.direction.x < 0) pacman.x = Math.ceil(pacman.x - 0.5);
            if (pacman.direction.y > 0) pacman.y = Math.floor(pacman.y + 0.5);
            else if (pacman.direction.y < 0) pacman.y = Math.ceil(pacman.y - 0.5);
            pacman.moving = false;
        }
    } else {
        pacman.moving = false;
    }
    
    // Collect pellets
    for (let i = pellets.length - 1; i >= 0; i--) {
        const pellet = pellets[i];
        if (Math.abs(pacman.x - pellet.x) < 0.5 && 
            Math.abs(pacman.y - pellet.y) < 0.5) {
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
        ghost.moveTimer++;
        
        // Update grid position
        ghost.gridX = Math.round(ghost.x);
        ghost.gridY = Math.round(ghost.y);
        
        // Change direction at grid centers
        const atCenter = Math.abs(ghost.x - ghost.gridX) < 0.1 && 
                        Math.abs(ghost.y - ghost.gridY) < 0.1;
        
        if (atCenter && ghost.moveTimer > 10) {
            ghost.moveTimer = 0;
            
            // Get possible directions
            const directions = Object.values(DIRECTIONS);
            const possible = directions.filter(dir => {
                // Don't reverse
                if (ghost.direction && 
                    dir.x === -ghost.direction.x && 
                    dir.y === -ghost.direction.y) {
                    return false;
                }
                // Check if can move in this direction
                const nextX = ghost.gridX + dir.x;
                const nextY = ghost.gridY + dir.y;
                return nextX >= 0 && nextX < COLS && 
                       nextY >= 0 && nextY < ROWS && 
                       grid[nextY][nextX] !== 1;
            });
            
            // Choose random direction
            if (possible.length > 0) {
                ghost.direction = possible[Math.floor(Math.random() * possible.length)];
            } else if (ghost.direction) {
                // Reverse if stuck
                ghost.direction = {
                    x: -ghost.direction.x,
                    y: -ghost.direction.y
                };
            }
        }
        
        // Move ghost
        if (ghost.direction) {
            ghost.x += ghost.direction.x * ghost.speed;
            ghost.y += ghost.direction.y * ghost.speed;
        }
        
        // Check collision with pacman
        if (Math.abs(ghost.gridX - pacman.gridX) <= 0 && 
            Math.abs(ghost.gridY - pacman.gridY) <= 0 &&
            Math.abs(ghost.x - pacman.x) < 0.8 && 
            Math.abs(ghost.y - pacman.y) < 0.8) {
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
        ghost.speed = Math.min(ghost.speed * 1.1, 0.15);
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