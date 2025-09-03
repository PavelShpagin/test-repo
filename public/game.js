/*
  Pac‑Man JS – Enhanced interactive game implementation
  Features:
  - Smooth responsive controls (keyboard + touch)
  - Intelligent ghost AI with different behaviors
  - Sound effects and visual feedback
  - Progressive difficulty
  - Mobile-friendly interface
  - Unified memory grid system
  - Improved collision detection
  - Cool particle effects and animations
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
  
  // Tile types
  const WALL = 1;
  const DOT = 2;
  const POWER = 3;
  const EMPTY = 0;
  const GHOST_SPAWN = 4;
  
  // Game speeds (tiles per second)
  const PACMAN_SPEED = 4;
  const GHOST_SPEED = 3;
  const FRIGHTENED_SPEED = 2;
  
  // Game timers
  const FRIGHTENED_TIME = 8000; // 8 seconds
  const GHOST_SPAWN_DELAY = 2000; // 2 seconds between ghost spawns
  const INVULNERABILITY_TIME = 1000; // 1 second after losing life
  
  // Enhanced maze layout with proper ghost spawn area
  const MAZE = [
    '###################',
    '#........#........#',
    '#.##.###.#.###.##.#',
    '#o................o#',
    '#.##.#.#####.#.##.#',
    '#....#...#...#....#',
    '####.###.#.###.####',
    '   #.....#.....#   ',
    '####.##.   .##.####',
    '#......  G  ......#',
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
    invulnerable: false,
    invulnerabilityTimer: 0,
    particles: []
  };

  // Unified memory grid for entity management
  class GameGrid {
    constructor() {
      this.grid = [];
      this.entities = new Map(); // Track entities by position
      this.initialize();
    }

    initialize() {
      this.entities.clear();
      this.grid = [];
      game.dotsRemaining = 0;
      
      for (let y = 0; y < ROWS; y++) {
        this.grid[y] = [];
        for (let x = 0; x < COLS; x++) {
          const char = MAZE[y][x];
          switch (char) {
            case '#': 
              this.grid[y][x] = WALL; 
              break;
            case '.': 
              this.grid[y][x] = DOT; 
              game.dotsRemaining++; 
              break;
            case 'o': 
              this.grid[y][x] = POWER; 
              game.dotsRemaining++; 
              break;
            case 'G':
              this.grid[y][x] = GHOST_SPAWN;
              break;
            default: 
              this.grid[y][x] = EMPTY; 
              break;
          }
        }
      }
    }

    getTileType(x, y) {
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return WALL;
      return this.grid[y][x];
    }

    setTileType(x, y, type) {
      if (x >= 0 && y >= 0 && x < COLS && y < ROWS) {
        this.grid[y][x] = type;
      }
    }

    isValidPosition(x, y) {
      const tileType = this.getTileType(x, y);
      return tileType !== WALL;
    }

    addEntity(entity, x, y) {
      const key = `${x},${y}`;
      if (!this.entities.has(key)) {
        this.entities.set(key, []);
      }
      this.entities.get(key).push(entity);
    }

    removeEntity(entity, x, y) {
      const key = `${x},${y}`;
      if (this.entities.has(key)) {
        const entities = this.entities.get(key);
        const index = entities.indexOf(entity);
        if (index > -1) {
          entities.splice(index, 1);
        }
      }
    }

    getEntitiesAt(x, y) {
      const key = `${x},${y}`;
      return this.entities.get(key) || [];
    }

    clearEntities() {
      this.entities.clear();
    }
  }

  // Initialize unified grid
  const gameGrid = new GameGrid();

  // Helper functions
  function getTileCenter(tileX, tileY) {
    return {
      x: tileX * TILE + TILE / 2,
      y: tileY * TILE + TILE / 2
    };
  }

  function getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function snapToGrid(pixelPos) {
    return {
      x: Math.floor(pixelPos / TILE),
      y: Math.floor(pixelPos / TILE)
    };
  }

  // Particle system for visual effects
  class Particle {
    constructor(x, y, color, velocity) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.velocity = velocity;
      this.life = 1.0;
      this.decay = 0.02;
      this.size = 3;
    }

    update(deltaTime) {
      this.x += this.velocity.x * deltaTime * 100;
      this.y += this.velocity.y * deltaTime * 100;
      this.life -= this.decay;
      this.size *= 0.99;
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

  // Enhanced Pac-Man class
  class PacMan {
    constructor() {
      this.reset();
      this.mouthAngle = 0;
      this.animSpeed = 8;
      this.radius = TILE * 0.35; // Smaller radius to prevent wall clipping
    }

    reset() {
      // Start at a proper grid position
      this.tileX = 9;
      this.tileY = 15;
      const center = getTileCenter(this.tileX, this.tileY);
      this.x = center.x;
      this.y = center.y;
      this.direction = { x: 0, y: 0 };
      this.nextDirection = { x: 0, y: 0 };
      this.speed = PACMAN_SPEED * TILE;
      this.moving = false;
    }

    setDirection(dx, dy) {
      this.nextDirection = { x: dx, y: dy };
    }

    update(deltaTime) {
      if (!game.running) return;

      // Animate mouth
      this.mouthAngle += this.animSpeed * deltaTime;
      if (this.mouthAngle > Math.PI * 2) this.mouthAngle = 0;

      // Update grid position
      gameGrid.removeEntity(this, this.tileX, this.tileY);

      // Check if we can change direction at tile centers
      const atTileCenter = Math.abs(this.x - getTileCenter(this.tileX, this.tileY).x) < 2 &&
                          Math.abs(this.y - getTileCenter(this.tileX, this.tileY).y) < 2;

      if (atTileCenter && (this.nextDirection.x !== 0 || this.nextDirection.y !== 0)) {
        const nextTileX = this.tileX + this.nextDirection.x;
        const nextTileY = this.tileY + this.nextDirection.y;
        
        if (gameGrid.isValidPosition(nextTileX, nextTileY)) {
          this.direction = { ...this.nextDirection };
          this.nextDirection = { x: 0, y: 0 };
          // Snap to center when changing direction
          const center = getTileCenter(this.tileX, this.tileY);
          this.x = center.x;
          this.y = center.y;
        }
      }

      // Move Pac-Man
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        this.moving = true;
        const newX = this.x + this.direction.x * this.speed * deltaTime;
        const newY = this.y + this.direction.y * this.speed * deltaTime;
        
        const newTileX = Math.floor(newX / TILE);
        const newTileY = Math.floor(newY / TILE);

        // Check if new position is valid
        if (gameGrid.isValidPosition(newTileX, newTileY)) {
          this.x = newX;
          this.y = newY;
          this.tileX = newTileX;
          this.tileY = newTileY;
        } else {
          // Stop at wall and snap to tile center
          const center = getTileCenter(this.tileX, this.tileY);
          this.x = center.x;
          this.y = center.y;
          this.direction = { x: 0, y: 0 };
          this.moving = false;
        }
      } else {
        this.moving = false;
      }

      // Tunnel wrap-around
      if (this.tileX < 0) {
        this.tileX = COLS - 1;
        this.x = getTileCenter(this.tileX, this.tileY).x;
      } else if (this.tileX >= COLS) {
        this.tileX = 0;
        this.x = getTileCenter(this.tileX, this.tileY).x;
      }

      // Add to grid
      gameGrid.addEntity(this, this.tileX, this.tileY);

      // Eat dots and power pellets
      const currentTile = gameGrid.getTileType(this.tileX, this.tileY);
      if (currentTile === DOT) {
        gameGrid.setTileType(this.tileX, this.tileY, EMPTY);
        game.score += 10;
        game.dotsRemaining--;
        this.createEatParticles();
        playEatSound();
        
        if (game.dotsRemaining <= 0) {
          nextLevel();
        }
      } else if (currentTile === POWER) {
        gameGrid.setTileType(this.tileX, this.tileY, EMPTY);
        game.score += 50;
        game.dotsRemaining--;
        this.createPowerParticles();
        activateFrightenedMode();
        playPowerSound();
        
        if (game.dotsRemaining <= 0) {
          nextLevel();
        }
      }
    }

    createEatParticles() {
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 * i) / 5;
        const velocity = {
          x: Math.cos(angle) * 2,
          y: Math.sin(angle) * 2
        };
        game.particles.push(new Particle(this.x, this.y, '#FFFF00', velocity));
      }
    }

    createPowerParticles() {
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * 2 * i) / 10;
        const velocity = {
          x: Math.cos(angle) * 3,
          y: Math.sin(angle) * 3
        };
        game.particles.push(new Particle(this.x, this.y, '#FFB8FF', velocity));
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      
      // Rotate based on direction
      let angle = 0;
      if (this.direction.x > 0) angle = 0;
      else if (this.direction.x < 0) angle = Math.PI;
      else if (this.direction.y < 0) angle = -Math.PI / 2;
      else if (this.direction.y > 0) angle = Math.PI / 2;
      
      ctx.rotate(angle);

      // Draw Pac-Man body
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      
      // Mouth animation - only when moving
      if (this.moving) {
        const mouthSize = Math.abs(Math.sin(this.mouthAngle)) * 0.8 + 0.2;
        const startAngle = mouthSize * 0.5;
        const endAngle = Math.PI * 2 - mouthSize * 0.5;
        ctx.arc(0, 0, this.radius, startAngle, endAngle);
        ctx.lineTo(0, 0);
      } else {
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      }
      
      ctx.closePath();
      ctx.fill();

      // Add outline
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add invulnerability effect
      if (game.invulnerable) {
        ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }

    getTilePosition() {
      return { x: this.tileX, y: this.tileY };
    }
  }

  // Enhanced Ghost class
  class Ghost {
    constructor(name, color, startX, startY) {
      this.name = name;
      this.color = color;
      this.originalColor = color;
      this.startTileX = startX;
      this.startTileY = startY;
      this.radius = TILE * 0.35; // Smaller radius to prevent wall clipping
      this.reset();
      this.lastDirection = { x: 0, y: 1 }; // Start moving down
      this.pathfindingCooldown = 0;
      this.targetTile = null;
    }

    reset() {
      // Start at proper grid position
      this.tileX = this.startTileX;
      this.tileY = this.startTileY;
      const center = getTileCenter(this.tileX, this.tileY);
      this.x = center.x;
      this.y = center.y;
      this.direction = { x: 0, y: 0 };
      this.speed = GHOST_SPEED * TILE;
      this.frightened = false;
      this.frightenedTimer = 0;
      this.mode = 'chase';
      this.spawnTimer = GHOST_SPAWN_DELAY;
      this.stuck = false;
      this.stuckTimer = 0;
    }

    update(deltaTime, pacman) {
      if (!game.running) return;

      // Handle spawn delay
      if (this.spawnTimer > 0) {
        this.spawnTimer -= deltaTime * 1000;
        return;
      }

      // Update grid position
      gameGrid.removeEntity(this, this.tileX, this.tileY);

      // Update frightened state
      if (this.frightened) {
        this.frightenedTimer -= deltaTime * 1000;
        if (this.frightenedTimer <= 0) {
          this.frightened = false;
          this.speed = GHOST_SPEED * TILE;
          this.color = this.originalColor;
        }
      }

      // Check if stuck
      if (this.stuckTimer > 0) {
        this.stuckTimer -= deltaTime * 1000;
      }

      // Enhanced AI with better pathfinding
      const atTileCenter = Math.abs(this.x - getTileCenter(this.tileX, this.tileY).x) < 3 &&
                          Math.abs(this.y - getTileCenter(this.tileX, this.tileY).y) < 3;

      if (atTileCenter || this.direction.x === 0 && this.direction.y === 0) {
        this.chooseDirection(pacman);
        // Snap to center when choosing direction
        const center = getTileCenter(this.tileX, this.tileY);
        this.x = center.x;
        this.y = center.y;
      }

      // Move ghost
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        const newX = this.x + this.direction.x * this.speed * deltaTime;
        const newY = this.y + this.direction.y * this.speed * deltaTime;
        
        const newTileX = Math.floor(newX / TILE);
        const newTileY = Math.floor(newY / TILE);

        if (gameGrid.isValidPosition(newTileX, newTileY)) {
          this.x = newX;
          this.y = newY;
          this.tileX = newTileX;
          this.tileY = newTileY;
          this.stuck = false;
          this.stuckTimer = 0;
        } else {
          // If hitting wall, choose new direction immediately
          this.stuck = true;
          this.stuckTimer = 500; // 0.5 second cooldown
          this.chooseDirection(pacman);
        }
      }

      // Tunnel wrap-around
      if (this.tileX < 0) {
        this.tileX = COLS - 1;
        this.x = getTileCenter(this.tileX, this.tileY).x;
      } else if (this.tileX >= COLS) {
        this.tileX = 0;
        this.x = getTileCenter(this.tileX, this.tileY).x;
      }

      // Add to grid
      gameGrid.addEntity(this, this.tileX, this.tileY);
    }

    chooseDirection(pacman) {
      if (this.stuckTimer > 0) return; // Don't change direction while stuck cooldown

      const directions = [
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 },  // right
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }  // left
      ];

      // Filter valid directions (no walls, prefer not reversing)
      const validDirs = directions.filter(dir => {
        const newX = this.tileX + dir.x;
        const newY = this.tileY + dir.y;
        return gameGrid.isValidPosition(newX, newY);
      });

      if (validDirs.length === 0) {
        // If no valid directions, stay put
        this.direction = { x: 0, y: 0 };
        return;
      }

      // Remove reverse direction unless it's the only option
      const nonReverseDirs = validDirs.filter(dir => {
        const isReverse = dir.x === -this.lastDirection.x && dir.y === -this.lastDirection.y;
        return !isReverse;
      });

      const availableDirs = nonReverseDirs.length > 0 ? nonReverseDirs : validDirs;

      // Choose direction based on mode
      let targetDir;
      if (this.frightened) {
        // Run away from Pac-Man with some randomness
        if (Math.random() < 0.3) {
          targetDir = availableDirs[Math.floor(Math.random() * availableDirs.length)];
        } else {
          const pacDist = availableDirs.map(dir => {
            const newX = this.tileX + dir.x;
            const newY = this.tileY + dir.y;
            return getDistance({ x: newX, y: newY }, { x: pacman.tileX, y: pacman.tileY });
          });
          const maxDistIndex = pacDist.indexOf(Math.max(...pacDist));
          targetDir = availableDirs[maxDistIndex];
        }
      } else {
        // Chase Pac-Man with individual ghost personalities
        switch (this.name) {
          case 'blinky': // Direct chase
            const pacDist = availableDirs.map(dir => {
              const newX = this.tileX + dir.x;
              const newY = this.tileY + dir.y;
              return getDistance({ x: newX, y: newY }, { x: pacman.tileX, y: pacman.tileY });
            });
            const minDistIndex = pacDist.indexOf(Math.min(...pacDist));
            targetDir = availableDirs[minDistIndex];
            break;
            
          case 'pinky': // Ambush - target 4 tiles ahead of Pac-Man
            const ambushX = pacman.tileX + pacman.direction.x * 4;
            const ambushY = pacman.tileY + pacman.direction.y * 4;
            const ambushDist = availableDirs.map(dir => {
              const newX = this.tileX + dir.x;
              const newY = this.tileY + dir.y;
              return getDistance({ x: newX, y: newY }, { x: ambushX, y: ambushY });
            });
            const minAmbushIndex = ambushDist.indexOf(Math.min(...ambushDist));
            targetDir = availableDirs[minAmbushIndex];
            break;
            
          case 'inky': // Patrol behavior with some chase
            if (Math.random() < 0.7) {
              const chaseDist = availableDirs.map(dir => {
                const newX = this.tileX + dir.x;
                const newY = this.tileY + dir.y;
                return getDistance({ x: newX, y: newY }, { x: pacman.tileX, y: pacman.tileY });
              });
              const minChaseIndex = chaseDist.indexOf(Math.min(...chaseDist));
              targetDir = availableDirs[minChaseIndex];
            } else {
              targetDir = availableDirs[Math.floor(Math.random() * availableDirs.length)];
            }
            break;
            
          case 'clyde': // Keep distance, random when close
            const clydeDist = getDistance(this, pacman);
            if (clydeDist < TILE * 8) {
              targetDir = availableDirs[Math.floor(Math.random() * availableDirs.length)];
            } else {
              const chaseDist = availableDirs.map(dir => {
                const newX = this.tileX + dir.x;
                const newY = this.tileY + dir.y;
                return getDistance({ x: newX, y: newY }, { x: pacman.tileX, y: pacman.tileY });
              });
              const minChaseIndex = chaseDist.indexOf(Math.min(...chaseDist));
              targetDir = availableDirs[minChaseIndex];
            }
            break;
            
          default:
            targetDir = availableDirs[0];
        }
      }

      if (targetDir) {
        this.direction = targetDir;
        this.lastDirection = { ...targetDir };
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);

      // Ghost body with better animation
      const bodyColor = this.frightened ? 
        (this.frightenedTimer < 2000 && Math.floor(Date.now() / 200) % 2 ? '#FFFFFF' : '#0000FF') : 
        this.color;
        
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, -this.radius * 0.2, this.radius, Math.PI, 0);
      
      // Ghost bottom with animated wavy effect
      const waveCount = 4;
      const waveOffset = Date.now() * 0.01;
      for (let i = 0; i <= waveCount; i++) {
        const waveX = (i / waveCount) * this.radius * 2 - this.radius;
        const waveY = this.radius * 0.8 + Math.sin(i * Math.PI + waveOffset) * this.radius * 0.15;
        if (i === 0) ctx.lineTo(waveX, waveY);
        else ctx.lineTo(waveX, waveY);
      }
      ctx.closePath();
      ctx.fill();

      // Add outline
      ctx.strokeStyle = this.frightened ? '#000080' : this.originalColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Eyes
      if (!this.frightened || this.frightenedTimer < 2000) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, -this.radius * 0.2, this.radius * 0.2, 0, Math.PI * 2);
        ctx.arc(this.radius * 0.3, -this.radius * 0.2, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Pupils that look in movement direction
        ctx.fillStyle = '#000000';
        const pupilOffset = 2;
        const leftPupilX = -this.radius * 0.3 + this.direction.x * pupilOffset;
        const leftPupilY = -this.radius * 0.2 + this.direction.y * pupilOffset;
        const rightPupilX = this.radius * 0.3 + this.direction.x * pupilOffset;
        const rightPupilY = -this.radius * 0.2 + this.direction.y * pupilOffset;
        
        ctx.beginPath();
        ctx.arc(leftPupilX, leftPupilY, this.radius * 0.1, 0, Math.PI * 2);
        ctx.arc(rightPupilX, rightPupilY, this.radius * 0.1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    getTilePosition() {
      return { x: this.tileX, y: this.tileY };
    }
  }

  // Game entities
  let pacman;
  let ghosts = [];

  // Enhanced sound effects using Web Audio API
  let audioContext;
  
  function initAudio() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  function playTone(frequency, duration, volume = 0.1, type = 'square') {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  function playEatSound() {
    playTone(800, 0.1, 0.05);
  }

  function playPowerSound() {
    playTone(400, 0.3, 0.1);
    setTimeout(() => playTone(600, 0.3, 0.1), 100);
    setTimeout(() => playTone(800, 0.3, 0.1), 200);
  }

  function playDeathSound() {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => playTone(400 - i * 40, 0.15, 0.1, 'sawtooth'), i * 80);
    }
  }

  function playLevelSound() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone(600 + i * 150, 0.2, 0.1, 'triangle'), i * 100);
    }
  }

  function playGhostEatenSound() {
    playTone(1200, 0.2, 0.1, 'sine');
  }

  // Initialize game
  function initGame() {
    pacman = new PacMan();
    
    // Find ghost spawn position in maze
    let ghostSpawnX = 9, ghostSpawnY = 9;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (MAZE[y][x] === 'G') {
          ghostSpawnX = x;
          ghostSpawnY = y;
          break;
        }
      }
    }
    
    ghosts = [
      new Ghost('blinky', '#FF0000', ghostSpawnX, ghostSpawnY),     // Red - aggressive chaser
      new Ghost('pinky', '#FFB8FF', ghostSpawnX - 1, ghostSpawnY), // Pink - ambusher
      new Ghost('inky', '#00FFFF', ghostSpawnX + 1, ghostSpawnY),  // Cyan - patrol/chase mix
      new Ghost('clyde', '#FFB852', ghostSpawnX, ghostSpawnY + 1)  // Orange - keeps distance
    ];
    
    // Stagger ghost spawn times
    ghosts.forEach((ghost, index) => {
      ghost.spawnTimer = index * 2000; // 2 second intervals
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
    game.invulnerable = false;
    game.invulnerabilityTimer = 0;
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
        ghost.speed = FRIGHTENED_SPEED * TILE;
        ghost.color = '#0000FF';
        // Reverse direction
        ghost.direction.x *= -1;
        ghost.direction.y *= -1;
        ghost.lastDirection.x *= -1;
        ghost.lastDirection.y *= -1;
      }
    });
  }

  function checkCollisions() {
    if (game.invulnerable) return;

    ghosts.forEach(ghost => {
      if (ghost.spawnTimer > 0) return;
      
      // More precise collision detection using tile positions and entity radius
      const distance = getDistance(
        { x: pacman.x, y: pacman.y },
        { x: ghost.x, y: ghost.y }
      );
      
      const collisionDistance = pacman.radius + ghost.radius - 5; // Slight overlap needed
      
      if (distance < collisionDistance) {
        if (ghost.frightened) {
          // Eat ghost
          game.score += 200;
          ghost.reset();
          ghost.spawnTimer = 5000; // 5 second respawn
          playGhostEatenSound();
          
          // Create explosion particles
          for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
            const velocity = {
              x: Math.cos(angle) * 4,
              y: Math.sin(angle) * 4
            };
            game.particles.push(new Particle(ghost.x, ghost.y, ghost.originalColor, velocity));
          }
        } else {
          // Pac-Man dies
          loseLife();
        }
      }
    });
  }

  function loseLife() {
    if (game.invulnerable) return;
    
    game.lives--;
    game.invulnerable = true;
    game.invulnerabilityTimer = INVULNERABILITY_TIME;
    
    playDeathSound();
    
    // Create death particles
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const velocity = {
        x: Math.cos(angle) * 3,
        y: Math.sin(angle) * 3
      };
      game.particles.push(new Particle(pacman.x, pacman.y, '#FFFF00', velocity));
    }
    
    if (game.lives <= 0) {
      gameOver();
    } else {
      // Reset positions but keep level progress
      setTimeout(() => {
        pacman.reset();
        ghosts.forEach(ghost => {
          ghost.reset();
          ghost.spawnTimer = 1000; // Quick respawn after death
        });
        game.running = false;
        setTimeout(() => {
          game.running = true;
          game.invulnerable = false;
        }, 1500); // 1.5 second pause
      }, 1000);
    }
  }

  function nextLevel() {
    game.level++;
    playLevelSound();
    
    // Increase difficulty
    ghosts.forEach(ghost => {
      ghost.speed *= 1.08; // 8% faster each level
    });
    
    // Create level completion particles
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const velocity = {
        x: Math.cos(angle) * 2,
        y: Math.sin(angle) * 2
      };
      game.particles.push(new Particle(
        canvas.width / 2, 
        canvas.height / 2, 
        '#FFD700', 
        velocity
      ));
    }
    
    resetLevel();
    
    // Show level up message briefly
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
    game.invulnerable = false;
    game.invulnerabilityTimer = 0;
    resetLevel();
    updateHUD();
  }

  // Enhanced drawing functions
  function drawMaze() {
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000814');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze with enhanced visuals
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tileType = gameGrid.getTileType(x, y);
        const pixelX = x * TILE;
        const pixelY = y * TILE;

        switch (tileType) {
          case WALL:
            // Enhanced wall rendering with depth
            ctx.fillStyle = '#001b8f';
            ctx.fillRect(pixelX, pixelY, TILE, TILE);
            
            // Top highlight
            ctx.fillStyle = '#0040ff';
            ctx.fillRect(pixelX, pixelY, TILE, 2);
            
            // Left highlight
            ctx.fillRect(pixelX, pixelY, 2, TILE);
            
            // Bottom shadow
            ctx.fillStyle = '#000040';
            ctx.fillRect(pixelX, pixelY + TILE - 2, TILE, 2);
            
            // Right shadow
            ctx.fillRect(pixelX + TILE - 2, pixelY, 2, TILE);
            break;
            
          case DOT:
            ctx.fillStyle = '#FFFF00';
            ctx.shadowColor = '#FFFF00';
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(pixelX + TILE/2, pixelY + TILE/2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            break;
            
          case POWER:
            // Animated power pellet
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            ctx.fillStyle = '#FFFF00';
            ctx.shadowColor = '#FFFF00';
            ctx.shadowBlur = 8 * pulse;
            ctx.globalAlpha = pulse;
            ctx.beginPath();
            ctx.arc(pixelX + TILE/2, pixelY + TILE/2, 6 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
            break;

          case GHOST_SPAWN:
            // Mark ghost spawn area subtly
            ctx.fillStyle = 'rgba(128, 128, 128, 0.1)';
            ctx.fillRect(pixelX, pixelY, TILE, TILE);
            break;
        }
      }
    }
  }

  function updateParticles(deltaTime) {
    // Update particles
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
    // Show level transition
    if (!game.running && game.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      
      if (game.lives <= 0) {
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
      } else if (game.dotsRemaining <= 0) {
        ctx.fillText(`LEVEL ${game.level}`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '16px Arial';
        ctx.fillText('Get Ready!', canvas.width / 2, canvas.height / 2 + 20);
      } else {
        ctx.fillText('GET READY!', canvas.width / 2, canvas.height / 2);
      }
      
      ctx.shadowBlur = 0;
    }

    // Show pause message if paused
    if (game.paused && game.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 5;
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.font = '14px Arial';
      ctx.fillText('Press SPACE to continue', canvas.width / 2, canvas.height / 2 + 30);
      ctx.shadowBlur = 0;
    }

    // Show frightened mode timer
    if (game.frightenedMode && game.running) {
      const timeLeft = Math.ceil(game.frightenedTimer / 1000);
      ctx.fillStyle = '#0000FF';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Power Mode: ${timeLeft}s`, canvas.width / 2, 25);
    }
  }

  // Input handling
  const keys = {};
  
  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    
    if (!game.gameStarted) {
      startGame();
      return;
    }
    
    // Handle Pac-Man movement
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

  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
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
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  
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
    
    touchEndX = e.changedTouches[0].clientX;
    touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      // Horizontal swipe
      pacman.setDirection(deltaX > 0 ? 1 : -1, 0);
    } else if (Math.abs(deltaY) > minSwipeDistance) {
      // Vertical swipe
      pacman.setDirection(0, deltaY > 0 ? 1 : -1);
    }
  }, { passive: false });

  // Enhanced game loop
  let lastTime = 0;
  
  function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.016); // Cap at 60fps
    lastTime = currentTime;

    if (game.running && !game.paused) {
      // Update invulnerability
      if (game.invulnerable) {
        game.invulnerabilityTimer -= deltaTime * 1000;
        if (game.invulnerabilityTimer <= 0) {
          game.invulnerable = false;
        }
      }

      // Update frightened mode timer
      if (game.frightenedMode) {
        game.frightenedTimer -= deltaTime * 1000;
        if (game.frightenedTimer <= 0) {
          game.frightenedMode = false;
        }
      }

      // Clear entity positions from grid
      gameGrid.clearEntities();

      // Update entities
      pacman.update(deltaTime);
      ghosts.forEach(ghost => ghost.update(deltaTime, pacman));
      
      // Update particles
      updateParticles(deltaTime);
      
      // Check collisions
      checkCollisions();
      
      // Update HUD
      updateHUD();
    }

    // Draw everything
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

  // Auto-focus canvas for keyboard input
  canvas.focus();
  
  // Prevent context menu on long press
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  
  console.log('Enhanced Pac-Man game initialized! Use arrow keys or WASD to move, SPACE to pause.');
})();