import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Activity,
  Shield,
  Thermometer,
  Droplets,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useShell } from "../hooks/useShell";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import "../health-report-analysis.css";

// ── 雷达图组件（SVG实现）────────────────────────
function RadarChart({ dimensions }: { dimensions: { label: string; value: number; max: number; color: string }[] }) {
  const size = 280;
  const center = size / 2;
  const radius = 100;
  const levels = 5;

  // 计算多边形顶点
  const angleStep = (2 * Math.PI) / dimensions.length;
  const points = dimensions.map((dim, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (dim.value / dim.max) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });

  const pointStr = points.map(p => `${p.x},${p.y}`).join(" ");

  // 背景网格点
  const gridLevels = Array.from({ length: levels }, (_, level) => {
    const r = ((level + 1) / levels) * radius;
    return dimensions.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(" ");
  });

  return (
    <div className="hr-radar-container">
      <svg viewBox={`0 0 ${size} ${size}`} className="hr-radar-svg">
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.08" />
          </linearGradient>
          <filter id="radarGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 背景网格 */}
        {gridLevels.map((pts, i) => (
          <polygon key={i} points={pts}
            fill={i === levels - 1 ? "#fef2f2" : "none"}
            stroke="#fecaca"
            strokeWidth="0.8"
            opacity={0.6 - i * 0.08}
          />
        ))}

        {/* 轴线 */}
        {dimensions.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return (
            <line key={i} x1={center} y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="#fecaca" strokeWidth="0.7" strokeDasharray="4,4" />
          );
        })})

        {/* 数据区域 */}
        <polygon points={pointStr} fill="url(#radarFill)" stroke="#f43f5e" strokeWidth="2" filter="url(#radarGlow)" />

        {/* 数据点和标签 */}
        {dimensions.map((dim, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const px = points[i].x;
          const py = points[i].y;
          const lx = center + (radius + 22) * Math.cos(angle);
          const ly = center + (radius + 22) * Math.sin(angle);

          return (
            <g key={i}>
              <circle cx={px} cy={py} r="5" fill="#fff" stroke="#f43f5e" strokeWidth="2" />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="hr-radar-label">
                {dim.label}
              </text>
              <text x={px} y={py - 12} textAnchor="middle" className="hr-radar-value">
                {Math.round(dim.value)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── 健康指标卡片 ────────────────────────────────
function HealthMetric({
  icon,
  title,
  value,
  unit,
  status,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  status: "good" | "warning" | "danger";
  detail?: string;
}) {
  const statusConfig = {
    good: { icon: CheckCircle2, cls: "hr-metric-good", text: "正常" },
    warning: { icon: AlertTriangle, cls: "hr-metric-warn", text: "注意" },
    danger: { icon: AlertCircle, cls: "hr-metric-danger", text: "异常" },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className={`hr-metric-card ${statusConfig[status].cls}`}>
      <div className="hr-metric-icon-wrap">{icon}</div>
      <div className="hr-metric-body">
        <span className="hr-metric-title">{title}</span>
        <div className="hr-metric-value-row">
          <strong className="hr-metric-value">{value}</strong>
          {unit && <span className="hr-metric-unit">{unit}</span>}
          <StatusIcon size={16} className="hr-status-indicator" />
        </div>
        {detail && <p className="hr-metric-detail">{detail}</p>}
      </div>
    </div>
  );
}

// ── 检查项目行 ──────────────────────────────────
function CheckItem({ name, result, date, status }: { name: string; result: string; date: string; status: "normal" | "abnormal" | "pending" }) {
  return (
    <div className={`hr-check-item hr-check-${status}`}>
      <div className="hr-check-left">
        <span className="hr-check-name">{name}</span>
        <span className="hr-check-result">{result}</span>
      </div>
      <div className="hr-check-right">
        <span className={`hr-check-badge status-${status}`}>{status === "normal" ? "正常" : status === "abnormal" ? "异常" : "待检"}</span>
        <span className="hr-check-date">{date}</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════
export default function HealthReportAnalysis() {
  const navigate = useNavigate();
  const { phone, selectedPetId, selectedPet, pets } = useShell();
  const currentPet = selectedPet || pets[0] || null;

  const healthData = useMemo(() => ({
    overallScore: 82,

    radarDimensions: [
      { label: "体重", value: 85, max: 100, color: "#6366f1" },
      { label: "食欲", value: 90, max: 100, color: "#ec4899" },
      { label: "精神", value: 88, max: 100, color: "#f59e0b" },
      { label: "毛发", value: 78, max: 100, color: "#10b981" },
      { label: "消化", value: 75, max: 100, color: "#8b5cf6" },
      { label: "活力", value: 82, max: 100, color: "#ef4444" },
    ],

    metrics: [
      {
        icon: <Heart size={20} />,
        title: "心血管系统",
        value: "正常",
        status: "good" as const,
        detail: "心率稳定，心音清晰无杂音",
      },
      {
        icon: <Activity size={20} />,
        title: "体温",
        value: "38.5",
        unit: "°C",
        status: "good" as const,
        detail: "犬类正常范围：38-39°C",
      },
      {
        icon: <Droplets size={20} />,
        title: "皮肤状况",
        value: "轻微干燥",
        status: "warning" as const,
        detail: "建议补充Omega脂肪酸，增加饮水量",
      },
      {
        icon: <Shield size={20} />,
        title: "免疫状态",
        value: "良好",
        status: "good" as const,
        detail: "核心疫苗已接种完成，抗体水平充足",
      },
    ],

    checkItems: [
      { name: "血常规", result: "各项指标在正常范围内", date: "2026-03-15", status: "normal" as const },
      { name: "生化检测", result: "肝肾功能正常", date: "2026-03-15", status: "normal" as const },
      { name: "粪便检查", result: "未见寄生虫卵", date: "2026-02-01", status: "normal" as const },
      { name: "尿液分析", result: "尿比重略高", date: "2026-03-15", status: "abnormal" as const },
      { name: "心电图", result: "窦性心律，心率正常", date: "2025-11-10", status: "pending" as const },
      { name: "眼科检查", result: "--", date: "未检查", status: "pending" as const },
    ],
  }), []);

  return (
    <main className="hr-page">
      {/* ═══ 渐变头部（红色调） ═══ */}
      <header className="hr-header">
        <div className="hr-header-bg">
          <button className="hr-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="hr-header-title">健康报告</h1>
          <p className="hr-header-sub">
            {currentPet?.name || "宠物"} · 综合体检报告 · {new Date().toISOString().slice(0, 10)}
          </p>
        </div>

        {/* 综合评分卡片 */}
        <div className="hr-score-card">
          <div className="hr-score-top">
            <Stethoscope size={24} className="hr-score-icon" />
            <span className="hr-score-label">综合健康评分</span>
            <span className="hr-score-badge">
              {healthData.overallScore}<small>分</small>
            </span>
          </div>
          <div className="hr-bar-track">
            <div className="hr-bar-fill" style={{ width: `${healthData.overallScore}%` }} />
          </div>
          <p className="hr-hint">整体健康状况良好，少数指标需要关注</p>
        </div>
      </header>

      {/* ═══ 雷达图：六维健康评估 ═══ */}
      <section className="hr-radar-section">
        <h2 className="hr-section-title"><Activity size={18} /> 六维健康评估</h2>
        <div className="hr-radar-card">
          <RadarChart dimensions={healthData.radarDimensions} />

          {/* 维度说明 */}
          <div className="hr-dimension-list">
            {healthData.radarDimensions.map((dim) => (
              <div key={dim.label} className="hr-dimension-item">
                <span className="hr-dim-dot" style={{ background: dim.color }}></span>
                <span className="hr-dim-name">{dim.label}</span>
                <span className="hr-dim-val">{dim.value}%</span>
                <div className="hr-dim-bar">
                  <div className="hr-dim-fill" style={{ width: `${dim.value}%`, background: `linear-gradient(90deg, ${dim.color}, ${dim.color}99)` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 核心健康指标 ═══ */}
      <section className="hr-metrics-section">
        <h2 className="hr-section-title"><Heart size={18} /> 核心指标</h2>
        <div className="hr-metrics-grid">
          {healthData.metrics.map((metric, i) => (
            <HealthMetric key={i} {...metric} />
          ))}
        </div>
      </section>

      {/* ═══ 检查项目清单 ═══ */}
      <section className="hr-checks-section">
        <h2 className="hr-section-title"><Thermometer size={18} /> 检查记录</h2>
        <div className="hr-checks-card">
          {healthData.checkItems.map((item, i) => (
            <CheckItem key={i} {...item} />
          ))}
        </div>

        {/* 异常项提示 */}
        <div className="hr-abnormal-alert">
          <AlertCircle size={18} />
          <div>
            <strong>发现 1 项需关注：</strong> 尿液分析显示尿比重略高，建议增加饮水量并复查。
          </div>
        </div>
      </section>

      {/* ═══ 健康建议 ═══ */}
      <section className="hr-advice-section">
        <h2 className="hr-section-title"><CheckCircle2 size={18} /> 健康建议</h2>
        <div className="hr-advice-card">
          <div className="hr-advice-item">
            <span className="hr-advice-icon">💧</span>
            <div className="hr-advice-content">
              <h4>改善水分摄入</h4>
              <p>当前饮水量偏低。建议更换自动饮水机，每日保证500ml+饮水。可在水中少量添加低钠鸡汤增加适口性。</p>
            </div>
          </div>
          <div className="hr-advice-item">
            <span className="hr-advice-icon">🥗</span>
            <div className="hr-advice-content">
              <h4>皮肤护理方案</h4>
              <p>秋冬季节皮肤易干燥。每周使用宠物润肤乳按摩一次，饮食中添加鱼油或亚麻籽油，每次洗澡间隔延长至3周。</p>
            </div>
          </div>
          <div className="hr-advice-item">
            <span className="hr-advice-icon">📅</span>
            <div className="hr-advice-content">
              <h4>下次体检计划</h4>
              <p>建议于2026年9月进行年度全面体检，重点复查尿液分析和心电图。日常关注排便、排尿频率和状态变化。</p>
            </div>
          </div>
          <div className="hr-advice-item">
            <span className="hr-advice-icon">💉</span>
            <div className="hr-advice-content">
              <h4>疫苗接种提醒</h4>
              <p>狂犬疫苗将于2026年11月到期，请提前预约接种。可考虑添加犬窝咳疫苗（如常去宠物店/犬舍）。</p>
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: "32px" }} />
    </main>
  );
}
