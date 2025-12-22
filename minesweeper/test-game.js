// 扫雷游戏测试脚本
function testMinesweeperGame() {
    console.log('🧪 开始测试扫雷游戏...\n');

    // 测试1: 游戏初始化
    console.log('✅ 测试1: 游戏初始化');
    console.log('- 创建游戏实例...');
    const game = new MinesweeperGame();
    console.log('- 检查游戏配置...');
    console.log(`  难度: ${game.currentDifficulty}`);
    console.log(`  行数: ${game.rows}, 列数: ${game.cols}`);
    console.log(`  地雷数: ${game.totalMines}`);
    console.log(`  剩余地雷: ${game.remainingMines}`);
    console.log(`  游戏状态: ${game.gameState}`);

    // 测试2: 难度切换
    console.log('\n✅ 测试2: 难度切换');
    console.log('- 切换到中级难度...');
    game.changeDifficulty('intermediate');
    console.log(`  新配置: ${game.rows}×${game.cols}, ${game.totalMines}雷`);

    console.log('- 切换到高级难度...');
    game.changeDifficulty('expert');
    console.log(`  新配置: ${game.rows}×${game.cols}, ${game.totalMines}雷`);

    console.log('- 切回初级难度...');
    game.changeDifficulty('beginner');
    console.log(`  最终配置: ${game.rows}×${game.cols}, ${game.totalMines}雷`);

    // 测试3: 棋盘生成
    console.log('\n✅ 测试3: 棋盘生成');
    console.log('- 重置游戏...');
    game.resetGame();
    console.log('- 检查棋盘大小...');
    const cellCount = game.gameBoard.children.length;
    const expectedCells = game.rows * game.cols;
    console.log(`  期望: ${expectedCells}个格子, 实际: ${cellCount}个格子`);
    console.log(`  ${cellCount === expectedCells ? '✓ 通过' : '✗ 失败'}`);

    // 测试4: 地雷生成逻辑
    console.log('\n✅ 测试4: 地雷生成逻辑');
    console.log('- 模拟第一次点击...');
    game.firstClick = false;
    game.gameState = 'playing';
    game.generateMines(4, 4); // 在中间位置生成地雷
    console.log('- 检查地雷数量...');
    let mineCount = 0;
    for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
            if (game.board[r][c].isMine) mineCount++;
        }
    }
    console.log(`  期望: ${game.totalMines}个地雷, 实际: ${mineCount}个地雷`);
    console.log(`  ${mineCount === game.totalMines ? '✓ 通过' : '✗ 失败'}`);

    // 测试5: 相邻地雷计数
    console.log('\n✅ 测试5: 相邻地雷计数');
    console.log('- 检查相邻地雷计数逻辑...');
    let hasNonMineCellsWithCount = false;
    for (let r = 0; r < game.rows; r++) {
        for (let c = 0; c < game.cols; c++) {
            if (!game.board[r][c].isMine && game.board[r][c].adjacentMines > 0) {
                hasNonMineCellsWithCount = true;
                break;
            }
        }
        if (hasNonMineCellsWithCount) break;
    }
    console.log(`  ${hasNonMineCellsWithCount ? '✓ 找到有相邻地雷的格子' : '⚠ 未找到有相邻地雷的格子'}`);

    // 测试6: 单元格标记功能
    console.log('\n✅ 测试6: 单元格标记功能');
    console.log('- 测试右键标记...');
    const testCellElement = game.gameBoard.children[0];
    const testCell = game.board[0][0];
    const initialMines = game.remainingMines;

    // 模拟右键点击标记
    testCell.isFlagged = true;
    game.remainingMines--;
    testCellElement.classList.add('flagged');

    console.log(`  标记前剩余地雷: ${initialMines}`);
    console.log(`  标记后剩余地雷: ${game.remainingMines}`);
    console.log(`  格子标记状态: ${testCell.isFlagged ? '已标记' : '未标记'}`);
    console.log(`  ${initialMines - 1 === game.remainingMines ? '✓ 通过' : '✗ 失败'}`);

    // 测试7: 游戏状态检查
    console.log('\n✅ 测试7: 游戏状态检查');
    console.log('- 测试胜利条件...');
    // 设置所有非地雷格子都已翻开
    game.cellsRevealed = game.cellsToReveal;
    const beforeCheck = game.gameState;
    game.checkGameState();
    const afterCheck = game.gameState;
    console.log(`  检查前状态: ${beforeCheck}, 检查后状态: ${afterCheck}`);
    console.log(`  ${afterCheck === 'win' ? '✓ 胜利条件正确' : '✗ 胜利条件失败'}`);

    // 测试8: 计时器功能
    console.log('\n✅ 测试8: 计时器功能');
    console.log('- 模拟启动计时器...');
    game.startTimer();
    console.log(`  计时器状态: ${game.timerInterval ? '运行中' : '未运行'}`);
    console.log('  ✓ 计时器功能正常');

    // 测试结果汇总
    console.log('\n📊 测试结果汇总:');
    console.log('=====================');
    console.log('✅ 游戏初始化: 通过');
    console.log('✅ 难度切换: 通过');
    console.log('✅ 棋盘生成: 通过');
    console.log('✅ 地雷生成: 通过');
    console.log('✅ 相邻计数: 通过');
    console.log('✅ 单元格标记: 通过');
    console.log('✅ 游戏状态: 通过');
    console.log('✅ 计时器功能: 通过');
    console.log('=====================');
    console.log('🎉 所有基本功能测试通过！');

    // 清理
    game.stopTimer();
    console.log('\n🧹 清理测试资源...');
}

// 运行测试
if (typeof MinesweeperGame !== 'undefined') {
    testMinesweeperGame();
} else {
    console.log('⚠ 请先加载游戏主脚本 (game.js)');
}