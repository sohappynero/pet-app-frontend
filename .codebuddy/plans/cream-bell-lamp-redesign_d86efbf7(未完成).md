---
name: cream-bell-lamp-redesign
overview: 重设计HomePetOS吊灯组件：修复猫爪下拉不同步问题，将扁平椭圆灯罩改为花瓣形，猫爪吊坠改为圆形，增加麻绳编织纹理，整体更可爱更接近参考图。
design:
  architecture:
    framework: react
  styleKeywords:
    - 温馨治愈
    - 日式奶油风
    - 圆润可爱
    - 质感细腻
    - 暖色调
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 16px
      weight: 600
    subheading:
      size: 14px
      weight: 500
    body:
      size: 12px
      weight: 400
  colorSystem:
    primary:
      - "#FFF8E7"
      - "#F5E0A8"
      - "#E8C880"
      - "#C4A574"
    background:
      - "#FFFDF5"
      - "#FFF8EE"
    text:
      - "#7A6850"
      - "#5C4D3A"
    functional:
      - "#F5B0BF"
      - "#E88898"
      - "#FFFFFF"
todos:
  - id: fix-paw-sync
    content: 修复猫爪吊坠与绳子同步移动问题
    status: pending
  - id: redesign-lamp-shade
    content: 重绘花瓣形灯罩 SVG，添加金属连接件
    status: pending
    dependencies:
      - fix-paw-sync
  - id: redesign-paw-charm
    content: 重绘圆形猫爪印吊坠 SVG
    status: pending
    dependencies:
      - fix-paw-sync
  - id: enhance-rope-texture
    content: Canvas 绳子增加编织纹理效果
    status: pending
    dependencies:
      - fix-paw-sync
  - id: verify-tsc
    content: 运行 TypeScript 编译验证
    status: pending
    dependencies:
      - redesign-lamp-shade
      - redesign-paw-charm
      - enhance-rope-texture
---

## 产品概述

重设计 HomePetOS 页面的吊灯组件（CreamBellLamp），修复交互问题并提升视觉可爱度。

## 核心问题

1. **猫爪不跟随绳子下拉** — 向下拉时只有 Canvas 物理绳子有摆动效果，SVG 猫爪吊坠和交互热区原地不动，视觉断裂
2. **灯罩造型不可爱** — 当前是扁平椭圆，缺少立体感和装饰细节

## 参考图特征

- 花瓣形奶油色灯罩（5-6瓣褶皱，立体玻璃质感）
- 金属色顶部连接件（古铜/金色小圆柱+挂环）
- 麻绳纹理（编织感）
- 圆形猫爪印吊坠（圆形底+粉色爪印，非当前椭圆肉垫）
- 绳子从顶部穿过灯罩连接吊坠

## 修复目标

1. 猫爪吊坠与绳子物理同步移动（拖拽时整体下移，释放后弹性回弹）
2. SVG 灯罩重绘为花瓣形，增加金属连接件
3. 猫爪吊坠改为圆形猫爪印造型
4. Canvas 绳子增加编织纹理效果
5. 保持原有交互逻辑（拖拽切换宠物、提示气泡）

## Tech Stack

- React 18 + TypeScript
- 原生 SVG（无外部库）
- Canvas 2D API（绳子物理模拟）
- CSS 动画（摆动、提示气泡）

## 实现方案

### 1. 猫爪同步移动修复

根因：SVG 中 `<g transform>` 和 CSS `.lamp-paw-ring` 的 `style.transform` 使用不同坐标系，且 `translateY` 计算系数不一致。
方案：

- 将 SVG 猫爪组从 `<g transform>` 改为外层包裹 `<div>`，使用 CSS `transform` 统一控制
- 或者：将猫爪和交互热区放入同一个绝对定位容器，统一应用 `transform: translateY(${pullY * 1.3}px)`
- 物理模拟端：`sim.moveEnd()` 的 Y 坐标与视觉偏移系数保持一致（当前 `delta * 1.8` vs `pullY * 1.3`）

### 2. 花瓣形灯罩 SVG

- 使用 6 个 `path` 绘制花瓣，每个花瓣为贝塞尔曲线形成的弧形
- 花瓣使用径向渐变填充（奶油色 `#FFF8E7` → `#F5E0A8` → `#E8C880`）
- 添加花瓣边缘高光线增强立体感
- 金属连接件：顶部小圆柱（线性渐变 `#C4A574` → `#8B7355`）+ 挂环

### 3. 圆形猫爪印吊坠

- 圆形底：`circle` + 径向渐变（米白 `#FFF8F0` → `#F5E6D3`）
- 粉色爪印：4 个小椭圆（脚趾）+ 1 个大椭圆（掌垫），使用 `#F5B0BF` → `#E88898` 渐变
- 顶部小挂环连接绳子

### 4. 绳子编织纹理

- Canvas 绘制双线：主绳 + 偏移 1px 的副绳，颜色略深
- 或：使用 `setLineDash` 创建虚线编织效果
- 增加绳子与灯罩连接处的金属环细节

### 5. 性能优化

- 保持 `requestAnimationFrame` 动画循环
- Canvas 使用 `devicePixelRatio` 适配高分屏
- 物理模拟 `damping=0.97` 保持自然摆动衰减

## 目录结构

```
src/pages/HomePetOS.tsx          [MODIFY] CreamBellLamp 组件（SVG重绘+交互修复）
src/styles/home-dashboard.css    [MODIFY] 吊灯相关样式微调
```

## 关键代码结构

```typescript
// 统一移动控制 — 猫爪容器
const pawContainerStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '18px',
  left: '50%',
  transform: `translateX(-50%) translateY(${pullY * 1.3}px)`,
  transition: pullY > 0 ? 'none' : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
  zIndex: 10,
};

// 花瓣路径示例（6瓣）
const petalPath = (index: number, total: number) => {
  const angle = (index / total) * Math.PI * 2;
  // 贝塞尔曲线计算...
};
```

## 设计方向

参考图是日式奶油风花瓣吊灯，温暖、可爱、有质感。重设计后的吊灯应该像一个小巧的奶油铃铛，带有猫爪吊坠，整体氛围温馨治愈。

## 设计内容

### 灯罩（花瓣形）

- 6 片花瓣组成半球形灯罩，每片花瓣有自然的弧形褶皱
- 奶油白到暖黄的径向渐变，边缘有柔和的高光
- 花瓣之间有细微的阴影分隔，增强立体感
- 顶部金属连接件：古铜色小圆柱，带挂环

### 发光核心

- 灯罩内部有暖黄色光晕，从中心向外扩散
- 中央有明亮的白色光斑，模拟灯泡发光
- 拉下猫爪时光晕增强，营造互动反馈

### 绳子

- 麻绳质感，有编织纹理（双线绘制）
- 从顶部穿过金属连接件，连接到猫爪吊坠
- 颜色：浅棕到深棕的渐变，有立体感

### 猫爪吊坠

- 圆形米白色底，像一个小饼干
- 粉色猫爪印：4 个脚趾椭圆 + 1 个掌垫椭圆
- 顶部有小挂环连接绳子

### 交互反馈

- 悬停：猫爪轻微放大，出现粉色光晕
- 拖拽：猫爪跟随绳子下拉，灯罩轻微摆动
- 释放：弹性回弹，触发切换宠物时灯光明亮闪烁

## 风格关键词

温馨治愈、日式奶油风、圆润可爱、质感细腻、暖色调

## Agent Extensions

### Skill

- **impeccable**
- Purpose: 对 SVG 灯罩和猫爪吊坠的视觉设计进行审核和优化，确保造型可爱、质感细腻
- Expected outcome: 提供设计改进建议，确保花瓣形灯罩和圆形猫爪吊坠的视觉效果达到参考图水准
- **frontend-design**
- Purpose: 生成高质量的前端 SVG 组件代码，实现花瓣形灯罩和圆形猫爪吊坠的精致绘制
- Expected outcome: 提供花瓣路径算法、渐变定义、金属质感渲染等前端实现方案