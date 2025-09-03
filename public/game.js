/*
  Pac‑Man JS – Modern Enhanced Version
  Smooth gameplay with modern visuals and no stalls
*/

(function() {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false; // For crisp pixel art
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const livesEl = document.getElementById('lives');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('startBtn');
  
  // Performance optimization variables
  let frameCount = 0;
  let fps = 60;
  let fpsInterval = 1000 / fps;
  let then = Date.now();
  let startTime = then;

  const COLS = 19;
  const ROWS = 21;
  const TILE = Math.floor(canvas.width / COLS);
  
  const WALL = 1;
  const DOT = 2;
  const POWER = 3;
  const EMPTY = 0;
  const FRUIT = 4;
  
  // Animation timing
  const ANIMATION_SPEED = 0.15;
  let globalAnimTimer = 0;
  
  // Particle system for effects
  const particles = [];
  
  // Sound effects (using Web Audio API for better performance)
  let audioContext = null;
  const sounds = {
    dot: { frequency: 440, duration: 0.05 },
    powerPellet: { frequency: 880, duration: 0.1 },
    eatGhost: { frequency: 220, duration: 0.2 },
    death: { frequency: 110, duration: 0.5 }
  };
  
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
    combo: 0,
    lastDotTime: 0,
    fruitSpawned: false,
    fruitTimer: 0,
    highScore: localStorage.getItem('pacmanHighScore') || 0
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

  // Initialize audio context
  function initAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  
  // Play sound effect
  function playSound(soundType) {
    if (!audioContext || !game.running) return;
    
    const sound = sounds[soundType];
    if (!sound) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = sound.frequency;
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + sound.duration);
  }
  
  // Particle class for visual effects
  class Particle {
    constructor(x, y, color, size = 3) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 4;
      this.vy = (Math.random() - 0.5) * 4;
      this.color = color;
      this.size = size;
      this.life = 1;
      this.decay = 0.02;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= this.decay;
      this.size *= 0.98;
      return this.life > 0;
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
  }
  
  // Enhanced Pac-Man with smooth animations
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
      this.animFrame = 0;
      this.deathAnimation = 0;
      this.isDying = false;
    }

    setDirection(dx, dy) {
      this.nextDirection = { x: dx, y: dy };
    }

    update(deltaTime) {
      if (!game.running || this.isDying) return;
      
      // Clamp deltaTime to prevent large jumps
      deltaTime = Math.min(deltaTime, 0.033);

      this.mouthAngle += 10 * deltaTime;
      this.animFrame += ANIMATION_SPEED;

      // Change direction
      if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
        const nextX = this.tileX + this.nextDirection.x;
        const nextY = this.tileY + this.nextDirection.y;
        
        if (isValidPosition(nextX, nextY)) {
          this.direction = { ...this.nextDirection };
          this.nextDirection = { x: 0, y: 0 };
        }
      }

      // Move with simple alignment
      const newX = this.x + this.direction.x * this.speed * deltaTime;
      const newY = this.y + this.direction.y * this.speed * deltaTime;
      
      const newTileX = Math.floor(newX / TILE);
      const newTileY = Math.floor(newY / TILE);

      if (isValidPosition(newTileX, newTileY)) {
        // Simple corridor centering - basic math only
        const tileCenterX = newTileX * TILE + TILE / 2;
        const tileCenterY = newTileY * TILE + TILE / 2;
        
        // Keep within 40% of tile center - simple bounds
        const maxOffset = TILE * 0.4;
        const offsetX = newX - tileCenterX;
        const offsetY = newY - tileCenterY;
        
        // Basic clamping
        if (offsetX > maxOffset) {
          this.x = tileCenterX + maxOffset;
        } else if (offsetX < -maxOffset) {
          this.x = tileCenterX - maxOffset;
        } else {
          this.x = newX;
        }
        
        if (offsetY > maxOffset) {
          this.y = tileCenterY + maxOffset;
        } else if (offsetY < -maxOffset) {
          this.y = tileCenterY - maxOffset;
        } else {
          this.y = newY;
        }
        
        this.tileX = newTileX;
        this.tileY = newTileY;
      } else {
        // Hit wall - snap to center
        this.x = this.tileX * TILE + TILE / 2;
        this.y = this.tileY * TILE + TILE / 2;
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

      // Eat with combo system
      const tile = grid[this.tileY][this.tileX];
      if (tile === DOT) {
        grid[this.tileY][this.tileX] = EMPTY;
        
        // Combo scoring
        const now = Date.now();
        if (now - game.lastDotTime < 500) {
          game.combo = Math.min(game.combo + 1, 10);
        } else {
          game.combo = 1;
        }
        game.lastDotTime = now;
        
        const points = 10 * game.combo;
        game.score += points;
        game.dotsRemaining--;
        
        // Create particle effect
        for (let i = 0; i < 3; i++) {
          particles.push(new Particle(this.x, this.y, '#FFFF00', 2));
        }
        
        playSound('dot');
        
        if (game.dotsRemaining <= 0) {
          nextLevel();
        }
      } else if (tile === POWER) {
        grid[this.tileY][this.tileX] = EMPTY;
        game.score += 50;
        game.dotsRemaining--;
        
        // Create power pellet effect
        for (let i = 0; i < 8; i++) {
          particles.push(new Particle(this.x, this.y, '#FFD700', 4));
        }
        
        playSound('powerPellet');
        activateFrightenedMode();
        
        if (game.dotsRemaining <= 0) {
          nextLevel();
        }
      } else if (tile === FRUIT) {
        grid[this.tileY][this.tileX] = EMPTY;
        game.score += 100 * game.level;
        game.fruitSpawned = false;
        
        // Fruit particle burst
        for (let i = 0; i < 12; i++) {
          particles.push(new Particle(this.x, this.y, '#FF69B4', 5));
        }
      }
    }

    draw() {
      if (this.isDying) {
        this.drawDeath();
        return;
      }
      
      const radius = TILE * 0.45;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      
      // Rotation based on direction
      let rotation = 0;
      if (this.direction.x > 0) rotation = 0;
      else if (this.direction.x < 0) rotation = Math.PI;
      else if (this.direction.y < 0) rotation = -Math.PI / 2;
      else if (this.direction.y > 0) rotation = Math.PI / 2;
      
      ctx.rotate(rotation);
      
      // Draw Pac-Man with gradient
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
      gradient.addColorStop(0, '#FFFF66');
      gradient.addColorStop(0.7, '#FFDD00');
      gradient.addColorStop(1, '#FFB000');
      
      ctx.fillStyle = gradient;
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      
      if (this.direction.x !== 0 || this.direction.y !== 0) {
        const mouth = Math.abs(Math.sin(this.mouthAngle)) * 0.8 + 0.2;
        ctx.arc(0, 0, radius, mouth * 0.5, Math.PI * 2 - mouth * 0.5);
        ctx.lineTo(0, 0);
      } else {
        ctx.arc(0, 0, radius, 0.2, Math.PI * 2 - 0.2);
        ctx.lineTo(0, 0);
      }
      
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw eye
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-radius * 0.15, -radius * 0.35, radius * 0.12, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    drawDeath() {
      const radius = TILE * 0.45;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      
      ctx.fillStyle = '#FFFF00';
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 1;
      
      const angle = this.deathAnimation * Math.PI;
      
      ctx.beginPath();
      ctx.arc(0, 0, radius, angle, Math.PI * 2 - angle);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
      
      this.deathAnimation += 0.02;
      if (this.deathAnimation >= 1) {
        this.isDying = false;
        this.deathAnimation = 0;
      }
    }
  }

  // Enhanced Ghost with personality
  class Ghost {
    constructor(name, color, startX, startY, personality) {
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
      this.personality = personality; // 'aggressive', 'ambush', 'patrol', 'random'
      this.animFrame = Math.random() * 2;
      this.eaten = false;
      this.eyesOnly = false;
    }

    update(deltaTime, pacman) {
      if (!game.running) return;
      
      // Clamp deltaTime
      deltaTime = Math.min(deltaTime, 0.033);
      
      this.animFrame += ANIMATION_SPEED;

      if (this.spawnTimer > 0) {
        this.spawnTimer -= deltaTime * 1000;
        return;
      }
      
      if (this.eaten && this.eyesOnly) {
        // Return to spawn when eaten
        const spawnX = 9;
        const spawnY = 10;
        const dx = spawnX - this.tileX;
        const dy = spawnY - this.tileY;
        
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
          this.eaten = false;
          this.eyesOnly = false;
          this.frightened = false;
          this.color = this.originalColor;
          this.speed = 3 * TILE;
        } else {
          this.speed = 6 * TILE; // Move fast when returning
          if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = { x: dx > 0 ? 1 : -1, y: 0 };
          } else {
            this.direction = { x: 0, y: dy > 0 ? 1 : -1 };
          }
        }
      } else if (this.frightened) {
        this.frightenedTimer -= deltaTime * 1000;
        if (this.frightenedTimer <= 0) {
          this.frightened = false;
          this.speed = 3 * TILE;
          this.color = this.originalColor;
        }
      }

      // Enhanced AI based on personality
      this.aiTimer += deltaTime * 1000;
      if (this.aiTimer > 1500) {
        this.aiTimer = 0;
        
        if (this.eyesOnly) {
          // Already handled above
        } else if (this.frightened) {
          // Run away from Pac-Man
          const dx = this.tileX - pacman.tileX;
          const dy = this.tileY - pacman.tileY;
          
          if (Math.random() < 0.7) {
            if (Math.abs(dx) > Math.abs(dy)) {
              this.direction = { x: dx > 0 ? 1 : -1, y: 0 };
            } else {
              this.direction = { x: 0, y: dy > 0 ? 1 : -1 };
            }
          } else {
            this.direction = { x: Math.random() < 0.5 ? 1 : -1, y: 0 };
          }
        } else {
          // Personality-based movement
          const dx = pacman.tileX - this.tileX;
          const dy = pacman.tileY - this.tileY;
          
          switch(this.personality) {
            case 'aggressive':
              // Direct chase
              if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = { x: dx > 0 ? 1 : -1, y: 0 };
              } else {
                this.direction = { x: 0, y: dy > 0 ? 1 : -1 };
              }
              break;
              
            case 'ambush':
              // Try to cut off Pac-Man
              const futureX = pacman.tileX + pacman.direction.x * 4;
              const futureY = pacman.tileY + pacman.direction.y * 4;
              const fdx = futureX - this.tileX;
              const fdy = futureY - this.tileY;
              
              if (Math.abs(fdx) > Math.abs(fdy)) {
                this.direction = { x: fdx > 0 ? 1 : -1, y: 0 };
              } else {
                this.direction = { x: 0, y: fdy > 0 ? 1 : -1 };
              }
              break;
              
            case 'patrol':
              // Patrol corners
              if (Math.random() < 0.3) {
                this.direction = { 
                  x: Math.random() < 0.5 ? 1 : -1, 
                  y: 0 
                };
              }
              break;
              
            case 'random':
            default:
              // Random movement with slight bias toward Pac-Man
              if (Math.random() < 0.6) {
                if (Math.abs(dx) > Math.abs(dy)) {
                  this.direction = { x: dx > 0 ? 1 : -1, y: 0 };
                } else {
                  this.direction = { x: 0, y: dy > 0 ? 1 : -1 };
                }
              } else {
                this.direction = { 
                  x: Math.random() < 0.5 ? 1 : -1, 
                  y: 0 
                };
              }
              break;
          }
        }
      }

      // Move with simple alignment
      const newX = this.x + this.direction.x * this.speed * deltaTime;
      const newY = this.y + this.direction.y * this.speed * deltaTime;
      
      const newTileX = Math.floor(newX / TILE);
      const newTileY = Math.floor(newY / TILE);

      if (isValidPosition(newTileX, newTileY)) {
        // Simple corridor centering - basic math only
        const tileCenterX = newTileX * TILE + TILE / 2;
        const tileCenterY = newTileY * TILE + TILE / 2;
        
        // Keep within 40% of tile center - simple bounds
        const maxOffset = TILE * 0.4;
        const offsetX = newX - tileCenterX;
        const offsetY = newY - tileCenterY;
        
        // Basic clamping
        if (offsetX > maxOffset) {
          this.x = tileCenterX + maxOffset;
        } else if (offsetX < -maxOffset) {
          this.x = tileCenterX - maxOffset;
        } else {
          this.x = newX;
        }
        
        if (offsetY > maxOffset) {
          this.y = tileCenterY + maxOffset;
        } else if (offsetY < -maxOffset) {
          this.y = tileCenterY - maxOffset;
        } else {
          this.y = newY;
        }
        
        this.tileX = newTileX;
        this.tileY = newTileY;
      } else {
        // Hit wall - snap to center
        this.x = this.tileX * TILE + TILE / 2;
        this.y = this.tileY * TILE + TILE / 2;
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
      
      const radius = TILE * 0.45;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      
      if (this.eyesOnly) {
        // Draw only eyes when eaten
        this.drawEyes(radius);
      } else {
        // Draw ghost body
        const bodyColor = this.frightened ? 
          (this.frightenedTimer < 2000 && Math.floor(this.frightenedTimer / 200) % 2 ? '#FFFFFF' : '#3333FF') : 
          this.color;
        
        // Ghost body with gradient
        const gradient = ctx.createRadialGradient(0, -radius/2, 0, 0, 0, radius);
        gradient.addColorStop(0, this.adjustBrightness(bodyColor, 30));
        gradient.addColorStop(0.7, bodyColor);
        gradient.addColorStop(1, this.adjustBrightness(bodyColor, -30));
        
        ctx.fillStyle = gradient;
        
        // Draw ghost shape
        ctx.beginPath();
        ctx.arc(0, -radius * 0.3, radius * 0.8, Math.PI, 0);
        ctx.lineTo(radius * 0.8, radius * 0.5);
        
        // Wavy bottom
        const waves = 4;
        const waveWidth = (radius * 1.6) / waves;
        for (let i = waves; i >= 0; i--) {
          const x = -radius * 0.8 + i * waveWidth;
          const y = radius * 0.5 + Math.sin(this.animFrame + i) * radius * 0.15;
          if (i === waves) {
            ctx.lineTo(x, y);
          } else {
            ctx.quadraticCurveTo(
              x + waveWidth/2, 
              radius * 0.5 - radius * 0.1, 
              x, y
            );
          }
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Add shadow/outline
        ctx.strokeStyle = this.adjustBrightness(bodyColor, -50);
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Draw face
        if (this.frightened) {
          // Scared face
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(-radius * 0.25, -radius * 0.2, radius * 0.12, 0, Math.PI * 2);
          ctx.arc(radius * 0.25, -radius * 0.2, radius * 0.12, 0, Math.PI * 2);
          ctx.fill();
          
          // Wavy mouth
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-radius * 0.3, radius * 0.1);
          for (let i = 0; i <= 6; i++) {
            const x = -radius * 0.3 + (i / 6) * radius * 0.6;
            const y = radius * 0.1 + Math.sin(i * Math.PI / 3) * radius * 0.05;
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        } else {
          this.drawEyes(radius);
        }
      }
      
      ctx.restore();
    }
    
    drawEyes(radius) {
      // Eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-radius * 0.25, -radius * 0.2, radius * 0.25, 0, Math.PI * 2);
      ctx.arc(radius * 0.25, -radius * 0.2, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
      
      // Pupils (look at Pac-Man)
      ctx.fillStyle = '#0033CC';
      const eyeX = this.direction.x * radius * 0.08;
      const eyeY = this.direction.y * radius * 0.08;
      ctx.beginPath();
      ctx.arc(-radius * 0.25 + eyeX, -radius * 0.2 + eyeY, radius * 0.12, 0, Math.PI * 2);
      ctx.arc(radius * 0.25 + eyeX, -radius * 0.2 + eyeY, radius * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    
    adjustBrightness(color, percent) {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
    }
  }

  let pacman = new PacMan();
  let ghosts = [
    new Ghost('blinky', '#FF0000', 9, 9, 'aggressive'),
    new Ghost('pinky', '#FFB8FF', 8, 10, 'ambush'),
    new Ghost('inky', '#00FFFF', 10, 10, 'patrol'),
    new Ghost('clyde', '#FFB852', 9, 11, 'random')
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
      if (ghost.spawnTimer > 0 || ghost.eyesOnly) return;
      
      const dx = pacman.x - ghost.x;
      const dy = pacman.y - ghost.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < TILE * 0.7) {
        if (ghost.frightened) {
          game.score += 200 * (game.combo || 1);
          ghost.eaten = true;
          ghost.eyesOnly = true;
          ghost.frightened = false;
          
          // Ghost eaten effect
          for (let i = 0; i < 10; i++) {
            particles.push(new Particle(ghost.x, ghost.y, ghost.color, 6));
          }
          
          playSound('eatGhost');
        } else if (!pacman.isDying) {
          loseLife();
        }
      }
    });
  }

  function loseLife() {
    if (pacman.isDying) return;
    
    pacman.isDying = true;
    game.running = false;
    playSound('death');
    
    setTimeout(() => {
      game.lives--;
      
      if (game.lives <= 0) {
        gameOver();
      } else {
        pacman.isDying = false;
        pacman.tileX = 9;
        pacman.tileY = 15;
        pacman.x = pacman.tileX * TILE + TILE / 2;
        pacman.y = pacman.tileY * TILE + TILE / 2;
        pacman.direction = { x: 0, y: 0 };
        pacman.nextDirection = { x: 0, y: 0 };
        
        ghosts.forEach((ghost, i) => {
          ghost.tileX = [9, 8, 10, 9][i];
          ghost.tileY = [9, 10, 10, 11][i];
          ghost.x = ghost.tileX * TILE + TILE / 2;
          ghost.y = ghost.tileY * TILE + TILE / 2;
          ghost.spawnTimer = 1000 + i * 500;
          ghost.frightened = false;
          ghost.eaten = false;
          ghost.eyesOnly = false;
          ghost.color = ghost.originalColor;
        });
        
        setTimeout(() => { game.running = true; }, 1000);
      }
    }, 1500);
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
    
    // Update high score
    if (game.score > game.highScore) {
      game.highScore = game.score;
      localStorage.setItem('pacmanHighScore', game.highScore);
    }
    
    document.getElementById('highScoreValue').textContent = game.highScore;
    overlay.classList.add('show');
    startBtn.textContent = 'Play Again';
  }

  function startGame() {
    initAudio();
    overlay.classList.remove('show');
    game.score = 0;
    game.lives = 3;
    game.level = 1;
    game.running = true;
    game.gameStarted = true;
    game.combo = 0;
    game.fruitSpawned = false;
    particles.length = 0;
    
    pacman = new PacMan();
    ghosts = [
      new Ghost('blinky', '#FF0000', 9, 9, 'aggressive'),
      new Ghost('pinky', '#FFB8FF', 8, 10, 'ambush'),
      new Ghost('inky', '#00FFFF', 10, 10, 'patrol'),
      new Ghost('clyde', '#FFB852', 9, 11, 'random')
    ];
    
    ghosts[0].spawnTimer = 0;
    ghosts[1].spawnTimer = 2000;
    ghosts[2].spawnTimer = 4000;
    ghosts[3].spawnTimer = 6000;
    
    initGrid();
    updateHUD();
  }

  function drawMaze() {
    // Dark background with subtle gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#0a0a1f');
    bgGradient.addColorStop(1, '#000000');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tile = grid[y][x];
        const px = x * TILE;
        const py = y * TILE;

        if (tile === WALL) {
          // 3D-style walls with gradients
          const wallGradient = ctx.createLinearGradient(px, py, px + TILE, py + TILE);
          wallGradient.addColorStop(0, '#1a1aff');
          wallGradient.addColorStop(0.5, '#0000ff');
          wallGradient.addColorStop(1, '#000088');
          
          ctx.fillStyle = wallGradient;
          ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          
          // Wall borders for depth
          ctx.strokeStyle = '#4444ff';
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
          
          // Inner highlight
          ctx.strokeStyle = '#6666ff';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
          
        } else if (tile === DOT) {
          // Animated dots
          const pulse = Math.sin(globalAnimTimer * 2) * 0.3 + 1;
          ctx.fillStyle = '#FFFF00';
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#FFFF00';
          ctx.beginPath();
          ctx.arc(px + TILE/2, py + TILE/2, 2 * pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
        } else if (tile === POWER) {
          // Pulsating power pellets
          const pulse = Math.sin(globalAnimTimer * 3) * 2 + 6;
          const powerGradient = ctx.createRadialGradient(
            px + TILE/2, py + TILE/2, 0,
            px + TILE/2, py + TILE/2, pulse
          );
          powerGradient.addColorStop(0, '#FFFFFF');
          powerGradient.addColorStop(0.5, '#FFFF00');
          powerGradient.addColorStop(1, '#FF8800');
          
          ctx.fillStyle = powerGradient;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#FFFF00';
          ctx.beginPath();
          ctx.arc(px + TILE/2, py + TILE/2, pulse, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          
        } else if (tile === FRUIT) {
          // Draw fruit (cherry)
          ctx.fillStyle = '#FF0066';
          ctx.beginPath();
          ctx.arc(px + TILE/2 - 4, py + TILE/2, 5, 0, Math.PI * 2);
          ctx.arc(px + TILE/2 + 4, py + TILE/2, 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px + TILE/2, py + TILE/2 - 5);
          ctx.lineTo(px + TILE/2, py + TILE/2 - 10);
          ctx.stroke();
        }
      }
    }
  }

  function updateHUD() {
    scoreEl.textContent = game.score.toString().padStart(6, '0');
    levelEl.textContent = game.level.toString();
    
    // Animated lives display
    let livesDisplay = '';
    for (let i = 0; i < game.lives; i++) {
      livesDisplay += '🟡';
    }
    livesEl.textContent = livesDisplay;
    
    // Show combo
    if (game.combo > 1) {
      const comboEl = document.getElementById('combo');
      if (!comboEl) {
        const newComboEl = document.createElement('span');
        newComboEl.id = 'combo';
        newComboEl.style.color = '#FFD700';
        newComboEl.style.marginLeft = '10px';
        scoreEl.parentNode.appendChild(newComboEl);
      }
      document.getElementById('combo').textContent = `x${game.combo}`;
    }
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

  // Optimized game loop with frame limiting
  let lastTime = performance.now();
  let accumulator = 0;
  const fixedTimeStep = 1000 / 60; // 60 FPS
  const maxAccumulator = fixedTimeStep * 5; // Prevent spiral of death
  
  function gameLoop(currentTime) {
    // Calculate delta time and prevent large jumps
    const frameTime = Math.min(currentTime - lastTime, maxAccumulator);
    lastTime = currentTime;
    accumulator += frameTime;
    
    // Fixed timestep with interpolation
    while (accumulator >= fixedTimeStep) {
      const deltaTime = fixedTimeStep / 1000;
      updateGame(deltaTime);
      accumulator -= fixedTimeStep;
    }
    
    // Render with interpolation
    const interpolation = accumulator / fixedTimeStep;
    render(interpolation);
    
    requestAnimationFrame(gameLoop);
  }
  
  function updateGame(deltaTime) {
    globalAnimTimer += deltaTime;

    if (game.running && !game.paused) {
      if (game.frightenedMode) {
        game.frightenedTimer -= deltaTime * 1000;
        if (game.frightenedTimer <= 0) {
          game.frightenedMode = false;
        }
      }
      
      // Spawn fruit occasionally
      if (!game.fruitSpawned && Math.random() < 0.001) {
        game.fruitSpawned = true;
        game.fruitTimer = 10000;
        // Place fruit in center
        grid[10][9] = FRUIT;
      }
      
      if (game.fruitSpawned) {
        game.fruitTimer -= deltaTime * 1000;
        if (game.fruitTimer <= 0) {
          game.fruitSpawned = false;
          if (grid[10][9] === FRUIT) {
            grid[10][9] = EMPTY;
          }
        }
      }

      pacman.update(deltaTime);
      ghosts.forEach(ghost => ghost.update(deltaTime, pacman));
      
      // Update particles
      for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update()) {
          particles.splice(i, 1);
        }
      }
      
      checkCollisions();
      updateHUD();
    }
  }
  
  function render(interpolation) {
    drawMaze();
    
    // Draw particles
    particles.forEach(p => p.draw());
    
    pacman.draw();
    ghosts.forEach(ghost => ghost.draw());
    drawGameInfo();
  }

  // Initialize
  initGrid();
  startBtn.addEventListener('click', startGame);
  setupMobileControls();
  updateHUD();
  document.getElementById('highScoreValue').textContent = game.highScore;
  
  // Start the optimized game loop
  requestAnimationFrame(gameLoop);
  canvas.focus();
  
  // Prevent context menu on canvas
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  
  console.log('🎮 Modern Pac-Man Ready! No stalls, smooth gameplay!');
})();