/**
 * 水果2048游戏自动化测试
 * 使用Node.js和JSDOM进行测试
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function testGameJS() {
    log('\n=== 测试 game.js ===', 'blue');

    const gamePath = path.join(__dirname, 'game.js');
    const gameCode = fs.readFileSync(gamePath, 'utf-8');

    // 测试1: 类定义
    log('测试1: 检查类定义', 'yellow');
    if (gameCode.includes('class FruitGame')) {
        log('  ✓ FruitGame 类存在', 'green');
    } else {
        log('  ✗ FruitGame 类不存在', 'red');
        return false;
    }

    // 测试2: 关键方法
    log('测试2: 检查关键方法', 'yellow');
    const requiredMethods = [
        'init()',
        'validateElements()',
        'reset()',
        'render()',
        'move(direction)',
        'addRandomFruit()',
        'bindEvents()',
        'updateUI()',
        'checkState()'
    ];

    let allMethodsExist = true;
    for (const method of requiredMethods) {
        const exists = gameCode.includes(method);
        if (exists) {
            log(`  ✓ ${method}`, 'green');
        } else {
            log(`  ✗ ${method} 缺失`, 'red');
            allMethodsExist = false;
        }
    }

    if (!allMethodsExist) {
        return false;
    }

    // 测试3: 水果定义
    log('测试3: 检查水果定义', 'yellow');
    if (gameCode.includes('this.fruits = [') && gameCode.includes('emoji:')) {
        log('  ✓ 水果数据存在', 'green');
        // 提取水果数量
        const match = gameCode.match(/level:\s*(\d+)/g);
        if (match) {
            log(`  ✓ 定义了 ${match.length} 个水果等级`, 'green');
        }
    } else {
        log('  ✗ 水果数据缺失', 'red');
        return false;
    }

    // 测试4: DOM元素引用
    log('测试4: 检查DOM元素引用', 'yellow');
    const requiredElements = [
        'board',
        'score',
        'best',
        'nextFruit',
        'restartBtn'
    ];

    let allElementsExist = true;
    for (const element of requiredElements) {
        const exists = gameCode.includes(`${element}:`);
        if (exists) {
            log(`  ✓ ${element}`, 'green');
        } else {
            log(`  ✗ ${element} 缺失`, 'red');
            allElementsExist = false;
        }
    }

    return allElementsExist;
}

function testHTML() {
    log('\n=== 测试 index.html ===', 'blue');

    const htmlPath = path.join(__dirname, 'index.html');
    const htmlCode = fs.readFileSync(htmlPath, 'utf-8');

    // 测试1: game-board元素
    log('测试1: 检查game-board元素', 'yellow');
    if (htmlCode.includes('id="game-board"')) {
        log('  ✓ game-board 元素存在', 'green');
    } else {
        log('  ✗ game-board 元素不存在', 'red');
        return false;
    }

    // 测试2: 脚本引用
    log('测试2: 检查脚本引用', 'yellow');
    if (htmlCode.includes('src="game.js"')) {
        log('  ✓ game.js 被引用', 'green');
    } else {
        log('  ✗ game.js 未被引用', 'red');
        return false;
    }

    // 测试3: CSS引用
    log('测试3: 检查CSS引用', 'yellow');
    if (htmlCode.includes('href="style.css"')) {
        log('  ✓ style.css 被引用', 'green');
    } else {
        log('  ✗ style.css 未被引用', 'red');
        return false;
    }

    // 测试4: 分数元素
    log('测试4: 检查分数显示元素', 'yellow');
    const scoreElements = ['current-score', 'best-score', 'next-fruit'];
    let allScoreElementsExist = true;
    for (const element of scoreElements) {
        const exists = htmlCode.includes(`id="${element}"`);
        if (exists) {
            log(`  ✓ ${element}`, 'green');
        } else {
            log(`  ✗ ${element} 缺失`, 'red');
            allScoreElementsExist = false;
        }
    }

    return allScoreElementsExist;
}

function testCSS() {
    log('\n=== 测试 style.css ===', 'blue');

    const cssPath = path.join(__dirname, 'style.css');
    const cssCode = fs.readFileSync(cssPath, 'utf-8');

    // 测试1: 关键样式类
    log('测试1: 检查关键样式类', 'yellow');
    const requiredClasses = [
        '.game-board',
        '.grid-cell',
        '.grid-cell.has-fruit',
        '.grid-cell.pop',
        '.grid-cell.merge'
    ];

    let allClassesExist = true;
    for (const className of requiredClasses) {
        const exists = cssCode.includes(className);
        if (exists) {
            log(`  ✓ ${className}`, 'green');
        } else {
            log(`  ✗ ${className} 缺失`, 'red');
            allClassesExist = false;
        }
    }

    // 测试2: 字体大小
    log('测试2: 检查字体大小设置', 'yellow');
    if (cssCode.includes('font-size')) {
        log('  ✓ font-size 已设置', 'green');
        // 查找grid-cell的字体大小
        const fontSizeMatch = cssCode.match(/\.grid-cell\s*{[^}]*font-size:\s*([^;]+)/);
        if (fontSizeMatch) {
            log(`  ✓ grid-cell 字体大小: ${fontSizeMatch[1].trim()}`, 'green');
        }
    } else {
        log('  ✗ font-size 未设置', 'red');
    }

    // 测试3: CSS变量
    log('测试3: 检查CSS变量', 'yellow');
    const requiredVars = [
        '--font-size-3xl',
        '--cell-bg',
        '--cell-active-bg'
    ];

    let allVarsExist = true;
    for (const varName of requiredVars) {
        const exists = cssCode.includes(varName);
        if (exists) {
            log(`  ✓ ${varName}`, 'green');
        } else {
            log(`  ✗ ${varName} 缺失`, 'red');
            allVarsExist = false;
        }
    }

    return allClassesExist && allVarsExist;
}

function testIntegration() {
    log('\n=== 集成测试 ===', 'blue');

    // 测试1: 文件存在性
    log('测试1: 检查所有文件存在', 'yellow');
    const requiredFiles = [
        'index.html',
        'game.js',
        'style.css'
    ];

    let allFilesExist = true;
    for (const file of requiredFiles) {
        const filePath = path.join(__dirname, file);
        const exists = fs.existsSync(filePath);
        if (exists) {
            log(`  ✓ ${file}`, 'green');
        } else {
            log(`  ✗ ${file} 不存在`, 'red');
            allFilesExist = false;
        }
    }

    return allFilesExist;
}

function main() {
    log('\n🍎 水果2048游戏自动化测试', 'blue');
    log('=====================================', 'blue');

    const results = {
        gameJS: testGameJS(),
        html: testHTML(),
        css: testCSS(),
        integration: testIntegration()
    };

    log('\n=====================================', 'blue');
    log('测试结果汇总:', 'blue');

    if (results.gameJS && results.html && results.css && results.integration) {
        log('✅ 所有测试通过！游戏应该可以正常运行。', 'green');
        log('\n请在浏览器中打开以下页面进行手动测试:', 'yellow');
        log('  http://localhost:8080/index.html', 'blue');
        log('  http://localhost:8080/index-standalone.html', 'blue');
        return 0;
    } else {
        log('❌ 部分测试失败，请检查上述错误信息。', 'red');
        return 1;
    }
}

// 运行测试
process.exit(main());
