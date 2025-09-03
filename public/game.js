/*
  Pac-Man JS – Production-Ready Version
  Optimized for mobile and desktop with perfect alignment and AI
*/

(function() {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const livesEl = document.getElementById('lives');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  
  // Game constants
  const COLS = 19;
  const ROWS = 21;
  const TILE_SIZE = 30;
  
  // Set canvas size
  canvas.width = COLS * TILE_SIZE;
  canvas.height = ROWS * TILE_SIZE;
  
  // Tile types
  const WALL = '#';
  const DOT = '.';
  const POWER = 'o';
  const EMPTY = ' ';
  const GATE = '-';
  
  // Game state
  const game = {
    score: 0,
    level: 1,
    lives: 3,
    running: false,
    paused: false,
    dotsRemaining: 0,
    frightenedMode: false,
    frightenedTimer: 0,
    gameStarted: false,
    combo: 0,
    lastDotTime: 0,
    fruitActive: false,
    fruitTimer: 0,
    fruitPosition: null,
    highScore: parseInt(localStorage.getItem('pacmanHighScore') || '0')
  };
  
  // Sound system
  let audioContext = null;
  const sounds = {
    dot: { freq: 440, duration: 50 },
    powerPellet: { freq: 880, duration: 100 },
    eatGhost: { freq: 220, duration: 200 },
    death: { freq: 110, duration: 500 },
    fruit: { freq: 660, duration: 150 }
  };
  
  // Maze layout
  const MAZE = [
    '###################',
    '#........#........#',
    '#o##.###.#.###.##o#',
    '#.................#',
    '#.##.#.#####.#.##.#',
    '#....#...#...#....#',
    '####.###.#.###.####',
    '   #.#.......#.#   ',
    '####.#.##-##.#.####',
    '#......#   #......#',
    '#.##.#.#####.#.##.#',
    '#....#.......#....#',
    '####.#.#####.#.####',
    '#........#........#',
    '#.##.###.#.###.##.#',
    '#..#.....#.....#..#',
    '##.#.#.#####.#.#.##',
    '#....#...#...#....#',
    '#.######.#.######.#',
    '#o................o#',
    '###################'
  ];
  
  // Grid system
  class Grid {
    constructor() {
      this.cells = [];
      this.reset();
    }
    
    reset() {
      this.cells = [];
      game.dotsRemaining = 0;
      
      for (let y = 0; y < ROWS; y++) {
        this.cells[y] = [];
        for (let x = 0; x < COLS; x++) {
          const char = MAZE[y][x];
          this.cells[y][x] = char;
          if (char === DOT || char === POWER) {
            game.dotsRemaining++;
          }
        }
      }
    }
    
    get(x, y) {
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return WALL;
      return this.cells[y][x];
    }
    
    set(x, y, value) {
      if (x >= 0 && x < COLS && y >= 0 && y < ROWS) {
        this.cells[y][x] = value;
      }
    }
    
    isWalkable(x, y) {
      const cell = this.get(x, y);
      return cell !== WALL;
    }
    
    isGhostWalkable(x, y) {
      const cell = this.get(x, y);
      return cell !== WALL;
    }
  }
  
  const grid = new Grid();
  
  // Direction vectors
  const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 },
    NONE: { x: 0, y: 0 }
  };
  
  // Entity base class
  class Entity {
    constructor(gridX, gridY) {
      this.gridX = gridX;
      this.gridY = gridY;
      this.x = gridX * TILE_SIZE + TILE_SIZE / 2;
      this.y = gridY * TILE_SIZE + TILE_SIZE / 2;
      this.direction = DIRECTIONS.NONE;
      this.nextDirection = DIRECTIONS.NONE;
      this.speed = 2;
      this.moveProgress = 0;
      this.targetX = this.x;
      this.targetY = this.y;
      this.moving = false;
    }
    
    setDirection(dir) {
      this.nextDirection = dir;
    }
    
    canMove(dir, x, y) {
      const nextX = x + dir.x;
      const nextY = y + dir.y;
      return grid.isWalkable(nextX, nextY);
    }
    
    update(deltaTime) {
      // Try to change direction at grid intersection
      if (!this.moving && this.nextDirection !== DIRECTIONS.NONE) {
        if (this.canMove(this.nextDirection, this.gridX, this.gridY)) {
          this.direction = this.nextDirection;
          this.nextDirection = DIRECTIONS.NONE;
        }
      }
      
      // Start new movement if at grid position
      if (!this.moving && this.direction !== DIRECTIONS.NONE) {
        const nextGridX = this.gridX + this.direction.x;
        const nextGridY = this.gridY + this.direction.y;
        
        // Handle tunnel wrapping
        if (nextGridX < 0) {
          this.gridX = COLS - 1;
          this.x = this.gridX * TILE_SIZE + TILE_SIZE / 2;
          this.targetX = this.x;
        } else if (nextGridX >= COLS) {
          this.gridX = 0;
          this.x = this.gridX * TILE_SIZE + TILE_SIZE / 2;
          this.targetX = this.x;
        } else if (this.canMove(this.direction, this.gridX, this.gridY)) {
          this.gridX = nextGridX;
          this.gridY = nextGridY;
          this.targetX = this.gridX * TILE_SIZE + TILE_SIZE / 2;
          this.targetY = this.gridY * TILE_SIZE + TILE_SIZE / 2;
          this.moving = true;
          this.moveProgress = 0;
        } else {
          this.direction = DIRECTIONS.NONE;
        }
      }
      
      // Continue movement
      if (this.moving) {
        this.moveProgress += this.speed * deltaTime * 60;
        
        if (this.moveProgress >= 1) {
          this.x = this.targetX;
          this.y = this.targetY;
          this.moving = false;
          this.moveProgress = 0;
        } else {
          // Smooth interpolation
          const startX = (this.gridX - this.direction.x) * TILE_SIZE + TILE_SIZE / 2;
          const startY = (this.gridY - this.direction.y) * TILE_SIZE + TILE_SIZE / 2;
          this.x = startX + (this.targetX - startX) * this.moveProgress;
          this.y = startY + (this.targetY - startY) * this.moveProgress;
        }
      }
    }
  }
  
  // Pac-Man class
  class PacMan extends Entity {
    constructor() {
      super(9, 15);
      this.animFrame = 0;
      this.mouthOpen = true;
      this.isDying = false;
      this.deathAnimation = 0;
      this.speed = 2.5;
    }
    
    update(deltaTime) {
      if (this.isDying) {
        this.deathAnimation += deltaTime * 2;
        if (this.deathAnimation >= 1) {
          this.isDying = false;
          this.deathAnimation = 0;
          resetLevel();
        }
        return;
      }
      
      super.update(deltaTime);
      
      // Animate mouth
      this.animFrame += deltaTime * 10;
      if (this.animFrame >= 1) {
        this.animFrame = 0;
        this.mouthOpen = !this.mouthOpen;
      }
      
      // Check for dot collection
      const cell = grid.get(this.gridX, this.gridY);
      if (cell === DOT) {
        grid.set(this.gridX, this.gridY, EMPTY);
        game.score += 10;
        game.dotsRemaining--;
        playSound('dot');
        
        // Combo system
        const now = Date.now();
        if (now - game.lastDotTime < 500) {
          game.combo = Math.min(game.combo + 1, 10);
          game.score += game.combo * 5;
        } else {
          game.combo = 1;
        }
        game.lastDotTime = now;
        
        if (game.dotsRemaining === 0) {
          nextLevel();
        }
      } else if (cell === POWER) {
        grid.set(this.gridX, this.gridY, EMPTY);
        game.score += 50;
        game.dotsRemaining--;
        playSound('powerPellet');
        activateFrightenedMode();
        
        if (game.dotsRemaining === 0) {
          nextLevel();
        }
      }
      
      // Check fruit collection
      if (game.fruitActive && game.fruitPosition &&
          this.gridX === game.fruitPosition.x && 
          this.gridY === game.fruitPosition.y) {
        game.score += 100 * game.level;
        game.fruitActive = false;
        game.fruitPosition = null;
        playSound('fruit');
      }
    }
    
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      
      if (this.isDying) {
        // Death animation
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        const angle = Math.PI * 2 * (1 - this.deathAnimation);
        ctx.arc(0, 0, TILE_SIZE * 0.4, 0, angle);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
      } else {
        // Rotate based on direction
        let rotation = 0;
        if (this.direction === DIRECTIONS.RIGHT) rotation = 0;
        else if (this.direction === DIRECTIONS.DOWN) rotation = Math.PI / 2;
        else if (this.direction === DIRECTIONS.LEFT) rotation = Math.PI;
        else if (this.direction === DIRECTIONS.UP) rotation = -Math.PI / 2;
        
        ctx.rotate(rotation);
        
        // Draw Pac-Man
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        
        if (this.mouthOpen && this.moving) {
          ctx.arc(0, 0, TILE_SIZE * 0.4, 0.2 * Math.PI, 1.8 * Math.PI);
        } else {
          ctx.arc(0, 0, TILE_SIZE * 0.4, 0, 2 * Math.PI);
        }
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        
        // Draw eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-3, -6, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    }
    
    die() {
      if (!this.isDying) {
        this.isDying = true;
        this.deathAnimation = 0;
        this.direction = DIRECTIONS.NONE;
        this.nextDirection = DIRECTIONS.NONE;
        playSound('death');
      }
    }
    
    reset() {
      this.gridX = 9;
      this.gridY = 15;
      this.x = this.gridX * TILE_SIZE + TILE_SIZE / 2;
      this.y = this.gridY * TILE_SIZE + TILE_SIZE / 2;
      this.direction = DIRECTIONS.NONE;
      this.nextDirection = DIRECTIONS.NONE;
      this.moving = false;
      this.isDying = false;
      this.deathAnimation = 0;
    }
  }
  
  // Ghost class
  class Ghost extends Entity {
    constructor(gridX, gridY, color, personality) {
      super(gridX, gridY);
      this.color = color;
      this.originalColor = color;
      this.personality = personality;
      this.frightened = false;
      this.eaten = false;
      this.eyesOnly = false;
      this.animFrame = 0;
      this.speed = 2;
      this.scatterTarget = { x: gridX, y: gridY };
      this.mode = 'scatter'; // scatter, chase, frightened, eaten
      this.modeTimer = 0;
      this.spawnTimer = 0;
      this.inGhostHouse = true;
    }
    
    canMove(dir, x, y) {
      const nextX = x + dir.x;
      const nextY = y + dir.y;
      return grid.isGhostWalkable(nextX, nextY);
    }
    
    update(deltaTime, pacman) {
      if (this.spawnTimer > 0) {
        this.spawnTimer -= deltaTime;
        if (this.spawnTimer <= 0) {
          this.inGhostHouse = false;
        }
        return;
      }
      
      // Update animation
      this.animFrame += deltaTime * 5;
      if (this.animFrame >= 2) this.animFrame = 0;
      
      // Update mode
      if (!this.frightened && !this.eaten) {
        this.modeTimer += deltaTime;
        if (this.mode === 'scatter' && this.modeTimer > 7) {
          this.mode = 'chase';
          this.modeTimer = 0;
        } else if (this.mode === 'chase' && this.modeTimer > 20) {
          this.mode = 'scatter';
          this.modeTimer = 0;
        }
      }
      
      // AI decision at intersections
      if (!this.moving) {
        const possibleDirs = this.getPossibleDirections();
        if (possibleDirs.length > 0) {
          const target = this.getTarget(pacman);
          this.direction = this.chooseBestDirection(possibleDirs, target);
        }
      }
      
      super.update(deltaTime);
      
      // Check if returned to ghost house
      if (this.eaten && this.gridX === 9 && this.gridY === 10) {
        this.eaten = false;
        this.eyesOnly = false;
        this.frightened = false;
        this.speed = 2;
        this.color = this.originalColor;
      }
    }
    
    getPossibleDirections() {
      const dirs = [];
      const opposite = this.getOppositeDirection(this.direction);
      
      for (const key in DIRECTIONS) {
        const dir = DIRECTIONS[key];
        if (dir === DIRECTIONS.NONE) continue;
        if (dir === opposite && !this.eaten) continue; // Can't reverse unless eaten
        
        if (this.canMove(dir, this.gridX, this.gridY)) {
          dirs.push(dir);
        }
      }
      
      // If no valid directions (dead end), allow reversal
      if (dirs.length === 0 && opposite !== DIRECTIONS.NONE) {
        if (this.canMove(opposite, this.gridX, this.gridY)) {
          dirs.push(opposite);
        }
      }
      
      return dirs;
    }
    
    getOppositeDirection(dir) {
      if (dir === DIRECTIONS.UP) return DIRECTIONS.DOWN;
      if (dir === DIRECTIONS.DOWN) return DIRECTIONS.UP;
      if (dir === DIRECTIONS.LEFT) return DIRECTIONS.RIGHT;
      if (dir === DIRECTIONS.RIGHT) return DIRECTIONS.LEFT;
      return DIRECTIONS.NONE;
    }
    
    getTarget(pacman) {
      if (this.eaten) {
        return { x: 9, y: 10 }; // Return to ghost house
      }
      
      if (this.frightened) {
        // Random movement when frightened
        return {
          x: Math.floor(Math.random() * COLS),
          y: Math.floor(Math.random() * ROWS)
        };
      }
      
      if (this.mode === 'scatter') {
        return this.scatterTarget;
      }
      
      // Chase mode - different strategies per ghost
      switch (this.personality) {
        case 'blinky': // Red - Direct chase
          return { x: pacman.gridX, y: pacman.gridY };
          
        case 'pinky': // Pink - Ambush (target 4 tiles ahead)
          const ahead = 4;
          let targetX = pacman.gridX;
          let targetY = pacman.gridY;
          
          if (pacman.direction === DIRECTIONS.UP) targetY -= ahead;
          else if (pacman.direction === DIRECTIONS.DOWN) targetY += ahead;
          else if (pacman.direction === DIRECTIONS.LEFT) targetX -= ahead;
          else if (pacman.direction === DIRECTIONS.RIGHT) targetX += ahead;
          
          return { x: targetX, y: targetY };
          
        case 'inky': // Cyan - Complex (uses Blinky position)
          const blinky = ghosts[0];
          const offsetX = pacman.gridX + pacman.direction.x * 2;
          const offsetY = pacman.gridY + pacman.direction.y * 2;
          return {
            x: offsetX + (offsetX - blinky.gridX),
            y: offsetY + (offsetY - blinky.gridY)
          };
          
        case 'clyde': // Orange - Shy (chase if far, scatter if close)
          const dist = Math.abs(pacman.gridX - this.gridX) + 
                      Math.abs(pacman.gridY - this.gridY);
          if (dist > 8) {
            return { x: pacman.gridX, y: pacman.gridY };
          } else {
            return this.scatterTarget;
          }
          
        default:
          return { x: pacman.gridX, y: pacman.gridY };
      }
    }
    
    chooseBestDirection(possibleDirs, target) {
      let bestDir = possibleDirs[0];
      let bestDist = Infinity;
      
      for (const dir of possibleDirs) {
        const nextX = this.gridX + dir.x;
        const nextY = this.gridY + dir.y;
        const dist = Math.abs(target.x - nextX) + Math.abs(target.y - nextY);
        
        if (dist < bestDist) {
          bestDist = dist;
          bestDir = dir;
        }
      }
      
      return bestDir;
    }
    
    setFrightened(duration) {
      if (!this.eaten) {
        this.frightened = true;
        this.speed = 1.5;
        this.direction = this.getOppositeDirection(this.direction);
        
        setTimeout(() => {
          if (!this.eaten) {
            this.frightened = false;
            this.speed = 2;
          }
        }, duration);
      }
    }
    
    setEaten() {
      this.eaten = true;
      this.eyesOnly = true;
      this.frightened = false;
      this.speed = 4; // Move fast back to ghost house
      playSound('eatGhost');
    }
    
    draw() {
      if (this.spawnTimer > 0) return;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      
      if (this.eyesOnly) {
        // Draw only eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(-5, -3, 4, 0, Math.PI * 2);
        ctx.arc(5, -3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#00F';
        const eyeOffsetX = this.direction.x * 2;
        const eyeOffsetY = this.direction.y * 2;
        ctx.beginPath();
        ctx.arc(-5 + eyeOffsetX, -3 + eyeOffsetY, 2, 0, Math.PI * 2);
        ctx.arc(5 + eyeOffsetX, -3 + eyeOffsetY, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw ghost body
        if (this.frightened) {
          ctx.fillStyle = game.frightenedTimer < 2000 && 
                         Math.floor(game.frightenedTimer / 200) % 2 ? 
                         '#FFF' : '#00F';
        } else {
          ctx.fillStyle = this.color;
        }
        
        // Ghost body
        ctx.beginPath();
        ctx.arc(0, -4, TILE_SIZE * 0.4, Math.PI, 0);
        ctx.lineTo(TILE_SIZE * 0.4, TILE_SIZE * 0.3);
        
        // Wavy bottom
        const waves = 3;
        const waveWidth = (TILE_SIZE * 0.8) / waves;
        for (let i = waves; i >= 0; i--) {
          const x = -TILE_SIZE * 0.4 + i * waveWidth;
          const y = TILE_SIZE * 0.3 + Math.sin(this.animFrame * Math.PI + i) * 3;
          if (i === waves) {
            ctx.lineTo(x, y);
          } else {
            ctx.quadraticCurveTo(
              x + waveWidth / 2,
              TILE_SIZE * 0.3 - 3,
              x, y
            );
          }
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Eyes
        if (!this.frightened) {
          ctx.fillStyle = '#FFF';
          ctx.beginPath();
          ctx.arc(-5, -3, 4, 0, Math.PI * 2);
          ctx.arc(5, -3, 4, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#00F';
          const eyeOffsetX = this.direction.x * 2;
          const eyeOffsetY = this.direction.y * 2;
          ctx.beginPath();
          ctx.arc(-5 + eyeOffsetX, -3 + eyeOffsetY, 2, 0, Math.PI * 2);
          ctx.arc(5 + eyeOffsetX, -3 + eyeOffsetY, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Frightened face
          ctx.fillStyle = '#FFF';
          ctx.fillRect(-7, -3, 4, 4);
          ctx.fillRect(3, -3, 4, 4);
          
          // Wavy mouth
          ctx.strokeStyle = '#FFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-8, 5);
          for (let i = 0; i <= 4; i++) {
            const x = -8 + i * 4;
            const y = 5 + Math.sin(i * Math.PI / 2) * 2;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
      
      ctx.restore();
    }
    
    reset() {
      this.gridX = this.scatterTarget.x;
      this.gridY = this.scatterTarget.y;
      this.x = this.gridX * TILE_SIZE + TILE_SIZE / 2;
      this.y = this.gridY * TILE_SIZE + TILE_SIZE / 2;
      this.direction = DIRECTIONS.NONE;
      this.moving = false;
      this.frightened = false;
      this.eaten = false;
      this.eyesOnly = false;
      this.mode = 'scatter';
      this.modeTimer = 0;
      this.color = this.originalColor;
      this.speed = 2;
    }
  }
  
  // Game entities
  let pacman = new PacMan();
  let ghosts = [
    new Ghost(9, 10, '#FF0000', 'blinky'),  // Red
    new Ghost(8, 10, '#FFB8FF', 'pinky'),   // Pink
    new Ghost(10, 10, '#00FFFF', 'inky'),   // Cyan
    new Ghost(9, 11, '#FFB852', 'clyde')    // Orange
  ];
  
  // Set scatter targets (corners)
  ghosts[0].scatterTarget = { x: COLS - 2, y: 1 };      // Top right
  ghosts[1].scatterTarget = { x: 1, y: 1 };             // Top left
  ghosts[2].scatterTarget = { x: COLS - 2, y: ROWS - 2 }; // Bottom right
  ghosts[3].scatterTarget = { x: 1, y: ROWS - 2 };      // Bottom left
  
  // Set spawn timers
  ghosts[0].spawnTimer = 0;
  ghosts[1].spawnTimer = 2;
  ghosts[2].spawnTimer = 4;
  ghosts[3].spawnTimer = 6;
  
  // Sound functions
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  
  function playSound(type) {
    if (!audioContext || !game.running) return;
    
    const sound = sounds[type];
    if (!sound) return;
    
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = sound.freq;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, 
        audioContext.currentTime + sound.duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + sound.duration / 1000);
    } catch (e) {
      // Silent fail for audio errors
    }
  }
  
  // Game functions
  function activateFrightenedMode() {
    game.frightenedMode = true;
    game.frightenedTimer = 8000;
    
    ghosts.forEach(ghost => {
      if (!ghost.eaten && ghost.spawnTimer <= 0) {
        ghost.setFrightened(8000);
      }
    });
  }
  
  function checkCollisions() {
    ghosts.forEach((ghost, index) => {
      if (ghost.spawnTimer > 0 || ghost.eyesOnly) return;
      
      const dx = Math.abs(pacman.x - ghost.x);
      const dy = Math.abs(pacman.y - ghost.y);
      
      if (dx < TILE_SIZE * 0.6 && dy < TILE_SIZE * 0.6) {
        if (ghost.frightened) {
          game.score += 200 * Math.pow(2, game.combo);
          game.combo++;
          ghost.setEaten();
        } else if (!pacman.isDying) {
          loseLife();
        }
      }
    });
  }
  
  function loseLife() {
    game.lives--;
    pacman.die();
    
    if (game.lives <= 0) {
      gameOver();
    }
  }
  
  function resetLevel() {
    pacman.reset();
    ghosts.forEach((ghost, i) => {
      ghost.reset();
      ghost.spawnTimer = i * 2;
    });
    game.frightenedMode = false;
    game.frightenedTimer = 0;
    game.combo = 0;
  }
  
  function nextLevel() {
    game.level++;
    grid.reset();
    resetLevel();
    
    // Increase difficulty
    ghosts.forEach(ghost => {
      ghost.speed = Math.min(2 + game.level * 0.1, 3);
    });
  }
  
  function gameOver() {
    game.running = false;
    game.gameStarted = false;
    
    if (game.score > game.highScore) {
      game.highScore = game.score;
      localStorage.setItem('pacmanHighScore', game.highScore.toString());
      document.getElementById('highScoreValue').textContent = game.highScore;
    }
    
    overlay.classList.add('show');
  }
  
  function startGame() {
    initAudio();
    
    game.score = 0;
    game.level = 1;
    game.lives = 3;
    game.running = true;
    game.gameStarted = true;
    game.combo = 0;
    
    grid.reset();
    resetLevel();
    
    overlay.classList.remove('show');
    canvas.focus();
  }
  
  // Drawing functions
  function drawMaze() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = grid.get(x, y);
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        
        if (cell === WALL) {
          // Draw wall
          ctx.fillStyle = '#0000FF';
          ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          
          // Add border for depth
          ctx.strokeStyle = '#4040FF';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        } else if (cell === DOT) {
          // Draw dot
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === POWER) {
          // Draw power pellet
          const pulse = Math.sin(Date.now() / 200) * 2 + 6;
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, pulse, 0, Math.PI * 2);
          ctx.fill();
        } else if (cell === GATE) {
          // Draw ghost house gate
          ctx.strokeStyle = '#FF00FF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px + 4, py + TILE_SIZE / 2);
          ctx.lineTo(px + TILE_SIZE - 4, py + TILE_SIZE / 2);
          ctx.stroke();
        }
      }
    }
    
    // Draw fruit if active
    if (game.fruitActive && game.fruitPosition) {
      const fx = game.fruitPosition.x * TILE_SIZE + TILE_SIZE / 2;
      const fy = game.fruitPosition.y * TILE_SIZE + TILE_SIZE / 2;
      
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(fx - 4, fy, 5, 0, Math.PI * 2);
      ctx.arc(fx + 4, fy, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fx, fy - 5);
      ctx.lineTo(fx, fy - 10);
      ctx.stroke();
    }
  }
  
  function updateHUD() {
    scoreEl.textContent = game.score.toString().padStart(6, '0');
    levelEl.textContent = game.level.toString();
    
    let livesDisplay = '';
    for (let i = 0; i < game.lives; i++) {
      livesDisplay += '🟡';
    }
    livesEl.textContent = livesDisplay;
    
    // Show combo multiplier
    if (game.combo > 1) {
      let comboEl = document.getElementById('combo');
      if (!comboEl) {
        comboEl = document.createElement('span');
        comboEl.id = 'combo';
        comboEl.style.color = '#FFD700';
        comboEl.style.marginLeft = '10px';
        scoreEl.parentNode.appendChild(comboEl);
      }
      comboEl.textContent = `x${game.combo}`;
    }
  }
  
  function drawGameInfo() {
    if (!game.running && game.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FFF';
      ctx.font = '24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      
      if (game.lives <= 0) {
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`Score: ${game.score}`, canvas.width / 2, canvas.height / 2 + 30);
      } else {
        ctx.fillText('GET READY!', canvas.width / 2, canvas.height / 2);
      }
    }
    
    if (game.paused && game.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FFF';
      ctx.font = '24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
  }
  
  // Input handling
  document.addEventListener('keydown', (e) => {
    if (!game.gameStarted && e.code === 'Space') {
      startGame();
      return;
    }
    
    if (!game.running || pacman.isDying) return;
    
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        pacman.setDirection(DIRECTIONS.UP);
        e.preventDefault();
        break;
      case 'ArrowDown':
      case 'KeyS':
        pacman.setDirection(DIRECTIONS.DOWN);
        e.preventDefault();
        break;
      case 'ArrowLeft':
      case 'KeyA':
        pacman.setDirection(DIRECTIONS.LEFT);
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'KeyD':
        pacman.setDirection(DIRECTIONS.RIGHT);
        e.preventDefault();
        break;
      case 'Space':
        game.paused = !game.paused;
        e.preventDefault();
        break;
    }
  });
  
  // Touch controls
  function setupTouchControls() {
    const buttons = {
      'btnUp': DIRECTIONS.UP,
      'btnDown': DIRECTIONS.DOWN,
      'btnLeft': DIRECTIONS.LEFT,
      'btnRight': DIRECTIONS.RIGHT
    };
    
    for (const [id, dir] of Object.entries(buttons)) {
      const btn = document.getElementById(id);
      if (btn) {
        // Touch events for better mobile response
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          if (!game.gameStarted) {
            startGame();
          } else if (game.running && !pacman.isDying) {
            pacman.setDirection(dir);
          }
        });
        
        // Also support click for desktop testing
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (!game.gameStarted) {
            startGame();
          } else if (game.running && !pacman.isDying) {
            pacman.setDirection(dir);
          }
        });
      }
    }
  }
  
  // Game loop
  let lastTime = 0;
  let accumulator = 0;
  const FIXED_TIMESTEP = 1000 / 60; // 60 FPS
  
  function gameLoop(currentTime) {
    const deltaTime = Math.min(currentTime - lastTime, 100);
    lastTime = currentTime;
    
    accumulator += deltaTime;
    
    while (accumulator >= FIXED_TIMESTEP) {
      const dt = FIXED_TIMESTEP / 1000;
      
      if (game.running && !game.paused) {
        // Update frightened timer
        if (game.frightenedMode) {
          game.frightenedTimer -= FIXED_TIMESTEP;
          if (game.frightenedTimer <= 0) {
            game.frightenedMode = false;
            game.combo = 0;
          }
        }
        
        // Spawn fruit occasionally
        if (!game.fruitActive && Math.random() < 0.001) {
          game.fruitActive = true;
          game.fruitTimer = 10000;
          game.fruitPosition = { x: 9, y: 10 };
        }
        
        if (game.fruitActive) {
          game.fruitTimer -= FIXED_TIMESTEP;
          if (game.fruitTimer <= 0) {
            game.fruitActive = false;
            game.fruitPosition = null;
          }
        }
        
        // Update game entities
        pacman.update(dt);
        ghosts.forEach(ghost => ghost.update(dt, pacman));
        
        // Check collisions
        checkCollisions();
        
        // Update HUD
        updateHUD();
      }
      
      accumulator -= FIXED_TIMESTEP;
    }
    
    // Render
    drawMaze();
    pacman.draw();
    ghosts.forEach(ghost => ghost.draw());
    drawGameInfo();
    
    requestAnimationFrame(gameLoop);
  }
  
  // Initialize game
  startBtn.addEventListener('click', startGame);
  setupTouchControls();
  updateHUD();
  document.getElementById('highScoreValue').textContent = game.highScore;
  
  // Start game loop
  requestAnimationFrame(gameLoop);
  
  // Prevent context menu on canvas
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  
  console.log('🎮 Pac-Man initialized - Production Ready!');
})();