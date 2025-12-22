/**
 * Snake Game - Modern Implementation
 */

class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Configuration
        this.gridSize = 20;
        this.tileCountX = 20;
        this.tileCountY = 20;
        
        // State
        this.state = {
            running: false,
            gameOver: false,
            paused: false,
            score: 0,
            highScore: parseInt(localStorage.getItem('snake_high') || 0),
            soundEnabled: true  // 默认开启声音
        };
        
        this.snake = [];
        this.food = null;
        this.dx = 0;
        this.dy = 0;
        
        // Input Queue to prevent self-collision on rapid keypress
        this.inputQueue = [];
        
        // Loop
        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.stepInterval = 100; // ms per step (speed)
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.bindEvents();
        this.reset();
        this.showOverlay('start-screen');
    }
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        // Snap to grid size
        this.tileCountX = Math.floor(rect.width / this.gridSize);
        this.tileCountY = Math.floor(rect.height / this.gridSize);
        
        this.canvas.width = this.tileCountX * this.gridSize;
        this.canvas.height = this.tileCountY * this.gridSize;
        
        // Center the canvas in container if there's leftover space
        // (CSS handles this usually, but good to be precise)
    }
    
    reset() {
        this.state.score = 0;
        this.state.running = false;
        this.state.gameOver = false;
        this.state.paused = false;
        this.stepInterval = 100;
        
        // Center snake
        const cx = Math.floor(this.tileCountX / 2);
        const cy = Math.floor(this.tileCountY / 2);
        
        this.snake = [
            {x: cx, y: cy},
            {x: cx-1, y: cy},
            {x: cx-2, y: cy}
        ];
        
        this.dx = 1;
        this.dy = 0;
        this.inputQueue = [];
        
        this.spawnFood();
        this.updateUI(); // 这会更新分数、长度和速度显示
    }
    
    spawnFood() {
        let valid = false;
        while (!valid) {
            this.food = {
                x: Math.floor(Math.random() * this.tileCountX),
                y: Math.floor(Math.random() * this.tileCountY),
                type: Math.random() > 0.8 ? 'gold' : 'normal'
            };
            
            // Check collision with snake
            valid = !this.snake.some(s => s.x === this.food.x && s.y === this.food.y);
        }
    }
    
    bindEvents() {
        document.addEventListener('keydown', e => {
            if (this.state.gameOver) return;
            
            switch(e.key) {
                case 'ArrowUp': this.queueInput(0, -1); break;
                case 'ArrowDown': this.queueInput(0, 1); break;
                case 'ArrowLeft': this.queueInput(-1, 0); break;
                case 'ArrowRight': this.queueInput(1, 0); break;
                case ' ': this.togglePause(); break;
            }
        });
        
        // Mobile controls
        const addBtn = (id, dx, dy) => {
            const btn = document.getElementById(id);
            if (btn) {
                // 触摸设备支持
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.queueInput(dx, dy);
                });

                // 桌面浏览器支持（点击）
                btn.addEventListener('click', () => {
                    this.queueInput(dx, dy);
                });

                // 添加反馈效果
                btn.addEventListener('mousedown', () => {
                    btn.style.transform = 'scale(0.95)';
                });

                btn.addEventListener('mouseup', () => {
                    btn.style.transform = 'scale(1)';
                });

                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = 'scale(1)';
                });
            }
        };
        addBtn('up-btn', 0, -1);
        addBtn('down-btn', 0, 1);
        addBtn('left-btn', -1, 0);
        addBtn('right-btn', 1, 0);
        
        document.getElementById('start-btn').addEventListener('click', () => this.start());
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.reset();
            this.start();
        });

        // 暂停按钮事件监听器
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());

        // 重新开始游戏按钮（控制面板中的）
        document.getElementById('restart-game-btn').addEventListener('click', () => {
            this.reset();
            this.start();
        });

        // 暂停屏幕中的重新开始按钮
        document.getElementById('restart-pause-btn').addEventListener('click', () => {
            this.reset();
            this.start();
        });

        // 声音切换按钮（基础实现）
        document.getElementById('sound-toggle').addEventListener('click', () => {
            this.state.soundEnabled = !this.state.soundEnabled;
            const icon = document.getElementById('sound-toggle').querySelector('i');
            icon.className = this.state.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            console.log('声音状态:', this.state.soundEnabled ? '开启' : '关闭');
        });
    }
    
    queueInput(ndx, ndy) {
        // Prevent reversing
        // We need to check against the *last queued* direction, or current if queue empty
        const lastMove = this.inputQueue.length > 0 ? this.inputQueue[this.inputQueue.length - 1] : {dx: this.dx, dy: this.dy};
        
        if (lastMove.dx + ndx === 0 && lastMove.dy + ndy === 0) return; // Opposite direction
        if (lastMove.dx === ndx && lastMove.dy === ndy) return; // Same direction
        
        // Max queue size 2 to prevent huge buffers
        if (this.inputQueue.length < 2) {
            this.inputQueue.push({dx: ndx, dy: ndy});
        }
    }
    
    togglePause() {
        if (!this.state.running) return;
        this.state.paused = !this.state.paused;
        if (this.state.paused) this.showOverlay('pause-screen');
        else this.hideOverlays();
    }
    
    start() {
        this.state.running = true;
        this.hideOverlays();
        this.lastTime = performance.now();
        requestAnimationFrame(t => this.loop(t));
    }
    
    loop(now) {
        if (!this.state.running) return;
        
        const dt = now - this.lastTime;
        this.lastTime = now;
        
        if (!this.state.paused) {
            this.accumulatedTime += dt;
            while (this.accumulatedTime >= this.stepInterval) {
                this.update();
                this.accumulatedTime -= this.stepInterval;
            }
        }
        
        this.draw();
        requestAnimationFrame(t => this.loop(t));
    }
    
    update() {
        // Process Input
        if (this.inputQueue.length > 0) {
            const next = this.inputQueue.shift();
            this.dx = next.dx;
            this.dy = next.dy;
        }
        
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        
        // Wall Collision
        if (head.x < 0 || head.x >= this.tileCountX || head.y < 0 || head.y >= this.tileCountY) {
            this.gameOver();
            return;
        }
        
        // Self Collision
        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.gameOver();
            return;
        }
        
        this.snake.unshift(head);
        
        // Food Collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.state.score += this.food.type === 'gold' ? 50 : 10;
            this.stepInterval = Math.max(50, this.stepInterval * 0.98); // Speed up
            this.spawnFood();
        } else {
            this.snake.pop();
        }
        // 确保UI始终更新（包括长度和速度）
        this.updateUI();
    }
    
    gameOver() {
        this.state.running = false;
        this.state.gameOver = true;
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('snake_high', this.state.highScore);
        }
        document.getElementById('final-score').textContent = this.state.score;
        document.getElementById('final-length').textContent = this.snake.length;
        this.showOverlay('game-over-screen');
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.state.score;
        document.getElementById('high-score').textContent = this.state.highScore;
        document.getElementById('length').textContent = this.snake.length;
        // 计算速度等级（步长越短，速度越快）
        const speedLevel = Math.max(1, Math.floor(150 / this.stepInterval));
        document.getElementById('speed').textContent = speedLevel;
    }
    
    draw() {
        // BG
        this.ctx.fillStyle = '#020617';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid (Optional - maybe too noisy)
        this.ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        this.ctx.lineWidth = 1;
        for(let x=0; x<=this.canvas.width; x+=this.gridSize) {
            this.ctx.beginPath(); this.ctx.moveTo(x,0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke();
        }
        for(let y=0; y<=this.canvas.height; y+=this.gridSize) {
            this.ctx.beginPath(); this.ctx.moveTo(0,y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke();
        }
        
        // Food
        const cx = this.food.x * this.gridSize + this.gridSize/2;
        const cy = this.food.y * this.gridSize + this.gridSize/2;
        const r = this.gridSize/2 - 2;
        
        this.ctx.fillStyle = this.food.type === 'gold' ? '#fbbf24' : '#f43f5e';
        this.ctx.shadowColor = this.ctx.fillStyle;
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, r, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // Snake
        this.snake.forEach((s, i) => {
            const x = s.x * this.gridSize;
            const y = s.y * this.gridSize;
            
            // Gradient Color
            const alpha = 1 - (i / this.snake.length) * 0.6;
            this.ctx.fillStyle = `rgba(16, 185, 129, ${alpha})`;
            
            if (i === 0) { // Head
                this.ctx.fillStyle = '#34d399';
                this.ctx.shadowColor = '#34d399';
                this.ctx.shadowBlur = 10;
            }
            
            this.ctx.fillRect(x+1, y+1, this.gridSize-2, this.gridSize-2);
            this.ctx.shadowBlur = 0;
        });
    }
    
    showOverlay(id) {
        document.querySelectorAll('.game-overlay').forEach(el => el.style.display = 'none');
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    hideOverlays() {
        document.querySelectorAll('.game-overlay').forEach(el => el.style.display = 'none');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new SnakeGame();
});
