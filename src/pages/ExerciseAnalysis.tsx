import { useMemo } from "react";
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

  const isCat = currentPet?.species === "cat";

  const exerciseData = useMemo(() => ({
    overallScore: 68,

    weeklyGoal: {
      current: 260,
      target: 420,
      unit: "分钟",
    },

    goals: [
      { label: "本周有氧运动", current: 180, target: 240, unit: "min", color: "linear-gradient(90deg, #6366f1, #8b5cf6)" },
      { label: "力量训练游戏", current: 45, target: 90, unit: "min", color: "linear-gradient(90deg, #f59e0b, #fbbf24)" },
      { label: "互动玩耍", current: 35, target: 60, unit: "min", color: "linear-gradient(90deg, #10b981, #34d399)" },
      { label: "户外探索", current: 40, target: 90, unit: "min", color: "linear-gradient(90deg, #ec4899, #f472b6)" },
    ],

    exerciseTypes: isCat ? [
      {
        icon: <Footprints size={20} />,
        type: "追逐游戏",
        duration: "10-15分钟",
        frequency: "每日2次",
        intensity: "中高强度",
        calories: "~25 kcal",
        status: "moderate" as const,
        description: "激光笔/逗猫棒追逐，刺激捕猎本能",
      },
      {
        icon: <Bike size={20} />,
        type: "攀爬活动",
        duration: "自由进行",
        frequency: "随时",
        intensity: "中等",
        calories: "~15 kcal",
        status: "good" as const,
        description: "猫爬架攀爬跳跃，锻炼肌肉协调性",
      },
      {
        icon: <Timer size={20} />,
        type: "智力玩具",
        duration: "15-20分钟",
        frequency: "每日1次",
        intensity: "低强度",
        calories: "~10 kcal",
        status: "insufficient" as const,
        description: "漏食球/解谜玩具，脑力与体力结合",
      },
    ] : [
      {
        icon: <Footprints size={20} />,
        type: "户外散步",
        duration: "30分钟/次",
        frequency: "早晚各1次",
        intensity: "中低强度",
        calories: "~120 kcal",
        status: "good" as const,
        description: "匀速步行，保持心率平稳，适合日常锻炼",
      },
      {
        icon: <Bike size={20} />,
        type: "奔跑追逐",
        duration: "15-20分钟",
        frequency: "周末2次",
        intensity: "高强度",
        calories: "~200 kcal",
        status: "moderate" as const,
        description: "飞盘/捡球/奔跑游戏，释放精力和能量",
      },
      {
        icon: <Sun size={20} />,
        type: "游泳运动",
        duration: "20-30分钟",
        frequency: "每周1次",
        intensity: "中高强度",
        calories: "~180 kcal",
        status: "insufficient" as const,
        description: "全身有氧运动，对关节友好，适合大型犬",
      },
      {
        icon: <Target size={20} />,
        type: "敏捷训练",
        duration: "15分钟",
        frequency: "每周1-2次",
        intensity: "高强度",
        calories: "~100 kcal",
        status: "insufficient" as const,
        description: "障碍穿越/指令训练，增强身体协调性和服从性",
      },
    ],

    weekSchedule: isCat ? [
      { day: "周一", activities: ["逗猫棒", "爬架"], totalMinutes: 25, isActive: true },
      { day: "周二", activities: ["激光笔", "智力玩具"], totalMinutes: 20 },
      { day: "周三", activities: ["逗猫棒", "躲猫猫"], totalMinutes: 30 },
      { day: "周四", activities: ["爬架", "纸箱探险"], totalMinutes: 20 },
      { day: "周五", activities: ["激光笔", "羽毛玩具"], totalMinutes: 25 },
      { day: "周六", activities: ["长时间互动", "新玩具探索"], totalMinutes: 45 },
      { day: "周日", activities: ["休息", "轻度活动"], totalMinutes: 15 },
    ] : [
      { day: "周一", activities: ["晨散步", "晚散步"], totalMinutes: 55, isActive: true },
      { day: "周二", activities: ["晨散步", "晚散步", "飞盘"], totalMinutes: 70 },
      { day: "周三", activities: ["晨散步", "晚散步"], totalMinutes: 50 },
      { day: "周四", activities: ["晨散步", "晚散步", "捡球"], totalMinutes: 65 },
      { day: "周五", activities: ["晨散步", "晚散步"], totalMinutes: 50 },
      { day: "周六", activities: ["公园长走", "游泳", "飞盘"], totalMinutes: 95 },
      { day: "周日", activities: ["轻松散步", "家庭互动"], totalMinutes: 40 },
    ],
  }), [isCat]);

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

        {/* 运动量概览 */}
        <div className="exc-overview-card">
          <div className="exc-overview-top">
            <div className="exc-overview-left">
              <Dumbbell size={28} className="exc-overview-icon" />
              <div>
                <span className="exc-overview-label">本周运动量</span>
                <div className="exc-overview-values">
                  <strong>{exerciseData.weeklyGoal.current}</strong>
                  <span>/ {exerciseData.weeklyGoal.target} {exerciseData.weeklyGoal.unit}</span>
                </div>
              </div>
            </div>
            <div className={`exc-overview-ring ${exerciseData.overallScore >= 75 ? "ring-high" : exerciseData.overallScore >= 60 ? "ring-mid" : "ring-low"}`}>
              <span className="exc-ring-num">{exerciseData.overallScore}</span>
              <span className="exc-ring-unit">分</span>
            </div>
          </div>

          {/* 进度条 */}
          <div className="exc-progress-track">
            <div
              className="exc-progress-fill"
              style={{ width: `${(exerciseData.weeklyGoal.current / exerciseData.weeklyGoal.target) * 100}%` }}
            >
              <span className="exc-progress-label">
                达标率 {Math.round(exerciseData.weeklyGoal.current / exerciseData.weeklyGoal.target * 100)}%
              </span>
            </div>
          </div>

          <p className="exc-hint">
            {exerciseData.weeklyGoal.current >= exerciseData.weeklyGoal.target
              ? "太棒了！本周运动目标已完成"
              : `还需 ${exerciseData.weeklyGoal.target - exerciseData.weeklyGoal.current} 分钟达成周目标`}
          </p>
        </div>
      </header>

      {/* ═══ 运动目标进度 ═══ */}
      <section className="exc-goals-section">
        <h2 className="exc-section-title"><Target size={18} /> 目标完成度</h2>
        <div className="exc-goals-card">
          {exerciseData.goals.map((goal, i) => (
            <GoalProgress key={i} {...goal} />
          ))}
        </div>
      </section>

      {/* ═══ 运动类型分析 ═══ */}
      <section className="exc-types-section">
        <h2 className="exc-section-title"><Dumbbell size={18} /> 运动类型</h2>
        <div className="exc-types-list">
          {exerciseData.exerciseTypes.map((type, i) => (
            <ExerciseTypeCard key={i} {...type} />
          ))}
        </div>
      </section>

      {/* ═══ 本周运动日程 ═══ */}
      <section className="exc-schedule-section">
        <h2 className="exc-section-title"><Calendar size={18} /> 本周日程</h2>
        <div className="exc-week-card">
          <div className="exc-week-grid">
            {exerciseData.weekSchedule.map((day, i) => (
              <WeekScheduleDay key={i} {...day} />
            ))}
          </div>

          {/* 天气适配提示 */}
          <div className="exc-weather-tip">
            <CloudRain size={16} />
            <span>雨天替代方案：室内 tug-of-war（拔河）、楼梯上下行走、室内寻宝游戏</span>
          </div>
        </div>
      </section>

      {/* ═══ 运动强度分布（可视化） ═══ */}
      <section className="exc-intensity-section">
        <h2 className="exc-section-title"><Flame size={18} /> 强度分布</h2>
        <div className="exc-intensity-card">
          <div className="exc-intensity-bars">
            <div className="exc-intensity-row">
              <span className="exc-intensity-label">低强度</span>
              <div className="exc-intensity-track">
                <div className="exc-intensity-fill fill-low" style={{ width: "35%" }}>35%</div>
              </div>
              <span className="exc-intensity-detail">散步/慢走</span>
            </div>
            <div className="exc-intensity-row">
              <span className="exc-intensity-label">中强度</span>
              <div className="exc-intensity-track">
                <div className="exc-intensity-fill fill-mid" style={{ width: "40%" }}>40%</div>
              </div>
              <span className="exc-intensity-detail">快走/游戏</span>
            </div>
            <div className="exc-intensity-row">
              <span className="exc-intensity-label">高强度</span>
              <div className="exc-intensity-track">
                <div className="exc-intensity-fill fill-high" style={{ width: "25%" }}>25%</div>
              </div>
              <span className="exc-intensity-detail">奔跑/游泳</span>
            </div>
          </div>

          <div className="exc-intensity-tip">
            <AlertTriangle size={14} />
            <span>建议提高高强度运动占比至35%以上，更有利于心肺功能和肌肉发展</span>
          </div>
        </div>
      </section>

      {/* ═══ 个性化运动方案 ═══ */}
      <section className="exc-plan-section">
        <h2 className="exc-section-title"><Award size={18} /> 推荐方案</h2>
        <div className="exc-plan-card">
          <div className="exc-plan-header">
            <Award size={22} className="exc-plan-icon" />
            <div>
              <h4>黄金运动法则</h4>
              <p>针对{currentPet?.species === "cat" ? "猫咪" : currentPet?.name || "狗狗"}的定制化运动方案</p>
            </div>
          </div>

          <div className="exc-plan-items">
            {!isCat ? (
              <>
                <div className="exc-plan-item plan-primary">
                  <span className="exc-plan-time">☀️ 早间 06:30-07:00</span>
                  <p><strong>唤醒散步</strong> — 20-30分钟轻快步行，帮助代谢一夜积累的废物，同时满足排泄需求。路线选择平坦路面。</p>
                </div>
                <div className="exc-plan-item plan-primary">
                  <span className="exc-plan-time">🌙 晚间 18:30-19:15</span>
                  <p><strong>主训时段</strong> — 40-50分钟组合训练：10分钟热身慢跑 → 20分钟互动游戏（飞盘/球类）→ 10分钟冷静散步回家。</p>
                </div>
                <div className="exc-plan-item">
                  <span className="exc-plan-time">📅 周末</span>
                  <p><strong>深度活动日</strong> — 安排1次游泳（20-30分钟）或去开阔场地奔跑（40-60分钟），充分释放能量。</p>
                </div>
              </>
            ) : (
              <>
                <div className="exc-plan-item plan-primary">
                  <span className="exc-plan-time">☀️ 清晨 06:00-06:30</span>
                  <p><strong>晨间狩猎模拟</strong> — 用激光笔或羽毛棒引导追逐15分钟，满足猫科动物清晨捕猎本能高峰期需求。</p>
                </div>
                <div className="exc-plan-item plan-primary">
                  <span className="exc-plan-time">🌙 傍晚 19:00-19:30</span>
                  <p><strong>晚间互动时光</strong> — 逗猫棒游戏15-20分钟 + 漏食球智力挑战10分钟，增进感情同时消耗精力助眠。</p>
                </div>
                <div className="exc-plan-item">
                  <span className="exc-plan-time">🏠 日常</span>
                  <p>确保猫爬架可用且安全，设置多个不同高度的休息平台，鼓励垂直运动。每2周轮换玩具保持新鲜感。</p>
                </div>
              </>
            )}
          </div>

          <div className="exc-safety-tips">
            <h5><Zap size={16} /> 安全注意事项</h5>
            <ul>
              <li>运动前后30分钟内避免大量进食，预防胃扭转（尤其深胸犬种）</li>
              <li>高温天气（超过28°C）避免剧烈运动，选择清晨或傍晚时段</li>
              <li>观察呼吸频率：若出现张口喘气持续超过5分钟应立即休息降温</li>
              <li>幼犬骨骼未闭合前禁止跳跃类高强度运动，以免损伤关节</li>
              <li>定期检查爪垫是否有裂伤，运动后清洁并检查有无异物</li>
            </ul>
          </div>
        </div>
      </section>

      <div style={{ height: "32px" }} />
    </main>
  );
}
