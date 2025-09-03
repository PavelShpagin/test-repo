// Simplified Pacman - Just movement and board
class SimplifiedPacman {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
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
        
        // Setup canvas
        this.setupCanvas();
        
        // Setup controls
        this.setupControls();
        
        // Start animation loop
        this.animationRunning = true;
        this.gameLoop();
    }
    
    initializeMap() {
        // Create base map layout - just walls (1) and empty spaces (0)
        this.map = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
            [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
            [1,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,1],
            [0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0],
            [1,1,1,1,0,1,0,1,1,0,1,1,0,1,0,1,1,1,1],
            [1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1],
            [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
            [0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0],
            [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
            [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
            [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
            [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
            [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
            [1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
    }
    
    setupCanvas() {
        this.canvas.width = this.cols * this.cellSize;
        this.canvas.height = this.rows * this.cellSize;
        
        // Handle responsive sizing
        const maxWidth = Math.min(window.innerWidth - 40, 500);
        if (this.canvas.width > maxWidth) {
            const scale = maxWidth / this.canvas.width;
            this.canvas.style.width = `${this.canvas.width * scale}px`;
            this.canvas.style.height = `${this.canvas.height * scale}px`;
        }
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowUp':
                    this.pacman.nextDirection = 'up';
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                    this.pacman.nextDirection = 'down';
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                    this.pacman.nextDirection = 'left';
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    this.pacman.nextDirection = 'right';
                    e.preventDefault();
                    break;
            }
        });
        
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
        
        // Remove pause button functionality since there's no game to pause
        const pauseBtn = document.getElementById('btnPause');
        if (pauseBtn) {
            pauseBtn.style.display = 'none';
        }
    }
    
    canMove(x, y, direction) {
        const [dx, dy] = this.getDirectionDelta(direction);
        const newX = x + dx;
        const newY = y + dy;
        
        // Check boundaries
        if (newY < 0 || newY >= this.rows) return false;
        
        // Allow wrapping on x-axis
        const wrappedX = (newX < 0) ? this.cols - 1 : (newX >= this.cols) ? 0 : newX;
        
        // Check if it's a wall
        return this.map[newY][wrappedX] !== 1;
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
    
    gameLoop() {
        if (!this.animationRunning) return;
        
        this.update();
        this.render();
        
        setTimeout(() => this.gameLoop(), 150); // Fixed update rate
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
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
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
                }
            }
        }
        
        // Draw Pacman
        this.drawPacman();
    }
    
    drawPacman() {
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
        
        // Eye
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(px - 2, py - 4, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.simplifiedPacman = new SimplifiedPacman();
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