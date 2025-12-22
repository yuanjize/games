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
            shareResultBtn: document.getElementById('shareResult')
        };

        // 文本库 - 根据难度分类
        this.textLibrary = {
            easy: [
                "The quick brown fox jumps over the lazy dog.",
                "I like to eat pizza with cheese and pepperoni.",
                "My cat sleeps on the sofa every afternoon.",
                "The sun is shining brightly in the sky today.",
                "We are going to the park to play with friends."
            ],
            medium: [
                "Programming is the art of telling another human being what one wants the computer to do.",
                "Logic will get you from A to B. Imagination will take you everywhere.",
                "Stay hungry, stay foolish. Innovation distinguishes between a leader and a follower.",
                "The best way to predict the future is to invent it.",
                "Life is what happens when you are busy making other plans."
            ],
            hard: [
                "The intricate design of modern processors involves billions of transistors working in harmony.",
                "Quantum computing leverages superposition and entanglement to solve complex computational problems.",
                "Machine learning algorithms analyze patterns in data to make predictions without explicit programming.",
                "Neural networks consist of interconnected nodes that mimic the structure of biological brains.",
                "Blockchain technology provides a decentralized and immutable ledger for secure transactions."
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
            history: JSON.parse(localStorage.getItem('typingHistory')) || []
        };

        // 性能优化
        this.lastRenderTime = 0;
        this.renderFrameId = null;

        // 初始化
        this.init();
    }

    /**
     * 初始化游戏
     */
    init() {
        this.bindEvents();
        this.loadSettings();
        this.updateHistoryDisplay();
        this.reset();

        // 添加键盘快捷键
        this.setupKeyboardShortcuts();

        // 初始化光标
        this.initCursor();
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 输入事件
        this.elements.input.addEventListener('input', (e) => this.handleInput(e));
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
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
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

        // 键盘快捷键 - Escape
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
                    e.preventDefault();
                    if (!this.state.isActive && !this.state.isFinished) {
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
            // 根据设置调整光标闪烁速度
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

        // 播放音效
        if (this.state.soundEnabled) {
            this.playSound('start');
        }
    }

    /**
     * 重置游戏
     */
    reset() {
        // 停止计时器
        this.stopTimer();

        // 重置状态
        this.state.typedText = '';
        this.state.startTime = null;
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

        // 重置光标位置
        this.updateCursorPosition();
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

        // 更新进度显示
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
            // 新增字符
            this.handleNewCharacter(newText, oldText);
        } else if (newText.length < oldText.length) {
            // 删除字符
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
            // 正确字符
            this.state.totalCorrect++;

            // 播放正确音效
            if (this.state.soundEnabled) {
                this.playSound('correct');
            }
        } else {
            // 错误字符
            this.state.totalErrors++;

            // 播放错误音效
            if (this.state.soundEnabled) {
                this.playSound('error');
            }

            // 错误动画
            this.showErrorFeedback(oldText.length);
        }
    }

    /**
     * 处理删除字符
     */
    handleDeleteCharacter(newText, oldText) {
        // 删除字符逻辑
        // 暂时不需要特殊处理
    }

    /**
     * 处理按键事件
     */
    handleKeydown(e) {
        // 记录按键统计
        this.recordKeystroke(e.key);

        // 处理特殊按键
        if (e.key === 'Backspace') {
            // 退格键反馈
            this.showBackspaceFeedback();
        }
    }

    /**
     * 记录按键统计
     */
    recordKeystroke(key) {
        // 可以扩展来记录按键统计
        // 例如：按键频率、常见错误等
    }

    /**
     * 显示错误反馈
     */
    showErrorFeedback(position) {
        const spans = this.elements.text.querySelectorAll('span');
        if (spans[position]) {
            // 添加错误类
            spans[position].classList.add('char-incorrect');

            // 震动反馈
            spans[position].style.animation = 'shake 0.3s ease';

            // 清除动画
            setTimeout(() => {
                spans[position].style.animation = '';
            }, 300);
        }
    }

    /**
     * 显示退格键反馈
     */
    showBackspaceFeedback() {
        if (this.state.soundEnabled) {
            // 播放退格音效
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
            const elapsed = Date.now() - this.state.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);

            // 更新计时器显示
            this.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // 实时更新WPM
            this.updateWPM();
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
     * 完成游戏
     */
    finish() {
        this.state.isFinished = true;
        this.stopTimer();
        this.elements.input.disabled = true;

        // 计算最终结果
        this.calculateFinalStats();

        // 保存历史记录
        this.saveToHistory();

        // 显示结果模态框
        setTimeout(() => {
            this.showResultModal();
        }, 500);
    }

    /**
     * 计算最终统计
     */
    calculateFinalStats() {
        const elapsed = (Date.now() - this.state.startTime) / 1000 / 60; // 分钟
        const words = this.state.typedText.length / 5;
        const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;

        const accuracy = this.state.typedText.length > 0
            ? Math.round(((this.state.typedText.length - this.state.totalErrors) / this.state.typedText.length) * 100)
            : 100;

        this.finalStats = {
            wpm: wpm,
            accuracy: Math.max(0, accuracy),
            time: this.elements.timer.textContent,
            errors: this.state.totalErrors,
            correct: this.state.totalCorrect,
            totalCharacters: this.state.typedText.length
        };
    }

    /**
     * 显示结果模态框
     */
    showResultModal() {
        // 更新模态框内容
        document.getElementById('resultWpm').textContent = this.finalStats.wpm;
        document.getElementById('resultAccuracy').textContent = `${this.finalStats.accuracy}%`;
        document.getElementById('resultTime').textContent = this.finalStats.time;
        document.getElementById('resultErrors').textContent = this.finalStats.errors;

        // 生成结果消息
        this.generateResultMessage();

        // 显示模态框
        this.elements.modal.style.display = 'flex';

        // 播放完成音效
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

        // 根据WPM和准确率评级
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

        // 提供具体建议
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
            const elapsed = (Date.now() - this.state.startTime) / 1000 / 60;
            const words = this.state.typedText.length / 5;
            const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;

            this.elements.wpm.textContent = wpm;
        } else {
            this.elements.wpm.textContent = 0;
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
        // 使用requestAnimationFrame优化性能
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

        // 清空并重建文本
        this.elements.text.innerHTML = '';

        // 性能优化：批量构建DOM
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

        // 获取当前字符的位置
        const spans = this.elements.text.querySelectorAll('span');
        const currentIndex = Math.min(this.state.currentPosition, spans.length - 1);

        if (currentIndex >= 0 && spans[currentIndex]) {
            const rect = spans[currentIndex].getBoundingClientRect();
            const textContainer = this.elements.text.parentElement;

            // 计算相对位置
            const x = rect.left - textContainer.getBoundingClientRect().left;
            const y = rect.top - textContainer.getBoundingClientRect().top;

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
            } catch (e) {
                console.error('Failed to load settings:', e);
            }
        }
    }

    /**
     * 打开设置面板
     */
    openSettings() {
        // 更新设置表单的值
        document.getElementById('customWords').value = 50;
        document.getElementById('customTime').value = 60;
        document.getElementById('punctuation').value = this.state.punctuation;
        document.getElementById('language').value = this.state.language;
        document.getElementById('cursorSpeed').value = this.state.cursorSpeed;
        document.getElementById('showHints').checked = this.state.showHints;

        // 显示设置面板
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
        // 获取表单值
        this.state.punctuation = document.getElementById('punctuation').value;
        this.state.language = document.getElementById('language').value;
        this.state.cursorSpeed = document.getElementById('cursorSpeed').value;
        this.state.showHints = document.getElementById('showHints').checked;

        // 保存到localStorage
        const settings = {
            soundEnabled: this.state.soundEnabled,
            cursorSpeed: this.state.cursorSpeed,
            showHints: this.state.showHints,
            punctuation: this.state.punctuation,
            language: this.state.language
        };

        localStorage.setItem('typingTestSettings', JSON.stringify(settings));

        // 关闭设置面板
        this.closeSettings();

        // 应用设置
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

        // 更新表单
        document.getElementById('punctuation').value = 'some';
        document.getElementById('language').value = 'zh';
        document.getElementById('cursorSpeed').value = 'medium';
        document.getElementById('showHints').checked = true;

        // 应用设置
        this.applySettings();
    }

    /**
     * 应用设置
     */
    applySettings() {
        this.initCursor();

        // 更新音效按钮状态
        this.updateSoundButton();

        // 提示设置已保存
        this.showToast('设置已保存');
    }

    /**
     * 切换音效
     */
    toggleSound() {
        this.state.soundEnabled = !this.state.soundEnabled;
        this.updateSoundButton();

        // 保存设置
        this.saveSettings();

        // 播放反馈音效
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

        // 在实际项目中，这里会加载并播放音频文件
        // 暂时使用控制台输出替代
        console.log(`Playing sound: ${type}`);

        // 可以添加实际音效
        // const audio = new Audio(`sounds/${type}.mp3`);
        // audio.play();
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const isDark = document.body.getAttribute('data-theme') !== 'light';
        const newTheme = isDark ? 'light' : 'dark';

        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('typingTestTheme', newTheme);

        // 更新按钮图标
        const icon = document.querySelector('#themeToggle i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    /**
     * 更新游戏模式
     */
    updateGameMode() {
        const mode = this.elements.gameMode.value;
        console.log(`Game mode changed to: ${mode}`);

        // 根据模式更新游戏
        // 在实际项目中，这里会有更多的逻辑
    }

    /**
     * 更新难度
     */
    updateDifficulty() {
        const difficulty = this.elements.difficulty.value;
        console.log(`Difficulty changed to: ${difficulty}`);

        // 重置游戏以应用新难度
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
            stats: this.finalStats
        };

        this.state.history.unshift(record);

        // 限制历史记录数量
        if (this.state.history.length > 20) {
            this.state.history = this.state.history.slice(0, 20);
        }

        // 保存到localStorage
        localStorage.setItem('typingHistory', JSON.stringify(this.state.history));

        // 更新显示
        this.updateHistoryDisplay();
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

        // 构建历史记录列表
        const fragment = document.createDocumentFragment();

        this.state.history.forEach((record, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <div class="history-date">${new Date(record.date).toLocaleDateString()}</div>
                <div class="history-stats">
                    <span class="stat">${record.stats.wpm} WPM</span>
                    <span class="stat">${record.stats.accuracy}%</span>
                    <span class="stat">${record.stats.time}</span>
                    <span class="stat">${record.stats.errors} errors</span>
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
            }).catch(err => {
                console.log('Error sharing:', err);
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
        // 复制到剪贴板
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('结果已复制到剪贴板');
        }).catch(err => {
            console.log('Failed to copy:', err);

            // 提示用户手动复制
            prompt('复制以下文本分享结果：', text);
        });
    }

    /**
     * 显示提示消息
     */
    showToast(message) {
        // 创建或更新提示元素
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
                border: 1px solid rgba(255, 255, 255, 0.08);
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

        // 自动隐藏
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
        }, 3000);
    }

    /**
     * 更新游戏模式设置
     */
    updateGameModeSettings() {
        // 根据游戏模式更新设置显示
        const mode = this.elements.gameMode.value;

        // 显示/隐藏自定义设置
        const customSettings = document.querySelector('.custom-settings');
        if (customSettings) {
            customSettings.style.display = mode === 'custom' ? 'block' : 'none';
        }
    }

    /**
     * 应用设置更改
     */
    applySettingsChanges() {
        // 重新初始化光标
        this.initCursor();

        // 更新音效按钮状态
        this.updateSoundButton();

        // 显示成功消息
        this.showToast('设置已应用');
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    window.typingTest = new TypingTest();
});

// 添加全局键盘快捷键
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + R 重新开始
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (window.typingTest) {
            window.typingTest.startNewGame();
        }
    }

    // Ctrl/Cmd + S 打开设置
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (window.typingTest) {
            window.typingTest.openSettings();
        }
    }
});