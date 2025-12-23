/**
 * 打字速度测试游戏 - 现代化实现
 * 包含键盘导航、性能优化和更好的反馈机制
 */

class TypingTest {
    constructor() {
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
            settingsBtn: document.getElementById('settingsBtn'),
            settingsPanel: document.getElementById('settingsPanel'),
            closeSettingsBtn: document.getElementById('closeSettings'),
            saveSettingsBtn: document.getElementById('saveSettings'),
            resetSettingsBtn: document.getElementById('resetSettings'),
            clearHistoryBtn: document.getElementById('clearHistory'),
            shareResultBtn: document.getElementById('shareResult'),
            themeToggle: document.getElementById('themeToggle')
        };

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
            // 历史记录
            history: []
        };

        // 性能优化 - 防抖
        this.debounceTimers = {};

        // 初始化
        this.init();
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
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 输入事件 - 使用防抖优化
        this.elements.input.addEventListener('input', this.debounce((e) => this.handleInput(e), 10));
        this.elements.input.addEventListener('keydown', (e) => this.handleKeydown(e));

        // 按钮事件
        this.elements.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.elements.restartBtn.addEventListener('click', () => this.reset());
        this.elements.playAgainBtn.addEventListener('click', () => this.playAgain());
        this.elements.closeModalBtn.addEventListener('click', () => this.closeModal());

        // 设置事件
        this.elements.soundToggle.addEventListener('click', () => this.toggleSound());
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.elements.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.elements.resetSettingsBtn.addEventListener('click', () => this.resetSettings());

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
            // 只有点击面板背景而不是面板内容时才关闭
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
    }

    /**
     * 防抖函数
     */
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
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
            const speedMap = {
                slow: 0.8,
                medium: 1.0,
                fast: 1.5
            };
            cursor.style.animationDuration = `${speedMap[speed] || 1.0}s`;
        }
    }

    /**
     * 开始新游戏
     */
    startNewGame() {
        this.reset();
        this.state.isActive = true;
        this.elements.input.disabled = false;
        this.elements.input.focus();
        this.updateButtonStates();

        if (this.state.soundEnabled) {
            this.playSound('start');
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

        // 生成新文本
        this.generateText();

        // 重置输入框
        this.elements.input.value = '';
        this.elements.input.disabled = true;

        // 更新UI
        this.updateStats();
        this.renderText();
        this.updateButtonStates();
        // 使用 requestAnimationFrame 确保 DOM 更新后再更新光标位置
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
    playAgain() {
        this.closeModal();
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

        // 分析变化
        if (newText.length > oldText.length) {
            this.handleNewCharacter(newText, oldText);
        } else if (newText.length < oldText.length) {
            this.handleDeleteCharacter(newText, oldText);
        }

        // 更新状态
        this.state.typedText = newText;
        this.state.currentPosition = newText.length;

        // 更新UI
        this.updateStats();
        this.renderText();
        this.updateCursorPosition();

        // 检查是否完成
        if (newText.length >= this.state.targetText.length) {
            this.finish();
        }
    }

    /**
     * 处理新字符
     */
    handleNewCharacter(newText, oldText) {
        const newChar = newText[newText.length - 1];
        const targetChar = this.state.targetText[oldText.length];

        if (newChar === targetChar) {
            this.state.totalCorrect++;
            if (this.state.soundEnabled) {
                this.playSound('correct');
            }
        } else {
            this.state.totalErrors++;
            if (this.state.soundEnabled) {
                this.playSound('error');
            }
            this.showErrorFeedback(oldText.length);
        }
    }

    /**
     * 处理删除字符
     */
    handleDeleteCharacter(newText, oldText) {
        // 删除字符时不需要特殊处理
        // 统计会在下次输入时重新计算
    }

    /**
     * 处理按键事件
     */
    handleKeydown(e) {
        this.recordKeystroke(e.key);

        if (e.key === 'Backspace') {
            this.showBackspaceFeedback();
        }
    }

    /**
     * 记录按键统计
     */
    recordKeystroke(key) {
        // 可以扩展来记录按键统计
    }

    /**
     * 显示错误反馈
     */
    showErrorFeedback(position) {
        const spans = this.elements.text.querySelectorAll('span');
        if (spans[position]) {
            // 动画已经在CSS中通过类名应用
            // 这里只需要确保类名被正确应用
        }
    }

    /**
     * 显示退格键反馈
     */
    showBackspaceFeedback() {
        if (this.state.soundEnabled) {
            this.playSound('backspace');
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
        const elapsed = totalElapsed / 1000 / 60; // 分钟
        const words = this.state.typedText.length / 5;
        const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;

        const accuracy = this.state.typedText.length > 0
            ? Math.round(((this.state.typedText.length - this.state.totalErrors) / this.state.typedText.length) * 100)
            : 100;

        // 计算最终时间显示
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

        if (this.state.soundEnabled) {
            this.playSound('finish');
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
     * 更新WPM
     */
    updateWPM() {
        if (this.state.startTime && this.state.isActive) {
            const totalElapsed = Date.now() - this.state.startTime - (this.state.totalPauseDuration || 0);
            const elapsed = totalElapsed / 1000 / 60;
            const words = this.state.typedText.length / 5;
            const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;

            this.elements.wpm.textContent = wpm;
        } else {
            this.elements.wpm.textContent = '0';
        }
    }

    /**
     * 更新准确率
     */
    updateAccuracy() {
        const total = this.state.typedText.length;
        if (total > 0) {
            const accuracy = Math.round(((total - this.state.totalErrors) / total) * 100);
            this.elements.accuracy.textContent = `${Math.max(0, accuracy)}%`;
        } else {
            this.elements.accuracy.textContent = '100%';
        }
    }

    /**
     * 更新正确字符数
     */
    updateCorrectCount() {
        this.elements.correct.textContent = this.state.totalCorrect;
    }

    /**
     * 更新错误字符数
     */
    updateErrorCount() {
        this.elements.errors.textContent = this.state.totalErrors;
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

        // 修复：当没有字符时，将光标放在起始位置
        if (spans.length === 0) {
            // 获取容器的 padding
            const containerStyle = window.getComputedStyle(textContainer);
            const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
            const paddingTop = parseFloat(containerStyle.paddingTop) || 0;

            // 获取第一个字符的估算高度
            const fontSize = parseFloat(window.getComputedStyle(this.elements.text).fontSize) || 18;

            cursor.style.transform = `translate(${paddingLeft}px, ${paddingTop}px)`;
            return;
        }

        // 修复：确保 currentIndex 在有效范围内
        const maxIndex = Math.max(0, spans.length - 1);
        const currentIndex = Math.min(this.state.currentPosition, maxIndex);

        if (currentIndex >= 0 && spans[currentIndex]) {
            const rect = spans[currentIndex].getBoundingClientRect();
            const containerRect = textContainer.getBoundingClientRect();

            // 计算相对位置
            const x = rect.left - containerRect.left;
            const y = rect.top - containerRect.top;

            cursor.style.transform = `translate(${x}px, ${y}px)`;
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

                // 更新UI
                this.updateSoundButton();
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
        this.state.soundEnabled = !this.state.soundEnabled;
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
            this.playSound('toggle');
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
     * 播放音效
     */
    playSound(type) {
        if (!this.state.soundEnabled) return;
        console.log(`Playing sound: ${type}`);
        // 可以添加实际音效文件
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
        console.log(`Game mode changed to: ${mode}`);
    }

    /**
     * 更新难度
     */
    updateDifficulty() {
        const difficulty = this.elements.difficulty.value;
        console.log(`Difficulty changed to: ${difficulty}`);

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
