import { useEffect, useMemo, useState } from "react";
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
import { fetchRecords, fetchAnalysisDashboard, getLocalToday, type AnalysisDashboardData } from "../lib/api";
import type { HealthRecord, RecordType } from "../types";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import { getLocalAvatar } from "../lib/pet-avatar";
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
            <stop offset="100%" stopColor="#FF8A65" stopOpacity="0.08" />
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

// ── 健康指标卡片（真·液态玻璃设计）────────────────
function HealthMetric({
  icon,
  title,
  value,
  unit,
  status,
  detail,
  index = 0,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  unit?: string;
  status: "good" | "warning" | "danger";
  detail?: string;
  index?: number;
}) {
  // 自然柔和色调 — 去掉AI味，参考Apple Liquid Glass的温暖/冷静配色
  const liquidThemes = [
    { key: "peach",  bgGradient: "linear-gradient(145deg, rgba(251,180,140,0.75), rgba(245,158,110,0.55), rgba(239,130,70,0.35))",   textColor: "#c05620" },
    { key: "lavender",bgGradient: "linear-gradient(145deg, rgba(196,181,230,0.72), rgba(167,139,250,0.52), rgba(139,92,246,0.32))", textColor: "#6d28d9" },
    { key: "mint",   bgGradient: "linear-gradient(145deg, rgba(134,226,200,0.68), rgba(52,211,153,0.48), rgba(16,185,129,0.28))",    textColor: "#047857" },
    { key: "sky",    bgGradient: "linear-gradient(145deg, rgba(147,197,253,0.65), rgba(96,165,250,0.45), rgba(59,130,246,0.25))",     textColor: "#1d4ed8" },
  ];

  const lt = liquidThemes[index % liquidThemes.length];

  const statusInfo = {
    good:   { label: "正常", color: "#059669", bg: "rgba(5,150,105,0.10)" },
    warning:{ label: "关注", color: "#b45309", bg: "rgba(180,83,9,0.10)" },
    danger: { label: "异常", color: "#dc2626", bg: "rgba(220,38,38,0.10)" },
  };
  const si = statusInfo[status];

  return (
    <article className="lg-card">
      {/* ══ 内部液体层：柔和彩色大圆角块 ══ */}
      <div className={`lg-liquid lg-liquid--${lt.key}`} style={{ background: lt.bgGradient }}>
        <div className="lg-liquid-shine" />
      </div>

      {/* ══ 玻璃表面 ══ */}
      <div className="lg-glass" />

      {/* ══ 边框高光 ══ */}
      <div className="lg-border-glow" />

      {/* ══ 内容区（深色文字） ══ */}
      <div className="lg-content">
        {/* 标题行 */}
        <div className="lg-top-row">
          <h3 className="lg-title">{title}</h3>
          <span className="lg-status-pill" style={{ color: si.color, background: si.bg }}>
            {si.label}
          </span>
        </div>

        {/* 大数字 — 用主题深色 */}
        <div className="lg-value-row">
          <span className="lg-big-number" style={{ color: lt.textColor }}>{value}</span>
          {unit && <span className="lg-unit">{unit}</span>}
        </div>

        {detail && <p className="lg-detail">{detail}</p>}
      </div>

      {/* 图标 */}
      <div className="lg-icon-float">
        {icon}
      </div>
    </article>
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

// ── 基于后端 core_metrics 客观分析数据构建核心指标 ──
function buildCoreMetrics(analysisData: AnalysisDashboardData | null) {
  const cm = analysisData?.core_metrics;
  if (!cm) {
    // 后端未返回 core_metrics 时显示加载中/无数据状态（兼容旧版）
    return [
      { icon: <Heart size={14} />, title: "心血管系统", value: "暂无数据", status: "warning" as const, detail: "正在从数据库获取分析结果..." },
      { icon: <Activity size={14} />, title: "体温", value: "--", unit: "°C" as const, status: "good" as const, detail: "正在获取..." },
      { icon: <Droplets size={14} />, title: "皮肤状况", value: "待观察", status: "good" as const, detail: "正在获取..." },
      { icon: <Shield size={14} />, title: "免疫状态", value: "--", status: "good" as const, detail: "正在获取..." },
    ];
  }

  // 状态映射：后端 status → 前端 HealthMetric status
  const mapStatus = (s: string): "good" | "warning" | "danger" => {
    if (s === "danger" || s === "no_data" && cm.cardiovascular.value === "暂无数据") return s === "danger" ? "danger" : "warning";
    if (s === "warning") return "warning";
    return "good";
  };

  return [
    {
      icon: <Heart size={14} />,
      title: "心血管系统",
      value: cm.cardiovascular.value,
      status: (cm.cardiovascular.status === "danger" ? "danger" : cm.cardiovascular.status === "warning" ? "warning" : "good") as "good" | "warning" | "danger",
      detail: cm.cardiovascular.detail,
    },
    {
      icon: <Activity size={14} />,
      title: "体温",
      value: cm.temperature.value,
      unit: cm.temperature.unit as "°C",
      status: (cm.temperature.status === "danger" ? "danger" : cm.temperature.status === "warning" ? "warning" : "good") as "good" | "warning" | "danger",
      detail: cm.temperature.detail,
    },
    {
      icon: <Droplets size={14} />,
      title: "皮肤状况",
      value: cm.skin.value,
      status: (cm.skin.status === "danger" ? "danger" : cm.skin.status === "warning" ? "warning" : "good") as "good" | "warning" | "danger",
      detail: cm.skin.detail,
    },
    {
      icon: <Shield size={14} />,
      title: "免疫状态",
      value: cm.immunity.value,
      status: (cm.immunity.status === "danger" ? "danger" : cm.immunity.status === "warning" ? "warning" : "good") as "good" | "warning" | "danger",
      detail: cm.immunity.detail,
    },
  ];
}

// ── 从真实体检记录构建检查项目列表 ───────────────
function buildCheckItems(checkupRecords: HealthRecord[]) {
  if (checkupRecords.length === 0) {
    return [
      { name: "血常规", result: "未检查", date: "--", status: "pending" as const },
      { name: "生化检测", result: "未检查", date: "--", status: "pending" as const },
      { name: "粪便检查", result: "未检查", date: "--", status: "pending" as const },
      { name: "尿液分析", result: "未检查", date: "--", status: "pending" as const },
      { name: "心电图", result: "未检查", date: "--", status: "pending" as const },
      { name: "眼科检查", result: "未检查", date: "--", status: "pending" as const },
    ];
  }
  const items: { name: string; result: string; date: string; status: "normal" | "abnormal" | "pending" }[] = [];
  for (const rec of checkupRecords.slice(0, 6)) {
    const result = (rec as Record<string, unknown>).result || rec.notes || "";
    const hasAbnormal = String(result).includes("异常") || String(result).includes("偏高");
    items.push({
      name: rec.title || (rec.type === "medical" ? "就诊记录" : "体检"),
      result: String(result).slice(0, 50) || "有记录",
      date: rec.record_date ? String(rec.record_date).slice(0, 10) : "--",
      status: hasAbnormal ? "abnormal" : "normal",
    });
  }
  return items;
}

// ══════════════════════════════════════════════════
export default function HealthReportAnalysis() {
  const navigate = useNavigate();
  const { phone, selectedPetId, selectedPet, pets } = useShell();
  const currentPet = selectedPet || pets[0] || null;

  // ── 从后端获取真实数据 ──
  const [analysisData, setAnalysisData] = useState<AnalysisDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkupRecords, setCheckupRecords] = useState<HealthRecord[]>([]);

  useEffect(() => {
    if (!currentPet?.id) return;
    setLoading(true);
    fetchAnalysisDashboard(currentPet.id)
      .then((data) => setAnalysisData(data))
      .catch((err) => console.error("健康报告数据获取失败:", err))
      .finally(() => setLoading(false));
  }, [currentPet?.id]);

  useEffect(() => {
    fetchRecords(phone, selectedPetId ?? undefined, "all")
      .then((res) => {
        // 筛选体检类型记录
        const all = res.data || [];
        setCheckupRecords(all.filter((r: HealthRecord) =>
          r.type === "checkup" || r.type === "medical" || r.type === "check_up"
        ));
      })
      .catch(console.error);
  }, [phone, selectedPetId]);

  // ── 基于真实数据构建显示内容 ──
  const healthData = useMemo(() => {
    const dims = analysisData?.dimensions;
    const overallScore = analysisData?.overall_score ?? 0;
    const summary = analysisData?.data_summary;

    // 雷达图维度 — 使用后端真实评分
    const radarDimensions = [
      { label: "体重", value: dims?.weight?.score ?? 0, max: 100, color: "#FFB84D" },
      { label: "食欲", value: dims?.diet?.score ?? 0, max: 100, color: "#FF8A65" },
      { label: "精神", value: dims?.mental?.score ?? 0, max: 100, color: "#f59e0b" },
      { label: "毛发", value: dims?.grooming?.score ?? 0, max: 100, color: "#10b981" },
      { label: "免疫", value: dims?.immunity?.score ?? 0, max: 100, color: "#FFB84D" },
      { label: "活力", value: dims?.exercise?.score ?? 0, max: 100, color: "#ef4444" },
    ];

    // ── 核心指标：基于后端客观分析数据 ──
    const metrics = buildCoreMetrics(analysisData);

    // ── 检查项目：从真实体检记录提取 ──
    const checkItems = buildCheckItems(checkupRecords);

    return { overallScore, radarDimensions, metrics, checkItems };
  }, [analysisData, checkupRecords]);

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
            {currentPet?.name || "宠物"} · 综合体检报告 · {getLocalToday()}
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
          <p className="hr-hint">
            {loading ? "正在从数据库加载分析数据..." :
              healthData.overallScore >= 75 ? "整体健康状况良好，继续保持！" :
              healthData.overallScore >= 55 ? "部分指标需要关注，请查看详细分析" :
              "需要更多关注宝贝的健康状况，建议咨询兽医"}
          </p>
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
        <h2 className="hr-section-title hr-title-cute"><Heart size={18} /> 核心健康指标 <span className="title-sparkle">✦</span></h2>
        <div className="hr-metrics-grid">
          {healthData.metrics.map((metric, i) => (
            <HealthMetric key={i} {...metric} index={i} />
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

        {/* 异常项提示 — 基于真实数据 */}
        {healthData.checkItems.some((item) => item.status === "abnormal") && (
          <div className="hr-abnormal-alert">
            <AlertCircle size={18} />
            <div>
              <strong>发现 {healthData.checkItems.filter((i) => i.status === "abnormal").length} 项需关注：</strong>
              {healthData.checkItems.filter((i) => i.status === "abnormal").map((i) => i.name).join("、")} 检查结果异常，建议咨询兽医。
            </div>
          </div>
        )}
        {!loading && healthData.checkItems.length > 0 && healthData.checkItems.every((i) => i.status === "pending") && (
          <div className="hr-abnormal-alert glass-panel" style={{ borderColor: "#f59e0b" }}>
            <Clock size={18} />
            <div>
              <strong>暂无体检记录：</strong> 建议每年至少进行 1-2 次全面体检，以便及时发现健康问题。
            </div>
          </div>
        )}
      </section>

      {/* ═══ 健康建议 — 基于API真实推荐 ═══ */}
      <section className="hr-advice-section">
        <h2 className="hr-section-title"><CheckCircle2 size={18} /> 健康建议</h2>
        <div className="hr-advice-card">
          {loading ? (
            <p style={{ color: "#999", textAlign: "center", padding: "20px" }}>正在从数据库加载分析结果...</p>
          ) : analysisData?.recommendations && analysisData.recommendations.length > 0 ? (
            analysisData.recommendations.map((rec, i) => (
              <div key={i} className="hr-advice-item">
                <span className="hr-advice-icon">{rec.priority === "high" ? "⚠️" : rec.priority === "medium" ? "💡" : "✅"}</span>
                <div className="hr-advice-content">
                  <h4>{rec.category === "vaccine" ? "疫苗接种" : rec.category === "deworm" ? "驱虫提醒" : rec.category === "weight" ? "体重管理" : rec.category === "diet" ? "饮食营养" : "健康建议"}</h4>
                  <p>{rec.text}</p>
                </div>
              </div>
            ))
          ) : analysisData?.data_summary ? (
            <>
              <div className="hr-advice-item">
                <span className="hr-advice-icon">📊</span>
                <div className="hr-advice-content">
                  <h4>数据概况</h4>
                  <p>当前共有 {analysisData.data_summary.observations || 0} 条观察记录、{analysisData.data_summary.vaccines || 0} 条疫苗记录、{analysisData.data_summary.checkups || 0} 条体检记录。建议持续记录以获得更准确的健康分析。</p>
                </div>
              </div>
              {analysisData.data_summary.observations === 0 && (
                <div className="hr-advice-item">
                  <span className="hr-advice-icon">📝</span>
                  <div className="hr-advice-content">
                    <h4>开始记录</h4>
                    <p>暂无日常观察记录。建议每天记录宝贝的食欲、精神状态、排便情况等，帮助系统进行健康趋势分析。</p>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>

      <div style={{ height: "32px" }} />
    </main>
  );
}
