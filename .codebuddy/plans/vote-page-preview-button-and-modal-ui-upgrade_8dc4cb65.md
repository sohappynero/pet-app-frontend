---
name: vote-page-preview-button-and-modal-ui-upgrade
overview: 在功能投票页（FeatureVote.tsx）每张候选功能卡片上添加「提前预览」按钮，点击弹出专为投票页设计的新底部抽屉预览组件（VoteCandidatePreview.tsx），使用候选功能自带的 title/description/cover_image 字段动态展示；同时用 taste-skill + impeccable 标准对 FeaturePreviewModal 进行高品质视觉重设计。
design:
  architecture:
    framework: react
  styleKeywords:
    - 温暖宠物风
    - 粉紫渐变
    - 磨砂质感噪点
    - 柔光光晕
    - 横向时间轴
    - 精致微投影
    - 强调色边条
    - shimmer动效
    - 移动端优先
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 26px
      weight: 800
    subheading:
      size: 15px
      weight: 700
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#E88A9A"
      - "#C46EC8"
      - "#9B6FD4"
    background:
      - "#FFF5F8"
      - "#F8F4FF"
      - "#FFFFFF"
    text:
      - "#1E1E2E"
      - "#6B6080"
      - "#B0A8C0"
    functional:
      - "#E88A9A"
      - "#9B6FD4"
      - "#52C47A"
todos:
  - id: create-vcp-component
    content: 新建 VoteCandidatePreview.tsx：底部抽屉组件，用 [skill:impeccable] 规范布局，展示封面图/渐变占位/功能名/描述/状态标签/关闭按钮
    status: completed
  - id: upgrade-feature-preview-modal
    content: 用 [skill:design-taste-frontend] + [skill:impeccable] 全面升级 FeaturePreviewModal.tsx 视觉：drag indicator、噪点纹理叠加、横向亮点行、时间轴里程碑，同步升级 index.css 的 fp-* 样式
    status: completed
  - id: integrate-vote-page
    content: 修改 FeatureVote.tsx：CandidateCard 加 onPreview prop 和右上角预览按钮，父组件加 previewCandidate state 及条件渲染，index.css 追加 vcp-* 样式
    status: completed
    dependencies:
      - create-vcp-component
---

## 用户需求

### 功能投票页添加「提前预览」入口

在 `FeatureVote.tsx` 的每张候选功能卡片（`CandidateCard`）上添加「提前预览」按钮，点击后弹出底部抽屉展示该功能的静态预览界面。预览内容来自候选功能本身自带的 `title / description / cover_image` 字段，不依赖任何硬编码数据。

### FeaturePreviewModal UI 全面升级

现有 `FeaturePreviewModal`（Mine 页「更多服务」入口）视觉偏土，需要运用 taste-skill（宠物风、粉色调、可爱专业）+ impeccable（布局结构、间距系统、层级规范）重新设计，升级为产品级 UI。

## 核心功能

- **新增 VoteCandidatePreview 组件**：独立的底部抽屉预览卡片，适配动态后端数据（无 cover_image 时用渐变占位），展示功能名/描述/「投票中」状态标签，纯预览无业务逻辑
- **FeatureVote.tsx 集成预览入口**：在 `CandidateCard` 右上角添加「提前预览 👀」胶囊按钮，不影响投票操作
- **FeaturePreviewModal 视觉重设计**：英雄区增加磨砂纹理叠加+光晕装饰；功能亮点从朴素网格升级为精致行列卡片（左侧强调色条+微阴影）；进度区改为横向时间轴视觉；整体增加卡片圆角质感、微投影层次、背景底色渐变；不改动任何数据结构和业务逻辑

## 技术栈

与现有项目一致：React + TypeScript + 纯 CSS（index.css）+ lucide-react 图标

## 实现思路

### Task 1：新建 VoteCandidatePreview.tsx

独立组件，接受 `VotingCandidate` 整个对象作为 prop，底部抽屉滑入动画复用 `.fp-overlay / .fp-sheet` 的 CSS keyframe 模式，但新增 `.vcp-*` 命名空间样式避免冲突。

- `cover_image` 有值时：全宽展示封面图（`object-fit: cover`，高度 200px）
- `cover_image` 为 null 时：用渐变色块 + 大 emoji 占位（根据 title 首字符取色哈希或固定宠物主题渐变池）
- 功能名 + 描述区域用卡片包裹，「投票中」用品牌粉色胶囊标签
- 底部仅有「我知道了」关闭按钮，不包含任何投票操作

### Task 2：FeatureVote.tsx 集成

- `CandidateCard` 组件新增 `onPreview` 回调 prop
- 父组件 `FeatureVote` 新增 `previewCandidate` state（`VotingCandidate | null`）
- 在 `CandidateCard` 卡片右上角绝对定位「提前预览 👀」胶囊按钮，`e.stopPropagation()` 不影响其他点击逻辑
- 条件渲染 `VoteCandidatePreview` 组件

### Task 3：FeaturePreviewModal + index.css 视觉重设计

**改动范围**：只修改样式表现，不改组件 props、数据结构、业务逻辑：

- `fp-sheet` 背景改为 `linear-gradient(180deg, #FFF5F8 0%, #F8F4FF 100%)`，增加顶部 drag indicator
- `fp-hero` 增加 `::after` 伪元素叠加 SVG 噪点纹理（内联 base64）+ 左上角白色光晕圆
- `fp-highlight-card` 改为横向 flex 布局（左侧 emoji 圆形背景块 + 右侧文字），添加左侧 3px 强调色边条
- `fp-progress-track` 进度条增加 shimmer 光泽动画（@keyframes shimmer）
- 里程碑改为 `display: flex; flex-direction: row` 带连接线的时间轴：节点间用 flex-grow 横线连接
- `fp-section` 增加 `box-shadow: 0 2px 12px rgba(180,120,200,0.08)` 紫粉微投影

## 实现注意事项

- **不修改** `VotingCandidate` 接口、`vote.api.ts`、任何投票业务逻辑
- `VoteCandidatePreview` 的动画 keyframe 与 `FeaturePreviewModal` 同名会冲突，在 index.css 中复用已有 `fpFadeIn / fpSlideUp`，`.vcp-overlay` 和 `.vcp-sheet` 使用同样动画
- shimmer 动画使用 `@media (prefers-reduced-motion: reduce)` 降级处理
- 预览按钮在 `CandidateCard` 内使用 `position: absolute; top: 12px; right: 12px`，卡片需确保 `position: relative`（当前 Tailwind className `rounded-2xl bg-white shadow-sm p-4` 无定位，需补充 `relative`）

## 架构设计

```
src/
├── components/
│   ├── FeaturePreviewModal.tsx   [MODIFY] 只升级 JSX 结构细节（drag indicator、噪点叠加层、横向亮点行、时间轴里程碑）
│   └── VoteCandidatePreview.tsx  [NEW]    投票页专属预览抽屉，接收 VotingCandidate，纯展示
├── pages/
│   └── FeatureVote.tsx           [MODIFY] CandidateCard 加 onPreview prop + 右上角预览按钮；父组件加 previewCandidate state + 条件渲染
└── index.css                     [MODIFY] fp-* 样式全面升级 + 新增 vcp-* 命名空间样式
```

## 目录结构

```
src/
├── components/
│   ├── FeaturePreviewModal.tsx   # [MODIFY] 视觉升级：drag indicator、噪点纹理叠加层、横向亮点卡片（icon圆块+左强调线+文字）、横向时间轴里程碑（节点间连接线）、进度条shimmer动效。不改props/数据/业务逻辑。
│   └── VoteCandidatePreview.tsx  # [NEW] 投票页专属预览底部抽屉。Props: { candidate: VotingCandidate; onClose: () => void }。展示 cover_image（有图全宽，无图渐变+emoji占位）、功能名大标题、描述文本、「投票中」状态胶囊、「我知道了」关闭按钮。使用 .vcp-* CSS类。
├── pages/
│   └── FeatureVote.tsx           # [MODIFY] 1) CandidateCard新增onPreview prop，卡片补relative定位，右上角加绝对定位「提前预览 👀」胶囊按钮（stopPropagation）2) 父组件新增previewCandidate state，条件渲染VoteCandidatePreview，引入组件。
└── index.css                     # [MODIFY] 1) .fp-*样式升级：sheet背景渐变、hero噪点叠加伪元素、highlight-card横向重排+左强调色条、progress shimmer动画、里程碑横向时间轴连接线、section微投影优化 2) 新增.vcp-*命名空间：overlay/sheet/封面区/内容区/状态标签/关闭按钮 完整样式
```

## 设计风格

### FeaturePreviewModal 升级方向（taste-skill + impeccable）

**整体基调**：温暖宠物风，主色调粉紫渐变，圆润但专业，有亲和力的产品级 UI

**英雄区**：

- 渐变背景上叠加 SVG 噪点纹理（5% 透明度），增加质感而不显杂乱
- 左上角白色高斯光晕圆（120px，blur 60px，15% 白色），营造柔光氛围
- 顶部中央添加 drag indicator（宽 36px 白色圆角横条），统一抽屉交互规范
- emoji 浮标增大至 38px，白色圆形底板加强调色 2px 边框

**功能亮点卡片**：

- 从竖向居中网格改为横向 flex 行（左：emoji 圆形色块 44px，右：文字左对齐），更好展示信息层级
- 每行左侧添加 3px 强调色圆角竖条，与功能主题色联动
- 背景从 #F8F5FD 改为白色，加 `box-shadow: 0 1px 6px rgba(180,120,200,0.10)`

**进度时间轴**：

- 里程碑从 column flex 竖向文字改为横向排列，节点间用渐变细线连接（已完成段品牌色，未完成段灰色）
- 进度条加 shimmer 动画（从左到右移动的白色光泽，2s 无限循环）

**整体容器**：

- Sheet 背景改为 `linear-gradient(180deg, #FFF5F8 0%, #F8F4FF 100%)`
- Section 卡片加 `box-shadow: 0 2px 12px rgba(180,120,200,0.08)` 粉紫微投影

### VoteCandidatePreview 新组件

**封面区（高度 220px）**：

- 有图：全宽封面图 + 底部线性渐变蒙版，叠加「投票中」胶囊标签
- 无图：品牌粉紫渐变占位区 + 大 emoji（60px）居中 + 光晕装饰

**内容区**：

- 功能大标题（22px, 700）+ 描述文本（14px, 灰色，line-height 1.6）
- 「投票中 🗳️」粉色胶囊状态标签（outline 款）

**底部操作区**：

- 全宽「我知道了」按钮（品牌粉色渐变，高度 52px，border-radius 16px）
- 底部 safe-area 安全区适配

## 使用的 Agent 扩展

### Skill

- **impeccable**
- 用途：审查并重新设计 FeaturePreviewModal 的布局结构、间距系统、组件层级，修正视觉层级混乱、卡片嵌套过多、间距不规范等问题
- 期望产出：统一的间距系统、清晰的信息层级、规范的移动端组件结构、精致的微细节

- **design-taste-frontend**
- 用途：为 FeaturePreviewModal 和 VoteCandidatePreview 设定视觉风格方向，避免通用 AI 设计感，打造真实的宠物 APP 产品级 UI
- 期望产出：具有亲和力的粉紫色系配色、精致的英雄区视觉处理、非通用的卡片风格