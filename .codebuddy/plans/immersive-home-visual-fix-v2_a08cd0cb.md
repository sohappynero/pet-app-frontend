---
name: immersive-home-visual-fix-v2
overview: 修复沉浸式首页5个视觉差距：背景图尺寸/位置优化（缩小+上移+轻微模糊）、吊灯位置右移避免遮挡猫脸、信息卡再上移到55%高度、欢迎语改为金色、TabBar可见性确认
design:
  architecture:
    framework: react
  styleKeywords:
    - Warm Creamy Home
    - Soft Glass Pastel
    - Cosy Pet UI
    - Ambient Light
    - Golden Hour Tones
  fontSystem:
    fontFamily: PingFang SC, -apple-system, sans-serif
    heading:
      size: 17px
      weight: 700
    subheading:
      size: 14px
      weight: 600
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#F5C56A"
      - "#FFD6A5"
      - "#E8B84A"
    background:
      - "#FFF8E7"
      - "#F7E7D3"
      - rgba(255,255,255,0.18)
    text:
      - "#FFFDF8"
      - "#5D4E37"
      - "#F5C56A"
    functional:
      - "#E84C3D"
      - "#7C9885"
      - "#FF9EB5"
todos:
  - id: fix-bg-refinement
    content: "优化背景图: blur(0→1.5px), brightness(1.02→0.96), scale(1.0→1.04), 增强暖色氛围遮罩"
    status: completed
  - id: fix-lamp-position
    content: "吊灯位置右移上移: right-4→right-2, top-36→top-16, 灯罩110x95→80x70"
    status: completed
  - id: fix-card-pos-tabbar
    content: 信息卡上移(margin-bottom 15→22vh) + AppShell修复TabBar显示(移除path==="/app"隐藏条件)
    status: completed
  - id: fix-welcome-color
    content: "欢迎语改金色: 文字#FFFDF8→#F5C56A, 图标#B8956A→#E8B84A + text-shadow"
    status: completed
  - id: verify-screenshot
    content: 用[skill:impeccable]+[MCP Server Playwright]截图验证5项修复效果
    status: completed
    dependencies:
      - fix-bg-refinement
      - fix-lamp-position
      - fix-card-pos-tabbar
      - fix-welcome-color
---

## 产品概述

修复 HomePetOS 首页的 5 个视觉差距问题，使当前实现接近目标设计图（image.png 目标设计：布偶猫大图背景 + 右上角吊灯 + 中下部毛玻璃信息卡 + 底部TabBar + 金色欢迎语）

## 核心功能需求

### 1. 背景图优化（最关键）

- **当前问题**：`bg-cover` 全屏填满 + `blur(0)` 完全无模糊，导致图片太大太满，缺乏目标设计的精致留白感
- **目标效果**：宠物图清晰可见但有呼吸感，不是全屏撑满，暖黄奶油色调氛围，类似目标设计图中布偶猫居中略偏下、周围有柔和渐变过渡的效果
- **方案**：
- `background-size: cover` 保持不变（移动端需要全屏）
- 添加轻微 `blur(1-2px)` 柔化 + `brightness(0.95)` 稍微压暗，让画面不刺眼
- 增强氛围遮罩的暖色调覆盖范围，从中心向外扩散更自然的奶油色渐变
- 背景图添加微妙的 `scale(1.05)` 让边缘自然裁切，视觉上更有层次

### 2. 吊灯位置调整（关键）

- **当前问题**：灯在 `right-4 top-[36px]`，110px宽灯罩直接盖在猫脸上
- **目标效果**：吊灯在右上角区域但不遮挡宠物主体面部
- **方案**：
- 位置右移+上移：`right-4 → right-2 (8px)`, `top-[36px] → top-[20px]`
- 灯罩适当缩小：`110x95 → 85x75`（仍比原始44x38大近一倍）
- 光晕同步缩小：`160x150 → 130x120`
- 光锥位置适配：`top 140px → top 115px`, `width 480 → 420`

### 3. 信息卡位置上移

- **当前问题**：`margin-bottom: 15vh` 仍然偏底
- **目标效果**：卡片浮在屏幕约50-55%高度位置
- **方案**：`margin-bottom: 15vh → margin-bottom: 22vh`

### 4. TabBar 显示修复

- **根因发现**：AppShell.tsx 第131-132行，`hideTabBar` 在路径 `/app` 时为 `true`！HomePetOS 首页路由正是 `/app`
- **方案**：修改 AppShell.tsx 的 hideTabBar 条件，排除 `/app` 首页路径（仅精确匹配隐藏，或改为 `/app/` 开头的子页面才考虑隐藏）

### 5. 欢迎语颜色优化

- **当前**：白色 `#FFFDF8` + 棕色 Sparkles 图标
- **目标**：金色醒目文字
- **方案**：文字色改为 `#F5C56A`（温暖金色）+ text-shadow 增强可读性，图标色改为 `#E8B84A`

## 技术栈

- React + TypeScript
- CSS Modules（home-dashboard.css 内联样式 + CSS class）
- Tailwind CSS utility classes（内联 className）

## 实现方案

### 架构策略

纯样式调整，不涉及架构变更。按优先级依次修改4个文件：

1. **PetBackground.tsx** — 背景滤镜参数调优 + 氛围遮罩增强
2. **LampSwitch.tsx** — 吊灯位置 + 尺寸缩小
3. **home-dashboard.css** — 信息卡位置 + 光锥光晕尺寸适配
4. **AppShell.tsx** — TabBar 显示条件修复
5. **HomePetOS.tsx** — 欢迎语颜色

### 关键技术决策

#### 背景图处理策略

```
当前: blur(0) brightness(1.02) saturate(1.08) scale(1.0)
目标: blur(1.5px) brightness(0.96) saturate(1.05) scale(1.04)
```

- blur(1.5px): 几乎不可感知的柔化，去除图片锐利感但保持清晰
- brightness(0.96): 微压暗，让前景UI元素（卡片/文字）对比度更好
- scale(1.04): 边缘微微放大后裁切，消除 cover 模式的生硬边界感
- 氛围遮罩增强：从右上角光源扩散更强的暖黄渐变，opacity 从 0.06-0.10 提升到 0.12-0.18

#### 吊灯位置策略

```
当前: right-4(16px) top-[36px] 灯罩110x95
目标: right-2(8px) top-[16px] 灯罩80x70
```

- 更靠近屏幕右上角边缘，远离猫脸中心区
- 缩小到适中尺寸（仍比原始版本大），避免遮挡主体

#### TabBar 修复策略

```typescript
// 当前（有BUG）:
const hideTabBar = path === "/app" || ...

// 修复后:
const hideTabBar =
  path.startsWith("/app/mine/") ||
  path.startsWith("/app/timeline/") || ...;
// 移除 path === "/app"
```

## 目录结构

```
src/
├── components/
│   ├── PetBackground.tsx        # [MODIFY] 背景滤镜 + 氛围遮罩
│   ├── LampSwitch.tsx           # [MODIFY] 位置 + 尺寸
│   └── AppShell.tsx             # [MODIFY] hideTabBar 条件
├── pages/
│   └── HomePetOS.tsx            # [MODIFY] 欢迎语颜色
└── styles/
    └── home-dashboard.css       # [MODIFY] 信息卡位置 + 光锥/光晕
```

## 设计风格参考目标设计图

目标设计是一个温馨的宠物APP首页，核心特征：

1. **背景**: 清晰的布偶猫大图占据画面主体，暖黄奶油色调，有柔和的光晕氛围感，不是冷硬的全屏填满
2. **吊灯**: 右上角的装饰性元素，大型钟形奶油灯罩带麻绳和猫爪吊坠，发光但不遮挡宠物主体
3. **信息卡**: 屏幕中下部位置的半透明毛玻璃卡片，浮在宠物图像上方
4. **整体色调**: 温暖明亮，以暖黄(#FFD6A5)、奶油白(#FFF8E7)、浅棕(#B8956A)为主色系
5. **底部导航**: 5个Tab的标准底部导航栏，中间加号凸起

本次修复聚焦于将当前实现调整为目标设计的视觉效果。

## Agent Extensions

### Skill

- **impeccable**
- Purpose: 对修复后的UI进行精细化打磨和验证，确保视觉质量达到目标设计水准
- Expected outcome: 产出经过专业审美校准的前端界面调整建议

### MCP

- **MCP Server Playwright**
- Purpose: 在代码修改后启动浏览器进行实际截图验证，确认视觉效果是否达标
- Expected outcome: 截图对比确认5项修复全部生效