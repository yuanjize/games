/* 物理弹球游戏 - 增强版核心游戏逻辑文件 */
/* 包含完整的可访问性支持、触摸控制和键盘导航 */

class Vector2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    subtract(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    multiply(s) {
        return new Vector2(this.x * s, this.y * s);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        return mag === 0 ? new Vector2(0, 0) : new Vector2(this.x / mag, this.y / mag);
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    clone() {
        return new Vector2(this.x, this.y);
    }

    // 旋转向量
    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }
}

const GameConfig = {
    gravity: 0.25,
    friction: 0.995,
    elasticity: 0.85,
    ballRadius: 10,
    ballSpeed: 8,
    paddleSpeed: 15,
    maxBallSpeed: 22,
    minBallSpeed: 3,

    // 轨迹效果配置
    trail: {
        enabled: true,
        maxLength: 25,
        fadeSpeed: 0.08,
        width: 3,
        glowAmount: 15
    },

    colors: {
        ball: '#4285f4',
        paddle: '#34a853',
        bumper: '#ea4335',
        target: '#fbbc05',
        ramp: '#b3b3ff',
        wall: '#2d3748',
        trail: 'rgba(66, 133, 244, 0.4)',
        paddleGlow: 'rgba(74, 222, 128, 0.8)',
        bumperGlow: 'rgba(239, 68, 68, 0.8)'
    },

    scores: {
        bumper: 100,
        target: 250,
        ramp: 50,
        levelComplete: 5000,
        bonusMultiplier: 2
    },

    accessibility: {
        announcementDelay: 100,
        ariaLive: 'assertive',
        focusableElements: ['start-btn', 'restart-btn']
    }
};

class PhysicsEntity {
    constructor(x, y) {
        this.position = new Vector2(x, y);
    }
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
        this.launched = false;
        // 添加旋转角度
        this.rotation = 0;
        // 添加旋转速度
        this.angularVelocity = 0;
        // 轨迹点
        this.trailPoints = [];
    }

    draw(ctx) {
        if (!this.active) return;

        // 绘制增强轨迹效果
        this.drawEnhancedTrail(ctx);

        // 计算球的旋转（基于速度）
        if (this.launched) {
            const speed = this.velocity.magnitude();
            this.angularVelocity = speed * 0.05;
            this.rotation += this.angularVelocity;
        }

        // 保存上下文状态
        ctx.save();

        // 移动到球的位置并旋转
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);

        // 绘制球体 - 增强渐变效果
        const gradient = ctx.createRadialGradient(
            -this.radius * 0.3, -this.radius * 0.3, 0,
            0, 0, this.radius
        );

        // 高光效果
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.2, '#e3f2fd');
        gradient.addColorStop(0.5, GameConfig.colors.ball);
        gradient.addColorStop(0.8, '#1565c0');
        gradient.addColorStop(1, '#0d47a1');

        // 绘制球体阴影
        ctx.shadowColor = 'rgba(66, 133, 244, 0.5)';
        ctx.shadowBlur = GameConfig.trail.glowAmount;

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 重置阴影
        ctx.shadowBlur = 0;

        // 绘制球体纹理/条纹（显示旋转）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 1.5);
        ctx.stroke();

        // 绘制高光点
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();

        // 绘制边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();

        // 更新轨迹
        this.updateTrail();
    }

    drawEnhancedTrail(ctx) {
        if (!GameConfig.trail.enabled || this.trailPoints.length < 2) return;

        ctx.save();

        // 绘制多层轨迹以产生发光效果
        for (let layer = 0; layer < 3; layer++) {
            ctx.beginPath();

            const trailLength = Math.min(this.trailPoints.length, GameConfig.trail.maxLength);

            for (let i = 0; i < trailLength; i++) {
                const point = this.trailPoints[i];
                const progress = i / trailLength;
                const alpha = progress * (0.5 - layer * 0.15);

                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            }

            // 渐变轨迹颜色
            const gradient = ctx.createLinearGradient(
                this.trailPoints[0].x, this.trailPoints[0].y,
                this.position.x, this.position.y
            );
            gradient.addColorStop(0, 'rgba(66, 133, 244, 0)');
            gradient.addColorStop(1, `rgba(66, 133, 244, ${0.6 - layer * 0.2})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = GameConfig.trail.width + layer * 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.7;
            ctx.stroke();
        }

        ctx.restore();
    }

    updateTrail() {
        if (!this.launched) return;

        // 添加当前点到轨迹
        this.trailPoints.push({
            x: this.position.x,
            y: this.position.y,
            time: Date.now()
        });

        // 限制轨迹长度
        while (this.trailPoints.length > GameConfig.trail.maxLength) {
            this.trailPoints.shift();
        }
    }

    limitSpeed() {
        const speed = this.velocity.magnitude();

        // 限制最大速度
        if (speed > GameConfig.maxBallSpeed) {
            this.velocity = this.velocity.normalize().multiply(GameConfig.maxBallSpeed);
        }

        // 确保最小速度
        if (speed < GameConfig.minBallSpeed && this.launched && speed > 0) {
            this.velocity = this.velocity.normalize().multiply(GameConfig.minBallSpeed);
        }
    }

    // 真实物理反弹计算
    bounce(normal, elasticity = null) {
        const e = elasticity ?? GameConfig.elasticity;

        // 使用反射公式: v' = v - 2(v·n)n
        const dot = this.velocity.dot(normal);
        const reflection = normal.multiply(2 * dot);
        this.velocity = this.velocity.subtract(reflection).multiply(e);

        // 添加轻微的随机扰动使反弹更自然
        const randomAngle = (Math.random() - 0.5) * 0.05;
        this.velocity = this.velocity.rotate(randomAngle);
    }
}

// 挡板类 - 支持发光效果
class Paddle {
    constructor(x, y, width, height, color) {
        this.position = new Vector2(x, y);
        this.width = width;
        this.height = height;
        this.color = color;
        this.speed = GameConfig.paddleSpeed;
        this.glowIntensity = 0;
        this.glowTarget = 0;
        this.hitAnimation = 0;
        this.type = 'paddle';
    }

    update() {
        // 更新发光效果
        this.glowIntensity += (this.glowTarget - this.glowIntensity) * 0.2;
        this.glowTarget *= 0.95;

        // 更新碰撞动画
        if (this.hitAnimation > 0) {
            this.hitAnimation -= 0.05;
        }
    }

    triggerHitEffect() {
        this.glowTarget = 1;
        this.hitAnimation = 1;
    }

    draw(ctx) {
        const x = this.position.x;
        const y = this.position.y;

        ctx.save();

        // 计算动画偏移
        const animationOffset = Math.sin(this.hitAnimation * Math.PI) * 3;

        // 绘制发光效果
        if (this.glowIntensity > 0.01) {
            const glowGradient = ctx.createLinearGradient(
                x, y,
                x, y + this.height
            );
            glowGradient.addColorStop(0, `rgba(74, 222, 128, ${this.glowIntensity * 0.6})`);
            glowGradient.addColorStop(1, `rgba(34, 197, 94, ${this.glowIntensity * 0.4})`);

            ctx.shadowColor = `rgba(74, 222, 128, ${this.glowIntensity})`;
            ctx.shadowBlur = 20 + this.glowIntensity * 30;

            ctx.fillStyle = glowGradient;
            ctx.fillRect(x - 4, y - 4 - animationOffset, this.width + 8, this.height + 8);
        }

        // 主挡板渐变
        const paddleGradient = ctx.createLinearGradient(
            x, y,
            x, y + this.height
        );

        const brightness = 1 + this.hitAnimation * 0.5;
        paddleGradient.addColorStop(0, `rgba(74, 222, 128, ${brightness})`);
        paddleGradient.addColorStop(0.5, `rgba(34, 197, 94, ${brightness})`);
        paddleGradient.addColorStop(1, `rgba(22, 163, 74, ${brightness})`);

        ctx.shadowBlur = this.glowIntensity * 15;
        ctx.shadowColor = GameConfig.colors.paddleGlow;
        ctx.fillStyle = paddleGradient;
        ctx.fillRect(x, y - animationOffset, this.width, this.height);

        ctx.shadowBlur = 0;

        // 高光效果
        const highlightGradient = ctx.createLinearGradient(
            x, y,
            x, y + this.height * 0.3
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = highlightGradient;
        ctx.fillRect(x, y - animationOffset, this.width, this.height * 0.3);

        // 边框
        ctx.strokeStyle = this.glowIntensity > 0.3 ? '#ffffff' : 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2 + this.hitAnimation;
        ctx.strokeRect(x, y - animationOffset, this.width, this.height);

        // 发光粒子效果
        if (this.glowIntensity > 0.3) {
            this.drawGlowParticles(ctx, x, y);
        }

        ctx.restore();
    }

    drawGlowParticles(ctx, x, y) {
        const particleCount = Math.floor(this.glowIntensity * 5);
        for (let i = 0; i < particleCount; i++) {
            const px = x + Math.random() * this.width;
            const py = y + Math.random() * this.height;
            const size = 2 + Math.random() * 3;

            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(74, 222, 128, ${this.glowIntensity * 0.5 * Math.random()})`;
            ctx.fill();
        }
    }
}

// 反弹器类 - 支持碰撞动画
class Bumper {
    constructor(x, y, radius, color, scoreValue) {
        this.position = new Vector2(x, y);
        this.radius = radius;
        this.baseRadius = radius;
        this.color = color;
        this.scoreValue = scoreValue;
        this.hitAnimation = 0;
        this.glowIntensity = 0;
        this.type = 'bumper';
    }

    update() {
        if (this.hitAnimation > 0) {
            this.hitAnimation -= 0.05;
            this.radius = this.baseRadius + Math.sin(this.hitAnimation * Math.PI) * 8;
        } else {
            this.radius = this.baseRadius;
        }

        if (this.glowIntensity > 0) {
            this.glowIntensity -= 0.03;
        }
    }

    triggerHitEffect() {
        this.hitAnimation = 1;
        this.glowIntensity = 1;
    }

    draw(ctx) {
        ctx.save();

        // 外发光效果
        if (this.glowIntensity > 0.01) {
            const glowGradient = ctx.createRadialGradient(
                this.position.x, this.position.y, 0,
                this.position.x, this.position.y, this.radius * 2
            );
            glowGradient.addColorStop(0, `rgba(239, 68, 68, ${this.glowIntensity * 0.5})`);
            glowGradient.addColorStop(0.5, `rgba(220, 38, 38, ${this.glowIntensity * 0.3})`);
            glowGradient.addColorStop(1, 'rgba(220, 38, 38, 0)');

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 主反弹器渐变
        const bumperGradient = ctx.createRadialGradient(
            this.position.x - this.radius * 0.3,
            this.position.y - this.radius * 0.3,
            0,
            this.position.x,
            this.position.y,
            this.radius
        );

        const brightness = 1 + this.hitAnimation * 0.8;
        bumperGradient.addColorStop(0, `rgba(255, 255, 255, ${brightness})`);
        bumperGradient.addColorStop(0.3, `rgba(255, 200, 200, ${brightness})`);
        bumperGradient.addColorStop(0.7, this.color);
        bumperGradient.addColorStop(1, '#991b1b');

        // 阴影效果
        ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
        ctx.shadowBlur = 15 + this.hitAnimation * 20;
        ctx.shadowOffsetY = 3;

        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = bumperGradient;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // 边框
        ctx.strokeStyle = this.hitAnimation > 0.5 ? '#ffffff' : 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 3 + this.hitAnimation * 2;
        ctx.stroke();

        // 内圈装饰
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 分数值显示
        if (this.glowIntensity > 0.2) {
            ctx.font = `bold ${this.radius * 0.7}px 'Orbitron', monospace`;
            ctx.fillStyle = `rgba(255, 255, 255, ${this.glowIntensity})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.scoreValue.toString(), this.position.x, this.position.y);
        }

        ctx.restore();
    }
}

// 得分飘字动画
class FloatingScore {
    constructor(x, y, text, color = '#ffff00') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.velocity = new Vector2((Math.random() - 0.5) * 2, -3 - Math.random() * 2);
        this.scale = 0.8;
        this.rotation = (Math.random() - 0.5) * 0.2;
    }

    update() {
        this.life -= 0.015;
        this.y += this.velocity.y;
        this.x += this.velocity.x;
        this.velocity.y *= 0.98; // 减速
        this.scale = 1 + (1 - this.life) * 0.5; // 逐渐放大
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);

        // 阴影效果
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;

        // 绘制文字
        ctx.font = `bold 20px 'Orbitron', monospace`;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.text, 0, 0);

        // 描边
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, 0, 0);

        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

// 粒子效果
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.size = 3 + Math.random() * 4;
        this.decay = 0.02 + Math.random() * 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // 重力
        this.life -= this.decay;
        this.size *= 0.97;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0 || this.size < 0.5;
    }
}

class EnhancedPinballGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        if (!this.canvas) {
            console.error('游戏画布未找到');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.bgCanvas = document.createElement('canvas');
        this.bgCtx = this.bgCanvas.getContext('2d');

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.state = {
            running: false,
            paused: false,
            gameOver: false,
            score: 0,
            highScore: parseInt(localStorage.getItem('pinball_highscore')) || 0,
            lives: 3,
            level: 1,
            ballsLeft: 3,
            combo: 0,
            comboMultiplier: 1
        };

        this.elements = {
            balls: [],
            paddles: [],
            bumpers: [],
            targets: [],
            ramps: [],
            walls: [],
            flippers: []
        };

        this.input = {
            left: false,
            right: false,
            touchActive: false,
            touchX: 0
        };

        // 视觉效果容器
        this.animations = {
            scorePops: [],
            particles: [],
            floatingScores: []
        };

        this.soundEnabled = false;
        this.vibrationEnabled = false;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;

        // 存储事件处理器引用以便清理
        this.handlers = {};

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.resize(), 100);
        });
        this.bindEvents();
        this.bindTouchEvents();
        this.setupAccessibility();
        this.resetLevel();
        this.updateUI();
        this.loop = this.loop.bind(this);
        this.animationFrameId = requestAnimationFrame(this.loop);

        this.announceScreenReaderMessage('物理弹球游戏已加载完成。使用箭头键移动挡板，空格键发射球。');
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.ctx.scale(dpr, dpr);

        this.width = rect.width;
        this.height = rect.height;

        this.bgCanvas.width = this.width;
        this.bgCanvas.height = this.height;
        this.renderBackground();

        this.initWalls();

        if (this.elements.paddles.length > 0) {
            this.elements.paddles[0].position.y = this.height - 50;
            this.elements.paddles[0].position.x = Math.max(
                20,
                Math.min(
                    this.width - 20 - this.elements.paddles[0].width,
                    this.elements.paddles[0].position.x
                )
            );
        }
    }

    renderBackground() {
        const ctx = this.bgCtx;
        const w = this.width;
        const h = this.height;

        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0a1a');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        if (w > 640) {
            ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
            ctx.lineWidth = 1;

            for (let x = 0; x < w; x += 40) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, h);
                ctx.stroke();
            }

            for (let y = 0; y < h; y += 40) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(w, y);
                ctx.stroke();
            }
        }

        this.drawBackgroundElements();
    }

    drawBackgroundElements() {
        const ctx = this.bgCtx;
        const w = this.width;
        const h = this.height;

        for (let i = 0; i < 15; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const size = Math.random() * 2 + 1;
            const alpha = Math.random() * 0.5 + 0.3;

            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    initWalls() {
        this.elements.walls = [
            {
                x: 0,
                y: 0,
                w: this.width,
                h: 20,
                color: GameConfig.colors.wall,
                type: 'wall'
            },
            {
                x: 0,
                y: 0,
                w: 20,
                h: this.height,
                color: GameConfig.colors.wall,
                type: 'wall'
            },
            {
                x: this.width - 20,
                y: 0,
                w: 20,
                h: this.height,
                color: GameConfig.colors.wall,
                type: 'wall'
            }
        ];
    }

    resetLevel() {
        this.elements.balls = [];

        // 创建挡板
        this.elements.paddles = [new Paddle(
            this.width / 2 - 60,
            this.height - 50,
            120,
            20,
            GameConfig.colors.paddle
        )];

        // 创建反弹器
        this.elements.bumpers = [
            new Bumper(this.width * 0.3, this.height * 0.3, 25, GameConfig.colors.bumper, GameConfig.scores.bumper),
            new Bumper(this.width * 0.7, this.height * 0.3, 25, GameConfig.colors.bumper, GameConfig.scores.bumper),
            new Bumper(this.width * 0.5, this.height * 0.5, 30, GameConfig.colors.bumper, GameConfig.scores.bumper)
        ];

        this.spawnBall();
    }

    spawnBall() {
        if (this.elements.balls.length < 1) {
            const ball = new Ball(this.width - 50, this.height - 100);
            ball.launched = false;
            this.elements.balls.push(ball);
            this.updateUI();
        }
    }

    bindEvents() {
        this.handlers.keyDown = (e) => this.handleKeyDown(e);
        this.handlers.keyUp = (e) => this.handleKeyUp(e);

        document.addEventListener('keydown', this.handlers.keyDown);
        document.addEventListener('keyup', this.handlers.keyUp);

        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');

        if (startBtn) {
            this.handlers.startBtn = () => {
                if (this.state.gameOver) {
                    this.restart();
                } else {
                    this.launchBall();
                }
            };

            startBtn.addEventListener('click', this.handlers.startBtn);

            startBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handlers.startBtn();
                }
            });
        }

        if (restartBtn) {
            this.handlers.restartBtn = () => this.restart();

            restartBtn.addEventListener('click', this.handlers.restartBtn);

            restartBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handlers.restartBtn();
                }
            });
        }

        this.handlers.blur = () => {
            if (this.state.running && !this.state.paused) {
                this.togglePause();
            }
        };
        window.addEventListener('blur', this.handlers.blur);

        this.handlers.visibilityChange = () => {
            if (document.hidden && this.state.running && !this.state.paused) {
                this.togglePause();
            }
        };
        document.addEventListener('visibilitychange', this.handlers.visibilityChange);
    }

    bindTouchEvents() {
        this.handlers.touchStart = (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        };

        this.handlers.touchMove = (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        };

        this.handlers.touchEnd = (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        };

        this.canvas.addEventListener('touchstart', this.handlers.touchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handlers.touchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handlers.touchEnd, { passive: false });

        this.handlers.mouseDown = (e) => {
            this.handleMouseDown(e);
        };

        this.handlers.mouseMove = (e) => {
            this.handleMouseMove(e);
        };

        this.handlers.mouseUp = () => {
            this.handleMouseUp();
        };

        this.canvas.addEventListener('mousedown', this.handlers.mouseDown);
        this.canvas.addEventListener('mousemove', this.handlers.mouseMove);
        this.canvas.addEventListener('mouseup', this.handlers.mouseUp);
        this.canvas.addEventListener('mouseleave', this.handlers.mouseUp);
    }

    setupAccessibility() {
        this.canvas.setAttribute('role', 'application');
        this.canvas.setAttribute('aria-label', '物理弹球游戏画布');
        this.canvas.setAttribute('tabindex', '0');

        const srHint = document.createElement('div');
        srHint.className = 'sr-only';
        srHint.id = 'sr-game-instructions';
        srHint.textContent = '使用左右箭头键控制挡板移动，空格键发射球，R键重新开始游戏。';

        if (!document.getElementById('sr-game-instructions')) {
            document.body.appendChild(srHint);
        }

        this.srLiveRegion = document.createElement('div');
        this.srLiveRegion.className = 'sr-only';
        this.srLiveRegion.setAttribute('aria-live', GameConfig.accessibility.ariaLive);
        this.srLiveRegion.setAttribute('aria-atomic', 'true');
        this.srLiveRegion.id = 'sr-live-region';

        if (!document.getElementById('sr-live-region')) {
            document.body.appendChild(this.srLiveRegion);
        }
    }

    announceScreenReaderMessage(message) {
        if (this.srLiveRegion) {
            this.srLiveRegion.textContent = message;

            setTimeout(() => {
                if (this.srLiveRegion && this.srLiveRegion.textContent === message) {
                    this.srLiveRegion.textContent = '';
                }
            }, GameConfig.accessibility.announcementDelay);
        }
    }

    handleKeyDown(e) {
        if (e.target.matches('input, textarea, select')) {
            return;
        }

        switch (e.key) {
            case 'ArrowLeft':
                this.input.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
                this.input.right = true;
                e.preventDefault();
                break;
            case ' ':
            case 'Spacebar':
                if (!this.state.running && !this.state.gameOver) {
                    this.launchBall();
                }
                e.preventDefault();
                break;
            case 'r':
            case 'R':
                this.restart();
                e.preventDefault();
                break;
            case 'p':
            case 'P':
            case 'Escape':
                this.togglePause();
                e.preventDefault();
                break;
            case 'Enter':
                if (this.state.gameOver) {
                    this.restart();
                    e.preventDefault();
                }
                break;
        }
    }

    handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowLeft':
                this.input.left = false;
                break;
            case 'ArrowRight':
                this.input.right = false;
                break;
        }
    }

    handleTouchStart(e) {
        this.input.touchActive = true;
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.input.touchX = (touch.clientX - rect.left) * (this.width / rect.width);
        this.updatePaddleFromTouch();

        if (this.vibrationEnabled && navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    handleTouchMove(e) {
        if (this.input.touchActive) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.input.touchX = (touch.clientX - rect.left) * (this.width / rect.width);
            this.updatePaddleFromTouch();
        }
    }

    handleTouchEnd(e) {
        this.input.touchActive = false;
        this.input.left = false;
        this.input.right = false;
    }

    handleMouseDown(e) {
        this.input.touchActive = true;
        const rect = this.canvas.getBoundingClientRect();
        this.input.touchX = (e.clientX - rect.left) * (this.width / rect.width);
        this.updatePaddleFromTouch();
    }

    handleMouseMove(e) {
        if (this.input.touchActive && e.buttons === 1) {
            const rect = this.canvas.getBoundingClientRect();
            this.input.touchX = (e.clientX - rect.left) * (this.width / rect.width);
            this.updatePaddleFromTouch();
        }
    }

    handleMouseUp() {
        this.input.touchActive = false;
        this.input.left = false;
        this.input.right = false;
    }

    updatePaddleFromTouch() {
        if (this.elements.paddles.length > 0) {
            const paddle = this.elements.paddles[0];
            const targetX = this.input.touchX - paddle.width / 2;

            paddle.position.x += (targetX - paddle.position.x) * 0.3;

            paddle.position.x = Math.max(
                20,
                Math.min(this.width - 20 - paddle.width, paddle.position.x)
            );
        }
    }

    launchBall() {
        if (this.elements.balls.length > 0) {
            const ball = this.elements.balls[0];
            if (!ball.launched) {
                ball.velocity = new Vector2(-5, -15);
                ball.launched = true;
                this.state.running = true;
                this.state.ballsLeft--;

                this.updateUI();

                const overlay = document.getElementById('game-overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }

                this.announceScreenReaderMessage('球已发射！');

                if (this.vibrationEnabled && navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        }
    }

    restart() {
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            try {
                localStorage.setItem('pinball_highscore', this.state.highScore.toString());
            } catch (e) {
                console.warn('无法保存最高分到localStorage:', e);
            }
        }

        this.state = {
            running: false,
            paused: false,
            gameOver: false,
            score: 0,
            highScore: this.state.highScore,
            lives: 3,
            level: 1,
            ballsLeft: 3,
            combo: 0,
            comboMultiplier: 1
        };

        // 清除所有动画效果
        this.animations = {
            scorePops: [],
            particles: [],
            floatingScores: []
        };

        this.resetLevel();
        this.updateUI();

        const overlay = document.getElementById('game-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }

        const statusEl = document.getElementById('game-status');
        const messageEl = document.getElementById('game-message');
        const startBtn = document.getElementById('start-btn');

        if (statusEl) statusEl.textContent = '游戏准备中';
        if (messageEl) messageEl.textContent = '点击开始按钮或按空格键发射球';
        if (startBtn) startBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> 发射球';

        this.announceScreenReaderMessage('游戏已重新开始。当前分数：0，最高分：' + this.state.highScore);
    }

    togglePause() {
        if (!this.state.running || this.state.gameOver) return;

        this.state.paused = !this.state.paused;

        if (this.state.paused) {
            this.announceScreenReaderMessage('游戏已暂停。按P键或ESC键继续。');

            const overlay = document.getElementById('game-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                const statusEl = document.getElementById('game-status');
                const messageEl = document.getElementById('game-message');
                const startBtn = document.getElementById('start-btn');

                if (statusEl) statusEl.textContent = '游戏暂停';
                if (messageEl) messageEl.textContent = '按P键或点击继续按钮继续游戏';
                if (startBtn) startBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> 继续游戏';
            }
        } else {
            this.announceScreenReaderMessage('游戏继续。');

            const overlay = document.getElementById('game-overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
    }

    update() {
        if (!this.state.running || this.state.paused) return;

        // 更新挡板
        const paddle = this.elements.paddles[0];
        if (paddle) {
            if (this.input.left && !this.input.touchActive) {
                paddle.position.x -= paddle.speed;
            }
            if (this.input.right && !this.input.touchActive) {
                paddle.position.x += paddle.speed;
            }

            paddle.position.x = Math.max(
                20,
                Math.min(this.width - 20 - paddle.width, paddle.position.x)
            );

            paddle.update(); // 更新挡板动画
        }

        // 更新反弹器
        this.elements.bumpers.forEach(bumper => bumper.update());

        // 更新球
        for (let index = this.elements.balls.length - 1; index >= 0; index--) {
            const ball = this.elements.balls[index];
            if (!ball.active) continue;

            ball.update();
            ball.limitSpeed();

            const wallThickness = 20;
            const radius = ball.radius;

            // 墙壁碰撞 - 使用真实物理反弹
            if (ball.position.x < wallThickness + radius) {
                ball.bounce(new Vector2(1, 0));
                ball.position.x = wallThickness + radius + 1;
                this.playCollisionSound();
                this.addWallHitParticles(ball.position.x, ball.position.y);
            }

            if (ball.position.x > this.width - wallThickness - radius) {
                ball.bounce(new Vector2(-1, 0));
                ball.position.x = this.width - wallThickness - radius - 1;
                this.playCollisionSound();
                this.addWallHitParticles(ball.position.x, ball.position.y);
            }

            if (ball.position.y < wallThickness + radius) {
                ball.bounce(new Vector2(0, 1));
                ball.position.y = wallThickness + radius + 1;
                this.playCollisionSound();
                this.addWallHitParticles(ball.position.x, ball.position.y);
            }

            // 挡板碰撞 - 增强物理效果
            if (paddle &&
                ball.position.y + radius > paddle.position.y &&
                ball.position.y - radius < paddle.position.y + paddle.height &&
                ball.position.x > paddle.position.x &&
                ball.position.x < paddle.position.x + paddle.width &&
                ball.velocity.y > 0) {

                const relativeIntersectX = (paddle.position.x + (paddle.width / 2)) - ball.position.x;
                const normalizedRelativeIntersectionX = relativeIntersectX / (paddle.width / 2);
                const bounceAngle = normalizedRelativeIntersectionX * (Math.PI / 3.5);

                const speed = Math.min(ball.velocity.magnitude() * 1.1, GameConfig.ballSpeed * 2);
                ball.velocity.x = speed * -Math.sin(bounceAngle);
                ball.velocity.y = -Math.abs(speed * Math.cos(bounceAngle));
                ball.position.y = paddle.position.y - radius - 1;

                // 触发挡板发光效果
                paddle.triggerHitEffect();

                this.playPaddleSound();
                this.state.combo++;
                this.updateComboMultiplier();

                // 添加挡板击球粒子
                this.addPaddleHitParticles(ball.position.x, paddle.position.y);

                if (this.vibrationEnabled && navigator.vibrate) {
                    navigator.vibrate(20);
                }
            }

            // 反弹器碰撞
            for (const bumper of this.elements.bumpers) {
                const dist = ball.position.subtract(bumper.position).magnitude();
                const minDist = radius + bumper.radius;

                if (dist < minDist) {
                    const normal = ball.position.subtract(bumper.position).normalize();

                    const overlap = minDist - dist;
                    ball.position = ball.position.add(normal.multiply(overlap));

                    // 使用真实物理反弹
                    const speed = Math.max(GameConfig.ballSpeed * 1.3, ball.velocity.magnitude() * 1.1);
                    ball.velocity = normal.multiply(speed);

                    const score = bumper.scoreValue * this.state.comboMultiplier;
                    this.state.score += score;

                    // 添加得分飘字动画
                    this.addFloatingScore(ball.position.x, ball.position.y, `+${score}`, '#ffff00');

                    // 触发反弹器动画
                    bumper.triggerHitEffect();

                    // 添加碰撞粒子
                    this.addBumperHitParticles(bumper.position.x, bumper.position.y, bumper.color);

                    this.playBumperSound();

                    if (this.state.comboMultiplier > 1) {
                        this.playScoreBonusSound(this.state.comboMultiplier);
                    }

                    if (this.state.score % 500 === 0) {
                        this.announceScreenReaderMessage(`当前分数${this.state.score}`);
                    }

                    this.updateUI();

                    if (this.vibrationEnabled && navigator.vibrate) {
                        navigator.vibrate(30);
                    }
                }
            }

            // 检查球是否掉落
            if (ball.position.y > this.height + radius) {
                this.elements.balls.splice(index, 1);
                this.handleLifeLost();
            }
        }
    }

    // 添加墙壁碰撞粒子
    addWallHitParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            this.animations.particles.push(new Particle(x, y, 'rgba(255, 255, 255, 0.6)'));
        }
    }

    // 添加挡板击球粒子
    addPaddleHitParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.animations.particles.push(new Particle(x, y, '#4ade80'));
        }
    }

    // 添加反弹器击球粒子
    addBumperHitParticles(x, y, color) {
        for (let i = 0; i < 12; i++) {
            this.animations.particles.push(new Particle(x, y, color));
        }
    }

    // 添加得分飘字动画
    addFloatingScore(x, y, text, color) {
        this.animations.floatingScores.push(new FloatingScore(x, y, text, color));

        // 同时触发 DOM 动画（用于额外的视觉效果）
        if (this.microInteractions) {
            const rect = this.canvas.getBoundingClientRect();
            const screenX = (x / this.width) * rect.width + rect.left;
            const screenY = (y / this.height) * rect.height + rect.top;
            this.microInteractions.addScoreAnimation(screenX, screenY, text, color);
        }
    }

    updateComboMultiplier() {
        if (this.state.combo >= 10) {
            this.state.comboMultiplier = 4;
        } else if (this.state.combo >= 7) {
            this.state.comboMultiplier = 3;
        } else if (this.state.combo >= 4) {
            this.state.comboMultiplier = 2;
        } else {
            this.state.comboMultiplier = 1;
        }
    }

    handleLifeLost() {
        this.state.lives--;
        this.state.combo = 0;
        this.state.comboMultiplier = 1;
        this.updateUI();
        this.state.running = false;

        this.announceScreenReaderMessage(`损失一条生命，剩余生命${this.state.lives}`);

        if (this.vibrationEnabled && navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }

        if (this.state.lives <= 0) {
            this.state.gameOver = true;
            this.playGameOverSound();

            const overlay = document.getElementById('game-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                const statusEl = document.getElementById('game-status');
                const messageEl = document.getElementById('game-message');
                const startBtn = document.getElementById('start-btn');

                if (statusEl) statusEl.textContent = '游戏结束';
                if (messageEl) {
                    messageEl.textContent = `最终分数: ${this.state.score}${this.state.score > this.state.highScore ? ' (新纪录!)' : ''}`;
                }
                if (startBtn) startBtn.innerHTML = '<i class="fas fa-redo" aria-hidden="true"></i> 重新开始';
            }

            if (this.state.score > this.state.highScore) {
                this.state.highScore = this.state.score;
                try {
                    localStorage.setItem('pinball_highscore', this.state.highScore.toString());
                } catch (e) {
                    console.warn('无法保存最高分到localStorage:', e);
                }
                this.announceScreenReaderMessage(`恭喜！创造了新的最高分：${this.state.highScore}`);
            } else {
                this.announceScreenReaderMessage(`游戏结束。最终分数：${this.state.score}，最高分：${this.state.highScore}`);
            }
        } else {
            this.spawnBall();

            const overlay = document.getElementById('game-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                const statusEl = document.getElementById('game-status');
                const messageEl = document.getElementById('game-message');
                const startBtn = document.getElementById('start-btn');

                if (statusEl) statusEl.textContent = '准备发射';
                if (messageEl) messageEl.textContent = `剩余生命: ${this.state.lives}`;
                if (startBtn) startBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> 发射球';
            }
        }
    }

    addScoreAnimation(x, y, text) {
        this.animations.scorePops.push({
            x,
            y,
            text,
            life: 1.0,
            velocity: new Vector2(0, -2)
        });
    }

    updateAnimations() {
        // 更新飘字动画
        for (let i = this.animations.floatingScores.length - 1; i >= 0; i--) {
            const fs = this.animations.floatingScores[i];
            fs.update();
            if (fs.isDead()) {
                this.animations.floatingScores.splice(i, 1);
            }
        }

        // 更新粒子
        for (let i = this.animations.particles.length - 1; i >= 0; i--) {
            const p = this.animations.particles[i];
            p.update();
            if (p.isDead()) {
                this.animations.particles.splice(i, 1);
            }
        }

        // 更新得分动画
        for (let i = this.animations.scorePops.length - 1; i >= 0; i--) {
            const pop = this.animations.scorePops[i];
            pop.life -= 0.02;
            pop.y += pop.velocity.y;

            if (pop.life <= 0) {
                this.animations.scorePops.splice(i, 1);
            }
        }
    }

    drawAnimations() {
        // 绘制飘字动画
        this.animations.floatingScores.forEach(fs => fs.draw(this.ctx));

        // 绘制粒子
        this.animations.particles.forEach(p => p.draw(this.ctx));

        // 绘制得分动画
        this.animations.scorePops.forEach(pop => {
            this.ctx.save();
            this.ctx.globalAlpha = pop.life;
            this.ctx.font = `bold ${16 + (1 - pop.life) * 8}px 'Orbitron', monospace`;
            this.ctx.fillStyle = '#ffff00';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(pop.text, pop.x, pop.y);
            this.ctx.restore();
        });
    }

    updateUI() {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            const newScore = this.state.score.toString();
            if (scoreElement.textContent !== newScore) {
                scoreElement.textContent = newScore;
                scoreElement.classList.remove('score-pop');
                void scoreElement.offsetWidth;
                scoreElement.classList.add('score-pop');
            }
        }

        const highScoreElement = document.getElementById('high-score');
        if (highScoreElement) {
            highScoreElement.textContent = this.state.highScore.toString();
        }

        const livesElement = document.getElementById('lives');
        if (livesElement) {
            const heartIcons = '<i class="fas fa-heart" aria-hidden="true"></i>'.repeat(Math.max(0, this.state.lives));
            livesElement.innerHTML = heartIcons || '<span style="color: #94a3b8;">无</span>';
            livesElement.setAttribute('aria-label', `剩余生命：${this.state.lives}`);
        }

        const ballsLeftElement = document.getElementById('balls-left');
        if (ballsLeftElement) {
            ballsLeftElement.textContent = Math.max(0, this.state.ballsLeft).toString();
            ballsLeftElement.setAttribute('aria-label', `剩余球数：${this.state.ballsLeft}`);
        }

        const levelElement = document.getElementById('level');
        if (levelElement) {
            levelElement.textContent = this.state.level.toString();
            levelElement.setAttribute('aria-label', `当前关卡：${this.state.level}`);
        }

        this.updateComboDisplay();
    }

    updateComboDisplay() {
        let comboElement = document.getElementById('combo');
        if (!comboElement) {
            const gameInfoPanel = document.querySelector('.game-info-panel');
            if (gameInfoPanel) {
                const comboDisplay = document.createElement('div');
                comboDisplay.className = 'combo-display';
                comboDisplay.id = 'combo';
                comboDisplay.setAttribute('role', 'status');
                comboDisplay.setAttribute('aria-live', 'polite');
                comboDisplay.innerHTML = `
                    <div class="info-title">连击</div>
                    <div class="combo-value" aria-label="当前连击：${this.state.combo}，倍率：x${this.state.comboMultiplier}">
                        ${this.state.combo}<span class="multiplier">x${this.state.comboMultiplier}</span>
                    </div>
                `;
                gameInfoPanel.appendChild(comboDisplay);
                comboElement = comboDisplay;
            }
        }

        if (comboElement) {
            const comboValue = comboElement.querySelector('.combo-value');
            if (comboValue) {
                comboValue.innerHTML = `
                    ${this.state.combo}<span class="multiplier">x${this.state.comboMultiplier}</span>
                `;
                comboValue.setAttribute('aria-label', `当前连击：${this.state.combo}，倍率：x${this.state.comboMultiplier}`);
            }
        }
    }

    playCollisionSound() {
        if (this.soundEnabled && this.soundManager) {
            this.soundManager.playWallHit();
        }
    }

    playPaddleSound() {
        if (this.soundEnabled && this.soundManager) {
            this.soundManager.playPaddleHit();

            if (this.microInteractions) {
                const paddle = this.elements.paddles[0];
                if (paddle) {
                    const rect = this.canvas.getBoundingClientRect();
                    const x = (paddle.position.x / this.width) * rect.width + rect.left;
                    const y = (paddle.position.y / this.height) * rect.height + rect.top;
                    this.microInteractions.createParticles(x, y, 6, '#4ade80');
                }
            }
        }
    }

    playBumperSound() {
        if (this.soundEnabled && this.soundManager) {
            this.soundManager.playBumperHit();
        }
    }

    playScoreBonusSound(multiplier) {
        if (this.soundEnabled && this.soundManager) {
            this.soundManager.playScoreBonus(multiplier);
        }
    }

    playGameOverSound() {
        if (this.soundEnabled && this.soundManager) {
            this.soundManager.playGameOver();
        }
    }

    playLevelCompleteSound() {
        if (this.soundEnabled && this.soundManager) {
            this.soundManager.playLevelComplete();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.drawImage(this.bgCanvas, 0, 0, this.width, this.height);

        // 绘制墙壁
        this.elements.walls.forEach(w => {
            this.ctx.fillStyle = w.color;
            this.ctx.fillRect(w.x, w.y, w.w, w.h);

            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(w.x, w.y, w.w, w.h);
        });

        // 绘制反弹器
        this.elements.bumpers.forEach(b => b.draw(this.ctx));

        // 绘制挡板
        const p = this.elements.paddles[0];
        if (p) {
            p.draw(this.ctx);
        }

        // 绘制球
        this.elements.balls.forEach(b => b.draw(this.ctx));

        // 绘制动画
        this.drawAnimations();

        // 绘制连击指示器
        if (this.state.combo > 1) {
            this.drawComboIndicator();
        }
    }

    drawComboIndicator() {
        const centerX = this.width / 2;
        const centerY = 40;

        this.ctx.save();
        this.ctx.globalAlpha = 0.8;

        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);

        const comboGradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 30
        );

        if (this.state.comboMultiplier === 4) {
            comboGradient.addColorStop(0, '#ffffff');
            comboGradient.addColorStop(0.5, '#fbbf24');
            comboGradient.addColorStop(1, '#d97706');
        } else if (this.state.comboMultiplier === 3) {
            comboGradient.addColorStop(0, '#ffffff');
            comboGradient.addColorStop(0.5, '#f87171');
            comboGradient.addColorStop(1, '#dc2626');
        } else {
            comboGradient.addColorStop(0, '#ffffff');
            comboGradient.addColorStop(0.5, '#60a5fa');
            comboGradient.addColorStop(1, '#2563eb');
        }

        this.ctx.fillStyle = comboGradient;
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.font = 'bold 24px "Orbitron", monospace, sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.state.combo.toString(), centerX, centerY);

        this.ctx.font = 'bold 12px "Orbitron", monospace, sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText(`x${this.state.comboMultiplier}`, centerX, centerY + 25);

        this.ctx.restore();
    }

    loop(timestamp) {
        const elapsed = timestamp - this.lastFrameTime;

        if (elapsed > this.frameInterval) {
            this.lastFrameTime = timestamp - (elapsed % this.frameInterval);

            this.update();
            this.updateAnimations();
            this.draw();
        }

        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        if (this.handlers.keyDown) {
            document.removeEventListener('keydown', this.handlers.keyDown);
        }
        if (this.handlers.keyUp) {
            document.removeEventListener('keyup', this.handlers.keyUp);
        }
        if (this.handlers.blur) {
            window.removeEventListener('blur', this.handlers.blur);
        }
        if (this.handlers.visibilityChange) {
            document.removeEventListener('visibilitychange', this.handlers.visibilityChange);
        }

        if (this.handlers.touchStart) {
            this.canvas.removeEventListener('touchstart', this.handlers.touchStart);
        }
        if (this.handlers.touchMove) {
            this.canvas.removeEventListener('touchmove', this.handlers.touchMove);
        }
        if (this.handlers.touchEnd) {
            this.canvas.removeEventListener('touchend', this.handlers.touchEnd);
        }
        if (this.handlers.mouseDown) {
            this.canvas.removeEventListener('mousedown', this.handlers.mouseDown);
        }
        if (this.handlers.mouseMove) {
            this.canvas.removeEventListener('mousemove', this.handlers.mouseMove);
        }
        if (this.handlers.mouseUp) {
            this.canvas.removeEventListener('mouseup', this.handlers.mouseUp);
        }
        this.canvas.removeEventListener('mouseleave', this.handlers.mouseUp);

        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');

        if (startBtn && this.handlers.startBtn) {
            startBtn.removeEventListener('click', this.handlers.startBtn);
        }
        if (restartBtn && this.handlers.restartBtn) {
            restartBtn.removeEventListener('click', this.handlers.restartBtn);
        }

        clearTimeout(this.resizeTimeout);
    }
}

function initGame() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas || !canvas.getContext) {
        console.error('您的浏览器不支持Canvas。请使用现代浏览器如Chrome、Firefox或Edge。');
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;color:#fff;padding:20px;border-radius:12px;text-align:center;';
        errorMsg.textContent = '您的浏览器不支持Canvas。请使用现代浏览器如Chrome、Firefox或Edge。';
        document.body.appendChild(errorMsg);
        return;
    }

    window.enhancedGame = new EnhancedPinballGame();

    if ('ontouchstart' in window) {
        console.log('触摸设备检测到 - 启用手势控制');
    }

    console.log('键盘控制：←→ 箭头键移动挡板，空格键发射球，R键重新开始，P键暂停');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedPinballGame, Vector2, GameConfig };
}
