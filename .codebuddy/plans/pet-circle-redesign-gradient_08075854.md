---
name: pet-circle-redesign-gradient
overview: 修改 HomePetOS 页面的宠物圆环系统：1) 外圈白圈添加右下角起点的透明到白色渐变；2) 放大轨道宠物头像尺寸；3) 调整选中状态尾巴与外圈的视觉融合
todos:
  - id: outer-ring-gradient
    content: 修改 CSS .hd-outer-ring：实现右下起点的 transparent→white conic-gradient 渐变效果
    status: completed
  - id: avatar-size-up
    content: 放大宠物头像尺寸：orbit-slot 64px、avatar 52px/选中58px，含响应式
    status: completed
  - id: teardrop-blob-shape
    content: 替换 hd-selected-tail 为有机水滴 SVG blob 形状，JSX结构调整+CSS样式
    status: completed
  - id: screenshot-verify
    content: 使用 Playwright 截图验证最终视觉效果
    status: completed
    dependencies:
      - outer-ring-gradient
      - avatar-size-up
      - teardrop-blob-shape
---

## 产品概述

根据用户提供的UI设计截图（红线标注），重新设计 HomePetOS 首页的宠物圆环系统视觉效果。

## 核心功能需求

1. **外圈白圈渐变效果**：白色外圈从右下角（约4-5点钟方向）开始，顺时针旋转一圈，颜色由**透明渐变到纯白**。当前实现是纯白实心 + clip-path 缺角，需要改为渐变弧形。
2. **宠物头像放大**：轨道上的宠物头像当前 42px（选中态 48px），偏小需要增大到约 50-54px（选中态 56-60px），同时轨道槽位 `.hd-orbit-slot` 也需相应放大。
3. **有机水滴形状（红线区域）**：红线标注的是一个类似"水滴/液滴"的有机不规则形状——从左上角选中的宠物头像位置延伸出来，包裹住整个粉色内圈区域。这替代当前简单的矩形 `hd-selected-tail` 连接尾巴。该形状应呈现柔和的有机轮廓，带有粉色填充或渐变。

## 技术栈

- React + TypeScript (现有项目)
- 原生 CSS (home-dashboard.css)
- 内联 SVG 路径用于有机形状

## 实现方案

### 1. 外圈渐变 — conic-gradient + mask

将 `.hd-outer-ring` 的背景从纯白改为：

```css
background: conic-gradient(
  from 135deg at center,
  transparent 0deg,
  rgba(255,255,255,0.3) 45deg,
  #FFFFFF 135deg,
  #FFFFFF 315deg,
  rgba(255,255,255,0.15) 360deg
);
```

配合 `border-radius: 50%` 和现有的 clip-path 实现弧形渐变。起始角度约 135°（右下方向），顺时针扫过约 270° 形成透明→白的过渡。

### 2. 头像尺寸放大

| 属性 | 当前值 | 新值 |
| --- | --- | --- |
| `.hd-orbit-slot` | 52x52px | 64x64px |
| `.hd-pet-orbit-avatar` | 42x42px | 52x52px |
| `.hd-pet-orbit-avatar--selected` | 48x48px | 58x58px |


响应式适配也需同步调整（@media max-width:420px）。

### 3. 有机水滴形状 — 替换 hd-selected-tail

移除当前的矩形尾巴 `.hd-selected-tail`，改用一个新的 `.hd-teardrop-blob` 元素：

- 使用 **内联 SVG path** 定义水滴状有机轮廓（贝塞尔曲线）
- 填充粉色渐变（与内圈粉色协调），带一定透明度
- 绝对定位在圆环中心区域，z-index 在外圈和内圈之间
- 形状特征：顶部尖窄（连接选中头像位置），底部宽大圆润（包裹内圈）

JSX 变更：将第 251-253 行的 `<div className="hd-selected-tail">` 替换为新的 blob 元素，位置从 orbit-slot 移至 ring-system 级别（只渲染一次，不随每个 pet 循环）。

## 关键文件修改

```
src/pages/HomePetOS.tsx       [MODIFY] - 替换 hd-selected-tail 为 hd-teardrop-blob，移至 ring-system 级别
src/styles/home-dashboard.css  [MODIFY] - 外圈渐变、头像放大、水滴形状样式、响应式适配
```

## Agent Extensions

- **MCP Server Playwright**
- Purpose: 截图验证 UI 修改效果
- Expected outcome: 通过 localhost:5173 截图确认渐变、尺寸、形状是否符合设计预期