import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export interface VoteConfirmDialogProps {
  open: boolean;
  action: "cast" | "revoke";
  candidateTitle: string;
  /** 操作完成后的剩余票数 */
  remainingVotesAfter: number;
  /** 当前用户对该候选已投票数（v2 新增） */
  currentVotes: number;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function VoteConfirmDialog({
  open,
  action,
  candidateTitle,
  remainingVotesAfter,
  currentVotes,
  submitting,
  onConfirm,
  onCancel,
}: VoteConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

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

  let body: string;
  if (isCast) {
    body = currentVotes > 0
      ? `确定继续投给「${candidateTitle}」吗？已投 ${currentVotes} 票`
      : `确定要把 1 票投给「${candidateTitle}」吗？`;
  } else {
    body = `确定要取消对「${candidateTitle}」的 1 票吗?（你共投了 ${currentVotes} 票）`;
  }

  const hint = isCast
    ? `投票后还剩 ${remainingVotesAfter} 票`
    : `取消后剩余票数:${remainingVotesAfter}`;

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
