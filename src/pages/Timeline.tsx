import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import HealthTrendChart from "../components/petos/HealthTrendChart";
import { useShell } from "../hooks/useShell";
import { fetchAnalysisDashboard, fetchRecords, fetchWeights, type AnalysisDashboardData } from "../lib/api";
import type { HealthRecord } from "../types";

const DIM_META: Record<string, { label: string; emoji: string }> = {
  weight: { label: "体重管理", emoji: "⚖️" },
  diet: { label: "饮食营养", emoji: "🍽️" },
  exercise: { label: "运动活力", emoji: "🏃" },
  immunity: { label: "免疫防护", emoji: "🛡️" },
  grooming: { label: "美容护理", emoji: "✨" },
  mental: { label: "心理状态", emoji: "😊" },
};

function scoreStatus(score: number): { text: string; cls: string } {
  if (score >= 80) return { text: "优秀", cls: "petos-dim--good" };
  if (score >= 60) return { text: "良好", cls: "petos-dim--ok" };
  return { text: "需关注", cls: "petos-dim--warn" };
}

function recentDates(count: number): Date[] {
  const arr: Date[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    arr.push(d);
  }
  return arr;
}

function fmtDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const RECORD_TYPE_LABEL: Record<string, string> = {
  vaccine: "疫苗", deworm: "驱虫", checkup: "体检", visit: "就诊",
  beauty: "美容", weight: "体重", diet: "饮食", observation: "观察",
};

// ════════════════════════════════════
// WeightTrendHero - 体重趋势图卡片
// ════════════════════════════════════
function WeightTrendHero({
  weightRecords,
  currentWeight,
  weightDiff,
  weightTrend,
}: {
  weightRecords: { date: string; weight: number }[];
  currentWeight: number | null;
  weightDiff: number | null;
  weightTrend: "up" | "down" | "flat";
}) {
  const [selectedDateIndex, setSelectedDateIndex] = useState(-1);

  // 取最近7天
  const recentDates = useMemo(() => {
    if (weightRecords.length === 0) return [];
    const sliced = weightRecords.length <= 7 ? weightRecords : weightRecords.slice(-7);
    return sliced.map((r) => {
      const d = new Date(r.date);
      return { date: r.date, label: `${d.getMonth() + 1}/${d.getDate()}`, weight: r.weight };
    });
  }, [weightRecords]);

  const effectiveIndex = selectedDateIndex === -1 ? recentDates.length - 1 : selectedDateIndex;

  // 显示的体重值
  const displayWeight = (w: number) => w.toFixed(1);

  // 月度统计
  const monthlyStats = useMemo(() => {
    if (weightRecords.length === 0) return { min: null, max: null, change: null };
    const now = new Date();
    const monthRecords = weightRecords.filter((r) => {
      const d = new Date(r.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    if (monthRecords.length === 0) return { min: null, max: null, change: null };
    const weights = monthRecords.map((r) => r.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const change = monthRecords[monthRecords.length - 1].weight - monthRecords[0].weight;
    return { min, max, change };
  }, [weightRecords]);

  // SVG 折线图参数
  const chartWidth = 340;
  const chartHeight = 150;
  const pad = { top: 16, right: 12, bottom: 24, left: 8 };

  const svgPoints = useMemo(() => {
    if (recentDates.length < 2) return [];
    const weights = recentDates.map((r) => r.weight);
    const minW = Math.min(...weights) - 0.5;
    const maxW = Math.max(...weights) + 0.5;
    const rangeW = maxW - minW || 1;
    const cw = chartWidth - pad.left - pad.right;
    const ch = chartHeight - pad.top - pad.bottom;

    return recentDates.map((r, i) => ({
      x: pad.left + (i / Math.max(recentDates.length - 1, 1)) * cw,
      y: pad.top + ch - ((r.weight - minW) / rangeW) * ch,
      weight: r.weight,
      label: r.label,
      date: r.date,
    }));
  }, [recentDates]);

  if (recentDates.length === 0) return null;

  const linePath = svgPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath =
    linePath +
    ` L ${svgPoints[svgPoints.length - 1]?.x ?? 0},${pad.top + (svgPoints[0]?.ch ?? 100)} L ${pad.left},${pad.top + (svgPoints[0]?.ch ?? 100)} Z`;

  return (
    <section className="wt-trend-hero-section">
      {/* 主趋势图卡片 */}
      <div className="wt-trend-card">
        <div className="wt-trend-header">
          <span className="wt-trend-title">体重变化</span>
        </div>

        <div className="wt-weight-showcase">
          <div className="wt-weight-big">
            <span className="wt-big-number">{currentWeight !== null ? displayWeight(currentWeight) : "--"}</span>
            <span className="wt-big-unit">kg</span>
            <span className="wt-big-sub">最新体重</span>
          </div>
          {weightDiff !== null && (
            <div className={`wt-trend-badge wt-badge-${weightTrend}`}>
              {Number(weightDiff) > 0 ? `+${weightDiff.toFixed(1)}` : weightDiff.toFixed(1)}
              kg
              <span className="wt-badge-label">比上月{Number(weightDiff) > 0 ? "增加" : Number(weightDiff) < 0 ? "减少" : "持平"}</span>
            </div>
          )}
        </div>

        <div className="wt-chart-wrap">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="wt-hero-svg">
            <defs>
              <linearGradient id="heroAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFB5B5" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FFB5B5" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="heroLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FF8A9A" />
                <stop offset="100%" stopColor="#FF6B81" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#heroAreaGrad)" />
            <path d={linePath} fill="none" stroke="url(#heroLineGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {svgPoints.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#FF8A9A" strokeWidth="1.8" />
                {i === svgPoints.length - 1 && (
                  <>
                    <circle cx={p.x} cy={p.y} r="6" fill="#FF8A9A" opacity="0.3">
                      <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <rect x={p.x - 28} y={p.y - 32} width="56" height="22" rx="6" fill="#FF8A9A" />
                    <text x={p.x} y={p.y - 17} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">
                      {displayWeight(p.weight)}kg
                    </text>
                  </>
                )}
              </g>
            ))}
            {svgPoints.filter((_, i) => i % Math.ceil(svgPoints.length / 5) === 0 || i === svgPoints.length - 1).map((p, i) => (
              <text key={`xl-${i}`} x={p.x} y={chartHeight - 6} textAnchor="middle" fill="#999" fontSize="9">{p.label}</text>
            ))}
          </svg>
        </div>
      </div>

      <div className="wt-monthly-stats">
        <div className="wt-stat-col">
          <span className="wt-stat-num">{monthlyStats.min !== null ? monthlyStats.min.toFixed(1) : "--"}</span>
          <span className="wt-stat-lbl">月最低</span>
        </div>
        <div className="wt-stat-divider" />
        <div className="wt-stat-col">
          <span className="wt-stat-num">{monthlyStats.max !== null ? monthlyStats.max.toFixed(1) : "--"}</span>
          <span className="wt-stat-lbl">月最高</span>
        </div>
        <div className="wt-stat-divider" />
        <div className="wt-stat-col">
          <span className={`wt-stat-num ${monthlyStats.change && monthlyStats.change > 0 ? "stat-up" : monthlyStats.change && monthlyStats.change < 0 ? "stat-down" : ""}`}>
            {monthlyStats.change !== null ? `${monthlyStats.change > 0 ? "+" : ""}${monthlyStats.change.toFixed(1)}` : "--"}
          </span>
          <span className="wt-stat-lbl">月变化</span>
        </div>
      </div>
    </section>
  );
}

export default function Timeline() {
  const navigate = useNavigate();
  const { selectedPet, phone } = useShell();

  const [dashboard, setDashboard] = useState<AnalysisDashboardData | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dates = useMemo(() => recentDates(7), []);

  useEffect(() => {
    if (!selectedPet) {
      setDashboard(null);
      setRecords([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchAnalysisDashboard(selectedPet.id)
      .then((data) => { if (!cancelled) setDashboard(data); })
      .catch(() => { if (!cancelled) setDashboard(null); });
    fetchRecords(phone, selectedPet.id)
      .then((resp) => {
        if (!cancelled) setRecords((resp.data || []).slice(0, 10));
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setRecords([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [selectedPet?.id, phone]);

  const filteredRecords = useMemo(() => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    return records.filter((r) => r.record_date === dateStr);
  }, [records, selectedDate]);

  const overallScore = dashboard?.overall_score ?? null;
  const grade = dashboard?.score_grade ?? "";
  const dims = dashboard?.dimensions;
  const aiSummary = dashboard?.ai_summary;

  // ── 体重记录数据（用于趋势图）──
  const [weightRecords, setWeightRecords] = useState<{ date: string; weight: number }[]>([]);

  useEffect(() => {
    if (!selectedPet) { setWeightRecords([]); return; }
    let cancelled = false;
    fetchWeights(selectedPet.id)
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res) ? res : (res as any)?.data ?? (res as any)?.list ?? [];
        const withWeight = list
          .filter((r: any) => r.weight_kg != null && Number(r.weight_kg) > 0)
          .map((r: any) => ({
            date: r.record_date || r.created_at || "",
            weight: Number(r.weight_kg),
          }))
          .filter((r: any) => r.date && !isNaN(r.weight));
        withWeight.sort((a: any, b: any) => a.date.localeCompare(b.date));
        setWeightRecords(withWeight);
      })
      .catch(() => { if (!cancelled) setWeightRecords([]); });
    return () => { cancelled = true; };
  }, [selectedPet?.id]);

  // 计算当前体重和月度变化
  const currentWeightVal = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1].weight : null;
  const weightDiffVal = useMemo(() => {
    if (weightRecords.length < 2) return null;
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // 找当月第一条记录和最后一条记录
    const monthRecs = weightRecords.filter(r => {
      const d = new Date(r.date);
      return d >= firstOfMonth && d <= now;
    });
    if (monthRecs.length < 2) {
      // 用最近两条记录的变化量作为替代
      return weightRecords[weightRecords.length - 1].weight - weightRecords[0].weight;
    }
    return monthRecs[monthRecs.length - 1].weight - monthRecs[0].weight;
  }, [weightRecords]);
  const weightTrendVal: "up" | "down" | "flat" = weightDiffVal !== null
    ? (Math.abs(weightDiffVal) < 0.1 ? "flat" : weightDiffVal > 0 ? "up" : "down")
    : "flat";

  return (
    <div className="petos-page">
      <div className="petos-content">

        <div className="petos-greet">
          <div className="petos-greet__name">成长</div>
        </div>

        {/* 日期选择器 */}
        <div className="petos-timeline-dates">
          {dates.map((d) => {
            const isToday = isSameDay(d, new Date());
            const isOn = isSameDay(d, selectedDate);
            return (
              <button
                key={d.toISOString()}
                type="button"
                className={`petos-timeline-date${isOn ? " petos-timeline-date--on" : ""}`}
                onClick={() => setSelectedDate(d)}
              >
                {isToday ? "今天" : fmtDate(d)}
              </button>
            );
          })}
        </div>

        {/* 体重趋势图卡片 */}
        <WeightTrendHero
          weightRecords={weightRecords}
          currentWeight={currentWeightVal}
          weightDiff={weightDiffVal}
          weightTrend={weightTrendVal}
        />

        {/* 六维度卡片 */}
        {dims && (
          <div className="petos-timeline-dims">
            {Object.entries(DIM_META).map(([key, meta]) => {
              const dim = dims[key as keyof typeof dims];
              const score = dim?.score ?? 0;
              const hasData = score > 0;
              const status = hasData ? scoreStatus(score) : null;
              return (
                <div key={key} className={`petos-timeline-dim ${status?.cls || ""}`}>
                  <span className="petos-timeline-dim__emoji">{meta.emoji}</span>
                  <span className="petos-timeline-dim__label">{meta.label}</span>
                  <span className="petos-timeline-dim__score">{hasData ? `${score}分` : "--"}</span>
                  {status && <span className="petos-timeline-dim__status">{status.text}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* AI 健康总结 */}
        {aiSummary && (
          <div className="petos-form-card">
            <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-secondary)", marginBottom: 8 }}>🤖 AI 健康总结</div>
            <p style={{ margin: 0, fontSize: "var(--text-body)", color: "var(--color-text-primary)", lineHeight: 1.6 }}>{aiSummary}</p>
          </div>
        )}

      </div>
    </div>
  );
}
