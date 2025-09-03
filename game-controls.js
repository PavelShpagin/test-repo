// Controls and Sound Module for Pac-Man Mobile

// Touch Controls Manager
export class TouchControls {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.lastDirection = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const canvas = document.getElementById('gameCanvas');
        const touchOverlay = document.getElementById('touchOverlay');
        
        // Touch events
        touchOverlay.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        touchOverlay.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        touchOverlay.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // Mouse events for testing
        touchOverlay.addEventListener('mousedown', this.handleMouseDown.bind(this));
        touchOverlay.addEventListener('mousemove', this.handleMouseMove.bind(this));
        touchOverlay.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // Touch zones
        const zones = document.querySelectorAll('.touch-zone');
        zones.forEach(zone => {
            zone.addEventListener('click', (e) => {
                const direction = e.target.dataset.direction;
                this.setDirection(direction);
            });
        });
        
        // Prevent default touch behaviors
        touchOverlay.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }
    
    handleTouchStart(e) {
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
    }
    
    handleTouchMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        
        if (Math.abs(deltaX) > window.CONFIG.SWIPE_THRESHOLD || Math.abs(deltaY) > window.CONFIG.SWIPE_THRESHOLD) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.setDirection(deltaX > 0 ? 'right' : 'left');
            } else {
                this.setDirection(deltaY > 0 ? 'down' : 'up');
            }
            
            // Reset to prevent multiple detections
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }
    }
    
    handleTouchEnd(e) {
        const touchDuration = Date.now() - this.touchStartTime;
        
        if (touchDuration < 200) {
            // Quick tap - pause/resume
            if (this.game.state.state === 'playing') {
                this.game.pause();
            } else if (this.game.state.state === 'paused') {
                this.game.resume();
            }
        }
        
        this.touchStartX = null;
        this.touchStartY = null;
    }
    
    handleMouseDown(e) {
        this.touchStartX = e.clientX;
        this.touchStartY = e.clientY;
        this.touchStartTime = Date.now();
    }
    
    handleMouseMove(e) {
        if (!this.touchStartX || !this.touchStartY) return;
        
        const deltaX = e.clientX - this.touchStartX;
        const deltaY = e.clientY - this.touchStartY;
        
        if (Math.abs(deltaX) > window.CONFIG.SWIPE_THRESHOLD || Math.abs(deltaY) > window.CONFIG.SWIPE_THRESHOLD) {
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                this.setDirection(deltaX > 0 ? 'right' : 'left');
            } else {
                this.setDirection(deltaY > 0 ? 'down' : 'up');
            }
            
            this.touchStartX = e.clientX;
            this.touchStartY = e.clientY;
        }
    }
    
    handleMouseUp(e) {
        this.touchStartX = null;
        this.touchStartY = null;
    }
    
    handleKeyDown(e) {
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
                this.setDirection('up');
                break;
            case 'ArrowDown':
            case 's':
                this.setDirection('down');
                break;
            case 'ArrowLeft':
            case 'a':
                this.setDirection('left');
                break;
            case 'ArrowRight':
            case 'd':
                this.setDirection('right');
                break;
            case ' ':
            case 'p':
                if (this.game.state.state === 'playing') {
                    this.game.pause();
                } else if (this.game.state.state === 'paused') {
                    this.game.resume();
                }
                break;
        }
    }
    
    setDirection(direction) {
        if (this.game.state.state !== 'playing') return;
        
        const directions = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };
        
        const dir = directions[direction];
        if (dir && this.game.pacman) {
            this.game.pacman.setDirection(dir.x, dir.y);
            this.vibrate('eat');
        }
    }
    
    vibrate(pattern) {
        if (!window.CONFIG.VIBRATION_ENABLED || !navigator.vibrate) return;
        
        const patterns = window.CONFIG.VIBRATION_PATTERNS;
        if (patterns[pattern]) {
            navigator.vibrate(patterns[pattern]);
        }
    }
}

// Sound Manager
export class SoundManager {
    constructor() {
        this.enabled = localStorage.getItem('soundEnabled') !== 'false';
        this.audioContext = null;
        this.sounds = {};
        
        this.initializeAudio();
    }
    
    initializeAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create basic sound effects
            this.createSounds();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    createSounds() {
        // Simple beep sounds using Web Audio API
        this.sounds.eat = () => this.playTone(440, 0.05);
        this.sounds.powerUp = () => this.playTone(220, 0.2);
        this.sounds.eatGhost = () => this.playTone(880, 0.1);
        this.sounds.death = () => this.playDescendingTone();
        this.sounds.levelComplete = () => this.playAscendingTone();
    }
    
    playTone(frequency, duration) {
        if (!this.enabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playDescendingTone() {
        if (!this.enabled || !this.audioContext) return;
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(800 - i * 150, 0.1);
            }, i * 100);
        }
    }
    
    playAscendingTone() {
        if (!this.enabled || !this.audioContext) return;
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.playTone(400 + i * 100, 0.1);
            }, i * 50);
        }
    }
    
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
    
    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('soundEnabled', this.enabled.toString());
        return this.enabled;
    }
}