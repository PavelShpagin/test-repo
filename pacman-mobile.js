// Mobile-optimized Pac-Man for Pixel 8
class MobilePacman {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game configuration
        this.gridSize = 19;
        this.cellSize = 16;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameState = 'playing'; // 'playing', 'paused', 'gameover', 'win'
        
        // Timing
        this.lastTime = 0;
        this.accumulator = 0;
        this.tickRate = 120; // ms per tick
        
        // Power mode
        this.powerMode = false;
        this.powerTimer = 0;
        this.powerDuration = 8000; // 8 seconds
        this.ghostsEaten = 0;
        
        // Touch controls
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.swipeThreshold = 30;
        
        // Initialize game
        this.initMap();
        this.initEntities();
        this.setupCanvas();
        this.setupControls();
        this.updateUI();
        
        // Start game loop
        this.animationId = null;
        this.startGameLoop();
    }
    
    initMap() {
        // Classic Pac-Man maze layout
        // 0 = wall, 1 = dot, 2 = power pellet, 3 = empty
        this.map = [
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
            [0,2,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,2,0],
            [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0],
            [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
            [0,0,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,0,0],
            [3,3,3,0,1,0,1,1,1,1,1,1,1,0,1,0,3,3,3],
            [0,0,0,0,1,0,1,0,0,3,0,0,1,0,1,0,0,0,0],
            [0,1,1,1,1,1,1,0,3,3,3,0,1,1,1,1,1,1,0],
            [0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0],
            [0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0],
            [0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0],
            [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
            [0,1,0,0,1,1,1,0,1,0,1,0,1,1,1,0,0,1,0],
            [0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,0,1,1,0],
            [0,0,1,1,1,0,1,0,0,0,0,0,1,0,1,1,1,0,0],
            [0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0],
            [0,2,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,2,0],
            [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
            [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        ];
        
        // Count total dots
        this.totalDots = 0;
        this.dotsCollected = 0;
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 1 || this.map[y][x] === 2) {
                    this.totalDots++;
                }
            }
        }
    }
    
    initEntities() {
        // Pac-Man
        this.pacman = {
            x: 9,
            y: 15,
            targetX: 9,
            targetY: 15,
            direction: 'left',
            nextDirection: null,
            animFrame: 0,
            animSpeed: 0.2,
            moving: false
        };
        
        // Ghosts with different AI behaviors
        this.ghosts = [
            {
                x: 9, y: 9,
                targetX: 9, targetY: 9,
                color: '#ff0000',
                name: 'blinky',
                mode: 'scatter',
                scatterTarget: {x: 17, y: 1},
                direction: 'left',
                speed: 0.8,
                frightened: false
            },
            {
                x: 8, y: 10,
                targetX: 8, targetY: 10,
                color: '#00ffff',
                name: 'inky',
                mode: 'house',
                scatterTarget: {x: 17, y: 19},
                direction: 'up',
                speed: 0.75,
                frightened: false,
                exitTimer: 2000
            },
            {
                x: 9, y: 10,
                targetX: 9, targetY: 10,
                color: '#ffb8ff',
                name: 'pinky',
                mode: 'house',
                scatterTarget: {x: 1, y: 1},
                direction: 'down',
                speed: 0.8,
                frightened: false,
                exitTimer: 4000
            },
            {
                x: 10, y: 10,
                targetX: 10, targetY: 10,
                color: '#ffb852',
                name: 'clyde',
                mode: 'house',
                scatterTarget: {x: 1, y: 19},
                direction: 'right',
                speed: 0.7,
                frightened: false,
                exitTimer: 6000
            }
        ];
    }
    
    setupCanvas() {
        // Set canvas size
        this.canvas.width = this.gridSize * this.cellSize;
        this.canvas.height = this.map.length * this.cellSize;
        
        // Scale canvas for mobile
        this.scaleCanvas();
        
        // Handle resize
        window.addEventListener('resize', () => this.scaleCanvas());
    }
    
    scaleCanvas() {
        const container = document.getElementById('canvasWrapper');
        const maxWidth = container.clientWidth - 20;
        const maxHeight = container.clientHeight - 20;
        
        const scaleX = maxWidth / this.canvas.width;
        const scaleY = maxHeight / this.canvas.height;
        const scale = Math.min(scaleX, scaleY, 2); // Max scale of 2x
        
        this.canvas.style.width = `${this.canvas.width * scale}px`;
        this.canvas.style.height = `${this.canvas.height * scale}px`;
        
        // Enable image smoothing for better visuals
        this.ctx.imageSmoothingEnabled = false;
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            switch(e.key) {
                case 'ArrowUp': this.pacman.nextDirection = 'up'; break;
                case 'ArrowDown': this.pacman.nextDirection = 'down'; break;
                case 'ArrowLeft': this.pacman.nextDirection = 'left'; break;
                case 'ArrowRight': this.pacman.nextDirection = 'right'; break;
            }
        });
        
        // Touch button controls
        const buttons = {
            'btnUp': 'up',
            'btnDown': 'down',
            'btnLeft': 'left',
            'btnRight': 'right'
        };
        
        Object.entries(buttons).forEach(([id, direction]) => {
            const btn = document.getElementById(id);
            if (btn) {
                // Touch events for better mobile response
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (this.gameState === 'playing') {
                        this.pacman.nextDirection = direction;
                        btn.classList.add('pressed');
                    }
                });
                
                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    btn.classList.remove('pressed');
                });
                
                // Mouse events for desktop testing
                btn.addEventListener('mousedown', () => {
                    if (this.gameState === 'playing') {
                        this.pacman.nextDirection = direction;
                        btn.classList.add('pressed');
                    }
                });
                
                btn.addEventListener('mouseup', () => {
                    btn.classList.remove('pressed');
                });
            }
        });
        
        // Swipe controls on canvas
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (this.gameState !== 'playing') return;
            
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;
            
            if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    this.pacman.nextDirection = deltaX > 0 ? 'right' : 'left';
                } else {
                    this.pacman.nextDirection = deltaY > 0 ? 'down' : 'up';
                }
            }
        });
    }
    
    startGameLoop() {
        const gameLoop = (currentTime) => {
            if (!this.lastTime) this.lastTime = currentTime;
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            this.accumulator += deltaTime;
            
            while (this.accumulator >= this.tickRate) {
                this.update(this.tickRate);
                this.accumulator -= this.tickRate;
            }
            
            this.render();
            this.animationId = requestAnimationFrame(gameLoop);
        };
        
        this.animationId = requestAnimationFrame(gameLoop);
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update power mode timer
        if (this.powerMode) {
            this.powerTimer -= deltaTime;
            if (this.powerTimer <= 0) {
                this.endPowerMode();
            }
        }
        
        // Update Pac-Man
        this.updatePacman();
        
        // Update ghosts
        this.updateGhosts(deltaTime);
        
        // Check collisions
        this.checkCollisions();
        
        // Check win condition
        if (this.dotsCollected >= this.totalDots) {
            this.nextLevel();
        }
    }
    
    updatePacman() {
        // Try to change direction if requested
        if (this.pacman.nextDirection) {
            const nextPos = this.getNextPosition(
                this.pacman.x,
                this.pacman.y,
                this.pacman.nextDirection
            );
            
            if (this.isValidMove(nextPos.x, nextPos.y)) {
                this.pacman.direction = this.pacman.nextDirection;
                this.pacman.nextDirection = null;
            }
        }
        
        // Move in current direction
        const nextPos = this.getNextPosition(
            this.pacman.x,
            this.pacman.y,
            this.pacman.direction
        );
        
        if (this.isValidMove(nextPos.x, nextPos.y)) {
            this.pacman.x = nextPos.x;
            this.pacman.y = nextPos.y;
            this.pacman.moving = true;
            
            // Animate mouth
            this.pacman.animFrame += this.pacman.animSpeed;
            if (this.pacman.animFrame >= 2) this.pacman.animFrame = 0;
        } else {
            this.pacman.moving = false;
        }
        
        // Wrap around screen edges
        this.pacman.x = (this.pacman.x + this.gridSize) % this.gridSize;
        
        // Collect dots
        const tile = this.map[this.pacman.y][this.pacman.x];
        if (tile === 1) {
            this.map[this.pacman.y][this.pacman.x] = 3;
            this.score += 10;
            this.dotsCollected++;
            this.updateUI();
        } else if (tile === 2) {
            this.map[this.pacman.y][this.pacman.x] = 3;
            this.score += 50;
            this.dotsCollected++;
            this.startPowerMode();
            this.updateUI();
        }
    }
    
    updateGhosts(deltaTime) {
        this.ghosts.forEach(ghost => {
            // Update house exit timer
            if (ghost.mode === 'house' && ghost.exitTimer) {
                ghost.exitTimer -= deltaTime;
                if (ghost.exitTimer <= 0) {
                    ghost.mode = 'scatter';
                    ghost.y = 9;
                }
            }
            
            // Choose target based on mode
            let target;
            if (ghost.frightened) {
                // Random movement when frightened
                target = {
                    x: Math.floor(Math.random() * this.gridSize),
                    y: Math.floor(Math.random() * this.map.length)
                };
            } else if (ghost.mode === 'house') {
                // Move up and down in house
                if (ghost.y <= 9) ghost.direction = 'down';
                if (ghost.y >= 10) ghost.direction = 'up';
                target = {x: ghost.x, y: ghost.y};
            } else if (ghost.mode === 'scatter') {
                target = ghost.scatterTarget;
            } else {
                // Chase mode - target Pac-Man
                target = {x: this.pacman.x, y: this.pacman.y};
            }
            
            // Move towards target
            if (ghost.mode !== 'house') {
                const possibleMoves = this.getPossibleMoves(ghost.x, ghost.y);
                const oppositeDir = this.getOppositeDirection(ghost.direction);
                
                // Filter out opposite direction (no 180 turns)
                const validMoves = possibleMoves.filter(move => move.direction !== oppositeDir);
                
                if (validMoves.length > 0) {
                    // Choose move that gets closest to target
                    let bestMove = validMoves[0];
                    let bestDistance = this.getDistance(validMoves[0], target);
                    
                    for (let move of validMoves) {
                        const distance = this.getDistance(move, target);
                        if (distance < bestDistance) {
                            bestDistance = distance;
                            bestMove = move;
                        }
                    }
                    
                    ghost.direction = bestMove.direction;
                    ghost.x = bestMove.x;
                    ghost.y = bestMove.y;
                }
            } else {
                // Simple movement in house
                const nextPos = this.getNextPosition(ghost.x, ghost.y, ghost.direction);
                if (this.isValidMove(nextPos.x, nextPos.y) || ghost.mode === 'house') {
                    ghost.x = nextPos.x;
                    ghost.y = nextPos.y;
                }
            }
            
            // Wrap around screen edges
            ghost.x = (ghost.x + this.gridSize) % this.gridSize;
        });
    }
    
    getPossibleMoves(x, y) {
        const moves = [];
        const directions = ['up', 'down', 'left', 'right'];
        
        for (let dir of directions) {
            const next = this.getNextPosition(x, y, dir);
            if (this.isValidMove(next.x, next.y)) {
                moves.push({...next, direction: dir});
            }
        }
        
        return moves;
    }
    
    getNextPosition(x, y, direction) {
        switch(direction) {
            case 'up': return {x, y: y - 1};
            case 'down': return {x, y: y + 1};
            case 'left': return {x: x - 1, y};
            case 'right': return {x: x + 1, y};
            default: return {x, y};
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
    
    isValidMove(x, y) {
        // Handle wrap-around
        x = (x + this.gridSize) % this.gridSize;
        
        if (y < 0 || y >= this.map.length) return false;
        if (x < 0 || x >= this.gridSize) return true; // Allow horizontal wrap
        
        return this.map[y][x] !== 0;
    }
    
    getDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    checkCollisions() {
        for (let ghost of this.ghosts) {
            if (ghost.x === this.pacman.x && ghost.y === this.pacman.y) {
                if (ghost.frightened) {
                    // Eat ghost
                    this.ghostsEaten++;
                    this.score += 200 * this.ghostsEaten;
                    ghost.frightened = false;
                    ghost.mode = 'house';
                    ghost.x = 9;
                    ghost.y = 10;
                    ghost.exitTimer = 3000;
                    this.updateUI();
                } else if (ghost.mode !== 'house') {
                    // Pac-Man dies
                    this.loseLife();
                }
            }
        }
    }
    
    startPowerMode() {
        this.powerMode = true;
        this.powerTimer = this.powerDuration;
        this.ghostsEaten = 0;
        
        this.ghosts.forEach(ghost => {
            if (ghost.mode !== 'house') {
                ghost.frightened = true;
                ghost.direction = this.getOppositeDirection(ghost.direction);
            }
        });
    }
    
    endPowerMode() {
        this.powerMode = false;
        this.powerTimer = 0;
        
        this.ghosts.forEach(ghost => {
            ghost.frightened = false;
            if (ghost.mode !== 'house') {
                ghost.mode = 'chase';
            }
        });
    }
    
    loseLife() {
        this.lives--;
        this.updateUI();
        
        if (this.lives <= 0) {
            this.gameOver();
        } else {
            this.resetPositions();
        }
    }
    
    resetPositions() {
        this.pacman.x = 9;
        this.pacman.y = 15;
        this.pacman.direction = 'left';
        this.pacman.nextDirection = null;
        
        this.ghosts[0].x = 9; this.ghosts[0].y = 9;
        this.ghosts[1].x = 8; this.ghosts[1].y = 10;
        this.ghosts[2].x = 9; this.ghosts[2].y = 10;
        this.ghosts[3].x = 10; this.ghosts[3].y = 10;
        
        this.ghosts.forEach(ghost => {
            ghost.frightened = false;
            ghost.mode = ghost.name === 'blinky' ? 'scatter' : 'house';
        });
    }
    
    nextLevel() {
        this.level++;
        this.tickRate = Math.max(60, this.tickRate - 10); // Speed up game
        this.initMap();
        this.resetPositions();
        this.updateUI();
    }
    
    gameOver() {
        this.gameState = 'gameover';
        cancelAnimationFrame(this.animationId);
        
        // Draw game over screen
        setTimeout(() => {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#ffeb3b';
            this.ctx.font = 'bold 24px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = '16px sans-serif';
            this.ctx.fillText(`Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            
            this.ctx.font = '12px sans-serif';
            this.ctx.fillText('Tap to restart', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }, 500);
        
        // Restart on tap
        this.canvas.addEventListener('click', () => location.reload(), {once: true});
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                const tile = this.map[y][x];
                const px = x * this.cellSize;
                const py = y * this.cellSize;
                
                if (tile === 0) {
                    // Wall
                    this.ctx.fillStyle = '#1a1a2e';
                    this.ctx.fillRect(px, py, this.cellSize, this.cellSize);
                    
                    // Add border effect
                    this.ctx.strokeStyle = '#2a2a3e';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(px + 0.5, py + 0.5, this.cellSize - 1, this.cellSize - 1);
                } else if (tile === 1) {
                    // Dot
                    this.ctx.fillStyle = '#ffeb3b';
                    this.ctx.beginPath();
                    this.ctx.arc(px + this.cellSize/2, py + this.cellSize/2, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                } else if (tile === 2) {
                    // Power pellet
                    const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
                    this.ctx.fillStyle = '#ffeb3b';
                    this.ctx.beginPath();
                    this.ctx.arc(px + this.cellSize/2, py + this.cellSize/2, 4 + pulse * 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        // Draw ghosts
        this.ghosts.forEach(ghost => {
            const px = ghost.x * this.cellSize + this.cellSize/2;
            const py = ghost.y * this.cellSize + this.cellSize/2;
            
            if (ghost.frightened) {
                // Frightened ghost
                const flashing = this.powerTimer < 2000 && Math.floor(this.powerTimer / 200) % 2;
                this.ctx.fillStyle = flashing ? '#ffffff' : '#0000ff';
            } else {
                this.ctx.fillStyle = ghost.color;
            }
            
            // Ghost body
            this.ctx.beginPath();
            this.ctx.arc(px, py - 2, this.cellSize/2 - 1, Math.PI, 0, false);
            this.ctx.lineTo(px + this.cellSize/2 - 1, py + this.cellSize/2 - 2);
            
            // Wavy bottom
            for (let i = 0; i < 3; i++) {
                const wx = px + this.cellSize/2 - 1 - (i+1) * (this.cellSize-2)/3;
                const wy = py + this.cellSize/2 - 2 + Math.sin(Date.now() * 0.01 + i) * 2;
                this.ctx.lineTo(wx, wy);
            }
            
            this.ctx.closePath();
            this.ctx.fill();
            
            // Eyes
            if (!ghost.frightened) {
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(px - 3, py - 2, 2, 0, Math.PI * 2);
                this.ctx.arc(px + 3, py - 2, 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#000';
                this.ctx.beginPath();
                this.ctx.arc(px - 3, py - 2, 1, 0, Math.PI * 2);
                this.ctx.arc(px + 3, py - 2, 1, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Frightened eyes
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(px - 4, py - 3, 2, 2);
                this.ctx.fillRect(px + 2, py - 3, 2, 2);
            }
        });
        
        // Draw Pac-Man
        const px = this.pacman.x * this.cellSize + this.cellSize/2;
        const py = this.pacman.y * this.cellSize + this.cellSize/2;
        
        this.ctx.fillStyle = '#ffeb3b';
        this.ctx.beginPath();
        
        const mouthAngle = this.pacman.moving ? Math.abs(Math.sin(this.pacman.animFrame)) * 0.3 : 0.1;
        let startAngle, endAngle;
        
        switch(this.pacman.direction) {
            case 'right':
                startAngle = mouthAngle;
                endAngle = Math.PI * 2 - mouthAngle;
                break;
            case 'left':
                startAngle = Math.PI + mouthAngle;
                endAngle = Math.PI - mouthAngle;
                break;
            case 'up':
                startAngle = Math.PI * 1.5 + mouthAngle;
                endAngle = Math.PI * 1.5 - mouthAngle;
                break;
            case 'down':
                startAngle = Math.PI * 0.5 + mouthAngle;
                endAngle = Math.PI * 0.5 - mouthAngle;
                break;
        }
        
        this.ctx.arc(px, py, this.cellSize/2 - 1, startAngle, endAngle);
        this.ctx.lineTo(px, py);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    updateUI() {
        // Update score
        const scoreElement = document.getElementById('scoreValue');
        if (scoreElement) {
            scoreElement.textContent = this.score.toString().padStart(6, '0');
        }
        
        // Update lives display
        const livesElement = document.getElementById('livesValue');
        if (livesElement) {
            livesElement.textContent = this.level;
        }
        
        // Update life icons
        const lifeIcons = document.querySelectorAll('.life-icon');
        lifeIcons.forEach((icon, index) => {
            icon.style.display = index < this.lives ? 'block' : 'none';
        });
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new MobilePacman();
    
    // Prevent scrolling on mobile
    document.body.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, { passive: false });
    
    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            game.gameState = 'paused';
        } else if (game.gameState === 'paused') {
            game.gameState = 'playing';
        }
    });
});