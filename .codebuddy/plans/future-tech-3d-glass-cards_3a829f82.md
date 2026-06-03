---
name: future-tech-3d-glass-cards
overview: 将快速记录区域改造为参考图片的未来科技感3D玻璃质感横向卡片：左侧大型3D水晶几何图形(80x80px) + 右侧内容区(标题/描述/渐变进度条/操作箭头)，使用蓝紫青科技色系、多层玻璃折射效果、悬浮光晕动画
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
      size: 12px
      weight: 500
  colorSystem:
    primary:
      - "#6366F1"
      - "#8B5CF6"
      - "#06B6D4"
      - "#10B981"
    background:
      - "#FFFFFF"
      - "#F8FAFC"
      - "#EEF2FF"
    text:
      - "#0F172A"
      - "#475569"
      - "#94A3B8"
    functional:
      - "#C7D2FE"
      - "#DDD6FE"
      - "#A5F3FC"
      - "#FDE68A"
todos:
  - id: rewrite-jsx-tech
    content: 使用[skill:frontend-design]重写Pets.tsx快速记录JSX：图标容器扩至92px正圆球体、新增status badge、accent bar改为进度条+状态行、箭头改为pill按钮
    status: completed
  - id: rewrite-css-tech
    content: 使用[skill:frontend-design]全面重写index.css中ph3d-hcard-*全部样式：3D球体(radial-gradient+伪元素圆环+高光点)、冷科技配色8套、增强微交互(hover 3D倾斜+圆环旋转+光晕)
    status: completed
    dependencies:
      - rewrite-jsx-tech
  - id: verify-effects
    content: 验证所有8张卡片渲染效果：球体3D质感、圆环可见性、进度条显示、hover 3D倾斜动画、AI卡极光特效
    status: completed
    dependencies:
      - rewrite-css-tech
  - id: check-nav
    content: 确认所有8个卡片点击导航路径完整无遗漏，无功能回归
    status: completed
    dependencies:
      - rewrite-css-tech
---

## Product Overview

将首页快速记录区域从当前的水平卡片布局，全面升级为**未来科技感3D玻璃球体风格**卡片。参考用户提供的设计稿(image.fbc8f7fb1b.png)，该设计稿展示了左侧大型半透明3D玻璃/水晶几何体(圆环+球体组合) + 右侧标题/副标题/渐变进度条/操作按钮的横向卡片布局。

## Core Features

### 当前状态

- 布局：单列纵向列表，每张卡片为水平排列（左侧68px圆角方块图标 + 标题/描述/4px色条 + 箭头）
- 图标：18px白色粗体字母(W/V/D/C/F/B/O/AI)，置于68x18px圆角玻璃容器内
- 配色：暖色调为主（琥珀/玫瑰红/橙色等）
- 微交互：hover上浮2px+图标缩放1.06+微旋转-2deg

### 目标设计（未来科技感3D风格）

**参考图核心特征提取：**

1. **左侧视觉区**：90-100px大型3D玻璃球体/圆环组合图形，蓝紫色调，多层半透明折射效果，内部有几何线条装饰
2. **右侧内容区**：

- 主标题（16-17px粗体深色）
- 副标题（灰色小字作者名风格）
- **粗渐变进度条**(6-8px高，full圆角，紫→蓝渐变) + 左侧"Ongoing"标签
- **操作按钮**("Start learning"风格：浅灰底+边框+圆角pill形状)

3. **整体氛围**：白底卡片、大圆角24px、极柔和投影、冷色调、科幻感

### 需要实现的改造点

| 改造项 | 当前 | 目标 |
| --- | --- | --- |
| 图标尺寸 | 68px 方块 | **92px 正圆球形** |
| 图标形状 | border-radius:18px | **border-radius:50% 球体** |
| 内部图案 | 无 | **CSS纯实现3D圆环+光线装饰** |
| 进度条 | 56×4px细条 | **80×6px粗进度条+状态标签** |
| 操作区 | ChevronRight箭头 | **pill形按钮("去记录")** |
| 配色 | 暖色调8套 | **冷科技色调8套**(紫/蓝/青/品红) |
| hover效果 | 上浮+缩放 | **3D倾斜+光晕扩散+内环旋转** |


## Tech Stack

- **框架**: React (TSX) — 保持现有架构不变
- **样式方案**: 纯CSS（index.css），不引入新依赖
- **3D效果实现**: CSS `radial-gradient` 多层叠加模拟球体体积 + `::before/::after` 伪元素绘制内嵌圆环 + `box-shadow` 多层营造光晕深度
- **动画**: CSS `@keyframes` 实现光环旋转/脉冲/流动

## Tech Architecture

### 修改范围（2个文件）

| 文件 | 修改位置 | 内容 |
| --- | --- | --- |
| `src/pages/Pets.tsx` | 第284-388行 ph3d-hcard-list 区块 | JSX结构重写：图标容器扩大+新增状态标签+操作按钮化 |
| `src/index.css` | 第9422-9754行 全部ph3d-hcard-*样式 | 全面重写为未来科技风3D球体样式 |


### 布局转换策略

```
Before (Current):
┌──────────────────────────────────────────────┐
│ ┌──────┐  体重记录                    >     │
│ │  W   │  追踪宠物体重变化趋势        ──    │
│ │ 68px │                                    │
│ └──────┘                                    │
└──────────────────────────────────────────────┘

After (Future Tech):
┌─────────────────────────────────────────────────────┐
│                                                     │
│    ╭────────╮                                       │
│  ╱    ◎    ╲  体重记录                  ┌────────┐  │
│ │   ◯  ◉   │  健康数据追踪              │ 去记录  │  │
│  ╲  ○      ╱  ●●●●●●●○○○  进行中       └────────┘  │
│    ╰────────╯                                       │
│    92px球体                                         │
└─────────────────────────────────────────────────────┘
```

### 3D球体CSS实现策略

```
.ph3d-tech-orb (92x92px 正圆)
├── background: radial-gradient(at 30% 30%, 浅色, 深色) — 球体基础体积
├── box-shadow: 多层外发光 — 外部光晕
├── inset shadow: 底部暗部 — 球体立体感
├── ::before — 内嵌大圆环 (border-radius:50% + border + transform:rotate)
├── ::after — 高光反射点 (radial-gradient 白色椭圆)
└── .tech-orb-ring — 第二层小圆环(旋转动画)
```

## Implementation Details

1. **JSX结构调整要点**:

- `.ph3d-hcard-glass` → `.ph3d-tech-orb` (尺寸68→92px，方形→正圆)
- 新增 `.ph3d-tech-status` ("进行中" / "待记录")
- `.ph3d-hcard-accent` → 加宽加高变为进度条样式
- `.ph3d-hcard-action` ChevronRight → 文字按钮 "去记录"
- 保留所有onClick导航逻辑

2. **CSS重写核心要点**:

- 卡片padding加大(20px)，border-radius提升至24px
- 球体使用`radial-gradient`从左上到右下的明暗过渡模拟光源
- 内嵌圆环用`border`(2-3px半透明)+`border-radius:50%`+绝对定位偏移实现
- 8种配色全部转为**冷科技色调系**

3. **色彩系统映射(新)**:

| 记录项 | 新科技配色 | 渐变方向 | 关键词 |
| --- | --- | --- | --- |
| 体重记录 | #6366f1 → #4338ca | 靛蓝深紫 | Indigo Deep |
| 疫苗记录 | #8b5cf6 → #7c3aed | 电光紫 | Electric Violet |
| 驱虫记录 | #06b6d4 → #0891b2 | 青碧色 | Cyan Teal |
| 体检记录 | #10b981 → #059669 | 翡翠绿 | Emerald |
| 饮食记录 | #f59e0b → #d97706 | 琥珀橙 | Amber(唯一暖色保留) |
| 美容医护 | #3b82f6 → #2563eb | 皇家蓝 | Royal Blue |
| 日常观察 | #14b8a6 → #0d9488 | 蓝绿色 | Teal Blue |
| AI分析 | 多色极光渐变 | 紫→粉→青循环 | Aurora Glow |


4. **性能考量**: 

- 所有3D效果纯CSS实现，无JS计算开销
- AI卡呼吸动画使用transform/opacity，触发GPU加速
- 圆环旋转仅AI卡和hover态启用，减少常驻动画开销

## 设计风格：未来科技感 3D Glass Orb Cards

### 设计理念

以参考图为基准，打造**赛博朋克轻量化**的宠物健康管理界面。核心视觉锚点是每个卡片左侧的**92px 3D玻璃球体**——通过CSS径向渐变模拟球面光照、伪元素绘制内嵌旋转圆环、多层投影营造悬浮光晕，创造出"来自未来的健康终端"的沉浸式体验。

整体气质介于Apple Vision Pro的毛玻璃美学与Linear App的科技卡片之间——干净、精密、有深度但不浮夸。

### 页面规划：首页快速记录区域

#### Block 1: 区域头部

- 左侧："快速记录" 标题（16px/600/#1a1a2e）
- 右侧："一键记录宠物的健康数据"（13px/#999）

#### Block 2: 未来科技卡片列表（8张）

##### 单卡片内部结构（5个区块）：

**Block 2-A: 左侧3D球体视觉区 (.ph3d-tech-orb)**

- 92x92px正圆形容器
- 径向渐变基底(左上高光→右下暗部)模拟球体受光
- 内层伪元素::before = 旋转空心圆环(border 2.5px rgba白)
- 内层伪元素::after = 左上角椭圆形高光反射点
- 子元素.ring = 第二层更小的装饰圆环(反向旋转)
- 多层box-shadow: 外发光+环境光+底部暗部inset

**Block 2-B: 右侧主内容区 (.ph3d-tech-body)**

- 标题: 17px/800/Inter, letter-spacing:-0.3px, #0f172a
- 描述: 12.5px/400, #94a3b8, 行高1.4
- 三行紧凑排列，gap: 6px

**Block 2-C: 进度条+状态行 (.ph3d-tech-progress-row)**

- 左侧: "进行中" status badge(20px高 pill, 浅底+彩色文字)
- 中间: 80x6px full圆角渐变进度条(opacity: 0.6)
- 右侧: 可选百分比文字(11px灰色)

**Block 2-D: 操作按钮 (.ph3d-tech-btn)**

- "去记录" 文字按钮(30px高 pill形状)
- 浅灰背景(#f8fafc) + 彩色细边框 + 圆角full
- hover时反色(填充主题色+白字)

**交互设计:**

- 默认态: 白底+极细边框(rgba(0,0,0,0.05))+柔和投影
- Hover态: 
- 卡片 translateY(-3px) + 边框变为主题色淡版
- 球体 scale(1.08) + rotateZ(8deg) 3D倾斜
- 内部圆环开始旋转(2s linear infinite)
- 光晕投影加深扩散
- 操作按钮反色
- Active态: scale(0.98) 下压
- AI特殊: 常驻脉冲光晕 + 圆环慢转 + 极光色相循环

## Agent Extensions

### Skill

- **frontend-design**
- Purpose: 生成高质量的未来科技感UI代码，确保3D玻璃球体卡片达到参考图的视觉效果标准
- Expected output: 符合参考图风格的React JSX组件代码 + 纯CSS 3D球体样式，包含完整的8种科技配色方案和精致微交互动画