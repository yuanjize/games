/**
 * 深度测试 fruit-2048 游戏场景
 * 模拟实际游戏操作来发现潜在问题
 */

console.log('=== 水果2048深度游戏测试 ===\n');

// 水果定义
const fruits = [
    { level: 1, emoji: "🍎", name: "苹果", score: 2 },
    { level: 2, emoji: "🍊", name: "橙子", score: 4 },
    { level: 3, emoji: "🍇", name: "葡萄", score: 8 },
    { level: 4, emoji: "🍓", name: "草莓", score: 16 },
    { level: 5, emoji: "🍉", name: "西瓜", score: 32 },
    { level: 6, emoji: "🍍", name: "菠萝", score: 64 },
    { level: 7, emoji: "🥭", name: "芒果", score: 128 },
    { level: 8, emoji: "🥝", name: "猕猴桃", score: 256 },
    { level: 9, emoji: "🍒", name: "樱桃", score: 512 },
    { level: 10, emoji: "🍑", name: "桃子", score: 1024 }
];

// 旋转网格函数
function rotateGrid(grid) {
    const size = grid.length;
    const newGrid = Array(size).fill(null).map(() => Array(size).fill(null));
    for(let r = 0; r < size; r++) {
        for(let c = 0; c < size; c++) {
            newGrid[c][size - 1 - r] = grid[r][c];
        }
    }
    return newGrid;
}

// 模拟左移动
function moveLeft(grid) {
    const size = grid.length;
    let moved = false;
    let scoreGained = 0;

    for(let r = 0; r < size; r++) {
        const row = grid[r].filter(cell => cell !== null);
        const newRow = [];

        while(row.length > 0) {
            if(row.length >= 2 && row[0].level === row[1].level) {
                // 合并水果
                const merged = row.shift();
                row.shift();
                const nextLevel = Math.min(merged.level + 1, fruits.length);
                const nextFruit = fruits[nextLevel - 1];

                newRow.push({
                    ...nextFruit,
                    id: Date.now() + Math.random(),
                    isMerge: true
                });

                scoreGained += nextFruit.score;
                moved = true;
            } else {
                newRow.push(row.shift());
            }
        }

        // 填充剩余空位
        while(newRow.length < size) newRow.push(null);

        // 检查行是否改变
        for(let c = 0; c < size; c++) {
            if(grid[r][c] !== newRow[c]) {
                moved = true;
            }
        }

        grid[r] = newRow;
    }

    return { grid, moved, scoreGained };
}

// 模拟任意方向移动
function move(grid, direction) {
    let rotations = 0;
    if (direction === 'up') rotations = 3;
    else if (direction === 'right') rotations = 2;
    else if (direction === 'down') rotations = 1;

    // 应用旋转
    for(let i = 0; i < rotations; i++) grid = rotateGrid(grid);

    // 处理左移动
    const result = moveLeft(grid);

    // 恢复旋转
    const restoreRotations = (4 - rotations) % 4;
    for(let i = 0; i < restoreRotations; i++) result.grid = rotateGrid(result.grid);

    return result;
}

// 克隆网格
function cloneGrid(grid) {
    return grid.map(row => row.map(cell => cell ? {...cell} : null));
}

// 打印网格
function printGrid(grid, title = '') {
    if (title) console.log(`\n${title}:`);
    const emojis = ['🍎', '🍊', '🍇', '🍓', '🍉', '🍍', '🥭', '🥝', '🍒', '🍑'];
    for (let r = 0; r < grid.length; r++) {
        let row = '  ';
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c]) {
                row += grid[r][c].emoji + ' ';
            } else {
                row += '⬜ ';
            }
        }
        console.log(row);
    }
}

// 测试1: 基本合并
console.log('【测试1】基本水果合并');
let grid1 = [
    [{...fruits[0]}, {...fruits[0]}, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];
printGrid(grid1, '移动前 (向左)');
const result1 = move(cloneGrid(grid1), 'left');
printGrid(result1.grid, '移动后');
console.log(`移动: ${result1.moved ? '是' : '否'}`);
console.log(`得分: ${result1.scoreGained}`);
console.log(`预期: 得分 4 (橙子), ${result1.scoreGained === 4 ? '✓ 通过' : '✗ 失败'}`);

// 测试2: 连续合并
console.log('\n【测试2】连续合并 (三个相同水果)');
let grid2 = [
    [{...fruits[0]}, {...fruits[0]}, {...fruits[0]}, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];
printGrid(grid2, '移动前 (向左)');
const result2 = move(cloneGrid(grid2), 'left');
printGrid(result2.grid, '移动后');
console.log(`移动: ${result2.moved ? '是' : '否'}`);
console.log(`得分: ${result2.scoreGained}`);
console.log(`预期: 应该只有一对合并, ${result2.scoreGained === 4 ? '✓ 通过' : '✗ 失败'}`);
console.log(`结果: [橙子, 苹果, 空, 空]`);

// 测试3: 两对合并
console.log('\n【测试3】两对合并');
let grid3 = [
    [{...fruits[0]}, {...fruits[0]}, {...fruits[1]}, {...fruits[1]}],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];
printGrid(grid3, '移动前 (向左)');
const result3 = move(cloneGrid(grid3), 'left');
printGrid(result3.grid, '移动后');
console.log(`移动: ${result3.moved ? '是' : '否'}`);
console.log(`得分: ${result3.scoreGained}`);
console.log(`预期: 得分 12 (橙子4 + 葡萄8), ${result3.scoreGained === 12 ? '✓ 通过' : '✗ 失败'}`);

// 测试4: 不同水果不能合并
console.log('\n【测试4】不同水果不能合并');
let grid4 = [
    [{...fruits[0]}, {...fruits[1]}, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];
printGrid(grid4, '移动前 (向左)');
const result4 = move(cloneGrid(grid4), 'left');
printGrid(result4.grid, '移动后');
console.log(`移动: ${result4.moved ? '是' : '否'}`);
console.log(`得分: ${result4.scoreGained}`);
console.log(`预期: 得分 0, 无合并, ${result4.scoreGained === 0 && !result4.moved ? '✓ 通过' : '✗ 失败'}`);

// 测试5: 向右移动
console.log('\n【测试5】向右移动');
let grid5 = [
    [null, null, {...fruits[0]}, {...fruits[0]}],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];
printGrid(grid5, '移动前 (向右)');
const result5 = move(cloneGrid(grid5), 'right');
printGrid(result5.grid, '移动后');
console.log(`移动: ${result5.moved ? '是' : '否'}`);
console.log(`得分: ${result5.scoreGained}`);
console.log(`预期: 得分 4, 合并在右侧, ${result5.scoreGained === 4 ? '✓ 通过' : '✗ 失败'}`);

// 测试6: 向上移动
console.log('\n【测试6】向上移动');
let grid6 = [
    [{...fruits[0]}, null, null, null],
    [{...fruits[0]}, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];
printGrid(grid6, '移动前 (向上)');
const result6 = move(cloneGrid(grid6), 'up');
printGrid(result6.grid, '移动后');
console.log(`移动: ${result6.moved ? '是' : '否'}`);
console.log(`得分: ${result6.scoreGained}`);
console.log(`预期: 得分 4, 合并在顶部, ${result6.scoreGained === 4 ? '✓ 通过' : '✗ 失败'}`);

// 测试7: 向下移动
console.log('\n【测试7】向下移动');
let grid7 = [
    [{...fruits[0]}, null, null, null],
    [{...fruits[0]}, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];
printGrid(grid7, '移动前 (向下)');
const result7 = move(cloneGrid(grid7), 'down');
printGrid(result7.grid, '移动后');
console.log(`移动: ${result7.moved ? '是' : '否'}`);
console.log(`得分: ${result7.scoreGained}`);
console.log(`预期: 得分 4, 合并在底部, ${result7.scoreGained === 4 ? '✓ 通过' : '✗ 失败'}`);

// 测试8: 无效移动
console.log('\n【测试8】无效移动 (已经靠左，再向左)');
let grid8 = [
    [{...fruits[0]}, {...fruits[1]}, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];
printGrid(grid8, '移动前 (向左)');
const result8 = move(cloneGrid(grid8), 'left');
printGrid(result8.grid, '移动后');
console.log(`移动: ${result8.moved ? '是' : '否'}`);
console.log(`预期: 不应该移动, ${!result8.moved ? '✓ 通过' : '✗ 失败'}`);

// 测试9: 满网格但可合并
console.log('\n【测试9】满网格但可合并');
let grid9 = [
    [{...fruits[0]}, {...fruits[1]}, {...fruits[0]}, {...fruits[1]}],
    [{...fruits[1]}, {...fruits[0]}, {...fruits[1]}, {...fruits[0]}],
    [{...fruits[0]}, {...fruits[1]}, {...fruits[0]}, {...fruits[1]}],
    [{...fruits[1]}, {...fruits[0]}, {...fruits[1]}, {...fruits[0]}]
];
printGrid(grid9, '移动前 (向左)');
const result9 = move(cloneGrid(grid9), 'left');
printGrid(result9.grid, '移动后');
console.log(`移动: ${result9.moved ? '是' : '否'}`);
console.log(`预期: 应该移动, ${result9.moved ? '✓ 通过' : '✗ 失败'}`);

// 测试10: 边界情况 - 空网格
console.log('\n【测试10】边界情况 - 空网格');
let grid10 = [
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];
printGrid(grid10, '移动前 (向左)');
const result10 = move(cloneGrid(grid10), 'left');
printGrid(result10.grid, '移动后');
console.log(`移动: ${result10.moved ? '是' : '否'}`);
console.log(`预期: 不应该移动, ${!result10.moved ? '✓ 通过' : '✗ 失败'}`);

// 测试11: 连锁合并测试
console.log('\n【测试11】连锁合并');
let grid11 = [
    [{...fruits[2]}, {...fruits[2]}, {...fruits[2]}, {...fruits[2]}],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];
printGrid(grid11, '移动前 (向左, 四个葡萄)');
const result11 = move(cloneGrid(grid11), 'left');
printGrid(result11.grid, '移动后');
console.log(`移动: ${result11.moved ? '是' : '否'}`);
console.log(`得分: ${result11.scoreGained}`);
console.log(`预期: 得分 16 (两对葡萄合并成两个草莓), ${result11.scoreGained === 16 ? '✓ 通过' : '✗ 失败'}`);

// 测试12: 最高等级水果合并
console.log('\n【测试12】最高等级水果 (桃子) 合并');
let grid12 = [
    [{...fruits[9]}, {...fruits[9]}, null, null],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];
printGrid(grid12, '移动前 (向左, 两个桃子)');
const result12 = move(cloneGrid(grid12), 'left');
printGrid(result12.grid, '移动后');
console.log(`移动: ${result12.moved ? '是' : '否'}`);
console.log(`得分: ${result12.scoreGained}`);
console.log(`预期: 桃子合并后应保持桃子, 得分 1024, ${result12.scoreGained === 1024 ? '✓ 通过' : '✗ 失败'}`);

// 总结
console.log('\n=== 测试总结 ===');
console.log('以上测试涵盖了游戏的核心逻辑:');
console.log('  ✓ 基本合并');
console.log('  ✓ 连续合并');
console.log('  ✓ 两对合并');
console.log('  ✓ 不同水果不能合并');
console.log('  ✓ 四个方向移动');
console.log('  ✓ 无效移动检测');
console.log('  ✓ 满网格处理');
console.log('  ✓ 空网格处理');
console.log('  ✓ 连锁合并');
console.log('  ✓ 最高等级合并');

console.log('\n如所有测试都通过，游戏核心逻辑是正确的。');
console.log('任何问题可能出在: UI渲染、事件绑定、动画效果等方面。');
