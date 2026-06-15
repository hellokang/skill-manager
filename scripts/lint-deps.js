#!/usr/bin/env node
/**
 * lint-deps.js — 层级架构检查器
 *
 * 验证导入依赖是否遵守三层架构规则：
 * - Layer 0 (核心): 仅允许导入 path
 * - Layer 1 (应用): 可导入核心、express、fs、child_process
 * - Layer 2 (入口): 可导入应用
 *
 * 禁止：
 * - Layer 0 导入任何内部模块或外部依赖（除 path）
 * - Layer 1 导入 Layer 2
 * - 任何循环依赖
 */

const fs = require('fs')
const path = require('path')

// 层级定义
const LAYERS = {
  'lib/skillLogic.js': 0,  // 核心
  'app.js': 1,             // 应用
  'server.js': 2           // 入口
}

// 每层允许的导入
const ALLOWED_IMPORTS = {
  0: ['path'],  // Layer 0 仅允许 path
  1: ['path', 'fs', 'express', 'child_process', './lib/skillLogic.js'],  // Layer 1
  2: ['path', 'fs', './app.js']  // Layer 2
}

// 从文件提取导入
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const imports = []

  // 匹配 require('xxx') 和 require("./xxx")
  const requirePattern = /require\(['"]([^'"]+)['"]\)/g
  let match
  while ((match = requirePattern.exec(content)) !== null) {
    imports.push(match[1])
  }

  return imports
}

// 检查单个文件
function checkFile(filePath) {
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/')
  const layer = LAYERS[relativePath]

  if (layer === undefined) {
    return { ok: true, message: `文件 ${relativePath} 不在层级定义中，跳过检查` }
  }

  const imports = extractImports(filePath)
  const allowed = ALLOWED_IMPORTS[layer]
  const violations = []

  for (const imp of imports) {
    // 内部导入检查
    if (imp.startsWith('./') || imp.startsWith('../')) {
      // 解析内部导入的目标文件
      const targetPath = path.resolve(path.dirname(filePath), imp)
      const targetRelative = path.relative(process.cwd(), targetPath).replace(/\\/g, '/')
      const targetLayer = LAYERS[targetRelative]

      if (targetLayer !== undefined && targetLayer < layer) {
        // 允许导入更低层级的文件（依赖向下）
        continue
      }

      if (targetLayer !== undefined && targetLayer >= layer) {
        violations.push({
          file: relativePath,
          line: findImportLine(content, imp),
          import: imp,
          reason: `Layer ${layer} 文件导入 Layer ${targetLayer} 文件（层级 ${layer} → ${targetLayer}）。依赖必须向下，不能向上或同级。`,
          fix: [
            '1. 将需要的功能移到更低层级',
            '2. 使用依赖注入传递功能',
            '3. 重新设计模块边界'
          ]
        })
      }
    } else {
      // 外部导入检查
      if (!allowed.some(a => imp === a || imp.startsWith(a + '/'))) {
        violations.push({
          file: relativePath,
          line: findImportLine(content, imp),
          import: imp,
          reason: `Layer ${layer} 文件导入外部模块 "${imp}"，但 Layer ${layer} 仅允许: ${allowed.join(', ')}`,
          fix: layer === 0
            ? [
              'Layer 0 (核心) 必须是纯逻辑函数',
              '不允许任何 I/O 或框架依赖',
              '如需 fs/express，将逻辑移到 Layer 1'
            ]
            : [
              `将 "${imp}" 导入移到更高层级`,
              '通过参数传递依赖'
            ]
        })
      }
    }
  }

  return violations.length === 0
    ? { ok: true, message: `${relativePath}: ✓ Layer ${layer}` }
    : { ok: false, violations }
}

// 查找导入所在行号
function findImportLine(content, importPath) {
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`require('${importPath}')`) || lines[i].includes(`require("${importPath}")`)) {
      return i + 1
    }
  }
  return 0
}

// 主检查流程
function main() {
  const errors = []
  const passes = []

  for (const [filePath] of Object.entries(LAYERS)) {
    const result = checkFile(path.resolve(process.cwd(), filePath))
    if (result.ok) {
      passes.push(result.message)
    } else {
      errors.push(...result.violations)
    }
  }

  // 输出结果
  for (const msg of passes) {
    console.log(msg)
  }

  if (errors.length > 0) {
    console.log('\n❌ 发现架构违规:')
    for (const v of errors) {
      console.log(`\n${v.file}:${v.line} 导入 "${v.import}"`)
      console.log(`  问题: ${v.reason}`)
      console.log(`  修复:`)
      for (const fix of v.fix) {
        console.log(`    ${fix}`)
      }
    }
    process.exit(1)
  }

  console.log('\n✓ 架构检查通过')
}

main()