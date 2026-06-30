---
name: lamp-trigger-animation-fix
overview: 修复 LampSwitch 下拉触发后"飘忽不定"问题：暂停持续摇摆动画、新增物理阻尼摆动、优化回弹曲线、延长过渡时间。涉及 LampSwitch.tsx 和 home-dashboard.css 两个文件。
todos:
  - id: dampen-animation
    content: 在 home-dashboard.css 新增 lamp-swing-dampen 阻尼 keyframes 和对应 class
    status: pending
  - id: switch-class
    content: 修改 LampSwitch.tsx 外层容器为动态 class（transition 时使用 dampen）
    status: pending
  - id: timing-curve
    content: 延长 transition 时间至 1200ms 并优化灯绳回弹曲线
    status: pending
  - id: verify-animation
    content: 验证 lint 通过并确认动画效果符合预期
    status: pending
    dependencies:
      - dampen-animation
      - switch-class
      - timing-curve
---

## 产品概述

修复 LampSwitch 灯绳开关组件下拉触发后"飘忽不定"的动画问题，采用方案 A（带物理阻尼的递减晃动），让下拉动作更有质感和真实感。

## 核心功能

- **动态摇摆 Class 切换**：transition 状态时暂停 idle 摇摆，改用阻尼衰减动画
- **物理阻尼摆动效果**：3 次递减角度晃动（约 10° → 4° → 1° → 0°），模拟真实钟摆阻尼
- **优化灯绳回弹曲线**：从过冲型弹性曲线改为更干脆的 ease-out
- **延长过渡时间**：500ms → 1200ms，确保阻尼动画完整播放

## 技术栈

- React + TypeScript（组件逻辑）
- CSS @keyframes 动画（阻尼摆动）
- Tailwind CSS（样式辅助）

## 实现方案

### 核心策略：状态驱动的 animation-class 切换 + 物理阻尼 keyframes

### 改动 1：LampSwitch.tsx — 外层容器动态 class（第98行）

当前代码始终使用 `lamp-swing-idle`：

```
// 当前
className="fixed top-0 z-30 flex flex-col items-center lamp-swing-idle"
```

改为根据 `lampState` 动态切换：

```
// 修改后
className={`fixed top-0 z-30 flex flex-col items-center ${lampState === 'transition' ? 'lamp-swing-dampen' : 'lamp-swing-idle'}`}
```

### 改动 2：LampSwitch.tsx — 延长 transition 时间（第67行）

```
// 当前: 500
setTimeout(() => { ... }, 1200);  // 改为 1200ms，与阻尼动画时长匹配
```

### 改动 3：LampSwitch.tsx — 优化回弹曲线（第248行）

```
// 当前: cubic-bezier(0.2, 0.8, 0.2, 1) — 过冲型
transition: lampState === 'dragging' ? 'none' : 'height 420ms cubic-bezier(0.22, 0.61, 0.36, 1)'
// 更干脆的 ease-out，无明显过冲
```

### 改动 4：home-dashboard.css — 新增阻尼摆动动画

在现有 `lamp-swing-idle` keyframes 后新增：

```css
@keyframes lamp-swing-dampen {
  0%   { transform: rotate(10deg); }    /* 第1次大摆 - 初始冲量 */
  16%  { transform: rotate(-6deg); }     /* 第2次反弹 */
  32%  { transform: rotate(3.5deg); }    /* 第3次小摆 */
  50%  { transform: rotate(-1.5deg); }   /* 第4次微摆 */
  68%  { transform: rotate(0.5deg); }    /* 第5次几乎静止 */
  84%  { transform: rotate(-0.2deg); }   /* 最终微调 */
  100% { transform: rotate(0deg); }      /* 完全停止 */
}

.lamp-swing-dampen {
  animation: lamp-swing-dampen 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}
```

### 动画时序设计

| 阶段 | 时间 | 效果 |
| --- | --- | --- |
| triggered | 0ms | 光晕爆发 + ripple 扩散 |
| transition 开始 | 0ms | 阻尼动画启动（10°→...→0°） |
| transition 中 | 0~1200ms | 灯绳用新曲线干脆回弹 + 整灯阻尼摆动 |
| transition 结束 | 1200ms | 切回 idle，恢复 ±1.2° 微摇摆 |


## 关键文件

```
src/components/LampSwitch.tsx      # [MODIFY] 动态class切换 + 时间延长 + 曲线优化
src/styles/home-dashboard.css      # [MODIFY] 新增 lamp-swing-dampen 动画
```