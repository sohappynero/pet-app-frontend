---
name: refine-quick-record-cards-ui
overview: 基于参考图优化首页快速记录卡片：修改操作按钮为纯文字pill样式、添加进度百分比显示、微调3D球体尺寸至92px增强玻璃质感
design:
  architecture:
    framework: react
  fontSystem:
    fontFamily: Inter, 'SF Pro Display', -apple-system, system-ui, sans-serif
    heading:
      size: 17px
      weight: 800
    subheading:
      size: 12.5px
      weight: 400
    body:
      size: 13px
      weight: 600
  colorSystem:
    primary:
      - "#6366F1"
      - "#8B5CF6"
      - "#06B6D4"
    background:
      - "#FFFFFF"
      - "#F8FAFC"
    text:
      - "#0F172A"
      - "#475569"
      - "#94A3B8"
    functional:
      - "#E0E7FF"
      - "#F1F5F9"
      - "#E2E8F0"
todos:
  - id: refine-jsx-cards
    content: 使用 [skill:frontend-design] 重写 Pets.tsx 中8个快速记录卡片：移除ChevronRight箭头改为纯文字pill按钮("去记录")、重构进度条行为status+bar+percent三段式、更新按钮文案
    status: completed
  - id: update-css-styles
    content: 使用 [skill:frontend-design] 更新 index.css：重写.ph3d-tc-action为纯文字pill样式、新增.ph3d-tc-percent百分比样式、调整.ph3d-tc-orb/.ph3d-tc-sphere尺寸至94/72px、修正.ph3d-tc-progress内部flex排序
    status: completed
    dependencies:
      - refine-jsx-cards
  - id: verify-ui-result
    content: 验证渲染效果：确认8张卡片的操作按钮无箭头、百分比值显示正确、球体尺寸增大、hover交互正常、导航功能无回归
    status: completed
    dependencies:
      - update-css-styles
---

## 产品概述

基于参考图(image.ce5d4f5d02.png)对首页(Pets.tsx)快速记录卡片区域进行UI精细化修改。参考图为一张课程学习卡片设计稿，展示了左侧大型3D玻璃圆环球体 + 右侧内容区(标题/副标题/渐变进度条/状态标签/百分比/操作按钮)的横向布局。

## 核心功能

当前已实现的future-tech-3D-glass-cards方案基础上，做以下4项精准调整：

### 1. 操作按钮改造 (8处)

- **移除** `<ChevronRight size={16} />` 图标（所有8个卡片）
- **文字变更**: "记录" → "去记录"，"启动" → "开始分析"
- **样式目标**: 参考图 "Start learning" 风格的纯文字pill按钮（浅灰底+边框+圆角，无箭头）

### 2. 进度条行重构 (8处)

- **当前顺序**: `[进度条] [状态标签]`
- **目标顺序**: `[状态标签] [进度条] [百分比数字]` — 对齐参考图的 `Ongoing  ●●●●●●●○○○  60 / 100%`
- **新增元素**: 每张卡片的progress行末尾添加 `<span className="ph3d-tc-percent">` 显示百分比

### 3. 3D球体尺寸微调

- 球体外容器 `.ph3d-tc-orb`: 90px → 94px
- 核心球体 `.ph3d-tc-sphere`: 68px → 72px
- 增强玻璃质感和视觉冲击力

### 4. CSS样式配套更新

- 重写 `.ph3d-tc-action` 为纯文字pill样式（去掉icon的gap和布局）
- 新增 `.ph3d-tc-percent` 百分比文字样式
- 调整 `.ph3d-tc-progress` 内部flex排序为 status→bar→percent

## 技术栈

- **框架**: React 18 + TypeScript (保持现有架构不变)
- **样式方案**: 原生CSS (`src/index.css`)，不引入新依赖
- **修改范围**: 仅2个文件 — `src/pages/Pets.tsx` + `src/index.css`

## 实现策略

### JSX结构调整 (Pets.tsx 第291-498行)

每个卡片的两处改动：

**改动1 - 进度条行重排**:

```
<!-- Before -->
<div className="ph3d-tc-progress">
  <div className="ph3d-tc-bar"><div className="ph3d-tc-fill" /></div>
  <span className="ph3d-tc-status">追踪中</span>
</div>

<!-- After -->
<div className="ph3d-tc-progress">
  <span className="ph3d-tc-status">追踪中</span>
  <div className="ph3d-tc-bar"><div className="ph3d-tc-fill" /></div>
  <span className="ph3d-tc-percent">-- / --%</span>
</div>
```

**改动2 - 操作按钮去箭头**:

```
<!-- Before -->
<div className="ph3d-tc-action">
  <span>记录</span>
  <ChevronRight size={16} />
</div>

<!-- After -->
<div className="ph3d-tc-action">
  <span>去记录</span>
</div>
```

### CSS样式调整 (index.css 第9422-9745行)

**关键样式变更点**:

| 选择器 | 变更内容 |
| --- | --- |
| `.ph3d-tc-orb` | width/height: 90px → 94px |
| `.ph3d-tc-sphere` | width/height: 68px → 72px |
| `.ph3d-tc-action` | 移除gap:4px, padding调整为10px 20px, font-size 13px, 纯文字pill风格 |
| `.ph3d-tc-progress` | 保持flex布局，新增justify-content: space-between |
| `.ph3d-tc-percent` | 新增: font-size 11px, font-weight 600, color #94a3b8 |
| `.ph3d-tc-bar` | max-width从120px改为flex:1自适应 |


### 受影响文件清单

```
src/pages/Pets.tsx          [MODIFY] 第284-498行 快速记录区8个卡片JSX
src/index.css               [MODIFY] 第9422-9745行 基础样式 + 操作按钮/百分比新样式
```

### 向后兼容与约束

- 所有onClick导航逻辑完全不变
- 8套配色方案(CSS变量)不受影响
- AI特殊动画(脉冲/极光流动)保留不动
- 响应式布局不变

## 设计方向：参考图对齐优化

以用户提供的参考图(image.ce5d4f5d02.png)为唯一基准，对现有3D玻璃卡片做精细化UI调整。核心设计语言保持未来科技感3D玻璃美学不变，仅调整以下细节：

1. **操作按钮**：从"文字+箭头图标"改为纯文字pill按钮，参考 "Start learning" 的视觉风格 — 浅灰色背景(#f8fafc) + 可见边框(1.5px #e2e8f0) + 圆角full + 深色文字(#334155)，hover时反色填充主题色
2. **进度信息行**：重新排列为三段式 `[Status Badge] [Gradient Bar] [Percent Text]`，参考图中 "Ongoing  [===bar===]  60 / 100%" 的经典学习平台进度展示模式
3. **3D球体微放大**：从90px增至94px，增强左侧视觉锚点的存在感，使整体比例更接近参考图的宽松呼吸感
4. **百分比文字**：11px等宽字体感的小字，显示"--/--%"占位符（因暂无真实进度数据），右对齐于进度条行末端

整体气质：在已有赛博朋克轻量化3D玻璃美学基础上，向参考图的简洁教育类卡片风格靠拢 — 信息层级更清晰、操作意图更明确。

## Agent Extensions

### Skill

- **frontend-design**
- Purpose: 生成高质量的前端UI代码，确保快速记录卡片的调整达到参考图视觉效果标准
- Expected output: 符合参考图风格的React JSX组件代码调整 + 配套CSS样式更新，包含纯文字pill按钮、百分比显示、球体尺寸微调