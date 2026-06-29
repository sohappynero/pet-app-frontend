---
name: background-clear-when-drawer-closed
overview: 修改 PetBackground 组件，使左侧抽屉关闭时背景完全清晰展示（无模糊/玻璃化效果），仅在抽屉打开后才应用模糊和毛玻璃效果。
todos:
  - id: fix-background-clear
    content: "修改 PetBackground.tsx: isDrawerOpen=false 时 filter 改为 none，渐变遮罩降至极淡，让背景图完整清晰显示"
    status: pending
  - id: verify-compile-preview
    content: 运行 tsc --noEmit 验证编译，启动 dev server 截图确认效果
    status: pending
    dependencies:
      - fix-background-clear
---

## 产品概述

修改 HomePetOS 页面的背景显示逻辑：在左侧抽屉未打开时，宠物背景图应**完整清晰展示**（无模糊、无降亮度、无去饱和），仅在抽屉打开后才应用玻璃化/透明化效果。

## 核心功能

- **抽屉关闭状态**（默认）：背景图完全清晰，filter 为 `none` 或仅极轻微处理；背景渐变遮罩也需减弱以保持图片可见性
- **抽屉打开状态**：背景图应用 `blur(20px) + brightness(0.55) + saturate(0.7)` 玻璃化效果；渐变遮罩加强
- **过渡动画**：两种状态之间保持 420ms 的平滑 transition
- **不改其他组件**：GlassOverlay、Drawer、信息卡等保持现有玻璃风格不变

## 当前问题

PetBackground.tsx 第 27-29 行：`isDrawerOpen=false` 时仍应用 `blur(16px) brightness(0.65) saturate(0.8)`，导致背景始终模糊不清。同时第 46-48 行的渐变遮罩在关闭态也有不透明度叠加。

## 技术栈

- React + TypeScript
- CSS filter / backdrop-filter
- 内联 style 条件渲染

## 实现方案

**单一文件改动**：`src/components/PetBackground.tsx`

### 具体修改点

1. **filter 属性**（第 27-29 行）：

- `isDrawerOpen=false` → `'none'` （或可选极轻微 `brightness(1)`）
- `isDrawerOpen=true` → 保持 `'blur(20px) brightness(0.55) saturate(0.7)'`

2. **transform 属性**（第 26 行）：

- 关闭时保持 `scale(1)`
- 打开时可保持 `scale(1.06)` 微放大效果

3. **渐变遮罩 background**（第 46-48 行）：

- `isDrawerOpen=false` → 极淡遮罩（如 `rgba(255,255,255,0.02)` 级别），几乎不可见
- `isDrawerOpen=true` → 保持当前值

4. **transition 时长**：保持 `duration-[420ms]` 不变，确保平滑过渡

## 影响范围

- 仅改 PetBackground.tsx 一个文件
- 不涉及 GlassOverlay.tsx（它只在 drawer 打开时才渲染，逻辑正确）
- 不涉及 HomePetOS.tsx、CSS 文件或其他组件

## 验证

- `tsc --noEmit` 编译检查
- 浏览器预览确认：关闭态清晰 → 打开态模糊的切换效果