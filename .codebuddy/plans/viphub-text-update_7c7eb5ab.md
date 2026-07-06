---
name: viphub-text-update
overview: 将 VipHub.tsx 的页面标题区和 VIP 开通横条的文案替换为新文字
todos:
  - id: replace-viphub-text
    content: 替换 VipHub.tsx 标题区和 VIP 横条文案
    status: completed
  - id: verify-lint
    content: 运行 lint 检查确认无错误
    status: completed
    dependencies:
      - replace-viphub-text
---

## 用户要求

将 VipHub 会员专区页面的两处文案替换为图片中的新文案：

### 修改内容

1. **标题区**

- 原标题：`会员专区✨🐾`
- 新标题：`选择适合你的VIP小窝`
- 原子标题：`✦ 解锁更多 AI 陪伴能力 ✦`
- 新副标题：`让爱与陪伴更长久`

2. **VIP 开通横条**

- 原标题：`{petName}的 VIP 小窝`
- 新标题：`选择适合你的陪伴计划`
- 原子标题：`专属特权让我们更好地陪伴彼此`
- 新副标题：`不同阶段的爱，都值得最棒的陪伴`

### 视觉说明

- 标题区"VIP"需要保留原有的粉色/珊瑚色强调样式（当前为 `<em>` 或特定样式实现）
- 副标题保持原有的小号、次要文字样式
- 只修改文字内容，不动任何样式、结构或交互逻辑

## 技术栈

- 项目类型：React + TypeScript + Vite 前端项目
- 样式系统：自定义 CSS（src/styles/petos.css）+ CSS 变量
- 目标文件：`src/pages/VipHub.tsx`

## 实现方法

- 直接替换 VipHub.tsx 中的文案文本
- 标题区用当前已有的 `<em>` 标签对 "VIP" 进行强调（与现有样式 `.vz-greet__title em` 保持一致）
- VIP 横条标题的 `<em>VIP</em>` 结构保持不变，但文本内容整体替换为不含 "VIP" 的新标题
- 无需新增或修改任何样式、组件、路由

## 涉及的文件

- `src/pages/VipHub.tsx`（[MODIFY] 仅替换 4 处文案文本）