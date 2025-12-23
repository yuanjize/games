/**
 * Memory Cards - Modern Class Implementation
 * Enhanced with theme switching, particles, gestures, and accessibility
 */

class MemoryGame {
    constructor() {
        // DOM Elements
        this.board = document.getElementById('gameBoard');
        this.pauseOverlay = document.getElementById('pauseOverlay');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = document.getElementById('themeIcon');
        this.contrastToggle = document.getElementById('contrastToggle');
        this.helpButton = document.getElementById('helpButton');
        this.helpModal = document.getElementById('helpModal');
        this.closeHelp = document.getElementById('closeHelp');

        // Stats elements
        this.stats = {
            moves: document.getElementById('moves'),
            matches: document.getElementById('matches'),
            timer: document.getElementById('timer')
        };

        // Best scores elements
        this.bestScores = {
            easy: document.getElementById('bestTimeEasy'),
            medium: document.getElementById('bestTimeMedium'),
            hard: document.getElementById('bestTimeHard')
        };

        this.bestMoves = {
            easy: document.getElementById('bestMovesEasy'),
            medium: document.getElementById('bestMovesMedium'),
            hard: document.getElementById('bestMovesHard')
        };

        // Game configuration
        this.config = {
            easy: { rows: 4, cols: 4, pairs: 8 },
            medium: { rows: 6, cols: 6, pairs: 18 },
            hard: { rows: 8, cols: 8, pairs: 32 }
        };

        // Theme icons
        this.themes = {
            animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌'],
            fruits: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🫒', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜']
        };

        // Game state
        this.state = {
            difficulty: 'easy',
            theme: 'animals',
            cards: [],
            flipped: [],
            matched: [],
            moves: 0,
            startTime: 0,
            elapsedTime: 0,
            timerInterval: null,
            locked: false,
            paused: false,
            isPaused: false,
            themeMode: localStorage.getItem('memoryCardsTheme') || 'dark',
            highContrast: false
        };

        // Audio context and settings
        this.audioCtx = null;
        this.audioEnabled = true;
        this.masterGain = null;

        // Gesture tracking
        this.gestureState = {
            lastTap: 0,
            touchStartTime: 0,
            longPressTimer: null,
            tapCount: 0
        };

        // Previous stat values for animation
        this.previousStats = {
            moves: 0,
            matches: 0
        };

        // Initialize
        this.loadBestScores();
        this.initTheme();
        this.startLoadingSequence();
    }

    /**
     * 加载序列 - 显示加载屏幕并初始化游戏
     */
    async startLoadingSequence() {
        let progress = 0;
        const loadingSteps = [
            { progress: 20, delay: 200 },
            { progress: 45, delay: 300 },
            { progress: 70, delay: 250 },
            { progress: 90, delay: 200 },
            { progress: 100, delay: 150 }
        ];

        for (const step of loadingSteps) {
            await this.delay(step.delay);
            progress = step.progress;
            this.progressFill.style.width = `${progress}%`;
            this.progressText.textContent = `${progress}%`;
        }

        await this.delay(300);
        this.loadingScreen.classList.add('hidden');

        // 初始化游戏
        this.init();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 初始化主题
     */
    initTheme() {
        const savedTheme = this.state.themeMode;
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon();
    }

    /**
     * 更新主题图标
     */
    updateThemeIcon() {
        if (this.state.themeMode === 'dark') {
            this.themeIcon.className = 'fas fa-moon';
        } else {
            this.themeIcon.className = 'fas fa-sun';
        }
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        this.state.themeMode = this.state.themeMode === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.state.themeMode);
        localStorage.setItem('memoryCardsTheme', this.state.themeMode);
        this.updateThemeIcon();
        this.playSound('theme', 0.1);
    }

    /**
     * 切换高对比度模式
     */
    toggleHighContrast() {
        this.state.highContrast = !this.state.highContrast;
        document.documentElement.classList.toggle('high-contrast', this.state.highContrast);
        this.contrastToggle.classList.toggle('active', this.state.highContrast);
        this.playSound('ui', 0.08);
    }

    /**
     * 显示/隐藏帮助弹窗
     */
    toggleHelp(show) {
        if (show) {
            this.helpModal.classList.add('active');
            this.closeHelp.focus();
        } else {
            this.helpModal.classList.remove('active');
        }
        this.playSound('ui', 0.05);
    }

    /**
     * 初始化游戏
     */
    init() {
        this.bindEvents();
        this.createParticleContainer();
        this.restart();
    }

    /**
     * 创建粒子容器
     */
    createParticleContainer() {
        const container = document.createElement('div');
        container.className = 'particle-container';
        container.id = 'particleContainer';
        document.body.appendChild(container);
    }

    /**
     * 创建匹配粒子效果
     */
    createMatchParticles(x, y) {
        const container = document.getElementById('particleContainer');
        if (!container) return;

        const colors = [
            'var(--success-color)',
            'var(--accent-color)',
            '#10b981',
            '#34d399',
            '#6ee7b7'
        ];

        const particleCount = 20;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle match-particle';

            const angle = (i / particleCount) * Math.PI * 2;
            const velocity = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;

            particle.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                width: ${5 + Math.random() * 10}px;
                height: ${5 + Math.random() * 10}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                --tx: ${tx}px;
                --ty: ${ty}px;
            `;

            container.appendChild(particle);

            setTimeout(() => particle.remove(), 1000);
        }
    }

    /**
     * 分数滚动动画
     */
    animateValue(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        element.classList.add('counting');

        const animate = () => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                element.textContent = end;
                element.classList.remove('counting');
                return;
            }
            element.textContent = Math.round(current);
            requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * 加载最佳成绩
     */
    loadBestScores() {
        const stored = localStorage.getItem('memoryCardsBestScores');
        if (stored) {
            this.savedScores = JSON.parse(stored);
        } else {
            this.savedScores = {
                easy: { time: null, moves: null },
                medium: { time: null, moves: null },
                hard: { time: null, moves: null }
            };
        }
        this.updateBestScoresDisplay();
    }

    /**
     * 保存最佳成绩
     */
    saveBestScore(difficulty, time, moves) {
        const current = this.savedScores[difficulty];
        let isNewRecord = false;

        if (current.time === null || time < current.time) {
            current.time = time;
            isNewRecord = true;
        }
        if (current.moves === null || moves < current.moves) {
            current.moves = moves;
            isNewRecord = true;
        }

        if (isNewRecord) {
            localStorage.setItem('memoryCardsBestScores', JSON.stringify(this.savedScores));
            this.updateBestScoresDisplay();
        }

        return isNewRecord;
    }

    /**
     * 更新最佳成绩显示
     */
    updateBestScoresDisplay() {
        ['easy', 'medium', 'hard'].forEach(difficulty => {
            const score = this.savedScores[difficulty];
            this.bestScores[difficulty].textContent = score.time ? this.formatTime(score.time) : '--:--';
            this.bestMoves[difficulty].textContent = score.moves !== null ? score.moves : '--';
        });
    }

    /**
     * 初始化音频系统
     */
    initAudio() {
        if (this.audioCtx) return;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioCtx.destination);
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    /**
     * 播放音效 - 增强版
     */
    playSound(type, volume = 0.15) {
        if (!this.audioCtx || !this.audioEnabled) return;

        // 恢复音频上下文（如果被挂起）
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        const sounds = {
            flip: { freq: 600, type: 'sine', duration: 0.08, slide: -100 },
            match: { freq: 880, type: 'sine', duration: 0.15, slide: 200 },
            matchSuccess: { freq: 1100, type: 'sine', duration: 0.2, slide: 0 },
            noMatch: { freq: 300, type: 'triangle', duration: 0.12, slide: -50 },
            win: [
                { freq: 523.25, duration: 0.15 },
                { freq: 659.25, duration: 0.15 },
                { freq: 783.99, duration: 0.15 },
                { freq: 1046.50, duration: 0.3 }
            ],
            pause: { freq: 400, type: 'square', duration: 0.1, slide: 0 },
            resume: { freq: 500, type: 'square', duration: 0.1, slide: 100 },
            ui: { freq: 800, type: 'sine', duration: 0.05, slide: 0 },
            theme: { freq: 700, type: 'triangle', duration: 0.12, slide: 150 }
        };

        const sound = sounds[type];
        if (!sound) return;

        if (Array.isArray(sound)) {
            // 播放音符序列
            sound.forEach((note, index) => {
                setTimeout(() => {
                    this.playNote(note.freq, 'sine', note.duration, volume);
                }, index * 150);
            });
        } else {
            // 播放单个音符
            this.playNote(sound.freq, sound.type, sound.duration, volume, sound.slide);
        }
    }

    /**
     * 播放音符
     */
    playNote(freq, type, duration, volume, slide = 0) {
        if (!this.audioCtx) return;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

        if (slide !== 0) {
            osc.frequency.linearRampToValueAtTime(
                freq + slide,
                this.audioCtx.currentTime + duration
            );
        }

        gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            this.audioCtx.currentTime + duration
        );

        osc.connect(gain);
        gain.connect(this.masterGain || this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
    }

    /**
     * 旧版 beep 方法（保持兼容）
     */
    beep(freq = 523.25, type = 'sine', duration = 0.1) {
        this.playNote(freq, type, duration, 0.15);
    }

    /**
     * 暂停/继续游戏
     */
    togglePause() {
        if (this.state.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (this.state.isPaused) return;

        this.state.isPaused = true;
        this.stopTimer(false);

        // 更新暂停按钮
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.innerHTML = '<i class="fas fa-play" aria-hidden="true"></i> 继续';
        pauseBtn.setAttribute('aria-label', '继续游戏');

        // 显示暂停遮罩
        this.pauseOverlay.classList.add('active');
        this.pauseOverlay.setAttribute('aria-hidden', 'false');

        this.playSound('pause', 0.1);
    }

    /**
     * 继续游戏
     */
    resume() {
        if (!this.state.isPaused) return;

        this.state.isPaused = false;
        this.state.startTime = Date.now() - (this.state.elapsedTime * 1000);
        this.startTimer();

        // 更新暂停按钮
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> 暂停';
        pauseBtn.setAttribute('aria-label', '暂停游戏');

        // 隐藏暂停遮罩
        this.pauseOverlay.classList.remove('active');
        this.pauseOverlay.setAttribute('aria-hidden', 'true');

        this.playSound('resume', 0.1);
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 主题切换
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.themeToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTheme();
            }
        });

        // 高对比度切换
        this.contrastToggle.addEventListener('click', () => this.toggleHighContrast());
        this.contrastToggle.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleHighContrast();
            }
        });

        // 帮助弹窗
        this.helpButton.addEventListener('click', () => this.toggleHelp(true));
        this.closeHelp.addEventListener('click', () => this.toggleHelp(false));

        // 点击外部关闭帮助
        this.helpModal.addEventListener('click', (e) => {
            if (e.target === this.helpModal) {
                this.toggleHelp(false);
            }
        });

        // 重新开始按钮
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('restartBtn').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.restart();
            }
        });

        // 暂停按钮
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('pauseBtn').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.togglePause();
            }
        });

        // 继续按钮
        document.getElementById('resumeBtn').addEventListener('click', () => this.resume());

        // 难度选择
        document.querySelectorAll('.difficulty-btn').forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.selectDifficulty(btn.dataset.difficulty);
            });

            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectDifficulty(btn.dataset.difficulty);
                }

                // 键盘导航：箭头键切换选项
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    const nextIndex = (index + 1) % 3;
                    const nextBtn = document.querySelectorAll('.difficulty-btn')[nextIndex];
                    this.selectDifficulty(nextBtn.dataset.difficulty);
                    nextBtn.focus();
                }

                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prevIndex = (index - 1 + 3) % 3;
                    const prevBtn = document.querySelectorAll('.difficulty-btn')[prevIndex];
                    this.selectDifficulty(prevBtn.dataset.difficulty);
                    prevBtn.focus();
                }
            });
        });

        // 主题切换按钮
        const themeBtn = document.getElementById('themeBtn');
        themeBtn.addEventListener('click', () => {
            this.toggleCardTheme();
        });
        themeBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleCardTheme();
            }
        });

        // 弹窗按钮
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.closeWinModal();
            this.restart();
        });
        document.getElementById('mainMenuBtn').addEventListener('click', () => {
            this.closeWinModal();
            window.location.href = '../index.html';
        });

        // 全局键盘快捷键
        document.addEventListener('keydown', (e) => {
            // Ctrl+R 或 Cmd+R 重新开始
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.restart();
            }
            // 空格键也重新开始（当焦点不在按钮上时）
            if (e.key === ' ' && document.activeElement.tagName !== 'BUTTON') {
                e.preventDefault();
                this.restart();
            }
            // ESC 关闭弹窗
            if (e.key === 'Escape') {
                if (this.helpModal.classList.contains('active')) {
                    this.toggleHelp(false);
                } else if (document.getElementById('winModal').classList.contains('active')) {
                    this.closeWinModal();
                }
            }
            // P 键暂停/继续
            if (e.key === 'p' || e.key === 'P') {
                if (!this.helpModal.classList.contains('active') &&
                    !document.getElementById('winModal').classList.contains('active')) {
                    e.preventDefault();
                    this.togglePause();
                }
            }
            // H 键显示帮助
            if (e.key === 'h' || e.key === 'H') {
                if (!document.getElementById('winModal').classList.contains('active')) {
                    e.preventDefault();
                    this.toggleHelp(true);
                }
            }
        });

        // 触摸手势支持
        this.setupTouchGestures();

        // 初始设置
        this.updateThemeButton();
    }

    /**
     * 设置触摸手势
     */
    setupTouchGestures() {
        let lastTouchTime = 0;
        let touchCount = 0;

        // 游戏板双指点击暂停
        this.board.addEventListener('touchstart', (e) => {
            const now = Date.now();
            if (e.touches.length === 2) {
                e.preventDefault();
                this.togglePause();
            }
        }, { passive: false });

        // 卡片长按提示
        this.board.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                const card = e.target.closest('.card');
                if (card && !card.classList.contains('matched') && !card.classList.contains('flipped')) {
                    this.gestureState.longPressTimer = setTimeout(() => {
                        this.showCardHint(card);
                    }, 500);
                }
            }
        }, { passive: true });

        this.board.addEventListener('touchend', (e) => {
            if (this.gestureState.longPressTimer) {
                clearTimeout(this.gestureState.longPressTimer);
                this.gestureState.longPressTimer = null;
            }
        }, { passive: true });
    }

    /**
     * 显示卡片提示
     */
    showCardHint(card) {
        card.classList.add('hint');
        this.playSound('ui', 0.05);

        setTimeout(() => {
            card.classList.remove('hint');
        }, 1500);
    }

    /**
     * 选择难度
     */
    selectDifficulty(difficulty) {
        document.querySelectorAll('.difficulty-btn').forEach(b => {
            const isActive = b.dataset.difficulty === difficulty;
            b.classList.toggle('active', isActive);
            b.setAttribute('aria-checked', isActive.toString());
            b.setAttribute('tabindex', isActive ? '0' : '-1');
        });
        this.state.difficulty = difficulty;
        this.restart();
    }

    /**
     * 切换卡片主题
     */
    toggleCardTheme() {
        this.state.theme = this.state.theme === 'animals' ? 'fruits' : 'animals';
        this.updateThemeButton();
        this.restart();
    }

    /**
     * 更新主题按钮
     */
    updateThemeButton() {
        const themeBtn = document.getElementById('themeBtn');
        const themeName = this.state.theme === 'animals' ? '动物' : '水果';
        themeBtn.innerHTML = `<i class="fas fa-palette" aria-hidden="true"></i> ${themeName}主题`;
        themeBtn.setAttribute('aria-label', `更换游戏主题，当前主题：${themeName}`);
    }

    /**
     * 关闭胜利弹窗
     */
    closeWinModal() {
        document.getElementById('winModal').classList.remove('active');
    }

    /**
     * 重新开始游戏
     */
    restart() {
        this.initAudio();
        this.state.isPaused = false;
        this.state.elapsedTime = 0;
        this.stopTimer(false);
        this.state.moves = 0;
        this.previousStats.moves = 0;
        this.previousStats.matches = 0;
        this.state.flipped = [];
        this.state.matched = [];
        this.state.locked = false;

        // 隐藏暂停遮罩
        this.pauseOverlay.classList.remove('active');
        this.pauseOverlay.setAttribute('aria-hidden', 'true');

        // 更新暂停按钮
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i> 暂停';
        pauseBtn.setAttribute('aria-label', '暂停游戏');

        this.updateStats(true);

        // 设置网格
        const cfg = this.config[this.state.difficulty];
        this.board.className = `game-board grid-${cfg.rows}x${cfg.cols}`;

        // 生成卡片
        const count = cfg.pairs;
        const icons = this.themes[this.state.theme].slice(0, count);
        const pairs = [...icons, ...icons];

        // 洗牌
        for (let i = pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
        }

        this.board.innerHTML = '';
        this.state.cards = pairs.map((icon, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.setAttribute('role', 'gridcell');
            card.setAttribute('aria-label', `卡片 ${index + 1}，未翻开`);
            card.setAttribute('data-icon', icon);
            card.setAttribute('data-index', index);
            card.setAttribute('tabindex', '0');

            card.innerHTML = `
                <div class="card-face card-front" aria-hidden="true">?</div>
                <div class="card-face card-back" aria-hidden="true">${icon}</div>
                <span class="sr-only">${icon} 图案</span>
            `;

            // 点击事件
            card.addEventListener('click', () => this.flip(index));

            // 键盘事件
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.flip(index);
                }
            });

            this.board.appendChild(card);
            return { element: card, icon, index, isFlipped: false };
        });

        this.startTimer();
        this.playSound('ui', 0.05);
    }

    /**
     * 翻牌
     */
    flip(index) {
        // 如果游戏暂停，忽略点击
        if (this.state.isPaused) return;

        const card = this.state.cards[index];
        if (this.state.locked || card.isFlipped || this.state.matched.includes(index)) return;

        this.playSound('flip', 0.08);

        card.element.classList.add('flipped');
        card.isFlipped = true;
        card.element.setAttribute('aria-label', `已翻开卡片 ${index + 1}，图案：${card.icon}`);
        this.state.flipped.push(index);

        if (this.state.flipped.length === 2) {
            this.state.locked = true;
            this.state.moves++;
            this.updateStats();
            this.checkMatch();
        }
    }

    /**
     * 检查匹配
     */
    checkMatch() {
        const [i1, i2] = this.state.flipped;
        const c1 = this.state.cards[i1];
        const c2 = this.state.cards[i2];

        if (c1.icon === c2.icon) {
            // 匹配成功
            this.playSound('match', 0.12);
            setTimeout(() => this.playSound('matchSuccess', 0.15), 100);

            c1.element.classList.add('matched');
            c2.element.classList.add('matched');
            c1.element.setAttribute('aria-label', `已匹配卡片 ${i1 + 1}，图案：${c1.icon}，已匹配`);
            c2.element.setAttribute('aria-label', `已匹配卡片 ${i2 + 1}，图案：${c2.icon}，已匹配`);

            // 获取卡片位置用于粒子效果
            const rect1 = c1.element.getBoundingClientRect();
            const rect2 = c2.element.getBoundingClientRect();

            // 创建粒子效果
            setTimeout(() => {
                this.createMatchParticles(
                    rect1.left + rect1.width / 2,
                    rect1.top + rect1.height / 2
                );
                this.createMatchParticles(
                    rect2.left + rect2.width / 2,
                    rect2.top + rect2.height / 2
                );
            }, 200);

            this.state.matched.push(i1, i2);
            this.state.flipped = [];
            this.state.locked = false;
            this.updateStats();

            // 提供匹配成功的屏幕阅读器反馈
            const matchStatus = document.createElement('div');
            matchStatus.className = 'sr-only';
            matchStatus.setAttribute('aria-live', 'assertive');
            matchStatus.setAttribute('aria-atomic', 'true');
            matchStatus.textContent = `匹配成功！找到 ${c1.icon} 图案的匹配对`;
            document.body.appendChild(matchStatus);
            setTimeout(() => matchStatus.remove(), 1000);

            if (this.state.matched.length === this.state.cards.length) {
                this.win();
            }
        } else {
            // 不匹配
            setTimeout(() => {
                this.playSound('noMatch', 0.1);
                c1.element.classList.remove('flipped');
                c2.element.classList.remove('flipped');
                c1.isFlipped = false;
                c2.isFlipped = false;
                c1.element.setAttribute('aria-label', `卡片 ${i1 + 1}，未翻开`);
                c2.element.setAttribute('aria-label', `卡片 ${i2 + 1}，未翻开`);
                this.state.flipped = [];
                this.state.locked = false;

                // 提供不匹配的屏幕阅读器反馈
                const noMatchStatus = document.createElement('div');
                noMatchStatus.className = 'sr-only';
                noMatchStatus.setAttribute('aria-live', 'polite');
                noMatchStatus.setAttribute('aria-atomic', 'true');
                noMatchStatus.textContent = `不匹配，请继续寻找`;
                document.body.appendChild(noMatchStatus);
                setTimeout(() => noMatchStatus.remove(), 1000);
            }, 1000);
        }
    }

    /**
     * 游戏胜利
     */
    win() {
        // 计算最终时间
        const finalTime = Math.floor((Date.now() - this.state.startTime) / 1000);
        const finalMoves = this.state.moves;
        const totalPairs = Math.floor(this.state.cards.length / 2);

        // 停止计时器，但保留显示
        this.stopTimer(false);

        setTimeout(() => {
            const winModal = document.getElementById('winModal');
            const bestRecordMessage = document.getElementById('bestRecordMessage');

            document.getElementById('winTime').textContent = this.formatTime(finalTime);
            document.getElementById('winMoves').textContent = finalMoves;
            document.getElementById('winMatches').textContent = totalPairs;

            // 检查是否是新记录
            const isNewRecord = this.saveBestScore(this.state.difficulty, finalTime, finalMoves);

            if (isNewRecord) {
                bestRecordMessage.style.display = 'flex';
            } else {
                bestRecordMessage.style.display = 'none';
            }

            winModal.classList.add('active');
            this.playSound('win', 0.15);
        }, 500);
    }

    /**
     * 开始计时器
     */
    startTimer() {
        this.state.startTime = Date.now();
        this.state.timerInterval = setInterval(() => {
            if (!this.state.isPaused) {
                this.state.elapsedTime = Math.floor((Date.now() - this.state.startTime) / 1000);
                this.stats.timer.textContent = this.formatTime(this.state.elapsedTime);
            }
        }, 1000);
    }

    /**
     * 停止计时器
     */
    stopTimer(resetDisplay = true) {
        if (this.state.timerInterval) clearInterval(this.state.timerInterval);
        if (resetDisplay) {
            this.stats.timer.textContent = '00:00';
        }
    }

    /**
     * 格式化时间
     */
    formatTime(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    /**
     * 更新统计
     */
    updateStats(reset = false) {
        if (reset) {
            this.stats.moves.textContent = '0';
            const currentPairs = 0;
            const totalPairs = this.config[this.state.difficulty].pairs;
            this.stats.matches.textContent = `${currentPairs} / ${totalPairs}`;
        } else {
            // 翻牌次数动画
            if (this.state.moves !== this.previousStats.moves) {
                this.animateValue(this.stats.moves, this.previousStats.moves, this.state.moves, 300);
                this.previousStats.moves = this.state.moves;
            }

            // 匹配数动画
            const currentPairs = Math.floor(this.state.matched.length / 2);
            const totalPairs = this.config[this.state.difficulty].pairs;
            this.stats.matches.textContent = `${currentPairs} / ${totalPairs}`;
        }
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    window.game = new MemoryGame();
});
