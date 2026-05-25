---
name: fix-avatar-consistency-reminders-page
overview: 修改 Reminders.tsx，添加与 Pets.tsx 相同的 displayPet 合并逻辑，使两页面头像一致
todos:
  - id: fix-reminder-avatar
    content: 修改 Reminders.tsx 的头像显示逻辑：导入 getLocalAvatar、添加 localAvatarUrl 状态和 displayPet 合并计算，使头像与首页一致
    status: completed
---

## 产品概述

用户反馈首页（Pets.tsx）和提醒页面（Reminders.tsx）显示的宠物头像不一致。首页显示真实的猫咪照片，而提醒页面显示的是奖牌/徽章图片（FOUNDING PAWS Limited Edition）。

## 核心功能

- 修复提醒页面头像显示逻辑，使其与首页保持一致
- 确保两个页面使用相同的头像优先级链：localStorage缓存 > _resolved_avatar_url > 原始数据

## 技术栈

- 前端框架：React + TypeScript
- 组件：PetPhotoAvatar（宠物照片展示组件）
- 头像管理：`../lib/pet-avatar` 中的 `getLocalAvatar` 函数

## 实现方式

### 问题根因

**Reminders.tsx 第392行** 的 `currentPet` 直接使用原始 pet 数据传递给 `PetPhotoAvatar`：

```typescript
const currentPet = useMemo(() => selectedPet || pets[0] || null, [selectedPet, pets]);
// 直接传给 PetPhotoAvatar → 缺少 displayPet 合并逻辑
```

而 **Pets.tsx 第79-88行** 有正确的 `displayPet` 合并逻辑（优先级：本地缓存 > _resolved_avatar_url > 原始数据），提醒页面缺失此逻辑导致头像不一致。

### 修复方案

在 Reminders.tsx 中复用与 Pets.tsx 完全一致的 `displayPet` 计算模式：

1. **添加导入**：从 `../lib/pet-avatar` 导入 `getLocalAvatar`
2. **添加状态和 effect**：增加 `localAvatarUrl` 状态 + 从 localStorage 读取缓存的 useEffect
3. **新增 displayPet 计算**：复制 Pets.tsx 的三优先级合并逻辑（第79-88行）
4. **替换引用**：所有使用 `currentPet` 传给 `PetPhotoAvatar` 的地方改为 `displayPet`

### 涉及文件

```
src/pages/Reminders.tsx  [MODIFY]
  - 第22行：添加 getLocalAvatar 导入
  - 第379行附近：添加 localAvatarUrl 状态
  - 第392行：将 currentPet 改为 displayPet（含完整合并逻辑）
  - Hero区域 PetPhotoAvatar：pet={currentPet} → pet={displayPet}
  - 空状态区域 PetPhotoAvatar：pet={currentPet} → pet={displayPet}
```