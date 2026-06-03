---
name: redesign-quick-cards-to-course-card-style
overview: 按照新参考图(image.8f05323931.png)的红框课程卡片风格，全面重新设计首页8个快速记录卡片：去掉3D球体中心字母图标(W/V/D...)、增大左侧纯净玻璃几何体至105px、重构右侧内容布局为[标题+副标题+进度条+状态百分比行+右下角独立按钮]，完全对齐参考图的视觉层次和空间分布
design:
  architecture:
    framework: react
  styleKeywords:
    - Futuristic Glass Morphism
    - Clean Course Card Layout
    - Pure Decorative 3D Geometry
    - Premium Spacing Hierarchy
    - Subtle Micro-interactions
  fontSystem:
    fontFamily: Inter, 'SF Pro Display', -apple-system, system-ui, sans-serif
    heading:
      size: 18px
      weight: 800
    subheading:
      size: 13px
      weight: 400
    body:
      size: 13px
      weight: 600
  colorSystem:
    primary:
      - "#6366F1"
      - "#8B5CF6"
      - "#06B6D4"
    background:
      - "#FFFFFF"
      - "#F8FAFC"
      - "#EEF2FF"
    text:
      - "#0F172A"
      - "#475569"
      - "#94A3B8"
    functional:
      - "#E0E7FF"
      - "#F1F5F9"
      - "#E2E8F0"
todos:
  - id: refactor-jsx-layout
    content: 使用 [skill:frontend-design] 重构Pets.tsx中8个快速记录卡片的JSX：移除所有ph3d-tc-icon字母标签、拆分ph3d-tc-body为title+desc+独立bar+meta-row(status+percent)四段式结构、操作按钮保留但由CSS控制位置
    status: completed
  - id: rewrite-css-course-style
    content: 使用 [skill:frontend-design] 全面重写index.css基础样式区：卡片align-items改为stretch+padding增至24px、orb/sphere分别增至106/82px、ph3d-tc-icon设为display:none、body gap增至10px title 18px、bar改为width 100%独立元素、新增meta-row space-between样式、action按钮margin-top auto推到右下角
    status: completed
    dependencies:
      - refactor-jsx-layout
  - id: verify-course-card-ui
    content: 验证渲染效果：确认8张卡片均无字母图标、进度条独立占满宽度、状态和百分比左右分布、按钮位于右下角、hover交互正常、所有导航功能无回归
    status: completed
    dependencies:
      - rewrite-css-course-style
---

## Product Overview

基于参考图(image.8f05323931.png)对首页快速记录卡片进行**整体布局重构**。参考图展示了两张课程学习卡片的完整设计语言：左侧大型纯净3D玻璃几何体(无任何文字/字母) + 右侧纵向堆叠内容区(标题/副标题/独立进度条/状态+百分比行) + 右下角独立操作按钮。

## Core Features

### 当前状态（需全面重构）

- **布局**: 三列横向 `[3D球体+字母] [标题+描述+进度条行] [操作按钮]`，align-items: center 居中对齐
- **图标**: 每张卡片的3D球体中心有白色字母(W/V/D/C/F/B/O/AI)，22px粗体
- **进度条**: 与状态标签、百分比挤在同一flex行内 `[status] [bar] [percent]`
- **按钮**: 与标题同行右侧排列

### 目标设计（参考图课程卡片风格）

**左侧视觉区**：

- 大型3D玻璃/水晶几何体（圆环+球体组合），尺寸增大至约106px
- **核心变更：完全去除字母图标**，仅保留纯净装饰性玻璃球体效果

**右侧内容区（纵向堆叠5层）**：

1. 主标题：18px粗体深色（如"Design thinking skills"）
2. 副标题：13px灰色描述文字（如"By Lana Steiner"）
3. **独立进度条**：占满右侧宽度，6-7px高渐变条（不再与status/percent混排）
4. **元信息行**：左侧状态badge("Ongoing") + 右侧百分比("-- / --%")，space-between布局
5. **操作按钮**：右下角独立定位的pill按钮("Start learning"/"去记录")

**整体卡片特征**：

- 白底 + 极细边框 + 大圆角24px + 柔和投影
- 卡片高度增加（因纵向堆叠内容增多）
- hover时整体上浮 + 球体微动效保留

## Tech Stack

- **框架**: React 18 + TypeScript (保持现有架构不变)
- **样式方案**: 原生CSS (`src/index.css`)，不引入新依赖
- **修改范围**: 仅2个文件 -- `src/pages/Pets.tsx` + `src/index.css`

## Implementation Approach

### 核心策略：JSX结构重组 + CSS布局重写

采用**两步走策略**：

1. 先重写8个卡片的JSX内部DOM结构（去掉字母、拆分进度区域）
2. 再全面更新CSS以匹配参考图布局（调整尺寸、间距、定位）

### JSX结构调整详情 (Pets.tsx 第291-498行)

**每个卡片的3处改动：**

**改动1 - 去除球体字母图标（8处）**:

```
<!-- Before -->
<div className="ph3d-tc-sphere">
  <span className="ph3d-tc-icon">W</span>  <!-- 删除 -->
</div>

<!-- After -->
<div className="ph3d-tc-sphere">
  <!-- 纯净球体，无子元素 -->
</div>
```

**改动2 - 右侧body区域重构（8处）**:

```
<!-- Before -->
<div className="ph3d-tc-body">
  <h4 className="ph3d-tc-title">体重记录</h4>
  <p className="ph3d-tc-desc">追踪宠物体重变化趋势</p>
  <div className="ph3d-tc-progress">
    <span className="ph3d-tc-status">追踪中</span>
    <div className="ph3d-tc-bar"><div className="ph3d-tc-fill" /></div>
    <span className="ph3d-tc-percent">-- / --%</span>
  </div>
</div>

<!-- After -->
<div className="ph3d-tc-body">
  <h4 className="ph3d-tc-title">体重记录</h4>
  <p className="ph3d-tc-desc">追踪宠物体重变化趋势</p>
  <div className="ph3d-tc-bar"><div className="ph3d-tc-fill" style={{width:'45%'}}/></div>
  <div className="ph3d-tc-meta-row">
    <span className="ph3d-tc-status">追踪中</span>
    <span className="ph3d-tc-percent">-- / --%</span>
  </div>
</div>
```

**改动3 - 操作按钮保持不变**（仅CSS重新定位）

### CSS样式重写详情 (index.css 第9422-9755行)

| 选择器 | 当前值 | 目标值 | 改动原因 |
| --- | --- | --- | --- |
| `.ph3d-tech-card` | align-items:center; padding:20px 18px | align-items:**stretch**; padding:**24px** 20px | 让右侧内容撑满高度 |
| `.ph3d-tc-orb` | 94px x 94px | **106px** x 106px | 左侧视觉锚点增大至参考图比例 |
| `.ph3d-tc-sphere` | 72px x 72px | **82px** x 82px | 核心球体同步放大 |
| `.ph3d-tc-icon` | 22px bold white | **display:none** | 字母已从JSX移除，隐藏防残留 |
| `.ph3d-tc-body` | gap:6px | gap:**10px** | 增大纵向间距匹配参考图呼吸感 |
| `.ph3d-tc-title` | font-size:17px | font-size:**18px**; font-weight:**800** | 标题更突出 |
| `.ph3d-tc-progress` | flex容器包裹bar+status+percent | **删除该规则或置空** | 进度条已独立出来 |
| `.ph3d-tc-bar` | flex:1; min-width:60px | width:**100%**; max-width:none | 进度条占满右侧宽度 |
| `.ph3d-tc-meta-row` | 不存在 | **新增**：flex; justify-content:space-between; margin-top:auto | 状态左+百分比右，推到底部 |
| `.ph3d-tc-action` | inline-flex居中 | **margin-top:auto**; align-self:flex-end | 推到右下角 |


### 受影响文件清单

```
src/pages/Pets.tsx          [MODIFY] 第291-498行 8个卡片JSX全面重构
src/index.css               [MODIFY] 第9422-9755行 基础样式大幅调整
```

### 向后兼容约束

- 所有onClick导航逻辑完全不变
- 8套配色方案(CSS变量--tc-from/--tc-to等)保持不变
- AI特殊动画(脉冲/极光流动/圆环旋转)保留不动
- 响应式布局适配移动端
- ChevronRight已在上一轮移除，无需处理

## 设计方向：参考图课程卡片对齐

以用户提供的参考图(image.8f05323931.png)为唯一基准，对现有3D玻璃卡片进行**结构性布局重构**。核心设计语言保持未来科技感3D玻璃美学不变，但将内部布局从紧凑的三列横向排列改为宽松的两列纵向堆叠。

### 页面规划：首页快速记录区域

#### 整体区块结构

**Block 1: 区域头部（不变）**

- 左侧："快速记录" 标题（16px/600/#1a1a2e）
- 右侧："一键记录宠物的健康数据"（13px/#999）

**Block 2: 课程风格卡片列表（8张）**

##### 单卡片完整内部结构（5个区块）：

**Block 2-A: 左侧3D玻璃视觉区 (.ph3d-tc-visual)**

- 106x106px容器内嵌82px核心球体
- 径向渐变模拟球面光照 + 伪元素圆环 + 高光反射点 + 底部光晕
- **关键：无任何文字/字母/图标**，纯装饰性几何体
- 各卡片独有色调（蓝/紫/粉/青/绿/橙/靛/极光）

**Block 2-B: 右侧主标题 (.ph3d-tc-title)**

- "体重记录" 等 - 18px/800 weight/#0f172a
- letter-spacing: -0.3px, line-height: 1.25

**Block 2-C: 副标题描述 (.ph3d-tc-desc)**

- "追踪宠物体重变化趋势" - 13px/400/#64748b
- 行高1.45，单行显示

**Block 2-D: 独立进度条 (.ph3d-tc-bar)**

- 宽度100%占满右侧区域
- 高6px, full圆角3px
- 渐变填充(--tc-from → --tc-to)
- 内部顶部白色高光泽

**Block 2-E: 元信息行 + 操作按钮区**

- 上半部分(.ph3d-tc-meta-row)：左侧状态badge("追踪中") + 右侧百分比("-- / --%")，space-between
- 下半部分(.ph3d-tc-action)：右下角pill按钮("去记录")，通过margin-top:auto推到底部

### 交互设计（保留现有增强）

- 默认态：白底 + 极细边框 + 柔和投影 + 顶部玻璃高光层
- Hover态：卡片上浮translateY(-3px) + 投影加深 + 球体scale(1.06) + 圆环显现 + 光晕增强 + 按钮反色
- Active态：scale(0.985) 下压反馈
- AI卡特殊：常驻脉冲光晕 + 极光色相循环流动进度条

### Skill

- **frontend-design**
- Purpose: 生成高质量的前端UI代码，确保重构后的快速记录卡片达到参考图的课程卡片视觉效果标准
- Expected output: 符合参考图风格的React JSX组件代码（去字母图标+纵向堆叠布局）+ 配套CSS样式（尺寸放大+按钮右下角定位+meta-row space-between）