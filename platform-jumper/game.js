/**
 * Platform Jumper - 现代化响应式游戏实现
 * 包含可访问性支持和移动端优化
 */

const CONFIG = {
  gravity: 0.6,
  friction: 0.8,
  jumpForce: -15,
  moveSpeed: 5,
  colors: {
    player: '#f43f5e',
    platform: '#3b82f6',
    coin: '#fbbf24',
    enemy: '#a855f7',
    spike: '#ef4444'
  }
};

class PlatformJumperGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.state = {
      running: false,
      gameOver: false,
      score: 0,
      level: 1,
      lives: 3,
      collectedCoins: 0
    };

    this.entities = {
      player: { x: 0, y: 0, w: 30, h: 40, vx: 0, vy: 0, grounded: false },
      platforms: [],
      coins: [],
      enemies: [],
      spikes: []
    };

    this.input = { left: false, right: false };
    this.audioCtx = null;
    this.isMobile = this.checkMobile();

    // 初始化尺寸
    this.width = 800;
    this.height = 500;

    // 延迟初始化，确保 DOM 完全加载
    this.init();
  }

  checkMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindEvents();
    this.resetLevel();
    this.updateAccessibility();

    // 显示开始屏幕
    this.showOverlay('startScreen');
  }

  updateAccessibility() {
    // 更新屏幕阅读器可见的状态区域
    const statusElement = this.createOrGetElement('gameStatus', 'div');
    statusElement.className = 'sr-only';
    statusElement.setAttribute('role', 'status');
    statusElement.setAttribute('aria-live', 'polite');
    statusElement.id = 'gameStatus';
    document.body.appendChild(statusElement);
  }

  createOrGetElement(id, tag = 'div') {
    let element = document.getElementById(id);
    if (!element) {
      element = document.createElement(tag);
      element.id = id;
    }
    return element;
  }

  initAudio() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) { console.warn("音频初始化失败"); }
  }

  beep(freq = 440, type = 'sine', duration = 0.1) {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, this.audioCtx.currentTime + duration);
      osc.stop(this.audioCtx.currentTime + duration);
    } catch(e) {
      // 音频播放失败时静默处理
    }
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.width = rect.width;
    this.height = rect.height;

    if (this.entities.platforms.length > 0) {
      // 如果玩家超出屏幕，重新定位
      if (this.entities.player.x > this.width) this.entities.player.x = this.width - 50;
      // 更新地面平台位置
      if (this.entities.platforms.length > 0) {
        this.entities.platforms[0].y = this.height - 40;
        this.entities.platforms[0].w = this.width;
      }
    }
  }

  resetLevel() {
    // 确保尺寸已正确设置
    if (!this.width || !this.height) {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.width = rect.width || 800;
      this.height = rect.height || 500;
    }

    // 基础平台
    this.entities.platforms = [{
      x: 0, y: this.height - 40, w: this.width, h: 40, moving: false
    }];

    // 生成平台
    let y = this.height - 150;
    while (y > 100) {
      const w = 100 + Math.random() * 100;
      const x = Math.random() * (this.width - w);
      this.entities.platforms.push({
        x, y, w, h: 20,
        moving: this.state.level > 1 && Math.random() > 0.7,
        dir: 1, speed: 2, limit: 100, originX: x
      });

      // 生成金币机会
      if (Math.random() > 0.3) {
        this.entities.coins.push({
          x: x + w/2, y: y - 20, r: 10, collected: false
        });
      }

      // 生成尖刺机会（第2关及以上）
      if (this.state.level > 1 && Math.random() > 0.8) {
        this.entities.spikes.push({
          x: x + 20, y: y - 20, w: 20, h: 20
        });
      }

      y -= 100;
    }

    // 重置玩家位置
    this.entities.player = {
      x: 50, y: this.height - 100,
      w: 30, h: 40,
      vx: 0, vy: 0,
      grounded: false
    };
  }

  bindEvents() {
    // 键盘事件
    document.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') {
        this.input.left = true;
        this.announceScreenReader('向左移动');
      }
      if (e.key === 'ArrowRight') {
        this.input.right = true;
        this.announceScreenReader('向右移动');
      }
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (this.state.running) this.jump();
      }
    });

    document.addEventListener('keyup', e => {
      if (e.key === 'ArrowLeft') this.input.left = false;
      if (e.key === 'ArrowRight') this.input.right = false;
    });

    // 触摸事件
    const touchHandler = (key, val) => (e) => {
      e.preventDefault();
      this.input[key] = val;
      if (val) this.announceScreenReader(key === 'left' ? '向左移动' : '向右移动');
    };

    const leftBtn = document.getElementById('mobileLeft');
    if (leftBtn) {
      leftBtn.addEventListener('touchstart', touchHandler('left', true));
      leftBtn.addEventListener('touchend', touchHandler('left', false));
      leftBtn.addEventListener('mousedown', touchHandler('left', true));
      leftBtn.addEventListener('mouseup', touchHandler('left', false));
      leftBtn.addEventListener('mouseleave', () => this.input.left = false);
    }

    const rightBtn = document.getElementById('mobileRight');
    if (rightBtn) {
      rightBtn.addEventListener('touchstart', touchHandler('right', true));
      rightBtn.addEventListener('touchend', touchHandler('right', false));
      rightBtn.addEventListener('mousedown', touchHandler('right', true));
      rightBtn.addEventListener('mouseup', touchHandler('right', false));
      rightBtn.addEventListener('mouseleave', () => this.input.right = false);
    }

    const jumpBtn = document.getElementById('mobileJump');
    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.state.running) this.jump();
      });
      jumpBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (this.state.running) this.jump();
      });
    }

    // UI按钮
    const startBtn = document.getElementById('startButton');
    if (startBtn) startBtn.addEventListener('click', () => this.start());

    const restartBtn = document.getElementById('restartButton');
    if (restartBtn) restartBtn.addEventListener('click', () => this.restart());

    const nextBtn = document.getElementById('nextLevelButton');
    if (nextBtn) nextBtn.addEventListener('click', () => this.nextLevel());

    // 键盘快捷键：ESC暂停/继续
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (this.state.running) {
          this.state.running = false;
          this.announceScreenReader('游戏暂停');
        } else if (!this.state.gameOver) {
          this.state.running = true;
          this.loop();
          this.announceScreenReader('游戏继续');
        }
      }
    });
  }

  announceScreenReader(message) {
    const statusElement = document.getElementById('gameStatus');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  start() {
    this.initAudio();
    this.state.running = true;
    this.hideOverlays();
    this.announceScreenReader('游戏开始！当前得分：0，生命值：3，关卡：1');
    this.loop();
  }

  restart() {
    this.state.score = 0;
    this.state.level = 1;
    this.state.lives = 3;
    this.state.collectedCoins = 0;
    this.state.gameOver = false;
    this.entities.coins = [];
    this.entities.spikes = [];
    this.resetLevel();
    this.updateUI();
    this.start();
  }

  nextLevel() {
    this.state.level++;
    this.state.running = true;
    this.hideOverlays();
    this.entities.coins = [];
    this.entities.spikes = [];
    this.resetLevel();
    this.updateUI();
    this.announceScreenReader(`进入第${this.state.level}关！当前得分：${this.state.score}，生命值：${this.state.lives}`);
  }

  jump() {
    if (this.entities.player.grounded) {
      this.entities.player.vy = CONFIG.jumpForce;
      this.entities.player.grounded = false;
      this.beep(600, 'square', 0.1);
      this.announceScreenReader('跳跃！');
    }
  }

  update() {
    if (!this.state.running) return;

    const p = this.entities.player;

    // 输入处理
    if (this.input.left) p.vx -= 1;
    if (this.input.right) p.vx += 1;
    p.vx *= CONFIG.friction;

    // 物理计算
    p.vy += CONFIG.gravity;
    p.x += p.vx;
    p.y += p.vy;

    // 地面/平台碰撞检测
    p.grounded = false;
    this.entities.platforms.forEach(plat => {
      // 移动平台
      if (plat.moving) {
        plat.x += plat.speed * plat.dir;
        if (Math.abs(plat.x - plat.originX) > plat.limit) plat.dir *= -1;
      }

      // 碰撞检测
      if (p.x < plat.x + plat.w && p.x + p.w > plat.x &&
        p.y + p.h > plat.y && p.y + p.h < plat.y + plat.h + 20 &&
        p.vy >= 0) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.grounded = true;

          // 平台摩擦
          if (plat.moving) p.x += plat.speed * plat.dir;
      }
    });

    // 金币碰撞检测
    this.entities.coins.forEach(coin => {
      if (!coin.collected) {
        const dx = (p.x + p.w/2) - coin.x;
        const dy = (p.y + p.h/2) - coin.y;
        if (Math.sqrt(dx*dx + dy*dy) < p.w/2 + coin.r) {
          coin.collected = true;
          this.state.score += 10;
          this.state.collectedCoins++;
          this.beep(880, 'sine', 0.1);
          this.updateUI();
          this.announceScreenReader(`获得金币！当前得分：${this.state.score}`);
        }
      }
    });

    // 尖刺碰撞检测
    this.entities.spikes.forEach(spike => {
      if (p.x < spike.x + spike.w && p.x + p.w > spike.x &&
        p.y < spike.y + spike.h && p.y + p.h > spike.y) {
          this.handleDeath();
      }
    });

    // 边界检测
    if (p.x < 0) p.x = 0;
    if (p.x > this.width - p.w) p.x = this.width - p.w;
    if (p.y > this.height) this.handleDeath();

    // 关卡完成（到达顶部 - 使用更宽松的条件）
    const levelCompleteThreshold = Math.max(30, Math.min(50, this.height * 0.1));
    if (p.y < levelCompleteThreshold) {
      this.state.running = false;
      this.showOverlay('levelCompleteScreen');
      document.getElementById('completedLevel').textContent = this.state.level;
      document.getElementById('levelCoins').textContent = this.state.collectedCoins;
      this.beep(523, 'sine', 0.1);
      setTimeout(() => this.beep(659, 'sine', 0.1), 100);
      setTimeout(() => this.beep(784, 'sine', 0.2), 200);
      this.announceScreenReader(`关卡完成！获得${this.state.collectedCoins}个金币，总得分：${this.state.score}`);
    }
  }

  handleDeath() {
    // 防止多次触发死亡
    if (this.entities.player.invulnerable) return;

    this.state.lives--;
    this.updateUI();
    this.beep(150, 'sawtooth', 0.3);

    if (this.state.lives <= 0) {
      this.state.running = false;
      this.state.gameOver = true;
      this.showOverlay('gameOverScreen');
      document.getElementById('finalScore').textContent = this.state.score;
      document.getElementById('finalCoins').textContent = this.state.collectedCoins;
      document.getElementById('finalLevel').textContent = this.state.level;
      this.announceScreenReader(`游戏结束！最终得分：${this.state.score}，收集金币：${this.state.collectedCoins}，关卡进度：${this.state.level}`);
    } else {
      // 重生并短暂无敌
      this.entities.player.x = 50;
      this.entities.player.y = this.height - 100;
      this.entities.player.vy = 0;
      this.entities.player.invulnerable = true;
      setTimeout(() => {
        this.entities.player.invulnerable = false;
      }, 1000);
      this.announceScreenReader(`损失1点生命值，剩余生命：${this.state.lives}，重生！`);
    }
  }

  draw() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 绘制平台
    this.ctx.fillStyle = CONFIG.colors.platform;
    this.entities.platforms.forEach(p => {
      this.ctx.fillRect(p.x, p.y, p.w, p.h);
      // 阴影
      this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
      this.ctx.fillRect(p.x + 5, p.y + p.h, p.w - 10, 5);
      this.ctx.fillStyle = CONFIG.colors.platform;
    });

    // 绘制金币
    this.entities.coins.forEach(c => {
      if (!c.collected) {
        this.ctx.beginPath();
        this.ctx.arc(c.x, c.y, c.r, 0, Math.PI*2);
        this.ctx.fillStyle = CONFIG.colors.coin;
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        // 金币闪光效果
        this.ctx.beginPath();
        this.ctx.arc(c.x - 3, c.y - 3, c.r/3, 0, Math.PI*2);
        this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
        this.ctx.fill();
      }
    });

    // 绘制尖刺
    this.ctx.fillStyle = CONFIG.colors.spike;
    this.entities.spikes.forEach(s => {
      this.ctx.beginPath();
      this.ctx.moveTo(s.x, s.y + s.h);
      this.ctx.lineTo(s.x + s.w/2, s.y);
      this.ctx.lineTo(s.x + s.w, s.y + s.h);
      this.ctx.fill();
    });

    // 绘制玩家
    const p = this.entities.player;

    // 无敌状态闪烁效果
    if (p.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }

    this.ctx.fillStyle = CONFIG.colors.player;
    this.ctx.fillRect(p.x, p.y, p.w, p.h);

    // 眼睛
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(p.x + 5, p.y + 10, 8, 8);
    this.ctx.fillRect(p.x + p.w - 13, p.y + 10, 8, 8);

    // 眼珠
    this.ctx.fillStyle = '#1f2937';
    const eyeOffset = this.input.left ? -2 : (this.input.right ? 2 : 0);
    this.ctx.fillRect(p.x + 7 + eyeOffset, p.y + 12, 4, 4);
    this.ctx.fillRect(p.x + p.w - 11 + eyeOffset, p.y + 12, 4, 4);

    this.ctx.globalAlpha = 1;
  }

  loop() {
    if (!this.state.running) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }

  updateUI() {
    // 更新游戏状态显示
    document.getElementById('score').textContent = this.state.score;
    document.getElementById('coins').textContent = this.state.collectedCoins;
    document.getElementById('currentLevel').textContent = this.state.level;
    document.getElementById('health').textContent = this.state.lives;
  }

  showOverlay(id) {
    document.getElementById('gameOverlay').style.display = 'flex';
    document.querySelectorAll('.overlay-content').forEach(el => el.style.display = 'none');
    document.getElementById(id).style.display = 'block';

    // 更新aria-hidden属性
    document.getElementById('gameOverlay').setAttribute('aria-hidden', 'false');
  }

  hideOverlays() {
    document.getElementById('gameOverlay').style.display = 'none';
    document.getElementById('gameOverlay').setAttribute('aria-hidden', 'true');
  }
}

// 等待DOM加载完成
window.addEventListener('DOMContentLoaded', () => {
  window.game = new PlatformJumperGame();
});

// 防止浏览器缩放冲突
document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

// 禁用右键菜单（可选）
document.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'CANVAS') {
    e.preventDefault();
  }
});

// 防止iOS上的双击缩放
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);
