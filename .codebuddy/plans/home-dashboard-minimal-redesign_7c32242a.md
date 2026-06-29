---
name: home-dashboard-minimal-redesign
overview: 简约装修风改造：缩小圆环、头像与圆环连接(去旋转)、浮动卡片改为网格排列、文字样式对标截图卡片风格(标题+右侧数值+灰字描述)
design:
  architecture:
    framework: react
  styleKeywords:
    - Minimalism
    - Warm
    - Clean
    - Breathing Space
    - Low Saturation
    - Soft Shadow
    - Grid Layout
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 18px
      weight: 600
    subheading:
      size: 14px
      weight: 600
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#17A2B8"
      - "#20C997"
    background:
      - "#F5F9FA"
      - "#FFFFFF"
    text:
      - "#1A3A4A"
      - "#6B8A9A"
    functional:
      - "#FFB5BA"
      - "#FF8A95"
      - "#E8FAFB"
todos:
  - id: refactor-ring-area
    content: 重构圆环区域：缩小至240px、删除旋转动画、头像静态贴边四侧
    status: completed
  - id: grid-cards
    content: 浮动卡片改为CSS Grid整齐排列、统一白底卡片样式、删除rotate/highlight/striped
    status: completed
    dependencies:
      - refactor-ring-area
  - id: typography-simplify
    content: 字重全面降低(700→600,600→500)、行高提升、背景光斑减弱、参照"我的"页文字风格
    status: completed
  - id: responsive-tune
    content: 响应式适配：小屏圆环再缩、Grid变2列、间距调整
    status: completed
    dependencies:
      - refactor-ring-area
      - grid-cards
  - id: lint-verify
    content: 运行 lint + 类型检查确认零报错
    status: completed
    dependencies:
      - refactor-ring-area
      - grid-cards
      - typography-simplify
      - responsive-tune
---

## 产品概述

对首页仪表盘进行简约风格改造：保留圆环但缩小尺寸、去掉头像轨道旋转动画并将头像与圆环视觉连接、浮动卡片从散落布局改为整齐网格排列、文字样式参照"我的"页面的简约风格重新设计。

## 核心功能

### 1. 圆环区域精简

- 圆环容器从 360px 缩小至 220-240px
- 删除头像轨道旋转动画 (`hd-orbit-spin`)，改为静态分布
- 头像与圆环边缘连接（紧贴圆环外侧，非悬浮远处）
- 内圈名字圆同步缩小（130px → 90px），标签字号微调

### 2. 功能卡片网格化

- 删除所有 `position: absolute` + `rotate()` 的散落定位
- 改为 CSS Grid 3 列整齐排列（或 2x3 / 3+2 自适应）
- 统一白底轻阴影卡片样式，删除 striped 和 highlight 特殊变体
- 卡片内文字样式参照参考截图：标题粗体左对齐 + 数值彩色右/上对齐 + 描述灰字

### 3. 文字样式简约化（参照"我的"页面）

- 主标题字重 700→600，正文 600→500
- 行高从 1.2 提升至 1.4-1.5
- letter-spacing 负值去掉或减小
- 颜色对比降低：主文字 #1A3A4A 保持，次文字 #6B8A9A
- 数值用强调色（青绿/粉）突出

### 4. 背景光斑减弱

- radial-gradient 透明度减半（0.08→0.04, 0.10→0.05）
- 整体更干净透亮

### 5. 布局结构变更

```
┌─────────────────────────────┐
│  🌅早上好,娜诺    🔍 ✉ 🔔   │  ← 顶栏不变
├─────────────────────────────┤
│     ┌───┐                   │
│ ┌─┐ │诺 │  主人·绝育         │  ← 缩小圆环(240px)
│ │头│ │怒 │  品种·年龄         │     头像贴边静态
│ └─┘ └───┘                   │
├─────────────────────────────┤
│ ┌────┐┌────┐┌────┐          │
│ │⏰ 5││🍴  ││❤️ 0│          │  ← Grid 3列
│ │预约││饮食││体检│          │     统一白卡
│ ├────┤├────┤├────┤          │
│ │📊诊││📋报│                │  ← 第2行2个
│ │断  ││告  │                │
│ └────┘└────┘                │
├─────────────────────────────┤
│ 24  6月  时间线...           │  ← 时间线保持不变
└─────────────────────────────┘
```

## 技术栈

- React + TypeScript（现有项目）
- 纯 CSS（home-dashboard.css），无新依赖

## 实现方案

### 架构决策

1. **圆环缩小策略**: `.hd-ring-container` 从 360px→240px, `.hd-status-ring` inset 从 52px→36px, `.hd-name-circle` 从 130px→92px。头像位置改用固定坐标紧贴圆环外沿而非远距离绝对定位。
2. **头像去旋转连接圆环**: 删除 `@keyframes hd-orbit-spin`, `.hd-pet-orbit { animation }`, 以及 `transform: rotate()` 抵消逻辑。头像直接用 static/relative 定位在圆环容器四侧（上/右/下/左）。
3. **Grid 布局替代 Absolute**: `.hd-float-card` 全部改为 `position: static`, 外层容器 `.hd-cards-grid` 使用 `display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;`
4. **卡片变体统一**: 删除 `--highlight`(渐变深色底)和 `--striped`(条纹背景)特殊样式，全部统一为白色背景+图标色块区分。

### 文件修改范围

| 文件 | 改动类型 | 说明 |
| --- | --- | --- |
| `src/pages/HomePetOS.tsx` | [MODIFY] | 重构仪表盘JSX: 圆环区简化、头像去旋转、卡片包Grid容器 |
| `src/styles/home-dashboard.css` | [MODIFY] | 全面重写样式: 圆环尺寸、删除散落定位、新增Grid、字重调整 |


### HomePetOS.tsx 具体改动

1. **删除** `orbitPosition()` 函数（不再需要角度计算）
2. **圆环 JSX 简化**: 

- 头像渲染从 `orbitPosition(i, pets.length)` + `left/top calc + transform rotate` 改为固定的 4 个方位 class（top/right/bottom/left）

3. **卡片外包 Grid 容器**: `<div className="hd-cards-grid">` 包裹所有 floatCards map
4. **删除** FloatingCardData.type 中的 variant 字段相关逻辑

### home-dashboard.css 具体改动

1. **圆环尺寸缩放** (约10处数值调整)
2. **删除旋转动画** (@keyframes hd-orbit-spin + .hd-pet-orbit animation)
3. **删除全部散落定位** (.hd-float-card--appointments/left/right 等 position:absolute + rotate)
4. **新增 Grid 系统** (.hd-cards-grid)
5. **删除 highlight/striped 变体**
6. **字重全面降低** (700→600, 600→500)
7. **行高提升** (1.2→1.4)
8. **背景光斑减弱**

### 性能影响

- 删除 CSS animation 减少持续重绘开销
- position:absolute → grid layout 减少 layer compositing
- 总 CSS 规则数减少约 30 条

## 设计风格：日式简约（Muji-style Minimalism）

### 设计理念

参照用户提供的"我的"页面截图，采用**温暖极简**设计语言：大量留白、低饱和色彩、清晰的层级关系。像装修房子一样——简洁但不简陋，每个元素都有呼吸空间。

### 页面布局

#### Block 1: 顶部欢迎栏（保持不变）

- 左侧：渐变青绿欢迎卡片（"早上好,娜诺"）
- 右侧：三个圆形工具按钮（搜索/消息/通知）
- 微调：欢迎卡片圆角加大到 20px，阴影减轻

#### Block 2: 圆环宠物信息区（核心改动区）

- 居中的缩小圆环（240px），淡粉色 conic-gradient 但透明度降低
- 内圈白色圆形显示宠物名字（90px 直径）
- 4 个状态标签（主人/绝育/品种/年龄）分布在粉色环上，白色小字
- 宠物头像**静态紧贴圆环四侧**（上右下左），无旋转动画
- 选中态头像稍大 + 青绿描边

#### Block 3: 功能卡片网格（最大改动区）

- 2 行 Grid：第1行 3 列，第 2 行 2 列左对齐
- 统一样式：白色圆角卡片(16px radius)，极浅阴影
- 每张卡片内部：
- 左上角：彩色圆角方形图标（32px，dark/pink/teal 三种底色）
- 标题：13px, weight 600, #1A3A4A
- 数值/副标题：11px, weight 500, #6B8A9A
- 大数字（有值时）：20px, weight 600, 青绿色强调
- hover: translateY(-2px) + 阴影加深，无缩放无旋转

#### Block 4: 底部时间线（基本不变）

- 白色圆角卡片包裹
- 日历头部(日期+月份) + 横向时间轴节点
- 当前激活节点青绿高亮

### 响应式

- ≤420px: 圆环进一步缩至 200px, Grid 变为 2 列, 卡片间距缩减

## Agent Extensions

### Skill

- **impeccable**
- Purpose: 对首页仪表盘进行全面 UI 简约化改造评审，确保最终输出符合高端简约设计标准
- Expected outcome: 生成精致、干净的界面代码，避免 AI 设计的常见陷阱（过重、过花、过散）

- **frontend-design**
- Purpose: 生成高质量的前端组件代码，确保 React + CSS 的实现达到产品级水准
- Expected outcome: 产出结构清晰、样式精致的仪表盘组件代码

### SubAgent

- **frontend-developer**
- Purpose: 辅助实现复杂的 React 组件重构和 CSS Grid 布局
- Expected outcome: 确保 TSX 结构变更和 CSS 重写的代码质量