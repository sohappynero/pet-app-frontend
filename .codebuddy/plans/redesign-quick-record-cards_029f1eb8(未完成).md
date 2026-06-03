---
name: redesign-quick-record-cards
overview: 将 Pets.tsx 首页"快速记录"区域从当前的水平列表式布局重新设计为 Radium 风格的高级感垂直居中卡片网格（圆形渐变图标+底部文字），包含 8 个记录类型入口
design:
  architecture:
    framework: react
  styleKeywords:
    - Radium Dribbble Style
    - Glassmorphism Light
    - Pastel Macaroon Palette
    - Circular Gradient Icon
    - Vertical Centered Layout
    - Micro-interaction Hover
    - Premium Minimalism
    - Soft Shadow Depth
  fontSystem:
    fontFamily: Inter, PingFang SC, Microsoft YaHei
    heading:
      size: 16px
      weight: 600
    subheading:
      size: 13px
      weight: 500
    body:
      size: 13px
      weight: 600
  colorSystem:
    primary:
      - "#6366F1"
      - "#8B5CF6"
      - "#EC4899"
    background:
      - "#FFFFFF"
      - "#FAFAFA"
      - "#F8FAFC"
    text:
      - "#1F2937"
      - "#374151"
      - "#9CA3AF"
    functional:
      - "#EDE9F6"
      - "#DBEAFE"
      - "#FCE7F3"
      - "#D1FAE5"
todos:
  - id: redesign-quick-jsx
    content: 使用[skill:frontend-design]重写Pets.tsx中快速记录区域的JSX结构，从水平布局改为垂直居中布局
    status: pending
  - id: rewrite-quick-css
    content: 使用[skill:frontend-design]重写index.css中.ph3d-quick-*全部样式块，实现Radium风格的大圆形渐变图标+柔和阴影+马卡龙配色
    status: pending
    dependencies:
      - redesign-quick-jsx
  - id: verify-hover-effects
    content: 验证hover/active微交互效果（上浮、图标缩放旋转、投影加深），确保智能分析的脉冲发光特效正常
    status: pending
    dependencies:
      - rewrite-quick-css
  - id: test-navigation
    content: 验证所有8个卡片点击导航路径不变，确认无功能回归
    status: pending
    dependencies:
      - rewrite-quick-css
---

## Product Overview

重新设计首页(Pets.tsx)的"快速记录"卡片区域，将现有的横向列表式布局改造为参考Dribbble设计师Radium作品风格的高级感网格卡片布局。

## Core Features

### 当前状态（需替换）

- **布局**: 2列网格 + 横向排列（左侧36px圆角图标 + 中间标题/副标题 + 右侧箭头）
- **视觉风格**: 暖色调、紧凑型、列表式交互
- **8个记录项**: 体重/疫苗/驱虫/体检/饮食/美容/观察/智能分析

### 目标设计（Radium Dribbble风格）

- **布局**: 2列网格 + **垂直居中**排列（顶部大型圆形渐变图标 + 底部文字标签）
- **视觉特征**:
- 大尺寸圆形渐变图标背景（48-52px直径，正圆形非圆角矩形）
- 马卡龙低饱和度色系（淡紫/淡青/淡粉/薄荷绿等）
- 卡片内垂直居中对齐，留白充足
- 柔和投影 + 微妙边框 + 大圆角(20-22px)
- hover时图标微微上浮+光晕扩散的精致微交互
- **保留功能**: 点击跳转各记录添加页，导航路径不变

## Tech Stack

- **框架**: React (TSX) - 与项目现有技术栈一致
- **样式方案**: CSS Modules / 原生CSS（与现有index.css模式一致）  
- **图标**: 现有Emoji图标 + 可选Lucide图标增强

## Tech Architecture

### 修改范围（仅2个文件）

| 文件 | 修改类型 | 内容 |
| --- | --- | --- |
| `src/pages/Pets.tsx` | [MODIFY] 第340-419行 ph3d-quick-section JSX结构 | 从水平flex布局改为垂直居中布局 |
| `src/index.css` | [MODIFY] 第9423-9642行 .ph3d-quick-* 样式块 | 全面重写为Radium风格 |


### 布局转换策略

```
Before (Horizontal):
[🎨Icon 36px] [Title strong][desc span]        [>arrow]

After (Vertical - Radium):
     ┌─────────────────────┐
     │                     │
     │    ╭──────╮         │  ← 48-50px 圆形渐变图标
     │   │ 🎨Icon │        │  ← 居中悬浮
     │    ╰──────╯         │
     │                     │
     │    体重记录          │  ← 标题文字
     │   追踪体重变化       │  ← 副标题（可选保留或精简）
     └─────────────────────┘
```

### 色彩系统映射（8项 → 8色）

| 记录项 | 新圆形渐变色 | 色彩关键词 |
| --- | --- | --- |
| 体重记录 | `#EDE9F6` → `#DDD6FE` (淡紫罗兰) | Lavender |
| 疫苗记录 | `#DBEAFE` → `#BFDBFE` (淡天空蓝) | Sky Blue |
| 驱虫记录 | `#FCE7F3` → `#FBCFE8` (淡玫瑰粉) | Rose Pink |
| 体检记录 | `#D1FAE5` → `#A7F3D0` (薄荷绿) | Mint Green |
| 饮食记录 | `#FEF3C7` → `#FDE68A` (暖琥珀) | Amber |
| 美容医护 | `#E0E7FF` → `#C7D2FE` (靛蓝淡) | Indigo |
| 日常观察 | `#CCFBF1` → `#99F6E4` (青碧色) | Teal |
| 智能分析 | `#FDF4FF` → `#F5D0FE` (品红淡) + 特殊发光 | Fuchsia Glow |


## Implementation Details

1. **JSX结构调整**: 移除ChevronRight箭头、调整ph3d-quick-item内部DOM为flex-column居中
2. **CSS重写要点**:

- `.ph3d-quick-item`: 改为 `display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px 12px; gap:12px; min-height:100px`
- `.ph3d-quick-icon`: 从36px圆角12px改为48px正圆(`border-radius:50%`)，加大尺寸和阴影层次
- hover效果改为 translateY(-4px) + box-shadow增强 + 图标scale(1.08)
- 智能分析项保留特殊glow效果但适配新布局

3. **向后兼容**: 导航onClick逻辑完全不变，仅改变视觉呈现层

## 设计风格：Radium Dribbble 高级感卡片

### 设计理念

参考Radium在Dribbble上的经典移动端卡片设计语言——以**大圆形渐变图标为核心视觉锚点**，配合充足留白和低饱和度马卡龙色系，营造出精致、现代、高级的用户界面感受。每个卡片如同一个独立的"功能入口按钮"，视觉重心聚焦于图标，文字作为辅助说明。

### 布局架构

整体采用 **2列4行网格布局**，每张卡片独立成区：

- **卡片尺寸**: 接近正方形（宽高比约1:1~1:1.15），保证视觉均衡
- **内部结构**: 垂直三段式 —— 上部空白呼吸区 → 中部圆形图标区 → 下部文字标签区
- **间距策略**: grid gap增大至10-12px（原8px），卡片内padding增至18-20px

### 页面规划：首页快速记录区域（单区块）

#### Block 1: 区域头部

- 左侧："快速记录" 标题（16px/600weight/#1f2937）
- 右侧可选副标题 "一键记录健康数据"（13px/#9ca3af）

#### Block 2: 2列网格卡片组（8张卡片）

- **卡片1-7**: 统一规格的标准记录入口卡
- **卡片8（智能分析）**: 带特殊脉冲光晕的差异化卡片

#### 单卡片内部分块设计:

- **图标区**: 48-50px直径正圆形，双层渐变填充（135deg方向），内嵌emoji 22-24px，带柔和向下投影
- **标题区**: 13px/600weight/#374151，单行显示，居中
- **描述区**(可选): 11px/400weight/#9ca3af，单行截断省略号，居中

### 交互设计

- **默认态**: 卡片白底 + 极细边框(rgba(0,0,0,0.05)) + 柔和投影(0 2px 12px rgba(0,0,0,0.04))
- **悬停态(hover)**: 
- 卡片上浮 translateY(-4px)
- 投影加深扩散(0 8px 24px rgba(0,0,0,0.08))
- 图标放大 scale(1.08) + 顺时针微旋转(3deg)
- 边框色微亮
- **按下态(active)**: scale(0.97)下压反馈
- **智能分析特殊动效**: 图标外圈缓慢呼吸光环(2.5s循环)，边框渐变流动动画

## Agent Extensions

### Skill

- **frontend-design**
- Purpose: 生成高质量的前端UI代码，确保新设计的快速记录卡片达到生产级视觉效果
- Expected output: 符合Radium Dribbble风格的React组件代码和CSS样式，包含精致的hover微交互和响应式适配