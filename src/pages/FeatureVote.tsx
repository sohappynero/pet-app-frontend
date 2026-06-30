import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Vote, Hammer, CheckCircle2, Eye } from "lucide-react";
import VoteConfirmDialog from "../components/VoteConfirmDialog";
import FeaturePreviewDialog, { hasPreview } from "../components/FeaturePreviewDialog";
import {
  listVoteCandidates,
  castVote,
  revokeVote,
  type CandidateListData,
  type VotingCandidate,
} from "../lib/vote.api";

// 确认弹窗所需状态
interface ConfirmState {
  candidateId: number;
  title: string;
  action: "cast" | "revoke";
  remainingVotesAfter: number;
  currentVotes: number;
}

// 预览弹窗所需状态
interface PreviewState {
  key: string;
  title: string;
}

export default function FeatureVote() {
  const navigate = useNavigate();
  const [data, setData] = useState<CandidateListData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载投票数据
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

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // 显示 Toast 提示，2.5s 后自动消失
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  // 点击"我要投票"
  const handleVoteClick = (c: VotingCandidate) => {
    if (!data || data.user_remaining_votes <= 0) return;
    setConfirm({
      candidateId: c.id,
      title: c.title,
      action: "cast",
      remainingVotesAfter: data.user_remaining_votes - 1,
      currentVotes: c.my_votes,
    });
  };

  // 点击"取消投票"
  const handleRevokeClick = (c: VotingCandidate) => {
    if (!data) return;
    setConfirm({
      candidateId: c.id,
      title: c.title,
      action: "revoke",
      remainingVotesAfter: data.user_remaining_votes + 1,
      currentVotes: c.my_votes,
    });
  };

  // 弹窗确认提交
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

  // 首次加载中
  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  // 加载失败且无缓存数据
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

  // 已用票数 / 是否用完
  const used = data.max_votes_per_user - data.user_remaining_votes;
  const exhausted = data.user_remaining_votes <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-12">
      {/* 顶部返回栏 */}
      <div className="px-4 pt-4 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">功能投票</h1>
      </div>

      {/* 票数状态卡 */}
      <div
        className={`mx-4 mt-3 rounded-2xl p-4 glass-panel ${
          exhausted
            ? "border-orange-200"
            : ""
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

      {/* 候选功能投票区 */}
      <section className="mt-5 px-4">
        <div className="flex items-center gap-2 mb-3">
          <Vote className="w-4 h-4 text-purple-600" />
          <h2 className="text-base font-semibold text-gray-900">
            下一个开发什么？由你决定
          </h2>
        </div>
        {data.candidates.length === 0 ? (
          <div className="rounded-2xl glass-panel p-8 text-center text-gray-500 text-sm">
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
                onPreview={() => setPreview({ key: c.key, title: c.title })}
              />
            ))}
          </div>
        )}
      </section>

      {/* 往期投票产出：开发中 + 已上线 */}
      {(data.in_dev.length > 0 || data.launched.length > 0) && (
        <div className="mt-8 px-4">
          <div className="text-center text-xs text-gray-400 mb-4">
            ───── 往期投票产出 ─────
          </div>

          {/* 开发中列表 */}
          {data.in_dev.length > 0 && (
            <section className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Hammer className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-700">开发中</h3>
              </div>
              <div className="space-y-2">
                {data.in_dev.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-xl glass-panel p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {it.title}
                      </span>
                      <span className="text-xs text-blue-600">
                        进度 {it.progress}%
                      </span>
                    </div>
                    {/* 进度条 */}
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

          {/* 已上线列表 */}
          {data.launched.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-700">已上线</h3>
              </div>
              <div className="space-y-2">
                {data.launched.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-xl glass-panel p-3 shadow-sm flex items-center justify-between"
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

      {/* 确认弹窗 */}
      <VoteConfirmDialog
        open={confirm !== null}
        action={confirm?.action || "cast"}
        candidateTitle={confirm?.title || ""}
        remainingVotesAfter={confirm?.remainingVotesAfter ?? 0}
        currentVotes={confirm?.currentVotes ?? 0}
        submitting={submitting}
        onConfirm={handleConfirm}
        onCancel={() => !submitting && setConfirm(null)}
      />

      {/* 功能预览弹窗 */}
      <FeaturePreviewDialog
        open={preview !== null}
        candidateKey={preview?.key || ""}
        candidateTitle={preview?.title || ""}
        onClose={() => setPreview(null)}
      />

      {/* Toast 全局提示 */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-black/80 text-white text-sm px-4 py-2 rounded-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

// ───────────────── 候选功能卡片（子组件） ─────────────────

function CandidateCard({
  c,
  exhausted,
  onVote,
  onRevoke,
  onPreview,
}: {
  c: VotingCandidate;
  exhausted: boolean;
  onVote: () => void;
  onRevoke: () => void;
  onPreview: () => void;
}) {
  const myVotes = c.my_votes;
  const showPreview = hasPreview(c.key);
  return (
    <div className="rounded-2xl glass-panel shadow-sm p-4">
      {c.cover_image && (
        <img
          src={c.cover_image}
          alt={c.title}
          className="w-full h-32 object-cover rounded-xl mb-3"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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
      {/* 查看预览按钮 */}
      {showPreview && (
        <button
          onClick={onPreview}
          className="mt-2 flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>查看概念预览</span>
        </button>
      )}
      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
          style={{ width: `${c.vote_percentage}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500">{c.vote_count} 票</span>
        <div className="flex items-center gap-2">
          {myVotes > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
              已投 {myVotes} 票
            </span>
          )}
          {myVotes > 0 && (
            <button
              onClick={onRevoke}
              className="px-3 py-1.5 rounded-full text-xs border border-red-300 text-red-500 hover:bg-red-50"
            >
              − 取消
            </button>
          )}
          {exhausted ? (
            <button
              disabled
              className="px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              + 投票
            </button>
          ) : (
            <button
              onClick={onVote}
              className="px-3 py-1.5 rounded-full text-xs bg-gradient-to-r from-purple-600 to-pink-500 text-white"
            >
              + 投票
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
