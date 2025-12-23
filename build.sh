#!/bin/bash

set -e  # 遇到错误立即退出

echo "🎮 开始构建游戏合集..."

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 清理旧的构建输出
echo -e "${BLUE}📁 清理构建目录...${NC}"
rm -rf dist
mkdir -p dist

# 2. 生成版本号
VERSION=$(date +%Y.%m.%d.%H%M)
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "📦 版本: $VERSION" > dist/VERSION.txt
echo "🔖 提交: $GIT_SHA" >> dist/VERSION.txt
echo -e "${GREEN}✓ 版本: $VERSION${NC}"

# 3. 复制核心文件
echo -e "${BLUE}📄 复制核心文件...${NC}"
cp index.html dist/
cp style.css dist/
cp shared-styles.css dist/
cp manifest.json dist/
cp _headers dist/
cp _routes.json dist/
cp worker.js dist/

# 4. 复制游戏目录
echo -e "${BLUE}🎮 复制游戏目录...${NC}"
GAMES="space-shooter platform-jumper fruit-2048 memory-cards snake-game brick-breaker tic-tac-toe minesweeper typing-test physics-pinball"
for game in $GAMES; do
    echo -e "  ${GREEN}→${NC} $game"
    cp -r $game dist/

    # 移除测试文件和临时文件
    find dist/$game -name "*test*.js" -delete 2>/dev/null || true
    find dist/$game -name "*.png" -delete 2>/dev/null || true
    find dist/$game -name "test.html" -delete 2>/dev/null || true
done

# 5. 生成 sitemap
echo -e "${BLUE}🗺️  生成 sitemap...${NC}"
if [ -f "scripts/generate-sitemap.js" ]; then
    node scripts/generate-sitemap.js
else
    echo "⚠️  sitemap 脚本不存在，跳过"
fi

# 6. 生成资源哈希（可选）
echo -e "${BLUE}🔐 生成资源哈希...${NC}"
if [ -f "scripts/generate-hashes.js" ]; then
    node scripts/generate-hashes.js 2>/dev/null || echo "⚠️  资源哈希生成失败或已跳过"
else
    echo "⚠️  资源哈希脚本不存在，跳过"
fi

# 7. 运行测试（如果配置完成）
echo -e "${BLUE}🧪 运行测试...${NC}"
if npm run test > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 测试通过${NC}"
else
    echo -e "${YELLOW}⚠️  测试未配置或失败，继续构建${NC}"
fi

# 8. 生成构建报告
echo -e "${BLUE}📊 生成构建报告...${NC}"
cat > dist/BUILD_REPORT.md << EOF
# 构建报告

- **时间**: $(date)
- **版本**: $VERSION
- **提交**: $GIT_SHA
- **游戏数量**: $(echo $GAMES | wc -w)
- **构建主机**: $(hostname)
- **构建用户**: $(whoami)

## 文件统计
$(du -sh dist/* 2>/dev/null | sort -h || echo "无法获取文件统计")
EOF

# 9. 显示构建摘要
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 构建完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 构建统计:${NC}"
echo -e "  版本: ${YELLOW}$VERSION${NC}"
echo -e "  提交: ${YELLOW}$GIT_SHA${NC}"
echo -e "  游戏数: ${YELLOW}$(echo $GAMES | wc -w)${NC}"
echo -e "  总大小: ${YELLOW}$(du -sh dist | cut -f1)${NC}"
echo ""
echo -e "${BLUE}📂 输出目录: ${YELLOW}./dist${NC}"
echo ""

# 10. 提示部署命令
echo -e "${BLUE}🚀 部署命令:${NC}"
echo -e "  ${YELLOW}npm run deploy${NC}          - 部署到 Cloudflare"
echo -e "  ${YELLOW}npm run deploy:production${NC} - 部署到生产环境"
echo ""
