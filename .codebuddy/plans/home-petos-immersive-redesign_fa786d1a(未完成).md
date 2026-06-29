---
name: home-petos-immersive-redesign
overview: 将当前首页重构为4层沉浸式Soft Glass架构：全屏宠物背景层+毛玻璃遮罩+左侧280px玻璃抽屉菜单+右侧猫爪拉灯垂直拖拽切换宠物
---

## 产品概述

将当前首页从"奶油黄宠物档案卡"布局重构为**4层架构的沉浸式Soft Glass风格移动端宠物APP首页**。核心改造：全屏宠物背景层、左侧280px玻璃抽屉菜单、右侧猫爪拉灯系统（垂直拖拽触发cross-fade切换）。

## 核心功能

### 1. 全屏沉浸式背景层（Layer 1）

- 全屏显示当前选中宠物的图片（`_resolved_avatar_url || avatar_url || image_url`），默认 `scale(1)`
- 左侧玻璃抽屉打开时：背景 `scale(1.08)` + `blur(12px)` + `brightness(0.75)`
- 过渡动画：cubic-bezier(0.2, 0.8, 0.2, 1)，时长 ≤420ms
- 无图时显示品种emoji占位（保持现有逻辑）

### 2. 毛玻璃遮罩层（Layer 2）

- 覆盖全屏：`rgba(255,255,255,0.25)` + `backdrop-blur(12px~18px)`
- 仅在抽屉打开时显示（opacity 0→1）
- 点击可关闭抽屉（透传到drawer关闭逻辑）

### 3. UI层（Layer 3）

- **顶部状态栏**：简洁的汉堡菜单按钮（左上，触发抽屉开关）
- **左侧玻璃抽屉 Drawer**：
- 宽度固定280px
- 关闭态：`translateX(-280px)`
- 打开态：`translateX(0)`
- 样式：白色25%透明 + `backdrop-blur(18px)` + 右侧圆角24px
- 阴影：`0 12px 40px rgba(0,0,0,0.08)`
- 动画：300ms ease-out
- **6个菜单项**（精简自现有9个）：我的宠物、健康记录、AI分析、心情日记、喂食提醒、设置
- 头部显示当前宠物头像+名字
- **主内容区域**（居中偏下）：毛玻璃卡片风格的宠物信息（名称/品种/属性标签）

### 4. 猫爪拉灯交互层（Layer 4）

- **位置**：右侧垂直排列，从屏幕右上角垂下
- **组件拆分**：
- `LampSwitch` — 容器组件，管理拖拽状态机
- 灯图标 Lamp — Soft Glass 风格的小灯泡图标（非写实灯！非3D！）
- 绳子 Rope — CSS绘制的细绳，跟随paw位移有0.2s延迟
- CatPawHandle — 可垂直拖拽的猫爪手柄
- **拖拽规格**：
- 方向：vertical drag（向下拉）
- 最大距离：120px
- 触发阈值：80px
- 状态机：idle → dragging → triggered → transition → idle
- **视觉反馈**：
- paw跟随y轴：scale 1 → 1.1
- rope延迟跟随（transition: transform 0.2s ease）
- 触发时灯光flash（opacity/glow增强）+ 背景短暂dim
- **宠物切换效果**：
- cross fade：旧图fade out → 新图fade in
- scale动画：1.05 → 1 → 1.05
- 时长 ≤420ms

## 设计约束

- **主色系**：#F7E7D3（暖米白）、#FFFFFF（纯白）、#FFD6A5（柔橙黄）
- **圆角**：16px / 24px
- **阴影**：0 12px 40px rgba(0,0,0,0.08)
- **毛玻璃**：backdrop-blur 12px ~ 18px
- **动画曲线**：cubic-bezier(0.2, 0.8, 0.2, 1)
- **所有动画 ≤420ms**

### 严格禁止

- 写实灯造型
- 3D渲染/WebGL
- 多余页面跳转
- 复杂游戏化逻辑
- 改变核心交互逻辑
- 自由发挥UI结构

## Tech Stack

- React 18 + TypeScript（项目已有，不变）
- Vite 5（构建工具，不变）
- Tailwind CSS 3.4（样式系统，优先使用Tailwind类名，减少自定义CSS）
- lucide-react（图标库，已安装）
- react-router-dom（路由导航，不变）
- 无新依赖需要安装

## 实现方案

### 架构策略：渐进式重构（非推倒重来）

**原则**：保留 AppShell 的 ShellContext 数据流，重写 HomePetOS.tsx 的UI层和交互层。

#### A. 新建6个组件文件（用户要求的清晰