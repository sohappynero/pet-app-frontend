# 功能投票模块 前端实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 React + Vite 前端实现「功能投票」页面，让用户从 Dashboard 入口卡片进入投票主页，用每人 3 票投给候选功能并查看往期投票产出。

**Architecture:** 单文件主页面 `pages/FeatureVote.tsx`（state + 三段渲染） + 独立组件 `components/VoteConfirmDialog.tsx`（投票/取消两态弹窗） + API 封装 `lib/vote.api.ts`（3 个函数 + 类型）。复用 `lib/api.ts` 的 `request<T>` 包装，沿用 React useState/useEffect 不引入 SWR。

**Tech Stack:** React 18 + Vite 5 + TypeScript + Tailwind CSS 3 + react-router-dom 6 + lucide-react

**对应设计文档：** `docs/superpowers/specs/2026-06-14-feature-vote-frontend-design.md`

**当前分支：** `feat/feature-vote`（已创建，设计文档已 commit `d409c90`）

---

## 关键背景

后端 3 个接口（已实现并测试）：
- `GET  /api/v1/vote/candidates` — 列表（游客可看，登录用户多返回个人投票状态）
- `POST /api/v1/vote/cast` body `{candidate_id}` — 必登录
- `DELETE /api/v1/vote/cast/{candidate_id}` — 必登录

后端响应外壳：`{code, message, data}`（注意：与项目前端 `ApiResp` 既有 `{ok, message, data}` 不一致）。`lib/api.ts` 的 `request<T>` 函数会判定 `data?.ok === false` 走错误分支——本模块的成功响应 `code === 0` 不会被误判（`ok` 字段不存在，`!== false`），但如果后端在错误情况返回 `{code:1, message:'xxx'}` 走 HTTP 200，这层不会自动抛错。**因此 `vote.api.ts` 内部需自行检查 `code === 0`**。

---

## 文件结构

**新增 3 个文件：**

| 文件 | 责任 |
|---|---|
| `src/lib/vote.api.ts` | 类型定义 + 3 个 API 封装函数 + `code !== 0` 错误抛出 |
| `src/components/VoteConfirmDialog.tsx` | 投票/取消两态确认弹窗（Tailwind modal） |
| `src/pages/FeatureVote.tsx` | 主页面：顶部状态栏 + voting 主区 + in_dev / launched 往期产出段 |

**修改 2 个既有文件：**

| 文件 | 修改 |
|---|---|
| `src/App.tsx` | 在 `/app` 子路由下加 `<Route path="feature-vote" element={<FeatureVote />} />` + 顶部加 import |
| `src/pages/Dashboard.tsx` | 在合适位置加「下一个功能你说了算」入口卡片 |

---

## Task 1: API 封装 + 类型定义

**Files:**
- Create: `src/lib/vote.api.ts`

- [ ] **Step 1: 写类型定义和 3 个 API 函数**

创建 `src/lib/vote.api.ts`：

```typescript
import { getSessionToken } from "./session";

// ═════════════════════════════════════
// 类型定义（对齐后端 schema）
// ═════════════════════════════════════

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

// 后端响应外壳 {code, message, data}
interface VoteApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

// ═════════════════════════════════════
// 内部 fetch（注入 JWT，剥外壳，code !== 0 抛错）
// ═════════════════════════════════════

const API_BASE = import.meta.env.VITE_API_BASE || "";

async function voteFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const contentType = res.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    const detail = body?.detail;
    const detailMsg = typeof detail === "string" ? detail : detail?.message;
    throw new Error(detailMsg || body?.message || `请求失败（HTTP ${res.status}）`);
  }

  const envelope = body as VoteApiEnvelope<T> | null;
  if (envelope == null) {
    throw new Error("响应为空");
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || "请求失败");
  }
  return envelope.data;
}

// ═════════════════════════════════════
// 公开 API
// ═════════════════════════════════════

export function listVoteCandidates(): Promise<CandidateListData> {
  return voteFetch<CandidateListData>("/api/v1/vote/candidates");
}

export function castVote(candidateId: number): Promise<VoteActionData> {
  return voteFetch<VoteActionData>("/api/v1/vote/cast", {
    method: "POST",
    body: JSON.stringify({ candidate_id: candidateId }),
  });
}

export function revokeVote(candidateId: number): Promise<VoteActionData> {
  return voteFetch<VoteActionData>(`/api/v1/vote/cast/${candidateId}`, {
    method: "DELETE",
  });
}
```

- [ ] **Step 2: TypeScript 编译检查**

Run:
```bash
cd /Users/apple/pet-app-frontend && npx tsc --noEmit
```
Expected: 无新增错误（既有错误若有则维持原状）

如果输出包含 `vote.api.ts` 相关错误，修复后重新编译。

- [ ] **Step 3: 提交**

```bash
cd /Users/apple/pet-app-frontend
git add src/lib/vote.api.ts
git commit -m "feat(vote): API 封装 + 类型定义"
```

---

## Task 2: 确认弹窗组件

**Files:**
- Create: `src/components/VoteConfirmDialog.tsx`

- [ ] **Step 1: 写组件**

创建 `src/components/VoteConfirmDialog.tsx`：

```typescript
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export interface VoteConfirmDialogProps {
  open: boolean;
  action: "cast" | "revoke";
  candidateTitle: string;
  /** 操作完成后的剩余票数 */
  remainingVotesAfter: number;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function VoteConfirmDialog({
  open,
  action,
  candidateTitle,
  remainingVotesAfter,
  submitting,
  onConfirm,
  onCancel,
}: VoteConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // 弹出后焦点落在主按钮 + ESC 关闭
  useEffect(() => {
    if (!open) return;
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onCancel]);

  if (!open) return null;

  const isCast = action === "cast";
  const title = isCast ? "确认投票" : "取消投票";
  const body = isCast
    ? `确定要把一票投给「${candidateTitle}」吗？`
    : `确定要取消对「${candidateTitle}」的投票吗？`;
  const hint = isCast
    ? `投票后还剩 ${remainingVotesAfter} 票`
    : `取消后剩余票数：${remainingVotesAfter}`;
  const confirmText = submitting
    ? "提交中…"
    : isCast
    ? "确认投票"
    : "确认取消";
  const cancelText = isCast ? "再想想" : "保留投票";

  const confirmClass = isCast
    ? "bg-purple-600 hover:bg-purple-700 text-white"
    : "bg-red-500 hover:bg-red-600 text-white";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-150"
      onClick={() => !submitting && onCancel()}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-[88%] max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-3 text-sm text-gray-700 leading-relaxed">{body}</p>
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={submitting}
            className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            disabled={submitting}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 ${confirmClass}`}
            onClick={onConfirm}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 编译检查**

Run:
```bash
cd /Users/apple/pet-app-frontend && npx tsc --noEmit 2>&1 | grep -E "VoteConfirmDialog|vote\." || echo "OK: no errors related to vote module"
```
Expected: `OK: no errors related to vote module`

- [ ] **Step 3: 提交**

```bash
cd /Users/apple/pet-app-frontend
git add src/components/VoteConfirmDialog.tsx
git commit -m "feat(vote): 投票确认弹窗组件"
```

---

## Task 3: 主页面 FeatureVote.tsx

**Files:**
- Create: `src/pages/FeatureVote.tsx`

- [ ] **Step 1: 写主页面**

创建 `src/pages/FeatureVote.tsx`：

```typescript
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Vote, Hammer, CheckCircle2 } from "lucide-react";
import VoteConfirmDialog from "../components/VoteConfirmDialog";
import {
  listVoteCandidates,
  castVote,
  revokeVote,
  type CandidateListData,
  type VotingCandidate,
} from "../lib/vote.api";

interface ConfirmState {
  candidateId: number;
  title: string;
  action: "cast" | "revoke";
  remainingVotesAfter: number;
}

export default function FeatureVote() {
  const navigate = useNavigate();
  const [data, setData] = useState<CandidateListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await listVoteCandidates();
      setData(d);
    } catch (e: any) {
      setError(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleVoteClick = (c: VotingCandidate) => {
    if (!data || data.user_remaining_votes <= 0) return;
    setConfirm({
      candidateId: c.id,
      title: c.title,
      action: "cast",
      remainingVotesAfter: data.user_remaining_votes - 1,
    });
  };

  const handleRevokeClick = (c: VotingCandidate) => {
    if (!data) return;
    setConfirm({
      candidateId: c.id,
      title: c.title,
      action: "revoke",
      remainingVotesAfter: data.user_remaining_votes + 1,
    });
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setSubmitting(true);
    try {
      if (confirm.action === "cast") {
        await castVote(confirm.candidateId);
        showToast("投票成功");
      } else {
        await revokeVote(confirm.candidateId);
        showToast("已取消");
      }
      setConfirm(null);
      await loadData();
    } catch (e: any) {
      setConfirm(null);
      showToast(e?.message || "操作失败");
      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <p className="text-gray-600">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white"
        >
          重试
        </button>
      </div>
    );
  }

  if (!data) return null;

  const used = data.max_votes_per_user - data.user_remaining_votes;
  const exhausted = data.user_remaining_votes <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-12">
      {/* 顶部返回 */}
      <div className="px-4 pt-4 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">功能投票</h1>
      </div>

      {/* 状态栏 */}
      <div
        className={`mx-4 mt-3 rounded-2xl p-4 ${
          exhausted
            ? "bg-orange-50 border border-orange-200"
            : "bg-white shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              已用 {used} / {data.max_votes_per_user} 票
            </div>
            <div
              className={`mt-1 text-sm ${
                exhausted ? "text-orange-600" : "text-gray-500"
              }`}
            >
              {exhausted
                ? "本轮票数已用完，可取消已投后重新分配"
                : `剩余 ${data.user_remaining_votes} 票`}
            </div>
          </div>
          <div className="text-xs text-gray-400 text-right">
            本轮已有
            <div className="text-base font-semibold text-purple-600">
              {data.total_voters}
            </div>
            人参与
          </div>
        </div>
      </div>

      {/* 投票主区 */}
      <section className="mt-5 px-4">
        <div className="flex items-center gap-2 mb-3">
          <Vote className="w-4 h-4 text-purple-600" />
          <h2 className="text-base font-semibold text-gray-900">
            下一个开发什么？由你决定
          </h2>
        </div>
        {data.candidates.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-gray-500 text-sm">
            本轮投票暂未开放，敬请期待
          </div>
        ) : (
          <div className="space-y-3">
            {data.candidates.map((c) => (
              <CandidateCard
                key={c.id}
                c={c}
                exhausted={exhausted}
                onVote={() => handleVoteClick(c)}
                onRevoke={() => handleRevokeClick(c)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 往期投票产出 */}
      {(data.in_dev.length > 0 || data.launched.length > 0) && (
        <div className="mt-8 px-4">
          <div className="text-center text-xs text-gray-400 mb-4">
            ───── 往期投票产出 ─────
          </div>

          {data.in_dev.length > 0 && (
            <section className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Hammer className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-700">
                  开发中
                </h3>
              </div>
              <div className="space-y-2">
                {data.in_dev.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-xl bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {it.title}
                      </span>
                      <span className="text-xs text-blue-600">
                        进度 {it.progress}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${it.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.launched.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-700">
                  已上线
                </h3>
              </div>
              <div className="space-y-2">
                {data.launched.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-xl bg-white p-3 shadow-sm flex items-center justify-between"
                  >
                    <span className="text-sm text-gray-900">{it.title}</span>
                    <span className="text-xs text-gray-500">
                      {it.launched_at?.slice(0, 10) || "已上线"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* 弹窗 */}
      <VoteConfirmDialog
        open={confirm !== null}
        action={confirm?.action || "cast"}
        candidateTitle={confirm?.title || ""}
        remainingVotesAfter={confirm?.remainingVotesAfter ?? 0}
        submitting={submitting}
        onConfirm={handleConfirm}
        onCancel={() => !submitting && setConfirm(null)}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-black/80 text-white text-sm px-4 py-2 rounded-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

// ───────────────── 候选卡片子组件 ─────────────────

function CandidateCard({
  c,
  exhausted,
  onVote,
  onRevoke,
}: {
  c: VotingCandidate;
  exhausted: boolean;
  onVote: () => void;
  onRevoke: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white shadow-sm p-4">
      {c.cover_image && (
        <img
          src={c.cover_image}
          alt={c.title}
          className="w-full h-32 object-cover rounded-xl mb-3"
        />
      )}
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-gray-900">{c.title}</h3>
        <span className="text-sm text-purple-600 font-semibold">
          {c.vote_percentage.toFixed(1)}%
        </span>
      </div>
      {c.description && (
        <p className="mt-1 text-xs text-gray-500 leading-relaxed">
          {c.description}
        </p>
      )}
      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
          style={{ width: `${c.vote_percentage}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">{c.vote_count} 票</span>
        {c.is_voted_by_me ? (
          <button
            onClick={onRevoke}
            className="px-4 py-1.5 rounded-full text-xs border border-purple-300 text-purple-600 hover:bg-purple-50"
          >
            ✓ 已投票（点击取消）
          </button>
        ) : exhausted ? (
          <button
            disabled
            className="px-4 py-1.5 rounded-full text-xs bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            票数已用完
          </button>
        ) : (
          <button
            onClick={onVote}
            className="px-4 py-1.5 rounded-full text-xs bg-gradient-to-r from-purple-600 to-pink-500 text-white"
          >
            我要投票
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript 编译检查**

Run:
```bash
cd /Users/apple/pet-app-frontend && npx tsc --noEmit 2>&1 | grep -E "FeatureVote|vote\." || echo "OK"
```
Expected: `OK`

- [ ] **Step 3: 提交**

```bash
cd /Users/apple/pet-app-frontend
git add src/pages/FeatureVote.tsx
git commit -m "feat(vote): 主页面 FeatureVote（三段式 + CandidateCard）"
```

---

## Task 4: 路由注册 + Dashboard 入口

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: App.tsx 加路由**

打开 `src/App.tsx`。在 import 块（约第 28 行附近，与其他 page import 同列）追加：

```typescript
import FeatureVote from "./pages/FeatureVote";
```

在 `<Route element={<RequireAuth />}>` 块的 `/app` 子路由中，在 `vip-subscribe` 那行后追加：

```tsx
<Route path="feature-vote" element={<FeatureVote />} />
```

- [ ] **Step 2: 在 Dashboard 加入口卡片**

先读 `src/pages/Dashboard.tsx`，找一处合适位置（一般是「快捷功能」/「推荐」/「即将上线」类区块），加一个卡片。

入口卡片代码（自行根据 Dashboard 既有 className 套路微调，不另起新风格）：

```tsx
<button
  onClick={() => navigate("/app/feature-vote")}
  className="w-full rounded-2xl p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md text-left active:scale-[0.98] transition"
>
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
      <Vote className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <div className="font-semibold">下一个功能你说了算</div>
      <div className="text-xs opacity-90 mt-0.5">参与投票，决定开发顺序</div>
    </div>
    <ChevronRight className="w-4 h-4 opacity-80" />
  </div>
</button>
```

注意：
- 如果 Dashboard 顶部 import 还没有 `Vote` / `ChevronRight`，从 `lucide-react` 引入
- 如果 Dashboard 用的不是 `useNavigate`，按既有跳转方式调整。否则需 `import { useNavigate } from "react-router-dom"` 并在组件内 `const navigate = useNavigate();`
- 卡片放在 Dashboard 中显眼但不夺主导航的位置（一般是「常用功能」分组后或者「推荐」分组里）

- [ ] **Step 3: 启动 dev server 烟测**

Run:
```bash
cd /Users/apple/pet-app-frontend && npm run dev &
sleep 4
echo "Open http://localhost:5173 in browser, login, navigate to Dashboard, click 「下一个功能你说了算」 入口"
```

手动验证：
- 进入 Dashboard 看到入口卡片
- 点击入口跳到 `/app/feature-vote`
- 看到顶部状态栏 + voting 候选 + （如果 DB 有 in_dev/launched 数据）往期产出段

测完后停掉 dev server。

- [ ] **Step 4: 提交**

```bash
cd /Users/apple/pet-app-frontend
git add src/App.tsx src/pages/Dashboard.tsx
git commit -m "feat(vote): App 路由注册 + Dashboard 入口卡片"
```

---

## Task 5: 手动 E2E 测试 + 收尾

- [ ] **Step 1: 启动 dev server，手动跑 E2E 清单**

```bash
cd /Users/apple/pet-app-frontend && npm run dev
```

按设计文档第 9 节清单逐项核验：

**登录用户：**
- [ ] 进 `/app/feature-vote` 三段数据正确渲染
- [ ] 顶部「已用 0/3 票」剩余 3
- [ ] 点「我要投票」 → 弹窗 → 确认 → 票数 +1，剩余 2，按钮变「已投票」
- [ ] 已投按钮再点 → 取消弹窗（红按钮） → 确认 → 票数 -1，剩余 3
- [ ] 投满 3 个不同候选 → 第 4 个未投按钮变灰禁用
- [ ] 顶部状态栏变橙色提示「票数已用完」
- [ ] 取消其中一个 → 第 4 个按钮恢复
- [ ] 模拟接口 500（关后端或断网）→ toast 提示

**未登录用户：**
- [ ] 退出登录后访问 `/app/feature-vote` → 自动跳 /login

**视觉：**
- [ ] 进度条宽度 ≈ vote_percentage
- [ ] 三段视觉层次：voting 大卡 / in_dev 中卡 / launched 小卡
- [ ] 入口卡片在 Dashboard 显眼且与周围风格一致

- [ ] **Step 2: 检查 git 状态**

```bash
cd /Users/apple/pet-app-frontend && git status && git log --oneline -8
```

预期：working tree clean，最新 4-5 个 commit 都是 `feat(vote): xxx`。

- [ ] **Step 3: （可选）合并到 main / 创建 PR**

由用户决定走哪条：
- 直接合 main：`git checkout main && git merge --no-ff feat/feature-vote`
- 推分支建 PR：`git push -u origin feat/feature-vote` 然后 `gh pr create`

---

## 验收清单

- [ ] `src/lib/vote.api.ts` 提供 3 个函数 + 完整类型
- [ ] `src/components/VoteConfirmDialog.tsx` 投票/取消两态共用组件
- [ ] `src/pages/FeatureVote.tsx` 主页面三段式 + 三态按钮
- [ ] `src/App.tsx` 路由 `feature-vote` 已注册在 RequireAuth 块
- [ ] `src/pages/Dashboard.tsx` 入口卡片可见且能跳转
- [ ] dev server 启动后手动 E2E 清单全过
- [ ] TypeScript 编译无新增错误

## 不在本计划内（后续可演进）

- 引入 SWR / React Query 做数据缓存
- 实时票数 WebSocket 推送
- 投票历史页（个人维度）
- Playwright E2E 自动化
- 投票胜出后通知 / 徽章
- 候选自助提议入口
- 多语言
