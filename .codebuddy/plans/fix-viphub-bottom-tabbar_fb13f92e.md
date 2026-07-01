---
name: fix-viphub-bottom-tabbar
overview: 修复会员专区底部菜单栏样式，改为与"我的"页面统一的铺满风格导航栏，解决宽度不一致和拼写错误问题
todos:
  - id: fix-tabbar-style
    content: 修改 petos.css 中 .petos-tabbar 为铺满整行样式（left:0;right:0;bottom:0;border-radius:0;max-width:100%）并修复 .petros-tabbar 拼写错误
    status: completed
  - id: verify-lint
    content: 运行 lint 检查验证修改无语法错误
    status: completed
    dependencies:
      - fix-tabbar-style
---

## 用户需求

修改会员专区页面底部菜单栏，使其铺满整行（与"我的"页面一致），解决当前胶囊形导航栏在宽 viewport 下右边缺失的问题。

## 核心问题

1. `.petos-tabbar` 胶囊形样式（`left:14px; right:14px; border-radius:30px`）导致导航栏在桌面端不铺满，右侧有明显空白
2. `petos.css:360` 存在拼写错误：`.petros-tabbar` 应为 `.petos-tabbar`，导致 drawer 打开时导航栏无法正确隐藏
3. `max-width:452px` 与内容区 `max-w-[520px]` 宽度不匹配

## 修改范围

- 仅修改 `petos.css` 中 `.petos-tabbar` 的定位和圆角样式
- 修复拼写错误
- 保持毛玻璃效果和内部布局不变

## 技术方案

### 修改策略

将 `.petos-tabbar` 从胶囊形改为铺满整行风格，参考旧版 `.bottom-tabbar` 的设计：

- `left: 14px; right: 14px` → `left: 0; right: 0`
- `bottom: 10px` → `bottom: 0`
- `border-radius: 30px` → `border-radius: 0`
- `max-width: 452px` → `max-width: 100%`（让导航栏在内容区宽度内铺满）
- 保持 `position: fixed`、`z-index: 30`、flex 布局、padding 等不变
- 修复拼写错误：`.petros-tabbar` → `.petos-tabbar`

### 实现细节

- **文件**: `src/styles/petos.css`（第343-362行）
- **影响范围**: 所有使用 `GlassTabBar` 的页面（首页、记录、会员专区、我的）
- **风险控制**: 只修改定位和圆角，不改变内部 tab 项的布局和交互逻辑
- **兼容性**: 所有页面统一使用同一导航栏组件，修改后效果一致

### 修改前后对比

| 属性 | 修改前（胶囊形） | 修改后（铺满形） |
| --- | --- | --- |
| left | 14px | 0 |
| right | 14px | 0 |
| bottom | 10px | 0 |
| max-width | 452px | 100% |
| border-radius | 30px | 0 |
| padding | 10px 8px 14px | 10px 8px calc(14px + env(safe-area-inset-bottom)) |


### 目录结构

```
frontend/
└── src/
    └── styles/
        └── petos.css  # [MODIFY] 第343-362行：修改 .petos-tabbar 样式 + 修复拼写错误
```