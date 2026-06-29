---
name: mine-page-ui-upgrade
overview: 对 Mine.tsx 页面进行产品级 UI 升级，仅修改视觉样式（CSS），不触碰任何业务逻辑，将页面从 demo 质感提升为宠物 APP 产品级 UI。
design:
  architecture:
    framework: react
  styleKeywords:
    - Apple HIG Mobile
    - Warm Rose Pink
    - Pet App
    - Clean Cards
    - Soft Shadows
    - Round Corners
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 28px
      weight: 800
    subheading:
      size: 15px
      weight: 600
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#E88A9A"
      - "#D45B72"
    background:
      - "#FFF5F7"
      - "#FFF0F4"
      - "#FFFFFF"
    text:
      - "#2D2D2D"
      - "#9E998F"
      - "#D45B72"
    functional:
      - "#D4745C"
      - "#4CAF85"
      - "#FCCDD8"
todos:
  - id: fix-icons-and-colors
    content: 修改 Mine.tsx：将「我的宠物」图标由 FileText 改为 PawPrint，统一 mainMenus / secondMenus 图标颜色为粉色系梯度，升级 FEATURE_LIST 颜色方案
    status: pending
  - id: upgrade-mine-css
    content: 修改 index.css Mine 段落：背景改粉白渐变、卡片/头像/badge/阴影/悬停色全面统一为粉色品牌色系、规范间距、优化退出按钮和弹窗按钮色
    status: pending
    dependencies:
      - fix-icons-and-colors
---

## 用户需求

针对宠物 APP「我的」页面进行纯视觉 UI 升级，不改变任何业务逻辑、接口调用和数据结构。

## 产品概述

宠物健康管理 APP 的「我的」页面，包含用户信息卡片、功能菜单列表、更多服务宫格、退出登录按钮。当前页面视觉偏米棕暖色，缺乏品牌一致性，需要升级为粉色系宠物 APP 产品风格。

## 核心改造点

- **背景系统**：将 warm-paper 米棕背景替换为有品牌感的淡粉白渐变，贯穿粉色主题
- **用户信息卡片**：头像边框、阴影、徽章颜色统一为粉色系，增强品牌感和视觉存在感
- **菜单图标去重**：「我的宠物」和「健康报告」当前都使用 FileText 图标，改为各自语义化图标
- **菜单图标色系**：图标背景色从米棕散乱色改为粉色系统一调色盘（深浅有序）
- **更多服务区块**：标题样式规范化，服务卡片颜色方案升级为更鲜明的品牌粉色系
- **间距系统**：统一页面 gap、section margin 节奏，消除不一致的间距叠加
- **退出登录按钮**：提升视觉存在感，使用带边框和颜色的警示样式
- **弹窗按钮颜色**：coming-soon-btn 从金色改为品牌粉色

## 技术栈

- **框架**：React + TypeScript（Vite）
- **样式**：纯 CSS（src/index.css）+ 内联 style（Mine.tsx）
- **图标**：lucide-react（已有，复用已 import 的 PawPrint 图标）
- **无新依赖引入**

## 实现策略

### 设计 Dial 定义（taste-skill）

- DESIGN_VARIANCE: 6 — 移动端 APP，有序温暖，不做大结构变奏
- MOTION_INTENSITY: 4 — 保留已有 hover/active 微交互，不新增复杂动画
- VISUAL_DENSITY: 5 — 移动端信息密度适中

### 设计 Read（taste-skill 0.B）

读取为：宠物健康管理 APP 的个人中心页，受众为宠物主人（消费者），温暖可爱的宠物 APP 语言，粉色主题，偏 Apple HIG 风格的移动端产品 UI。

### 核心改动分工

**Mine.tsx（最小化改动）**

1. `mainMenus[0]`「我的宠物」图标从 `FileText` 改为已 import 的 `PawPrint`
2. `mainMenus` 各项 `iconColor` / `iconBg` 统一为粉色系调色盘（5个梯度，深浅有序）
3. `secondMenus` 各项 `iconColor` / `iconBg` 统一到粉色系（次级梯度）
4. `FEATURE_LIST` 各项 `color` / `bgColor` 升级为更鲜明的品牌粉色系渐变

**index.css Mine 段落（510-1068行）**

1. `mine-page-container` 背景：`linear-gradient(180deg, #FFF5F7 0%, #FFF0F4 100%)`
2. `mine-profile-card` border + shadow：粉色调阴影，粉色描边
3. `mine-avatar-container`：粉色渐变背景 + 粉色边框 `#F5C5D0`
4. `mine-star-deco`：颜色改为品牌粉 `#E88A9A`
5. `mine-verified-badge`：背景 `#FFF0F4`，文字/图标 `#E88A9A`，边框 `#FCCDD8`
6. `mine-card` shadow：warm-brown 阴影改为粉调 `rgba(212, 91, 114, 0.06)`
7. `mine-menu-row` hover 背景：改为 `#FFF5F7`
8. `mine-features-section`：margin-top 从 16px 调整为 0（已在 gap 系统内）
9. `mine-features-title`：去掉依赖 emoji，加左侧 2px 粉色短线 accent
10. `mine-feature-card` hover shadow：改为粉色调
11. `mine-feature-emoji` box-shadow：去除（减少脏感）
12. `mine-logout-btn`：border 改为粉色调描边 `rgba(212, 91, 114, 0.2)`，hover 背景 `#FFF5F7`
13. `coming-soon-btn`：从金色改为品牌粉 `linear-gradient(135deg, #E88A9A, #D45B72)`

### 绝对限制

- 不修改任何函数逻辑、state、effect、接口调用
- 不删除任何功能入口
- 不改变组件结构和 className 命名
- 不引入新的 npm 包

### Pre-flight 检查要点（impeccable）

- 零 em-dash
- 颜色一致性锁定：全页使用单一粉色主调 `#E88A9A / #D45B72`
- Shape 一致性：卡片 border-radius 18-20px，图标 badge 12px，badge pill 999px
- 按钮对比度：退出按钮文字 `#D4745C` 对白底 4.5:1 达标
- Ghost card 反模式规避：不给同一元素同时加 `border` + 大 `box-shadow`

## 文件改动范围

```
src/
├── pages/
│   └── Mine.tsx           [MODIFY] 仅改图标选择和 iconColor/iconBg/color/bgColor 数据
└── index.css              [MODIFY] Mine 页面相关 CSS 段落（约510-1068行）
```

## 设计风格

宠物 APP 移动端个人中心页，Apple HIG 移动设计语言，主色调为玫瑰粉系（#E88A9A / #D45B72），背景使用极淡粉白，卡片白底+粉调阴影，图标统一粉色梯度色系。整体温暖、有亲和力，但保持产品级克制感，不过度堆砌装饰。

### 页面区块结构（自上而下）

1. **页面标题区**：大号加粗标题 + 淡粉副标题，左对齐
2. **用户信息卡片**：圆形粉色边框头像 + 昵称 + 宠物数量 + 粉色已认证 badge，白底卡片 + 粉调投影
3. **主功能菜单卡片**：5 行，每行图标（粉色梯度背景方块）+ 标签 + 右侧文字 + 箭头，白底卡片
4. **更多服务区块**：区块标题（左侧粉色竖线 accent）+ 2列服务宫格（6张彩色渐变卡片）
5. **次要菜单卡片**：3 行，与主菜单同结构
6. **退出登录**：独立白底卡片，粉调边框，玫瑰红文字

## 使用的扩展

### Skill

- **impeccable**
- 用途：提供布局规范、间距系统、组件层级审查，确保产品级 UI 输出
- 预期结果：统一间距节奏、消除 ghost-card 反模式、确保 Shape 一致性和按钮对比度达标

- **design-taste-frontend**
- 用途：提供宠物 APP 视觉风格方向、色系选择、Anti-slop 检查，避免 AI 默认美学
- 预期结果：背景色脱离 warm-paper 默认，全页粉色主调一致，消除图标重复和颜色散乱问题