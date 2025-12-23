/**
 * 智能井字棋 - 现代实现，支持可访问性
 *
 * 键盘快捷键：
 * - 空格键：开始新游戏
 * - R键：悔棋（撤销上一步）
 * - H键：显示提示
 * - 方向键：在棋盘格间导航
 * - Enter键：选择当前聚焦的格子或按钮
 * - 1/2/3键：快速切换难度
 */

class TicTacToeGame {
    constructor() {
        this.board = Array(3).fill(null).map(() => Array(3).fill(''));
        this.currentPlayer = 'X';
        this.difficulty = 'easy';
        this.gameState = 'playing';
        this.history = [];
        this.currentFocus = { row: 0, col: 0 };
        this.soundEnabled = true;
        this.isAiThinking = false;

        this.stats = JSON.parse(localStorage.getItem('ttt_stats') || '{"X":0,"O":0,"Draw":0,"Total":0}');

        this.elements = {
            board: document.getElementById('board'),
            status: document.getElementById('statusText'),
            currentPlayerElement: document.getElementById('currentPlayer'),
            difficultyDesc: document.getElementById('difficultyDesc'),
            playerWins: document.getElementById('playerWins'),
            aiWins: document.getElementById('aiWins'),
            draws: document.getElementById('draws'),
            totalGames: document.getElementById('totalGames'),
            historyList: document.getElementById('historyList'),
            newGameBtn: document.getElementById('newGameBtn'),
            undoBtn: document.getElementById('undoBtn'),
            hintBtn: document.getElementById('hintBtn'),
            soundToggle: document.getElementById('soundToggle'),
            resetStatsBtn: document.getElementById('resetStatsBtn'),
            difficultyButtons: document.querySelectorAll('.difficulty-btn')
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateUI();
        this.announce('游戏已加载。使用方向键或Tab键导航，按Enter键选择。空格键开始新游戏。');
    }

    bindEvents() {
        // 按钮事件
        this.elements.newGameBtn.addEventListener('click', () => this.reset());
        this.elements.undoBtn.addEventListener('click', () => this.undo());
        this.elements.hintBtn.addEventListener('click', () => this.showHint());
        this.elements.soundToggle.addEventListener('click', () => this.toggleSound());
        this.elements.resetStatsBtn.addEventListener('click', () => this.resetStats());

        // 难度选择
        this.elements.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setDifficulty(btn.dataset.difficulty);
            });
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // 焦点管理
        this.elements.board.addEventListener('focusin', (e) => {
            const cell = e.target;
            if (cell.classList.contains('cell')) {
                const [row, col] = this.getCellPosition(cell);
                this.currentFocus = { row, col };
            }
        });
    }

    handleKeydown(e) {
        // 处理难度切换快捷键
        if (e.key === '1') {
            e.preventDefault();
            this.setDifficulty('easy');
            return;
        }
        if (e.key === '2') {
            e.preventDefault();
            this.setDifficulty('medium');
            return;
        }
        if (e.key === '3') {
            e.preventDefault();
            this.setDifficulty('hard');
            return;
        }

        // 处理空格键 - 新游戏
        if (e.key === ' ' || e.key === 'Spacebar') {
            // 只在非输入元素和非按钮上触发
            if (document.activeElement.tagName !== 'BUTTON' &&
                !document.activeElement.classList.contains('cell')) {
                e.preventDefault();
                this.reset();
                return;
            }
        }

        // 方向键导航
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.moveFocus(-1, 0);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.moveFocus(1, 0);
            return;
        }
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.moveFocus(0, -1);
            return;
        }
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.moveFocus(0, 1);
            return;
        }

        // R键 - 悔棋
        if (e.key === 'r' || e.key === 'R') {
            e.preventDefault();
            this.undo();
            return;
        }

        // H键 - 提示
        if (e.key === 'h' || e.key === 'H') {
            e.preventDefault();
            this.showHint();
            return;
        }

        // Enter键 - 选择当前元素
        if (e.key === 'Enter' || e.key === ' ') {
            if (document.activeElement.classList.contains('cell')) {
                e.preventDefault();
                this.handleClick(this.currentFocus.row, this.currentFocus.col);
            }
            return;
        }

        // Escape键 - 确认重新开始
        if (e.key === 'Escape') {
            e.preventDefault();
            if (confirm('是否要重新开始游戏？')) {
                this.reset();
            }
            return;
        }
    }

    moveFocus(deltaRow, deltaCol) {
        let newRow = this.currentFocus.row + deltaRow;
        let newCol = this.currentFocus.col + deltaCol;

        // 边界检查
        if (newRow < 0) newRow = 2;
        if (newRow > 2) newRow = 0;
        if (newCol < 0) newCol = 2;
        if (newCol > 2) newCol = 0;

        const cellIndex = newRow * 3 + newCol;
        const cells = this.elements.board.querySelectorAll('.cell');

        if (cells[cellIndex]) {
            cells[cellIndex].focus();
            this.currentFocus = { row: newRow, col: newCol };
            this.announce(`当前焦点：第${newRow + 1}行第${newCol + 1}列`);
        }
    }

    handleClick(row, col) {
        if (this.gameState !== 'playing' || this.board[row][col] !== '' ||
            this.currentPlayer !== 'X' || this.isAiThinking) return;

        this.makeMove(row, col, 'X');

        if (this.gameState === 'playing') {
            this.currentPlayer = 'O';
            this.isAiThinking = true;
            this.updateUI();
            this.announce(`玩家X在${row + 1}行${col + 1}列下子。AI正在思考...`);
            setTimeout(() => this.aiMove(), 500);
        }
    }

    makeMove(row, col, player) {
        this.board[row][col] = player;
        this.history.push({ player, r: row, c: col });
        this.addHistoryEntry(player, row, col);
        this.updateCell(row, col, player);
        this.checkState();
        this.updateUndoButton();

        // 播放点击音效
        if (this.soundEnabled) {
            this.playSound('click');
        }
    }

    updateCell(row, col, player) {
        const cellIndex = row * 3 + col;
        const cell = this.elements.board.querySelectorAll('.cell')[cellIndex];

        if (cell) {
            cell.textContent = player;
            cell.classList.add('occupied', player.toLowerCase());
            cell.setAttribute('aria-label', `第${row + 1}行第${col + 1}列，已放置${player}`);
        }
    }

    aiMove() {
        if (this.gameState !== 'playing') {
            this.isAiThinking = false;
            return;
        }

        let move;
        if (this.difficulty === 'hard') move = this.getBestMove();
        else if (this.difficulty === 'medium') move = this.getStrategicMove();
        else move = this.getRandomMove();

        if (move) {
            this.makeMove(move.r, move.c, 'O');
            if (this.gameState === 'playing') {
                this.currentPlayer = 'X';
                this.isAiThinking = false;
                this.updateUI();
                this.announce(`AI在${move.r + 1}行${move.c + 1}列下子。轮到玩家X。`);
            } else {
                this.isAiThinking = false;
            }
        } else {
            this.isAiThinking = false;
        }
    }

    getRandomMove() {
        const available = [];
        for(let r = 0; r < 3; r++) {
            for(let c = 0; c < 3; c++) {
                if(this.board[r][c] === '') available.push({r, c});
            }
        }
        return available[Math.floor(Math.random() * available.length)];
    }

    getStrategicMove() {
        // 尝试获胜
        for(let r = 0; r < 3; r++) {
            for(let c = 0; c < 3; c++) {
                if(this.board[r][c] === '') {
                    this.board[r][c] = 'O';
                    if(this.checkWinner(this.board) === 'O') {
                        this.board[r][c] = '';
                        return {r, c};
                    }
                    this.board[r][c] = '';
                }
            }
        }

        // 尝试阻挡玩家
        for(let r = 0; r < 3; r++) {
            for(let c = 0; c < 3; c++) {
                if(this.board[r][c] === '') {
                    this.board[r][c] = 'X';
                    if(this.checkWinner(this.board) === 'X') {
                        this.board[r][c] = '';
                        return {r, c};
                    }
                    this.board[r][c] = '';
                }
            }
        }

        // 优先选择中心
        if(this.board[1][1] === '') return {r: 1, c: 1};

        // 然后选择角落
        const corners = [{r:0,c:0}, {r:0,c:2}, {r:2,c:0}, {r:2,c:2}];
        for(const corner of corners) {
            if(this.board[corner.r][corner.c] === '') {
                return corner;
            }
        }

        // 否则随机选择
        return this.getRandomMove();
    }

    getBestMove() {
        let bestScore = -Infinity;
        let move;

        for(let r = 0; r < 3; r++) {
            for(let c = 0; c < 3; c++) {
                if(this.board[r][c] === '') {
                    this.board[r][c] = 'O';
                    let score = this.minimax(this.board, 0, false);
                    this.board[r][c] = '';

                    if(score > bestScore) {
                        bestScore = score;
                        move = {r, c};
                    }
                }
            }
        }
        return move;
    }

    minimax(board, depth, isMaximizing) {
        const winner = this.checkWinner(board);

        if(winner === 'O') return 10 - depth;
        if(winner === 'X') return depth - 10;
        if(this.isFull(board)) return 0;

        if(isMaximizing) {
            let bestScore = -Infinity;
            for(let r = 0; r < 3; r++) {
                for(let c = 0; c < 3; c++) {
                    if(board[r][c] === '') {
                        board[r][c] = 'O';
                        let score = this.minimax(board, depth + 1, false);
                        board[r][c] = '';
                        bestScore = Math.max(score, bestScore);
                    }
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for(let r = 0; r < 3; r++) {
                for(let c = 0; c < 3; c++) {
                    if(board[r][c] === '') {
                        board[r][c] = 'X';
                        let score = this.minimax(board, depth + 1, true);
                        board[r][c] = '';
                        bestScore = Math.min(score, bestScore);
                    }
                }
            }
            return bestScore;
        }
    }

    undo() {
        if (this.history.length === 0 || this.gameState !== 'playing' || this.isAiThinking) {
            this.announce('无法悔棋。');
            return;
        }

        // 撤销AI的走棋
        const aiMove = this.history.pop();
        this.board[aiMove.r][aiMove.c] = '';
        this.clearCell(aiMove.r, aiMove.c);

        // 撤销玩家的走棋（如果有）
        if (this.history.length > 0) {
            const playerMove = this.history.pop();
            this.board[playerMove.r][playerMove.c] = '';
            this.clearCell(playerMove.r, playerMove.c);
        }

        this.currentPlayer = 'X';
        this.gameState = 'playing';
        this.isAiThinking = false;

        this.refreshHistoryList();
        this.updateUI();
        this.updateUndoButton();
        this.announce('已撤销上一步棋。');
    }

    clearCell(row, col) {
        const cellIndex = row * 3 + col;
        const cell = this.elements.board.querySelectorAll('.cell')[cellIndex];

        if (cell) {
            cell.textContent = '';
            cell.classList.remove('occupied', 'x', 'o', 'winning');
            cell.setAttribute('aria-label', `第${row + 1}行第${col + 1}列，空位`);
        }
    }

    refreshHistoryList() {
        this.elements.historyList.innerHTML = '';

        if (this.history.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'history-empty';
            emptyState.textContent = '尚未开始游戏';
            this.elements.historyList.appendChild(emptyState);
            return;
        }

        this.history.forEach(move => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${move.player.toLowerCase()}`;
            historyItem.setAttribute('role', 'listitem');

            const playerMarker = document.createElement('span');
            playerMarker.className = 'player-marker';
            playerMarker.textContent = move.player;

            const moveDetails = document.createElement('span');
            moveDetails.className = 'move-details';
            moveDetails.textContent = `第${move.r + 1}行第${move.c + 1}列`;

            historyItem.appendChild(playerMarker);
            historyItem.appendChild(moveDetails);
            this.elements.historyList.appendChild(historyItem);
        });

        // 滚动到最新条目
        this.elements.historyList.scrollTop = this.elements.historyList.scrollHeight;
    }

    updateUndoButton() {
        const canUndo = this.history.length >= 2 && this.gameState === 'playing' && !this.isAiThinking;
        this.elements.undoBtn.disabled = !canUndo;
        this.elements.undoBtn.setAttribute('aria-disabled', !canUndo);
    }

    showHint() {
        if (this.gameState !== 'playing' || this.currentPlayer !== 'X' || this.isAiThinking) {
            this.announce('现在无法显示提示。');
            return;
        }

        let bestMove;
        if (this.difficulty === 'hard') {
            bestMove = this.getBestMove();
        } else {
            bestMove = this.getStrategicMove();
        }

        if (bestMove) {
            // 先清除所有现有的提示
            this.clearHints();

            const hintCell = this.elements.board.querySelectorAll('.cell')[bestMove.r * 3 + bestMove.c];
            hintCell.classList.add('hint');

            setTimeout(() => {
                this.clearHints();
            }, 2000);

            this.announce(`提示：建议下在第${bestMove.r + 1}行第${bestMove.c + 1}列。`);
        }
    }

    clearHints() {
        const hintCells = this.elements.board.querySelectorAll('.cell.hint');
        hintCells.forEach(cell => cell.classList.remove('hint'));
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;

        this.elements.difficultyButtons.forEach(btn => {
            const isActive = btn.dataset.difficulty === difficulty;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive);
        });

        let description = '';
        switch (difficulty) {
            case 'easy':
                description = '简单模式：AI随机走棋，适合初学者。';
                break;
            case 'medium':
                description = '中等模式：AI基于基本策略，会尝试阻挡和进攻。';
                break;
            case 'hard':
                description = '困难模式：AI使用Minimax算法，几乎不可战胜（最优策略）。';
                break;
        }

        this.elements.difficultyDesc.textContent = description;
        this.announce(`AI难度已设置为${difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}模式。`);
    }

    checkState() {
        const winner = this.checkWinner(this.board);
        if (winner) {
            this.gameState = winner === 'X' ? 'player_win' : 'ai_win';
            this.stats[winner]++;
            this.stats.Total++;

            if (this.soundEnabled) {
                this.playSound(winner === 'X' ? 'win' : 'lose');
            }

            this.saveStats();
            this.updateUI();

            const winCells = this.getWinningCells();
            if (winCells) {
                // 先清除之前的获胜状态
                this.clearWinningCells();
                winCells.forEach(cell => {
                    cell.classList.add('winning');
                });
            }

            this.announce(winner === 'X' ? '恭喜！玩家X获胜！按空格键开始新游戏。' : 'AI获胜！按空格键再试一次吧！');
            this.updateUndoButton();

        } else if (this.isFull(this.board)) {
            this.gameState = 'draw';
            this.stats.Draw++;
            this.stats.Total++;
            this.saveStats();
            this.updateUI();
            this.announce('平局！游戏结束。按空格键开始新游戏。');
            this.updateUndoButton();
        }
    }

    clearWinningCells() {
        const winningCells = this.elements.board.querySelectorAll('.cell.winning');
        winningCells.forEach(cell => cell.classList.remove('winning'));
    }

    checkWinner(board) {
        // 检查行
        for(let r = 0; r < 3; r++) {
            if(board[r][0] && board[r][0] === board[r][1] && board[r][1] === board[r][2]) {
                return board[r][0];
            }
        }

        // 检查列
        for(let c = 0; c < 3; c++) {
            if(board[0][c] && board[0][c] === board[1][c] && board[1][c] === board[2][c]) {
                return board[0][c];
            }
        }

        // 检查对角线
        if(board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
            return board[0][0];
        }

        if(board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
            return board[0][2];
        }

        return null;
    }

    getWinningCells() {
        const cells = this.elements.board.querySelectorAll('.cell');

        // 检查行
        for(let r = 0; r < 3; r++) {
            const index1 = r * 3;
            const index2 = r * 3 + 1;
            const index3 = r * 3 + 2;

            if(this.board[r][0] &&
               this.board[r][0] === this.board[r][1] &&
               this.board[r][1] === this.board[r][2]) {
                return [cells[index1], cells[index2], cells[index3]];
            }
        }

        // 检查列
        for(let c = 0; c < 3; c++) {
            const index1 = c;
            const index2 = 3 + c;
            const index3 = 6 + c;

            if(this.board[0][c] &&
               this.board[0][c] === this.board[1][c] &&
               this.board[1][c] === this.board[2][c]) {
                return [cells[index1], cells[index2], cells[index3]];
            }
        }

        // 检查对角线
        if(this.board[0][0] &&
           this.board[0][0] === this.board[1][1] &&
           this.board[1][1] === this.board[2][2]) {
            return [cells[0], cells[4], cells[8]];
        }

        if(this.board[0][2] &&
           this.board[0][2] === this.board[1][1] &&
           this.board[1][1] === this.board[2][0]) {
            return [cells[2], cells[4], cells[6]];
        }

        return null;
    }

    isFull(board) {
        return board.every(row => row.every(cell => cell !== ''));
    }

    reset() {
        this.board = Array(3).fill(null).map(() => Array(3).fill(''));
        this.currentPlayer = 'X';
        this.gameState = 'playing';
        this.history = [];
        this.currentFocus = { row: 0, col: 0 };
        this.isAiThinking = false;

        this.clearWinningCells();
        this.clearHints();
        this.refreshHistoryList();
        this.render();
        this.updateUI();
        this.updateUndoButton();
        this.announce('新游戏已开始。玩家X先下。');
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;

        const isOn = this.soundEnabled;
        this.elements.soundToggle.classList.toggle('sound-on', isOn);
        this.elements.soundToggle.classList.toggle('sound-off', !isOn);
        this.elements.soundToggle.setAttribute('aria-pressed', isOn);
        this.elements.soundToggle.setAttribute('aria-label', `音效开关（当前${isOn ? '开启' : '关闭'}）`);

        const icon = this.elements.soundToggle.querySelector('i');
        icon.className = isOn ? 'fas fa-volume-up' : 'fas fa-volume-mute';

        this.announce(`音效已${isOn ? '开启' : '关闭'}。`);
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        // 使用 Web Audio API 音效系统
        if (window.gameAudio) {
            try {
                switch (type) {
                    case 'click':
                        window.gameAudio.playClick();
                        break;
                    case 'win':
                        window.gameAudio.playWin();
                        break;
                    case 'lose':
                        window.gameAudio.playLose();
                        break;
                }
            } catch (e) {
                console.debug('播放音效失败:', e);
            }
        }
    }

    resetStats() {
        if (!confirm('确定要重置所有游戏统计吗？此操作不可撤销。')) return;

        this.stats = { X: 0, O: 0, Draw: 0, Total: 0 };
        this.saveStats();
        this.updateUI();
        this.announce('游戏统计已重置。');
    }

    saveStats() {
        try {
            localStorage.setItem('ttt_stats', JSON.stringify(this.stats));
        } catch (e) {
            console.warn('无法保存统计数据到localStorage:', e);
        }
    }

    addHistoryEntry(player, row, col) {
        const historyItem = document.createElement('div');
        historyItem.className = `history-item ${player.toLowerCase()}`;
        historyItem.setAttribute('role', 'listitem');

        const playerMarker = document.createElement('span');
        playerMarker.className = 'player-marker';
        playerMarker.textContent = player;

        const moveDetails = document.createElement('span');
        moveDetails.className = 'move-details';
        moveDetails.textContent = `第${row + 1}行第${col + 1}列`;

        historyItem.appendChild(playerMarker);
        historyItem.appendChild(moveDetails);
        this.elements.historyList.appendChild(historyItem);

        // 滚动到最新条目
        this.elements.historyList.scrollTop = this.elements.historyList.scrollHeight;

        // 如果这是第一条记录，移除空状态
        const emptyState = this.elements.historyList.querySelector('.history-empty');
        if (emptyState) {
            emptyState.remove();
        }
    }

    updateUI() {
        // 更新当前玩家
        this.elements.currentPlayerElement.textContent = `玩家 ${this.currentPlayer}`;

        // 更新游戏状态
        const statusTextMap = {
            'playing': this.currentPlayer === 'X' ? '轮到玩家 X 下棋' : 'AI 正在思考...',
            'player_win': '恭喜！玩家 X 获胜！',
            'ai_win': 'AI 获胜！再试一次吧！',
            'draw': '平局！游戏结束。'
        };

        this.elements.status.textContent = statusTextMap[this.gameState];

        // 更新统计
        this.elements.playerWins.textContent = this.stats.X;
        this.elements.aiWins.textContent = this.stats.O;
        this.elements.draws.textContent = this.stats.Draw;
        this.elements.totalGames.textContent = this.stats.Total;

        // 更新玩家回合指示器
        const playerTurnElement = document.querySelector('.player-turn');
        playerTurnElement.classList.remove('active-x', 'active-o');
        if (this.gameState === 'playing') {
            playerTurnElement.classList.add(this.currentPlayer === 'X' ? 'active-x' : 'active-o');
        }

        // 更新状态文本样式
        const statusClassMap = {
            'player_win': 'win',
            'ai_win': 'lose',
            'draw': 'draw',
            'playing': ''
        };

        this.elements.status.className = 'status-text';
        const statusClass = statusClassMap[this.gameState];
        if (statusClass) {
            this.elements.status.classList.add(statusClass);
        }
    }

    announce(message) {
        // 创建临时区域提供屏幕阅读器信息
        const announcement = document.createElement('div');
        announcement.className = 'sr-only';
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.textContent = message;

        document.body.appendChild(announcement);

        setTimeout(() => {
            announcement.remove();
        }, 1000);
    }

    getCellPosition(cell) {
        const cells = this.elements.board.querySelectorAll('.cell');
        const index = Array.from(cells).indexOf(cell);
        return [Math.floor(index / 3), index % 3];
    }

    render() {
        this.elements.board.innerHTML = '';

        for(let r = 0; r < 3; r++) {
            for(let c = 0; c < 3; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.setAttribute('role', 'gridcell');
                cell.setAttribute('tabindex', '0');
                cell.setAttribute('aria-label', `第${r + 1}行第${c + 1}列`);
                cell.setAttribute('data-row', r);
                cell.setAttribute('data-col', c);

                if(this.board[r][c]) {
                    cell.classList.add('occupied', this.board[r][c].toLowerCase());
                    cell.textContent = this.board[r][c];
                    cell.setAttribute('aria-label', `第${r + 1}行第${c + 1}列，已放置${this.board[r][c]}`);
                } else {
                    cell.setAttribute('aria-label', `第${r + 1}行第${c + 1}列，空位`);
                }

                cell.addEventListener('click', () => this.handleClick(r, c));
                cell.addEventListener('keydown', (e) => {
                    if(e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.handleClick(r, c);
                    }
                });

                this.elements.board.appendChild(cell);
            }
        }

        // 设置第一个格子为焦点（仅在新游戏时）
        const firstCell = this.elements.board.querySelector('.cell');
        if (firstCell && this.history.length === 0) {
            firstCell.focus();
        }
    }
}

// 添加屏幕阅读器专用样式
const srOnlyStyle = document.createElement('style');
srOnlyStyle.textContent = `
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    .hint {
        animation: hintGlow 1s ease-in-out infinite alternate;
    }

    @keyframes hintGlow {
        from {
            box-shadow: 0 0 5px var(--color-success);
        }
        to {
            box-shadow: 0 0 20px var(--color-success);
        }
    }
`;

document.head.appendChild(srOnlyStyle);

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    window.game = new TicTacToeGame();

    // 初始读取统计并更新UI
    setTimeout(() => {
        if (window.game) {
            window.game.updateUI();
        }
    }, 100);
});
