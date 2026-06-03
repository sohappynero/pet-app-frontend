---
name: redesign-cards-ghibli-style
overview: 重新排版顶部两个功能卡片（拍照解读、选图解读）为宫崎骏手绘治愈风格，并简化底部数据安全提示（移除模型信息）
design:
  architecture:
    framework: react
  styleKeywords:
    - 宫崎骏手绘风
    - 水彩晕染
    - 纸张纹理
    - 治愈系暖色调
    - 不规则圆角
    - 手写字体
  fontSystem:
    fontFamily: ZCOOL KuaiLe
    heading:
      size: 15px
      weight: 600
    subheading:
      size: 14px
      weight: 600
    body:
      size: 11px
      weight: 400
  colorSystem:
    primary:
      - "#C4B5FD"
      - "#F59E0B"
    background:
      - "#FFFEF9"
      - "#FFFAF0"
      - "#FEF9F0"
    text:
      - "#4A3728"
      - "#9B8B7E"
    functional:
      - "#A7C794"
      - "#D4A574"
todos:
  - id: redesign-quick-cards
    content: 重写 quick-actions-bar 为宫崎骏手绘治愈风格（JSX 结构调整 + CSS 样式全面重写）
    status: completed
  - id: fix-tips-text
    content: 精简 chat-guide-tips 文案去掉模型信息仅保留数据保护提示
    status: completed
  - id: verify-lint
    content: 验证修改后文件 lint 零错误
    status: completed
    dependencies:
      - redesign-quick-cards
      - fix-tips-text
---

## Product Overview

对 PetChat（宠物心声）页面的两个 UI 区域进行改造：

## Core Features

1. **顶部快捷入口卡片重新排版**：将「拍照解读」和「选图解读」两个小卡片从当前的横向毛玻璃风格，改为宫崎骏手绘治愈风格的横向排列布局
2. **底部安全提示精简**：将 `chat-guide-tips` 区域的文本从"所有 AI 功能均由 GLM 智能模型驱动，数据安全加密保护"修改为只保留数据保护提示，不暴露具体 AI 模型名称

## Tech Stack

- React + TypeScript (PetChat.tsx)
- 原生 CSS (pet-chat.css)

## Implementation Approach

### 1. 顶部快捷入口卡片 - 宫崎骏手绘治愈风格

**当前结构**：横向滚动容器内两个竖向小按钮卡片（图标圆圈 + 标签 + 描述）
**目标**：保持横向双卡片排版，应用宫崎骏手绘治愈风格

**JSX 改造** (PetChat.tsx 第552-577行)：

- 保持 QUICK_ACTIONS 配置不变
- 调整 JSX 结构为更舒展的横向双卡片布局（每个卡片更大、更饱满）

**CSS 重写** (pet-chat.css .quick-actions-bar 相关)：

- 背景：花粉白/米色系 (#FFFAF0 / #FEF9F0)
- 边框：实线 + 微透明度，手绘不规则感 (border-radius: 18px 22px 20px 24px)
- 图标区：圆形渐变背景改为水彩晕染效果（柔和渐变 + 轻微旋转角度）
- 文字：使用 ZCOOL KuaiLe 字体，标题加粗带轻微阴影
- 装饰元素：添加浮动 emoji / 小星星装饰
- hover 效果：轻微上浮 + 边框颜色变化
- 纸张纹理：radial-gradient 多层叠加模拟纸张质感

**参考现有项目模式**：复用 index.css 中已实现的吉卜力卡片样式（.ghibi-card 系列）的设计语言：

- --ghibi-accent 变量系统
- 手写字体栈
- 纸张纹理背景
- 不规则圆角

### 2. 底部安全提示精简

**文本替换** (PetChat.tsx 第807行)：

- 原: "所有 AI 功能均由 GLM 智能模型驱动，数据安全加密保护 🛡️"
- 新: "你的数据全程加密保护，我们用心守护每一次互动 🛡️"

**CSS 微调** (pet-chat.css .chat-guide-tips)：

- 字色稍微加深提升可读性
- 可选增加一个盾牌图标或锁图标增强安全感

## Directory Structure Summary

```
src/
├── pages/PetChat.tsx          # [MODIFY] 顶部卡片 JSX 重构 + 底部文案替换
└── pet-chat.css               # [MODIFY] 宫崎捷风格卡片样式重写 + 提示样式微调
```

## 设计方案：宫崎骏手绘治愈风快捷入口卡片

### 整体设计理念

采用《龙猫》《悬崖上的金鱼姬》式的温暖手绘质感，让功能入口看起来像是从动画场景中自然生长出来的小物件。

### 页面区块设计

#### 区块 1：顶部快捷入口栏 (quick-actions-bar)

- **布局**：两卡片等宽并排，居中对齐，间距 12px
- **卡片尺寸**：高度约 88px，宽度各占 48%（flex: 1）
- **整体氛围**：温暖的米色纸张底板，像手工剪贴的小便签

##### 子块 A：单个快捷入口卡片 (.quick-action-btn)

- **背景**：#FFFEF9 花粉白底 + radial-gradient 纸张纹理
- **边框**：1.5px solid rgba(180,170,155,0.25)，不规则圆角 16px 20px 18px 22px
- **阴影**：0 2px 8px rgba(160,140,120,0.08), 内发光 inset
- **hover**: translateY(-3px), 阴影加深, border-color 渐变为主题色

##### 子块 B：图标区域 (.quick-action-icon-wrap)

- **形状**：48x48 圆形，水彩渐变背景
- **拍照卡片**：淡紫罗兰渐变 #C4B5FD → #A78BFA
- **选图卡片**：暖琥珀渐变 #FCD34D → #F59E0B
- **特效**：轻微旋转(-2deg)、双层边框(外层半透明白色描边模拟水彩边缘)
- **图标**：Lucide Icon 白色，size=22

##### 子块 C：文字区域

- **标题**(.quick-action-label)：14px, #4A3728, font-weight:600, ZCOOL KuaiLe, text-shadow: 1px 1px 0 rgba(255,255,255,0.8)
- **描述**(.quick-action-desc)：11px, #9B8B7E, font-style:italic, 单行截断
- **装饰**：每张卡片右下角有一个微小的浮动装饰 emoji（拍照用📷星星，选图用🖼️花瓣）

#### 区块 2：底部安全提示 (chat-guide-tips)

- **布局**：居中单行，padding 加大
- **文案**："你的数据全程加密保护，我们用心守护 🛡️"
- **字体**：12px, #9B9088, 居中显示
- **背景**：浅绿调保护色 rgba(167,199,148,0.10) 替代灰色

### SubAgent

- **code-explorer**
- Purpose: 已在准备阶段完成代码探索，定位了所有需要修改的精确位置（行号、选择器、内容）
- Expected outcome: 确认 PetChat.tsx 第552-577行(快捷入口)、第807行(底部文案) 和 pet-chat.css 第1736-1813行(快捷样式)、第3632-3646行(提示样 式)的准确上下文