---
name: lamp-physics-rope-canvas
overview: CreamBellLamp 三大改造：1)灯泡左移到合理位置 2)SVG直线绳替换为Canvas弹簧-质点物理绳（整根从天花板到猫爪）3)拖拽交互改为真实物理手势+threshold触发切换
design:
  architecture:
    framework: react
  styleKeywords:
    - Physics-based Animation
    - Verlet Integration
    - Canvas Rope Rendering
    - Warm Creamy Aesthetic
    - Interactive Pet UI
  fontSystem:
    fontFamily: ZCOOL KuaiLe
    heading:
      size: 32px
      weight: 600
    subheading:
      size: 18px
      weight: 500
    body:
      size: 16px
      weight: 400
  colorSystem:
    primary:
      - "#F5B942"
      - "#FFE4BD"
      - "#FFF2E1"
    background:
      - "#FFF2E1"
      - transparent
    text:
      - "#1A1A1A"
      - "#7A6850"
    functional:
      - "#B8A078"
      - "#C4AE88"
      - "#A8946E"
      - "#F5B0BF"
todos:
  - id: rope-physics-engine
    content: 实现 Verlet 积分弹簧-质点物理引擎核心类 (RopeSim)，包含质点创建、重力步进、距离约束求解、锚点固定，使用 [subagent:frontend-developer] 和 [skill:fullstack-developer]
    status: completed
  - id: canvas-rope-renderer
    content: 实现 Canvas 绳子渲染函数——通过质点坐标绘制平滑贝塞尔曲线，渐变麻绳色描边、粗细变化、高光线，使用 [skill:impeccable]
    status: completed
    dependencies:
      - rope-physics-engine
  - id: rewrite-lamp-component
    content: 重写 CreamBellLamp 组件：新增 Canvas 层、整合物理引擎 hook、改造 pointer events 映射到物理锚点、删除 SVG line 绳子和 pawPullStyle，使用 [subagent:frontend-developer]
    status: completed
    dependencies:
      - rope-physics-engine
      - canvas-rope-renderer
  - id: fix-position-and-css
    content: 调整 .cream-lamp 位置(right/left值)、删除 ::before 伪元素灯绳、新增 .lamp-rope-canvas 样式、手机端响应式同步更新 home-dashboard.css
    status: completed
  - id: verify-paw-connect
    content: 验证灯绳末端与猫爪按钮的视觉连接无间隙，确认 drag gesture + threshold 触发切换正常工作
    status: completed
    dependencies:
      - rewrite-lamp-component
      - fix-position-and-css
  - id: lint-and-visual-check
    content: 运行 lint 检查零错误 + 启动 dev 服务器截图验证最终效果
    status: completed
---

## Product Overview

重构 `CreamBellLamp` 吊灯组件，将现有"假动画拉绳"替换为**真实物理绳子模拟**（Canvas 弹簧-质点系统），同时修复灯绳与猫爪的视觉断裂问题，并将灯泡整体位置往左调整。

## Core Features

- **弹簧-质点物理绳子（Canvas）**: 整根绳子从天花板→灯罩→猫爪全部用 Canvas 统一绘制，使用 Verlet 积分的多段质点+约束求解，支持重力下垂、拖拽动态弯曲、惯性摆动
- **灯泡位置左移**: 从 `right: 18px` 调整为合理偏左位置（约 `right: 4px` 桌面端 / `right: -4px` 手机端），让灯泡更靠近宠物图片右侧边缘
- **灯绳-猫爪连接修复**: 消除 SVG line 终点与猫爪掌垫之间的 ~47px 间隙，Canvas 绳子终点精确连接到猫爪挂点
- **Drag Gesture + Threshold 触发**: 保留 pointer events 触控兼容的拖拽交互，超过阈值（55% MAX_PULL_Y）触发宠物切换
- **删除旧实现**: 移除 SVG 内部 line 绳子、CSS `::before` 顶部伪元素灯绳、独立 pawPullStyle 弹簧变换

## Tech Stack

- **前端框架**: React 18 + TypeScript (现有项目)
- **物理绳子渲染**: 原生 Canvas 2D API (`useRef<HTMLCanvasElement>` + `getContext('2d')`)
- **物理引擎**: 纯手写 Verlet 积分 — 无外部依赖
- **样式**: CSS Modules (home-dashboard.css)
- **构建**: Vite 5

## Implementation Approach

### 架构决策

采用**分层架构**: SVG 灯罩(装饰层) + Canvas 绳子(物理层) + HTML 猫爪按钮(交互层)，三层叠加在 `.cream-lamp` 容器中。

### 物理绳子弹簧-质点系统设计

```
质点链: P0(天花板锚点) → P1 → P2 → ... → PN(猫爪锚点)
       |← 上段: 天花板~灯罩 →|  |← 下段: 灯罩~猫爪 →|
```

**核心数据结构:**

```typescript
interface Point {
  x: number; y: number;       // 当前位置
  px: number; py: number;     // 上一帧位置 (Verlet用)
  ax: number; ay: number;     // 加速度
  pinned: boolean;            // 锚定（天花板/灯罩/猫爪）
  mass: number;
}

interface RopeSim {
  points: Point[];            // ~20个质点
  segments: number;           // 段数
  restLength: number;         // 段静止长度
  gravity: number;            // 重力系数
  damping: number;            // 阻尼(0.92)
  stiffness: number;          // 约束迭代刚度
  iterations: number;         // 约束求解迭代次数(5)
}
```

**物理更新循环 (每帧 requestAnimationFrame):**

1. Verlet积分: `newPos = pos + (pos - prevPos) * damping + acc`
2. 应用重力到非固定质点
3. 约束求解 (多次迭代): 保持相邻质点间距 = restLength
4. 锚点修正: P0 固定在天花板, P_mid 固定跟随灯罩, P_end 固定跟随猫爪
5. Canvas 绘制: 通过质点坐标绘制平滑曲线 (quadraticCurveTo 或 catmull-rom 样条)

### 关键技术细节

**1. 绳子分段策略 (总计 ~18 个质点):**

- 上段（天花板上环 → 灯罩挂环）: 6个质点, 自然垂坠微弧
- 下段（灯罩底部 → 猫爪顶部）: 12个质点, 拖拽时大幅弯曲

**2. 拖拽交互映射:**

- `handlePointerDown`: 记录起始位置, 设置 isDragging
- `handlePointerMove`: 将手指 Y 偏移映射到猫爪锚点的 Y 坐标（而非简单 translateY）
- `handlePointerUp`: 
- 若 pullY >= threshold → 触发 onSwitch(-1)
- 释放猫爪锚点 → 物理引擎自动计算回弹（绳子摆动效果）

**3. 灯罩联动:** 灯罩不再做独立的 translate 变换，而是随着中间锚点质点微微移动 + 自转（模拟被绳子牵引的真实感）

**4. Canvas 绳子绘制:**

- 使用 `ctx.lineCap = 'round'`, `ctx.lineJoin = 'round'`
- 渐变色描边: `createLinearGradient` 从上到下 #B8A078 → #C4AE88 → #A8946E
- 宽度变化: 上粗(2px) → 中粗(2.5px) → 下细(1.8px), 模拟真实麻绳
- 高光线: 主绳左侧 0.5px 偏移画一条半透明白线

### 文件修改清单

```
src/pages/HomePetOS.tsx        [MODIFY] 重写 CreamBellLamp 组件
src/styles/home-dashboard.css   [MODIFY] 调整 .cream-lamp 位置 + 新增 Canvas 样式 + 清理旧规则
```

## Implementation Notes

- **性能**: 物理模拟限制在 60fps, 使用 `requestAnimationFrame` 循环; Canvas 尺寸固定 (~100x280px), 不需要高清适配
- **触控兼容**: 保留 Pointer Events API, 同时处理 mouse 和 touch
- **CRLF 注意事项**: CSS 文件上次出现 CRLF 编码问题, 修改时注意换行符一致性; 如遇 replace_in_file 失败则回退到 Node.js 脚本方案
- **向后兼容**: 保持 CreamBellLampProps 接口不变 (petCount, onSwitch); 保持提示气泡功能; 保持 lamp-swing 动画(但改为作用于整个容器微幅摇摆)
- **清理范围**: 删除 SVG 内 3 条 line 元素(底部细绳)、删除 cordStretch 变量、删除 pawPullStyle、删除 CSS ::before 伪元素(顶部灯绳)

## Architecture Design

### 组件层级结构

```xml
<div class="cream-lamp">                    <!-- 容器: 左移后位置 -->
  
  <!-- Layer 0: Canvas 物理绳子 (最底层) -->
  <canvas ref={canvasRef} class="lamp-rope-canvas"
          width="100" height="280" />
  
  <!-- Layer 1: SVG 灯罩 (保持不变) -->
  <svg class="lamp-svg" viewBox="0 0 80 260">
    <!-- 删掉 3 条 <line> 底部细绳 -->
    <!-- 其余: 环境光/灯罩/反光/核心/高光/挂环 全部保留 -->
    <!-- 删掉 <g class="lamp-paw-svg-group"> 猫爪SVG (改用HTML/CSS) -->
  </svg>
  
  <!-- Layer 2: 猫爪按钮 (HTML, 顶层交互) -->  
  <button class="lamp-paw-ring" style={pawStyle}
          onPointerDown/Move/Up />
  
  <!-- Layer 3: 提示气泡 (保持不变) -->
  {showHint && <div class="lamp-hint-bubble">...</div>}
  
</div>
```

### 数据流

```
PointerDown → 记录 startY, 设 dragging=true, 隐藏hint
PointerMove → 计算 deltaY → 更新 ropeSim.endPoint.y → 物理步进 → Canvas重绘
             → 同步更新灯罩位置(微动) + 发光亮度
PointerUp   → dragging=false
             → if pullY > threshold → onSwitch(-1)
             → else → 释放锚点 → 物理回弹动画
rAF Loop    → if !dragging && pullY===0 → 正常摆动物理
              → Verlet step → constraint solve → drawRope()
              → 同步灯罩位置 + 猫爪按钮位置
```

### 物理状态机

```
IDLE(空闲) ──[drag start]──► DRAGGING(拖拽中) ──[release ≥ threshold]──► TRIGGER(切换)
    ▲                              │                                        │
    │                         [release < threshold]                          │
    ┄┄┄ [物理回弹完成] ◄── SNAP_BACK(回弹中) ◄───────────────────────────────┘
```

## Directory Structure

```
src/
├── pages/
│   └── HomePetOS.tsx              [MODIFY] CreamBellLamp 全面重写:
                                    - 新增 RopeSim 物理引擎类(~150行内联)
                                    - 新增 useRopeSimulation hook(~80行)
                                    - 重写 CreamBellLamp 组件体
                                    - 删除 SVG line 绳子 + pawPullStyle
                                    - Canvas 叠加层 + 物理联动
├── styles/
│   └── home-dashboard.css         [MODIFY]
                                    - .cream-lamp: right 18px→4px, top 8px→6px
                                    - @media 420px: right 8px→-4px
                                    - 新增 .lamp-rope-canvas 样式
                                    - 删除 .cream-lamp::before (顶部灯绳伪元素)
                                    - 删除 .cream-lamp::after (或改为环境光div)
                                    - 调整 .lamp-svg 层级(z-index)
                                    - .lamp-paw-ring 微调(去掉旧transform逻辑)
```

本次改动不涉及新页面创建或整体 UI 风格变更，仅对已有吊灯组件进行物理仿真增强和位置微调。设计重点在于 Canvas 绳子的视觉质感——需要呈现真实的麻绳效果（渐变色调、粗细变化、圆滑曲线），以及拖拽时自然弯曲的物理反馈。

**关键设计要素：**

1. **Canvas 绳子外观**: 从上到下的渐变麻绳色(#B8A078→#C4AE88→#A8946E)，宽度上粗下细(2.2px→1.8px)，附带左侧半透明高光线模拟圆柱光照
2. **灯泡位置**: 在 480px 居中布局中, 宠物图200px宽居中放置, 灯泡应位于宠物图右边缘外侧 4~8px 处, 不超出屏幕右边界
3. **猫爪按钮**: 保持现有粉嫩风格, 但位置由 CSS transform 改为由物理引擎驱动（跟随绳子末端质点）
4. **环境光**: 原 ::after 伪元素的环境光晕保留但改为 div 元素（因为 ::before/::after 占位被 Canvas 取代）

## Agent Extensions

### Skill

- **impeccable**
- Purpose: 确保 Canvas 物理绳子的视觉效果达到高质量标准——曲线平滑度、颜色过渡、交互手感都需要精心调校
- Expected outcome: 产出专业级的物理绳子交互体验，避免廉价感

- **fullstack-developer**
- Purpose: Verlet 物理引擎的核心算法实现（质点约束求解、阻尼参数调优）
- Expected outcome: 稳定的 60fps 物理模拟，无数值爆炸，自然的回弹和摆动行为

### SubAgent

- **frontend-developer**
- Purpose: React 组件重构——将现有 CreamBellLamp 从纯 SVG+CSS 改造为 SVG+Canvas 分层架构，确保 hooks/useRef 生命周期管理正确
- Expected outcome: 结构清晰、性能优良的组件代码，无内存泄漏（rAF 正确 cancel、ref 正确清理）