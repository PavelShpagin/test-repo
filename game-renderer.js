// Renderer Module for Pac-Man Mobile

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.setupCanvas();
    }
    
    setupCanvas() {
        // Set canvas size based on container
        const resizeCanvas = () => {
            const container = this.canvas.parentElement;
            const rect = container.getBoundingClientRect();
            
            // Calculate size maintaining aspect ratio
            let width = rect.width;
            let height = rect.height;
            
            if (width / height > window.CONFIG.ASPECT_RATIO) {
                width = height * window.CONFIG.ASPECT_RATIO;
            } else {
                height = width / window.CONFIG.ASPECT_RATIO;
            }
            
            // Set canvas resolution
            this.canvas.width = window.CONFIG.MAZE_WIDTH * window.CONFIG.CELL_SIZE;
            this.canvas.height = window.CONFIG.MAZE_HEIGHT * window.CONFIG.CELL_SIZE;
            
            // Set display size
            this.canvas.style.width = `${width}px`;
            this.canvas.style.height = `${height}px`;
            
            // Enable image smoothing for better mobile display
            this.ctx.imageSmoothingEnabled = false;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', resizeCanvas);
    }
    
    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawMaze(maze) {
        const cellSize = window.CONFIG.CELL_SIZE;
        
        for (let y = 0; y < maze.height; y++) {
            for (let x = 0; x < maze.width; x++) {
                const cell = maze.getCell(x, y);
                const px = x * cellSize;
                const py = y * cellSize;
                
                switch(cell) {
                    case 1: // Wall
                        this.drawWall(px, py, cellSize, maze, x, y);
                        break;
                    case 2: // Dot
                        this.drawDot(px + cellSize/2, py + cellSize/2, 2);
                        break;
                    case 3: // Power pellet
                        this.drawPowerPellet(px + cellSize/2, py + cellSize/2);
                        break;
                    case 4: // Ghost house
                        this.ctx.fillStyle = '#1a1a2e';
                        this.ctx.fillRect(px, py, cellSize, cellSize);
                        break;
                }
            }
        }
    }
    
    drawWall(x, y, size, maze, gridX, gridY) {
        this.ctx.fillStyle = '#2121DE';
        this.ctx.strokeStyle = '#4141FF';
        this.ctx.lineWidth = 2;
        
        // Smart wall drawing based on neighbors
        const hasTop = gridY > 0 && maze.isWall(gridX, gridY - 1);
        const hasBottom = gridY < maze.height - 1 && maze.isWall(gridX, gridY + 1);
        const hasLeft = gridX > 0 && maze.isWall(gridX - 1, gridY);
        const hasRight = gridX < maze.width - 1 && maze.isWall(gridX + 1, gridY);
        
        this.ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
        
        this.ctx.beginPath();
        if (!hasTop) this.ctx.moveTo(x, y), this.ctx.lineTo(x + size, y);
        if (!hasRight) this.ctx.moveTo(x + size, y), this.ctx.lineTo(x + size, y + size);
        if (!hasBottom) this.ctx.moveTo(x + size, y + size), this.ctx.lineTo(x, y + size);
        if (!hasLeft) this.ctx.moveTo(x, y + size), this.ctx.lineTo(x, y);
        this.ctx.stroke();
    }
    
    drawDot(x, y, radius) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawPowerPellet(x, y) {
        const radius = 5 + Math.sin(Date.now() * 0.005) * 2;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    drawPacMan(pacman) {
        const x = pacman.x * window.CONFIG.CELL_SIZE + window.CONFIG.CELL_SIZE / 2;
        const y = pacman.y * window.CONFIG.CELL_SIZE + window.CONFIG.CELL_SIZE / 2;
        const radius = window.CONFIG.CELL_SIZE / 2 - 2;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // Rotate based on direction
        let angle = 0;
        if (pacman.direction.x > 0) angle = 0;
        else if (pacman.direction.x < 0) angle = Math.PI;
        else if (pacman.direction.y > 0) angle = Math.PI / 2;
        else if (pacman.direction.y < 0) angle = -Math.PI / 2;
        
        this.ctx.rotate(angle);
        
        if (pacman.isDead) {
            // Death animation
            const deathAngle = Math.min(pacman.deathAnimation, Math.PI);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, deathAngle, Math.PI * 2 - deathAngle);
            this.ctx.lineTo(0, 0);
            this.ctx.fill();
        } else {
            // Normal animation
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            
            const mouthAngle = pacman.mouthOpen ? 0.3 : 0.1;
            this.ctx.arc(0, 0, radius, mouthAngle * Math.PI, (2 - mouthAngle) * Math.PI);
            this.ctx.lineTo(0, 0);
            this.ctx.fill();
            
            // Eye
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(-2, -radius/2, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    drawGhost(ghost) {
        const x = ghost.x * window.CONFIG.CELL_SIZE + window.CONFIG.CELL_SIZE / 2;
        const y = ghost.y * window.CONFIG.CELL_SIZE + window.CONFIG.CELL_SIZE / 2;
        const radius = window.CONFIG.CELL_SIZE / 2 - 1;
        
        this.ctx.save();
        
        // Ghost body color
        if (ghost.mode === 'frightened') {
            const flashing = ghost.frightenedTimer < 2000 && Math.floor(ghost.frightenedTimer / 200) % 2;
            this.ctx.fillStyle = flashing ? '#FFFFFF' : '#0000FF';
        } else if (ghost.mode === 'eaten') {
            this.ctx.fillStyle = 'transparent';
        } else {
            this.ctx.fillStyle = ghost.color;
        }
        
        if (ghost.mode !== 'eaten') {
            // Body
            this.ctx.beginPath();
            this.ctx.arc(x, y - radius/4, radius, Math.PI, 0, false);
            this.ctx.lineTo(x + radius, y + radius/2);
            
            // Wavy bottom
            const waves = 3;
            const waveWidth = (radius * 2) / waves;
            for (let i = waves; i >= 0; i--) {
                const waveX = x - radius + i * waveWidth;
                const waveY = y + radius/2 + Math.sin((Date.now() * 0.005 + i) * 2) * 2;
                if (i === waves) {
                    this.ctx.lineTo(waveX, waveY);
                } else {
                    const cp1x = waveX + waveWidth/2;
                    const cp1y = y + radius/2 - 3;
                    this.ctx.quadraticCurveTo(cp1x, cp1y, waveX, waveY);
                }
            }
            
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Eyes
        if (ghost.mode !== 'frightened' || ghost.frightenedTimer > 2000) {
            // Normal eyes
            this.ctx.fillStyle = '#FFF';
            this.ctx.beginPath();
            this.ctx.arc(x - radius/3, y - radius/4, radius/4, 0, Math.PI * 2);
            this.ctx.arc(x + radius/3, y - radius/4, radius/4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Pupils
            this.ctx.fillStyle = '#000';
            const pupilX = ghost.direction.x * radius/8;
            const pupilY = ghost.direction.y * radius/8;
            this.ctx.beginPath();
            this.ctx.arc(x - radius/3 + pupilX, y - radius/4 + pupilY, radius/8, 0, Math.PI * 2);
            this.ctx.arc(x + radius/3 + pupilX, y - radius/4 + pupilY, radius/8, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Frightened eyes
            this.ctx.fillStyle = '#FFF';
            this.ctx.fillRect(x - radius/3 - 2, y - radius/4 - 1, 4, 2);
            this.ctx.fillRect(x + radius/3 - 2, y - radius/4 - 1, 4, 2);
        }
        
        this.ctx.restore();
    }
    
    drawScore(score, x, y, size = 12) {
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = `${size}px 'Press Start 2P', monospace`;
        this.ctx.fillText(score.toString(), x, y);
    }
    
    drawText(text, x, y, color = '#FFF', size = 12) {
        this.ctx.fillStyle = color;
        this.ctx.font = `${size}px 'Press Start 2P', monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, x, y);
        this.ctx.textAlign = 'left';
    }
}