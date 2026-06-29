---
name: home-petos-redesign-pet-profile
overview: 按设计图重构 HomePetOS 首页：暖黄背景、大图Hero区、爪印水印、信息卡片、属性标签、底部CTA，完全替换当前圆环布局
design:
  architecture:
    framework: react
  styleKeywords:
    - Warm Pet Profile
    - Cream Yellow Background
    - Rounded Cards
    - Paw Print Decorations
    - Cozy Typography
    - Golden CTA
    - Soft Shadows
  fontSystem:
    fontFamily: "-apple-system, SF Pro Display, Helvetica Neue, PingFang SC, sans-serif"
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
      - "#E09A30"
      - "#FFC76A"
    background:
      - "#FEF3D8"
      - "#FFFFFF"
      - rgba(255,200,120,0.25)
    text:
      - "#1A1A1A"
      - "#555555"
      - "#888888"
    functional:
      - "#FFFFFF"
      - "#E066A0"
      - "#17A2B8"
todos:
  - id: rewrite-jsx
    content: 使用 [skill:impeccable] + [skill:frontend-design] 重写 HomePetOS.tsx JSX 为卡片堆叠布局(顶栏+Hero+信息卡+CTA)
    status: pending
  - id: rewrite-css
    content: 全量重写 home-dashboard.css 匹配新设计(奶油黄背景、爪印水印、属性标签、金黄色CTA)
    status: pending
    dependencies:
      - rewrite-jsx
  - id: paw-print-svg
    content: 实现SVG爪印水印装饰元素的代码(4处定位+不同大小透明度)
    status: pending
    dependencies:
      - rewrite-jsx
  - id: screenshot-verify
    content: 使用 [mcp:MCP Server Playwright] 截图验证最终效果是否符合设计图
    status: pending
    dependencies:
      - rewrite-css
      - paw-print-svg
---

## 产品概述

将 HomePetOS 首页从当前的圆环系统布局，完全重构为用户提供的宠物详情卡片样式。设计图为一张温馨的宠物领养/详情页截图，采用奶油黄背景 + 大图 Hero 区 + 白色信息卡片的堆叠布局。

## 核心功能需求

### 页面整体结构（自上而下）

1. **顶部导航栏**：左侧返回箭头（白色圆形按钮）+ 右侧更多操作（三点白圆形按钮），替代当前欢迎卡片+搜索/消息/通知工具栏
2. **Hero 大图区域**：

- 大尺寸宠物全身照片居中展示
- 照片下方浅色椭圆底座阴影
- 背景装饰：**爪印水印**（淡黄色，分布在左上、右上、左下等位置，半透明效果）

3. **白色信息卡片**：

- **标题行**：宠物名称（粗体大字）+ 右侧心形收藏图标（白色圆形背景+黑色实心心形）
- **距离行**：📍 Distance Xkm（可映射为宠物距离或隐藏）
- **属性标签组**（3个并排）：Gender / Age / Weight — 每个标签为浅黄/奶油色圆角矩形背景
- **主人行**：头像(圆形) + 姓名 + 角色描述 + 右侧2个圆形操作按钮（聊天橙色填充 + 电话描边）
- **描述区**：文字段落 + "Read More" 展开/收起

4. **底部 CTA 按钮**：大圆角金黄色按钮 "Adopt Now" 风格（可改为"查看健康报告"等功能入口）

### 数据映射关系

| 设计图元素 | 数据来源 | 字段 |
| --- | --- | --- |
| 宠物名称 | selectedPet | name |
| 宠物照片 | petAvatarUrl() | avatar_url/image_url/_resolved_avatar_url |
| Gender 标签 | selectedPet | gender (male/female/unknown) |
| Age 标签 | selectedPet | age |
| Weight 标签 | selectedPet | weight_kg |
| 主人名称 | useShell() | nickname |
| 描述文字 | selectedPet | notes |
| 品种/物种 | selectedPet | breed / species |


### 设计风格要点

- **主背景**: 奶油黄 `#FEF3D8`（当前为 `#F4F7F9` 浅灰蓝）
- **字体**: 现代 sans-serif（当前为 ZCOOL KuaiLe 手写体）
- **圆角**: 大量使用圆角（卡片 ~24px, 按钮 ~50px, 标签 ~16px）
- **配色暖调**: 奶黄 + 白 + 金橙 CTA + 淡黄标签底色
- **装饰元素**: SVG 爪印水印（3-4处淡色定位）

## Tech Stack

- React 19 + TypeScript（现有项目不变）
- 原生 CSS（home-dashboard.css 全量重写）
- Lucide React 图标库（已有依赖）
- 内联 SVG 用于爪印水印和装饰元素

## 实现方案

### 架构决策

完全替换 HomePetOS 的 JSX 结构和 CSS，保留数据获取逻辑（fetchAnalysisDashboard/fetchReminders）用于健康分数等信息展示。

### 新页面结构

```
hd-page (背景 #FEF3D8, 字体改用系统 sans-serif)
├── hd-top-bar                    // 顶部栏: 返回箭头(左) + 更多(右), 白色圆钮
│   ├── hd-back-btn               // < white circle, ArrowLeft icon
│   └── hd-more-btn              // < white circle, MoreHorizontal icon
├── hd-hero-section              // Hero 大图区 (相对定位, 用于爪印装饰)
│   ├── .hd-paw-print × 4        // 爪印水印 SVG, 绝对定位各角落
│   ├── .hd-photo-container       // 图片容器
│   │   └── .hd-photo-base        // 椭圆底座阴影
│   │   └── img / emoji           // 宠物大图
│   └── .hd-pet-switcher          // 底部多宠物切换小点指示器(可选)
├── hd-info-card                 // 白色圆角信息卡片
│   ├── .hd-pet-header            // 名称 + 收藏心形
│   ├── .hd-pet-distance          // 📍距离行
│   ├── .hd-attribute-row         // 3个属性标签并排
│   │   ├── .hd-attr-tag(Gender)  // 浅黄圆角矩形
│   │   ├── .hd-attr-tag(Age)     // 浅黄圆角矩形
│   │   └── .hd-attr-tag(Weight)  // 浅黄圆角矩形
│   ├── .hd-owner-row             // 主人信息行
│   │   ├── .hd-owner-avatar      // 圆形头像
│   │   ├── .hd-owner-info        // 名字+角色
│   │   └── .hd-action-btns       // 聊天(橙)+电话(描边)
│   └── .hd-description           // 描述文字 + Read More
└── hd-bottom-cta                 // 金黄色大圆角CTA按钮
```

### 关键技术细节

1. **爪印水印**: 使用内联 SVG path 绘制爪印形状（1个大椭圆 + 4个小椭圆），通过 `opacity: 0.08~0.12` 和 `position: absolute` 定位在 hero 区域四角
2. **椭圆底座**: `.hd-photo-base` 用 `border-radius: 50% / 40%` 的椭圆 div，配合 `box-shadow` 和 `transform: scaleY(0.3)` 压扁成地面阴影效果
3. **属性标签**: `background: rgba(255,200,120,0.25)` 类似设计图中浅黄底色，`border-radius: 16px`, `padding: 10px 18px`
4. **收藏心形**: 使用 lucide `Heart` 图标，fill 当前用黑色实心
5. **CTA 按钮**: `background: linear-gradient(135deg, #F5B942, #E09A30)` 金黄渐变，`border-radius: 28px`，大尺寸
6. **字体替换**: 从 `'ZCOOL KuaiLe'` 改为 `-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif`

## 文件修改清单

```
src/pages/HomePetOS.tsx    [REWRITE] - JSX结构完全重写为卡片堆叠布局
src/styles/home-dashboard.css [REWRITE] - CSS全部重写匹配新设计
```

## 设计风格: 温馨宠物档案卡 (Warm Pet Profile Card)

整体采用**温暖治愈系**的宠物领养/档案风格，以奶油黄为主色调，营造柔和、亲切、有温度的视觉感受。

## 页面规划

### 页面1: HomePetOS 首页（唯一页面）

#### Block 1: 顶部导航栏 (Top Bar)

- 固定高度56px的顶栏，左右各一个白色圆形按钮(diameter=44px)
- 左侧: 返回箭头(ArrowLeft)，深灰图标；右侧: 三点更多(MoreHorizontal)
- 按钮带微妙阴影 `box-shadow: 0 2px 10px rgba(0,0,0,0.06)`
- 背景透明，融入页面奶油黄背景

#### Block 2: Hero 大图区 (Pet Photo Hero)

- 高度约340px的区域，相对定位容器
- **爪印水印装饰**: 4个SVG爪印散布于左上/右上/左下/右下角落，opacity 0.08-0.12，尺寸60-90px不等，颜色与背景同色系略深
- **宠物照片**: 居中显示，最大宽度240px，最大高度300px，object-fit: cover，border-radius: 20px，白色边框4px，box-shadow柔和投影
- **椭圆底座**: 照片底部压着一个扁平ellipse(rgba(180,150,100,0.15))作为地面阴影，width: 180px, height: 40px, border-radius: 50%, filter blur

#### Block 3: 白色信息卡片 (Info Card)

- 白色圆角卡片(border-radius: 28px)，margin-top: -20px向上重叠Hero区底部，创造层次感
- 内部padding: 24px，垂直排列各子块

**子块 3a - 标题行**:

- 左侧: 宠物名称(font-size: 26px, font-weight: 700, color: #1a1a1a)
- 右侧: 直径44px白色圆形按钮，内含黑色实心心形图标(fill)

**子块 3b - 距离行**:

- 📍 图标 + "Distance 2km" 文字(font-size: 14px, color: #888)

**子块 3c - 属性标签组**:

- flex横向排列，gap: 12px
- 每个标签: 浅黄背景(rgba(245,200,120,0.3))，border-radius: 16px，padding: 12px 20px
- 标签标题: font-size: 15px font-weight: 600 color: #333
- 标签值: font-size: 13px color: #666 margin-top: 2px
- 3个标签等宽或自适应: Gender(Male/Female) | Age(来自age字段) | Weight(Xkg)

**子块 3d - 主人行**:

- 横向flex布局，两端对齐(space-between)
- 左侧: 圆形头像(40px) + 名字(nickname, font-weight:600) + 角色("宠物主人", 小字灰色)
- 右侧: 两个圆形按钮(直径42px) — 聊天按钮(金黄色填充#F5B942+MessageCircle白图标) + 电话按钮(白底+Phone描边)

**子块 3e - 描述区**:

- 文字段落(font-size: 14px, color: #555, line-height: 1.6)，默认显示3行截断
- "Read More": 内联链接样式的展开/收起按钮(font-size: 14px, font-weight: 600, color: #333)

#### Block 4: 底部CTA按钮 (Bottom Action)

- 全宽按钮(height: 56px, border-radius: 28px)
- 背景: 金黄渐变(linear-gradient(135deg, #F5B942, #E09A30))
- 文字: "查看健康档案"(font-size: 17px, font-weight: 600, color: white)
- 阴影: 0 6px 20px rgba(224,154,48,0.35)
- 点击跳转到健康诊断/insights页面

## Agent Extensions

### Skill

- **impeccable**
- Purpose: 确保重新设计的 UI 达到高质量视觉标准，包括布局精度、间距一致性、颜色协调、响应式适配和无障碍性审查
- Expected outcome: 产出精致、专业的宠物档案卡界面，避免模板化AI美学

- **frontend-design**
- Purpose: 生成高质量的生产级前端代码组件，确保CSS样式精确还原设计图的视觉效果
- Expected outcome: 精准实现奶油黄背景、爪印装饰、圆角卡片等设计要素的代码

### MCP

- **MCP Server Playwright**
- Purpose: 截图验证重写后的首页视觉效果是否与设计图一致
- Expected outcome: 通过 localhost:5173 截图确认所有区块渲染正确