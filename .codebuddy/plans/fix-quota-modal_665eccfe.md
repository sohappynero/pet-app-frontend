---
name: fix-quota-modal
overview: 修复图片识别五次机会用完后配额弹窗不显示的 bug。`fetchPhotoMind` 在 429 非 JSON 响应时未返回 `quotaError`，导致调用方无法触发弹窗。
todos:
  - id: fix-quota-error
    content: 修复 fetchPhotoMind 429 catch 分支缺少 quotaError 的问题
    status: completed
  - id: verify-modal-trigger
    content: 验证 PetChat.tsx 中弹窗状态绑定和触发逻辑正确性
    status: completed
    dependencies:
      - fix-quota-error
---

## 问题描述

用户在使用图片识别（照片心声）功能时，免费配额（每月5次）用完后，没有出现配额超限弹窗提示。

## 核心原因

`src/lib/pet-mind.api.ts` 中 `fetchPhotoMind` 函数处理 HTTP 429（配额超限）响应时存在逻辑漏洞：

- 当后端返回的 429 响应体为 JSON 格式时，正常解析并返回 `quotaError` 对象，弹窗可正常触发。
- 当后端返回的 429 响应体**不是 JSON 格式**（或解析失败进入 catch 分支）时，返回的对象中**缺少 `quotaError` 字段**，仅返回 `{ success: false, error: "本月次数已用完，请稍后再试" }`。
- 调用方 `PetChat.tsx` 通过 `else if (res.quotaError)` 判断来打开弹窗，由于 `quotaError` 为 `undefined`，条件不成立，导致弹窗无法出现，仅弹出浏览器原生 `alert`。

## 修复范围

仅修改 `src/lib/pet-mind.api.ts` 中 `fetchPhotoMind` 的 429 错误处理逻辑，确保无论后端响应格式如何，都能返回包含默认 `quotaError` 的完整错误对象。

## 预期效果

配额用完后，用户将看到治愈风弹窗（显示"本月次数飞走啦~"、委屈小动物插画、进度条、解锁会员按钮等），而非冰冷的浏览器 alert。

## 技术方案

### 问题定位

- **文件**：`src/lib/pet-mind.api.ts`
- **函数**：`fetchPhotoMind`（第156-278行）
- **漏洞位置**：第196-215行，429 错误处理的 `catch` 分支未返回 `quotaError`

### 修复策略

在 429 响应解析失败的 `catch` 分支中，补充返回默认构造的 `QuotaError` 对象：

- `type: "quota_exceeded"`
- `feature: "photo_emotion"`
- `used: 5`（与免费版月度限额对齐）
- `limit: 5`
- `plan: "free"`
- `upgradeHint: "升级会员可获得更多使用次数"`

### 代码变更

仅修改一处逻辑：将第214行的 `return { success: false, error: "本月次数已用完，请稍后再试" }` 替换为包含默认 `quotaError` 的返回对象。

### 兼容性

- 不影响 JSON 格式 429 响应的正常解析
- 向后兼容：调用方 `PetChat.tsx` 的判断逻辑 `else if (res.quotaError)` 无需修改
- CSS 样式已存在，无需调整