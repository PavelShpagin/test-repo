// Game Constants
const CELL_SIZE = 16;
const MAZE_WIDTH = 28;
const MAZE_HEIGHT = 31;
const PACMAN_SPEED = 2;
const GHOST_SPEED = 1.5;
const DOT_SCORE = 10;
const POWER_PELLET_SCORE = 50;
const GHOST_SCORE = [200, 400, 800, 1600];
const POWER_DURATION = 8000; // 8 seconds
const FRUIT_SCORE = [100, 300, 500, 700, 1000, 2000, 3000, 5000];

// Game State
let canvas, ctx;
let gameState = 'menu'; // menu, playing, paused, gameover, win
let score = 0;
let highScore = localStorage.getItem('pacmanHighScore') || 0;
let lives = 3;
let level = 1;
let dotsEaten = 0;
let totalDots = 0;
let powerMode = false;
let powerTimer = 0;
let ghostsEaten = 0;
let soundEnabled = true;
let animationFrame = 0;
let lastTime = 0;

// Directions
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Classic Pacman Maze Layout (0=wall, 1=dot, 2=empty, 3=power pellet, 4=ghost house)
const MAZE = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,3,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,3,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
    [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,2,0,0,2,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,2,0,0,2,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,2,2,2,2,2,2,2,2,2,2,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,2,0,0,0,4,4,0,0,0,2,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,2,0,4,4,4,4,4,4,0,2,0,0,1,0,0,0,0,0,0],
    [2,2,2,2,2,2,1,2,2,2,0,4,4,4,4,4,4,0,2,2,2,1,2,2,2,2,2,2],
    [0,0,0,0,0,0,1,0,0,2,0,4,4,4,4,4,4,0,2,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,2,0,0,0,0,0,0,0,0,2,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,2,2,2,2,2,2,2,2,2,2,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,2,0,0,0,0,0,0,0,0,2,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,0,0,2,0,0,0,0,0,0,0,0,2,0,0,1,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,3,1,1,0,0,1,1,1,1,1,1,1,2,2,1,1,1,1,1,1,1,0,0,1,1,3,0],
    [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
    [0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0],
    [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

// Create a working copy of the maze
let maze = [];

// Pacman
const pacman = {
    x: 14,
    y: 23,
    direction: DIRECTIONS.LEFT,
    nextDirection: null,
    animationCounter: 0,
    mouthOpen: true
};

// Ghost class
class Ghost {
    constructor(name, x, y, color, scatterTarget) {
        this.name = name;
        this.startX = x;
        this.startY = y;
        this.x = x;
        this.y = y;
        this.color = color;
        this.direction = DIRECTIONS.UP;
        this.mode = 'scatter'; // scatter, chase, frightened, eaten
        this.scatterTarget = scatterTarget;
        this.dotCounter = 0;
        this.inHouse = true;
        this.exitingHouse = false;
        this.animationCounter = 0;
    }

    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.direction = DIRECTIONS.UP;
        this.mode = 'scatter';
        this.inHouse = true;
        this.exitingHouse = false;
        this.dotCounter = 0;
    }

    update() {
        // Exit ghost house logic
        if (this.inHouse && !this.exitingHouse) {
            if (this.shouldExitHouse()) {
                this.exitingHouse = true;
            }
        }

        if (this.exitingHouse) {
            this.exitHouse();
            return;
        }

        if (this.mode === 'eaten') {
            this.returnToHouse();
            return;
        }

        // Move ghost
        this.move();
        this.animationCounter++;
    }

    shouldExitHouse() {
        // Different ghosts exit at different times
        switch(this.name) {
            case 'blinky': return true; // Always exits immediately
            case 'pinky': return dotsEaten >= 30;
            case 'inky': return dotsEaten >= 60;
            case 'clyde': return dotsEaten >= 90;
            default: return false;
        }
    }

    exitHouse() {
        // Move to center then up
        const centerX = 14;
        const exitY = 11;

        if (Math.abs(this.x - centerX) > 0.1) {
            this.x += (centerX - this.x) * 0.1;
        } else if (this.y > exitY) {
            this.y -= 0.1;
        } else {
            this.inHouse = false;
            this.exitingHouse = false;
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
        }
    }

    returnToHouse() {
        // Fast return to house when eaten
        const centerX = 14;
        const houseY = 14;

        const dx = centerX - this.x;
        const dy = houseY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0.5) {
            this.x += (dx / distance) * 0.3;
            this.y += (dy / distance) * 0.3;
        } else {
            this.x = this.startX;
            this.y = this.startY;
            this.mode = 'scatter';
            this.inHouse = true;
            this.exitingHouse = false;
        }
    }

    move() {
        if (this.inHouse) return;

        const speed = this.mode === 'frightened' ? GHOST_SPEED * 0.5 : GHOST_SPEED;
        const nextX = Math.round(this.x + this.direction.x);
        const nextY = Math.round(this.y + this.direction.y);

        // Check if we can continue in current direction
        if (this.canMoveTo(nextX, nextY)) {
            this.x += this.direction.x * speed / 10;
            this.y += this.direction.y * speed / 10;

            // Wrap around tunnel
            if (this.x < 0) this.x = MAZE_WIDTH - 1;
            if (this.x >= MAZE_WIDTH) this.x = 0;
        } else {
            // Need to change direction
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            this.chooseDirection();
        }

        // Check for intersection and possibly change direction
        if (Math.abs(this.x - Math.round(this.x)) < 0.1 && 
            Math.abs(this.y - Math.round(this.y)) < 0.1) {
            if (this.isAtIntersection()) {
                this.chooseDirection();
            }
        }
    }

    canMoveTo(x, y) {
        if (x < 0 || x >= MAZE_WIDTH) return true; // Tunnel
        if (y < 0 || y >= MAZE_HEIGHT) return false;
        return maze[y][x] !== 0;
    }

    isAtIntersection() {
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        let paths = 0;
        
        if (this.canMoveTo(x + 1, y)) paths++;
        if (this.canMoveTo(x - 1, y)) paths++;
        if (this.canMoveTo(x, y + 1)) paths++;
        if (this.canMoveTo(x, y - 1)) paths++;
        
        return paths > 2;
    }

    chooseDirection() {
        const x = Math.round(this.x);
        const y = Math.round(this.y);
        const possibleDirections = [];

        // Check all four directions
        for (let dir in DIRECTIONS) {
            const d = DIRECTIONS[dir];
            const newX = x + d.x;
            const newY = y + d.y;

            // Don't reverse direction
            if (d.x === -this.direction.x && d.y === -this.direction.y) continue;

            if (this.canMoveTo(newX, newY)) {
                possibleDirections.push(d);
            }
        }

        if (possibleDirections.length === 0) {
            // Dead end, reverse
            this.direction = {
                x: -this.direction.x,
                y: -this.direction.y
            };
            return;
        }

        // Choose direction based on mode
        if (this.mode === 'frightened') {
            // Random direction when frightened
            this.direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
        } else {
            // Choose direction that gets closest to target
            const target = this.getTarget();
            let bestDirection = possibleDirections[0];
            let bestDistance = Infinity;

            for (let dir of possibleDirections) {
                const newX = x + dir.x;
                const newY = y + dir.y;
                const distance = Math.sqrt(
                    Math.pow(newX - target.x, 2) + 
                    Math.pow(newY - target.y, 2)
                );

                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestDirection = dir;
                }
            }

            this.direction = bestDirection;
        }
    }

    getTarget() {
        if (this.mode === 'scatter') {
            return this.scatterTarget;
        } else if (this.mode === 'chase') {
            // Each ghost has different chase behavior
            switch(this.name) {
                case 'blinky': // Red - targets Pacman directly
                    return { x: pacman.x, y: pacman.y };
                case 'pinky': // Pink - targets 4 tiles ahead of Pacman
                    return {
                        x: pacman.x + pacman.direction.x * 4,
                        y: pacman.y + pacman.direction.y * 4
                    };
                case 'inky': // Cyan - complex targeting
                    const ahead = {
                        x: pacman.x + pacman.direction.x * 2,
                        y: pacman.y + pacman.direction.y * 2
                    };
                    return {
                        x: ahead.x * 2 - ghosts[0].x,
                        y: ahead.y * 2 - ghosts[0].y
                    };
                case 'clyde': // Orange - targets Pacman when far, scatter when close
                    const distance = Math.sqrt(
                        Math.pow(this.x - pacman.x, 2) + 
                        Math.pow(this.y - pacman.y, 2)
                    );
                    if (distance > 8) {
                        return { x: pacman.x, y: pacman.y };
                    } else {
                        return this.scatterTarget;
                    }
                default:
                    return { x: pacman.x, y: pacman.y };
            }
        }
        return { x: pacman.x, y: pacman.y };
    }
}

// Create ghosts
const ghosts = [
    new Ghost('blinky', 14, 11, '#ff0000', { x: 25, y: 0 }),  // Red
    new Ghost('pinky', 14, 14, '#ffb8ff', { x: 2, y: 0 }),    // Pink
    new Ghost('inky', 12, 14, '#00ffff', { x: 27, y: 30 }),   // Cyan
    new Ghost('clyde', 16, 14, '#ffb851', { x: 0, y: 30 })    // Orange
];

// Sound Manager
const soundManager = {
    sounds: {},
    
    init() {
        // Create simple sound effects using Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.createSounds();
    },

    createSounds() {
        // We'll use oscillators for retro sound effects
        this.sounds = {
            chomp: () => this.playTone(440, 0.1, 'square'),
            powerPellet: () => this.playTone(880, 0.3, 'sine'),
            eatGhost: () => this.playTone(1760, 0.5, 'sawtooth'),
            death: () => this.playDescendingTone(),
            start: () => this.playAscendingTone()
        };
    },

    playTone(frequency, duration, type = 'square') {
        if (!soundEnabled) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Sound error:', e);
        }
    },

    playDescendingTone() {
        if (!soundEnabled) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 1);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 1);
        } catch (e) {
            console.log('Sound error:', e);
        }
    },

    playAscendingTone() {
        if (!soundEnabled) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.5);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Sound error:', e);
        }
    },

    play(sound) {
        if (this.sounds[sound]) {
            this.sounds[sound]();
        }
    }
};

// Initialize game
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = MAZE_WIDTH * CELL_SIZE;
    canvas.height = MAZE_HEIGHT * CELL_SIZE;
    
    // Initialize sound
    soundManager.init();
    
    // Initialize maze
    resetMaze();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update UI
    updateUI();
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

function resetMaze() {
    // Deep copy the maze
    maze = MAZE.map(row => [...row]);
    
    // Count total dots
    totalDots = 0;
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            if (maze[y][x] === 1 || maze[y][x] === 3) {
                totalDots++;
            }
        }
    }
    dotsEaten = 0;
}

function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => {
        if (gameState !== 'playing') return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                pacman.nextDirection = DIRECTIONS.UP;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                pacman.nextDirection = DIRECTIONS.DOWN;
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                pacman.nextDirection = DIRECTIONS.LEFT;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                pacman.nextDirection = DIRECTIONS.RIGHT;
                break;
        }
    });

    // Touch/Button controls
    document.getElementById('upBtn').addEventListener('click', () => {
        if (gameState === 'playing') pacman.nextDirection = DIRECTIONS.UP;
    });
    document.getElementById('downBtn').addEventListener('click', () => {
        if (gameState === 'playing') pacman.nextDirection = DIRECTIONS.DOWN;
    });
    document.getElementById('leftBtn').addEventListener('click', () => {
        if (gameState === 'playing') pacman.nextDirection = DIRECTIONS.LEFT;
    });
    document.getElementById('rightBtn').addEventListener('click', () => {
        if (gameState === 'playing') pacman.nextDirection = DIRECTIONS.RIGHT;
    });

    // Touch events for mobile
    ['touchstart', 'mousedown'].forEach(eventType => {
        document.getElementById('upBtn').addEventListener(eventType, (e) => {
            e.preventDefault();
            if (gameState === 'playing') pacman.nextDirection = DIRECTIONS.UP;
        });
        document.getElementById('downBtn').addEventListener(eventType, (e) => {
            e.preventDefault();
            if (gameState === 'playing') pacman.nextDirection = DIRECTIONS.DOWN;
        });
        document.getElementById('leftBtn').addEventListener(eventType, (e) => {
            e.preventDefault();
            if (gameState === 'playing') pacman.nextDirection = DIRECTIONS.LEFT;
        });
        document.getElementById('rightBtn').addEventListener(eventType, (e) => {
            e.preventDefault();
            if (gameState === 'playing') pacman.nextDirection = DIRECTIONS.RIGHT;
        });
    });

    // Game controls
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('soundBtn').addEventListener('click', toggleSound);
}

function startGame() {
    // Reset game state
    score = 0;
    lives = 3;
    level = 1;
    dotsEaten = 0;
    powerMode = false;
    powerTimer = 0;
    ghostsEaten = 0;
    
    // Reset maze
    resetMaze();
    
    // Reset Pacman
    pacman.x = 14;
    pacman.y = 23;
    pacman.direction = DIRECTIONS.LEFT;
    pacman.nextDirection = null;
    
    // Reset ghosts
    ghosts.forEach(ghost => ghost.reset());
    
    // Update ghost mode periodically
    setGhostMode();
    
    // Hide overlay and start game
    document.getElementById('gameOverlay').classList.add('hidden');
    gameState = 'playing';
    
    // Play start sound
    soundManager.play('start');
    
    // Update UI
    updateUI();
}

function setGhostMode() {
    // Classic ghost mode pattern: scatter -> chase -> scatter -> chase...
    if (gameState !== 'playing') return;
    
    setTimeout(() => {
        if (gameState === 'playing' && !powerMode) {
            ghosts.forEach(ghost => {
                if (ghost.mode !== 'eaten' && !ghost.inHouse) {
                    ghost.mode = 'chase';
                }
            });
        }
        setTimeout(() => {
            if (gameState === 'playing' && !powerMode) {
                ghosts.forEach(ghost => {
                    if (ghost.mode !== 'eaten' && !ghost.inHouse) {
                        ghost.mode = 'scatter';
                    }
                });
            }
            setGhostMode(); // Repeat pattern
        }, 20000); // Chase for 20 seconds
    }, 7000); // Scatter for 7 seconds
}

function togglePause() {
    if (gameState === 'playing') {
        gameState = 'paused';
        document.getElementById('pauseBtn').textContent = 'RESUME';
        document.getElementById('pauseBtn').classList.add('active');
    } else if (gameState === 'paused') {
        gameState = 'playing';
        document.getElementById('pauseBtn').textContent = 'PAUSE';
        document.getElementById('pauseBtn').classList.remove('active');
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('soundBtn').textContent = `SOUND: ${soundEnabled ? 'ON' : 'OFF'}`;
    document.getElementById('soundBtn').classList.toggle('active', soundEnabled);
}

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    if (gameState === 'playing') {
        update(deltaTime);
    }
    
    render();
    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    animationFrame++;
    
    // Update Pacman
    updatePacman();
    
    // Update ghosts
    ghosts.forEach(ghost => ghost.update());
    
    // Check collisions
    checkCollisions();
    
    // Update power mode
    if (powerMode) {
        powerTimer -= deltaTime;
        if (powerTimer <= 0) {
            endPowerMode();
        }
    }
    
    // Check win condition
    if (dotsEaten >= totalDots) {
        nextLevel();
    }
}

function updatePacman() {
    // Try to change direction if requested
    if (pacman.nextDirection) {
        const nextX = Math.round(pacman.x) + pacman.nextDirection.x;
        const nextY = Math.round(pacman.y) + pacman.nextDirection.y;
        
        if (canMoveTo(nextX, nextY)) {
            pacman.direction = pacman.nextDirection;
            pacman.nextDirection = null;
        }
    }
    
    // Move Pacman
    const nextX = pacman.x + pacman.direction.x * PACMAN_SPEED / 10;
    const nextY = pacman.y + pacman.direction.y * PACMAN_SPEED / 10;
    
    if (canMoveTo(Math.round(nextX), Math.round(nextY))) {
        pacman.x = nextX;
        pacman.y = nextY;
        
        // Wrap around tunnel
        if (pacman.x < 0) pacman.x = MAZE_WIDTH - 1;
        if (pacman.x >= MAZE_WIDTH) pacman.x = 0;
        
        // Animate mouth
        pacman.animationCounter++;
        if (pacman.animationCounter % 5 === 0) {
            pacman.mouthOpen = !pacman.mouthOpen;
        }
    }
    
    // Eat dots
    const gridX = Math.round(pacman.x);
    const gridY = Math.round(pacman.y);
    
    if (Math.abs(pacman.x - gridX) < 0.3 && Math.abs(pacman.y - gridY) < 0.3) {
        if (maze[gridY][gridX] === 1) {
            // Regular dot
            maze[gridY][gridX] = 2;
            score += DOT_SCORE;
            dotsEaten++;
            soundManager.play('chomp');
        } else if (maze[gridY][gridX] === 3) {
            // Power pellet
            maze[gridY][gridX] = 2;
            score += POWER_PELLET_SCORE;
            dotsEaten++;
            startPowerMode();
        }
    }
    
    updateUI();
}

function canMoveTo(x, y) {
    if (x < 0 || x >= MAZE_WIDTH) return true; // Tunnel
    if (y < 0 || y >= MAZE_HEIGHT) return false;
    return maze[y][x] !== 0;
}

function startPowerMode() {
    powerMode = true;
    powerTimer = POWER_DURATION;
    ghostsEaten = 0;
    
    // Make all ghosts frightened
    ghosts.forEach(ghost => {
        if (ghost.mode !== 'eaten' && !ghost.inHouse) {
            ghost.mode = 'frightened';
            // Reverse direction
            ghost.direction = {
                x: -ghost.direction.x,
                y: -ghost.direction.y
            };
        }
    });
    
    soundManager.play('powerPellet');
}

function endPowerMode() {
    powerMode = false;
    powerTimer = 0;
    
    // Return ghosts to normal mode
    ghosts.forEach(ghost => {
        if (ghost.mode === 'frightened') {
            ghost.mode = 'chase';
        }
    });
}

function checkCollisions() {
    ghosts.forEach(ghost => {
        const distance = Math.sqrt(
            Math.pow(pacman.x - ghost.x, 2) + 
            Math.pow(pacman.y - ghost.y, 2)
        );
        
        if (distance < 0.8) {
            if (ghost.mode === 'frightened') {
                // Eat ghost
                ghost.mode = 'eaten';
                score += GHOST_SCORE[Math.min(ghostsEaten, 3)];
                ghostsEaten++;
                soundManager.play('eatGhost');
            } else if (ghost.mode !== 'eaten') {
                // Pacman dies
                loseLife();
            }
        }
    });
}

function loseLife() {
    lives--;
    soundManager.play('death');
    
    if (lives <= 0) {
        gameOver();
    } else {
        // Reset positions
        pacman.x = 14;
        pacman.y = 23;
        pacman.direction = DIRECTIONS.LEFT;
        pacman.nextDirection = null;
        
        ghosts.forEach(ghost => {
            ghost.x = ghost.startX;
            ghost.y = ghost.startY;
            ghost.direction = DIRECTIONS.UP;
            if (!ghost.inHouse) {
                ghost.mode = 'scatter';
            }
        });
        
        // Brief pause
        gameState = 'paused';
        setTimeout(() => {
            if (lives > 0) gameState = 'playing';
        }, 1000);
    }
    
    updateUI();
}

function gameOver() {
    gameState = 'gameover';
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('pacmanHighScore', highScore);
    }
    
    // Show game over screen
    document.getElementById('overlayTitle').textContent = 'GAME OVER';
    document.getElementById('overlayMessage').textContent = `Final Score: ${score}`;
    document.getElementById('startButton').textContent = 'PLAY AGAIN';
    document.getElementById('gameOverlay').classList.remove('hidden');
    
    updateUI();
}

function nextLevel() {
    level++;
    
    // Brief pause and reset
    gameState = 'paused';
    
    setTimeout(() => {
        // Reset maze
        resetMaze();
        
        // Reset positions
        pacman.x = 14;
        pacman.y = 23;
        pacman.direction = DIRECTIONS.LEFT;
        pacman.nextDirection = null;
        
        ghosts.forEach(ghost => ghost.reset());
        
        // Resume game
        gameState = 'playing';
        setGhostMode();
    }, 2000);
    
    // Show level complete message
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE!', canvas.width / 2, canvas.height / 2);
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('lives').textContent = lives;
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw maze
    for (let y = 0; y < MAZE_HEIGHT; y++) {
        for (let x = 0; x < MAZE_WIDTH; x++) {
            const cell = maze[y][x];
            const px = x * CELL_SIZE;
            const py = y * CELL_SIZE;
            
            if (cell === 0) {
                // Wall
                ctx.fillStyle = '#2121de';
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                
                // Add wall borders for better visibility
                ctx.strokeStyle = '#4040ff';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
            } else if (cell === 1) {
                // Dot
                ctx.fillStyle = '#ffb897';
                ctx.beginPath();
                ctx.arc(px + CELL_SIZE/2, py + CELL_SIZE/2, 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (cell === 3) {
                // Power pellet
                ctx.fillStyle = '#ffb897';
                ctx.beginPath();
                ctx.arc(px + CELL_SIZE/2, py + CELL_SIZE/2, 5, 0, Math.PI * 2);
                ctx.fill();
                
                // Pulsing effect
                if (animationFrame % 20 < 10) {
                    ctx.strokeStyle = '#ffb897';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            } else if (cell === 4) {
                // Ghost house
                ctx.strokeStyle = '#ff69b4';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 2]);
                ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
                ctx.setLineDash([]);
            }
        }
    }
    
    // Draw Pacman
    drawPacman();
    
    // Draw ghosts
    ghosts.forEach(ghost => drawGhost(ghost));
    
    // Draw game state overlays
    if (gameState === 'paused') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
}

function drawPacman() {
    const px = pacman.x * CELL_SIZE + CELL_SIZE / 2;
    const py = pacman.y * CELL_SIZE + CELL_SIZE / 2;
    
    ctx.save();
    ctx.translate(px, py);
    
    // Rotate based on direction
    let rotation = 0;
    if (pacman.direction === DIRECTIONS.RIGHT) rotation = 0;
    else if (pacman.direction === DIRECTIONS.DOWN) rotation = Math.PI / 2;
    else if (pacman.direction === DIRECTIONS.LEFT) rotation = Math.PI;
    else if (pacman.direction === DIRECTIONS.UP) rotation = -Math.PI / 2;
    
    ctx.rotate(rotation);
    
    // Draw Pacman
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    
    if (pacman.mouthOpen) {
        // Open mouth
        ctx.arc(0, 0, CELL_SIZE * 0.4, 0.2 * Math.PI, 1.8 * Math.PI);
        ctx.lineTo(0, 0);
    } else {
        // Closed mouth
        ctx.arc(0, 0, CELL_SIZE * 0.4, 0, 2 * Math.PI);
    }
    
    ctx.fill();
    ctx.restore();
}

function drawGhost(ghost) {
    const px = ghost.x * CELL_SIZE + CELL_SIZE / 2;
    const py = ghost.y * CELL_SIZE + CELL_SIZE / 2;
    
    ctx.save();
    ctx.translate(px, py);
    
    // Ghost color based on mode
    if (ghost.mode === 'frightened') {
        // Flash blue/white when frightened
        ctx.fillStyle = powerTimer < 2000 && Math.floor(powerTimer / 200) % 2 ? 
            '#ffffff' : '#2121ff';
    } else if (ghost.mode === 'eaten') {
        // Just eyes when eaten
        ctx.fillStyle = 'transparent';
    } else {
        ctx.fillStyle = ghost.color;
    }
    
    if (ghost.mode !== 'eaten') {
        // Ghost body
        ctx.beginPath();
        ctx.arc(0, -2, CELL_SIZE * 0.4, Math.PI, 0, false);
        ctx.lineTo(CELL_SIZE * 0.4, CELL_SIZE * 0.3);
        
        // Wavy bottom
        const waves = 3;
        const waveWidth = (CELL_SIZE * 0.8) / waves;
        for (let i = waves; i >= 0; i--) {
            const x = -CELL_SIZE * 0.4 + i * waveWidth;
            const y = CELL_SIZE * 0.3 + (ghost.animationCounter % 20 < 10 ? 2 : -2) * (i % 2 ? 1 : -1);
            ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.fill();
    }
    
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -2, 3, 0, Math.PI * 2);
    ctx.arc(4, -2, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = '#000000';
    let pupilX = 0;
    let pupilY = 0;
    
    if (ghost.mode !== 'eaten') {
        // Look in direction of movement
        pupilX = ghost.direction.x * 2;
        pupilY = ghost.direction.y * 2;
    } else {
        // Look towards ghost house when eaten
        const dx = 14 - ghost.x;
        const dy = 14 - ghost.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            pupilX = (dx / dist) * 2;
            pupilY = (dy / dist) * 2;
        }
    }
    
    ctx.beginPath();
    ctx.arc(-4 + pupilX, -2 + pupilY, 1.5, 0, Math.PI * 2);
    ctx.arc(4 + pupilX, -2 + pupilY, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

// Start the game when the page loads
window.addEventListener('load', init);