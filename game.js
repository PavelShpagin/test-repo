// =============================================
// PAC-MAN MOBILE - Modern ES6+ Game Engine
// Optimized for Google Pixel 8 (20:9 ratio)
// =============================================

'use strict';

// Game Configuration
const CONFIG = {
    // Display
    ASPECT_RATIO: 9 / 16, // Portrait mode for mobile
    MAX_WIDTH: 500,
    CELL_SIZE: 16,
    FPS: 60,
    
    // Maze
    MAZE_WIDTH: 19,
    MAZE_HEIGHT: 21,
    
    // Game mechanics
    PACMAN_SPEED: 0.15,
    GHOST_SPEED: 0.12,
    FRIGHTENED_SPEED: 0.08,
    POWER_DURATION: 6000,
    
    // Scoring
    DOT_SCORE: 10,
    POWER_PELLET_SCORE: 50,
    GHOST_SCORES: [200, 400, 800, 1600],
    FRUIT_SCORES: [100, 300, 500, 700, 1000, 2000, 3000, 5000],
    
    // Mobile specific
    SWIPE_THRESHOLD: 30,
    TAP_THRESHOLD: 10,
    VIBRATION_ENABLED: true,
    VIBRATION_PATTERNS: {
        eat: [10],
        powerUp: [20, 10, 20],
        death: [100, 30, 100],
        levelComplete: [50, 50, 50, 50, 50]
    }
};

// Game State Manager
class GameState {
    constructor() {
        this.reset();
    }
    
    reset() {
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('pacmanHighScore') || '0');
        this.lives = 3;
        this.level = 1;
        this.state = 'menu'; // menu, playing, paused, gameover, levelcomplete
        this.dots = 0;
        this.totalDots = 0;
        this.powerMode = false;
        this.powerTimer = 0;
        this.ghostsEaten = 0;
        this.combo = 0;
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.lastUpdate = 0;
    }
    
    addScore(points) {
        this.score += points;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('pacmanHighScore', this.highScore.toString());
            return true; // New high score
        }
        return false;
    }
    
    nextLevel() {
        this.level++;
        this.powerMode = false;
        this.powerTimer = 0;
        this.ghostsEaten = 0;
        this.combo = 0;
    }
}

// Mobile-optimized Maze
class Maze {
    constructor() {
        // Compact maze for mobile screens
        this.layout = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,3,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,3,1],
            [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
            [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
            [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
            [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
            [1,1,1,1,2,1,0,1,4,4,4,1,0,1,2,1,1,1,1],
            [0,0,0,0,2,0,0,1,4,4,4,1,0,0,2,0,0,0,0],
            [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
            [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
            [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
            [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
            [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
            [1,3,2,1,2,2,2,2,2,2,2,2,2,2,2,1,2,3,1],
            [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
            [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
            [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
            [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        
        // Legend: 0=empty, 1=wall, 2=dot, 3=power, 4=ghost house
        this.width = this.layout[0].length;
        this.height = this.layout.length;
        this.grid = [];
        this.reset();
    }
    
    reset() {
        this.grid = this.layout.map(row => [...row]);
        this.totalDots = 0;
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === 2 || this.grid[y][x] === 3) {
                    this.totalDots++;
                }
            }
        }
    }
    
    getCell(x, y) {
        x = Math.floor(x);
        y = Math.floor(y);
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return 1; // Wall
        }
        return this.grid[y][x];
    }
    
    setCell(x, y, value) {
        x = Math.floor(x);
        y = Math.floor(y);
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[y][x] = value;
        }
    }
    
    isWall(x, y) {
        return this.getCell(x, y) === 1;
    }
    
    canMove(x, y) {
        return !this.isWall(x, y);
    }
}

// Entity Base Class
class Entity {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = null;
        this.animationFrame = 0;
        this.moving = false;
    }
    
    update(deltaTime, maze) {
        if (!this.moving && !this.nextDirection) return;
        
        // Try to change direction if requested
        if (this.nextDirection) {
            const nextX = this.x + this.nextDirection.x * 0.5;
            const nextY = this.y + this.nextDirection.y * 0.5;
            
            if (maze.canMove(nextX, nextY)) {
                this.direction = this.nextDirection;
                this.nextDirection = null;
                this.moving = true;
            }
        }
        
        // Move in current direction
        if (this.moving) {
            const moveDistance = this.speed * deltaTime;
            const nextX = this.x + this.direction.x * moveDistance;
            const nextY = this.y + this.direction.y * moveDistance;
            
            if (maze.canMove(nextX, nextY)) {
                this.x = nextX;
                this.y = nextY;
                
                // Wrap around edges
                if (this.x < 0) this.x = maze.width - 1;
                if (this.x >= maze.width) this.x = 0;
            } else {
                // Snap to grid
                this.x = Math.round(this.x);
                this.y = Math.round(this.y);
                this.moving = false;
            }
        }
        
        this.animationFrame++;
    }
    
    setDirection(dx, dy) {
        this.nextDirection = { x: dx, y: dy };
    }
    
    getGridPosition() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y)
        };
    }
}

// Pac-Man Class
class PacMan extends Entity {
    constructor() {
        super(9, 15, CONFIG.PACMAN_SPEED);
        this.mouthOpen = true;
        this.mouthTimer = 0;
        this.deathAnimation = 0;
        this.isDead = false;
    }
    
    update(deltaTime, maze) {
        if (this.isDead) {
            this.deathAnimation += deltaTime * 0.01;
            return;
        }
        
        super.update(deltaTime, maze);
        
        // Animate mouth
        this.mouthTimer += deltaTime * 0.01;
        this.mouthOpen = Math.sin(this.mouthTimer * 10) > 0;
    }
    
    reset() {
        this.x = 9;
        this.y = 15;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = null;
        this.moving = false;
        this.isDead = false;
        this.deathAnimation = 0;
    }
    
    die() {
        this.isDead = true;
        this.deathAnimation = 0;
        this.moving = false;
    }
}

// Ghost Class
class Ghost extends Entity {
    constructor(name, x, y, color, scatterTarget) {
        super(x, y, CONFIG.GHOST_SPEED);
        this.name = name;
        this.startX = x;
        this.startY = y;
        this.color = color;
        this.scatterTarget = scatterTarget;
        this.mode = 'scatter'; // scatter, chase, frightened, eaten
        this.inHouse = true;
        this.dotCounter = 0;
        this.frightenedTimer = 0;
        this.pathfindingTimer = 0;
    }
    
    update(deltaTime, maze, pacman, gameState) {
        // Update frightened mode
        if (this.mode === 'frightened') {
            this.frightenedTimer -= deltaTime;
            if (this.frightenedTimer <= 0) {
                this.mode = 'chase';
                this.speed = CONFIG.GHOST_SPEED;
            }
        }
        
        // Exit ghost house
        if (this.inHouse) {
            if (this.shouldExitHouse(gameState)) {
                this.exitHouse();
            }
            return;
        }
        
        // Pathfinding
        this.pathfindingTimer += deltaTime;
        if (this.pathfindingTimer > 200) { // Update path every 200ms
            this.pathfindingTimer = 0;
            this.updatePath(maze, pacman);
        }
        
        super.update(deltaTime, maze);
    }
    
    shouldExitHouse(gameState) {
        const thresholds = {
            'blinky': 0,
            'pinky': 30,
            'inky': 60,
            'clyde': 90
        };
        return gameState.dots >= (thresholds[this.name] || 0);
    }
    
    exitHouse() {
        this.inHouse = false;
        this.y = 9;
        this.x = 9;
        this.direction = { x: 0, y: -1 };
    }
    
    updatePath(maze, pacman) {
        if (this.mode === 'frightened') {
            // Random movement when frightened
            const directions = [
                { x: 0, y: -1 },
                { x: 0, y: 1 },
                { x: -1, y: 0 },
                { x: 1, y: 0 }
            ];
            const valid = directions.filter(d => 
                maze.canMove(this.x + d.x, this.y + d.y)
            );
            if (valid.length > 0) {
                const chosen = valid[Math.floor(Math.random() * valid.length)];
                this.setDirection(chosen.x, chosen.y);
            }
        } else {
            // Simple pathfinding towards target
            let target;
            if (this.mode === 'scatter') {
                target = this.scatterTarget;
            } else if (this.mode === 'eaten') {
                target = { x: 9, y: 9 }; // Ghost house
            } else {
                target = pacman.getGridPosition();
            }
            
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.setDirection(Math.sign(dx), 0);
            } else {
                this.setDirection(0, Math.sign(dy));
            }
        }
    }
    
    frighten() {
        if (this.mode !== 'eaten') {
            this.mode = 'frightened';
            this.frightenedTimer = CONFIG.POWER_DURATION;
            this.speed = CONFIG.FRIGHTENED_SPEED;
            // Reverse direction
            this.direction.x *= -1;
            this.direction.y *= -1;
        }
    }
    
    eat() {
        this.mode = 'eaten';
        this.speed = CONFIG.GHOST_SPEED * 2;
    }
    
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.direction = { x: 0, y: -1 };
        this.mode = 'scatter';
        this.inHouse = true;
        this.frightenedTimer = 0;
        this.speed = CONFIG.GHOST_SPEED;
    }
}

// Load remaining modules
import('./game-renderer.js').then(module => {
    window.Renderer = module.Renderer;
});

import('./game-controls.js').then(module => {
    window.TouchControls = module.TouchControls;
    window.SoundManager = module.SoundManager;
});

import('./game-engine.js').then(module => {
    window.GameEngine = module.GameEngine;
    // Initialize game
    window.gameEngine = new module.GameEngine();
});

// Export classes for modules
window.CONFIG = CONFIG;
window.GameState = GameState;
window.Maze = Maze;
window.Entity = Entity;
window.PacMan = PacMan;
window.Ghost = Ghost;