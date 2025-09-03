// Game constants
const CELL_SIZE = 20;
const PACMAN_SPEED = 2;
const GHOST_SPEED = 1.5;
const FPS = 60;

// Game state
let canvas, ctx;
let score = 0;
let highScore = localStorage.getItem('pacmanHighScore') || 0;
let lives = 3;
let level = 1;
let gameRunning = false;
let animationId;

// Directions
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Classic maze layout (0 = corridor with pellet, 1 = wall, 2 = pacman start, 3+ = ghost starts, 9 = empty corridor)
const MAZE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,1,1,1,9,9,1,1,1,0,1,1,0,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,1,3,9,9,9,9,4,1,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,0,1,1,0,1,5,9,9,9,9,6,1,0,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,1,1,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,1,1,0,0,0,1],
    [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Game entities
let pacman = {
    x: 0,
    y: 0,
    direction: DIRECTIONS.RIGHT,
    nextDirection: null,
    animationFrame: 0,
    mouthOpen: true
};

let ghosts = [];
let pellets = [];
let maze = [];

// Initialize the game
function init() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    canvas.width = MAZE[0].length * CELL_SIZE;
    canvas.height = MAZE.length * CELL_SIZE;
    
    // Deep copy maze
    maze = MAZE.map(row => [...row]);
    
    // Initialize game entities
    initializeEntities();
    
    // Update UI
    updateUI();
    
    // Set up keyboard controls
    setupControls();
    
    // Draw initial frame to prevent flicker
    draw();
}

function initializeEntities() {
    pellets = [];
    ghosts = [];
    
    // Find starting positions and create pellets
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            const cell = maze[y][x];
            
            if (cell === 0) {
                pellets.push({ x: x * CELL_SIZE + CELL_SIZE / 2, y: y * CELL_SIZE + CELL_SIZE / 2 });
            } else if (cell === 2) {
                pacman.x = x * CELL_SIZE + CELL_SIZE / 2;
                pacman.y = y * CELL_SIZE + CELL_SIZE / 2;
                maze[y][x] = 9; // Clear the cell
            } else if (cell >= 3 && cell <= 6) {
                const directions = Object.values(DIRECTIONS);
                ghosts.push({
                    x: x * CELL_SIZE + CELL_SIZE / 2,
                    y: y * CELL_SIZE + CELL_SIZE / 2,
                    color: getGhostColor(cell - 3),
                    direction: directions[Math.floor(Math.random() * directions.length)], // Random initial direction
                    previousDirection: null,
                    moveCounter: Math.floor(Math.random() * 30) // Randomize initial move timing
                });
                maze[y][x] = 9; // Clear the cell
            }
        }
    }
}

function getGhostColor(index) {
    const colors = ['#ff0000', '#ffb8ff', '#00ffff', '#ffb851'];
    return colors[index] || '#ffffff';
}

function setupControls() {
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
        e.preventDefault();
    });
}

function canMove(x, y, direction, speed = PACMAN_SPEED) {
    const nextX = x + direction.x * speed;
    const nextY = y + direction.y * speed;
    
    // Check corners of the entity
    const halfSize = CELL_SIZE / 2 - 2;
    const corners = [
        { x: nextX - halfSize, y: nextY - halfSize },
        { x: nextX + halfSize, y: nextY - halfSize },
        { x: nextX - halfSize, y: nextY + halfSize },
        { x: nextX + halfSize, y: nextY + halfSize }
    ];
    
    for (let corner of corners) {
        const gridX = Math.floor(corner.x / CELL_SIZE);
        const gridY = Math.floor(corner.y / CELL_SIZE);
        
        if (gridX < 0 || gridX >= maze[0].length || gridY < 0 || gridY >= maze.length) {
            return false;
        }
        
        if (maze[gridY][gridX] === 1) {
            return false;
        }
    }
    
    return true;
}

function updatePacman() {
    // Try to change direction if requested
    if (pacman.nextDirection && canMove(pacman.x, pacman.y, pacman.nextDirection)) {
        pacman.direction = pacman.nextDirection;
        pacman.nextDirection = null;
    }
    
    // Move in current direction
    if (canMove(pacman.x, pacman.y, pacman.direction)) {
        pacman.x += pacman.direction.x * PACMAN_SPEED;
        pacman.y += pacman.direction.y * PACMAN_SPEED;
    }
    
    // Animate mouth
    pacman.animationFrame++;
    if (pacman.animationFrame % 8 === 0) {
        pacman.mouthOpen = !pacman.mouthOpen;
    }
    
    // Check pellet collection
    for (let i = pellets.length - 1; i >= 0; i--) {
        const pellet = pellets[i];
        const distance = Math.sqrt(Math.pow(pacman.x - pellet.x, 2) + Math.pow(pacman.y - pellet.y, 2));
        
        if (distance < CELL_SIZE / 2) {
            pellets.splice(i, 1);
            score += 10;
            updateUI();
            
            // Check win condition
            if (pellets.length === 0) {
                nextLevel();
            }
        }
    }
}

function updateGhosts() {
    for (let ghost of ghosts) {
        ghost.moveCounter++;
        
        // Change direction randomly at intervals
        // Use different intervals for each ghost to make movement more varied
        const changeInterval = 25 + (ghosts.indexOf(ghost) * 5); // Each ghost has slightly different timing
        if (ghost.moveCounter % changeInterval === 0) {
            const possibleDirections = Object.values(DIRECTIONS);
            
            // Avoid immediate reversals for more natural movement
            if (ghost.previousDirection) {
                const filtered = possibleDirections.filter(dir => 
                    !(dir.x === -ghost.previousDirection.x && dir.y === -ghost.previousDirection.y)
                );
                if (filtered.length > 0) {
                    ghost.previousDirection = ghost.direction;
                    ghost.direction = filtered[Math.floor(Math.random() * filtered.length)];
                } else {
                    // If only reversal is available, use it
                    ghost.previousDirection = ghost.direction;
                    ghost.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
                }
            } else {
                ghost.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
            }
        }
        
        // Move ghost (no wall collision - ghosts pass through walls)
        ghost.x += ghost.direction.x * GHOST_SPEED;
        ghost.y += ghost.direction.y * GHOST_SPEED;
        
        // Wrap around screen edges
        if (ghost.x < 0) ghost.x = canvas.width;
        if (ghost.x > canvas.width) ghost.x = 0;
        if (ghost.y < 0) ghost.y = canvas.height;
        if (ghost.y > canvas.height) ghost.y = 0;
        
        // Check collision with Pacman
        const distance = Math.sqrt(Math.pow(pacman.x - ghost.x, 2) + Math.pow(pacman.y - ghost.y, 2));
        if (distance < CELL_SIZE - 4) {
            loseLife();
        }
    }
}

function loseLife() {
    lives--;
    updateUI();
    
    if (lives <= 0) {
        gameOver();
    } else {
        // Reset positions
        initializeEntities();
    }
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('pacmanHighScore', highScore);
    }
    
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over').classList.remove('hidden');
}

function nextLevel() {
    level++;
    GHOST_SPEED = Math.min(GHOST_SPEED + 0.2, 3);
    initializeEntities();
    updateUI();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw maze
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[y].length; x++) {
            if (maze[y][x] === 1) {
                ctx.fillStyle = '#0033cc';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                
                // Add some detail to walls
                ctx.strokeStyle = '#0055ff';
                ctx.lineWidth = 1;
                ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
    
    // Draw pellets
    ctx.fillStyle = '#ffeb3b';
    for (let pellet of pellets) {
        ctx.beginPath();
        ctx.arc(pellet.x, pellet.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw Pacman
    ctx.fillStyle = '#ffeb3b';
    ctx.beginPath();
    
    const mouthAngle = pacman.mouthOpen ? 0.25 : 0.1;
    let startAngle, endAngle;
    
    if (pacman.direction === DIRECTIONS.RIGHT) {
        startAngle = mouthAngle * Math.PI;
        endAngle = (2 - mouthAngle) * Math.PI;
    } else if (pacman.direction === DIRECTIONS.LEFT) {
        startAngle = (1 + mouthAngle) * Math.PI;
        endAngle = (1 - mouthAngle) * Math.PI;
    } else if (pacman.direction === DIRECTIONS.UP) {
        startAngle = (1.5 + mouthAngle) * Math.PI;
        endAngle = (1.5 - mouthAngle) * Math.PI;
    } else {
        startAngle = (0.5 + mouthAngle) * Math.PI;
        endAngle = (0.5 - mouthAngle) * Math.PI;
    }
    
    ctx.arc(pacman.x, pacman.y, CELL_SIZE / 2 - 2, startAngle, endAngle);
    ctx.lineTo(pacman.x, pacman.y);
    ctx.closePath();
    ctx.fill();
    
    // Draw ghosts with slight transparency for better overlap visibility
    for (let ghost of ghosts) {
        ctx.save();
        ctx.globalAlpha = 0.9; // Slight transparency so overlapping ghosts are visible
        ctx.fillStyle = ghost.color;
        
        // Ghost body
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y - 2, CELL_SIZE / 2 - 2, Math.PI, 0, false);
        ctx.lineTo(ghost.x + CELL_SIZE / 2 - 2, ghost.y + CELL_SIZE / 2 - 4);
        
        // Wavy bottom
        for (let i = 0; i < 3; i++) {
            ctx.arc(
                ghost.x + CELL_SIZE / 2 - 6 - i * 4,
                ghost.y + CELL_SIZE / 2 - 4,
                2,
                0,
                Math.PI,
                false
            );
        }
        
        ctx.lineTo(ghost.x - CELL_SIZE / 2 + 2, ghost.y - 2);
        ctx.closePath();
        ctx.fill();
        
        // Ghost eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ghost.x - 4, ghost.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(ghost.x + 4, ghost.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(ghost.x - 3, ghost.y - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(ghost.x + 5, ghost.y - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore(); // Restore the global alpha
    }
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('high-score').textContent = highScore;
    document.getElementById('level').textContent = level;
    
    // Update lives display
    const livesDisplay = document.getElementById('lives-display');
    livesDisplay.innerHTML = '';
    for (let i = 0; i < lives; i++) {
        const lifeIcon = document.createElement('div');
        lifeIcon.className = 'life-icon';
        livesDisplay.appendChild(lifeIcon);
    }
}

function gameLoop() {
    if (!gameRunning) return;
    
    updatePacman();
    updateGhosts();
    draw();
    
    animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameRunning = true;
    gameLoop();
}

function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    GHOST_SPEED = 1.5;
    
    document.getElementById('game-over').classList.add('hidden');
    
    init();
    gameRunning = true;
    gameLoop();
}

// Initialize game when page loads
window.addEventListener('load', init);