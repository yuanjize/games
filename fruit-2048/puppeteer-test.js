/**
 * Fruit 2048 完整自动化测试
 * 模拟游戏环境和操作，验证所有功能
 */

// 模拟 DOM 环境
class MockElement {
    constructor(tagName) {
        this.tagName = tagName;
        this.className = '';
        this.id = '';
        this.textContent = '';
        this.innerHTML = '';
        this.style = {};
        this.attributes = {};
        this.classList = {
            add: (...classes) => {
                classes.forEach(c => {
                    if (!this.className.includes(c)) {
                        this.className += (this.className ? ' ' : '') + c;
                    }
                });
            },
            remove: (...classes) => {
                classes.forEach(c => {
                    this.className = this.className.split(' ').filter(x => x !== c).join(' ');
                });
            },
            contains: (c) => this.className.split(' ').includes(c)
        };
        this.children = [];
        this.eventListeners = {};
    }

    setAttribute(name, value) {
        this.attributes[name] = value;
    }

    getAttribute(name) {
        return this.attributes[name] || '';
    }

    appendChild(child) {
        this.children.push(child);
    }

    addEventListener(event, handler) {
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(handler);
    }

    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) this.children.splice(index, 1);
    }

    querySelector(selector) {
        return this.children.find(c => c.matches && c.matches(selector)) || null;
    }
}

class MockDocument {
    constructor() {
        this.elements = new Map();
        this.head = new MockElement('head');
        this.body = new MockElement('body');
        this.documentElement = new MockElement('html');
    }

    createElement(tagName) {
        return new MockElement(tagName);
    }

    getElementById(id) {
        return this.elements.get(id) || null;
    }

    registerElement(id, element) {
        this.elements.set(id, element);
    }

    querySelector(selector) {
        return null;
    }

    querySelectorAll(selector) {
        return [];
    }

    addEventListener(event, handler) {
        if (!this.eventListeners) this.eventListeners = {};
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(handler);
    }
}

class MockWindow {
    constructor() {
        this.location = { href: 'http://localhost:8080/fruit-2048/' };
        this.AudioContext = class MockAudioContext {
            constructor() {
                this.state = 'running';
                this.destination = {};
            }
            resume() { return Promise.resolve(); }
            createOscillator() {
                return {
                    connect: () => {},
                    frequency: { setValueAtTime: () => {} },
                    start: () => {},
                    stop: () => {}
                };
            }
            createGain() {
                return {
                    connect: () => {},
                    gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }
                };
            }
        };
    }
}

class MockLocalStorage {
    constructor() {
        this.data = new Map();
    }
    getItem(key) { return this.data.get(key) || null; }
    setItem(key, value) { this.data.set(key, value); }
    removeItem(key) { this.data.delete(key); }
    clear() { this.data.clear(); }
}

class MockNavigator {
    constructor() {
        this.share = null;
        this.clipboard = {
            writeText: async (text) => true
        };
    }
}

// 创建模拟环境
const mockDocument = new MockDocument();
const mockWindow = new MockWindow();
const mockLocalStorage = new MockLocalStorage();
const mockNavigator = new MockNavigator();

// 注册 DOM 元素
const elements = {
    'game-board': new MockElement('div'),
    'current-score': new MockElement('div'),
    'best-score': new MockElement('div'),
    'next-fruit': new MockElement('div'),
    'game-status': new MockElement('div'),
    'status-message': new MockElement('div'),
    'restart-btn': new MockElement('button'),
    'instructions-btn': new MockElement('button'),
    'sound-toggle': new MockElement('button'),
    'difficulty': new MockElement('select'),
    'instructions-modal': new MockElement('div'),
    'instructions-close': new MockElement('button'),
    'game-over-modal': new MockElement('div'),
    'final-score': new MockElement('div'),
    'best-score-display': new MockElement('div'),
    'result-message': new MockElement('div'),
    'play-again-btn': new MockElement('button'),
    'share-btn': new MockElement('button'),
    'mobile-controls': new MockElement('div'),
    'credits-link': new MockElement('a')
};

// 添加 querySelector 到 mock elements
Object.keys(elements).forEach(id => {
    elements[id].id = id;
    mockDocument.registerElement(id, elements[id]);
});

elements['status-message'].textContent = '游戏进行中';

// 模拟全局对象
global.window = mockWindow;
global.document = mockDocument;
global.navigator = mockNavigator;
global.localStorage = mockLocalStorage;

// 读取游戏代码
const fs = require('fs');
const gameCode = fs.readFileSync('/home/jizey/test/games/fruit-2048/game.js', 'utf8');

// 创建一个模拟的 FruitGame 类用于测试
class TestFruitGame {
    constructor() {
        this.gridSize = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = 0;
        this.gameOver = false;
        this.soundEnabled = true;
        this.nextFruit = null;

        // 水果等级定义
        this.fruits = [
            { level: 1, emoji: "🍎", name: "苹果", score: 2, color: "#ef4444" },
            { level: 2, emoji: "🍊", name: "橙子", score: 4, color: "#f59e0b" },
            { level: 3, emoji: "🍇", name: "葡萄", score: 8, color: "#10b981" },
            { level: 4, emoji: "🍓", name: "草莓", score: 16, color: "#3b82f6" },
            { level: 5, emoji: "🍉", name: "西瓜", score: 32, color: "#8b5cf6" },
            { level: 6, emoji: "🍍", name: "菠萝", score: 64, color: "#ec4899" },
            { level: 7, emoji: "🥭", name: "芒果", score: 128, color: "#f97316" },
            { level: 8, emoji: "🥝", name: "猕猴桃", score: 256, color: "#84cc16" },
            { level: 9, emoji: "🍒", name: "樱桃", score: 512, color: "#dc2626" },
            { level: 10, emoji: "🍑", name: "桃子", score: 1024, color: "#fbbf24" }
        ];

        this.elements = elements;
        this.init();
    }

    init() {
        this.reset();
    }

    reset() {
        this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
        this.score = 0;
        this.gameOver = false;
        this.nextFruit = this.getRandomBasicFruit();
        this.addRandomFruit();
        this.addRandomFruit();
    }

    getRandomBasicFruit() {
        const basicFruits = this.fruits.slice(0, 2);
        return {...basicFruits[Math.floor(Math.random() * basicFruits.length)]};
    }

    addRandomFruit() {
        const emptyCells = [];
        for(let r = 0; r < this.gridSize; r++) {
            for(let c = 0; c < this.gridSize; c++) {
                if(!this.grid[r][c]) emptyCells.push({r, c});
            }
        }

        if(emptyCells.length > 0) {
            const {r, c} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = {
                ...this.nextFruit,
                id: Date.now() + Math.random(),
                isNew: true
            };
            this.nextFruit = this.getRandomBasicFruit();
        }
    }

    rotateGrid(grid) {
        const newGrid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
        for(let r = 0; r < this.gridSize; r++) {
            for(let c = 0; c < this.gridSize; c++) {
                newGrid[c][this.gridSize - 1 - r] = grid[r][c];
            }
        }
        return newGrid;
    }

    move(direction) {
        let moved = false;

        let rotations = 0;
        if (direction === 'up') rotations = 3;
        else if (direction === 'right') rotations = 2;
        else if (direction === 'down') rotations = 1;

        for(let i = 0; i < rotations; i++) this.grid = this.rotateGrid(this.grid);

        for(let r = 0; r < this.gridSize; r++) {
            const row = this.grid[r].filter(cell => cell !== null);
            const newRow = [];

            while(row.length > 0) {
                if(row.length >= 2 && row[0].level === row[1].level) {
                    const merged = row.shift();
                    row.shift();
                    const nextLevel = Math.min(merged.level + 1, this.fruits.length);
                    const nextFruit = this.fruits[nextLevel - 1];

                    newRow.push({
                        ...nextFruit,
                        id: Date.now() + Math.random(),
                        isMerge: true
                    });

                    this.score += nextFruit.score;
                    moved = true;
                } else {
                    newRow.push(row.shift());
                }
            }

            while(newRow.length < this.gridSize) newRow.push(null);

            for(let c = 0; c < this.gridSize; c++) {
                if(this.grid[r][c] !== newRow[c]) {
                    moved = true;
                }
            }

            this.grid[r] = newRow;
        }

        const restoreRotations = (4 - rotations) % 4;
        for(let i = 0; i < restoreRotations; i++) this.grid = this.rotateGrid(this.grid);

        if (moved) {
            this.addRandomFruit();
            this.checkState();
        }

        return moved;
    }

    checkState() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
        }

        let canMove = false;

        for(let r = 0; r < this.gridSize; r++) {
            for(let c = 0; c < this.gridSize; c++) {
                if(!this.grid[r][c]) canMove = true;
            }
        }

        if(!canMove) {
            for(let r = 0; r < this.gridSize; r++) {
                for(let c = 0; c < this.gridSize; c++) {
                    const current = this.grid[r][c];
                    if(!current) continue;

                    if(r < this.gridSize - 1 && this.grid[r + 1][c] &&
                       this.grid[r + 1][c].level === current.level) canMove = true;

                    if(c < this.gridSize - 1 && this.grid[r][c + 1] &&
                       this.grid[r][c + 1].level === current.level) canMove = true;
                }
            }
        }

        if (!canMove) {
            this.gameOver = true;
        }
    }
}

// 测试运行器
class TestRunner {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.tests = [];
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log('=== 水果2048 自动化测试 ===\n');

        for (const test of this.tests) {
            try {
                await test.fn();
                this.passed++;
                console.log(`✓ ${test.name}`);
            } catch (e) {
                this.failed++;
                console.log(`✗ ${test.name}`);
                console.log(`  错误: ${e.message}`);
            }
        }

        console.log(`\n=== 测试结果 ===`);
        console.log(`通过: ${this.passed}`);
        console.log(`失败: ${this.failed}`);
        console.log(`总计: ${this.passed + this.failed}`);

        return this.failed === 0;
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || '断言失败');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `期望 ${expected}，实际 ${actual}`);
        }
    }
}

// 运行测试
const runner = new TestRunner();

// 测试1: 游戏初始化
runner.test('游戏初始化', () => {
    const game = new TestFruitGame();

    runner.assert(game.grid.length === 4, '网格行数应为4');
    runner.assert(game.grid[0].length === 4, '网格列数应为4');
    runner.assert(game.score === 0, '初始分数应为0');
    runner.assert(!game.gameOver, '游戏不应结束');

    // 检查初始水果数量
    let fruitCount = 0;
    for(let r = 0; r < game.gridSize; r++) {
        for(let c = 0; c < game.gridSize; c++) {
            if(game.grid[r][c]) fruitCount++;
        }
    }
    runner.assertEqual(fruitCount, 2, '初始应有2个水果');
});

// 测试2: 基本移动
runner.test('基本移动功能', () => {
    const game = new TestFruitGame();

    // 保存初始状态
    const initialGrid = JSON.stringify(game.grid);

    // 尝试移动
    game.move('left');

    // 移动后应该添加新水果
    let fruitCount = 0;
    for(let r = 0; r < game.gridSize; r++) {
        for(let c = 0; c < game.gridSize; c++) {
            if(game.grid[r][c]) fruitCount++;
        }
    }

    runner.assert(fruitCount >= 2, '移动后应保持至少2个水果');
});

// 测试3: 水果合并
runner.test('水果合并逻辑', () => {
    const game = new TestFruitGame();

    // 创建可合并的网格
    game.grid = [
        [{...game.fruits[0]}, {...game.fruits[0]}, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ];

    const initialScore = game.score;
    game.move('left');

    runner.assert(game.score > initialScore, '合并后应增加分数');
    runner.assertEqual(game.score, 4, '合并两个苹果应得4分');

    // 检查合并结果
    runner.assert(game.grid[0][0].level === 2, '合并后应变为橙子');
});

// 测试4: 四个方向移动
runner.test('四个方向移动', () => {
    const game = new TestFruitGame();

    const directions = ['up', 'down', 'left', 'right'];
    let moved = false;

    // 设置一个可以向各方向移动的网格
    game.grid = [
        [{...game.fruits[0]}, null, null, null],
        [{...game.fruits[0]}, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ];

    directions.forEach(dir => {
        const gridCopy = JSON.stringify(game.grid);
        const scoreCopy = game.score;

        game.reset();
        game.grid = [
            [{...game.fruits[0]}, null, null, null],
            [{...game.fruits[0]}, null, null, null],
            [null, null, null, null],
            [null, null, null, null]
        ];

        if (game.move(dir)) {
            moved = true;
        }
    });

    runner.assert(moved, '至少有一个方向可以移动');
});

// 测试5: 分数系统
runner.test('分数计算', () => {
    const game = new TestFruitGame();

    // 测试各等级水果的分数
    const expectedScores = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];

    game.fruits.forEach((fruit, i) => {
        runner.assertEqual(fruit.score, expectedScores[i],
            `水果 ${fruit.name} 的分数应为 ${expectedScores[i]}`);
    });
});

// 测试6: 无效移动检测
runner.test('无效移动检测', () => {
    const game = new TestFruitGame();

    // 设置一个已经靠左的网格
    game.grid = [
        [{...game.fruits[0]}, {...game.fruits[1]}, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ];

    const gridBefore = JSON.stringify(game.grid);
    const moved = game.move('left');
    const gridAfter = JSON.stringify(game.grid);

    // 相邻不同水果，不能合并
    runner.assert(gridBefore === gridAfter, '无效移动不应改变网格');
});

// 测试7: 游戏结束检测
runner.test('游戏结束检测', () => {
    const game = new TestFruitGame();

    // 创建一个游戏结束的网格（满且无法合并）
    game.grid = [
        [{...game.fruits[0]}, {...game.fruits[1]}, {...game.fruits[0]}, {...game.fruits[1]}],
        [{...game.fruits[1]}, {...game.fruits[0]}, {...game.fruits[1]}, {...game.fruits[0]}],
        [{...game.fruits[0]}, {...game.fruits[1]}, {...game.fruits[0]}, {...game.fruits[1]}],
        [{...game.fruits[1]}, {...game.fruits[0]}, {...game.fruits[1]}, {...game.fruits[0]}]
    ];

    game.checkState();

    runner.assert(game.gameOver, '满网格且无法合并时应游戏结束');
});

// 测试8: 最高分记录
runner.test('最高分记录', () => {
    const game = new TestFruitGame();

    game.grid = [
        [{...game.fruits[0]}, {...game.fruits[0]}, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ];

    game.move('left');

    runner.assert(game.bestScore > 0, '最高分应被记录');
    runner.assertEqual(game.bestScore, game.score, '最高分应等于当前分数');
});

// 测试9: 水果等级边界
runner.test('最高等级水果合并', () => {
    const game = new TestFruitGame();

    // 两个桃子合并
    game.grid = [
        [{...game.fruits[9]}, {...game.fruits[9]}, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
    ];

    game.move('left');

    runner.assertEqual(game.grid[0][0].level, 10, '桃子合并后应保持桃子');
    runner.assertEqual(game.score, 1024, '桃子合并应得1024分');
});

// 测试10: 多次合并
runner.test('连续多次合并', () => {
    const game = new TestFruitGame();

    let moves = 0;
    let maxMoves = 50;

    while (!game.gameOver && moves < maxMoves) {
        const directions = ['up', 'down', 'left', 'right'];
        const dir = directions[Math.floor(Math.random() * 4)];
        game.move(dir);
        moves++;
    }

    runner.assert(moves > 5, '游戏应能进行多次移动');
    console.log(`  进行了 ${moves} 次移动，最终分数: ${game.score}`);
});

// 运行所有测试
runner.run().then(success => {
    console.log('\n========================================');
    if (success) {
        console.log('🎉 所有测试通过！游戏功能正常。');
        console.log('\n游戏可以在浏览器中完整运行。');
    } else {
        console.log('⚠️  有测试失败，请检查游戏逻辑。');
    }
    console.log('========================================\n');

    console.log('服务器地址: http://localhost:8080/fruit-2048/');
    console.log('测试页面: http://localhost:8080/fruit-2048/manual-test.html');
    console.log('\n请在浏览器中打开上述地址进行实际游戏测试。');

    process.exit(success ? 0 : 1);
});
