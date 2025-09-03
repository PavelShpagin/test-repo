/*
  Pac‑Man JS – Freeze-Free Reliable Version
  Simple, stable game without performance issues
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
  const highScoreValueEl = document.getElementById('highScoreValue');

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
  const PACMAN_SPEED = 4;
  const GHOST_SPEED = 3;
  const FRIGHTENED_SPEED = 2;
  
  // Game timers
  const FRIGHTENED_TIME = 8000;
  
  // Simple maze
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
    highScore: parseInt(localStorage.getItem('pacman-highscore') || '0')
  };

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

  // Simple, reliable Pac-Man class
  class PacMan {
    constructor() {
      this.reset();
      this.mouthAngle = 0;
      this.animSpeed = 8;
    }

    reset() {
      this.tileX = 9;
      this.tileY = 15;
      const center = getTileCenter(this.tileX, this.tileY);
      this.x = center.x;
      this.y = center.y;
      this.direction = { x: 0, y: 0 };
      this.nextDirection = { x: 0, y: 0 };
      this.speed = PACMAN_SPEED * TILE;
    }

    setDirection(dx, dy) {
      this.nextDirection = { x: dx, y: dy };
    }

    update(deltaTime) {
      if (!game.running) return;

      // Animate mouth
      this.mouthAngle += this.animSpeed * deltaTime;
      if (this.mouthAngle > Math.PI * 2) this.mouthAngle = 0;

      // Check if we're at tile center for direction changes
      const centerX = this.tileX * TILE + TILE / 2;
      const centerY = this.tileY * TILE + TILE / 2;
      const atCenter = Math.abs(this.x - centerX) < 2 && Math.abs(this.y - centerY) < 2;

      if (atCenter && (this.nextDirection.x !== 0 || this.nextDirection.y !== 0)) {
        const nextTileX = this.tileX + this.nextDirection.x;
        const nextTileY = this.tileY + this.nextDirection.y;
        
        if (isValidPosition(nextTileX, nextTileY)) {
          this.direction = { ...this.nextDirection };
          this.nextDirection = { x: 0, y: 0 };
          // Snap to exact center for perfect alignment
          this.x = centerX;
          this.y = centerY;
        }
      }

      // Move Pac-Man with anti-overshoot
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        const newX = this.x + this.direction.x * this.speed * deltaTime;
        const newY = this.y + this.direction.y * this.speed * deltaTime;
        
        // Calculate which tile we're moving into
        const newTileX = Math.round((newX - TILE/2) / TILE);
        const newTileY = Math.round((newY - TILE/2) / TILE);

        // Anti-overshoot: check if we're going too far from tile center
        const targetCenterX = newTileX * TILE + TILE / 2;
        const targetCenterY = newTileY * TILE + TILE / 2;
        const maxDistance = TILE * 0.4; // Don't go more than 40% from center

        // Clamp position to prevent overshooting
        let clampedX = newX;
        let clampedY = newY;
        
        if (Math.abs(newX - targetCenterX) > maxDistance) {
          clampedX = targetCenterX + Math.sign(newX - targetCenterX) * maxDistance;
        }
        if (Math.abs(newY - targetCenterY) > maxDistance) {
          clampedY = targetCenterY + Math.sign(newY - targetCenterY) * maxDistance;
        }

        // Check if new position is valid
        if (isValidPosition(newTileX, newTileY)) {
          this.x = clampedX;
          this.y = clampedY;
          this.tileX = newTileX;
          this.tileY = newTileY;
        } else {
          // Stop at wall and center perfectly
          this.x = centerX;
          this.y = centerY;
          this.direction = { x: 0, y: 0 };
        }
      }

      // Tunnel wrap-around with precise positioning
      if (this.x < -TILE/2) {
        this.x = canvas.width + TILE/2;
        this.tileX = COLS - 1;
      } else if (this.x > canvas.width + TILE/2) {
        this.x = -TILE/2;
        this.tileX = 0;
      }

      // Eat dots and power pellets (only when centered)
      if (atCenter) {
        const currentTile = grid[this.tileY] && grid[this.tileY][this.tileX];
        if (currentTile === DOT) {
          grid[this.tileY][this.tileX] = EMPTY;
          game.score += 10;
          game.dotsRemaining--;
          createParticles(this.x, this.y, '#FFFF00', 4);
          playEatSound();
          
          if (game.dotsRemaining <= 0) {
            nextLevel();
          }
        } else if (currentTile === POWER) {
          grid[this.tileY][this.tileX] = EMPTY;
          game.score += 50;
          game.dotsRemaining--;
          createParticles(this.x, this.y, '#FFB8FF', 8);
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
      ctx.translate(this.x, this.y);
      
      // Rotate based on direction
      let angle = 0;
      if (this.direction.x > 0) angle = 0;
      else if (this.direction.x < 0) angle = Math.PI;
      else if (this.direction.y < 0) angle = -Math.PI / 2;
      else if (this.direction.y > 0) angle = Math.PI / 2;
      
      ctx.rotate(angle);

      // Glow effect
      ctx.shadowColor = '#FFFF00';
      ctx.shadowBlur = 8;

      // Draw Pac-Man body
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      
      // Mouth animation
      if (this.direction.x !== 0 || this.direction.y !== 0) {
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

      ctx.restore();
    }
  }

  // Simple Ghost class without complex pathfinding
  class Ghost {
    constructor(name, color, startX, startY) {
      this.name = name;
      this.color = color;
      this.originalColor = color;
      this.startTileX = startX;
      this.startTileY = startY;
      this.reset();
      this.lastDirection = { x: 0, y: 1 };
      this.directionChangeTimer = 0;
    }

    reset() {
      this.tileX = this.startTileX;
      this.tileY = this.startTileY;
      const center = getTileCenter(this.tileX, this.tileY);
      this.x = center.x;
      this.y = center.y;
      this.direction = { x: 0, y: 0 };
      this.speed = GHOST_SPEED * TILE;
      this.frightened = false;
      this.frightenedTimer = 0;
      this.spawnTimer = 2000;
      this.directionChangeTimer = 0;
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
          this.speed = GHOST_SPEED * TILE;
          this.color = this.originalColor;
        }
      }

      // Simple direction change timer
      this.directionChangeTimer += deltaTime * 1000;
      if (this.directionChangeTimer > 500) { // Change direction every 500ms
        this.directionChangeTimer = 0;
        this.chooseDirection(pacman);
      }

      // Move ghost with anti-overshoot
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        const newX = this.x + this.direction.x * this.speed * deltaTime;
        const newY = this.y + this.direction.y * this.speed * deltaTime;
        
        // Calculate which tile we're moving into
        const newTileX = Math.round((newX - TILE/2) / TILE);
        const newTileY = Math.round((newY - TILE/2) / TILE);

        // Anti-overshoot: check if we're going too far from tile center
        const targetCenterX = newTileX * TILE + TILE / 2;
        const targetCenterY = newTileY * TILE + TILE / 2;
        const maxDistance = TILE * 0.4; // Don't go more than 40% from center

        // Clamp position to prevent overshooting
        let clampedX = newX;
        let clampedY = newY;
        
        if (Math.abs(newX - targetCenterX) > maxDistance) {
          clampedX = targetCenterX + Math.sign(newX - targetCenterX) * maxDistance;
        }
        if (Math.abs(newY - targetCenterY) > maxDistance) {
          clampedY = targetCenterY + Math.sign(newY - targetCenterY) * maxDistance;
        }

        // Handle tunnel wrap-around
        let finalX = clampedX;
        let finalTileX = newTileX;
        if (clampedX < -TILE/2) {
          finalX = canvas.width + TILE/2;
          finalTileX = COLS - 1;
        } else if (clampedX > canvas.width + TILE/2) {
          finalX = -TILE/2;
          finalTileX = 0;
        }

        if (isValidPosition(finalTileX, newTileY)) {
          this.x = finalX;
          this.y = clampedY;
          this.tileX = finalTileX;
          this.tileY = newTileY;
        } else {
          // Hit wall - center and choose new direction
          const center = getTileCenter(this.tileX, this.tileY);
          this.x = center.x;
          this.y = center.y;
          this.chooseDirection(pacman);
        }
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
        const isReverse = dir.x === -this.lastDirection.x && dir.y === -this.lastDirection.y;
        return isValidPosition(newX, newY) && !isReverse;
      });

      if (validDirs.length === 0) {
        // Allow reverse if no other options
        const reverseDirs = directions.filter(dir => {
          const newX = this.tileX + dir.x;
          const newY = this.tileY + dir.y;
          return isValidPosition(newX, newY);
        });
        if (reverseDirs.length > 0) {
          this.direction = reverseDirs[0];
        }
      } else {
        // Simple AI
        let targetDir;
        if (this.frightened) {
          // Run away from Pac-Man
          const distances = validDirs.map(dir => {
            const newX = this.tileX + dir.x;
            const newY = this.tileY + dir.y;
            return getDistance({ x: newX, y: newY }, { x: pacman.tileX, y: pacman.tileY });
          });
          const maxDistIndex = distances.indexOf(Math.max(...distances));
          targetDir = validDirs[maxDistIndex];
        } else {
          // Chase Pac-Man
          const distances = validDirs.map(dir => {
            const newX = this.tileX + dir.x;
            const newY = this.tileY + dir.y;
            return getDistance({ x: newX, y: newY }, { x: pacman.tileX, y: pacman.tileY });
          });
          const minDistIndex = distances.indexOf(Math.min(...distances));
          targetDir = validDirs[minDistIndex];
        }
        this.direction = targetDir;
      }

      this.lastDirection = { ...this.direction };
    }

    draw() {
      if (this.spawnTimer > 0) return;
      
      const radius = TILE * 0.35;
      
      ctx.save();
      ctx.translate(this.x, this.y);

      // Glow effect
      ctx.shadowColor = this.frightened ? '#0000FF' : this.originalColor;
      ctx.shadowBlur = 6;

      // Ghost body
      const bodyColor = this.frightened ? 
        (this.frightenedTimer < 2000 && Math.floor(Date.now() / 200) % 2 ? '#FFFFFF' : '#0000FF') : 
        this.color;
        
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, -radius * 0.2, radius, Math.PI, 0);
      
      // Wavy bottom
      const waveCount = 4;
      const waveOffset = Date.now() * 0.008;
      for (let i = 0; i <= waveCount; i++) {
        const waveX = (i / waveCount) * radius * 2 - radius;
        const waveY = radius * 0.8 + Math.sin(i * Math.PI + waveOffset) * radius * 0.15;
        if (i === 0) ctx.lineTo(waveX, waveY);
        else ctx.lineTo(waveX, waveY);
      }
      ctx.closePath();
      ctx.fill();

      // Eyes
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.15, 0, Math.PI * 2);
      ctx.arc(radius * 0.3, -radius * 0.2, radius * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.08, 0, Math.PI * 2);
      ctx.arc(radius * 0.3, -radius * 0.2, radius * 0.08, 0, Math.PI * 2);
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
    initGrid();
    pacman = new PacMan();
    
    ghosts = [
      new Ghost('blinky', '#FF0000', 9, 9),
      new Ghost('pinky', '#FFB8FF', 8, 10),
      new Ghost('inky', '#00FFFF', 10, 10),
      new Ghost('clyde', '#FFB852', 9, 11)
    ];
    
    // Stagger spawn times
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
    ghosts.forEach(ghost => {
      if (ghost.spawnTimer > 0) return;
      
      const distance = getDistance(pacman, ghost);
      if (distance < TILE * 0.6) {
        if (ghost.frightened) {
          // Eat ghost
          game.score += 200;
          createParticles(ghost.x, ghost.y, ghost.originalColor, 10);
          ghost.reset();
          ghost.spawnTimer = 5000;
          playPowerSound();
        } else {
          // Pac-Man dies
          loseLife();
        }
      }
    });
  }

  function loseLife() {
    game.lives--;
    createParticles(pacman.x, pacman.y, '#FFFF00', 15);
    playDeathSound();
    
    if (game.lives <= 0) {
      gameOver();
    } else {
      pacman.reset();
      ghosts.forEach(ghost => {
        ghost.reset();
        ghost.spawnTimer = 1500;
      });
      game.running = false;
      setTimeout(() => {
        game.running = true;
      }, 2000);
    }
  }

  function nextLevel() {
    game.level++;
    createParticles(canvas.width / 2, canvas.height / 2, '#FFD700', 20);
    playLevelSound();
    
    ghosts.forEach(ghost => {
      ghost.speed *= 1.05;
    });
    pacman.speed *= 1.05;
    
    resetLevel();
    
    game.running = false;
    setTimeout(() => {
      game.running = true;
    }, 2500);
  }

  function gameOver() {
    game.running = false;
    game.gameStarted = false;
    
    // Save high score
    if (game.score > game.highScore) {
      game.highScore = game.score;
      localStorage.setItem('pacman-highscore', game.highScore.toString());
      createParticles(canvas.width / 2, canvas.height / 2, '#FFD700', 25);
    }
    
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
    
    // Update high score display
    if (highScoreValueEl) {
      highScoreValueEl.textContent = game.highScore.toString();
    }
  }

  // Drawing functions
  function drawMaze() {
    // Gradient background
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width
    );
    gradient.addColorStop(0, '#001122');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
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
            
            // Highlights and shadows
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
            const pulse = Math.sin(Date.now() * 0.008) * 0.4 + 0.6;
            ctx.save();
            ctx.shadowColor = '#FFFF00';
            ctx.shadowBlur = 12 * pulse;
            ctx.fillStyle = '#FFFF00';
            ctx.globalAlpha = pulse;
            ctx.beginPath();
            ctx.arc(pixelX + TILE/2, pixelY + TILE/2, 6 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            break;
        }
      }
    }
  }

  function updateParticles(deltaTime) {
    // Limit particles to prevent performance issues
    if (game.particles.length > 30) {
      game.particles = game.particles.slice(-20);
    }
    
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
    
    // Update high score display in title
    if (game.score > 0) {
      document.title = `Pac-Man - Score: ${game.score} | High: ${game.highScore}`;
    }
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
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 25);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Final Score: ${game.score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`High Score: ${game.highScore}`, canvas.width / 2, canvas.height / 2 + 20);
        
        if (game.score === game.highScore && game.score > 0) {
          ctx.fillStyle = '#00FF00';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('NEW HIGH SCORE!', canvas.width / 2, canvas.height / 2 + 40);
        }
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

  // Simple, reliable game loop
  let lastTime = 0;
  
  function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.016);
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
  
  // Initialize high score display
  if (highScoreValueEl) {
    highScoreValueEl.textContent = game.highScore.toString();
  }
  
  requestAnimationFrame(gameLoop);

  canvas.focus();
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  
  console.log('Freeze-Free Pac-Man Ready! 🎮⚡');
})();