/**
 * 打字速度测试游戏 - 现代化实现
 * 包含 Web Audio API 音效、微交互、可访问性和手势支持
 */

// ============================================
// Web Audio API 音效管理器
// ============================================
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.enabled = true;
        this.volume = 0.3;
        this.initialized = false;
    }

    /**
     * 初始化音频上下文（需要在用户交互后调用）
     */
    async init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.audioContext.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    /**
     * 确保音频上下文已恢复
     */
    async ensureResumed() {
        if (!this.initialized) await this.init();
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * 播放音调
     */
    async playTone(frequency, duration, type = 'sine', volume = 1) {
        if (!this.enabled || !this.initialized) return;

        await this.ensureResumed();

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

            gainNode.gain.setValueAtTime(volume * this.volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Error playing tone:', e);
        }
    }

    /**
     * 正确输入音效
     */
    async playCorrect() {
        await this.playTone(800, 0.05, 'sine', 0.15);
    }

    /**
     * 错误输入音效
     */
    async playError() {
        await this.playTone(200, 0.15, 'sawtooth', 0.2);
    }

    /**
     * 退格键音效
     */
    async playBackspace() {
        await this.playTone(400, 0.08, 'triangle', 0.1);
    }

    /**
     * 游戏开始音效
     */
    async playStart() {
        if (!this.enabled || !this.initialized) return;
        await this.ensureResumed();
        await this.playTone(523.25, 0.1, 'sine', 0.2); // C5
        await this.delay(50);
        await this.playTone(659.25, 0.1, 'sine', 0.2); // E5
        await this.delay(50);
        await this.playTone(783.99, 0.15, 'sine', 0.2); // G5
    }

    /**
     * 游戏完成音效
     */
    async playFinish() {
        if (!this.enabled || !this.initialized) return;
        await this.ensureResumed();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        for (let i = 0; i < notes.length; i++) {
            await this.playTone(notes[i], 0.2, 'sine', 0.2);
            await this.delay(100);
        }
    }

    /**
     * 开关切换音效
     */
    async playToggle() {
        await this.playTone(1000, 0.05, 'square', 0.1);
    }

    /**
     * 设置音量
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    /**
     * 切换启用状态
     */
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================
// 动画管理器
// ============================================
class AnimationManager {
    /**
     * 数字滚动动画
     */
    static countUp(element, target, duration = 500) {
        const start = parseInt(element.textContent) || 0;
        const difference = target - start;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 使用缓动函数
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + difference * easeOut);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = target;
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * 添加高亮动画
     */
    static highlight(element) {
        element.classList.remove('highlight');
        void element.offsetWidth; // 触发重绘
        element.classList.add('highlight');
        setTimeout(() => element.classList.remove('highlight'), 300);
    }

    /**
     * 添加动画类
     */
    static addAnimation(element, animationClass, duration = 600) {
        element.classList.add(animationClass);
        setTimeout(() => element.classList.remove(animationClass), duration);
    }
}

// ============================================
// 手势管理器
// ============================================
class GestureManager {
    constructor(element) {
        this.element = element;
        this.lastTapTime = 0;
        this.longPressTimer = null;
        this.longPressDuration = 500;
        this.onDoubleTap = null;
        this.onLongPress = null;
        this.init();
    }

    init() {
        this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    }

    handleTouchStart(e) {
        if (e.touches.length === 2) {
            // 双指触摸 - 立即触发
            this.triggerDoubleTap();
            return;
        }

        // 单指长按检测
        this.longPressTimer = setTimeout(() => {
            this.triggerLongPress(e);
        }, this.longPressDuration);
    }

    handleTouchEnd(e) {
        clearTimeout(this.longPressTimer);

        if (e.touches.length === 0) {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - this.lastTapTime;

            if (tapLength < 300 && tapLength > 0) {
                // 双击
                this.triggerDoubleTap();
            }
            this.lastTapTime = currentTime;
        }
    }

    triggerDoubleTap() {
        if (this.onDoubleTap) this.onDoubleTap();
    }

    triggerLongPress(e) {
        if (this.onLongPress) this.onLongPress(e);
    }

    destroy() {
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
    }
}

// ============================================
// 辅助功能管理器
// ============================================
class AccessibilityManager {
    constructor() {
        this.highContrastMode = false;
        this.init();
    }

    init() {
        // 检测系统高对比度设置
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            this.enableHighContrast();
        }

        // 监听高对比度变化
        window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
            if (e.matches) {
                this.enableHighContrast();
            } else {
                this.disableHighContrast();
            }
        });

        // 从本地存储加载设置
        const savedContrast = localStorage.getItem('typingTestContrast');
        if (savedContrast === 'high') {
            this.enableHighContrast();
        }
    }

    enableHighContrast() {
        this.highContrastMode = true;
        document.body.setAttribute('data-contrast', 'high');
        localStorage.setItem('typingTestContrast', 'high');
    }

    disableHighContrast() {
        this.highContrastMode = false;
        document.body.removeAttribute('data-contrast');
        localStorage.setItem('typingTestContrast', 'normal');
    }

    toggleHighContrast() {
        if (this.highContrastMode) {
            this.disableHighContrast();
        } else {
            this.enableHighContrast();
        }
        return !this.highContrastMode;
    }
}

// ============================================
// 打字测试游戏主类
// ============================================
class TypingTest {
    constructor() {
        // 初始化管理器
        this.soundManager = new SoundManager();
        this.accessibilityManager = new AccessibilityManager();
        this.animationManager = AnimationManager;

        // 元素缓存
        this.elements = {
            text: document.getElementById('typingText'),
            input: document.getElementById('typingInput'),
            wpm: document.getElementById('wpm'),
            accuracy: document.getElementById('accuracy'),
            timer: document.getElementById('timer'),
            correct: document.getElementById('correct'),
            errors: document.getElementById('errors'),
            progress: document.getElementById('progress'),
            modal: document.getElementById('resultModal'),
            newGameBtn: document.getElementById('newGameBtn'),
            restartBtn: document.getElementById('restartBtn'),
            playAgainBtn: document.getElementById('playAgain'),
            closeModalBtn: document.getElementById('closeModal'),
            gameMode: document.getElementById('gameMode'),
            difficulty: document.getElementById('difficulty'),
            soundToggle: document.getElementById('soundToggle'),
            contrastToggle: document.getElementById('contrastToggle'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsPanel: document.getElementById('settingsPanel'),
            closeSettingsBtn: document.getElementById('closeSettings'),
            saveSettingsBtn: document.getElementById('saveSettings'),
            resetSettingsBtn: document.getElementById('resetSettingsBtn'),
            clearHistoryBtn: document.getElementById('clearHistory'),
            shareResultBtn: document.getElementById('shareResult'),
            themeToggle: document.getElementById('themeToggle')
        };

        // 创建高对比度按钮（如果不存在）
        this.createContrastToggle();

        // 文本库 - 根据难度分类
        this.textLibrary = {
            easy: [
                "The quick brown fox jumps over the lazy dog.",
                "I like to eat pizza with cheese and pepperoni.",
                "My cat sleeps on the sofa every afternoon.",
                "The sun is shining brightly in the sky today.",
                "We are going to the park to play with friends.",
                "Reading books is a great way to learn new things.",
                "She likes to drink coffee in the morning.",
                "They walked along the beach at sunset."
            ],
            medium: [
                "Programming is the art of telling another human being what one wants the computer to do.",
                "Logic will get you from A to B. Imagination will take you everywhere.",
                "Stay hungry, stay foolish. Innovation distinguishes between a leader and a follower.",
                "The best way to predict the future is to invent it.",
                "Life is what happens when you are busy making other plans.",
                "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                "In the middle of difficulty lies opportunity."
            ],
            hard: [
                "The intricate design of modern processors involves billions of transistors working in harmony.",
                "Quantum computing leverages superposition and entanglement to solve complex computational problems.",
                "Machine learning algorithms analyze patterns in data to make predictions without explicit programming.",
                "Neural networks consist of interconnected nodes that mimic the structure of biological brains.",
                "Blockchain technology provides a decentralized and immutable ledger for secure transactions.",
                "Asynchronous JavaScript allows non-blocking operations through Promises and async/await patterns."
            ]
        };

        // 游戏模式配置
        this.gameModeConfig = {
            'words': { type: 'words', target: 30 },
            'time-1': { type: 'time', target: 60 },
            'time-3': { type: 'time', target: 180 },
            'custom': { type: 'custom', target: 50 }
        };

        // 游戏状态
        this.state = {
            targetText: '',
            typedText: '',
            startTime: null,
            timerInterval: null,
            isActive: false,
            isFinished: false,
            totalCorrect: 0,
            totalErrors: 0,
            currentPosition: 0,
            // 设置
            soundEnabled: true,
            cursorSpeed: 'medium',
            showHints: true,
            punctuation: 'some',
            language: 'zh',
            // 游戏模式
            gameMode: 'words',
            timeLimit: null,
            timeRemaining: null,
            // 历史记录
            history: [],
            // 上一统计值（用于动画）
            lastStats: {
                wpm: 0,
                accuracy: 100,
                correct: 0,
                errors: 0
            }
        };

        // 性能优化 - 防抖定时器
        this.debounceTimer = null;

        // 初始化
        this.init();
    }

    /**
     * 创建高对比度切换按钮
     */
    createContrastToggle() {
        if (this.elements.contrastToggle) return;

        const themeToggle = this.elements.themeToggle?.parentElement;
        if (!themeToggle) return;

        const contrastWrapper = document.createElement('div');
        contrastWrapper.className = 'contrast-toggle';
        contrastWrapper.innerHTML = `
            <button id="contrastToggle" class="btn btn-icon" title="高对比度" aria-label="切换高对比度模式" type="button">
                <i class="fas fa-adjust" aria-hidden="true"></i>
            </button>
        `;

        themeToggle.insertAdjacentElement('afterend', contrastWrapper);
        this.elements.contrastToggle = document.getElementById('contrastToggle');
    }

    /**
     * 初始化游戏
     */
    init() {
        this.bindEvents();
        this.loadSettings();
        this.loadHistory();
        this.loadTheme();
        this.updateHistoryDisplay();
        this.reset();
        this.initCursor();
        this.setupKeyboardShortcuts();
        this.setupGestures();
        this.createLoadingOverlay();
    }

    /**
     * 创建加载遮罩
     */
    createLoadingOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.style.display = 'none';
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">加载中...</div>
                <div class="loading-progress">
                    <div class="progress-bar">
                        <div class="progress-bar-fill" id="loadingProgressFill" style="width: 0%"></div>
                    </div>
                    <div class="loading-progress-text">
                        <span id="loadingProgressPercent">0%</span>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this.elements.loadingOverlay = overlay;
    }

    /**
     * 显示加载动画
     */
    async showLoading(callback) {
        if (!this.elements.loadingOverlay) return;

        this.elements.loadingOverlay.style.display = 'flex';

        // 模拟加载进度
        const progressFill = document.getElementById('loadingProgressFill');
        const progressPercent = document.getElementById('loadingProgressPercent');

        for (let i = 0; i <= 100; i += 10) {
            await this.delay(30);
            if (progressFill) progressFill.style.width = `${i}%`;
            if (progressPercent) progressPercent.textContent = `${i}%`;
        }

        // 执行回调
        if (callback) await callback();

        await this.delay(200);
        this.elements.loadingOverlay.style.display = 'none';
    }

    /**
     * 设置手势
     */
    setupGestures() {
        if ('ontouchstart' in window) {
            const typingArea = document.querySelector('.typing-area');
            if (typingArea) {
                this.gestureManager = new GestureManager(typingArea);
                this.gestureManager.onDoubleTap = () => {
                    if (this.state.isActive) {
                        this.pauseTimer();
                        this.showToast('游戏已暂停');
                    }
                };
                this.gestureManager.onLongPress = () => {
                    this.showHelpModal();
                };
            }
        }
    }

    /**
     * 显示帮助模态框
     */
    showHelpModal() {
        const helpContent = `
            <div class="modal" style="display: flex;" role="dialog" aria-modal="true">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2><i class="fas fa-question-circle"></i> 游戏帮助</h2>
                        <button class="btn btn-icon" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p><strong>如何游玩：</strong></p>
                        <ul>
                            <li>点击"开始新游戏"按钮开始</li>
                            <li>在输入框中输入显示的文本</li>
                            <li>绿色字符表示正确，红色表示错误</li>
                            <li>尽可能快且准确地完成输入</li>
                        </ul>
                        <p><strong>手势操作：</strong></p>
                        <ul>
                            <li>双指轻触 - 暂停游戏</li>
                            <li>长按屏幕 - 显示帮助</li>
                        </ul>
                        <p><strong>键盘快捷键：</strong></p>
                        <ul>
                            <li><kbd>Esc</kbd> - 重置游戏</li>
                            <li><kbd>Ctrl</kbd> + <kbd>R</kbd> - 重新开始</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', helpContent);
    }

    /**
     * 延迟函数
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 输入事件
        this.elements.input.addEventListener('input', (e) => this.handleInput(e));
        this.elements.input.addEventListener('keydown', (e) => this.handleKeydown(e));

        // 按钮事件
        this.elements.newGameBtn.addEventListener('click', () => {
            this.soundManager.init(); // 确保音频上下文已初始化
            this.startNewGame();
        });
        this.elements.restartBtn.addEventListener('click', () => this.reset());
        this.elements.playAgainBtn.addEventListener('click', () => this.playAgain());
        this.elements.closeModalBtn.addEventListener('click', () => this.closeModal());

        // 设置事件
        this.elements.soundToggle.addEventListener('click', () => this.toggleSound());
        this.elements.contrastToggle?.addEventListener('click', () => this.toggleContrast());
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.elements.resetSettingsBtn?.addEventListener('click', () => this.resetSettings());

        // 分享和历史记录
        this.elements.shareResultBtn.addEventListener('click', () => this.shareResult());
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // 游戏模式和难度选择
        this.elements.gameMode.addEventListener('change', () => this.updateGameMode());
        this.elements.difficulty.addEventListener('change', () => this.updateDifficulty());

        // 主题切换
        if (this.elements.themeToggle) {
            this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // 点击外部关闭模态框
        document.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this.closeModal();
            }
            if (e.target === this.elements.settingsPanel) {
                this.closeSettings();
            }
        });

        // Escape键处理
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.elements.modal.style.display !== 'none') {
                    this.closeModal();
                } else if (this.elements.settingsPanel.style.display !== 'none') {
                    this.closeSettings();
                } else if (this.state.isActive) {
                    this.reset();
                }
            }
        });

        // 页面可见性变化时暂停/恢复计时器
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state.isActive) {
                this.pauseTimer();
            } else if (!document.hidden && this.state.isActive && this.state.startTime) {
                this.resumeTimer();
            }
        });

        // 添加波纹效果到按钮
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', this.createRipple.bind(this));
        });
    }

    /**
     * 创建波纹效果
     */
    createRipple(e) {
        const button = e.currentTarget;
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    /**
     * 切换高对比度
     */
    toggleContrast() {
        const isHigh = this.accessibilityManager.toggleHighContrast();
        this.updateContrastButton();
        this.showToast(isHigh ? '高对比度模式已启用' : '高对比度模式已关闭');
    }

    /**
     * 更新高对比度按钮
     */
    updateContrastButton() {
        const btn = this.elements.contrastToggle;
        if (!btn) return;

        const isHigh = this.accessibilityManager.highContrastMode;
        btn.style.background = isHigh ? 'var(--color-accent)' : '';
        btn.style.color = isHigh ? 'white' : '';
    }

    /**
     * 防抖函数
     */
    debounce(func, delay) {
        return (...args) => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * 加载历史记录
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem('typingHistory');
            this.state.history = saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load history:', e);
            this.state.history = [];
        }
    }

    /**
     * 加载主题
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('typingTestTheme');
        if (savedTheme) {
            document.body.setAttribute('data-theme', savedTheme);
            this.updateThemeIcon(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            document.body.setAttribute('data-theme', 'light');
            this.updateThemeIcon('light');
        }
    }

    /**
     * 更新主题图标
     */
    updateThemeIcon(theme) {
        const icon = this.elements.themeToggle?.querySelector('i');
        if (icon) {
            icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    /**
     * 设置键盘快捷键
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 防止在输入框中触发全局快捷键
            if (e.target === this.elements.input) return;

            switch (e.key) {
                case ' ':
                case 'Enter':
                    if (!this.state.isActive && !this.state.isFinished) {
                        e.preventDefault();
                        this.soundManager.init();
                        this.startNewGame();
                    }
                    break;
                case 'r':
                case 'R':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.reset();
                    }
                    break;
                case 's':
                case 'S':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.openSettings();
                    }
                    break;
            }
        });
    }

    /**
     * 初始化光标
     */
    initCursor() {
        const cursor = document.getElementById('cursor');
        if (cursor) {
            const speed = this.state.cursorSpeed;
            cursor.setAttribute('data-speed', speed);
        }
    }

    /**
     * 开始新游戏
     */
    async startNewGame() {
        // 确保音频已初始化
        await this.soundManager.init();

        this.reset();
        this.state.isActive = true;
        this.elements.input.disabled = false;
        this.elements.input.focus();
        this.updateButtonStates();

        if (this.state.soundEnabled) {
            this.soundManager.playStart();
        }
    }

    /**
     * 重置游戏
     */
    reset() {
        this.stopTimer();
        this.pauseTimer();

        // 重置状态
        this.state.typedText = '';
        this.state.startTime = null;
        this.state.pausedTime = null;
        this.state.totalPauseDuration = 0;
        this.state.isActive = false;
        this.state.isFinished = false;
        this.state.totalCorrect = 0;
        this.state.totalErrors = 0;
        this.state.currentPosition = 0;
        this.state.timeRemaining = this.state.timeLimit;
        this.state.lastStats = { wpm: 0, accuracy: 100, correct: 0, errors: 0 };

        // 生成新文本
        this.generateText();

        // 重置输入框
        this.elements.input.value = '';
        this.elements.input.disabled = true;

        // 更新UI
        this.updateStats();
        this.renderText();
        this.updateButtonStates();
        requestAnimationFrame(() => this.updateCursorPosition());
    }

    /**
     * 暂停计时器
     */
    pauseTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
            this.state.pausedTime = Date.now();
        }
    }

    /**
     * 恢复计时器
     */
    resumeTimer() {
        if (this.state.pausedTime) {
            this.state.totalPauseDuration = (this.state.totalPauseDuration || 0) + (Date.now() - this.state.pausedTime);
            this.state.pausedTime = null;
            this.startTimer();
        }
    }

    /**
     * 再来一局
     */
    async playAgain() {
        this.closeModal();
        await this.showLoading(async () => {
            await this.delay(100);
        });
        this.startNewGame();
    }

    /**
     * 关闭模态框
     */
    closeModal() {
        this.elements.modal.style.display = 'none';
        this.elements.input.blur();
    }

    /**
     * 生成文本
     */
    generateText() {
        const difficulty = this.elements.difficulty.value;
        const texts = this.textLibrary[difficulty] || this.textLibrary.medium;
        this.state.targetText = texts[Math.floor(Math.random() * texts.length)];
        this.updateProgress();
    }

    /**
     * 处理输入
     */
    handleInput(e) {
        if (this.state.isFinished) return;

        const newText = e.target.value;
        const oldText = this.state.typedText;

        // 如果是第一个字符，开始计时
        if (!this.state.startTime && newText.length > 0) {
            this.state.startTime = Date.now();
            this.startTimer();
            this.state.isActive = true;
            this.updateButtonStates();
        }

        // 重新计算统计
        this.recalculateStats(newText);

        // 更新状态
        this.state.typedText = newText;
        this.state.currentPosition = newText.length;

        // 更新UI
        this.updateStatsWithAnimation();
        this.renderText();
        this.updateCursorPosition();

        // 检查是否完成
        if (newText.length >= this.state.targetText.length) {
            this.finish();
        }
    }

    /**
     * 重新计算统计信息
     */
    recalculateStats(newText) {
        let correct = 0;
        let errors = 0;

        for (let i = 0; i < newText.length; i++) {
            if (newText[i] === this.state.targetText[i]) {
                correct++;
            } else {
                errors++;
            }
        }

        // 如果有新字符添加，播放音效
        if (newText.length > this.state.typedText.length) {
            const newCharIndex = newText.length - 1;
            if (newText[newCharIndex] === this.state.targetText[newCharIndex]) {
                if (this.state.soundEnabled) {
                    this.soundManager.playCorrect();
                }
            } else {
                if (this.state.soundEnabled) {
                    this.soundManager.playError();
                }
            }
        }

        this.state.totalCorrect = correct;
        this.state.totalErrors = errors;
    }

    /**
     * 处理按键事件
     */
    handleKeydown(e) {
        if (e.key === 'Backspace') {
            if (this.state.soundEnabled) {
                this.soundManager.playBackspace();
            }
        }
    }

    /**
     * 开始计时器
     */
    startTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
        }

        this.state.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.state.startTime - (this.state.totalPauseDuration || 0);
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);

            this.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            this.updateWPM();
        }, 100);
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
     * 完成游戏
     */
    finish() {
        this.state.isFinished = true;
        this.stopTimer();
        this.elements.input.disabled = true;

        this.calculateFinalStats();
        this.saveToHistory();
        this.updateHistoryDisplay();

        setTimeout(() => {
            this.showResultModal();
        }, 500);
    }

    /**
     * 计算最终统计
     */
    calculateFinalStats() {
        const totalElapsed = Date.now() - this.state.startTime - (this.state.totalPauseDuration || 0);
        const elapsed = totalElapsed / 1000 / 60;
        const words = this.state.typedText.length / 5;
        const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;

        const accuracy = this.state.typedText.length > 0
            ? Math.round(((this.state.typedText.length - this.state.totalErrors) / this.state.typedText.length) * 100)
            : 100;

        const totalSeconds = Math.floor(totalElapsed / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        this.finalStats = {
            wpm: wpm,
            accuracy: Math.max(0, accuracy),
            time: timeStr,
            errors: this.state.totalErrors,
            correct: this.state.totalCorrect,
            totalCharacters: this.state.typedText.length
        };
    }

    /**
     * 显示结果模态框
     */
    showResultModal() {
        document.getElementById('resultWpm').textContent = this.finalStats.wpm;
        document.getElementById('resultAccuracy').textContent = `${this.finalStats.accuracy}%`;
        document.getElementById('resultTime').textContent = this.finalStats.time;
        document.getElementById('resultErrors').textContent = this.finalStats.errors;

        this.generateResultMessage();
        this.elements.modal.style.display = 'flex';

        // 添加庆祝动画
        setTimeout(() => {
            document.querySelectorAll('.result-value').forEach(el => {
                this.animationManager.addAnimation(el, 'celebrate');
            });
        }, 100);

        if (this.state.soundEnabled) {
            this.soundManager.playFinish();
        }
    }

    /**
     * 生成结果消息
     */
    generateResultMessage() {
        const wpm = this.finalStats.wpm;
        const accuracy = this.finalStats.accuracy;
        const messageElement = document.getElementById('resultMessage');

        let message = '';
        let level = '';

        if (wpm >= 70 && accuracy >= 98) {
            level = '专家级';
            message = '你的打字速度和准确率都非常出色！达到了专业水平。';
        } else if (wpm >= 50 && accuracy >= 95) {
            level = '熟练级';
            message = '表现优秀！打字速度快且准确度高。';
        } else if (wpm >= 30 && accuracy >= 90) {
            level = '进步级';
            message = '不错的成绩！继续练习可以提高速度和准确性。';
        } else {
            level = '初级';
            message = '保持练习！每天坚持会看到明显进步。';
        }

        if (accuracy < 90) {
            message += ' 建议放慢速度，优先保证准确性。';
        } else if (wpm < 40) {
            message += ' 可以尝试加快节奏，同时保持准确性。';
        }

        messageElement.textContent = `${level}: ${message} (${wpm} WPM, ${accuracy}% 准确率)`;
    }

    /**
     * 更新统计（带动画）
     */
    updateStatsWithAnimation() {
        this.updateWPM();
        this.updateAccuracy();
        this.updateCorrectCount();
        this.updateErrorCount();
        this.updateProgress();
    }

    /**
     * 更新统计
     */
    updateStats() {
        this.updateWPM();
        this.updateAccuracy();
        this.updateCorrectCount();
        this.updateErrorCount();
        this.updateProgress();
    }

    /**
     * 更新WPM（带动画）
     */
    updateWPM() {
        const wpmElement = this.elements.wpm;
        let wpm = 0;

        if (this.state.startTime && this.state.isActive) {
            const totalElapsed = Date.now() - this.state.startTime - (this.state.totalPauseDuration || 0);
            const elapsed = totalElapsed / 1000 / 60;
            const words = this.state.typedText.length / 5;
            wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
        }

        wpmElement.textContent = wpm;

        // 值变化时添加高亮
        if (wpm !== this.state.lastStats.wpm && wpm > 0) {
            this.animationManager.highlight(wpmElement);
            this.state.lastStats.wpm = wpm;
        }
    }

    /**
     * 更新准确率（带动画）
     */
    updateAccuracy() {
        const accuracyElement = this.elements.accuracy;
        const total = this.state.typedText.length;
        let accuracy = 100;

        if (total > 0) {
            accuracy = Math.round(((total - this.state.totalErrors) / total) * 100);
        }

        accuracyElement.textContent = `${Math.max(0, accuracy)}%`;

        // 值变化时添加高亮
        if (accuracy !== this.state.lastStats.accuracy && total > 0) {
            this.animationManager.highlight(accuracyElement);
            this.state.lastStats.accuracy = accuracy;
        }
    }

    /**
     * 更新正确字符数（带动画）
     */
    updateCorrectCount() {
        const correctElement = this.elements.correct;
        correctElement.textContent = this.state.totalCorrect;

        // 值变化时添加高亮
        if (this.state.totalCorrect !== this.state.lastStats.correct && this.state.totalCorrect > 0) {
            this.animationManager.highlight(correctElement);
            this.state.lastStats.correct = this.state.totalCorrect;
        }
    }

    /**
     * 更新错误字符数（带动画）
     */
    updateErrorCount() {
        const errorsElement = this.elements.errors;
        errorsElement.textContent = this.state.totalErrors;

        // 值变化时添加高亮
        if (this.state.totalErrors !== this.state.lastStats.errors && this.state.totalErrors > 0) {
            this.animationManager.highlight(errorsElement);
            this.state.lastStats.errors = this.state.totalErrors;
        }
    }

    /**
     * 更新进度
     */
    updateProgress() {
        const progress = this.state.typedText.length;
        const total = this.state.targetText.length;
        const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

        this.elements.progress.textContent = `${percentage}%`;
    }

    /**
     * 更新按钮状态
     */
    updateButtonStates() {
        this.elements.restartBtn.disabled = !this.state.isActive;
    }

    /**
     * 渲染文本
     */
    renderText() {
        if (this.renderFrameId) {
            cancelAnimationFrame(this.renderFrameId);
        }

        this.renderFrameId = requestAnimationFrame(() => {
            this.performRender();
        });
    }

    /**
     * 执行渲染
     */
    performRender() {
        const target = this.state.targetText;
        const typed = this.state.typedText;

        this.elements.text.innerHTML = '';

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < target.length; i++) {
            const span = document.createElement('span');
            span.textContent = target[i];

            if (i < typed.length) {
                if (typed[i] === target[i]) {
                    span.className = 'char-correct';
                } else {
                    span.className = 'char-incorrect';
                }
            } else if (i === typed.length) {
                span.className = 'char-current';
            }

            fragment.appendChild(span);
        }

        this.elements.text.appendChild(fragment);
        this.renderFrameId = null;
    }

    /**
     * 更新光标位置
     */
    updateCursorPosition() {
        const cursor = document.getElementById('cursor');
        if (!cursor) return;

        const textContainer = this.elements.text.parentElement;
        if (!textContainer) return;

        const spans = this.elements.text.querySelectorAll('span');

        if (spans.length === 0) {
            const containerStyle = window.getComputedStyle(textContainer);
            const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
            const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
            const fontSize = parseFloat(window.getComputedStyle(this.elements.text).fontSize) || 18;

            cursor.style.transform = `translate(${paddingLeft}px, ${paddingTop + 4}px)`;
            return;
        }

        const maxIndex = Math.max(0, spans.length - 1);
        const currentIndex = Math.min(this.state.currentPosition, maxIndex);

        if (currentIndex >= 0 && currentIndex < spans.length && spans[currentIndex]) {
            const rect = spans[currentIndex].getBoundingClientRect();
            const containerRect = textContainer.getBoundingClientRect();

            const x = rect.left - containerRect.left;
            const y = rect.top - containerRect.top;

            cursor.style.transform = `translate(${x}px, ${y + 4}px)`;
        } else if (spans.length > 0) {
            const lastSpan = spans[spans.length - 1];
            const rect = lastSpan.getBoundingClientRect();
            const containerRect = textContainer.getBoundingClientRect();

            const x = rect.right - containerRect.left;
            const y = rect.top - containerRect.top;

            cursor.style.transform = `translate(${x}px, ${y + 4}px)`;
        }
    }

    /**
     * 加载设置
     */
    loadSettings() {
        const savedSettings = localStorage.getItem('typingTestSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.state.soundEnabled = settings.soundEnabled !== false;
                this.state.cursorSpeed = settings.cursorSpeed || 'medium';
                this.state.showHints = settings.showHints !== false;
                this.state.punctuation = settings.punctuation || 'some';
                this.state.language = settings.language || 'zh';

                this.updateSoundButton();
                this.initCursor();
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
    }

    /**
     * 打开设置面板
     */
    openSettings() {
        document.getElementById('customWords').value = 50;
        document.getElementById('customTime').value = 60;
        document.getElementById('punctuation').value = this.state.punctuation;
        document.getElementById('language').value = this.state.language;
        document.getElementById('cursorSpeed').value = this.state.cursorSpeed;
        document.getElementById('showHints').checked = this.state.showHints;

        this.elements.settingsPanel.style.display = 'block';
    }

    /**
     * 关闭设置面板
     */
    closeSettings() {
        this.elements.settingsPanel.style.display = 'none';
    }

    /**
     * 保存设置
     */
    saveSettings() {
        this.state.punctuation = document.getElementById('punctuation').value;
        this.state.language = document.getElementById('language').value;
        this.state.cursorSpeed = document.getElementById('cursorSpeed').value;
        this.state.showHints = document.getElementById('showHints').checked;

        const settings = {
            soundEnabled: this.state.soundEnabled,
            cursorSpeed: this.state.cursorSpeed,
            showHints: this.state.showHints,
            punctuation: this.state.punctuation,
            language: this.state.language
        };

        localStorage.setItem('typingTestSettings', JSON.stringify(settings));
        this.closeSettings();
        this.applySettings();
    }

    /**
     * 重置设置
     */
    resetSettings() {
        this.state.soundEnabled = true;
        this.state.cursorSpeed = 'medium';
        this.state.showHints = true;
        this.state.punctuation = 'some';
        this.state.language = 'zh';

        document.getElementById('punctuation').value = 'some';
        document.getElementById('language').value = 'zh';
        document.getElementById('cursorSpeed').value = 'medium';
        document.getElementById('showHints').checked = true;

        this.applySettings();
    }

    /**
     * 应用设置
     */
    applySettings() {
        this.initCursor();
        this.updateSoundButton();
        this.showToast('设置已保存');
    }

    /**
     * 切换音效
     */
    toggleSound() {
        this.state.soundEnabled = this.soundManager.toggle();
        this.updateSoundButton();

        const settings = {
            soundEnabled: this.state.soundEnabled,
            cursorSpeed: this.state.cursorSpeed,
            showHints: this.state.showHints,
            punctuation: this.state.punctuation,
            language: this.state.language
        };
        localStorage.setItem('typingTestSettings', JSON.stringify(settings));

        if (this.state.soundEnabled) {
            this.soundManager.init().then(() => {
                this.soundManager.playToggle();
            });
        }
    }

    /**
     * 更新音效按钮
     */
    updateSoundButton() {
        const icon = this.elements.soundToggle.querySelector('i');
        if (icon) {
            icon.className = this.state.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        }
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('typingTestTheme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    /**
     * 更新游戏模式
     */
    updateGameMode() {
        const mode = this.elements.gameMode.value;
        this.state.gameMode = mode;

        if (this.state.isActive) {
            this.reset();
        }
    }

    /**
     * 更新难度
     */
    updateDifficulty() {
        const difficulty = this.elements.difficulty.value;

        if (this.state.isActive) {
            this.reset();
        }
    }

    /**
     * 保存到历史记录
     */
    saveToHistory() {
        const record = {
            date: new Date().toISOString(),
            stats: { ...this.finalStats }
        };

        this.state.history.unshift(record);

        if (this.state.history.length > 20) {
            this.state.history = this.state.history.slice(0, 20);
        }

        localStorage.setItem('typingHistory', JSON.stringify(this.state.history));
    }

    /**
     * 更新历史记录显示
     */
    updateHistoryDisplay() {
        const container = document.getElementById('historyList');
        if (!container) return;

        if (this.state.history.length === 0) {
            container.innerHTML = `
                <div class="history-empty">
                    <i class="fas fa-clipboard-list"></i>
                    <p>暂无历史记录</p>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        this.state.history.forEach((record) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-date">${new Date(record.date).toLocaleDateString('zh-CN')}</div>
                <div class="history-stats">
                    <span class="stat">${record.stats.wpm} WPM</span>
                    <span class="stat">${record.stats.accuracy}%</span>
                    <span class="stat">${record.stats.time}</span>
                    <span class="stat">${record.stats.errors} 错误</span>
                </div>
            `;
            fragment.appendChild(item);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    /**
     * 清空历史记录
     */
    clearHistory() {
        if (confirm('确定要清空历史记录吗？')) {
            this.state.history = [];
            localStorage.removeItem('typingHistory');
            this.updateHistoryDisplay();
            this.showToast('历史记录已清空');
        }
    }

    /**
     * 分享结果
     */
    shareResult() {
        const text = `我的打字速度测试结果：${this.finalStats.wpm} WPM，${this.finalStats.accuracy}% 准确率！`;

        if (navigator.share) {
            navigator.share({
                title: '打字速度测试结果',
                text: text,
                url: window.location.href
            }).catch(() => {
                this.fallbackShare(text);
            });
        } else {
            this.fallbackShare(text);
        }
    }

    /**
     * 备用分享方法
     */
    fallbackShare(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('结果已复制到剪贴板');
        }).catch(() => {
            prompt('复制以下文本分享结果：', text);
        });
    }

    /**
     * 显示提示消息
     */
    showToast(message) {
        let toast = document.getElementById('typingToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'typingToast';
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--color-bg-secondary);
                backdrop-filter: blur(16px);
                border: 1px solid var(--color-border);
                border-radius: var(--radius-lg);
                padding: var(--spacing-sm) var(--spacing-md);
                color: var(--color-text-primary);
                z-index: var(--z-index-toast);
                opacity: 0;
                transform: translateY(-20px);
                transition: all var(--transition-normal);
                max-width: 300px;
                box-shadow: var(--shadow-md);
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
        }, 3000);
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.typingTest = new TypingTest();
});
