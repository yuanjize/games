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
}

const GameConfig = {
    gravity: 0.2,
    friction: 0.98,
    elasticity: 0.8,
    ballRadius: 10,
    ballSpeed: 8,
    paddleSpeed: 15,
    maxBallSpeed: 20,

    colors: {
        ball: '#4285f4',
        paddle: '#34a853',
        bumper: '#ea4335',
        target: '#fbbc05',
        ramp: '#b3b3ff',
        wall: '#2d3748',
        trail: 'rgba(66, 133, 244, 0.3)'
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
    }

    draw(ctx) {
        if (!this.active) return;

        // 绘制轨迹
        if (this.trail.length > 1) {
            ctx.beginPath();
            this.trail.forEach((p, i) => {
                if (i === 0) ctx.moveTo(p.x, p.y);
                else ctx.lineTo(p.x, p.y);
            });
            ctx.strokeStyle = GameConfig.colors.trail;
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // 更新轨迹
        this.trail.push({x: this.position.x, y: this.position.y});
        if (this.trail.length > 15) this.trail.shift();

        // 绘制球体
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);

        // 创建渐变填充
        const gradient = ctx.createRadialGradient(
            this.position.x - this.radius/2, this.position.y - this.radius/2, 1,
            this.position.x, this.position.y, this.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, GameConfig.colors.ball);
        gradient.addColorStop(1, '#0d47a1');

        ctx.fillStyle = gradient;
        ctx.fill();

        // 绘制边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    limitSpeed() {
        const speed = this.velocity.magnitude();
        if (speed > GameConfig.maxBallSpeed) {
            this.velocity = this.velocity.normalize().multiply(GameConfig.maxBallSpeed);
        }
        // 确保最小速度以避免球卡住
        if (speed < 2 && this.launched) {
            this.velocity = this.velocity.normalize().multiply(2);
        }
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

        this.animations = {
            scorePops: [],
            particleEffects: []
        };

        this.soundEnabled = false;
        this.vibrationEnabled = false;
        this.animationFrameId = null;
        this.lastFrameTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => {
            // 使用防抖处理resize
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

        // 设置实际画布大小（考虑设备像素比）
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        // 设置CSS显示大小
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        // 缩放上下文以匹配设备像素比
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

        // 创建背景渐变
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0a1a');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#1e293b');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 绘制网格（仅在大屏幕上）
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

        // 绘制装饰性元素
        this.drawBackgroundElements();
    }

    drawBackgroundElements() {
        const ctx = this.bgCtx;
        const w = this.width;
        const h = this.height;

        // 绘制星星效果
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
        this.elements.paddles = [{
            position: new Vector2(this.width / 2 - 60, this.height - 50),
            width: 120,
            height: 20,
            speed: GameConfig.paddleSpeed,
            color: GameConfig.colors.paddle,
            type: 'paddle'
        }];

        this.elements.bumpers = [
            this.createBumper(this.width * 0.3, this.height * 0.3, 25),
            this.createBumper(this.width * 0.7, this.height * 0.3, 25),
            this.createBumper(this.width * 0.5, this.height * 0.5, 30)
        ];

        this.spawnBall();
    }

    createBumper(x, y, radius) {
        const bumper = new Circle(x, y, radius);
        bumper.color = GameConfig.colors.bumper;
        bumper.type = 'bumper';
        bumper.scoreValue = GameConfig.scores.bumper;
        return bumper;
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
        // 键盘事件
        this.keyDownHandler = (e) => this.handleKeyDown(e);
        this.keyUpHandler = (e) => this.handleKeyUp(e);

        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);

        // 按钮事件
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');

        if (startBtn) {
            this.startBtnHandler = () => {
                if (this.state.gameOver) {
                    this.restart();
                } else {
                    this.launchBall();
                }
            };

            startBtn.addEventListener('click', this.startBtnHandler);

            startBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.startBtnHandler();
                }
            });
        }

        if (restartBtn) {
            this.restartBtnHandler = () => this.restart();

            restartBtn.addEventListener('click', this.restartBtnHandler);

            restartBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.restartBtnHandler();
                }
            });
        }

        // 窗口失焦事件
        this.blurHandler = () => {
            if (this.state.running && !this.state.paused) {
                this.togglePause();
            }
        };
        window.addEventListener('blur', this.blurHandler);

        // 页面可见性变化
        this.visibilityHandler = () => {
            if (document.hidden && this.state.running && !this.state.paused) {
                this.togglePause();
            }
        };
        document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    bindTouchEvents() {
        // 触摸事件支持
        this.touchStartHandler = (e) => {
            e.preventDefault();
            this.handleTouchStart(e);
        };

        this.touchMoveHandler = (e) => {
            e.preventDefault();
            this.handleTouchMove(e);
        };

        this.touchEndHandler = (e) => {
            e.preventDefault();
            this.handleTouchEnd(e);
        };

        this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
        this.canvas.addEventListener('touchmove', this.touchMoveHandler, { passive: false });
        this.canvas.addEventListener('touchend', this.touchEndHandler, { passive: false });

        // 鼠标事件（用于桌面触摸模拟）
        this.mouseDownHandler = (e) => {
            this.handleMouseDown(e);
        };

        this.mouseMoveHandler = (e) => {
            this.handleMouseMove(e);
        };

        this.mouseUpHandler = () => {
            this.handleMouseUp();
        };

        this.canvas.addEventListener('mousedown', this.mouseDownHandler);
        this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.addEventListener('mouseup', this.mouseUpHandler);
        this.canvas.addEventListener('mouseleave', this.mouseUpHandler);
    }

    setupAccessibility() {
        // 设置ARIA属性
        this.canvas.setAttribute('role', 'application');
        this.canvas.setAttribute('aria-label', '物理弹球游戏画布');
        this.canvas.setAttribute('tabindex', '0');

        // 创建屏幕阅读器提示
        const srHint = document.createElement('div');
        srHint.className = 'sr-only';
        srHint.id = 'sr-game-instructions';
        srHint.textContent = '使用左右箭头键控制挡板移动，空格键发射球，R键重新开始游戏。';

        if (!document.getElementById('sr-game-instructions')) {
            document.body.appendChild(srHint);
        }

        // 创建屏幕阅读器实时区域
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

            // 清除消息以便后续更新
            setTimeout(() => {
                if (this.srLiveRegion && this.srLiveRegion.textContent === message) {
                    this.srLiveRegion.textContent = '';
                }
            }, GameConfig.accessibility.announcementDelay);
        }
    }

    handleKeyDown(e) {
        // 忽略在输入框中的按键
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
                // 在游戏结束时按回车重新开始
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

        // 触觉反馈
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

            // 平滑移动
            paddle.position.x += (targetX - paddle.position.x) * 0.3;

            // 限制边界
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

                // 更新UI
                this.updateUI();

                // 隐藏覆盖层
                const overlay = document.getElementById('game-overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }

                // 屏幕阅读器提示
                this.announceScreenReaderMessage('球已发射！');

                // 振动反馈（如果可用）
                if (this.vibrationEnabled && navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }
        }
    }

    restart() {
        // 保存最高分
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            try {
                localStorage.setItem('pinball_highscore', this.state.highScore.toString());
            } catch (e) {
                console.warn('无法保存最高分到localStorage:', e);
            }
        }

        // 重置游戏状态
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
        if (startBtn) startBtn.textContent = '发射球';

        this.announceScreenReaderMessage('游戏已重新开始。当前分数：0，最高分：' + this.state.highScore);
    }

    togglePause() {
        if (!this.state.running || this.state.gameOver) return;

        this.state.paused = !this.state.paused;

        if (this.state.paused) {
            this.announceScreenReaderMessage('游戏已暂停。按P键或ESC键继续。');

            // 显示暂停提示
            const overlay = document.getElementById('game-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                const statusEl = document.getElementById('game-status');
                const messageEl = document.getElementById('game-message');
                const startBtn = document.getElementById('start-btn');

                if (statusEl) statusEl.textContent = '游戏暂停';
                if (messageEl) messageEl.textContent = '按P键或点击继续按钮继续游戏';
                if (startBtn) startBtn.textContent = '继续游戏';
            }
        } else {
            this.announceScreenReaderMessage('游戏继续。');

            // 隐藏覆盖层
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

            // 边界限制
            paddle.position.x = Math.max(
                20,
                Math.min(this.width - 20 - paddle.width, paddle.position.x)
            );
        }

        // 更新球
        for (let index = this.elements.balls.length - 1; index >= 0; index--) {
            const ball = this.elements.balls[index];
            if (!ball.active) continue;

            ball.update();
            ball.limitSpeed();

            const wallThickness = 20;
            const radius = ball.radius;

            // 墙壁碰撞 - 左墙
            if (ball.position.x < wallThickness + radius) {
                ball.velocity.x *= -GameConfig.elasticity;
                ball.position.x = wallThickness + radius + 1;
                this.playCollisionSound();
            }

            // 墙壁碰撞 - 右墙
            if (ball.position.x > this.width - wallThickness - radius) {
                ball.velocity.x *= -GameConfig.elasticity;
                ball.position.x = this.width - wallThickness - radius - 1;
                this.playCollisionSound();
            }

            // 墙壁碰撞 - 顶墙
            if (ball.position.y < wallThickness + radius) {
                ball.velocity.y *= -GameConfig.elasticity;
                ball.position.y = wallThickness + radius + 1;
                this.playCollisionSound();
            }

            // 挡板碰撞
            if (paddle &&
                ball.position.y + radius > paddle.position.y &&
                ball.position.y - radius < paddle.position.y + paddle.height &&
                ball.position.x > paddle.position.x &&
                ball.position.x < paddle.position.x + paddle.width &&
                ball.velocity.y > 0) {

                const relativeIntersectX = (paddle.position.x + (paddle.width / 2)) - ball.position.x;
                const normalizedRelativeIntersectionX = relativeIntersectX / (paddle.width / 2);
                const bounceAngle = normalizedRelativeIntersectionX * (Math.PI / 3);

                const speed = Math.min(ball.velocity.magnitude(), GameConfig.ballSpeed * 2);
                ball.velocity.x = speed * -Math.sin(bounceAngle);
                ball.velocity.y = -Math.abs(speed * Math.cos(bounceAngle));
                ball.position.y = paddle.position.y - radius - 1;

                this.playPaddleSound();
                this.state.combo++;
                this.updateComboMultiplier();

                // 触觉反馈
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

                    // 将球推出反弹器，防止卡住
                    const overlap = minDist - dist;
                    ball.position = ball.position.add(normal.multiply(overlap));

                    const speed = Math.max(GameConfig.ballSpeed * 1.2, ball.velocity.magnitude());
                    ball.velocity = normal.multiply(speed);

                    const score = bumper.scoreValue * this.state.comboMultiplier;
                    this.state.score += score;

                    this.addScoreAnimation(ball.position.x, ball.position.y, `+${score}`);
                    this.playBumperSound();

                    // 屏幕阅读器提示（节流，避免过于频繁）
                    if (this.state.score % 500 === 0) {
                        this.announceScreenReaderMessage(`当前分数${this.state.score}`);
                    }

                    this.updateUI();

                    // 触觉反馈
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

        // 触觉反馈
        if (this.vibrationEnabled && navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }

        if (this.state.lives <= 0) {
            this.state.gameOver = true;

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
                if (startBtn) startBtn.textContent = '重新开始';
            }

            // 检查并更新最高分
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

            // 显示覆盖层
            const overlay = document.getElementById('game-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
                const statusEl = document.getElementById('game-status');
                const messageEl = document.getElementById('game-message');
                const startBtn = document.getElementById('start-btn');

                if (statusEl) statusEl.textContent = '准备发射';
                if (messageEl) messageEl.textContent = `剩余生命: ${this.state.lives}`;
                if (startBtn) startBtn.textContent = '发射球';
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
        // 更新分数显示
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            const newScore = this.state.score.toString();
            if (scoreElement.textContent !== newScore) {
                scoreElement.textContent = newScore;
                // 添加分数变化动画
                scoreElement.classList.remove('score-pop');
                void scoreElement.offsetWidth; // 触发重排
                scoreElement.classList.add('score-pop');
            }
        }

        // 更新最高分显示
        const highScoreElement = document.getElementById('high-score');
        if (highScoreElement) {
            highScoreElement.textContent = this.state.highScore.toString();
        }

        // 更新生命显示
        const livesElement = document.getElementById('lives');
        if (livesElement) {
            const heartIcons = '<i class="fas fa-heart" aria-hidden="true"></i>'.repeat(Math.max(0, this.state.lives));
            livesElement.innerHTML = heartIcons || '<span style="color: #94a3b8;">无</span>';
            livesElement.setAttribute('aria-label', `剩余生命：${this.state.lives}`);
        }

        // 更新剩余球数
        const ballsLeftElement = document.getElementById('balls-left');
        if (ballsLeftElement) {
            ballsLeftElement.textContent = Math.max(0, this.state.ballsLeft).toString();
            ballsLeftElement.setAttribute('aria-label', `剩余球数：${this.state.ballsLeft}`);
        }

        // 更新关卡显示
        const levelElement = document.getElementById('level');
        if (levelElement) {
            levelElement.textContent = this.state.level.toString();
            levelElement.setAttribute('aria-label', `当前关卡：${this.state.level}`);
        }

        // 更新连击显示
        this.updateComboDisplay();
    }

    updateComboDisplay() {
        let comboElement = document.getElementById('combo');
        if (!comboElement) {
            // 如果不存在，添加到游戏信息面板
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
        if (this.soundEnabled) {
            // 声音效果可以在未来实现
            // playSound('collision');
        }
    }

    playPaddleSound() {
        if (this.soundEnabled) {
            // 声音效果可以在未来实现
            // playSound('paddle');
        }
    }

    playBumperSound() {
        if (this.soundEnabled) {
            // 声音效果可以在未来实现
            // playSound('bumper');
        }
    }

    draw() {
        // 清除画布
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 绘制背景
        this.ctx.drawImage(this.bgCanvas, 0, 0, this.width, this.height);

        // 绘制墙壁
        this.elements.walls.forEach(w => {
            this.ctx.fillStyle = w.color;
            this.ctx.fillRect(w.x, w.y, w.w, w.h);

            // 添加边框效果
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(w.x, w.y, w.w, w.h);
        });

        // 绘制挡板
        const p = this.elements.paddles[0];
        if (p) {
            // 挡板渐变效果
            const paddleGradient = this.ctx.createLinearGradient(
                p.position.x, p.position.y,
                p.position.x, p.position.y + p.height
            );
            paddleGradient.addColorStop(0, '#4ade80');
            paddleGradient.addColorStop(1, '#22c55e');
            this.ctx.fillStyle = paddleGradient;
            this.ctx.fillRect(p.position.x, p.position.y, p.width, p.height);

            // 挡板边框
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(p.position.x, p.position.y, p.width, p.height);
        }

        // 绘制反弹器
        this.elements.bumpers.forEach(b => {
            this.ctx.beginPath();
            this.ctx.arc(b.position.x, b.position.y, b.radius, 0, Math.PI * 2);

            // 反弹器渐变
            const bumperGradient = this.ctx.createRadialGradient(
                b.position.x, b.position.y, 0,
                b.position.x, b.position.y, b.radius
            );
            bumperGradient.addColorStop(0, '#ffffff');
            bumperGradient.addColorStop(0.7, b.color);
            bumperGradient.addColorStop(1, '#b91c1c');

            this.ctx.fillStyle = bumperGradient;
            this.ctx.fill();

            // 反弹器边框
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        });

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

        // 绘制背景圆
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

        // 绘制连击数字
        this.ctx.font = 'bold 24px "Orbitron", monospace, sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.state.combo.toString(), centerX, centerY);

        // 绘制倍率
        this.ctx.font = 'bold 12px "Orbitron", monospace, sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillText(`x${this.state.comboMultiplier}`, centerX, centerY + 25);

        this.ctx.restore();
    }

    loop(timestamp) {
        // 帧率控制
        const elapsed = timestamp - this.lastFrameTime;

        if (elapsed > this.frameInterval) {
            this.lastFrameTime = timestamp - (elapsed % this.frameInterval);

            this.update();
            this.updateAnimations();
            this.draw();
        }

        this.animationFrameId = requestAnimationFrame(this.loop);
    }

    // 清理资源
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // 移除事件监听器
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
        window.removeEventListener('blur', this.blurHandler);
        document.removeEventListener('visibilitychange', this.visibilityHandler);

        this.canvas.removeEventListener('touchstart', this.touchStartHandler);
        this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
        this.canvas.removeEventListener('touchend', this.touchEndHandler);
        this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
        this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
        this.canvas.removeEventListener('mouseleave', this.mouseUpHandler);

        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');

        if (startBtn && this.startBtnHandler) {
            startBtn.removeEventListener('click', this.startBtnHandler);
        }
        if (restartBtn && this.restartBtnHandler) {
            restartBtn.removeEventListener('click', this.restartBtnHandler);
        }

        clearTimeout(this.resizeTimeout);
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    // 检查浏览器兼容性
    const canvas = document.getElementById('game-canvas');
    if (!canvas || !canvas.getContext) {
        console.error('您的浏览器不支持Canvas。请使用现代浏览器如Chrome、Firefox或Edge。');
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;color:#fff;padding:20px;border-radius:12px;text-align:center;';
        errorMsg.textContent = '您的浏览器不支持Canvas。请使用现代浏览器如Chrome、Firefox或Edge。';
        document.body.appendChild(errorMsg);
        return;
    }

    // 创建游戏实例
    window.enhancedGame = new EnhancedPinballGame();

    // 添加触摸提示
    if ('ontouchstart' in window) {
        console.log('触摸设备检测到 - 启用手势控制');
    }

    // 添加键盘导航说明
    console.log('键盘控制：←→ 箭头键移动挡板，空格键发射球，R键重新开始，P键暂停');
});

// 导出游戏类供测试使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedPinballGame, Vector2, GameConfig };
}
