/**
 * Minesweeper - Modern Class Implementation
 * Fully optimized version with bug fixes and performance improvements
 * Round 1: Enhanced interaction feedback - flag animation, number reveal, error marking, victory celebration
 */

class MinesweeperGame {
    constructor() {
        // DOM元素缓存
        this.boardElement = document.getElementById('game-board');
        this.timerElement = document.getElementById('timer');
        this.minesElement = document.getElementById('mine-count');
        this.smileBtn = document.getElementById('smile-icon');
        this.gameStatusElement = document.getElementById('game-status');
        this.statusMessageElement = document.querySelector('.status-message');
        this.touchHintElement = document.getElementById('touch-hint');

        // 游戏配置
        this.config = {
            beginner: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 16, cols: 30, mines: 99 }
        };

        // 移动端检测 - 更精确的检测
        this.isMobile = this.detectMobile();
        this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.lastClickTime = 0;
        this.lastClickCell = null;
        this.clickThrottleDelay = 150;
        this.longPressDelay = 450;
        this.touchMoved = false;

        // 动画配置
        this.animationsEnabled = true;

        // 游戏状态
        this.state = {
            difficulty: 'beginner',
            grid: [],
            gameState: 'ready',
            minesLeft: 10,
            time: 0,
            timerInterval: null,
            totalCells: 0,
            revealedCells: 0
        };

        // 音频上下文
        this.audioCtx = null;
        this.audioEnabled = true;

        // 双击检测
        this.lastDoubleClickTime = 0;
        this.doubleClickDelay = 300;

        // 烟花效果
        this.fireworksCanvas = null;
        this.fireworksCtx = null;
        this.fireworksAnimationId = null;

        this.init();
    }

    /**
     * 检测移动设备
     */
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
               (window.innerWidth <= 768);
    }

    init() {
        this.bindEvents();
        this.reset();
    }

    /**
     * 初始化音频上下文（延迟初始化）
     */
    initAudio() {
        if (this.audioCtx) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch (e) {
            this.audioEnabled = false;
        }
    }

    /**
     * 播放提示音
     */
    beep(freq, type, duration) {
        if (!this.audioEnabled || !this.audioCtx) return;

        try {
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = type;
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + duration);
            osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {
            // 静默失败
        }
    }

    bindEvents() {
        // 重新开始按钮
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.reset());
        }

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // 难度选择器
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleDifficultyChange(btn));

            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        });

        // 页面可见性变化时暂停/恢复计时器
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    /**
     * 键盘事件处理
     */
    handleKeydown(e) {
        if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;

        const focusedCell = document.activeElement;
        if (!focusedCell || !focusedCell.classList.contains('cell')) return;

        const r = parseInt(focusedCell.dataset.r);
        const c = parseInt(focusedCell.dataset.c);

        if (e.key === 'f' || e.key === 'F') {
            if (!focusedCell.classList.contains('revealed')) {
                this.handleRightClick(r, c);
            }
        }

        if (e.key === ' ') {
            if (!focusedCell.classList.contains('revealed')) {
                this.handleClick(r, c);
                e.preventDefault();
            }
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            this.navigateCell(r, c, e.key);
        }
    }

    /**
     * 单元格键盘导航
     */
    navigateCell(r, c, direction) {
        const cfg = this.config[this.state.difficulty];
        let newR = r, newC = c;

        switch (direction) {
            case 'ArrowUp': newR = Math.max(0, r - 1); break;
            case 'ArrowDown': newR = Math.min(cfg.rows - 1, r + 1); break;
            case 'ArrowLeft': newC = Math.max(0, c - 1); break;
            case 'ArrowRight': newC = Math.min(cfg.cols - 1, c + 1); break;
        }

        const newCell = this.state.grid[newR]?.[newC]?.element;
        if (newCell) {
            newCell.focus();
        }
    }

    /**
     * 难度变更处理
     */
    handleDifficultyChange(btn) {
        document.querySelectorAll('.difficulty-btn').forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');
        this.state.difficulty = btn.dataset.difficulty;
        this.reset();
    }

    /**
     * 页面可见性变化处理
     */
    handleVisibilityChange() {
        if (document.hidden && this.state.gameState === 'playing') {
            // 页面隐藏时可以暂停计时器（可选）
        }
    }

    /**
     * 控制移动端提示显示
     */
    toggleMobileHint(show) {
        if (this.touchHintElement) {
            this.touchHintElement.style.display = show ? 'flex' : 'none';
        }
    }

    /**
     * 重置游戏
     */
    reset() {
        this.stopTimer();
        this.stopFireworks();
        this.state.time = 0;
        this.state.gameState = 'ready';
        this.updateTimer();

        const cfg = this.config[this.state.difficulty];
        this.state.minesLeft = cfg.mines;
        this.state.totalCells = cfg.rows * cfg.cols;
        this.state.revealedCells = 0;
        this.updateMines();

        if (this.smileBtn) this.smileBtn.className = 'fas fa-smile';

        if (this.statusMessageElement) {
            this.statusMessageElement.textContent = '游戏进行中...';
            this.gameStatusElement.className = 'game-status';
        }

        this.toggleMobileHint(this.isMobile);

        this.boardElement.className = `game-board ${this.state.difficulty}`;
        this.boardElement.innerHTML = '';

        // 创建网格
        this.state.grid = [];
        for (let r = 0; r < cfg.rows; r++) {
            const row = [];
            for (let c = 0; c < cfg.cols; c++) {
                const cell = this.createCell(r, c);
                this.boardElement.appendChild(cell);
                row.push({
                    element: cell,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    adjacent: 0
                });
            }
            this.state.grid.push(row);
        }
    }

    /**
     * 创建单个格子元素
     */
    createCell(r, c) {
        const cell = document.createElement('button');
        cell.className = 'cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.setAttribute('tabindex', '0');
        cell.setAttribute('role', 'button');
        cell.setAttribute('aria-label', `行${r + 1}列${c + 1}，未翻开`);

        cell.style.cssText = '';

        this.attachCellEvents(cell, r, c);

        return cell;
    }

    /**
     * 为格子绑定事件
     */
    attachCellEvents(cell, r, c) {
        // 鼠标事件 - 桌面端
        cell.addEventListener('mousedown', (e) => {
            if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;
            if (e.button === 0 && !this.isTouch) {
                if (this.smileBtn) this.smileBtn.className = 'fas fa-surprise';
            }
        });

        cell.addEventListener('mouseup', (e) => {
            if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;
            if (this.smileBtn) this.smileBtn.className = 'fas fa-smile';

            if (e.button === 0 && !this.isTouch) {
                const now = Date.now();
                const isDoubleClick = (now - this.lastDoubleClickTime) < this.doubleClickDelay &&
                                     this.lastClickCell === cell;

                if (isDoubleClick && cell.classList.contains('revealed') && cell.textContent) {
                    this.handleDoubleClick(r, c);
                } else {
                    this.handleClick(r, c);
                }

                this.lastDoubleClickTime = now;
                this.lastClickCell = cell;
            }
        });

        cell.addEventListener('mouseleave', () => {
            if (this.smileBtn && this.state.gameState === 'playing') {
                this.smileBtn.className = 'fas fa-smile';
            }
        });

        // 右键菜单事件
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.handleRightClick(r, c);
        });

        // 触摸事件 - 移动端
        if (this.isTouch) {
            cell.addEventListener('touchstart', (e) => {
                if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;

                if (e.touches.length === 1) {
                    this.touchStartTime = Date.now();
                    this.touchStartPos = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY
                    };
                    this.touchMoved = false;

                    if (this.smileBtn) this.smileBtn.className = 'fas fa-surprise';
                }
            }, { passive: true });

            cell.addEventListener('touchmove', (e) => {
                if (e.touches.length === 1) {
                    const dx = Math.abs(e.touches[0].clientX - this.touchStartPos.x);
                    const dy = Math.abs(e.touches[0].clientY - this.touchStartPos.y);
                    if (dx > 10 || dy > 10) {
                        this.touchMoved = true;
                    }
                }
            }, { passive: true });

            cell.addEventListener('touchend', (e) => {
                if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;

                if (this.smileBtn) this.smileBtn.className = 'fas fa-smile';

                if (this.touchMoved) return;

                const touchDuration = Date.now() - this.touchStartTime;

                if (touchDuration >= this.longPressDelay) {
                    this.handleRightClick(r, c);
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                } else if (touchDuration > 50) {
                    this.handleClick(r, c);
                }
            }, { passive: true });
        }
    }

    /**
     * 处理左键点击
     */
    handleClick(r, c) {
        const now = Date.now();
        if (now - this.lastClickTime < this.clickThrottleDelay) {
            return;
        }
        this.lastClickTime = now;

        this.initAudio();

        if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;

        const cell = this.state.grid[r][c];
        if (cell.isFlagged || cell.isRevealed) return;

        // 首次点击开始游戏
        if (this.state.gameState === 'ready') {
            this.state.gameState = 'playing';
            this.placeMines(r, c);
            this.startTimer();
        }

        this.reveal(r, c);
    }

    /**
     * 处理右键点击（标记旗帜）- 增强版带动画
     */
    handleRightClick(r, c) {
        if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;

        this.initAudio();

        const cell = this.state.grid[r][c];
        if (cell.isRevealed) return;

        const isPlacing = !cell.isFlagged;
        cell.isFlagged = isPlacing;

        if (isPlacing) {
            // 添加标记动画
            cell.element.classList.add('flagging');
            cell.element.setAttribute('aria-label', `行${r + 1}列${c + 1}，已标记旗帜`);
            this.state.minesLeft--;
            this.beep(600, 'triangle', 0.05);

            // 动画结束后移除临时类
            setTimeout(() => {
                cell.element.classList.add('flagged');
                cell.element.classList.remove('flagging');
            }, 50);
        } else {
            // 移除标记动画
            cell.element.classList.add('unflagging');
            cell.element.setAttribute('aria-label', `行${r + 1}列${c + 1}，未翻开`);
            this.state.minesLeft++;
            this.beep(500, 'triangle', 0.05);

            setTimeout(() => {
                cell.element.classList.remove('flagged', 'unflagging');
            }, 300);
        }
        this.updateMines();
    }

    /**
     * 处理双击已翻开的数字格子
     */
    handleDoubleClick(r, c) {
        if (this.state.gameState !== 'playing') return;

        const cell = this.state.grid[r][c];
        if (!cell.isRevealed || cell.adjacent === 0) return;

        const cfg = this.config[this.state.difficulty];
        let flagCount = 0;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols) {
                    if (this.state.grid[nr][nc].isFlagged) {
                        flagCount++;
                    }
                }
            }
        }

        if (flagCount === cell.adjacent) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols) {
                        const neighbor = this.state.grid[nr][nc];
                        if (!neighbor.isRevealed && !neighbor.isFlagged) {
                            this.reveal(nr, nc);
                        }
                    }
                }
            }
        }
    }

    /**
     * 放置地雷
     */
    placeMines(safeR, safeC) {
        const cfg = this.config[this.state.difficulty];
        let placed = 0;

        while (placed < cfg.mines) {
            const r = Math.floor(Math.random() * cfg.rows);
            const c = Math.floor(Math.random() * cfg.cols);

            if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;

            if (!this.state.grid[r][c].isMine) {
                this.state.grid[r][c].isMine = true;
                placed++;
            }
        }

        for (let r = 0; r < cfg.rows; r++) {
            for (let c = 0; c < cfg.cols; c++) {
                if (!this.state.grid[r][c].isMine) {
                    this.state.grid[r][c].adjacent = this.countAdjacentMines(r, c);
                }
            }
        }
    }

    /**
     * 计算周围地雷数量
     */
    countAdjacentMines(r, c) {
        const cfg = this.config[this.state.difficulty];
        let count = 0;

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols) {
                    if (this.state.grid[nr][nc].isMine) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    /**
     * 翻开格子 - 增强版带数字渐变动画
     */
    reveal(r, c) {
        const cell = this.state.grid[r][c];
        if (cell.isRevealed || cell.isFlagged) return;

        cell.isRevealed = true;
        cell.element.classList.add('revealed');
        this.state.revealedCells++;

        if (cell.isMine) {
            cell.element.classList.add('mine', 'exploded');
            cell.element.setAttribute('aria-label', `行${r + 1}列${c + 1}，地雷`);
            cell.element.textContent = '';
            this.lose();
            return;
        }

        this.beep(800, 'sine', 0.03);

        if (cell.adjacent > 0) {
            // 添加数字渐变动画
            this.animateNumberReveal(cell.element, cell.adjacent);
        } else {
            cell.element.setAttribute('aria-label', `行${r + 1}列${c + 1}，安全`);
            this.floodFill(r, c);
        }

        this.checkWin();
    }

    /**
     * 数字揭示动画 - 从0渐变到目标数字
     */
    animateNumberReveal(cellElement, targetNumber) {
        if (!this.animationsEnabled) {
            cellElement.textContent = targetNumber;
            cellElement.classList.add(`number-${targetNumber}`);
            cellElement.setAttribute('aria-label', `行${cellElement.dataset.r}列${cellElement.dataset.c}，周围${targetNumber}个地雷`);
            return;
        }

        const duration = 400;
        const steps = 8;
        const stepDuration = duration / steps;
        let currentStep = 0;

        cellElement.classList.add('number-animating');

        const animate = () => {
            if (currentStep < steps) {
                const displayNumber = Math.floor((targetNumber / steps) * (currentStep + 1));
                cellElement.textContent = displayNumber;
                cellElement.style.opacity = 0.5 + (0.5 * (currentStep + 1) / steps);
                currentStep++;
                setTimeout(animate, stepDuration);
            } else {
                cellElement.textContent = targetNumber;
                cellElement.classList.add(`number-${targetNumber}`);
                cellElement.classList.remove('number-animating');
                cellElement.style.opacity = '';
                cellElement.setAttribute('aria-label', `行${cellElement.dataset.r}列${cellElement.dataset.c}，周围${targetNumber}个地雷`);
            }
        };

        animate();
    }

    /**
     * 洪水填充算法
     */
    floodFill(startR, startC) {
        const cfg = this.config[this.state.difficulty];
        const queue = [{ r: startR, c: startC }];
        let head = 0;
        let delay = 0;

        while (head < queue.length) {
            const curr = queue[head++];

            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = curr.r + dr, nc = curr.c + dc;
                    if (nr >= 0 && nr < cfg.rows && nc >= 0 && nc < cfg.cols) {
                        const neighbor = this.state.grid[nr][nc];
                        if (!neighbor.isRevealed && !neighbor.isFlagged) {
                            neighbor.isRevealed = true;
                            neighbor.element.classList.add('revealed');
                            this.state.revealedCells++;

                            if (neighbor.adjacent === 0) {
                                neighbor.element.setAttribute('aria-label', `行${nr + 1}列${nc + 1}，安全`);
                                queue.push({ r: nr, c: nc });
                            } else {
                                // 延迟显示数字以创建波纹效果
                                const cellInfo = { element: neighbor.element, number: neighbor.adjacent, r: nr, c: nc };
                                setTimeout(() => {
                                    this.animateNumberReveal(cellInfo.element, cellInfo.number);
                                    cellInfo.element.setAttribute('aria-label', `行${cellInfo.r + 1}列${cellInfo.c + 1}，周围${cellInfo.number}个地雷`);
                                }, delay);
                                delay += 20;
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * 游戏失败 - 增强版带闪烁动画
     */
    lose() {
        this.state.gameState = 'lost';
        this.stopTimer();

        if (this.smileBtn) this.smileBtn.className = 'fas fa-dizzy';
        this.beep(100, 'sawtooth', 0.5);

        if (this.statusMessageElement) {
            this.statusMessageElement.textContent = '游戏失败！点击笑脸重新开始';
            this.gameStatusElement.classList.remove('won');
            this.gameStatusElement.classList.add('lost');
        }

        // 显示所有地雷和错误标记
        this.state.grid.forEach((row, r) => {
            row.forEach((cell, c) => {
                if (cell.isMine && !cell.isFlagged) {
                    setTimeout(() => {
                        cell.element.classList.add('revealed', 'mine', 'exploded');
                        cell.element.setAttribute('aria-label', `行${r + 1}列${c + 1}，地雷`);
                    }, Math.random() * 500);
                } else if (!cell.isMine && cell.isFlagged) {
                    // 错误标记 - 增强闪烁效果
                    setTimeout(() => {
                        cell.element.classList.add('wrong-flag', 'error-flash');
                    }, 600 + Math.random() * 300);
                }
            });
        });
    }

    /**
     * 检查游戏胜利 - 增强版带庆祝动画
     */
    checkWin() {
        const cfg = this.config[this.state.difficulty];
        const safeCells = cfg.rows * cfg.cols - cfg.mines;

        if (this.state.revealedCells === safeCells) {
            this.state.gameState = 'won';
            this.stopTimer();

            if (this.smileBtn) this.smileBtn.className = 'fas fa-sunglasses';

            // 播放胜利音效序列
            this.beep(523, 'sine', 0.15);
            setTimeout(() => this.beep(659, 'sine', 0.15), 150);
            setTimeout(() => this.beep(784, 'sine', 0.2), 300);
            setTimeout(() => this.beep(1047, 'sine', 0.3), 500);

            if (this.statusMessageElement) {
                this.statusMessageElement.textContent = `恭喜胜利！用时 ${this.state.time} 秒`;
                this.gameStatusElement.classList.remove('lost');
                this.gameStatusElement.classList.add('won');
            }

            // 自动标记所有剩余地雷
            this.state.grid.forEach(row => row.forEach(cell => {
                if (cell.isMine && !cell.isFlagged) {
                    cell.isFlagged = true;
                    cell.element.classList.add('flagged', 'auto-flagged');
                }
            }));
            this.state.minesLeft = 0;
            this.updateMines();

            // 启动庆祝动画
            setTimeout(() => {
                this.startVictoryCelebration();
            }, 600);
        }
    }

    /**
     * 胜利庆祝 - 烟花效果
     */
    startVictoryCelebration() {
        // 创建烟花画布
        this.createFireworksCanvas();
        this.launchFireworks();
    }

    /**
     * 创建烟花画布
     */
    createFireworksCanvas() {
        if (this.fireworksCanvas) return;

        this.fireworksCanvas = document.createElement('canvas');
        this.fireworksCanvas.id = 'fireworks-canvas';
        this.fireworksCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9998;
        `;

        this.fireworksCtx = this.fireworksCanvas.getContext('2d');
        this.resizeFireworksCanvas();
        document.body.appendChild(this.fireworksCanvas);

        window.addEventListener('resize', () => this.resizeFireworksCanvas());
    }

    /**
     * 调整烟花画布大小
     */
    resizeFireworksCanvas() {
        if (this.fireworksCanvas) {
            this.fireworksCanvas.width = window.innerWidth;
            this.fireworksCanvas.height = window.innerHeight;
        }
    }

    /**
     * 发射烟花
     */
    launchFireworks() {
        const particles = [];
        const colors = [
            '#ff0000', '#ff7f00', '#ffff00', '#00ff00',
            '#0000ff', '#8b00ff', '#ff1493', '#00ced1',
            '#ffd700', '#ff4500', '#32cd32', '#ff69b4'
        ];

        // 烟花粒子类
        class Particle {
            constructor(x, y, color) {
                this.x = x;
                this.y = y;
                this.color = color;
                const angle = Math.random() * Math.PI * 2;
                const velocity = 2 + Math.random() * 6;
                this.vx = Math.cos(angle) * velocity;
                this.vy = Math.sin(angle) * velocity;
                this.alpha = 1;
                this.decay = 0.008 + Math.random() * 0.012;
                this.gravity = 0.08;
                this.size = 2 + Math.random() * 3;
            }

            update() {
                this.vx *= 0.98;
                this.vy *= 0.98;
                this.vy += this.gravity;
                this.x += this.vx;
                this.y += this.vy;
                this.alpha -= this.decay;
            }

            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();

                // 发光效果
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.restore();
            }

            isDead() {
                return this.alpha <= 0;
            }
        }

        // 五彩纸屑类
        class Confetti {
            constructor() {
                this.x = Math.random() * this.fireworksCanvas.width;
                this.y = -20;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.size = 5 + Math.random() * 10;
                this.speedY = 2 + Math.random() * 3;
                this.speedX = -2 + Math.random() * 4;
                this.rotation = Math.random() * 360;
                this.rotationSpeed = -5 + Math.random() * 10;
                this.alpha = 1;
            }

            update() {
                this.y += this.speedY;
                this.x += this.speedX;
                this.rotation += this.rotationSpeed;
                this.speedX *= 0.99;
            }

            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation * Math.PI / 180);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.alpha;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }

            isDead() {
                return this.y > this.fireworksCanvas.height + 20;
            }
        }

        // 创建爆炸效果
        const createExplosion = (x, y) => {
            const particleCount = 60 + Math.floor(Math.random() * 40);
            const color = colors[Math.floor(Math.random() * colors.length)];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(x, y, color));
            }
        };

        // 初始爆炸
        const initialExplosions = 5;
        for (let i = 0; i < initialExplosions; i++) {
            setTimeout(() => {
                const x = 100 + Math.random() * (this.fireworksCanvas.width - 200);
                const y = 100 + Math.random() * (this.fireworksCanvas.height / 2);
                createExplosion(x, y);
            }, i * 300);
        }

        let frameCount = 0;
        let confettiSpawned = false;

        const animate = () => {
            if (!this.fireworksCtx) return;

            this.fireworksCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.fireworksCtx.fillRect(0, 0, this.fireworksCanvas.width, this.fireworksCanvas.height);

            // 每隔一段时间添加新的爆炸
            frameCount++;
            if (frameCount % 60 === 0 && frameCount < 480) {
                const x = 100 + Math.random() * (this.fireworksCanvas.width - 200);
                const y = 100 + Math.random() * (this.fireworksCanvas.height / 2);
                createExplosion(x, y);
            }

            // 添加五彩纸屑
            if (frameCount > 180 && frameCount < 600 && frameCount % 10 === 0) {
                for (let i = 0; i < 3; i++) {
                    particles.push(new Confetti());
                }
            }

            // 更新和绘制粒子
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.update();
                p.draw(this.fireworksCtx);
                if (p.isDead()) {
                    particles.splice(i, 1);
                }
            }

            // 继续动画或停止
            if (frameCount < 720 || particles.length > 0) {
                this.fireworksAnimationId = requestAnimationFrame(animate);
            } else {
                this.stopFireworks();
            }
        };

        animate();
    }

    /**
     * 停止烟花动画
     */
    stopFireworks() {
        if (this.fireworksAnimationId) {
            cancelAnimationFrame(this.fireworksAnimationId);
            this.fireworksAnimationId = null;
        }
        if (this.fireworksCanvas && this.fireworksCanvas.parentNode) {
            this.fireworksCanvas.parentNode.removeChild(this.fireworksCanvas);
        }
        this.fireworksCanvas = null;
        this.fireworksCtx = null;
    }

    /**
     * 启动计时器
     */
    startTimer() {
        this.stopTimer();
        this.state.timerInterval = setInterval(() => {
            this.state.time++;
            this.updateTimer();
        }, 1000);
    }

    /**
     * 停止计时器
     */
    stopTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    }

    /**
     * 更新计时器显示
     */
    updateTimer() {
        if (this.timerElement) {
            this.timerElement.textContent = Math.min(999, this.state.time).toString().padStart(3, '0');
        }
    }

    /**
     * 更新地雷计数显示
     */
    updateMines() {
        if (this.minesElement) {
            this.minesElement.textContent = Math.max(-99, Math.min(999, this.state.minesLeft)).toString().padStart(3, '0');
        }
    }
}

// 游戏初始化
window.addEventListener('DOMContentLoaded', () => {
    window.game = new MinesweeperGame();
});
