---
name: lamp-redesign-complete
overview: 重新设计灯组件（新样式+可见顶部灯绳+气泡完整展示+图片缩小）
design:
  architecture:
    framework: react
  styleKeywords:
    - Warm Night Lamp
    - Round Glow
    - Cream Gold
    - Pet Paw Charm
    - Soft Shadow
    - Cozy Ambient
  fontSystem:
    fontFamily: "-apple-system, SF Pro Display, PingFang SC, sans-serif"
    heading:
      size: 26px
      weight: 700
    subheading:
      size: 17px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#F5B942"
      - "#FFD54F"
      - "#FFF8E8"
    background:
      - "#FEF3D8"
      - "#FFFFFF"
      - "#FFFDF5"
    text:
      - "#7A6850"
      - "#555555"
      - "#1A1A1A"
    functional:
      - "#A8946E"
      - "#F5B0BF"
      - "#FFE89A"
todos:
  - id: move-lamp-level
    content: 将 CreamBellLamp 组件从 hd-hero-section 提升到 hd-page 级别(解决气泡截切+灯绳裁切)
    status: completed
  - id: redesign-lamp-svg
    content: 使用 [skill:impeccable]+[skill:frontend-design] 重写 SVG 灯罩为圆形暖光小夜灯(椭圆罩+发光核+高光+金边)
    status: completed
    dependencies:
      - move-lamp-level
  - id: fix-top-cord-visible
    content: 用 CSS ::before 伪元素实现可见顶部灯绳(正z-index+渐变色+从顶端垂下)
    status: completed
    dependencies:
      - move-lamp-level
  - id: shrink-pet-photo
    content: 缩小宠物图片 240x285 → 200x245 给灯和气泡腾空间
    status: completed
  - id: fix-bubble-position
    content: 重新定位气泡确保在灯右侧完整显示(箭头朝左+不被裁切)
    status: completed
    dependencies:
      - move-lamp-level
  - id: lint-verify-screenshot
    content: lint零错误验证 + [mcp:MCP Server Playwright] 截图确认最终效果
    status: completed
    dependencies:
      - redesign-lamp-svg
      - fix-top-cord-visible
      - shrink-pet-photo
      - fix-bubble-position
---

## 产品概述

修复 HomePetOS 首页右上角装饰灯组件的 4 个关键问题，使其达到设计图级别的视觉效果。

## 核心问题（从用户截图确认）

### 问题1：右侧文字气泡被截断

- 现象："拉一下 切换宠物" 气泡只显示一半，右边缘被屏幕裁切
- 根因：`.hd-page` 设置了 `overflow: hidden` + `position: fixed`，而 `.hd-main` 限制 `max-width: 480px`。气泡定位在 `left: calc(100% + 8px)` 超出了 480px 容器宽度，被父级 overflow:hidden 裁切

### 问题2：顶部灯绳不可见

- 现象：代码中已有 `.lamp-top-cord` SVG 但渲染不出来
- 根因：`z-index: -1` 被父容器背景色覆盖；且 `top: -180px` 的位置虽然 `.hd-hero-section` 是 `overflow: visible`，但更上层的 `.hd-page` 是 `overflow: hidden`，绳子延伸到可视区域外被裁切

### 问题3：灯样式不够好看

- 当前：花边扇贝裙摆式灯罩（12个扇贝弧 path），视觉复杂但效果一般
- 需求：换为更好看的灯样式

### 问题4：中间宠物图片太大

- 当前：240x285px，挤压了右侧灯和气泡的空间
- 需求：缩小图片给灯和气泡留出空间

## 修改目标

1. **宠物图片缩小** — 从 240x285 缩小到约 200x245
2. **全新灯样式** — 采用圆形暖光小夜灯风格（类似截图中右上角的发光圆灯），简洁精致
3. **顶部可见灯绳** — 从屏幕最顶端垂下的真实吊绳，使用正 z-index 确保不被遮挡
4. **气泡完整展示** — 改变定位策略确保不被裁切，完整显示"拉一下 切换宠物"文字
5. **保留拉拽交互** — 所有弹簧拉伸、变亮、切换宠物的交互逻辑保持不变

## Tech Stack

- React 19 + TypeScript (现有项目不变)
- 原生 SVG 绘制新灯样式
- 原生 CSS (home-dashboard.css)

## 架构决策与根因修复方案

### 容器层级分析（已验证）

```
.hd-page (position:fixed, overflow:hidden, 100vw x 100vh)
  └── .hd-main (max-width:480px, margin:0 auto, relative)
        └── .hd-hero-section (overflow:visible, min-height:280px)
              └── .cream-lamp (absolute, top:-45px, right:16px)
                    ├── .lamp-top-cord (top:-180px, z-index:-1) ← 被遮挡+裁切
                    ├── .lamp-svg (90px宽)
                    ├── .lamp-paw-ring
                    └── .lamp-hint-bubble (left:100%+8px) ← 超出480px被裁
```

### 关键修复策略

#### A. 气泡不截切的解决方案

将灯组件从 `.hd-hero-section` 内部**提升到 `.hd-page` 级别**（与 hd-main 同级），这样：

- 灯和气泡不受 `.hd-main` 的 max-width:480px 限制
- 使用相对于视口的绝对定位（right: 20px 等），气泡有足够空间向左展开
- 灯绳可以从屏幕最顶端垂下而不被任何 overflow:hidden 截切

#### B. 灯绳可见的解决方案  

- 将灯绳从独立的 `.lamp-top-cord` SVG 改为**直接内嵌在主灯 SVG 的 viewBox 中**，作为 viewBox 顶部的线条
- 这样灯绳随灯的 SVG 一起渲染，不存在层级/z-index 问题
- 或者：将灯绳用 CSS `::before` 伪元素画在 `.cream-lamp` 上，使用正 z-index，从 top:0 开始向下延伸到灯罩顶部

选择**方案2（CSS伪元素）**：更简单可靠，z-index 可控，长度自适应。

#### C. 新灯设计方案：暖光圆球小夜灯

参考截图中的风格，采用以下设计：

**形状**: 圆形/略扁椭圆灯罩（像一个小灯笼球），不是花边了

```
    ┌──────┐
   ╱  ☼    ╲   ← 圆形灯罩，内部暖黄发光
  │  暖光   │     中央亮斑 + 径向渐变
   ╲       ╱
    └──┬─┘
       │        ← 细绳（从屏幕顶端垂下）
      [🐾]      ← 粉色猫爪吊坠
```

**核心元素**:

1. **圆形灯罩**: rx:30 ry:28 的椭圆，填充奶油白→浅黄渐变
2. **中央发光核**: 强径向渐变 #FFFFFF(中心) → #FFE89A → transparent，带 diffuseGlow 滤镜
3. **高光点**: 左上角 2-3 个白色圆模拟玻璃反光
4. **灯罩边缘**: 微妙的金色描边 + 投影增加立体感
5. **顶部挂环**: 小椭圆金属环连接灯绳
6. **灯绳**: CSS 伪元素从屏幕顶端垂下（棕褐色渐变）
7. **底部猫爪**: 保持现有的可爱粉嫩猫爪不变

#### D. 图片缩小

`.hd-pet-photo`: 240x285 → **200x245**
`.hd-pet-photo-placeholder`: 同步缩小

## 文件修改清单

```
src/pages/HomePetOS.tsx          [MODIFY] - 灯组件JSX结构重构+新SVG灯罩+移至页面级
src/styles/home-dashboard.css    [MODIFY] - 灯CSS重写+图片尺寸缩小+气泡定位修复+灯绳样式
```

## 设计方案：暖光圆球小夜灯

### 设计理念

抛弃之前的花边扇贝造型，改为**简约精致的圆形暖光灯罩**。灵感来自截图中右上角那种发光的小圆灯 —— 温暖、柔和、像一个真正的小夜灯挂在角落。

### 页面规划

#### Block 1: 全新圆形灯罩 (Round Glow Lamp)

- **形状**: 略扁椭圆 (rx:32 ry:29)，类似中式小灯笼或圆球形夜灯
- **填充**: 径向渐变，中心奶白(#FFFEF8) → 边缘暖黄(#F5E0B0)，半透明让内部光透出
- **发光**: 内部强径向渐变光核 + 多层高斯模糊(diffuseGlow)，拉拽时亮度增强
- **反光**: 左上侧 2 条弧形白色高光线(0.35~0.5透明度)，模拟玻璃曲面反光
- **描边**: 极细金色描边(strokeWidth:0.8, #E8D0A0)增加轮廓清晰度
- **投影**: 外层 drop-shadow 金黄色柔和投影

#### Block 2: 顶部可见吊绳 (Top Cord)

- **实现方式**: CSS `::before` 伪元素（非独立SVG）
- **起点**: 屏幕最顶端(top: 0 或负值延伸出 hero-section)
- **终点**: 灯罩顶部挂环位置
- **颜色**: 渐变 — 顶端淡褐(rgba) → 底端深棕(#A8946E)
- **宽度**: 1.8px，带右侧微高光线(0.4px rgba白)增加立体感
- **z-index**: 正值(>0)，确保不被背景遮挡

#### Block 3: 猫爪吊坠 (Paw Pendant)

- 保持现有猫爪设计不变（粉色肉垫渐变 + 掌垫+4趾垫 + 高光）
- 位置在灯罩底部通过短绳连接

#### Block 4: 右侧提示气泡 (Hint Bubble)

- **位置**: 相对于灯容器，向右偏移(left: 100% + 10px)，垂直居中对齐灯罩
- **方向**: 左箭头指向灯
- **内容**: "拉一下 / 切换宠物" 两行文字
- **保证不被截切**: 灯容器提升到页面级别定位，不受 480px 限制

#### Block 5: 宠物照片缩小

- 从 240x285 缩至 **200x245**
- border-radius 保持 16px

### Skill

- **impeccable**
- Purpose: 审计和优化新灯样式的视觉质量，确保圆形暖光灯罩达到精致、专业的视觉效果
- Expected outcome: 产出高质量的灯组件设计，避免粗糙的AI美学，确保发光效果自然、比例协调
- **frontend-design**
- Purpose: 生成高质量的生产级前端代码，精确实现新的圆形灯罩SVG、灯绳CSS、气泡定位
- Expected outcome: 精确还原暖光圆球灯的视觉效果，确保灯绳可见、气泡不截切、布局协调