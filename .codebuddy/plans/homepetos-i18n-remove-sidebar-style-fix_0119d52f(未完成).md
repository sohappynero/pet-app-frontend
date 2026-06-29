---
name: homepetos-i18n-remove-sidebar-style-fix
overview: 将 HomePetOS 仪表盘界面改为中文、移除左侧导航栏、调整文字样式为原有风格
design:
  architecture:
    framework: react
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 20px
      weight: 700
    subheading:
      size: 14px
      weight: 600
    body:
      size: 13px
      weight: 400
  colorSystem:
    primary:
      - "#17A2B8"
      - "#20C997"
    background:
      - "#E8F4F8"
      - "#FFFFFF"
    text:
      - "#1A3A4A"
      - "#6B8A9A"
    functional:
      - "#FFB5BA"
      - "#FF8A95"
todos:
  - id: i18n-chinese
    content: HomePetOS.tsx 全量中文化：问候语、5张卡片标题/副标题、4个圆环标签、内圈提示、默认昵称、月份locale
    status: pending
  - id: remove-sidebar-jsx
    content: 删除 HomePetOS.tsx 中左侧导航栏 nav.hdBidebar 区块，简化 hdBody 为直接包裹仪表盘区域
    status: pending
  - id: remove-sidebar-css
    content: 删除 home-dashboard.css 中所有 sidebar/nav-item 相关样式规则（含响应式），hdBody 去掉 flex 布局
    status: pending
  - id: align-font-style
    content: hdPage font-family 改用 var(--font-family) token 对齐项目原有文字风格
    status: pending
  - id: lint-verify
    content: 运行 lint 和类型检查确认无报错
    status: pending
    dependencies:
      - i18n-chinese
      - remove-sidebar-jsx
      - remove-sidebar-css
      - align-font-style
---

## Product Overview

将首页仪表盘从英文改为中文，移除左侧导航栏，文字样式与项目原有风格保持一致。

## Core Features

1. **全量中文化**：问候语（Good Morning/Afternoon/Evening → 早上好/下午好/晚上好）、5张浮动卡片标题和副标题（Appointments/Diet/Check-Ups/Diagnosis/Tests）、圆环状态标签（Owner/Neutered/Breed/Age）、内圈提示文字（Patient Name）、默认昵称（Doctor → 家长）、月份显示（en-US → zh-CN）
2. **移除左侧导航栏**：删除 `<nav className="hd-sidebar">` 整个区块（含5个图标按钮），以及 CSS 中所有 `.hd-sidebar`、`.hd-nav-item` 相关样式规则，调整 `.hd-body` 布局为单列
3. **文字样式对齐原版**：`.hd-page` 的 `font-family` 从硬编码 `'PingFang SC'...` 改为 `var(--font-family)` 使用项目 token；关键字重改用 `var(--font-weight-medium)` / `var(--font-weight-semibold)` 等变量

## Tech Stack

- React + TypeScript（现有项目技术栈）
- 纯 CSS 修改（home-dashboard.css），无新依赖

## Implementation Notes

### 文件修改范围

| 文件 | 改动类型 | 说明 |
| --- | --- | --- |
| `src/pages/HomePetOS.tsx` | [MODIFY] | 中文化文本 + 删除 sidebar JSX |
| `src/styles/home-dashboard.css` | [MODIFY] | 删除 sidebar 样式 + font-family 对齐 token |


### 具体改动点

#### HomePetOS.tsx — 中文化映射表

```
greet()           "Good Morning"  → "早上好"
                  "Good Afternoon" → "下午好"
                  "Good Evening"   → "晚上好"

卡片标题          "Appointments"  → "预约提醒"
                  "Diet"          → "饮食建议"
                  "Protein low"   → "蛋白质偏低"
                  "Check-Ups"     → "体检记录"
                  "Diagnosis"     → "健康诊断"
                  "Normal"        → "正常"
                  "Loading..."    → "加载中..."
                  "Tests"         → "检测报告"

圆环标签          "Owner"         → "主人"
                  "Neutered"      → "绝育"
                  "Breed"         → "品种"
                  "Age"           → "年龄"

内圈              "Patient Name"  → "宠物名字"

默认名            "Doctor"        → "家长"

月份              en-US locale    → zh-CN locale (显示中文月份如"六月")
```

#### HomePetOS.tsx — 删除内容

- L234-251: 删除整个 `<nav className="hd-sidebar">...</nav>` 区块
- L232-253: 将外层 `<div className="hd-body">` 简化为直接包含 `hd-dashboard-area`（去掉 flex 布局包裹）

#### home-dashboard.css — 样式调整

1. **删除 sidebar 相关样式**（约50行）：

- `.hd-sidebar` 及其所有子样式
- `.hd-nav-item`, `.hd-nav-item--active`, `.hd-nav-item svg`

2. **删除响应式中 sidebar 规则**
3. **font-family 对齐**：

- `.hd-page`: `font-family: 'PingFang SC', ...` → `font-family: var(--font-family)`

4. **布局简化**：

- `.hd-body`: 去掉 `display: flex; gap: 16px;`，改为块级容器

### 性能与兼容性影响

- 纯文本替换和 CSS 删减，零性能开销
- 移除 sidebar 后页面更简洁，移动端空间利用率提升

本次不涉及 UI 结构大改，仅做三件事：1）英文→中文文案替换；2）删掉左侧竖向导航栏让仪表盘区域占满宽度；3）字体系统从硬编码值改为项目统一的 design token 变量。整体视觉风格不变。