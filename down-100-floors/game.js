const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const floorEl = document.getElementById('floor');
const timeEl = document.getElementById('time');
const bestTimeEl = document.getElementById('best-time');
const statusEl = document.getElementById('status');

const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const winScreen = document.getElementById('win-screen');

const finalFloorEl = document.getElementById('final-floor');
const finalTimeEl = document.getElementById('final-time');

const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const restartPauseBtn = document.getElementById('restart-pause-btn');
const restartGameBtn = document.getElementById('restart-game-btn');
const restartWinBtn = document.getElementById('restart-win-btn');

const totalFloors = 100;
const floorSpacing = 110;
const startY = 90;

let viewWidth = 0;
let viewHeight = 0;
let worldWidth = 0;

const input = { left: false, right: false, down: false };
const state = {
    running: false,
    paused: false,
    gameOver: false,
    finished: false,
    startTime: 0,
    elapsed: 0,
    lastUpdate: 0
};

let floors = [];
let player = {
    x: 0,
    y: 0,
    width: 24,
    height: 32,
    vx: 0,
    vy: 0,
    onGround: false
};

let currentFloor = 0;
let bestTime = null;

function formatTime(ms) {
    const seconds = ms / 1000;
    return `${seconds.toFixed(1)}s`;
}

function loadBestTime() {
    const saved = localStorage.getItem('down100-best-time');
    bestTime = saved ? parseFloat(saved) : null;
    bestTimeEl.textContent = bestTime ? `${bestTime.toFixed(1)}s` : '--';
}

function updateStatus(text) {
    statusEl.textContent = text;
}

function resizeCanvas() {
    const container = canvas.parentElement;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    const prevWidth = worldWidth || width;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    viewWidth = width;
    viewHeight = height;
    worldWidth = width;

    if (player && prevWidth) {
        const scale = worldWidth / prevWidth;
        player.x *= scale;
        floors.forEach(floor => {
            floor.holeX *= scale;
            floor.holeWidth *= scale;
            if (floor.hazardWidth) {
                floor.hazardX *= scale;
                floor.hazardWidth *= scale;
            }
        });
    }
}

function createFloors() {
    floors = [];
    const margin = Math.max(18, viewWidth * 0.05);
    const minHole = Math.max(70, viewWidth * 0.18);
    const maxHole = Math.max(120, viewWidth * 0.28);

    for (let i = 0; i <= totalFloors; i++) {
        const y = startY + i * floorSpacing;
        const holeWidth = randomBetween(minHole, maxHole);
        const holeX = randomBetween(margin, viewWidth - margin - holeWidth);
        const hasHazard = i > 0 && Math.random() < 0.35;

        let hazardX = null;
        let hazardWidth = null;
        if (hasHazard) {
            hazardWidth = randomBetween(36, 72);
            for (let tries = 0; tries < 6; tries++) {
                const candidate = randomBetween(margin, viewWidth - margin - hazardWidth);
                const overlapHole = candidate < holeX + holeWidth + 8 && candidate + hazardWidth > holeX - 8;
                if (!overlapHole) {
                    hazardX = candidate;
                    break;
                }
            }
            if (hazardX === null) {
                hazardX = Math.min(margin, viewWidth - margin - hazardWidth);
            }
        }

        floors.push({
            y,
            holeX,
            holeWidth,
            hazardX,
            hazardWidth
        });
    }
}

function resetPlayer() {
    const base = Math.min(viewWidth, viewHeight);
    player.width = Math.max(18, Math.min(28, base * 0.06));
    player.height = player.width * 1.25;
    player.x = (viewWidth - player.width) / 2;
    player.y = startY - player.height;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
}

function resetGame(startImmediately) {
    createFloors();
    resetPlayer();
    currentFloor = 0;
    state.running = !!startImmediately;
    state.paused = false;
    state.gameOver = false;
    state.finished = false;
    state.startTime = performance.now();
    state.elapsed = 0;
    state.lastUpdate = 0;
    updateStatus(startImmediately ? '挑战中' : '待开始');
    updateUI();
    toggleOverlay(startScreen, !startImmediately);
    toggleOverlay(pauseScreen, false);
    toggleOverlay(gameOverScreen, false);
    toggleOverlay(winScreen, false);
}

function updateUI() {
    floorEl.textContent = `${currentFloor} / ${totalFloors}`;
    timeEl.textContent = formatTime(state.elapsed || 0);
}

function toggleOverlay(element, show) {
    if (!element) return;
    element.style.display = show ? 'flex' : 'none';
    element.setAttribute('aria-hidden', show ? 'false' : 'true');
}

function handleGameOver() {
    state.running = false;
    state.gameOver = true;
    updateStatus('失败');
    finalFloorEl.textContent = currentFloor;
    toggleOverlay(gameOverScreen, true);
}

function handleWin() {
    state.running = false;
    state.finished = true;
    updateStatus('通关');
    finalTimeEl.textContent = (state.elapsed / 1000).toFixed(1);
    if (!bestTime || state.elapsed / 1000 < bestTime) {
        bestTime = state.elapsed / 1000;
        localStorage.setItem('down100-best-time', bestTime.toString());
        bestTimeEl.textContent = `${bestTime.toFixed(1)}s`;
    }
    toggleOverlay(winScreen, true);
}

function updateGame(delta, timestamp) {
    if (!state.running || state.paused || state.gameOver || state.finished) return;

    if (!state.startTime) {
        state.startTime = timestamp;
    }

    state.elapsed = timestamp - state.startTime;
    updateUI();

    const moveSpeed = 4.4;
    const targetVx = (input.left ? -moveSpeed : 0) + (input.right ? moveSpeed : 0);
    player.vx += (targetVx - player.vx) * 0.2;

    const gravity = input.down ? 1.15 : 0.68;
    player.vy += gravity * delta;
    player.vy = Math.min(player.vy, 12);

    player.x += player.vx * delta;
    player.x = Math.max(0, Math.min(viewWidth - player.width, player.x));

    const prevBottom = player.y + player.height;
    player.y += player.vy * delta;
    player.onGround = false;

    if (player.vy >= 0) {
        const floorIndex = Math.min(
            totalFloors,
            Math.max(0, Math.floor((player.y + player.height - startY) / floorSpacing))
        );
        const floor = floors[floorIndex];
        if (floor) {
            const platformY = floor.y;
            const nextBottom = player.y + player.height;
            const crossesPlatform = nextBottom >= platformY && prevBottom < platformY;
            if (crossesPlatform) {
                const left = player.x;
                const right = player.x + player.width;
                const centerLeft = player.x + player.width * 0.3;
                const centerRight = player.x + player.width * 0.7;
                const inHole = centerLeft >= floor.holeX && centerRight <= floor.holeX + floor.holeWidth;

                if (!inHole) {
                    player.y = platformY - player.height;
                    player.vy = 0;
                    player.onGround = true;

                    if (
                        floor.hazardWidth &&
                        left < floor.hazardX + floor.hazardWidth &&
                        right > floor.hazardX
                    ) {
                        handleGameOver();
                        return;
                    }
                }
            }
        }
    }

    currentFloor = Math.min(
        totalFloors,
        Math.max(0, Math.floor((player.y + player.height - startY) / floorSpacing))
    );
    floorEl.textContent = `${currentFloor} / ${totalFloors}`;

    if (currentFloor >= totalFloors && player.onGround) {
        handleWin();
    }
}

function drawBackground(cameraY) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.2)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.08)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, viewWidth, viewHeight);

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let y = -((cameraY % 80) || 0); y < viewHeight; y += 80) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(viewWidth, y);
        ctx.stroke();
    }
}

function drawFloors(cameraY) {
    const safeColor = '#60a5fa';
    const hazardColor = '#f43f5e';
    const platformHeight = 10;

    floors.forEach((floor, index) => {
        const y = floor.y - cameraY;
        if (y < -40 || y > viewHeight + 40) return;

        ctx.fillStyle = safeColor;
        ctx.fillRect(0, y, floor.holeX, platformHeight);
        ctx.fillRect(floor.holeX + floor.holeWidth, y, viewWidth - floor.holeX - floor.holeWidth, platformHeight);

        if (floor.hazardWidth) {
            ctx.fillStyle = hazardColor;
            ctx.fillRect(floor.hazardX, y - 2, floor.hazardWidth, platformHeight + 4);
        }

        if (index % 10 === 0) {
            ctx.fillStyle = 'rgba(248, 250, 252, 0.6)';
            ctx.font = '12px Orbitron, sans-serif';
            ctx.fillText(`${index}`, 8, y - 8);
        }
    });
}

function drawPlayer(cameraY) {
    const x = player.x;
    const y = player.y - cameraY;

    ctx.save();
    ctx.translate(x + player.width / 2, y + player.height / 2);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = 'rgba(56, 189, 248, 0.35)';
    ctx.shadowBlur = 12;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-player.width / 4, -player.height / 6, player.width / 2, player.height / 3);
    ctx.restore();
}

function drawFrame() {
    const maxDepth = startY + totalFloors * floorSpacing + 200;
    const cameraY = Math.max(0, Math.min(maxDepth - viewHeight, player.y - viewHeight * 0.4));

    drawBackground(cameraY);
    drawFloors(cameraY);
    drawPlayer(cameraY);
}

function gameLoop(timestamp) {
    if (!state.lastUpdate) state.lastUpdate = timestamp;
    const delta = (timestamp - state.lastUpdate) / 16.67;
    state.lastUpdate = timestamp;

    if (!state.paused) {
        updateGame(delta, timestamp);
    }

    drawFrame();
    requestAnimationFrame(gameLoop);
}

function bindButton(id, key) {
    const button = document.getElementById(id);
    if (!button) return;

    const setValue = value => {
        input[key] = value;
        button.classList.toggle('active', value);
    };

    button.addEventListener('pointerdown', event => {
        event.preventDefault();
        setValue(true);
    });

    ['pointerup', 'pointerleave', 'pointercancel'].forEach(type => {
        button.addEventListener(type, () => setValue(false));
    });
}

function togglePause() {
    if (!state.running || state.gameOver || state.finished) return;
    state.paused = !state.paused;
    updateStatus(state.paused ? '暂停' : '挑战中');
    toggleOverlay(pauseScreen, state.paused);
}

function setupControls() {
    document.addEventListener('keydown', event => {
        if (event.repeat) return;
        switch (event.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                input.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                input.right = true;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                input.down = true;
                break;
            case ' ':
                event.preventDefault();
                togglePause();
                break;
            default:
                break;
        }
    });

    document.addEventListener('keyup', event => {
        switch (event.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                input.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                input.right = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                input.down = false;
                break;
            default:
                break;
        }
    });

    window.addEventListener('blur', () => {
        input.left = false;
        input.right = false;
        input.down = false;
    });

    bindButton('left-btn', 'left');
    bindButton('right-btn', 'right');
    bindButton('down-btn', 'down');
}

function setupButtons() {
    startBtn.addEventListener('click', () => {
        resetGame(true);
    });

    pauseBtn.addEventListener('click', togglePause);
    resumeBtn.addEventListener('click', togglePause);

    const restartHandler = () => resetGame(true);
    restartBtn.addEventListener('click', restartHandler);
    restartPauseBtn.addEventListener('click', restartHandler);
    restartGameBtn.addEventListener('click', restartHandler);
    restartWinBtn.addEventListener('click', restartHandler);
}

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function init() {
    resizeCanvas();
    loadBestTime();
    resetGame(false);
    setupControls();
    setupButtons();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', () => {
    resizeCanvas();
});

init();
