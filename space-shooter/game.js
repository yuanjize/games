/**
 * Space Shooter - Modern Implementation
 * 完整功能的太空射击游戏
 * 包含暗色/亮色模式、微交互、加载动画、音效优化、可访问性增强、手势优化
 */

class SpaceShooterGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 初始化画布尺寸
        this.width = 800;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // 游戏状态
        this.state = {
            running: false,
            paused: false,
            score: 0,
            lives: 3,
            gameOver: false,
            gameTime: 0,
            enemiesDestroyed: 0,
            difficulty: 'easy',
            soundEnabled: true,
            musicEnabled: false,
            theme: 'dark', // 新增：主题状态
            highContrast: false, // 新增：高对比度模式
            previousScore: 0, // 新增：用于分数变化动画
            isLoading: true // 新增：加载状态
        };

        // 难度配置
        this.difficultySettings = {
            easy: { enemySpawnRate: 0.02, enemySpeed: 100, bulletSpeed: 600, playerSpeed: 7 },
            medium: { enemySpawnRate: 0.035, enemySpeed: 150, bulletSpeed: 600, playerSpeed: 6 },
            hard: { enemySpawnRate: 0.05, enemySpeed: 200, bulletSpeed: 500, playerSpeed: 5 }
        };

        // 玩家
        this.player = { x: 0, y: 0, w: 40, h: 40, speed: 7, cd: 0 };

        // 游戏对象
        this.bullets = [];
        this.enemies = [];
        this.stars = [];
        this.particles = [];

        // 输入
        this.keys = {};

        // 触摸控制
        this.touch = {
            active: false,
            startX: 0,
            startY: 0,
            moveX: 0,
            moveY: 0,
            shooting: false,
            longPressTimer: null, // 新增：长按定时器
            touchCount: 0, // 新增：触摸点计数（用于双指检测）
            lastTouchTime: 0 // 新增：上次触摸时间
        };

        // 本地存储的统计数据
        this.stats = this.loadStats();

        // 动画帧ID
        this.animationFrameId = null;

        // 新增：Web Audio API 上下文
        this.audioContext = null;
        this.audioBuffers = {};

        // 新增：主题管理
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.highContrastMode = localStorage.getItem('highContrast') === 'true';

        this.init();
    }

    // ========== 主题切换 ==========
    initTheme() {
        const html = document.documentElement;
        html.setAttribute('data-theme', this.currentTheme);

        if (this.highContrastMode) {
            document.body.classList.add('high-contrast-mode');
        }

        // 更新主题切换按钮图标
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (this.currentTheme === 'light') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }

        // 更新高对比度按钮状态
        const highContrastToggle = document.getElementById('highContrastToggle');
        if (highContrastToggle) {
            highContrastToggle.setAttribute('aria-pressed', this.highContrastMode);
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', this.currentTheme);

        const html = document.documentElement;
        html.setAttribute('data-theme', this.currentTheme);

        // 更新按钮图标
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (this.currentTheme === 'light') {
                icon.className = 'fas fa-sun';
            } else {
                icon.className = 'fas fa-moon';
            }
        }

        // 添加按钮点击动画
        this.addButtonAnimation(themeToggle);

        // 重绘画布以使用新颜色
        if (!this.state.running) {
            this.drawInitialBackground();
        }
    }

    toggleHighContrast() {
        this.highContrastMode = !this.highContrastMode;
        localStorage.setItem('highContrast', this.highContrastMode);

        const highContrastToggle = document.getElementById('highContrastToggle');
        if (highContrastToggle) {
            highContrastToggle.setAttribute('aria-pressed', this.highContrastMode);
        }

        if (this.highContrastMode) {
            document.body.classList.add('high-contrast-mode');
        } else {
            document.body.classList.remove('high-contrast-mode');
        }

        // 添加按钮点击动画
        this.addButtonAnimation(highContrastToggle);

        // 重绘画布
        if (!this.state.running) {
            this.drawInitialBackground();
        }
    }

    // ========== 加载动画 ==========
    async loadGameAssets() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingProgressBar = document.getElementById('loadingProgressBar');
        const loadingPercentage = document.getElementById('loadingPercentage');

        // 初始化音频上下文
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API 不支持');
        }

        // 模拟加载进度
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadingInterval);

                setTimeout(() => {
                    if (loadingOverlay) {
                        loadingOverlay.classList.add('hidden');
                        this.state.isLoading = false;
                    }
                }, 300);
            }

            if (loadingProgressBar) {
                loadingProgressBar.style.width = progress + '%';
            }
            if (loadingPercentage) {
                loadingPercentage.textContent = Math.floor(progress) + '%';
            }
        }, 100);
    }

    // ========== Web Audio API 音效系统 ==========
    async initAudio() {
        if (!this.audioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.log('Web Audio API 不支持');
                return;
            }
        }

        // 恢复音频上下文（某些浏览器需要用户交互后才能恢复）
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // 预加载音效
        this.loadSoundEffects();
    }

    loadSoundEffects() {
        // 使用 Web Audio API 生成音效（无需外部文件）
        this.audioBuffers = {
            shoot: this.createLaserSound(),
            explosion: this.createExplosionSound(),
            hit: this.createHitSound(),
            gameOver: this.createGameOverSound()
        };
    }

    createLaserSound() {
        const duration = 0.1;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // 激光音效：快速下降的频率
            data[i] = Math.sin(2 * Math.PI * (800 - 400 * t) * t) * Math.exp(-t * 20);
        }

        return buffer;
    }

    createExplosionSound() {
        const duration = 0.3;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // 爆炸音效：白噪声 + 快速衰减
            data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 10);
        }

        return buffer;
    }

    createHitSound() {
        const duration = 0.15;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // 击中音效：短促的高频音
            data[i] = Math.sin(2 * Math.PI * 1200 * t) * Math.exp(-t * 30);
        }

        return buffer;
    }

    createGameOverSound() {
        const duration = 0.8;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            // 游戏结束音效：下降的旋律
            const frequencies = [523, 494, 440, 392];
            const freqIndex = Math.floor(t * 8);
            const freq = frequencies[Math.min(freqIndex, frequencies.length - 1)];
            data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 3) * 0.5;
        }

        return buffer;
    }

    playWebAudioSound(buffer, volume = 0.3) {
        if (!this.audioContext || !this.state.soundEnabled || !buffer) return;

        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();

            source.buffer = buffer;
            gainNode.gain.value = volume;

            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            source.start(0);
        } catch (e) {
            console.log('音频播放失败:', e);
        }
    }

    // ========== 微交互动画 ==========
    addButtonAnimation(button) {
        button.classList.add('button-press');
        setTimeout(() => {
            button.classList.remove('button-press');
        }, 150);
    }

    addRippleEffect(event, button) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple-effect');

        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        button.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    }

    animateScoreChange(element, oldValue, newValue) {
        if (newValue <= oldValue) return;

        element.classList.add('score-update');
        setTimeout(() => {
            element.classList.remove('score-update');
        }, 300);
    }

    showAchievement(message, icon = 'fas fa-trophy') {
        const achievement = document.createElement('div');
        achievement.className = 'achievement-notification';
        achievement.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
        document.body.appendChild(achievement);

        setTimeout(() => {
            achievement.style.animation = 'slideDown 0.3s ease forwards';
            setTimeout(() => achievement.remove(), 300);
        }, 3000);
    }

    // ========== 帮助模态框 ==========
    showHelpModal() {
        const modal = document.getElementById('helpModal');
        if (modal) {
            modal.classList.add('active');
            modal.querySelector('.help-modal-close').focus();
        }
    }

    hideHelpModal() {
        const modal = document.getElementById('helpModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    init() {
        // 初始化主题
        this.initTheme();

        // 初始化加载动画
        this.loadGameAssets();

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.bindEvents();
        this.generateStars();
        this.reset();
        this.showOverlay('startScreen');
        this.updateStatsDisplay();
        // 绘制初始背景
        this.drawInitialBackground();
    }

    // ========== 绘制初始背景 ==========
    drawInitialBackground() {
        // 使用 CSS 变量获取当前背景色
        const canvasBg = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim() || '#020617';
        this.ctx.fillStyle = canvasBg;
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.drawStars();
    }

    // ========== 窗口大小调整 ==========
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            // 使用设备像素比来确保高清屏清晰度
            const dpr = Math.min(window.devicePixelRatio || 1, 2); // 限制最大 DPR 以提升性能

            // 设置画布的显示尺寸
            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';

            // 设置画布的实际尺寸（乘以设备像素比）
            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;

            // 缩放上下文以匹配设备像素比
            this.ctx.scale(dpr, dpr);

            this.width = rect.width;
            this.height = rect.height;

            // 根据屏幕大小调整玩家尺寸
            const isMobile = window.innerWidth < 768;
            this.player.w = isMobile ? 32 : 40;
            this.player.h = isMobile ? 32 : 40;

            // 重新生成星空以适应新尺寸
            this.generateStars();

            // 重新定位玩家
            if (!this.state.running) {
                this.player.x = this.width / 2 - this.player.w / 2;
                this.player.y = this.height - Math.min(isMobile ? 60 : 80, this.height * 0.15);
            } else {
                // 游戏运行时确保玩家在屏幕内
                this.player.x = Math.max(0, Math.min(this.width - this.player.w, this.player.x));
                this.player.y = Math.max(0, Math.min(this.height - this.player.h, this.player.y));
            }
        }

        // 如果游戏不在运行，重绘背景
        if (!this.state.running) {
            this.drawInitialBackground();
        }
    }

    // ========== 星空背景 ==========
    generateStars() {
        this.stars = [];
        const starCount = Math.floor((this.width * this.height) / 3000);
        for (let i = 0; i < Math.min(starCount, 200); i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.5 + 0.1,
                alpha: Math.random()
            });
        }
    }

    updateStars() {
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        });
    }

    drawStars() {
        this.stars.forEach(star => {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }

    // ========== 粒子效果 ==========
    createParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 0.5,
                maxLife: 0.5,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life / p.maxLife;
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        this.ctx.globalAlpha = 1;
    }

    // ========== 游戏重置 ==========
    reset() {
        this.state.score = 0;
        this.state.lives = 3;
        this.state.gameOver = false;
        this.state.paused = false;
        this.state.gameTime = 0;
        this.state.enemiesDestroyed = 0;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.player.x = this.width / 2 - this.player.w / 2;
        this.player.y = this.height - 80;
        this.player.cd = 0;
        this.updateUI();
    }

    // ========== 事件绑定 ==========
    bindEvents() {
        // 键盘事件
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            // P键暂停
            if (e.code === 'KeyP' && this.state.running && !this.state.gameOver) {
                this.togglePause();
            }

            // ESC返回菜单/关闭模态框
            if (e.code === 'Escape') {
                const helpModal = document.getElementById('helpModal');
                if (helpModal && helpModal.classList.contains('active')) {
                    this.hideHelpModal();
                } else if (this.state.running) {
                    this.showPauseMenu();
                }
            }

            // F1 键显示帮助
            if (e.code === 'F1') {
                e.preventDefault();
                this.showHelpModal();
            }

            // 空格键防止页面滚动
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // 新增：主题切换
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', (e) => {
                this.toggleTheme();
                this.addRippleEffect(e, themeToggle);
            });
        }

        // 新增：高对比度模式切换
        const highContrastToggle = document.getElementById('highContrastToggle');
        if (highContrastToggle) {
            highContrastToggle.addEventListener('click', (e) => {
                this.toggleHighContrast();
                this.addRippleEffect(e, highContrastToggle);
            });
        }

        // 新增：帮助模态框
        const closeHelpModal = document.getElementById('closeHelpModal');
        if (closeHelpModal) {
            closeHelpModal.addEventListener('click', () => this.hideHelpModal());
        }

        // 点击模态框背景关闭
        const helpModal = document.getElementById('helpModal');
        if (helpModal) {
            helpModal.addEventListener('click', (e) => {
                if (e.target === helpModal) {
                    this.hideHelpModal();
                }
            });
        }

        // 游戏按钮
        const startGameBtn = document.getElementById('startGameBtn');
        const playAgainBtn = document.getElementById('playAgainBtn');
        const backToMenuBtn = document.getElementById('backToMenuBtn');
        const restartGameBtn = document.getElementById('restartGameBtn');
        const resumeGameBtn = document.getElementById('resumeGameBtn');
        const pauseBtn = document.getElementById('pauseBtn');

        const addButtonEffects = (btn, handler) => {
            if (!btn) return;
            btn.addEventListener('click', (e) => {
                this.addButtonAnimation(btn);
                this.addRippleEffect(e, btn);
                handler();
            });
        };

        addButtonEffects(startGameBtn, () => this.start());
        addButtonEffects(playAgainBtn, () => {
            this.reset();
            this.start();
        });
        addButtonEffects(backToMenuBtn, () => this.backToMenu());
        addButtonEffects(restartGameBtn, () => {
            this.reset();
            this.start();
        });
        addButtonEffects(resumeGameBtn, () => this.resume());

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                if (this.state.running && !this.state.gameOver) {
                    this.showPauseMenu();
                }
            });
        }

        // 难度选择
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.difficulty = btn.dataset.difficulty;
                this.addRippleEffect(e, btn);
            });
        });

        // 音效控制
        const toggleSoundBtn = document.getElementById('toggleSoundBtn');
        const toggleMusicBtn = document.getElementById('toggleMusicBtn');

        if (toggleSoundBtn) {
            toggleSoundBtn.addEventListener('click', (e) => {
                this.toggleSound();
                this.addRippleEffect(e, toggleSoundBtn);
            });
        }
        if (toggleMusicBtn) {
            toggleMusicBtn.addEventListener('click', (e) => {
                this.toggleMusic();
                this.addRippleEffect(e, toggleMusicBtn);
            });
        }

        // 游戏说明折叠
        const instructionsToggle = document.getElementById('instructionsToggle');
        if (instructionsToggle) {
            instructionsToggle.addEventListener('click', () => {
                instructionsToggle.classList.toggle('active');
            });
        }

        // 分享按钮
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.addRippleEffect(e, btn);
                this.shareScore(btn.dataset.platform);
            });
        });

        // 触摸控制
        this.bindTouchEvents();
    }

    // ========== 触摸事件 ==========
    bindTouchEvents() {
        const joystickArea = document.getElementById('joystickArea');
        const shootButton = document.getElementById('shootButton');
        const canvas = this.canvas;

        if (!joystickArea || !shootButton) return;

        // 新增：画布长按显示帮助
        let longPressTimer = null;
        const longPressDuration = 800; // 长按800毫秒触发帮助

        canvas.addEventListener('touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                this.showHelpModal();
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            }, longPressDuration);
        }, { passive: true });

        canvas.addEventListener('touchend', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        canvas.addEventListener('touchmove', () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        });

        // 新增：双指暂停功能
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2 && this.state.running && !this.state.gameOver) {
                // 双指轻点暂停
                this.togglePause();
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }
            }
        }, { passive: false });

        // 虚拟摇杆
        joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.touch.active = true;
            const rect = joystickArea.getBoundingClientRect();
            // 使用触摸点相对于摇杆中心的位置
            this.touch.startX = rect.left + rect.width / 2;
            this.touch.startY = rect.top + rect.height / 2;

            // 立即更新位置
            this.handleJoystickMove(touch.clientX, touch.clientY, joystickArea);
        }, { passive: false });

        joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.touch.active) return;

            const touch = e.touches[0];
            this.handleJoystickMove(touch.clientX, touch.clientY, joystickArea);
        }, { passive: false });

        joystickArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touch.active = false;
            this.touch.moveX = 0;
            this.touch.moveY = 0;

            const joystickCenter = joystickArea.querySelector('.joystick-center');
            if (joystickCenter) {
                joystickCenter.style.transform = 'translate(-50%, -50%)';
            }
        });

        // 触摸取消处理
        joystickArea.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.touch.active = false;
            this.touch.moveX = 0;
            this.touch.moveY = 0;

            const joystickCenter = joystickArea.querySelector('.joystick-center');
            if (joystickCenter) {
                joystickCenter.style.transform = 'translate(-50%, -50%)';
            }
        });

        // 发射按钮 - 支持多点触控
        shootButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touch.shooting = true;
            // 添加触觉反馈（如果设备支持）
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        }, { passive: false });

        shootButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touch.shooting = false;
        });

        shootButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.touch.shooting = false;
        });
    }

    // 处理摇杆移动
    handleJoystickMove(clientX, clientY, joystickArea) {
        const deltaX = clientX - this.touch.startX;
        const deltaY = clientY - this.touch.startY;

        // 根据屏幕尺寸动态调整摇杆参数
        const isSmallScreen = window.innerWidth < 375;
        const isMediumScreen = window.innerWidth < 768;

        const maxDistance = isSmallScreen ? 35 : (isMediumScreen ? 40 : 50);
        const sensitivity = isSmallScreen ? 1.4 : (isMediumScreen ? 1.3 : 1.2);

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const clampedDistance = Math.min(distance, maxDistance);
        const angle = Math.atan2(deltaY, deltaX);

        // 增加灵敏度，使小距离移动更明显
        this.touch.moveX = Math.cos(angle) * (clampedDistance / maxDistance) * sensitivity;
        this.touch.moveY = Math.sin(angle) * (clampedDistance / maxDistance) * sensitivity;

        // 限制最大值
        this.touch.moveX = Math.max(-1, Math.min(1, this.touch.moveX));
        this.touch.moveY = Math.max(-1, Math.min(1, this.touch.moveY));

        // 更新摇杆视觉
        const joystickCenter = joystickArea.querySelector('.joystick-center');
        if (joystickCenter) {
            const visualOffset = maxDistance * 0.6;
            joystickCenter.style.transform = `translate(calc(-50% + ${this.touch.moveX * visualOffset}px), calc(-50% + ${this.touch.moveY * visualOffset}px))`;
        }
    }

    // ========== 游戏控制 ==========
    async start() {
        // 初始化音频上下文
        await this.initAudio();

        this.reset();
        this.state.running = true;
        this.hideOverlays();
        this.lastTime = performance.now();
        this.gameLoop();
        this.playSound('bgMusic', true);
    }

    gameLoop() {
        if (!this.state.running || this.state.paused) return;

        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;

        this.update(dt);
        this.draw();

        this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }

    togglePause() {
        this.state.paused = !this.state.paused;
        if (this.state.paused) {
            this.showPauseMenu();
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
            }
        } else {
            this.resume();
        }
    }

    showPauseMenu() {
        this.state.paused = true;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        const pauseScore = document.getElementById('pauseScore');
        const pauseLives = document.getElementById('pauseLives');
        const pauseTime = document.getElementById('pauseTime');

        if (pauseScore) pauseScore.textContent = this.state.score;
        if (pauseLives) pauseLives.textContent = this.state.lives;
        if (pauseTime) pauseTime.textContent = Math.floor(this.state.gameTime);

        this.showOverlay('pauseScreen');

        // 在移动设备上触发一次 resize 以确保画布正确
        if (window.innerWidth < 768) {
            this.resize();
        }
    }

    resume() {
        this.state.paused = false;
        this.hideOverlays();

        // 在移动设备上触发一次 resize 以确保画布正确
        if (window.innerWidth < 768) {
            this.resize();
        }

        this.lastTime = performance.now();
        this.gameLoop();
    }

    backToMenu() {
        this.state.running = false;
        this.state.paused = false;
        this.state.gameOver = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.reset();
        this.showOverlay('startScreen');
        this.stopSound('bgMusic');
        this.drawInitialBackground();
    }

    gameOver() {
        this.state.running = false;
        this.state.gameOver = true;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.stopSound('bgMusic');
        this.playSound('gameOverSound');

        // 更新统计数据
        this.updateStats();

        // 检查是否是新纪录
        const isNewRecord = this.state.score > this.stats.highScore;
        if (isNewRecord) {
            this.stats.highScore = this.state.score;
            this.saveStats();
        }

        // 显示游戏结束屏幕
        const finalScore = document.getElementById('finalScore');
        const finalTime = document.getElementById('finalTime');
        const finalEnemies = document.getElementById('finalEnemies');
        const highScoreContainer = document.getElementById('highScoreContainer');

        if (finalScore) finalScore.textContent = this.state.score;
        if (finalTime) finalTime.innerHTML = Math.floor(this.state.gameTime) + '<span>秒</span>';
        if (finalEnemies) finalEnemies.textContent = this.state.enemiesDestroyed;
        if (highScoreContainer) {
            highScoreContainer.style.display = isNewRecord ? 'flex' : 'none';
        }

        this.showOverlay('gameOverScreen');
        this.updateStatsDisplay();
    }

    // ========== 更新逻辑 ==========
    update(dt) {
        this.state.gameTime += dt;

        // 更新难度设置
        const settings = this.difficultySettings[this.state.difficulty];
        this.player.speed = settings.playerSpeed;

        // 更新星空
        this.updateStars();

        // 玩家移动
        this.updatePlayer(dt, settings);

        // 射击
        this.updateShooting(dt, settings);

        // 更新子弹
        this.updateBullets(dt, settings);

        // 生成敌人
        this.spawnEnemies(settings);

        // 更新敌人
        this.updateEnemies(dt, settings);

        // 更新粒子
        this.updateParticles(dt);

        // 更新UI
        this.updateUI();
    }

    updatePlayer(dt, settings) {
        let dx = 0, dy = 0;

        // 键盘控制
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) dx = -1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) dx = 1;
        if (this.keys['ArrowUp'] || this.keys['KeyW']) dy = -1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) dy = 1;

        // 触摸控制
        if (this.touch.active) {
            dx = this.touch.moveX;
            dy = this.touch.moveY;
        }

        // 归一化对角线移动
        if (dx !== 0 && dy !== 0 && !this.touch.active) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        this.player.x += dx * this.player.speed;
        this.player.y += dy * this.player.speed;

        // 边界检测
        this.player.x = Math.max(0, Math.min(this.width - this.player.w, this.player.x));
        this.player.y = Math.max(0, Math.min(this.height - this.player.h, this.player.y));
    }

    updateShooting(dt, settings) {
        if (this.player.cd > 0) {
            this.player.cd -= dt;
        }

        const isShooting = this.keys['Space'] || this.touch.shooting;

        if (isShooting && this.player.cd <= 0) {
            // 根据屏幕大小调整子弹尺寸
            const isMobile = window.innerWidth < 768;
            const bulletWidth = isMobile ? 3 : 4;
            const bulletHeight = isMobile ? 12 : 15;

            this.bullets.push({
                x: this.player.x + this.player.w / 2 - bulletWidth / 2,
                y: this.player.y,
                w: bulletWidth,
                h: bulletHeight,
                s: settings.bulletSpeed
            });
            this.player.cd = 0.2;
            this.playSound('shootSound');
        }
    }

    updateBullets(dt, settings) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.y -= b.s * dt;
            if (b.y < -20) {
                this.bullets.splice(i, 1);
            }
        }
    }

    spawnEnemies(settings) {
        if (Math.random() < settings.enemySpawnRate) {
            // 根据屏幕大小调整敌人尺寸
            const isMobile = window.innerWidth < 768;
            const enemySize = isMobile ? 32 : 40;

            this.enemies.push({
                x: Math.random() * (this.width - enemySize),
                y: -50,
                w: enemySize,
                h: enemySize,
                s: settings.enemySpeed + Math.random() * 50
            });
        }
    }

    updateEnemies(dt, settings) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.y += e.s * dt;

            // 玩家碰撞
            if (this.checkCollision(this.player, e)) {
                this.state.lives--;
                this.createParticles(e.x + e.w / 2, e.y + e.h / 2, '#f43f5e', 15);
                this.enemies.splice(i, 1);
                this.playSound('hitSound');
                this.updateUI();

                if (this.state.lives <= 0) {
                    this.gameOver();
                    return;
                }
                continue;
            }

            // 子弹碰撞
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                if (this.checkCollision(this.bullets[j], e)) {
                    this.state.score += 10;
                    this.state.enemiesDestroyed++;
                    this.createParticles(e.x + e.w / 2, e.y + e.h / 2, '#fbbf24', 10);
                    this.enemies.splice(i, 1);
                    this.bullets.splice(j, 1);
                    this.playSound('explosionSound');
                    this.updateUI();
                    break;
                }
            }

            // 移除出屏幕的敌人
            if (e.y > this.height) {
                this.enemies.splice(i, 1);
            }
        }
    }

    // ========== 碰撞检测 ==========
    checkCollision(r1, r2) {
        return r1.x < r2.x + r2.w &&
               r1.x + r1.w > r2.x &&
               r1.y < r2.y + r2.h &&
               r1.y + r1.h > r2.y;
    }

    // ========== 渲染 ==========
    draw() {
        // 使用 CSS 变量获取当前背景色
        const canvasBg = getComputedStyle(document.documentElement).getPropertyValue('--canvas-bg').trim() || '#020617';
        this.ctx.fillStyle = canvasBg;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 绘制星空
        this.drawStars();

        // 绘制粒子
        this.drawParticles();

        // 绘制玩家
        this.drawPlayer();

        // 绘制子弹
        this.drawBullets();

        // 绘制敌人
        this.drawEnemies();
    }

    drawPlayer() {
        const { x, y, w, h } = this.player;

        // 飞船主体
        this.ctx.fillStyle = '#06b6d4';
        this.ctx.beginPath();
        this.ctx.moveTo(x + w / 2, y);
        this.ctx.lineTo(x + w, y + h);
        this.ctx.lineTo(x + w / 2, y + h - Math.max(6, h * 0.25));
        this.ctx.lineTo(x, y + h);
        this.ctx.closePath();
        this.ctx.fill();

        // 引擎火焰 - 根据飞船大小调整
        this.ctx.fillStyle = '#fbbf24';
        const flameWidth = Math.max(3, w * 0.125);
        const flameHeight = Math.max(5, h * 0.25);
        const flameBaseY = y + h - Math.max(3, h * 0.125);
        const randomFlame = Math.random() * flameHeight;

        this.ctx.beginPath();
        this.ctx.moveTo(x + w / 2 - flameWidth, flameBaseY);
        this.ctx.lineTo(x + w / 2 + flameWidth, flameBaseY);
        this.ctx.lineTo(x + w / 2, y + h + randomFlame);
        this.ctx.closePath();
        this.ctx.fill();

        // 驾驶舱 - 根据飞船大小调整
        this.ctx.fillStyle = '#0891b2';
        const cockpitRadius = Math.max(3, w * 0.125);
        this.ctx.beginPath();
        this.ctx.arc(x + w / 2, y + h / 2, cockpitRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawBullets() {
        this.ctx.fillStyle = '#fbbf24';
        this.bullets.forEach(b => {
            // 子弹光晕
            this.ctx.shadowColor = '#fbbf24';
            this.ctx.shadowBlur = 10;
            this.ctx.fillRect(b.x, b.y, b.w, b.h);
            this.ctx.shadowBlur = 0;
        });
    }

    drawEnemies() {
        this.enemies.forEach(e => {
            // 敌人主体
            this.ctx.fillStyle = '#f43f5e';
            this.ctx.fillRect(e.x, e.y, e.w, e.h);

            // 根据敌人大小调整眼睛和嘴巴尺寸
            const eyeSize = Math.max(4, e.w * 0.2);
            const eyeOffsetX = e.w * 0.2;
            const eyeOffsetY = e.h * 0.25;
            const pupilSize = eyeSize * 0.5;
            const pupilOffset = eyeSize * 0.25;
            const mouthWidth = e.w * 0.4;
            const mouthHeight = Math.max(2, e.h * 0.1);
            const mouthY = e.h * 0.7;
            const mouthX = e.w * 0.3;

            // 敌人眼睛
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(e.x + eyeOffsetX, e.y + eyeOffsetY, eyeSize, eyeSize);
            this.ctx.fillRect(e.x + e.w - eyeOffsetX - eyeSize, e.y + eyeOffsetY, eyeSize, eyeSize);

            // 瞳孔
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(e.x + eyeOffsetX + pupilOffset, e.y + eyeOffsetY + pupilOffset, pupilSize, pupilSize);
            this.ctx.fillRect(e.x + e.w - eyeOffsetX - eyeSize + pupilOffset, e.y + eyeOffsetY + pupilOffset, pupilSize, pupilSize);

            // 嘴巴
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(e.x + mouthX, e.y + mouthY, mouthWidth, mouthHeight);
        });
    }

    // ========== UI更新 ==========
    updateUI() {
        const scoreDisplay = document.getElementById('scoreDisplay');
        const livesDisplay = document.getElementById('livesDisplay');
        const timeDisplay = document.getElementById('timeDisplay');
        const enemiesDisplay = document.getElementById('enemiesDisplay');
        const fireRateDisplay = document.getElementById('fireRateDisplay');

        // 分数变化动画
        if (scoreDisplay && this.state.score > this.state.previousScore) {
            const oldScore = this.state.previousScore;
            const newScore = this.state.score;
            scoreDisplay.textContent = newScore;
            this.animateScoreChange(scoreDisplay, oldScore, newScore);
            this.state.previousScore = newScore;
        } else if (scoreDisplay) {
            scoreDisplay.textContent = this.state.score;
        }

        if (livesDisplay) livesDisplay.textContent = this.state.lives;
        if (timeDisplay) timeDisplay.textContent = Math.floor(this.state.gameTime);
        if (enemiesDisplay) enemiesDisplay.textContent = this.state.enemiesDestroyed;

        // 更新心形生命显示
        const hearts = document.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            const wasActive = heart.classList.contains('active');
            const isActive = index < this.state.lives;
            heart.classList.toggle('active', isActive);

            // 生命减少动画
            if (wasActive && !isActive) {
                heart.classList.add('life-lost');
                setTimeout(() => {
                    heart.classList.remove('life-lost');
                }, 300);
            }
        });

        // 更新火力显示（基于难度）
        const fireRateText = {
            easy: '标准',
            medium: '快速',
            hard: '极速'
        };
        if (fireRateDisplay) {
            fireRateDisplay.textContent = fireRateText[this.state.difficulty];
        }
    }

    updateStats() {
        this.stats.totalGames++;
        if (this.state.score > this.stats.highScore) {
            this.stats.highScore = this.state.score;
        }
        if (this.state.gameTime > this.stats.bestTime) {
            this.stats.bestTime = Math.floor(this.state.gameTime);
        }
        this.stats.totalEnemies += this.state.enemiesDestroyed;
        this.saveStats();
    }

    updateStatsDisplay() {
        const totalGamesPlayed = document.getElementById('totalGamesPlayed');
        const bestScore = document.getElementById('bestScore');
        const bestTime = document.getElementById('bestTime');
        const totalEnemiesDestroyed = document.getElementById('totalEnemiesDestroyed');

        if (totalGamesPlayed) totalGamesPlayed.textContent = this.stats.totalGames || 0;
        if (bestScore) bestScore.textContent = this.stats.highScore || 0;
        if (bestTime) bestTime.innerHTML = (this.stats.bestTime || 0) + '<span>秒</span>';
        if (totalEnemiesDestroyed) totalEnemiesDestroyed.textContent = this.stats.totalEnemies || 0;
    }

    // ========== 覆盖层控制 ==========
    showOverlay(id) {
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }

        document.querySelectorAll('.screen').forEach(screen => {
            screen.style.display = 'none';
        });

        const targetScreen = document.getElementById(id);
        if (targetScreen) {
            targetScreen.style.display = 'flex';
        }
    }

    hideOverlays() {
        const overlay = document.getElementById('gameOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // ========== 音效控制 ==========
    playSound(soundId, loop = false) {
        if (!this.state.soundEnabled) return;

        // 优先使用 Web Audio API
        const soundMap = {
            'shootSound': 'shoot',
            'explosionSound': 'explosion',
            'hitSound': 'hit',
            'gameOverSound': 'gameOver'
        };

        if (soundMap[soundId] && this.audioBuffers[soundMap[soundId]]) {
            this.playWebAudioSound(this.audioBuffers[soundMap[soundId]]);
            return;
        }

        // 背景音乐继续使用 audio 元素
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.loop = loop;
            sound.play().catch(e => {
                console.log('音效播放失败:', e);
            });
        }
    }

    stopSound(soundId) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    toggleSound() {
        this.state.soundEnabled = !this.state.soundEnabled;
        const btn = document.getElementById('toggleSoundBtn');
        if (btn) {
            btn.classList.toggle('active', this.state.soundEnabled);
            const span = btn.querySelector('span');
            if (span) {
                span.textContent = `音效: ${this.state.soundEnabled ? '开启' : '关闭'}`;
            }
            btn.setAttribute('aria-label', `音效开关，当前为${this.state.soundEnabled ? '开启' : '关闭'}状态`);
        }
    }

    toggleMusic() {
        this.state.musicEnabled = !this.state.musicEnabled;
        const btn = document.getElementById('toggleMusicBtn');
        if (btn) {
            btn.classList.toggle('active', this.state.musicEnabled);
            const span = btn.querySelector('span');
            if (span) {
                span.textContent = `音乐: ${this.state.musicEnabled ? '开启' : '关闭'}`;
            }
            btn.setAttribute('aria-label', `背景音乐开关，当前为${this.state.musicEnabled ? '开启' : '关闭'}状态`);

            if (this.state.musicEnabled && this.state.running && !this.state.paused) {
                this.playSound('bgMusic', true);
            } else {
                this.stopSound('bgMusic');
            }
        }
    }

    // ========== 分享功能 ==========
    shareScore(platform) {
        const score = this.state.score;
        const time = Math.floor(this.state.gameTime);
        const enemies = this.state.enemiesDestroyed;
        const difficulty = {
            easy: '简单',
            medium: '中等',
            hard: '困难'
        }[this.state.difficulty];

        const shareText = `我在太空射击游戏中获得了${score}分！击毁${enemies}架敌机，生存${time}秒，难度${difficulty}。快来挑战吧！`;
        const shareUrl = window.location.href;

        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
            weibo: `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`,
            copy: null
        };

        if (platform === 'copy') {
            // 复制到剪贴板
            if (navigator.clipboard) {
                navigator.clipboard.writeText(`${shareText} ${shareUrl}`).then(() => {
                    this.showToast('已复制到剪贴板');
                }).catch(() => {
                    this.fallbackCopy(shareText, shareUrl);
                });
            } else {
                this.fallbackCopy(shareText, shareUrl);
            }
        } else if (shareUrls[platform]) {
            // 打开分享窗口
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    }

    fallbackCopy(text, url) {
        const textArea = document.createElement('textarea');
        textArea.value = `${text} ${url}`;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            this.showToast('已复制到剪贴板');
        } catch (e) {
            this.showToast('复制失败，请手动复制');
        }
        document.body.removeChild(textArea);
    }

    showToast(message) {
        // 移除已存在的提示
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        // 创建新提示
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--accent-primary);
            color: var(--text-primary);
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            z-index: 1000;
            animation: slideUp 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

        // 添加动画样式
        if (!document.getElementById('toast-animation')) {
            const style = document.createElement('style');
            style.id = 'toast-animation';
            style.textContent = `
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
                @keyframes slideDown {
                    from {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // ========== 本地存储 ==========
    loadStats() {
        try {
            const saved = localStorage.getItem('spaceShooterStats');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.log('无法加载统计数据');
        }
        return {
            totalGames: 0,
            highScore: 0,
            bestTime: 0,
            totalEnemies: 0
        };
    }

    saveStats() {
        try {
            localStorage.setItem('spaceShooterStats', JSON.stringify(this.stats));
        } catch (e) {
            console.log('无法保存统计数据');
        }
    }

    // ========== 清理资源 ==========
    destroy() {
        this.state.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        this.stopSound('bgMusic');
    }
}

// 游戏初始化
window.addEventListener('DOMContentLoaded', () => {
    window.game = new SpaceShooterGame();
    console.log('太空射击游戏已加载完成');
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (window.game) {
        window.game.destroy();
    }
});
