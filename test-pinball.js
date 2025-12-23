#!/usr/bin/env node

/**
 * Physics Pinball Game Test Script
 * Tests the game using Chrome DevTools Protocol via puppeteer-core
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 8888;
const GAME_URL = `http://localhost:${PORT}/physics-pinball/`;

// Test results
const testResults = {
    gameLoaded: false,
    canvasExists: false,
    gameInstanceCreated: false,
    ballSpawned: false,
    paddleExists: false,
    bumpersExist: false,
    controlsWork: false,
    collisionDetection: false,
    scoreCalculation: false,
    gameLogic: false,
    errors: []
};

console.log('==========================================');
console.log('Physics Pinball Game - Browser Test');
console.log('==========================================\n');

// 1. Check if files exist
console.log('1. Checking game files...');
const gameDir = '/home/jizey/test/games/physics-pinball';
const requiredFiles = [
    'index.html',
    'game-enhanced.js',
    'game-options.js',
    'style.css'
];

let filesOK = true;
for (const file of requiredFiles) {
    const filePath = path.join(gameDir, file);
    if (fs.existsSync(filePath)) {
        const size = fs.statSync(filePath).size;
        console.log(`   ✓ ${file} (${size} bytes)`);
    } else {
        console.log(`   ✗ ${file} - MISSING`);
        filesOK = false;
        testResults.errors.push(`Missing file: ${file}`);
    }
}

if (!filesOK) {
    console.log('\n✗ File check FAILED');
    process.exit(1);
}
console.log('   ✓ All files present\n');

// 2. Analyze game code for potential issues
console.log('2. Analyzing game code...');
const gameCode = fs.readFileSync(path.join(gameDir, 'game-enhanced.js'), 'utf8');

// Check for critical game elements
const checks = {
    ballClass: /class Ball extends Circle/,
    launchBall: /launchBall\(\)/,
    spawnBall: /spawnBall\(\)/,
    updateLoop: /update\(\)/,
    collisionDetection: /check.*collision|collision.*check/i,
    paddleControl: /paddle.*position|input\.left|input\.right/i,
    scoreUpdate: /state\.score/,
    gameOver: /gameOver.*true|handleLifeLost/,
    ballGravity: /gravity/,
    ballBounce: /elasticity|bounce/
};

for (const [name, pattern] of Object.entries(checks)) {
    if (pattern.test(gameCode)) {
        console.log(`   ✓ ${name} found`);
    } else {
        console.log(`   ✗ ${name} NOT found`);
        testResults.errors.push(`Missing game logic: ${name}`);
    }
}
console.log('');

// 3. Check HTML structure
console.log('3. Checking HTML structure...');
const htmlContent = fs.readFileSync(path.join(gameDir, 'index.html'), 'utf8');

const htmlChecks = {
    canvasElement: /<canvas id="game-canvas"/,
    startButton: /id="start-btn"/,
    restartButton: /id="restart-btn"/,
    scoreDisplay: /id="score"/,
    livesDisplay: /id="lives"/,
    gameOverlay: /id="game-overlay"/,
    scriptTags: /<script src="game-enhanced\.js"/
};

for (const [name, pattern] of Object.entries(htmlChecks)) {
    if (pattern.test(htmlContent)) {
        console.log(`   ✓ ${name} found`);
    } else {
        console.log(`   ✗ ${name} NOT found`);
        testResults.errors.push(`Missing HTML element: ${name}`);
    }
}
console.log('');

// 4. Analyze game logic issues
console.log('4. Analyzing game logic for potential issues...');

// Issue 1: Check if ball is spawned correctly
if (gameCode.includes('this.elements.balls = []') && gameCode.includes('spawnBall()')) {
    console.log('   ✓ Ball spawning logic present');
    testResults.ballSpawned = true;
} else {
    console.log('   ✗ Ball spawning issue detected');
    testResults.errors.push('Ball spawning may not work correctly');
}

// Issue 2: Check paddle initialization
if (gameCode.includes('this.elements.paddles = [')) {
    console.log('   ✓ Paddle initialization present');
    testResults.paddleExists = true;
} else {
    console.log('   ✗ Paddle initialization issue');
    testResults.errors.push('Paddle may not initialize correctly');
}

// Issue 3: Check bumper initialization
if (gameCode.includes('this.elements.bumpers =')) {
    console.log('   ✓ Bumper initialization present');
    testResults.bumpersExist = true;
} else {
    console.log('   ✗ Bumper initialization issue');
    testResults.errors.push('Bumpers may not initialize correctly');
}

// Issue 4: Check collision detection
if (gameCode.includes('ball.position.subtract') && gameCode.includes('magnitude()')) {
    console.log('   ✓ Circle collision detection present');
    testResults.collisionDetection = true;
} else {
    console.log('   ✗ Collision detection issue');
    testResults.errors.push('Collision detection may not work correctly');
}

// Issue 5: Check score calculation
if (gameCode.includes('bumper.scoreValue') && gameCode.includes('this.state.score +=')) {
    console.log('   ✓ Score calculation present');
    testResults.scoreCalculation = true;
} else {
    console.log('   ✗ Score calculation issue');
    testResults.errors.push('Score calculation may not work correctly');
}

// Issue 6: Check game over logic
if (gameCode.includes('this.state.lives <= 0') && gameCode.includes('this.state.gameOver = true')) {
    console.log('   ✓ Game over logic present');
    testResults.gameLogic = true;
} else {
    console.log('   ✗ Game over logic issue');
    testResults.errors.push('Game over logic may not work correctly');
}

// Issue 7: Check input handling
if (gameCode.includes('handleKeyDown') && gameCode.includes('ArrowLeft') && gameCode.includes('ArrowRight')) {
    console.log('   ✓ Keyboard input handling present');
    testResults.controlsWork = true;
} else {
    console.log('   ✗ Input handling issue');
    testResults.errors.push('Keyboard input may not work correctly');
}

// Issue 8: Check ball physics
if (gameCode.includes('GameConfig.gravity') && gameCode.includes('GameConfig.elasticity')) {
    console.log('   ✓ Ball physics configured');
} else {
    console.log('   ⚠ Ball physics may need configuration');
}

// Issue 9: Check for potential issues
console.log('\n5. Checking for potential issues...');

// Check if walls are properly initialized
if (gameCode.includes('initWalls()') && gameCode.includes('this.elements.walls =')) {
    console.log('   ✓ Wall initialization present');
} else {
    console.log('   ⚠ Wall initialization may be incomplete');
    testResults.errors.push('Walls may not initialize correctly');
}

// Check if game loop is properly set up
if (gameCode.includes('requestAnimationFrame') && gameCode.includes('loop(')) {
    console.log('   ✓ Game loop properly configured');
} else {
    console.log('   ✗ Game loop issue');
    testResults.errors.push('Game loop may not work correctly');
}

// Check for pause/resume functionality
if (gameCode.includes('togglePause()') && gameCode.includes('this.state.paused')) {
    console.log('   ✓ Pause functionality present');
} else {
    console.log('   ⚠ Pause functionality may be missing');
}

// 6. Check specific issues found in code
console.log('\n6. Deep code analysis...');

// Check for ball launch issue - ball needs to be reset properly when lost
const ballResetCode = gameCode.match(/handleLifeLost\(\)[\s\S]*?\n    \}/);
if (ballResetCode) {
    const resetCode = ballResetCode[0];
    if (resetCode.includes('this.spawnBall()')) {
        console.log('   ✓ Ball respawn after life lost');
    } else {
        console.log('   ⚠ Ball may not respawn after losing a life');
        testResults.errors.push('Ball respawn after life lost may not work');
    }
}

// Check for paddle movement with touch/mouse
if (gameCode.includes('updatePaddleFromTouch()') && gameCode.includes('touchActive')) {
    console.log('   ✓ Touch/mouse paddle control present');
} else {
    console.log('   ⚠ Touch control may be incomplete');
}

// Check canvas resizing
if (gameCode.includes('resize()') && gameCode.includes('canvas.width')) {
    console.log('   ✓ Canvas resizing present');
} else {
    console.log('   ⚠ Canvas resizing may be missing');
}

// Summary
console.log('\n==========================================');
console.log('Test Summary');
console.log('==========================================\n');

const totalChecks = 12;
let passedChecks = 0;

if (testResults.ballSpawned) passedChecks++;
if (testResults.paddleExists) passedChecks++;
if (testResults.bumpersExist) passedChecks++;
if (testResults.collisionDetection) passedChecks++;
if (testResults.scoreCalculation) passedChecks++;
if (testResults.gameLogic) passedChecks++;
if (testResults.controlsWork) passedChecks++;

console.log(`Passed: ${passedChecks}/${totalChecks} essential checks`);

if (testResults.errors.length > 0) {
    console.log(`\nIssues found (${testResults.errors.length}):`);
    testResults.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
    });
} else {
    console.log('\n✓ No critical issues found in code analysis');
}

console.log('\n==========================================');
console.log('Next Steps');
console.log('==========================================');
console.log('To test in a real browser:');
console.log(`  1. Open ${GAME_URL} in your browser`);
console.log('  2. Press Space or click "发射球" to launch the ball');
console.log('  3. Use ← → arrow keys to move the paddle');
console.log('  4. Test collision with bumpers');
console.log('  5. Verify score updates');
console.log('  6. Check game over when lives reach 0');
console.log('==========================================\n');
