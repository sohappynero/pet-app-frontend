---
name: fix-vite-import-and-syntax-errors
overview: 修复 Vite 构建错误：4个页面缺失 CSS 文件引用、ExerciseAnalysis.tsx JSX 语法错误、CSS 语法错误
todos:
  - id: verify-css-imports
    content: 全面检查 4 个分析页面 tsx 文件的 CSS import 路径，确保均为 ../ 前缀
    status: completed
  - id: fix-jsx-chars
    content: 搜索并修复 ExerciseAnalysis.tsx 中所有未转义的 </> 字符
    status: completed
  - id: check-css-syntax
    content: 扫描 4 个 CSS 文件排除 PostCSS 无法解析的非法语法（类名混用等）
    status: completed
  - id: clear-cache-and-verify
    content: 清理 Vite 缓存目录并验证构建通过
    status: completed
    dependencies:
      - verify-css-imports
      - fix-jsx-chars
      - check-css-syntax
---

## 产品概述

修复 Vite 开发服务器中的多个构建错误，确保项目能够正常编译和运行。

## 核心问题（共 5 个错误）

### 问题 1：CSS 文件导入路径错误（4 处）

4个分析页面组件位于 `src/pages/` 目录下，但 CSS 文件位于 `src/` 根目录。需要确认导入路径使用 `../` 前缀：

- `WeightTrendAnalysis.tsx` → 导入 `./weight-trend-analysis.css`（应为 `../weight-trend-analysis.css`）
- `HealthReportAnalysis.tsx` → 导入 `./health-report-analysis.css`（应为 `../health-report-analysis.css`）
- `DietAnalysis.tsx` → 导入 `./diet-analysis.css`（应为 `../diet-analysis.css`）
- `ExerciseAnalysis.tsx` → 导入 `./exercise-analysis.css`（应为 `../exercise-analysis.css`）

### 问题 2：JSX 非法字符（1 处）

- `ExerciseAnalysis.tsx:445` 行：文本内容包含未转义的 `>` 字符（`>28°C`），JSX 解析器将其误判为标签结束符

### 问题 3：CSS 语法错误（1 处）

- `weight-trend-analysis.css:286` 行：`text-center;` 是 Tailwind 类名语法而非有效 CSS 属性，PostCSS 编译报错

## 当前状态确认

经代码探索验证，源文件中 **大部分问题已部分修正**：

- CSS 导入路径已改为 `../` 前缀
- JSX 中 `>28°C` 已改为 `超过28°C`
- CSS 中 `text-center;` 已改为 `text-align: center`

但错误日志仍在重复出现，说明 **Vite 缓存未刷新或存在其他残留问题**。

## 技术栈

- 构建工具：Vite + @vitejs/plugin-react
- 框架：React 18 + TypeScript
- 样式：原生 CSS（非 Tailwind utility class 写法）

## 实现方案

### 策略：逐项验证修复 + 缓存清理

### 具体修复内容

#### 1. CSS 导入路径验证与修正

- 确认所有 4 个页面的 CSS import 路径为 `../xxx.css`
- 涉及文件：`WeightTrendAnalysis.tsx`, `ExerciseAnalysis.tsx`, `DietAnalysis.tsx`, `HealthReportAnalysis.tsx`
- 路径逻辑：`src/pages/XxxAnalysis.tsx` → `import "../xxx-analysis.css"` → `src/xxx-analysis.css`

#### 2. ExerciseAnalysis.tsx JSX 字符转义

- 搜索所有可能包含 `<` 或 `>` 的文本内容
- 将比较运算符包裹在 JS 表达式中 `{">28"}` 或替换为中文表述如 `超过28`

#### 3. CSS 语法兼容性检查

- 扫描 4 个 CSS 文件中是否有 Tailwind 类名误用为 CSS 属性的情况
- 确保 PostCSS 能正确解析（无未知关键字）

#### 4. 清理 Vite 缓存并验证构建

- 删除 `node_modules/.vite` 缓存目录
- 重启开发服务器或执行 `vite build` 验证零错误

## 关键注意事项

- 项目使用原生 CSS（非 Tailwind），因此 `text-center` 这种类名写法在 CSS 文件中是非法的
- 所有 CSS 文件位于 `src/` 根目录而非页面同级目录，这是路径错误的根本原因
- JSX 中的 `<` 和 `>` 必须转义为 `&lt;`/`&gt;` 或使用 `{"<"}` / `{">"}` 表达式形式