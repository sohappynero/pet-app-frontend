---
name: lamp-card-layout-adjustment-v2
overview: 调整首页沉浸式UI三大布局问题：灯罩缩小上移、卡片完整显示、整体比例优化，使布局匹配参考图效果
design:
  architecture:
    framework: react
  fontSystem:
    fontFamily: "-apple-system"
    heading:
      size: 16px
      weight: 700
    subheading:
      size: 14px
      weight: 600
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#FFD6A5"
      - "#FFE4BC"
      - "#F5B942"
    background:
      - "#F7E7D3"
      - rgba(255,255,255,0.15)
    text:
      - "#FFFDF8"
      - "#E8DCC8"
    functional:
      - "#5D4E37"
      - "#FF9EB5"
todos:
  - id: adjust-lamp-size-position
    content: 缩小LampSwitch灯罩尺寸(80x70→60x52)并上移(top:8→0)，同步缩小所有内部装饰元素
    status: pending
  - id: shorten-rope-length
    content: 缩短Rope默认高度(260→200px)使猫爪吊坠位置上移
    status: pending
    dependencies:
      - adjust-lamp-size-position
  - id: shrink-glow-halo
    content: 缩小CSS中lamp-glow-halo各状态尺寸适配新灯罩
    status: pending
    dependencies:
      - adjust-lamp-size-position
  - id: fix-card-position
    content: 大幅减小immersive-content的margin-bottom(22vh→7vh)让卡片完整显示在可视区域
    status: pending
  - id: verify-with-screenshot
    content: 用Playwright启动项目截图验证最终效果，确认灯/卡片/整体比例正确
    status: pending
    dependencies:
      - adjust-lamp-size-position
      - shorten-rope-length
      - shrink-glow-halo
      - fix-card-position
---

## 产品概述

继续上次未完成的首页沉浸式UI布局调整，解决三大视觉问题，使布局匹配参考图效果。

## 核心功能

- **灯罩缩小上移**：当前灯罩 80x70px 偏大偏低（top:8px），需进一步缩小至精致尺寸并上移到顶部角落
- **卡片完整显示**：当前 `margin-bottom: 22vh` 将卡片推至屏幕中下部，可能被TabBar遮挡或超出可视区域；`padding-bottom: 100px` 加剧此问题。需将卡片位置上移并确保完整可见
- **整体比例优化**：Rope 绳长260px使猫爪吊坠位置偏低；Glow Halo光晕130x120px仍偏大；背景图scale可微调以增加留白感

## 技术栈

- React + TypeScript 前端
- 纯 CSS 样式系统（home-dashboard.css）
- 内联样式组件（LampSwitch.tsx, Rope.tsx, CatPawHandle.tsx）

## 调整方案

### T1: LampSwitch 灯罩缩小上移

| 属性 | 当前值 | 目标值 | 说明 |
| --- | --- | --- | --- |
| 容器 top | 8px | 0px | 紧贴顶部 |
| 容器 width | 100px | 80px | 整体缩窄 |
| 灯罩 width | 80px | 60px | 缩小33% |
| 灯罩 height | 70px | 52px | 缩小26% |
| 星星 fontSize | 16px | 11px | 同比缩小 |
| 高光 | 26x14px | 18x10px | 同比缩小 |
| 猫爪图案 | 13px | 9px | 同比缩小 |
| 高光位置 | top:10, left:16 | top:6, left:12 | 适配新灯罩 |
| 吸盘顶座 | 28x10 | 20x7 | 同比缩小 |


### T2: Rope 绳长缩短

| 属性 | 当前值 | 目标值 | 说明 |
| --- | --- | --- | --- |
| 默认高度 | 260px | 200px | 缩短60px，猫爪吊坠随之上移 |
| 拖拽伸长 | max(260+dragY) | max(200+dragY) | 保持拖拽交互不变 |


### T3: Glow Halo 光晕缩小 (CSS)

| 属性 | 当前值 | 目标值 | 说明 |
| --- | --- | --- | --- |
| idle width/height | 130x120px | 90x82px | 适配缩小后灯罩 |
| dragging | 220x200px | 160x140px | 同比缩小 |
| triggered | 320x300px | 240x220px | 同比缩小 |


### T4: 卡片定位调整 (CSS) — **核心修复**

| 属性 | 当前值 | 目标值 | 说明 |
| --- | --- | --- | --- |
| margin-bottom | 22vh | 6~8vh | 大幅上移，卡片浮在屏幕约35-40%高度 |
| padding-bottom(immersive-content) | 100px | 80px | 减少底部留白 |
| padding-bottom(immersive-page) | 100px | 90px | 微调给TabBar空间 |


### T5: 背景图微调 (可选)

| 属性 | 当前值 | 目标值 | 说明 |
| --- | --- | --- | --- |
| scale (idle) | 1.0 | 0.95 | 轻微缩小，增加四周留白感 |
| scale (drawer) | 1.08 | 1.02 | drawer时也保持较小幅度 |


### 文件影响范围

```
src/
├── components/
│   ├── LampSwitch.tsx     [MODIFY] 灯罩/容器/内部元素尺寸 + 位置
│   ├── Rope.tsx           [MODIFY] 默认绳长 260→200
│   └── PetBackground.tsx  [MODIFY] scale微调 (可选)
└── styles/
    └── home-dashboard.css [MODIFY] 卡片定位(margin-bottom) + Halo尺寸 + 页面padding
```

本次调整为纯布局微调，不涉及UI框架变更或组件库使用。目标是在现有沉浸式玻璃态设计基础上修正三大布局问题：

1. 右上角灯从"偏大偏低"调整为"精致小巧、紧贴右上角"
2. 底部透明信息卡从"部分被遮挡"调整为"完整显示在屏幕中下区域"
3. 整体比例从"拥挤"调整为"有呼吸感的留白布局"

## Agent Extensions

### Skill: impeccable

- **Purpose**: 对调整后的UI进行精细化审查和优化，确保视觉效果达到高质量标准
- **Expected outcome**: 验证调整后的布局比例协调性、元素间距合理性、视觉层次清晰度

### MCP: MCP Server Playwright

- **Purpose**: 调整完成后截图验证实际效果
- **Expected outcome**: 通过浏览器截图确认灯的位置/大小、卡片的完整性、整体比例是否符合预期