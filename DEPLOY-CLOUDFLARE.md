# Cloudflare Pages 部署指南

## 问题分析
你的项目是纯静态HTML/CSS/JavaScript网站，但Cloudflare Pages默认会尝试构建Node.js项目，导致失败。

## 解决方案
已创建以下配置文件：

1. **package.json** - 告诉Cloudflare这是一个静态项目
2. **_wrangler.json** - 指定构建输出目录为当前目录(.)
3. **构建命令**: `npm run build` (仅输出提示信息)

## 部署步骤

### 方法1: Git 仓库部署 (推荐)
1. 在 Cloudflare Pages 中点击"创建项目"
2. 连接到你的 Git 仓库 (GitHub/GitLab等)
3. 构建设置：
   - 构建命令: `npm run build`
   - 构建输出目录: `.` (当前目录)
4. 点击"保存并部署"

### 方法2: 直接上传
1. 在 Cloudflare Pages 中点击"创建项目"
2. 选择"直接上传"
3. 上传整个项目文件夹 (包含所有游戏子文件夹)
4. 点击"上传到Cloudflare Pages"

### 方法3: Wrangler CLI 部署
```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录
wrangler login

# 部署到 Cloudflare Pages
wrangler pages deploy . --project-name=web-games-collection
```

## 项目结构
```
.
├── index.html          # 主页面
├── style.css           # 主样式
├── package.json        # 项目配置
├── _wrangler.json      # Cloudflare Pages 配置
├── DEPLOY-CLOUDFLARE.md # 本文件
├── test-build.sh       # 测试脚本
└── 10个游戏文件夹:
    ├── space-shooter/
    ├── platform-jumper/
    ├── fruit-2048/
    ├── memory-cards/
    ├── snake-game/
    ├── brick-breaker/
    ├── tic-tac-toe/
    ├── minesweeper/
    ├── typing-test/
    └── physics-pinball/
```

## 验证部署
部署后访问：`https://web-games-collection.pages.dev` (或其他自定义域名)

## 故障排除
如果仍有问题：
1. 检查 Cloudflare Pages 构建日志
2. 确保所有游戏文件夹的`index.html`文件存在
3. 尝试将`_wrangler.json`重命名为`wrangler.toml`并修改内容：
```toml
pages_build_output_dir = "."
compatibility_date = "2025-12-22"
```

## 提示
- 项目无需服务器端渲染或后端API
- 所有游戏都使用纯前端技术
- 适合静态托管在任何CDN上