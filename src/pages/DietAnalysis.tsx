import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UtensilsCrossed,
  Apple,
  Fish,
  Carrot,
  Droplets,
  Cookie,
  Scale,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { useShell } from "../hooks/useShell";
import { fetchAnalysisDashboard, type AnalysisDashboardData } from "../lib/api";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import { getLocalAvatar } from "../lib/pet-avatar";
import type { QuotaError } from "../lib/pet-mind.api";
import QuotaHintModal from "../components/PetChat/QuotaHintModal";
import "../diet-analysis.css";

// ── 营养环形进度条 ──────────────────────────────
function NutrientRing({ label, current, target, unit, color }: { label: string; current: number; target: number; unit: string; color: string }) {
  const percent = Math.min(Math.round((current / target) * 100), 120);
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="diet-ring-item">
      <div className="diet-ring-chart">
        <svg viewBox="0 0 64 64" className="diet-ring-svg">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#fef3c7" strokeWidth="6" />
          <circle
            cx="32" cy="32" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(-90 32 32)"
            className="diet-ring-progress"
          />
        </svg>
        <span className="diet-ring-percent" style={{ color }}>{percent}%</span>
      </div>
      <span className="diet-ring-label">{label}</span>
      <span className="diet-ring-values">{current}/{target}{unit}</span>
    </div>
  );
}

// ── 食物分类卡片 ────────────────────────────────
function FoodCategoryCard({
  icon,
  category,
  items,
  score,
  recommendation,
}: {
  icon: React.ReactNode;
  category: string;
  items: { name: string; amount: string; status: "good" | "warn" | "bad" }[];
  score: number;
  recommendation: string;
}) {
  return (
    <div className="diet-food-card">
      <div className="diet-food-header">
        <div className="diet-food-title-row">
          <span className="diet-food-icon">{icon}</span>
          <h4 className="diet-food-category">{category}</h4>
        </div>
        <span className={`diet-food-score ${score >= 80 ? "score-good" : score >= 60 ? "score-mid" : "score-bad"}`}>
          {score}分
        </span>
      </div>

      <div className="diet-food-items">
        {items.map((item, i) => (
          <div key={i} className={`diet-food-item diet-item-${item.status}`}>
            <span className="diet-item-name">{item.name}</span>
            <span className="diet-item-amount">{item.amount}</span>
          </div>
        ))}
      </div>

      <div className="diet-food-recommendation">
        <Zap size={14} />
        <span>{recommendation}</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
export default function DietAnalysis() {
  const navigate = useNavigate();
  const { phone, selectedPetId, selectedPet, pets } = useShell();
  const currentPet = selectedPet || pets[0] || null;

  // ── 从后端获取真实数据 ──
  const [analysisData, setAnalysisData] = useState<AnalysisDashboardData | null>(null);
  const [dietLoading, setDietLoading] = useState(true);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaErrorData, setQuotaErrorData] = useState<QuotaError | null>(null);

  useEffect(() => {
    if (!currentPet?.id) return;
    setDietLoading(true);
    fetchAnalysisDashboard(currentPet.id)
      .then((data) => setAnalysisData(data))
      .catch((err: any) => {
        if (err.status === 429 && err.quotaDetail) {
          setQuotaErrorData({
            type: "quota_exceeded",
            feature: err.quotaDetail.feature,
            used: err.quotaDetail.used,
            limit: err.quotaDetail.limit,
            plan: err.quotaDetail.plan,
            upgradeHint: err.quotaDetail.upgradeHint,
          });
          setShowQuotaModal(true);
        } else {
          console.error("饮食分析数据获取失败:", err);
        }
      })
      .finally(() => setDietLoading(false));
  }, [currentPet?.id]);

  // ── 基于真实数据构建显示内容（不编造）──
  const dietScore = analysisData?.dimensions?.diet?.score ?? 0;
  const obsCount = analysisData?.data_summary?.observations ?? 0;

  // 数据库中没有详细营养字段（蛋白质/脂肪/热量等），明确告知
  const hasDietData = obsCount > 0 && (analysisData?.dimensions?.diet?.detail as Record<string, unknown>)?.samples > 0;

  return (
    <main className="diet-page">
      {/* ═══ 渐变头部（橙黄色调） ═══ */}
      <header className="diet-header">
        <div className="diet-header-bg">
          <button className="diet-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="diet-header-title">饮食营养分析</h1>
          <p className="diet-header-sub">
            {currentPet?.name || "宠物"} · 基于近期饮食习惯评估
          </p>
        </div>

        {/* 热量概览卡片 — 数据库无热量字段，改为显示饮食评分 */}
        <div className="diet-calorie-card">
          <div className="diet-cal-top">
            <UtensilsCrossed size={24} className="diet-cal-icon" />
            <div className="diet-cal-info">
              <span className="diet-cal-label">饮食健康评分</span>
              <div className="diet-cal-values">
                <strong>{dietLoading ? "..." : dietScore}</strong>
                <span>/ 100 分</span>
              </div>
            </div>
            <div className="diet-cal-percent">
              {Math.min(dietScore, 100)}%
            </div>
          </div>
          <div className="diet-cal-bar">
            <div
              className="diet-cal-fill"
              style={{ width: `${Math.min(dietScore, 100)}%` }}
            />
          </div>
        </div>
      </header>

      {/* ═══ 综合评分 ═══ */}
      <section className="diet-score-section">
        <div className="diet-overall-score">
          <div className={`diet-score-circle ${dietScore >= 80 ? "score-high" : dietScore >= 65 ? "score-mid" : "score-low"}`}>
            <span className="diet-score-num">{dietLoading ? "..." : dietScore}</span>
            <span className="diet-score-text">分</span>
          </div>
          <div className="diet-score-info">
            <h3 className="diet-score-title">饮食评估</h3>
            <p className="diet-score-desc">
              {dietLoading
                ? "正在从数据库加载分析数据..."
                : obsCount === 0
                  ? "暂无观察记录，请先记录宝贝的食欲状况"
                  : dietScore >= 75
                    ? "基于观察记录，饮食状态良好"
                    : dietScore >= 55
                      ? "建议关注宝贝的食欲变化"
                      : "食欲状况需要重点关注"}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ 营养素环形图 — 数据库无详细营养字段 ═══ */}
      <section className="diet-nutrients-section">
        <h2 className="diet-section-title"><Apple size={18} /> 数据来源说明</h2>
        <div style={{ background: "#fffbeb", borderRadius: "12px", padding: "16px", borderLeft: "4px solid #f59e0b" }}>
          <p style={{ margin: 0, color: "#92400e", fontSize: "14px", lineHeight: 1.6 }}>
            当前饮食评分 <strong>{dietLoading ? "..." : dietScore}分</strong> 基于 <strong>{obsCount}</strong> 条日常观察记录中的食欲状态计算。
            数据库暂无详细热量/蛋白质等营养数据，如需精确的营养分析，请在记录时补充更详细的喂养信息。
          </p>
        </div>

        {/* 显示基于真实数据的简化指标 */}
        <div className="diet-nutrients-grid">
          <NutrientRing label="饮食评分" current={dietScore} target={100} unit="%" color="#ef4444" />
          <NutrientRing label="观察样本" current={obsCount} target={Math.max(obsCount, 5)} unit="次" color="#10b981" />
          <NutrientRing label="食欲状态" current={hasDietData ? dietScore : 0} target={80} unit="分" color="#8b5cf6" />
          <NutrientRing label="记录完整度" current={obsCount >= 5 ? 100 : Math.round(obsCount * 20)} target={100} unit="%" color="#f59e0b" />
        </div>
      </section>

      {/* ═══ 饮食建议 — 基于API真实推荐 ═══ */}
      <section className="diet-advice-section">
        <h2 className="diet-section-title"><CheckCircle2 size={18} /> 饮食健康建议</h2>
        <div className="diet-advice-card">
          {dietLoading ? (
            <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>加载中...</p>
          ) : obsCount === 0 ? (
            <>
              <div className="diet-advice-item highlight">
                <span className="diet-advice-emoji">📝</span>
                <div className="diet-advice-content">
                  <h4>开始记录饮食习惯</h4>
                  <p>当前暂无观察记录。建议在每日记录中填写宝贝的食欲状况（好/一般/差），系统将据此生成饮食趋势分析。</p>
                </div>
              </div>
              <div className="diet-advice-item">
                <span className="diet-advice-emoji">🍖</span>
                <div className="diet-advice-content">
                  <h4>关注食欲变化</h4>
                  <p>食欲是宠物健康状况的重要指标。持续记录可帮助发现潜在的健康问题（如消化不良、疾病早期信号）。</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="diet-advice-item highlight">
                <span className="diet-advice-emoji">🎯</span>
                <div className="diet-advice-content">
                  <h4>当前饮食评估：{dietScore >= 75 ? "良好" : dietScore >= 55 ? "一般" : "需关注"}</h4>
                  <p>基于{obsCount}条观察记录，饮食评分为{dietScore}分。{dietScore < 60 ? "建议关注宝贝的食欲变化，如有异常及时就医。" : "继续保持当前的喂养习惯，定期记录。"}</p>
                </div>
              </div>
              {dietScore < 70 && (
                <div className="diet-advice-item">
                  <span className="diet-advice-emoji">💡</span>
                  <div className="diet-advice-content">
                    <h4>改善建议</h4>
                    <p>近期食欲评分偏低，可能原因包括：环境温度过高、食物不新鲜、身体不适等。建议观察是否有其他异常症状。</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <div style={{ height: "32px" }} />

      <QuotaHintModal
        isOpen={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        quotaData={quotaErrorData}
        onUpgrade={() => navigate("/app/mine/vip")}
      />
    </main>
  );
}
