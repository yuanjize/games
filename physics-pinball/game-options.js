/* 游戏选项和可访问性功能 */

class GameOptionsManager {
    constructor(gameInstance) {
        this.game = gameInstance;
        if (!this.game) {
            console.warn('游戏实例未找到，部分功能可能不可用');
        }

        this.options = {
            soundEnabled: false,
            vibrationEnabled: false,
            highContrast: false,
            reducedMotion: false,
            largeText: false
        };

        this.modal = null;
        this.init();
    }

    init() {
        this.loadPreferences();
        this.bindOptionEvents();
        this.applyPreferences();
        this.setupKeyboardShortcuts();
        this.enhanceAccessibility();
    }

    loadPreferences() {
        // 尝试从本地存储加载用户偏好
        try {
            const savedOptions = localStorage.getItem('pinball_options');
            if (savedOptions) {
                const parsed = JSON.parse(savedOptions);
                this.options = { ...this.options, ...parsed };
            }

            // 从系统偏好加载
            this.options.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.options.highContrast = window.matchMedia('(prefers-contrast: high)').matches;
        } catch (error) {
            console.warn('无法加载用户偏好:', error);
        }
    }

    savePreferences() {
        try {
            localStorage.setItem('pinball_options', JSON.stringify(this.options));
        } catch (error) {
            console.warn('无法保存用户偏好:', error);
        }
    }

    bindOptionEvents() {
        // 声音切换
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => this.toggleSound());
            soundToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleSound();
                }
            });
        }

        // 振动切换
        const vibrationToggle = document.getElementById('vibration-toggle');
        if (vibrationToggle) {
            vibrationToggle.addEventListener('click', () => this.toggleVibration());
            vibrationToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleVibration();
                }
            });

            // 检查振动支持
            if (!('vibrate' in navigator)) {
                vibrationToggle.style.display = 'none';
            }
        }

        // 暂停按钮
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePauseGame());
            pauseBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.togglePauseGame();
                }
            });
        }

        // 键盘快捷键说明
        this.createKeyboardHelp();
    }

    togglePauseGame() {
        if (this.game && typeof this.game.togglePause === 'function') {
            this.game.togglePause();
        } else {
            console.warn('游戏暂停功能不可用');
        }
    }

    toggleSound() {
        this.options.soundEnabled = !this.options.soundEnabled;
        if (this.game) {
            this.game.soundEnabled = this.options.soundEnabled;
        }

        // 同步到音效管理器
        if (window.soundManager) {
            window.soundManager().setEnabled(this.options.soundEnabled);
        }

        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            const icon = soundToggle.querySelector('i');
            const srLabel = soundToggle.querySelector('.sr-only');

            if (this.options.soundEnabled) {
                if (icon) icon.className = 'fas fa-volume-up';
                if (srLabel) srLabel.textContent = '声音：开启';
                soundToggle.classList.add('active');
                if (this.game) this.game.announceScreenReaderMessage('声音效果已开启');

                // 初始化音效系统
                if (window.soundManager && !window.soundManager().initialized) {
                    window.soundManager().init();
                }
            } else {
                if (icon) icon.className = 'fas fa-volume-mute';
                if (srLabel) srLabel.textContent = '声音：关闭';
                soundToggle.classList.remove('active');
                if (this.game) this.game.announceScreenReaderMessage('声音效果已关闭');
            }
        }

        this.savePreferences();
    }

    toggleVibration() {
        this.options.vibrationEnabled = !this.options.vibrationEnabled;
        if (this.game) {
            this.game.vibrationEnabled = this.options.vibrationEnabled;
        }

        const vibrationToggle = document.getElementById('vibration-toggle');
        if (vibrationToggle) {
            const icon = vibrationToggle.querySelector('i');
            const srLabel = vibrationToggle.querySelector('.sr-only');

            if (this.options.vibrationEnabled) {
                if (icon) icon.className = 'fas fa-mobile-alt';
                if (srLabel) srLabel.textContent = '振动：开启';
                vibrationToggle.classList.add('active');
                if (this.game) this.game.announceScreenReaderMessage('振动反馈已开启');

                // 触觉反馈
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            } else {
                if (icon) icon.className = 'fas fa-mobile-alt';
                if (srLabel) srLabel.textContent = '振动：关闭';
                vibrationToggle.classList.remove('active');
                if (this.game) this.game.announceScreenReaderMessage('振动反馈已关闭');
            }
        }

        this.savePreferences();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 忽略在输入框中的快捷键
            if (e.target.matches('input, textarea, select')) {
                return;
            }

            // 检查是否按住了Ctrl或Alt键的组合
            const hasModifier = e.ctrlKey || e.altKey || e.metaKey;

            switch (true) {
                case (e.key === 'm' && hasModifier):
                    // Ctrl+M 或 Cmd+M: 切换静音
                    e.preventDefault();
                    this.toggleSound();
                    break;
                case (e.key === 'F1'):
                    // F1: 显示帮助
                    e.preventDefault();
                    this.showHelp();
                    break;
                case (e.key === 'F11'):
                    // F11: 切换全屏
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
            }
        });
    }

    enhanceAccessibility() {
        // 为键盘导航添加焦点环
        const style = document.createElement('style');
        style.textContent = `
            *:focus-visible {
                outline: 2px solid #6366f1 !important;
                outline-offset: 2px !important;
                border-radius: 2px !important;
            }

            .focus-indicator {
                position: absolute;
                border: 2px solid #6366f1;
                border-radius: 4px;
                pointer-events: none;
                z-index: 9999;
                transition: all 0.2s ease;
            }
        `;
        document.head.appendChild(style);

        // 添加屏幕阅读器专用内容
        this.addScreenReaderContent();
    }

    addScreenReaderContent() {
        // 添加游戏状态更新区域
        const srStatus = document.createElement('div');
        srStatus.id = 'sr-game-status';
        srStatus.className = 'sr-only';
        srStatus.setAttribute('aria-live', 'assertive');
        srStatus.setAttribute('aria-atomic', 'true');
        srStatus.textContent = '游戏准备就绪';

        // 添加分数更新区域
        const srScore = document.createElement('div');
        srScore.id = 'sr-score-update';
        srScore.className = 'sr-only';
        srScore.setAttribute('aria-live', 'polite');
        srScore.setAttribute('aria-atomic', 'true');
        srScore.textContent = '分数：0';

        // 如果不存在则添加
        if (!document.getElementById('sr-game-status')) {
            document.body.appendChild(srStatus);
        }
        if (!document.getElementById('sr-score-update')) {
            document.body.appendChild(srScore);
        }

        // 监控分数变化
        this.setupScoreMonitoring();
    }

    setupScoreMonitoring() {
        let lastScore = this.game ? this.game.state.score : 0;
        const observer = new MutationObserver(() => {
            if (this.game && this.game.state.score !== lastScore) {
                const srScore = document.getElementById('sr-score-update');
                if (srScore) {
                    srScore.textContent = `分数：${this.game.state.score}`;
                }
                lastScore = this.game.state.score;
            }
        });

        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            observer.observe(scoreElement, {
                childList: true,
                characterData: true,
                subtree: true
            });
        }
    }

    createKeyboardHelp() {
        // 检查是否已存在
        if (document.getElementById('keyboard-help-btn')) {
            return;
        }

        const helpButton = document.createElement('button');
        helpButton.id = 'keyboard-help-btn';
        helpButton.className = 'btn-option';
        helpButton.setAttribute('aria-label', '键盘快捷键说明');
        helpButton.innerHTML = '<i class="fas fa-keyboard"></i><span class="sr-only">帮助</span>';

        helpButton.addEventListener('click', () => this.showHelp());
        helpButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.showHelp();
            }
        });

        // 添加到选项区域
        const optionsContainer = document.querySelector('.game-options');
        if (optionsContainer) {
            optionsContainer.appendChild(helpButton);
        }

        // 创建帮助模态框
        this.createHelpModal();
    }

    createHelpModal() {
        // 检查是否已存在
        if (document.getElementById('help-modal')) {
            this.modal = document.getElementById('help-modal');
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'help-modal';
        modal.className = 'modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'modal-title');
        modal.setAttribute('aria-modal', 'true');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modal-title">键盘快捷键说明</h2>
                    <button class="modal-close" aria-label="关闭帮助">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <h3>游戏控制</h3>
                    <ul class="shortcut-list">
                        <li><span class="shortcut-key">←</span> 左箭头：向左移动挡板</li>
                        <li><span class="shortcut-key">→</span> 右箭头：向右移动挡板</li>
                        <li><span class="shortcut-key">空格</span> 空格键：发射球/继续游戏</li>
                        <li><span class="shortcut-key">R</span> R键：重新开始游戏</li>
                        <li><span class="shortcut-key">P</span> P键或ESC键：暂停/继续游戏</li>
                        <li><span class="shortcut-key">Enter</span> 回车键：在游戏结束时重新开始</li>
                    </ul>

                    <h3>功能快捷键</h3>
                    <ul class="shortcut-list">
                        <li><span class="shortcut-key">F1</span> F1键：显示此帮助信息</li>
                        <li><span class="shortcut-key">F11</span> F11键：切换全屏模式</li>
                        <li><span class="shortcut-key">Ctrl+M</span> 或 <span class="shortcut-key">Cmd+M</span>：切换声音效果</li>
                    </ul>

                    <h3>触摸控制</h3>
                    <p>在触摸设备上，可以直接触摸并拖动来控制挡板移动。</p>

                    <h3>可访问性功能</h3>
                    <ul class="shortcut-list">
                        <li>支持屏幕阅读器（如NVDA、VoiceOver）</li>
                        <li>支持键盘导航（Tab键切换焦点）</li>
                        <li>自动适应系统的高对比度设置</li>
                        <li>支持减少动画的偏好设置</li>
                        <li>所有按钮均有适当的ARIA标签</li>
                    </ul>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" id="close-help-btn">关闭帮助</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        // 添加模态框样式
        this.addModalStyles();

        // 绑定关闭事件
        const closeButtons = modal.querySelectorAll('.modal-close, #close-help-btn');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.hideHelp();
            });
        });

        // 点击模态框背景关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideHelp();
            }
        });

        // 按ESC键关闭
        this.escapeHandler = (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                this.hideHelp();
            }
        };
        document.addEventListener('keydown', this.escapeHandler);
    }

    addModalStyles() {
        // 检查是否已添加样式
        if (document.getElementById('modal-styles')) {
            return;
        }

        const modalStyle = document.createElement('style');
        modalStyle.id = 'modal-styles';
        modalStyle.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(10px);
            }

            .modal-content {
                background-color: var(--bg-panel);
                border-radius: var(--radius-xl);
                padding: var(--space-6);
                max-width: 36rem;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                border: 2px solid rgba(255, 255, 255, 0.1);
                box-shadow: var(--shadow-xl);
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: var(--space-4);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: var(--space-4);
            }

            .modal-header h2 {
                margin: 0;
                font-family: var(--font-heading);
                font-size: var(--font-size-2xl);
                color: var(--text-primary);
            }

            .modal-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: var(--font-size-xl);
                cursor: pointer;
                padding: var(--space-1);
                border-radius: var(--radius-sm);
                transition: background-color var(--transition-fast);
            }

            .modal-close:hover,
            .modal-close:focus {
                background-color: rgba(255, 255, 255, 0.1);
            }

            .modal-body h3 {
                margin-top: var(--space-4);
                margin-bottom: var(--space-2);
                font-family: var(--font-heading);
                font-size: var(--font-size-lg);
                color: var(--text-primary);
            }

            .modal-body p {
                color: var(--text-secondary);
                line-height: var(--line-height-normal);
            }

            .shortcut-list {
                list-style: none;
                padding: 0;
                margin: 0 0 var(--space-4) 0;
            }

            .shortcut-list li {
                margin-bottom: var(--space-2);
                padding: var(--space-2) var(--space-3);
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: var(--radius-sm);
                display: flex;
                align-items: center;
                gap: var(--space-3);
            }

            .shortcut-key {
                background-color: rgba(99, 102, 241, 0.2);
                color: var(--accent-primary);
                padding: var(--space-1) var(--space-2);
                border-radius: var(--radius-sm);
                font-family: monospace;
                font-weight: bold;
                min-width: 2.5rem;
                text-align: center;
                border: 1px solid var(--accent-primary);
            }

            .modal-footer {
                margin-top: var(--space-4);
                padding-top: var(--space-4);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                text-align: right;
            }
        `;
        document.head.appendChild(modalStyle);
    }

    showHelp() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.modal.setAttribute('aria-hidden', 'false');

            // 将焦点移动到模态框
            const closeBtn = this.modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.focus();
            }

            // 屏幕阅读器提示
            if (this.game) {
                this.game.announceScreenReaderMessage('已打开键盘快捷键帮助');
            }
        }
    }

    hideHelp() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.modal.setAttribute('aria-hidden', 'true');

            // 恢复焦点到帮助按钮
            const helpBtn = document.getElementById('keyboard-help-btn');
            if (helpBtn) {
                helpBtn.focus();
            }
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('全屏请求失败:', err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    applyPreferences() {
        // 应用声音设置
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            if (this.options.soundEnabled) {
                soundToggle.classList.add('active');
                const icon = soundToggle.querySelector('i');
                const srLabel = soundToggle.querySelector('.sr-only');
                if (icon) icon.className = 'fas fa-volume-up';
                if (srLabel) srLabel.textContent = '声音：开启';
            } else {
                soundToggle.classList.remove('active');
                const icon = soundToggle.querySelector('i');
                const srLabel = soundToggle.querySelector('.sr-only');
                if (icon) icon.className = 'fas fa-volume-mute';
                if (srLabel) srLabel.textContent = '声音：关闭';
            }
        }

        // 应用振动设置
        const vibrationToggle = document.getElementById('vibration-toggle');
        if (vibrationToggle) {
            if (this.options.vibrationEnabled) {
                vibrationToggle.classList.add('active');
                const srLabel = vibrationToggle.querySelector('.sr-only');
                if (srLabel) srLabel.textContent = '振动：开启';
            } else {
                vibrationToggle.classList.remove('active');
                const srLabel = vibrationToggle.querySelector('.sr-only');
                if (srLabel) srLabel.textContent = '振动：关闭';
            }
        }

        // 应用减少动画设置
        if (this.options.reducedMotion) {
            document.documentElement.style.setProperty('--transition-fast', '0s');
            document.documentElement.style.setProperty('--transition-normal', '0s');
            document.documentElement.style.setProperty('--transition-slow', '0s');
        }

        // 应用高对比度设置
        if (this.options.highContrast) {
            document.documentElement.style.setProperty('--text-primary', '#ffffff');
            document.documentElement.style.setProperty('--text-secondary', '#e0e0e0');
            document.documentElement.style.setProperty('--bg-primary', '#000000');
            document.documentElement.style.setProperty('--accent-primary', '#ff6b6b');
        }

        // 应用大字体设置
        if (this.options.largeText) {
            document.documentElement.style.setProperty('--font-size-base', '1.125rem');
            document.documentElement.style.setProperty('--font-size-lg', '1.25rem');
            document.documentElement.style.setProperty('--font-size-xl', '1.5rem');
            document.documentElement.style.setProperty('--font-size-2xl', '1.75rem');
        }
    }

    // 公开的API
    setSound(enabled) {
        this.options.soundEnabled = enabled;
        if (this.game) {
            this.game.soundEnabled = enabled;
        }
        this.applyPreferences();
        this.savePreferences();
    }

    setVibration(enabled) {
        this.options.vibrationEnabled = enabled;
        if (this.game) {
            this.game.vibrationEnabled = enabled;
        }
        this.applyPreferences();
        this.savePreferences();
    }

    toggleAccessibilityMode() {
        this.options.highContrast = !this.options.highContrast;
        this.applyPreferences();
        this.savePreferences();
    }

    // 清理资源
    destroy() {
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
        }

        const modal = document.getElementById('help-modal');
        if (modal) {
            modal.remove();
        }

        const helpBtn = document.getElementById('keyboard-help-btn');
        if (helpBtn) {
            helpBtn.remove();
        }
    }
}

// 全局导出
if (typeof window !== 'undefined') {
    window.GameOptionsManager = GameOptionsManager;
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameOptionsManager;
}
