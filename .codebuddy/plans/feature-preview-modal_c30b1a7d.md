---
name: feature-preview-modal
overview: 为「更多服务」6张功能卡片添加「预览」入口，点击后弹出沉浸式功能预览模态框（参照图片风格：渐变英雄区+功能亮点+开发进度条+预约提醒按钮），纯静态展示，不改变任何业务逻辑。
design:
  architecture:
    framework: react
  styleKeywords:
    - Apple HIG Mobile
    - Full-screen Modal Sheet
    - Warm Rose Pink
    - Immersive Preview
    - Clean Cards
    - Soft Gradients
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 26px
      weight: 800
    subheading:
      size: 15px
      weight: 600
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#E88A9A"
      - "#D45B72"
    background:
      - "#FFFFFF"
      - "#F7F8FA"
      - "#FFF5F7"
    text:
      - "#1E1E2E"
      - "#9090A0"
      - "#D45B72"
    functional:
      - "#4CAF85"
      - "#F0A0B0"
      - "#FFE0E8"
todos:
  - id: create-feature-preview-modal
    content: 新建 FeaturePreviewModal.tsx：[skill:design-taste-frontend] + [skill:impeccable] 完成英雄区/亮点/进度/底部CTA完整组件及6功能静态数据
    status: completed
  - id: update-mine-tsx
    content: 修改 Mine.tsx：新增 previewFeatureId state，在 mine-feature-card 内添加左上角「预览」角标按钮，引入并条件渲染 FeaturePreviewModal
    status: completed
    dependencies:
      - create-feature-preview-modal
  - id: append-preview-css
    content: 在 index.css 末尾追加 .fp-* 命名空间样式：模态框全屏动画、英雄区、亮点卡片、进度条、里程碑节点、底部按钮全套样式
    status: completed
    dependencies:
      - create-feature-preview-modal
---

## 用户需求

在「更多服务」6张功能卡片上，添加「提前预览」入口按钮，点击后弹出沉浸式功能预览模态框，让用户直观了解未上线功能的界面和体验效果。

## 产品概述

宠物健康管理 APP 的「我的」页面「更多服务」区域共有 6 张待上线功能卡片（宠物殡葬、宠物TV、宠物食品、同城聊天、宠物医院、美容预约）。用户点击卡片目前只弹出一个简单的「即将上线」提示框。现在需要为每张卡片在左上角添加「预览」角标按钮，点击后展示专属的沉浸式功能预览页面。

## 核心功能

- **预览入口**：每张功能卡片左上角添加小角标按钮「预览」，视觉上突出但不破坏卡片原有布局
- **预览模态框结构**（参照截图风格）：
- 顶部 Header：返回关闭按钮 + 「即将上线 🐾」标题
- 英雄区：品牌色渐变背景 + 「功能正在开发中」胶囊标签 + 功能大标题 + 副标题 + 宠物场景插图
- 功能亮点：4个图标小卡片（图标 + 文字）
- 开发进度条：百分比进度 + 4个里程碑节点（需求分析、设计开发、内部测试、上线准备），各功能进度不同
- 底部区域：「已有 X 位宠主预约体验」统计 + 「预约上线提醒」主按钮
- **各功能专属内容**：每个功能有独立的渐变色、功能亮点列表、开发进度百分比、预约人数
- **纯展示**：所有数据静态硬编码，不涉及任何接口调用或业务逻辑改动
- **原有点击行为保留**：卡片本体点击仍弹出原有「即将上线」弹窗，只有角标按钮触发预览

## 技术栈

- **框架**：React + TypeScript（沿用项目现有）
- **样式**：纯 CSS 追加到 src/index.css（沿用现有约定，不引入 Tailwind 到此文件）
- **图标**：lucide-react（已有，沿用 Eye、ArrowLeft、Share2、CheckCircle、Clock、Circle 等）
- **图片**：Unsplash 免费图片 URL（宠物场景图）
- **无新依赖**

## 实现策略

### 方案设计

新建独立组件 `FeaturePreviewModal.tsx`，内含 6 个功能的全部静态预览数据（类型定义 + 数据常量），与 Mine.tsx 解耦。Mine.tsx 只新增一个 `previewFeatureId` state 和角标按钮，改动面极小。

### 数据结构

```ts
interface FeaturePreviewData {
  id: string
  title: string
  subtitle: string
  emoji: string
  gradientFrom: string
  gradientTo: string
  heroImageUrl: string          // Unsplash 宠物场景图
  highlights: { icon: string; text: string }[]  // 4条亮点
  progress: number              // 0-100，开发进度
  milestones: { label: string; done: boolean; active: boolean }[]
  reservationCount: number
}
```

### 关键实现细节

1. **卡片角标按钮**：`position: absolute; top: 6px; left: 6px`，在现有 `.mine-feature-card` 内（已有 `position: relative` 或需补加），`stopPropagation` 阻止冒泡，不干扰卡片原有点击
2. **模态框**：全屏覆盖（`position: fixed; inset: 0; z-index: 10000`），内部滚动区，进入动画 `slideUp`
3. **英雄区**：CSS 渐变背景（使用各功能专属 gradientFrom/To），Unsplash 图片作为右侧装饰
4. **进度条**：纯 CSS `width: ${progress}%` 动态宽度，里程碑节点用 flex 均匀分布
5. **图标**：沿用 lucide-react 已有图标，亮点卡片用 emoji 替代避免新增图标依赖

### 改动边界

- 不修改 `ComingSoonModal`、任何菜单逻辑、路由配置
- Mine.tsx 新增代码 < 20 行（1个state + import + 角标按钮 + 条件渲染）

## 文件改动范围

```
src/
├── components/
│   └── FeaturePreviewModal.tsx   [NEW] 沉浸式功能预览模态框，含6功能静态数据
├── pages/
│   └── Mine.tsx                  [MODIFY] 新增 previewFeatureId state + 角标按钮 + 条件渲染（< 20行）
└── index.css                     [MODIFY] 新增 .fp-* 样式类（feature-preview 命名空间，追加到文件末尾）
```

## 设计风格

功能预览模态框采用 Apple HIG 全屏底部抽屉风格，沉浸式体验。

### 各区块设计

**Header**：白底，左侧圆形关闭按钮（灰色），中间「即将上线 🐾」文字，右侧分享图标，固定在顶部。

**英雄区**：高度 200px，各功能独立渐变色背景（如宠物医院用玫红渐变，宠物TV用蓝紫渐变），左侧文字区（「开发中」胶囊 + 大标题 + 副标题），右侧 120x120 宠物场景图（圆角 16px，带白色投影）。

**功能亮点区**：白底，2x2 栅格排布，每个小卡片：40px emoji 背景圆 + 12px 文字描述，卡片圆角 12px，淡色背景。

**开发进度区**：白底卡片，标题「开发进度」+ 右侧百分比（品牌色），进度条高 8px 圆角，已完成段品牌粉色渐变，4个里程碑节点 flex 均分。

**底部**：白底，「已有 X 位宠主预约体验」灰色小字 + 「预约上线提醒 🔔」全宽品牌粉色渐变按钮。

### 卡片角标按钮

位于 `.mine-feature-card` 左上角，`position: absolute; top: 6px; left: 6px`，胶囊形状，白底半透明，小号文字「预览」，带细边框，点击涟漪效果。

## Agent Extensions

### Skill: design-taste-frontend

- **Purpose**: 确保模态框视觉风格不落入 AI 默认美学陷阱，英雄区渐变、卡片阴影、进度条颜色使用宠物 APP 专属品牌语言
- **Expected outcome**: 6个功能各有独特渐变色调，亮点卡片和进度区视觉层次清晰，整体有温暖亲和的宠物 APP 产品感

### Skill: impeccable

- **Purpose**: 审查模态框布局结构，确保 Header/英雄区/亮点区/进度区/底部 CTA 的间距系统一致，无 ghost-card 反模式，移动端适配
- **Expected outcome**: 各区块 padding/margin 统一规范，组件层级清晰，按钮对比度达标，触摸目标尺寸合规