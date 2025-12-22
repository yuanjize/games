/**
 * 经典打砖块游戏
 * 使用原生JavaScript实现
 */

// 游戏配置
const CONFIG = {
    canvasWidth: 800,
    canvasHeight: 600,
    paddleWidth: 100,
    paddleHeight: 15,
    paddleSpeed: 8,
    ballRadius: 8,
    ballSpeed: 5,
    brickRows: 6,
    brickColumns: 10,
    brickWidth: 70,
    brickHeight: 25,
    brickPadding: 5,
    brickOffsetTop: 50,
    brickOffsetLeft: 30,
    maxLives: 3,
    levelBonus: 1000
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

        this.init();
        this.bindEvents();
        this.updateUI();
    }

    init() {
        // 初始化游戏对象
        this.paddle = {
            x: (CONFIG.canvasWidth - CONFIG.paddleWidth) / 2,
            y: CONFIG.canvasHeight - CONFIG.paddleHeight - 10,
            width: CONFIG.paddleWidth,
            height: CONFIG.paddleHeight,
            speed: CONFIG.paddleSpeed,
            color: '#3498db'
        };

        // 初始化球
        this.resetBall();

        // 初始化砖块
        this.initBricks();

        // 设置Canvas尺寸
        this.resizeCanvas();

        // 开始游戏循环
        requestAnimationFrame(() => this.gameLoop());
    }

    resetBall() {
        this.balls = [{
            x: CONFIG.canvasWidth / 2,
            y: CONFIG.canvasHeight - 50,
            radius: CONFIG.ballRadius,
            dx: (Math.random() > 0.5 ? 1 : -1) * CONFIG.ballSpeed,
            dy: -CONFIG.ballSpeed,
            color: '#e74c3c',
            speed: CONFIG.ballSpeed
        }];
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
        const scale = containerWidth / CONFIG.canvasWidth;

        this.canvas.style.width = containerWidth + 'px';
        this.canvas.style.height = (CONFIG.canvasHeight * scale) + 'px';

        // 保持原始尺寸用于绘制
        this.canvas.width = CONFIG.canvasWidth;
        this.canvas.height = CONFIG.canvasHeight;
    }

    bindEvents() {
        // 鼠标移动事件
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.state === GameState.PLAYING) {
                const rect = this.canvas.getBoundingClientRect();
                const scale = this.canvas.width / rect.width;
                const mouseX = (e.clientX - rect.left) * scale;

                this.paddle.x = mouseX - this.paddle.width / 2;

                // 限制挡板在画布内
                if (this.paddle.x < 0) this.paddle.x = 0;
                if (this.paddle.x + this.paddle.width > CONFIG.canvasWidth) {
                    this.paddle.x = CONFIG.canvasWidth - this.paddle.width;
                }
            }
        });

        // 触摸事件
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.state === GameState.PLAYING) {
                const rect = this.canvas.getBoundingClientRect();
                const scale = this.canvas.width / rect.width;
                const touch = e.touches[0];
                const touchX = (touch.clientX - rect.left) * scale;

                this.paddle.x = touchX - this.paddle.width / 2;

                // 限制挡板在画布内
                if (this.paddle.x < 0) this.paddle.x = 0;
                if (this.paddle.x + this.paddle.width > CONFIG.canvasWidth) {
                    this.paddle.x = CONFIG.canvasWidth - this.paddle.width;
                }
            }
        }, { passive: false });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    if (this.state === GameState.PLAYING) {
                        this.pauseGame();
                    } else if (this.state === GameState.PAUSED) {
                        this.resumeGame();
                    }
                    break;
                case 'ArrowLeft':
                    if (this.state === GameState.PLAYING) {
                        this.paddle.x -= this.paddle.speed;
                        if (this.paddle.x < 0) this.paddle.x = 0;
                    }
                    break;
                case 'ArrowRight':
                    if (this.state === GameState.PLAYING) {
                        this.paddle.x += this.paddle.speed;
                        if (this.paddle.x + this.paddle.width > CONFIG.canvasWidth) {
                            this.paddle.x = CONFIG.canvasWidth - this.paddle.width;
                        }
                    }
                    break;
                case 'KeyR':
                    e.preventDefault();
                    if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
                        this.resetGame();
                    }
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

        // 增加焦点管理
        this.canvas.addEventListener('focus', () => {
            this.canvas.classList.add('focused');
        });

        this.canvas.addEventListener('blur', () => {
            this.canvas.classList.remove('focused');
        });

        // 触摸目标优化
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });

        // 按钮事件
        document.getElementById('startBtn').addEventListener('click', () => {
            if (this.state === GameState.MENU || this.state === GameState.PAUSED) {
                this.startGame();
            }
        });

        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (this.state === GameState.PLAYING) {
                this.pauseGame();
            } else if (this.state === GameState.PAUSED) {
                this.resumeGame();
            }
        });

        document.getElementById('restartBtn').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.resetGame();
        });

        document.getElementById('nextLevelBtn').addEventListener('click', () => {
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
    }

    pauseGame() {
        this.state = GameState.PAUSED;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-play"></i> 继续';
    }

    resumeGame() {
        this.state = GameState.PLAYING;
        document.getElementById('pauseBtn').innerHTML = '<i class="fas fa-pause"></i> 暂停';
    }

    resetGame() {
        this.score = 0;
        this.lives = CONFIG.maxLives;
        this.level = 1;
        this.particles = [];
        this.powerups = [];
        this.paddle.width = CONFIG.paddleWidth;

        this.resetBall();
        this.initBricks();
        this.state = GameState.PLAYING;
        this.hideAllScreens();
        this.updateUI();
    }

    nextLevel() {
        this.level++;
        this.lives = Math.min(this.lives + 1, CONFIG.maxLives); // 奖励一条生命
        this.score += CONFIG.levelBonus;

        this.resetBall();
        this.initBricks();
        this.powerups = [];
        this.state = GameState.PLAYING;
        this.hideAllScreens();
        this.updateUI();
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
    }

    gameLoop() {
        this.clearCanvas();

        if (this.state === GameState.PLAYING) {
            this.update();
        }

        this.draw();

        // 继续游戏循环
        requestAnimationFrame(() => this.gameLoop());
    }

    clearCanvas() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

        // 添加网格背景
        this.ctx.strokeStyle = 'rgba(52, 152, 219, 0.1)';
        this.ctx.lineWidth = 1;
        const gridSize = 20;

        for (let x = 0; x < CONFIG.canvasWidth; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, CONFIG.canvasHeight);
            this.ctx.stroke();
        }

        for (let y = 0; y < CONFIG.canvasHeight; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(CONFIG.canvasWidth, y);
            this.ctx.stroke();
        }
    }

    update() {
        // 更新所有球
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];

            // 移动球
            ball.x += ball.dx;
            ball.y += ball.dy;

            // 墙壁碰撞检测
            if (ball.x - ball.radius < 0 || ball.x + ball.radius > CONFIG.canvasWidth) {
                ball.dx = -ball.dx;
                this.createParticles(ball.x, ball.y, 3, '#e74c3c');
            }

            if (ball.y - ball.radius < 0) {
                ball.dy = -ball.dy;
                this.createParticles(ball.x, ball.y, 3, '#e74c3c');
            }

            // 球掉落到底部
            if (ball.y + ball.radius > CONFIG.canvasHeight) {
                this.balls.splice(i, 1);
                this.createParticles(ball.x, ball.y, 10, '#e74c3c');
                continue;
            }

            // 挡板碰撞检测
            if (this.checkPaddleCollision(ball)) {
                // 根据击中挡板的位置计算反弹角度
                const hitPosition = (ball.x - this.paddle.x) / this.paddle.width;
                const angle = (hitPosition - 0.5) * Math.PI / 2; // -45° 到 +45°

                ball.dx = Math.sin(angle) * ball.speed;
                ball.dy = -Math.cos(angle) * ball.speed;

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

        // 更新道具
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.y += 2;

            // 道具与挡板碰撞
            if (this.checkPowerupCollision(powerup)) {
                this.applyPowerup(powerup.type);
                this.powerups.splice(i, 1);
                continue;
            }

            // 道具掉落到底部
            if (powerup.y > CONFIG.canvasHeight) {
                this.powerups.splice(i, 1);
            }
        }

        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;

            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 检查关卡是否完成
        if (this.bricks.every(brick => !brick.visible)) {
            this.levelComplete();
        }
    }

    checkPaddleCollision(ball) {
        return ball.x + ball.radius > this.paddle.x &&
               ball.x - ball.radius < this.paddle.x + this.paddle.width &&
               ball.y + ball.radius > this.paddle.y &&
               ball.y - ball.radius < this.paddle.y + this.paddle.height;
    }

    checkBrickCollision(ball) {
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

                    // 创建砖块破碎粒子
                    this.createParticles(
                        brick.x + brick.width / 2,
                        brick.y + brick.height / 2,
                        15,
                        brick.color
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
                }

                this.updateUI();
                break;
            }
        }
    }

    checkPowerupCollision(powerup) {
        return powerup.x > this.paddle.x &&
               powerup.x < this.paddle.x + this.paddle.width &&
               powerup.y > this.paddle.y &&
               powerup.y < this.paddle.y + this.paddle.height;
    }

    createParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            const size = Math.random() * 4 + 2;
            const life = Math.random() * 30 + 20;

            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                color,
                life
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
            size: 20,
            color: this.getPowerupColor(type),
            icon: this.getPowerupIcon(type)
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
                this.paddle.width = Math.min(this.paddle.width * 1.5, 200);
                break;

            case PowerupType.PADDLE_SHORT:
                this.paddle.width = Math.max(this.paddle.width * 0.7, 50);
                break;

            case PowerupType.BALL_FAST:
                this.balls.forEach(ball => {
                    const currentVelocity = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                    if (currentVelocity > 0) {
                        ball.speed *= 1.5;
                        const scale = ball.speed / currentVelocity;
                        ball.dx *= scale;
                        ball.dy *= scale;
                    }
                });
                break;

            case PowerupType.BALL_SLOW:
                this.balls.forEach(ball => {
                    const currentVelocity = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                    if (currentVelocity > 0) {
                        ball.speed = Math.max(ball.speed * 0.7, 2); // Prevent stopping
                        const scale = ball.speed / currentVelocity;
                        ball.dx *= scale;
                        ball.dy *= scale;
                    }
                });
                break;

            case PowerupType.MULTI_BALL:
                const currentBalls = [...this.balls];
                currentBalls.forEach(ball => {
                    const newBall = {
                        ...ball,
                        dx: -ball.dx,
                        dy: -ball.dy
                    };
                    this.balls.push(newBall);
                });
                break;
        }
    }

    draw() {
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

    drawPaddle() {
        // 绘制挡板阴影
        this.ctx.fillStyle = 'rgba(44, 62, 80, 0.7)';
        this.ctx.fillRect(this.paddle.x, this.paddle.y + 5, this.paddle.width, this.paddle.height);

        // 绘制挡板
        const gradient = this.ctx.createLinearGradient(
            this.paddle.x, this.paddle.y,
            this.paddle.x, this.paddle.y + this.paddle.height
        );
        gradient.addColorStop(0, this.paddle.color);
        gradient.addColorStop(1, '#2980b9');

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);

        // 绘制挡板边框
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    }

    drawBricks() {
        for (const brick of this.bricks) {
            if (!brick.visible) continue;

            // 根据剩余生命调整透明度
            const opacity = brick.hits / brick.maxHits;

            // 绘制砖块阴影
            this.ctx.fillStyle = 'rgba(44, 62, 80, 0.5)';
            this.ctx.fillRect(brick.x + 2, brick.y + 2, brick.width, brick.height);

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
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

            // 坚固砖块显示生命值
            if (brick.type === BrickType.STRONG) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    `${brick.hits}`,
                    brick.x + brick.width / 2,
                    brick.y + brick.height / 2 + 4
                );
            }
        }
    }

    drawBalls() {
        for (const ball of this.balls) {
            // 绘制球阴影
            this.ctx.beginPath();
            this.ctx.arc(ball.x + 2, ball.y + 2, ball.radius, 0, Math.PI * 2);
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
            this.ctx.lineWidth = 1;
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
            // 绘制道具发光效果
            this.ctx.shadowColor = powerup.color;
            this.ctx.shadowBlur = 15;

            // 绘制道具背景
            this.ctx.beginPath();
            this.ctx.arc(powerup.x, powerup.y, powerup.size, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fill();

            // 绘制道具边框
            this.ctx.strokeStyle = powerup.color;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // 绘制道具图标
            this.ctx.fillStyle = powerup.color;
            this.ctx.font = `${powerup.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(powerup.icon, powerup.x, powerup.y);

            // 重置阴影
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }
    }

    drawParticles() {
        for (const particle of this.particles) {
            this.ctx.globalAlpha = particle.life / 50;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }

    drawGameState() {
        if (this.state === GameState.PAUSED) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏暂停', CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2);

            this.ctx.font = '24px Arial';
            this.ctx.fillText('按空格键或点击"继续"按钮恢复游戏', CONFIG.canvasWidth / 2, CONFIG.canvasHeight / 2 + 60);
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