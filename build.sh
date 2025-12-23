#!/bin/bash

echo "Building static site to ./dist..."
rm -rf dist
mkdir -p dist

# 复制所有 HTML、CSS、JS 文件
cp index.html dist/
cp style.css dist/
cp _headers dist/
cp _routes.json dist/

# 复制所有游戏文件夹
for game in space-shooter platform-jumper fruit-2048 memory-cards snake-game brick-breaker tic-tac-toe minesweeper typing-test physics-pinball; do
  cp -r $game dist/
done

echo "✓ Build complete! Output: ./dist"
