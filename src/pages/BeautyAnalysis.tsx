import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  Scissors,
  Droplets,
  Wind,
  Sparkles,
  Sun,
  Heart,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useShell } from "../hooks/useShell";
import { fetchAnalysisDashboard, type AnalysisDashboardData } from "../lib/api";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import { getLocalAvatar } from "../lib/pet-avatar";
import "../beauty-analysis.css";

// ── 护理记录项 ───────────────────────────────
function CareRecordItem({
  icon,
  label,
  time,
}: {
  icon: React.ReactNode;
  label: string;
  time: string;
}) {
  return (
    <div className="beauty-care-item">
      <div className="beauty-care-icon-wrap">{icon}</div>
      <span className="beauty-care-label">{label}</span>
      <span className="beauty-care-time">{time}</span>
    </div>
  );
}

// ── 分析卡片 ─────────────────────────────────
function BeautyCard({
  icon,
  title,
  score,
  status,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  score: number;
  status: "good" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const statusTag =
    status === "good"
      ? { label: "良好", cls: "beauty-status-good" }
      : status === "warning"
        ? { label: "注意", cls: "beauty-status-warn" }
        : { label: "差", cls: "beauty-status-bad" };

  return (
    <div className="beauty-card">
      <div className="beauty-card-header">
        <div className="beauty-card-title-row">
          <div className="beauty-card-icon-wrap">{icon}</div>
          <h3 className="beauty-card-title">{title}</h3>
        </div>
        <div className="beauty-card-score-row">
          <span className={`beauty-score-tag ${statusTag.cls}`}>
            {status === "good" && <CheckCircle2 size={14} />}
            {(status === "warning" || status === "danger") && (
              <AlertCircle size={14} />
            )}
            {statusTag.label}
          </span>
          <strong className="beauty-score-num">{score}分</strong>
        </div>
      </div>

      <div className="beauty-detail-list">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, status }: { label: string; value: string; status: "good" | "warning" | "danger" }) {
  return (
    <div className="beauty-detail-row">
      <span className="beauty-detail-label">{label}</span>
      <div className="beauty-detail-right">
        <span className="beauty-detail-value">{value}</span>
        {status === "good" && <CheckCircle2 size={16} className="beauty-icon-good" />}
        {(status === "warning" || status === "danger") && (
          <AlertCircle size={16} className={status === "danger" ? "beauty-icon-danger" : "beauty-icon-warn"} />
        )}
      </div>
    </div>
  );
}

function SuggestionItem({ index, text }: { index: number; text: string }) {
  return (
    <div className="beauty-suggest-item">
      <span className="beauty-suggest-num">{index}</span>
      <span className="beauty-suggest-text">{text}</span>
    </div>
  );
}

export default function BeautyAnalysis() {
  const navigate = useNavigate();
  const { selectedPet, pets } = useShell();
  const currentPet = selectedPet || pets[0] || null;

  // ── 从后端获取真实数据 ──
  const [analysisData, setAnalysisData] = useState<AnalysisDashboardData | null>(null);
  const [btyLoading, setBtyLoading] = useState(true);

  useEffect(() => {
    if (!currentPet?.id) return;
    setBtyLoading(true);
    fetchAnalysisDashboard(currentPet.id)
      .then((data) => setAnalysisData(data))
      .catch(console.error)
      .finally(() => setBtyLoading(false));
  }, [currentPet?.id]);

  // ── 基于真实数据 ──
  const groomingScore = analysisData?.dimensions?.grooming?.score ?? 0;
  const obsCount = analysisData?.data_summary?.observations ?? 0;

  return (
    <main className="beauty-page">
      {/* ═══ 渐变头部 — 使用真实宠物信息 ═══ */}
      <header className="beauty-header">
        <div className="beauty-header-bg">
          <button className="beauty-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="beauty-header-title">美容毛发分析</h1>
          <p className="beauty-header-sub">
            {currentPet?.name || "宠物"} · {currentPet?.species || ""}{currentPet?.age || currentPet?.birthday ? ` · ${currentPet.age || "未知年龄"}` : ""}
          </p>
        </div>

        {/* 综合评分卡片 — 基于真实数据 */}
        <div className="beauty-hero-score-card">
          <div className="beauty-hero-score-top">
            <span className="beauty-hero-score-icon">🌟</span>
            <span className="beauty-hero-score-label">毛发综合评分</span>
            <span className="beauty-hero-score-badge">{btyLoading ? "..." : groomingScore}分</span>
          </div>
          <div className="beauty-hero-bar-track">
            <div className="beauty-hero-bar-fill" style={{ width: `${Math.min(groomingScore, 100)}%` }} />
          </div>
          <p className="beauty-hero-hint">
            {btyLoading ? "加载中..." :
              obsCount === 0 ? "暂无观察记录" :
              `基于${obsCount}条观察记录 · ${groomingScore >= 75 ? "良好" : groomingScore >= 55 ? "一般" : "需关注"}`}
          </p>
        </div>
      </header>

      {/* ═══ 近期护理记录 ═══ */}
      <section className="beauty-section">
        <h2 className="beauty-section-title">
          <span>💇</span> 近期护理记录
        </h2>
        <div className="beauty-care-grid">
          <CareRecordItem
            icon={<Droplets size={20} />}
            label="洗澡"
            time="3天前"
          />
          <CareRecordItem
            icon={<Wind size={20} />}
            label="梳毛"
            time="今天"
          />
          <CareRecordItem
            icon={<Scissors size={20} />}
            label="修剪"
            time="2周前"
          />
          <CareRecordItem
            icon={<Sparkles size={20} />}
            label="护理"
            time="1周前"
          />
        </div>
      </section>

      {/* ═══ 毛发详细分析 ═══ */}
      <section className="beauty-section">
        <h2 className="beauty-section-title">
          <span>🔍</span> 毛发详细分析
        </h2>

        {/* 卡片1：毛发评分 — 基于真实数据 */}
        <BeautyCard
          icon={<Sparkles size={18} />}
          title="毛发综合评分"
          score={groomingScore}
          status={groomingScore >= 70 ? "good" : groomingScore >= 50 ? "warning" : "danger"}
        >
          {btyLoading ? (
            <p style={{ color: "#999", padding: "10px 0" }}>加载中...</p>
          ) : obsCount === 0 ? (
            <>
              <DetailRow label="数据来源" value="暂无观察记录" status="warning" />
              <DetailRow label="样本数量" value={`${obsCount}条`} status="warning" />
            </>
          ) : (
            <>
              <DetailRow label="美容评分" value={`${groomingScore}分`} status={groomingScore >= 70 ? "good" : "warning"} />
              <DetailRow label="观察样本" value={`${obsCount}条`} status={obsCount >= 5 ? "good" : "warning"} />
              <DetailRow label="数据基础" value="基于日常观察记录" status="good" />
              <DetailRow label="评估方式" value="客观分析（非主观判断）" status="good" />
            </>
          )}

          <div className="beauty-divider"><span><Sparkles size={14}/> 健康提示</span></div>
          <div className="beauty-suggest-list">
            {btyLoading ? null : obsCount === 0 ? (
              <SuggestionItem index={1} text="开始记录宝贝的毛发状况，系统将生成趋势分析" />
            ) : groomingScore >= 75 ? (
              <SuggestionItem index={1} text="当前毛发状态良好，继续保持定期梳理和护理" />
            ) : groomingScore >= 55 ? (
              <SuggestionItem index={1} text="建议增加梳理频次，关注饮食中的Omega脂肪酸摄入" />
            ) : (
              <SuggestionItem index={1} text="毛发状态需要关注，建议咨询专业美容师或兽医" />
            )}
          </div>
        </BeautyCard>

        {/* 数据说明卡片 — 明确告知数据库字段限制 */}
        <BeautyCard
          icon={<Heart size={18} />}
          title="数据说明"
          score={obsCount > 0 ? Math.min(60 + obsCount * 4, 100) : 0}
          status={obsCount > 3 ? "good" : "warning"}
        >
          <div className="beauty-divider"><span><Sparkles size={14}/> 说明</span></div>
          <div className="beauty-suggest-list">
            <SuggestionItem index={1} text="当前数据库以通用观察记录为主，暂无独立的毛发/皮肤/护理专项表" />
            <SuggestionItem index={2} text="如需更精确的美容分析，可在备注中记录毛发变化情况" />
          </div>
        </BeautyCard>
      </section>

      {/* ═══ 美容护理小贴士 ═══ */}
      <section className="beauty-section beauty-tips-section">
        <h2 className="beauty-section-title">
          <span>📋</span> 美容护理小贴士
        </h2>
        <div className="beauty-tips-card">
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">🪮</span>
            <span className="beauty-tip-text">金毛每日梳毛1-2次，每次15-20分钟</span>
          </div>
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">🛁</span>
            <span className="beauty-tip-text">洗澡水温37-39°C，使用温度计测量</span>
          </div>
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">✂️</span>
            <span className="beauty-tip-text">每2周修剪脚底毛和耳毛1次</span>
          </div>
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">💊</span>
            <span className="beauty-tip-text">换季期间每日补充鱼油和卵磷脂各1粒</span>
          </div>
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">☀️</span>
            <span className="beauty-tip-text">每日晒太阳15-30分钟，避开正午时段</span>
          </div>
        </div>
      </section>

      <div style={{ height: "32px" }} />
    </main>
  );
}
