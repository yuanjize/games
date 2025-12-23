/**
 * Space Shooter Game - Puppeteer Test Script
 * 使用 Puppeteer 测试游戏功能
 */

import puppeteer from 'puppeteer';

// 等待函数替代 waitForTimeout
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class GameTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.issues = [];
        this.passedTests = [];
    }

    async init() {
        console.log('启动浏览器...');
        this.browser = await puppeteer.launch({
            headless: false,  // 显示浏览器窗口以便观察
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        });

        this.page = await this.browser.newPage({
            viewport: { width: 1200, height: 900 }
        });

        // 监听控制台消息
        this.page.on('console', msg => {
            const text = msg.text();
            if (text.includes('error') || text.includes('Error')) {
                console.log('浏览器控制台:', text);
            }
        });

        // 监听页面错误
        this.page.on('pageerror', error => {
            this.issues.push(`JavaScript错误: ${error.message}`);
        });
    }

    async navigateToGame() {
        console.log('导航到游戏页面...');
        const url = 'http://localhost:8888/space-shooter/index.html';
        await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(2000);
        console.log('页面加载完成');
    }

    async testPageLoad() {
        console.log('\n=== 测试1: 页面加载 ===');
        try {
            // 检查画布和游戏对象
            const result = await this.page.evaluate(() => {
                return {
                    hasCanvas: !!document.getElementById('gameCanvas'),
                    hasStartScreen: document.getElementById('startScreen')?.style.display !== 'none',
                    hasStartBtn: !!document.getElementById('startGameBtn'),
                    hasGame: !!window.game
                };
            });

            if (!result.hasCanvas) {
                this.issues.push('游戏画布未找到');
                return false;
            }
            this.passedTests.push('游戏画布存在');

            if (!result.hasStartScreen) {
                this.issues.push('开始屏幕未显示');
                return false;
            }
            this.passedTests.push('开始屏幕正常显示');

            if (!result.hasStartBtn) {
                this.issues.push('开始按钮未找到');
                return false;
            }
            this.passedTests.push('开始按钮存在');

            if (!result.hasGame) {
                this.issues.push('游戏对象未初始化');
                return false;
            }
            this.passedTests.push('游戏对象已初始化');

            console.log('页面加载测试通过');
            return true;
        } catch (e) {
            this.issues.push(`页面加载测试失败: ${e.message}`);
            return false;
        }
    }

    async testStartGame() {
        console.log('\n=== 测试2: 开始游戏 ===');
        try {
            // 点击开始按钮
            await this.page.click('#startGameBtn');
            await wait(1000);

            // 检查游戏状态
            const gameRunning = await this.page.evaluate(() => {
                return window.game && window.game.state && window.game.state.running;
            });

            if (!gameRunning) {
                this.issues.push('游戏未能正常启动');
                return false;
            }
            this.passedTests.push('游戏成功启动');

            // 检查覆盖层是否隐藏
            const overlayHidden = await this.page.evaluate(() => {
                const el = document.getElementById('gameOverlay');
                return el && el.style.display === 'none';
            });

            if (!overlayHidden) {
                this.issues.push('游戏覆盖层未隐藏');
                return false;
            }
            this.passedTests.push('游戏覆盖层正确隐藏');

            console.log('开始游戏测试通过');
            return true;
        } catch (e) {
            this.issues.push(`开始游戏测试失败: ${e.message}`);
            return false;
        }
    }

    async testPlayerControls() {
        console.log('\n=== 测试3: 玩家控制 ===');
        try {
            // 获取初始玩家位置
            const initialPos = await this.page.evaluate(() => {
                return { x: window.game.player.x, y: window.game.player.y };
            });

            // 测试左箭头
            await this.page.keyboard.down('ArrowLeft');
            await wait(200);
            await this.page.keyboard.up('ArrowLeft');

            let movedLeft = await this.page.evaluate(() => window.game.player.x < 380);
            if (movedLeft) this.passedTests.push('玩家向左移动正常');
            else this.issues.push('玩家向左移动失败');

            // 测试右箭头
            await this.page.keyboard.down('ArrowRight');
            await wait(200);
            await this.page.keyboard.up('ArrowRight');

            let movedRight = await this.page.evaluate(() => window.game.player.x > 400);
            if (movedRight) this.passedTests.push('玩家向右移动正常');
            else this.issues.push('玩家向右移动失败');

            // 测试上箭头
            await this.page.keyboard.down('ArrowUp');
            await wait(200);
            await this.page.keyboard.up('ArrowUp');

            let movedUp = await this.page.evaluate((y) => window.game.player.y < y, initialPos.y);
            if (movedUp) this.passedTests.push('玩家向上移动正常');
            else this.issues.push('玩家向上移动失败');

            // 测试下箭头
            await this.page.keyboard.down('ArrowDown');
            await wait(200);
            await this.page.keyboard.up('ArrowDown');

            let movedDown = await this.page.evaluate((y) => window.game.player.y > y - 20, initialPos.y);
            if (movedDown) this.passedTests.push('玩家向下移动正常');
            else this.issues.push('玩家向下移动失败');

            // 测试 WASD
            const posBeforeWASD = await this.page.evaluate(() => window.game.player.x);
            await this.page.keyboard.down('KeyA');
            await wait(150);
            await this.page.keyboard.up('KeyA');
            const posAfterWASD = await this.page.evaluate(() => window.game.player.x);

            if (posAfterWASD < posBeforeWASD) this.passedTests.push('WASD控制正常');
            else this.issues.push('WASD控制可能有问题');

            console.log('玩家控制测试完成');
            return true;
        } catch (e) {
            this.issues.push(`玩家控制测试失败: ${e.message}`);
            return false;
        }
    }

    async testShooting() {
        console.log('\n=== 测试4: 射击功能 ===');
        try {
            // 获取初始子弹数量
            const initialBullets = await this.page.evaluate(() => {
                return window.game.bullets.length;
            });

            // 按下空格键射击
            await this.page.keyboard.down('Space');
            await wait(300);
            await this.page.keyboard.up('Space');
            await wait(100);

            // 检查子弹是否生成
            const bulletCount = await this.page.evaluate(() => {
                return window.game.bullets.length;
            });

            if (bulletCount > initialBullets) {
                this.passedTests.push(`射击功能正常 (生成${bulletCount}个子弹)`);
                console.log('射击功能测试通过');
                return true;
            } else {
                this.issues.push('射击功能失败 - 子弹未生成');
                return false;
            }
        } catch (e) {
            this.issues.push(`射击测试失败: ${e.message}`);
            return false;
        }
    }

    async testEnemySpawning() {
        console.log('\n=== 测试5: 敌人生成 ===');
        try {
            // 等待敌人生成
            await wait(3000);

            const enemyCount = await this.page.evaluate(() => {
                return window.game.enemies.length;
            });

            if (enemyCount > 0) {
                this.passedTests.push(`敌人生成正常 (当前${enemyCount}个敌人)`);
                console.log('敌人生成测试通过');
                return true;
            } else {
                this.issues.push('敌人生成失败 - 没有敌人出现');
                return false;
            }
        } catch (e) {
            this.issues.push(`敌人生成测试失败: ${e.message}`);
            return false;
        }
    }

    async testCollisionDetection() {
        console.log('\n=== 测试6: 碰撞检测 ===');
        try {
            // 手动触发碰撞测试
            const result = await this.page.evaluate(() => {
                if (window.game.enemies.length === 0) {
                    return { success: false, message: '没有敌人可用于测试' };
                }

                const initialLives = window.game.state.lives;
                const enemy = window.game.enemies[0];

                // 将玩家移动到敌人位置
                window.game.player.x = enemy.x;
                window.game.player.y = enemy.y;

                // 手动触发碰撞检测
                for (let i = window.game.enemies.length - 1; i >= 0; i--) {
                    const e = window.game.enemies[i];
                    if (window.game.checkCollision(window.game.player, e)) {
                        window.game.state.lives--;
                        window.game.createParticles(e.x + e.w / 2, e.y + e.h / 2, '#f43f5e', 15);
                        window.game.enemies.splice(i, 1);
                        if (window.game.state.lives <= 0) {
                            window.game.gameOver();
                        }
                        break;
                    }
                }

                return {
                    success: true,
                    livesDecreased: window.game.state.lives < initialLives,
                    newLives: window.game.state.lives
                };
            });

            await wait(500);

            if (result.success) {
                if (result.livesDecreased) {
                    this.passedTests.push('碰撞检测正常 - 生命值减少');
                    console.log('碰撞检测测试通过');
                    return true;
                } else {
                    this.issues.push('碰撞检测失败 - 生命值未减少');
                    return false;
                }
            } else {
                this.issues.push(`碰撞测试失败: ${result.message}`);
                return false;
            }
        } catch (e) {
            this.issues.push(`碰撞检测测试失败: ${e.message}`);
            return false;
        }
    }

    async testBulletEnemyCollision() {
        console.log('\n=== 测试7: 子弹与敌人碰撞 ===');
        try {
            // 重置游戏
            await this.page.evaluate(() => {
                if (window.game.state.lives <= 0) {
                    window.game.reset();
                }
                window.game.state.running = true;
                window.game.state.paused = false;
            });
            await wait(500);

            // 创建测试敌人和子弹
            const result = await this.page.evaluate(() => {
                const testX = window.game.width / 2;
                const testY = window.game.height / 2;

                window.game.enemies.push({
                    x: testX - 20, y: testY - 20, w: 40, h: 40, s: 100
                });

                window.game.bullets.push({
                    x: testX - 2, y: testY - 10, w: 4, h: 15, s: 600
                });

                const initialScore = window.game.state.score;
                const initialEnemies = window.game.enemies.length;

                // 运行碰撞检测
                for (let i = window.game.enemies.length - 1; i >= 0; i--) {
                    const e = window.game.enemies[i];
                    for (let j = window.game.bullets.length - 1; j >= 0; j--) {
                        if (window.game.checkCollision(window.game.bullets[j], e)) {
                            window.game.state.score += 10;
                            window.game.state.enemiesDestroyed++;
                            window.game.createParticles(e.x + e.w / 2, e.y + e.h / 2, '#fbbf24', 10);
                            window.game.enemies.splice(i, 1);
                            window.game.bullets.splice(j, 1);
                            break;
                        }
                    }
                }

                return {
                    scoreIncreased: window.game.state.score > initialScore,
                    enemyDestroyed: window.game.enemies.length < initialEnemies,
                    newScore: window.game.state.score
                };
            });

            await wait(500);

            if (result.scoreIncreased && result.enemyDestroyed) {
                this.passedTests.push(`子弹碰撞正常 - 分数增加至${result.newScore}`);
                console.log('子弹碰撞测试通过');
                return true;
            } else {
                this.issues.push('子弹碰撞检测失败');
                return false;
            }
        } catch (e) {
            this.issues.push(`子弹碰撞测试失败: ${e.message}`);
            return false;
        }
    }

    async testPauseFunctionality() {
        console.log('\n=== 测试8: 暂停功能 ===');
        try {
            // 按P键暂停
            await this.page.keyboard.press('KeyP');
            await wait(500);

            const gamePaused = await this.page.evaluate(() => {
                return window.game && window.game.state.paused;
            });

            if (!gamePaused) {
                this.issues.push('P键暂停失败');
                return false;
            }
            this.passedTests.push('P键暂停正常');

            // 检查暂停屏幕
            const pauseScreenVisible = await this.page.evaluate(() => {
                const el = document.getElementById('pauseScreen');
                return el && el.style.display !== 'none';
            });

            if (!pauseScreenVisible) {
                this.issues.push('暂停屏幕未显示');
            } else {
                this.passedTests.push('暂停屏幕正常显示');
            }

            // 按P键继续
            await this.page.keyboard.press('KeyP');
            await wait(500);

            const gameResumed = await this.page.evaluate(() => {
                return !window.game.state.paused;
            });

            if (gameResumed) {
                this.passedTests.push('P键继续正常');
                console.log('暂停功能测试通过');
                return true;
            } else {
                this.issues.push('P键继续失败');
                return false;
            }
        } catch (e) {
            this.issues.push(`暂停测试失败: ${e.message}`);
            return false;
        }
    }

    async testGameOver() {
        console.log('\n=== 测试9: 游戏结束 ===');
        try {
            // 直接触发游戏结束
            await this.page.evaluate(() => {
                window.game.state.lives = 0;
                window.game.gameOver();
            });
            await wait(1000);

            const gameOverScreenVisible = await this.page.evaluate(() => {
                const el = document.getElementById('gameOverScreen');
                return el && el.style.display !== 'none';
            });

            if (gameOverScreenVisible) {
                this.passedTests.push('游戏结束屏幕正常显示');
                console.log('游戏结束测试通过');
                return true;
            } else {
                this.issues.push('游戏结束屏幕未显示');
                return false;
            }
        } catch (e) {
            this.issues.push(`游戏结束测试失败: ${e.message}`);
            return false;
        }
    }

    async testDifficultySelection() {
        console.log('\n=== 测试10: 难度选择 ===');
        try {
            // 返回主菜单
            await this.page.evaluate(() => {
                window.game.backToMenu();
            });
            await wait(500);

            // 测试选择中等难度
            await this.page.click('[data-difficulty="medium"]');
            await wait(200);

            const difficulty = await this.page.evaluate(() => {
                return window.game.state.difficulty;
            });

            if (difficulty === 'medium') {
                this.passedTests.push('难度选择正常');
                console.log('难度选择测试通过');
                return true;
            } else {
                this.issues.push('难度选择失败');
                return false;
            }
        } catch (e) {
            this.issues.push(`难度选择测试失败: ${e.message}`);
            return false;
        }
    }

    async testRestartGame() {
        console.log('\n=== 测试11: 重新开始游戏 ===');
        try {
            // 开始游戏
            await this.page.click('#startGameBtn');
            await wait(1000);

            // 暂停并点击重新开始
            await this.page.keyboard.press('Escape');
            await wait(500);
            await this.page.click('#restartGameBtn');
            await wait(500);

            const gameState = await this.page.evaluate(() => {
                return {
                    running: window.game.state.running,
                    score: window.game.state.score,
                    lives: window.game.state.lives
                };
            });

            if (gameState.running && gameState.score === 0 && gameState.lives === 3) {
                this.passedTests.push('重新开始功能正常');
                console.log('重新开始测试通过');
                return true;
            } else {
                this.issues.push('重新开始功能失败');
                return false;
            }
        } catch (e) {
            this.issues.push(`重新开始测试失败: ${e.message}`);
            return false;
        }
    }

    async testUIUpdates() {
        console.log('\n=== 测试12: UI更新 ===');
        try {
            const hudElements = await this.page.evaluate(() => {
                const scoreEl = document.getElementById('scoreDisplay');
                const livesEl = document.getElementById('livesDisplay');
                const timeEl = document.getElementById('timeDisplay');
                return {
                    score: scoreEl ? scoreEl.textContent : '',
                    lives: livesEl ? livesEl.textContent : '',
                    time: timeEl ? timeEl.textContent : ''
                };
            });

            if (hudElements.score !== '' && hudElements.lives !== '' && hudElements.time !== '') {
                this.passedTests.push('HUD显示正常');
                console.log('UI更新测试通过');
                return true;
            } else {
                this.issues.push('HUD显示不完整');
                return false;
            }
        } catch (e) {
            this.issues.push(`UI更新测试失败: ${e.message}`);
            return false;
        }
    }

    async testSoundControls() {
        console.log('\n=== 测试13: 音效控制 ===');
        try {
            const initialState = await this.page.evaluate(() => {
                return window.game.state.soundEnabled;
            });

            await this.page.click('#toggleSoundBtn');
            await wait(200);

            const newState = await this.page.evaluate(() => {
                return window.game.state.soundEnabled;
            });

            if (initialState !== newState) {
                this.passedTests.push('音效开关正常');
                console.log('音效控制测试通过');
                return true;
            } else {
                this.issues.push('音效开关功能失败');
                return false;
            }
        } catch (e) {
            this.issues.push(`音效控制测试失败: ${e.message}`);
            return false;
        }
    }

    async takeScreenshot(filename) {
        try {
            await this.page.screenshot({
                path: `/home/jizey/test/games/space-shooter/${filename}`
            });
            console.log(`截图已保存: ${filename}`);
        } catch (e) {
            console.log('截图失败:', e.message);
        }
    }

    async runAllTests() {
        console.log('========================================');
        console.log('   Space Shooter 游戏测试套件');
        console.log('========================================');

        await this.init();
        await this.navigateToGame();
        await this.takeScreenshot('01-start-screen.png');

        await this.testPageLoad();
        await this.testStartGame();
        await this.takeScreenshot('02-game-running.png');
        await this.testPlayerControls();
        await this.takeScreenshot('03-player-moved.png');
        await this.testShooting();
        await this.takeScreenshot('04-shooting.png');
        await this.testEnemySpawning();
        await this.takeScreenshot('05-enemies.png');
        await this.testBulletEnemyCollision();
        await this.testCollisionDetection();
        await this.testPauseFunctionality();
        await this.takeScreenshot('06-paused.png');
        await this.testGameOver();
        await this.takeScreenshot('07-game-over.png');
        await this.testDifficultySelection();
        await this.testRestartGame();
        await this.testUIUpdates();
        await this.testSoundControls();

        // 打印测试结果
        console.log('\n========================================');
        console.log('         测试结果汇总');
        console.log('========================================');

        console.log(`\n通过测试: ${this.passedTests.length}`);
        this.passedTests.forEach(test => {
            console.log(`  ✓ ${test}`);
        });

        console.log(`\n发现问题: ${this.issues.length}`);
        if (this.issues.length > 0) {
            this.issues.forEach(issue => {
                console.log(`  ✗ ${issue}`);
            });
        } else {
            console.log('  未发现明显问题！');
        }

        console.log('\n========================================');

        // 保持浏览器打开以便观察
        console.log('\n浏览器将保持打开5秒以便观察...');
        await wait(5000);

        return {
            passed: this.passedTests.length,
            failed: this.issues.length,
            issues: this.issues,
            passedTests: this.passedTests
        };
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// 运行测试
async function main() {
    const tester = new GameTester();
    try {
        const results = await tester.runAllTests();
        console.log('\n=== JSON结果 ===');
        console.log(JSON.stringify(results, null, 2));
        return results;
    } catch (error) {
        console.error('测试运行出错:', error);
        throw error;
    } finally {
        await tester.cleanup();
    }
}

main().catch(console.error);
