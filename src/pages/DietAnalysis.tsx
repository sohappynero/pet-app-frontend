import { useMemo } from "react";
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
import PetPhotoAvatar from "../components/PetPhotoAvatar";
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

  const dietData = useMemo(() => ({
    overallScore: 72,

    dailyCalories: { consumed: 1150, recommended: 1250 },

    nutrients: [
      { label: "蛋白质", current: 52, target: 65, unit: "g", color: "#ef4444" },
      { label: "脂肪", current: 38, target: 42, unit: "g", color: "#f59e0b" },
      { label: "碳水", current: 140, target: 150, unit: "g", color: "#10b981" },
      { label: "纤维", current: 8, target: 12, unit: "g", color: "#8b5cf6" },
    ],

    foodCategories: [
      {
        icon: <Apple size={18} />,
        category: "主食类",
        items: [
          { name: "狗粮（成犬）", amount: "280g/天", status: "good" },
          { name: "湿粮罐头", amount: "1个/周", status: "good" },
        ],
        score: 85,
        recommendation: "主食摄入量合理，建议选择高蛋白优质粮（蛋白含量≥26%）",
      },
      {
        icon: <Fish size={18} />,
        category: "蛋白质来源",
        items: [
          { name: "鸡胸肉", amount: "50g/次 × 2次/周", status: "warn" },
          { name: "鸡蛋黄", amount: "2个/周", status: "good" },
          { name: "鱼肉", amount: "偶尔", status: "bad" },
        ],
        score: 62,
        recommendation: "蛋白质来源偏单一，建议增加鱼类（富含Omega-3），减少红肉比例",
      },
      {
        icon: <Carrot size={18} />,
        category: "蔬果零食",
        items: [
          { name: "胡萝卜条", amount: "适量", status: "good" },
          { name: "南瓜泥", amount: "偶尔", status: "warn" },
          { name: "蓝莓", amount: "很少", status: "bad" },
        ],
        score: 55,
        recommendation: "蔬菜水果摄入不足，建议每日添加适量蔬菜（不超过日粮的15%）",
      },
      {
        icon: <Cookie size={18} />,
        category: "零食与奖励",
        items: [
          { name: "训练奖励", amount: "3-5粒/次", status: "good" },
          { name: "磨牙棒", amount: "1根/天", status: "good" },
          { name: "人食零食", amount: "偶尔", status: "bad" },
        ],
        score: 70,
        recommendation: "控制零食占比不超过总热量的10%，避免含盐/糖的人食",
      },
    ],

    waterIntake: { current: 450, recommended: 600, unit: "ml" },

    feedingSchedule: [
      { time: "07:30", meal: "早餐", amount: "140g 狗粮" },
      { time: "12:30", meal: "加餐", amount: "少许训练零食" },
      { time: "18:00", meal: "晚餐", amount: "140g 狗粮" },
      { time: "21:00", meal: "夜宵", amount: "磨牙棒 1根" },
    ],
  }), []);

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

        {/* 热量概览卡片 */}
        <div className="diet-calorie-card">
          <div className="diet-cal-top">
            <UtensilsCrossed size={24} className="diet-cal-icon" />
            <div className="diet-cal-info">
              <span className="diet-cal-label">今日热量摄入</span>
              <div className="diet-cal-values">
                <strong>{dietData.dailyCalories.consumed}</strong>
                <span>/ {dietData.dailyCalories.recommended} kcal</span>
              </div>
            </div>
            <div className="diet-cal-percent">
              {Math.round(dietData.dailyCalories.consumed / dietData.dailyCalories.recommended * 100)}%
            </div>
          </div>
          <div className="diet-cal-bar">
            <div
              className="diet-cal-fill"
              style={{ width: `${Math.min(dietData.dailyCalories.consumed / dietData.dailyCalories.recommended * 100, 100)}%` }}
            />
            <div
              className="diet-cal-overfill"
              style={{
                width: `${
                  Math.max(dietData.dailyCalories.consumed / dietData.dailyCalories.recommended * 100 - 100, 0)
                }%`,
                left: `${Math.min(100, dietData.dailyCalories.consumed / dietData.dailyCalories.recommended * 100)}%`
              }}
            />
          </div>
        </div>
      </header>

      {/* ═══ 综合评分 ═══ */}
      <section className="diet-score-section">
        <div className="diet-overall-score">
          <div className={`diet-score-circle ${dietData.overallScore >= 80 ? "score-high" : dietData.overallScore >= 65 ? "score-mid" : "score-low"}`}>
            <span className="diet-score-num">{dietData.overallScore}</span>
            <span className="diet-score-text">分</span>
          </div>
          <div className="diet-score-info">
            <h3 className="diet-score-title">饮食评估</h3>
            <p className="diet-score-desc">
              {dietData.overallScore >= 80
                ? "营养均衡，继续保持！"
                : dietData.overallScore >= 65
                  ? "基本合理，有优化空间"
                  : "需要调整饮食结构"}
            </p>
          </div>
        </div>
      </section>

      {/* ═══ 营养素环形图 ═══ */}
      <section className="diet-nutrients-section">
        <h2 className="diet-section-title"><Apple size={18} /> 营养素达标率</h2>
        <div className="diet-nutrients-grid">
          {dietData.nutrients.map((nutrient, i) => (
            <NutrientRing key={i} {...nutrient} />
          ))}
        </div>
      </section>

      {/* ═══ 食物分类详情 ═══ */}
      <section className="diet-categories-section">
        <h2 className="diet-section-title"><UtensilsCrossed size={18} /> 饮食结构</h2>
        <div className="diet-cards-list">
          {dietData.foodCategories.map((cat, i) => (
            <FoodCategoryCard key={i} {...cat} />
          ))}
        </div>
      </section>

      {/* ═══ 饮水量 & 喂食时间表 ═══ */}
      <section className="diet-water-section">
        <h2 className="diet-section-title"><Droplets size={18} /> 饲养习惯</h2>

        {/* 饮水量 */}
        <div className="diet-water-card">
          <div className="diet-water-row">
            <Droplets size={20} className="diet-water-icon" />
            <div className="diet-water-body">
              <span className="diet-water-label">日均饮水量</span>
              <div className="diet-water-values">
                <strong>{dietData.waterIntake.current}</strong>
                <span>/{dietData.waterIntake.recommended} {dietData.waterIntake.unit}</span>
                <span className={`diet-water-status ${dietData.waterIntake.current >= dietData.waterIntake.recommended * 0.8 ? "ok" : "low"}`}>
                  {dietData.waterIntake.current >= dietData.waterIntake.recommended * 0.8 ? "达标" : "不足"}
                </span>
              </div>
            </div>
          </div>
          <div className="diet-water-bar-track">
            <div
              className="diet-water-bar-fill"
              style={{ width: `${Math.min(dietData.waterIntake.current / dietData.waterIntake.recommended * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* 喂食时间表 */}
        <div className="diet-schedule-card">
          <h4 className="diet-schedule-title"><Clock size={16} /> 今日喂食安排</h4>
          <div className="diet-schedule-list">
            {dietData.feedingSchedule.map((item, i) => (
              <div key={i} className="diet-schedule-item">
                <span className="diet-schedule-time">{item.time}</span>
                <span className="diet-schedule-meal">{item.meal}</span>
                <span className="diet-schedule-amount">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 专业建议 ═══ */}
      <section className="diet-advice-section">
        <h2 className="diet-section-title"><CheckCircle2 size={18} /> 营养优化建议</h2>
        <div className="diet-advice-card">
          <div className="diet-advice-item highlight">
            <span className="diet-advice-emoji">🎯</span>
            <div className="diet-advice-content">
              <h4>核心问题：蛋白质不足</h4>
              <p>当前蛋白质摄入量仅为推荐值的80%。成年金毛每天需要约2g蛋白质/kg体重。建议将部分狗粮替换为高蛋白配方（≥28%粗蛋白），或每周额外添加2-3次煮熟的鸡胸肉/鱼肉。</p>
            </div>
          </div>
          <div className="diet-advice-item">
            <span className="diet-advice-emoji">🥦</span>
            <div className="diet-advice-content">
              <h4>增加膳食纤维</h4>
              <p>膳食纤维有助于肠道健康和体重管理。推荐添加：蒸南瓜（富含β-胡萝卜素）、胡萝卜丝（清洁牙齿）、西兰花碎（需煮熟，少量）。总量控制在日粮的10%以内。</p>
            </div>
          </div>
          <div className="diet-advice-item">
            <span className="diet-advice-emoji">💧</span>
            <div className="diet-advice-content">
              <h4>促进喝水策略</h4>
              <p>当前饮水量偏低。尝试：① 使用流动式自动饮水机 ② 在水中滴入极少量无盐肉汤 ③ 多放置几个水碗在不同位置 ④ 湿粮与干粮混喂增加水分摄入。</p>
            </div>
          </div>
          <div className="diet-advice-item">
            <span className="diet-advice-emoji">⏱️</span>
            <div className="diet-advice-content">
              <h4>喂食时机优化</h4>
              <p>建议固定喂食时间以建立规律生物钟。运动前后30分钟内避免大量进食，防止胃扭转风险。晚餐尽量在睡前2小时前完成。</p>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: "32px" }} />
    </main>
  );
}
