# Skill Hub

发现、监控和安装 Claude Code Skill 的 Web 应用。Figma 风格 UI，GitHub 集成，实时更新通知。

## Features

- **浏览发现** — 搜索、筛选 GitHub 上的 Skill 仓库，按 Star/更新/名称排序
- **实时监控** — Watch 感兴趣的 Skill，新提交/新版本时收到通知
- **GitHub 扫描** — 自动发现 GitHub 上包含 `SKILL.md` 的高星仓库
- **Webhook 集成** — 配置 GitHub Webhook 后实时接收推送事件
- **本地 Skill 导入** — 自动导入 `~/.claude/skills/` 下的本地 Skill
- **一键安装** — 复制 `npx skills install` 命令直接使用
- **Figma 风格 UI** — 简洁现代的设计，响应式布局

## Quick Start

```bash
# 安装依赖
npm install

# 启动开发环境（前后端同时启动）
npm run dev
```

- 前端: http://localhost:5173
- 后端: http://localhost:3001
- Webhook: http://localhost:3001/api/webhook

## 配置

1. 打开 Settings 页面
2. 填入 GitHub Personal Access Token（用于 GitHub API 搜索）
3. （可选）配置 Webhook Secret 用于接收实时更新

## 项目结构

```
skill-hub/
├── server/                    # Express 后端
│   ├── index.js               # 入口 + 定时任务
│   ├── db.js                  # SQLite 数据库
│   ├── routes/
│   │   ├── skills.js          # Skill CRUD + 搜索
│   │   ├── watched.js         # 监控管理
│   │   ├── trending.js        # 趋势 + 统计
│   │   ├── webhook.js         # GitHub Webhook
│   │   └── settings.js        # 配置
│   └── services/
│       ├── github.js          # Octokit 封装
│       ├── scanner.js         # GitHub 扫描
│       ├── monitor.js         # 更新监控
│       └── local-discovery.js # 本地 Skill 发现
├── client/                    # React + Vite 前端
│   └── src/
│       ├── pages/             # 6 个页面
│       └── components/        # 11 个组件
└── package.json
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/skills | 技能列表 (?q=&category=&sort=&page=) |
| GET | /api/skills/:id | 技能详情 |
| POST | /api/skills/scan | 扫描 GitHub |
| POST | /api/skills/discover-local | 发现本地技能 |
| GET | /api/trending | 趋势榜 (?period=weekly\|monthly\|all) |
| GET | /api/trending/stats | 仪表盘统计 |
| GET/POST | /api/watched | 管理监控 |
| POST | /api/webhook | GitHub Webhook |
| GET/PUT | /api/settings | 配置管理 |

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Router
- **Backend**: Express + better-sqlite3 + @octokit/rest + node-cron
- **Design**: Figma-inspired (Inter font, pink-purple gradient, clean cards)
