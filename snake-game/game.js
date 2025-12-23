/**
 * Snake Game - Modern Implementation
 * 完整的贪吃蛇游戏实现，支持桌面和移动端
 * 第1轮视觉增强优化
 */

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false }); // 优化性能，不需要透明通道

        // Configuration
        this.gridSize = 20;
        this.tileCountX = 20;
        this.tileCountY = 20;

        // Food types configuration
        this.foodTypes = {
            normal: { points: 10, color: '#f43f5e', speed: 1, glowColor: 'rgba(244, 63, 94, 0.8)' },
            gold: { points: 50, color: '#fbbf24', speed: 0.98, glowColor: 'rgba(251, 191, 36, 0.9)' },
            fast: { points: 20, color: '#4ade80', speed: 0.95, glowColor: 'rgba(74, 222, 128, 0.8)' },
            mystery: { points: 0, color: '#60a5fa', speed: 1, glowColor: 'rgba(96, 165, 250, 0.8)' } // 随机分数
        };

        // State
        this.state = {
            running: false,
            gameOver: false,
            paused: false,
            score: 0,
            highScore: parseInt(localStorage.getItem('snake_high') || '0'),
            soundEnabled: true,
            lastScoreUpdate: 0, // 防止频繁更新DOM
            previousScore: 0 // 用于分数动画
        };

        this.snake = [];
        this.food = null;
        this.dx = 0;
        this.dy = 0;

        // Input Queue to prevent self-collision on rapid keypress
        this.inputQueue = [];

        // Loop
        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.stepInterval = 100; // ms per step (speed)
        this.minStepInterval = 40; // 最小间隔，防止速度过快
        this.maxStepInterval = 150; // 最大间隔

        // 动画帧ID，用于取消请求
        this.animationFrameId = null;

        // 预渲染网格以提升性能
        this.gridCanvas = null;
        this.needsGridRender = true;

        // 当前焦点元素用于恢复
        this.previousFocus = null;

        // 窗口resize防抖定时器
        this.resizeTimer = null;

        // 食物发光脉冲动画
        this.foodPulsePhase = 0;
        this.foodPulseSpeed = 0.05;

        // 蛇身颜色渐变过渡
        this.snakeGradientColors = [];

        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => {
            if (this.resizeTimer) {
                clearTimeout(this.resizeTimer);
            }
            this.resizeTimer = setTimeout(() => this.handleResize(), 150);
        });
        this.bindEvents();
        this.bindAccessibility();
        this.bindButtonRipple();
        this.reset();
        this.showOverlay('start-screen');
        this.preventScrollOnKeys();
    }

    /**
     * 防止方向键滚动页面
     */
    preventScrollOnKeys() {
        const preventKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
        document.addEventListener('keydown', (e) => {
            if (preventKeys.includes(e.key)) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * 可访问性支持
     */
    bindAccessibility() {
        // 管理焦点
        const overlays = document.querySelectorAll('.game-overlay');
        overlays.forEach(overlay => {
            overlay.addEventListener('transitionend', () => {
                if (overlay.style.display === 'none') {
                    // 恢复之前的焦点
                    if (this.previousFocus) {
                        this.previousFocus.focus();
                    }
                }
            });
        });
    }

    /**
     * 绑定按钮涟漪效果
     */
    bindButtonRipple() {
        const createRipple = (event, button) => {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');

            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            button.appendChild(ripple);

            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        };

        // 为所有按钮添加涟漪效果
        const buttons = document.querySelectorAll('.btn, .direction-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => createRipple(e, button));

            // 触摸设备支持
            button.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                const mockEvent = {
                    clientX: touch.clientX,
                    clientY: touch.clientY
                };
                createRipple(mockEvent, button);
            });
        });
    }

    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const oldTileCountX = this.tileCountX;
        const oldTileCountY = this.tileCountY;

        this.resize();

        // 如果游戏正在运行，需要确保蛇在新的边界内
        if (this.state.running || this.snake.length > 0) {
            // 调整蛇的位置，确保在边界内
            this.snake = this.snake.map(segment => ({
                x: Math.min(segment.x, this.tileCountX - 1),
                y: Math.min(segment.y, this.tileCountY - 1)
            }));

            // 确保食物也在边界内
            if (this.food) {
                this.food.x = Math.min(this.food.x, this.tileCountX - 1);
                this.food.y = Math.min(this.food.y, this.tileCountY - 1);
            }

            // 如果蛇头可能在边界外，重新绘制
            this.draw();
        }
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        // Snap to grid size
        this.tileCountX = Math.floor(rect.width / this.gridSize);
        this.tileCountY = Math.floor(rect.height / this.gridSize);

        // 确保最小尺寸
        this.tileCountX = Math.max(10, this.tileCountX);
        this.tileCountY = Math.max(10, this.tileCountY);

        this.canvas.width = this.tileCountX * this.gridSize;
        this.canvas.height = this.tileCountY * this.gridSize;

        // 标记需要重新渲染网格
        this.needsGridRender = true;
    }

    reset() {
        // 取消之前的动画帧请求
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        this.state.score = 0;
        this.state.running = false;
        this.state.gameOver = false;
        this.state.paused = false;
        this.state.lastScoreUpdate = 0;
        this.state.previousScore = 0;
        this.stepInterval = 100;
        this.foodPulsePhase = 0;

        // Center snake - 确保蛇在边界内
        const cx = Math.min(Math.floor(this.tileCountX / 2), this.tileCountX - 4);
        const cy = Math.min(Math.floor(this.tileCountY / 2), this.tileCountY - 1);

        this.snake = [
            {x: cx, y: cy},
            {x: Math.max(cx - 1, 0), y: cy},
            {x: Math.max(cx - 2, 0), y: cy}
        ];

        this.dx = 1;
        this.dy = 0;
        this.inputQueue = [];
        this.snakeGradientColors = [];

        this.spawnFood();
        this.updateUI();
        this.draw(); // 初始绘制
    }

    spawnFood() {
        const typeKeys = Object.keys(this.foodTypes);
        // 加权随机：普通食物概率最高
        const weights = [0.5, 0.2, 0.2, 0.1]; // normal, gold, fast, mystery
        let random = Math.random();
        let type = 'normal';

        let cumulativeWeight = 0;
        for (let i = 0; i < typeKeys.length; i++) {
            cumulativeWeight += weights[i];
            if (random <= cumulativeWeight) {
                type = typeKeys[i];
                break;
            }
        }

        let valid = false;
        let attempts = 0;
        const maxAttempts = 500; // 增加尝试次数

        while (!valid && attempts < maxAttempts) {
            this.food = {
                x: Math.floor(Math.random() * this.tileCountX),
                y: Math.floor(Math.random() * this.tileCountY),
                type: type,
                spawnTime: performance.now() // 记录生成时间用于动画
            };

            // Check collision with snake
            valid = !this.snake.some(s => s.x === this.food.x && s.y === this.food.y);
            attempts++;
        }

        // 如果找不到有效位置，重新生成食物类型并重试
        if (!valid) {
            // 蛇几乎填满整个屏幕，尝试生成在蛇身外的任意位置
            const emptySpots = [];
            for (let x = 0; x < this.tileCountX; x++) {
                for (let y = 0; y < this.tileCountY; y++) {
                    if (!this.snake.some(s => s.x === x && s.y === y)) {
                        emptySpots.push({x, y});
                    }
                }
            }

            if (emptySpots.length > 0) {
                const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
                this.food = {
                    x: spot.x,
                    y: spot.y,
                    type: type,
                    spawnTime: performance.now()
                };
            } else {
                // 蛇完全填满屏幕，游戏获胜
                this.gameWin();
            }
        }
    }

    bindEvents() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.state.gameOver) return;

            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.queueInput(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.queueInput(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.queueInput(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.queueInput(1, 0);
                    break;
                case ' ':
                    this.togglePause();
                    break;
            }
        });

        // Mobile controls with improved touch handling
        const addBtn = (id, dx, dy) => {
            const btn = document.getElementById(id);
            if (!btn) return;

            // 触摸事件 - 使用passive: false以允许preventDefault
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.queueInput(dx, dy);
                btn.classList.add('active');
                this.playHapticFeedback();
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.classList.remove('active');
            }, { passive: false });

            // 桌面点击支持
            btn.addEventListener('click', (e) => {
                this.queueInput(dx, dy);
            });
        };

        addBtn('up-btn', 0, -1);
        addBtn('down-btn', 0, 1);
        addBtn('left-btn', -1, 0);
        addBtn('right-btn', 1, 0);

        // Start button
        document.getElementById('start-btn').addEventListener('click', () => this.start());

        // Restart buttons
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.reset();
            this.start();
        });

        document.getElementById('restart-game-btn').addEventListener('click', () => {
            this.reset();
            this.start();
        });

        document.getElementById('restart-pause-btn').addEventListener('click', () => {
            this.reset();
            this.start();
        });

        // Pause controls
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('resume-btn').addEventListener('click', () => this.togglePause());

        // Sound toggle
        document.getElementById('sound-toggle').addEventListener('click', () => this.toggleSound());
    }

    /**
     * 触觉反馈（如果设备支持）
     */
    playHapticFeedback() {
        if ('vibrate' in navigator && this.state.soundEnabled) {
            navigator.vibrate(10);
        }
    }

    /**
     * 切换声音状态
     */
    toggleSound() {
        this.state.soundEnabled = !this.state.soundEnabled;
        const btn = document.getElementById('sound-toggle');
        const icon = btn.querySelector('i');
        const isPressed = !this.state.soundEnabled;

        icon.className = this.state.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        btn.setAttribute('aria-pressed', isPressed);
        btn.innerHTML = `<i class="${icon.className}" aria-hidden="true"></i> ${this.state.soundEnabled ? '声音' : '静音'}`;
    }

    queueInput(ndx, ndy) {
        // Prevent reversing
        const lastMove = this.inputQueue.length > 0
            ? this.inputQueue[this.inputQueue.length - 1]
            : {dx: this.dx, dy: this.dy};

        // 不能反向移动
        if (lastMove.dx + ndx === 0 && lastMove.dy + ndy === 0) return;
        // 不能重复相同方向
        if (lastMove.dx === ndx && lastMove.dy === ndy) return;

        // Max queue size 2 to prevent huge buffers
        if (this.inputQueue.length < 2) {
            this.inputQueue.push({dx: ndx, dy: ndy});
        }
    }

    togglePause() {
        if (!this.state.running || this.state.gameOver) return;

        this.state.paused = !this.state.paused;

        if (this.state.paused) {
            this.showOverlay('pause-screen');
        } else {
            this.hideOverlays();
        }
    }

    start() {
        // 确保没有重复的动画循环
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        this.state.running = true;
        this.state.paused = false;
        this.hideOverlays();
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame((t) => this.loop(t));
    }

    loop(now) {
        if (!this.state.running) {
            this.animationFrameId = null;
            return;
        }

        // 保存动画帧ID
        this.animationFrameId = requestAnimationFrame((t) => this.loop(t));

        const dt = now - this.lastTime;
        this.lastTime = now;

        // 更新食物发光脉冲相位
        this.foodPulsePhase += this.foodPulseSpeed;

        if (!this.state.paused) {
            this.accumulatedTime += dt;
            while (this.accumulatedTime >= this.stepInterval) {
                this.update();
                this.accumulatedTime -= this.stepInterval;
            }
        }

        this.draw();
    }

    update() {
        // Process Input
        if (this.inputQueue.length > 0) {
            const next = this.inputQueue.shift();
            this.dx = next.dx;
            this.dy = next.dy;
        }

        const head = {
            x: this.snake[0].x + this.dx,
            y: this.snake[0].y + this.dy
        };

        // Wall Collision
        if (head.x < 0 || head.x >= this.tileCountX ||
            head.y < 0 || head.y >= this.tileCountY) {
            this.gameOver();
            return;
        }

        // Self Collision
        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        // Food Collision
        if (this.food && head.x === this.food.x && head.y === this.food.y) {
            this.eatFood();
        } else {
            this.snake.pop();
        }

        // 限制UI更新频率
        const now = performance.now();
        if (now - this.state.lastScoreUpdate > 100) {
            this.updateUI();
            this.state.lastScoreUpdate = now;
        }
    }

    /**
     * 处理吃食物逻辑
     */
    eatFood() {
        if (!this.food) return;

        const foodConfig = this.foodTypes[this.food.type];
        let points = foodConfig.points;

        // 神秘食物随机分数
        if (this.food.type === 'mystery') {
            points = Math.floor(Math.random() * 50) + 10;
        }

        const oldScore = this.state.score;
        this.state.score += points;

        // 触发分数动画
        this.animateScoreChange(oldScore, this.state.score);

        // 触发粒子效果
        const canvasRect = this.canvas.getBoundingClientRect();
        const foodX = this.food.x * this.gridSize + this.gridSize / 2;
        const foodY = this.food.y * this.gridSize + this.gridSize / 2;
        const screenX = canvasRect.left + foodX;
        const screenY = canvasRect.top + foodY;

        if (window.gameEffects && window.gameEffects.createFoodParticles) {
            window.gameEffects.createFoodParticles(screenX, screenY, foodConfig.color);
        }

        if (window.gameEffects && window.gameEffects.showFloatingScore) {
            window.gameEffects.showFloatingScore(screenX, screenY, points, foodConfig.color);
        }

        // 调整速度
        if (this.food.type !== 'normal') {
            this.stepInterval = Math.max(
                this.minStepInterval,
                Math.min(this.maxStepInterval, this.stepInterval * foodConfig.speed)
            );
        } else {
            // 普通食物轻微加速
            this.stepInterval = Math.max(this.minStepInterval, this.stepInterval * 0.99);
        }

        this.playHapticFeedback();

        // 检查游戏是否获胜（在生成新食物前）
        const totalCells = this.tileCountX * this.tileCountY;
        if (this.snake.length >= totalCells * 0.95) {
            this.gameWin();
            return;
        }

        this.spawnFood();
    }

    /**
     * 分数变化动画
     */
    animateScoreChange(oldScore, newScore) {
        const scoreElement = document.getElementById('score');

        // 添加缩放动画类
        scoreElement.classList.remove('score-pop');
        void scoreElement.offsetWidth; // 触发重排以重新启动动画
        scoreElement.classList.add('score-pop');

        // 数字滚动动画
        if (window.gameEffects && window.gameEffects.animateNumber) {
            window.gameEffects.animateNumber(scoreElement, newScore, 300);
        }

        // 移除动画类
        setTimeout(() => {
            scoreElement.classList.remove('score-pop');
        }, 300);
    }

    /**
     * 游戏获胜（蛇几乎填满整个屏幕）
     */
    gameWin() {
        // 防止重复调用
        if (this.state.gameOver) return;

        this.state.running = false;
        this.state.gameOver = true;

        // 取消动画帧
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // 更新最高分
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('snake_high', this.state.highScore.toString());
        }

        // 更新游戏结束界面
        document.getElementById('final-score').textContent = this.state.score;
        document.getElementById('final-length').textContent = this.snake.length;

        // 修改标题为获胜
        const gameOverScreen = document.getElementById('game-over-screen');
        const title = gameOverScreen.querySelector('h2');
        if (title) {
            title.innerHTML = '<i class="fas fa-trophy"></i> 恭喜获胜！';
        }

        this.showOverlay('game-over-screen');

        // 震动反馈
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 100]);
        }
    }

    gameOver() {
        // 防止重复调用
        if (this.state.gameOver) return;

        this.state.running = false;
        this.state.gameOver = true;

        // 取消动画帧
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // 更新最高分
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('snake_high', this.state.highScore.toString());
        }

        // 更新游戏结束界面
        document.getElementById('final-score').textContent = this.state.score;
        document.getElementById('final-length').textContent = this.snake.length;

        // 重置标题
        const gameOverScreen = document.getElementById('game-over-screen');
        const title = gameOverScreen.querySelector('h2');
        if (title) {
            title.innerHTML = '<i class="fas fa-skull-crossbones"></i> 游戏结束';
        }

        this.showOverlay('game-over-screen');

        // 震动反馈
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.state.score;
        document.getElementById('high-score').textContent = this.state.highScore;
        document.getElementById('length').textContent = this.snake.length;
        // 修正速度等级计算 - 速度越高，stepInterval越小
        const speedLevel = Math.max(1, Math.min(10, Math.floor((150 - this.stepInterval) / 11) + 1));
        document.getElementById('speed').textContent = speedLevel;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#020617';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid();

        // Draw food with pulse animation
        this.drawFood();

        // Draw snake with gradient colors
        this.drawSnake();
    }

    /**
     * 绘制网格（优化版本）
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        // 垂直线
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }

        // 水平线
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }

        this.ctx.stroke();
    }

    /**
     * 绘制食物 - 带发光脉冲动画
     */
    drawFood() {
        if (!this.food) return;

        const cx = this.food.x * this.gridSize + this.gridSize / 2;
        const cy = this.food.y * this.gridSize + this.gridSize / 2;
        const r = this.gridSize / 2 - 2;
        const foodConfig = this.foodTypes[this.food.type];

        // 计算脉冲效果
        const pulseIntensity = (Math.sin(this.foodPulsePhase) + 1) / 2; // 0 到 1
        const glowSize = 10 + pulseIntensity * 15; // 动态发光大小
        const outerGlowSize = glowSize + 10;

        // 绘制多层发光环
        // 外层发光
        const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, outerGlowSize);
        gradient.addColorStop(0, foodConfig.glowColor);
        gradient.addColorStop(0.5, foodConfig.glowColor.replace('0.8', '0.3'));
        gradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, outerGlowSize, 0, Math.PI * 2);
        this.ctx.fill();

        // 中层发光
        this.ctx.shadowColor = foodConfig.color;
        this.ctx.shadowBlur = glowSize;
        this.ctx.fillStyle = foodConfig.color;

        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
        this.ctx.fill();

        // 神秘食物添加闪烁效果
        if (this.food.type === 'mystery') {
            const flashIntensity = (Math.sin(this.foodPulsePhase * 2) + 1) / 2;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + flashIntensity * 0.5})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        // 绘制高光
        const highlightGradient = this.ctx.createRadialGradient(
            cx - r * 0.3, cy - r * 0.3, 0,
            cx, cy, r
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        highlightGradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = highlightGradient;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
    }

    /**
     * 绘制蛇 - 带平滑颜色渐变
     */
    drawSnake() {
        const snakeLength = this.snake.length;

        this.snake.forEach((segment, index) => {
            // 确保段在画布范围内
            if (segment.x < 0 || segment.x >= this.tileCountX ||
                segment.y < 0 || segment.y >= this.tileCountY) {
                return;
            }

            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;

            // 平滑颜色渐变 - 从蛇头到蛇尾
            // 蛇头: #34d399 (鲜绿色)
            // 蛇身渐变到: #10b981 (深绿色)
            const progress = index / snakeLength; // 0 (头) 到 1 (尾)

            // 使用HSL颜色空间实现平滑过渡
            // 蛇头: hue 158, saturation 80%, lightness 60%
            // 蛇尾: hue 158, saturation 70%, lightness 35%
            const hue = 158;
            const saturation = 80 - progress * 10; // 80% -> 70%
            const lightness = 60 - progress * 25; // 60% -> 35%
            const alpha = 1 - progress * 0.4; // 1 -> 0.6

            this.ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

            // 蛇头特殊处理
            if (index === 0) {
                this.ctx.fillStyle = '#34d399';
                this.ctx.shadowColor = 'rgba(52, 211, 153, 0.6)';
                this.ctx.shadowBlur = 12;

                // 绘制眼睛
                this.drawSnakeEyes(x, y);
            } else {
                // 蛇身微弱发光
                this.ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha * 0.3})`;
                this.ctx.shadowBlur = 4 - progress * 3; // 4 -> 1
            }

            // 绘制蛇身
            const padding = 2;
            const size = this.gridSize - padding * 2;
            this.drawRoundedRect(x + padding, y + padding, size, size, 4);

            this.ctx.shadowBlur = 0;
        });
    }

    /**
     * 绘制蛇的眼睛
     */
    drawSnakeEyes(x, y) {
        const eyeSize = 3;
        const eyeOffset = 5;

        let eye1X, eye1Y, eye2X, eye2Y;

        // 根据移动方向确定眼睛位置
        if (this.dx === 1) { // 向右
            eye1X = x + this.gridSize - eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + this.gridSize - eyeOffset;
            eye2Y = y + this.gridSize - eyeOffset;
        } else if (this.dx === -1) { // 向左
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + eyeOffset;
            eye2Y = y + this.gridSize - eyeOffset;
        } else if (this.dy === -1) { // 向上
            eye1X = x + eyeOffset;
            eye1Y = y + eyeOffset;
            eye2X = x + this.gridSize - eyeOffset;
            eye2Y = y + eyeOffset;
        } else { // 向下
            eye1X = x + eyeOffset;
            eye1Y = y + this.gridSize - eyeOffset;
            eye2X = x + this.gridSize - eyeOffset;
            eye2Y = y + this.gridSize - eyeOffset;
        }

        // 绘制眼睛
        this.ctx.fillStyle = '#020617';
        this.ctx.beginPath();
        this.ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        this.ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        this.ctx.fill();

        // 眼睛高光
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(eye1X + 1, eye1Y - 1, 1, 0, Math.PI * 2);
        this.ctx.arc(eye2X + 1, eye2Y - 1, 1, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * 绘制圆角矩形
     */
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    showOverlay(id) {
        // 保存当前焦点元素
        this.previousFocus = document.activeElement;

        // 隐藏所有覆盖层
        document.querySelectorAll('.game-overlay').forEach(el => {
            el.style.display = 'none';
            el.setAttribute('aria-hidden', 'true');
        });

        // 显示指定覆盖层
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.setAttribute('aria-hidden', 'false');

            // 聚焦到第一个可交互元素
            const focusable = overlay.querySelector('button');
            if (focusable) {
                setTimeout(() => focusable.focus(), 100);
            }
        }
    }

    hideOverlays() {
        document.querySelectorAll('.game-overlay').forEach(el => {
            el.style.display = 'none';
            el.setAttribute('aria-hidden', 'true');
        });
    }
}

// 初始化游戏
let gameInstance = null;

window.addEventListener('DOMContentLoaded', () => {
    gameInstance = new SnakeGame();
    window.game = gameInstance;
});

// 页面可见性API - 页面不可见时暂停游戏
document.addEventListener('visibilitychange', () => {
    if (gameInstance && document.hidden) {
        if (gameInstance.state.running && !gameInstance.state.paused) {
            gameInstance.togglePause();
        }
    }
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (gameInstance) {
        if (gameInstance.animationFrameId) {
            cancelAnimationFrame(gameInstance.animationFrameId);
        }
        if (gameInstance.resizeTimer) {
            clearTimeout(gameInstance.resizeTimer);
        }
    }
});
