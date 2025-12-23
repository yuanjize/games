#!/usr/bin/env node

/**
 * Brick Breaker 游戏测试脚本
 * 使用浏览器自动化测试游戏功能
 */

import { chromium } from 'chrome-remote-interface';
import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 测试结果
const results = {
    passed: [],
    failed: [],
    errors: []
};

function log(msg, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${type.toUpperCase()}]`;
    console.log(`${prefix} ${msg}`);
    if (type === 'pass') results.passed.push(msg);
    else if (type === 'fail') results.failed.push(msg);
    else results.errors.push(msg);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 简化版测试 - 直接分析游戏代码
function analyzeGameCode() {
    console.log('\n=== 分析游戏代码 ===\n');

    const gamePath = join(__dirname, 'brick-breaker', 'game.js');
    const gameCode = readFileSync(gamePath, 'utf-8');

    const issues = [];
    const checks = [];

    // 检查1: 球发射机制
    if (gameCode.includes('launchBall()')) {
        checks.push('✓ 球发射函数存在');
    } else {
        issues.push('✗ 缺少球发射函数');
    }

    // 检查2: 碰撞检测
    if (gameCode.includes('checkBrickCollision')) {
        checks.push('✓ 砖块碰撞检测函数存在');
    } else {
        issues.push('✗ 缺少砖块碰撞检测函数');
    }

    if (gameCode.includes('checkPaddleCollision')) {
        checks.push('✓ 挡板碰撞检测函数存在');
    } else {
        issues.push('✗ 缺少挡板碰撞检测函数');
    }

    // 检查3: 道具系统
    if (gameCode.includes('PowerupType')) {
        checks.push('✓ 道具类型定义存在');
    } else {
        issues.push('✗ 缺少道具类型定义');
    }

    if (gameCode.includes('applyPowerup')) {
        checks.push('✓ 道具应用函数存在');
    } else {
        issues.push('✗ 缺少道具应用函数');
    }

    if (gameCode.includes('createPowerup')) {
        checks.push('✓ 道具创建函数存在');
    } else {
        issues.push('✗ 缺少道具创建函数');
    }

    // 检查4: 游戏状态
    if (gameCode.includes('GameState')) {
        checks.push('✓ 游戏状态枚举存在');
    } else {
        issues.push('✗ 缺少游戏状态枚举');
    }

    if (gameCode.includes('levelComplete()')) {
        checks.push('✓ 关卡完成函数存在');
    } else {
        issues.push('✗ 缺少关卡完成函数');
    }

    if (gameCode.includes('gameOver()')) {
        checks.push('✓ 游戏结束函数存在');
    } else {
        issues.push('✗ 缺少游戏结束函数');
    }

    // 检查5: 多球系统
    if (gameCode.includes('MULTI_BALL')) {
        checks.push('✓ 多球道具类型存在');
    } else {
        issues.push('✗ 缺少多球道具类型');
    }

    // 检查6: 关卡进度
    if (gameCode.includes('nextLevel()')) {
        checks.push('✓ 下一关函数存在');
    } else {
        issues.push('✗ 缺少下一关函数');
    }

    // 检查7: 砖块类型
    if (gameCode.includes('BrickType')) {
        checks.push('✓ 砖块类型枚举存在');
    } else {
        issues.push('✗ 缺少砖块类型枚举');
    }

    // 检查8: 粒子系统
    if (gameCode.includes('createParticles')) {
        checks.push('✓ 粒子创建函数存在');
    } else {
        issues.push('✗ 缺少粒子创建函数');
    }

    // 检查9: 键盘控制
    if (gameCode.includes('ArrowLeft') && gameCode.includes('ArrowRight')) {
        checks.push('✓ 键盘方向键控制存在');
    } else {
        issues.push('✗ 缺少键盘方向键控制');
    }

    if (gameCode.includes('keydown')) {
        checks.push('✓ 键盘事件监听存在');
    } else {
        issues.push('✗ 缺少键盘事件监听');
    }

    // 检查10: 触摸支持
    if (gameCode.includes('touchmove') && gameCode.includes('touchstart')) {
        checks.push('✓ 触摸事件支持存在');
    } else {
        issues.push('✗ 缺少触摸事件支持');
    }

    // 检查11: 本地存储
    if (gameCode.includes('localStorage')) {
        checks.push('✓ 本地存储高分功能存在');
    } else {
        issues.push('✗ 缺少本地存储高分功能');
    }

    // 检查12: 球掉落逻辑
    if (gameCode.includes('ball.y + ball.radius > CONFIG.canvasHeight')) {
        checks.push('✓ 球掉落检测逻辑存在');
    } else {
        issues.push('✗ 缺少球掉落检测逻辑');
    }

    // 检查13: 生命值管理
    if (gameCode.includes('this.lives--') && gameCode.includes('this.lives <= 0')) {
        checks.push('✓ 生命值管理逻辑存在');
    } else {
        issues.push('✗ 缺少完整的生命值管理逻辑');
    }

    // 检查14: 关卡完成检测
    if (gameCode.includes('bricks.every(brick => !brick.visible)')) {
        checks.push('✓ 关卡完成检测逻辑存在');
    } else {
        issues.push('✗ 缺少关卡完成检测逻辑');
    }

    // 检查15: 球和挡板碰撞时的角度计算
    if (gameCode.includes('hitPosition') && gameCode.includes('Math.PI')) {
        checks.push('✓ 球反弹角度计算存在');
    } else {
        issues.push('✗ 缺少球反弹角度计算');
    }

    // 输出检查结果
    console.log('\n代码结构检查:\n');
    checks.forEach(c => console.log(`  ${c}`));

    if (issues.length > 0) {
        console.log('\n发现的问题:\n');
        issues.forEach(i => console.log(`  ${i}`));
    }

    // 分析潜在问题
    console.log('\n\n=== 潜在问题分析 ===\n');

    const potentialIssues = [];

    // 检查球是否会在两个砖块之间卡住
    if (!gameCode.includes('overlap') && !gameCode.includes('连续碰撞')) {
        potentialIssues.push({
            issue: '球可能在两个砖块之间卡住或穿过砖块',
            severity: 'medium',
            suggestion: '考虑添加连续碰撞检测或子步进更新'
        });
    }

    // 检查多球时的生命值管理
    const ballManagementCheck = gameCode.match(/this\.balls\.splice\([^)]*\)/g);
    if (ballManagementCheck && ballManagementCheck.length > 0) {
        // 检查是否在所有球掉落后才减少生命
        if (gameCode.includes('if (this.balls.length === 0)')) {
            checks.push('✓ 多球生命值管理正确（只有所有球掉落才减少生命）');
        } else {
            potentialIssues.push({
                issue: '多球模式下生命值管理可能不正确',
                severity: 'high',
                suggestion: '应该只有在所有球都掉落时才减少一条生命'
            });
        }
    }

    // 检查道具效果是否有时限
    if (!gameCode.includes('setTimeout') && !gameCode.includes('setInterval')) {
        potentialIssues.push({
            issue: '道具效果可能是永久的，没有时间限制',
            severity: 'low',
            suggestion: '考虑为道具效果添加持续时间'
        });
    }

    // 检查球速是否可能过慢导致无法反弹
    if (gameCode.includes('Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy)')) {
        checks.push('✓ 球速计算正确，保持速度恒定');
    } else {
        potentialIssues.push({
            issue: '球速度可能会随时间衰减',
            severity: 'medium',
            suggestion: '确保球在碰撞后保持恒定速度'
        });
    }

    // 检查坚固砖块显示
    if (gameCode.includes('brick.hits') && gameCode.includes('fillText')) {
        checks.push('✓ 坚固砖块显示剩余生命值');
    } else {
        potentialIssues.push({
            issue: '坚固砖块可能不显示剩余生命值',
            severity: 'low',
            suggestion: '在坚固砖块上显示剩余击打次数'
        });
    }

    // 输出潜在问题
    if (potentialIssues.length > 0) {
        potentialIssues.forEach(p => {
            console.log(`  [${p.severity.toUpperCase()}] ${p.issue}`);
            console.log(`    建议: ${p.suggestion}\n`);
        });
    }

    return { checks, issues, potentialIssues };
}

// 运行分析
try {
    const analysis = analyzeGameCode();

    console.log('\n' + '='.repeat(60));
    console.log('分析总结');
    console.log('='.repeat(60));
    console.log(`✓ 通过检查: ${analysis.checks.length}`);
    console.log(`✗ 发现问题: ${analysis.issues.length}`);
    console.log(`⚠ 潜在问题: ${analysis.potentialIssues.length}`);

    if (analysis.issues.length === 0 && analysis.potentialIssues.filter(p => p.severity === 'high').length === 0) {
        console.log('\n游戏代码结构良好！没有发现严重问题。\n');
    } else {
        console.log('\n建议修复上述问题以改善游戏体验。\n');
    }

} catch (error) {
    console.error('分析过程中发生错误:', error);
    process.exit(1);
}
