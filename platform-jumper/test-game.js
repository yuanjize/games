/**
 * Platform Jumper Game - 自动化测试脚本
 * 使用 Node.js 进行代码分析和验证
 */

const fs = require('fs');
const path = require('path');

// 测试结果记录
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    pass: '\x1b[32m',
    fail: '\x1b[31m',
    warn: '\x1b[33m',
    reset: '\x1b[0m'
  };
  const color = colors[type] || colors.info;
  console.log(`${color}[${type.toUpperCase()}]${colors.reset} ${message}`);
}

function assert(condition, testName, errorMsg = '') {
  if (condition) {
    testResults.passed.push(testName);
    log(`通过: ${testName}`, 'pass');
    return true;
  } else {
    testResults.failed.push({ name: testName, error: errorMsg });
    log(`失败: ${testName} - ${errorMsg}`, 'fail');
    return false;
  }
}

// 读取并分析游戏代码
function analyzeGameCode() {
  log('=== 游戏代码分析 ===', 'info');

  const gamePath = path.join(__dirname, 'game.js');
  const gameCode = fs.readFileSync(gamePath, 'utf-8');

  // 测试1: 游戏类定义
  assert(
    gameCode.includes('class PlatformJumperGame'),
    '游戏类定义',
    'PlatformJumperGame 类未定义'
  );

  // 测试2: 配置对象
  assert(
    gameCode.includes('const CONFIG'),
    '配置对象定义',
    'CONFIG 配置对象未定义'
  );

  // 测试3: 重力设置
  assert(
    gameCode.includes('gravity: 0.6'),
    '重力配置',
    '重力配置不正确'
  );

  // 测试4: 跳跃力设置
  assert(
    gameCode.includes('jumpForce: -15'),
    '跳跃力配置',
    '跳跃力配置不正确'
  );

  // 测试5: 游戏状态
  assert(
    gameCode.includes('this.state =') &&
    gameCode.includes('running:') &&
    gameCode.includes('gameOver:') &&
    gameCode.includes('score:') &&
    gameCode.includes('lives:'),
    '游戏状态定义',
    '游戏状态属性不完整'
  );

  // 测试6: 关卡完成检测
  assert(
    gameCode.includes('levelComplete') &&
    gameCode.includes('goalAreaTop'),
    '关卡完成逻辑',
    '关卡完成检测逻辑缺失'
  );

  // 测试7: 金币碰撞检测
  assert(
    gameCode.includes('collected') && gameCode.includes('score +='),
    '金币收集逻辑',
    '金币收集逻辑不完整'
  );

  // 测试8: 死亡处理
  assert(
    gameCode.includes('handleDeath') &&
    gameCode.includes('lives--'),
    '死亡处理逻辑',
    '死亡处理逻辑不完整'
  );

  // 测试9: 无敌状态
  assert(
    gameCode.includes('invulnerable') &&
    gameCode.includes('invulnerabilityTimer'),
    '无敌状态管理',
    '无敌状态管理不完整'
  );

  // 测试10: 下一关逻辑
  assert(
    gameCode.includes('nextLevel') &&
    gameCode.includes('level++'),
    '下一关逻辑',
    '下一关逻辑不完整'
  );

  // 测试11: 金币重置
  assert(
    gameCode.includes('collectedCoins = 0'),
    '下一关金币重置',
    '下一关时金币计数未重置'
  );

  // 测试12: 碰撞检测
  assert(
    gameCode.includes('grounded') &&
    gameCode.includes('platforms.forEach'),
    '平台碰撞检测',
    '平台碰撞检测逻辑不完整'
  );

  // 测试13: 尖刺碰撞
  assert(
    gameCode.includes('spikes.forEach') &&
    gameCode.includes('spike.') &&
    gameCode.includes('colors.spike'),
    '尖刺碰撞检测',
    '尖刺碰撞检测逻辑不完整'
  );

  // 测试14: 平台生成
  assert(
    gameCode.includes('resetLevel') &&
    gameCode.includes('platforms.push'),
    '平台生成逻辑',
    '平台生成逻辑不完整'
  );

  // 测试15: 顶部目标平台
  assert(
    gameCode.includes('isGoal') &&
    gameCode.includes('y: 20'),
    '目标平台生成',
    '顶部目标平台生成逻辑缺失'
  );

  // 测试16: 玩家移动控制
  assert(
    gameCode.includes('input.left') &&
    gameCode.includes('input.right') &&
    gameCode.includes('vx'),
    '玩家移动控制',
    '玩家移动控制逻辑不完整'
  );

  // 测试17: 跳跃功能
  assert(
    gameCode.includes('jump()') &&
    gameCode.includes('jumpForce'),
    '跳跃功能',
    '跳跃功能不完整'
  );

  // 测试18: UI更新
  assert(
    gameCode.includes('updateUI') &&
    gameCode.includes('getElementById'),
    'UI更新',
    'UI更新逻辑不完整'
  );

  // 测试19: 游戏循环
  assert(
    gameCode.includes('loop()') &&
    gameCode.includes('requestAnimationFrame') &&
    gameCode.includes('update()') &&
    gameCode.includes('draw()'),
    '游戏循环',
    '游戏循环逻辑不完整'
  );

  // 测试20: 音频系统
  assert(
    gameCode.includes('initAudio') &&
    gameCode.includes('beep') &&
    gameCode.includes('AudioContext'),
    '音频系统',
    '音频系统不完整'
  );

  // 测试21: 边界检测
  assert(
    gameCode.includes('p.x < 0') &&
    gameCode.includes('p.y > this.height'),
    '边界检测',
    '边界检测逻辑不完整'
  );

  // 测试22: 屏幕阅读器支持
  assert(
    gameCode.includes('announceScreenReader') &&
    gameCode.includes('aria-live'),
    '可访问性支持',
    '屏幕阅读器支持不完整'
  );

  // 测试23: 移动端支持
  assert(
    gameCode.includes('checkMobile') &&
    gameCode.includes('touchstart') &&
    gameCode.includes('mobileLeft'),
    '移动端支持',
    '移动端支持不完整'
  );

  // 测试24: 响应式画布
  assert(
    gameCode.includes('resize()') &&
    gameCode.includes('canvas.width') &&
    gameCode.includes('canvas.height'),
    '响应式画布',
    '响应式画布调整不完整'
  );

  // 测试25: 键盘事件
  assert(
    gameCode.includes('keydown') &&
    gameCode.includes('ArrowLeft') &&
    gameCode.includes('ArrowRight') &&
    gameCode.includes('Space'),
    '键盘事件处理',
    '键盘事件处理不完整'
  );
}

// 检查 HTML 结构
function analyzeHTML() {
  log('=== HTML 结构分析 ===', 'info');

  const htmlPath = path.join(__dirname, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  // 测试26: Canvas 元素
  assert(
    htmlContent.includes('<canvas') &&
    htmlContent.includes('id="gameCanvas"'),
    'Canvas 元素',
    '游戏 Canvas 元素缺失'
  );

  // 测试27: 游戏脚本引用
  assert(
    htmlContent.includes('src="game.js"'),
    '游戏脚本引用',
    'game.js 脚本未正确引用'
  );

  // 测试28: 开始按钮
  assert(
    htmlContent.includes('id="startButton"'),
    '开始按钮',
    '开始按钮 ID 缺失'
  );

  // 测试29: 重启按钮
  assert(
    htmlContent.includes('id="restartButton"'),
    '重启按钮',
    '重启按钮 ID 缺失'
  );

  // 测试30: 下一关按钮
  assert(
    htmlContent.includes('id="nextLevelButton"'),
    '下一关按钮',
    '下一关按钮 ID 缺失'
  );

  // 测试31: UI 元素
  assert(
    htmlContent.includes('id="score"') &&
    htmlContent.includes('id="coins"') &&
    htmlContent.includes('id="health"') &&
    htmlContent.includes('id="currentLevel"'),
    'UI 状态元素',
    'UI 状态元素不完整'
  );

  // 测试32: 移动端控制按钮
  assert(
    htmlContent.includes('id="mobileLeft"') &&
    htmlContent.includes('id="mobileRight"') &&
    htmlContent.includes('id="mobileJump"'),
    '移动端控制按钮',
    '移动端控制按钮不完整'
  );

  // 测试33: 游戏覆盖层
  assert(
    htmlContent.includes('id="gameOverlay"') &&
    htmlContent.includes('id="startScreen"') &&
    htmlContent.includes('id="gameOverScreen"') &&
    htmlContent.includes('id="levelCompleteScreen"'),
    '游戏覆盖层',
    '游戏覆盖层不完整'
  );

  // 测试34: 可访问性属性
  assert(
    htmlContent.includes('aria-label') &&
    htmlContent.includes('role='),
    '可访问性属性',
    '可访问性属性不完整'
  );
}

// 检查 CSS 样式
function analyzeCSS() {
  log('=== CSS 样式分析 ===', 'info');

  const cssPath = path.join(__dirname, 'style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  // 测试35: CSS 变量
  assert(
    cssContent.includes(':root') &&
    cssContent.includes('--color-'),
    'CSS 变量定义',
    'CSS 变量未定义'
  );

  // 测试36: 响应式设计
  assert(
    cssContent.includes('@media') &&
    cssContent.includes('max-width'),
    '响应式设计',
    '响应式媒体查询缺失'
  );

  // 测试37: 游戏画布样式
  assert(
    cssContent.includes('#gameCanvas') ||
    cssContent.includes('.canvas-container'),
    '画布样式',
    '画布样式未定义'
  );

  // 测试38: 移动端按钮样式
  assert(
    cssContent.includes('.mobile-btn'),
    '移动端按钮样式',
    '移动端按钮样式未定义'
  );

  // 测试39: 可访问性焦点样式
  assert(
    cssContent.includes(':focus-visible') ||
    cssContent.includes(':focus'),
    '焦点样式',
    '焦点样式未定义'
  );

  // 测试40: 动画定义
  assert(
    cssContent.includes('@keyframes'),
    '动画定义',
    '动画未定义'
  );
}

// 逻辑验证
function verifyGameLogic() {
  log('=== 游戏逻辑验证 ===', 'info');

  const gamePath = path.join(__dirname, 'game.js');
  const gameCode = fs.readFileSync(gamePath, 'utf-8');

  // 验证关卡完成条件
  assert(
    gameCode.includes('playerCenterY < goalAreaTop') &&
    gameCode.includes('p.grounded'),
    '关卡完成条件',
    '关卡完成检测条件需要基于玩家到达顶部位置并站在平台上'
  );

  // 验证尖刺碰撞时跳过无敌状态
  assert(
    gameCode.includes('if (!p.invulnerable)') &&
    gameCode.includes('spikes.forEach'),
    '无敌状态碰撞跳过',
    '尖刺碰撞应在无敌状态时跳过'
  );

  // 验证重生位置重置
  assert(
    gameCode.includes('entities.player.x =') &&
    gameCode.includes('entities.player.y ='),
    '重生位置重置',
    '死亡重生时玩家位置应重置'
  );

  // 验证速度重置
  assert(
    gameCode.includes('entities.player.vy = 0') &&
    gameCode.includes('entities.player.vx = 0'),
    '重生速度重置',
    '死亡重生时玩家速度应重置'
  );
}

// 打印测试结果
function printResults() {
  console.log('\n========================================');
  console.log('           测试结果汇总');
  console.log('========================================');

  console.log(`\n通过: ${testResults.passed.length} 项`);
  console.log(`失败: ${testResults.failed.length} 项`);
  console.log(`警告: ${testResults.warnings.length} 项`);

  if (testResults.passed.length > 0) {
    console.log('\n✓ 通过的测试:');
    testResults.passed.forEach((test, i) => {
      console.log(`  ${i + 1}. ${test}`);
    });
  }

  if (testResults.failed.length > 0) {
    console.log('\n✗ 失败的测试:');
    testResults.failed.forEach((test, i) => {
      console.log(`  ${i + 1}. ${test.name}: ${test.error}`);
    });
  }

  if (testResults.warnings.length > 0) {
    console.log('\n⚠ 警告:');
    testResults.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
  }

  const totalTests = testResults.passed.length + testResults.failed.length;
  const passRate = totalTests > 0 ? ((testResults.passed.length / totalTests) * 100).toFixed(1) : 0;

  console.log('\n========================================');
  console.log(`通过率: ${passRate}%`);
  console.log('========================================\n');

  if (testResults.failed.length === 0) {
    log('所有测试通过！游戏可以正常运行。', 'pass');
  } else {
    log('存在失败的测试，请修复后再次测试。', 'fail');
  }
}

// 主函数
function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Platform Jumper - 游戏测试套件      ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    analyzeGameCode();
    analyzeHTML();
    analyzeCSS();
    verifyGameLogic();
    printResults();

    // 返回退出码
    process.exit(testResults.failed.length > 0 ? 1 : 0);
  } catch (error) {
    log(`测试执行出错: ${error.message}`, 'fail');
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
main();
