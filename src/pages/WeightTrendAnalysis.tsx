import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Scale, Target, Calendar, AlertTriangle, CheckCircle2, Activity, BarChart3, LineChart as LineChartIcon } from "lucide-react";
import { useShell } from "../hooks/useShell";
import type { HealthRecord } from "../types";
import { fetchRecords } from "../lib/api";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import "../weight-trend-analysis.css";

// ── SVG 体重趋势图组件（纯CSS+SVG实现）─────────
function WeightChart({ records }: { records: { date: string; weight: number; idealMin: number; idealMax: number }[] }) {
  if (records.length === 0) return null;

  const weights = records.map(r => r.weight);
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW || 1;

  const width = 320;
  const height = 160;
  const padding = { top: 20, right: 15, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // 生成路径
  const points = records.map((r, i) => {
    const x = padding.left + (i / Math.max(records.length - 1, 1)) * chartW;
    const y = padding.top + chartH - ((r.weight - minW) / range) * chartH;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(" L ")}`;

  // 面积填充
  const areaPath = linePath + ` L ${padding.left + chartW},${padding.top + chartH} L ${padding.left},${padding.top + chartH} Z`;

  // 理想范围区域
  const idealYTop = padding.top + chartH - ((records[0].idealMax - minW) / range) * chartH;
  const idealYBottom = padding.top + chartH - ((records[0].idealMin - minW) / range) * chartH;

  // Y轴刻度
  const yTicks = [minW, minW + range * 0.5, maxW].map(v => ({
    value: v.toFixed(1),
    y: padding.top + chartH - ((v - minW) / range) * chartH,
  }));

  return (
    <div className="wt-chart-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="wt-chart-svg">
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + chartH * ratio}
            x2={width - padding.right}
            y2={padding.top + chartH * ratio}
            stroke="#f0e6ff"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        ))}

        {/* 理想范围区域 */}
        <rect
          x={padding.left}
          y={Math.min(idealYTop, idealYBottom)}
          width={chartW}
          height={Math.abs(idealYBottom - idealYTop)}
          fill="url(#idealGradient)"
          opacity="0.4"
          rx="4"
        />

        {/* 渐变定义 */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id="idealGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.08" />
          </linearGradient>

          {/* 发光效果 */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* 面积填充 */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* 趋势线 */}
        <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

        {/* 数据点 */}
        {records.map((r, i) => {
          const x = padding.left + (i / Math.max(records.length - 1, 1)) * chartW;
          const y = padding.top + chartH - ((r.weight - minW) / range) * chartH;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill="#fff" stroke="#6366f1" strokeWidth="2.5" className="wt-data-point" />
              <circle cx={x} cy={y} r="3" fill="#6366f1" />
              {/* 数值标签 */}
              {records.length <= 10 && (
                <text x={x} y={y - 12} textAnchor="middle" className="wt-chart-label">
                  {r.weight.toFixed(1)}
                </text>
              )}
            </g>
          );
        })}

        {/* Y轴标签 */}
        {yTicks.map((tick, i) => (
          <text key={i} x={padding.left - 8} y={tick.y + 4} textAnchor="end" className="wt-axis-label">
            {tick.value}kg
          </text>
        ))}

        {/* X轴日期标签 */}
        {records.filter((_, i) => i % Math.ceil(records.length / 5) === 0 || i === records.length - 1).map((r, i) => {
          const idx = records.indexOf(r);
          const x = padding.left + (idx / Math.max(records.length - 1, 1)) * chartW;
          const dateStr = new Date(r.date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
          return (
            <text key={i} x={x} y={height - 8} textAnchor="middle" className="wt-date-label">
              {dateStr}
            </text>
          );
        })}
      </svg>

      {/* 图例 */}
      <div className="wt-legend">
        <span className="wt-legend-item">
          <span className="wt-legend-line wt-legend-weight"></span>
          实际体重
        </span>
        <span className="wt-legend-item">
          <span className="wt-legend-area"></span>
          理想范围
        </span>
      </div>
    </div>
  );
}

// ── 迷你统计卡片 ────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  unit,
  trend,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  status: "good" | "warning" | "danger";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div className={`wt-stat-card wt-stat-${status}`}>
      <div className="wt-stat-icon-wrap">{icon}</div>
      <div className="wt-stat-body">
        <span className="wt-stat-label">{label}</span>
        <div className="wt-stat-value-row">
          <strong className="wt-stat-value">{value}</strong>
          {unit && <span className="wt-stat-unit">{unit}</span>}
          {trend && (
            <span className={`wt-stat-trend wt-trend-${trend}`}>
              <TrendIcon size={14} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 分析维度卡片 ────────────────────────────────
function AnalysisDimension({
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
  const statusConfig = {
    good: { label: "正常", cls: "wt-status-good" },
    warning: { label: "关注", cls: "wt-status-warn" },
    danger: { label: "异常", cls: "wt-status-bad" },
  };
  const config = statusConfig[status];

  return (
    <div className="wt-dimension-card">
      <div className="wt-dim-header">
        <div className="wt-dim-title-row">
          <span className="wt-dim-icon">{icon}</span>
          <h4 className="wt-dim-title">{title}</h4>
        </div>
        <div className="wt-dim-score-row">
          <span className={`wt-status-tag ${config.cls}`}>{config.label}</span>
          <strong className="wt-score-num">{score}<small>分</small></strong>
        </div>
      </div>
      <div className="wt-dim-body">{children}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════
export default function WeightTrendAnalysis() {
  const navigate = useNavigate();
  const { phone, selectedPetId, selectedPet, pets } = useShell();
  const currentPet = selectedPet || pets[0] || null;

  // 模拟数据（实际应从API获取）
  const weightRecords = useMemo(() => {
    const mockData: { date: string; weight: number; idealMin: number; idealMax: number }[] = [
      { date: "2025-11-01", weight: 26.2, idealMin: 24.5, idealMax: 27.5 },
      { date: "2025-11-15", weight: 26.5, idealMin: 24.5, idealMax: 27.5 },
      { date: "2025-12-01", weight: 26.8, idealMin: 24.5, idealMax: 27.5 },
      { date: "2025-12-15", weight: 27.0, idealMin: 24.5, idealMax: 27.5 },
      { date: "2026-01-01", weight: 27.3, idealMin: 24.5, idealMax: 27.5 },
      { date: "2026-01-15", weight: 27.1, idealMin: 24.5, idealMax: 27.5 },
      { date: "2026-02-01", weight: 26.9, idealMin: 24.5, idealMax: 27.5 },
      { date: "2026-02-15", weight: 26.7, idealMin: 24.5, idealMax: 27.5 },
      { date: "2026-03-01", weight: 26.5, idealMin: 24.5, idealMax: 27.5 },
      { date: "2026-03-15", weight: 26.4, idealMin: 24.5, idealMax: 27.5 },
      { date: "2026-04-01", weight: 26.6, idealMin: 24.5, idealMax: 27.5 },
      { date: "2026-05-01", weight: 26.8, idealMin: 24.5, idealMax: 27.5 },
    ];
    return mockData.sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  // 计算分析数据
  const analysisData = useMemo(() => {
    const currentWeight = weightRecords[weightRecords.length - 1]?.weight ?? 26.8;
    const prevWeight = weightRecords[weightRecords.length - 2]?.weight ?? currentWeight;
    const firstWeight = weightRecords[0]?.weight ?? currentWeight;
    const diff = currentWeight - prevWeight;
    const totalDiff = currentWeight - firstWeight;
    const idealMid = (24.5 + 27.5) / 2;
    const deviation = ((currentWeight - idealMid) / idealMid * 100).toFixed(1);

    // BMI估算（犬类简化公式）
    const bmiEstimate = (currentWeight / Math.pow(0.55, 2)).toFixed(1);

    // 波动率
    const weights = weightRecords.map(r => r.weight);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const variance = weights.reduce((sum, w) => sum + Math.pow(w - avgWeight, 2), 0) / weights.length;
    const volatility = Math.sqrt(variance);

    return { currentWeight, prevWeight, firstWeight, diff, totalDiff, deviation, bmiEstimate, volatility, avgWeight };
  }, [weightRecords]);

  // 综合评分计算
  const overallScore = useMemo(() => {
    let score = 75;
    const { currentWeight, deviation, volatility } = analysisData;
    
    // 偏离理想体重的程度
    const devAbs = Math.abs(parseFloat(deviation));
    if (devAbs <= 3) score += 10;
    else if (devAbs <= 6) score += 5;
    else score -= 5;

    // 波动稳定性
    if (volatility <= 0.3) score += 8;
    else if (volatility <= 0.6) score += 3;
    else score -= 3;

    // 数据记录频率加分
    if (weightRecords.length >= 10) score += 7;
    else if (weightRecords.length >= 6) score += 4;

    return Math.min(Math.max(Math.round(score), 45), 98);
  }, [analysisData, weightRecords]);

  const isOverweight = analysisData.currentWeight > 27.5;
  const isUnderweight = analysisData.currentWeight < 24.5;
  const trendStatus = analysisData.diff > 0.2 ? "up" as const : analysisData.diff < -0.2 ? "down" as const : "stable" as const;

  return (
    <main className="wt-page">
      {/* ═══ 渐变头部 ═══ */}
      <header className="wt-header">
        <div className="wt-header-bg">
          <button className="wt-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="wt-header-title">体重趋势分析</h1>
          <p className="wt-header-sub">
            {currentPet?.name || "宠物"} · 基于最近 {weightRecords.length} 条记录
          </p>
        </div>

        {/* 核心指标卡片 */}
        <div className="wt-hero-metric-card">
          <div className="wt-hero-metric-top">
            <div className="wt-current-weight-display">
              <span className="wt-weight-number">{analysisData.currentWeight.toFixed(1)}</span>
              <span className="wt-weight-unit">kg</span>
            </div>
            <div className="wt-weight-meta">
              <div className={`wt-trend-badge wt-trend-${trendStatus}`}>
                {trendStatus === "up" && <TrendingUp size={16} />}
                {trendStatus === "down" && <TrendingDown size={16} />}
                {trendStatus === "stable" && <Minus size={16} />}
                <span>
                  {trendStatus === "up" ? "+0.3kg" : trendStatus === "down" ? "-0.1kg" : "持平"}
                </span>
              </div>
              <div className={`wt-range-badge ${isOverweight || isUnderweight ? "wt-range-warn" : "wt-range-ok"}`}>
                <Scale size={14} />
                <span>{isOverweight ? "偏重" : isUnderweight ? "偏轻" : "标准"}</span>
              </div>
            </div>
          </div>

          {/* 进度条：显示在理想范围内的位置 */}
          <div className="wt-range-bar-section">
            <div className="wt-range-bar-labels">
              <span>偏轻</span>
              <span>理想范围 (24.5-27.5kg)</span>
              <span>偏重</span>
            </div>
            <div className="wt-range-bar-track">
              <div className="wt-range-ideal-zone" style={{ left: "30%", width: "40%" }} />
              <div 
                className="wt-range-indicator"
                style={{ left: `${30 + ((analysisData.currentWeight - 24.5) / 3) * 40}%` }}
              >
                <Scale size={18} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ 综合评分环 ═══ */}
      <section className="wt-score-section">
        <div className="wt-score-ring-container">
          <div className={`wt-score-ring ${overallScore >= 80 ? "ring-high" : overallScore >= 65 ? "ring-mid" : "ring-low"}`}>
            <svg viewBox="0 0 120 120" className="wt-ring-svg">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#ede9fe" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke={overallScore >= 80 ? "#6366f1" : overallScore >= 65 ? "#f59e0b" : "#ef4444"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${overallScore * 3.27} 327`}
                transform="rotate(-90 60 60)"
                className="wt-ring-progress"
              />
            </svg>
            <div className="wt-ring-content">
              <span className="wt-ring-score">{overallScore}</span>
              <span className="wt-ring-label">综合评分</span>
            </div>
          </div>
          <p className="wt-score-desc">
            {overallScore >= 80
              ? "体重管理优秀！继续保持良好的饮食和运动习惯"
              : overallScore >= 65
                ? "体重基本稳定，建议微调以达最佳状态"
                : "需要重点关注体重变化，建议咨询兽医"}
          </p>
        </div>
      </section>

      {/* ═══ 关键数据概览 ═══ */}
      <section className="wt-stats-grid-section">
        <h2 className="wt-section-title"><BarChart3 size={18} /> 关键数据</h2>
        <div className="wt-stats-grid">
          <StatCard
            icon={<Activity size={20} />}
            label="BMI指数"
            value={analysisData.bmiEstimate}
            status={parseFloat(analysisData.bmiEstimate) < 28 ? "good" : "warning"}
          />
          <StatCard
            icon={<Target size={20} />}
            label="理想偏差"
            value={`${analysisData.deviation > 0 ? "+" : ""}${analysisData.deviation}%`}
            status={Math.abs(parseFloat(analysisData.deviation)) <= 5 ? "good" : "warning"}
            trend={parseFloat(analysisData.deviation) > 0 ? "up" : parseFloat(analysisData.deviation) < 0 ? "down" : "stable"}
          />
          <StatCard
            icon={<Calendar size={20} />}
            label="月均波动"
            value={analysisData.volatility.toFixed(2)}
            unit="kg"
            status={analysisData.volatility <= 0.4 ? "good" : "warning"}
          />
          <StatCard
            icon={<LineChartIcon size={20} />}
            label="总变化"
            value={`${analysisData.totalDiff > 0 ? "+" : ""}${analysisData.totalDiff.toFixed(1)}`}
            unit="kg"
            status={Math.abs(analysisData.totalDiff) <= 1 ? "good" : "warning"}
            trend={analysisData.totalDiff > 0.5 ? "up" : analysisData.totalDiff < -0.5 ? "down" : "stable"}
          />
        </div>
      </section>

      {/* ═══ 体重趋势图表 ═══ */}
      <section className="wt-chart-section">
        <h2 className="wt-section-title"><LineChartIcon size={18} /> 趋势曲线</h2>
        <div className="wt-chart-card">
          <WeightChart records={weightRecords} />
          
          {/* 图表说明 */}
          <div className="wt-chart-insight">
            <AlertTriangle size={16} className="wt-insight-icon" />
            <span>
              近6个月体重呈{trendStatus === "up" ? "缓慢上升" : trendStatus === "down" ? "缓慢下降" : "平稳"}趋势，
              当前处于{isOverweight ? "偏高" : isUnderweight ? "偏低" : "理想"}区间。
              建议保持每2周测量一次。
            </span>
          </div>
        </div>
      </section>

      {/* ═══ 多维度深度分析 ═══ */}
      <section className="wt-dimensions-section">
        <h2 className="wt-section-title"><Activity size={18} /> 深度分析</h2>

        <AnalysisDimension
          icon={<Scale size={18} />}
          title="体重健康度评估"
          score={82}
          status={isOverweight || isUnderweight ? "warning" : "good"}
        >
          <div className="wt-dim-detail-list">
            <div className="wt-dim-row">
              <span>当前体重</span>
              <span className="wt-dim-value">{analysisData.currentWeight.toFixed(1)} kg</span>
            </div>
            <div className="wt-dim-row">
              <span>理想体重区间</span>
              <span className="wt-dim-value">24.5 ~ 27.5 kg</span>
            </div>
            <div className="wt-dim-row">
              <span>偏离中心值</span>
              <span className={`wt-dim-value ${Math.abs(parseFloat(analysisData.deviation)) > 5 ? "value-warning" : ""}`}>
                {analysisData.deviation > 0 ? "+" : ""}{analysisData.deviation}%
              </span>
            </div>
            <div className="wt-dim-row">
              <span>体型判定</span>
              <span className={`wt-dim-tag ${isOverweight ? "tag-warn" : isUnderweight ? "tag-warn" : "tag-good"}`}>
                {isOverweight ? "略胖" : isUnderweight ? "偏瘦" : "标准体型"}
              </span>
            </div>
          </div>

          <div className="wt-dim-suggest">
            <CheckCircle2 size={14} />
            <span>{isOverweight ? "建议减少零食摄入，增加运动量至每日60分钟以上" : isUnderweight ? "可适当增加营养密度较高的优质日粮" : "当前体重管理良好，继续保持现有习惯"}</span>
          </div>
        </AnalysisDimension>

        <AnalysisDimension
          icon={<TrendingUp size={18} />}
          title="变化趋势分析"
          score={78}
          status="good"
        >
          <div className="wt-dim-detail-list">
            <div className="wt-dim-row">
              <span>近期变化（两周）</span>
              <span className={`wt-dim-value ${Math.abs(analysisData.diff) > 0.3 ? "value-warning" : ""}`}>
                {analysisData.diff > 0 ? "+" : ""}{analysisData.diff.toFixed(1)} kg
              </span>
            </div>
            <div className="wt-dim-row">
              <span>总变化（半年）</span>
              <span className="wt-dim-value">{analysisData.totalDiff > 0 ? "+" : ""}{analysisData.totalDiff.toFixed(1)} kg</span>
            </div>
            <div className="wt-dim-row">
              <span>平均体重</span>
              <span className="wt-dim-value">{analysisData.avgWeight.toFixed(1)} kg</span>
            </div>
            <div className="wt-dim-row">
              <span>最高/最低</span>
              <span className="wt-dim-value">
                {Math.max(...weightRecords.map(r => r.weight)).toFixed(1)} / {Math.min(...weightRecords.map(r => r.weight)).toFixed(1)} kg
              </span>
            </div>
          </div>

          <div className="wt-dim-suggest">
            <CheckCircle2 size={14} />
            <span>变化幅度在正常范围内，建议持续监测并建立长期体重档案</span>
          </div>
        </AnalysisDimension>

        <AnalysisDimension
          icon={<Target size={18} />}
          title="营养与代谢状态"
          score={70}
          status="warning"
        >
          <div className="wt-dim-detail-list">
            <div className="wt-dim-row">
              <span>能量摄入评估</span>
              <span className="wt-dim-value tag-warn">偏高</span>
            </div>
            <div className="wt-dim-row">
              <span>蛋白质充足度</span>
              <span className="wt-dim-value tag-good">达标</span>
            </div>
            <div className="wt-dim-row">
              <span>代谢活跃度</span>
              <span className="wt-dim-value tag-good">中等</span>
            </div>
            <div className="wt-dim-row">
              <span>水分摄入</span>
              <span className="wt-dim-value tag-warn">待改善</span>
            </div>
          </div>

          <div className="wt-dim-suggest">
            <CheckCircle2 size={14} />
            <span>建议调整喂食量至推荐值的90%，增加饮水点促进多喝水</span>
          </div>
        </AnalysisDimension>
      </section>

      {/* ═══ 专业建议 ═══ */}
      <section className="wt-advice-section">
        <h2 className="wt-section-title"><CheckCircle2 size={18} /> 专业建议</h2>
        <div className="wt-advice-card">
          <div className="wt-advice-item wt-advice-primary">
            <div className="wt-advice-icon">📊</div>
            <div className="wt-advice-content">
              <h4>定期称重计划</h4>
              <p>建议每周固定时间（如周一早晨空腹）称重，连续记录至少3个月以获得准确趋势。使用同一台电子秤，确保数据可比性。</p>
            </div>
          </div>
          <div className="wt-advice-item">
            <div className="wt-advice-icon">🍖</div>
            <div className="wt-advice-content">
              <h4>饮食调整方案</h4>
              <p>当前体重{isOverweight ? "略超理想范围" : isUnderweight ? "低于理想范围" : "在理想范围内"}。
                {isOverweight ? "建议将日粮减少10-15%，用低热量蔬菜替代部分主食。" :
                 isUnderweight ? "可适当增加优质蛋白摄入（鸡胸肉、鱼肉），分3-4餐喂食。" :
                 "保持现有饮食结构，注意控制零食占比不超过10%。"}
              </p>
            </div>
          </div>
          <div className="wt-advice-item">
            <div className="wt-advice-icon">🏃</div>
            <div className="wt-advice-content">
              <h4>运动优化建议</h4>
              <p>{currentPet?.species === "cat" ?
                "每天互动游戏15-20分钟，设置猫爬架鼓励攀爬活动，利用激光笔/逗猫棒增加运动兴趣。" :
                "金毛属于中大型犬种，每日需60分钟以上有氧运动。建议早晚各一次散步30分钟，周末增加游泳或飞盘等高强度活动。"}
              </p>
            </div>
          </div>
          <div className="wt-advice-item">
            <div className="wt-advice-icon">⚠️</div>
            <div className="wt-advice-content">
              <h4>异常预警信号</h4>
              <p>若两周内体重波动超过±5%、食欲明显下降或上升、伴随精神萎靡等情况，请及时就医排查潜在疾病。</p>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: "32px" }} />
    </main>
  );
}
