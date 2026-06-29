---
name: vote-preview-redesign-fullscreen
overview: 将 VoteCandidatePreview 抽屉组件改造为图片截图风格的全屏预览页（即将上线卡片式），同时保留投票卡片上的「👀 预览」胶囊按钮入口不变
todos:
  - id: rewrite-vcp-component
    content: 用 [skill:design-taste-frontend] + [skill:impeccable] 重写 VoteCandidatePreview.tsx：全屏布局、顶部导航栏、Hero 封面区、四宫格功能亮点、横向里程碑时间轴、底部 CTA 按钮，Props 接口不变
    status: pending
  - id: rewrite-vcp-css
    content: 替换 index.css 中 .vcp-* 命名空间全部样式（约1538-1815行）：全屏容器、顶栏、Hero、四宫格 Grid、里程碑时间轴、CTA 大按钮，参照截图粉紫渐变风格
    status: pending
    dependencies:
      - rewrite-vcp-component
  - id: build-verify
    content: 运行 npm run build 验证 TypeScript 类型检查和构建通过，无新增错误
    status: pending
    dependencies:
      - rewrite-vcp-css
---

## 用户需求

### 核心目标

将投票页功能候选卡片上的「👀 预览」按钮点击后弹出的预览组件（`VoteCandidatePreview`），从现有的底部抽屉样式改造成截图所示的「全屏滑入详情页」风格。**入口按钮位置不变，业务逻辑不变，只改 VoteCandidatePreview 的 UI 呈现层。**

### 产品概览

参照截图，预览页包含 5 个功能区块：

1. **顶部导航栏**：左侧关闭/返回按钮 + 居中「即将上线」标题（带宠物爪图标） + 右侧分享图标（纯静态）
2. **Hero 封面区**：渐变背景（与功能主题色匹配）+ 宠物大图（cover_image 或 Unsplash 占位）+ 「功能正在开发中」胶囊标签 + 功能名大标题 + 副标题 + 当前阶段状态标签（如「实时追踪中」）
3. **功能亮点区**：白色圆角卡片 +「功能亮点」标题 + **4 宫格图标布局**（每格：圆形背景图标 + 文字，参照截图中定位/围栏/轨迹/提醒的网格）
4. **开发进度区**：白色圆角卡片 + 「开发进度」标题 + 右侧百分比数字 + 渐变进度条 + 4 个横向里程碑节点（已完成勾/当前阶段高亮箭头/未完成灰圈 + 节点标签）
5. **底部 CTA 区**：「已有 X 位宠主预约体验」文案（基于 vote_count 计算）+ 大渐变按钮「🔔 预约上线提醒」（纯静态，点击仅关闭） + 小说明文字

### 核心功能

- **VoteCandidatePreview 全量重写**：从底部抽屉改为全屏覆盖（`position: fixed; inset: 0`），内容区可滚动，入场动画从下方滑入
- **功能亮点四宫格**：将现有「行列」布局改为 2×2 宫格，图标用圆形背景块 + emoji 展示
- **里程碑横向时间轴**：4 个节点横向排列，节点间用连接线，与截图中样式一致
- **静态 CTA 底部区**：预约按钮仅做视觉，无真实功能
- **不改动任何其他文件**：`FeatureVote.tsx`、`FeaturePreviewModal.tsx`、`vote.api.ts`、业务逻辑均不修改

## 技术栈

与项目一致：React + TypeScript + 纯 CSS（index.css `.vcp-*` 命名空间）+ lucide-react 图标

## 实现思路

### 整体策略

- **仅修改 `VoteCandidatePreview.tsx` 和 `index.css` 的 `.vcp-*` 部分**，其余所有文件不动
- 布局从「底部抽屉」改为「全屏覆盖页」：`.vcp-overlay` 改为 `align-items: stretch`，`.vcp-sheet` 改为 `max-height: 100dvh; height: 100dvh; border-radius: 0`
- 入场动画保持 `fpSlideUp`（从下方滑入），与截图效果一致，不引入新 keyframe

### 数据复用

- `highlights` 继续从 `c.description` 解析（已有 `generateHighlights` 函数）
- 里程碑数据从 `VotingCandidate` 接口不存在，故用固定 4 阶段模板（需求分析/设计开发/内部测试/上线准备）+ 基于 `vote_percentage` 推断当前阶段（0-25% → 阶段1，25-60% → 阶段2，60-90% → 阶段3，90%+ → 阶段4）
- 预约人数用 `c.vote_count * 3` 作为「模拟预约数」（纯展示，不改数据结构）

### 关键 CSS 变更

- `.vcp-overlay`：去掉 `align-items: flex-end`，改 `align-items: stretch`
- `.vcp-sheet`：去掉 `max-height: 88dvh; border-radius: 20px 20px 0 0`，改为 `height: 100dvh; border-radius: 0; background: #F3F0FA`
- `.vcp-highlights`：从 `flex-direction: column` 改为 **2列 CSS Grid**（`grid-template-columns: 1fr 1fr`）
- 新增 `.vcp-highlight-grid-item`（图标圆形块 + 文字竖向居中）
- `.vcp-timeline`（新增）：横向里程碑，复用 `.fp-timeline` 的结构逻辑但在 `.vcp-*` 命名空间下实现
- 新增 `.vcp-cta-area`（底部 CTA 区）、`.vcp-cta-btn`（渐变大按钮）、`.vcp-topbar`（顶部导航栏）

## 实现注意事项

- `VotingCandidate` 接口中没有 `milestones` 字段，里程碑必须在组件内部用函数根据 `vote_percentage` 推断，**不修改接口**
- `generateHighlights` 已有，直接复用，只改渲染方式（行列 → 宫格）
- Hero 区背景色继续用 `getGradient()` 函数派发，逻辑不变
- 底部 CTA 按钮点击调用 `onClose()`，无其他副作用
- 预约数字用 `(c.vote_count * 3 + 128).toLocaleString()` 以保证显示 3 位以上，纯展示
- `@media (prefers-reduced-motion)` 中保持 `animation: none`

## 架构设计

```
src/
├── components/
│   └── VoteCandidatePreview.tsx   [MODIFY] 全量重写 JSX：全屏布局、顶部导航栏、Hero封面区、四宫格功能亮点、横向里程碑、底部CTA
└── index.css                       [MODIFY] .vcp-* 全部重写：全屏容器、顶栏、Hero、四宫格、时间轴、CTA按钮
```

## 目录结构

```
src/
├── components/
│   └── VoteCandidatePreview.tsx  # [MODIFY] 重写组件结构。保留 Props 接口不变（candidate: VotingCandidate; onClose: () => void）。
│                                 #   新增内部函数 inferMilestones(pct: number) 推断里程碑阶段。
│                                 #   新增 getSubtitle(c) 生成副标题文案。
│                                 #   布局：全屏覆盖容器 → 顶部导航栏（关闭+标题+分享）→ 可滚动区 → Hero封面 → 功能亮点四宫格卡片 → 开发进度卡片（进度条+里程碑）→ CTA底部区
└── index.css                     # [MODIFY] 替换 .vcp-* 命名空间下全部样式（约 1538-1815行）：
│                                 #   - .vcp-overlay：全屏容器
│                                 #   - .vcp-page：全屏白/渐变背景滚动区
│                                 #   - .vcp-topbar：顶部导航（flex justify-between）
│                                 #   - .vcp-hero：Hero封面区，渐变背景+图片+文字叠加
│                                 #   - .vcp-highlights-grid：2列CSS Grid宫格
│                                 #   - .vcp-grid-item：宫格单元（圆形图标+文字）
│                                 #   - .vcp-milestone-row：横向里程碑时间轴
│                                 #   - .vcp-cta-area：底部CTA区域
│                                 #   - .vcp-cta-btn：渐变大按钮（高度52px）
```

## Agent 扩展

### Skill

- **impeccable**
- 用途：审核全屏预览页的布局结构、间距系统、组件层级，确保顶栏/Hero/卡片/CTA 四区块符合移动端产品级规范，消除间距不统一、信息层级不清晰问题
- 期望产出：统一的间距单位（8px 基准栅格）、清晰的视觉层级、圆角和阴影系统规范化

- **design-taste-frontend**
- 用途：为重写后的 VoteCandidatePreview 全屏页设定「宠物 APP 产品风」视觉方向，确保粉紫渐变、圆形图标、里程碑节点、CTA 按钮等视觉元素不落入通用 AI 审美陷阱，而是接近截图所示的真实产品级设计
- 期望产出：精准还原截图视觉风格（粉紫主色、圆形图标块、进度条光泽、渐变 CTA 按钮）