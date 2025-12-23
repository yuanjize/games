/**
 * 扫雷游戏独立测试脚本
 * 在 Node.js 环境中运行，不依赖浏览器
 */

// 模拟 DOM 环境
class MockElement {
    constructor(tagName) {
        this.tagName = tagName;
        this.className = '';
        this.textContent = '';
        this.dataset = {};
        this.attributes = {};
        this.classList = {
            add: (...classes) => {
                classes.forEach(c => {
                    if (this.className) this.className += ' ';
                    this.className += c;
                });
            },
            remove: (...classes) => {
                classes.forEach(c => {
                    this.className = this.className.replace(new RegExp('\\b' + c + '\\b', 'g'), '').trim();
                });
            },
            toggle: (cls) => {
                if (this.className.includes(cls)) {
                    this.className = this.className.replace(new RegExp('\\b' + cls + '\\b', 'g'), '').trim();
                    return false;
                } else {
                    if (this.className) this.className += ' ';
                    this.className += cls;
                    return true;
                }
            },
            contains: (cls) => this.className.includes(cls)
        };
        this.style = {};
        this._children = [];
    }

    appendChild(child) {
        this._children.push(child);
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }

    getAttribute(name) {
        return this.attributes[name];
    }

    addEventListener() {
        // 忽略事件监听
    }
}

class MockDocument {
    constructor() {
        this.elements = {};
        this._activeElement = null;
    }

    getElementById(id) {
        return this.elements[id] || new MockElement('div');
    }

    createElement(tag) {
        return new MockElement(tag);
    }

    querySelector(selector) {
        // 简单实现
        if (selector === '.status-message') {
            const el = new MockElement('div');
            el.textContent = '测试消息';
            return el;
        }
        return new MockElement('div');
    }

    querySelectorAll(selector) {
        if (selector === '.difficulty-btn') {
            return [
                this.createMockButton('beginner', true),
                this.createMockButton('intermediate', false),
                this.createMockButton('expert', false)
            ];
        }
        return [];
    }

    createMockButton(difficulty, active) {
        const btn = new MockElement('button');
        btn.dataset = { difficulty };
        btn.classList = {
            add: () => {},
            remove: () => {},
            toggle: () => false,
            contains: (c) => c === 'active' ? active : false
        };
        btn.setAttribute = () => {};
        btn.addEventListener = () => {};
        return btn;
    }

    get activeElement() {
        return this._activeElement;
    }

    set activeElement(el) {
        this._activeElement = el;
    }

    addEventListener() {
        // 忽略
    }
}

// 模拟 window 和 document
const mockDocument = new MockDocument();
global.document = mockDocument;
global.window = {
    innerWidth: 1920,
    AudioContext: null,
    webkitAudioContext: null,
    navigator: {
        userAgent: 'Mozilla/5.0 (Test)',
        maxTouchPoints: 0
    },
    setInterval: (cb, delay) => ({ _interval: true, cb, delay }),
    clearInterval: (id) => {},
    setTimeout: (cb, delay) => ({ _timeout: true, cb, delay }),
    clearTimeout: (id) => {},
    Date: Date,
    addEventListener: () => {}
};

// 读取并执行游戏代码
const fs = require('fs');
let gameCode = fs.readFileSync('/home/jizey/test/games/minesweeper/game.js', 'utf8');

// 移除 DOMContentLoaded 监听器，直接初始化
gameCode = gameCode.replace(
    /window\.addEventListener\('DOMContentLoaded'.*?\);/,
    '/* DOMContentLoaded removed for testing */'
);

// 直接在全局作用域执行代码
eval(gameCode);

// 测试函数
function runTests() {
    console.log('='.repeat(60));
    console.log('扫雷游戏测试套件');
    console.log('='.repeat(60));
    console.log('');

    let passedTests = 0;
    let failedTests = 0;

    // 创建游戏实例
    const game = new MinesweeperGame();

    // 测试1: 游戏初始化
    console.log('[测试 1] 游戏初始化');
    try {
        console.log(`  难度: ${game.state.difficulty}`);
        console.log(`  游戏状态: ${game.state.gameState}`);
        console.log(`  剩余地雷: ${game.state.minesLeft}`);
        console.log(`  网格大小: ${game.state.grid.length} x ${game.state.grid[0]?.length || 0}`);

        if (game.state.difficulty === 'beginner' &&
            game.state.gameState === 'ready' &&
            game.state.minesLeft === 10 &&
            game.state.grid.length === 9 &&
            game.state.grid[0].length === 9) {
            console.log('  通过\n');
            passedTests++;
        } else {
            console.log('  失败\n');
            failedTests++;
        }
    } catch (e) {
        console.log(`  错误: ${e.message}\n`);
        failedTests++;
    }

    // 测试2: 难度切换
    console.log('[测试 2] 难度切换');
    try {
        game.state.difficulty = 'intermediate';
        game.reset();

        if (game.state.difficulty === 'intermediate' &&
            game.state.minesLeft === 40 &&
            game.state.grid.length === 16 &&
            game.state.grid[0].length === 16) {
            console.log('  中级: 16x16, 40雷 OK');
        } else {
            console.log('  中级配置失败');
            failedTests++;
            throw new Error('中级配置错误');
        }

        game.state.difficulty = 'expert';
        game.reset();

        if (game.state.difficulty === 'expert' &&
            game.state.minesLeft === 99 &&
            game.state.grid.length === 16 &&
            game.state.grid[0].length === 30) {
            console.log('  高级: 16x30, 99雷 OK');
        } else {
            console.log('  高级配置失败');
            failedTests++;
            throw new Error('高级配置错误');
        }

        game.state.difficulty = 'beginner';
        game.reset();

        console.log('  通过\n');
        passedTests++;
    } catch (e) {
        console.log(`  失败: ${e.message}\n`);
        failedTests++;
    }

    // 测试3: 地雷放置
    console.log('[测试 3] 地雷放置');
    try {
        game.reset();
        game.state.gameState = 'playing';
        game.placeMines(4, 4);

        let mineCount = 0;
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (game.state.grid[r][c].isMine) mineCount++;
                if (Math.abs(r - 4) <= 1 && Math.abs(c - 4) <= 1) {
                    if (game.state.grid[r][c].isMine) {
                        throw new Error(`地雷放置在安全区 (${r}, ${c})`);
                    }
                }
            }
        }

        console.log(`  地雷数量: ${mineCount}/10`);
        if (mineCount === 10) {
            console.log('  通过\n');
            passedTests++;
        } else {
            console.log('  失败\n');
            failedTests++;
        }
    } catch (e) {
        console.log(`  失败: ${e.message}\n`);
        failedTests++;
    }

    // 测试4: 相邻地雷计数
    console.log('[测试 4] 相邻地雷计数');
    try {
        game.reset();

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                game.state.grid[r][c].isMine = false;
            }
        }

        game.state.grid[0][0].isMine = true;
        game.state.grid[0][1].isMine = true;
        game.state.grid[1][0].isMine = true;

        const count = game.countAdjacentMines(1, 1);
        console.log(`  (1,1) 位置周围地雷数: ${count} (期望: 3)`);

        if (count === 3) {
            console.log('  通过\n');
            passedTests++;
        } else {
            console.log('  失败\n');
            failedTests++;
        }
    } catch (e) {
        console.log(`  失败: ${e.message}\n`);
        failedTests++;
    }

    // 测试5: 旗帜标记
    console.log('[测试 5] 旗帜标记');
    try {
        game.reset();
        const initialMines = game.state.minesLeft;

        game.handleRightClick(0, 0);
        console.log(`  标记后剩余地雷: ${game.state.minesLeft} (期望: ${initialMines - 1})`);

        if (game.state.grid[0][0].isFlagged && game.state.minesLeft === initialMines - 1) {
            console.log('  标记成功');

            game.handleRightClick(0, 0);
            console.log(`  取消标记后剩余地雷: ${game.state.minesLeft} (期望: ${initialMines})`);

            if (!game.state.grid[0][0].isFlagged && game.state.minesLeft === initialMines) {
                console.log('  取消标记成功');
                console.log('  通过\n');
                passedTests++;
            } else {
                console.log('  取消标记失败\n');
                failedTests++;
            }
        } else {
            console.log('  失败\n');
            failedTests++;
        }
    } catch (e) {
        console.log(`  失败: ${e.message}\n`);
        failedTests++;
    }

    // 测试6: 游戏失败逻辑
    console.log('[测试 6] 游戏失败逻辑');
    try {
        game.reset();
        game.state.gameState = 'playing';

        game.state.grid[4][4].isMine = true;

        game.reveal(4, 4);

        if (game.state.gameState === 'lost') {
            console.log('  游戏状态: lost OK');
            console.log('  通过\n');
            passedTests++;
        } else {
            console.log(`  游戏状态: ${game.state.gameState} (期望: lost)`);
            console.log('  失败\n');
            failedTests++;
        }
    } catch (e) {
        console.log(`  失败: ${e.message}\n`);
        failedTests++;
    }

    // 测试7: 游戏胜利逻辑
    console.log('[测试 7] 游戏胜利逻辑');
    try {
        game.reset();
        game.state.gameState = 'playing';

        game.placeMines(4, 4);

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (!game.state.grid[r][c].isMine && !game.state.grid[r][c].isRevealed) {
                    game.state.grid[r][c].isRevealed = true;
                    game.state.grid[r][c].element.classList.add('revealed');
                    game.state.revealedCells++;
                }
            }
        }

        game.checkWin();

        if (game.state.gameState === 'won') {
            console.log('  游戏状态: won OK');
            console.log('  通过\n');
            passedTests++;
        } else {
            console.log(`  游戏状态: ${game.state.gameState} (期望: won)`);
            console.log('  失败\n');
            failedTests++;
        }
    } catch (e) {
        console.log(`  失败: ${e.message}\n`);
        failedTests++;
    }

    // 测试8: 洪水填充算法
    console.log('[测试 8] 洪水填充算法');
    try {
        game.reset();
        game.state.gameState = 'playing';

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                game.state.grid[r][c].isMine = false;
                game.state.grid[r][c].adjacent = 0;
            }
        }

        game.state.grid[0][4].isMine = true;
        game.state.grid[8][4].isMine = true;

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (!game.state.grid[r][c].isMine) {
                    game.state.grid[r][c].adjacent = game.countAdjacentMines(r, c);
                }
            }
        }

        const beforeReveal = game.state.revealedCells;
        game.reveal(4, 4);
        const afterReveal = game.state.revealedCells;

        console.log(`  翻开前: ${beforeReveal}, 翻开后: ${afterReveal}`);

        if (afterReveal > beforeReveal) {
            console.log('  洪水填充工作正常');
            console.log('  通过\n');
            passedTests++;
        } else {
            console.log('  失败\n');
            failedTests++;
        }
    } catch (e) {
        console.log(`  失败: ${e.message}\n`);
        failedTests++;
    }

    // 测试9: 双击快速翻开
    console.log('[测试 9] 双击快速翻开');
    try {
        game.reset();
        game.state.gameState = 'playing';

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                game.state.grid[r][c].isMine = false;
                game.state.grid[r][c].adjacent = 0;
            }
        }

        game.state.grid[3][3].isMine = true;
        game.state.grid[3][4].isMine = true;
        game.state.grid[3][5].isMine = true;

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (!game.state.grid[r][c].isMine) {
                    game.state.grid[r][c].adjacent = game.countAdjacentMines(r, c);
                }
            }
        }

        const centerCell = game.state.grid[4][4];
        centerCell.isRevealed = true;
        centerCell.element.classList.add('revealed');
        centerCell.element.textContent = '3';

        game.state.grid[3][3].isFlagged = true;
        game.state.grid[3][4].isFlagged = true;
        game.state.grid[3][5].isFlagged = true;

        const beforeReveal = game.state.revealedCells;
        game.handleDoubleClick(4, 4);
        const afterReveal = game.state.revealedCells;

        console.log(`  翻开前: ${beforeReveal}, 翻开后: ${afterReveal}`);

        if (afterReveal > beforeReveal) {
            console.log('  双击翻开工作正常');
            console.log('  通过\n');
            passedTests++;
        } else {
            console.log('  失败\n');
            failedTests++;
        }
    } catch (e) {
        console.log(`  失败: ${e.message}\n`);
        failedTests++;
    }

    // 测试10: 计时器功能
    console.log('[测试 10] 计时器功能');
    try {
        game.reset();
        game.startTimer();

        if (game.state.timerInterval) {
            console.log('  计时器启动成功');
            game.stopTimer();

            if (!game.state.timerInterval) {
                console.log('  计时器停止成功');
                console.log('  通过\n');
                passedTests++;
            } else {
                console.log('  计时器停止失败\n');
                failedTests++;
            }
        } else {
            console.log('  失败\n');
            failedTests++;
        }
    } catch (e) {
        console.log(`  失败: ${e.message}\n`);
        failedTests++;
    }

    // 输出测试结果汇总
    console.log('='.repeat(60));
    console.log('测试结果汇总');
    console.log('='.repeat(60));
    console.log(`通过: ${passedTests}`);
    console.log(`失败: ${failedTests}`);
    console.log(`总计: ${passedTests + failedTests}`);
    console.log(`成功率: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    if (failedTests === 0) {
        console.log('\n所有测试通过！游戏逻辑正常。');
    } else {
        console.log(`\n有 ${failedTests} 个测试失败，请检查游戏逻辑。`);
    }

    return { passed: passedTests, failed: failedTests };
}

// 运行测试
try {
    runTests();
} catch (e) {
    console.error(`测试运行错误: ${e.message}`);
    console.error(e.stack);
}
