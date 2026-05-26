import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Dumbbell,
  Footprints,
  Bike,
  Timer,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  Sun,
  CloudRain,
  Moon,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronRight,
} from "lucide-react";
import { useShell } from "../hooks/useShell";
import { fetchAnalysisDashboard, type AnalysisDashboardData } from "../lib/api";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import "../exercise-analysis.css";

// ── 运动类型图标卡片 ────────────────────────────
function ExerciseTypeCard({
  icon,
  type,
  duration,
  frequency,
  intensity,
  calories,
  status,
  description,
}: {
  icon: React.ReactNode;
  type: string;
  duration: string;
  frequency: string;
  intensity: string;
  calories: string;
  status: "excellent" | "good" | "moderate" | "insufficient";
  description: string;
}) {
  const statusConfig = {
    excellent: { label: "优秀", cls: "exc-status-excellent" },
    good: { label: "良好", cls: "exc-status-good" },
    moderate: { label: "一般", cls: "exc-status-moderate" },
    insufficient: { label: "不足", cls: "exc-status-insufficient" },
  };

  return (
    <div className={`exc-type-card exc-${status}`}>
      <div className="exc-type-header">
        <span className="exc-type-icon">{icon}</span>
        <div className="exc-type-info">
          <h4 className="exc-type-name">{type}</h4>
          <span className={`exc-type-status ${statusConfig[status].cls}`}>
            {statusConfig[status].label}
          </span>
        </div>
        <ChevronRight size={18} className="exc-arrow" />
      </div>
      <p className="exc-type-desc">{description}</p>
      <div className="exc-type-stats">
        <div className="exc-stat">
          <Timer size={13} />
          <span>{duration}</span>
        </div>
        <div className="exc-stat">
          <Calendar size={13} />
          <span>{frequency}</span>
        </div>
        <div className="exc-stat">
          <Flame size={13} />
          <span>{calories}</span>
        </div>
        <div className="exc-stat">
          <Target size={13} />
          <span>{intensity}</span>
        </div>
      </div>
    </div>
  );
}

// ── 运动目标进度条 ──────────────────────────────
function GoalProgress({ label, current, target, unit, color }: { label: string; current: number; target: number; unit: string; color: string }) {
  const percent = Math.min(Math.round((current / target) * 100), 100);
  return (
    <div className="exc-goal-item">
      <div className="exc-goal-header">
        <span className="exc-goal-label">{label}</span>
        <span className="exc-goal-value">
          {current}/{target}{unit}
        </span>
      </div>
      <div className="exc-goal-track">
        <div className="exc-goal-fill" style={{ width: `${percent}%`, background: color }}>
          <span className="exc-goal-percent">{percent}%</span>
        </div>
      </div>
    </div>
  );
}

// ── 周运动日程卡片 ──────────────────────────────
function WeekScheduleDay({
  day,
  activities,
  totalMinutes,
  isActive,
}: {
  day: string;
  activities: string[];
  totalMinutes: number;
  isActive?: boolean;
}) {
  return (
    <div className={`exc-day-card ${isActive ? "day-active" : ""}`}>
      <span className="exc-day-name">{day}</span>
      <div className="exc-day-activities">
        {activities.map((a, i) => (
          <span key={i} className="exc-day-activity">{a}</span>
        ))}
      </div>
      <span className="exc-day-minutes">{totalMinutes}分钟</span>
    </div>
  );
}

// ══════════════════════════════════════════════════
export default function ExerciseAnalysis() {
  const navigate = useNavigate();
  const { phone, selectedPetId, selectedPet, pets } = useShell();
  const currentPet = selectedPet || pets[0] || null;

  // ── 从后端获取真实数据 ──
  const [analysisData, setAnalysisData] = useState<AnalysisDashboardData | null>(null);
  const [excLoading, setExcLoading] = useState(true);

  useEffect(() => {
    if (!currentPet?.id) return;
    setExcLoading(true);
    fetchAnalysisDashboard(currentPet.id)
      .then((data) => setAnalysisData(data))
      .catch(console.error)
      .finally(() => setExcLoading(false));
  }, [currentPet?.id]);

  // ── 基于真实数据 ──
  const exerciseScore = analysisData?.dimensions?.exercise?.score ?? 0;
  const obsCount = analysisData?.data_summary?.observations ?? 0;

  // 数据库无详细运动字段，明确告知
  const hasExerciseData = obsCount > 0;

  return (
    <main className="exc-page">
      {/* ═══ 渐变头部（紫色调） ═══ */}
      <header className="exc-header">
        <div className="exc-header-bg">
          <button className="exc-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="exc-header-title">运动建议</h1>
          <p className="exc-header-sub">
            {currentPet?.name || "宠物"} · 个性化运动方案
          </p>
        </div>

        {/* 运动量概览 — 基于真实数据 */}
        <div className="exc-overview-card">
          <div className="exc-overview-top">
            <div className="exc-overview-left">
              <Dumbbell size={28} className="exc-overview-icon" />
              <div>
                <span className="exc-overview-label">运动活力评分</span>
                <div className="exc-overview-values">
                  <strong>{excLoading ? "..." : exerciseScore}</strong>
                  <span>/ 100 分</span>
                </div>
              </div>
            </div>
            <div className={`exc-overview-ring ${exerciseScore >= 75 ? "ring-high" : exerciseScore >= 55 ? "ring-mid" : "ring-low"}`}>
              <span className="exc-ring-num">{excLoading ? "..." : exerciseScore}</span>
              <span className="exc-ring-unit">分</span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="exc-progress-track">
            <div
              className="exc-progress-fill"
              style={{ width: `${Math.min(exerciseScore, 100)}%` }}
            >
              <span className="exc-progress-label">
                评分 {Math.min(exerciseScore, 100)}%
              </span>
            </div>
          </div>

          <p className="exc-hint">
            {excLoading ? "加载中..." :
              obsCount === 0 ? "暂无观察记录，请先记录宝贝的活力状况" :
              exerciseScore >= 75 ? "活力状态良好，继续保持！" :
              exerciseScore >= 55 ? "建议增加互动和户外活动时间" : "需要关注宝贝的运动量"}
          </p>
        </div>
      </header>

      {/* ═══ 运动目标进度 — 数据说明 ═══ */}
      <section className="exc-goals-section">
        <h2 className="exc-section-title"><Target size={18} /> 数据来源</h2>
        <div style={{ background: "#f5f3ff", borderRadius: "12px", padding: "16px", borderLeft: "4px solid #8b5cf6" }}>
          <p style={{ margin: 0, color: "#5b21b6", fontSize: "14px", lineHeight: 1.6 }}>
            当前运动活力评分 <strong>{excLoading ? "..." : exerciseScore}分</strong> 基于 <strong>{obsCount}</strong> 条日常观察记录计算。
            数据库暂无详细运动时长数据，如需精确分析，请在观察记录中补充活动量信息。
          </p>
        </div>
        <div className="exc-goals-card" style={{ marginTop: 12 }}>
          <GoalProgress label="活力评分" current={exerciseScore} target={100} unit="%" color="#818cf8" />
          <GoalProgress label="观察样本" current={obsCount} target={Math.max(obsCount, 3)} unit="次" color="#34d99" />
        </div>
      </section>

      {/* ═══ 运动类型 — 基于宠物品种的通用建议 ═══ */}
      <section className="exc-types-section">
        <h2 className="exc-section-title"><Dumbbell size={18} /> 运动建议</h2>
        <div className="exc-types-list">
          <ExerciseTypeCard
            icon={<Footprints size={20} />}
            type={currentPet?.species === "cat" ? "追逐游戏" : "日常散步"}
            duration={currentPet?.species === "cat" ? "10-15分钟/次" : "20-30分钟/次"}
            frequency={currentPet?.species === "cat" ? "每日2次" : "每日1-2次"}
            intensity="中低强度"
            calories={currentPet?.species === "cat" ? "~25 kcal" : "~120 kcal"}
            status={exerciseScore >= 60 ? "good" : "moderate" as const}
            description={currentPet?.species === "cat" ? "逗猫棒/激光笔，刺激捕猎本能，适合室内活动" : "匀速步行，保持心率平稳，是基础有氧运动"}
          />
          <ExerciseTypeCard
            icon={<Bike size={20} />}
            type={currentPet?.species === "cat" ? "攀爬活动" : "互动游戏"}
            duration={currentPet?.species === "cat" ? "自由进行" : "15-20分钟/次"}
            frequency={currentPet?.species === "cat" ? "随时" : "每周3-4次"}
            intensity="中等"
            calories={currentPet?.species === "cat" ? "~15 kcal" : "~200 kcal"}
            status="good" as const
            description={currentPet?.species === "cat" ? "猫爬架攀爬跳跃，锻炼协调性" : "飞盘/捡球/奔跑，释放精力和能量"}
          />
          <ExerciseTypeCard
            icon={<Target size={20} />}
            type={currentPet?.species === "cat" ? "智力玩具" : "敏捷训练"}
            duration="15-20分钟/次"
            frequency={currentPet?.species === "cat" ? "每日1次" : "每周1-2次"}
            intensity={currentPet?.species === "cat" ? "低强度" : "高强度"}
            calories="~10-100 kcal"
            status={exerciseScore >= 70 ? "excellent" : "insufficient" as const}
            description={currentPet?.species === "cat" ? "漏食球/解谜玩具，脑力与体力结合" : "障碍穿越/指令训练，增强协调性"}
          />
        </div>
      </section>

      {/* ═══ 运动健康建议 ═══ */}
      <section className="exc-plan-section">
        <h2 className="exc-section-title"><Award size={18} /> 运动建议</h2>
        <div className="exc-plan-card">
          {obsCount === 0 ? (
            <>
              <p style={{ color: "#666", padding: "16px", textAlign: "center" }}>暂无运动观察记录。开始记录宝贝的活力状态后，系统将生成个性化运动分析。</p>
              <div className="exc-plan-items">
                <div className="exc-plan-item plan-primary">
                  <span className="exc-plan-time">📝 记录建议</span>
                  <p><strong>开始观察</strong> — 每天记录宝贝的活力水平（活跃/一般/安静），系统将据此计算运动趋势。</p>
                </div>
              </div>
            </>
          ) : exerciseScore >= 75 ? (
            <div className="exc-plan-items">
              <div className="exc-plan-item plan-primary">
                <span className="exc-plan-time">✅ 状态良好</span>
                <p>基于{obsCount}条观察记录，宝贝的活力评分为<strong>{exerciseScore}分</strong>。继续保持当前的运动和互动习惯！</p>
              </div>
            </div>
          ) : (
            <div className="exc-plan-items">
              <div className="exc-plan-item">
                <span className="exc-plan-time">💡 改善方向</span>
                <p>基于{obsCount}条观察记录，活力评分为<strong>{exerciseScore}分</strong>。建议增加互动时间、户外活动或玩耍频率。</p>
              </div>
              {currentPet?.species !== "cat" && (
                <div className="exc-plan-item">
                  <span className="exc-plan-time">🐕 推荐方案</span>
                  <p><strong>每天至少30分钟散步</strong> + 每周2-3次互动游戏（飞盘/捡球）。运动前后注意补水。</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div style={{ height: "32px" }} />
    </main>
  );
}
