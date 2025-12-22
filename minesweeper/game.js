/**
 * Minesweeper - Modern Class Implementation
 */

class MinesweeperGame {
    constructor() {
        this.boardElement = document.getElementById('game-board');
        this.timerElement = document.getElementById('timer');
        this.minesElement = document.getElementById('mine-count');
        this.smileBtn = document.getElementById('smile-icon');
        this.gameStatusElement = document.getElementById('game-status');
        this.statusMessageElement = document.querySelector('.status-message');

        this.config = {
            beginner: { rows: 9, cols: 9, mines: 10 },
            intermediate: { rows: 16, cols: 16, mines: 40 },
            expert: { rows: 16, cols: 30, mines: 99 }
        };

        // 移动端检测
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.touchStartTime = 0;
        this.lastClickTime = 0; // 节流控制
        this.clickThrottleDelay = 200; // 最小点击间隔(毫秒)
        
        this.state = {
            difficulty: 'beginner',
            grid: [],
            gameState: 'ready', // ready, playing, won, lost
            minesLeft: 10,
            time: 0,
            timerInterval: null
        };
        
        this.audioCtx = null;
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.reset();
    }
    
    initAudio() {
        if (this.audioCtx) return;
        try {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {}
    }
    
    beep(freq, type, duration) {
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
        document.getElementById('restart-btn').addEventListener('click', () => this.reset());

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;

            // F键：标记旗帜
            if (e.key === 'f' || e.key === 'F') {
                const focusedCell = document.activeElement;
                if (focusedCell.classList.contains('cell') && !focusedCell.classList.contains('revealed')) {
                    const r = parseInt(focusedCell.dataset.r);
                    const c = parseInt(focusedCell.dataset.c);
                    this.handleRightClick(r, c);
                }
            }

            // 空格键：翻开格子
            if (e.key === ' ') {
                const focusedCell = document.activeElement;
                if (focusedCell.classList.contains('cell') && !focusedCell.classList.contains('revealed')) {
                    const r = parseInt(focusedCell.dataset.r);
                    const c = parseInt(focusedCell.dataset.c);
                    this.handleClick(r, c);
                    e.preventDefault(); // 防止空格键滚动页面
                }
            }
        });

        // 难度选择器 - 添加键盘导航支持
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.difficulty-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-checked', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-checked', 'true');
                this.state.difficulty = btn.dataset.difficulty;
                this.reset();
            });

            // Enter键支持
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        });
    }
    
    // 控制移动端提示显示
    toggleMobileHint(show) {
        const hintElement = document.getElementById('touch-hint');
        if (hintElement) {
            hintElement.style.display = show ? 'flex' : 'none';
        }
    }

    reset() {
        this.stopTimer();
        this.state.time = 0;
        this.state.gameState = 'ready';
        this.updateTimer();

        const cfg = this.config[this.state.difficulty];
        this.state.minesLeft = cfg.mines;
        this.updateMines();

        if(this.smileBtn) this.smileBtn.className = 'fas fa-smile';
        if(this.statusMessageElement) {
            this.statusMessageElement.textContent = '游戏进行中...';
            this.gameStatusElement.className = 'game-status';
        }

        // 显示/隐藏移动端提示
        this.toggleMobileHint(this.isMobile);

        // Setup Grid
        this.boardElement.className = `game-board ${this.state.difficulty}`;
        this.boardElement.innerHTML = '';
        
        this.state.grid = [];
        for(let r=0; r<cfg.rows; r++) {
            const row = [];
            for(let c=0; c<cfg.cols; c++) {
                const cell = document.createElement('button'); // 改为button元素
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.setAttribute('tabindex', '0');
                cell.setAttribute('role', 'button');
                cell.setAttribute('aria-label', `格子 (${r}, ${c})，未翻开`);
                
                // 事件监听
                // 桌面端事件
                cell.addEventListener('mousedown', e => {
                    if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;
                    if (e.button === 0) {
                        if(this.smileBtn) this.smileBtn.className = 'fas fa-surprise';
                    }
                });

                cell.addEventListener('mouseup', e => {
                    if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;
                    if(this.smileBtn) this.smileBtn.className = 'fas fa-smile';

                    if (e.button === 0) this.handleClick(r, c);
                });

                cell.addEventListener('contextmenu', e => {
                    e.preventDefault();
                    this.handleRightClick(r, c);
                });

                // 移动端触摸事件
                cell.addEventListener('touchstart', e => {
                    e.preventDefault();
                    if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;
                    this.touchStartTime = Date.now();

                    if(this.smileBtn) this.smileBtn.className = 'fas fa-surprise';
                }, { passive: false });

                cell.addEventListener('touchend', e => {
                    e.preventDefault();
                    if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;
                    const touchDuration = Date.now() - this.touchStartTime;

                    if(this.smileBtn) this.smileBtn.className = 'fas fa-smile';

                    if (touchDuration > 500) {
                        // 长按：标记旗帜
                        this.handleRightClick(r, c);
                    } else {
                        // 短按：翻开格子
                        this.handleClick(r, c);
                    }
                }, { passive: false });

                // 防止默认长按菜单
                cell.addEventListener('contextmenu', e => {
                    e.preventDefault();
                });
                
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
    
    startTimer() {
        this.state.timerInterval = setInterval(() => {
            this.state.time++;
            this.updateTimer();
        }, 1000);
    }
    
    stopTimer() {
        if (this.state.timerInterval) clearInterval(this.state.timerInterval);
    }
    
    updateTimer() {
        this.timerElement.textContent = this.state.time.toString().padStart(3, '0');
    }
    
    updateMines() {
        this.minesElement.textContent = this.state.minesLeft.toString().padStart(3, '0');
    }
    
    handleClick(r, c) {
        // 节流控制：防止过于频繁的点击
        const now = Date.now();
        if (now - this.lastClickTime < this.clickThrottleDelay) {
            return;
        }
        this.lastClickTime = now;

        this.initAudio();

        if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;

        const cell = this.state.grid[r][c];
        if (cell.isFlagged || cell.isRevealed) return;

        if (this.state.gameState === 'ready') {
            this.state.gameState = 'playing';
            this.placeMines(r, c);
            this.startTimer();
        }

        this.reveal(r, c);
    }
    
    handleRightClick(r, c) {
        if (this.state.gameState === 'won' || this.state.gameState === 'lost') return;
        const cell = this.state.grid[r][c];
        if (cell.isRevealed) return;
        
        cell.isFlagged = !cell.isFlagged;
        cell.element.classList.toggle('flagged');

        if (cell.isFlagged) {
            cell.element.setAttribute('aria-label', `格子 (${r}, ${c})，已标记为地雷`);
            cell.element.textContent = '🚩';
            this.state.minesLeft--;
            this.beep(600, 'triangle', 0.05);
        } else {
            cell.element.setAttribute('aria-label', `格子 (${r}, ${c})，未翻开`);
            cell.element.textContent = '';
            this.state.minesLeft++;
            this.beep(500, 'triangle', 0.05);
        }
        this.updateMines();
    }
    
    placeMines(safeR, safeC) {
        const cfg = this.config[this.state.difficulty];
        let placed = 0;
        while(placed < cfg.mines) {
            const r = Math.floor(Math.random() * cfg.rows);
            const c = Math.floor(Math.random() * cfg.cols);
            
            // Avoid safe zone (3x3 area around click)
            if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
            
            if (!this.state.grid[r][c].isMine) {
                this.state.grid[r][c].isMine = true;
                placed++;
            }
        }
        
        // Calc adjacents
        for(let r=0; r<cfg.rows; r++) {
            for(let c=0; c<cfg.cols; c++) {
                if (!this.state.grid[r][c].isMine) {
                    let count = 0;
                    for(let dr=-1; dr<=1; dr++) {
                        for(let dc=-1; dc<=1; dc++) {
                            if(dr===0 && dc===0) continue;
                            const nr = r+dr, nc = c+dc;
                            if(nr>=0 && nr<cfg.rows && nc>=0 && nc<cfg.cols && this.state.grid[nr][nc].isMine) {
                                count++;
                            }
                        }
                    }
                    this.state.grid[r][c].adjacent = count;
                }
            }
        }
    }
    
    reveal(r, c) {
        const cell = this.state.grid[r][c];
        if (cell.isRevealed || cell.isFlagged) return;

        cell.isRevealed = true;
        cell.element.classList.add('revealed');

        if (cell.isMine) {
            cell.element.classList.add('mine');
            cell.element.setAttribute('aria-label', `格子 (${r}, ${c})，地雷，游戏结束`);
            cell.element.textContent = '💣';
            this.lose();
            return;
        }

        this.beep(800, 'sine', 0.03);

        if (cell.adjacent > 0) {
            cell.element.textContent = cell.adjacent;
            cell.element.classList.add(`number-${cell.adjacent}`);
            cell.element.setAttribute('aria-label', `格子 (${r}, ${c})，已翻开，周围有 ${cell.adjacent} 个地雷`);
        } else {
            // 为当前格子设置ARIA标签
            cell.element.setAttribute('aria-label', `格子 (${r}, ${c})，已翻开，周围无地雷`);
            // BFS Flood Fill
            const queue = [{r, c}];
            const cfg = this.config[this.state.difficulty];
            
            // Already revealed current, now process neighbors
            while(queue.length > 0) {
                const curr = queue.shift();
                
                for(let dr=-1; dr<=1; dr++) {
                    for(let dc=-1; dc<=1; dc++) {
                        const nr = curr.r+dr, nc = curr.c+dc;
                        if(nr>=0 && nr<cfg.rows && nc>=0 && nc<cfg.cols) {
                            const neighbor = this.state.grid[nr][nc];
                            if(!neighbor.isRevealed && !neighbor.isFlagged) {
                                neighbor.isRevealed = true;
                                neighbor.element.classList.add('revealed');

                                if(neighbor.adjacent === 0) {
                                    neighbor.element.setAttribute('aria-label', `格子 (${nr}, ${nc})，已翻开，周围无地雷`);
                                    queue.push({r: nr, c: nc});
                                } else {
                                    neighbor.element.textContent = neighbor.adjacent;
                                    neighbor.element.classList.add(`number-${neighbor.adjacent}`);
                                    neighbor.element.setAttribute('aria-label', `格子 (${nr}, ${nc})，已翻开，周围有 ${neighbor.adjacent} 个地雷`);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        this.checkWin();
    }
    
    lose() {
        this.state.gameState = 'lost';
        this.stopTimer();
        if(this.smileBtn) this.smileBtn.className = 'fas fa-dizzy';
        this.beep(100, 'sawtooth', 0.5);

        // 更新状态消息
        if(this.statusMessageElement) {
            this.statusMessageElement.textContent = '游戏失败！点击上方笑脸重新开始';
            this.gameStatusElement.classList.remove('won');
            this.gameStatusElement.classList.add('lost');
        }

        // Reveal all mines
        this.state.grid.forEach(row => row.forEach(cell => {
            if (cell.isMine) {
                cell.element.classList.add('revealed', 'mine');
                cell.element.textContent = '💣';
                cell.element.setAttribute('aria-label', `格子 ${cell.element.dataset.r}, ${cell.element.dataset.c}，地雷，游戏失败`);
            }
        }));
    }
    
    checkWin() {
        const cfg = this.config[this.state.difficulty];
        let revealed = 0;
        this.state.grid.forEach(row => row.forEach(cell => {
            if (cell.isRevealed) revealed++;
        }));

        if (revealed === (cfg.rows * cfg.cols) - cfg.mines) {
            this.state.gameState = 'won';
            this.stopTimer();
            if(this.smileBtn) this.smileBtn.className = 'fas fa-sunglasses';
            this.beep(523, 'sine', 0.1);
            setTimeout(() => this.beep(659, 'sine', 0.1), 100);
            setTimeout(() => this.beep(784, 'sine', 0.2), 200);

            // 更新状态消息
            if(this.statusMessageElement) {
                this.statusMessageElement.textContent = `恭喜你赢了！用时 ${this.state.time} 秒`;
                this.gameStatusElement.classList.remove('lost');
                this.gameStatusElement.classList.add('won');
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new MinesweeperGame();
});
