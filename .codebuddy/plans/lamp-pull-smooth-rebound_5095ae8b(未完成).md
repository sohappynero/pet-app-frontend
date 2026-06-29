---
name: lamp-pull-smooth-rebound
overview: 修复灯组件拖拽后返回不柔顺的问题：CatPawHandle加弹性回弹曲线、Rope做平滑高度过渡、未触发释放时增加短暂过渡态避免瞬归、统一三组件回弹时长和缓动函数
design:
  architecture:
    framework: react
todos:
  - id: fix-lampswitch-rebound-state
    content: "修复 LampSwitch.tsx handleDragEnd: 未触发释放时增加 rAF 延迟归零避免瞬归；触发后延迟调整为 500ms 匹配回弹节奏"
    status: pending
  - id: fix-catpaw-handle-spring-curve
    content: "修复 CatPawHandle.tsx: 回弹曲线改为 cubic-bezier(0.34, 1.56, 0.64, 1) 弹性过冲，时长 250ms→400ms，统一 scale/boxShadow 过渡"
    status: pending
  - id: fix-rope-smooth-transition
    content: "修复 Rope.tsx: 回弹时长 300ms→450px，使用统一弹性曲线，height/transform/background 三属性同步过渡防跳变"
    status: pending
  - id: sync-css-rebound-timing
    content: "更新 home-dashboard.css: lamp-glow-halo/lamp-light-cone 等 light effect 的 transition 时长同步至 400ms"
    status: pending
  - id: verify-lint-and-preview
    content: 运行 lint 检查无报错，启动 dev server 预览确认回弹柔顺度
    status: pending
    dependencies:
      - fix-lampswitch-rebound-state
      - fix-catpaw-handle-spring-curve
      - fix-rope-smooth-transition
      - sync-css-rebound-timing
---

## 产品概述

修复灯(LampSwitch)拖拽交互后"返回不柔顺/回弹不自然"的手感问题。用户在截图中标注了灯组件区域，反馈拉了之后有时候返回不上去。

## 核心问题

1. **CatPawHandle 回弹无弹性**: 使用 `cubic-bezier(0.2, 0.8, 0.2, 1)` 标准ease曲线，缺少弹簧过冲效果，真实物理体感差
2. **Rope 高度/偏移突变**: dragY 归零时 Rope 高度从拉伸值(如160px)瞬间跳到80px，translateY偏移也瞬消，CSS transition 对React state突变插值不够平滑
3. **未触发释放时"死回归"**: handleDragEnd 中未达到阈值直接 `setDragY(0) + setLampState('idle')`，无任何过渡动画，猫爪和绳子被"吸回去"

## 修复目标

- 拉拽释放后猫爪有**弹性回弹过冲**(overshoot bounce)，像真实弹簧
- 绳子高度变化**平滑过渡**，不出现跳变
- 所有子组件(CatPawHandle/Rope/灯罩)的回弹时长和缓动函数**统一协调**
- 触发后的 transition 态也纳入统一回弹节奏

## 技术栈

- React + TypeScript + 内联 Style + CSS transitions
- CSS cubic-bezier 弹性曲线
- useState 延迟归零策略(用 setTimeout + requestAnimationFrame)

## 实现方案

### 策略：三层协同修复

**核心思路**: 不引入新依赖(如react-spring/GSAP)，用纯 CSS transition + React state 延迟实现弹性手感。关键在于让三个子组件的 transition 时长和曲线完全一致。

### 具体修改点

#### 1. LampSwitch.tsx — 增加 "rebounding" 过渡态

当前问题: 未触发时直接 `setDragY(0)` 瞬间归零。

修复: 在 handleDragEnd 的 else 分支中:

- 先设置一个中间态(保持 dragging 但开始回弹)
- 用 `requestAnimationFrame` 延迟一帧后 setDragY(0) + idle
- 这样 CatPawHandle 和 Rope 的 CSS transition 能捕捉到从 dragY>0 到 0 的变化并执行动画

```typescript
// 修改前 (第88-91行)
} else {
  setLampState('idle');
  setDragY(0);
  isTriggeringRef.current = false;
}

// 修改后 — 引入 rebouncing 过渡
} else {
  // 保持 dragging 让 transition 生效，下一帧再归零
  requestAnimationFrame(() => {
    setLampState('idle');
    setDragY(0);
    isTriggeringRef.current = false;
  });
}
```

同时 triggered 后的 600ms 延迟也改为与回弹时长匹配的值。

#### 2. CatPawHandle.tsx — 弹性回弹曲线

当前: `cubic-bezier(0.2, 0.8, 0.2, 1)` (标准 ease-in-out)
改为: `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring overshoot — 有轻微过冲后回到原位)

其他调整:

- 回弹时长: 250ms → **400ms** (稍慢更自然)
- scale 回弹: 1.12 → 1.0 也走同一曲线
- boxShadow 回弹也同步到 400ms

#### 3. Rope.tsx — 平滑高度+偏移过渡

当前问题: height 用 `Math.max(80, 80+dragY)` 计算，dragY=0 时跳变。

修复:

- 回弹 transition 时长: 300ms → **450ms**
- 曲线改为统一的弹性曲线 `cubic-bezier(0.34, 1.56, 0.64, 1)`
- height 和 transform translateY 使用相同时长
- background 颜色过渡也延长到 350ms 匹配

#### 4. home-dashboard.css — 光效回弹同步

- `.lamp-glow-halo` transition 时长 300ms → 400ms
- `.lamp-light-cone` transition 时长 300ms → 400ms  
- 确保所有光效在回弹时与机械部分(爪+绳+罩)同步

### 统一的弹性参数

| 参数 | 值 |
| --- | --- |
| 弹性曲线 | `cubic-bezier(0.34, 1.56, 0.64, 1)` (约15%过冲) |
| CatPawHandle 回弹时长 | 400ms |
| Rope 回弹时长 | 450ms (绳子更长需要更多时间) |
| Glow Halo 回弹时长 | 400ms |
| Light Cone 回弹时长 | 400ms |
| 灯罩 boxShadow 回弹 | 400ms |


## 架构影响范围

- 仅涉及 LampSwitch 子树内部: LampSwitch.tsx / CatPawHandle.tsx / Rope.tsx / home-dashboard.css
- HomePetOS.tsx 无需改动(props 接口不变)
- 不影响 GlassOverlay / PetBackground / Drawer

本任务为交互体验优化，不涉及UI结构变更。仅调整拖拽回弹的动效参数(曲线/时长/延迟)，视觉样式保持现有设计不变。

## Agent Extensions

- **impeccable**
- Purpose: 对灯组件的交互动效进行精细化打磨，确保弹性回弹参数(曲线、时长、过冲比例)达到高端产品级的流畅手感
- Expected outcome: 输出经过调优的弹性回弹参数，确保拖拽释放后的回弹动画自然、有弹簧质感、无突兀跳跃