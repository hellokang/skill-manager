# Makefile — Skill Manager 构建命令

.PHONY: lint-arch test build dev start clean

# 架构检查
lint-arch:
	@echo "检查层级架构依赖规则..."
	node scripts/lint-deps.js

# 运行测试
test:
	npm test

# 运行测试（带覆盖率）
test-coverage:
	npm run test:coverage

# 开发模式（自动重载）
dev:
	npm run dev

# 生产模式启动
start:
	npm start

# 安装依赖
install:
	npm install

# 清理覆盖率报告
clean:
	rm -rf coverage/

# 完整 CI 流程
ci: install lint-arch test
	@echo "✓ CI 流程完成"

# 默认：显示帮助
help:
	@echo "可用命令:"
	@echo "  make lint-arch    — 检查层级架构"
	@echo "  make test         — 运行测试"
	@echo "  make test-coverage — 运行测试（带覆盖率）"
	@echo "  make dev          — 启动开发服务器"
	@echo "  make start        — 启动生产服务器"
	@echo "  make install      — 安装依赖"
	@echo "  make clean        — 清理覆盖率报告"
	@echo "  make ci           — 运行完整 CI 流程"