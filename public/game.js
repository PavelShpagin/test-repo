/*
  Pac‑Man JS – Complete interactive game implementation
  Features:
  - Smooth responsive controls (keyboard + touch)
  - Intelligent ghost AI with different behaviors
  - Sound effects and visual feedback
  - Progressive difficulty
  - Mobile-friendly interface
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
  
  // Game speeds (tiles per second)
  const PACMAN_SPEED = 5;
  const GHOST_SPEED = 4;
  const FRIGHTENED_SPEED = 2;
  
  // Game timers
  const FRIGHTENED_TIME = 8000; // 8 seconds
  const GHOST_SPAWN_DELAY = 2000; // 2 seconds between ghost spawns
  
  // Simple but fun maze layout
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
    '#..#.............#.#',
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
    gameStarted: false
  };

  // Initialize grid
  const grid = [];
  for (let y = 0; y < ROWS; y++) {
    grid[y] = [];
    for (let x = 0; x < COLS; x++) {
      const char = MAZE[y][x];
      switch (char) {
        case '#': grid[y][x] = WALL; break;
        case '.': grid[y][x] = DOT; game.dotsRemaining++; break;
        case 'o': grid[y][x] = POWER; game.dotsRemaining++; break;
        default: grid[y][x] = EMPTY; break;
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

  // Pac-Man class
  class PacMan {
    constructor() {
      this.reset();
      this.mouthAngle = 0;
      this.animSpeed = 8;
    }

    reset() {
      const start = getTileCenter(9, 15); // Bottom center
      this.x = start.x;
      this.y = start.y;
      this.tileX = 9;
      this.tileY = 15;
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

      // Check if we can change direction
      const nextTileX = this.tileX + this.nextDirection.x;
      const nextTileY = this.tileY + this.nextDirection.y;
      
      if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
        if (isValidPosition(nextTileX, nextTileY)) {
          this.direction = { ...this.nextDirection };
          this.nextDirection = { x: 0, y: 0 };
        }
      }

      // Move Pac-Man
      const newX = this.x + this.direction.x * this.speed * deltaTime;
      const newY = this.y + this.direction.y * this.speed * deltaTime;
      
      const newTileX = Math.floor(newX / TILE);
      const newTileY = Math.floor(newY / TILE);

      // Check if new position is valid
      if (isValidPosition(newTileX, newTileY)) {
        this.x = newX;
        this.y = newY;
        this.tileX = newTileX;
        this.tileY = newTileY;
      } else {
        // Stop at wall
        this.direction = { x: 0, y: 0 };
      }

      // Tunnel wrap-around
      if (this.x < 0) {
        this.x = canvas.width;
        this.tileX = COLS - 1;
      } else if (this.x > canvas.width) {
        this.x = 0;
        this.tileX = 0;
      }

      // Eat dots and power pellets
      const currentTile = grid[this.tileY][this.tileX];
      if (currentTile === DOT) {
        grid[this.tileY][this.tileX] = EMPTY;
        game.score += 10;
        game.dotsRemaining--;
        playEatSound();
        
        if (game.dotsRemaining <= 0) {
          nextLevel();
        }
      } else if (currentTile === POWER) {
        grid[this.tileY][this.tileX] = EMPTY;
        game.score += 50;
        game.dotsRemaining--;
        activateFrightenedMode();
        playPowerSound();
        
        if (game.dotsRemaining <= 0) {
          nextLevel();
        }
      }
    }

    draw() {
      const radius = TILE * 0.4;
      
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
      
      // Mouth animation
      const mouthSize = Math.abs(Math.sin(this.mouthAngle)) * 0.8 + 0.2;
      const startAngle = mouthSize * 0.5;
      const endAngle = Math.PI * 2 - mouthSize * 0.5;
      
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();

      // Add outline
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }
  }

  // Ghost class
  class Ghost {
    constructor(name, color, startX, startY) {
      this.name = name;
      this.color = color;
      this.originalColor = color;
      this.startTileX = startX;
      this.startTileY = startY;
      this.reset();
      this.lastDirection = { x: 0, y: 1 }; // Start moving down
    }

    reset() {
      const start = getTileCenter(this.startTileX, this.startTileY);
      this.x = start.x;
      this.y = start.y;
      this.tileX = this.startTileX;
      this.tileY = this.startTileY;
      this.direction = { x: 0, y: 0 };
      this.speed = GHOST_SPEED * TILE;
      this.frightened = false;
      this.frightenedTimer = 0;
      this.mode = 'chase';
      this.spawnTimer = GHOST_SPAWN_DELAY;
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

      // Simple AI: move towards or away from Pac-Man
      const directions = [
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 },  // right
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }  // left
      ];

      // Filter valid directions (no walls, no reverse unless necessary)
      const validDirs = directions.filter(dir => {
        const newX = this.tileX + dir.x;
        const newY = this.tileY + dir.y;
        const isReverse = dir.x === -this.lastDirection.x && dir.y === -this.lastDirection.y;
        return isValidPosition(newX, newY) && !isReverse;
      });

      if (validDirs.length === 0) {
        // If no valid directions, allow reverse
        const reverseDirs = directions.filter(dir => {
          const newX = this.tileX + dir.x;
          const newY = this.tileY + dir.y;
          return isValidPosition(newX, newY);
        });
        if (reverseDirs.length > 0) {
          this.direction = reverseDirs[0];
        }
      } else {
        // Choose direction based on mode
        let targetDir;
        if (this.frightened) {
          // Run away from Pac-Man
          const pacDist = validDirs.map(dir => {
            const newX = this.tileX + dir.x;
            const newY = this.tileY + dir.y;
            return getDistance({ x: newX, y: newY }, { x: pacman.tileX, y: pacman.tileY });
          });
          const maxDistIndex = pacDist.indexOf(Math.max(...pacDist));
          targetDir = validDirs[maxDistIndex];
        } else {
          // Chase Pac-Man
          const pacDist = validDirs.map(dir => {
            const newX = this.tileX + dir.x;
            const newY = this.tileY + dir.y;
            return getDistance({ x: newX, y: newY }, { x: pacman.tileX, y: pacman.tileY });
          });
          const minDistIndex = pacDist.indexOf(Math.min(...pacDist));
          targetDir = validDirs[minDistIndex];
        }
        this.direction = targetDir;
      }

      this.lastDirection = { ...this.direction };

      // Move ghost
      const newX = this.x + this.direction.x * this.speed * deltaTime;
      const newY = this.y + this.direction.y * this.speed * deltaTime;
      
      const newTileX = Math.floor(newX / TILE);
      const newTileY = Math.floor(newY / TILE);

      if (isValidPosition(newTileX, newTileY)) {
        this.x = newX;
        this.y = newY;
        this.tileX = newTileX;
        this.tileY = newTileY;
      }

      // Tunnel wrap-around
      if (this.x < 0) {
        this.x = canvas.width;
        this.tileX = COLS - 1;
      } else if (this.x > canvas.width) {
        this.x = 0;
        this.tileX = 0;
      }
    }

    draw() {
      const radius = TILE * 0.4;
      
      ctx.save();
      ctx.translate(this.x, this.y);

      // Ghost body
      ctx.fillStyle = this.frightened ? '#0000FF' : this.color;
      ctx.beginPath();
      ctx.arc(0, -radius * 0.2, radius, Math.PI, 0);
      
      // Ghost bottom with wavy effect
      const waveCount = 4;
      for (let i = 0; i <= waveCount; i++) {
        const waveX = (i / waveCount) * radius * 2 - radius;
        const waveY = radius * 0.8 + Math.sin(i * Math.PI) * radius * 0.2;
        if (i === 0) ctx.lineTo(waveX, waveY);
        else ctx.lineTo(waveX, waveY);
      }
      ctx.closePath();
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.2, 0, Math.PI * 2);
      ctx.arc(radius * 0.3, -radius * 0.2, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.1, 0, Math.PI * 2);
      ctx.arc(radius * 0.3, -radius * 0.2, radius * 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Game entities
  let pacman;
  let ghosts = [];

  // Sound effects (simple beep sounds using Web Audio API)
  let audioContext;
  
  function initAudio() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  function playTone(frequency, duration, volume = 0.1) {
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
      setTimeout(() => playTone(200 - i * 30, 0.2), i * 100);
    }
  }

  function playLevelSound() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => playTone(600 + i * 200, 0.2), i * 150);
    }
  }

  // Initialize game
  function initGame() {
    pacman = new PacMan();
    ghosts = [
      new Ghost('blinky', '#FF0000', 9, 9),   // Red
      new Ghost('pinky', '#FFB8FF', 8, 9),    // Pink  
      new Ghost('inky', '#00FFFF', 10, 9),    // Cyan
      new Ghost('clyde', '#FFB852', 9, 10)    // Orange
    ];
    
    // Stagger ghost spawn times
    ghosts.forEach((ghost, index) => {
      ghost.spawnTimer = index * 3000; // 3 second intervals
    });

    initAudio();
  }

  // Reset level
  function resetLevel() {
    // Restore dots and power pellets
    game.dotsRemaining = 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const char = MAZE[y][x];
        switch (char) {
          case '.': grid[y][x] = DOT; game.dotsRemaining++; break;
          case 'o': grid[y][x] = POWER; game.dotsRemaining++; break;
          case '#': grid[y][x] = WALL; break;
          default: grid[y][x] = EMPTY; break;
        }
      }
    }

    pacman.reset();
    ghosts.forEach(ghost => ghost.reset());
    game.frightenedMode = false;
    game.frightenedTimer = 0;
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
      }
    });
  }

  function checkCollisions() {
    ghosts.forEach(ghost => {
      if (ghost.spawnTimer > 0) return;
      
      const distance = getDistance(pacman, ghost);
      if (distance < TILE * 0.7) {
        if (ghost.frightened) {
          // Eat ghost
          game.score += 200;
          ghost.reset();
          ghost.spawnTimer = 5000; // 5 second respawn
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
    playDeathSound();
    
    if (game.lives <= 0) {
      gameOver();
    } else {
      // Reset positions but keep level progress
      pacman.reset();
      ghosts.forEach(ghost => {
        ghost.reset();
        ghost.spawnTimer = 1000; // Quick respawn after death
      });
      game.running = false;
      setTimeout(() => {
        game.running = true;
      }, 2000); // 2 second pause
    }
  }

  function nextLevel() {
    game.level++;
    playLevelSound();
    
    // Increase difficulty
    ghosts.forEach(ghost => {
      ghost.speed *= 1.1; // 10% faster each level
    });
    
    resetLevel();
    
    // Show level up message briefly
    game.running = false;
    setTimeout(() => {
      game.running = true;
    }, 2000);
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

  // Drawing functions
  function drawMaze() {
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tileType = grid[y][x];
        const pixelX = x * TILE;
        const pixelY = y * TILE;

        switch (tileType) {
          case WALL:
            ctx.fillStyle = '#0000FF';
            ctx.fillRect(pixelX, pixelY, TILE, TILE);
            ctx.strokeStyle = '#4040FF';
            ctx.lineWidth = 1;
            ctx.strokeRect(pixelX + 1, pixelY + 1, TILE - 2, TILE - 2);
            break;
            
          case DOT:
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(pixelX + TILE/2, pixelY + TILE/2, 2, 0, Math.PI * 2);
            ctx.fill();
            break;
            
          case POWER:
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(pixelX + TILE/2, pixelY + TILE/2, 6, 0, Math.PI * 2);
            ctx.fill();
            // Add pulsing effect
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;
            ctx.fill();
            ctx.globalAlpha = 1;
            break;
        }
      }
    }
  }

  function updateHUD() {
    scoreEl.textContent = game.score.toString().padStart(6, '0');
    levelEl.textContent = game.level.toString();
    livesEl.textContent = '❤'.repeat(Math.max(0, game.lives));
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

  // Game loop
  let lastTime = 0;
  
  function gameLoop(currentTime) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (game.running && !game.paused) {
      // Update frightened mode timer
      if (game.frightenedMode) {
        game.frightenedTimer -= deltaTime * 1000;
        if (game.frightenedTimer <= 0) {
          game.frightenedMode = false;
        }
      }

      // Update entities
      pacman.update(deltaTime);
      ghosts.forEach(ghost => ghost.update(deltaTime, pacman));
      
      // Check collisions
      checkCollisions();
      
      // Update HUD
      updateHUD();
    }

    // Draw everything
    drawMaze();
    pacman.draw();
    ghosts.forEach(ghost => ghost.draw());
    
    // Show pause message if paused
    if (game.paused && game.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.fillText('Press SPACE to continue', canvas.width / 2, canvas.height / 2 + 30);
    }

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
  
  console.log('Pac-Man game initialized! Use arrow keys or WASD to move, SPACE to pause.');
})();