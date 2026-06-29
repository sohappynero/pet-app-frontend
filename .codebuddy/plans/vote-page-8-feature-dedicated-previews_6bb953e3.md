---
name: vote-page-8-feature-dedicated-previews
overview: 将投票页的统一预览模板升级为 8 个候选功能各自独立的专属预览界面方案，保留入口、投票逻辑与接口不变，先形成可确认的视觉与交互计划。
design:
  architecture:
    framework: react
  styleKeywords:
    - 移动端产品预览
    - 场景化界面
    - 高辨识模块
    - 柔和高级配色
    - 轻动效层级
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 30px-36px
      weight: 700
    subheading:
      size: 17px-20px
      weight: 600
    body:
      size: 14px-16px
      weight: 400
  colorSystem:
    primary:
      - "#7C3AED"
      - "#EC4899"
      - "#4F46E5"
    background:
      - "#F7F1FA"
      - "#FFF8FC"
      - "#FFFFFF"
    text:
      - "#241B32"
      - "#6B5B7E"
      - "#FFFFFF"
    functional:
      - "#22C55E"
      - "#F59E0B"
      - "#EF4444"
      - "#3B82F6"
todos:
  - id: define-eight-variants
    content: 用 [skill:impeccable] 和 [skill:gpt-taste] 定义 8 个功能预览配置
    status: completed
  - id: refactor-preview-shell
    content: 重构 VoteCandidatePreview 共享骨架与功能分发
    status: completed
    dependencies:
      - define-eight-variants
  - id: build-first-four-scenes
    content: 实现定位、匹配、聊天、食品四类专属场景模块
    status: completed
    dependencies:
      - refactor-preview-shell
  - id: build-last-four-scenes
    content: 实现医院、美容、TV、殡葬四类专属场景模块
    status: completed
    dependencies:
      - refactor-preview-shell
  - id: rewrite-vcp-styles
    content: 重写 index.css 的 .vcp-* 共享样式与 8 套主题
    status: completed
    dependencies:
      - build-first-four-scenes
      - build-last-four-scenes
  - id: show-diff-and-verify
    content: 展示完整差异并在批准后运行 npm run build 验证
    status: completed
    dependencies:
      - rewrite-vcp-styles
---

## 用户需求

### User Requirements

将投票页现有的功能预览，从“统一模板只换标题和颜色”升级为“8 个功能分别拥有专属预览界面”的方案，让用户点开后能立刻看懂功能用途、使用场景和未来上线后的界面形态。

### Product Overview

入口继续使用投票卡片里的现有“预览”按钮，关闭方式和投票流程保持不变。预览仍是全屏移动端详情页，但中部主体内容改为按功能差异化展示，而不是所有功能共用同一套内容结构。

当前已确认直接覆盖的 6 个功能为：宠物殡葬、宠物TV、宠物食品、同城聊天、宠物医院、美容预约。其余 2 个按当前候选 key 设计为宠物定位与宠友匹配，最终页面标题仍以实际候选标题显示。

### Core Features

- 每个功能拥有独立的主视觉、副标题、状态标签和中部主场景模块
- 中部内容按功能类型展示专属界面，如地图、匹配卡、聊天流、视频列表、套餐卡、预约卡、纪念卡等
- 保留统一的开发进度和预约提醒区，但文案、气质和辅助说明随功能变化
- 提供未知候选兜底样式，避免出现空白预览或语义不清

## Tech Stack Selection

- 基于现有项目栈：React + TypeScript + `lucide-react`
- 样式继续沿用 `src/index.css` 中现有 `.vcp-*` 命名空间
- 数据继续复用 `src/lib/vote.api.ts` 中的 `VotingCandidate`，不新增接口字段

## Implementation Approach

- 采用“共享预览骨架 + 功能配置映射 + 场景模块分发”的实现方式：保留一个 `VoteCandidatePreview` 组件，通过 `candidate.key` 和 `candidate.title` 识别功能类型，再加载对应的静态配置与场景模块。
- 复用 `src/components/FeaturePreviewModal.tsx` 里已经存在的标题、副标题、亮点、进度、里程碑、主色等静态语义结构，避免重复造轮子；在此基础上补齐 `location` 与 `match` 两个变体。
- 关键决策是“不复制 8 份完整 JSX”，而是把顶部导航、Hero、亮点、进度、CTA 抽成共享骨架，把真正体现差异的地图卡、聊天流、套餐卡、排班卡等做成按功能分发的局部模块。这样既满足用户对“8 套专属界面”的要求，也控制改动范围。
- 配置查找与渲染复杂度为 O(1)。主要风险是组件体积膨胀和样式失控，解决方式是统一类型、统一命名、共享布局变量、功能样式加修饰类，不引入额外状态或新数据请求。

## Implementation Notes

- 优先按 `candidate.key` 命中功能，若 key 缺失或不可依赖，再按 `title` 关键词兜底。
- 每个功能至少定义一组明确的静态语义：Hero 文案、状态标签、主场景卡片、功能亮点、CTA 话术、预约人数文案。
- `FeatureVote.tsx` 只保留现有 `previewCandidate` 传参与关闭逻辑，不改投票流程、不改接口调用。
- 保留无图兜底、遮罩关闭、低动态模式兼容；对未识别候选提供默认模板，降低回归风险。
- 仅重写 `.vcp-*`，避免影响其他页面；参考 `FeaturePreviewModal.tsx` 与 `Mine.tsx` 现有命名和色彩语义。

## Architecture Design

- `FeatureVote.tsx` 继续负责打开和关闭预览，不承担任何功能展示逻辑。
- `VoteCandidatePreview.tsx` 内部拆成三层：

1. 功能归一化：解析 feature id、主题色、标题、副标题、状态文案
2. 共享骨架：导航、Hero、亮点、进度、CTA
3. 场景模块：定位地图、匹配卡片、聊天频道、食品推荐、医院预约、美容套餐、视频清单、纪念服务

- `index.css` 中 `.vcp-*` 按“共享布局样式 + 功能修饰类 + 场景模块样式”组织，防止 8 套主题互相污染。

## Directory Structure

### Directory Structure Summary

本次方案保持最小改动，只重构现有预览组件与其样式层，入口和业务文件保持不动。

```text
src/
├── components/
│   └── VoteCandidatePreview.tsx  # [MODIFY] 改为共享预览骨架加 8 套功能配置；新增功能识别、静态内容映射、差异化场景渲染和兜底逻辑
└── index.css                     # [MODIFY] 重写 .vcp-* 样式；包含共享布局、8 类场景模块、主题修饰类、动效与低动态兼容
```

## 设计方向

整体仍是移动端全屏预览，但从“一个版式套全部功能”升级为“同一产品壳下的 8 种功能世界”。顶部导航、进度区和底部行动区保持统一产品感；Hero 与中部场景区负责把功能解释清楚。

## 统一页面结构

1. 顶部导航：白底轻悬浮，突出返回、标题和分享
2. Hero：大标题、副标题、状态标签、主题主视觉
3. 场景区：2 到 3 组高辨识 mock 模块，模拟真实使用界面
4. 亮点区与进度区：补足功能价值和上线预期
5. 底部 CTA：预约提醒与上线说明

## 8 个功能的界面方向

- 宠物定位：地图主画面、安全围栏卡、实时轨迹卡、异常提醒条
- 宠友匹配：匹配卡堆、兴趣标签、距离信息、发起认识入口
- 同城聊天：附近频道列表、约遛活动卡、协寻广播条、聊天会话预览
- 宠物食品：AI 配方推荐卡、营养指标条、套餐订阅卡、喂养计划时间轴
- 宠物医院：附近医院榜单、医生排班片段、急诊入口、预约时间卡
- 美容预约：造型风格切换、服务套餐卡、门店评分、预约时间选择
- 宠物TV：频道海报、推荐片单、陪伴模式切换、播放控制条
- 宠物殡葬：纪念服务卡、告别流程、纪念相册入口、温和说明区

## 视觉原则

每个功能使用独立主色族，但统一采用柔和背景、圆角模块、轻阴影、清晰层级和适度微动效。定位与医院偏理性，同城聊天与匹配偏社交，食品与美容偏服务消费，TV 与殡葬偏内容陪伴和情绪表达，确保用户一眼就能分辨功能属性。

## Agent Extensions

### Skill

- **impeccable**
- Purpose: 校准 8 套预览的层级、间距、可读性与统一产品骨架
- Expected outcome: 每个功能都清晰易读，且顶栏、Hero、卡片、CTA 的结构统一稳定

- **gpt-taste**
- Purpose: 打破统一模板感，为 8 个功能生成差异化场景构图与更强识别度
- Expected outcome: 每个功能具备独立主题视觉和专属 mock 模块，用户一眼就能看懂用途