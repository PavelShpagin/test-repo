/*
  Pac‑Man JS – Absolutely Minimal Freeze-Proof Version
  Simplest possible implementation that cannot freeze
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

  const COLS = 19;
  const ROWS = 21;
  const TILE = Math.floor(canvas.width / COLS);
  
  const WALL = 1;
  const DOT = 2;
  const POWER = 3;
  const EMPTY = 0;
  
  const PACMAN_SPEED = 4;
  const GHOST_SPEED = 3;
  const FRIGHTENED_SPEED = 2;
  const FRIGHTENED_TIME = 8000;
  
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

  const grid = [];
  
  function initGrid() {
    game.dotsRemaining = 0;
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
  }

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

  // Minimal Pac-Man
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

      this.mouthAngle += this.animSpeed * deltaTime;
      if (this.mouthAngle > Math.PI * 2) this.mouthAngle = 0;

      // Try to change direction
      if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
        const nextTileX = this.tileX + this.nextDirection.x;
        const nextTileY = this.tileY + this.nextDirection.y;
        
        if (isValidPosition(nextTileX, nextTileY)) {
          this.direction = { ...this.nextDirection };
          this.nextDirection = { x: 0, y: 0 };
        }
      }

      // Movement with perfect corridor alignment
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        const newX = this.x + this.direction.x * this.speed * deltaTime;
        const newY = this.y + this.direction.y * this.speed * deltaTime;
        
        const newTileX = Math.floor(newX / TILE);
        const newTileY = Math.floor(newY / TILE);

        if (isValidPosition(newTileX, newTileY)) {
          // Keep in corridor center - simple math only
          const centerX = newTileX * TILE + TILE / 2;
          const centerY = newTileY * TILE + TILE / 2;
          const maxDist = TILE * 0.35;
          
          const distX = newX - centerX;
          const distY = newY - centerY;
          
          // Simple clamping - no complex calculations
          if (distX > maxDist) this.x = centerX + maxDist;
          else if (distX < -maxDist) this.x = centerX - maxDist;
          else this.x = newX;
          
          if (distY > maxDist) this.y = centerY + maxDist;
          else if (distY < -maxDist) this.y = centerY - maxDist;
          else this.y = newY;
          
          this.tileX = newTileX;
          this.tileY = newTileY;
        } else {
          // Wall hit - center perfectly
          const center = getTileCenter(this.tileX, this.tileY);
          this.x = center.x;
          this.y = center.y;
          this.direction = { x: 0, y: 0 };
        }
      }

      // Tunnel wrap
      if (this.x < 0) {
        this.x = canvas.width;
        this.tileX = COLS - 1;
      } else if (this.x > canvas.width) {
        this.x = 0;
        this.tileX = 0;
      }

      // Collect items
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
      
      let angle = 0;
      if (this.direction.x > 0) angle = 0;
      else if (this.direction.x < 0) angle = Math.PI;
      else if (this.direction.y < 0) angle = -Math.PI / 2;
      else if (this.direction.y > 0) angle = Math.PI / 2;
      
      ctx.rotate(angle);

      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        const mouthSize = Math.abs(Math.sin(this.mouthAngle)) * 0.8 + 0.2;
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

  // Minimal Ghost
  class Ghost {
    constructor(name, color, startX, startY) {
      this.name = name;
      this.color = color;
      this.originalColor = color;
      this.startTileX = startX;
      this.startTileY = startY;
      this.reset();
      this.timer = Math.random() * 2000; // Random start
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
      this.timer = Math.random() * 2000;
    }

    update(deltaTime, pacman) {
      if (!game.running) return;

      if (this.spawnTimer > 0) {
        this.spawnTimer -= deltaTime * 1000;
        return;
      }

      if (this.frightened) {
        this.frightenedTimer -= deltaTime * 1000;
        if (this.frightenedTimer <= 0) {
          this.frightened = false;
          this.speed = GHOST_SPEED * TILE;
          this.color = this.originalColor;
        }
      }

      // AI timer
      this.timer += deltaTime * 1000;
      if (this.timer > 1500) {
        this.timer = 0;
        this.pickDirection(pacman);
      }

      // Movement with perfect corridor alignment
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        const newX = this.x + this.direction.x * this.speed * deltaTime;
        const newY = this.y + this.direction.y * this.speed * deltaTime;
        
        const newTileX = Math.floor(newX / TILE);
        const newTileY = Math.floor(newY / TILE);

        if (isValidPosition(newTileX, newTileY)) {
          // Keep in corridor center - simple math only
          const centerX = newTileX * TILE + TILE / 2;
          const centerY = newTileY * TILE + TILE / 2;
          const maxDist = TILE * 0.35;
          
          const distX = newX - centerX;
          const distY = newY - centerY;
          
          // Simple clamping - no complex calculations
          if (distX > maxDist) this.x = centerX + maxDist;
          else if (distX < -maxDist) this.x = centerX - maxDist;
          else this.x = newX;
          
          if (distY > maxDist) this.y = centerY + maxDist;
          else if (distY < -maxDist) this.y = centerY - maxDist;
          else this.y = newY;
          
          this.tileX = newTileX;
          this.tileY = newTileY;
        } else {
          // Wall hit - center perfectly
          const center = getTileCenter(this.tileX, this.tileY);
          this.x = center.x;
          this.y = center.y;
          this.direction = { x: 0, y: 0 };
        }
      }

      // Tunnel wrap
      if (this.x < 0) {
        this.x = canvas.width;
        this.tileX = COLS - 1;
      } else if (this.x > canvas.width) {
        this.x = 0;
        this.tileX = 0;
      }
    }

    // Absolutely minimal AI
    pickDirection(pacman) {
      if (this.frightened) {
        // Random
        const dirs = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
        this.direction = dirs[Math.floor(Math.random() * 4)];
      } else {
        // Chase - simple
        const dx = pacman.tileX - this.tileX;
        const dy = pacman.tileY - this.tileY;

        if (Math.abs(dx) > Math.abs(dy)) {
          this.direction = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
        } else {
          this.direction = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
        }
      }
    }

    draw() {
      if (this.spawnTimer > 0) return;
      
      const radius = TILE * 0.4;
      
      ctx.save();
      ctx.translate(this.x, this.y);

      const bodyColor = this.frightened ? '#0000FF' : this.color;
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, -radius * 0.2, radius, Math.PI, 0);
      
      const waveCount = 4;
      for (let i = 0; i <= waveCount; i++) {
        const waveX = (i / waveCount) * radius * 2 - radius;
        const waveY = radius * 0.8;
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

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.08, 0, Math.PI * 2);
      ctx.arc(radius * 0.3, -radius * 0.2, radius * 0.08, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  let pacman;
  let ghosts = [];

  // Sound
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
  function playPowerSound() { playTone(400, 0.3); }
  function playDeathSound() { playTone(200, 0.5); }
  function playLevelSound() { playTone(600, 0.3); }

  function initGame() {
    initGrid();
    pacman = new PacMan();
    ghosts = [
      new Ghost('blinky', '#FF0000', 9, 9),
      new Ghost('pinky', '#FFB8FF', 8, 10),
      new Ghost('inky', '#00FFFF', 10, 10),
      new Ghost('clyde', '#FFB852', 9, 11)
    ];
    
    ghosts[0].spawnTimer = 0;
    ghosts[1].spawnTimer = 2000;
    ghosts[2].spawnTimer = 4000;
    ghosts[3].spawnTimer = 6000;

    initAudio();
  }

  function resetLevel() {
    initGrid();
    pacman.reset();
    ghosts.forEach(ghost => ghost.reset());
    game.frightenedMode = false;
    game.frightenedTimer = 0;
  }

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
      if (distance < TILE * 0.7) {
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

  function drawMaze() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tileType = grid[y][x];
        const pixelX = x * TILE;
        const pixelY = y * TILE;

        switch (tileType) {
          case WALL:
            ctx.fillStyle = '#0000FF';
            ctx.fillRect(pixelX, pixelY, TILE, TILE);
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
  }

  function drawGameInfo() {
    if (!game.running && game.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      
      if (game.lives <= 0) {
        ctx.font = '20px Arial';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
      } else {
        ctx.font = '18px Arial';
        ctx.fillText('GET READY!', canvas.width / 2, canvas.height / 2);
      }
      
      ctx.restore();
    }

    if (game.paused && game.gameStarted) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
  }

  // Input
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

  // Game loop - absolutely minimal
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

  // Initialize
  startBtn.addEventListener('click', startGame);
  initGame();
  setupMobileControls();
  updateHUD();
  
  if (document.getElementById('highScoreValue')) {
    document.getElementById('highScoreValue').textContent = game.highScore.toString();
  }
  
  requestAnimationFrame(gameLoop);
  canvas.focus();
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  
  console.log('Minimal Freeze-Proof Pac-Man Ready! 🎮');
})();