#!/bin/bash

# 贪吃蛇游戏启动脚本
# 支持直接打开HTML文件或启动本地服务器

echo "贪吃蛇游戏启动器"
echo "================="
echo

# 检查Node.js是否安装
if command -v node &> /dev/null; then
    echo "✅ Node.js 已安装"
else
    echo "❌ Node.js 未安装"
    echo "请先安装Node.js或直接打开index.html文件"
    echo
    read -p "是否要直接打开index.html文件？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open index.html
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open index.html
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
            start index.html
        else
            echo "无法识别操作系统，请手动打开index.html文件"
        fi
    fi
    exit 1
fi

# 显示菜单
echo "请选择启动方式："
echo "1. 启动本地服务器 (推荐，支持完整功能)"
echo "2. 直接打开HTML文件"
echo "3. 检查文件完整性"
echo "4. 退出"
echo

read -p "请输入选项 (1-4): " option

case $option in
    1)
        echo "正在启动本地服务器..."
        node test-server.js
        ;;
    2)
        echo "正在打开HTML文件..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open index.html
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open index.html
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
            start index.html
        else
            echo "无法识别操作系统，请手动打开index.html文件"
        fi
        ;;
    3)
        echo "检查文件完整性..."
        echo
        files=("index.html" "style.css" "game.js" "README.md")
        missing=0
        for file in "${files[@]}"; do
            if [ -f "$file" ]; then
                echo "✅ $file 存在"
            else
                echo "❌ $file 缺失"
                missing=$((missing+1))
            fi
        done

        if [ $missing -eq 0 ]; then
            echo
            echo "✅ 所有文件完整！"
        else
            echo
            echo "❌ 有 $missing 个文件缺失"
        fi
        ;;
    4)
        echo "再见！"
        exit 0
        ;;
    *)
        echo "无效选项，再见！"
        exit 1
        ;;
esac