/*
  Pac‑Man JS – Canvas implementation with A* ghost AI and mobile controls
  Notes:
  - Uses vector rendering so it works out of the box without external sprites.
  - If you add images to ./assets (see README in assets), they will be used automatically.
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

  // Grid constants
  const COLS = 28; // classic width
  const ROWS = 31; // classic height
  const TILE = Math.floor(canvas.width / COLS);
  const WALL = 1; // impassable
  const DOT = 2; // small pellet
  const POWER = 3; // energizer
  const EMPTY = 0; // empty path
  const GATE = 4; // ghost house gate (pass-through for ghosts only)

  // Speed configuration (pixels per second)
  const PACMAN_SPEED = TILE * 8; // 8 tiles/sec
  const GHOST_SPEED = TILE * 7.5; // ghost slightly slower normally
  const FRIGHTENED_SPEED = TILE * 5.5;

  // Timers
  const FRIGHTENED_TIME = 6000; // ms

  // State
  const state = {
    score: 0,
    level: 1,
    lives: 3,
    running: false,
    dotsRemaining: 0,
  };

  // Convenience
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function tileCenter(x, y) { return { x: x * TILE + TILE / 2, y: y * TILE + TILE / 2 }; }
  function pixelToTile(px, py) { return { x: Math.floor(px / TILE), y: Math.floor(py / TILE) }; }
  function isIntersection(tx, ty) {
    const n = isPassable(tx, ty - 1);
    const s = isPassable(tx, ty + 1);
    const w = isPassable(tx - 1, ty);
    const e = isPassable(tx + 1, ty);
    return (n + s + w + e) >= 3; // 3 or 4 ways
  }

  // Classic-ish maze map (28x31). Legend: #=wall, .=dot, o=power, = is gate, space is empty
  // Symmetric handcrafted layout resembling the original – not pixel-perfect but close and fun.
  const MAZE_STR = [
    '############################',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#o####.#####.##.#####.####o#',
    '#.####.#####.##.#####.####.#',
    '#..........................#',
    '#.####.##.########.##.####.#',
    '#.####.##.########.##.####.#',
    '#......##....##....##......#',
    '######.##### ## #####.######',
    '     #.##### ## #####.#     ',
    '     #.##          ##.#     ',
    '     #.## ###==### ##.#     ',
    '######.## #      # ##.######',
    '      .   #      #   .      ',
    '######.## #      # ##.######',
    '     #.## ######## ##.#     ',
    '     #.##          ##.#     ',
    '     #.## ######## ##.#     ',
    '######.## ######## ##.######',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#o..##................##..o#',
    '###.##.##.########.##.##.###',
    '#......##....##....##......#',
    '#.##########.##.##########.#',
    '#..........................#',
    '############################'
  ];

  // Expand to full 31 rows by inserting tunnel and house rows appropriately
  // Above array contains 28 rows; we will insert three more rows to match 31.
  while (MAZE_STR.length < ROWS) MAZE_STR.splice(14, 0, '######.## #      # ##.######');

  // Convert to grid
  const grid = new Array(ROWS);
  for (let y = 0; y < ROWS; y++) {
    grid[y] = new Array(COLS);
    const row = MAZE_STR[y] || ''.padEnd(COLS, '#');
    for (let x = 0; x < COLS; x++) {
      const c = row[x] || '#';
      switch (c) {
        case '#': grid[y][x] = WALL; break;
        case '.': grid[y][x] = DOT; state.dotsRemaining++; break;
        case 'o': grid[y][x] = POWER; state.dotsRemaining++; break;
        case '=': grid[y][x] = GATE; break;
        case ' ': default: grid[y][x] = EMPTY; break;
      }
    }
  }

  // Teleport tunnel columns (left/right wrap). We'll use row 14 (center) as the tunnel.
  const TUNNEL_Y = 14;

  function isInside(tx, ty) { return tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS; }
  function isPassable(tx, ty, forGhost=false) {
    if (!isInside(tx, ty)) return false;
    const v = grid[ty][tx];
    if (v === WALL) return false;
    if (v === GATE) return !!forGhost; // only ghosts can pass gate
    return true;
  }

  // Entity base
  class Entity {
    constructor(x, y, speed) {
      const center = tileCenter(x, y);
      this.x = center.x; this.y = center.y;
      this.dir = { x: 0, y: 0 };
      this.nextDir = { x: 0, y: 0 };
      this.speed = speed;
    }
    get tile() { return pixelToTile(this.x, this.y); }
    atCenterOfTile() {
      const c = tileCenter(this.tile.x, this.tile.y);
      return Math.abs(this.x - c.x) < 0.5 && Math.abs(this.y - c.y) < 0.5;
    }
    setDirection(dx, dy) { this.nextDir = { x: dx, y: dy }; }
    move(dt, forGhost=false) {
      const { x: tx, y: ty } = this.tile;
      const center = tileCenter(tx, ty);
      
      // Snap to tile center when crossing center
      if (this.dir.x !== 0 && Math.sign(center.x - this.x) !== Math.sign(this.dir.x)) this.x = center.x;
      if (this.dir.y !== 0 && Math.sign(center.y - this.y) !== Math.sign(this.dir.y)) this.y = center.y;

      if (this.atCenterOfTile()) {
        // Change direction at intersections
        if (this.nextDir.x || this.nextDir.y) {
          const nx = tx + this.nextDir.x; const ny = ty + this.nextDir.y;
          if (isPassable(nx, ny, forGhost)) {
            this.dir = this.nextDir;
            this.nextDir = { x: 0, y: 0 }; // Clear next direction after applying
          }
        }
        // Check if current direction is still valid
        const fx = tx + this.dir.x; const fy = ty + this.dir.y;
        if (!isPassable(fx, fy, forGhost)) {
          this.dir = { x: 0, y: 0 };
        }
      }

      // Calculate new position
      const newX = this.x + this.dir.x * this.speed * dt;
      const newY = this.y + this.dir.y * this.speed * dt;
      
      // Check collision before applying movement
      const newTile = pixelToTile(newX, newY);
      if (isPassable(newTile.x, newTile.y, forGhost)) {
        this.x = newX;
        this.y = newY;
      } else {
        // Stop movement if hitting wall
        this.dir = { x: 0, y: 0 };
        // Snap to center of current tile to prevent getting stuck
        const currentCenter = tileCenter(tx, ty);
        this.x = currentCenter.x;
        this.y = currentCenter.y;
      }

      // Horizontal tunnel wrap
      const leftExit = -TILE / 2;
      const rightExit = COLS * TILE + TILE / 2;
      if (this.y > TUNNEL_Y * TILE && this.y < (TUNNEL_Y + 1) * TILE) {
        if (this.x < leftExit) this.x = rightExit;
        if (this.x > rightExit) this.x = leftExit;
      }
    }
  }

  // Pac‑Man entity
  class Pacman extends Entity {
    constructor(x, y) { super(x, y, PACMAN_SPEED); this.mouth = 0; this.mouthDir = 1; }
    update(dt) {
      this.move(dt, false);
      // Animate mouth
      this.mouth += this.mouthDir * dt * 8;
      if (this.mouth > 1) { this.mouth = 1; this.mouthDir = -1; }
      if (this.mouth < 0) { this.mouth = 0; this.mouthDir = 1; }
      // Eat pellets
      const { x: tx, y: ty } = this.tile;
      const v = grid[ty][tx];
      if (v === DOT) { grid[ty][tx] = EMPTY; state.score += 10; state.dotsRemaining--; pelletEaten(); }
      if (v === POWER) { grid[ty][tx] = EMPTY; state.score += 50; state.dotsRemaining--; triggerFrightened(); pelletEaten(); }
    }
    draw() {
      const radius = TILE * 0.45;
      ctx.save();
      ctx.translate(this.x, this.y);
      const angle = Math.atan2(this.dir.y, this.dir.x) || 0;
      const open = this.mouth * Math.PI / 4 + 0.09;

      // Body
      ctx.fillStyle = '#ffe300';
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      // Cut out the mouth wedge to ensure visibility across browsers
      const mx1 = Math.cos(angle + open) * radius;
      const my1 = Math.sin(angle + open) * radius;
      const mx2 = Math.cos(angle - open) * radius;
      const my2 = Math.sin(angle - open) * radius;
      const prevOp = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(mx1, my1);
      ctx.lineTo(mx2, my2);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = prevOp;

      ctx.restore();
    }
  }

  class Ghost extends Entity {
    constructor(name, color, x, y) {
      super(x, y, GHOST_SPEED);
      this.name = name;
      this.color = color;
      this.scatterTarget = this.getScatterTarget(name);
      this.frightened = false;
      this.frightenedUntil = 0;
      this.eyeOnly = false;
      this.path = [];
      this.pathRecalcCooldown = 0; // seconds
      this.leaveHouseTimer = 0; // seconds to delay leaving
      this.mode = 'chase'; // 'chase', 'scatter', 'frightened'
      this.modeTimer = 0;
    }
    
    getScatterTarget(name) {
      // Each ghost has a different corner to scatter to
      switch(name) {
        case 'blinky': return { x: COLS - 1, y: 0 }; // top right
        case 'pinky': return { x: 0, y: 0 }; // top left  
        case 'inky': return { x: COLS - 1, y: ROWS - 1 }; // bottom right
        case 'clyde': return { x: 0, y: ROWS - 1 }; // bottom left
        default: return { x: 0, y: 0 };
      }
    }
    
    getChaseTarget(pacman) {
      const pt = pacman.tile;
      const pd = pacman.dir;
      
      switch(this.name) {
        case 'blinky': // Red - direct chase
          return pt;
        case 'pinky': // Pink - ambush 4 tiles ahead
          return { x: pt.x + pd.x * 4, y: pt.y + pd.y * 4 };
        case 'inky': // Cyan - complex behavior relative to Blinky
          const blinky = ghosts[0];
          const bt = blinky.tile;
          const ahead = { x: pt.x + pd.x * 2, y: pt.y + pd.y * 2 };
          return { x: ahead.x + (ahead.x - bt.x), y: ahead.y + (ahead.y - bt.y) };
        case 'clyde': // Orange - chase if far, scatter if close
          const dist = Math.abs(pt.x - this.tile.x) + Math.abs(pt.y - this.tile.y);
          return dist > 8 ? pt : this.scatterTarget;
        default:
          return pt;
      }
    }
    setHouseDelay(seconds) { this.leaveHouseTimer = seconds; }
    isInHouse() {
      const t = this.tile;
      return t.y >= 12 && t.y <= 16 && t.x >= 11 && t.x <= 16; // around the center box
    }
    
    shouldLeaveHouse() {
      return this.leaveHouseTimer <= 0 && this.isInHouse() && !this.eyeOnly;
    }
    update(dt, pacman) {
      // Mode switching timer
      this.modeTimer += dt;
      
      // Switch between chase and scatter modes periodically
      if (!this.frightened && !this.eyeOnly) {
        const cycleDuration = 20; // 20 seconds cycle
        const cycleTime = this.modeTimer % cycleDuration;
        if (cycleTime < 7) {
          this.mode = 'scatter';
        } else {
          this.mode = 'chase';
        }
      }
      
      // Frightened handling
      if (this.frightened && performance.now() > this.frightenedUntil) {
        this.frightened = false;
        this.speed = GHOST_SPEED;
        this.mode = 'chase';
      }

      let target;
      if (this.eyeOnly) {
        this.speed = TILE * 9;
        // Target the house center to respawn
        target = { x: 14, y: 14 };
        // If reached house center, respawn
        const t = this.tile;
        if (t.x === 14 && t.y === 14 && this.atCenterOfTile()) {
          this.eyeOnly = false;
          this.frightened = false;
          this.speed = GHOST_SPEED;
          this.leaveHouseTimer = 1.2; // brief pause before leaving again
          this.path = [];
          this.mode = 'chase';
        }
      } else if (this.shouldLeaveHouse()) {
        // Force ghosts to leave the house by targeting the exit
        target = { x: 14, y: 11 }; // Exit point above the house
      } else if (this.frightened) {
        // Random movement when frightened, but avoid walls
        let attempts = 0;
        do {
          target = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
          attempts++;
        } while (!isPassable(target.x, target.y, true) && attempts < 10);
        this.mode = 'frightened';
      } else if (this.mode === 'scatter') {
        target = this.scatterTarget;
      } else {
        // Chase mode - use individual ghost targeting
        target = this.getChaseTarget(pacman);
      }

      // Delay leaving house at start of level
      if (!this.eyeOnly && this.leaveHouseTimer > 0) {
        this.leaveHouseTimer -= dt;
        // Make small oscillation in place
        this.dir = { x: 0, y: 0 };
        return;
      }

      // Recalculate path occasionally at intersections or when target changed
      this.pathRecalcCooldown -= dt;
      const t = this.tile;
      const needsRecalc = this.path.length === 0 || 
                         this.pathRecalcCooldown <= 0 || 
                         (isIntersection(t.x, t.y) && this.atCenterOfTile());
      
      if (needsRecalc) {
        // Ensure target is within bounds and passable
        target.x = clamp(target.x, 0, COLS - 1);
        target.y = clamp(target.y, 0, ROWS - 1);
        
        // If target is not passable, find nearest passable tile
        if (!isPassable(target.x, target.y, true)) {
          let found = false;
          for (let radius = 1; radius <= 5 && !found; radius++) {
            for (let dx = -radius; dx <= radius && !found; dx++) {
              for (let dy = -radius; dy <= radius && !found; dy++) {
                const nx = target.x + dx;
                const ny = target.y + dy;
                if (isPassable(nx, ny, true)) {
                  target.x = clamp(nx, 0, COLS - 1);
                  target.y = clamp(ny, 0, ROWS - 1);
                  found = true;
                }
              }
            }
          }
        }
        
        this.path = aStar(t, target, true);
        this.pathRecalcCooldown = this.frightened ? 0.05 : 0.2; // Faster recalc when frightened
      }
      
      // Follow path
      if (this.path.length > 0) {
        const next = this.path[0];
        const center = tileCenter(t.x, t.y);
        
        // Set direction toward next tile when centered or close to centered
        if (Math.abs(this.x - center.x) < 2 && Math.abs(this.y - center.y) < 2) {
          const newDir = { x: Math.sign(next.x - t.x), y: Math.sign(next.y - t.y) };
          
          // Only change direction if it's different and valid
          if ((newDir.x !== this.dir.x || newDir.y !== this.dir.y) && 
              isPassable(next.x, next.y, true)) {
            this.dir = newDir;
          }
          
          // When we reach next tile, pop it from path
          if (t.x === next.x && t.y === next.y) {
            this.path.shift();
          }
        }
      } else {
        // No path available, try to move toward target directly
        if (this.atCenterOfTile() && target) {
          const dx = Math.sign(target.x - t.x);
          const dy = Math.sign(target.y - t.y);
          
          // Prefer horizontal movement if both directions possible
          if (dx !== 0 && isPassable(t.x + dx, t.y, true)) {
            this.dir = { x: dx, y: 0 };
          } else if (dy !== 0 && isPassable(t.x, t.y + dy, true)) {
            this.dir = { x: 0, y: dy };
          }
        }
      }

      this.move(dt, true);
    }
    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      const r = TILE * 0.45;
      if (this.eyeOnly) {
        drawEyes(0, 0, r * 0.9, '#fff');
        ctx.restore();
        return;
      }
      if (this.frightened) {
        drawGhostShape(0, 0, r, '#2244ff');
      } else {
        drawGhostShape(0, 0, r, this.color);
      }
      ctx.restore();
    }
  }

  // A* pathfinding on the tile grid
  function aStar(start, goal, forGhost) {
    // Validate inputs
    if (!isInside(start.x, start.y) || !isInside(goal.x, goal.y)) return [];
    if (start.x === goal.x && start.y === goal.y) return [];
    
    function key(x, y) { return x + ',' + y; }
    const open = new Set([key(start.x, start.y)]);
    const closed = new Set();
    const cameFrom = new Map();
    const g = new Map([[key(start.x, start.y), 0]]);
    const f = new Map([[key(start.x, start.y), heuristic(start, goal)]]);

    function heuristic(a, b) { 
      // Manhattan distance with slight preference for direct paths
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      return dx + dy + Math.min(dx, dy) * 0.01;
    }

    function lowestF() {
      let bestKey = null;
      let best = Infinity;
      for (const k of open) { 
        const v = f.get(k) ?? Infinity; 
        if (v < best) { 
          best = v; 
          bestKey = k; 
        } 
      }
      return bestKey;
    }

    let iterations = 0;
    const maxIterations = COLS * ROWS; // Prevent infinite loops
    
    while (open.size && iterations < maxIterations) {
      iterations++;
      const currentKey = lowestF();
      if (!currentKey) break;
      
      const [cx, cy] = currentKey.split(',').map(Number);
      const current = { x: cx, y: cy };
      
      if (cx === goal.x && cy === goal.y) {
        return reconstructPath(cameFrom, current);
      }
      
      open.delete(currentKey);
      closed.add(currentKey);
      
      const neighbors = [
        { x: cx + 1, y: cy },
        { x: cx - 1, y: cy },
        { x: cx, y: cy + 1 },
        { x: cx, y: cy - 1 },
      ].filter(n => isPassable(n.x, n.y, forGhost) && !closed.has(key(n.x, n.y)));

      for (const n of neighbors) {
        const nk = key(n.x, n.y);
        const tentative = (g.get(currentKey) ?? Infinity) + 1;
        
        if (!open.has(nk) || tentative < (g.get(nk) ?? Infinity)) {
          cameFrom.set(nk, currentKey);
          g.set(nk, tentative);
          f.set(nk, tentative + heuristic(n, goal));
          open.add(nk);
        }
      }
    }
    return []; // No path found
  }

  function reconstructPath(cameFrom, current)
  {
    const path = [];
    function key(p) { return p.x + ',' + p.y; }
    let ck = key(current);
    while (cameFrom.has(ck)) {
      const [x, y] = ck.split(',').map(Number);
      path.unshift({ x, y });
      ck = cameFrom.get(ck);
    }
    return path;
  }

  // Draw helpers
  function drawGhostShape(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, Math.PI, 0);
    const skirt = 4;
    for (let i = 0; i <= skirt; i++) {
      const px = x + r - (i * 2 * r) / skirt;
      const py = y + r - (i % 2 === 0 ? 0 : r * 0.2);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    drawEyes(x, y - r * 0.1, r * 0.7, '#fff');
  }

  function drawEyes(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y, r * 0.3, 0, Math.PI * 2);
    ctx.arc(x + r * 0.3, y, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1f3bd7';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y, r * 0.15, 0, Math.PI * 2);
    ctx.arc(x + r * 0.3, y, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Maze rendering
  function drawMaze() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = grid[y][x];
        if (v === WALL) {
          ctx.fillStyle = '#001b8f';
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
          ctx.strokeStyle = '#0a2cff';
          ctx.lineWidth = 3;
          ctx.strokeRect(x * TILE + 1.5, y * TILE + 1.5, TILE - 3, TILE - 3);
        } else if (v === DOT) {
          ctx.fillStyle = '#f4c983';
          ctx.beginPath();
          ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, TILE * 0.1, 0, Math.PI * 2);
          ctx.fill();
        } else if (v === POWER) {
          ctx.fillStyle = '#f4c983';
          ctx.beginPath();
          ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, TILE * 0.25, 0, Math.PI * 2);
          ctx.fill();
        } else if (v === GATE) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x * TILE + 2, y * TILE + TILE / 2);
          ctx.lineTo(x * TILE + TILE - 2, y * TILE + TILE / 2);
          ctx.stroke();
        }
      }
    }
  }

  function drawHUD() {
    scoreEl.textContent = String(state.score).padStart(1, '0');
    levelEl.textContent = String(state.level);
    livesEl.textContent = '❤'.repeat(state.lives);
  }

  // Game setup
  const pacman = new Pacman(14, 26); // Start in bottom corridor
  const ghosts = [
    new Ghost('blinky', '#ff0000', 14, 14),  // Red - starts outside, no delay
    new Ghost('pinky',  '#ffb8ff', 13, 14),  // Pink - in house
    new Ghost('inky',   '#00ffff', 15, 14),  // Cyan - in house  
    new Ghost('clyde',  '#ffb852', 14, 15),  // Orange - in house
  ];
  // Blinky starts immediately, others have delays
  ghosts[0].setHouseDelay(0);    // Blinky starts moving right away
  ghosts[1].setHouseDelay(2.5);  // Pinky waits 2.5 seconds
  ghosts[2].setHouseDelay(5.0);  // Inky waits 5 seconds
  ghosts[3].setHouseDelay(7.5);  // Clyde waits 7.5 seconds

  function pelletEaten() {
    if (state.dotsRemaining <= 0) {
      state.level++;
      levelEl.textContent = String(state.level);
      resetLevel(true);
    }
  }

  function triggerFrightened() {
    const until = performance.now() + FRIGHTENED_TIME;
    for (const g of ghosts) {
      if (g.eyeOnly) continue;
      g.frightened = true;
      g.frightenedUntil = until;
      g.speed = FRIGHTENED_SPEED;
      // Reverse their direction for effect
      g.dir = { x: -g.dir.x, y: -g.dir.y };
      g.path = [];
    }
  }

  function resetPositions() {
    const p = tileCenter(14, 26); pacman.x = p.x; pacman.y = p.y; pacman.dir = {x:0,y:0}; pacman.nextDir = {x:0,y:0};
    const gpos = [ [14,14],[13,14],[15,14],[14,15] ];
    ghosts.forEach((g,i)=>{
      const c = tileCenter(gpos[i][0], gpos[i][1]); 
      g.x=c.x; g.y=c.y; 
      g.dir={x:0,y:0}; g.nextDir={x:0,y:0}; 
      g.eyeOnly=false; g.frightened=false; g.speed=GHOST_SPEED;
      g.path = []; // Clear any existing path
      g.mode = 'chase';
      g.modeTimer = 0;
      g.pathRecalcCooldown = 0;
    });
  }

  function resetLevel(newLevel=false) {
    // Refill pellets
    state.dotsRemaining = 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (MAZE_STR[y][x] === '.') { grid[y][x] = DOT; state.dotsRemaining++; }
        else if (MAZE_STR[y][x] === 'o') { grid[y][x] = POWER; state.dotsRemaining++; }
        else if (MAZE_STR[y][x] === '#') grid[y][x] = WALL;
        else if (MAZE_STR[y][x] === '=') grid[y][x] = GATE; else grid[y][x] = EMPTY;
      }
    }
    resetPositions();
    // Reset house delays - Blinky starts immediately, others have staggered delays
    ghosts[0].setHouseDelay(0);    // Blinky starts moving right away
    ghosts[1].setHouseDelay(newLevel ? 2.0 : 2.5);  
    ghosts[2].setHouseDelay(newLevel ? 4.0 : 5.0);  
    ghosts[3].setHouseDelay(newLevel ? 6.0 : 7.5);
  }

  function loseLife() {
    state.lives--;
    if (state.lives <= 0) {
      overlay.classList.add('show');
      startBtn.textContent = 'Play Again';
      state.running = false;
    }
    resetPositions();
  }

  // Input handling: keyboard and on-screen controls + swipe
  const keys = new Set();
  const keyMap = {
    ArrowUp:  [0, -1], KeyW:  [0, -1], w: [0, -1], W: [0, -1],
    ArrowDown:[0, 1],  KeyS:  [0, 1],  s: [0, 1],  S: [0, 1],
    ArrowLeft:[-1, 0], KeyA:  [-1, 0], a: [-1, 0], A: [-1, 0],
    ArrowRight:[1,0],  KeyD:  [1, 0],  d: [1, 0],  D: [1, 0]
  };
  window.addEventListener('keydown', (e)=>{
    const m = keyMap[e.code] || keyMap[e.key]; if (!m) return;
    e.preventDefault();
    if (!state.running) {
      // Start the game on first input
      overlay.classList.remove('show');
      state.score = 0; state.lives = 3; state.level = 1; resetLevel(false); state.running = true; drawHUD();
    }
    pacman.setDirection(m[0], m[1]);
  });

  function bindBtn(id, dx, dy) {
    const el = document.getElementById(id);
    const set = ()=> {
      if (!state.running) {
        overlay.classList.remove('show');
        state.score = 0; state.lives = 3; state.level = 1; resetLevel(false); state.running = true; drawHUD();
      }
      pacman.setDirection(dx, dy);
    };
    
    // Enhanced mobile touch handling
    let isPressed = false;
    
    const handleStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isPressed) {
        isPressed = true;
        el.style.transform = 'scale(0.95)';
        el.style.backgroundColor = '#2f4cff';
        set();
      }
    };
    
    const handleEnd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      isPressed = false;
      el.style.transform = 'scale(1)';
      el.style.backgroundColor = '#111';
    };
    
    // Multiple event types for maximum compatibility
    el.addEventListener('touchstart', handleStart, { passive: false });
    el.addEventListener('touchend', handleEnd, { passive: false });
    el.addEventListener('touchcancel', handleEnd, { passive: false });
    el.addEventListener('pointerdown', handleStart);
    el.addEventListener('pointerup', handleEnd);
    el.addEventListener('pointercancel', handleEnd);
    el.addEventListener('mousedown', handleStart);
    el.addEventListener('mouseup', handleEnd);
    el.addEventListener('mouseleave', handleEnd);
  }
  bindBtn('btnUp', 0, -1); bindBtn('btnDown', 0, 1); bindBtn('btnLeft', -1, 0); bindBtn('btnRight', 1, 0);

  // Enhanced swipe detection on canvas
  let touchStart = null;
  let touchMoved = false;
  const swipeThreshold = 20; // px minimal movement for swipe
  
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if (e.touches && e.touches[0]) {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchMoved = false;
    }
  }, { passive: false });
  
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if (touchStart && e.touches && e.touches[0]) {
      const t = e.touches[0];
      const dx = Math.abs(t.clientX - touchStart.x);
      const dy = Math.abs(t.clientY - touchStart.y);
      if (dx > 5 || dy > 5) touchMoved = true;
    }
  }, { passive: false });
  
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if (!touchStart || !e.changedTouches || !e.changedTouches[0]) return;
    
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x; 
    const dy = t.clientY - touchStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (!state.running) {
      overlay.classList.remove('show');
      state.score = 0; state.lives = 3; state.level = 1; resetLevel(false); state.running = true; drawHUD();
    }
    
    // Only register swipe if there was significant movement
    if (touchMoved && distance > swipeThreshold) {
      if (Math.abs(dx) > Math.abs(dy)) {
        pacman.setDirection(Math.sign(dx), 0);
      } else {
        pacman.setDirection(0, Math.sign(dy));
      }
    }
    
    touchStart = null;
    touchMoved = false;
  }, { passive: false });

  // Collision detection Pac‑Man vs ghosts
  function checkCollisions() {
    for (const g of ghosts) {
      const dist = Math.hypot(g.x - pacman.x, g.y - pacman.y);
      if (dist < TILE * 0.6) {
        if (g.frightened && !g.eyeOnly) {
          state.score += 200;
          g.eyeOnly = true; g.frightened = false; g.path = [];
        } else if (!g.eyeOnly) {
          loseLife();
          break;
        }
      }
    }
  }

  // Main loop
  let last = performance.now();
  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    if (state.running) {
      pacman.update(dt);
      for (const g of ghosts) g.update(dt, pacman);
      checkCollisions();
      drawMaze();
      pacman.draw();
      for (const g of ghosts) g.draw();
      drawHUD();
    } else {
      drawMaze();
      pacman.draw();
      for (const g of ghosts) g.draw();
      drawHUD();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Start button -> shared start behavior
  function startGame() {
    overlay.classList.remove('show');
    state.score = 0;
    state.lives = 3;
    state.level = 1;
    resetLevel(false);
    state.running = true;
    drawHUD();
  }
  startBtn.addEventListener('click', startGame);

  // Auto-start the game so controls and ghosts are active immediately.
  // This avoids a confusing initial state where nothing moves until the
  // player presses Start. There is no audio gating, so this is safe.
  startGame();

  // Asset loader placeholder – if user drops sprites into ./assets, they will be used.
  // This demo uses vector graphics by default for zero-setup play.
})();

