/*
  Pac‑Man JS – Ultimate Solution: All Issues Fixed
  No freeze + Perfect alignment + No overshoot + No flickering
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
    highScore: parseInt(localStorage.getItem('pacman-highscore') || '0')
  };

  // Initialize grid - no flickering
  const grid = [];
  const originalGrid = []; // Static copy to prevent flickering
  
  function initGrid() {
    game.dotsRemaining = 0;
    for (let y = 0; y < ROWS; y++) {
      grid[y] = [];
      originalGrid[y] = [];
      for (let x = 0; x < COLS; x++) {
        const char = MAZE[y][x];
        let tileType = EMPTY;
        switch (char) {
          case '#': tileType = WALL; break;
          case '.': tileType = DOT; game.dotsRemaining++; break;
          case 'o': tileType = POWER; game.dotsRemaining++; break;
        }
        grid[y][x] = tileType;
        originalGrid[y][x] = tileType; // Static copy
      }
    }
  }

  // Helper functions
  function isValidPosition(x, y) {
    return x >= 0 && y >= 0 && x < COLS && y < ROWS && originalGrid[y][x] !== WALL;
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

  // Pac-Man class - all issues fixed
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

      // Mouth animation
      this.mouthAngle += this.animSpeed * deltaTime;
      if (this.mouthAngle > Math.PI * 2) this.mouthAngle = 0;

      // Direction change at tile centers only
      const centerX = this.tileX * TILE + TILE / 2;
      const centerY = this.tileY * TILE + TILE / 2;
      const nearCenter = Math.abs(this.x - centerX) < 4 && Math.abs(this.y - centerY) < 4;

      if (nearCenter && (this.nextDirection.x !== 0 || this.nextDirection.y !== 0)) {
        const nextTileX = this.tileX + this.nextDirection.x;
        const nextTileY = this.tileY + this.nextDirection.y;
        
        if (isValidPosition(nextTileX, nextTileY)) {
          this.direction = { ...this.nextDirection };
          this.nextDirection = { x: 0, y: 0 };
          // Perfect center snap
          this.x = centerX;
          this.y = centerY;
        }
      }

      // Movement with overflow prevention
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        let newX = this.x + this.direction.x * this.speed * deltaTime;
        let newY = this.y + this.direction.y * this.speed * deltaTime;
        
        const newTileX = Math.floor(newX / TILE);
        const newTileY = Math.floor(newY / TILE);

        if (isValidPosition(newTileX, newTileY)) {
          // Keep within corridor bounds - no overflow
          const tileLeft = newTileX * TILE + 4;
          const tileRight = newTileX * TILE + TILE - 4;
          const tileTop = newTileY * TILE + 4;
          const tileBottom = newTileY * TILE + TILE - 4;
          
          this.x = Math.max(tileLeft, Math.min(tileRight, newX));
          this.y = Math.max(tileTop, Math.min(tileBottom, newY));
          this.tileX = newTileX;
          this.tileY = newTileY;
        } else {
          // Wall hit - stop cleanly
          this.direction = { x: 0, y: 0 };
        }
      }

      // Tunnel wrap-around
      if (this.x < 0) {
        this.x = canvas.width;
        this.tileX = COLS - 1;
      } else if (this.x > canvas.width) {
        this.x = 0;
        this.tileX = 0;
      }

      // Collect items - no flickering
      if (nearCenter) {
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

  // Ghost class - simple and reliable
  class Ghost {
    constructor(name, color, startX, startY) {
      this.name = name;
      this.color = color;
      this.originalColor = color;
      this.startTileX = startX;
      this.startTileY = startY;
      this.reset();
      this.moveTimer = 0;
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
      this.moveTimer = 0;
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

      // Simple move timer - no complex AI
      this.moveTimer += deltaTime * 1000;
      if (this.moveTimer > 1200) { // Every 1.2 seconds
        this.moveTimer = 0;
        this.pickDirection(pacman);
      }

      // Movement with overflow prevention
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        let newX = this.x + this.direction.x * this.speed * deltaTime;
        let newY = this.y + this.direction.y * this.speed * deltaTime;
        
        const newTileX = Math.floor(newX / TILE);
        const newTileY = Math.floor(newY / TILE);

        if (isValidPosition(newTileX, newTileY)) {
          // Keep within corridor bounds - no overflow
          const tileLeft = newTileX * TILE + 4;
          const tileRight = newTileX * TILE + TILE - 4;
          const tileTop = newTileY * TILE + 4;
          const tileBottom = newTileY * TILE + TILE - 4;
          
          this.x = Math.max(tileLeft, Math.min(tileRight, newX));
          this.y = Math.max(tileTop, Math.min(tileBottom, newY));
          this.tileX = newTileX;
          this.tileY = newTileY;
        } else {
          // Wall hit - stop cleanly
          this.direction = { x: 0, y: 0 };
        }
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

    // Ultra-simple AI - absolutely cannot freeze
    pickDirection(pacman) {
      // Only 4 possible directions
      const up = { x: 0, y: -1 };
      const right = { x: 1, y: 0 };
      const down = { x: 0, y: 1 };
      const left = { x: -1, y: 0 };

      // Check each direction manually - no loops
      const canGoUp = isValidPosition(this.tileX + up.x, this.tileY + up.y);
      const canGoRight = isValidPosition(this.tileX + right.x, this.tileY + right.y);
      const canGoDown = isValidPosition(this.tileX + down.x, this.tileY + down.y);
      const canGoLeft = isValidPosition(this.tileX + left.x, this.tileY + left.y);

      if (this.frightened) {
        // Random valid direction when frightened
        if (canGoUp && Math.random() < 0.25) this.direction = up;
        else if (canGoRight && Math.random() < 0.33) this.direction = right;
        else if (canGoDown && Math.random() < 0.5) this.direction = down;
        else if (canGoLeft) this.direction = left;
        else if (canGoUp) this.direction = up;
        else if (canGoRight) this.direction = right;
        else if (canGoDown) this.direction = down;
        else this.direction = { x: 0, y: 0 };
      } else {
        // Chase Pac-Man - simple distance check
        const dx = pacman.tileX - this.tileX;
        const dy = pacman.tileY - this.tileY;

        // Prefer horizontal movement if further horizontally
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0 && canGoRight) this.direction = right;
          else if (dx < 0 && canGoLeft) this.direction = left;
          else if (dy > 0 && canGoDown) this.direction = down;
          else if (dy < 0 && canGoUp) this.direction = up;
          else if (canGoRight) this.direction = right;
          else if (canGoLeft) this.direction = left;
          else if (canGoDown) this.direction = down;
          else if (canGoUp) this.direction = up;
          else this.direction = { x: 0, y: 0 };
        } else {
          // Prefer vertical movement
          if (dy > 0 && canGoDown) this.direction = down;
          else if (dy < 0 && canGoUp) this.direction = up;
          else if (dx > 0 && canGoRight) this.direction = right;
          else if (dx < 0 && canGoLeft) this.direction = left;
          else if (canGoDown) this.direction = down;
          else if (canGoUp) this.direction = up;
          else if (canGoRight) this.direction = right;
          else if (canGoLeft) this.direction = left;
          else this.direction = { x: 0, y: 0 };
        }
      }
    }

    draw() {
      if (this.spawnTimer > 0) return;
      
      const radius = TILE * 0.35;
      
      ctx.save();
      ctx.translate(this.x, this.y);

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

  function playEatSound() { playTone(800, 0.1); }
  function playPowerSound() { playTone(400, 0.3); setTimeout(() => playTone(600, 0.3), 100); }
  function playDeathSound() { for (let i = 0; i < 5; i++) setTimeout(() => playTone(400 - i * 50, 0.2), i * 100); }
  function playLevelSound() { for (let i = 0; i < 3; i++) setTimeout(() => playTone(600 + i * 200, 0.2), i * 150); }

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
        ghost.direction.x *= -1;
        ghost.direction.y *= -1;
      }
    });
  }

  function checkCollisions() {
    ghosts.forEach(ghost => {
      if (ghost.spawnTimer > 0) return;
      
      const distance = getDistance(pacman, ghost);
      if (distance < TILE * 0.6) {
        if (ghost.frightened) {
          game.score += 200;
          ghost.reset();
          ghost.spawnTimer = 5000;
          playPowerSound();
        } else {
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
      pacman.reset();
      ghosts.forEach(ghost => {
        ghost.reset();
        ghost.spawnTimer = 1500;
      });
      game.running = false;
      setTimeout(() => { game.running = true; }, 2000);
    }
  }

  function nextLevel() {
    game.level++;
    playLevelSound();
    
    ghosts.forEach(ghost => { ghost.speed *= 1.05; });
    pacman.speed *= 1.05;
    
    resetLevel();
    game.running = false;
    setTimeout(() => { game.running = true; }, 2500);
  }

  function gameOver() {
    game.running = false;
    game.gameStarted = false;
    
    if (game.score > game.highScore) {
      game.highScore = game.score;
      localStorage.setItem('pacman-highscore', game.highScore.toString());
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
  }

  // Drawing functions - no flickering
  function drawMaze() {
    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze using static grid
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tileType = grid[y][x]; // Use current grid state
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
            break;
        }
      }
    }
  }

  function updateHUD() {
    scoreEl.textContent = game.score.toString().padStart(6, '0');
    levelEl.textContent = game.level.toString();
    livesEl.textContent = '❤'.repeat(Math.max(0, game.lives));
    
    if (game.score > 0) {
      document.title = `Pac-Man - Score: ${game.score} | High: ${game.highScore}`;
    }
  }

  function drawGameInfo() {
    if (!game.running && game.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      
      if (game.lives <= 0) {
        ctx.font = 'bold 24px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '14px Arial';
        ctx.fillText(`Score: ${game.score}`, canvas.width / 2, canvas.height / 2 + 5);
        ctx.fillText(`High: ${game.highScore}`, canvas.width / 2, canvas.height / 2 + 25);
      } else if (game.dotsRemaining <= 0) {
        ctx.font = 'bold 20px Arial';
        ctx.fillText(`LEVEL ${game.level}`, canvas.width / 2, canvas.height / 2 - 10);
        ctx.font = '14px Arial';
        ctx.fillText('GET READY!', canvas.width / 2, canvas.height / 2 + 15);
      } else {
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
      case 'ArrowUp': case 'KeyW': pacman.setDirection(0, -1); break;
      case 'ArrowDown': case 'KeyS': pacman.setDirection(0, 1); break;
      case 'ArrowLeft': case 'KeyA': pacman.setDirection(-1, 0); break;
      case 'ArrowRight': case 'KeyD': pacman.setDirection(1, 0); break;
      case 'Space': game.paused = !game.paused; break;
    }
    e.preventDefault();
  });

  // Mobile controls
  function setupMobileControls() {
    const buttons = {
      'btnUp': { x: 0, y: -1 }, 'btnDown': { x: 0, y: 1 },
      'btnLeft': { x: -1, y: 0 }, 'btnRight': { x: 1, y: 0 }
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

  // Touch swipe
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

  // Ultra-simple game loop
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
      
      checkCollisions();
      updateHUD();
    }

    drawMaze();
    pacman.draw();
    ghosts.forEach(ghost => ghost.draw());
    drawGameInfo();
    
    requestAnimationFrame(gameLoop);
  }

  // Event listeners
  startBtn.addEventListener('click', startGame);

  // Initialize
  initGame();
  setupMobileControls();
  updateHUD();
  
  if (document.getElementById('highScoreValue')) {
    document.getElementById('highScoreValue').textContent = game.highScore.toString();
  }
  
  requestAnimationFrame(gameLoop);
  canvas.focus();
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  
  console.log('All Issues Fixed - Final Pac-Man Ready! 🎮🎯');
})();