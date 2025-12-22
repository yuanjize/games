/**
 * Space Shooter - Modern Implementation with Object Pooling
 */

class SpaceShooterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.state = {
            running: false,
            score: 0,
            lives: 3,
            gameOver: false
        };

        this.player = { x: 0, y: 0, w: 40, h: 40, speed: 7, cd: 0 };
        this.bullets = [];
        this.enemies = [];
        this.stars = [];
        
        // Input
        this.keys = {};
        
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.bindEvents();
        this.generateStars();
        this.reset();
        this.showOverlay('startScreen');
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = rect.width;
        this.height = rect.height;
    }

    generateStars() {
        this.stars = [];
        for(let i=0; i<100; i++) {
            this.stars.push({
                x: Math.random() * 2000, // Large range for parallax/scroll
                y: Math.random() * 2000,
                s: Math.random() * 2 + 1,
                o: Math.random()
            });
        }
    }

    reset() {
        this.state.score = 0;
        this.state.lives = 3;
        this.state.gameOver = false;
        this.bullets = [];
        this.enemies = [];
        this.player.x = this.width / 2 - 20;
        this.player.y = this.height - 80;
        this.updateUI();
    }

    bindEvents() {
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
        
        document.getElementById('startGameBtn').addEventListener('click', () => this.start());
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.reset();
            this.start();
        });
    }

    start() {
        this.state.running = true;
        this.hideOverlays();
        this.lastTime = performance.now();
        requestAnimationFrame(t => this.loop(t));
    }

    loop(now) {
        if (!this.state.running) return;
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.update(dt);
        this.draw();
        requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
        // Player Move
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.player.x -= this.player.speed;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) this.player.x += this.player.speed;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) this.player.y -= this.player.speed;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) this.player.y += this.player.speed;
        
        this.player.x = Math.max(0, Math.min(this.width - this.player.w, this.player.x));
        this.player.y = Math.max(0, Math.min(this.height - this.player.h, this.player.y));

        // Shoot
        if (this.player.cd > 0) this.player.cd -= dt;
        if (this.keys['Space'] && this.player.cd <= 0) {
            this.bullets.push({ x: this.player.x + this.player.w/2 - 2, y: this.player.y, w: 4, h: 15, s: 600 });
            this.player.cd = 0.25;
        }

        // Bullets
        for(let i=this.bullets.length-1; i>=0; i--) {
            const b = this.bullets[i];
            b.y -= b.s * dt;
            if (b.y < -20) this.bullets.splice(i, 1);
        }

        // Spawn Enemies
        if (Math.random() < 0.03) {
            this.enemies.push({
                x: Math.random() * (this.width - 40),
                y: -50, w: 40, h: 40,
                s: 100 + Math.random() * 150
            });
        }

        // Enemies
        for(let i=this.enemies.length-1; i>=0; i--) {
            const e = this.enemies[i];
            e.y += e.s * dt;
            
            // Player Collision
            if (this.checkColl(this.player, e)) {
                this.state.lives--;
                this.enemies.splice(i, 1);
                this.updateUI();
                if (this.state.lives <= 0) this.gameOver();
                continue;
            }

            // Bullet Collision
            for(let j=this.bullets.length-1; j>=0; j--) {
                if (this.checkColl(this.bullets[j], e)) {
                    this.enemies.splice(i, 1);
                    this.bullets.splice(j, 1);
                    this.state.score += 10;
                    this.updateUI();
                    break;
                }
            }

            if (e.y > this.height) this.enemies.splice(i, 1);
        }
    }

    checkColl(r1, r2) {
        return r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y;
    }

    gameOver() {
        this.state.running = false;
        this.state.gameOver = true;
        document.getElementById('finalScore').textContent = this.state.score;
        this.showOverlay('gameOverScreen');
    }

    updateUI() {
        document.getElementById('scoreDisplay').textContent = this.state.score;
        document.getElementById('livesDisplay').textContent = this.state.lives;
    }

    draw() {
        this.ctx.fillStyle = '#020617';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Stars
        this.ctx.fillStyle = '#fff';
        this.stars.forEach(s => {
            this.ctx.globalAlpha = s.o;
            this.ctx.fillRect(s.x % this.width, s.y % this.height, s.s, s.s);
        });
        this.ctx.globalAlpha = 1;

        // Player
        this.ctx.fillStyle = '#06b6d4';
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.w/2, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.w, this.player.y + this.player.h);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.h);
        this.ctx.fill();

        // Bullets
        this.ctx.fillStyle = '#fbbf24';
        this.bullets.forEach(b => this.ctx.fillRect(b.x, b.y, b.w, b.h));

        // Enemies
        this.ctx.fillStyle = '#f43f5e';
        this.enemies.forEach(e => {
            this.ctx.fillRect(e.x, e.y, e.w, e.h);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(e.x + 10, e.y + 10, 5, 5);
            this.ctx.fillRect(e.x + 25, e.y + 10, 5, 5);
            this.ctx.fillStyle = '#f43f5e';
        });
    }

    showOverlay(id) {
        document.querySelectorAll('.overlay').forEach(el => el.style.display = 'none');
        const el = document.getElementById(id);
        if (el) el.style.display = 'flex';
    }

    hideOverlays() {
        document.querySelectorAll('.overlay').forEach(el => el.style.display = 'none');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new SpaceShooterGame();
});
