// Pac-Man (laconic classic) - compact, mobile-friendly implementation
// Map uses: 1=wall, 0=empty, -1=dot, -2=power pellet

class ClassicPacman {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Grid
        this.cols = 19;
        this.rows = 21;
        this.cellSize = 20;

        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.tickMs = 140;
        this.running = true;
        this.powerMode = false;
        this.powerTimer = 0;
        this.ghostsEaten = 0;

        this.initMap();

        this.pacman = { x: 9, y: 15, dir: 'left', next: null, anim: 0 };
        this.ghostHome = { x: 9, y: 10 };
        this.ghosts = [
            { x: 9, y: 9, color: '#ff0000', dir: 'left' },
            { x: 8, y: 10, color: '#00ffff', dir: 'up' },
            { x: 10, y: 10, color: '#ffb8ff', dir: 'down' },
            { x: 9, y: 10, color: '#ffb852', dir: 'right' }
        ];

        this.setupCanvas();
        this.setupControls();
        this.updateHud();

        this.loop = setInterval(() => {
            if (!this.running) return;
            this.step();
            this.draw();
        }, this.tickMs);
    }

    initMap() {
        // Classic-like layout (adapted) with dots and pellets
        this.map = [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,-1,-1,-1,-1,-1,-1,-1,-1,1,-1,-1,-1,-1,-1,-1,-1,-1,1],
            [1,-2,1,1,-1,1,1,1,-1,1,-1,1,1,1,-1,1,1,-2,1],
            [1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1],
            [1,-1,1,1,-1,1,-1,1,1,1,1,1,-1,1,-1,1,1,-1,1],
            [1,-1,-1,-1,-1,1,-1,-1,-1,1,-1,-1,-1,1,-1,-1,-1,-1,1],
            [1,1,1,1,-1,1,1,1,-1,1,-1,1,1,1,-1,1,1,1,1],
            [0,0,0,1,-1,1,-1,-1,-1,0,-1,-1,-1,1,-1,1,0,0,0],
            [1,1,1,1,-1,1,-1,1,1,0,1,1,-1,1,-1,1,1,1,1],
            [1,-1,-1,-1,-1,-1,-1,1,0,0,0,1,-1,-1,-1,-1,-1,-1,1],
            [1,-1,1,1,-1,1,-1,1,0,0,0,1,-1,1,-1,1,1,-1,1],
            [1,-1,-1,1,-1,-1,-1,1,1,1,1,1,-1,-1,-1,1,-1,-1,1],
            [1,1,-1,1,-1,1,-1,-1,-1,-1,-1,-1,-1,1,-1,1,-1,1,1],
            [1,-1,-1,-1,-1,1,-1,1,1,1,1,1,-1,1,-1,-1,-1,-1,1],
            [1,-1,1,1,-1,-1,-1,-1,-1,1,-1,-1,-1,-1,-1,1,1,-1,1],
            [1,-1,-1,1,-1,1,1,1,-1,1,-1,1,1,1,-1,1,-1,-1,1],
            [1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,1],
            [1,-1,-1,1,1,-1,1,1,-1,1,-1,1,1,-1,1,1,-1,-1,1],
            [1,-2,1,1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,1,1,-2,1],
            [1,-1,-1,-1,-1,1,1,1,1,1,1,1,1,1,-1,-1,-1,-1,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ];
        this.totalDots = 0;
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.map[y][x] === -1) this.totalDots++;
                if (this.map[y][x] === -2) this.totalDots++;
            }
        }
    }

    setupCanvas() {
        this.canvas.width = this.cols * this.cellSize;
        this.canvas.height = this.rows * this.cellSize;
        // Scale down for small screens
        const maxWidth = Math.min(window.innerWidth - 40, 520);
        if (this.canvas.width > maxWidth) {
            const s = maxWidth / this.canvas.width;
            this.canvas.style.width = `${this.canvas.width * s}px`;
            this.canvas.style.height = `${this.canvas.height * s}px`;
        }
    }

    setupControls() {
        const setNext = (d) => { this.pacman.next = d; };
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') setNext('up');
            if (e.key === 'ArrowDown') setNext('down');
            if (e.key === 'ArrowLeft') setNext('left');
            if (e.key === 'ArrowRight') setNext('right');
        });
        const bindBtn = (id, d) => {
            const el = document.getElementById(id);
            if (!el) return;
            const handler = (e) => { e.preventDefault(); setNext(d); };
            el.addEventListener('touchstart', handler, { passive: false });
            el.addEventListener('pointerdown', handler);
            el.addEventListener('mousedown', handler);
        };
        bindBtn('btnUp', 'up');
        bindBtn('btnDown', 'down');
        bindBtn('btnLeft', 'left');
        bindBtn('btnRight', 'right');
        window.addEventListener('resize', () => this.setupCanvas());
    }

    updateHud() {
        const scoreEl = document.getElementById('scoreText');
        const livesEl = document.getElementById('livesText');
        if (scoreEl) scoreEl.textContent = this.score.toString().padStart(6, '0');
        if (livesEl) livesEl.textContent = String(this.lives);
    }

    step() {
        // Pacman mouth animation
        this.pacman.anim = (this.pacman.anim + 1) % 4;

        // Change direction if possible
        if (this.pacman.next && this.canMove(this.pacman.x, this.pacman.y, this.pacman.next)) {
            this.pacman.dir = this.pacman.next;
            this.pacman.next = null;
        }

        // Move pacman
        if (this.canMove(this.pacman.x, this.pacman.y, this.pacman.dir)) {
            const [dx, dy] = this.delta(this.pacman.dir);
            this.pacman.x = this.wrapX(this.pacman.x + dx);
            this.pacman.y = this.pacman.y + dy;
            this.eatTile();
        }

        // Power timer
        if (this.powerMode) {
            this.powerTimer--;
            if (this.powerTimer <= 0) {
                this.powerMode = false;
                this.ghostsEaten = 0;
            }
        }

        // Move ghosts
        for (const g of this.ghosts) {
            g.dir = this.chooseGhostDir(g);
            const [dx, dy] = this.delta(g.dir);
            g.x = this.wrapX(g.x + dx);
            g.y = g.y + dy;
        }

        // Collisions
        for (const g of this.ghosts) {
            if (g.x === this.pacman.x && g.y === this.pacman.y) {
                if (this.powerMode) {
                    this.ghostsEaten++;
                    this.score += 200 * this.ghostsEaten;
                    this.sendGhostHome(g);
                    this.updateHud();
                } else {
                    this.loseLife();
                    return; // pause one tick after reset
                }
            }
        }

        // Level complete
        if (this.remainingDots() === 0) {
            this.level++;
            this.initMap();
            this.resetPositions();
        }
    }

    eatTile() {
        const t = this.map[this.pacman.y][this.pacman.x];
        if (t === -1) { this.map[this.pacman.y][this.pacman.x] = 0; this.score += 10; this.updateHud(); }
        if (t === -2) {
            this.map[this.pacman.y][this.pacman.x] = 0;
            this.powerMode = true;
            this.powerTimer = Math.floor(6000 / this.tickMs); // ~6s
            this.ghostsEaten = 0;
            this.score += 50;
            this.updateHud();
        }
    }

    remainingDots() {
        let n = 0;
        for (let y = 0; y < this.rows; y++) for (let x = 0; x < this.cols; x++) if (this.map[y][x] === -1 || this.map[y][x] === -2) n++;
        return n;
    }

    sendGhostHome(g) { g.x = this.ghostHome.x; g.y = this.ghostHome.y; g.dir = 'up'; }

    loseLife() {
        this.lives--;
        this.updateHud();
        if (this.lives < 0) { this.running = false; return; }
        this.resetPositions();
    }

    resetPositions() {
        this.pacman.x = 9; this.pacman.y = 15; this.pacman.dir = 'left'; this.pacman.next = null;
        const starts = [ {x:9,y:9,dir:'left'}, {x:8,y:10,dir:'up'}, {x:10,y:10,dir:'down'}, {x:9,y:10,dir:'right'} ];
        for (let i = 0; i < this.ghosts.length; i++) {
            this.ghosts[i].x = starts[i].x;
            this.ghosts[i].y = starts[i].y;
            this.ghosts[i].dir = starts[i].dir;
        }
    }

    canMove(x, y, dir) {
        const [dx, dy] = this.delta(dir);
        const nx = this.wrapX(x + dx);
        const ny = y + dy;
        if (ny < 0 || ny >= this.rows) return false;
        return this.map[ny][nx] !== 1;
    }

    wrapX(x) {
        if (x < 0) return this.cols - 1;
        if (x >= this.cols) return 0;
        return x;
    }

    delta(dir) {
        switch (dir) {
            case 'up': return [0, -1];
            case 'down': return [0, 1];
            case 'left': return [-1, 0];
            case 'right': return [1, 0];
            default: return [0, 0];
        }
    }

    chooseGhostDir(g) {
        const options = ['up','left','down','right'];
        const opposite = { up:'down', down:'up', left:'right', right:'left' };
        let bestDir = g.dir;
        let bestScore = this.powerMode ? -Infinity : Infinity;
        for (const d of options) {
            if (opposite[g.dir] === d) continue; // avoid reversing unless stuck
            if (!this.canMove(g.x, g.y, d)) continue;
            const [dx, dy] = this.delta(d);
            const nx = this.wrapX(g.x + dx), ny = g.y + dy;
            const dist = Math.abs(nx - this.pacman.x) + Math.abs(ny - this.pacman.y);
            if (!this.powerMode) {
                if (dist < bestScore) { bestScore = dist; bestDir = d; }
            } else {
                if (dist > bestScore) { bestScore = dist; bestDir = d; }
            }
        }
        // If cannot choose, allow reverse
        if (!this.canMove(g.x, g.y, bestDir)) {
            for (const d of options) if (this.canMove(g.x, g.y, d)) { bestDir = d; break; }
        }
        return bestDir;
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Maze
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const v = this.map[y][x];
                const px = x * this.cellSize, py = y * this.cellSize;
                if (v === 1) {
                    const g = ctx.createLinearGradient(px, py, px+this.cellSize, py+this.cellSize);
                    g.addColorStop(0, '#2563eb'); g.addColorStop(1, '#1e40af');
                    ctx.fillStyle = g;
                    ctx.fillRect(px, py, this.cellSize, this.cellSize);
                    ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 1; ctx.strokeRect(px, py, this.cellSize, this.cellSize);
                } else if (v === -1) {
                    ctx.fillStyle = '#ffeb3b';
                    ctx.beginPath();
                    ctx.arc(px + this.cellSize/2, py + this.cellSize/2, 2, 0, Math.PI*2);
                    ctx.fill();
                } else if (v === -2) {
                    ctx.fillStyle = '#ffd54f';
                    ctx.beginPath();
                    ctx.arc(px + this.cellSize/2, py + this.cellSize/2, 5, 0, Math.PI*2);
                    ctx.fill();
                }
            }
        }

        // Pac-Man
        const px = this.pacman.x * this.cellSize + this.cellSize/2;
        const py = this.pacman.y * this.cellSize + this.cellSize/2;
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        const open = (this.pacman.anim % 4) < 2;
        let sa = 0.25*Math.PI, ea = 1.75*Math.PI;
        const dir = this.pacman.dir;
        if (open) {
            if (dir === 'right') { sa = 0.2*Math.PI; ea = 1.8*Math.PI; }
            if (dir === 'left') { sa = 1.2*Math.PI; ea = 0.8*Math.PI; }
            if (dir === 'up') { sa = 1.7*Math.PI; ea = 1.3*Math.PI; }
            if (dir === 'down') { sa = 0.7*Math.PI; ea = 0.3*Math.PI; }
        } else { sa = 0; ea = Math.PI*2; }
        ctx.arc(px, py, this.cellSize/2 - 2, sa, ea);
        if (open) ctx.lineTo(px, py);
        ctx.fill();
        // Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(px - 2, py - 4, 2, 0, Math.PI*2); ctx.fill();

        // Ghosts
        for (const g of this.ghosts) this.drawGhost(g);
    }

    drawGhost(g) {
        const ctx = this.ctx;
        const px = g.x * this.cellSize + this.cellSize/2;
        const py = g.y * this.cellSize + this.cellSize/2;
        const r = this.cellSize/2 - 2;
        ctx.fillStyle = this.powerMode ? '#88c' : g.color;
        ctx.beginPath();
        ctx.arc(px, py, r, Math.PI, 0);
        ctx.lineTo(px + r, py + r);
        for (let i=2; i>=-2; i--) ctx.lineTo(px + (i*r/4), py + r - ((i%2)?0:r/4));
        ctx.closePath();
        ctx.fill();
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(px - r/3, py - r/4, r/5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + r/3, py - r/4, r/5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#0b0b0b';
        ctx.beginPath(); ctx.arc(px - r/3, py - r/4, r/10, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(px + r/3, py - r/4, r/10, 0, Math.PI*2); ctx.fill();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.pacman = new ClassicPacman();
});

