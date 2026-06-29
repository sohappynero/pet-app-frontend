---
name: lamp-redesign-position
overview: 重新设计 LampSwitch 灯组件的视觉样式（更精致现代）并将位置从右下角移到更合理的区域（避免与信息卡重叠），保持原有拖拽切换宠物功能不变。
design:
  architecture:
    framework: react
  fontSystem:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    heading:
      size: 17px
      weight: 700
    subheading:
      size: 13px
      weight: 600
    body:
      size: 12px
      weight: 400
  colorSystem:
    primary:
      - "#E8A84C"
      - "#F0B046"
      - "#FFD6A5"
    background:
      - "#FFF8ED"
      - rgba(255,253,248,0.92)
    text:
      - "#5D4E37"
      - "#B8956A"
    functional:
      - "#7C9885"
      - "#FF9EB5"
      - "#4A90D9"
todos:
  - id: redesign-lamp-switch
    content: 用 [skill:impeccable] 重构 LampSwitch 组件：位置迁至右上角(top-20 right-5)、缩小尺寸、改吊灯化设计(吸盘+细绳+圆灯罩+小猫爪)
    status: completed
  - id: update-catpaw-handle
    content: 缩小 CatPawHandle 至 32px、移除下拉提示文字、优化光晕配色匹配新灯罩
    status: completed
    dependencies:
      - redesign-lamp-switch
  - id: update-rope-component
    content: 调整 Rope 组件：默认高度增至 80px、宽度缩至 1.5px、渐变色改为金色调
    status: completed
    dependencies:
      - redesign-lamp-switch
  - id: update-lamp-css
    content: 更新 home-dashboard.css 中 lamp-light-cone/lamp-glow-halo 等样式适配新位置和尺寸
    status: completed
    dependencies:
      - redesign-lamp-switch
  - id: verify-preview
    content: 用 [MCP Server Playwright] 启动 dev server 截图预览确认效果
    status: completed
    dependencies:
      - redesign-lamp-switch
      - update-catpaw-handle
      - update-rope-component
      - update-lamp-css
---

## 产品概述

重新设计 HomePetOS 页面中猫爪拉灯(LampSwitch)的**视觉样式**和**页面位置**。当前灯位于右下角 (right-6 bottom-24)，与底部宠物信息卡右侧（体重3.3kg标签附近）严重重叠，视觉拥挤且遮挡信息。

## 核心功能

- **位置迁移**: 将灯从右下角移至更合理的位置，不与信息卡重叠
- **样式升级**: 重新设计灯的外观，使其更精致、更有质感、符合整体 Soft Glass 奶油风美学
- **保持功能不变**: 拖拽交互(垂直下拉触发切换宠物)、光效系统(Glow Halo/Light Cone/Ambient)、状态机(idle→dragging→triggered)全部保留

## 当前问题分析（基于截图）

1. 灯在 `right: 24px, bottom: 96px` 处，恰好落在信息卡体重标签区域上方
2. 猫爪+拉绳+灯座组合视觉上比较"朴素"，缺乏精致感
3. "↓ 下拉 ↓" 提示文字与信息卡内容混在一起
4. 整体偏大偏重，不够轻盈优雅

## 技术栈

- React + TypeScript + 内联 Style + CSS 类
- CSS filter/box-shadow/backdrop-filter 光效系统
- Pointer Events 拖拽交互

## 实现方案

### 设计决策：位置选择

分析截图中的空白区域：

- **顶部区域**：顶部栏左侧有菜单按钮，中间是宠物名，右侧空白 -- 可行但可能干扰标题
- **右上角 (推荐)**：topbar 右侧占位区(36px宽)旁边，信息卡上方的大片背景图区域 -- 最优选择
- 不遮挡任何UI元素
- 背景是清晰的布偶猫照片，灯在上面很突出
- 符合真实吊灯"从天花板垂下"的物理直觉
- **信息卡右侧边缘**：仍然会拥挤，不推荐

**最终决定：将灯从 `right-6 bottom-24`(右下角) 移到 `right-5 top-20`(右上角)**，做成悬浮吊灯效果。

### 样式改造方向

1. **尺寸缩小**：从70px容器缩至56px左右，更精致不抢戏
2. **吊灯化设计**：

- 顶部加一个圆形吸盘/挂座（表示固定在天花板）
- 拉绳变长(60px→90px)，更纤细(2px)
- 灯罩改为圆润的小灯泡/灯笼造型（替代当前扁平椭圆）
- 底部猫爪缩小到36px

3. **配色升级**：使用暖金色系(#F5B942 → #FFD6A5)替代当前的米白色
4. **提示文字**：改为小气泡浮在灯旁边，不再占用垂直空间
5. **微动效**：idle时有轻微摇摆动画(模拟悬挂摆动)

### 涉及文件修改

| 文件 | 改动类型 | 说明 |
| --- | --- | --- |
| `src/components/LampSwitch.tsx` | MODIFY | 位置(top-20 right-5)、尺寸缩小、结构重组(吸顶+灯罩+拉绳+猫爪)、新样式 |
| `src/components/CatPawHandle.tsx` | MODIFY | 缩小SVG(44→36)、去掉"下拉"文字、优化光晕 |
| `src/components/Rope.tsx` | MODIFY | 默认长度加长、宽度减细、颜色调整 |
| `src/styles/home-dashboard.css` | MODIFY | 更新 `.lamp-light-cone` 位置适配新灯位、更新 `.lamp-glow-halo` 尺寸 |


### 架构影响范围

- HomePetOS.tsx 无需改动（props 接口不变）
- GlassOverlay/PetBackground/Drawer 完全不受影响
- 仅 LampSwitch 子组件树内部重构

## 页面设计说明

### 整体布局变化

当前页面为沉浸式宠物主页，全屏布偶猫背景图 + 底部半透明玻璃信息卡。灯组件从右下角(与信息卡重叠)迁移到**右上角悬浮区域**，形成"天花板垂下的吊灯"意象。

### 灯的新设计方案

**风格定位**: 温暖精致的迷你吊灯 (Mini Pendant Lamp)

- 融合日式暖灯(Warm Japanese Lamp)与北欧极简(Nordic Minimal)元素
- 配色：琥珀金(Amber Gold #E8A84C)、奶油白(Cream #FFF8ED)、暖橙渐变
- 材质感：哑光金属+柔光磨砂玻璃

**位置**: 固定定位于屏幕右上角 `right: 20px, top: 52px`（紧贴顶部栏下方），z-index: 30

**结构自上而下**:

1. **吸盘底座**(16x6px椭圆): 表示吸附在天花板，#D4C4B0色
2. **细拉绳**(1.5px宽, 80px高): 从米白渐变到浅金，带微发光
3. **圆形灯罩**(38x38px圆): 

- 外圈金色光环(#F0B046)
- 内部奶白渐变填充
- box-shadow 投射向下暖光

4. **猫爪手柄**(32x32px): 缩小版猫爪图标，位于灯罩下方/内部

### 交互细节

- idle态: 轻微摇摆动画(±2deg, 3s周期), 微弱脉动光晕
- dragging态: 灯罩放大1.05x, 光晕扩散, 光强增加
- triggered态: 爆发闪光 + ripple波纹, 切换宠物

### 信息卡区域

灯移走后，信息卡右侧完全释放，不再有任何遮挡。

## Skill

- **impeccable**
- Purpose: 对灯组件进行全面的 UI 设计审查和精细化打磨，确保新设计的灯在视觉上达到高端品质标准
- Expected outcome: 输出经过精心设计的灯组件代码，具有精致的视觉效果、合理的层次结构和流畅的交互动画

## MCP

- **MCP Server Playwright**
- Purpose: 修改完成后启动浏览器预览页面，截图确认灯的新位置和样式效果
- Expected outcome: 获得实际渲染效果的截图验证