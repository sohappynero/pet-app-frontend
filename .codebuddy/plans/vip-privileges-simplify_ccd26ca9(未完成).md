---
name: vip-privileges-simplify
overview: 精简会员特权区域为3张卡片（情绪识别、AI健康分析、更多特权），匹配截图圆形图标风格
design:
  architecture:
    framework: react
  styleKeywords:
    - Minimalism
    - Soft
    - Card
    - CircularIcon
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 16px
      weight: 600
    subheading:
      size: 13px
      weight: 700
    body:
      size: 11px
      weight: 500
  colorSystem:
    primary:
      - "#8B5CF6"
      - "#FB923C"
      - "#FB7185"
    background:
      - "#FAF5F5"
      - "#FFFFFF"
      - "#EDE9FE"
      - "#FFEDD5"
      - "#FCE7F3"
    text:
      - "#3D2E24"
      - "#B5A69A"
    functional:
      - "#FB7185"
todos:
  - id: prune-privileges-data
    content: 精简 VipSubscribe.tsx PRIVILEGES 为 3 项并改用 Lucide 图标
    status: pending
  - id: restyle-privilege-cards
    content: 调整 pet-chat.css 为截图风格：圆形彩色图标、3 列网格、卡片样式
    status: pending
    dependencies:
      - prune-privileges-data
---

## Product Overview

在 VipSubscribe 会员开通页面的「会员专属特权」区域，按照截图风格精简为 3 张卡片。

## Core Features

- 保留「情绪识别」「AI健康分析」2 张特权卡片
- 在旁边新增「更多特权」卡片，共 3 张
- 样式匹配截图风格：圆形彩色背景图标 + 卡片标题 + 灰色小字描述
- 图标使用 Lucide SVG（Smile、Sparkles、Crown），每张卡片拥有独立的图标底色
- 网格布局改为 3 列，卡片白色圆角、浅色背景

## Tech Stack

- 前端框架: React + TypeScript
- 样式: 纯 CSS（项目现有 pet-chat.css）
- 图标: lucide-react

## Implementation Approach

将现有 `PRIVILEGES` 数组从 10 项精简为 3 项，每项配置对应的 Lucide 图标与圆形背景色。CSS 侧将图标包裹层从 `border-radius: 12px` 改为 `50%` 圆形，并将网格从 4 列调整为 3 列，其余卡片间距和字体大小微调以匹配截图。

## Directory Structure

```
src/pages/VipSubscribe.tsx  # [MODIFY] 精简 PRIVILEGES 为 3 项，使用 Lucide 图标
src/pet-chat.css            # [MODIFY] 调整 vip-sub-privileges 区域样式：3 列网格、圆形彩色图标、卡片间距
```

## Design Style

参考截图的轻量卡片风格：浅色米白背景、白色圆角卡片、圆形彩色底图标、深色标题加粗、灰色小字描述。整体温暖柔和，与现有会员页面的暖色调保持一致。

## Page Planning

仅在 VipSubscribe 页面的「会员专属特权」区块做改动，不新增页面。

## Block Design

- 标题行：皇冠图标 +「会员专属特权」文字，左对齐
- 卡片网格：3 列等宽，间距 12px
- 单张卡片：
- 顶部：48px 圆形彩色背景图标（情绪识别=浅紫底紫图标、AI健康分析=浅橙底橙图标、更多特权=浅粉底粉图标）
- 中部：13px 深色加粗标题
- 底部：11px 灰色描述文字
- 卡片整体：白色背景、16px 圆角、无边框或极淡边框、无阴影
- 「更多特权」卡片可保持轻微高亮（浅粉渐变底色或粉色文字）