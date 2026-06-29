---
name: single-light-source-immersive-redesign
overview: 将当前宠物APP UI重构为"单光源沉浸式空间系统"：猫爪灯作为唯一光源控制器驱动所有视觉层级，背景降级为氛围层，UI卡片被灯光照亮，实现"被猫爪灯照亮的宠物房间"效果。
design:
  architecture:
    framework: react
  styleKeywords:
    - Single-Light Immersive Space
    - Directional Lighting
    - Glassmorphism
    - Warm Ambient Glow
    - Soft Bloom
    - Atmospheric Depth
  fontSystem:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    heading:
      size: 26px
      weight: 800
    subheading:
      size: 17px
      weight: 700
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#FFD6A5"
      - "#F5B942"
      - "#E8A84C"
    background:
      - rgba(30, 25, 20, 0.35)
      - rgba(255, 245, 230, 0.08)
    text:
      - "#FFFDF8"
      - "#E8DCC8"
      - "#B8A080"
    functional:
      - "#FF9EB5"
      - "#7C9885"
      - rgba(255, 214, 165, 0.40)
todos:
  - id: bg-atmosphere-downgrade
    content: 用 [skill:impeccable] 重构 PetBackground + CSS：idle状态始终应用背景降级滤镜(blr/bri/sat/scale)，让宠物照片变为情绪底图
    status: completed
  - id: card-directional-light
    content: 用 [skill:frontend-design] 重构 immersive-pet-card CSS：降低背景透明度至0.12、增加backdrop-blur到20px、叠加右到左的方向性光照渐变模拟光源照射
    status: completed
    dependencies:
      - bg-atmosphere-downgrade
  - id: light-system-upgrade
    content: 升级光效系统CSS：增强lamp-glow-halo idle可见度、扩大lamp-light-cone范围和强度、提升lamp-ambient-layer opacity上限到0.25、新增soft-bloom效果
    status: completed
    dependencies:
      - card-directional-light
  - id: lamp-hero-promotion
    content: 用 [skill:impeccable] 升级灯组件为主角：LampSwitch容器加lamp-swing-idle动画、增强idle态光晕可见性、调整HomePetOS中ambientIntensity上限和计算曲线
    status: completed
    dependencies:
      - light-system-upgrade
  - id: ui-elements-adapt
    content: 适配顶层UI元素到深色背景环境：topbar按钮、标签、文字颜色等在暗背景下保持可读性和玻璃质感一致性
    status: completed
    dependencies:
      - lamp-hero-promotion
  - id: verify-lint-preview
    content: 运行lint检查确认无错误，验证所有改动文件语法正确、CSS变量引用完整、无遗漏的旧样式冲突
    status: completed
    dependencies:
      - ui-elements-adapt
---

## 产品概述

将当前宠物APP首页改造成**单光源沉浸式空间系统**：猫爪灯作为唯一光源控制器，所有UI被灯光影响，背景降级为氛围底图。不改变任何功能逻辑（拉灯切换宠物、抽屉菜单、数据加载等全部保留），只重构视觉层级和光效系统。

## 核心需求

### 1. 光源系统升级

- 右侧猫爪灯 = 唯一光源中心 (right side, ~90% 8%)
- light radius = 260px soft gradient radial glow
- 光效包含：radial glow + directional fade + soft bloom + warm tone (#FFD6A5)
- idle: 微弱暖光 | dragging: glow radius 递增 | triggered: flash + ripple + screen dim

### 2. 背景降级为氛围层

- **始终**应用降级滤镜（不仅是 drawer 打开时）：
- filter: blur(20px) brightness(0.55) saturate(0.7) scale(1.12)
- 背景只作为"情绪底图"，不能抢视觉焦点
- 抽屉打开时进一步加深暗化

### 3. UI卡片玻璃重构

- background: rgba(255,255,255,0.12)（降低透明度）
- backdrop-filter: blur(20px)（增加模糊）
- border: 1px solid rgba(255,255,255,0.18)
- **方向性光照**: 卡片右侧更亮、左侧更暗（模拟右侧光源照射）
- soft shadow + directional from right light source

### 4. 猫爪灯视觉升级为主角

- Glow Halo 增强（idle 时也有可见光晕）
- Rope 垂直可见性增强
- Soft bounce motion (lamp-swing-idle 已有，需确保启用)
- Drag 交互实时影响全局光强（ambientIntensity 从 0.06 上限提升到 ~0.25）

### 5. 强制视觉层级

1. 猫爪灯（最强 z-index + 视觉权重）
2. 光照范围/光锥（第二层）
3. UI卡片（被照亮的玻璃层）
4. 背景宠物图（最弱，始终模糊暗淡）

### 6. 禁止项

- 灯作为装饰（必须是有功能的光源核心）
- 背景太清晰
- 白色实心卡片（必须是半透明玻璃）
- 无光影方向（必须有右侧→左侧的明暗过渡）
- 多光源混乱（只有猫爪灯一个光源）

## Tech Stack

- **框架**: React + TypeScript (已有项目)
- **样式**: 内联 Style + CSS Variables + home-dashboard.css
- **光效实现**: CSS radial-gradient / conic-gradient / box-shadow / backdrop-filter / CSS filter
- **动画**: CSS transitions + @keyframes（无新依赖）
- **状态管理**: React useState + useCallback（已有模式）

## Implementation Approach

### 核心策略：纯CSS光效 + React state驱动强度

不引入任何新依赖。利用现有架构：

1. `LampSwitch` 的 `lightIntensity` (0~1) 通过 `onLightIntensityChange` 回调传给 `HomePetOS`
2. `HomePetOS` 将 `ambientIntensity` 注入 `lamp-ambient-layer` 的 CSS variable
3. 所有光效通过 CSS 变量和伪元素实现，React 只控制"强度参数"

### 关键技术决策

| 决策点 | 方案 | 理由 |
| --- | --- | --- |
| 背景始终降级 | PetBackground 默认应用 blur+brightness+scale 滤镜 | 符合"情绪底图"要求 |
| 卡片方向光照 | 用 ::after 伪元素做 linear-gradient(90deg, transparent, rgba(255,220,150,0.08)) 叠加 | 纯CSS，性能好 |
| 全局光强提升 | ambientIntensity上限从 0.06 提升到 0.25 | 当前太弱看不到效果 |
| 光源位置固定 | fixed 定位在 right:~24px top:~90px | 匹配 LampSwitch 实际位置 |
| 灯组件摇摆 | 给灯容器加 lamp-swing-idle animation | 已有keyframe定义，只需应用 |


### Architecture Impact

```
HomePetOS.tsx (修改)
├── ambientIntensity 计算调整 (0 → 0.25 上限)
├── lamp-ambient-layer 接收更强 opacity
└── 结构不变

PetBackground.tsx (修改)
└── idle 状态也应用降级滤镜 (blur/brightness/saturate/scale)

home-dashboard.css (大改)
├── :root CSS变量更新（光源参数）
├── .immersive-pet-card 方向光照叠加
├── .lamp-glow-halo idle 可见度增强
├── .lamp-light-cone 扩大 + 增强
├── .lamp-ambient-layer 上限提升
├── .immersive-ui-layer 子元素微调
└── 新增 .light-directional-overlay 类

LampSwitch.tsx (小改)
├── 容器加 lamp-swing-idle 动画类
└── 可能微调光强计算曲线
```

## Implementation Notes (Execution Details)

1. **背景降级**: PetBackground 在 `isDrawerOpen=false` 时也要应用滤镜，但程度比 drawer 打开时轻一些（如 blur(16px) vs blur(20px)），避免完全看不清
2. **性能**: backdrop-filter 和 filter 是合成层属性，对GPU友好。但避免在滚动区域大量使用
3. **Blast radius 控制**: 仅改视觉样式不改功能逻辑。所有 props 接口不变
4. **CSS变量优先**: 新增的光效参数通过 :root CSS变量统一定义，方便后续调优
5. **兼容性**: -webkit-backdrop-filter 必须保留（iOS Safari 需要）

## Directory Structure

```
src/
├── pages/
│   └── HomePetOS.tsx          # [MODIFY] ambientIntensity 上限提升 + 灯容器加动画class
├── components/
│   ├── PetBackground.tsx      # [MODIFY] idle状态也应用降级滤镜
│   ├── LampSwitch.tsx         # [MODIFY] 灯容器加摇摆动画 + idle光晕增强
│   ├── CatPawHandle.tsx       # [MINOR] 可能微调idle发光
│   ├── Rope.tsx               # [保持] 已在上轮加深
│   └── GlassOverlay.tsx       # [保持]
└── styles/
    └── home-dashboard.css     # [MODIFY 大量] 背景/卡片/光效全量CSS更新
        ├── :root 变量（光源强度参数上调）
        ├── .immersive-pet-card（方向光照叠加）
        ├── .lamp-glow-halo（idle可见度↑）
        ├── .lamp-light-cone（范围↑ 强度↑）
        ├── .lamp-ambient-layer（opacity上限↑）
        └── .immersive-topbar/.action-btn等（适配更深背景）
```

## 设计风格：单光源沉浸式空间 (Single-Light Immersive Space)

整体设计理念是"一个被猫爪灯照亮的温暖宠物房间"。所有UI元素都像是漂浮在被灯光影响的半透明介质中。

### 视觉层次

1. 最底层：模糊暗淡的宠物照片（情绪底图，几乎抽象）
2. 第二层：从右侧灯位扩散的柔和光锥和径向光晕
3. 第三层：半透明玻璃质感的信息卡片，右侧边缘被照亮、左侧渐暗
4. 最顶层：右侧猫爪吊灯（视觉主角，最强的发光体和交互热区）

### 关键视觉效果

- **方向性照明**: 所有卡片都有从右到左的微妙明暗渐变，模拟真实点光源
- **空气透视**: 远离灯的区域（左上角）自然变暗变冷，靠近灯的区域（右下角）更暖更亮
- **玻璃折射感**: 卡片不是扁平透明，而是像真实毛玻璃一样有厚度和折射
- **光源呼吸**: idle态灯光有极缓慢的脉动（4-6秒周期），dragging时光圈扩大并加速脉动

## Agent Extensions

### Skill: impeccable

- **Purpose**: 对整个单光源沉浸式系统进行精细化打磨 — 包括光效参数调优（曲线/半径/过冲比例）、卡片玻璃质感优化（方向光照渐变/边框/阴影层级）、背景降级滤镜的精确数值（blur/brightness/saturation平衡）、以及灯组件的视觉主角地位强化
- **Expected outcome**: 输出经过高端产品级调优的完整CSS参数集和组件样式，确保最终呈现"被猫爪灯照亮的宠物房间"沉浸感

### Skill: frontend-design

- **Purpose**: 创建/优化单光源系统中各层的视觉表现 — 背景氛围层、光锥扩散层、玻璃卡片层、灯本体层 — 确保各层之间的视觉关系符合物理光照逻辑
- **Expected outcome**: 各层CSS样式的具体实现代码，包括渐变、模糊、阴影、动画等细节