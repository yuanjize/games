# Cloudflare Pages 部署指南

## 项目说明
纯静态HTML/CSS/JavaScript网站，无需服务器端渲染或后端API。

## 部署步骤

### 方法1: Git 仓库部署 (推荐)
1. 在 Cloudflare Pages 控制台点击"创建项目"
2. 连接到你的 Git 仓库 (GitHub/GitLab等)
3. **重要：构建设置**
   - 构建命令: `npm run build`
   - 构建输出目录: `.` (当前目录，必须是一个点)
4. 点击"保存并部署"

### 方法2: 直接上传
1. 在 Cloudflare Pages 控制台点击"创建项目"
2. 选择"直接上传"
3. 拖拽整个项目文件夹上传
4. 点击"上传到Cloudflare Pages"

### 方法3: Wrangler CLI 部署
```bash
# 直接部署（无需安装）
npx wrangler pages deploy . --project-name=web-games-collection
```

## 项目结构
```
.
├── index.html          # 主页面
├── style.css           # 主样式
├── package.json        # 项目配置
├── _headers            # HTTP 响应头配置
├── _routes.json        # 路由配置
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

## 故障排除

### 构建失败
1. 确认**构建输出目录**设置为 `.` (一个点，不是根路径或空)
2. 确认**构建命令**设置为 `npm run build`
3. 检查构建日志中的具体错误信息

### 部署后页面404
1. 确认所有游戏文件夹内都有 `index.html`
2. 检查 `_routes.json` 配置是否正确

### 游戏无法加载
- 检查浏览器控制台的 JavaScript 错误
- 确认所有静态资源路径正确