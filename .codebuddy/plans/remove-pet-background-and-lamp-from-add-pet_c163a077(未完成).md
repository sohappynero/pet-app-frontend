---
name: remove-pet-background-and-lamp-from-add-pet
overview: 移除添加宠物页面(Dashboard.tsx)的背景猫照片和右上角灯组件，改为简洁的毛玻璃渐变背景风格
design:
  architecture:
    framework: react
  styleKeywords:
    - Glassmorphism
    - Minimalist
    - Warm Gradient
    - Pure CSS Background
    - No Images
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 20px
      weight: 700
    subheading:
      size: 16px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#FFB84D"
      - "#FF9A3D"
    background:
      - "#1A1412"
      - "#2A1F1A"
      - "#F5F0EB"
    text:
      - "#5D4037"
      - "#FFFFFF"
    functional:
      - "#FF8FB9"
      - "#B388FF"
todos:
  - id: check-bg-source
    content: 检查 index.css 和 tokens.css 中 --color-bg 变量及 onboarding-mode 相关背景规则，定位猫背景图的真正来源
    status: completed
  - id: remove-bg-image
    content: 移除发现的背景图片相关 CSS 规则（background-image / 背景图变量等）
    status: cancelled
    dependencies:
      - check-bg-source
  - id: enhance-pure-bg
    content: 使用 [skill:impeccable] 设计并实现纯 CSS 渐变氛围背景替代猫照片，保持温暖高级感
    status: cancelled
    dependencies:
      - remove-bg-image
  - id: verify-4-steps
    content: 验证4个步骤页面在无背景图状态下的渲染效果和 lint 检查
    status: cancelled
    dependencies:
      - enhance-pure-bg
---

## 产品概述

修改添加宠物页面（Dashboard.tsx），移除背景中的猫照片和右上角的吊灯，保留毛玻璃表单卡片的视觉效果。

## 核心需求

1. **移除猫背景照片**：当前截图显示添加宠物页面有模糊的猫照片作为背景
2. **移除右上角吊灯**：当前有 LampSwitch 拉灯组件显示在右侧
3. **保留毛玻璃表单效果**：4步表单的毛玻璃卡片、输入框、按钮等样式保持不变
4. **提供纯净氛围背景**：用渐变色/光斑替代猫图片，保持高级感

### 当前代码分析结果

- Dashboard.tsx（添加宠物页面）**本身不包含** PetBackground 或 LampSwitch 组件
- 这些组件仅在 HomePetOS.tsx（首页）中使用
- 但截图确实显示了猫背景+灯，说明可能通过以下方式引入：

1. CSS 背景图（`.petos-page` 的 background-image）
2. 或者全局布局注入

- 经确认：`petos-page::before` 只有径向渐变光斑（无图片），`petos-page` 背景是 `var(--color-bg)` 纯色变量
- **结论**：猫背景图和灯可能来自其他地方，需要检查是否有全局 CSS 背景或父容器传递

### 需要确认的范围

- `src/pages/Dashboard.tsx`：添加宠物主组件（4步骤表单）
- `src/styles/petos.css`：`.petos-page` 及相关背景样式
- `src/index.css`：`.onboarding-mode` / `.onboarding-content` / `.pet-add-screen` 相关样式
- 可能需要检查是否有全局背景图 CSS 规则

## 技术栈

- React + TypeScript
- 原生 CSS（petos.css + index.css）
- 无额外 UI 框架依赖

## 实现方案

### 问题根因定位

从代码分析：

1. **Dashboard.tsx** 使用 `className="petos-page"` 作为根容器
2. **AppShell.tsx** 在 `/app/pets/add` 路由下使用 `onboarding-mode` class，隐藏了 blob 光斑
3. **PetBackground 和 LampSwitch 仅在 HomePetOS.tsx 中使用**
4. 截图中看到的猫背景和灯，最可能的原因是：

- `.petos-page` 或其父容器的 CSS 中存在背景图
- 或 `var(--color-bg)` 变量引用了带图片的背景

### 修改策略

**方案：CSS 层面移除背景图 + 增强纯色毛玻璃氛围**

1. **确认并清理背景来源**：

- 检查 `--color-bg` 变量定义，确认是否含背景图
- 检查 `index.css` 中 `.onboarding-mode` / `.my-shell.onboarding-mode` 是否有背景图规则
- 如发现背景图规则，直接移除或覆盖

2. **增强 `.petos-page` 背景**（替代猫图片）：

- 使用多层径向渐变营造温暖氛围（金/粉/紫色调）
- 保持与现有毛玻璃表单卡片的视觉协调
- 可选：加入微妙的噪点纹理增加质感

3. **确保无 LampSwitch 渲染**：

- 确认 Dashboard.tsx 无 LampSwitch import（已确认没有）
- 确认 AppShell.tsx 在 onboarding 模式下不会渲染灯组件（已确认不渲染）

### 架构设计

```
AppShell (onboarding-mode)
  └── app-shell-onboarding-wrap (全宽, min-height: 100dvh)
       └── onboarding-content (min-height: 100dvh)
            └── Outlet → Dashboard.tsx
                 └── div.petos-page (目标修改区域)
                      ├── petos-form-topbar (顶栏)
                      ├── petos-form-step-header (步骤标题)
                      ├── petos-form-progress (进度条)
                      ├── [Step 1-4 内容]
                      └── petos-form-footer (底栏)
```

## 关键文件

| 文件 | 改动类型 | 说明 |
| --- | --- | --- |
| `src/styles/petos.css` | 修改 | 增强 `.petos-page` 背景为纯渐变氛围 |
| `src/index.css` | 检查/可能修改 | 清理 onboarding 相关背景图 |
| `src/pages/Dashboard.tsx` | 不修改 | 组件逻辑不变 |


## 设计方案：纯净毛玻璃氛围背景

### 整体风格

采用 **Glassmorphism 毛玻璃 + 温暖渐变氛围** 风格，去掉具象的猫咪照片和灯具装饰，用抽象的光影营造温馨感。

### 背景设计

- **主背景**：深暖灰棕色调（#2A1F1A 到 #1A1410 渐变）
- **光斑层**：3-4个径向渐变光斑（金色/粉色/淡紫色），模拟柔和的环境光
- **质感层**：可选的细微噪点纹理，避免过于扁平
- **无任何图片素材**：纯 CSS 实现

### 视觉层次

```
Layer 0: 深色暖调基底 (#1E1612)
Layer 1: 径向渐变光斑 (金/粉/紫, 低透明度)
Layer 2: 毛玻璃卡片 (backdrop-filter: blur 20px, rgba(255,255,255,0.12))
Layer 3: 表单内容 (文字/输入框/按钮)
```

### 页面结构（4个步骤统一风格）

每个步骤共享相同的背景和布局框架，仅内容区不同。

## Agent Extensions

### Skill: impeccable

- **Purpose**: 对添加宠物页面的背景进行设计审查和优化，确保移除猫背景和灯后的视觉效果仍然高级精致
- **Expected outcome**: 提供最佳的纯 CSS 渐变氛围背景方案，确保毛玻璃卡片在新的背景下依然清晰可读且视觉层次分明