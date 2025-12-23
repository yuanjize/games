/**
 * 扫雷游戏简单测试脚本
 * 直接导入 game.js 并运行测试
 */

// 模拟 DOM 环境
const mockDocument = {
    elements: {},
    getElementById(id) {
        return {
            className: '',
            classList: { add() {}, remove() {}, toggle() { return false }, contains() { return false } },
            textContent: '',
            setAttribute() {},
            addEventListener() {},
            style: {},
            appendChild() {},
            innerHTML: ''
        }[id] || { className: '', classList: { add() {}, remove() {}, toggle() { return false }, contains() { return false } }, textContent: '', setAttribute() {}, addEventListener() {}, style: {}, appendChild() {}, innerHTML: '' };
    },
    createElement() {
        return {
            className: '',
            classList: {
                add() {},
                remove() {},
                toggle(cls) {
                    if (this.className) {
                        this.className = this.className.replace(new RegExp('\\b' + cls + '\\b', 'g'), '').trim();
                        return false;
                    } else {
                        if (this.className) this.className += ' ';
                        this.className += cls;
                        return true;
                    }
                },
                contains() { return false; }
            },
            textContent: '',
            dataset: {},
            setAttribute() {},
            addEventListener() {},
            style: {},
            appendChild() {}
        };
    },
    querySelector() { return { textContent: '', classList: { add() {}, remove() {} } }; },
    querySelectorAll() { return []; },
    addEventListener() {}
};

global.document = mockDocument;
global.window = {
    innerWidth: 1920,
    AudioContext: null,
    webkitAudioContext: null,
    navigator: { userAgent: 'Test', maxTouchPoints: 0 },
    setInterval() { return {}; },
    clearInterval() {},
    setTimeout() { return {}; },
    clearTimeout() {},
    Date: Date,
    addEventListener() {}
};

// 加载游戏代码
const fs = require('fs');
const gameCode = fs.readFileSync('/home/jizey/test/games/minesweeper/game.js', 'utf8');

// 移除 DOMContentLoaded 部分并执行
const modifiedCode = gameCode.replace(
    /\/\/ 游戏初始化[\s\S]*$/,
    '// 游戏初始化已移除用于测试'
);

eval(modifiedCode);

console.log('类定义检查:', typeof MinesweeperGame);
console.log('开始测试...\n');

const game = new MinesweeperGame();

// 简单测试
console.log('测试 1 - 初始化:');
console.log('  难度:', game.state.difficulty);
console.log('  状态:', game.state.gameState);
console.log('  地雷:', game.state.minesLeft);
console.log('  网格:', game.state.grid.length, 'x', game.state.grid[0].length);

if (game.state.difficulty === 'beginner' &&
    game.state.gameState === 'ready' &&
    game.state.minesLeft === 10 &&
    game.state.grid.length === 9 &&
    game.state.grid[0].length === 9) {
    console.log('  通过');
} else {
    console.log('  失败');
}

// 测试地雷放置
console.log('\n测试 2 - 地雷放置:');
game.state.gameState = 'playing';
game.placeMines(4, 4);
let mineCount = 0;
for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
        if (game.state.grid[r][c].isMine) mineCount++;
    }
}
console.log('  地雷数量:', mineCount, '/ 10');
console.log(mineCount === 10 ? '  通过' : '  失败');

// 测试旗帜标记
console.log('\n测试 3 - 旗帜标记:');
game.reset();
const initialMines = game.state.minesLeft;
game.handleRightClick(0, 0);
console.log('  标记后地雷:', game.state.minesLeft, '(期望:', initialMines - 1, ')');
console.log(game.state.grid[0][0].isFlagged && game.state.minesLeft === initialMines - 1 ? '  通过' : '  失败');

// 测试游戏失败
console.log('\n测试 4 - 游戏失败:');
game.reset();
game.state.gameState = 'playing';
game.state.grid[4][4].isMine = true;
game.reveal(4, 4);
console.log('  游戏状态:', game.state.gameState);
console.log(game.state.gameState === 'lost' ? '  通过' : '  失败');

// 测试游戏胜利
console.log('\n测试 5 - 游戏胜利:');
game.reset();
game.state.gameState = 'playing';
game.placeMines(4, 4);
for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
        if (!game.state.grid[r][c].isMine && !game.state.grid[r][c].isRevealed) {
            game.state.grid[r][c].isRevealed = true;
            game.state.revealedCells++;
        }
    }
}
game.checkWin();
console.log('  游戏状态:', game.state.gameState);
console.log(game.state.gameState === 'won' ? '  通过' : '  失败');

console.log('\n测试完成！');
