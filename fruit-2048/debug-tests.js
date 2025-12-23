/**
 * 调试 fruit-2048 发现的问题
 */

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

function cloneGrid(grid) {
    return grid.map(row => row.map(cell => cell ? {...cell} : null));
}

function printGrid(grid, title = '') {
    if (title) console.log(`\n${title}:`);
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

// 模拟移动逻辑
function moveLeft(grid) {
    const size = grid.length;
    let moved = false;
    let scoreGained = 0;
    let totalMergeCount = 0;

    for(let r = 0; r < size; r++) {
        const row = grid[r].filter(cell => cell !== null);
        const newRow = [];
        let mergeCount = 0;

        while(row.length > 0) {
            if(row.length >= 2 && row[0].level === row[1].level) {
                const merged = row.shift();
                row.shift();
                const nextLevel = Math.min(merged.level + 1, fruits.length);
                const nextFruit = fruits[nextLevel - 1];

                newRow.push({...nextFruit, id: Date.now() + Math.random()});
                scoreGained += nextFruit.score;
                mergeCount++;
                moved = true;
            } else {
                newRow.push(row.shift());
            }
        }

        while(newRow.length < size) newRow.push(null);

        for(let c = 0; c < size; c++) {
            if(grid[r][c] !== newRow[c]) {
                moved = true;
            }
        }

        grid[r] = newRow;
        totalMergeCount += mergeCount;
    }

    return { grid, moved, scoreGained, mergeCount: totalMergeCount };
}

// ========== 问题1分析：测试9 ==========

console.log('=== 问题1分析：满网格但可合并的情况 ===\n');

// 分析测试9的网格
console.log('原始网格 (交替的苹果和橙子):');
let grid9 = [
    [{...fruits[0]}, {...fruits[1]}, {...fruits[0]}, {...fruits[1]}],
    [{...fruits[1]}, {...fruits[0]}, {...fruits[1]}, {...fruits[0]}],
    [{...fruits[0]}, {...fruits[1]}, {...fruits[0]}, {...fruits[1]}],
    [{...fruits[1]}, {...fruits[0]}, {...fruits[1]}, {...fruits[0]}]
];
printGrid(grid9);

console.log('\n问题分析:');
console.log('第0行: 🍎 🍊 🍎 🍊 - 相邻元素不同，无法合并');
console.log('第1行: 🍊 🍎 🍊 🍎 - 相邻元素不同，无法合并');
console.log('第2行: 🍎 🍊 🍎 🍊 - 相邻元素不同，无法合并');
console.log('第3行: 🍊 🍎 🍊 🍎 - 相邻元素不同，无法合并');
console.log('');
console.log('结论: 这个网格确实无法向左移动，因为没有相邻的相同水果。');
console.log('测试9的预期是错误的，应该修改测试用例。');

// 正确的可合并的满网格
console.log('\n\n正确的可合并满网格测试:');
let grid9_correct = [
    [{...fruits[0]}, {...fruits[0]}, {...fruits[1]}, {...fruits[1]}],
    [{...fruits[1]}, {...fruits[1]}, {...fruits[0]}, {...fruits[0]}],
    [{...fruits[0]}, {...fruits[0]}, {...fruits[1]}, {...fruits[1]}],
    [{...fruits[1]}, {...fruits[1]}, {...fruits[0]}, {...fruits[0]}]
];
printGrid(grid9_correct, '新的可合并满网格');
const result9 = moveLeft(cloneGrid(grid9_correct));
printGrid(result9.grid, '移动后');
console.log(`移动: ${result9.moved ? '是' : '否'}`);
console.log(`得分: ${result9.scoreGained}`);
console.log(`合并次数: ${result9.mergeCount}`);

// ========== 问题2分析：测试11 ==========

console.log('\n\n=== 问题2分析：四个葡萄移动的得分计算 ===\n');

console.log('分析四个葡萄 (🍇) 向左移动的情况:');
console.log('葡萄的 score = 8');
console.log('');
console.log('合并过程:');
console.log('  1. 前两个葡萄合并 -> 草莓 (🍓), 得分 16');
console.log('  2. 后两个葡萄合并 -> 草莓 (🍓), 得分 16');
console.log('  3. 总得分: 16 + 16 = 32');
console.log('');
console.log('最终状态: 🍓 🍓 ⬜ ⬜');
console.log('');
console.log('结论: 实际得分 32 是正确的！');
console.log('测试11的预期是错误的。四个葡萄应该产生两个草莓，');
console.log('每个草莓得分 16，总共 32 分。');

// 验证
console.log('\n\n=== 验证四个葡萄的合并 ===\n');
let grid11 = [
    [{...fruits[2]}, {...fruits[2]}, {...fruits[2]}, {...fruits[2]}],
    [null, null, null, null],
    [null, null, null, null],
    [null, null, null, null]
];
printGrid(grid11, '移动前 (四个葡萄)');

const result11 = moveLeft(cloneGrid(grid11));
printGrid(result11.grid, '移动后');
console.log(`移动: ${result11.moved ? '是' : '否'}`);
console.log(`合并次数: ${result11.mergeCount}`);
console.log(`得分: ${result11.scoreGained}`);
console.log(`草莓的分数: ${fruits[3].score}`);
console.log(`预期得分: ${fruits[3].score} × ${result11.mergeCount} = ${fruits[3].score * result11.mergeCount}`);
console.log(`验证: ${result11.scoreGained === fruits[3].score * result11.mergeCount ? '✓ 正确' : '✗ 错误'}`);

// ========== 总结 ==========

console.log('\n\n=== 总结 ===\n');
console.log('问题1: 测试9 - 预期错误');
console.log('  - 满网格交替苹果橙子，相邻元素不同，无法合并');
console.log('  - 测试预期"应该移动"是错误的');
console.log('');
console.log('问题2: 测试11 - 预期错误');
console.log('  - 四个葡萄移动产生两个草莓');
console.log('  - 每个草莓得分 16，总共 32 分');
console.log('  - 测试预期 16 分是错误的（只计算了一次合并）');
console.log('');
console.log('结论: 游戏逻辑本身是正确的！');
console.log('需要修复的是测试用例，而不是游戏代码。');
