---
name: add-pet-glassmorphism-redesign
overview: 将 Dashboard.tsx 添加宠物页面全部改为毛玻璃（Glass Morphism）高级风格，与 HomePetOS 首页统一视觉体系。涉及 petos.css 表单系统 CSS 重写 + Dashboard.tsx 组件结构调整。
design:
  architecture:
    framework: react
  styleKeywords:
    - Glassmorphism
    - Frosted Glass
    - Premium
    - Backdrop Filter
    - Noise Texture
    - Translucent
    - Warm Amber Accent
    - Micro-interaction
  fontSystem:
    fontFamily: SF Pro Text, PingFang SC, -apple-system, sans-serif
    heading:
      size: 18px
      weight: 600
    subheading:
      size: 15px
      weight: 500
    body:
      size: 15px
      weight: 400
  colorSystem:
    primary:
      - "#FFB84D"
      - "#FFD9A0"
      - "#FFE6C8"
    background:
      - rgba(255,255,255,0.42)
      - rgba(255,249,242,0.28)
      - rgba(255,255,255,0.18)
    text:
      - "#2A2A2A"
      - "#6B6B6B"
      - "#9C9C9C"
    functional:
      - "#7ED957"
      - "#FF8A65"
      - "#7BC7FF"
todos:
  - id: css-form-glass
    content: 使用 [skill:impeccable] 设计审查并重写 petos.css 全部 .petos-form-* 样式为毛玻璃效果
    status: completed
  - id: component-cleanup
    content: 清理 Dashboard.tsx 中 Step4 内联 background style 为 CSS 类
    status: completed
    dependencies:
      - css-form-glass
  - id: verify-lint
    content: 验证 lint 通过并检查视觉效果一致性
    status: completed
    dependencies:
      - css-form-glass
      - component-cleanup
---

## Product Overview

将添加宠物页面（Dashboard.tsx）的全部 UI 元素从实底背景升级为毛玻璃（Glass Morphism）效果，与主页 HomePetOS 的高级毛玻璃风格统一。

## Core Features

- **表单卡片** `.petos-form-card` — 从实底白底变为毛玻璃半透明面板
- **输入框/文本域/日期框** — 毛玻璃内嵌效果
- **选项按钮组**（Tag/Toggle/Gender/Size）— 毛玻璃选项样式
- **底部操作栏** `.petos-form-footer` — 毛玻璃固定底栏
- **顶栏返回按钮** — 毛玻璃圆形按钮
- **进度条** — 增强视觉层次
- **预览卡片区域** — 高级毛玻璃预览
- **错误提示/提示信息** — 毛玻璃提示块
- **保持全部功能不变**：4步表单、验证逻辑、API提交、头像上传

## Tech Stack

- **React + TypeScript** — 组件层（Dashboard.tsx），仅微调内联 style 和 className
- **CSS 毛玻璃系统** — `backdrop-filter: blur() saturate()` + 半透明背景 + 细边框
- **已有 Design Tokens** (`tokens.css`) — 复用 `--glass-blur: 40px`, `--glass-saturate: 200%`, `--glass-bg`, `--glass-border` 等变量

## Implementation Approach

### 核心策略：纯 CSS 升级 + 最小化组件改动

项目已在 `petos.css` 中定义了完整的毛玻璃 token 系统（`tokens.css:63-76`）和基础类 `.petos-glass`（`petos.css:43-70`），参数为：

- blur: 40px, saturate: 200%
- bg: `rgba(255,255,255,0.42)` 渐变
- border: `rgba(255,255,255,0.55)`
- 内阴影高光 + 噪点纹理叠加

**方案**：重写 `petos.css` 第486-926行的全部 `.petos-form-*` 类，将实底 `background: var(--color-card/bg)` 替换为毛玻璃参数。Dashboard.tsx 仅需清理 Step4 中一处内联 `style={{ background: "var(...)" }}` 改为 CSS 类。

### 改动映射表（共约30个选择器）

| 选择器 | 当前 | 目标 |
| --- | --- | --- |
| `.petos-form-card` | `bg: var(--color-card)`, 实底边框 | 毛玻璃面板（复用 .petos-glass 参数） |
| `.petos-form-input` | `bg: var(--color-bg)`, 实色边框 | 半透明内嵌输入框 + 毛玻璃聚焦态 |
| `.petos-form-textarea` | 同上 | 同上 |
| `.petos-form-date-input` | 同上 | 同上 |
| `.petos-form-topbar__back` | `bg: var(--color-card)` | 圆形毛玻璃按钮 |
| `.petos-form-footer` | `bg: var(--color-bg)`, 实色顶边框 | 毛玻璃磨砂底栏 + 上边缘模糊渐变 |
| `.petos-form-btn-prev` | `bg: var(--color-card)` | 毛玻璃次要按钮 |
| `.petos-form-tag` / `.petos-form-toggle` | `bg: var(--color-bg)` | 毛玻璃选项 + 选中态发光 |
| `.petos-form-tag--on` / `.petos-form-toggle--on` | `bg: var(--color-primary-soft)` | 选中态增强透明度 + 边框发光 |
| `.petos-form-gender-btn` / `.petos-form-size-btn` | 同上 | 毛玻璃卡片选项 |
| `.petos-form-preview-grid > div` | `bg: var(--color-bg)` | 毛玻璃数据格 |
| `.petos-form-error` | 半透明红底 | 毛玻璃红色警告 |
| `.petos-form-tip` | `bg: var(--color-primary-soft)` | 毛玻璃提示 |
| `.petos-form-avatar-info` | 同上 | 毛玻璃头像信息条 |
| `.petos-form-preview-avatar` | 渐变实底 | 毛玻璃头像容器 |


### 关键文件

```
src/styles/petos.css        # [MODIFY] 重写 486-926 行的 .petos-form-* 全部样式
src/pages/Dashboard.tsx     # [MODIFY] 清理 Step4 一处内联 background style
```

## Architecture Design

```
petos-page (已有 ::before 彩色光斑)
  └── petos-content
       ├── petos-form-topbar (毛玻璃返回按钮)
       ├── petos-form-step-header (文字无变化)
       ├── petos-form-progress (增强进度条)
       ├── petos-form-error (毛玻璃警告)
       ├── petos-form-card × N (★ 毛玻璃核心卡片)
       │    ├── petos-form-label
       │    ├── petos-form-input / textarea / date-input (毛玻璃内嵌)
       │    ├── petos-form-tag / toggle (毛玻璃选项)
       │    └── petos-form-preview-* (毛玻璃预览区)
       └── petos-form-tip (毛玻璃提示)
  └── petos-form-footer (★ 毛玻璃固定底栏)
       ├── petos-form-btn-prev (毛玻璃次要按钮)
       └── petos-form-btn-next (主CTA保持不变)
```

## Design Style: Premium Glassmorphism Pet Onboarding

采用高级 Glassmorphism（毛玻璃形态学）设计风格，与主页 HomePetOS 的 PetOS 视觉系统完全统一。

### 设计理念

整个添加宠物流程呈现为"浮在彩色光斑之上的半透明水晶卡片"，用户感觉在操作一层精致磨砂玻璃界面，而非传统实底表单。

### 页面规划（4个步骤统一设计语言）

#### Block 1: 顶部导航栏

毛玻璃返回按钮（圆形半透明），标题居中。返回按钮 hover 时有微妙的光晕扩散效果。

#### Block 2: 步骤指示器 + 进度条

emoji 图标 + 步骤标题 + 副标题。进度条从普通灰底改为毛玻璃轨道 + 渐变金色填充，带柔和发光。

#### Block 3: 表单卡片区域（核心）

每个 `.petos-form-card` 是独立的毛玻璃面板：

- 背景：42%白色不透明度 + 40px模糊 + 200%饱和度
- 边框：55%白色半透明细线
- 内阴影：顶部白色高光模拟玻璃厚度
- 噪点纹理：SVG噪点 overlay 模拟磨砂质感
- 圆角：20px（保持现有）
- 卡片间距：12px gap

**内部元素**：

- 输入框：更透明的毛玻璃内嵌（28%不透明度），聚焦时边框变金色发光
- Tag/Toggle 选项按钮：毛玻璃底 + 选中时金色边框发光 + 微弱背景提亮
- Gender/Size 大按钮：毛玻璃卡片式选项，选中态有明显区分

#### Block 4: 底部固定操作栏

毛玻璃磨砂底栏，从底部向上模糊渐变融合，与页面内容自然过渡。主 CTA 按钮保持金色渐变不变（提供足够对比度）。

#### Block 5: 预览确认页（Step 4）

大型毛玻璃卡片作为"宠物身份证"预览，头像区域圆形毛玻璃容器，数据网格每个格子都是独立的小毛玻璃片。

## Agent Extensions

### Skill

- **impeccable**
- Purpose: 对添加宠物页面进行全面的 UI 升级审查，确保毛玻璃改造后的视觉效果达到高端品质标准
- Expected output: 审查 CSS 毛玻璃参数的一致性、层次感、可访问性对比度、交互反馈质量

### SubAgent

- **frontend-developer**
- Purpose: 执行 petos.css 中 440+ 行表单样式的毛玻璃重写，以及 Dashboard.tsx 的最小化组件调整
- Expected output: 所有 .petos-form-* 选择器完成毛玻璃化改造，lint 通过，功能完全保留