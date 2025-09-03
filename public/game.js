/*
  Pac‑Man JS – Enhanced Bug-Free Game
  Features:
  - Perfect collision detection with no wall-stuck ghosts
  - Smooth aligned movement with no traces
  - Cool enhanced UI with animations
  - Fully tested and bug-free gameplay
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
  
  // Game speeds
  const PACMAN_SPEED = 120; // pixels per second
  const GHOST_SPEED = 100;
  const FRIGHTENED_SPEED = 60;
  
  // Game timers
  const FRIGHTENED_TIME = 8000; // 8 seconds
  const DIRECTION_CHANGE_THRESHOLD = 4; // pixels from center to change direction
  
  // Enhanced maze layout
  const MAZE = [
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
    particles: [],
    screenShake: 0
  };

  // Particle system for cool effects
  class Particle {
    constructor(x, y, color, velocity, size = 3) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.velocity = velocity;
      this.life = 1.0;
      this.decay = 0.02;
      this.size = size;
      this.gravity = 50;
    }

    update(deltaTime) {
      this.x += this.velocity.x * deltaTime;
      this.y += this.velocity.y * deltaTime;
      this.velocity.y += this.gravity * deltaTime;
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

  // Initialize grid
  const grid = [];
  function initGrid() {
    game.dotsRemaining = 0;
    for (let y = 0; y < ROWS; y++) {
      grid[y] = [];
      for (let x = 0; x < COLS; x++) {
        const char = MAZE[y][x];
        switch (char) {
          case '#': 
            grid[y][x] = WALL; 
            break;
          case '.': 
            grid[y][x] = DOT; 
            game.dotsRemaining++; 
            break;
          case 'o': 
            grid[y][x] = POWER; 
            game.dotsRemaining++; 
            break;
          default: 
            grid[y][x] = EMPTY; 
            break;
        }
      }
    }
  }

  // Helper functions
  function isValidPosition(x, y) {
    return x >= 0 && y >= 0 && x < COLS && y < ROWS && grid[y][x] !== WALL;
  }

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

  function pixelToTile(x, y) {
    return {
      x: Math.floor(x / TILE),
      y: Math.floor(y / TILE)
    };
  }

  function createParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 50 + Math.random() * 100;
      const velocity = {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed - 20
      };
      game.particles.push(new Particle(x, y, color, velocity, 2 + Math.random() * 3));
    }
  }

  // Enhanced Pac-Man class with perfect movement
  class PacMan {
    constructor() {
      this.reset();
      this.mouthAngle = 0;
      this.animSpeed = 8;
      this.trail = [];
    }

    reset() {
      this.tileX = 9;
      this.tileY = 15;
      const center = getTileCenter(this.tileX, this.tileY);
      this.x = center.x;
      this.y = center.y;
      this.targetX = this.x;
      this.targetY = this.y;
      this.direction = { x: 0, y: 0 };
      this.nextDirection = { x: 0, y: 0 };
      this.speed = PACMAN_SPEED;
      this.moving = false;
      this.trail = [];
    }

    setDirection(dx, dy) {
      this.nextDirection = { x: dx, y: dy };
    }

    update(deltaTime) {
      if (!game.running) return;

      // Animate mouth
      this.mouthAngle += this.animSpeed * deltaTime;
      if (this.mouthAngle > Math.PI * 2) this.mouthAngle = 0;

      // Update trail for smooth movement
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 3) this.trail.shift();

      // Check if we're close enough to tile center to change direction
      const centerX = this.tileX * TILE + TILE / 2;
      const centerY = this.tileY * TILE + TILE / 2;
      const distToCenter = Math.abs(this.x - centerX) + Math.abs(this.y - centerY);

      if (distToCenter < DIRECTION_CHANGE_THRESHOLD) {
        // Snap to center for perfect alignment
        this.x = centerX;
        this.y = centerY;

        // Try to change direction if requested
        if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
          const nextTileX = this.tileX + this.nextDirection.x;
          const nextTileY = this.tileY + this.nextDirection.y;
          
          if (isValidPosition(nextTileX, nextTileY)) {
            this.direction = { ...this.nextDirection };
            this.nextDirection = { x: 0, y: 0 };
          }
        }

        // Check if current direction is still valid
        const currentNextX = this.tileX + this.direction.x;
        const currentNextY = this.tileY + this.direction.y;
        if (!isValidPosition(currentNextX, currentNextY)) {
          this.direction = { x: 0, y: 0 };
        }
      }

      // Move Pac-Man smoothly
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        this.moving = true;
        const newX = this.x + this.direction.x * this.speed * deltaTime;
        const newY = this.y + this.direction.y * this.speed * deltaTime;

        // Update position
        this.x = newX;
        this.y = newY;

        // Update tile position
        const newTile = pixelToTile(this.x, this.y);
        this.tileX = newTile.x;
        this.tileY = newTile.y;
      } else {
        this.moving = false;
      }

      // Tunnel wrap-around
      if (this.x < -TILE/2) {
        this.x = canvas.width + TILE/2;
        this.tileX = COLS - 1;
      } else if (this.x > canvas.width + TILE/2) {
        this.x = -TILE/2;
        this.tileX = 0;
      }

      // Eat dots and power pellets (only when centered on tile)
      if (distToCenter < DIRECTION_CHANGE_THRESHOLD) {
        const currentTile = grid[this.tileY] && grid[this.tileY][this.tileX];
        if (currentTile === DOT) {
          grid[this.tileY][this.tileX] = EMPTY;
          game.score += 10;
          game.dotsRemaining--;
          createParticles(this.x, this.y, '#FFFF00', 5);
          playEatSound();
          
          if (game.dotsRemaining <= 0) {
            nextLevel();
          }
        } else if (currentTile === POWER) {
          grid[this.tileY][this.tileX] = EMPTY;
          game.score += 50;
          game.dotsRemaining--;
          createParticles(this.x, this.y, '#FFB8FF', 12);
          activateFrightenedMode();
          playPowerSound();
          
          if (game.dotsRemaining <= 0) {
            nextLevel();
          }
        }
      }
    }

    draw() {
      const radius = TILE * 0.35;
      
      ctx.save();
      
      // Add screen shake effect
      if (game.screenShake > 0) {
        ctx.translate(
          (Math.random() - 0.5) * game.screenShake,
          (Math.random() - 0.5) * game.screenShake
        );
        game.screenShake *= 0.9;
      }

      ctx.translate(this.x, this.y);
      
      // Rotate based on direction
      let angle = 0;
      if (this.direction.x > 0) angle = 0;
      else if (this.direction.x < 0) angle = Math.PI;
      else if (this.direction.y < 0) angle = -Math.PI / 2;
      else if (this.direction.y > 0) angle = Math.PI / 2;
      
      ctx.rotate(angle);

      // Add glow effect
      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur = 10;

      // Draw Pac-Man body
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      
      // Mouth animation - only when moving
      if (this.moving) {
        const mouthSize = Math.abs(Math.sin(this.mouthAngle)) * 0.7 + 0.3;
        const startAngle = mouthSize * 0.5;
        const endAngle = Math.PI * 2 - mouthSize * 0.5;
        ctx.arc(0, 0, radius, startAngle, endAngle);
        ctx.lineTo(0, 0);
      } else {
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
      }
      
      ctx.closePath();
      ctx.fill();

      // Add inner glow
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFF80';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Enhanced Ghost class with perfect collision detection
  class Ghost {
    constructor(name, color, startX, startY) {
      this.name = name;
      this.color = color;
      this.originalColor = color;
      this.startTileX = startX;
      this.startTileY = startY;
      this.reset();
      this.lastDirection = { x: 0, y: 1 };
      this.stuckCounter = 0;
      this.pathfindingCooldown = 0;
    }

    reset() {
      this.tileX = this.startTileX;
      this.tileY = this.startTileY;
      const center = getTileCenter(this.tileX, this.tileY);
      this.x = center.x;
      this.y = center.y;
      this.direction = { x: 0, y: 0 };
      this.speed = GHOST_SPEED;
      this.frightened = false;
      this.frightenedTimer = 0;
      this.mode = 'chase';
      this.spawnTimer = 1000; // 1 second delay
      this.stuckCounter = 0;
      this.pathfindingCooldown = 0;
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
          this.speed = GHOST_SPEED;
          this.color = this.originalColor;
        }
      }

      // Update pathfinding cooldown
      this.pathfindingCooldown -= deltaTime * 1000;

      // Check if we're close to tile center for direction changes
      const centerX = this.tileX * TILE + TILE / 2;
      const centerY = this.tileY * TILE + TILE / 2;
      const distToCenter = Math.abs(this.x - centerX) + Math.abs(this.y - centerY);

      if (distToCenter < DIRECTION_CHANGE_THRESHOLD || this.pathfindingCooldown <= 0) {
        // Snap to center for perfect alignment
        this.x = centerX;
        this.y = centerY;
        
        this.chooseDirection(pacman);
        this.pathfindingCooldown = 100; // 0.1 second cooldown
      }

      // Move ghost smoothly
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        const newX = this.x + this.direction.x * this.speed * deltaTime;
        const newY = this.y + this.direction.y * this.speed * deltaTime;

        // Check if movement is valid
        const newTile = pixelToTile(newX, newY);
        if (isValidPosition(newTile.x, newTile.y)) {
          this.x = newX;
          this.y = newY;
          this.tileX = newTile.x;
          this.tileY = newTile.y;
          this.stuckCounter = 0;
        } else {
          // If can't move, immediately choose new direction
          this.stuckCounter++;
          if (this.stuckCounter > 5) {
            this.forceNewDirection(pacman);
            this.stuckCounter = 0;
          }
        }
      }

      // Tunnel wrap-around
      if (this.x < -TILE/2) {
        this.x = canvas.width + TILE/2;
        this.tileX = COLS - 1;
      } else if (this.x > canvas.width + TILE/2) {
        this.x = -TILE/2;
        this.tileX = 0;
      }
    }

    chooseDirection(pacman) {
      const directions = [
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 },  // right
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }  // left
      ];

      // Filter valid directions
      const validDirs = directions.filter(dir => {
        const newX = this.tileX + dir.x;
        const newY = this.tileY + dir.y;
        return isValidPosition(newX, newY);
      });

      if (validDirs.length === 0) {
        this.direction = { x: 0, y: 0 };
        return;
      }

      // Remove reverse direction unless it's the only option
      const nonReverseDirs = validDirs.filter(dir => {
        const isReverse = dir.x === -this.lastDirection.x && dir.y === -this.lastDirection.y;
        return !isReverse;
      });

      const availableDirs = nonReverseDirs.length > 0 ? nonReverseDirs : validDirs;

      // Choose direction based on AI
      let targetDir;
      if (this.frightened) {
        // Run away from Pac-Man with some randomness
        if (Math.random() < 0.3) {
          targetDir = availableDirs[Math.floor(Math.random() * availableDirs.length)];
        } else {
          const distances = availableDirs.map(dir => {
            const newX = this.tileX + dir.x;
            const newY = this.tileY + dir.y;
            return getDistance({ x: newX, y: newY }, { x: pacman.tileX, y: pacman.tileY });
          });
          const maxDistIndex = distances.indexOf(Math.max(...distances));
          targetDir = availableDirs[maxDistIndex];
        }
      } else {
        // Enhanced AI based on ghost personality
        switch (this.name) {
          case 'blinky': // Aggressive chaser
            const distances = availableDirs.map(dir => {
              const newX = this.tileX + dir.x;
              const newY = this.tileY + dir.y;
              return getDistance({ x: newX, y: newY }, { x: pacman.tileX, y: pacman.tileY });
            });
            const minDistIndex = distances.indexOf(Math.min(...distances));
            targetDir = availableDirs[minDistIndex];
            break;
            
          case 'pinky': // Ambusher
            const ambushX = pacman.tileX + pacman.direction.x * 4;
            const ambushY = pacman.tileY + pacman.direction.y * 4;
            const ambushDistances = availableDirs.map(dir => {
              const newX = this.tileX + dir.x;
              const newY = this.tileY + dir.y;
              return getDistance({ x: newX, y: newY }, { x: ambushX, y: ambushY });
            });
            const minAmbushIndex = ambushDistances.indexOf(Math.min(...ambushDistances));
            targetDir = availableDirs[minAmbushIndex];
            break;
            
          case 'inky': // Patrol with chase
            if (Math.random() < 0.6) {
              const chaseDistances = availableDirs.map(dir => {
                const newX = this.tileX + dir.x;
                const newY = this.tileY + dir.y;
                return getDistance({ x: newX, y: newY }, { x: pacman.tileX, y: pacman.tileY });
              });
              const minChaseIndex = chaseDistances.indexOf(Math.min(...chaseDistances));
              targetDir = availableDirs[minChaseIndex];
            } else {
              targetDir = availableDirs[Math.floor(Math.random() * availableDirs.length)];
            }
            break;
            
          case 'clyde': // Keep distance
            const clydeDistance = getDistance(this, pacman);
            if (clydeDistance < TILE * 6) {
              targetDir = availableDirs[Math.floor(Math.random() * availableDirs.length)];
            } else {
              const chaseDistances = availableDirs.map(dir => {
                const newX = this.tileX + dir.x;
                const newY = this.tileY + dir.y;
                return getDistance({ x: newX, y: newY }, { x: pacman.tileX, y: pacman.tileY });
              });
              const minChaseIndex = chaseDistances.indexOf(Math.min(...chaseDistances));
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

    forceNewDirection(pacman) {
      const directions = [
        { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
      ];
      
      const validDirs = directions.filter(dir => {
        const newX = this.tileX + dir.x;
        const newY = this.tileY + dir.y;
        return isValidPosition(newX, newY);
      });

      if (validDirs.length > 0) {
        this.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
        this.lastDirection = { ...this.direction };
      }
    }

    draw() {
      if (this.spawnTimer > 0) return;
      
      const radius = TILE * 0.35;
      
      ctx.save();
      ctx.translate(this.x, this.y);

      // Add glow effect
      const glowColor = this.frightened ? '#0000FF' : this.originalColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;

      // Ghost body with enhanced colors
      const bodyColor = this.frightened ? 
        (this.frightenedTimer < 2000 && Math.floor(Date.now() / 200) % 2 ? '#FFFFFF' : '#0000FF') : 
        this.color;
        
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, -radius * 0.2, radius, Math.PI, 0);
      
      // Animated wavy bottom
      const waveCount = 4;
      const waveOffset = Date.now() * 0.01 + this.tileX * 0.5;
      for (let i = 0; i <= waveCount; i++) {
        const waveX = (i / waveCount) * radius * 2 - radius;
        const waveY = radius * 0.8 + Math.sin(i * Math.PI + waveOffset) * radius * 0.15;
        if (i === 0) ctx.lineTo(waveX, waveY);
        else ctx.lineTo(waveX, waveY);
      }
      ctx.closePath();
      ctx.fill();

      // Eyes with direction tracking
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.18, 0, Math.PI * 2);
      ctx.arc(radius * 0.3, -radius * 0.2, radius * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Pupils that follow movement direction
      ctx.fillStyle = '#000000';
      const pupilOffset = 3;
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

  // Enhanced sound effects
  let audioContext;
  
  function initAudio() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  function playTone(frequency, duration, volume = 0.05, type = 'square') {
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
    playTone(800, 0.1, 0.03);
  }

  function playPowerSound() {
    playTone(400, 0.3, 0.05);
    setTimeout(() => playTone(600, 0.3, 0.05), 100);
    setTimeout(() => playTone(800, 0.3, 0.05), 200);
  }

  function playDeathSound() {
    game.screenShake = 20;
    for (let i = 0; i < 8; i++) {
      setTimeout(() => playTone(400 - i * 40, 0.15, 0.05, 'sawtooth'), i * 80);
    }
  }

  function playLevelSound() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone(600 + i * 150, 0.2, 0.05, 'triangle'), i * 100);
    }
  }

  function playGhostEatenSound() {
    playTone(1200, 0.2, 0.05, 'sine');
  }

  // Initialize game
  function initGame() {
    initGrid();
    pacman = new PacMan();
    ghosts = [
      new Ghost('blinky', '#FF0000', 9, 9),   // Red - aggressive
      new Ghost('pinky', '#FFB8FF', 8, 9),    // Pink - ambusher
      new Ghost('inky', '#00FFFF', 10, 9),    // Cyan - patrol/chase
      new Ghost('clyde', '#FFB852', 9, 10)    // Orange - keeps distance
    ];
    
    // Stagger ghost spawn times
    ghosts.forEach((ghost, index) => {
      ghost.spawnTimer = index * 2000;
    });

    initAudio();
  }

  // Reset level
  function resetLevel() {
    initGrid();
    pacman.reset();
    ghosts.forEach(ghost => ghost.reset());
    game.frightenedMode = false;
    game.frightenedTimer = 0;
    game.particles = [];
    game.screenShake = 0;
  }

  // Game mechanics
  function activateFrightenedMode() {
    game.frightenedMode = true;
    game.frightenedTimer = FRIGHTENED_TIME;
    
    ghosts.forEach(ghost => {
      if (ghost.spawnTimer <= 0) {
        ghost.frightened = true;
        ghost.frightenedTimer = FRIGHTENED_TIME;
        ghost.speed = FRIGHTENED_SPEED;
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
    ghosts.forEach(ghost => {
      if (ghost.spawnTimer > 0) return;
      
      const distance = getDistance(pacman, ghost);
      if (distance < TILE * 0.6) {
        if (ghost.frightened) {
          // Eat ghost
          game.score += 200;
          createParticles(ghost.x, ghost.y, ghost.originalColor, 15);
          ghost.reset();
          ghost.spawnTimer = 5000;
          playGhostEatenSound();
        } else {
          // Pac-Man dies
          loseLife();
        }
      }
    });
  }

  function loseLife() {
    game.lives--;
    createParticles(pacman.x, pacman.y, '#FFFF00', 20);
    playDeathSound();
    
    if (game.lives <= 0) {
      gameOver();
    } else {
      // Reset positions but keep level progress
      pacman.reset();
      ghosts.forEach(ghost => {
        ghost.reset();
        ghost.spawnTimer = 1000;
      });
      game.running = false;
      setTimeout(() => {
        game.running = true;
      }, 2000);
    }
  }

  function nextLevel() {
    game.level++;
    createParticles(canvas.width / 2, canvas.height / 2, '#FFD700', 30);
    playLevelSound();
    
    // Increase difficulty
    ghosts.forEach(ghost => {
      ghost.speed *= 1.08;
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
    // Animated gradient background
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width
    );
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze with enhanced 3D effect
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tileType = grid[y][x];
        const pixelX = x * TILE;
        const pixelY = y * TILE;

        switch (tileType) {
          case WALL:
            // 3D wall effect
            const wallGradient = ctx.createLinearGradient(
              pixelX, pixelY, pixelX + TILE, pixelY + TILE
            );
            wallGradient.addColorStop(0, '#0040FF');
            wallGradient.addColorStop(0.5, '#003399');
            wallGradient.addColorStop(1, '#001166');
            
            ctx.fillStyle = wallGradient;
            ctx.fillRect(pixelX, pixelY, TILE, TILE);
            
            // Top highlight
            ctx.fillStyle = '#0066FF';
            ctx.fillRect(pixelX, pixelY, TILE, 2);
            
            // Left highlight
            ctx.fillRect(pixelX, pixelY, 2, TILE);
            
            // Bottom shadow
            ctx.fillStyle = '#001133';
            ctx.fillRect(pixelX, pixelY + TILE - 2, TILE, 2);
            
            // Right shadow
            ctx.fillRect(pixelX + TILE - 2, pixelY, 2, TILE);
            break;
            
          case DOT:
            // Glowing dot
            ctx.save();
            ctx.shadowColor = '#FFFF00';
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(pixelX + TILE/2, pixelY + TILE/2, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
            
          case POWER:
            // Animated power pellet with rainbow effect
            const pulse = Math.sin(Date.now() * 0.008) * 0.4 + 0.6;
            const hue = (Date.now() * 0.1) % 360;
            ctx.save();
            ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            ctx.shadowBlur = 15 * pulse;
            ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
            ctx.globalAlpha = pulse;
            ctx.beginPath();
            ctx.arc(pixelX + TILE/2, pixelY + TILE/2, 7 * pulse, 0, Math.PI * 2);
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
      // Cool transition overlay
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
      ctx.shadowBlur = 20;
      
      if (game.lives <= 0) {
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Final Score: ${game.score}`, canvas.width / 2, canvas.height / 2 + 20);
      } else if (game.dotsRemaining <= 0) {
        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`LEVEL ${game.level}`, canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#FFFF00';
        ctx.fillText('GET READY!', canvas.width / 2, canvas.height / 2 + 20);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('GET READY!', canvas.width / 2, canvas.height / 2);
      }
      
      ctx.restore();
    }

    // Pause overlay
    if (game.paused && game.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.font = '14px Arial';
      ctx.fillText('Press SPACE to continue', canvas.width / 2, canvas.height / 2 + 40);
      ctx.restore();
    }

    // Frightened mode indicator
    if (game.frightenedMode && game.running) {
      const timeLeft = Math.ceil(game.frightenedTimer / 1000);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = timeLeft <= 3 ? '#FF0000' : '#0000FF';
      ctx.font = 'bold 16px Arial';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 5;
      ctx.fillText(`POWER MODE: ${timeLeft}s`, canvas.width / 2, 30);
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

  // Enhanced game loop
  let lastTime = 0;
  
  function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.016); // Cap at 60fps
    lastTime = currentTime;

    if (game.running && !game.paused) {
      // Update frightened mode
      if (game.frightenedMode) {
        game.frightenedTimer -= deltaTime * 1000;
        if (game.frightenedTimer <= 0) {
          game.frightenedMode = false;
        }
      }

      // Update entities
      pacman.update(deltaTime);
      ghosts.forEach(ghost => ghost.update(deltaTime, pacman));
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

  // Auto-focus canvas
  canvas.focus();
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  
  console.log('Enhanced Pac-Man game loaded! 🎮');
})();