---
name: add-more-services-to-feature-vote
overview: 将图片「更多服务」中6个功能（宠物殡葬、宠物TV、宠物食品、同城聊天、宠物医院、美容预约）作为投票候选项添加到「下一个功能你说了算」区块。同城聊天已存在，其余5项需要新增。操作包含：后端新增 SQL 插入脚本 + 首页展示调整。
todos:
  - id: insert-vote-candidates
    content: 在 pet_app 目录新建 insert_vote_candidates.py 脚本，使用 sqlite3 向 vote_candidates 表 INSERT OR IGNORE 写入5条新候选（宠物殡葬/宠物TV/宠物食品/宠物医院/美容预约），然后执行该脚本完成数据写入
    status: completed
---

## 用户需求

将图片「更多服务」中的6个功能入口，添加到首页「下一个功能你说了算」区块内，和现有样式保持一致，仅作追加。

## 产品概述

首页 `Pets.tsx` 已有「下一个功能你说了算」入口按钮，点击跳转 `/app/feature-vote` 投票页。投票页从后端 `/api/v1/vote/candidates` 动态拉取候选列表展示。本次需要将「宠物殡葬、宠物TV、宠物食品、同城聊天、宠物医院、美容预约」6项功能作为新的投票候选项写入后端数据库，用户在投票页看到并可为感兴趣的功能投票。

## 核心功能

- 向 `vote_candidates` 表插入5条新候选记录（同城聊天已存在，跳过）
- 5个新候选：宠物殡葬、宠物TV、宠物食品、宠物医院、美容预约
- 每项候选 `status=voting`，可在投票页正常展示和投票
- 前端首页入口按钮无需改动，投票页自动展示新候选数据

## 技术栈

- 后端：Python + SQLite（开发环境），通过新增 SQL 脚本写入候选数据
- 后端脚本：参考项目现有 `execute_sql.py` 模式，新建专用插入脚本
- 前端：无需修改（投票页动态读取后端数据，自动展示新候选）

## 实现方案

### 核心策略

项目使用 SQLite（`pet_app/pet_health.db`）作为本地开发数据库，配置文件走 `DATABASE_URL` 环境变量。`execute_sql.py` 是针对 MySQL 的，不适合直接复用。

正确做法：**新建一个 Python 脚本 `insert_vote_candidates.py`**，使用 Python 内置 `sqlite3` 模块直接操作 `pet_health.db`，以 `INSERT OR IGNORE` 语法安全插入，避免重复写入。

### 为什么不改前端

- `FeatureVote.tsx` 从后端 `/api/v1/vote/candidates` 动态拉取 `status=voting` 的候选列表，数据库写入后刷新页面即自动展示
- `Pets.tsx` 首页入口按钮逻辑完全不变，无需任何前端改动
- 零前端改动 = 零风险，完全满足用户「和现有的一样，只不过是添加进去」的要求

### 数据设计

新增5条候选（同城聊天 `city_chat` key 已存在，`INSERT OR IGNORE` 自动跳过）：

| key | title | description | display_order |
| --- | --- | --- | --- |
| pet_funeral | 宠物殡葬 | 专业宠物殡仪服务，让爱宠有尊严地离开 | 4 |
| pet_tv | 宠物TV | 宠物专属视频内容，轻松学习养宠技巧 | 5 |
| pet_food | 宠物食品 | 精选宠物食品商城，营养定制推荐 | 6 |
| pet_hospital | 宠物医院 | 一键查找周边宠物医院，在线预约挂号 | 7 |
| beauty_booking | 美容预约 | 宠物美容沙龙在线预约，随时随地护理 | 8 |


### 性能与安全

- `INSERT OR IGNORE` 保证幂等性，重复执行不报错不重复写入
- 脚本独立于后端服务，执行完毕即关闭连接，无影响
- `display_order` 延续现有 1~3 顺序，新增 4~8，保持列表排序一致

## 实施细节

- 数据库文件路径：`D:/codebuddy/pet_app/pet_health.db`
- 使用 Python 内置 `sqlite3`，无需额外依赖
- 脚本放在 `D:/codebuddy/pet_app/` 根目录，与 `execute_sql.py` 同级
- 执行完毕后，重启后端服务，刷新前端投票页即可看到新候选

## 目录结构

```
D:/codebuddy/pet_app/
└── insert_vote_candidates.py   # [NEW] SQLite 插入脚本，使用 INSERT OR IGNORE 写入5条新候选
```

前端无任何文件变动。