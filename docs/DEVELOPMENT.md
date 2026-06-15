# DEVELOPMENT.md — Skill Manager 开发指南

> 本文档描述开发流程、命令、调试技巧。

## 1. 开发环境设置

```bash
# 安装依赖
npm install

# 启动开发服务器（自动重载）
npm run dev

# 启动生产服务器
npm start
```

服务器默认端口：`3456`（可通过 `PORT` 环境变量覆盖）。

## 2. 常用命令

| 命令 | 职责 |
|------|------|
| `npm run dev` | 启动开发服务器（--watch 模式） |
| `npm start` | 启动生产服务器 |
| `npm test` | 运行所有测试 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |
| `npm run lint-arch` | 检查层级架构规则（待创建） |

## 3. 项目结构

```
skill-manager/
├── server.js          # 入口点（10行）
├── app.js             # Express 应用（705行）
├── lib/
│   └── skillLogic.js  # 核心逻辑（111行）
├── __tests__/         # Jest 测试
│   ├── isAllowed.test.js
│   ├── getSkillGroup.test.js
│   ├── findSkillDirs.test.js
│   ├── api.sync.test.js
│   ├── api.clean.test.js
│   ├── api.delete.test.js
│   └── api.manual-unlink.test.js
├── scripts/
│   └── create-mock.js  # 测试模拟辅助
├── public/
│   └── index.html      # 前端 UI
├── docs/
│   ├── ARCHITECTURE.md # 架构文档
│   └── DEVELOPMENT.md  # 本文档
├── tools.json         # 运行时配置
├── tools.example.json # 配置模板
└── package.json       # 项目元数据
```

## 4. 开发流程

### 4.1 添加新功能

遵循三层架构原则：

1. **核心逻辑** → 在 `lib/skillLogic.js` 添加纯函数
2. **API 端点** → 在 `app.js` 添加路由
3. **测试** → 在 `__tests__/` 添加测试

示例流程：

```bash
# 1. 先写测试
vim __tests__/newFeature.test.js

# 2. 实现核心逻辑（如果是纯逻辑）
vim lib/skillLogic.js

# 3. 实现 API 端点（如果有）
vim app.js

# 4. 运行测试验证
npm test
```

### 4.2 修改现有功能

1. 找到相关文件（通过 AGENTS.md 导航）
2. 阅读对应测试理解预期行为
3. 修改代码
4. 运行测试验证

```bash
# 查找某个函数的位置
grep -n "isAllowed" lib/skillLogic.js

# 运行特定测试
npm test -- isAllowed.test.js
```

### 4.3 添加新 API 端点

在 `app.js` 中添加：

```javascript
app.get('/api/new-endpoint', (req, res) => {
  try {
    // 1. 获取参数
    const { param } = req.query
    
    // 2. 调用核心逻辑
    const result = someLogicFunction(param, context)
    
    // 3. 返回结果
    res.json({ ok: true, result })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

## 5. 测试指南

### 5.1 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- isAllowed.test.js

# 运行带覆盖率
npm run test:coverage
```

### 5.2 测试覆盖率要求

项目要求 80% 覆盖率阈值（定义于 `package.json`）：

```json
"coverageThreshold": {
  "global": {
    "branches": 80,
    "functions": 80,
    "lines": 80,
    "statements": 80
  }
}
```

### 5.3 测试模拟

测试使用 `jest-mock-extended` 模拟文件系统。

`scripts/create-mock.js` 示例：

```javascript
const mockFs = {
  readdirSync: jest.fn(),
  lstatSync: jest.fn(),
  readFileSync: jest.fn(),
  // ...
}

// 注入到 app.js
jest.mock('fs', () => mockFs)
```

### 5.4 API 测试模式

使用 `supertest` 测试 API：

```javascript
const request = require('supertest')
const app = require('./app')

test('GET /api/skills', async () => {
  const res = await request(app).get('/api/skills')
  expect(res.status).toBe(200)
  expect(res.body.skills).toBeInstanceOf(Array)
})
```

## 6. 配置管理

### 6.1 配置文件位置

- 生产：`tools.json`
- 测试：通过 `_TEST_CONFIG_PATH` 环境变量指定

### 6.2 配置结构

```json
{
  "skillsDir": "~/github",
  "tools": {
    "claude": "~/.claude/skills",
    "cursor": "~/.cursor/skills",
    "codex": "~/.codex/skills"
  },
  "excludeProjects": ["node_modules", ".git"],
  "rules": {},
  "groupRules": {},
  "toolRules": {},
  "deletedSkills": [],
  "manualUnlinks": {}
}
```

### 6.3 环境变量覆盖

| 环境变量 | 示例 |
|---------|------|
| `PORT` | `PORT=8080 npm start` |
| `SKILLS_DIR` | `SKILLS_DIR=~/.skills,~/projects npm start` |
| `CLAUDE_SKILLS` | `CLAUDE_SKILLS=~/.claude/custom npm start` |
| `EXCLUDE_PROJECTS` | `EXCLUDE_PROJECTS=test,tmp npm start` |

## 7. 调试技巧

### 7.1 查看服务器日志

```bash
npm run dev
# 服务器输出在终端
```

### 7.2 测试特定场景

```bash
# 仅运行匹配的测试
npm test -- -t "isAllowed"

# 详细输出
npm test -- --verbose
```

### 7.3 检查配置状态

```bash
# 直接读取配置
cat tools.json

# 通过 API 查看
curl http://localhost:3456/api/skills
```

## 8. 常见问题

### Q: 配置修改后服务器没有更新？

A: 检查配置文件是否是有效的 JSON。服务器会输出 "Config reload failed" 错误。

### Q: 测试覆盖率不够 80%？

A: 运行 `npm run test:coverage` 查看 `coverage/` 目录的详细报告。

### Q: 符号链接创建失败？

A: 确保目标目录存在且有写入权限。工具目录会自动创建，但父目录需要存在。

## 9. Git Hooks

项目使用 Husky 管理 git hooks：

- `.husky/pre-commit` — 提交前运行测试

```bash
# 手动运行 hooks
npm run prepare
```

## 10. 部署

### 10.1 PM2 部署

项目包含 PM2 配置：

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start ecosystem.config.cjs

# 查看状态
pm2 status

# 查看日志
pm2 logs skill-manager
```

### 10.2 环境要求

- Node.js 18+
- 配置文件 `tools.json` 存在
- skillsDirs 路径可访问