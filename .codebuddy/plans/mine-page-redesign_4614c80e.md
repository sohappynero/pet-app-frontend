---
name: mine-page-redesign
overview: 根据 image.png 的设计稿重新设计"我的"(Mine)页面，包括新的布局结构、配色方案、组件样式和交互元素
design:
  architecture:
    framework: react
  styleKeywords:
    - Warm Minimalism
    - Card-based Layout
    - Large Border Radius
    - Generous Whitespace
    - Neutral Warm Palette
  fontSystem:
    fontFamily: "'PingFang SC', 'Noto Sans SC', -apple-system, sans-serif"
    heading:
      size: 28px
      weight: 800
    subheading:
      size: 18px
      weight: 700
    body:
      size: 15px
      weight: 400
  colorSystem:
    primary:
      - "#3D3D3D"
      - "#E86A50"
      - "#D94833"
    background:
      - "#F5F0ED"
      - "#FAF7F5"
      - "#FFFFFF"
    text:
      - "#2D2D2D"
      - "#6B6560"
      - "#9E998F"
    functional:
      - "#E86A50"
      - "#10B981"
      - "#EF4444"
todos:
  - id: refactor-mine-page
    content: 使用 [skill:frontend-design] 重构 Mine.tsx 组件结构，实现5个功能区块（标题区、用户卡片、宠物品种、偏好设置、其他设置）并更新 index.css 配色和样式
    status: completed
  - id: update-bottom-nav
    content: 检查并更新 AppShell 底部导航栏从4 Tab扩展为5 Tab（首页/健康/陪伴/动态/我的）
    status: completed
  - id: verify-style-consistency
    content: 验证整体风格一致性，确保颜色、圆角、间距符合设计稿规范
    status: completed
    dependencies:
      - refactor-mine-page
      - update-bottom-nav
---

## 产品概述

将现有的"我的"页面按照设计稿 (image.png) 进行全面的 UI 风格改造，采用浅色米白背景、分组卡片式布局、更大圆角和间距的现代设计风格。

## 核心功能

- **页面标题区**：大标题"我的"左对齐，副标题"宠物与账户管理"
- **用户信息卡片**：白色圆角卡片，左侧圆形头像区(带星星装饰图标)，中间显示昵称+宠物信息+橙色认证标记，右侧深灰"编辑资料"胶囊按钮
- **宠物品种选择卡片**：独立白色卡片，含用户图标、"宠物品种"主文字、"当前：狐狸"副文本、下拉箭头
- **偏好设置分组**：区块标题"偏好设置"，内含通知提醒、主题外观、隐私与安全三个设置行，每行有图标+标题+描述文字+右箭头
- **其他设置分组**：区块标题"其他"，含通用设置项
- **底部导航栏**：5个Tab项（首页、健康、陪伴、动态、我的），当前选中"我的"
- **右上角悬浮按钮**：红色圆形通知按钮(带N字母)

## 技术栈

- **框架**: React + TypeScript
- **样式**: 原生 CSS (index.css 中 `.my-*` 系列样式)
- **图标库**: lucide-react (已使用)
- **路由**: react-router-dom (useNavigate)
- **数据层**: useShell hook (nickname, pets, phone, selectedPetId, onLogout)

## 实现方案

### 整体策略

将 Mine.tsx 组件按设计稿重新组织为5个功能区块：(1) 页面头部标题区 (2) 用户信息卡片 (3) 宠物品种选择卡片 (4) 偏好设置分组卡片 (5) 其他设置分组卡片。同时在 index.css 中新增/覆盖对应的 `.mine-*` 系列样式类。

### 关键技术决策

1. **布局重构**：从当前的 profile-card + 两组菜单列表 改为 设计稿的5区块结构，增加"宠物品种"独立卡片和分组标题
2. **用户信息卡片**：头像区域改为更大的圆形容器(约80px)，内部放置星星/闪光装饰图标；右侧添加深色胶囊按钮"编辑资料"；底部增加认证标记(橙色对勾圆圈)
3. **菜单行升级**：每行增加描述性副文本（如"健康提醒、互动提醒"、"浅色/深色模式"、"数据权限管理"）
4. **分组标题**：新增轻量级的分组标签样式（小字号灰色文字，置于卡片上方）
5. **颜色方案迁移**：

- 背景: 从渐变紫粉 → 浅米白 `#F5F0ED` / `#FAF7F5`
- 卡片边框: 从粉色系 `#f1dce9` → 中性灰 `#E8E2DE`
- 文字主色: 从紫色 `#4b3457` → 深炭黑 `#2D2D2D`
- 图标背景: 从粉色调 → 暖灰/米色调
- 按钮: 新增深灰/黑色胶囊按钮 `#3D3D3D`

6. **底部导航栏**：从4个tab扩展为5个tab（首页、健康、陪伴、动态、我的），需要同步修改 AppShell 组件

### 架构影响范围

```
Mine.tsx          [MODIFY] - 重构组件结构，匹配新设计的5个区块
index.css         [MODIFY] - 新增 .mine-* 样式类，调整配色方案
AppShell.tsx      [MODIFY] - 底部导航栏从4tab改为5tab（可能需要修改）
```

### 数据流不变

- useShell hook 提供的数据(nickname, pets, phone等)保持不变
- 菜单项的路由跳转(to属性)保持不变
- onLogout 回调保持不变

## 设计风格：温暖简约的卡片式个人中心

整体采用**暖调米白背景**配合**大圆角白色卡片**的设计语言，营造温和、干净、现代的个人中心体验。参考 Apple HIG 的留白与层次感，结合 Material Design 的卡片阴影系统。

## 页面规划 (1屏 - "我的"个人中心页)

### 区块1 - 页面标题区

页面顶部左侧展示大标题"我的"(28px/800)，下方紧接副标题"宠物与账户管理"(14px/400 灰色)。右上角悬浮红色圆形通知按钮(48px直径，内含字母"N"，右上角有小圆点提示)。

### 区块2 - 用户信息卡片

白色圆角卡片(20px圆角)。水平布局：左侧80px圆形浅米色头像容器，内嵌星星/闪光装饰图标(橙棕色)；中间信息区包含昵称(20px/700)、宠物品种与陪伴天数(14px/400 灰色)、右下角橙色对勾认证徽章；右侧深灰/黑色胶囊按钮"编辑资料"(圆角20px)。

### 区块3 - 宠物品种选择卡片

独立的白色圆角卡片。左侧圆形用户图标背景(浅暖灰)；中间"宠物品种"标题(16px/600)+"当前：狐狸"描述(13px/400)；右侧下拉箭头。

### 区块4 - 偏好设置分组

区块标题"偏好设置"(13px/500 浅灰色，置于卡片上方左侧)。白色圆角卡片内含三行设置项：每行为左侧圆形浅色图标背景(40px)+中间标题(15px/600)+描述文本(12px/400 浅灰)+右侧箭头。三项分别为：通知提醒(铃铛图标/"健康提醒、互动提醒")、主题外观(调色板图标/"浅色/深色模式")、隐私与安全(盾牌图标/"数据权限管理")。

### 区块5 - 其他设置分组

区块标题"其他"。卡片内含通用设置项(齿轮图标/"语言、缓存、关于"+箭头)。

### 底部导航栏

固定底部的5 Tab导航：首页(房屋图标)、健康(心形图标)、陪伴(对话气泡图标)、动态(波浪线图标)、我的(人物图标)。选中态为深色高亮。

## Skill 扩展

- **frontend-design**
- Purpose: 用于生成高质量的前端 UI 代码，确保新设计的视觉还原度和代码质量
- Expected outcome: 产出符合设计稿风格的 React 组件代码和配套 CSS 样式