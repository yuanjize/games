#!/usr/bin/env node

/**
 * Brick Breaker 游戏代码静态分析
 * 分析游戏代码以发现潜在问题
 */

const fs = require('fs');
const path = require('path');

const gamePath = path.join(__dirname, 'brick-breaker', 'game.js');
const gameCode = fs.readFileSync(gamePath, 'utf-8');

const results = {
    checks: [],
    issues: [],
    potentialIssues: []
};

function log(msg, category = 'checks') {
    results[category].push(msg);
}

console.log('\n=== 打砖块游戏代码分析 ===\n');

// ============================================================================
// 1. 核心功能检查
// ============================================================================
console.log('【1. 核心功能检查】\n');

// 球发射机制
if (gameCode.includes('launchBall()')) {
    log('✓ 球发射函数存在', 'checks');
    if (gameCode.includes('ball.launched')) {
        log('✓ 球发射状态跟踪存在', 'checks');
    }
} else {
    log('✗ 缺少球发射函数', 'issues');
}

// 碰撞检测
if (gameCode.includes('checkBrickCollision')) {
    log('✓ 砖块碰撞检测函数存在', 'checks');
    // 检查碰撞反弹逻辑
    if (gameCode.includes('ball.dx = -ball.dx') && gameCode.includes('ball.dy = -ball.dy')) {
        log('✓ 碰撞反弹逻辑存在', 'checks');
    }
} else {
    log('✗ 缺少砖块碰撞检测函数', 'issues');
}

if (gameCode.includes('checkPaddleCollision')) {
    log('✓ 挡板碰撞检测函数存在', 'checks');
    // 检查挡板角度反弹
    if (gameCode.includes('hitPosition') && gameCode.includes('Math.PI / 2')) {
        log('✓ 挡板角度反弹计算存在', 'checks');
    }
} else {
    log('✗ 缺少挡板碰撞检测函数', 'issues');
}

// ============================================================================
// 2. 道具系统检查
// ============================================================================
console.log('\n【2. 道具系统检查】\n');

const powerupTypes = ['PADDLE_LONG', 'PADDLE_SHORT', 'BALL_FAST', 'BALL_SLOW', 'MULTI_BALL'];
powerupTypes.forEach(type => {
    if (gameCode.includes(type)) {
        log(`✓ 道具类型 ${type} 存在`, 'checks');
    } else {
        log(`✗ 缺少道具类型 ${type}`, 'issues');
    }
});

if (gameCode.includes('applyPowerup')) {
    log('✓ 道具应用函数存在', 'checks');
} else {
    log('✗ 缺少道具应用函数', 'issues');
}

if (gameCode.includes('createPowerup')) {
    log('✓ 道具创建函数存在', 'checks');
} else {
    log('✗ 缺少道具创建函数', 'issues');
}

// 道具效果实现
const powerupEffects = {
    'PADDLE_LONG': 'paddle.width',
    'BALL_FAST': 'newSpeed',
    'MULTI_BALL': 'this.balls.push'
};
Object.entries(powerupEffects).forEach(([type, pattern]) => {
    if (gameCode.includes(pattern)) {
        log(`✓ ${type} 道具效果实现存在`, 'checks');
    }
});

// ============================================================================
// 3. 游戏状态检查
// ============================================================================
console.log('\n【3. 游戏状态检查】\n');

const gameStates = ['MENU', 'PLAYING', 'PAUSED', 'GAME_OVER', 'LEVEL_COMPLETE'];
gameStates.forEach(state => {
    if (gameCode.includes(`GameState.${state}`) || gameCode.includes(`'${state}'`) || gameCode.includes(`"${state}"`)) {
        log(`✓ 游戏状态 ${state} 存在`, 'checks');
    }
});

if (gameCode.includes('levelComplete()')) {
    log('✓ 关卡完成函数存在', 'checks');
} else {
    log('✗ 缺少关卡完成函数', 'issues');
}

if (gameCode.includes('gameOver()')) {
    log('✓ 游戏结束函数存在', 'checks');
} else {
    log('✗ 缺少游戏结束函数', 'issues');
}

if (gameCode.includes('nextLevel()')) {
    log('✓ 下一关函数存在', 'checks');
} else {
    log('✗ 缺少下一关函数', 'issues');
}

// ============================================================================
// 4. 砖块系统检查
// ============================================================================
console.log('\n【4. 砖块系统检查】\n');

if (gameCode.includes('BrickType')) {
    log('✓ 砖块类型枚举存在', 'checks');
    const brickTypes = ['NORMAL', 'STRONG', 'SPECIAL'];
    brickTypes.forEach(type => {
        if (gameCode.includes(`BrickType.${type}`)) {
            log(`✓ 砖块类型 ${type} 存在`, 'checks');
        }
    });
}

// 砖块生命值管理
if (gameCode.includes('brick.hits') && gameCode.includes('brick.hits--')) {
    log('✓ 砖块生命值管理存在', 'checks');
}

// 砖块可见性管理
if (gameCode.includes('brick.visible') && gameCode.includes('brick.visible = false')) {
    log('✓ 砖块可见性管理存在', 'checks');
}

// 关卡完成检测
if (gameCode.includes('bricks.every(brick => !brick.visible)') || gameCode.includes('bricks.every(b => !b.visible)')) {
    log('✓ 关卡完成检测逻辑正确', 'checks');
} else {
    log('⚠ 关卡完成检测逻辑可能不完整', 'potentialIssues');
}

// ============================================================================
// 5. 多球系统检查
// ============================================================================
console.log('\n【5. 多球系统检查】\n');

if (gameCode.includes('this.balls = []') && gameCode.includes('this.balls.push')) {
    log('✓ 多球数组管理存在', 'checks');
}

// 检查是否正确处理所有球掉落的情况
if (gameCode.includes('this.balls.length === 0')) {
    log('✓ 所有球掉落检测正确', 'checks');
} else {
    log('⚠ 可能未正确处理所有球掉落的情况', 'potentialIssues');
}

// 检查是否在所有球掉落后才减少生命
const lifeDecreasePattern = /this\.lives--[^}]*this\.balls\.length\s*===?\s*0|this\.balls\.length\s*===?\s*0[^}]*this\.lives--/s;
if (lifeDecreasePattern.test(gameCode)) {
    log('✓ 生命值减少逻辑正确关联到球数量', 'checks');
} else {
    log('⚠ 生命值减少可能与球数量无关，可能导致多球模式下问题', 'potentialIssues');
}

// ============================================================================
// 6. 输入控制检查
// ============================================================================
console.log('\n【6. 输入控制检查】\n');

// 键盘控制
if (gameCode.includes('ArrowLeft') && gameCode.includes('ArrowRight')) {
    log('✓ 键盘方向键控制存在', 'checks');
}

if (gameCode.includes('Space') || gameCode.includes(' ')) {
    log('✓ 空格键暂停/发射功能存在', 'checks');
}

if (gameCode.includes('keydown')) {
    log('✓ 键盘事件监听存在', 'checks');
}

// 鼠标控制
if (gameCode.includes('mousemove')) {
    log('✓ 鼠标移动控制存在', 'checks');
}

// 触摸支持
if (gameCode.includes('touchmove') && gameCode.includes('touchstart')) {
    log('✓ 触摸事件支持存在', 'checks');
}

// ============================================================================
// 7. 球物理检查
// ============================================================================
console.log('\n【7. 球物理检查】\n');

// 球速计算
if (gameCode.includes('Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)')) {
    log('✓ 球速计算正确（保持速度恒定）', 'checks');
} else {
    log('⚠ 球速可能会随时间衰减', 'potentialIssues');
}

// 球掉落检测
if (gameCode.includes('ball.y + ball.radius > CONFIG.canvasHeight') || gameCode.includes('ball.y > CONFIG.canvasHeight')) {
    log('✓ 球掉落检测存在', 'checks');
} else {
    log('✗ 缺少球掉落检测', 'issues');
}

// 球移除逻辑
if (gameCode.includes('this.balls.splice')) {
    log('✓ 球移除逻辑存在', 'checks');
}

// ============================================================================
// 8. 粒子系统检查
// ============================================================================
console.log('\n【8. 粒子系统检查】\n');

if (gameCode.includes('createParticles')) {
    log('✓ 粒子创建函数存在', 'checks');
}

if (gameCode.includes('this.particles') && gameCode.includes('particle.life')) {
    log('✓ 粒子生命周期管理存在', 'checks');
}

if (gameCode.includes('globalAlpha')) {
    log('✓ 粒子透明度渐变效果存在', 'checks');
}

// ============================================================================
// 9. 数据持久化检查
// ============================================================================
console.log('\n【9. 数据持久化检查】\n');

if (gameCode.includes('localStorage')) {
    log('✓ 本地存储功能存在', 'checks');
    if (gameCode.includes('highScore')) {
        log('✓ 高分保存功能存在', 'checks');
    }
}

// ============================================================================
// 10. UI更新检查
// ============================================================================
console.log('\n【10. UI更新检查】\n');

if (gameCode.includes('updateUI')) {
    log('✓ UI更新函数存在', 'checks');
}

if (gameCode.includes('getElementById')) {
    log('✓ DOM元素操作存在', 'checks');
}

// ============================================================================
// 潜在问题分析
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('【潜在问题分析】');
console.log('='.repeat(60) + '\n');

// 问题1: 道具没有时间限制
const hasPowerupDuration = gameCode.includes('setTimeout') || gameCode.includes('setInterval') ||
                          gameCode.includes('powerup.duration') || gameCode.includes('powerupTimer');
if (!hasPowerupDuration) {
    log('道具效果是永久的，没有时间限制', 'potentialIssues');
    log('  建议: 为道具效果添加持续时间（如5-10秒）', 'potentialIssues');
}

// 问题2: 球可能在砖块角处卡住
const hasSubstepUpdate = gameCode.includes('substep') || gameCode.includes('多次碰撞');
if (!hasSubstepUpdate) {
    log('球可能在高速运动时穿过砖块或卡住', 'potentialIssues');
    log('  建议: 考虑添加子步进更新或连续碰撞检测', 'potentialIssues');
}

// 问题3: 坚固砖块显示问题
const hasStrongBrickDisplay = gameCode.includes('brick.hits') && gameCode.includes('fillText');
if (!hasStrongBrickDisplay) {
    log('坚固砖块可能不显示剩余生命值', 'potentialIssues');
    log('  建议: 在坚固砖块上显示数字表示剩余击打次数', 'potentialIssues');
}

// 问题4: 球速度边界检查
const hasSpeedLimit = gameCode.includes('Math.min') && gameCode.includes('Math.max') &&
                     gameCode.includes('speed') && gameCode.includes('15') && gameCode.includes('3');
if (!hasSpeedLimit) {
    log('球速度可能没有合理的上下限', 'potentialIssues');
    log('  建议: 限制球速在合理范围内（如3-15）', 'potentialIssues');
}

// 问题5: 挡板宽度限制
if (gameCode.includes('paddle.width') && gameCode.includes('Math.min') && gameCode.includes('200')) {
    log('✓ 挡板宽度有上限限制', 'checks');
} else {
    log('挡板宽度可能没有合理的上限', 'potentialIssues');
}

// 问题6: 关卡难度递增
if (gameCode.includes('level++') || gameCode.includes('this.level++')) {
    log('✓ 有关卡进度管理', 'checks');
    // 检查是否有难度递增
    if (gameCode.includes('this.level') &&
        (gameCode.includes('ballSpeed *') || gameCode.includes('paddleSpeed *'))) {
        log('✓ 关卡难度可能随关卡递增', 'checks');
    } else {
        log('关卡难度可能不会随关卡递增', 'potentialIssues');
        log('  建议: 在新关卡中增加球速或减少挡板宽度', 'potentialIssues');
    }
}

// 问题7: 游戏暂停时道具继续移动
const pauseCheck = gameCode.match(/PAUSED|'paused'|"paused"/g);
if (pauseCheck && pauseCheck.length > 1) {
    const updateInPause = gameCode.includes('if (this.state === GameState.PLAYING)');
    if (updateInPause) {
        log('✓ 暂停时游戏更新停止', 'checks');
    } else {
        log('⚠ 暂停时游戏可能仍在更新', 'potentialIssues');
    }
}

// 问题8: 球初始位置
if (gameCode.includes('ball.dx = 0') && gameCode.includes('ball.dy = 0')) {
    log('✓ 球初始静止等待发射', 'checks');
} else {
    log('⚠ 球可能自动开始移动', 'potentialIssues');
}

// ============================================================================
// 输出结果
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('【分析总结】');
console.log('='.repeat(60) + '\n');

const checks = results.checks.length;
const issues = results.issues.length;
const potentialIssues = results.potentialIssues.length;

console.log(`✓ 通过检查: ${checks}`);
console.log(`✗ 发现问题: ${issues}`);
console.log(`⚠ 潜在问题: ${potentialIssues}`);

// 输出所有通过的检查
console.log('\n--- 通过的检查 ---\n');
results.checks.forEach(c => console.log(`  ${c}`));

// 输出发现的问题
if (results.issues.length > 0) {
    console.log('\n--- 发现的问题 ---\n');
    results.issues.forEach(i => console.log(`  ${i}`));
}

// 输出潜在问题
if (results.potentialIssues.length > 0) {
    console.log('\n--- 潜在问题 ---\n');
    results.potentialIssues.forEach(p => console.log(`  ${p}`));
}

console.log('\n' + '='.repeat(60));

// 保存结果到文件
const outputPath = path.join(__dirname, 'brick-breaker-analysis.json');
fs.writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { checks, issues, potentialIssues },
    details: results
}, null, 2));

console.log(`\n详细分析结果已保存到: ${outputPath}\n`);

// 返回退出码
if (issues > 0 || potentialIssues > 0) {
    console.log('建议修复上述问题以改善游戏体验。\n');
    process.exit(1);
} else {
    console.log('游戏代码结构良好！没有发现问题。\n');
    process.exit(0);
}
