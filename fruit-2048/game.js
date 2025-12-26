/**
 * Fruit 2048 - 完整实现，包含现代 UI/UX 交互增强
 * 第1轮优化：缩放弹跳动画、连击检测系统、新水果出现动画、分数飘字效果
 */

class FruitGame {
    constructor() {
        // 水果等级定义 - 必须在最前面定义，因为后续代码依赖它
        this.fruits = [
            { level: 1, emoji: "🍎", name: "苹果", score: 2, color: "#ef4444" },
            { level: 2, emoji: "🍊", name: "橙子", score: 4, color: "#f59e0b" },
            { level: 3, emoji: "🍇", name: "葡萄", score: 8, color: "#10b981" },
            { level: 4, emoji: "🍓", name: "草莓", score: 16, color: "#3b82f6" },
            { level: 5, emoji: "🍉", name: "西瓜", score: 32, color: "#8b5cf6" },
            { level: 6, emoji: "🍍", name: "菠萝", score: 64, color: "#ec4899" },
            { level: 7, emoji: "🥭", name: "芒果", score: 128, color: "#f97316" },
            { level: 8, emoji: "🥝", name: "猕猴桃", score: 256, color: "#84cc16" },
            { level: 9, emoji: "🍒", name: "樱桃", score: 512, color: "#dc2626" },
            { level: 10, emoji: "🍑", name: "桃子", score: 1024, color: "#fbbf24" }
        ];

        this.gridSize = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('fruit2048_best') || 0);
        this.gameOver = false;
        this.soundEnabled = true;
        this.nextFruit = this.getRandomBasicFruit();

        // 连击系统
        this.comboCount = 0;
        this.comboTimer = null;
        this.comboTimeout = 2000; // 2秒内连续合并才算连击

        // 音频上下文 - 单例模式，避免重复创建
        this.audioContext = null;
        this.previousScore = 0;
        this.lastTouchEnd = 0;

        // DOM元素引用
        this.elements = {
            board: document.getElementById('game-board'),
            score: document.getElementById('current-score'),
            best: document.getElementById('best-score'),
            nextFruit: document.getElementById('next-fruit'),
            status: document.getElementById('game-status'),
            statusMessage: document.querySelector('.status-message'),
            restartBtn: document.getElementById('restart-btn'),
            instructionsBtn: document.getElementById('instructions-btn'),
            soundToggle: document.getElementById('sound-toggle'),
            difficulty: document.getElementById('difficulty'),
            instructionsModal: document.getElementById('instructions-modal'),
            instructionsClose: document.getElementById('instructions-close'),
            gameOverModal: document.getElementById('game-over-modal'),
            finalScore: document.getElementById('final-score'),
            bestScoreDisplay: document.getElementById('best-score-display'),
            resultMessage: document.getElementById('result-message'),
            playAgainBtn: document.getElementById('play-again-btn'),
            shareBtn: document.getElementById('share-btn'),
            mobileControls: document.getElementById('mobile-controls'),
            mobileBtns: document.querySelectorAll('.mobile-btn'),
            creditsLink: document.getElementById('credits-link')
        };

        // 初始化
        this.init();
    }

    init() {
        // 确保DOM元素已正确加载
        this.validateElements();

        this.reset();
        this.bindEvents();
        this.render();
        this.updateUI();
    }

    /**
     * 验证所有必需的DOM元素是否存在
     */
    validateElements() {
        const requiredElements = ['board', 'score', 'best'];
        const missing = [];

        requiredElements.forEach(key => {
            if (!this.elements[key]) {
                missing.push(key);
            }
        });

        if (missing.length > 0) {
            console.error('缺少必需的DOM元素:', missing);
            throw new Error(`游戏初始化失败：缺少元素 ${missing.join(', ')}`);
        }
    }

    reset() {
        // 重置游戏状态
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
        this.score = 0;
        this.gameOver = false;
        this.nextFruit = this.getRandomBasicFruit();
        this.previousScore = 0;

        // 重置连击系统
        this.comboCount = 0;
        if (this.comboTimer) {
            clearTimeout(this.comboTimer);
            this.comboTimer = null;
        }

        // 添加初始水果
        this.addRandomFruit();
        this.addRandomFruit();

        // 关闭模态框
        if (this.elements.instructionsModal) this.elements.instructionsModal.classList.remove('active');
        if (this.elements.gameOverModal) this.elements.gameOverModal.classList.remove('active');

        // 更新UI
        this.updateUI();

        // 播放重置音效
        if (this.soundEnabled) this.playSound('reset');
    }

    bindEvents() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (this.gameOver && e.key !== 'Enter' && e.key !== 'r' && e.key !== 'R') return;

            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move('right');
                    break;
                case 'r':
                case 'R':
                    this.reset();
                    break;
                case 'Enter':
                    if (this.gameOver && this.elements.gameOverModal && this.elements.gameOverModal.classList.contains('active')) {
                        this.reset();
                    }
                    break;
                case 'Escape':
                    if (this.elements.instructionsModal && this.elements.instructionsModal.classList.contains('active')) {
                        this.elements.instructionsModal.classList.remove('active');
                    }
                    break;
            }
        });

        // 按钮事件绑定
        if (this.elements.restartBtn) {
            this.elements.restartBtn.addEventListener('click', () => {
                this.playHapticFeedback();
                this.reset();
            });
        }

        if (this.elements.instructionsBtn) {
            this.elements.instructionsBtn.addEventListener('click', () => {
                this.playHapticFeedback();
                if (this.elements.instructionsModal) {
                    this.elements.instructionsModal.classList.add('active');
                }
            });
        }

        if (this.elements.instructionsClose) {
            this.elements.instructionsClose.addEventListener('click', () => {
                this.playHapticFeedback();
                if (this.elements.instructionsModal) {
                    this.elements.instructionsModal.classList.remove('active');
                }
            });
        }

        if (this.elements.soundToggle) {
            this.elements.soundToggle.addEventListener('click', () => {
                this.playHapticFeedback();
                this.toggleSound();
            });
        }

        if (this.elements.playAgainBtn) {
            this.elements.playAgainBtn.addEventListener('click', () => {
                this.playHapticFeedback();
                this.reset();
            });
        }

        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', () => {
                this.playHapticFeedback();
                this.shareScore();
            });
        }

        // Footer 游戏说明链接
        if (this.elements.creditsLink) {
            this.elements.creditsLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.playHapticFeedback();
                if (this.elements.instructionsModal) {
                    this.elements.instructionsModal.classList.add('active');
                }
            });
        }

        // 难度选择器（预留功能）
        if (this.elements.difficulty) {
            this.elements.difficulty.addEventListener('change', (e) => {
                console.log('难度选择:', e.target.value);
                // 可以在这里添加难度相关的逻辑
                // 比如：改变新水果的概率分布
            });
        }

        // 触摸支持 - 滑动操作
        let touchStart = { x: 0, y: 0 };
        let isTouchMove = false;

        if (this.elements.board) {
            this.elements.board.addEventListener('touchstart', e => {
                touchStart.x = e.touches[0].clientX;
                touchStart.y = e.touches[0].clientY;
                isTouchMove = false;
            }, { passive: true });

            this.elements.board.addEventListener('touchmove', e => {
                isTouchMove = true;
            }, { passive: true });

            this.elements.board.addEventListener('touchend', e => {
                if (this.gameOver || !isTouchMove) return;

                const touchEnd = e.changedTouches[0];
                const dx = touchEnd.clientX - touchStart.x;
                const dy = touchEnd.clientY - touchStart.y;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                // 最小滑动距离阈值（稍微降低以提高灵敏度）
                if (Math.max(absDx, absDy) > 20) {
                    // 滑动时提供触觉反馈
                    this.playHapticFeedback();
                    if (absDx > absDy) {
                        this.move(dx > 0 ? 'right' : 'left');
                    } else {
                        this.move(dy > 0 ? 'down' : 'up');
                    }
                }
            });
        }

        // 移动端按钮控制 - 增强的触摸事件处理
        if (this.elements.mobileBtns) {
            this.elements.mobileBtns.forEach(btn => {
                // 触摸事件 - 使用passive: false以允许preventDefault
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (this.gameOver) return;
                    btn.classList.add('active');
                    this.playHapticFeedback();
                    const direction = btn.getAttribute('data-direction');
                    this.move(direction);
                }, { passive: false });

                btn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    btn.classList.remove('active');
                }, { passive: false });

                // 桌面点击支持（保留）
                btn.addEventListener('click', (e) => {
                    if (this.gameOver) return;
                    this.playHapticFeedback();
                    const direction = btn.getAttribute('data-direction');
                    this.move(direction);
                });
            });
        }

        // 模态框背景点击关闭
        if (this.elements.instructionsModal) {
            this.elements.instructionsModal.addEventListener('click', (e) => {
                if (e.target === this.elements.instructionsModal) {
                    this.elements.instructionsModal.classList.remove('active');
                }
            });
        }

        if (this.elements.gameOverModal) {
            this.elements.gameOverModal.addEventListener('click', (e) => {
                if (e.target === this.elements.gameOverModal) {
                    this.elements.gameOverModal.classList.remove('active');
                }
            });
        }

        // 防止移动端双击缩放
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - this.lastTouchEnd <= 300) {
                e.preventDefault();
            }
            this.lastTouchEnd = now;
        }, { passive: false });
    }

    /**
     * 触觉反馈（如果设备支持）
     * 参考贪吃蛇游戏实现
     */
    playHapticFeedback() {
        if ('vibrate' in navigator && this.soundEnabled) {
            navigator.vibrate(10);
        }
    }

    getRandomBasicFruit() {
        // 返回基本水果（苹果或橙子）
        const basicFruits = this.fruits.slice(0, 2);
        return {...basicFruits[Math.floor(Math.random() * basicFruits.length)]};
    }

    addRandomFruit() {
        const emptyCells = [];
        for(let r = 0; r < this.gridSize; r++) {
            for(let c = 0; c < this.gridSize; c++) {
                if(!this.grid[r][c]) emptyCells.push({r, c});
            }
        }

        if(emptyCells.length > 0) {
            const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = {
                ...this.nextFruit,
                id: Date.now() + Math.random(),
                isNew: true  // 标记为新水果，用于弹出动画
            };

            // 生成下一个水果
            this.nextFruit = this.getRandomBasicFruit();
            this.updateNextFruit();

            // 播放放置音效
            if (this.soundEnabled) this.playSound('place');
        }
    }

    updateNextFruit() {
        if (this.elements.nextFruit) {
            this.elements.nextFruit.textContent = this.nextFruit.emoji;
            this.elements.nextFruit.setAttribute('aria-label', `下一个水果：${this.nextFruit.name}`);
        }
    }

    /**
     * 显示连击提示
     */
    showCombo(comboLevel) {
        // 移除旧的连击显示
        const oldCombo = this.elements.board.querySelector('.combo-display');
        if (oldCombo) oldCombo.remove();

        const comboDisplay = document.createElement('div');
        comboDisplay.className = 'combo-display';

        const comboText = document.createElement('div');
        comboText.className = 'combo-text';
        comboText.textContent = 'Combo!';

        const comboNumber = document.createElement('div');
        comboNumber.className = 'combo-number';
        comboNumber.textContent = `x${comboLevel}`;

        comboDisplay.appendChild(comboText);
        comboDisplay.appendChild(comboNumber);
        this.elements.board.appendChild(comboDisplay);

        // 动画结束后移除元素
        setTimeout(() => {
            if (comboDisplay.parentNode) {
                comboDisplay.remove();
            }
        }, 800);
    }

    /**
     * 显示分数飘字效果
     */
    showFloatingScore(x, y, points, isBonus = false) {
        const floatingScore = document.createElement('div');

        // 根据分数大小确定样式
        let sizeClass = 'small';
        if (points >= 512) sizeClass = 'extra-large';
        else if (points >= 128) sizeClass = 'large';
        else if (points >= 32) sizeClass = 'medium';

        if (isBonus) {
            floatingScore.className = 'combo-bonus-score';
            floatingScore.textContent = `+${points} 连击加成!`;
        } else {
            floatingScore.className = `floating-score ${sizeClass}`;
            floatingScore.textContent = `+${points}`;
        }

        // 设置位置
        floatingScore.style.left = `${x}px`;
        floatingScore.style.top = `${y}px`;

        document.body.appendChild(floatingScore);

        // 动画结束后移除元素
        setTimeout(() => {
            if (floatingScore.parentNode) {
                floatingScore.remove();
            }
        }, isBonus ? 1200 : 1000);
    }

    /**
     * 重置连击计时器
     */
    resetComboTimer() {
        if (this.comboTimer) {
            clearTimeout(this.comboTimer);
        }
        this.comboTimer = setTimeout(() => {
            // 连击超时，重置连击计数
            if (this.comboCount > 0) {
                console.log(`连击结束！最高连击: x${this.comboCount}`);
            }
            this.comboCount = 0;
        }, this.comboTimeout);
    }

    move(direction) {
        let moved = false;
        let mergeCount = 0;  // 本次移动的合并数量
        let mergeInfo = [];  // 存储合并信息用于分数飘字

        // 旋转网格到标准方向（左移动）
        const rotateGrid = (grid) => {
            const newGrid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
            for(let r = 0; r < this.gridSize; r++) {
                for(let c = 0; c < this.gridSize; c++) {
                    newGrid[c][this.gridSize - 1 - r] = grid[r][c];
                }
            }
            return newGrid;
        };

        // 标准化方向
        let rotations = 0;
        if (direction === 'up') rotations = 3;
        else if (direction === 'right') rotations = 2;
        else if (direction === 'down') rotations = 1;

        // 应用旋转
        for(let i = 0; i < rotations; i++) this.grid = rotateGrid(this.grid);

        // 处理左移动
        for(let r = 0; r < this.gridSize; r++) {
            const row = this.grid[r].filter(cell => cell !== null);
            const newRow = [];

            while(row.length > 0) {
                if(row.length >= 2 && row[0].level === row[1].level) {
                    // 合并水果
                    const merged = row.shift();
                    row.shift(); // 移除第二个水果
                    const nextLevel = Math.min(merged.level + 1, this.fruits.length);
                    const nextFruit = this.fruits[nextLevel - 1];

                    const mergedCell = {
                        ...nextFruit,
                        id: Date.now() + Math.random(),
                        isMerge: true,  // 标记为合并，用于弹跳动画
                        mergeRow: r,
                        mergeCol: newRow.length
                    };

                    newRow.push(mergedCell);

                    // 记录合并信息
                    mergeInfo.push({
                        points: nextFruit.score,
                        row: r,
                        col: newRow.length - 1
                    });

                    this.score += nextFruit.score;
                    moved = true;
                    mergeCount++;

                    // 播放合并音效
                    if (this.soundEnabled) this.playSound('merge');

                } else {
                    newRow.push(row.shift());
                }
            }

            // 填充剩余空位
            while(newRow.length < this.gridSize) newRow.push(null);

            // 检查行是否改变
            for(let c = 0; c < this.gridSize; c++) {
                if(this.grid[r][c] !== newRow[c]) {
                    moved = true;
                }
            }

            this.grid[r] = newRow;
        }

        // 恢复旋转
        const restoreRotations = (4 - rotations) % 4;
        for(let i = 0; i < restoreRotations; i++) this.grid = rotateGrid(this.grid);

        if (moved) {
            // 处理连击系统
            if (mergeCount > 0) {
                this.comboCount++;
                this.resetComboTimer();

                // 显示连击提示
                if (this.comboCount >= 2) {
                    this.showCombo(this.comboCount);
                    // 连击加成分数
                    const comboBonus = Math.floor(mergeInfo.reduce((sum, info) => sum + info.points, 0) * 0.5 * this.comboCount);
                    if (comboBonus > 0) {
                        this.score += comboBonus;

                        // 获取棋盘位置用于显示连击加成
                        const boardRect = this.elements.board.getBoundingClientRect();
                        this.showFloatingScore(
                            boardRect.left + boardRect.width / 2,
                            boardRect.top + boardRect.height / 2,
                            comboBonus,
                            true
                        );
                    }
                }

                // 显示分数飘字
                const boardRect = this.elements.board.getBoundingClientRect();
                const cellSize = boardRect.width / this.gridSize;

                // 延迟显示分数飘字，等待合并动画
                setTimeout(() => {
                    mergeInfo.forEach((info, index) => {
                        // 计算合并后的实际位置（考虑旋转恢复）
                        const actualPos = this.getActualPosition(info.row, info.col, rotations);
                        const x = boardRect.left + actualPos.col * cellSize + cellSize / 2;
                        const y = boardRect.top + actualPos.row * cellSize + cellSize / 2;

                        // 稍微错开每个分数飘字的显示时间
                        setTimeout(() => {
                            this.showFloatingScore(x, y, info.points);
                        }, index * 100);
                    });
                }, 200);
            } else {
                // 没有合并，重置连击
                this.comboCount = 0;
            }

            this.addRandomFruit();
            this.updateUI();
            this.render();
            this.checkState();

            // 播放移动音效
            if (this.soundEnabled) this.playSound('move');
        } else {
            // 播放无效移动音效
            if (this.soundEnabled) this.playSound('invalid');
        }
    }

    /**
     * 获取合并位置在旋转恢复后的实际坐标
     */
    getActualPosition(row, col, rotations) {
        let r = row, c = col;
        // 逆向旋转恢复原始位置
        const restoreRotations = (4 - rotations) % 4;
        for(let i = 0; i < restoreRotations; i++) {
            const newR = c;
            const newC = this.gridSize - 1 - r;
            r = newR;
            c = newC;
        }
        return { row: r, col: c };
    }

    checkState() {
        // 更新最高分
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('fruit2048_best', this.bestScore);

            // 播放新高分音效
            if (this.soundEnabled) this.playSound('newBest');
        }

        // 检查游戏是否结束
        let canMove = false;

        // 检查是否有空位
        for(let r = 0; r < this.gridSize; r++) {
            for(let c = 0; c < this.gridSize; c++) {
                if(!this.grid[r][c]) canMove = true;
            }
        }

        // 检查相邻水果是否可以合并
        if(!canMove) {
            for(let r = 0; r < this.gridSize; r++) {
                for(let c = 0; c < this.gridSize; c++) {
                    const current = this.grid[r][c];
                    if(!current) continue;

                    // 检查下方
                    if(r < this.gridSize - 1 && this.grid[r + 1][c] &&
                       this.grid[r + 1][c].level === current.level) canMove = true;

                    // 检查右方
                    if(c < this.gridSize - 1 && this.grid[r][c + 1] &&
                       this.grid[r][c + 1].level === current.level) canMove = true;
                }
            }
        }

        if (!canMove) {
            this.gameOver = true;
            this.showGameOver();
        }
    }

    showGameOver() {
        // 更新分数显示
        if (this.elements.finalScore) {
            this.elements.finalScore.textContent = this.score;
        }

        if (this.elements.bestScoreDisplay) {
            this.elements.bestScoreDisplay.textContent = this.bestScore;
        }

        // 设置结果消息
        if (this.elements.resultMessage) {
            let message = '';
            // 检查是否达到桃子
            const hasPeach = this.grid.flat().some(cell => cell && cell.emoji === '🍑');

            if (hasPeach) {
                message = '🎉 恭喜！你获得了桃子，完成游戏目标！';
            } else if (this.score >= 1024) {
                message = '👏 太棒了！你已经接近桃子了！';
            } else if (this.score >= 512) {
                message = '👍 干得好！继续努力！';
            } else {
                message = '💪 差一点就成功了！再试一次吧！';
            }
            this.elements.resultMessage.textContent = message;
        }

        // 显示模态框
        setTimeout(() => {
            if (this.elements.gameOverModal) {
                this.elements.gameOverModal.classList.add('active');
            }
        }, 500);
    }

    updateUI() {
        // 更新分数显示
        if(this.elements.score) {
            const scoreIncreased = this.score > this.previousScore && this.previousScore > 0;

            this.elements.score.textContent = this.score;
            this.elements.score.setAttribute('aria-label', `当前分数：${this.score}`);

            // 添加分数增加动画
            if (scoreIncreased) {
                this.elements.score.classList.remove('score-increase');
                void this.elements.score.offsetWidth; // 触发重排
                this.elements.score.classList.add('score-increase');

                // 移除动画类
                setTimeout(() => {
                    this.elements.score.classList.remove('score-increase');
                }, 300);
            }

            this.previousScore = this.score;
        }

        if(this.elements.best) {
            this.elements.best.textContent = this.bestScore;
            this.elements.best.setAttribute('aria-label', `最高分数：${this.bestScore}`);
        }

        // 更新状态信息
        if(this.elements.statusMessage) {
            if(this.gameOver) {
                this.elements.statusMessage.textContent = '游戏结束';
            } else {
                this.elements.statusMessage.textContent = '游戏进行中';
            }
        }
    }

    render() {
        // 验证游戏板元素
        if (!this.elements.board) {
            console.error('游戏板元素不存在，无法渲染');
            return;
        }

        // 清空游戏板
        this.elements.board.innerHTML = '';

        // 渲染网格
        for(let r = 0; r < this.gridSize; r++) {
            for(let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.setAttribute('data-row', r);
                cell.setAttribute('data-col', c);
                cell.setAttribute('tabindex', '-1');

                const fruit = this.grid[r][c];

                if (fruit) {
                    cell.textContent = fruit.emoji;
                    cell.classList.add('has-fruit');
                    cell.setAttribute('aria-label', `${fruit.name}，位于第${r + 1}行第${c + 1}列`);

                    // 设置颜色
                    cell.style.color = fruit.color;

                    // 新水果弹出动画
                    if (fruit.isNew) {
                        cell.classList.add('pop');
                        fruit.isNew = false;
                    }

                    // 合并弹跳动画
                    if (fruit.isMerge) {
                        cell.classList.add('merge');
                        fruit.isMerge = false;
                    }
                } else {
                    cell.setAttribute('aria-label', `第${r + 1}行第${c + 1}列，空位`);
                }

                this.elements.board.appendChild(cell);
            }
        }

        // 调试：记录渲染结果
        if (console.debug && this.elements.board.children.length === 0) {
            console.warn('游戏板渲染后为空');
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;

        if (this.elements.soundToggle) {
            const icon = this.elements.soundToggle.querySelector('i');
            const text = this.elements.soundToggle.querySelector('span');

            if (icon) {
                icon.className = this.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }

            if (text) {
                text.textContent = `音效: ${this.soundEnabled ? '开' : '关'}`;
            }

            this.elements.soundToggle.setAttribute('aria-label',
                `切换音效，当前状态为${this.soundEnabled ? '开启' : '关闭'}`);

            // 播放切换音效
            if (this.soundEnabled) this.playSound('toggle');
        }
    }

    playSound(type) {
        // 简单音效实现 - 使用单例 AudioContext
        try {
            // 创建或复用音频上下文
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // 如果音频上下文被暂停，尝试恢复
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // 根据类型设置音效
            switch(type) {
                case 'move':
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    break;
                case 'merge':
                    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
                    break;
                case 'place':
                    oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
                    break;
                case 'newBest':
                    oscillator.frequency.setValueAtTime(1100, this.audioContext.currentTime);
                    break;
                case 'reset':
                    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
                    break;
                case 'toggle':
                    oscillator.frequency.setValueAtTime(330, this.audioContext.currentTime);
                    break;
                case 'invalid':
                    oscillator.frequency.setValueAtTime(275, this.audioContext.currentTime);
                    break;
                // 连击音效
                case 'combo':
                    oscillator.frequency.setValueAtTime(550, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.1);
                    break;
            }

            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.15);

        } catch (error) {
            console.warn('音效播放失败:', error);
        }
    }

    shareScore() {
        const shareText = `我在水果2048游戏中获得了${this.score}分！最高连击x${this.comboCount}！快来挑战我吧！`;

        if (navigator.share) {
            navigator.share({
                title: '水果2048游戏成绩',
                text: shareText,
                url: window.location.href
            }).catch(console.error);
        } else {
            // 复制到剪贴板
            navigator.clipboard.writeText(shareText).then(() => {
                // 使用自定义提示而不是alert
                this.showToast('成绩已复制到剪贴板！');
            }).catch(() => {
                // 降级处理
                prompt('复制游戏成绩:', shareText);
            });
        }
    }

    showToast(message) {
        // 创建临时提示框
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(16, 185, 129, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 9999px;
            font-size: 14px;
            z-index: 10000;
            animation: fadeInOut 2s ease forwards;
        `;

        // 添加动画样式
        if (!document.getElementById('toast-style')) {
            const style = document.createElement('style');
            style.id = 'toast-style';
            style.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2000);
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new FruitGame();

    // 调试信息
    console.log('水果2048游戏已初始化');
    console.log('第1轮交互增强已启用：');
    console.log('- 水果合并缩放弹跳动画');
    console.log('- 连击检测系统');
    console.log('- 新水果弹出动画');
    console.log('- 分数飘字效果');
    console.log('操作说明：');
    console.log('- 方向键：移动水果');
    console.log('- R键：重新开始');
    console.log('- 点击按钮：各种游戏控制');
    console.log('- 滑动（移动端）：控制水果移动');
});
