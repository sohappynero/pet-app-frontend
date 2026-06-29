---
name: home-ui-refine-card-light-rope
overview: 调整首页3项视觉：透明卡片左移居中、光锥增强覆盖猫脸、灯绳加长
design:
  architecture:
    framework: react
  styleKeywords:
    - Warm Ambient Light
    - Glassmorphism
    - Pet Portrait
    - Cozy Golden Tone
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 24px
      weight: 800
    subheading:
      size: 18px
      weight: 700
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#F5C56A"
      - "#E8B84A"
      - "#D4A855"
    background:
      - "#F7E7D3"
      - "#2A1810"
      - rgba(255,225,165,0.18)
    text:
      - "#FFFDF8"
      - "#E8DCC8"
    functional:
      - "#FF9EB5"
      - "#7C9885"
      - "#E84C3D"
todos:
  - id: fix-card-left
    content: "卡片左移: .immersive-content padding改为左24px右12px + 卡片max-width 420→380px"
    status: completed
  - id: fix-light-cat-face
    content: "光效照猫脸: 光锥top 115→85px width 420→460px opacity 0.78→0.85 + 环境光中心调至80% 25%"
    status: completed
  - id: fix-rope-longer
    content: "灯绳加长: Rope默认高度130→180px + CatPawHandle top 8→12px保持间距"
    status: completed
  - id: verify-screenshot
    content: 用[MCP Server Playwright]截图验证3项修改效果
    status: completed
    dependencies:
      - fix-card-left
      - fix-light-cat-face
      - fix-rope-longer
---

## Product Overview

按照参考图修改首页3项视觉问题：透明卡片位置左移、灯光覆盖猫脸、灯绳加长。

## Core Features

- **卡片位置调整**：底部半透明信息卡往左缩一点（当前偏右，需要更居中偏左）
- **灯光照到猫脸**：光锥和环境光效果增强，让暖光覆盖到猫咪脸部区域（参考图猫脸有明显暖色光照）
- **灯绳加长**：拉绳从当前130px进一步加长，接近参考图中猫爪吊坠垂在更低位置的视觉效果

## Tech Stack

- 纯 CSS + React 组件样式调整，无新依赖
- 修改范围：3个文件（home-dashboard.css、Rope.tsx、LampSwitch.tsx）

## Implementation Approach

### 1. 卡片左移

- `home-dashboard.css` 中 `.immersive-content` 的 padding 从 `0 16px 100px` 改为 `0 20px 100px`（左右padding不对称或增大左侧）
- 或 `.immersive-pet-card` 的 max-width 从 420px 减小到 380px 并调整 margin
- 更优方案：给 `.immersive-content` 增加 `padding-left: 24px; padding-right: 12px;` 实现左移

### 2. 灯光覆盖猫脸

- 光锥 `.lamp-light-cone`：top 从 115px 减到 80-90px（光锥起点上移，覆盖猫脸），width 从 420px 增到 460px，opacity 从 0.78 提升到 0.85
- 环境光 `.lamp-ambient-layer`：椭圆中心从 `88% 8%` 调整为 `80% 25%`（向左下方移动到猫脸位置），覆盖范围扩大
- PetBackground 暖光遮罩：渐变中心从右上角调整为更居中偏右上的位置

### 3. 灯绳加长

- `Rope.tsx` 默认高度从 130px 增加到 180px
- `CatPawHandle.tsx` 的 top 从 8px 调整为 12px（保持间距比例）

## Architecture Design

```
LampSwitch (fixed right-0 top-[8px])
  ├──吸盘顶座 (28x10)
  ├──Rope (180px 高度, 1.5px宽) ← 加长
  └──灯罩容器 (mt-2 relative)
      ├──Glow Halo (130x120)
      ├──灯罩本体 (80x70)
      └──CatPawHandle (top:12px) ← 猫爪吊坠

光锥系统：
  .lamp-light-cone (fixed top:85px right:2px width:460px) ← 上移+变宽
  .lamp-ambient-layer (ellipse at 80% 25%) ← 移到猫脸区域

卡片系统：
  .immersive-content (padding-left:24px padding-right:12px) ← 左移
    └──.immersive-pet-card (max-width:380px) ← 缩窄
```

## Directory Structure

```
src/
├── components/
│   ├── Rope.tsx              # [MODIFY] 绳子高度 130→180px
│   ├── CatPawHandle.tsx      # [MODIFY] top 8→12px
│   └── LampSwitch.tsx         # [MODIFY] 微调容器padding
├── styles/
│   └── home-dashboard.css    # [MODIFY] 卡片位置/光锥/环境光 3处CSS调整
└── pages/
    └── HomePetOS.tsx          # [无需修改]
```

## 设计风格

参考图为沉浸式暖光宠物首页。核心视觉特征：右侧吊灯投射明显暖黄色光锥到猫脸上，底部毛玻璃信息卡略微偏左不遮挡光线，灯绳很长使猫爪吊坠垂在屏幕中下部。

## 页面规划

### 首页（唯一页面）

1. **顶部导航区** — 左侧汉堡菜单按钮 + 中间金色欢迎语标题 + 右侧占位
2. **全屏宠物背景层** — 猫咪大图 + 暖色氛围遮罩（重点：猫脸被灯光照射的暖色调）
3. **右侧吊灯系统** — 吸盘→长绳(加长版)→钟形灯罩(带猫爪图标)→猫爪圆形吊坠，投射光锥到左下方的猫脸
4. **半透明信息卡** — 毛玻璃质感，水平布局（头像左+信息右），略偏左位置
5. **底部TabBar** — lucide线性图标，中间凸起加号按钮

## 单页Block设计

- Block 1 - 顶部状态栏：玻璃按钮风格菜单键 + 金色欢迎语 "诺怒，今天也要开心哦～"
- Block 2 - 宠物背景+灯光层：全屏猫图 + 右侧光锥叠加 + 环境光暖色遮罩（核心视觉效果：猫脸被照亮的暖光感）
- Block 3 - 信息卡区域：水平毛玻璃卡片（头像76px圆角方形 + 名字/品种/属性标签/详情行/操作行），卡片整体略偏左
- Block 4 - TabBar栏：5个tab（首页/动态/+/日记/我的），中间凸起金色+号

## Skill

- **impeccable**
- Purpose: 对修改后的UI进行精细化审查和优化建议
- Expected outcome: 确保卡片位置、光效、灯绳三处修改协调一致，视觉品质达到参考图水准

## MCP

- **MCP Server Playwright**
- Purpose: 截图验证修改后的实际渲染效果
- Expected outcome: 在浏览器中查看卡片是否左移、光是否照到猫脸、灯绳是否足够长