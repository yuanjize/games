# Cloudflare Workers 部署指南

## 项目说明
纯静态HTML/CSS/JavaScript网站，通过 Cloudflare Workers + Assets 部署。

## 前置要求
1. Cloudflare 账号
2. 已安装 Node.js

## 首次部署

### 1. 登录 Cloudflare
```bash
npx wrangler login
```

### 2. 部署 Worker
```bash
npm run deploy
```

### 3. 配置自定义域名（可选）

在 Cloudflare 控制台：
1. 进入 **Workers & Pages**
2. 找到 `web-games-collection` Worker
3. 点击 **Settings** → **Triggers**
4. 添加 **Custom Domains** 或使用默认的 `*.workers.dev` 域名

## 部署命令

```bash
# 本地开发（测试 Worker）
npm run dev

# 部署到生产环境
npm run deploy

# 查看实时日志
npm run tail
```

## 项目结构
```
.
├── worker.js           # Worker 入口文件（服务静态文件）
├── wrangler.toml       # Cloudflare Workers 配置
├── package.json        # 项目配置和脚本
├── index.html          # 主页面
├── style.css           # 主样式
├── _headers            # HTTP 响应头配置（参考）
├── _routes.json        # 路由配置（参考）
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

## 环境变量

在 `wrangler.toml` 中配置环境变量：

```toml
[vars]
ENVIRONMENT = "production"
```

对于敏感信息，使用 secret：
```bash
npx wrangler secret put <SECRET_NAME>
```

## 故障排除

### 部署失败
```bash
# 查看详细日志
npx wrangler deploy --verbose
```

### 文件404
- 检查 `worker.js` 中的路径处理逻辑
- 确认所有游戏文件夹都有 `index.html`

### Worker 日志
```bash
npm run tail
```

## 升级说明

从 Cloudflare Pages 迁移到 Workers：
- 已创建 `worker.js` 处理静态文件服务
- 已创建 `wrangler.toml` 配置文件
- 运行 `npm run deploy` 即可部署
