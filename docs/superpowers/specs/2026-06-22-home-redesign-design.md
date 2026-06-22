# 宠物 App 首页重设计 — 设计文档

**日期**：2026-06-22
**主题**：首页重设计 + IA 重组 + 视觉系统打底（第一刀）

---

## 1. 背景与问题

当前前端是 React + Vite + Tailwind 的移动端 Web App，27 个页面，覆盖宠物档案、健康记录、AI 分析（美容/体重/健康/饮食/运动）、聊天、提醒、投票、VIP 订阅等功能。

通过用户旅程走查发现两层核心问题：

- **首次体验**：登录后落地的 `Dashboard` 是一个 4 步表单（添加宠物引导），90 秒内 0 价值输出。AI 没有出现过一次，"陪伴感"没有出现过一次。新用户第一次进 App 看到的是被要求填表，不是产品价值。
- **日常心智**：整个 App 是工具集合（"需要时才打开"），不是陪伴产品（"每天想看看"）。AI 全部依赖用户手动喂数据，没有"它今天怎么样"这种主动输出。

## 2. 产品转向

从 **"宠物的电子档案柜"** → **"宠物的数字生命摆件"**

一句话心智：

> 它是一个能感知到你家宠物今天怎么样的 AI 小角色。每天打开一次，就像看一眼孩子。

### 2.1 目标用户

- **年轻主人**（20-30 岁、独居、把宠物当"毛孩子"）
- **责任型主人**（30-45 岁、有家庭、宠物是"家里成员"）

两类共性：把宠物当家人，愿意为之花心思。

### 2.2 数据闭环

宠物身上没有手表/手机被动采集数据。本期采用 **"一拍 + 一选"** 的极轻量数据闭环：

- **一拍**：每日随手拍一张照片（宠物主天然会做的事）。AI 从照片识别精神/体态/异常。
- **一选**：3 个气泡问"今天吃了吗 / 动了吗 / 状态如何"，10 秒答完。

AI 把这两个轻量输入 + 宠物档案（品种、年龄、体重基准）合成"今日报告"。

### 2.3 AI 人格

- **宠物第一人称**："今天精神不错～"
- **软萌但克制**：避免"喵呜呜～主人快来摸摸我！🥺"那种廉价卖萌
- **避免冷静播报**：不要"该宠物今日精神状态：良好"那种医院系统口吻

## 3. 第一刀范围

本期只做这三件事，**严格不外溢**：

1. **视觉系统打底**：设计 token（色 / 字 / 间距 / 圆角 / 阴影），新建 `tokens.css`
2. **IA 重组**：27 个页面收敛到 4 个 Tab（首页 / 洞察 / 成长 / 我的）
3. **首页重写**：新建 `Home.tsx`，作为登录后默认落地

### 3.1 不在本期范围

- ❌ AI 洞察详情页内容（先用首页摘要顶住）
- ❌ 成长档案详情页内容（同上）
- ❌ 会员体系重做
- ❌ 动效系统精修（仅基础动效）
- ❌ 后端 API 改动（前端用 mock 层）
- ❌ 现有 27 个页面的内部重写（IA 只动入口和归属，页面内容暂不动）
- ❌ 暗色主题、主题色切换、引入设计组件库

## 4. 信息架构（IA）

### 4.1 4 个 Tab 的定位

| Tab | 一句话定位 | 灵魂 |
|---|---|---|
| 🏠 首页 | "看一眼它今天怎么样" | 陪伴感 |
| 💡 洞察 | "AI 怎么看它的健康" | 专业感 |
| 📖 成长 | "和它在一起的这段时间" | 故事感 |
| 👤 我的 | 账户 / 宠物档案 / 会员 / 设置 | 工具入口 |

### 4.2 现有 27 个页面的归属

| 现有页面 | 新归属 | 处理方式 |
|---|---|---|
| `Login` / `Register` | 独立路由 | 保留 |
| `Dashboard`（添加宠物 4 步引导）| 我的 → 宠物档案 → 添加 | 路由保留为 `/app/pets/add`，**不再是首页** |
| `Pets`（宠物列表）| 我的 → 宠物档案 | 移到二级页 |
| `Mine` | 我的（Tab 4 主页）| 保留现有内容，本期作为 Tab 4 入口；内部重写不在本期 |
| `Records` | 成长 → 记录入口 | 移到二级 |
| `RecordDetail` | 成长 → 记录详情 | 路由保留 |
| `RecordsCalendar` | 成长 → 日历 | 移到二级 |
| `AddRecord` | 成长 → 添加记录 | 移到二级 |
| `Reminders` / `ReminderSettings` | 我的 → 提醒 | 移到二级 |
| `AiAnalysis`（AI 分析聚合页）| **删除** | 功能由洞察 Tab 替代 |
| `BeautyAnalysis` | 洞察 → 子页 | 路由保留 |
| `WeightTrendAnalysis` | 洞察 → 子页 | 路由保留 |
| `HealthReportAnalysis` | 洞察 → 子页 | 路由保留 |
| `DietAnalysis` | 洞察 → 子页 | 路由保留 |
| `ExerciseAnalysis` | 洞察 → 子页 | 路由保留 |
| `PetChat` | 保留为首页可选入口 | 本期不动其页面内容 |
| `VipSubscribe` | 我的 → 会员 | 移到二级 |
| `FeatureVote` / `HelpCenter` / `FeedbackCenter` / `PrivacySettings` | 我的 → 设置 | 都收进设置二级 |
| `TestNewFeatures` / `TokenRefreshTest` | **删除** | 开发用页面，清理 |

### 4.3 关键变化

1. **登录后默认落地页从"添加宠物"→ 首页**
   - 已有宠物：直接看 Hero
   - 没有宠物：首页显示零数据态引导（不直接糊一脸表单）
2. **添加宠物从首页 → `/app/pets/add`**（低频操作，不该占首页）
3. **AI 分析从"5 个并列入口" → "洞察 Tab 内的统一卡片"**

### 4.4 本期实际动的 vs. 目标归属

4.2 表描述的是**目标结构**（多刀完成后）。本期只做：

- 新增底部 4 Tab Bar（首页 / 洞察 / 成长 / 我的）
- 默认落地从 `/app`（旧 `Dashboard`）改为 `/app`（新 `Home`）
- 新增 `/app/insights`、`/app/timeline` 占位路由（外壳页面）
- 删除废弃路由：`/app/ai-analysis`、`token-refresh-test`、`test-new-features`
- 旧 `Dashboard` 路由从 `/app` 改挂到 `/app/pets/add`

**不动的部分**（留给后续刀）：

- 现有页面 URL（`/app/reminders`、`/app/feature-vote`、`/app/help` 等）保持不变
- `Mine` Tab 内部不重写
- 各二级页归属仅是路径上的层级表达，本期不做实际移动

## 5. 首页详细结构

布局从上到下，**手机视口、单列流式**。

### 5.1 顶部状态栏（极简）

- 左：用户问候语（按时段："早安/午安/晚安，nero"）
- 右：通知中心入口（合并提醒 + AI 预警）
- 高度低，不抢戏

### 5.2 Hero 区（占首屏 55-60% 高度）

- 暖橙→米白柔色渐变背景
- 圆形大头像（直径约视口宽度 40%），柔阴影，"呼吸"微动效（scale 1→1.02，4 秒一周期）
- 名字（Display 字号）+ 年龄性别一行
- AI 第一人称气泡（打字机效果，每字 50ms）

### 5.3 一拍 + 一选

- 主按钮"📸 给我留个影"，已拍照后显示缩略图 + "上次：2小时前"
- 三气泡（吃了吗 / 动了吗 / 状态如何），每个 3 选项
- 已完成打卡的按钮换为"今日已记录"，仍可点开修改
- 0 点重置打卡状态

### 5.4 AI 今日洞察卡片

- 2-3 条结论文本，无图表无数据
- 整卡可点击 → 跳到洞察 Tab

### 5.5 今日小建议卡片

- 最多 2 条，弱化呈现
- 类型：饮食 / 运动 / 健康 / 环境

### 5.6 底部 Tab Bar

- 4 个 Tab：首页 / 洞察 / 成长 / 我的
- 毛玻璃背景：`background: rgba(255, 249, 242, 0.85); backdrop-filter: blur(20px);`

### 5.7 不放的东西

- **不放健康分**（留给洞察 Tab，避免和"陪伴"心智冲突）
- **不放快捷入口**（添加记录 / 添加提醒等都挪到对应 Tab 内部）
- **不放图表**

### 5.8 零数据态

| 情况 | Hero 气泡 | 一拍一选 | AI 洞察 | 今日小建议 |
|---|---|---|---|---|
| 没有宠物 | 不显示，显示"添加宠物"主按钮 | 不显示 | 不显示 | 不显示 |
| 有宠物 + 第 1 天 | "我们刚见面呢～多陪陪我吧" | 显示 | 不显示 | 显示通用建议 |
| 有宠物 + 没今日打卡 | 上一次打卡的结果 + "今天还没见到你呢" | 显示 | 显示 | 显示 |
| 有宠物 + 已打卡 | 根据打卡内容生成 | 已完成态 | 显示 | 显示 |

## 6. 视觉系统（Design Tokens）

集中定义在 `src/styles/tokens.css`，CSS 变量形式。

### 6.1 色彩

```
--color-primary: #FFB84D                                /* 暖橙，主按钮、强调元素 */
--color-primary-soft: rgba(255, 184, 77, 0.2)           /* 主色 20% 透明 */
--color-primary-gradient: linear-gradient(180deg, #FFD9A0 0%, #FFF9F2 100%)

--color-bg: #FFF9F2          /* 全局背景，暖米白 */
--color-card: #FFFFFF        /* 卡片背景 */
--color-text-primary: #2A2A2A
--color-text-secondary: #6B6B6B
--color-text-tertiary: #9C9C9C
--color-divider: #F0EBE2

--color-success: #7ED957     /* 健康/正向，洞察 Tab 用 */
--color-info: #7BC7FF
--color-warning: #FF8A65     /* 风险预警，避免红色避免医疗感 */
```

**禁用**：高饱和红色（医疗感）、紫色（廉价感）、纯黑（用 `#2A2A2A` 替代）。

### 6.2 字体

```
--font-family: -apple-system, "SF Pro Text", "PingFang SC", system-ui, sans-serif;
```

不引第三方字体。

字号尺度（rem）：

| Token | 值 | 用途 |
|---|---|---|
| `--text-display` | 2rem (32px) | Hero 宠物名字 |
| `--text-h1` | 1.5rem (24px) | 页面标题 |
| `--text-h2` | 1.125rem (18px) | 卡片标题 |
| `--text-body` | 0.9375rem (15px) | 正文 |
| `--text-caption` | 0.8125rem (13px) | 说明文字 |
| `--text-micro` | 0.6875rem (11px) | Tab 文字、徽章 |

字重仅用 400 / 500 / 600 三档，不用 700。

### 6.3 间距（8 倍数尺度）

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px    /* 卡片内边距默认 */
--space-5: 24px    /* 区块间距默认 */
--space-6: 32px
--space-7: 48px    /* Hero 上下留白 */
```

### 6.4 圆角

```
--radius-sm: 8px      /* 小按钮、标签 */
--radius-md: 16px     /* 卡片默认 */
--radius-lg: 24px     /* 大卡片、Hero */
--radius-full: 9999px /* 头像、气泡按钮 */
```

### 6.5 阴影（仅 2 档）

```
--shadow-card: 0 2px 12px rgba(255, 184, 77, 0.08)
--shadow-elevated: 0 8px 24px rgba(255, 184, 77, 0.12)
```

### 6.6 动效

```
--ease: cubic-bezier(0.4, 0, 0.2, 1)
--duration-fast: 150ms      /* 点击反馈 */
--duration-normal: 300ms    /* 卡片展开 */
--duration-slow: 600ms      /* 数据更新 */
```

特殊动效：

- Hero 头像"呼吸"：`scale(1) → scale(1.02)`，4 秒一周期循环
- 首次加载 Hero 气泡：打字机效果，每字 50ms

## 7. Mock 数据层

本期不动后端 API。所有 AI 输出和打卡数据从前端 mock 层提供，等后端就绪只需替换 mock 模块。

### 7.1 模块位置

`src/lib/home.mock.ts`

### 7.2 接口

```ts
getDailyDigest(petId: string): Promise<DailyDigest>
getCheckInStatus(petId: string): Promise<CheckInStatus>
postCheckIn(petId: string, data: Partial<CheckInStatus>): Promise<DailyDigest>  // 提交后重新生成 digest
getDailyTip(petId: string): Promise<DailyTip>
```

### 7.3 数据形状

```ts
type DailyDigest = {
  speaks: string;                                  // Hero 气泡话
  speaksMood: 'happy' | 'tired' | 'normal';        // 决定头像微动效
  insights: string[];                              // 2-3 条洞察文本
  generatedAt: string;                             // ISO 时间
};

type CheckInStatus = {
  photoToday: { url: string; takenAt: string } | null;
  ate: 'normal' | 'less' | 'much' | null;
  active: 'normal' | 'less' | 'much' | null;
  mood: 'happy' | 'normal' | 'low' | null;
};

type DailyTip = {
  text: string;
  category: 'diet' | 'exercise' | 'health' | 'environment';
};
```

### 7.4 Mock 智能度

不是写死字符串。Mock 层按 **打卡状态 + 宠物档案 + 当天日期** 合成不同输出：

- 首次打开（零数据态）：speaks = "我们刚见面呢～多陪陪我吧"，insights 空，tip = "拍张照片让我们认识一下吧"
- 拍了照但没选：通用软萌话术随机；insights 基于宠物档案（品种、年龄）输出
- 完成全部打卡：speaks 根据"吃/动/状态"组合输出（吃得少 → "今天没什么胃口"；活动多 → "今天玩得好开心"）

### 7.5 持久化

- 打卡数据写入 `localStorage`，key = `checkin:${petId}:${YYYY-MM-DD}`
- 0 点自动失效（读取时检查日期）
- 拍的照片存 base64 到 localStorage，限当日 1 张

## 8. 代码组织

### 8.1 新增文件

```
src/
├── styles/
│   ├── tokens.css            # 全局设计 token
│   └── home.css              # 首页 + Tab Bar 专用样式
├── lib/
│   └── home.mock.ts          # Mock 数据层
├── components/
│   ├── TabBar.tsx            # 底部 4 Tab 导航
│   ├── home/
│   │   ├── Hero.tsx
│   │   ├── CheckInBar.tsx
│   │   ├── InsightCard.tsx
│   │   ├── DailyTip.tsx
│   │   └── EmptyState.tsx
│   └── ui/
│       ├── Card.tsx          # 通用圆角卡片基底
│       └── SpeechBubble.tsx  # AI 气泡（带打字机效果）
└── pages/
    ├── Home.tsx              # 新首页（Tab 1）
    ├── Insights.tsx          # 洞察 Tab 占位（外壳）
    └── Timeline.tsx          # 成长 Tab 占位（外壳）
```

### 8.2 修改文件

- `src/App.tsx`：路由表更新
  - `/app` 默认从 `Dashboard` 改为 `Home`
  - 新增 `/app/insights`、`/app/timeline`
  - 旧 `Dashboard` 路由改为 `/app/pets/add`
  - 移除"有宠物自动跳 `/app/pets`"逻辑
  - 删除 `/app/ai-analysis` 路由
  - 删除开发页 `token-refresh-test`、`test-new-features`
- `src/components/AppShell.tsx`：底部加 `TabBar`，4 Tab 共享外壳
- `src/main.tsx`：引入 `tokens.css`

### 8.3 不动的文件

- `index.css`（296KB）— 不删不改，新页面不引用它
- `pet-chat.css`、各 `*-analysis.css` — 都不动
- 现有页面（`Pets` / `Records` / `*Analysis` / `PetChat` 等）— 内容不动，入口归属变了
- `lib/api.ts`、`lib/auth.ts`、`hooks/useShell.ts` — 不动

### 8.4 测试

- **新增组件**：`Hero` / `CheckInBar` / `InsightCard` / `SpeechBubble` 各 1 个 Playwright 截图测试
- **路由变动**：登录后落地 `/app` 显示新首页（不再跳转 `/app/pets`）的 e2e
- **Mock 层**：单元测 `home.mock.ts` 的零数据态分支
- **不测**：旧页面（这次没动）

### 8.5 性能与体积

- 新增 CSS 估计 < 5KB（token + home.css）
- 新增 JS 估计 < 15KB（首页所有组件 + mock 层）
- 不引入新依赖

## 9. 验收标准

完成本期后应满足：

1. 已登录且有宠物的用户进入 App，落地页是新 `Home`，第一屏看到 Hero（头像 + 名字 + AI 气泡），不再是添加宠物表单
2. 已登录且无宠物的用户进入 App，落地页是新 `Home` 的零数据态，可点击进入添加宠物（不再被强制糊一脸表单）
3. Hero 气泡有打字机效果，头像有"呼吸"动效
4. 一拍一选可完整交互：拍照成功 → Hero 气泡话语刷新；选完 3 个气泡 → AI 洞察重新生成
5. 底部 Tab Bar 4 个 Tab 可切换；洞察、成长 Tab 是占位外壳（有 Tab Bar，主内容暂时简单文字）；我的 Tab 仍展示现有 `Mine` 页面内容
6. 旧 27 个页面通过新 IA 路径仍可访问，未破坏
7. 所有新增组件的 Playwright 截图测试通过
8. 视觉上整体观感符合"温暖 + 治愈 + 专业 + 极简"，无大量浮动 emoji 装饰、无儿童化倾向

## 10. 后续刀法（不在本期）

按优先级建议：

1. AI 洞察详情页内容
2. 成长档案时间轴主页内容
3. 会员体系重做（PRO 价值重新切分）
4. 添加宠物引导重设计（替代当前 4 步表单）
5. 动效系统精修
6. 旧 296KB `index.css` 拆分清理
