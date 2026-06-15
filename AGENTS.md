# AGENTS.md — Skill Manager 导航地图

> AI 代理从这里开始。本文件是**导航地图**，而非手册。详情请跟随链接。

## 1. 快速开始

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器（监视模式）
npm test             # 运行 Jest 测试
npm run lint-arch    # 检查层级架构（待创建）
```

服务器默认运行在 `http://localhost:3456`。

## 2. 架构概览

**三层架构**（入口 → 应用 → 核心）：

```
server.js (入口) → app.js (API层) → lib/skillLogic.js (核心逻辑)
```

| 层级 | 文件 | 职责 | 依赖 |
|------|------|------|------|
| 2 (入口) | `server.js` | 启动 Express 服务器 | app.js |
| 1 (应用) | `app.js` | API 路由、配置、持久化 | skillLogic.js, express, fs |
| 0 (核心) | `lib/skillLogic.js` | 纯逻辑函数 | 仅 path |

**约束**：层级 0 不得有任何内部依赖，仅导入 `path`（Node 内置模块）。

详见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) 的依赖图和详细图表。

## 3. 核心文件

| 文件 | 行数 | 描述 |
|------|------|------|
| `server.js` | 10 | 入口点 |
| `app.js` | 705 | 所有 API 路由 |
| `lib/skillLogic.js` | 111 | 核心函数（纯函数） |
| `tools.json` | — | 运行时配置 |

## 4. 核心逻辑（lib/skillLogic.js）

- **`isAllowed`** — 三级规则优先级检查（tool > group > skill）
- **`getSkillGroup`** — 确定 skill 的组名
- **`findSkillDirs`** — 遍历 skillsDirs，查找 SKILL.md 目录

纯函数，无 I/O。所有文件系统操作在 `app.js`。

## 5. API 端点（app.js）

| 方法 | 路径 | 职责 |
|------|------|------|
| GET | `/api/skills` | 列出所有 skills |
| POST | `/api/skills/:name/link` | 链接 skill |
| DELETE | `/api/skills/:name/link` | 断开链接 |
| PUT | `/api/skills/:name/rule` | 设置规则 |
| POST | `/api/sync` | 批量同步 |
| POST | `/api/clean` | 清理失效链接 |
| DELETE | `/api/skills/:name` | 删除 skill |

完整端点见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

## 6. 配置（tools.json）

**环境变量覆盖**：
- `PORT` — 服务器端口（默认: 3456）
- `SKILLS_DIR` — 逗号分隔的 skill 目录
- `EXCLUDE_PROJECTS` — 扫描时跳过的项目

配置自动监视变更（300ms 防抖）。

## 7. 测试（Jest，80% 覆盖率阈值）

```bash
npm test              # 运行测试
npm run test:coverage # 覆盖率报告
```

关键测试：`isAllowed.test.js`、`findSkillDirs.test.js`、`api.sync.test.js`

Mock：`scripts/create-mock.js` 模拟文件系统。

## 8. 层级规则

- Layer 0 (`skillLogic.js`) → 仅导入 `path`
- Layer 1 (`app.js`) → 可导入核心 + express/fs
- Layer 2 (`server.js`) → 仅导入 app.js

**循环依赖 = P0 缺陷**。运行 `npm run lint-arch` 验证。

## 9. 开发流程

1. **添加功能** → 先写测试，再实现
2. **核心逻辑** → 放 `lib/`，保持纯函数
3. **API 端点** → 放 `app.js`
4. **配置** → 编辑 `tools.json`，自动重载

详见 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)。

## 10. 项目结构

```
skill-manager/
├── server.js          # 入口点
├── app.js             # Express 应用 + API 路由
├── lib/
│   └── skillLogic.js  # 核心逻辑（纯函数）
├── __tests__/         # Jest 测试
├── scripts/
│   └── create-mock.js # 测试模拟辅助
├── public/            # 前端 UI
├── docs/              # 架构文档
├── tools.json         # 运行时配置
└── package.json       # 依赖
```