/* 物理弹球游戏 - 核心游戏逻辑文件 */

class Vector2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    add(v) { return new Vector2(this.x + v.x, this.y + v.y); }
    subtract(v) { return new Vector2(this.x - v.x, this.y - v.y); }
    multiply(s) { return new Vector2(this.x * s, this.y * s); }
    magnitude() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() {
        const mag = this.magnitude();
        return mag === 0 ? new Vector2(0, 0) : new Vector2(this.x / mag, this.y / mag);
    }
    dot(v) { return this.x * v.x + this.y * v.y; }
}

const GameConfig = {
    gravity: 0.2, friction: 0.98, elasticity: 0.8,
    ballRadius: 10, ballSpeed: 8,
    colors: {
        ball: '#4285f4', paddle: '#34a853', bumper: '#ea4335',
        target: '#fbbc05', ramp: '#b3b3ff', wall: '#2d3748'
    },
    scores: { bumper: 100, target: 250, ramp: 50, levelComplete: 5000 }
};

class PhysicsEntity {
    constructor(x, y) { this.position = new Vector2(x, y); }
}

class Circle extends PhysicsEntity {
    constructor(x, y, radius) {
        super(x, y);
        this.radius = radius;
        this.velocity = new Vector2(0, 0);
    }
    update() {
        this.velocity.y += GameConfig.gravity;
        this.velocity = this.velocity.multiply(GameConfig.friction);
        this.position = this.position.add(this.velocity);
    }
}

class Ball extends Circle {
    constructor(x, y) {
        super(x, y, GameConfig.ballRadius);
        this.active = true;
        this.trail = [];
    }
    draw(ctx) {
        if (!this.active) return;
        // Trail
        ctx.beginPath();
        this.trail.forEach((p, i) => {
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
        });
        ctx.strokeStyle = `rgba(66, 133, 244, 0.3)`;
        ctx.stroke();

        this.trail.push({x: this.position.x, y: this.position.y});
        if (this.trail.length > 10) this.trail.shift();

        // Body
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = GameConfig.colors.ball;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class PinballGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.bgCanvas = document.createElement('canvas');
        this.bgCtx = this.bgCanvas.getContext('2d');
        
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        this.state = {
            running: false, paused: false, gameOver: false,
            score: 0, lives: 3, level: 1
        };
        
        this.elements = {
            balls: [], paddles: [], bumpers: [], 
            targets: [], ramps: [], walls: []
        };
        
        this.input = { left: false, right: false };
        
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.bindEvents();
        this.resetLevel();
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = rect.width;
        this.height = rect.height;
        
        this.bgCanvas.width = this.width;
        this.bgCanvas.height = this.height;
        this.renderBackground();
        
        // Re-init walls on resize
        this.initWalls();
        // Re-position paddle
        if (this.elements.paddles.length > 0) {
            this.elements.paddles[0].position.y = this.height - 50;
        }
    }

    renderBackground() {
        const ctx = this.bgCtx;
        const w = this.width;
        const h = this.height;
        
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        
        // Grid
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
    }

    initWalls() {
        this.elements.walls = [
            { x: 0, y: 0, w: this.width, h: 20 }, // Top
            { x: 0, y: 0, w: 20, h: this.height }, // Left
            { x: this.width - 20, y: 0, w: 20, h: this.height } // Right
            // Bottom is open
        ];
    }

    resetLevel() {
        this.elements.balls = [];
        this.elements.paddles = [{
            position: new Vector2(this.width / 2 - 60, this.height - 50),
            width: 120, height: 20, speed: 15
        }];
        
        this.elements.bumpers = [
            new Circle(this.width * 0.3, this.height * 0.3, 25),
            new Circle(this.width * 0.7, this.height * 0.3, 25),
            new Circle(this.width * 0.5, this.height * 0.5, 30)
        ];
        
        this.spawnBall();
    }

    spawnBall() {
        this.elements.balls.push(new Ball(this.width - 50, this.height - 100));
    }

    bindEvents() {
        document.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') this.input.left = true;
            if (e.key === 'ArrowRight') this.input.right = true;
            if (e.code === 'Space' && !this.state.running) this.launchBall();
        });
        document.addEventListener('keyup', e => {
            if (e.key === 'ArrowLeft') this.input.left = false;
            if (e.key === 'ArrowRight') this.input.right = false;
        });
        
        document.getElementById('start-btn').addEventListener('click', () => {
             if (this.state.gameOver) this.restart();
             else this.launchBall();
        });
    }

    launchBall() {
        if (this.elements.balls.length > 0) {
            const ball = this.elements.balls[0];
            ball.velocity = new Vector2(-5, -15); // Launch vector
            this.state.running = true;
            document.getElementById('game-overlay').style.display = 'none';
        }
    }

    restart() {
        this.state.score = 0;
        this.state.lives = 3;
        this.state.gameOver = false;
        this.state.running = false;
        this.resetLevel();
        this.updateUI();
        document.getElementById('game-overlay').style.display = 'flex';
        document.getElementById('game-status').textContent = "Ready";
        document.getElementById('game-message').textContent = "Press Start";
    }

    update() {
        if (!this.state.running) return;

        // Paddle
        const paddle = this.elements.paddles[0];
        if (this.input.left) paddle.position.x -= paddle.speed;
        if (this.input.right) paddle.position.x += paddle.speed;
        paddle.position.x = Math.max(20, Math.min(this.width - 20 - paddle.width, paddle.position.x));

        // Balls
        this.elements.balls.forEach((ball, index) => {
            ball.update();

            // Walls
            if (ball.position.x < 20 + ball.radius || ball.position.x > this.width - 20 - ball.radius) {
                ball.velocity.x *= -0.8;
                ball.position.x = ball.position.x < 50 ? 20 + ball.radius + 1 : this.width - 20 - ball.radius - 1;
            }
            if (ball.position.y < 20 + ball.radius) {
                ball.velocity.y *= -0.8;
                ball.position.y = 20 + ball.radius + 1;
            }

            // Paddle Collision
            if (ball.position.y + ball.radius > paddle.position.y &&
                ball.position.x > paddle.position.x &&
                ball.position.x < paddle.position.x + paddle.width) {
                    ball.velocity.y *= -1;
                    ball.position.y = paddle.position.y - ball.radius - 1;
                    
                    // Add some horizontal velocity based on hit position
                    const center = paddle.position.x + paddle.width / 2;
                    const diff = ball.position.x - center;
                    ball.velocity.x += diff * 0.1;
            }

            // Bumpers
            this.elements.bumpers.forEach(bumper => {
                const dist = ball.position.subtract(bumper.position).magnitude();
                if (dist < ball.radius + bumper.radius) {
                    const normal = ball.position.subtract(bumper.position).normalize();
                    ball.velocity = normal.multiply(10); // Bounce
                    this.state.score += 100;
                    this.updateUI();
                }
            });

            // Death
            if (ball.position.y > this.height) {
                this.elements.balls.splice(index, 1);
                this.handleLifeLost();
            }
        });
    }

    handleLifeLost() {
        this.state.lives--;
        this.updateUI();
        this.state.running = false;
        
        if (this.state.lives <= 0) {
            this.state.gameOver = true;
            document.getElementById('game-overlay').style.display = 'flex';
            document.getElementById('game-status').textContent = "Game Over";
            document.getElementById('game-message').textContent = `Final Score: ${this.state.score}`;
            document.getElementById('start-btn').textContent = "Restart";
        } else {
            this.spawnBall();
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.state.score;
        document.getElementById('lives').innerHTML = '♥'.repeat(this.state.lives);
    }

    draw() {
        this.ctx.drawImage(this.bgCanvas, 0, 0);

        // Walls
        this.ctx.fillStyle = '#1e293b';
        this.elements.walls.forEach(w => this.ctx.fillRect(w.x, w.y, w.w, w.h));

        // Paddle
        const p = this.elements.paddles[0];
        this.ctx.fillStyle = GameConfig.colors.paddle;
        this.ctx.fillRect(p.position.x, p.position.y, p.width, p.height);

        // Bumpers
        this.elements.bumpers.forEach(b => {
            this.ctx.beginPath();
            this.ctx.arc(b.position.x, b.position.y, b.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = GameConfig.colors.bumper;
            this.ctx.fill();
        });

        // Balls
        this.elements.balls.forEach(b => b.draw(this.ctx));
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new PinballGame();
});
