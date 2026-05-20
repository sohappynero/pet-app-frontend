---
name: reminder-time-repeat-logic-refactor
overview: 重构添加提醒页的“提醒时间”区域与重复逻辑：按不重复/每天/每周/每月四种模式动态展示输入项，并在提交时自动换算下一次触发日期时间，整体保持粉色视觉风格。
todos:
  - id: verify-change-scope
    content: 使用[subagent:code-explorer]复核提醒创建链路与改动边界
    status: completed
  - id: refactor-repeat-and-time-ui
    content: 修改Reminders.tsx实现四档重复与动态提醒时间区块
    status: completed
    dependencies:
      - verify-change-scope
  - id: implement-next-trigger-calc
    content: 在Reminders.tsx实现下一次触发时间换算并接入提交
    status: completed
    dependencies:
      - refactor-repeat-and-time-ui
  - id: update-pink-styles
    content: 更新index.css新增周几和每月号选择样式并保持粉色
    status: completed
    dependencies:
      - refactor-repeat-and-time-ui
  - id: regression-check
    content: 回归验证四种重复模式显示与提交结果一致性
    status: completed
    dependencies:
      - implement-next-trigger-calc
      - update-pink-styles
---

## User Requirements

- 修改“添加提醒”页面中的“提醒时间”交互区域，按提供的4张参考图实现。
- 重复设置固定为4项：不重复、每天、每周、每月；移除“每年”。
- 不同重复类型下展示不同输入内容：  
- 不重复：日期 + 时间  
- 每天：仅时间  
- 每周：周几 + 时间  
- 每月：每月几号 + 时间
- 提交逻辑按参考图规则：根据重复类型自动换算“下一次触发时间”后再提交。
- 保持现有粉色主题风格与页面视觉一致性。

## Product Overview

- 在现有“添加提醒”表单中重构“重复设置 + 提醒时间”联动区域。
- 用户切换重复类型时，时间输入区自动切换对应控件，避免无关字段干扰。
- 保留当前页面结构与交互习惯，仅增强时间配置能力与准确性。

## Core Features

- 重复类型四选一切换（不重复/每天/每周/每月）。
- 提醒时间区动态渲染（日期、时间、周几、每月号数）。
- 提交前自动计算下一次触发日期时间并生成有效提交值。
- 全部新控件延续粉色视觉体系（按钮选中态、边框、文本、图标）。

## Tech Stack Selection

- 延用现有前端栈：React + TypeScript + React Router + 全局 `src/index.css` 样式体系。
- 延用现有提醒创建链路：`src/pages/Reminders.tsx` → `createReminder`(`src/lib/api.ts`)。

## Implementation Approach

- 在 `AddReminderPage` 内将“重复类型”和“提醒时间”改为联动式表单：统一维护 `repeat`、`dueTime`、`weeklyDay`、`monthlyDay`、`dueDate` 等状态，并按重复类型渲染输入区。
- 提交时新增“下一次触发时间计算”函数：基于当前时间与用户选择，计算目标 `due_date` + `due_time`，再走现有 `createReminder` 提交流程，保证兼容后端只接收 `remind_at` 的约束。
- 关键决策：不改后端接口结构，不新增路由或新页面，仅在现有页面内做可控增强，降低改动面与回归风险。

### Performance & Reliability

- 时间换算为常数级计算（O(1)），无列表遍历热点。
- 对“当前时间已过”的场景做顺延处理：  
- 每天：顺延到下一天  
- 每周：顺延到下一个目标周几  
- 每月：顺延到下一个有效月目标日
- 对每月天数边界做保护（如 31 号在小月自动落到该月最后一天或顺延到下月有效日，按既定函数规则统一处理）。

## Implementation Notes

- 保持 `createReminder` 现有入参风格，避免修改接口契约；在页面侧完成换算与兜底值生成。
- 重用当前 `add-remind-*` 命名风格扩展样式，避免引入新样式体系。
- 保持“粉色主题”视觉变量一致，避免引入绿色/蓝色主色导致风格漂移。
- 仅修改与提醒创建相关文件，避免触及列表、设置页、其他模块逻辑。

## Architecture Design

- 数据流：用户选择重复类型与时间 → 前端计算下一次触发时间 → 生成 `due_date/due_time` → `createReminder` 组装 `remind_at` 提交。
- 组件边界：逻辑集中在 `AddReminderPage`，API映射仍在 `src/lib/api.ts`，样式集中在 `src/index.css`。

## Directory Structure Summary

本次为现有提醒创建流程的局部改造，聚焦“提醒时间联动UI + 下一次触发计算”。

- `d:/codebuddy/frontend/src/pages/Reminders.tsx`  [MODIFY]  
- **Purpose**: 添加提醒页核心交互与提交逻辑。  
- **Functionality**: 移除 yearly；新增每周/每月选择状态；按重复类型动态渲染提醒时间区域；提交前换算下一次触发日期时间。  
- **Implementation requirements**: 保持现有 `createReminder` 调用方式与页面结构，补充边界校验和默认值兜底。

- `d:/codebuddy/frontend/src/index.css`  [MODIFY]  
- **Purpose**: 添加提醒页视觉样式。  
- **Functionality**: 增加周几/每月号数按钮组与动态输入区样式；优化选中态与禁用态；保持粉色主题。  
- **Implementation requirements**: 复用 `add-remind-*` 命名前缀，兼容移动端宽度与触控区域。

## Agent Extensions

- **SubAgent: `code-explorer`**
- **Purpose**: 在实施前后快速复核跨文件影响（`Reminders.tsx`、`index.css`、`api.ts` 调用链）与同类模式一致性。
- **Expected outcome**: 确保改动范围完整、无遗漏引用、无额外架构偏移。