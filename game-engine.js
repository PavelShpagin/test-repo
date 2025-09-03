// Main Game Engine Module for Pac-Man Mobile

// Main Game Engine
export class GameEngine {
    constructor() {
        this.state = new window.GameState();
        this.maze = new window.Maze();
        this.pacman = new window.PacMan();
        this.ghosts = this.createGhosts();
        this.renderer = null;
        this.touchControls = null;
        this.soundManager = new window.SoundManager();
        
        this.lastFrameTime = 0;
        this.accumulator = 0;
        this.frameTime = 1000 / window.CONFIG.FPS;
        
        this.init();
    }
    
    createGhosts() {
        return [
            new window.Ghost('blinky', 9, 9, '#FF0000', { x: 18, y: 0 }),
            new window.Ghost('pinky', 8, 10, '#FFB8FF', { x: 0, y: 0 }),
            new window.Ghost('inky', 9, 10, '#00FFFF', { x: 18, y: 20 }),
            new window.Ghost('clyde', 10, 10, '#FFB851', { x: 0, y: 20 })
        ];
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupGame());
        } else {
            this.setupGame();
        }
    }
    
    setupGame() {
        const canvas = document.getElementById('gameCanvas');
        this.renderer = new window.Renderer(canvas);
        this.touchControls = new window.TouchControls(this);
        
        this.setupUI();
        this.hideLoadingScreen();
        this.showMenu();
        
        // Start game loop
        this.gameLoop(0);
    }
    
    setupUI() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Pause button
        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (this.state.state === 'playing') {
                this.pause();
            } else if (this.state.state === 'paused') {
                this.resume();
            }
        });
        
        // Resume button
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resume();
        });
        
        // Menu buttons
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.showMenu();
        });
        
        document.getElementById('menuBtn2').addEventListener('click', () => {
            this.showMenu();
        });
        
        // Play again button
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        // Next level button
        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            this.nextLevel();
        });
        
        // Sound toggle
        document.getElementById('soundBtn').addEventListener('click', () => {
            const enabled = this.soundManager.toggle();
            const icon = document.querySelector('#soundBtn svg');
            if (!enabled) {
                icon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
            } else {
                icon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
            }
        });
        
        // Fullscreen toggle
        document.getElementById('fullscreenBtn').addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Update high score display
        document.getElementById('highScore').textContent = this.state.highScore;
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500);
    }
    
    showMenu() {
        this.state.state = 'menu';
        this.hideAllOverlays();
        document.getElementById('gameMenu').classList.add('active');
    }
    
    hideAllOverlays() {
        document.querySelectorAll('.game-overlay').forEach(overlay => {
            overlay.classList.remove('active');
        });
    }
    
    startGame() {
        this.hideAllOverlays();
        this.state.reset();
        this.maze.reset();
        this.pacman.reset();
        this.ghosts.forEach(ghost => ghost.reset());
        this.state.totalDots = this.maze.totalDots;
        this.state.state = 'playing';
        
        this.updateUI();
    }
    
    pause() {
        if (this.state.state === 'playing') {
            this.state.state = 'paused';
            document.getElementById('gamePaused').classList.add('active');
        }
    }
    
    resume() {
        if (this.state.state === 'paused') {
            this.state.state = 'playing';
            this.hideAllOverlays();
        }
    }
    
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        if (this.state.state === 'playing') {
            this.accumulator += deltaTime;
            
            while (this.accumulator >= this.frameTime) {
                this.update(this.frameTime);
                this.accumulator -= this.frameTime;
            }
        }
        
        this.render();
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    update(deltaTime) {
        // Update Pac-Man
        this.pacman.update(deltaTime, this.maze);
        
        // Check for dot collection
        const pos = this.pacman.getGridPosition();
        const cell = this.maze.getCell(pos.x, pos.y);
        
        if (cell === 2) { // Regular dot
            this.maze.setCell(pos.x, pos.y, 0);
            this.state.dots++;
            this.state.addScore(window.CONFIG.DOT_SCORE);
            this.soundManager.play('eat');
            this.touchControls.vibrate('eat');
        } else if (cell === 3) { // Power pellet
            this.maze.setCell(pos.x, pos.y, 0);
            this.state.dots++;
            this.state.powerMode = true;
            this.state.powerTimer = window.CONFIG.POWER_DURATION;
            this.state.ghostsEaten = 0;
            this.state.addScore(window.CONFIG.POWER_PELLET_SCORE);
            
            // Frighten all ghosts
            this.ghosts.forEach(ghost => ghost.frighten());
            
            this.soundManager.play('powerUp');
            this.touchControls.vibrate('powerUp');
        }
        
        // Update power mode
        if (this.state.powerMode) {
            this.state.powerTimer -= deltaTime;
            if (this.state.powerTimer <= 0) {
                this.state.powerMode = false;
                this.ghosts.forEach(ghost => {
                    if (ghost.mode === 'frightened') {
                        ghost.mode = 'chase';
                        ghost.speed = window.CONFIG.GHOST_SPEED;
                    }
                });
            }
        }
        
        // Update ghosts
        this.ghosts.forEach(ghost => {
            ghost.update(deltaTime, this.maze, this.pacman, this.state);
            
            // Check collision with Pac-Man
            const dx = Math.abs(ghost.x - this.pacman.x);
            const dy = Math.abs(ghost.y - this.pacman.y);
            
            if (dx < 0.5 && dy < 0.5 && !this.pacman.isDead) {
                if (ghost.mode === 'frightened') {
                    // Eat ghost
                    ghost.eat();
                    const score = window.CONFIG.GHOST_SCORES[Math.min(this.state.ghostsEaten, 3)];
                    this.state.addScore(score);
                    this.state.ghostsEaten++;
                    this.soundManager.play('eatGhost');
                    this.touchControls.vibrate('powerUp');
                } else if (ghost.mode !== 'eaten') {
                    // Pac-Man dies
                    this.pacman.die();
                    this.soundManager.play('death');
                    this.touchControls.vibrate('death');
                    
                    setTimeout(() => {
                        this.state.lives--;
                        if (this.state.lives <= 0) {
                            this.gameOver();
                        } else {
                            this.resetLevel();
                        }
                    }, 2000);
                }
            }
        });
        
        // Check for level complete
        if (this.state.dots >= this.state.totalDots) {
            this.levelComplete();
        }
        
        this.updateUI();
    }
    
    render() {
        this.renderer.clear();
        this.renderer.drawMaze(this.maze);
        this.renderer.drawPacMan(this.pacman);
        this.ghosts.forEach(ghost => this.renderer.drawGhost(ghost));
        
        // Draw HUD on canvas
        if (this.state.state === 'playing') {
            this.renderer.drawText(`L${this.state.level}`, 20, 20, '#FFD700', 10);
            
            if (this.state.powerMode) {
                const timeLeft = Math.ceil(this.state.powerTimer / 1000);
                this.renderer.drawText(`POWER: ${timeLeft}`, 
                    this.renderer.canvas.width / 2, 
                    20, '#00FFFF', 10);
            }
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.state.score.toString().padStart(6, '0');
        document.getElementById('level').textContent = this.state.level;
        
        // Update lives display
        const livesDisplay = document.getElementById('livesDisplay');
        livesDisplay.innerHTML = '';
        for (let i = 0; i < this.state.lives; i++) {
            const life = document.createElement('span');
            life.className = 'life-icon';
            life.textContent = '🟡';
            livesDisplay.appendChild(life);
        }
    }
    
    resetLevel() {
        this.pacman.reset();
        this.ghosts.forEach(ghost => ghost.reset());
        this.state.powerMode = false;
        this.state.powerTimer = 0;
    }
    
    levelComplete() {
        this.state.state = 'levelcomplete';
        const bonus = 1000 * this.state.level;
        this.state.addScore(bonus);
        
        document.getElementById('completedLevel').textContent = this.state.level;
        document.getElementById('levelBonus').textContent = bonus;
        document.getElementById('levelComplete').classList.add('active');
        
        this.soundManager.play('levelComplete');
        this.touchControls.vibrate('levelComplete');
    }
    
    nextLevel() {
        this.hideAllOverlays();
        this.state.nextLevel();
        this.maze.reset();
        this.pacman.reset();
        this.ghosts.forEach(ghost => ghost.reset());
        this.state.totalDots = this.maze.totalDots;
        this.state.dots = 0;
        this.state.state = 'playing';
    }
    
    gameOver() {
        this.state.state = 'gameover';
        
        const isHighScore = this.state.score === this.state.highScore;
        document.getElementById('gameOverTitle').textContent = 
            isHighScore ? 'NEW HIGH SCORE!' : 'GAME OVER';
        document.getElementById('finalScore').textContent = this.state.score;
        document.getElementById('newHighScore').classList.toggle('hidden', !isHighScore);
        document.getElementById('gameOver').classList.add('active');
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
}