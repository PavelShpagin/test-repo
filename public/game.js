/*
  Pac‑Man JS – Natural Movement System
  Smooth, consistent animation without abrupt changes or speed spikes
*/

(function() {
  'use strict';

  // Canvas and context
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // HUD elements
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const livesEl = document.getElementById('lives');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');

  // Game constants
  const COLS = 19;
  const ROWS = 21;
  const TILE = Math.floor(canvas.width / COLS);
  
  // Grid cell types
  const EMPTY = 0;
  const WALL = 1;
  const PACMAN = 2;
  const GHOST_1 = 3;
  const GHOST_2 = 4;
  const GHOST_3 = 5;
  const GHOST_4 = 6;
  const DOT = 7;
  const POWER = 8;
  
  // Movement constants for natural animation
  const MOVE_DURATION = 250; // milliseconds per tile move
  const PACMAN_MOVE_DURATION = 200;
  const GHOST_MOVE_DURATION = 250;
  const FRIGHTENED_MOVE_DURATION = 400;
  
  // Game timers
  const FRIGHTENED_TIME = 8000;
  
  // Easing function for smooth movement
  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // Maze layout template
  const MAZE_TEMPLATE = [
    '###################',
    '#........#........#',
    '#.##.###.#.###.##.#',
    '#o................o#',
    '#.##.#.#####.#.##.#',
    '#....#...#...#....#',
    '####.###.#.###.####',
    '   #.....#.....#   ',
    '####.###.#.###.####',
    '#........#........#',
    '#.##.###.#.###.##.#',
    '#..#.....#.....#..#',
    '##.#.#.#####.#.#.##',
    '#....#...#...#....#',
    '#.######.#.######.#',
    '#.................#',
    '#.##.###.#.###.##.#',
    '#....#...#...#....#',
    '#.##.#.#####.#.##.#',
    '#o................o#',
    '###################'
  ];

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
    particles: []
  };

  // Memory grid system
  class GameGrid {
    constructor() {
      this.grid = [];
      this.staticGrid = [];
      this.initialize();
    }

    initialize() {
      this.grid = [];
      this.staticGrid = [];
      game.dotsRemaining = 0;

      for (let y = 0; y < ROWS; y++) {
        this.grid[y] = [];
        this.staticGrid[y] = [];
        for (let x = 0; x < COLS; x++) {
          const char = MAZE_TEMPLATE[y][x];
          
          switch (char) {
            case '#':
              this.staticGrid[y][x] = WALL;
              break;
            case '.':
              this.staticGrid[y][x] = DOT;
              game.dotsRemaining++;
              break;
            case 'o':
              this.staticGrid[y][x] = POWER;
              game.dotsRemaining++;
              break;
            default:
              this.staticGrid[y][x] = EMPTY;
              break;
          }
          
          this.grid[y][x] = this.staticGrid[y][x];
        }
      }
    }

    isValidMove(x, y) {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
      const cell = this.staticGrid[y][x];
      return cell !== WALL;
    }

    moveEntity(fromX, fromY, toX, toY, entityType) {
      if (fromX >= 0 && fromY >= 0 && fromX < COLS && fromY < ROWS) {
        this.grid[fromY][fromX] = this.staticGrid[fromY][fromX];
      }
      
      if (toX >= 0 && toY >= 0 && toX < COLS && toY < ROWS) {
        this.grid[toY][toX] = entityType;
      }
    }

    collectItem(x, y) {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
      
      const item = this.staticGrid[y][x];
      if (item === DOT || item === POWER) {
        this.staticGrid[y][x] = EMPTY;
        return item;
      }
      return null;
    }

    // BFS pathfinding
    findPath(startX, startY, targetX, targetY) {
      if (!this.isValidMove(startX, startY) || !this.isValidMove(targetX, targetY)) {
        return null;
      }

      const queue = [{x: startX, y: startY, path: []}];
      const visited = new Set();
      visited.add(`${startX},${startY}`);

      const directions = [
        {x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}
      ];

      while (queue.length > 0) {
        const current = queue.shift();
        
        if (current.x === targetX && current.y === targetY) {
          return current.path;
        }

        for (const dir of directions) {
          const newX = current.x + dir.x;
          const newY = current.y + dir.y;
          const key = `${newX},${newY}`;

          if (!visited.has(key) && this.isValidMove(newX, newY)) {
            visited.add(key);
            queue.push({
              x: newX,
              y: newY,
              path: [...current.path, dir]
            });
          }
        }
      }

      return null;
    }

    getCell(x, y) {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return WALL;
      return this.grid[y][x];
    }

    getStaticCell(x, y) {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return WALL;
      return this.staticGrid[y][x];
    }
  }

  const gameGrid = new GameGrid();

  // Particle system
  class Particle {
    constructor(x, y, color, velocity) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.velocity = velocity;
      this.life = 1.0;
      this.decay = 0.03;
      this.size = 3;
    }

    update(deltaTime) {
      this.x += this.velocity.x * deltaTime * 60;
      this.y += this.velocity.y * deltaTime * 60;
      this.life -= this.decay;
      this.size *= 0.98;
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    isDead() {
      return this.life <= 0;
    }
  }

  function createParticles(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 50 + Math.random() * 50;
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed
      };
      game.particles.push(new Particle(x, y, color, velocity));
    }
  }

  // Natural movement Pac-Man class
  class PacMan {
    constructor() {
      this.reset();
      this.mouthAngle = 0;
      this.animSpeed = 6;
    }

    reset() {
      this.gridX = 9;
      this.gridY = 15;
      this.pixelX = this.gridX * TILE + TILE / 2;
      this.pixelY = this.gridY * TILE + TILE / 2;
      this.startPixelX = this.pixelX;
      this.startPixelY = this.pixelY;
      this.targetPixelX = this.pixelX;
      this.targetPixelY = this.pixelY;
      this.direction = {x: 0, y: 0};
      this.nextDirection = {x: 0, y: 0};
      this.isMoving = false;
      this.moveProgress = 0;
      this.moveDuration = PACMAN_MOVE_DURATION;
      
      gameGrid.moveEntity(-1, -1, this.gridX, this.gridY, PACMAN);
    }

    setDirection(dx, dy) {
      this.nextDirection = {x: dx, y: dy};
    }

    update(deltaTime) {
      if (!game.running) return;

      // Smooth mouth animation
      this.mouthAngle += this.animSpeed * deltaTime;
      if (this.mouthAngle > Math.PI * 2) this.mouthAngle = 0;

      // Handle movement animation
      if (this.isMoving) {
        this.moveProgress += (deltaTime * 1000) / this.moveDuration;
        
        if (this.moveProgress >= 1.0) {
          // Movement complete
          this.moveProgress = 1.0;
          this.pixelX = this.targetPixelX;
          this.pixelY = this.targetPixelY;
          this.isMoving = false;
          
          // Check for collectibles at new position
          const collected = gameGrid.collectItem(this.gridX, this.gridY);
          if (collected === DOT) {
            game.score += 10;
            game.dotsRemaining--;
            createParticles(this.pixelX, this.pixelY, '#FFFF00', 4);
            playEatSound();
            
            if (game.dotsRemaining <= 0) {
              nextLevel();
            }
          } else if (collected === POWER) {
            game.score += 50;
            game.dotsRemaining--;
            createParticles(this.pixelX, this.pixelY, '#FFB8FF', 8);
            activateFrightenedMode();
            playPowerSound();
            
            if (game.dotsRemaining <= 0) {
              nextLevel();
            }
          }
        } else {
          // Smooth eased interpolation
          const easedProgress = easeInOutQuad(this.moveProgress);
          this.pixelX = this.startPixelX + (this.targetPixelX - this.startPixelX) * easedProgress;
          this.pixelY = this.startPixelY + (this.targetPixelY - this.startPixelY) * easedProgress;
        }
      }

      // Try to start new movement if not currently moving
      if (!this.isMoving) {
        // Try to change direction if requested
        if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
          const nextX = this.gridX + this.nextDirection.x;
          const nextY = this.gridY + this.nextDirection.y;
          
          if (gameGrid.isValidMove(nextX, nextY)) {
            this.direction = {...this.nextDirection};
            this.nextDirection = {x: 0, y: 0};
          }
        }

        // Start movement in current direction
        if (this.direction.x !== 0 || this.direction.y !== 0) {
          const newX = this.gridX + this.direction.x;
          const newY = this.gridY + this.direction.y;

          // Handle tunnel wrap-around
          let finalX = newX;
          if (newX < 0) finalX = COLS - 1;
          else if (newX >= COLS) finalX = 0;

          if (gameGrid.isValidMove(finalX, newY)) {
            // Start smooth movement
            this.startPixelX = this.pixelX;
            this.startPixelY = this.pixelY;
            this.targetPixelX = finalX * TILE + TILE / 2;
            this.targetPixelY = newY * TILE + TILE / 2;
            this.moveProgress = 0;
            this.isMoving = true;

            // Update grid position
            gameGrid.moveEntity(this.gridX, this.gridY, finalX, newY, PACMAN);
            this.gridX = finalX;
            this.gridY = newY;
          } else {
            // Can't move, stop smoothly
            this.direction = {x: 0, y: 0};
          }
        }
      }
    }

    draw() {
      const radius = TILE * 0.35;
      
      ctx.save();
      ctx.translate(this.pixelX, this.pixelY);
      
      // Rotate based on direction
      let angle = 0;
      if (this.direction.x > 0) angle = 0;
      else if (this.direction.x < 0) angle = Math.PI;
      else if (this.direction.y < 0) angle = -Math.PI / 2;
      else if (this.direction.y > 0) angle = Math.PI / 2;
      
      ctx.rotate(angle);

      // Soft glow effect
      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur = 8;

      // Draw Pac-Man body
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      
      // Mouth animation - only when moving
      if (this.isMoving) {
        const mouthSize = Math.abs(Math.sin(this.mouthAngle)) * 0.6 + 0.4;
        const startAngle = mouthSize * 0.4;
        const endAngle = Math.PI * 2 - mouthSize * 0.4;
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.lineTo(0, 0);
      } else {
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
      }
      
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  // Natural movement Ghost class
  class Ghost {
    constructor(name, color, startX, startY, entityType) {
      this.name = name;
      this.color = color;
      this.originalColor = color;
      this.startGridX = startX;
      this.startGridY = startY;
      this.entityType = entityType;
      this.reset();
      this.pathfindingTimer = 0;
      this.pathfindingInterval = 600; // Recalculate path every 600ms
      this.currentPath = [];
    }

    reset() {
      this.gridX = this.startGridX;
      this.gridY = this.startGridY;
      this.pixelX = this.gridX * TILE + TILE / 2;
      this.pixelY = this.gridY * TILE + TILE / 2;
      this.startPixelX = this.pixelX;
      this.startPixelY = this.pixelY;
      this.targetPixelX = this.pixelX;
      this.targetPixelY = this.pixelY;
      this.direction = {x: 0, y: 0};
      this.frightened = false;
      this.frightenedTimer = 0;
      this.spawnTimer = 1000;
      this.isMoving = false;
      this.moveProgress = 0;
      this.moveDuration = GHOST_MOVE_DURATION;
      this.pathfindingTimer = 0;
      this.currentPath = [];
      
      gameGrid.moveEntity(-1, -1, this.gridX, this.gridY, this.entityType);
    }

    update(deltaTime, pacman) {
      if (!game.running) return;

      // Handle spawn delay
      if (this.spawnTimer > 0) {
        this.spawnTimer -= deltaTime * 1000;
        return;
      }

      // Update frightened state
      if (this.frightened) {
        this.frightenedTimer -= deltaTime * 1000;
        if (this.frightenedTimer <= 0) {
          this.frightened = false;
          this.moveDuration = GHOST_MOVE_DURATION;
          this.color = this.originalColor;
        }
      }

      // Handle movement animation
      if (this.isMoving) {
        this.moveProgress += (deltaTime * 1000) / this.moveDuration;
        
        if (this.moveProgress >= 1.0) {
          // Movement complete
          this.moveProgress = 1.0;
          this.pixelX = this.targetPixelX;
          this.pixelY = this.targetPixelY;
          this.isMoving = false;
        } else {
          // Smooth eased interpolation
          const easedProgress = easeInOutQuad(this.moveProgress);
          this.pixelX = this.startPixelX + (this.targetPixelX - this.startPixelX) * easedProgress;
          this.pixelY = this.startPixelY + (this.targetPixelY - this.startPixelY) * easedProgress;
        }
      }

      // Update pathfinding timer
      this.pathfindingTimer += deltaTime * 1000;
      if (this.pathfindingTimer >= this.pathfindingInterval) {
        this.pathfindingTimer = 0;
        this.calculatePath(pacman);
      }

      // Try to start new movement if not currently moving
      if (!this.isMoving) {
        this.makeMove();
      }
    }

    calculatePath(pacman) {
      if (this.frightened) {
        // When frightened, move randomly away from Pac-Man
        const directions = [
          {x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}
        ];
        const validDirs = directions.filter(dir => {
          const newX = this.gridX + dir.x;
          const newY = this.gridY + dir.y;
          return gameGrid.isValidMove(newX, newY);
        });
        
        if (validDirs.length > 0) {
          // Prefer directions away from Pac-Man
          const distances = validDirs.map(dir => {
            const newX = this.gridX + dir.x;
            const newY = this.gridY + dir.y;
            const dx = newX - pacman.gridX;
            const dy = newY - pacman.gridY;
            return Math.sqrt(dx * dx + dy * dy);
          });
          const maxDistIndex = distances.indexOf(Math.max(...distances));
          this.direction = validDirs[maxDistIndex];
        }
      } else {
        // Use BFS to find path to Pac-Man
        const path = gameGrid.findPath(this.gridX, this.gridY, pacman.gridX, pacman.gridY);
        if (path && path.length > 0) {
          this.currentPath = path;
          this.direction = path[0];
        } else {
          // No path found, move randomly
          const directions = [
            {x: 0, y: -1}, {x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}
          ];
          const validDirs = directions.filter(dir => {
            const newX = this.gridX + dir.x;
            const newY = this.gridY + dir.y;
            return gameGrid.isValidMove(newX, newY);
          });
          
          if (validDirs.length > 0) {
            this.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
          }
        }
      }
    }

    makeMove() {
      if (this.direction.x === 0 && this.direction.y === 0) return;

      const newX = this.gridX + this.direction.x;
      const newY = this.gridY + this.direction.y;

      // Handle tunnel wrap-around
      let finalX = newX;
      if (newX < 0) finalX = COLS - 1;
      else if (newX >= COLS) finalX = 0;

      if (gameGrid.isValidMove(finalX, newY)) {
        // Start smooth movement
        this.startPixelX = this.pixelX;
        this.startPixelY = this.pixelY;
        this.targetPixelX = finalX * TILE + TILE / 2;
        this.targetPixelY = newY * TILE + TILE / 2;
        this.moveProgress = 0;
        this.isMoving = true;

        // Update grid position
        gameGrid.moveEntity(this.gridX, this.gridY, finalX, newY, this.entityType);
        this.gridX = finalX;
        this.gridY = newY;

        // Remove first step from current path
        if (this.currentPath.length > 0) {
          this.currentPath.shift();
        }
      }
    }

    draw() {
      if (this.spawnTimer > 0) return;
      
      const radius = TILE * 0.35;
      
      ctx.save();
      ctx.translate(this.pixelX, this.pixelY);

      // Soft glow effect
      ctx.shadowColor = this.frightened ? '#0000FF' : this.originalColor;
      ctx.shadowBlur = 6;

      // Ghost body with smooth color transitions
      let bodyColor;
      if (this.frightened) {
        if (this.frightenedTimer < 2000) {
          // Smooth blinking effect
          const blinkSpeed = 0.2;
          const blink = Math.sin(Date.now() * blinkSpeed) > 0;
          bodyColor = blink ? '#FFFFFF' : '#0000FF';
        } else {
          bodyColor = '#0000FF';
        }
      } else {
        bodyColor = this.color;
      }
        
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, -radius * 0.2, radius, Math.PI, 0);
      
      // Smooth wavy bottom animation
      const waveCount = 4;
      const waveOffset = Date.now() * 0.005; // Slower, smoother waves
      for (let i = 0; i <= waveCount; i++) {
        const waveX = (i / waveCount) * radius * 2 - radius;
        const waveY = radius * 0.8 + Math.sin(i * Math.PI + waveOffset) * radius * 0.12;
        if (i === 0) ctx.lineTo(waveX, waveY);
        else ctx.lineTo(waveX, waveY);
      }
      ctx.closePath();
      ctx.fill();

      // Eyes with smooth direction following
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.15, 0, Math.PI * 2);
      ctx.arc(radius * 0.3, -radius * 0.2, radius * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Pupils that smoothly follow movement direction
      ctx.fillStyle = '#000000';
      const pupilOffset = 2;
      const leftPupilX = -radius * 0.3 + this.direction.x * pupilOffset;
      const leftPupilY = -radius * 0.2 + this.direction.y * pupilOffset;
      const rightPupilX = radius * 0.3 + this.direction.x * pupilOffset;
      const rightPupilY = -radius * 0.2 + this.direction.y * pupilOffset;
      
      ctx.beginPath();
      ctx.arc(leftPupilX, leftPupilY, radius * 0.08, 0, Math.PI * 2);
      ctx.arc(rightPupilX, rightPupilY, radius * 0.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Game entities
  let pacman;
  let ghosts = [];

  // Sound effects
  let audioContext;
  
  function initAudio() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  function playTone(frequency, duration, volume = 0.03) {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  function playEatSound() {
    playTone(800, 0.1);
  }

  function playPowerSound() {
    playTone(400, 0.3);
    setTimeout(() => playTone(600, 0.3), 100);
  }

  function playDeathSound() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone(400 - i * 50, 0.2), i * 100);
    }
  }

  function playLevelSound() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => playTone(600 + i * 200, 0.2), i * 150);
    }
  }

  // Initialize game
  function initGame() {
    gameGrid.initialize();
    pacman = new PacMan();
    
    ghosts = [
      new Ghost('blinky', '#FF0000', 9, 9, GHOST_1),
      new Ghost('pinky', '#FFB8FF', 8, 10, GHOST_2),
      new Ghost('inky', '#00FFFF', 10, 10, GHOST_3),
      new Ghost('clyde', '#FFB852', 9, 11, GHOST_4)
    ];
    
    // Stagger spawn times for natural introduction
    ghosts.forEach((ghost, index) => {
      ghost.spawnTimer = index * 2500; // Slightly longer for smoother intro
    });

    initAudio();
  }

  // Reset level
  function resetLevel() {
    gameGrid.initialize();
    pacman.reset();
    ghosts.forEach(ghost => ghost.reset());
    game.frightenedMode = false;
    game.frightenedTimer = 0;
    game.particles = [];
  }

  // Game mechanics
  function activateFrightenedMode() {
    game.frightenedMode = true;
    game.frightenedTimer = FRIGHTENED_TIME;
    
    ghosts.forEach(ghost => {
      if (ghost.spawnTimer <= 0) {
        ghost.frightened = true;
        ghost.frightenedTimer = FRIGHTENED_TIME;
        ghost.moveDuration = FRIGHTENED_MOVE_DURATION; // Slower when frightened
        ghost.color = '#0000FF';
      }
    });
  }

  function checkCollisions() {
    ghosts.forEach(ghost => {
      if (ghost.spawnTimer > 0) return;
      
      // Grid-based collision detection
      if (ghost.gridX === pacman.gridX && ghost.gridY === pacman.gridY) {
        if (ghost.frightened) {
          // Eat ghost
          game.score += 200;
          createParticles(ghost.pixelX, ghost.pixelY, ghost.originalColor, 10);
          ghost.reset();
          ghost.spawnTimer = 5000;
          playPowerSound();
        } else {
          // Ghost touches Pac-Man - minus one life
          loseLife();
        }
      }
    });
  }

  function loseLife() {
    game.lives--;
    createParticles(pacman.pixelX, pacman.pixelY, '#FFFF00', 15);
    playDeathSound();
    
    if (game.lives <= 0) {
      gameOver();
    } else {
      // Smooth restart
      game.running = false;
      setTimeout(() => {
        pacman.reset();
        ghosts.forEach(ghost => {
          ghost.reset();
          ghost.spawnTimer = 1500; // Slightly longer for smooth restart
        });
        game.running = true;
      }, 2000);
    }
  }

  function nextLevel() {
    game.level++;
    createParticles(canvas.width / 2, canvas.height / 2, '#FFD700', 20);
    playLevelSound();
    
    // Gradually increase difficulty
    ghosts.forEach(ghost => {
      ghost.moveDuration *= 0.95; // 5% faster (smoother than 10%)
    });
    
    resetLevel();
    
    game.running = false;
    setTimeout(() => {
      game.running = true;
    }, 2500);
  }

  function gameOver() {
    game.running = false;
    game.gameStarted = false;
    overlay.classList.add('show');
    startBtn.textContent = 'Play Again';
  }

  function startGame() {
    overlay.classList.remove('show');
    game.score = 0;
    game.lives = 3;
    game.level = 1;
    game.running = true;
    game.gameStarted = true;
    resetLevel();
    updateHUD();
  }

  // Enhanced drawing functions
  function drawMaze() {
    // Smooth gradient background
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width
    );
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze with smooth rendering
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tileType = gameGrid.getStaticCell(x, y);
        const pixelX = x * TILE;
        const pixelY = y * TILE;

        switch (tileType) {
          case WALL:
            // Smooth 3D wall effect
            const wallGradient = ctx.createLinearGradient(
              pixelX, pixelY, pixelX + TILE, pixelY + TILE
            );
            wallGradient.addColorStop(0, '#0040FF');
            wallGradient.addColorStop(0.5, '#003399');
            wallGradient.addColorStop(1, '#001166');
            
            ctx.fillStyle = wallGradient;
            ctx.fillRect(pixelX, pixelY, TILE, TILE);
            
            // Soft highlights and shadows
            ctx.fillStyle = '#0066FF';
            ctx.fillRect(pixelX, pixelY, TILE, 2);
            ctx.fillRect(pixelX, pixelY, 2, TILE);
            
            ctx.fillStyle = '#001133';
            ctx.fillRect(pixelX, pixelY + TILE - 2, TILE, 2);
            ctx.fillRect(pixelX + TILE - 2, pixelY, 2, TILE);
            break;
            
          case DOT:
            ctx.save();
            ctx.shadowColor = '#FFFF00';
            ctx.shadowBlur = 4;
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(pixelX + TILE/2, pixelY + TILE/2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
            
          case POWER:
            // Smooth pulsing power pellet
            const pulse = Math.sin(Date.now() * 0.006) * 0.3 + 0.7; // Slower, smoother pulse
            ctx.save();
            ctx.shadowColor = '#FFFF00';
            ctx.shadowBlur = 10 * pulse;
            ctx.fillStyle = '#FFFF00';
            ctx.globalAlpha = pulse;
            ctx.beginPath();
            ctx.arc(pixelX + TILE/2, pixelY + TILE/2, 5 + pulse * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
        }
      }
    }
  }

  function updateParticles(deltaTime) {
    for (let i = game.particles.length - 1; i >= 0; i--) {
      const particle = game.particles[i];
      particle.update(deltaTime);
      
      if (particle.isDead()) {
        game.particles.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    game.particles.forEach(particle => particle.draw());
  }

  function updateHUD() {
    scoreEl.textContent = game.score.toString().padStart(6, '0');
    levelEl.textContent = game.level.toString();
    livesEl.textContent = '❤'.repeat(Math.max(0, game.lives));
  }

  function drawGameInfo() {
    if (!game.running && game.gameStarted) {
      const overlayGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      overlayGradient.addColorStop(0, 'rgba(0, 0, 100, 0.8)');
      overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 15;
      
      if (game.lives <= 0) {
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 15);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Final Score: ${game.score}`, canvas.width / 2, canvas.height / 2 + 15);
      } else if (game.dotsRemaining <= 0) {
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`LEVEL ${game.level}`, canvas.width / 2, canvas.height / 2 - 15);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#FFFF00';
        ctx.fillText('GET READY!', canvas.width / 2, canvas.height / 2 + 15);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.fillText('GET READY!', canvas.width / 2, canvas.height / 2);
      }
      
      ctx.restore();
    }

    if (game.paused && game.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.font = '12px Arial';
      ctx.fillText('Press SPACE to continue', canvas.width / 2, canvas.height / 2 + 30);
      ctx.restore();
    }

    if (game.frightenedMode && game.running) {
      const timeLeft = Math.ceil(game.frightenedTimer / 1000);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = timeLeft <= 3 ? '#FF0000' : '#0000FF';
      ctx.font = 'bold 14px Arial';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 5;
      ctx.fillText(`POWER: ${timeLeft}s`, canvas.width / 2, 25);
      ctx.restore();
    }
  }

  // Input handling
  document.addEventListener('keydown', (e) => {
    if (!game.gameStarted) {
      startGame();
      return;
    }
    
    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        pacman.setDirection(0, -1);
        break;
      case 'ArrowDown':
      case 'KeyS':
        pacman.setDirection(0, 1);
        break;
      case 'ArrowLeft':
      case 'KeyA':
        pacman.setDirection(-1, 0);
        break;
      case 'ArrowRight':
      case 'KeyD':
        pacman.setDirection(1, 0);
        break;
      case 'Space':
        game.paused = !game.paused;
        break;
    }
    e.preventDefault();
  });

  // Mobile controls
  function setupMobileControls() {
    const buttons = {
      'btnUp': { x: 0, y: -1 },
      'btnDown': { x: 0, y: 1 },
      'btnLeft': { x: -1, y: 0 },
      'btnRight': { x: 1, y: 0 }
    };

    Object.entries(buttons).forEach(([id, direction]) => {
      const button = document.getElementById(id);
      if (!button) return;

      const handlePress = (e) => {
        e.preventDefault();
        if (!game.gameStarted) {
          startGame();
        } else {
          pacman.setDirection(direction.x, direction.y);
        }
      };

      button.addEventListener('touchstart', handlePress, { passive: false });
      button.addEventListener('click', handlePress);
    });
  }

  // Touch swipe controls
  let touchStartX = 0, touchStartY = 0;
  
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (!game.gameStarted) {
      startGame();
      return;
    }
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      pacman.setDirection(deltaX > 0 ? 1 : -1, 0);
    } else if (Math.abs(deltaY) > minSwipeDistance) {
      pacman.setDirection(0, deltaY > 0 ? 1 : -1);
    }
  }, { passive: false });

  // Smooth game loop
  let lastTime = 0;
  
  function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.016); // Consistent 60fps cap
    lastTime = currentTime;

    if (game.running && !game.paused) {
      if (game.frightenedMode) {
        game.frightenedTimer -= deltaTime * 1000;
        if (game.frightenedTimer <= 0) {
          game.frightenedMode = false;
        }
      }

      pacman.update(deltaTime);
      ghosts.forEach(ghost => ghost.update(deltaTime, pacman));
      updateParticles(deltaTime);
      
      checkCollisions();
      updateHUD();
    }

    drawMaze();
    drawParticles();
    pacman.draw();
    ghosts.forEach(ghost => ghost.draw());
    drawGameInfo();
    
    requestAnimationFrame(gameLoop);
  }

  // Event listeners
  startBtn.addEventListener('click', startGame);

  // Initialize and start
  initGame();
  setupMobileControls();
  updateHUD();
  requestAnimationFrame(gameLoop);

  canvas.focus();
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  
  console.log('Natural Movement Pac-Man Ready! 🎮✨');
})();