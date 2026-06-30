---
name: 修改下拉切换宠物样式匹配image.png
overview: 将 LampSwitch.tsx 中的"下拉切换宠物"提示区域从当前的双箭头小字样式改为 image.png 中的单粗箭头+大字样式
todos:
  - id: modify-switch-hint-ui
    content: 修改 LampSwitch.tsx 第263-267行：调换箭头/文字顺序、增大箭头尺寸、文字拆两行
    status: completed
  - id: verify-screenshot
    content: 用 [mcp:MCP Server Playwright] 启动项目并截图验证最终效果是否匹配 image.png
    status: completed
    dependencies:
      - modify-switch-hint-ui
---

## 产品概述

将首页 LampSwitch 组件中的"下拉切换宠物"区域样式修改为与 image.png 目标设计一致。

## 核心功能

修改 `LampSwitch.tsx` 第 263-267 行的"下拉切换宠物"提示区域：

1. **顺序调换**：箭头在上、文字在下（当前是文字在上、箭头在下）
2. **箭头调整**：双箭头 `⌄⌄` 改为单箭头 `⌄`，字号从 13px 增大到 20px，使其更醒目
3. **文字拆行**："下拉切换宠物"拆为两行显示（`下拉切换` / `宠物`），字号从 11px 增大到 13px
4. **保持弹跳动画**：动画效果保留在箭头上
5. **视觉风格**：维持金色暖色调 + 文字阴影光晕感

## 视觉差异对比

| 属性 | 当前值 | 目标值 |
| --- | --- | --- |
| 排列顺序 | 文字 → 箭头 | 箭头 → 文字 |
| 箭头内容 | `⌄⌄` 双箭头 | `⌄` 单大箭头 |
| 箭头大小 | 13px | ~20px |
| 文字格式 | 单行 "下拉切换宠物" 11px | 两行 `下拉切换`/`宠物` ~13px |


## 技术栈

- React + TypeScript (LampSwitch.tsx)
- Tailwind CSS 内联类名
- CSS keyframe 动画 (`switch-hint-bounce`，已存在于 home-dashboard.css)

## 实现方案

纯 UI 微调，仅修改一个文件的一处代码块（第263-267行）：

### 文件影响范围

```
src/components/LampSwitch.tsx     [MODIFY] 第263-267行：重排"下拉切换宠物"区域结构
```

### 具体改动

将当前的：

```
<div className="pointer-events-none flex flex-col items-center mt-1.5 gap-0.5">
  <span>下拉切换宠物</span>   {/* 文字在上 */}
  <span>⌄⌄</span>             {/* 双箭头在下 */}
</div>
```

改为：

```
<div className="pointer-events-none flex flex-col items-center mt-2">
  <span className="text-[20px] leading-none text-[rgba(232,190,120,0.9)]" style={{ animation: 'switch-hint-bounce 2s ease-in-out infinite', textShadow: '0 0 8px rgba(232,190,120,0.6)' }}>⌄</span>
  <span className="text-[13px] font-medium text-[rgba(232,190,120,0.9)] mt-1 tracking-wide leading-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
    下拉切换<br/>宠物
  </span>
</div>
```

### 关键决策

- 箭头使用单 `⌄` 字符放大到 20px，比原来的双 `⌄⌄` 更接近目标图的单箭头设计
- 文字用 `<br/>` 拆行为两行，匹配目标图的排版
- 弹跳动画保留在箭头上（这是交互提示的重点）
- 颜色和阴影风格不变，仅微调透明度使整体更协调

### Skill: impeccable

- **Purpose**: 对修改后的UI进行精细化审查
- **Expected outcome**: 确保箭头大小、文字间距、颜色一致性符合目标图效果

### MCP: MCP Server Playwright

- **Purpose**: 截图验证实际渲染效果
- **Expected outcome**: 通过浏览器截图确认修改后的"下拉切换宠物"区域与目标图一致