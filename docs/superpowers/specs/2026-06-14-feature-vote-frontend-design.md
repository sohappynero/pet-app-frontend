# 功能投票模块 前端设计文档

- 作者：nero
- 日期：2026-06-14
- 状态：待评审
- 配套后端 spec：`/Users/apple/pets_app/docs/superpowers/specs/2026-06-14-feature-vote-design.md`

## 1. 背景与目标

后端「功能投票」模块已实现并提供 3 个 REST 接口。本文档设计前端用户侧投票页面：

- 用户进入页面看到当前轮投票候选 + 票数 + 进度条
- 用户用每人 3 票投给最想要的候选（可取消重投）
- 同页展示「开发中」「已上线」往期投票产出，建立「投票 → 开发 → 上线」的可见因果链

**与「预约/登记」语义一致：** 仅胜出候选会被开发，落选候选归档不开发。文案在三段分区中明确强调这一边界。

**非目标（MVP 不做）：**
- 不做 SWR/React Query 类的数据缓存层
- 不做实时票数推送（WebSocket）
- 不做投票历史页
- 不做积分/激励 UI
- 不做 Playwright 自动化 E2E（手动测试为主）

## 2. 关键决策

| 维度 | 决策 | 理由 |
|---|---|---|
| 入口 | Dashboard 卡片 | 曝光高且不挤占主导航 |
| API 文件 | `src/lib/vote.api.ts` 独立文件 | 跟项目内 `pet-mind.api.ts` / `pet3d.api.ts` 模块拆分一致 |
| 未登录 | 跳 /login（跟 RequireAuth 一致） | 简洁安全，与 App 全局一致 |
| 主页布局 | 单页三段 | 与原稿 UI 最一致，因果链清晰 |
| 投票交互 | 点击后确认弹窗 | 防误点 + 加强投票仪式感 |
| 票数刷新 | 投票成功后调 GET 重拉整页 | 数据一致性最好，百分比总是准 |
| 票用完 | 未投项按钮变灰禁用 | 状态一目了然 |
| 实现风格 | 单页面文件 + 独立确认弹窗组件 | 跟项目其他大页面（Dashboard.tsx 27KB）一致 |

## 3. 文件结构

**新增 3 个文件：**

| 文件 | 责任 |
|---|---|
| `src/lib/vote.api.ts` | 类型定义 + 3 个接口封装函数 |
| `src/components/VoteConfirmDialog.tsx` | 投票/取消投票确认弹窗 |
| `src/pages/FeatureVote.tsx` | 投票主页（单文件三段式布局 + 状态管理） |

**修改 2 个既有文件：**

| 文件 | 修改 |
|---|---|
| `src/App.tsx` | 在 RequireAuth 块的 `/app` 子路由下加 `<Route path="feature-vote" element={<FeatureVote />} />` |
| `src/pages/Dashboard.tsx` | 加一个「下一个功能你说了算」入口卡片，跳 `/app/feature-vote` |

入口卡片样式与 Dashboard 现有卡片对齐（实施时读 Dashboard.tsx 看具体 className 套路），不另起新风格。

## 4. API 层（`src/lib/vote.api.ts`）

复用 `src/lib/api.ts` 既有的 fetch 封装（baseURL、auth header、统一错误处理）。后端响应外壳 `{code, message, data}` 由封装层剥掉，业务码非 0 抛错。

### 类型定义

```typescript
export type CandidateStatus = "voting" | "in_dev" | "launched" | "archived";

export interface VotingCandidate {
  id: number;
  key: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  status: CandidateStatus;
  vote_count: number;
  vote_percentage: number;
  is_voted_by_me: boolean;
}

export interface InDevItem {
  id: number;
  key: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  progress: number;
}

export interface LaunchedItem {
  id: number;
  key: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  launched_at: string | null;
}

export interface CandidateListData {
  max_votes_per_user: number;
  user_remaining_votes: number;
  user_voted_candidate_ids: number[];
  total_voters: number;
  candidates: VotingCandidate[];
  in_dev: InDevItem[];
  launched: LaunchedItem[];
}

export interface VoteActionData {
  candidate_id: number;
  new_vote_count: number;
  user_remaining_votes: number;
}
```

### 函数签名

```typescript
export async function listVoteCandidates(): Promise<CandidateListData>;
export async function castVote(candidateId: number): Promise<VoteActionData>;
export async function revokeVote(candidateId: number): Promise<VoteActionData>;
```

## 5. 主页面（`src/pages/FeatureVote.tsx`）

单文件结构，约 250 行。

### State 设计

```typescript
const [data, setData] = useState<CandidateListData | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [confirmDialog, setConfirmDialog] = useState<{
  candidateId: number;
  title: string;
  action: "cast" | "revoke";
} | null>(null);
const [submitting, setSubmitting] = useState(false);
```

### 关键函数

- `loadData()` — 调 `listVoteCandidates`，setData/setError，setLoading(false)
- `handleVoteClick(c)` — 校验 `data.user_remaining_votes > 0`；满足则打开 `confirmDialog`（action=`cast`）
- `handleRevokeClick(c)` — 直接打开 `confirmDialog`（action=`revoke`）
- `handleConfirm()` — `setSubmitting(true)` → 调 cast/revoke API → `loadData()` 重拉 → 关弹窗 → toast 反馈
- `handleCancel()` — 关弹窗

### 渲染结构

```
┌─ 顶部状态栏 ────────────────────────┐
│ 已用 N / 3 票，剩余 M 票           │
│ 本轮已有 {data.total_voters} 人参与 │
│ （票用完时颜色变橙色 + 提示文案）   │
└─────────────────────────────────────┘

┌─ 投票主区（voting 候选） ───────────┐
│ ┌─ 候选卡片 ─────────────────────┐ │
│ │ [封面图] 标题                   │ │
│ │ 描述文案                        │ │
│ │ ▰▰▰▰▰▰▰▱▱▱ 53% / 530 票        │ │
│ │ [我要投票] / [✓ 已投票（取消）]│ │
│ │ / [票数已用完]（灰禁用）       │ │
│ └────────────────────────────────┘ │
└─────────────────────────────────────┘

═════ 往期投票产出 ═════

┌─ 开发中段（in_dev） ────────────────┐
│ 缩小版卡片 + 「开发进度 60%」      │
└─────────────────────────────────────┘

┌─ 已上线段（launched） ──────────────┐
│ 最小版卡片 + 「已上线 2026-05-20」 │
└─────────────────────────────────────┘
```

### 投票按钮三态

| 状态 | 文案 | 样式 | 可点击 |
|---|---|---|---|
| 未投 + 还有票 | 「我要投票」 | 实色主按钮 | 是 |
| 未投 + 票用完 | 「票数已用完」 | 灰色禁用 | 否 |
| 已投 | 「✓ 已投票（点击取消）」 | 边框按钮 | 是 |

### 进度条

卡片底部一根条，宽度 = `vote_percentage`%，颜色与卡片主色调一致。

### 加载 / 空 / 错误态

- 首次加载：居中 spinner（lucide-react `Loader2` + `animate-spin`）
- 加载错误：错误文案 + 「重试」按钮
- 空 voting 列表：「本轮投票暂未开放，敬请期待」

### 防重复点击

弹窗提交后 `submitting=true`，主按钮 disabled 直到 `loadData` 返回。

## 6. 确认弹窗（`src/components/VoteConfirmDialog.tsx`）

独立可复用组件，对「投票」「取消投票」两种动作用同一个弹窗，靠 props 切换文案。

### Props

```typescript
interface VoteConfirmDialogProps {
  open: boolean;
  action: "cast" | "revoke";
  candidateTitle: string;
  remainingVotesAfter: number;  // 操作完成后的剩余票数
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
```

### 文案

**`action="cast"`（投票）：**
- 标题：「确认投票」
- 正文：「确定要把一票投给『{candidateTitle}』吗？」
- 提示：「投票后还剩 {remainingVotesAfter} 票」
- 主按钮：「确认投票」（实色）
- 次按钮：「再想想」

**`action="revoke"`（取消投票）：**
- 标题：「取消投票」
- 正文：「确定要取消对『{candidateTitle}』的投票吗？」
- 提示：「取消后剩余票数：{remainingVotesAfter}」
- 主按钮：「确认取消」（红色或边框红）
- 次按钮：「保留投票」

### 实现细节

- 用纯 Tailwind 实现 modal 遮罩 + 居中卡片
- 复用 `tailwindcss-animate`（项目已装）做 fade-in 动画
- ESC / 点遮罩 → `onCancel`
- `submitting=true` 时主按钮文案换「提交中…」+ disabled，次按钮也 disabled
- 弹出后焦点自动落在主按钮（`useEffect` + ref）
- 不做 ARIA 无障碍属性（YAGNI）

## 7. 数据流

**用户点投票：**
```
点「我要投票」
 → handleVoteClick 校验剩余票数
 → 打开 VoteConfirmDialog（action=cast, candidateTitle, remainingVotesAfter=remaining-1）
 → 用户点「确认投票」
 → setSubmitting(true)，调 castVote(c.id)
 → 成功：关闭弹窗 → loadData() → toast「投票成功」
 → 失败：关闭弹窗 → toast 显示后端 message
```

**用户点取消：**
同上，action=revoke、remainingVotesAfter=remaining+1。

**首次加载：** `useEffect(() => { loadData() }, [])`。

## 8. 异常处理

| 后端响应 | 前端处理 |
|---|---|
| 400 候选不存在/已不在投票中 | toast 显示 message + 重拉列表（同步状态） |
| 403 票数已用完 | toast「票数已用完」+ 重拉列表 |
| 403 候选已离开投票阶段 | toast 显示 message + 重拉列表 |
| 404 未找到投票记录 | toast 显示 message + 重拉列表 |
| 409 已对此候选投过票 | toast「您已投过此候选」+ 重拉列表 |
| 401 未登录 / token 过期 | 走 `src/lib/api.ts` 既有拦截器跳 /login |
| 网络错误 / 5xx | toast「网络错误，请重试」 |

**toast 实现策略：**
1. 实施时先 grep 项目里是否已有 toast 库或自实现的提示组件（`src/components/` / `src/lib/`）
2. **找到** → 复用
3. **找不到** → 在 `FeatureVote.tsx` 内部用 `useState` + `setTimeout(2500ms)` 写最简文字提示条（顶部居中，半透明黑底白字，淡入淡出），不引入第三方依赖
4. 若后续多个页面都需要 toast，再抽到 `src/components/Toast.tsx` 共享

## 9. 测试要点

MVP 阶段以手动 E2E 为主，不写 Playwright 脚本。

**登录用户 + 后端有 voting 候选：**

- [ ] 进入 `/app/feature-vote` 看到三段数据正确渲染
- [ ] 顶部「已用 0/3 票」，剩余 3
- [ ] 点「我要投票」 → 弹窗 → 确认 → 票数 +1，剩余 2，按钮变「已投票」
- [ ] 已投按钮再点 → 弹窗（取消文案，红色按钮） → 确认 → 票数 -1，剩余 3
- [ ] 投满 3 个不同候选 → 第 4 个未投按钮变灰禁用
- [ ] 顶部状态栏变橙色提示「票数已用完」
- [ ] 取消其中一个 → 第 4 个按钮恢复
- [ ] 模拟接口 500 → toast 提示

**未登录用户：**
- [ ] 直接访问 `/app/feature-vote` → 自动跳 /login

**视觉检查：**
- [ ] 进度条宽度 ≈ vote_percentage
- [ ] 三段视觉层次：voting 大卡 / in_dev 中卡 / launched 小卡
- [ ] 入口卡片在 Dashboard 显眼且与周围风格一致

## 10. 实施顺序建议

1. `src/lib/vote.api.ts` —— 类型 + 3 个 API 函数
2. `src/components/VoteConfirmDialog.tsx` —— 独立组件，可单独 mock 联调
3. `src/pages/FeatureVote.tsx` —— 主页面
4. `src/App.tsx` —— 加路由
5. `src/pages/Dashboard.tsx` —— 加入口卡片
6. 手动 E2E 测试

## 11. 后续可演进方向（不在 MVP 内）

- 引入 SWR / React Query 做数据缓存与失效
- 实时票数 WebSocket 推送
- 投票历史页（个人维度）
- 加 Playwright E2E 测试
- 投票胜出后给参与用户徽章 / 通知
- 候选自助提议入口（用户提交 → 运营审核）
- 多语言支持
