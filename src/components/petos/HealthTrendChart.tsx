export interface HealthTrendChartProps {
  data: Array<{ date: string; score: number }> | null;
}

export default function HealthTrendChart({ data }: HealthTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="petos-timeline-trend-placeholder">
        <span>📈</span>
        <p>趋势图即将上线</p>
      </div>
    );
  }

  return (
    <div className="petos-timeline-trend">
      {/* 后续接入历史评分 API 后在此渲染 SVG 曲线 */}
    </div>
  );
}
