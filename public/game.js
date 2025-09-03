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
        // change direction at intersections
        if (this.nextDir.x || this.nextDir.y) {
          const nx = tx + this.nextDir.x; const ny = ty + this.nextDir.y;
          if (isPassable(nx, ny, forGhost)) {
            this.dir = this.nextDir;
          }
        }
        const fx = tx + this.dir.x; const fy = ty + this.dir.y;
        if (!isPassable(fx, fy, forGhost)) {
          this.dir = { x: 0, y: 0 };
        }
      }

      // Apply movement
      this.x += this.dir.x * this.speed * dt;
      this.y += this.dir.y * this.speed * dt;

      // Horizontal tunnel wrap
      const leftExit = -TILE / 2; // allow half tile beyond
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
      const angle = Math.atan2(this.dir.y, this.dir.x);
      const open = this.mouth * Math.PI / 4 + 0.09;
      const a1 = (angle || 0) + open;
      const a2 = (angle || 0) - open;
      ctx.fillStyle = '#ffe300';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, a1, a2, true);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  class Ghost extends Entity {
    constructor(name, color, x, y) {
      super(x, y, GHOST_SPEED);
      this.name = name;
      this.color = color;
      this.scatterTarget = { x: 0, y: 0 };
      this.frightened = false;
      this.frightenedUntil = 0;
      this.eyeOnly = false;
      this.path = [];
      this.pathRecalcCooldown = 0; // seconds
      this.leaveHouseTimer = 0; // seconds to delay leaving
    }
    setHouseDelay(seconds) { this.leaveHouseTimer = seconds; }
    isInHouse() {
      const t = this.tile;
      return t.y >= 12 && t.y <= 16 && t.x >= 11 && t.x <= 16; // around the center box
    }
    update(dt, target) {
      // frightened handling
      if (this.frightened && performance.now() > this.frightenedUntil) {
        this.frightened = false;
        this.speed = GHOST_SPEED;
      }

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
        }
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
      if (this.path.length === 0 || this.pathRecalcCooldown <= 0 || isIntersection(t.x, t.y)) {
        this.path = aStar(t, target, this.eyeOnly ? true : true);
        this.pathRecalcCooldown = 0.2 + Math.random() * 0.2;
      }
      // Follow path
      if (this.path.length > 0) {
        const next = this.path[0];
        const center = tileCenter(t.x, t.y);
        // Set direction toward next tile when centered
        if (Math.abs(this.x - center.x) < 0.5 && Math.abs(this.y - center.y) < 0.5) {
          this.dir = { x: Math.sign(next.x - t.x), y: Math.sign(next.y - t.y) };
          // When we reach next tile, pop it
          if (t.x === next.x && t.y === next.y) this.path.shift();
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
    function key(x, y) { return x + ',' + y; }
    const open = new Set([key(start.x, start.y)]);
    const cameFrom = new Map();
    const g = new Map([[key(start.x, start.y), 0]]);
    const f = new Map([[key(start.x, start.y), heuristic(start, goal)]]);

    function heuristic(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }

    function lowestF() {
      let bestKey=null; let best = Infinity;
      for (const k of open) { const v = f.get(k) ?? Infinity; if (v < best) { best = v; bestKey = k; } }
      return bestKey;
    }

    while (open.size) {
      const currentKey = lowestF();
      const [cx, cy] = currentKey.split(',').map(Number);
      const current = { x: cx, y: cy };
      if (cx === goal.x && cy === goal.y) {
        return reconstructPath(cameFrom, current);
      }
      open.delete(currentKey);
      const neighbors = [
        { x: cx + 1, y: cy },
        { x: cx - 1, y: cy },
        { x: cx, y: cy + 1 },
        { x: cx, y: cy - 1 },
      ].filter(n => isPassable(n.x, n.y, forGhost));

      for (const n of neighbors) {
        const nk = key(n.x, n.y);
        const tentative = (g.get(currentKey) ?? Infinity) + 1;
        if (tentative < (g.get(nk) ?? Infinity)) {
          cameFrom.set(nk, currentKey);
          g.set(nk, tentative);
          f.set(nk, tentative + heuristic(n, goal));
          open.add(nk);
        }
      }
    }
    return [];
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
  const pacman = new Pacman(14, 23);
  const ghosts = [
    new Ghost('blinky', '#ff0000', 14, 14),
    new Ghost('pinky',  '#ffb8ff', 13, 14),
    new Ghost('inky',   '#00ffff', 15, 14),
    new Ghost('clyde',  '#ffb852', 14, 15),
  ];
  ghosts[1].setHouseDelay(2.5);
  ghosts[2].setHouseDelay(5);
  ghosts[3].setHouseDelay(7.5);

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
    const p = tileCenter(14, 23); pacman.x = p.x; pacman.y = p.y; pacman.dir = {x:0,y:0}; pacman.nextDir = {x:0,y:0};
    const gpos = [ [14,14],[13,14],[15,14],[14,15] ];
    ghosts.forEach((g,i)=>{ const c = tileCenter(gpos[i][0], gpos[i][1]); g.x=c.x; g.y=c.y; g.dir={x:0,y:0}; g.nextDir={x:0,y:0}; g.eyeOnly=false; g.frightened=false; g.speed=GHOST_SPEED; });
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
    if (newLevel) {
      ghosts[1].setHouseDelay(2.0);
      ghosts[2].setHouseDelay(4.0);
      ghosts[3].setHouseDelay(6.0);
    }
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
    ArrowUp:  [0, -1], KeyW:  [0, -1],
    ArrowDown:[0, 1],  KeyS:  [0, 1],
    ArrowLeft:[-1, 0], KeyA:  [-1, 0],
    ArrowRight:[1,0],  KeyD:  [1, 0]
  };
  window.addEventListener('keydown', (e)=>{
    const m = keyMap[e.code]; if (!m) return;
    e.preventDefault();
    pacman.setDirection(m[0], m[1]);
  });

  function bindBtn(id, dx, dy) {
    const el = document.getElementById(id);
    const set = ()=> pacman.setDirection(dx, dy);
    el.addEventListener('touchstart', (e)=>{ e.preventDefault(); set(); }, { passive: false });
    el.addEventListener('mousedown', (e)=>{ e.preventDefault(); set(); });
  }
  bindBtn('btnUp', 0, -1); bindBtn('btnDown', 0, 1); bindBtn('btnLeft', -1, 0); bindBtn('btnRight', 1, 0);

  // Swipe on canvas
  let touchStart = null;
  canvas.addEventListener('touchstart', e => { if (e.touches[0]) touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  canvas.addEventListener('touchend', e => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x; const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) pacman.setDirection(Math.sign(dx), 0);
    else pacman.setDirection(0, Math.sign(dy));
    touchStart = null;
  });

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
      const target = pacman.tile;
      for (const g of ghosts) g.update(dt, g.frightened ? { x: COLS-1-target.x, y: ROWS-1-target.y } : target);
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

  // Start button
  startBtn.addEventListener('click', () => {
    overlay.classList.remove('show');
    state.score = 0; state.lives = 3; state.level = 1; resetLevel(false); state.running = true; drawHUD();
  });

  // Asset loader placeholder – if user drops sprites into ./assets, they will be used.
  // This demo uses vector graphics by default for zero-setup play.
})();

