# Territorial Ghost Implementation

## 1. Strategy Definition
```javascript
const GHOST_STRATEGY = {
    RANDOM: 'random',
    TERRITORIAL: 'territorial',
    TRACKING: 'tracking'
};
```

## 2. Ghost Initialization (in resetLevel)
```javascript
if (strategy === GHOST_STRATEGY.TERRITORIAL) {
    ghost.territory = assignTerritory(ghostIndex);
}

// Ghost properties for territorial
ghost.territory = null;
ghost.dfsPath = [];  // DFS path for territorial patrol
ghost.dfsIndex = 0;  // Current position in DFS path
ghost.wasChasing = false;  // Track if territorial ghost was chasing
ghost.pacmanWasInTerritory = false;  // Track if Pacman was in territory last frame
```

## 3. Territory Assignment
```javascript
// Assign territory quadrants to territorial ghosts
function assignTerritory(ghostIndex) {
    // Get all available territories
    const allTerritories = [0, 1, 2, 3]; // 4 quadrants
    
    // Find which territories are already taken by existing ghosts
    const takenTerritories = new Set();
    for (let i = 0; i < ghostIndex && i < ghosts.length; i++) {
        if (ghosts[i].strategy === GHOST_STRATEGY.TERRITORIAL && ghosts[i].territory) {
            // Determine which territory index this ghost has
            const territory = ghosts[i].territory;
            const midX = Math.floor(COLS / 2);
            const midY = Math.floor(ROWS / 2);
            
            let territoryIndex = -1;
            if (territory.maxX <= midX && territory.maxY <= midY) territoryIndex = 0; // Top-left
            else if (territory.minX >= midX && territory.maxY <= midY) territoryIndex = 1; // Top-right
            else if (territory.maxX <= midX && territory.minY >= midY) territoryIndex = 2; // Bottom-left
            else if (territory.minX >= midX && territory.minY >= midY) territoryIndex = 3; // Bottom-right
            
            if (territoryIndex >= 0) {
                takenTerritories.add(territoryIndex);
            }
        }
    }
    
    // Find first available territory
    for (let i = 0; i < allTerritories.length; i++) {
        if (!takenTerritories.has(i)) {
            return assignTerritoryByIndex(i);
        }
    }
    
    // If all territories are taken (more than 4 territorial ghosts), cycle back
    return assignTerritoryByIndex(ghostIndex % 4);
}

// Assign specific territory by index
function assignTerritoryByIndex(index) {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    
    const territories = [
        { minX: 0, maxX: midX, minY: 0, maxY: midY },        // Top-left
        { minX: midX, maxX: COLS, minY: 0, maxY: midY },     // Top-right
        { minX: 0, maxX: midX, minY: midY, maxY: ROWS },     // Bottom-left
        { minX: midX, maxX: COLS, minY: midY, maxY: ROWS }   // Bottom-right
    ];
    
    return territories[index % 4];
}
```

## 4. Main Update Logic (in updateGhosts)
```javascript
case GHOST_STRATEGY.TERRITORIAL:
    if (g.territory) {
        const pacmanInTerritory = pacX >= g.territory.minX && pacX < g.territory.maxX &&
                                 pacY >= g.territory.minY && pacY < g.territory.maxY;
        const ghostInTerritory = gx >= g.territory.minX && gx < g.territory.maxX &&
                               gy >= g.territory.minY && gy < g.territory.maxY;
        
        // FIRST: If ghost is outside territory, always move to center
        if (!ghostInTerritory) {
            const centerX = Math.floor((g.territory.minX + g.territory.maxX) / 2);
            const centerY = Math.floor((g.territory.minY + g.territory.maxY) / 2);
            nextMove = getDirectionToward(gx, gy, centerX, centerY);
            // Clear DFS state for when we return
            g.dfsPath = null;
            g.dfsIndex = 0;
            g.wasChasing = false;
        }
        // SECOND: Ghost is IN territory - decide based on Pacman
        else if (pacmanInTerritory && dijkstraMove) {
            // Pacman is in our territory - try to chase
            const nextX = gx + dijkstraMove.dx;
            const nextY = gy + dijkstraMove.dy;
            const moveStaysInTerritory = nextX >= g.territory.minX && nextX < g.territory.maxX &&
                                        nextY >= g.territory.minY && nextY < g.territory.maxY;
            
            if (moveStaysInTerritory) {
                // Dijkstra move keeps us in territory - chase!
                nextMove = dijkstraMove;
                // Mark as chasing and clear DFS
                if (!g.wasChasing) {
                    g.dfsPath = null;
                    g.dfsIndex = 0;
                    g.wasChasing = true;
                }
            } else {
                // Can't chase without leaving territory - patrol instead
                if (g.wasChasing) {
                    // Was chasing but now can't - reinit DFS
                    g.dfsPath = null;
                    g.dfsIndex = 0;
                    g.wasChasing = false;
                }
                nextMove = getTerritorialDFSMove(g);
            }
        }
        // THIRD: Ghost in territory, Pacman NOT in territory - patrol
        else {
            if (g.wasChasing) {
                // Pacman just left - reinitialize DFS from current position
                g.dfsPath = null;
                g.dfsIndex = 0;
                g.wasChasing = false;
            }
            // Do DFS patrol
            nextMove = getTerritorialDFSMove(g);
        }
    }
    break;
```

## 5. Immediate Response System
```javascript
// Check if Pacman just entered territorial ghost's territory
let pacmanJustEntered = false;
if (g.strategy === GHOST_STRATEGY.TERRITORIAL && g.territory) {
    const pacmanInTerritory = pacX >= g.territory.minX && pacX < g.territory.maxX &&
                             pacY >= g.territory.minY && pacY < g.territory.maxY;
    pacmanJustEntered = pacmanInTerritory && !g.pacmanWasInTerritory;
    g.pacmanWasInTerritory = pacmanInTerritory;
}

// Territorial ghosts can update immediately when Pacman is in their territory
const canUpdate = (nearCenter && g.timer > 10) || 
                 (pacmanJustEntered && nearCenter) ||
                 (g.strategy === GHOST_STRATEGY.TERRITORIAL && g.pacmanWasInTerritory && nearCenter && g.timer > 2);

// IMMEDIATE RESPONSE: Territorial ghosts drop DFS and chase when Pacman enters
// This happens even mid-movement, not just at grid centers
if (g.strategy === GHOST_STRATEGY.TERRITORIAL && g.territory) {
    const pacmanInTerritory = pacX >= g.territory.minX && pacX < g.territory.maxX &&
                             pacY >= g.territory.minY && pacY < g.territory.maxY;
    const gx = Math.round(g.x);
    const gy = Math.round(g.y);
    const ghostInTerritory = gx >= g.territory.minX && gx < g.territory.maxX &&
                            gy >= g.territory.minY && gy < g.territory.maxY;
    
    // If Pacman is in territory, ghost is in territory, and ghost is not already chasing
    // Then immediately switch to chasing, even mid-movement
    if (pacmanInTerritory && ghostInTerritory && !g.wasChasing) {
        // Use the pre-calculated Dijkstra move
        const dijkstraMove = ghostPaths[index];
        
        if (dijkstraMove) {
            const nextX = gx + dijkstraMove.dx;
            const nextY = gy + dijkstraMove.dy;
            
            // Only switch if the move keeps us in territory
            if (nextX >= g.territory.minX && nextX < g.territory.maxX &&
                nextY >= g.territory.minY && nextY < g.territory.maxY) {
                // Drop DFS immediately and switch to chasing
                g.dir = dijkstraMove;
                g.wasChasing = true;
                g.dfsPath = null;
                g.dfsIndex = 0;
                g.timer = 0; // Reset timer to allow continuous updates while chasing
                
                // Snap to grid for smoother transition
                if (Math.abs(g.x - gx) < 0.3 && Math.abs(g.y - gy) < 0.3) {
                    g.x = gx;
                    g.y = gy;
                }
            }
        }
    }
    // Also handle when Pacman leaves - immediately resume patrol
    else if (!pacmanInTerritory && ghostInTerritory && g.wasChasing) {
        g.wasChasing = false;
        g.dfsPath = null;  // Will regenerate DFS path from current position
        g.dfsIndex = 0;
        g.timer = 0;
    }
}
```

## 6. DFS Patrol Functions
```javascript
// Territorial DFS patrol move - only moves within territory subgraph
function getTerritorialDFSMove(ghost) {
    const gx = Math.round(ghost.x);
    const gy = Math.round(ghost.y);
    const territory = ghost.territory;
    
    if (!territory) return null;
    
    // Initialize or regenerate DFS path if needed
    // IMPORTANT: Generate from ghost's CURRENT position, not center
    if (!ghost.dfsPath || ghost.dfsPath.length === 0) {
        ghost.dfsPath = generateDFSPathForTerritory(territory, gx, gy);
        ghost.dfsIndex = 0;
    }
    
    // Get target position from DFS path
    if (ghost.dfsPath && ghost.dfsPath.length > 0) {
        const target = ghost.dfsPath[ghost.dfsIndex];
        
        // If we reached the target, move to next point in path
        if (gx === target.x && gy === target.y) {
            ghost.dfsIndex = (ghost.dfsIndex + 1) % ghost.dfsPath.length; // Loop the path
            const nextTarget = ghost.dfsPath[ghost.dfsIndex];
            return getDirectionTowardInTerritory(gx, gy, nextTarget.x, nextTarget.y, territory);
        }
        
        // Move toward current target, constrained to territory
        return getDirectionTowardInTerritory(gx, gy, target.x, target.y, territory);
    }
    
    return null;
}

// Generate DFS path for patrolling a territory - only includes cells in territory subgraph
function generateDFSPathForTerritory(territory, ghostX, ghostY) {
    const path = [];
    const visited = new Set();
    
    // Start from ghost's current position if in territory, otherwise from center
    let startX, startY;
    if (ghostX >= territory.minX && ghostX < territory.maxX &&
        ghostY >= territory.minY && ghostY < territory.maxY) {
        // Ghost is in territory - start from current position
        startX = ghostX;
        startY = ghostY;
    } else {
        // Ghost outside territory - shouldn't happen but use center as fallback
        startX = Math.floor((territory.minX + territory.maxX) / 2);
        startY = Math.floor((territory.minY + territory.maxY) / 2);
    }
    
    // DFS to visit all accessible cells ONLY within territory bounds
    function dfs(x, y) {
        // IGNORE nodes outside territory - never move there
        if (x < territory.minX || x >= territory.maxX || 
            y < territory.minY || y >= territory.maxY) {
            return; // Outside territory subgraph - ignore
        }
        
        const key = `${x},${y}`;
        if (visited.has(key)) return;
        
        // Check if wall
        if (grid[y][x] === 1) return;
        
        visited.add(key);
        path.push({x, y});
        
        // Visit neighbors in consistent order for predictable patrol
        // But only consider cells within territory
        const dirs = [DIR.UP, DIR.RIGHT, DIR.DOWN, DIR.LEFT];
        for (let dir of dirs) {
            const nx = x + dir.dx;
            const ny = y + dir.dy;
            // Only recurse if next cell is in territory
            if (nx >= territory.minX && nx < territory.maxX &&
                ny >= territory.minY && ny < territory.maxY) {
                dfs(nx, ny);
            }
        }
    }
    
    // Start DFS from center
    dfs(startX, startY);
    
    // If path is empty or too short, create simple patrol within bounds
    if (path.length < 3) {
        path.length = 0;
        // Just move in a small square within territory
        const cx = Math.floor((territory.minX + territory.maxX) / 2);
        const cy = Math.floor((territory.minY + territory.maxY) / 2);
        
        // Try to create a small patrol loop
        const positions = [
            {x: cx, y: cy},
            {x: cx + 1, y: cy},
            {x: cx + 1, y: cy + 1},
            {x: cx, y: cy + 1}
        ];
        
        for (let pos of positions) {
            if (pos.x >= territory.minX && pos.x < territory.maxX &&
                pos.y >= territory.minY && pos.y < territory.maxY &&
                grid[pos.y] && grid[pos.y][pos.x] !== 1) {
                path.push(pos);
            }
        }
    }
    
    return path;
}

// Get direction to move toward target, but stay within territory bounds
function getDirectionTowardInTerritory(fromX, fromY, toX, toY, territory) {
    const dx = Math.sign(toX - fromX);
    const dy = Math.sign(toY - fromY);
    
    // Helper to check if position is in territory
    const inTerritory = (x, y) => {
        return x >= territory.minX && x < territory.maxX &&
               y >= territory.minY && y < territory.maxY;
    };
    
    // Prioritize the axis with greater distance
    if (Math.abs(toX - fromX) > Math.abs(toY - fromY)) {
        if (dx !== 0 && grid[fromY][fromX + dx] !== 1 && inTerritory(fromX + dx, fromY)) {
            return {dx, dy: 0};
        }
        if (dy !== 0 && grid[fromY + dy][fromX] !== 1 && inTerritory(fromX, fromY + dy)) {
            return {dx: 0, dy};
        }
    } else {
        if (dy !== 0 && grid[fromY + dy][fromX] !== 1 && inTerritory(fromX, fromY + dy)) {
            return {dx: 0, dy};
        }
        if (dx !== 0 && grid[fromY][fromX + dx] !== 1 && inTerritory(fromX + dx, fromY)) {
            return {dx, dy: 0};
        }
    }
    
    // Try any valid direction within territory
    const validDirs = [];
    for (let dir of Object.values(DIR)) {
        const nx = fromX + dir.dx;
        const ny = fromY + dir.dy;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && 
            grid[ny][nx] !== 1 && inTerritory(nx, ny)) {
            validDirs.push(dir);
        }
    }
    
    // Return a random valid direction to avoid getting stuck
    if (validDirs.length > 0) {
        return validDirs[Math.floor(Math.random() * validDirs.length)];
    }
    
    return null;
}
```

## 7. Boundary Enforcement
```javascript
// In the movement execution section:
if (nextMove) {
    // FINAL SAFETY CHECK: Territorial ghosts must NEVER leave territory
    if (g.strategy === GHOST_STRATEGY.TERRITORIAL && g.territory) {
        const nextX = gx + nextMove.dx;
        const nextY = gy + nextMove.dy;
        const ghostInTerritory = gx >= g.territory.minX && gx < g.territory.maxX &&
                                gy >= g.territory.minY && gy < g.territory.maxY;
        const moveInTerritory = nextX >= g.territory.minX && nextX < g.territory.maxX &&
                               nextY >= g.territory.minY && nextY < g.territory.maxY;
        
        // If ghost is in territory and move would leave, find alternative
        if (ghostInTerritory && !moveInTerritory) {
            // Try to find any valid move within territory
            const territorialDirs = [];
            for (let dir of Object.values(DIR)) {
                const nx = gx + dir.dx;
                const ny = gy + dir.dy;
                if (nx >= g.territory.minX && nx < g.territory.maxX &&
                    ny >= g.territory.minY && ny < g.territory.maxY &&
                    grid[ny][nx] !== 1) {
                    territorialDirs.push(dir);
                }
            }
            
            if (territorialDirs.length > 0) {
                // Prefer not reversing
                const nonReverse = territorialDirs.filter(d => 
                    !g.dir || (d.dx !== -g.dir.dx || d.dy !== -g.dir.dy));
                nextMove = nonReverse.length > 0 ? nonReverse[0] : territorialDirs[0];
            } else {
                nextMove = null; // Truly stuck
            }
        }
    }
}

// ABSOLUTE FINAL CHECK before actual movement:
if (g.strategy === GHOST_STRATEGY.TERRITORIAL && g.territory) {
    const currentInTerritory = g.x >= g.territory.minX && g.x < g.territory.maxX &&
                              g.y >= g.territory.minY && g.y < g.territory.maxY;
    const nextX = g.x + g.dir.dx * 0.05;
    const nextY = g.y + g.dir.dy * 0.05;
    const nextInTerritory = nextX >= g.territory.minX && nextX < g.territory.maxX &&
                           nextY >= g.territory.minY && nextY < g.territory.maxY;
    
    // Only move if we stay in territory OR we're returning to territory
    if (currentInTerritory && !nextInTerritory) {
        // Would leave territory - DON'T MOVE
        g.dir = null;
    }
}
```