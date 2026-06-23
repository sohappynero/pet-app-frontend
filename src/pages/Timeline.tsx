import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassNav from "../components/petos/GlassNav";
import HealthTrendChart from "../components/petos/HealthTrendChart";
import { useShell } from "../hooks/useShell";
import { fetchAnalysisDashboard, fetchRecords, type AnalysisDashboardData } from "../lib/api";
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

  return (
    <div className="petos-page">
      <div className="petos-content">
        <GlassNav rightSlot={null} />

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

        {/* 总健康评分 */}
        <div className="petos-form-card" style={{ textAlign: "center", padding: "24px 16px" }}>
          <div style={{ fontSize: "var(--text-caption)", color: "var(--color-text-secondary)" }}>健康评分</div>
          <div style={{ fontSize: 48, fontWeight: 700, color: "var(--color-text-primary)", marginTop: 4 }}>
            {overallScore != null ? overallScore : "--"}
          </div>
          {grade && (
            <span className={`petos-timeline-grade ${overallScore != null && overallScore >= 80 ? "petos-timeline-grade--good" : overallScore != null && overallScore >= 60 ? "petos-timeline-grade--ok" : "petos-timeline-grade--warn"}`}>
              等级 {grade}
            </span>
          )}
        </div>

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

        {/* 趋势图占位 */}
        <HealthTrendChart data={null} />

        {/* 历史记录列表 */}
        <div className="petos-timeline-records">
          <div className="petos-timeline-records__title">
            {isSameDay(selectedDate, new Date()) ? "今日记录" : `${fmtDate(selectedDate)} 记录`}
          </div>
          {filteredRecords.length === 0 ? (
            <div className="petos-timeline-records__empty">暂无记录</div>
          ) : (
            filteredRecords.map((r) => (
              <button
                key={r.id}
                type="button"
                className="petos-timeline-record-item"
                onClick={() => navigate(`/app/timeline/record/${r.id}?type=${r.record_type}`)}
              >
                <span className="petos-timeline-record-item__type">{RECORD_TYPE_LABEL[r.record_type] || r.record_type}</span>
                <span className="petos-timeline-record-item__title">{r.title || "健康记录"}</span>
                <span className="petos-timeline-record-item__date">{r.record_date}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
