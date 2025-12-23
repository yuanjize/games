/**
 * Memory Cards - Modern Class Implementation
 */

class MemoryGame {
    constructor() {
        this.board = document.getElementById('gameBoard');
        this.stats = {
            moves: document.getElementById('moves'),
            matches: document.getElementById('matches'),
            timer: document.getElementById('timer')
        };

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

        this.config = {
            easy: { rows: 4, cols: 4, pairs: 8 },
            medium: { rows: 6, cols: 6, pairs: 18 },
            hard: { rows: 8, cols: 8, pairs: 32 }
        };

        this.themes = {
            animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌'],
            fruits: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🫒', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🫑', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜']
        };

        this.state = {
            difficulty: 'easy',
            theme: 'animals',
            cards: [],
            flipped: [],
            matched: [],
            moves: 0,
            startTime: 0,
            timerInterval: null,
            locked: false
        };

        this.audioCtx = null;
        this.loadBestScores();
        this.init();
    }

    init() {
        this.bindEvents();
        this.restart();
    }

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

    updateBestScoresDisplay() {
        ['easy', 'medium', 'hard'].forEach(difficulty => {
            const score = this.savedScores[difficulty];
            this.bestScores[difficulty].textContent = score.time ? this.formatTime(score.time) : '--:--';
            this.bestMoves[difficulty].textContent = score.moves !== null ? score.moves : '--';
        });
    }

    initAudio() {
        if (this.audioCtx) return;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {}
    }

    beep(freq = 523.25, type = 'sine', duration = 0.1) {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + duration);
        osc.stop(this.audioCtx.currentTime + duration);
    }

    bindEvents() {
        // 重新开始按钮
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('restartBtn').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.restart();
            }
        });

        // 难度选择 - 使用自定义单选按钮组
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

            // 添加标签属性
            btn.setAttribute('aria-labelledby', `${btn.dataset.difficulty}-label`);
        });

        // 主题切换按钮
        const themeBtn = document.getElementById('themeBtn');
        themeBtn.addEventListener('click', () => {
            this.toggleTheme();
        });
        themeBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleTheme();
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

        // 键盘快捷键
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
            if (e.key === 'Escape' && document.getElementById('winModal').classList.contains('active')) {
                this.closeWinModal();
            }
        });

        // 初始设置
        this.updateThemeButton();
    }

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

    toggleTheme() {
        this.state.theme = this.state.theme === 'animals' ? 'fruits' : 'animals';
        this.updateThemeButton();
        this.restart();
    }

    updateThemeButton() {
        const themeBtn = document.getElementById('themeBtn');
        const themeName = this.state.theme === 'animals' ? '动物' : '水果';
        themeBtn.innerHTML = `<i class="fas fa-palette" aria-hidden="true"></i> ${themeName}主题`;
        themeBtn.setAttribute('aria-label', `更换游戏主题，当前主题：${themeName}`);
    }

    closeWinModal() {
        document.getElementById('winModal').classList.remove('active');
    }

    restart() {
        this.initAudio();
        this.stopTimer(false); // 传入 false 表示不重置显示
        this.state.moves = 0;
        this.state.flipped = [];
        this.state.matched = [];
        this.state.locked = false;
        this.updateStats();

        // Setup Grid
        const cfg = this.config[this.state.difficulty];
        this.board.className = `game-board grid-${cfg.rows}x${cfg.cols}`;

        // Generate Cards
        const count = cfg.pairs;
        const icons = this.themes[this.state.theme].slice(0, count);
        const pairs = [...icons, ...icons];

        // Shuffle
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
    }

    flip(index) {
        const card = this.state.cards[index];
        if (this.state.locked || card.isFlipped || this.state.matched.includes(index)) return;

        this.beep(600, 'sine', 0.05);

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

    checkMatch() {
        const [i1, i2] = this.state.flipped;
        const c1 = this.state.cards[i1];
        const c2 = this.state.cards[i2];

        if (c1.icon === c2.icon) {
            this.beep(880, 'sine', 0.1);
            setTimeout(() => this.beep(1100, 'sine', 0.1), 100);

            c1.element.classList.add('matched');
            c2.element.classList.add('matched');
            c1.element.setAttribute('aria-label', `已匹配卡片 ${i1 + 1}，图案：${c1.icon}，已匹配`);
            c2.element.setAttribute('aria-label', `已匹配卡片 ${i2 + 1}，图案：${c2.icon}，已匹配`);
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
            setTimeout(() => {
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

    win() {
        // 计算最终时间
        const finalTime = Math.floor((Date.now() - this.state.startTime) / 1000);
        const finalMoves = this.state.moves;
        const totalPairs = Math.floor(this.state.cards.length / 2);

        // 停止计时器，但保留显示（不重置为00:00）
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
        }, 500);
    }

    startTimer() {
        this.state.startTime = Date.now();
        this.state.timerInterval = setInterval(() => {
            const sec = Math.floor((Date.now() - this.state.startTime) / 1000);
            this.stats.timer.textContent = this.formatTime(sec);
        }, 1000);
    }

    stopTimer(resetDisplay = true) {
        if (this.state.timerInterval) clearInterval(this.state.timerInterval);
        if (resetDisplay) {
            this.stats.timer.textContent = '00:00';
        }
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    updateStats() {
        this.stats.moves.textContent = this.state.moves;
        const currentPairs = Math.floor(this.state.matched.length / 2);
        const totalPairs = this.config[this.state.difficulty].pairs;
        this.stats.matches.textContent = `${currentPairs} / ${totalPairs}`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new MemoryGame();
});
