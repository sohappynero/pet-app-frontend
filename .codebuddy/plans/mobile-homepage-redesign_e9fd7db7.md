---
name: mobile-homepage-redesign
overview: 将 HomePetOS 手机端首页完全仿写为目标图片：左侧9项导航菜单、大宠物照片背景、右侧吊灯、底部水平布局玻璃信息卡、5Tab底部导航栏（含加号按钮）
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - Single-Light Immersive Space
    - Warm Ambient Glow
    - Glassmorphism
    - Pet-Friendly Warm Tones
    - Directional Lighting
    - Cream Bell Lamp Aesthetic
    - Mobile-First Vertical Layout
  fontSystem:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    heading:
      size: 22px
      weight: 800
    subheading:
      size: 16px
      weight: 700
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#FFFDF8"
      - "#FFD6A5"
      - "#F5B942"
    background:
      - rgba(30, 25, 20, 0.35)
      - rgba(255, 245, 230, 0.08)
    text:
      - "#FFFFFF"
      - "#E8DCC8"
      - "#D8C8B0"
    functional:
      - "#FF9EB5"
      - "#7C9885"
      - rgba(255, 214, 165, 0.40)
todos:
  - id: redesign-tabbar
    content: 用 [skill:frontend-design] 重构 GlassTabBar + RouterGlassTabBar：从4Tab扩展至5Tab(首页/动态/➕/日记/我的)，中间➕按钮特殊暖黄样式，更新路由映射
    status: completed
  - id: redesign-drawer
    content: 用 [skill:impeccable] 重构 Drawer 组件：MENU_ITEMS从6项扩展到9项(我的宠物/健康记录/AI分析/心情日记/喂食提醒/提醒中心/商城中心/设置)+底部切换宠物卡片区域
    status: completed
  - id: redesign-topbar
    content: 修改 HomePetOS 顶部栏：标题改为 ✨欢迎语格式("宠物名，今天也要开心哦～")，调整menu-btn位置和样式
    status: completed
  - id: redesign-pet-card-layout
    content: 用 [skill:impeccable] 重构信息卡为**水平布局**(左头像+右信息)：移除owner-bar、新增毛发颜色/体型描述行、Read More行+聊天按钮重组、新增右侧"下拉切换宠物⌄"提示
    status: completed
    dependencies:
      - redesign-topbar
  - id: refine-lamp-appearance
    content: 微调 LampSwitch 灯罩外观：颜色调整为奶油色系(#FFF8E7/#FFE8CC)、增大灯罩尺寸感、强化猫爪吊坠的粉色肉垫视觉效果
    status: completed
  - id: global-css-polish
    content: 用 [skill:frontend-design] 全量CSS打磨：信息卡水平flex布局、5Tab样式、9项菜单间距/图标/高亮态、方向性光照微调、响应式适配、确保lint通过
    status: completed
    dependencies:
      - redesign-tabbar
      - redesign-drawer
      - redesign-pet-card-layout
  - id: verify-lint
    content: 运行lint检查确认无错误，验证所有改动文件语法正确，CSS变量引用完整
    status: completed
    dependencies:
      - global-css-polish
---

## 产品概述

将 HomePetOS 手机端首页**精确仿写**目标照片(image.f66b49443f.png)的设计。这是一个完整的宠物APP首页，包含左侧导航菜单、大宠物照片背景、右侧吊灯系统、底部浮起玻璃信息卡、底部5Tab导航栏。

## 核心功能需求（按照片从底到顶）

### 1. 底部 Tab 栏（5个Tab）

- 首页🏠(暖黄高亮) | 动态🪐 | ➕(中间大圆加号按钮，暖黄色填充) | 日记📒 | 我的👤
- 圆角胶囊玻璃质感背景，激活态为暖黄色

### 2. 左侧导航抽屉菜单（已展开状态）

- 毛玻璃半透明面板
- 9项菜单：我的宠物🐾(粉色高亮) / 健康记录📋 / AI分析📊 / 心情日记💛 / 喂食提醒🔔 / 提醒中心🔔 / 商城中心🛍️ / 设置⚙️
- 底部：切换宠物 > 卡片（带头像的小行）

### 3. 顶部栏

- 左侧：☰ 圆形玻璃汉堡按钮
- 居中：✨ "诺怒，今天也要开心哦～"（欢迎语）

### 4. 主视觉区域

- 大型布偶猫照片作为全屏背景（模糊降级）
- 右侧吊灯发出的暖光照射效果

### 5. 右侧吊灯系统（视觉主角）

- 奶油色钟形灯罩（顶部有 ✨ 猫爪图标）
- 编织麻绳垂下
- 粉色猫爪吊坠（肉垫图案）
- 明显的暖黄色光晕 + 星芒装饰粒子
- 拖拽交互保持不变

### 6. 底部浮起信息卡（水平布局，玻璃拟态）

- 左侧：方形圆角宠物小头像
- 右侧信息区：
- "诺怒" ♂ + ❤️ 收藏按钮(圆形粉色)
- 📍 布偶猫（品种）
- 三属性标签：性别=公 | 年龄=0岁 | 体重=3.3kg
- "毛发颜色: 奶油色 体型: 小型"
- "Read More >" | 💬 聊天按钮
- 卡片右外侧："下拉切换宠物 ⌄"

## 视觉层级强制要求

1. 灯（最强视觉权重）> 光照范围 > UI卡片 > 背景图（最弱）
2. 所有卡片必须被右侧灯光影响（右亮左暗方向性光照）
3. 背景始终是模糊氛围层

## Tech Stack

- **框架**: React + TypeScript (已有项目，不变)
- **样式**: CSS Variables + home-dashboard.css (已有1865行，在其上修改)
- **组件**: 复用 LampSwitch/PetBackground/Drawer/GlassTabBar 架构
- **图标**: lucide-react (已有依赖)

## Implementation Approach

### 核心策略：在现有4层架构上逐块仿写

不改变架构，只改每个层的**视觉呈现和布局**：

1. **HomePetOS.tsx**: 重构信息卡从垂直→水平布局；顶部标题改为欢迎语；添加右侧切换提示
2. **Drawer.tsx**: 从6项扩展到9项菜单+底部切换宠物卡片
3. **GlassTabBar.tsx + RouterGlassTabBar.tsx**: 从4Tab扩展到5Tab（加中间➕按钮），图标升级
4. **LampSwitch.tsx**: 微调灯罩外观更接近照片（钟形感更强、颜色调为奶油色）
5. **home-dashboard.css**: 全量CSS更新匹配照片中的每个细节

### 关键技术决策

| 决策点 | 方案 | 理由 |
| --- | --- | --- |
| 信息卡布局 | flex-row（头像左+信息右） | 照片显示的是水平排列 |
| 主人信息栏 | 移除，替换为毛发/体型描述行 | 照片中没有主人信息 |
| Tab栏5Tab | 在GlassTabBar DEFAULT_ITEMS中加入动态/加号/日记 | 匹配照片5Tab |
| 左侧菜单9项 | 扩展Drawer MENU_ITEMS数组 | 直接在Drawer中修改 |
| 吊灯外观 | 调整LampSwitch内联样式渐变色 | 不需要新组件 |
| 切换提示 | 在immersive-pet-card右侧absolute定位 | 新增UI元素 |


## Architecture Impact

```
HomePetOS.tsx [MODIFY]
├── topbar: 标题 → ✨欢迎语
├── pet-card: 垂直→水平布局
│   ├── 移除 owner-bar
│   ├── 新增 毛发颜色/体型 行
│   └── 新增 右侧切换提示
└── 结构不变（4层架构保留）

GlassTabBar.tsx [MODIFY]
├── DEFAULT_ITEMS: 4→5 items (首页/动态/➕/日记/我的)
└── 中间 ➕ 按钮特殊样式

RouterGlassTabBar.tsx [MODIFY]
├── TAB_TO_PATH: 加入 dynamic/timeline 别名映射
└── pathToTabKey: 加入新路径匹配

Drawer.tsx [MODIFY]
├── MENU_ITEMS: 6→9 items
├── 新增底部"切换宠物"卡片区域
└── 保持玻璃质感一致

home-dashboard.css [MODIFY 大量]
├── .immersive-pet-card → 水平flex布局
├── .immersive-avatar-section → 左侧方形头像
├── 新增 .pet-switch-hint (右侧提示)
├── 新增 .fur-coat-line (毛发/体型行)
├── GlassTabBar 5Tab 样式
├── Drawer 9项菜单样式
└── 微调吊灯颜色参数
```

## Directory Structure

```
src/
├── pages/
│   └── HomePetOS.tsx          # [MODIFY] 信息卡水平布局+欢迎语+切换提示
├── components/
│   ├── PetBackground.tsx      # [保持] 已有模糊降级
│   ├── LampSwitch.tsx         # [MINOR] 微调灯罩颜色
│   ├── Drawer.tsx             # [MODIFY] 9项菜单+切换宠物卡片
│   ├── AppShell.tsx           # [保持] TabBar容器
│   └── petos/
│       ├── GlassTabBar.tsx    # [MODIFY] 5Tab定义
│       └── RouterGlassTabBar.tsx  # [MODIFY] 5Tab路由映射
└── styles/
    └── home-dashboard.css     # [MODIFY 大量] 全部视觉仿写CSS
```

## 设计风格：单光源沉浸式宠物空间 (Single-Light Immersive Pet Space)

整体设计理念是"被猫爪吊灯照亮的温暖宠物房间"。手机端竖屏布局，所有UI元素漂浮在被灯光影响的半透明介质中。

### 页面规划（手机端竖屏 ~390x844pt）

#### Page 1: 首页 (核心页面)

**Block 1 — 底部 Tab 导航栏 (固定)**
圆角胶囊形毛玻璃导航栏，5个均分Tab。中间➕号按钮为暖黄色实心圆形突出显示。"首页"Tab激活态为暖黄高亮带柔和发光。整体有微弱的上边框发光效果。

**Block 2 — 左侧导航抽屉 (可展开)**
从左边缘滑出的毛玻璃面板，覆盖屏幕70%宽度。顶部有猫爪粉色水印装饰。菜单项使用圆角玻璃按钮样式，每项含图标+文字。"我的宠物"项用粉色渐变背景高亮。底部有"切换宠物"快捷入口卡片。

**Block 3 — 顶部状态栏**
左侧圆形毛玻璃汉堡按钮（内含☰图标）。居中显示欢迎语"✨ 宠物名，今天也要开心哦～"，字体略粗，暖白色。

**Block 4 — 主视觉背景层 (全屏)**
大型宠物照片（布偶猫）作为全屏背景，应用 blur+brightness+saturate 降级滤镜成为情绪底图。右上角区域被吊灯光照亮形成暖色调径向渐变。

**Block 5 — 右侧吊灯系统 (绝对定位)**
从顶部垂下的精致奶油色钟形吊灯。灯罩上有猫爪✨图标装饰。编织麻绳自然下垂连接到底部粉色肉垫猫爪吊坠。灯发出明显的暖黄色径向光晕（#FFDCA0色调），带有星芒粒子和soft bloom效果。拖拽交互时光圈扩大增强。

**Block 6 — 底部浮起信息卡 (玻璃拟态, 水平布局)**
位于页面中下部的圆角矩形玻璃卡片：

- 左侧：80x80px方形圆角宠物头像，白色细边框
- 右侧主信息区：
- 第一行：名字(24px bold 白色)+♂性别符号 + 右侧❤️收藏圆按钮(粉填充)
- 第二行：📍品种文字（浅金色）
- 第三行：三等宽属性标签(性别/年龄/体重)，玻璃质感背景
- 第四行："毛发颜色: xxx 体型: xxx" 描述
- 第五行："Read More >" 金色链接 | 右侧💬聊天圆按钮
- 卡片右外侧绝对定位："下拉切换宠物 ⌄" 提示文字（竖排，低透明度）
- 整体有方向性光照（右侧亮于左侧）

## Skill

- **impeccable**
- Purpose: 对整个首页进行精细化打磨 — 包括信息卡水平布局的像素级对齐、玻璃拟态参数（透明度/模糊度/边框）、吊灯颜色精调到奶油色(#FFF8E7)、Tab栏5Tab的视觉权重平衡、以及确保所有元素符合"单光源沉浸式"的方向性光照逻辑
- Expected outcome: 输出产品级精细CSS参数集和组件结构，确保最终呈现与目标照片一致的视觉效果

- **frontend-design**
- Purpose: 创建/重构各UI块的视觉实现 — 信息卡水平布局CSS、5Tab导航栏样式、9项左侧菜单面板、顶部欢迎语栏、右侧切换提示元素
- Expected outcome: 各UI块的具体CSS和TSX代码实现