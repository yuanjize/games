/**
 * Platform Jumper - 现代化响应式游戏实现
 * 包含可访问性支持和移动端优化
 * 第1轮物理效果优化：跳跃曲线优化、粒子系统、金币动画、角色动画
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

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // 创建落地尘土效果
  createDustParticles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
      const speed = 1 + Math.random() * 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed * 0.5,
        vy: -Math.abs(Math.sin(angle)) * speed - 0.5, // 向上飘散
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: 2 + Math.random() * 3,
        color: `rgba(180, 200, 220, ${0.6 + Math.random() * 0.3})`,
        type: 'dust'
      });
    }
  }

  // 创建金币收集效果
  createCoinCollectEffect(x, y) {
    const particles = [];
    // 主金币粒子（旋转放大）
    particles.push({
      x: x,
      y: y,
      vx: 0,
      vy: -2,
      life: 1,
      decay: 0.03,
      size: 15,
      rotation: 0,
      rotationSpeed: 0.3,
      scale: 1.5,
      scaleSpeed: 0.02,
      color: '#fbbf24',
      type: 'coinMain',
      sparkle: true
    });

    // 星星粒子
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const speed = 2 + Math.random() * 1.5;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.025,
        size: 3 + Math.random() * 2,
        rotation: 0,
        rotationSpeed: 0.1 + Math.random() * 0.1,
        color: '#fcd34d',
        type: 'star'
      });
    }

    // 光环粒子
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: x,
        y: y,
        vx: 0,
        vy: -1,
        life: 1,
        decay: 0.02,
        size: 10 + i * 5,
        color: `rgba(251, 191, 36, ${0.4 - i * 0.1})`,
        type: 'ring',
        expandSpeed: 0.5 + i * 0.2
      });
    }

    this.particles.push(...particles);
  }

  // 创建跳跃轨迹效果
  createJumpTrail(x, y, vx, vy) {
    this.particles.push({
      x: x + Math.random() * 10 - 5,
      y: y,
      vx: -vx * 0.1,
      vy: -vy * 0.1,
      life: 0.6,
      decay: 0.04,
      size: 3 + Math.random() * 2,
      color: `rgba(244, 63, 94, ${0.3 + Math.random() * 0.2})`,
      type: 'trail'
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // 物理更新
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      // 特定类型粒子的特殊行为
      if (p.type === 'coinMain') {
        p.rotation += p.rotationSpeed;
        p.scale += p.scaleSpeed;
        p.vy *= 0.95;
        p.vx *= 0.98;
      } else if (p.type === 'star') {
        p.rotation += p.rotationSpeed;
        p.vy += 0.1; // 轻微重力
        p.vx *= 0.98;
      } else if (p.type === 'ring') {
        p.size += p.expandSpeed;
        p.vy *= 0.95;
      } else if (p.type === 'dust') {
        p.vy += 0.05; // 轻微重力
        p.vx *= 0.98;
      } else if (p.type === 'trail') {
        p.vx *= 0.9;
        p.vy *= 0.9;
      }

      // 移除死亡粒子
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;

      if (p.type === 'coinMain') {
        // 主金币粒子 - 旋转放大效果
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.scale, p.scale * Math.abs(Math.cos(p.rotation * 0.5)));

        // 金币主体
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 闪光效果
        if (p.sparkle) {
          ctx.beginPath();
          ctx.arc(-p.size * 0.3, -p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fill();
        }
      } else if (p.type === 'star') {
        // 星星粒子
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        this.drawStar(ctx, 0, 0, 5, p.size, p.size * 0.5);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else if (p.type === 'ring') {
        // 光环粒子
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (p.type === 'dust') {
        // 尘土粒子
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      } else if (p.type === 'trail') {
        // 跳跃轨迹
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      ctx.restore();
    });
  }

  drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }
}

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
      collectedCoins: 0,
      invulnerabilityTimer: null
    };

    this.entities = {
      player: { x: 0, y: 0, w: 30, h: 40, vx: 0, vy: 0, grounded: false, invulnerable: false },
      platforms: [],
      coins: [],
      enemies: [],
      spikes: []
    };

    // 粒子系统
    this.particles = new ParticleSystem();

    this.input = { left: false, right: false };
    this.audioCtx = null;
    this.isMobile = this.checkMobile();

    // 玩家动画状态
    this.playerAnim = {
      bouncePhase: 0,
      wasGrounded: false,
      squashX: 1,
      squashY: 1
    };

    // 时间追踪
    this.lastTime = 0;
    this.deltaTime = 0;

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
    const dpr = window.devicePixelRatio || 1;

    // 考虑设备像素比以获得清晰的渲染
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // 设置CSS尺寸
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // 缩放上下文以匹配设备像素比
    this.ctx.scale(dpr, dpr);

    // 保存逻辑尺寸
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

    // 重置玩家状态
    this.entities.player.invulnerable = false;
    if (this.state.invulnerabilityTimer) {
      clearTimeout(this.state.invulnerabilityTimer);
      this.state.invulnerabilityTimer = null;
    }

    // 清空现有实体
    this.entities.coins = [];
    this.entities.spikes = [];

    // 基础平台
    this.entities.platforms = [{
      x: 0, y: this.height - 40, w: this.width, h: 40, moving: false
    }];

    // 根据屏幕尺寸调整平台生成参数
    const isSmallScreen = this.width < 400;
    const platformGap = isSmallScreen ? 80 : 100;
    const minPlatformWidth = isSmallScreen ? 60 : 100;
    const maxPlatformWidth = isSmallScreen ? 80 : 150;

    // 生成平台
    let y = this.height - (isSmallScreen ? 120 : 150);
    while (y > (isSmallScreen ? 60 : 80)) {
      const w = minPlatformWidth + Math.random() * (maxPlatformWidth - minPlatformWidth);
      const x = Math.max(0, Math.random() * (this.width - w));
      this.entities.platforms.push({
        x, y, w, h: 20,
        moving: this.state.level > 1 && Math.random() > 0.7,
        dir: 1, speed: 2, limit: Math.min(80, this.width / 4), originX: x
      });

      // 生成金币机会
      if (Math.random() > 0.3) {
        this.entities.coins.push({
          x: x + w/2, y: y - 20, r: isSmallScreen ? 8 : 10, collected: false
        });
      }

      // 生成尖刺机会（第2关及以上）
      if (this.state.level > 1 && Math.random() > 0.8) {
        this.entities.spikes.push({
          x: Math.min(x + 10, this.width - 30), y: y - 20, w: isSmallScreen ? 15 : 20, h: isSmallScreen ? 15 : 20
        });
      }

      y -= platformGap;
    }

    // 添加顶部平台作为关卡目标
    const topPlatformWidth = Math.min(isSmallScreen ? 120 : 200, this.width - 50);
    this.entities.platforms.push({
      x: Math.max(10, (this.width - topPlatformWidth) / 2),
      y: 20,
      w: topPlatformWidth,
      h: 20,
      moving: false,
      isGoal: true
    });

    // 重置玩家位置和尺寸（小屏幕上角色稍小）
    const playerScale = isSmallScreen ? 0.8 : 1;
    this.entities.player = {
      x: 30, y: this.height - 100,
      w: Math.round(30 * playerScale), h: Math.round(40 * playerScale),
      vx: 0, vy: 0,
      grounded: false,
      invulnerable: false
    };

    // 重置动画状态
    this.playerAnim.bouncePhase = 0;
    this.playerAnim.wasGrounded = false;
    this.playerAnim.squashX = 1;
    this.playerAnim.squashY = 1;
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

    // 触摸事件 - 改进的多点触控支持
    const handleTouchStart = (key) => (e) => {
      e.preventDefault();
      this.input[key] = true;
      if (key !== 'jump') {
        this.announceScreenReader(key === 'left' ? '向左移动' : '向右移动');
      }
    };

    const handleTouchEnd = (key) => (e) => {
      e.preventDefault();
      this.input[key] = false;
    };

    const leftBtn = document.getElementById('mobileLeft');
    if (leftBtn) {
      // 使用 pointer events 以获得更好的触摸支持
      leftBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.input.left = true;
        leftBtn.setPointerCapture(e.pointerId);
      });
      leftBtn.addEventListener('pointerup', (e) => {
        e.preventDefault();
        this.input.left = false;
      });
      leftBtn.addEventListener('pointerleave', (e) => {
        this.input.left = false;
      });
      leftBtn.addEventListener('pointercancel', (e) => {
        this.input.left = false;
      });
      // 保留鼠标事件作为后备
      leftBtn.addEventListener('mousedown', () => this.input.left = true);
      leftBtn.addEventListener('mouseup', () => this.input.left = false);
      leftBtn.addEventListener('mouseleave', () => this.input.left = false);
    }

    const rightBtn = document.getElementById('mobileRight');
    if (rightBtn) {
      rightBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.input.right = true;
        rightBtn.setPointerCapture(e.pointerId);
      });
      rightBtn.addEventListener('pointerup', (e) => {
        e.preventDefault();
        this.input.right = false;
      });
      rightBtn.addEventListener('pointerleave', (e) => {
        this.input.right = false;
      });
      rightBtn.addEventListener('pointercancel', (e) => {
        this.input.right = false;
      });
      // 保留鼠标事件作为后备
      rightBtn.addEventListener('mousedown', () => this.input.right = true);
      rightBtn.addEventListener('mouseup', () => this.input.right = false);
      rightBtn.addEventListener('mouseleave', () => this.input.right = false);
    }

    const jumpBtn = document.getElementById('mobileJump');
    if (jumpBtn) {
      jumpBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (this.state.running) this.jump();
        jumpBtn.setPointerCapture(e.pointerId);
      });
      // 保留鼠标事件作为后备
      jumpBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (this.state.running) this.jump();
      });
    }

    // 防止画布上的默认触摸行为（滚动、缩放等）
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

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
    this.lastTime = performance.now();
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
    this.particles.particles = [];
    this.resetLevel();
    this.updateUI();
    this.start();
  }

  nextLevel() {
    this.state.level++;
    this.state.collectedCoins = 0; // 重置当前关卡金币计数
    this.state.running = true;
    this.hideOverlays();
    this.entities.coins = [];
    this.entities.spikes = [];
    this.particles.particles = [];
    this.resetLevel();
    this.updateUI();
    this.announceScreenReader(`进入第${this.state.level}关！当前得分：${this.state.score}，生命值：${this.state.lives}`);
  }

  jump() {
    if (this.entities.player.grounded) {
      this.entities.player.vy = CONFIG.jumpForce;
      this.entities.player.grounded = false;

      // 跳跃时的挤压效果
      this.playerAnim.squashX = 0.8;
      this.playerAnim.squashY = 1.2;

      this.beep(600, 'square', 0.1);
      this.announceScreenReader('跳跃！');

      // 创建跳跃尘土效果
      this.particles.createDustParticles(
        this.entities.player.x + this.entities.player.w / 2,
        this.entities.player.y + this.entities.player.h
      );
    }
  }

  update(deltaTime) {
    if (!this.state.running) return;

    const p = this.entities.player;

    // 输入处理
    if (this.input.left) p.vx -= 1;
    if (this.input.right) p.vx += 1;
    p.vx *= CONFIG.friction;

    // 优化的跳跃物理曲线
    // 在空中时应用稍微不同的重力，使跳跃曲线更自然
    if (!p.grounded) {
      if (p.vy < 0) {
        // 上升阶段 - 较轻的重力，使跳跃更"饱满"
        p.vy += CONFIG.gravity * 0.85;
      } else {
        // 下降阶段 - 较重的重力，使下落更快
        p.vy += CONFIG.gravity * 1.1;
      }
    } else {
      p.vy += CONFIG.gravity;
    }

    // 跳跃轨迹效果（仅在下落时）
    if (!p.grounded && p.vy > 2 && Math.random() > 0.7) {
      this.particles.createJumpTrail(
        p.x + p.w / 2,
        p.y + p.h,
        p.vx,
        p.vy
      );
    }

    p.x += p.vx;
    p.y += p.vy;

    // 更新角色动画
    this.updatePlayerAnimation(p);

    // 地面/平台碰撞检测
    const wasGrounded = p.grounded;
    p.grounded = false;

    this.entities.platforms.forEach(plat => {
      // 移动平台
      if (plat.moving) {
        plat.x += plat.speed * plat.dir;
        if (Math.abs(plat.x - plat.originX) > plat.limit) plat.dir *= -1;
      }

      // 碰撞检测 - 改进的碰撞逻辑
      const playerBottom = p.y + p.h;
      const playerRight = p.x + p.w;
      const platformBottom = plat.y + plat.h;

      // 检测玩家是否落在平台上
      if (p.x < plat.x + plat.w && playerRight > plat.x &&
          playerBottom > plat.y && playerBottom < platformBottom + 15 &&
          p.vy >= 0) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.grounded = true;

        // 落地时的挤压效果
        if (!wasGrounded) {
          this.playerAnim.squashX = 1.15;
          this.playerAnim.squashY = 0.85;

          // 创建落地尘土效果
          this.particles.createDustParticles(
            p.x + p.w / 2,
            p.y + p.h
          );
        }

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

          // 创建金币收集效果
          this.particles.createCoinCollectEffect(coin.x, coin.y);

          this.announceScreenReader(`获得金币！当前得分：${this.state.score}`);
        }
      }
    });

    // 尖刺碰撞检测 - 无敌状态时跳过
    if (!p.invulnerable) {
      this.entities.spikes.forEach(spike => {
        // 更精确的三角形碰撞检测
        const playerCenterX = p.x + p.w / 2;
        const playerCenterY = p.y + p.h / 2;
        const spikeCenterX = spike.x + spike.w / 2;
        const spikeCenterY = spike.y + spike.h / 2;

        const dx = Math.abs(playerCenterX - spikeCenterX);
        const dy = Math.abs(playerCenterY - spikeCenterY);

        // 简化的碰撞检测
        if (dx < (p.w + spike.w) / 2.5 && dy < (p.h + spike.h) / 2.5) {
          this.handleDeath();
        }
      });
    }

    // 边界检测
    if (p.x < 0) p.x = 0;
    if (p.x > this.width - p.w) p.x = this.width - p.w;

    // 掉落检测
    if (p.y > this.height) {
      this.handleDeath();
    }

    // 关卡完成检测（到达顶部平台区域）
    const goalAreaTop = 60;
    const playerCenterY = p.y + p.h / 2;

    if (playerCenterY < goalAreaTop && p.grounded) {
      this.levelComplete();
    }

    // 更新粒子系统
    this.particles.update();
  }

  updatePlayerAnimation(player) {
    // 走路时的身体起伏
    if (player.grounded && (Math.abs(player.vx) > 0.5)) {
      // 根据移动速度调整起伏频率
      const speed = Math.abs(player.vx);
      this.playerAnim.bouncePhase += speed * 0.15;
    } else {
      // 站立时的轻微呼吸效果
      this.playerAnim.bouncePhase += 0.03;
    }

    // 挤压效果恢复
    this.playerAnim.squashX += (1 - this.playerAnim.squashX) * 0.15;
    this.playerAnim.squashY += (1 - this.playerAnim.squashY) * 0.15;
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
      this.entities.player.vx = 0;
      this.entities.player.invulnerable = true;

      // 清除之前的计时器
      if (this.state.invulnerabilityTimer) {
        clearTimeout(this.state.invulnerabilityTimer);
      }

      this.state.invulnerabilityTimer = setTimeout(() => {
        this.entities.player.invulnerable = false;
        this.state.invulnerabilityTimer = null;
      }, 1500);

      this.announceScreenReader(`损失1点生命值，剩余生命：${this.state.lives}，重生！`);
    }
  }

  levelComplete() {
    this.state.running = false;
    this.showOverlay('levelCompleteScreen');
    document.getElementById('completedLevel').textContent = this.state.level;
    document.getElementById('levelCoins').textContent = this.state.collectedCoins;
    this.beep(523, 'sine', 0.1);
    setTimeout(() => this.beep(659, 'sine', 0.1), 100);
    setTimeout(() => this.beep(784, 'sine', 0.2), 200);
    this.announceScreenReader(`关卡完成！获得${this.state.collectedCoins}个金币，总得分：${this.state.score}`);
  }

  draw() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 绘制平台
    this.entities.platforms.forEach(p => {
      if (p.isGoal) {
        // 关卡目标平台 - 特殊样式
        this.ctx.fillStyle = '#10b981';
        this.ctx.fillRect(p.x, p.y, p.w, p.h);
        // 添加星星标记
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('', p.x + p.w/2, p.y - 5);
      } else {
        // 普通平台
        this.ctx.fillStyle = CONFIG.colors.platform;
        this.ctx.fillRect(p.x, p.y, p.w, p.h);
        // 阴影
        this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
        this.ctx.fillRect(p.x + 5, p.y + p.h, p.w - 10, 5);
      }
    });

    // 绘制金币（带旋转动画）
    const time = Date.now() / 1000;
    this.entities.coins.forEach(c => {
      if (!c.collected) {
        this.ctx.save();
        this.ctx.translate(c.x, c.y);

        // 金币浮动效果
        const floatY = Math.sin(time * 3 + c.x) * 2;
        this.ctx.translate(0, floatY);

        // 金币旋转效果（3D感）
        const scaleX = Math.abs(Math.cos(time * 2 + c.x));
        this.ctx.scale(scaleX, 1);

        // 金币主体
        this.ctx.beginPath();
        this.ctx.arc(0, 0, c.r, 0, Math.PI * 2);
        this.ctx.fillStyle = CONFIG.colors.coin;
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 金币闪光效果
        this.ctx.beginPath();
        this.ctx.arc(-c.r * 0.3, -c.r * 0.3, c.r * 0.3, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
        this.ctx.fill();

        // 内部闪光（模拟金币反光）
        this.ctx.beginPath();
        this.ctx.arc(c.r * 0.2, c.r * 0.2, c.r * 0.15, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.fill();

        this.ctx.restore();
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

    // 绘制玩家（带动画效果）
    this.drawPlayer();

    // 绘制粒子效果
    this.particles.draw(this.ctx);
  }

  drawPlayer() {
    const p = this.entities.player;
    const ctx = this.ctx;

    ctx.save();

    // 无敌状态闪烁效果
    if (p.invulnerable && Math.floor(Date.now() / 100) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // 计算玩家位置（带动画）
    let playerX = p.x;
    let playerY = p.y;
    let playerW = p.w;
    let playerH = p.h;

    // 应用挤压效果
    const centerX = playerX + playerW / 2;
    const centerY = playerY + playerH;

    playerW *= this.playerAnim.squashX;
    playerH *= this.playerAnim.squashY;

    playerX = centerX - playerW / 2;
    playerY = centerY - playerH;

    // 走路/呼吸起伏效果
    if (p.grounded) {
      const bounceOffset = Math.sin(this.playerAnim.bouncePhase) * 2;
      playerY += bounceOffset;
    }

    // 绘制玩家身体（带圆角）
    ctx.fillStyle = CONFIG.colors.player;
    ctx.beginPath();
    const radius = 6;
    ctx.roundRect(playerX, playerY, playerW, playerH, radius);
    ctx.fill();

    // 眼睛容器（随起伏移动）
    const eyeYOffset = p.grounded ? Math.sin(this.playerAnim.bouncePhase) * 1 : 0;

    // 眼睛
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(playerX + 5, playerY + 10 + eyeYOffset, 8, 8, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(playerX + playerW - 13, playerY + 10 + eyeYOffset, 8, 8, 2);
    ctx.fill();

    // 眼珠（根据移动方向）
    ctx.fillStyle = '#1f2937';
    const eyeOffset = this.input.left ? -2 : (this.input.right ? 2 : 0);
    ctx.beginPath();
    ctx.roundRect(playerX + 7 + eyeOffset, playerY + 12 + eyeYOffset, 4, 4, 1);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(playerX + playerW - 11 + eyeOffset, playerY + 12 + eyeYOffset, 4, 4, 1);
    ctx.fill();

    // 跳跃时的速度线
    if (!p.grounded && Math.abs(p.vy) > 5) {
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const lineY = playerY + playerH + 5 + i * 4;
        ctx.beginPath();
        ctx.moveTo(playerX + playerW * 0.2, lineY);
        ctx.lineTo(playerX + playerW * 0.8, lineY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  loop() {
    if (!this.state.running) return;

    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // 限制最大帧时间，防止切换标签后出现跳跃
    if (this.deltaTime > 0.1) this.deltaTime = 0.016;

    this.update(this.deltaTime);
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
