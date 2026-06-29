---
name: home-dashboard-font-to-zcoolkuaile
overview: 将首页 home-dashboard.css 的 font-family 从 PingFang SC 系统字体改为 ZCOOL KuaiLe 站酷快乐体，与截图会员中心页面字体风格统一
todos:
  - id: change-font-family
    content: 修改 home-dashboard.css 第24行 font-family 为 'ZCOOL KuaiLe', cursive
    status: pending
---

## Product Overview

将首页仪表盘（HomePetOS）的 font-family 修改为与截图中会员中心页面一致的字体：**站酷快乐体 ('ZCOOL KuaiLe', cursive)**。

## Core Features

- 修改 `src/styles/home-dashboard.css` 第 24 行的 font-family 声明
- 当前值：`var(--font-family, 'PingFang SC', -apple-system, BlinkMacSystemFont, sans-serif)`
- 目标值：`'ZCOOL KuaiLe', cursive`

## Tech Stack

- 纯 CSS 属性修改，无需框架变更

## Implementation Approach

单行 CSS 修改，将 `.hd-page` 的 `font-family` 从系统默认字体栈改为 `'ZCOOL KuaiLe', cursive`。该字体与项目中 pet-chat.css、index.css 等文件已使用的字体保持一致（站酷快乐体），确保全站风格统一。

## Implementation Notes

- 仅修改 `home-dashboard.css` 第 24 行一处
- 不影响其他页面或组件的字体设置
- `'ZCOOL KuaiLe'` 是 Google Fonts 开源中文字体，浏览器已通过 CSS 引用

## Architecture Design

```
home-dashboard.css (第24行)
  .hd-page { font-family: 'ZCOOL KuaiLe', cursive; }
```

## Directory Structure

```
src/
└── styles/
    └── home-dashboard.css    # [MODIFY] 第24行 font-family 声明
```