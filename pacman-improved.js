// Enhanced Pacman Game with Sound Effects, Better AI, and More Features
// 0 = empty, 1 = wall, 2 = pacman, 3+ = ghosts, -1 = dot, -2 = power pellet

class PacmanGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('pacmanHighScore') || '0');
        this.lives = 3;
        this.level = 1;
        this.gameRunning = false;
        this.paused = false;
        this.gameState = 'ready'; // ready, playing, dying, levelComplete, gameOver
        this.gameSpeed = 150; // ms between updates
        this.stateTimer = 0;
        
        // Grid dimensions
        this.cols = 19;
        this.rows = 21;
        this.cellSize = 20;
        
        // Sound effects (using Web Audio API)
        this.audioContext = null;
        this.sounds = {};
        this.initAudio();
        
        // Initialize game map (memory array)
        this.initializeMap();
        
        // Pacman state
        this.pacman = {
            x: 9,
            y: 15,
            direction: null,
            nextDirection: null,
            mouthOpen: true,
            animationCounter: 0,
            speed: 1
        };
        
        // Ghosts state with personalities
        this.ghosts = [
            { x: 9, y: 9, color: '#ff0000', direction: 'up', id: 3, name: 'Blinky', mode: 'chase', speed: 0.95 },
            { x: 8, y: 10, color: '#00ffff', direction: 'left', id: 4, name: 'Inky', mode: 'scatter', speed: 0.85 },
            { x: 10, y: 10, color: '#ffb8ff', direction: 'right', id: 5, name: 'Pinky', mode: 'scatter', speed: 0.9 },
            { x: 9, y: 10, color: '#ffb852', direction: 'down', id: 6, name: 'Clyde', mode: 'scatter', speed: 0.8 }
        ];
        
        // Power mode
        this.powerMode = false;
        this.powerTimer = 0;
        this.ghostsEaten = 0;
        
        // Fruit bonus
        this.fruit = null;
        this.fruitTimer = 0;
        
        // Animation and effects
        this.particles = [];
        this.scorePopups = [];
        
        // Setup canvas
        this.setupCanvas();
        
        // Setup controls
        this.setupControls();
        
        // Start game
        this.startGame();
    }
    
    initAudio() {
        // Initialize Web Audio API for sound effects
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create sound effects
            this.sounds = {
                chomp: () => this.playTone(440, 0.1, 'square'),
                eatGhost: () => this.playTone(523, 0.3, 'sine'),
                death: () => this.playDeathSound(),
                powerUp: () => this.playPowerUpSound(),
                levelComplete: () => this.playLevelCompleteSound(),
                extraLife: () => this.playTone(880, 0.5, 'sine')
            };
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    playTone(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playDeathSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
    
    playPowerUpSound() {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
    
    playLevelCompleteSound() {
        if (!this.audioContext) return;
        
        const notes = [523, 587, 659, 698, 784, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.2, 'sine'), i * 100);
        });
    }
    
    initializeMap() {
        // Create base map layout with more interesting design
        this.baseMap = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,-1,-1,-1,-1,-1,-1,-1,-1,1,-1,-1,-1,-1,-1,-1,-1,-1,1],
            [1,-2,1,1,-1,1,1,1,-1,1,-1,1,1,1,-1,1,1,-2,1],
            [1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1],
            [1,-1,1,1,-1,1,-1,1,1,1,1,1,-1,1,-1,1,1,-1,1],
            [1,-1,-1,-1,-1,1,-1,-1,-1,1,-1,-1,-1,1,-1,-1,-1,-1,1],
            [1,1,1,1,-1,1,1,1,-1,1,-1,1,1,1,-1,1,1,1,1],
            [0,0,0,1,-1,1,-1,-1,-1,-1,-1,-1,-1,1,-1,1,0,0,0],
            [1,1,1,1,-1,1,-1,1,1,0,1,1,-1,1,-1,1,1,1,1],
            [1,-1,-1,-1,-1,-1,-1,1,0,0,0,1,-1,-1,-1,-1,-1,-1,1],
            [1,-1,1,1,-1,1,-1,1,0,0,0,1,-1,1,-1,1,1,-1,1],
            [1,-1,-1,1,-1,-1,-1,1,1,1,1,1,-1,-1,-1,1,-1,-1,1],
            [1,1,-1,1,-1,1,-1,-1,-1,-1,-1,-1,-1,1,-1,1,-1,1,1],
            [1,-1,-1,-1,-1,1,-1,1,1,1,1,1,-1,1,-1,-1,-1,-1,1],
            [1,-1,1,1,-1,-1,-1,-1,-1,1,-1,-1,-1,-1,-1,1,1,-1,1],
            [1,-1,-1,1,-1,1,1,1,-1,1,-1,1,1,1,-1,1,-1,-1,1],
            [1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,1],
            [1,-1,-1,1,1,-1,1,1,-1,1,-1,1,1,-1,1,1,-1,-1,1],
            [1,-2,1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,1,-2,1],
            [1,-1,-1,-1,-1,1,1,1,1,1,1,1,1,1,-1,-1,-1,-1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        // Copy base map to game map
        this.resetMap();
    }
    
    resetMap() {
        this.map = this.baseMap.map(row => [...row]);
        this.totalDots = 0;
        this.dotsEaten = 0;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.map[y][x] === -1 || this.map[y][x] === -2) {
                    this.totalDots++;
                }
            }
        }
    }
    
    setupCanvas() {
        this.canvas.width = this.cols * this.cellSize;
        this.canvas.height = this.rows * this.cellSize;
        
        // Adjust for mobile screens
        const maxWidth = Math.min(window.innerWidth - 40, 500);
        if (this.canvas.width > maxWidth) {
            const scale = maxWidth / this.canvas.width;
            this.canvas.style.width = `${this.canvas.width * scale}px`;
            this.canvas.style.height = `${this.canvas.height * scale}px`;
        }
    }
    
    setupControls() {
        // Touch controls
        document.getElementById('btnUp').addEventListener('click', () => {
            if (this.gameState === 'ready') this.startPlaying();
            this.pacman.nextDirection = 'up';
        });
        
        document.getElementById('btnDown').addEventListener('click', () => {
            if (this.gameState === 'ready') this.startPlaying();
            this.pacman.nextDirection = 'down';
        });
        
        document.getElementById('btnLeft').addEventListener('click', () => {
            if (this.gameState === 'ready') this.startPlaying();
            this.pacman.nextDirection = 'left';
        });
        
        document.getElementById('btnRight').addEventListener('click', () => {
            if (this.gameState === 'ready') this.startPlaying();
            this.pacman.nextDirection = 'right';
        });
        
        document.getElementById('btnPause').addEventListener('click', () => {
            this.togglePause();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameState === 'ready' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                this.startPlaying();
            }
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.pacman.nextDirection = 'up';
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.pacman.nextDirection = 'down';
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.pacman.nextDirection = 'left';
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.pacman.nextDirection = 'right';
                    e.preventDefault();
                    break;
                case ' ':
                case 'p':
                case 'P':
                    this.togglePause();
                    e.preventDefault();
                    break;
            }
        });
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restart();
        });
        
        // Prevent double-tap zoom on mobile
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
    
    startGame() {
        this.gameRunning = true;
        this.updateHighScore();
        this.gameLoop();
    }
    
    startPlaying() {
        if (this.gameState === 'ready') {
            this.gameState = 'playing';
            this.stateTimer = 0;
        }
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        if (!this.paused) {
            this.update();
            this.render();
        }
        
        setTimeout(() => this.gameLoop(), this.gameSpeed);
    }
    
    update() {
        // Update state timer
        this.stateTimer++;
        
        // Handle different game states
        switch(this.gameState) {
            case 'ready':
                // Waiting for player to start
                break;
            case 'playing':
                this.updatePlaying();
                break;
            case 'dying':
                if (this.stateTimer > 20) {
                    this.respawn();
                }
                break;
            case 'levelComplete':
                if (this.stateTimer > 30) {
                    this.nextLevel();
                }
                break;
            case 'gameOver':
                // Game over state
                break;
        }
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.life--;
            p.y -= p.vy;
            p.x += p.vx;
            p.vy *= 0.98;
            p.vx *= 0.98;
            return p.life > 0;
        });
        
        // Update score popups
        this.scorePopups = this.scorePopups.filter(p => {
            p.life--;
            p.y -= 0.5;
            return p.life > 0;
        });
    }
    
    updatePlaying() {
        // Update pacman animation
        this.pacman.animationCounter++;
        if (this.pacman.animationCounter % 2 === 0) {
            this.pacman.mouthOpen = !this.pacman.mouthOpen;
        }
        
        // Try to change direction
        if (this.pacman.nextDirection) {
            if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.nextDirection)) {
                this.pacman.direction = this.pacman.nextDirection;
                this.pacman.nextDirection = null;
            }
        }
        
        // Move pacman
        if (this.pacman.direction && this.canMove(this.pacman.x, this.pacman.y, this.pacman.direction)) {
            const [dx, dy] = this.getDirectionDelta(this.pacman.direction);
            this.pacman.x += dx;
            this.pacman.y += dy;
            
            // Wrap around edges
            if (this.pacman.x < 0) this.pacman.x = this.cols - 1;
            if (this.pacman.x >= this.cols) this.pacman.x = 0;
            
            // Check for dots
            if (this.map[this.pacman.y][this.pacman.x] === -1) {
                this.eatDot(this.pacman.x, this.pacman.y);
            } else if (this.map[this.pacman.y][this.pacman.x] === -2) {
                this.eatPowerPellet(this.pacman.x, this.pacman.y);
            }
        }
        
        // Update power mode
        if (this.powerMode) {
            this.powerTimer--;
            if (this.powerTimer <= 0) {
                this.powerMode = false;
                this.ghostsEaten = 0;
            }
        }
        
        // Update fruit
        if (this.fruit) {
            this.fruitTimer--;
            if (this.fruitTimer <= 0) {
                this.fruit = null;
            }
            
            // Check if pacman ate the fruit
            if (this.fruit && this.pacman.x === this.fruit.x && this.pacman.y === this.fruit.y) {
                this.eatFruit();
            }
        } else {
            // Spawn fruit occasionally
            if (this.dotsEaten === Math.floor(this.totalDots / 3) || this.dotsEaten === Math.floor(2 * this.totalDots / 3)) {
                if (Math.random() < 0.5) {
                    this.spawnFruit();
                }
            }
        }
        
        // Move ghosts with improved AI
        for (let i = 0; i < this.ghosts.length; i++) {
            if (i % 2 === this.stateTimer % 2) { // Stagger ghost movement for performance
                this.moveGhost(this.ghosts[i]);
            }
        }
        
        // Check collisions
        this.checkCollisions();
    }
    
    eatDot(x, y) {
        this.map[y][x] = 0;
        this.score += 10;
        this.dotsEaten++;
        this.updateScore();
        this.sounds.chomp();
        this.checkWin();
        
        // Create particle effect
        this.createParticles(x * this.cellSize + this.cellSize/2, y * this.cellSize + this.cellSize/2, '#fbbf24', 3);
    }
    
    eatPowerPellet(x, y) {
        this.map[y][x] = 0;
        this.score += 50;
        this.dotsEaten++;
        this.powerMode = true;
        this.powerTimer = 60 + this.level * 5; // Power lasts longer in higher levels
        this.updateScore();
        this.sounds.powerUp();
        this.checkWin();
        
        // Create bigger particle effect
        this.createParticles(x * this.cellSize + this.cellSize/2, y * this.cellSize + this.cellSize/2, '#fbbf24', 8);
        
        // Make ghosts flee
        for (let ghost of this.ghosts) {
            ghost.mode = 'frightened';
        }
    }
    
    eatFruit() {
        const points = this.fruit.points;
        this.score += points;
        this.updateScore();
        this.sounds.extraLife();
        
        // Show score popup
        this.scorePopups.push({
            x: this.fruit.x * this.cellSize + this.cellSize/2,
            y: this.fruit.y * this.cellSize + this.cellSize/2,
            text: `+${points}`,
            life: 30
        });
        
        this.createParticles(this.fruit.x * this.cellSize + this.cellSize/2, this.fruit.y * this.cellSize + this.cellSize/2, this.fruit.color, 10);
        
        this.fruit = null;
        
        // Extra life every 10000 points
        if (Math.floor(this.score / 10000) > Math.floor((this.score - points) / 10000)) {
            this.lives++;
            this.updateLives();
            this.sounds.extraLife();
        }
    }
    
    spawnFruit() {
        const fruits = [
            { type: 'cherry', color: '#ff0000', points: 100 },
            { type: 'strawberry', color: '#ff69b4', points: 300 },
            { type: 'orange', color: '#ffa500', points: 500 },
            { type: 'apple', color: '#00ff00', points: 700 },
            { type: 'melon', color: '#90ee90', points: 1000 }
        ];
        
        const fruitType = fruits[Math.min(this.level - 1, fruits.length - 1)];
        
        this.fruit = {
            x: 9,
            y: 11,
            ...fruitType
        };
        
        this.fruitTimer = 100; // Fruit lasts for about 15 seconds
    }
    
    createParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 2 + 1,
                color: color,
                life: 20
            });
        }
    }
    
    moveGhost(ghost) {
        // Improved ghost AI with different behaviors
        let targetX, targetY;
        
        if (this.powerMode) {
            // Flee from pacman
            targetX = this.pacman.x > ghost.x ? 0 : this.cols - 1;
            targetY = this.pacman.y > ghost.y ? 0 : this.rows - 1;
        } else {
            // Different ghost behaviors
            switch(ghost.name) {
                case 'Blinky': // Red - directly chases pacman
                    targetX = this.pacman.x;
                    targetY = this.pacman.y;
                    break;
                case 'Pinky': // Pink - targets ahead of pacman
                    const [dx, dy] = this.getDirectionDelta(this.pacman.direction || 'right');
                    targetX = this.pacman.x + dx * 4;
                    targetY = this.pacman.y + dy * 4;
                    break;
                case 'Inky': // Cyan - unpredictable
                    if (Math.random() < 0.5) {
                        targetX = this.pacman.x;
                        targetY = this.pacman.y;
                    } else {
                        targetX = Math.floor(Math.random() * this.cols);
                        targetY = Math.floor(Math.random() * this.rows);
                    }
                    break;
                case 'Clyde': // Orange - shy, keeps distance
                    const distance = Math.abs(ghost.x - this.pacman.x) + Math.abs(ghost.y - this.pacman.y);
                    if (distance < 8) {
                        // Too close, run away
                        targetX = ghost.x < this.cols/2 ? 0 : this.cols - 1;
                        targetY = ghost.y < this.rows/2 ? 0 : this.rows - 1;
                    } else {
                        // Far enough, chase
                        targetX = this.pacman.x;
                        targetY = this.pacman.y;
                    }
                    break;
            }
        }
        
        // Use A* pathfinding for smarter movement (simplified version)
        const bestMove = this.findBestMove(ghost, targetX, targetY);
        
        if (bestMove) {
            const [dx, dy] = this.getDirectionDelta(bestMove);
            ghost.x += dx;
            ghost.y += dy;
            ghost.direction = bestMove;
            
            // Wrap around edges
            if (ghost.x < 0) ghost.x = this.cols - 1;
            if (ghost.x >= this.cols) ghost.x = 0;
        }
    }
    
    findBestMove(ghost, targetX, targetY) {
        const directions = ['up', 'down', 'left', 'right'];
        const validMoves = [];
        
        for (let dir of directions) {
            if (this.canMove(ghost.x, ghost.y, dir)) {
                // Avoid going back unless necessary
                const opposite = this.getOppositeDirection(ghost.direction);
                if (dir !== opposite || directions.filter(d => this.canMove(ghost.x, ghost.y, d)).length === 1) {
                    const [dx, dy] = this.getDirectionDelta(dir);
                    const newX = ghost.x + dx;
                    const newY = ghost.y + dy;
                    const distance = Math.abs(newX - targetX) + Math.abs(newY - targetY);
                    validMoves.push({ dir, distance });
                }
            }
        }
        
        if (validMoves.length === 0) return null;
        
        // Sort by distance and pick the best move
        validMoves.sort((a, b) => a.distance - b.distance);
        
        // Add some randomness to make ghosts less predictable
        if (Math.random() < 0.1 && validMoves.length > 1) {
            return validMoves[1].dir;
        }
        
        return validMoves[0].dir;
    }
    
    canMove(x, y, direction) {
        const [dx, dy] = this.getDirectionDelta(direction);
        const newX = x + dx;
        const newY = y + dy;
        
        // Check boundaries
        if (newY < 0 || newY >= this.rows) return false;
        
        // Allow wrapping on sides
        if (newX < 0 || newX >= this.cols) return true;
        
        // Check for walls
        return this.map[newY][newX] !== 1;
    }
    
    getDirectionDelta(direction) {
        switch(direction) {
            case 'up': return [0, -1];
            case 'down': return [0, 1];
            case 'left': return [-1, 0];
            case 'right': return [1, 0];
            default: return [0, 0];
        }
    }
    
    getOppositeDirection(direction) {
        switch(direction) {
            case 'up': return 'down';
            case 'down': return 'up';
            case 'left': return 'right';
            case 'right': return 'left';
            default: return null;
        }
    }
    
    checkCollisions() {
        for (let ghost of this.ghosts) {
            if (ghost.x === this.pacman.x && ghost.y === this.pacman.y) {
                if (this.powerMode) {
                    // Eat ghost
                    this.ghostsEaten++;
                    const points = 200 * Math.pow(2, this.ghostsEaten - 1);
                    this.score += points;
                    this.updateScore();
                    this.sounds.eatGhost();
                    
                    // Show score popup
                    this.scorePopups.push({
                        x: ghost.x * this.cellSize + this.cellSize/2,
                        y: ghost.y * this.cellSize + this.cellSize/2,
                        text: `+${points}`,
                        life: 30
                    });
                    
                    // Reset ghost position
                    ghost.x = 9;
                    ghost.y = 10;
                    ghost.direction = 'up';
                    
                    // Create particle effect
                    this.createParticles(this.pacman.x * this.cellSize + this.cellSize/2, this.pacman.y * this.cellSize + this.cellSize/2, ghost.color, 10);
                } else {
                    // Pacman dies
                    this.die();
                    return;
                }
            }
        }
    }
    
    die() {
        this.gameState = 'dying';
        this.stateTimer = 0;
        this.sounds.death();
        this.lives--;
        this.updateLives();
        
        // Create death particles
        this.createParticles(this.pacman.x * this.cellSize + this.cellSize/2, this.pacman.y * this.cellSize + this.cellSize/2, '#ffeb3b', 20);
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }
    
    respawn() {
        if (this.lives > 0) {
            this.gameState = 'playing';
            
            // Reset positions
            this.pacman.x = 9;
            this.pacman.y = 15;
            this.pacman.direction = null;
            this.pacman.nextDirection = null;
            
            this.ghosts[0] = { ...this.ghosts[0], x: 9, y: 9, direction: 'up' };
            this.ghosts[1] = { ...this.ghosts[1], x: 8, y: 10, direction: 'left' };
            this.ghosts[2] = { ...this.ghosts[2], x: 10, y: 10, direction: 'right' };
            this.ghosts[3] = { ...this.ghosts[3], x: 9, y: 10, direction: 'down' };
            
            this.powerMode = false;
            this.powerTimer = 0;
            this.ghostsEaten = 0;
        }
    }
    
    checkWin() {
        let dotsRemaining = 0;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.map[y][x] === -1 || this.map[y][x] === -2) {
                    dotsRemaining++;
                }
            }
        }
        
        if (dotsRemaining === 0) {
            this.gameState = 'levelComplete';
            this.stateTimer = 0;
            this.sounds.levelComplete();
            
            // Bonus points for level completion
            const bonus = 1000 * this.level;
            this.score += bonus;
            this.updateScore();
            
            // Show level complete message
            this.scorePopups.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                text: `Level ${this.level} Complete! +${bonus}`,
                life: 60
            });
        }
    }
    
    nextLevel() {
        this.level++;
        this.gameState = 'ready';
        this.stateTimer = 0;
        
        // Reset map
        this.resetMap();
        
        // Reset positions
        this.pacman.x = 9;
        this.pacman.y = 15;
        this.pacman.direction = null;
        this.pacman.nextDirection = null;
        
        this.ghosts[0] = { ...this.ghosts[0], x: 9, y: 9, direction: 'up' };
        this.ghosts[1] = { ...this.ghosts[1], x: 8, y: 10, direction: 'left' };
        this.ghosts[2] = { ...this.ghosts[2], x: 10, y: 10, direction: 'right' };
        this.ghosts[3] = { ...this.ghosts[3], x: 9, y: 10, direction: 'down' };
        
        // Increase difficulty
        this.gameSpeed = Math.max(80, this.gameSpeed - 10);
        for (let ghost of this.ghosts) {
            ghost.speed = Math.min(1.2, ghost.speed + 0.05);
        }
        
        this.powerMode = false;
        this.powerTimer = 0;
        this.ghostsEaten = 0;
        this.fruit = null;
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze and dots
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cell = this.map[y][x];
                const px = x * this.cellSize;
                const py = y * this.cellSize;
                
                if (cell === 1) {
                    // Wall with gradient
                    const gradient = this.ctx.createLinearGradient(px, py, px + this.cellSize, py + this.cellSize);
                    gradient.addColorStop(0, '#2563eb');
                    gradient.addColorStop(1, '#1e40af');
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
                    
                    // Add some detail to walls
                    this.ctx.strokeStyle = '#1e40af';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(px, py, this.cellSize, this.cellSize);
                } else if (cell === -1) {
                    // Dot with pulsing effect
                    const pulse = Math.sin(Date.now() * 0.002) * 0.5 + 0.5;
                    this.ctx.fillStyle = `rgba(251, 191, 36, ${0.7 + pulse * 0.3})`;
                    this.ctx.beginPath();
                    this.ctx.arc(px + this.cellSize/2, py + this.cellSize/2, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (cell === -2) {
                    // Power pellet with glow effect
                    const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
                    
                    // Glow
                    const gradient = this.ctx.createRadialGradient(px + this.cellSize/2, py + this.cellSize/2, 0, px + this.cellSize/2, py + this.cellSize/2, 10);
                    gradient.addColorStop(0, `rgba(251, 191, 36, ${pulse})`);
                    gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
                    
                    // Pellet
                    this.ctx.fillStyle = '#fbbf24';
                    this.ctx.beginPath();
                    this.ctx.arc(px + this.cellSize/2, py + this.cellSize/2, 4 + pulse, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        // Draw fruit
        if (this.fruit) {
            const px = this.fruit.x * this.cellSize + this.cellSize/2;
            const py = this.fruit.y * this.cellSize + this.cellSize/2;
            
            // Fruit glow
            const gradient = this.ctx.createRadialGradient(px, py, 0, px, py, this.cellSize/2);
            gradient.addColorStop(0, this.fruit.color);
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(px, py, this.cellSize/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Fruit icon
            this.ctx.fillStyle = this.fruit.color;
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('🍒', px, py);
        }
        
        // Draw particles
        for (let particle of this.particles) {
            this.ctx.fillStyle = particle.color + Math.floor(particle.life * 255 / 20).toString(16).padStart(2, '0');
            this.ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
        }
        
        // Draw ghosts
        if (this.gameState !== 'dying' || this.stateTimer % 4 < 2) {
            for (let ghost of this.ghosts) {
                this.drawGhost(ghost);
            }
        }
        
        // Draw Pacman
        if (this.gameState !== 'dying' || this.stateTimer % 2 === 0) {
            this.drawPacman();
        }
        
        // Draw score popups
        for (let popup of this.scorePopups) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${popup.life / 30})`;
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(popup.text, popup.x, popup.y);
        }
        
        // Draw game state messages
        if (this.gameState === 'ready') {
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('READY!', this.canvas.width/2, this.canvas.height/2);
            this.ctx.font = '14px Arial';
            this.ctx.fillText('Press any arrow key to start', this.canvas.width/2, this.canvas.height/2 + 30);
        }
        
        // Draw level indicator
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Level ${this.level}`, 5, 15);
    }
    
    drawGhost(ghost) {
        const px = ghost.x * this.cellSize + this.cellSize/2;
        const py = ghost.y * this.cellSize + this.cellSize/2;
        
        if (this.powerMode) {
            // Frightened ghost
            this.ctx.fillStyle = this.powerTimer < 20 && this.powerTimer % 4 < 2 ? '#ffffff' : '#0000ff';
        } else {
            this.ctx.fillStyle = ghost.color;
        }
        
        // Ghost body with better shape
        this.ctx.beginPath();
        this.ctx.arc(px, py - 2, this.cellSize/2 - 2, Math.PI, 0, false);
        this.ctx.lineTo(px + this.cellSize/2 - 2, py + this.cellSize/2 - 4);
        
        // Wavy bottom
        const waveOffset = Date.now() * 0.01;
        for (let i = 0; i < 4; i++) {
            const x = px + this.cellSize/2 - 2 - (i+1) * (this.cellSize - 4) / 4;
            const y = py + this.cellSize/2 - 4 + Math.sin(waveOffset + i) * 2;
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Eyes
        if (!this.powerMode || this.powerTimer > 20) {
            // White of eyes
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(px - 4, py - 2, 3, 0, Math.PI * 2);
            this.ctx.arc(px + 4, py - 2, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Pupils that follow pacman
            const dx = this.pacman.x * this.cellSize + this.cellSize/2 - px;
            const dy = this.pacman.y * this.cellSize + this.cellSize/2 - py;
            const angle = Math.atan2(dy, dx);
            
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(px - 4 + Math.cos(angle) * 1.5, py - 2 + Math.sin(angle) * 1.5, 1.5, 0, Math.PI * 2);
            this.ctx.arc(px + 4 + Math.cos(angle) * 1.5, py - 2 + Math.sin(angle) * 1.5, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Frightened eyes
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(px - 5, py - 3, 3, 3);
            this.ctx.fillRect(px + 2, py - 3, 3, 3);
        }
    }
    
    drawPacman() {
        const px = this.pacman.x * this.cellSize + this.cellSize/2;
        const py = this.pacman.y * this.cellSize + this.cellSize/2;
        
        // Pacman glow effect when powered up
        if (this.powerMode) {
            const gradient = this.ctx.createRadialGradient(px, py, 0, px, py, this.cellSize);
            gradient.addColorStop(0, 'rgba(255, 235, 59, 0.5)');
            gradient.addColorStop(1, 'rgba(255, 235, 59, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(px, py, this.cellSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.fillStyle = '#ffeb3b';
        this.ctx.beginPath();
        
        if (this.pacman.mouthOpen && this.pacman.direction) {
            // Draw Pacman with open mouth
            let startAngle, endAngle;
            
            switch(this.pacman.direction) {
                case 'right':
                    startAngle = 0.2 * Math.PI;
                    endAngle = 1.8 * Math.PI;
                    break;
                case 'left':
                    startAngle = 1.2 * Math.PI;
                    endAngle = 0.8 * Math.PI;
                    break;
                case 'up':
                    startAngle = 1.7 * Math.PI;
                    endAngle = 1.3 * Math.PI;
                    break;
                case 'down':
                    startAngle = 0.7 * Math.PI;
                    endAngle = 0.3 * Math.PI;
                    break;
                default:
                    startAngle = 0.2 * Math.PI;
                    endAngle = 1.8 * Math.PI;
            }
            
            this.ctx.arc(px, py, this.cellSize/2 - 2, startAngle, endAngle);
            this.ctx.lineTo(px, py);
        } else {
            // Draw closed mouth (circle)
            this.ctx.arc(px, py, this.cellSize/2 - 2, 0, Math.PI * 2);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Eye
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(px - 2, py - 4, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    updateScore() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
        this.updateHighScore();
    }
    
    updateLives() {
        document.getElementById('lives').textContent = `Lives: ${this.lives}`;
    }
    
    updateHighScore() {
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pacmanHighScore', this.highScore.toString());
        }
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.paused = !this.paused;
            const btn = document.getElementById('btnPause');
            btn.textContent = this.paused ? '▶' : '⏸';
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.gameRunning = false;
        document.getElementById('finalScore').innerHTML = `
            Final Score: ${this.score}<br>
            High Score: ${this.highScore}<br>
            Level Reached: ${this.level}
        `;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    restart() {
        document.getElementById('gameOver').style.display = 'none';
        
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameSpeed = 150;
        this.powerMode = false;
        this.powerTimer = 0;
        this.ghostsEaten = 0;
        this.paused = false;
        this.gameState = 'ready';
        this.stateTimer = 0;
        this.fruit = null;
        this.particles = [];
        this.scorePopups = [];
        
        // Reset map
        this.resetMap();
        
        // Reset pacman
        this.pacman = {
            x: 9,
            y: 15,
            direction: null,
            nextDirection: null,
            mouthOpen: true,
            animationCounter: 0,
            speed: 1
        };
        
        // Reset ghosts
        this.ghosts = [
            { x: 9, y: 9, color: '#ff0000', direction: 'up', id: 3, name: 'Blinky', mode: 'chase', speed: 0.95 },
            { x: 8, y: 10, color: '#00ffff', direction: 'left', id: 4, name: 'Inky', mode: 'scatter', speed: 0.85 },
            { x: 10, y: 10, color: '#ffb8ff', direction: 'right', id: 5, name: 'Pinky', mode: 'scatter', speed: 0.9 },
            { x: 9, y: 10, color: '#ffb852', direction: 'down', id: 6, name: 'Clyde', mode: 'scatter', speed: 0.8 }
        ];
        
        // Update UI
        this.updateScore();
        this.updateLives();
        document.getElementById('btnPause').textContent = '⏸';
        
        // Start game
        this.gameRunning = true;
        this.gameLoop();
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    // Enable audio context on first user interaction
    document.addEventListener('click', function initAudio() {
        const game = window.pacmanGame;
        if (game && game.audioContext && game.audioContext.state === 'suspended') {
            game.audioContext.resume();
        }
        document.removeEventListener('click', initAudio);
    });
    
    window.pacmanGame = new PacmanGame();
});

// Handle window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('gameCanvas');
    const maxWidth = Math.min(window.innerWidth - 40, 500);
    if (canvas.width > maxWidth) {
        const scale = maxWidth / canvas.width;
        canvas.style.width = `${canvas.width * scale}px`;
        canvas.style.height = `${canvas.height * scale}px`;
    } else {
        canvas.style.width = '';
        canvas.style.height = '';
    }
});

// Prevent scrolling on mobile when using controls
document.addEventListener('touchmove', (e) => {
    if (e.target.closest('#controls')) {
        e.preventDefault();
    }
}, { passive: false });