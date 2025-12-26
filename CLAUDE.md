# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

网页游戏合集 - 10个纯原生 HTML/CSS/JavaScript 游戏，部署在 Cloudflare Workers/Pages。

- **版本**: 1.0.2
- **技术栈**: 纯原生 JavaScript (无框架)
- **部署**: Cloudflare Workers (使用 Assets 绑定)

## 10个游戏模块

| 目录 | 游戏 | 分类 |
|------|------|------|
| `space-shooter/` | 太空射击 | action |
| `platform-jumper/` | 平台跳跃 | action |
| `fruit-2048/` | 水果2048 | puzzle |
| `memory-cards/` | 记忆翻牌 | puzzle |
| `snake-game/` | 贪吃蛇 | casual |
| `brick-breaker/` | 打砖块 | action |
| `tic-tac-toe/` | 井字棋AI | strategy |
| `minesweeper/` | 扫雷 | strategy |
| `typing-test/` | 打字测试 | casual |
| `physics-pinball/` | 物理弹球 | action |

## 常用命令

```bash
# 构建
npm run build          # 使用 build.sh 构建到 dist/
npm run build:vite     # 使用 Vite 构建

# 开发
npm run dev            # Wrangler 开发服务器
npm run dev:vite       # Vite 开发服务器

# 部署
npm run deploy         # 部署到 Cloudflare
npm run deploy:production

# 测试
npm run test           # 运行 Vitest 测试
npm run test:ui        # 测试 UI 界面
npm run test:coverage  # 测试覆盖率

# 代码检查
npm run lint
npm run lint:fix
```

## 项目架构

### 目录结构
```
/
├── index.html              # 游戏大厅主页（PC/移动双布局）
├── style.css               # 主样式
├── shared-styles.css       # 共享样式组件
├── worker.js               # Cloudflare Workers 入口
├── build.sh                # 构建脚本
├── manifest.json           # PWA 清单
├── _headers                # Cloudflare Headers
├── _routes.json            # Cloudflare 路由配置
├── scripts/
│   ├── generate-sitemap.js
│   └── generate-hashes.js
└── <game-dir>/             # 各游戏独立目录
    ├── index.html
    ├── style.css
    └── game.js
```

### 游戏目录结构

每个游戏都是独立的、自包含的：
- `index.html` - 游戏页面
- `style.css` - 游戏样式
- `game.js` - 游戏逻辑

### index.html 双布局系统

主页支持两种布局，通过 `layout-toggle` 按钮切换：
- **PC 布局** (`#pc-layout`): 三栏布局，左侧边栏+中央内容+右侧预览面板
- **移动布局** (`#mobile-layout`): 传统单列布局

布局模式存储在 `localStorage['gameHub-layout']` (auto/pc/mobile)。

### Cloudflare Workers

`worker.js` 使用 Assets 绑定服务静态文件，处理：
- 目录索引（自动添加 `/index.html`）
- 404 回退到 SPA 路由
- 安全头（CSP、X-Frame-Options 等）

## 测试

- **框架**: Vitest + jsdom
- **配置**: `vitest.config.js`
- **测试文件**: `*.test.js` 或 `tests/**/*.test.js`

## .gitignore 规则

构建过程中会忽略：
- `*test*.js`, `*test*.html`, `test*.js`, `test*.html`, `TEST-*.md`
- `*.png`, `*.jpg`, `*.jpeg`
- `http-server.js`, `package-lock.json`

这些文件会被 `build.sh` 删除，不会进入 `dist/`。
