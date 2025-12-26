#!/bin/bash

echo "=== 水果2048游戏测试脚本 ==="
echo ""

# 检查文件是否存在
echo "1. 检查文件存在性..."
files=("index.html" "game.js" "style.css" "debug-init.html" "test-simple.html" "index-standalone.html")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (缺失)"
    fi
done
echo ""

# 检查JavaScript语法
echo "2. 检查JavaScript语法..."
if command -v node &> /dev/null; then
    node -c game.js 2>&1 && echo "  ✓ game.js 语法正确" || echo "  ✗ game.js 有语法错误"
else
    echo "  ⚠ Node.js 未安装，跳过语法检查"
fi
echo ""

# 检查关键函数是否存在
echo "3. 检查关键函数..."
functions=("class FruitGame" "init()" "render()" "reset()" "move(" "validateElements()")
for func in "${functions[@]}"; do
    if grep -q "$func" game.js; then
        echo "  ✓ 找到 $func"
    else
        echo "  ✗ 缺少 $func"
    fi
done
echo ""

# 检查CSS
echo "4. 检查CSS样式..."
css_selectors=(".game-board" ".grid-cell" ".grid-cell.has-fruit")
for selector in "${css_selectors[@]}"; do
    if grep -q "$selector" style.css; then
        echo "  ✓ 找到 $selector"
    else
        echo "  ✗ 缺少 $selector"
    fi
done
echo ""

# 启动测试服务器
echo "5. 启动测试服务器..."
echo "   在浏览器中打开以下地址进行测试："
echo ""
echo "   主游戏:     http://localhost:8080/index.html"
echo "   独立调试版: http://localhost:8080/index-standalone.html"
echo "   简单测试:   http://localhost:8080/test-simple.html"
echo "   初始化调试: http://localhost:8080/debug-init.html"
echo ""

# 查找并停止已有的服务器
existing_pid=$(lsof -ti:8080)
if [ ! -z "$existing_pid" ]; then
    echo "   停止已有的服务器 (PID: $existing_pid)..."
    kill $existing_pid 2>/dev/null
    sleep 1
fi

# 启动新服务器
echo "   启动HTTP服务器在端口 8080..."
python3 -m http.server 8080 > /tmp/fruit-game-server.log 2>&1 &
SERVER_PID=$!
echo "   服务器PID: $SERVER_PID"
echo ""
echo "   按 Ctrl+C 停止服务器"
echo ""

# 等待服务器启动
sleep 2

# 检查服务器是否正常运行
if ps -p $SERVER_PID > /dev/null; then
    echo "   ✓ 服务器已启动"
    echo ""
    echo "   在浏览器中打开测试页面，然后按回车键查看控制台日志..."
    read

    # 显示日志
    if [ -f /tmp/fruit-game-server.log ]; then
        echo ""
        echo "=== 服务器日志 ==="
        tail -20 /tmp/fruit-game-server.log
    fi
else
    echo "   ✗ 服务器启动失败"
    exit 1
fi
