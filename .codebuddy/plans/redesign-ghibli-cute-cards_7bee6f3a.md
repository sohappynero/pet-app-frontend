---
name: redesign-ghibli-cute-cards
overview: 将首页8个快速记录卡片 redesign 为更精致的宫崎骏手绘治愈风格，去除AI模板感，增加可爱卡通元素和特殊文字处理
design:
  architecture:
    framework: react
  fontSystem:
    fontFamily: "'ZCOOL KuaiLe', 'Comic Neue', cursive"
    heading:
      size: 18px
      weight: 750
    subheading:
      size: 13px
      weight: 450
    body:
      size: 12px
      weight: 400
  colorSystem:
    primary:
      - "#87CEEB"
      - "#B39DDB"
      - "#FFCDD2"
      - "#A5D6A7"
      - "#FFE0B2"
      - "#F8BBD0"
      - "#C8E6C9"
      - "#CE93D8"
    background:
      - "#FFFAF0"
      - "#FFFEF9"
      - "#FEF9F3"
    text:
      - "#2D3436"
      - "#8E99A4"
      - "#636E72"
    functional:
      - "#FFFAF0"
      - "#F5F0EB"
      - "#E8F5E9"
todos:
  - id: redesign-jsx-icons
    content: 使用 [skill:frontend-design] 重构Pets.tsx中8个快速记录卡片的JSX：移除所有emoji图标、替换为Lucide图标（Scale/Shield/Heart/Utensils/Scissors/Eye/Sparkles）、添加手绘风CSS类名、保留卡片结构和导航功能
    status: completed
  - id: rewrite-css-handdrawn
    content: 使用 [skill:frontend-design] 全面重写index.css宫崎骏风格样式：调整卡片背景为花粉白#FFFAF0、实现手绘风图标容器（不规则圆角+水彩纹理）、添加特殊文字处理（手写字体+渐变文字+柔和阴影）、增强自然元素装饰
    status: completed
    dependencies:
      - redesign-jsx-icons
  - id: implement-text-special-effects
    content: "实现文字特殊处理效果：为卡片标题添加手写风格字体栈、渐变文字效果（-webkit-background-clip: text）、柔和文字阴影、为描述文字添加手写斜体效果"
    status: completed
    dependencies:
      - rewrite-css-handdrawn
  - id: add-natural-decorations-enhanced
    content: 为8张卡片添加增强的自然元素装饰：使用CSS伪元素在每张卡片不同位置添加树叶/花朵/星星/云朵/花瓣剪影、实现缓慢漂浮动画（ghibliDecoFloat keyframes）、调整装饰元素透明度和hover效果
    status: completed
    dependencies:
      - rewrite-css-handdrawn
  - id: optimize-color-scheme
    content: 优化宫崎骏温暖自然配色方案：调整8张卡片的CSS变量（--ghibli-primary/--ghibli-secondary/--ghibli-icon-bg）、确保配色低饱和温暖、符合宫崎骏动画色调
    status: completed
    dependencies:
      - rewrite-css-handdrawn
  - id: verify-ghibli-redesign
    content: 验证渲染效果：确认8张卡片均为宫崎骏治愈风格、无emoji图标、配色温暖自然、纸张纹理可见、自然装饰显示、特殊文字效果流畅、hover动效自然、所有导航功能无回归、lint检查0错误
    status: completed
    dependencies:
      - add-natural-decorations-enhanced
      - implement-text-special-effects
      - optimize-color-scheme
---

## 需求概述

重新设计首页8个快速记录卡片（体重、疫苗、驱虫、体检、饮食、美容、观察、AI分析），打造可爱卡通风格的宫崎骏式设计，去除AI模板感，并对卡片文字进行特殊处理。

## 核心需求

1. **风格定位**：可爱卡通类型 + 宫崎骏治愈系风格（参考《龙猫》《魔女宅急便》《悬崖上的金鱼姬》）
2. **去除AI味**：避免通用渐变、玻璃态、几何图形等AI生成模板的常见特征
3. **文字特殊处理**：对卡片标题和描述文字进行手绘风特殊处理
4. **保留功能**：保留全部8张卡片的完整功能
5. **图标升级**：替换现有emoji图标为更精致的手绘风格图标

## 设计目标

- 温暖自然的水彩质感
- 手绘有机形状（非对称、轻微扭曲）
- 自然元素装饰（树叶、云朵、花瓣、星星）
- 可爱卡通化表达
- 特殊文字处理（手写风、纹理叠加）

## 技术栈

- **框架**：React 18 + TypeScript（保持现有架构）
- **样式方案**：原生CSS（`src/index.css`），不引入新依赖
- **图标方案**：使用 Lucide React 图标，通过CSS自定义样式模拟手绘风
- **字体方案**：引入手写风格Web字体（通过Google Fonts或系统字体栈）
- **修改范围**：仅2个文件 — `src/pages/Pets.tsx` + `src/index.css`

## 实现方案

### 核心技术决策

**1. 图标处理策略**

- 移除所有emoji图标（⚖️💉🛡️❤️🍖✨👁🔮）
- 替换为 Lucide React 图标，应用CSS滤镜和变换模拟手绘感：
- `filter: drop-shadow()` 添加柔和阴影
- `transform: rotate()` 添加轻微不规则旋转
- 使用 `stroke-width: 1.5` 模拟手绘线条粗细

**2. 文字特殊处理策略**

- 标题文字：
- 使用手写风格字体栈：`'ZCOOL KuaiLe', 'Comic Neue', cursive`
- CSS `text-shadow` 实现柔和文字阴影
- `background: linear-gradient` + `-webkit-background-clip: text` 实现渐变文字
- 伪元素添加微小纹理叠加
- 描述文字：
- 使用温暖的手绘风格字体
- 添加 `font-style: italic` 模拟手写斜体

**3. 装饰元素增强策略**

- 为每张卡片添加独特的自然元素装饰：
- 使用CSS伪元素 `::before` 和 `::after` 实现
- 添加树叶、云朵、花瓣、星星等自然元素
- 实现缓慢漂浮动画（`translateY` + `rotate`）
- 为卡片背景添加纸张纹理：
- 使用CSS `radial-gradient` 多层叠加模拟水彩纸张
- 添加微小噪点纹理（`filter: noise` 或SVG纹理叠加）

**4. 配色方案优化策略**

- 从冷色调渐变改为宫崎骏温暖自然色系
- 每张卡片定义独特的温暖配色：
- 体重：天空蓝 + 薄荷绿
- 疫苗：薰衣草紫 + 天空蓝
- 驱虫：樱花粉 + 杏色
- 体检：薄荷绿 + 天空蓝
- 饮食：杏色 + 蜜桃橙
- 美容：珠光粉 + 薰衣草紫
- 观察：嫩草绿 + 天空蓝
- AI：魔法紫 + 天空蓝

**5. 动效设计策略**

- 卡片hover时：
- `translateY(-4px)` + `rotate(0.5deg)` 模拟纸片飘起
- 图标 `scale(1.08)` + `rotate(-3deg)` 弹跳效果
- 装饰元素缓慢漂浮（`translateY(-3px)` + `rotate(8deg)`）
- 卡片active时：
- `scale(0.98)` + `rotate(0deg)` 按压缩回

## 实现细节

### JSX结构调整详情（Pets.tsx 第291-417行）

**每个卡片的图标替换**：

```
<!-- Before: 使用emoji图标 -->
<div className="ghibli-card-icon-wrap">
  <span className="ghibli-card-icon">⚖️</span>
</div>

<!-- After: 使用Lucide图标 + 手绘风样式 -->
<div className="ghibli-card-icon-wrap ghibli-icon-handdrawn">
  <Scale size={24} strokeWidth={1.5} className="ghibli-card-icon" />
</div>
```

**每张卡片使用不同的Lucide图标**：

- 体重：`Scale`
- 疫苗：`Shield`
- 驱虫：`ShieldCheck`
- 体检：`Heart` + `Stethoscope`
- 饮食：`Utensils`
- 美容：`Scissors`
- 观察：`Eye`
- AI：`Sparkles`

### CSS样式重写详情（index.css 第9422行起）

**卡片基础样式优化**：

- 背景色从 `#FFFEF9` 调整为更温暖的白 `#FFFAF0`（花粉白）
- 边框从虚线改为实线 + 不规则圆角，模拟手绘描边
- 阴影从冷色调改为温暖的多层次纸质阴影

**图标容器样式优化**：

- 添加手绘风不规则圆角 `border-radius: 50% 48% 52% 50%`
- 添加内部水彩纹理（伪元素实现）
- 添加柔和图标阴影 `filter: drop-shadow()`

**文字样式特殊处理**：

- 标题：手写风格字体 + 渐变文字 + 柔和阴影
- 描述：手写斜体 + 温暖灰色

**装饰元素增强**：

- 为每张卡片添加2-3个独特的自然元素装饰
- 使用CSS伪元素 + Unicode自然元素字符
- 添加缓慢漂浮动画

## 受影响文件清单

```
src/pages/Pets.tsx          [MODIFY] 第291-417行 8个卡片JSX全面重构
src/index.css               [MODIFY] 第9422-9900行 基础样式大幅调整
```

## 向后兼容约束

- 所有onClick导航逻辑完全不变
- 8张卡片功能完全保留
- 响应式布局适配移动端
- 所有Lucide图标需从现有import中确认可用性

## 页面规划：首页快速记录区域

### 整体区块结构

**Block 1: 区域头部（不变）**

- 左侧："快速记录" 标题（16px/600/#1a1a2e）
- 右侧："一键记录宠物的健康数据"（13px/#999）

**Block 2: 宫崎骏风格卡片列表（8张）**

#### 单卡片完整内部结构（5个区块）：

**Block 2-A: 左侧图标区 (.ghibli-visual)**

- 56×56px容器内嵌 Lucide 图标
- 温暖渐变背景 + 手绘风不规则圆角
- 内部水彩纹理（伪元素实现）
- 柔和图标阴影（CSS filter实现）
- **关键**：图标应用 `stroke-width: 1.5` + 轻微旋转，模拟手绘线条

**Block 2-B: 右侧标题 (.ghibli-card-title)**

- "体重记录" 等 - 特殊处理文字：
- 手写风格字体 `'ZCOOL KuaiLe', cursive`
- 渐变文字效果（`background-clip: text`）
- 柔和文字阴影 `text-shadow`
- 18px/750 weight/#2D3436
- letter-spacing: -0.2px, line-height: 1.3

**Block 2-C: 副标题描述 (.ghibli-card-desc)**

- "追踪宠物体重变化趋势" - 13px/450 weight/#8E99A4
- 行高1.45，单行显示
- 添加 `font-style: italic` 模拟手写斜体

**Block 2-D: 底部信息行 (.ghibli-card-footer)**

- 左侧状态badge（"追踪中"）+ 右侧箭头（"→"）
- space-between布局
- 状态badge：小药丸形状，温暖渐变背景

**Block 2-E: 装饰元素（每张卡片独特）**

- 使用CSS伪元素实现自然元素装饰
- 树叶（🌿）、花朵（🌸）、星星（✦）、云朵（☁）、花瓣（🌼）等
- 缓慢漂浮动画（`ghibliDecoFloat` keyframes）

### 交互设计（增强手绘感）

- 默认态：花粉白背景 + 温暖阴影 + 手绘风边框 + 装饰元素半透明
- Hover态：
- 卡片上浮 `translateY(-4px)` + 轻微旋转 `rotate(0.5deg)`
- 图标放大 `scale(1.08)` + 旋转 `rotate(-3deg)`
- 装饰元素 opacity 从 0.45 到 0.75 + 漂浮动画
- 箭头右移 `translateX(3px)`
- Active态：`scale(0.98)` + `rotate(0deg)` 下压反馈
- 装饰元素：持续缓慢漂浮动画（2.5s ease-in-out infinite）

### 宫崎骏风格设计语言

**色彩系统（低饱和温暖色）**：

| 卡片 | 主色 | 辅色 | 图标背景 |
| --- | --- | --- | --- |
| 体重 | 天空蓝 `#87CEEB` | 薄荷绿 `#98D8C8` | 渐变蓝绿 |
| 疫苗 | 薰衣草紫 `#B39DDB` | 天空蓝 `#81D4FA` | 渐变紫蓝 |
| 驱虫 | 樱花粉 `#FFCDD2` | 杏色 `#FFE0B2` | 渐变粉橙 |
| 体检 | 薄荷绿 `#A5D6A7` | 天空蓝 `#80CBC4` | 渐变绿蓝 |
| 饮食 | 杏色 `#FFE0B2` | 蜜桃橙 `#FFCCBC` | 渐变橙杏 |
| 美容 | 珠光粉 `#F8BBD0` | 薰衣草紫 `#D1C4E9` | 渐变粉紫 |
| 观察 | 嫩草绿 `#C8E6C9` | 天空蓝 `#B3E5FC` | 渐变绿蓝 |
| AI | 魔法紫 `#CE93D8` | 天空蓝 `#90CAF9` | 渐变紫蓝 |


**质感与装饰**：

- 纸张纹理背景（CSS radial-gradient 模拟水彩纸张）
- 有机非对称圆角（不是完美几何圆）
- 多层次柔和阴影（模拟纸片层叠感）
- 自然装饰伪元素（每张卡片不同位置添加树叶/云朵/花瓣剪影）
- 手绘风图标（Lucide图标 + CSS filter模拟手绘线条）

**字体系统**：

- 标题：`'ZCOOL KuaiLe', 'Comic Neue', cursive` (手写风)
- 描述：`system-ui, -apple-system, sans-serif` + `font-style: italic`
- 状态badge：`'ZCOOL QingKe HuangYou', cursive` (手写风)

**动效设计**：

- 卡片hover：translateY(-4px) + rotate(0.5deg) 模拟纸片飘起
- 图标hover：scale(1.08) + rotate(-3deg) 手绘弹跳感
- 装饰元素：缓慢漂浮动画（translate + rotate）
- 箭头：translateX(3px) 右移动效

## Agent Extensions

### Skill

- **frontend-design**
- Purpose: 生成高质量的前端UI代码，确保重构后的快速记录卡片达到宫崎骏手绘治愈风格的设计标准
- Expected outcome: 符合宫崎骏风格设计的React JSX组件代码（手绘风图标+特殊文字处理+自然元素装饰）+ 配套CSS样式（温暖配色+纸张纹理+有机形状+漂浮动效）

- **design-to-code-workflows**
- Purpose: 提供从设计到代码的完整工作流指导，确保宫崎骏风格卡片的实现符合设计规范
- Expected outcome: 完整的宫崎骏风格卡片设计实现方案，包含JSX结构、CSS样式、图标处理、文字特殊处理、装饰元素等全部细节