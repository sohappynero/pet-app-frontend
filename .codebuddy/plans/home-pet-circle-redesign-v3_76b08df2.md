---
name: home-pet-circle-redesign-v3
overview: 将首页仪表盘改为截图中的双层圆环+浮动卡片布局：粉色3/4圆+白色外圈、选中宠物头像通过粉色连接器连到圆环、其他宠物头像散布在外圈上、状态卡片改为浮动散落式（移除预约保留饮食/检查/诊断/测试）
design:
  architecture:
    framework: react
  styleKeywords:
    - Medical Pet Dashboard
    - Dual Ring System
    - 3/4 Circle Geometry
    - Floating Cards
    - Pet Connector Tail
    - Coral Pink + Teal
    - Light Blue-Grey Background
    - Rotated Card Layout
    - Clean Minimalist
  fontSystem:
    fontFamily: "'ZCOOL KuaiLe', cursive"
    heading:
      size: 20px
      weight: 600
    subheading:
      size: 14px
      weight: 550
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#FFB5BA"
      - "#FF9AA3"
      - "#17A2B8"
    background:
      - "#EDF4F7"
      - "#FFFFFF"
      - "#FFE8EA"
    text:
      - "#2A2A2A"
      - "#888888"
      - "#FFFFFF"
    functional:
      - "#138496"
      - "#E8859A"
      - "#F0F2F4"
todos:
  - id: refactor-tsx-structure
    content: "重构 HomePetOS.tsx: 双层圆环JSX结构+宠物连接器+浮动卡片(去预约)+移除右侧标签区"
    status: completed
  - id: rewrite-css-ringsystem
    content: "重写 home-dashboard.css: 白色外圈+粉色内圈3/4圆+连接器tail+浮动卡片绝对定位样式+移除旧网格/标签样式"
    status: completed
    dependencies:
      - refactor-tsx-structure
  - id: responsive-adaptation
    content: "更新响应式断点适配: 小屏幕下圆环缩小+卡片位置重新调整+避免重叠"
    status: completed
    dependencies:
      - rewrite-css-ringsystem
  - id: visual-verify
    content: 使用 [mcp:MCP Server Playwright] 启动开发服务器并截图验证实际渲染效果
    status: completed
    dependencies:
      - responsive-adaptation
---

## Product Overview

将首页仪表盘(HomePetOS)按截图风格进行核心重构，从当前的「单层圆环 + 右侧标签 + 底部网格卡片」改为截图中的「双层3/4圆环结构 + 宠物头像连接器 + 浮动散落式状态卡片」设计。

## Core Features

### 1. 双层圆环结构（核心改动）

- **内层粉色3/4圆**：约200px直径，显示宠物名称(Lily)，右上角缺角（约270度弧），使用 `#FFB5BA` ~ `#FF9AA3` 粉色渐变
- **外层白色大圆圈**：约320px直径，作为宠物头像的轨道容器，也是3/4圆形态（与内层同心但更大）
- 内层白色中心圆保留，显示"宠物名称" hint + 名字值

### 2. 选中宠物连接器（关键交互）

- 当前选中的宠物头像位于左上方（约10-11点钟方向）
- 通过一个**粉色小尾巴/桥接器**连接到内层粉色圆的边缘
- 尾巴宽度约28-32px，颜色与内层粉色一致
- 切换宠物时，连接器跟随选中项移动到对应位置

### 3. 宠物头像轨道布局

- 所有宠物头像散布在白色外圈的边缘上（非四侧贴边）
- 未选中的头像：普通圆形，白边+阴影，较小(~38px)
- 选中的头像：稍大(~48px)，通过粉色连接器连向主圆
- 头像位置沿圆周均匀分布（上、右上、右、右下等位置）

### 4. 浮动散落式状态卡片（替代网格）

- **删除预约(Appointments)卡片**
- 保留4个卡片，绝对定位浮动在圆环周围：
- **Diet（饮食）** — 左侧偏下位置，白色卡片，粉色图标
- **Check-Ups（体检）** — 右上方位置，浅色背景，带数值
- **Diagnosis（诊断）** — 右侧中间，青色(teal)强调卡片
- **Tests（检测）** — 右下方位置，深色图标
- 卡片风格：圆角白色(或teal色)小块，轻微旋转角度(-3°~6°)，标题+副标题/数值+圆形图标

### 5. 移除的元素

- 右侧信息标签区(`.hd-pet-info-tags`) — 截图中无此区域
- 预约提醒卡片
- 底部3列网格布局

### 6. 保留不变的部分

- 顶部欢迎卡片 + 工具栏（保持现有设计）
- 底部时间线（保持现有设计）
- 空状态页面
- 字体 `'ZCOOL KuaiLe', cursive`

## Tech Stack

- React + TypeScript (现有技术栈)
- 纯CSS实现（home-dashboard.css），无需新依赖
- CSS绝对定位 + transform实现浮动卡片和圆环布局
- CSS伪元素/clip-path或conic-gradient实现3/4圆效果
- border-radius + box-shadow实现连接器形状

## Implementation Approach

### 整体策略

采用**大圆居中 + 卡片绝对定位环绕**的布局方案。将主内容区改为 `position: relative` 的容器，圆环系统居中放置，4张状态卡片用绝对定位围绕圆环散落。

### 关键技术决策

1. **双层3/4圆实现方式**：使用 `border-radius: 50%` 配合 `clip-path: polygon()` 或利用 conic-gradient 的透明区间来制造缺角效果。推荐 clip-path 方案，更精确可控。

2. **连接器(tail)实现**：用一个绝对定位的div，使用 `border-radius` 做成不规则的水滴/桥接形状，一端贴着选中头像，另一端融入内层粉色圆。可用 CSS `::before`/`::after` 组合或直接用 border 技巧。

3. **浮动定位**：每张卡片有独立的 CSS class 控制位置（top/left + rotate），通过 CSS 变量或固定类名管理。

4. **宠物切换动画**：连接器和选中头像的位置变化用 CSS transition 实现平滑过渡。

### 数据流

```
pets[] → 圆环上的头像渲染（含选中态判断）
selectedPet → 内层圆名称 + 连接器目标位置
floatCards(过滤掉appointments) → 4张浮动卡片
ringLabels → 内层粉圈上的文字标签(Owner/Neutered/Vaccinated等)
```

## Architecture Design

### 新布局结构示意

```
.hd-body (position: relative; min-height: 480px)
├── .hd-ring-system (absolute center, z-index: 1)
│   ├── .hd-outer-white-ring (320px, 白色3/4圆)
│   │   └── .hd-pet-orbit (头像轨道, 绝对定位于外圈边缘)
│   │       ├── [pet1] 未选中
│   │       ├── [pet2] 未选中  
│   │       ├── .hd-selected-connector (粉色尾巴) ← [pet选中]
│   │       └── [petN]...
│   ├── .hd-inner-pink-ring (200px, 粉色3/4圆)
│   │   ├── .hd-status-label * 4 (Owner/Breed/Age/Neutered)
│   │   └── .hd-name-circle (中心白色圆 + 名字)
│   └── .hd-float-cards (浮动卡片区)
│       ├── .hd-float-card--diet (左下)
│       ├── .hd-float-card--checkups (右上)
│       ├── .hd-float-card--diagnosis (右中, teal)
│       └── .hd-float-card--tests (右下)
```

## Directory Structure

```
src/
├── pages/
│   └── HomePetOS.tsx          # [MODIFY] 重构JSX结构：双层圆环+连接器+浮动卡片
└── styles/
    └── home-dashboard.css     # [MODIFY] 大量样式重写：圆环系统/连接器/浮动卡片/移除网格
```

## Implementation Notes

### 改动范围控制

- 仅修改 `HomePetOS.tsx` 和 `home-dashboard.css` 两个文件
- 不影响其他页面的组件和样式
- 保留所有数据获取逻辑（fetchAnalysisDashboard/fetchReminders）不变
- 保留时间线和欢迎卡片区域不变
- 响应式适配需要同步更新（@media 断点）

### 风险点

1. **连接器形状**：CSS绘制不规则桥接形状有一定复杂度，可能需要用border-radius技巧或SVG background
2. **多宠物位置计算**：需要根据pets数量动态分配圆周角度位置
3. **移动端适配**：浮动卡片在小屏幕上可能重叠，需要调整位置或缩小尺寸

## 设计风格分析

基于截图的设计语言，整体呈现**医疗宠物仪表盘(Medical Pet Dashboard)**风格：

### 视觉层次

- **第一层**：中心双环系统 — 整个页面的视觉锚点，粉色温暖感
- **第二层**：散落的浮动卡片 — 围绕中心的信息辐射状分布
- **第三层**：顶部欢迎条 + 底部时间线 — 辅助功能区域

### 核心视觉特征

- **3/4圆环**：不完整的圆带来开放、友好的感觉，不像完整圆那么封闭
- **连接器(Tail)**：选中宠物与中心的物理连接暗示"这只宠物是焦点"
- **浮动卡片旋转**：轻微的角度偏移(-3°~6°)让界面活泼不呆板
- **双色系卡片**：大部分白色卡片 + 一张teal强调色卡片(Diagnosis)，形成视觉重点
- **浅蓝绿背景**：`#E8F4F8` 左右的极淡背景，干净清爽

### 色彩体系

- 主背景：淡蓝灰 `#EDF4F7`
- 内层粉圈：珊瑚粉渐变 `#FFB5BA` → `#FF9AA3`
- 外层白圈：纯白 `#FFFFFF`
- 强调色(诊断卡片)：Teal `#17A2B8`
- 文字：深灰 `#2A2A2A` / 中灰 `#888888`

### 页面区块设计

#### 区块1: 顶栏 (保持不变)

- 左侧：Teal渐变欢迎卡片(Good Afternoon, Dr. Bowman)
- 右侧：三个圆形工具按钮(搜索/消息/通知)

#### 区块2: 双层圆环主体 (核心重构)

**Block 2a - 白色外圈 + 轨道头像**

- 大型白色3/4圆作为底层
- 6-8个宠物头像沿圆周分布
- 选中头像通过粉色tail连接到中心

**Block 2b - 粉色内圈 + 信息**

- 居中的粉色3/4圆
- 四周分布 Owner/Neutered/Vaccinated/Chipped 标签
- 正中心白色圆显示宠物名

**Block 2c - 浮动状态卡片(4张)**

- Diet卡片：左侧，白色底，粉色圆角图标，标题+副标题
- Check-Ups卡片：右上方，浅色底，粉色圆标+数字
- Diagnosis卡片：右侧中部，Teal底白字，突出显示
- Tests卡片：右下方，白色底，深色圆标+数字

#### 区块3: 底部时间线 (保持不变)

- 日期头 + 横向时间节点轨道

## Agent Extensions

### Skill

- **frontend-design**
- Purpose: 生成高质量的前端UI代码，确保圆环系统、连接器、浮动卡片的视觉效果达到截图中医疗宠物仪表盘的专业水准
- Expected output: 生产级的 React + CSS 代码，包含精确的布局、色彩、交互动画

### MCP

- **MCP Server Playwright (browser_screenshot)**
- Purpose: 实现后对浏览器进行截图验证，确认双层圆环、宠物连接器、浮动卡片的实际渲染效果是否与设计一致
- Expected outcome: 可视化验证页面效果，发现布局/样式问题

### SubAgent

- **frontend-developer**
- Purpose: 辅助实现复杂的React组件重构，特别是双层圆环系统和浮动卡片的状态管理逻辑
- Expected outcome: 高质量的 TypeScript React 代码实现