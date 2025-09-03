// Simple Pacman Game - Memory Array Based
// 0 = empty, 1 = wall, 2 = pacman, 3+ = ghosts, -1 = dot, -2 = power pellet

class PacmanGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.gameRunning = false;
        this.paused = false;
        this.gameSpeed = 150; // ms between updates
        
        // Grid dimensions
        this.cols = 19;
        this.rows = 21;
        this.cellSize = 20;
        
        // Initialize game map (memory array)
        this.initializeMap();
        
        // Pacman state
        this.pacman = {
            x: 9,
            y: 15,
            direction: null,
            nextDirection: null,
            mouthOpen: true,
            animationCounter: 0
        };
        
        // Ghosts state
        this.ghosts = [
            { x: 9, y: 9, color: '#ff0000', direction: 'up', id: 3 },
            { x: 8, y: 10, color: '#00ffff', direction: 'left', id: 4 },
            { x: 10, y: 10, color: '#ffb8ff', direction: 'right', id: 5 },
            { x: 9, y: 10, color: '#ffb852', direction: 'down', id: 6 }
        ];
        
        // Power mode
        this.powerMode = false;
        this.powerTimer = 0;
        
        // Setup canvas
        this.setupCanvas();
        
        // Setup controls
        this.setupControls();
        
        // Start game
        this.startGame();
    }
    
    initializeMap() {
        // Create base map layout
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
            this.pacman.nextDirection = 'up';
        });
        
        document.getElementById('btnDown').addEventListener('click', () => {
            this.pacman.nextDirection = 'down';
        });
        
        document.getElementById('btnLeft').addEventListener('click', () => {
            this.pacman.nextDirection = 'left';
        });
        
        document.getElementById('btnRight').addEventListener('click', () => {
            this.pacman.nextDirection = 'right';
        });
        
        document.getElementById('btnPause').addEventListener('click', () => {
            this.togglePause();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
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
        this.gameLoop();
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
                this.map[this.pacman.y][this.pacman.x] = 0;
                this.score += 10;
                this.updateScore();
                this.checkWin();
            } else if (this.map[this.pacman.y][this.pacman.x] === -2) {
                this.map[this.pacman.y][this.pacman.x] = 0;
                this.score += 50;
                this.powerMode = true;
                this.powerTimer = 50; // About 7.5 seconds
                this.updateScore();
                this.checkWin();
            }
        }
        
        // Update power mode
        if (this.powerMode) {
            this.powerTimer--;
            if (this.powerTimer <= 0) {
                this.powerMode = false;
            }
        }
        
        // Move ghosts
        for (let ghost of this.ghosts) {
            this.moveGhost(ghost);
        }
        
        // Check collisions
        this.checkCollisions();
    }
    
    moveGhost(ghost) {
        const directions = ['up', 'down', 'left', 'right'];
        const validMoves = [];
        
        // Find valid moves
        for (let dir of directions) {
            if (this.canMove(ghost.x, ghost.y, dir)) {
                // Avoid going back
                const opposite = this.getOppositeDirection(ghost.direction);
                if (dir !== opposite) {
                    validMoves.push(dir);
                }
            }
        }
        
        // If no valid moves (dead end), allow going back
        if (validMoves.length === 0) {
            const opposite = this.getOppositeDirection(ghost.direction);
            if (this.canMove(ghost.x, ghost.y, opposite)) {
                validMoves.push(opposite);
            }
        }
        
        if (validMoves.length > 0) {
            // Simple AI: sometimes chase pacman, sometimes random
            if (!this.powerMode && Math.random() < 0.3) {
                // Chase pacman
                let bestMove = validMoves[0];
                let bestDistance = Infinity;
                
                for (let move of validMoves) {
                    const [dx, dy] = this.getDirectionDelta(move);
                    const newX = ghost.x + dx;
                    const newY = ghost.y + dy;
                    const distance = Math.abs(newX - this.pacman.x) + Math.abs(newY - this.pacman.y);
                    
                    if (distance < bestDistance) {
                        bestDistance = distance;
                        bestMove = move;
                    }
                }
                
                ghost.direction = bestMove;
            } else if (this.powerMode && Math.random() < 0.5) {
                // Run away from pacman
                let bestMove = validMoves[0];
                let bestDistance = 0;
                
                for (let move of validMoves) {
                    const [dx, dy] = this.getDirectionDelta(move);
                    const newX = ghost.x + dx;
                    const newY = ghost.y + dy;
                    const distance = Math.abs(newX - this.pacman.x) + Math.abs(newY - this.pacman.y);
                    
                    if (distance > bestDistance) {
                        bestDistance = distance;
                        bestMove = move;
                    }
                }
                
                ghost.direction = bestMove;
            } else {
                // Random move
                ghost.direction = validMoves[Math.floor(Math.random() * validMoves.length)];
            }
            
            // Move the ghost
            const [dx, dy] = this.getDirectionDelta(ghost.direction);
            ghost.x += dx;
            ghost.y += dy;
            
            // Wrap around edges
            if (ghost.x < 0) ghost.x = this.cols - 1;
            if (ghost.x >= this.cols) ghost.x = 0;
        }
    }
    
    canMove(x, y, direction) {
        const [dx, dy] = this.getDirectionDelta(direction);
        let newX = x + dx;
        let newY = y + dy;
        
        // Wrap around for horizontal movement
        if (newX < 0) newX = this.cols - 1;
        if (newX >= this.cols) newX = 0;
        
        // Check bounds for vertical
        if (newY < 0 || newY >= this.rows) return false;
        
        // Check if it's a wall
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
                    this.score += 200;
                    this.updateScore();
                    // Reset ghost position
                    ghost.x = 9;
                    ghost.y = 10;
                    ghost.direction = 'up';
                } else {
                    // Lose a life
                    this.loseLife();
                    break;
                }
            }
        }
    }
    
    loseLife() {
        this.lives--;
        this.updateLives();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            // Reset positions
            this.pacman.x = 9;
            this.pacman.y = 15;
            this.pacman.direction = null;
            this.pacman.nextDirection = null;
            
            this.ghosts[0] = { x: 9, y: 9, color: '#ff0000', direction: 'up', id: 3 };
            this.ghosts[1] = { x: 8, y: 10, color: '#00ffff', direction: 'left', id: 4 };
            this.ghosts[2] = { x: 10, y: 10, color: '#ffb8ff', direction: 'right', id: 5 };
            this.ghosts[3] = { x: 9, y: 10, color: '#ffb852', direction: 'down', id: 6 };
            
            this.powerMode = false;
            this.powerTimer = 0;
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
            // Level complete - reset with bonus
            this.score += 1000;
            this.updateScore();
            this.resetMap();
            
            // Reset positions
            this.pacman.x = 9;
            this.pacman.y = 15;
            this.pacman.direction = null;
            this.pacman.nextDirection = null;
            
            this.ghosts[0] = { x: 9, y: 9, color: '#ff0000', direction: 'up', id: 3 };
            this.ghosts[1] = { x: 8, y: 10, color: '#00ffff', direction: 'left', id: 4 };
            this.ghosts[2] = { x: 10, y: 10, color: '#ffb8ff', direction: 'right', id: 5 };
            this.ghosts[3] = { x: 9, y: 10, color: '#ffb852', direction: 'down', id: 6 };
            
            // Speed up game slightly
            this.gameSpeed = Math.max(80, this.gameSpeed - 10);
        }
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
                    // Wall
                    this.ctx.fillStyle = '#2563eb';
                    this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
                    
                    // Add some detail to walls
                    this.ctx.strokeStyle = '#1e40af';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(px, py, this.cellSize, this.cellSize);
                } else if (cell === -1) {
                    // Dot
                    this.ctx.fillStyle = '#fbbf24';
                    this.ctx.beginPath();
                    this.ctx.arc(px + this.cellSize/2, py + this.cellSize/2, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (cell === -2) {
                    // Power pellet
                    this.ctx.fillStyle = '#fbbf24';
                    this.ctx.beginPath();
                    this.ctx.arc(px + this.cellSize/2, py + this.cellSize/2, 5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        // Draw ghosts
        for (let ghost of this.ghosts) {
            const px = ghost.x * this.cellSize + this.cellSize/2;
            const py = ghost.y * this.cellSize + this.cellSize/2;
            
            this.ctx.fillStyle = this.powerMode ? 
                (this.powerTimer < 20 && this.powerTimer % 4 < 2 ? '#ffffff' : '#0000ff') : 
                ghost.color;
            
            // Ghost body
            this.ctx.beginPath();
            this.ctx.arc(px, py - 2, this.cellSize/2 - 2, Math.PI, 0, false);
            this.ctx.lineTo(px + this.cellSize/2 - 2, py + this.cellSize/2 - 4);
            
            // Wavy bottom
            for (let i = 0; i < 3; i++) {
                this.ctx.lineTo(
                    px + this.cellSize/2 - 2 - (i+1) * this.cellSize/3,
                    py + this.cellSize/2 - 4 - (i % 2) * 2
                );
            }
            
            this.ctx.closePath();
            this.ctx.fill();
            
            // Eyes
            if (!this.powerMode) {
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(px - 4, py - 2, 2, 0, Math.PI * 2);
                this.ctx.arc(px + 4, py - 2, 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#000';
                this.ctx.beginPath();
                this.ctx.arc(px - 4, py - 2, 1, 0, Math.PI * 2);
                this.ctx.arc(px + 4, py - 2, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // Draw Pacman
        const px = this.pacman.x * this.cellSize + this.cellSize/2;
        const py = this.pacman.y * this.cellSize + this.cellSize/2;
        
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
    }
    
    updateScore() {
        document.getElementById('score').textContent = `Score: ${this.score}`;
    }
    
    updateLives() {
        document.getElementById('lives').textContent = `Lives: ${this.lives}`;
    }
    
    togglePause() {
        this.paused = !this.paused;
        const btn = document.getElementById('btnPause');
        btn.textContent = this.paused ? '▶' : '⏸';
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = `Final Score: ${this.score}`;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    restart() {
        document.getElementById('gameOver').style.display = 'none';
        
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.gameSpeed = 150;
        this.powerMode = false;
        this.powerTimer = 0;
        this.paused = false;
        
        // Reset map
        this.resetMap();
        
        // Reset pacman
        this.pacman = {
            x: 9,
            y: 15,
            direction: null,
            nextDirection: null,
            mouthOpen: true,
            animationCounter: 0
        };
        
        // Reset ghosts
        this.ghosts = [
            { x: 9, y: 9, color: '#ff0000', direction: 'up', id: 3 },
            { x: 8, y: 10, color: '#00ffff', direction: 'left', id: 4 },
            { x: 10, y: 10, color: '#ffb8ff', direction: 'right', id: 5 },
            { x: 9, y: 10, color: '#ffb852', direction: 'down', id: 6 }
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
    new PacmanGame();
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