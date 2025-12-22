// 简单的HTTP服务器用于测试贪吃蛇游戏
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const GAME_DIR = __dirname;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.md': 'text/markdown'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // 处理根路径
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(GAME_DIR, filePath);

    // 检查文件是否存在
    fs.exists(filePath, (exists) => {
        if (!exists) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 文件未找到');
            return;
        }

        // 获取文件扩展名并设置Content-Type
        const extname = path.extname(filePath);
        const contentType = mimeTypes[extname] || 'application/octet-stream';

        // 读取并发送文件
        fs.readFile(filePath, (error, content) => {
            if (error) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500 服务器内部错误');
                return;
            }

            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            });
            res.end(content, 'utf-8');
        });
    });
});

server.listen(PORT, () => {
    console.log(`贪吃蛇游戏服务器已启动！`);
    console.log(`访问地址: http://localhost:${PORT}`);
    console.log(`游戏目录: ${GAME_DIR}`);
    console.log('\n游戏文件:');
    console.log(`- index.html   游戏主界面`);
    console.log(`- style.css    游戏样式`);
    console.log(`- game.js      游戏逻辑`);
    console.log(`- README.md    游戏说明`);
    console.log('\n按 Ctrl+C 停止服务器');
});

// 优雅地关闭服务器
process.on('SIGINT', () => {
    console.log('\n\n正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭。再见！');
        process.exit(0);
    });
});