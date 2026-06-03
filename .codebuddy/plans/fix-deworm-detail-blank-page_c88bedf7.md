---
name: fix-deworm-detail-blank-page
overview: 修复驱虫护理详情页空白问题：在 RecordDetail.tsx 的 useEffect 中添加 deworm 类型的专门查询逻辑，调用 fetchDewormings() API 从正确的数据表获取驱虫记录详情
todos:
  - id: fix-imports
    content: 补全 RecordDetail.tsx 的 import，添加 fetchDewormings/fetchVaccines/fetchCheckups/fetchMedicals
    status: completed
  - id: add-deworm-branch
    content: 在 useEffect 中添加 deworm 类型的专用查询和字段映射分支
    status: completed
    dependencies:
      - fix-imports
  - id: add-other-branches
    content: 同步添加 vaccine/checkup/visit 类型的专用查询分支防止同类问题
    status: completed
    dependencies:
      - fix-imports
  - id: verify-build
    content: 构建验证无 TypeScript 编译错误
    status: completed
    dependencies:
      - add-deworm-branch
      - add-other-branches
  - id: test-deworm-page
    content: 使用 webapp-testing 验证驱虫详情页正常渲染
    status: completed
    dependencies:
      - verify-build
---

## Product Overview

修复"驱虫护理"记录详情页点击后显示空白页的问题。

## Core Features

- 驱虫护理详情页能正确从 `pet_deworming_records` 专用表获取并展示数据
- 显示驱虫专用字段：药品名称、驱虫类型（体内/体外/体内外同驱）、驱虫地点、费用、备注
- 同时为 vaccine（疫苗）、checkup（体检）、visit（就诊）类型补充专用查询分支，避免同类问题

## Tech Stack

- **前端框架**: React 18 + TypeScript
- **路由**: React Router v6 (useParams + useSearchParams)
- **API 层**: 自定义 request 封装 (`src/lib/api.ts`)
- **数据模型**: HealthRecord / DewormingRecord 类型定义 (`src/types.ts`)

## Implementation Approach

### 问题根因分析

`RecordDetail.tsx` 第 168-298 行的 `useEffect` 数据加载逻辑中：

1. **import 缺失**: 第 26 行只导入了 `fetchRecords, fetchWeights, fetchFeedings, fetchGroomings, fetchObservations`，**未导入 `fetchDewormings, fetchVaccines, fetchCheckups, fetchMedicals`**
2. **缺少分支处理**: deworm/vaccine/checkup/visit 四种类型在 if-else 链中没有专门分支，全部走到第 289 行的 else 分支
3. **else 分支错误**: 调用 `fetchRecords(phone)` 查询通用 `health_records` 表，但驱虫等数据实际存储在各专用表中 → 查不到记录 → setRecord(null) → 显示空白

### 修复策略

参照已有正确实现的 weight/diet/beauty/observation 分支模式，为缺失的 4 种类型添加专用查询分支：

| 类型 | API 函数 | 数据表 | 字段映射 |
| --- | --- | --- | --- |
| deworm | fetchDewormings(petId) | pet_deworming_records | medication_name→title, deworming_date→record_date, pet_hospital→hospital |
| vaccine | fetchVaccines(petId) | vaccine_records | vaccine_name→title, vaccine_date→record_date |
| checkup | fetchCheckups(petId) | check_up_records | check_up_date→record_date |
| visit | fetchMedicals(petId) | medical_case_records | chief_complaint→title, medical_date→record_date |


### 实现细节

**修改文件**: 仅 `src/pages/RecordDetail.tsx`

**修改点 1 - import 补全** (第 26 行):

```typescript
// Before:
import { fetchRecords, fetchWeights, fetchFeedings, fetchGroomings, fetchObservations } from "../lib/api";
// After:
import { fetchRecords, fetchWeights, fetchFeedings, fetchGroomings, fetchObservations, fetchDewormings, fetchVaccines, fetchCheckups, fetchMedicals } from "../lib/api";
```

**修改点 2 - 添加 deworm 分支** (在第 288 行 `.finally(...)` 之后，第 289 行 `} else {` 之前插入):

```typescript
    } else if (type === "deworm" && petId) {
      fetchDewormings(petId)
        .then((res) => {
          const found = (Array.isArray(res) ? res : []).find((r: any) => r.id === targetId);
          if (found) {
            setRecord({
              ...found,
              id: found.id,
              record_type: "deworm",
              record_date: found.deworming_date ? String(found.deworming_date).slice(0, 10) : "",
              title: found.medication_name || "驱虫护理",
              hospital: found.pet_hospital || "",
              deworm_type: found.deworming_type || "",
              cost: found.cost ?? null,
              weight_kg: null, mood: "", appetite: "",
              note: found.notes || `${found.medication_name||'驱虫'}${found.pet_hospital?` | ${found.pet_hospital}`:''}${found.cost?` | ${found.cost}元`:''}`,
              images: found.photo_urls || [],
            } as HealthRecord);
          } else { setRecord(null); }
        })
        .finally(() => setLoading(false));
```

**修改点 3 - 同理添加 vaccine/checkup/visit 分支**, 参照 Records.tsx 中已有的字段映射逻辑（316-413行区域）

### 性能 & 可靠性

- 无额外性能开销：每个请求仅在匹配到对应 type 时触发一次
- 错误处理：保持现有模式（.finally 确保加载状态重置）
- 向后兼容：不影响 weight/diet/beauty/observation 已有逻辑

## Architecture Design

单文件内修复，不涉及架构变更。数据流如下：

```
Records.tsx 列表项点击
  → navigate(`/app/record/${id}?type=deworm`)
    → RecordDetail.tsx useEffect 检测 type=deworm
      → fetchDewormings(petId) [API: GET /api/v1/health/dewormings?pet_id=X]
        → 在返回数组中 find(id === targetId)
          → 映射为 HealthRecord 格式 → setRecord()
            → 渲染详情 UI（驱虫专用字段 + 通用字段）
```

## Agent Extensions

- **webapp-testing**: 使用 Playwright 测试修复后的驱虫详情页是否正常显示内容