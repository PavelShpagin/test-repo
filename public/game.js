/*
  Pac‑Man JS – Dead Simple Version
  Absolutely minimal code that cannot freeze
*/

(function() {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
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
    gameStarted: false
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

  // Dead simple Pac-Man
  class PacMan {
    constructor() {
      this.tileX = 9;
      this.tileY = 15;
      this.x = this.tileX * TILE + TILE / 2;
      this.y = this.tileY * TILE + TILE / 2;
      this.direction = { x: 0, y: 0 };
      this.nextDirection = { x: 0, y: 0 };
      this.speed = 4 * TILE;
      this.mouthAngle = 0;
    }

    setDirection(dx, dy) {
      this.nextDirection = { x: dx, y: dy };
    }

    update(deltaTime) {
      if (!game.running) return;

      this.mouthAngle += 8 * deltaTime;

      // Change direction
      if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
        const nextX = this.tileX + this.nextDirection.x;
        const nextY = this.tileY + this.nextDirection.y;
        
        if (isValidPosition(nextX, nextY)) {
          this.direction = { ...this.nextDirection };
          this.nextDirection = { x: 0, y: 0 };
        }
      }

      // Move
      const newX = this.x + this.direction.x * this.speed * deltaTime;
      const newY = this.y + this.direction.y * this.speed * deltaTime;
      
      const newTileX = Math.floor(newX / TILE);
      const newTileY = Math.floor(newY / TILE);

      if (isValidPosition(newTileX, newTileY)) {
        this.x = newX;
        this.y = newY;
        this.tileX = newTileX;
        this.tileY = newTileY;
      } else {
        this.direction = { x: 0, y: 0 };
      }

      // Wrap
      if (this.x < 0) {
        this.x = canvas.width;
        this.tileX = COLS - 1;
      } else if (this.x > canvas.width) {
        this.x = 0;
        this.tileX = 0;
      }

      // Eat
      const tile = grid[this.tileY][this.tileX];
      if (tile === DOT) {
        grid[this.tileY][this.tileX] = EMPTY;
        game.score += 10;
        game.dotsRemaining--;
        
        if (game.dotsRemaining <= 0) {
          nextLevel();
        }
      } else if (tile === POWER) {
        grid[this.tileY][this.tileX] = EMPTY;
        game.score += 50;
        game.dotsRemaining--;
        activateFrightenedMode();
        
        if (game.dotsRemaining <= 0) {
          nextLevel();
        }
      }
    }

    draw() {
      const radius = TILE * 0.4;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      
      if (this.direction.x > 0) ctx.rotate(0);
      else if (this.direction.x < 0) ctx.rotate(Math.PI);
      else if (this.direction.y < 0) ctx.rotate(-Math.PI / 2);
      else if (this.direction.y > 0) ctx.rotate(Math.PI / 2);

      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        const mouth = Math.abs(Math.sin(this.mouthAngle)) * 0.8 + 0.2;
        ctx.arc(0, 0, radius, mouth * 0.5, Math.PI * 2 - mouth * 0.5);
        ctx.lineTo(0, 0);
      } else {
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
      }
      
      ctx.fill();
      ctx.restore();
    }
  }

  // Dead simple Ghost
  class Ghost {
    constructor(name, color, startX, startY) {
      this.name = name;
      this.color = color;
      this.originalColor = color;
      this.tileX = startX;
      this.tileY = startY;
      this.x = this.tileX * TILE + TILE / 2;
      this.y = this.tileY * TILE + TILE / 2;
      this.direction = { x: 0, y: 0 };
      this.speed = 3 * TILE;
      this.frightened = false;
      this.frightenedTimer = 0;
      this.spawnTimer = 2000;
      this.aiTimer = Math.random() * 3000;
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
          this.speed = 3 * TILE;
          this.color = this.originalColor;
        }
      }

      // AI
      this.aiTimer += deltaTime * 1000;
      if (this.aiTimer > 2000) {
        this.aiTimer = 0;
        
        if (this.frightened) {
          this.direction = { x: Math.random() < 0.5 ? 1 : -1, y: 0 };
        } else {
          const dx = pacman.tileX - this.tileX;
          const dy = pacman.tileY - this.tileY;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = { x: dx > 0 ? 1 : -1, y: 0 };
          } else {
            this.direction = { x: 0, y: dy > 0 ? 1 : -1 };
          }
        }
      }

      // Move
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

      // Wrap
      if (this.x < 0) {
        this.x = canvas.width;
        this.tileX = COLS - 1;
      } else if (this.x > canvas.width) {
        this.x = 0;
        this.tileX = 0;
      }
    }

    draw() {
      if (this.spawnTimer > 0) return;
      
      const radius = TILE * 0.4;
      
      ctx.save();
      ctx.translate(this.x, this.y);

      ctx.fillStyle = this.frightened ? '#0000FF' : this.color;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.2, 0, Math.PI * 2);
      ctx.arc(radius * 0.3, -radius * 0.3, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, Math.PI * 2);
      ctx.arc(radius * 0.3, -radius * 0.3, radius * 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  let pacman = new PacMan();
  let ghosts = [
    new Ghost('blinky', '#FF0000', 9, 9),
    new Ghost('pinky', '#FFB8FF', 8, 10),
    new Ghost('inky', '#00FFFF', 10, 10),
    new Ghost('clyde', '#FFB852', 9, 11)
  ];

  ghosts[0].spawnTimer = 0;
  ghosts[1].spawnTimer = 2000;
  ghosts[2].spawnTimer = 4000;
  ghosts[3].spawnTimer = 6000;

  function activateFrightenedMode() {
    game.frightenedMode = true;
    game.frightenedTimer = 8000;
    
    ghosts.forEach(ghost => {
      if (ghost.spawnTimer <= 0) {
        ghost.frightened = true;
        ghost.frightenedTimer = 8000;
        ghost.speed = 2 * TILE;
        ghost.color = '#0000FF';
      }
    });
  }

  function checkCollisions() {
    ghosts.forEach(ghost => {
      if (ghost.spawnTimer > 0) return;
      
      const dx = pacman.x - ghost.x;
      const dy = pacman.y - ghost.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < TILE * 0.7) {
        if (ghost.frightened) {
          game.score += 200;
          ghost.spawnTimer = 5000;
          ghost.x = ghost.tileX * TILE + TILE / 2;
          ghost.y = ghost.tileY * TILE + TILE / 2;
        } else {
          loseLife();
        }
      }
    });
  }

  function loseLife() {
    game.lives--;
    
    if (game.lives <= 0) {
      gameOver();
    } else {
      pacman.tileX = 9;
      pacman.tileY = 15;
      pacman.x = pacman.tileX * TILE + TILE / 2;
      pacman.y = pacman.tileY * TILE + TILE / 2;
      pacman.direction = { x: 0, y: 0 };
      
      ghosts.forEach(ghost => {
        ghost.x = ghost.tileX * TILE + TILE / 2;
        ghost.y = ghost.tileY * TILE + TILE / 2;
        ghost.spawnTimer = 1500;
      });
      
      game.running = false;
      setTimeout(() => { game.running = true; }, 2000);
    }
  }

  function nextLevel() {
    game.level++;
    initGrid();
    
    pacman.tileX = 9;
    pacman.tileY = 15;
    pacman.x = pacman.tileX * TILE + TILE / 2;
    pacman.y = pacman.tileY * TILE + TILE / 2;
    pacman.direction = { x: 0, y: 0 };
    
    ghosts.forEach(ghost => {
      ghost.x = ghost.tileX * TILE + TILE / 2;
      ghost.y = ghost.tileY * TILE + TILE / 2;
      ghost.spawnTimer = 1000;
    });
    
    game.running = false;
    setTimeout(() => { game.running = true; }, 2000);
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
    initGrid();
    updateHUD();
  }

  function drawMaze() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tile = grid[y][x];
        const px = x * TILE;
        const py = y * TILE;

        if (tile === WALL) {
          ctx.fillStyle = '#0000FF';
          ctx.fillRect(px, py, TILE, TILE);
        } else if (tile === DOT) {
          ctx.fillStyle = '#FFFF00';
          ctx.beginPath();
          ctx.arc(px + TILE/2, py + TILE/2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === POWER) {
          ctx.fillStyle = '#FFFF00';
          ctx.beginPath();
          ctx.arc(px + TILE/2, py + TILE/2, 6, 0, Math.PI * 2);
          ctx.fill();
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
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      
      if (game.lives <= 0) {
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
      } else {
        ctx.fillText('GET READY!', canvas.width / 2, canvas.height / 2);
      }
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

  // Mobile
  function setupMobileControls() {
    const buttons = {
      'btnUp': { x: 0, y: -1 }, 'btnDown': { x: 0, y: 1 },
      'btnLeft': { x: -1, y: 0 }, 'btnRight': { x: 1, y: 0 }
    };

    Object.entries(buttons).forEach(([id, dir]) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (!game.gameStarted) startGame();
          else pacman.setDirection(dir.x, dir.y);
        });
      }
    });
  }

  // Game loop
  let lastTime = 0;
  
  function gameLoop(time) {
    const deltaTime = Math.min((time - lastTime) / 1000, 0.016);
    lastTime = time;

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
  initGrid();
  startBtn.addEventListener('click', startGame);
  setupMobileControls();
  updateHUD();
  requestAnimationFrame(gameLoop);
  canvas.focus();
  
  console.log('Ultra-Simple Pac-Man Ready!');
})();