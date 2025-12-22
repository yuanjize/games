#!/bin/bash

echo "测试 Cloudflare Pages 构建配置..."
echo ""

# 检查必要的文件
echo "1. 检查文件是否存在:"
echo "   package.json: $(test -f package.json && echo "✓ 存在" || echo "✗ 不存在")"
echo "   _wrangler.json: $(test -f _wrangler.json && echo "✓ 存在" || echo "✗ 不存在")"
echo "   index.html: $(test -f index.html && echo "✓ 存在" || echo "✗ 不存在")"
echo "   style.css: $(test -f style.css && echo "✓ 存在" || echo "✗ 不存在")"
echo ""

# 检查游戏文件夹
echo "2. 检查游戏文件夹:"
for folder in space-shooter platform-jumper fruit-2048 memory-cards snake-game brick-breaker tic-tac-toe minesweeper typing-test physics-pinball; do
  echo "   $folder: $(test -d $folder && echo "✓ 存在" || echo "✗ 不存在")"
done
echo ""

# 模拟 Cloudflare 构建命令
echo "3. 模拟 Cloudflare Pages 构建:"
echo "   运行: npm run build"
npm run build
echo ""

echo "构建测试完成！"
echo ""
echo "部署说明："
echo "1. 在 Cloudflare Pages 中连接到你的 Git 仓库"
echo "2. 构建设置："
echo "   构建命令: npm run build"
echo "   构建输出目录: . (当前目录)"
echo "3. 或者使用 '直接上传' 方式上传整个文件夹"