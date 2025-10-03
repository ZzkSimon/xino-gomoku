class GomokuGame {
    constructor() {
        this.boardSize = 9; // 进一步减小到9x9适应手机
        this.cellSize = this.getOptimalCellSize(); // 动态计算格子大小
        this.board = [];
        this.pieceImageIndexes = []; // 存储每个位置的图片索引
        this.currentPlayer = 1; // 1为玩家1，2为玩家2或AI
        this.gameMode = 'pvp'; // 'pvp' 或 'pvc'
        this.gameOver = false;
        this.winner = null;
        this.pieceImages = [];
        this.imagesLoaded = 0;
        
        this.initBoard();
        this.loadImages();
        this.setupEventListeners();
        this.setupCanvasSize();
        this.showModeSelection();
    }
    
    getOptimalCellSize() {
        // 根据屏幕大小动态计算格子尺寸
        const screenWidth = Math.min(window.innerWidth, 600);
        const screenHeight = Math.min(window.innerHeight, 600);
        const availableSize = Math.min(screenWidth - 80, screenHeight - 200); // 留出边距
        return Math.floor(availableSize / this.boardSize);
    }
    
    setupCanvasSize() {
        const canvas = document.getElementById('game-board');
        const canvasSize = this.cellSize * this.boardSize;
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        canvas.style.width = canvasSize + 'px';
        canvas.style.height = canvasSize + 'px';
    }
    
    initBoard() {
        this.board = [];
        this.pieceImageIndexes = [];
        for (let i = 0; i < this.boardSize; i++) {
            this.board[i] = [];
            this.pieceImageIndexes[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.board[i][j] = 0;
                this.pieceImageIndexes[i][j] = -1; // -1表示无棋子
            }
        }
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = null;
    }
    
    loadImages() {
        const imageFiles = [
            '1759502396455.png',
            '1759502399366.png', 
            '1759502401426.png',
            '1759502403105.png',
            '1759502404477.png'
        ];
        
        this.pieceImages = [];
        this.imagesLoaded = 0;
        
        imageFiles.forEach((filename, index) => {
            const img = new Image();
            img.onload = () => {
                this.imagesLoaded++;
                if (this.imagesLoaded === imageFiles.length) {
                    this.drawBoard();
                }
            };
            img.src = filename;
            this.pieceImages.push(img);
        });
    }
    
    setupEventListeners() {
        const canvas = document.getElementById('game-board');
        const pvpBtn = document.getElementById('pvp-mode');
        const pvcBtn = document.getElementById('pvc-mode');
        const restartBtn = document.getElementById('restart-btn');
        
        // 电脑鼠标事件
        canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // 手机触摸事件
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 阻止默认行为
            this.handleTouch(e);
        });
        
        // 按钮事件
        pvpBtn.addEventListener('click', () => this.setGameMode('pvp'));
        pvcBtn.addEventListener('click', () => this.setGameMode('pvc'));
        restartBtn.addEventListener('click', () => this.restartGame());
        
        // 窗口大小改变时重新计算尺寸
        window.addEventListener('resize', () => {
            this.cellSize = this.getOptimalCellSize();
            this.setupCanvasSize();
            this.drawBoard();
        });
    }
    
    handleTouch(e) {
        if (e.touches && e.touches.length > 0) {
            const touch = e.touches[0];
            const canvas = document.getElementById('game-board');
            const rect = canvas.getBoundingClientRect();
            
            // 考虑设备像素比和缩放的影响
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            
            // 计算触摸位置（考虑缩放）
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;
            
            console.log(`触摸坐标: (${x.toFixed(2)}, ${y.toFixed(2)}), 格子大小: ${this.cellSize}`);
            
            this.processClick(x, y);
        }
    }
    
    setGameMode(mode) {
        this.gameMode = mode;
        this.restartGame();
        
        const pvpBtn = document.getElementById('pvp-mode');
        const pvcBtn = document.getElementById('pvc-mode');
        const modeDisplay = document.getElementById('game-mode');
        
        if (mode === 'pvp') {
            pvpBtn.classList.add('active');
            pvcBtn.classList.remove('active');
            modeDisplay.textContent = '模式: 玩家对战';
        } else {
            pvcBtn.classList.add('active');
            pvpBtn.classList.remove('active');
            modeDisplay.textContent = '模式: 人机对战';
        }
    }
    
    handleClick(e) {
        const canvas = document.getElementById('game-board');
        const rect = canvas.getBoundingClientRect();
        
        // 考虑设备像素比和缩放的影响
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        console.log(`鼠标坐标: (${x.toFixed(2)}, ${y.toFixed(2)}), 格子大小: ${this.cellSize}`);
        
        this.processClick(x, y);
    }
    
    processClick(x, y) {
        if (this.gameOver) return;
        if (this.gameMode === 'pvc' && this.currentPlayer === 2) return; // AI回合时禁止点击
        
        // 更精确的格子计算：找到最近的交叉点
        const exactCol = x / this.cellSize;
        const exactRow = y / this.cellSize;
        
        // 四舍五入到最近的整数交叉点
        const col = Math.round(exactCol);
        const row = Math.round(exactRow);
        
        // 计算点击位置到最近交叉点的距离
        const targetX = col * this.cellSize;
        const targetY = row * this.cellSize;
        const distance = Math.sqrt((x - targetX) ** 2 + (y - targetY) ** 2);
        
        // 严格的容错范围：格子大小的45%
        const tolerance = this.cellSize * 0.45;
        
        console.log(`点击分析: 精确位置(${exactCol.toFixed(2)}, ${exactRow.toFixed(2)}), 目标格子(${row}, ${col}), 距离: ${distance.toFixed(2)}, 容错: ${tolerance.toFixed(2)}`);
        
        // 检查是否在棋盘范围内且点击位置合理
        if (row >= 0 && row < this.boardSize && 
            col >= 0 && col < this.boardSize && 
            distance <= tolerance && 
            this.isValidMove(row, col)) {
            
            console.log(`成功落子在位置: (${row}, ${col})`);
            
            this.makeMove(row, col, this.currentPlayer);
            
            if (this.checkWin(row, col, this.currentPlayer)) {
                this.gameOver = true;
                this.winner = this.currentPlayer;
                this.updateDisplay();
                this.showWinMessage();
                return;
            }
            
            if (this.isBoardFull()) {
                this.gameOver = true;
                this.showDrawMessage();
                return;
            }
            
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            this.updateDisplay();
            
            // AI回合
            if (this.gameMode === 'pvc' && this.currentPlayer === 2) {
                setTimeout(() => this.makeAIMove(), 500);
            }
        } else {
            console.log(`点击失败: 超出容错范围或位置无效`);
        }
    }
    
    isValidMove(row, col) {
        return row >= 0 && row < this.boardSize && 
               col >= 0 && col < this.boardSize && 
               this.board[row][col] === 0;
    }
    
    makeMove(row, col, player) {
        this.board[row][col] = player;
        
        // 为新棋子分配图片索引（固定不变）
        const newPieceImageIndex = Math.floor(Math.random() * this.pieceImages.length);
        this.pieceImageIndexes[row][col] = newPieceImageIndex;
        
        this.drawBoard();
    }
    
    makeAIMove() {
        if (this.gameOver) return;
        
        const move = this.getBestMove();
        if (move) {
            this.makeMove(move.row, move.col, 2);
            
            if (this.checkWin(move.row, move.col, 2)) {
                this.gameOver = true;
                this.winner = 2;
                this.updateDisplay();
                this.showWinMessage();
                return;
            }
            
            if (this.isBoardFull()) {
                this.gameOver = true;
                this.showDrawMessage();
                return;
            }
            
            this.currentPlayer = 1;
            this.updateDisplay();
        }
    }
    
    getBestMove() {
        // 高级AI算法：使用评估函数和Minimax算法
        const depth = 2; // 搜索深度
        const alpha = -Infinity;
        const beta = Infinity;
        
        let bestMove = null;
        let bestScore = -Infinity;
        
        // 获取有效移动（只考虑现有棋子周围的位置）
        const moves = this.getValidMoves();
        
        for (const move of moves) {
            this.board[move.row][move.col] = 2; // AI棋子
            
            // 检查是否能直接获胜
            if (this.checkWin(move.row, move.col, 2)) {
                this.board[move.row][move.col] = 0;
                return move;
            }
            
            const score = this.minimax(depth - 1, false, alpha, beta);
            this.board[move.row][move.col] = 0;
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        // 如果没有找到好的位置，使用简单策略
        if (!bestMove) {
            return this.getSimpleBestMove();
        }
        
        return bestMove;
    }
    
    minimax(depth, isMaximizing, alpha, beta) {
        // 检查游戏结束条件
        const gameState = this.evaluateGameState();
        if (gameState !== 0 || depth === 0) {
            return this.evaluateBoard();
        }
        
        const moves = this.getValidMoves();
        
        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of moves) {
                this.board[move.row][move.col] = 2;
                const evaluation = this.minimax(depth - 1, false, alpha, beta);
                this.board[move.row][move.col] = 0;
                maxEval = Math.max(maxEval, evaluation);
                alpha = Math.max(alpha, evaluation);
                if (beta <= alpha) break; // Alpha-Beta剪枝
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const move of moves) {
                this.board[move.row][move.col] = 1;
                const evaluation = this.minimax(depth - 1, true, alpha, beta);
                this.board[move.row][move.col] = 0;
                minEval = Math.min(minEval, evaluation);
                beta = Math.min(beta, evaluation);
                if (beta <= alpha) break; // Alpha-Beta剪枝
            }
            return minEval;
        }
    }
    
    getValidMoves() {
        const moves = [];
        const visited = new Set();
        
        // 在现有棋子周围找空位
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    // 检查周围8个方向
                    for (let dx = -2; dx <= 2; dx++) {
                        for (let dy = -2; dy <= 2; dy++) {
                            const newRow = row + dx;
                            const newCol = col + dy;
                            const key = `${newRow},${newCol}`;
                            
                            if (newRow >= 0 && newRow < this.boardSize &&
                                newCol >= 0 && newCol < this.boardSize &&
                                this.board[newRow][newCol] === 0 &&
                                !visited.has(key)) {
                                moves.push({ row: newRow, col: newCol });
                                visited.add(key);
                            }
                        }
                    }
                }
            }
        }
        
        // 如果棋盘为空，在中心附近下子
        if (moves.length === 0) {
            const center = Math.floor(this.boardSize / 2);
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const row = center + dx;
                    const col = center + dy;
                    if (row >= 0 && row < this.boardSize &&
                        col >= 0 && col < this.boardSize &&
                        this.board[row][col] === 0) {
                        moves.push({ row, col });
                    }
                }
            }
        }
        
        return moves;
    }
    
    evaluateBoard() {
        let score = 0;
        
        // 评估所有可能的线条
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    score += this.evaluatePosition(row, col, this.board[row][col]);
                }
            }
        }
        
        return score;
    }
    
    evaluateGameState() {
        // 检查游戏是否结束
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    if (this.checkWin(row, col, this.board[row][col])) {
                        return this.board[row][col] === 2 ? 1000 : -1000;
                    }
                }
            }
        }
        return 0;
    }
    
    getSimpleBestMove() {
        // 简单策略：优先级顺序
        // 1. 检查AI是否能获胜
        // 2. 检查是否需要阻止玩家获胜
        // 3. 寻找最佳位置
        
        // 检查AI获胜机会
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col)) {
                    this.board[row][col] = 2;
                    if (this.checkWin(row, col, 2)) {
                        this.board[row][col] = 0;
                        return { row, col };
                    }
                    this.board[row][col] = 0;
                }
            }
        }
        
        // 检查阻止玩家获胜
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col)) {
                    this.board[row][col] = 1;
                    if (this.checkWin(row, col, 1)) {
                        this.board[row][col] = 0;
                        return { row, col };
                    }
                    this.board[row][col] = 0;
                }
            }
        }
        
        // 寻找最佳位置（中心附近）
        const center = Math.floor(this.boardSize / 2);
        const moves = [];
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.isValidMove(row, col)) {
                    const score = this.evaluateSimplePosition(row, col);
                    moves.push({ row, col, score });
                }
            }
        }
        
        if (moves.length === 0) return null;
        
        // 按分数排序，选择最佳位置
        moves.sort((a, b) => b.score - a.score);
        return moves[0];
    }
    
    evaluatePosition(row, col, player) {
        let score = 0;
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 对角线
            [1, -1]   // 反对角线
        ];
        
        for (const [dx, dy] of directions) {
            score += this.evaluateLine(row, col, dx, dy, player);
        }
        
        return player === 2 ? score : -score;
    }
    
    evaluateLine(row, col, dx, dy, player) {
        let count = 1; // 包含当前位置
        let blocked = 0; // 被阻挡的方向数
        
        // 正方向检查
        let r = row + dx, c = col + dy;
        while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
            if (this.board[r][c] === player) {
                count++;
            } else if (this.board[r][c] === 0) {
                break;
            } else {
                blocked++;
                break;
            }
            r += dx;
            c += dy;
        }
        
        // 边界也算被阻挡
        if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) {
            blocked++;
        }
        
        // 反方向检查
        r = row - dx;
        c = col - dy;
        while (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
            if (this.board[r][c] === player) {
                count++;
            } else if (this.board[r][c] === 0) {
                break;
            } else {
                blocked++;
                break;
            }
            r -= dx;
            c -= dy;
        }
        
        // 边界也算被阻挡
        if (r < 0 || r >= this.boardSize || c < 0 || c >= this.boardSize) {
            blocked++;
        }
        
        return this.getLineScore(count, blocked);
    }
    
    getLineScore(count, blocked) {
        // 根据连子数和被阻挡情况计算分数
        if (blocked >= 2) return 0; // 两端被堵，无价值
        
        switch (count) {
            case 5: return 100000; // 五子连珠
            case 4: return blocked === 0 ? 10000 : 1000; // 活四/死四
            case 3: return blocked === 0 ? 1000 : 100; // 活三/死三
            case 2: return blocked === 0 ? 100 : 10; // 活二/死二
            case 1: return blocked === 0 ? 10 : 1; // 活一/死一
            default: return 0;
        }
    }
    
    evaluateSimplePosition(row, col) {
        let score = 0;
        const center = Math.floor(this.boardSize / 2);
        
        // 中心位置加分
        const distanceFromCenter = Math.abs(row - center) + Math.abs(col - center);
        score += Math.max(0, 10 - distanceFromCenter);
        
        // 检查周围是否有己方棋子
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        for (const [dx, dy] of directions) {
            const newRow = row + dx;
            const newCol = col + dy;
            if (newRow >= 0 && newRow < this.boardSize && 
                newCol >= 0 && newCol < this.boardSize) {
                if (this.board[newRow][newCol] === 2) {
                    score += 3;
                } else if (this.board[newRow][newCol] === 1) {
                    score += 1; // 也要考虑阻挡对手
                }
            }
        }
        
        return score;
    }
    
    checkWin(row, col, player) {
        const directions = [
            [0, 1],   // 水平
            [1, 0],   // 垂直
            [1, 1],   // 对角线
            [1, -1]   // 反对角线
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            // 正方向检查
            let newRow = row + dx;
            let newCol = col + dy;
            while (newRow >= 0 && newRow < this.boardSize && 
                   newCol >= 0 && newCol < this.boardSize && 
                   this.board[newRow][newCol] === player) {
                count++;
                newRow += dx;
                newCol += dy;
            }
            
            // 反方向检查
            newRow = row - dx;
            newCol = col - dy;
            while (newRow >= 0 && newRow < this.boardSize && 
                   newCol >= 0 && newCol < this.boardSize && 
                   this.board[newRow][newCol] === player) {
                count++;
                newRow -= dx;
                newCol -= dy;
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    isBoardFull() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] === 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    drawBoard() {
        const canvas = document.getElementById('game-board');
        const ctx = canvas.getContext('2d');
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制背景
        ctx.fillStyle = '#DEB887';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格线
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.boardSize; i++) {
            // 垂直线
            ctx.beginPath();
            ctx.moveTo(i * this.cellSize, 0);
            ctx.lineTo(i * this.cellSize, this.boardSize * this.cellSize);
            ctx.stroke();
            
            // 水平线
            ctx.beginPath();
            ctx.moveTo(0, i * this.cellSize);
            ctx.lineTo(this.boardSize * this.cellSize, i * this.cellSize);
            ctx.stroke();
        }
        
        // 绘制天元和星位（11x11棋盘）
        ctx.fillStyle = '#8B4513';
        const starPoints = [
            [2, 2], [2, 8], [5, 5], [8, 2], [8, 8] // 适配11x11棋盘
        ];
        
        for (const [row, col] of starPoints) {
            ctx.beginPath();
            ctx.arc(col * this.cellSize + this.cellSize/2, 
                   row * this.cellSize + this.cellSize/2, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // 绘制棋子
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.board[row][col] !== 0) {
                    this.drawPiece(row, col, this.board[row][col]);
                } else {
                    // 在手机端显示可点击区域提示
                    if (this.isMobileDevice()) {
                        this.drawClickHint(row, col);
                    }
                }
            }
        }
    }
    
    drawPiece(row, col, player) {
        const canvas = document.getElementById('game-board');
        const ctx = canvas.getContext('2d');
        
        // 使用存储的图片索引
        const imageIndex = this.pieceImageIndexes[row][col];
        if (imageIndex >= 0 && imageIndex < this.pieceImages.length) {
            const img = this.pieceImages[imageIndex];
            
            if (img && img.complete) {
                const x = col * this.cellSize + 2;
                const y = row * this.cellSize + 2;
                const size = this.cellSize - 4;
                
                // 绘制图片
                ctx.drawImage(img, x, y, size, size);
                
                // 添加玩家标识边框
                ctx.strokeStyle = player === 1 ? '#FF6B6B' : '#4ECDC4';
                ctx.lineWidth = 3;
                ctx.strokeRect(x, y, size, size);
            }
        }
    }
    
    drawClickHint(row, col) {
        const canvas = document.getElementById('game-board');
        const ctx = canvas.getContext('2d');
        
        const centerX = col * this.cellSize;
        const centerY = row * this.cellSize;
        
        // 绘制交叉点位置的小圆点
        const radius = Math.min(this.cellSize * 0.08, 3);
        ctx.fillStyle = 'rgba(139, 69, 19, 0.4)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        
        // 在手机端显示更大的点击区域提示
        if (this.isMobileDevice()) {
            const tolerance = this.cellSize * 0.45;
            ctx.strokeStyle = 'rgba(139, 69, 19, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(centerX, centerY, tolerance, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }
    
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               ('ontouchstart' in window) || 
               (window.innerWidth <= 768);
    }
    
    showModeSelection() {
        // 在移动端显示模式选择界面
        if (this.isMobileDevice()) {
            document.querySelector('.mobile-mode-overlay').style.display = 'flex';
            document.querySelector('.main-game').style.display = 'none';
        } else {
            // 桌面端直接显示游戏界面
            this.startGame('pvp');
        }
    }
    
    startGame(mode) {
        this.gameMode = mode;
        
        // 移动端隐藏模式选择，显示游戏界面
        if (this.isMobileDevice()) {
            document.querySelector('.mobile-mode-overlay').style.display = 'none';
            document.querySelector('.main-game').style.display = 'block';
        }
        
        // 更新模式显示
        const modeDisplay = document.getElementById('game-mode');
        modeDisplay.textContent = mode === 'pvp' ? '模式: 玩家对战' : '模式: 人机对战';
        
        // 重新开始游戏
        this.restartGame();
    }
    
    updateDisplay() {
        const currentPlayerDisplay = document.getElementById('current-player');
        if (this.gameOver) {
            if (this.winner) {
                const playerName = this.gameMode === 'pvc' ? 
                    (this.winner === 1 ? '玩家' : 'AI') : 
                    `玩家${this.winner}`;
                currentPlayerDisplay.textContent = `游戏结束 - ${playerName}获胜！🎉`;
            } else {
                currentPlayerDisplay.textContent = '游戏结束 - 平局！🤝';
            }
        } else {
            const playerName = this.gameMode === 'pvc' ? 
                (this.currentPlayer === 1 ? '玩家' : 'AI') : 
                `玩家${this.currentPlayer}`;
            currentPlayerDisplay.textContent = `当前玩家: ${playerName}`;
        }
    }
    
    showWinMessage() {
        const playerName = this.gameMode === 'pvc' ? 
            (this.winner === 1 ? '玩家' : 'AI') : 
            `玩家${this.winner}`;
        setTimeout(() => {
            alert(`🎉 ${playerName}获胜！\n\n是否重新开始游戏？`);
        }, 100);
    }
    
    showDrawMessage() {
        setTimeout(() => {
            alert('🤝 游戏平局！\n\n是否重新开始游戏？');
        }, 100);
    }
    
    restartGame() {
        this.initBoard();
        this.drawBoard();
        this.updateDisplay();
    }
}

// 游戏初始化
let game;
window.addEventListener('load', () => {
    game = new GomokuGame();
});