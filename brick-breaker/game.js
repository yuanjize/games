/**
 * 经典打砖块游戏
 * 使用原生JavaScript实现
 * 第1轮视觉优化: 增强粒子效果、道具动画、挡板反馈、球体拖尾
 */

// 游戏配置
const CONFIG = {
    baseCanvasWidth: 800,
    baseCanvasHeight: 600,
    paddleWidth: 100,
    paddleHeight: 15,
    paddleSpeed: 8,
    ballRadius: 8,
    ballSpeed: 5,
    ballSpeedMin: 3,    // 球速下限
    ballSpeedMax: 15,   // 球速上限
    brickRows: 6,
    brickColumns: 10,
    brickWidth: 70,
    brickHeight: 25,
    brickPadding: 5,
    brickOffsetTop: 50,
    brickOffsetLeft: 30,
    maxLives: 3,
    levelBonus: 1000,
    powerupDuration: 10000,  // 道具持续时间 (毫秒)
    levelSpeedIncrease: 0.1, // 每关球速增加 10%
    // 新增视觉效果配置
    particleCount: 30,       // 砖块破碎粒子数量
    trailLength: 10,         // 球体拖尾长度
    paddleFlashDuration: 10  // 挡板闪烁持续帧数
};

// 游戏状态
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over',
    LEVEL_COMPLETE: 'level_complete'
};

// 砖块类型
const BrickType = {
    NORMAL: 'normal',    // 普通砖块 - 一击即碎
    STRONG: 'strong',    // 坚固砖块 - 需要多次击中
    SPECIAL: 'special'   // 特殊砖块 - 掉落道具
};

// 道具类型
const PowerupType = {
    PADDLE_LONG: 'paddle_long',    // 加长挡板
    PADDLE_SHORT: 'paddle_short',  // 缩短挡板
    BALL_FAST: 'ball_fast',        // 快速球
    BALL_SLOW: 'ball_slow',        // 慢速球
    MULTI_BALL: 'multi_ball'       // 多球
};

// 游戏对象
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = GameState.MENU;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('brickBreakerHighScore')) || 0;
        this.lives = CONFIG.maxLives;
        this.level = 1;
        this.particles = [];
        this.powerups = [];
        this.balls = [];
        this.animationId = null;
        this.activePowerups = [];  // 活跃的道具效果计时器

        // 新增视觉效果状态
        this.ballTrails = [];      // 球体拖尾记录
        this.paddleFlash = 0;      // 挡板闪烁计时器
        this.paddleFlashColor = null; // 挡板闪烁颜色

        // 动态尺寸相关
        this.canvasWidth = CONFIG.baseCanvasWidth;
        this.canvasHeight = CONFIG.baseCanvasHeight;
        this.scaleX = 1;
        this.scaleY = 1;

        this.init();
        this.bindEvents();
        this.updateUI();
    }

    init() {
        // 初始化游戏对象
        this.paddle = {
            x: (this.canvasWidth - CONFIG.paddleWidth) / 2,
            y: this.canvasHeight - CONFIG.paddleHeight - 10,
            width: CONFIG.paddleWidth,
            baseWidth: CONFIG.paddleWidth,  // 记录基础宽度
            height: CONFIG.paddleHeight,
            speed: CONFIG.paddleSpeed,
            color: '#3498db',
            originalColor: '#3498db' // 记录原始颜色
        };

        // 初始化球
        this.resetBall();
        // 初始化拖尾
        this.ballTrails = [];

        // 初始化砖块
        this.initBricks();

        // 设置Canvas尺寸
        this.resizeCanvas();

        // 设置Canvas为可聚焦
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.focus();

        // 开始游戏循环
        this.gameLoop();
    }

    resetBall() {
        this.balls = [{
            x: this.canvasWidth / 2,
            y: this.canvasHeight - 50,
            radius: CONFIG.ballRadius,
            dx: 0, // 初始状态球不动
            dy: 0,
            color: '#e74c3c',
            speed: this.getBallSpeedForLevel(),
            launched: false // 球是否已发射
        }];
        // 清空拖尾记录
        this.ballTrails = [];
    }

    // 获取当前关卡球速
    getBallSpeedForLevel() {
        return Math.min(CONFIG.ballSpeed * (1 + (this.level - 1) * CONFIG.levelSpeedIncrease), CONFIG.ballSpeedMax);
    }

    launchBall() {
        if (this.balls.length > 0 && !this.balls[0].launched) {
            const ball = this.balls[0];
            const angle = (Math.random() * 60 + 60) * Math.PI / 180; // 60-120度，向上
            ball.dx = Math.cos(angle) * ball.speed;
            ball.dy = -Math.sin(angle) * ball.speed;
            ball.launched = true;
        }
    }

    initBricks() {
        this.bricks = [];

        for (let r = 0; r < CONFIG.brickRows; r++) {
            for (let c = 0; c < CONFIG.brickColumns; c++) {
                // 随机分配砖块类型
                const rand = Math.random();
                let type = BrickType.NORMAL;

                if (rand < 0.1) {
                    type = BrickType.SPECIAL; // 10%特殊砖块
                } else if (rand < 0.3) {
                    type = BrickType.STRONG;  // 20%坚固砖块
                }
                // 70%普通砖块

                const brick = {
                    x: c * (CONFIG.brickWidth + CONFIG.brickPadding) + CONFIG.brickOffsetLeft,
                    y: r * (CONFIG.brickHeight + CONFIG.brickPadding) + CONFIG.brickOffsetTop,
                    width: CONFIG.brickWidth,
                    height: CONFIG.brickHeight,
                    type: type,
                    hits: type === BrickType.STRONG ? 2 : 1,
                    maxHits: type === BrickType.STRONG ? 2 : 1,
                    visible: true,
                    color: this.getBrickColor(type),
                    borderColor: '#2c3e50'
                };

                this.bricks.push(brick);
            }
        }
    }

    getBrickColor(type) {
        switch (type) {
            case BrickType.NORMAL: return '#3498db';
            case BrickType.STRONG: return '#f39c12';
            case BrickType.SPECIAL: return '#9b59b6';
            default: return '#3498db';
        }
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight || (containerWidth * 0.75);

        // 计算新的Canvas尺寸
        const aspectRatio = CONFIG.baseCanvasWidth / CONFIG.baseCanvasHeight;
        let newWidth = containerWidth;
        let newHeight = newWidth / aspectRatio;

        // 如果高度超过容器高度，以高度为准
        if (newHeight > containerHeight) {
            newHeight = containerHeight;
            newWidth = newHeight * aspectRatio;
        }

        // 设置Canvas的实际渲染尺寸
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        this.canvasWidth = newWidth;
        this.canvasHeight = newHeight;

        // 计算缩放比例
        this.scaleX = this.canvasWidth / CONFIG.baseCanvasWidth;
        this.scaleY = this.canvasHeight / CONFIG.baseCanvasHeight;

        // 应用缩放比例到挡板位置
        if (this.paddle) {
            const oldX = this.paddle.x / (this.scaleX || 1);
            const oldY = this.paddle.y / (this.scaleY || 1);
            this.paddle.x = oldX * this.scaleX;
            this.paddle.y = this.canvasHeight - CONFIG.paddleHeight * this.scaleY - 10 * this.scaleY;
            this.paddle.width = CONFIG.paddleWidth * this.scaleX;
            this.paddle.height = CONFIG.paddleHeight * this.scaleY;
        }

        // 更新砖块位置和尺寸
        if (this.bricks) {
            this.bricks.forEach(brick => {
                brick.x = brick.x / CONFIG.baseCanvasWidth * this.canvasWidth;
                brick.y = brick.y / CONFIG.baseCanvasHeight * this.canvasHeight;
                brick.width = CONFIG.brickWidth * this.scaleX;
                brick.height = CONFIG.brickHeight * this.scaleY;
            });
        }

        // 更新球的位置和大小
        if (this.balls) {
            this.balls.forEach(ball => {
                ball.x = ball.x / CONFIG.baseCanvasWidth * this.canvasWidth;
                ball.y = ball.y / CONFIG.baseCanvasHeight * this.canvasHeight;
                ball.radius = CONFIG.ballRadius * Math.min(this.scaleX, this.scaleY);
            });
        }
    }

    bindEvents() {
        // 鼠标移动事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;

            this.paddle.x = mouseX - this.paddle.width / 2;

            // 限制挡板在画布内
            if (this.paddle.x < 0) this.paddle.x = 0;
            if (this.paddle.x + this.paddle.width > this.canvasWidth) {
                this.paddle.x = this.canvasWidth - this.paddle.width;
            }

            // 如果球还没发射，球跟着挡板移动
            if (this.balls.length > 0 && !this.balls[0].launched) {
                this.balls[0].x = this.paddle.x + this.paddle.width / 2;
            }
        });

        // 触摸事件
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;

            this.paddle.x = touchX - this.paddle.width / 2;

            // 限制挡板在画布内
            if (this.paddle.x < 0) this.paddle.x = 0;
            if (this.paddle.x + this.paddle.width > this.canvasWidth) {
                this.paddle.x = this.canvasWidth - this.paddle.width;
            }

            // 如果球还没发射，球跟着挡板移动
            if (this.balls.length > 0 && !this.balls[0].launched) {
                this.balls[0].x = this.paddle.x + this.paddle.width / 2;
            }
        }, { passive: false });

        // 点击Canvas发射球
        this.canvas.addEventListener('click', () => {
            if (this.state === GameState.PLAYING && this.balls.length > 0 && !this.balls[0].launched) {
                this.launchBall();
            }
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    if (this.state === GameState.PLAYING) {
                        if (this.balls.length > 0 && !this.balls[0].launched) {
                            this.launchBall();
                        } else {
                            this.pauseGame();
                        }
                    } else if (this.state === GameState.PAUSED) {
                        this.resumeGame();
                    } else if (this.state === GameState.MENU) {
                        this.startGame();
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.paddle.x -= this.paddle.speed * this.scaleX;
                    if (this.paddle.x < 0) this.paddle.x = 0;
                    // 如果球还没发射，球跟着挡板移动
                    if (this.balls.length > 0 && !this.balls[0].launched) {
                        this.balls[0].x = this.paddle.x + this.paddle.width / 2;
                    }
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.paddle.x += this.paddle.speed * this.scaleX;
                    if (this.paddle.x + this.paddle.width > this.canvasWidth) {
                        this.paddle.x = this.canvasWidth - this.paddle.width;
                    }
                    // 如果球还没发射，球跟着挡板移动
                    if (this.balls.length > 0 && !this.balls[0].launched) {
                        this.balls[0].x = this.paddle.x + this.paddle.width / 2;
                    }
                    break;
                case 'KeyR':
                    e.preventDefault();
                    this.resetGame();
                    break;
                case 'Escape':
                    if (this.state === GameState.PLAYING) {
                        this.pauseGame();
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (this.state === GameState.MENU || this.state === GameState.PAUSED) {
                        this.startGame();
                    }
                    break;
            }
        });

        // 焦点管理
        this.canvas.addEventListener('focus', () => {
            this.canvas.classList.add('focused');
        });

        this.canvas.addEventListener('blur', () => {
            this.canvas.classList.remove('focused');
            // 如果失去焦点且游戏正在进行，暂停游戏
            if (this.state === GameState.PLAYING) {
                this.pauseGame();
            }
        });

        // 触摸目标优化
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // 点击发射球
            if (this.state === GameState.PLAYING && this.balls.length > 0 && !this.balls[0].launched) {
                this.launchBall();
            }
        }, { passive: false });

        // 按钮事件
        document.getElementById('startBtn').addEventListener('click', () => {
            this.canvas.focus();
            if (this.state === GameState.MENU || this.state === GameState.PAUSED) {
                this.startGame();
            }
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.canvas.focus();
            if (this.state === GameState.PLAYING) {
                this.pauseGame();
            } else if (this.state === GameState.PAUSED) {
                this.resumeGame();
            }
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.canvas.focus();
            this.resetGame();
        });

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.canvas.focus();
            this.resetGame();
        });

        document.getElementById('nextLevelBtn').addEventListener('click', () => {
            this.canvas.focus();
            this.nextLevel();
        });

        // 窗口调整大小事件
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }

    startGame() {
        this.state = GameState.PLAYING;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> 暂停';
        this.hideAllScreens();
        this.canvas.focus();
    }

    pauseGame() {
        this.state = GameState.PAUSED;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-play"></i> 继续';
    }

    resumeGame() {
        this.state = GameState.PLAYING;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> 暂停';
        this.canvas.focus();
    }

    resetGame() {
        this.score = 0;
        this.lives = CONFIG.maxLives;
        this.level = 1;
        this.particles = [];
        this.powerups = [];
        this.paddle.width = CONFIG.paddleWidth * this.scaleX;
        this.paddle.baseWidth = CONFIG.paddleWidth * this.scaleX;
        this.paddle.color = this.paddle.originalColor;
        this.paddleFlash = 0;
        this.paddleFlashColor = null;

        // 清除所有活跃的道具效果
        this.clearActivePowerups();

        this.resetBall();
        this.initBricks();
        this.state = GameState.MENU;
        this.hideAllScreens();
        this.updateUI();
    }

    nextLevel() {
        this.level++;
        this.lives = Math.min(this.lives + 1, CONFIG.maxLives); // 奖励一条生命
        this.score += CONFIG.levelBonus;

        // 清除道具和道具效果
        this.powerups = [];
        this.clearActivePowerups();

        this.resetBall();
        this.initBricks();
        this.state = GameState.MENU;
        this.hideAllScreens();
        this.updateUI();
    }

    // 清除所有活跃的道具效果
    clearActivePowerups() {
        this.activePowerups.forEach(timer => clearTimeout(timer));
        this.activePowerups = [];
        // 重置挡板宽度
        this.paddle.width = this.paddle.baseWidth;
    }

    // 添加带时效的道具效果
    addPowerupEffect(type, callback) {
        // 立即应用效果
        callback();

        // 设置定时器在指定时间后恢复
        const timer = setTimeout(() => {
            this.removePowerupEffect(type);
        }, CONFIG.powerupDuration);

        this.activePowerups.push({ type, timer });
    }

    // 移除道具效果
    removePowerupEffect(type) {
        switch (type) {
            case PowerupType.PADDLE_LONG:
            case PowerupType.PADDLE_SHORT:
                // 恢复基础挡板宽度
                this.paddle.width = this.paddle.baseWidth;
                break;
            case PowerupType.BALL_FAST:
            case PowerupType.BALL_SLOW:
                // 恢复默认球速
                const defaultSpeed = this.getBallSpeedForLevel();
                this.balls.forEach(ball => {
                    if (ball.launched) {
                        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                        if (currentSpeed > 0) {
                            const ratio = defaultSpeed / currentSpeed;
                            ball.dx *= ratio;
                            ball.dy *= ratio;
                            ball.speed = defaultSpeed;
                        }
                    }
                });
                break;
        }

        // 从活跃道具列表中移除
        this.activePowerups = this.activePowerups.filter(p => p.type !== type);
    }

    gameOver() {
        this.state = GameState.GAME_OVER;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('brickBreakerHighScore', this.highScore.toString());
        }

        document.getElementById('gameOverTitle').textContent = '游戏结束';
        document.getElementById('gameOverMessage').textContent = '您失去了所有生命！';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.highScore;

        document.getElementById('gameOverScreen').style.display = 'flex';
    }

    levelComplete() {
        this.state = GameState.LEVEL_COMPLETE;

        document.getElementById('levelScore').textContent = CONFIG.levelBonus;
        document.getElementById('totalScore').textContent = this.score + CONFIG.levelBonus;

        document.getElementById('levelCompleteScreen').style.display = 'flex';
    }

    hideAllScreens() {
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('levelCompleteScreen').style.display = 'none';
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('level').textContent = this.level;

        // 更新 data-value 属性以支持极小屏幕显示
        const scoreItem = document.querySelector('.score-item[aria-label="当前得分"]');
        const livesItem = document.querySelector('.score-item[aria-label="剩余生命"]');
        const levelItem = document.querySelector('.score-item[aria-label="当前关卡"]');
        if (scoreItem) scoreItem.setAttribute('data-value', this.score);
        if (livesItem) livesItem.setAttribute('data-value', this.lives);
        if (levelItem) levelItem.setAttribute('data-value', this.level);
    }

    gameLoop() {
        this.clearCanvas();

        if (this.state === GameState.PLAYING) {
            this.update();
        }

        this.draw();

        // 继续游戏循环
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    clearCanvas() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // 添加网格背景
        this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.1)';
        this.ctx.lineWidth = 1;
        const gridSize = 20 * Math.min(this.scaleX, this.scaleY);

        for (let x = 0; x < this.canvasWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvasHeight);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvasHeight; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvasWidth, y);
            this.ctx.stroke();
        }
    }

    update() {
        // 更新所有球
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];

            // 如果球还没发射，跳过更新
            if (!ball.launched) {
                continue;
            }

            // 记录球的位置用于拖尾效果
            this.recordBallTrail(ball);

            // 移动球
            ball.x += ball.dx;
            ball.y += ball.dy;

            // 墙壁碰撞检测
            if (ball.x - ball.radius < 0) {
                ball.x = ball.radius;
                ball.dx = Math.abs(ball.dx);
                this.createParticles(ball.x, ball.y, 3, '#e74c3c');
            }

            if (ball.x + ball.radius > this.canvasWidth) {
                ball.x = this.canvasWidth - ball.radius;
                ball.dx = -Math.abs(ball.dx);
                this.createParticles(ball.x, ball.y, 3, '#e74c3c');
            }

            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius;
                ball.dy = Math.abs(ball.dy);
                this.createParticles(ball.x, ball.y, 3, '#e74c3c');
            }

            // 球掉落到底部
            if (ball.y + ball.radius > this.canvasHeight) {
                this.balls.splice(i, 1);
                // 移除该球的拖尾记录
                this.ballTrails = this.ballTrails.filter(trail => trail.ballIndex !== i);
                this.createParticles(ball.x, this.canvasHeight, 10, '#e74c3c');
                continue;
            }

            // 挡板碰撞检测
            if (this.checkPaddleCollision(ball)) {
                // 确保球在挡板上方
                ball.y = this.paddle.y - ball.radius;

                // 根据击中挡板的位置计算反弹角度
                const hitPosition = (ball.x - this.paddle.x) / this.paddle.width;
                const angle = (hitPosition - 0.5) * Math.PI / 2; // -45° 到 +45°

                // 重新计算速度，保持球的速度恒定
                const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                ball.dx = Math.sin(angle) * speed;
                ball.dy = -Math.abs(Math.cos(angle) * speed);

                // 触发挡板闪烁效果
                this.triggerPaddleFlash(ball.color);
                this.createParticles(ball.x, ball.y, 5, '#3498db');
            }

            // 砖块碰撞检测
            this.checkBrickCollision(ball);
        }

        // 如果没有球了，减少生命
        if (this.balls.length === 0) {
            this.lives--;
            this.updateUI();

            if (this.lives <= 0) {
                this.gameOver();
            } else {
                this.resetBall();
            }
        }

        // 更新道具 (只在PLAYING状态下)
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.y += 2 * this.scaleY;

            // 更新道具旋转角度
            powerup.rotation = (powerup.rotation || 0) + 0.05;

            // 更新道具闪烁
            powerup.blinkPhase = (powerup.blinkPhase || 0) + 0.1;
            powerup.blinkAlpha = 0.7 + Math.sin(powerup.blinkPhase) * 0.3;

            // 道具与挡板碰撞
            if (this.checkPowerupCollision(powerup)) {
                this.applyPowerup(powerup.type);
                this.createParticles(powerup.x, powerup.y, 20, powerup.color);
                this.powerups.splice(i, 1);
                continue;
            }

            // 道具掉落到底部
            if (powerup.y > this.canvasHeight) {
                this.powerups.splice(i, 1);
            }
        }

        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx * this.scaleX;
            particle.y += particle.vy * this.scaleY;
            particle.life--;
            particle.vy += 0.05; // 重力效果
            particle.size *= 0.98; // 粒子逐渐变小

            if (particle.life <= 0 || particle.size < 0.5) {
                this.particles.splice(i, 1);
            }
        }

        // 更新挡板闪烁
        if (this.paddleFlash > 0) {
            this.paddleFlash--;
            if (this.paddleFlash <= 0) {
                this.paddle.color = this.paddle.originalColor;
                this.paddleFlashColor = null;
            }
        }

        // 检查关卡是否完成
        if (this.bricks.every(brick => !brick.visible)) {
            this.levelComplete();
        }
    }

    // 记录球体拖尾
    recordBallTrail(ball) {
        const ballIndex = this.balls.indexOf(ball);
        // 为每个球维护独立的拖尾数组
        if (!this.ballTrails[ballIndex]) {
            this.ballTrails[ballIndex] = [];
        }

        const trail = this.ballTrails[ballIndex];
        trail.push({
            x: ball.x,
            y: ball.y,
            radius: ball.radius,
            color: ball.color
        });

        // 限制拖尾长度
        if (trail.length > CONFIG.trailLength) {
            trail.shift();
        }
    }

    // 触发挡板闪烁效果
    triggerPaddleFlash(color) {
        this.paddleFlash = CONFIG.paddleFlashDuration;
        this.paddleFlashColor = color;
    }

    checkPaddleCollision(ball) {
        if (!ball.launched) return false;
        return ball.x + ball.radius > this.paddle.x &&
               ball.x - ball.radius < this.paddle.x + this.paddle.width &&
               ball.y + ball.radius > this.paddle.y &&
               ball.y - ball.radius < this.paddle.y + this.paddle.height &&
               ball.dy > 0; // 只有球向下移动时才检测碰撞
    }

    checkBrickCollision(ball) {
        if (!ball.launched) return;

        for (const brick of this.bricks) {
            if (brick.visible &&
                ball.x + ball.radius > brick.x &&
                ball.x - ball.radius < brick.x + brick.width &&
                ball.y + ball.radius > brick.y &&
                ball.y - ball.radius < brick.y + brick.height) {

                // 计算碰撞面并反弹
                const ballCenterX = ball.x;
                const ballCenterY = ball.y;
                const brickCenterX = brick.x + brick.width / 2;
                const brickCenterY = brick.y + brick.height / 2;

                const dx = ballCenterX - brickCenterX;
                const dy = ballCenterY - brickCenterY;

                if (Math.abs(dx) * brick.height > Math.abs(dy) * brick.width) {
                    // 水平碰撞
                    ball.dx = -ball.dx;
                } else {
                    // 垂直碰撞
                    ball.dy = -ball.dy;
                }

                // 砖块被击中
                brick.hits--;

                if (brick.hits <= 0) {
                    brick.visible = false;

                    // 创建增强版砖块破碎粒子 - 更多数量的粒子 + 颜色变化
                    this.createEnhancedParticles(
                        brick.x + brick.width / 2,
                        brick.y + brick.height / 2,
                        brick.color,
                        brick.type
                    );

                    // 增加分数
                    let points = 10;
                    if (brick.type === BrickType.STRONG) points = 25;
                    if (brick.type === BrickType.SPECIAL) points = 50;

                    this.score += points;

                    // 特殊砖块掉落道具
                    if (brick.type === BrickType.SPECIAL) {
                        this.createPowerup(brick.x + brick.width / 2, brick.y);
                    }
                } else {
                    // 砖块被击中但未破碎，创建少量粒子
                    this.createParticles(
                        ball.x,
                        ball.y,
                        8,
                        brick.color
                    );
                }

                this.updateUI();
                break;
            }
        }
    }

    checkPowerupCollision(powerup) {
        return powerup.x + powerup.size > this.paddle.x &&
               powerup.x - powerup.size < this.paddle.x + this.paddle.width &&
               powerup.y + powerup.size > this.paddle.y &&
               powerup.y - powerup.size < this.paddle.y + this.paddle.height;
    }

    // 增强版粒子创建 - 更多样式和颜色变化
    createEnhancedParticles(x, y, baseColor, brickType) {
        // 根据砖块类型选择颜色变化
        let colorVariations = [baseColor];

        switch (brickType) {
            case BrickType.NORMAL:
                colorVariations = ['#3498db', '#5dade2', '#85c1e9', '#2980b9', '#ffffff'];
                break;
            case BrickType.STRONG:
                colorVariations = ['#f39c12', '#f8c471', '#fad7a0', '#e67e22', '#ffffff'];
                break;
            case BrickType.SPECIAL:
                colorVariations = ['#9b59b6', '#bb8fce', '#d7bde2', '#8e44ad', '#ffffff', '#f1c40f'];
                break;
        }

        const particleCount = CONFIG.particleCount;

        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            const size = Math.random() * 6 * Math.min(this.scaleX, this.scaleY) + 2;
            const life = Math.random() * 40 + 30;
            const color = colorVariations[Math.floor(Math.random() * colorVariations.length)];

            // 添加闪光粒子
            const isSparkle = Math.random() < 0.2; // 20%概率创建闪光粒子

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1, // 初始向上抛
                size,
                color,
                originalColor: color,
                life,
                maxLife: life,
                isSparkle,
                sparklePhase: Math.random() * Math.PI * 2
            });
        }

        // 添加中心爆炸效果
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const speed = 3;
            const size = 4 * Math.min(this.scaleX, this.scaleY);

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                color: '#ffffff',
                life: 15,
                maxLife: 15,
                isSparkle: true,
                sparklePhase: 0
            });
        }
    }

    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            const size = Math.random() * 4 * Math.min(this.scaleX, this.scaleY) + 2;
            const life = Math.random() * 30 + 20;

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                color,
                life,
                maxLife: life
            });
        }
    }

    createPowerup(x, y) {
        const types = Object.values(PowerupType);
        const type = types[Math.floor(Math.random() * types.length)];

        const powerup = {
            x,
            y,
            type,
            size: 20 * Math.min(this.scaleX, this.scaleY),
            color: this.getPowerupColor(type),
            icon: this.getPowerupIcon(type),
            rotation: 0,
            blinkPhase: 0,
            blinkAlpha: 1
        };

        this.powerups.push(powerup);
    }

    getPowerupColor(type) {
        switch (type) {
            case PowerupType.PADDLE_LONG: return '#2ecc71';
            case PowerupType.PADDLE_SHORT: return '#e74c3c';
            case PowerupType.BALL_FAST: return '#f39c12';
            case PowerupType.BALL_SLOW: return '#3498db';
            case PowerupType.MULTI_BALL: return '#9b59b6';
            default: return '#ffffff';
        }
    }

    getPowerupIcon(type) {
        switch (type) {
            case PowerupType.PADDLE_LONG: return '↔';
            case PowerupType.PADDLE_SHORT: return '↕';
            case PowerupType.BALL_FAST: return '⚡';
            case PowerupType.BALL_SLOW: return '❄';
            case PowerupType.MULTI_BALL: return '⊕';
            default: return '?';
        }
    }

    applyPowerup(type) {
        switch (type) {
            case PowerupType.PADDLE_LONG:
                this.addPowerupEffect(type, () => {
                    this.paddle.width = Math.min(this.paddle.baseWidth * 1.5, 200 * this.scaleX);
                });
                break;

            case PowerupType.PADDLE_SHORT:
                this.addPowerupEffect(type, () => {
                    this.paddle.width = Math.max(this.paddle.baseWidth * 0.7, 50 * this.scaleX);
                });
                break;

            case PowerupType.BALL_FAST:
                this.balls.forEach(ball => {
                    if (ball.launched) {
                        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                        if (currentSpeed > 0) {
                            const newSpeed = Math.min(currentSpeed * 1.5, CONFIG.ballSpeedMax);
                            const ratio = newSpeed / currentSpeed;
                            ball.dx *= ratio;
                            ball.dy *= ratio;
                            ball.speed = newSpeed;
                        }
                    }
                });
                // 设置10秒后恢复球速
                const fastTimer = setTimeout(() => {
                    this.removePowerupEffect(type);
                }, CONFIG.powerupDuration);
                this.activePowerups.push({ type, timer: fastTimer });
                break;

            case PowerupType.BALL_SLOW:
                this.balls.forEach(ball => {
                    if (ball.launched) {
                        const currentSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                        if (currentSpeed > 0) {
                            const newSpeed = Math.max(currentSpeed * 0.7, CONFIG.ballSpeedMin);
                            const ratio = newSpeed / currentSpeed;
                            ball.dx *= ratio;
                            ball.dy *= ratio;
                            ball.speed = newSpeed;
                        }
                    }
                });
                // 设置10秒后恢复球速
                const slowTimer = setTimeout(() => {
                    this.removePowerupEffect(type);
                }, CONFIG.powerupDuration);
                this.activePowerups.push({ type, timer: slowTimer });
                break;

            case PowerupType.MULTI_BALL:
                const currentBalls = [...this.balls];
                currentBalls.forEach(ball => {
                    if (ball.launched) {
                        const newBall = {
                            ...ball,
                            dx: -ball.dx,
                            dy: ball.dy
                        };
                        this.balls.push(newBall);
                    }
                });
                break;
        }
    }

    draw() {
        // 绘制球体拖尾 (在球之前绘制)
        this.drawBallTrails();

        // 绘制挡板
        this.drawPaddle();

        // 绘制砖块
        this.drawBricks();

        // 绘制球
        this.drawBalls();

        // 绘制道具
        this.drawPowerups();

        // 绘制粒子
        this.drawParticles();

        // 绘制游戏状态
        this.drawGameState();
    }

    // 绘制球体拖尾
    drawBallTrails() {
        for (let trail of this.ballTrails) {
            if (!trail) continue;

            for (let i = 0; i < trail.length; i++) {
                const point = trail[i];
                const alpha = (i / trail.length) * 0.4; // 越新的位置越不透明
                const sizeRatio = (i / trail.length); // 越新的位置越大

                this.ctx.globalAlpha = alpha;
                this.ctx.beginPath();
                this.ctx.arc(point.x, point.y, point.radius * sizeRatio, 0, Math.PI * 2);

                // 创建渐变拖尾
                const gradient = this.ctx.createRadialGradient(
                    point.x, point.y, 0,
                    point.x, point.y, point.radius * sizeRatio
                );
                gradient.addColorStop(0, `rgba(231, 76, 60, ${alpha})`);
                gradient.addColorStop(0.5, `rgba(192, 57, 43, ${alpha * 0.7})`);
                gradient.addColorStop(1, `rgba(192, 57, 43, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }
        }
        this.ctx.globalAlpha = 1;
    }

    drawPaddle() {
        // 确定挡板颜色 (闪烁效果)
        let paddleColor = this.paddle.color;
        if (this.paddleFlash > 0 && this.paddleFlashColor) {
            // 闪烁颜色过渡
            const flashIntensity = this.paddleFlash / CONFIG.paddleFlashDuration;
            paddleColor = this.paddleFlashColor;
            this.ctx.shadowColor = this.paddleFlashColor;
            this.ctx.shadowBlur = 20 * flashIntensity * Math.min(this.scaleX, this.scaleY);
        }

        // 绘制挡板阴影
        this.ctx.fillStyle = 'rgba(44, 62, 80, 0.7)';
        this.ctx.fillRect(this.paddle.x, this.paddle.y + 5 * this.scaleY, this.paddle.width, this.paddle.height);

        // 绘制挡板
        const gradient = this.ctx.createLinearGradient(
            this.paddle.x, this.paddle.y,
            this.paddle.x, this.paddle.y + this.paddle.height
        );
        gradient.addColorStop(0, paddleColor);
        gradient.addColorStop(1, this.adjustColor(paddleColor, -30));

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

        // 绘制挡板边框
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2 * Math.min(this.scaleX, this.scaleY);
        this.ctx.strokeRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

        // 闪烁时添加高光效果
        if (this.paddleFlash > 0 && this.paddleFlashColor) {
            const flashIntensity = this.paddleFlash / CONFIG.paddleFlashDuration;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity * 0.5})`;
            this.ctx.fillRect(
                this.paddle.x,
                this.paddle.y,
                this.paddle.width,
                2 * this.scaleY
            );
        }

        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
    }

    // 辅助方法: 调整颜色亮度
    adjustColor(color, amount) {
        const hex = color.replace('#', '');
        const num = parseInt(hex, 16);
        const r = Math.max(0, Math.min(255, (num >> 16) + amount));
        const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
        const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
        return `rgb(${r}, ${g}, ${b})`;
    }

    drawBricks() {
        for (const brick of this.bricks) {
            if (!brick.visible) continue;

            // 根据剩余生命调整透明度
            const opacity = brick.hits / brick.maxHits;

            // 绘制砖块阴影
            this.ctx.fillStyle = 'rgba(44, 62, 80, 0.5)';
            this.ctx.fillRect(brick.x + 2 * this.scaleX, brick.y + 2 * this.scaleY, brick.width, brick.height);

            // 绘制砖块
            const gradient = this.ctx.createLinearGradient(
                brick.x, brick.y,
                brick.x, brick.y + brick.height
            );

            if (brick.type === BrickType.STRONG) {
                // 坚固砖块渐变
                gradient.addColorStop(0, `rgba(243, 156, 18, ${opacity})`);
                gradient.addColorStop(1, `rgba(230, 126, 34, ${opacity})`);
            } else if (brick.type === BrickType.SPECIAL) {
                // 特殊砖块渐变
                gradient.addColorStop(0, `rgba(155, 89, 182, ${opacity})`);
                gradient.addColorStop(1, `rgba(142, 68, 173, ${opacity})`);
            } else {
                // 普通砖块渐变
                gradient.addColorStop(0, `rgba(52, 152, 219, ${opacity})`);
                gradient.addColorStop(1, `rgba(41, 128, 185, ${opacity})`);
            }

            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

            // 绘制砖块边框
            this.ctx.strokeStyle = brick.borderColor;
            this.ctx.lineWidth = 1 * Math.min(this.scaleX, this.scaleY);
            this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

            // 坚固砖块显示生命值
            if (brick.type === BrickType.STRONG) {
                this.ctx.fillStyle = '#ffffff';
                const fontSize = Math.max(12 * Math.min(this.scaleX, this.scaleY), 10);
                this.ctx.font = `${fontSize}px Arial`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    `${brick.hits}`,
                    brick.x + brick.width / 2,
                    brick.y + brick.height / 2 + 4 * Math.min(this.scaleX, this.scaleY)
                );
            }
        }
    }

    drawBalls() {
        for (const ball of this.balls) {
            // 绘制球阴影
            this.ctx.beginPath();
            this.ctx.arc(ball.x + 2 * this.scaleX, ball.y + 2 * this.scaleY, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(44, 62, 80, 0.5)';
            this.ctx.fill();

            // 绘制球
            const gradient = this.ctx.createRadialGradient(
                ball.x - ball.radius / 3, ball.y - ball.radius / 3, 1,
                ball.x, ball.y, ball.radius
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.7, ball.color);
            gradient.addColorStop(1, '#c0392b');

            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // 绘制球边框
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 1 * Math.min(this.scaleX, this.scaleY);
            this.ctx.stroke();

            // 绘制球高光
            this.ctx.beginPath();
            this.ctx.arc(ball.x - ball.radius / 3, ball.y - ball.radius / 3, ball.radius / 3, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fill();
        }
    }

    drawPowerups() {
        for (const powerup of this.powerups) {
            this.ctx.save();

            // 移动到道具中心
            this.ctx.translate(powerup.x, powerup.y);
            this.ctx.rotate(powerup.rotation || 0);

            // 绘制道具发光效果
            const glowIntensity = 0.5 + Math.sin((powerup.blinkPhase || 0)) * 0.3;
            this.ctx.shadowColor = powerup.color;
            this.ctx.shadowBlur = 20 * Math.min(this.scaleX, this.scaleY) * glowIntensity;

            // 绘制道具背景 (带闪烁透明度)
            this.ctx.globalAlpha = powerup.blinkAlpha || 1;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, powerup.size, 0, Math.PI * 2);

            // 道具背景渐变
            const bgGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, powerup.size);
            bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            bgGradient.addColorStop(0.7, powerup.color);
            bgGradient.addColorStop(1, powerup.color);

            this.ctx.fillStyle = bgGradient;
            this.ctx.fill();

            // 绘制道具边框
            this.ctx.strokeStyle = powerup.color;
            this.ctx.lineWidth = 3 * Math.min(this.scaleX, this.scaleY);
            this.ctx.stroke();

            // 绘制道具图标
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `bold ${powerup.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(powerup.icon, 0, 0);

            // 绘制外圈光环效果
            this.ctx.beginPath();
            this.ctx.arc(0, 0, powerup.size + 3 * Math.min(this.scaleX, this.scaleY), 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${glowIntensity * 0.5})`;
            this.ctx.lineWidth = 2 * Math.min(this.scaleX, this.scaleY);
            this.ctx.stroke();

            this.ctx.restore();
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1;
        }
    }

    drawParticles() {
        for (const particle of this.particles) {
            const lifeRatio = particle.life / particle.maxLife;
            this.ctx.globalAlpha = lifeRatio;

            if (particle.isSparkle) {
                // 闪光粒子效果
                particle.sparklePhase = (particle.sparklePhase || 0) + 0.3;
                const sparkleIntensity = 0.5 + Math.sin(particle.sparklePhase) * 0.5;

                this.ctx.shadowColor = particle.color;
                this.ctx.shadowBlur = particle.size * 2 * sparkleIntensity;

                // 绘制星形闪光
                this.drawStar(
                    particle.x,
                    particle.y,
                    4, // 5个角
                    particle.size * sparkleIntensity,
                    particle.size * 0.5 * sparkleIntensity
                );

                this.ctx.shadowBlur = 0;
            } else {
                // 普通粒子
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.ctx.globalAlpha = 1;
    }

    // 绘制星形
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            let x = cx + Math.cos(rot) * outerRadius;
            let y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }

        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fill();
    }

    drawGameState() {
        if (this.state === GameState.MENU) {
            // 半透明背景
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

            this.ctx.fillStyle = '#ffffff';
            const titleFontSize = Math.max(36 * Math.min(this.scaleX, this.scaleY), 24);
            const descFontSize = Math.max(24 * Math.min(this.scaleX, this.scaleY), 16);
            this.ctx.font = `bold ${titleFontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('点击开始或按空格键', this.canvasWidth / 2, this.canvasHeight / 2);

            this.ctx.font = `${descFontSize}px Arial`;
            this.ctx.fillText('点击Canvas发射球', this.canvasWidth / 2, this.canvasHeight / 2 + 50 * Math.min(this.scaleX, this.scaleY));
        } else if (this.state === GameState.PAUSED) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

            this.ctx.fillStyle = '#ffffff';
            const titleFontSize = Math.max(48 * Math.min(this.scaleX, this.scaleY), 32);
            const descFontSize = Math.max(24 * Math.min(this.scaleX, this.scaleY), 16);
            this.ctx.font = `bold ${titleFontSize}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', this.canvasWidth / 2, this.canvasHeight / 2);

            this.ctx.font = `${descFontSize}px Arial`;
            this.ctx.fillText('按空格键或点击"继续"按钮恢复游戏', this.canvasWidth / 2, this.canvasHeight / 2 + 60 * Math.min(this.scaleX, this.scaleY));
        }
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();

    // 全局访问
    window.brickBreakerGame = game;
});

// 触摸设备防止页面滚动
document.addEventListener('touchstart', (e) => {
    if (e.target === document.getElementById('gameCanvas')) {
        e.preventDefault();
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (e.target === document.getElementById('gameCanvas')) {
        e.preventDefault();
    }
}, { passive: false });
