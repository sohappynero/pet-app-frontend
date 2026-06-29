---
name: visual-unification-single-light-source
overview: 纯视觉重构：将7个文件（6组件+1CSS）统一为"单光源宠物UI系统"。核心改动：(1)背景降低存在感blur16px/brightness0.65/saturation0.8 (2)所有卡片统一glassmorphism rgba(255,255,255,0.18)/blur18px (3)猫爪拉灯升级为光源核心加glow halo+light cone+光强变化 (4)阴影统一左上投射 (5)禁止白色实心块。不改任何功能逻辑。
design:
  architecture:
    framework: react
  styleKeywords:
    - Single-Light Source Composition
    - Soft Glassmorphism
    - Warm Beige Tone
    - Ambient Lighting System
    - Unified Shadow Hierarchy
    - Pastel Cat Paw Lamp
  fontSystem:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    heading:
      size: 24px
      weight: 800
    subheading:
      size: 17px
      weight: 700
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#FFD6A5"
      - "#FFE4BC"
      - "#F7E7D3"
      - "#5D4E37"
    background:
      - "#F7E7D3"
      - rgba(255,255,255,0.18)
      - rgba(255,214,165,0.04)
    text:
      - "#5D4E37"
      - "#B8956A"
      - "#C4A882"
    functional:
      - rgba(255,214,165,0.50)
      - rgba(255,214,165,0.20)
      - rgba(255,180,100,0.35)
      - rgba(255,158,181,0.30)
      - rgba(124,152,133,0.18)
todos:
  - id: rewrite-css-vars-glass
    content: 重写 home-dashboard.css 的 CSS 变量和全部 immersive-* 样式：--sg-card-bg 降至 0.18、统一阴影 -8px 8px、新增 .lamp-glow-halo/.lamp-light-cone/.lamp-ambient 光源样式类
    status: completed
  - id: fix-background-layer
    content: "修改 PetBackground.tsx: filter 值改为 blur(16px)+brightness(0.65)+saturate(0.8)，抽屉态 blur(20px)+brightness(0.55)"
    status: completed
  - id: fix-overlay-layer
    content: "修改 GlassOverlay.tsx: bg rgba(255,255,255,0.25)→0.18, blur 8px→16px"
    status: completed
  - id: fix-drawer-glass
    content: "修改 Drawer.tsx: bg 0.25→0.18, boxShadow 改为 -8px 8px 32px 左上投射方向, border 统一"
    status: completed
  - id: upgrade-lamp-core
    content: "升级 LampSwitch.tsx: 新增 glow-halo 光晕环 + light-cone 光锥 + ambient 回调, 光强随 idle/dragging/triggered 状态动态变化, 使用 [skill:impeccable] 打磨光效品质"
    status: completed
  - id: upgrade-paw-and-rope
    content: 升级 CatPawHandle.tsx(glow halo 增强 + 光强随 dragY 变化) 和 Rope.tsx(加发光 + 颜色随灯状态变暖), 使用 [skill:frontend-design] 优化光效 CSS
    status: completed
  - id: fix-homepetos-cards
    content: "修改 HomePetOS.tsx: 信息卡 bg 和菜单按钮 bg 内联 style 降至 rgba(255,255,255,0.18), 确保 UI 层完全玻璃化"
    status: completed
  - id: verify-lint-visual
    content: 运行 tsc --noEmit 验证编译通过, 启动 dev server 用 [MCP:Playwright] 截图确认最终视觉效果
    status: completed
    dependencies:
      - rewrite-css-vars-glass
      - fix-background-layer
      - fix-overlay-layer
      - fix-drawer-glass
      - upgrade-lamp-core
      - upgrade-paw-and-rope
      - fix-homepetos-cards
---

## 产品概述

对当前沉浸式首页进行**纯视觉重构**，不修改任何功能逻辑。目标是建立**"单光源宠物UI系统"**——以右侧猫爪拉灯为唯一光源中心，统一所有组件的 glassmorphism 风格、阴影方向、背景处理和光效反馈。让 UI 看起来像"一个被猫爪灯照亮的沉浸式宠物空间"，而非组件拼装页面。

## 当前问题诊断

1. **背景过于抢戏**: PetBackground 的 blur(12px) + brightness(0.75|1) 不够弱化，背景图仍然喧宾夺主
2. **白色实心卡片泛滥**: `--sg-card-bg: rgba(255,255,255,0.65)` 透明度仅 65%，视觉上接近纯白实心块，与玻璃风格矛盾
3. **玻璃风格不一致**: 菜单按钮 `rgba(255,255,255,0.45)`、抽屉 `rgba(255,255,255,0.25)`、遮罩 `rgba(255,255,255,0.25)` 三套不同透明度标准
4. **多光源/无光源感**: 猫爪拉灯只是普通交互件，没有光晕、光锥等光源特征，无法形成"被照亮"的视觉叙事
5. **阴影方向混乱**: 卡片用 `0 12px 40px`(向下)、抽屉用 `4px 0 40px`(向右)，缺乏统一的单光源方向

## 核心功能（纯视觉，功能不变）

### 1. 全局光源系统 — 右侧猫爪灯为唯一光源

- 所有高光边缘朝向右下角（光源方向）
- 所有阴影向左上投射（反向光源），统一使用 `-8px 8px 24px` 方向偏移
- 光源强度随拖拽状态变化：idle 微亮 → dragging 渐强 → triggered 满亮度 → transition 衰减

### 2. 背景层降级处理

- 默认态: `blur(16px) brightness(0.65) saturate(0.8)` — 大幅降低存在感
- 抽屉打开态: `blur(20px) brightness(0.55) saturate(0.7)` — 进一步退后

### 3. 统一 Glassmorphism 卡片规范

- 所有卡片/面板/按钮统一为: `background: rgba(255,255,255,0.18)`, `backdrop-filter: blur(18px)`, `border: 1px solid rgba(255,255,255,0.25)`
- 彻底禁止白色实心背景和超过 30% 不透明度的元素

### 4. 猫爪拉灯升级为视觉核心

- 新增 Glow Halo: 围绕灯体的脉动光晕环（radial-gradient + pulse 动画）
- 新增 Light Cone: 从灯位置向下扩散的光锥（conic-gradient + opacity 渐变）
- 新增 Ambient Light Layer: 全屏微弱的暖色调环境光叠加
- 拖拽时光强动态变化: glow 半径、light cone 角度、ambient opacity 随 dragY 线性变化

### 5. 信息卡玻璃化修复

- 主信息卡从 0.65 不透明度降至 0.18 真玻璃
- 标签、头像、按钮全部改为半透明玻璃质感
- 统一内间距为 16px / 24px 两档

## 设计约束

- **禁止**: 白色实心卡片、多光源效果、背景抢主体、装饰性UI分裂
- **动画时长**: 所有动画 <= 420ms
- **曲线**: 统一 cubic-bezier(0.2, 0.8, 0.2, 1)

## Tech Stack

- React 18 + TypeScript (不变)
- CSS 自定义属性 (home-dashboard.css)
- lucide-react 图标库 (不变)

## 实现方案

### 架构策略：纯样式+微调内联值，不动组件结构和数据流

所有改动集中在两个维度：

1. **CSS 变量系统重定义** (`home-dashboard.css` 的 `:root` 和 `.immersive-*` 类)
2. **6 个组件的内联 style 值调整** (blur/brightness/saturation 值、透明度、box-shadow 方向、新增光效元素)

### 改动范围矩阵

| 文件 | 改动类型 | 具体内容 |
| --- | --- | --- |
| `home-dashboard.css` | [MODIFY] 重写 CSS 变量 + 全部 immersive-* 样式 + 新增 lamp-light-* 光源样式 | ~400 行变更 |
| `PetBackground.tsx` | [MODIFY] filter 值: blur 12→16, brightness 0.75→0.65, 新增 saturate(0.8) | ~3 行值改 |
| `GlassOverlay.tsx` | [MODIFY] bg 0.25→0.18, blur 8→16 | ~2 行值改 |
| `Drawer.tsx` | [MODIFY] bg 0.25→0.18, shadow 方向改左上 | ~3 行值改 |
| `CatPawHandle.tsx` | [MODIFY] 增强 glow halo 范围 + 光强随 dragY 变化 | ~10 行改 |
| `Rope.tsx` | [MODIFY] 加发光效果 + 颜色随灯状态变暖 | ~8 行改 |
| `LampSwitch.tsx` | [MODIFY] 新增 light cone 元素 + glow halo + ambient 层 + 状态驱动的光强 class | ~40 行新增 |
| `HomePetOS.tsx` | [MODIFY] 信息卡和菜单按钮的内联 style 透明度降至 0.18 | ~4 行值改 |


### 关键设计决策

1. **CSS 变量 `--sg-card-bg` 从 0.65 降到 0.18**: 这是消除"白色实心卡"的根本修复，影响所有使用该变量的 immersive-pet-card 等组件
2. **统一阴影方向为 `-8px 8px 24px rgba(0,0,0,0.08)`**: 模拟来自右侧光源的左上投影，替换当前散乱的阴影值
3. **LampSwitch 新增 3 个光效子元素**（纯装饰性 div，不影响交互逻辑）:

- `.lamp-glow-halo`: 径向渐变光晕 + pulse 动画
- `.lamp-light-cone`: 锥形渐变向下扩散
- `.lamp-ambient`: 全屏极淡暖色叠加层（由 LampSwitch 通过 state 回传给 HomePetOS 控制显示）

4. **背景 saturate(0.8)**: 降低色彩饱和度让背景更"安静"，不抢前景注意力
5. **性能考量**: 所有光效使用 CSS animation/transition，无 JS 计算循环；backdrop-filter 已在 GPU 合成层；light cone 使用 fixed 定位 pointer-events-none

### 数据流变更

LampSwitch 需要新增一个回调 prop `onLightIntensityChange?: (intensity: number) => void`，将拖拽过程中的光强比例 (0~1) 回传给父组件 HomePetOS，用于驱动全屏 ambient light 层的不透明度变化。这是唯一的新增 props，不影响现有功能。

## 设计风格：Single-Light Soft Glass

整体采用**"单光源 Soft Glass"**视觉体系——整个界面如同一个被右侧暖色点光源照亮的半透明玻璃空间。

### 核心视觉隐喻

想象一个昏暗温暖的房间里，右侧悬挂着一盏发出柔橙黄色光芒的小灯。房间中的物体（信息卡、菜单、按钮）都是磨砂玻璃材质，被这盏灯从右上方照亮——它们的右边缘有微妙的高光，左下方投射出柔和的阴影。背景是一幅大幅的宠物照片，但经过强烈模糊和暗化处理，如同隔着一层磨砂玻璃远远看去，只提供氛围而不抢夺注意力。当你拉动灯绳，灯光变亮，整片空间的光影随之增强；触发切换时，灯光闪烁一次，背景短暂暗淡再恢复。

### 页面规划（单页，4 层结构不变）

#### Block 1: Layer 1 — 降级处理的全屏背景

- 宠物大图作为底层氛围，始终处于 `blur(16px) brightness(0.65) saturate(0.8)` 的弱化状态
- 抽屉打开时进一步退至 `blur(20px) brightness(0.55)`
- 叠加一层从右下到左上的微弱径向渐变（模拟光照衰减），右上最亮、左下最暗

#### Block 2: Layer 2 — 极淡毛玻璃遮罩

- 仅抽屉打开时出现，`rgba(255,255,255,0.18) blur(16px)`
- 比之前更淡、更模糊，进一步压低背景层级

#### Block 3: Layer 3 — UI层（顶部栏 + 底部浮起信息卡）

- **顶部菜单按钮**: 44px 圆角正方形玻璃按钮 `rgba(255,255,255,0.18) blur(18px)`，边框 `rgba(255,255,255,0.25)`
- **底部主信息卡**: 约 340px 宽的圆角玻璃卡片，真·半透明 `rgba(255,255,255,0.18)`，内容区域包含：
- 头像区: 100px 圆角方形头像 + 玻璃边框
- 名称行: 大字标题 + 玻璃收藏按钮
- 属性标签: 3 个等宽玻璃小胶囊（性别/年龄/体重）
- 主人栏: 头像 + 名字 + 操作按钮组
- 描述文字: 可展开文本
- 所有内部元素间距严格遵循 16px（紧凑）和 24px（宽松）两档
- 卡片阴影统一 `-8px 8px 24px rgba(0,0,0,0.07)` 左上投射

#### Block 4: Layer 4a — 左侧玻璃抽屉

- 280px 宽玻璃面板，`rgba(255,255,255,0.18) blur(18px)`
- 右侧 24px 圆角，左侧直边
- 阴影 `-8px 8px 32px rgba(0,0,0,0.1)` 向左上深投影
- 6 个菜单项图标使用玻璃小方块底座

#### Block 5: Layer 4b — 猫爪拉灯（视觉核心，重点改造）

这是本次重构的核心亮点。拉灯不再只是一个交互手柄，而是整个界面的**唯一光源控制器**：

- **Glow Halo**: 灯体周围的多层径向渐变光晕，idle 时微弱脉动，dragging 时扩展并增亮，triggered 时爆发闪烁
- **Light Cone**: 从灯位置向下扩散的锥形光线（120度角），覆盖屏幕下半部分，营造"灯光照亮信息卡"的视觉效果
- **Ambient Layer**: 全屏极淡的暖橙色叠加层（opacity 0~0.06），随拖拽强度变化
- **灯绳**: 从灯座到猫爪的连接线，带有微发光效果，颜色从米白(idle)渐变为暖橙(dragging)
- **猫爪手柄**: 保持 pastel 风格 SVG，外圈 glow 效果增强，拖拽时 scale 1.15 + 光晕扩散
- **状态光强映射**: idle=0.15, dragging=0.15~0.7(线性), triggered=1.0, transition=0.7→0.15(衰减)

### 色彩层次（从暗到亮）

1. 最暗: 背景 pet image (brightness 0.65, saturate 0.8)
2. 暗: 全屏 ambient overlay (rgba(255,200,120, 0~0.06))
3. 中间: 玻璃卡片/抽屉/按钮 (rgba(255,255,255,0.18))
4. 亮: 高光边缘 (border rgba(255,255,255,0.35))
5. 最亮: Light Cone 核心 + Glow Halo 中心 (rgba(255,220,150, 0.3~0.6))

## Skill 使用

### impeccable

- **Purpose**: 对视觉重构结果进行精细化打磨——确保 glassmorphism 一致性、光影层次正确、光效动画自然流畅、整体视觉达到 premium 级别的"单光源照明空间"感受
- **Expected Outcome**: 输出经过审查优化的代码，确保每个元素的透明度/模糊度/阴影方向/光强都符合"单光源"规则，消除任何残留的"组件拼装感"

### frontend-design

- **Purpose**: 为新增的 Light Cone / Glow Halo / Ambient Light 等光效元素生成高质量的 CSS 实现，确保视觉效果精致而非粗糙
- **Expected Outcome**: 产出光效相关的 CSS keyframes、gradient 组合和过渡动画代码