import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  Scissors,
  Droplets,
  Wind,
  Sparkles,
  Sun,
  Heart,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import "../beauty-analysis.css";

// ── 护理记录项 ───────────────────────────────
function CareRecordItem({
  icon,
  label,
  time,
}: {
  icon: React.ReactNode;
  label: string;
  time: string;
}) {
  return (
    <div className="beauty-care-item">
      <div className="beauty-care-icon-wrap">{icon}</div>
      <span className="beauty-care-label">{label}</span>
      <span className="beauty-care-time">{time}</span>
    </div>
  );
}

// ── 分析卡片 ─────────────────────────────────
function BeautyCard({
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
  const statusTag =
    status === "good"
      ? { label: "良好", cls: "beauty-status-good" }
      : status === "warning"
        ? { label: "注意", cls: "beauty-status-warn" }
        : { label: "差", cls: "beauty-status-bad" };

  return (
    <div className="beauty-card">
      <div className="beauty-card-header">
        <div className="beauty-card-title-row">
          <div className="beauty-card-icon-wrap">{icon}</div>
          <h3 className="beauty-card-title">{title}</h3>
        </div>
        <div className="beauty-card-score-row">
          <span className={`beauty-score-tag ${statusTag.cls}`}>
            {status === "good" && <CheckCircle2 size={14} />}
            {(status === "warning" || status === "danger") && (
              <AlertCircle size={14} />
            )}
            {statusTag.label}
          </span>
          <strong className="beauty-score-num">{score}分</strong>
        </div>
      </div>

      <div className="beauty-detail-list">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, status }: { label: string; value: string; status: "good" | "warning" | "danger" }) {
  return (
    <div className="beauty-detail-row">
      <span className="beauty-detail-label">{label}</span>
      <div className="beauty-detail-right">
        <span className="beauty-detail-value">{value}</span>
        {status === "good" && <CheckCircle2 size={16} className="beauty-icon-good" />}
        {(status === "warning" || status === "danger") && (
          <AlertCircle size={16} className={status === "danger" ? "beauty-icon-danger" : "beauty-icon-warn"} />
        )}
      </div>
    </div>
  );
}

function SuggestionItem({ index, text }: { index: number; text: string }) {
  return (
    <div className="beauty-suggest-item">
      <span className="beauty-suggest-num">{index}</span>
      <span className="beauty-suggest-text">{text}</span>
    </div>
  );
}

export default function BeautyAnalysis() {
  const navigate = useNavigate();

  return (
    <main className="beauty-page">
      {/* ═══ 渐变头部 ═══ */}
      <header className="beauty-header">
        <div className="beauty-header-bg">
          <button className="beauty-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={22} strokeWidth={2.5} />
          </button>
          <h1 className="beauty-header-title">美容毛发分析</h1>
          <p className="beauty-header-sub">旺财 · 金毛 · 3岁</p>
        </div>

        {/* 综合评分卡片 */}
        <div className="beauty-hero-score-card">
          <div className="beauty-hero-score-top">
            <span className="beauty-hero-score-icon">🌟</span>
            <span className="beauty-hero-score-label">毛发综合评分</span>
            <span className="beauty-hero-score-badge">75分</span>
          </div>
          <div className="beauty-hero-bar-track">
            <div className="beauty-hero-bar-fill" style={{ width: "75%" }} />
          </div>
          <p className="beauty-hero-hint">毛发状况尚可，仍有提升空间~</p>
        </div>
      </header>

      {/* ═══ 近期护理记录 ═══ */}
      <section className="beauty-section">
        <h2 className="beauty-section-title">
          <span>💇</span> 近期护理记录
        </h2>
        <div className="beauty-care-grid">
          <CareRecordItem
            icon={<Droplets size={20} />}
            label="洗澡"
            time="3天前"
          />
          <CareRecordItem
            icon={<Wind size={20} />}
            label="梳毛"
            time="今天"
          />
          <CareRecordItem
            icon={<Scissors size={20} />}
            label="修剪"
            time="2周前"
          />
          <CareRecordItem
            icon={<Sparkles size={20} />}
            label="护理"
            time="1周前"
          />
        </div>
      </section>

      {/* ═══ 毛发详细分析 ═══ */}
      <section className="beauty-section">
        <h2 className="beauty-section-title">
          <span>🔍</span> 毛发详细分析
        </h2>

        {/* 卡片1：毛发质量 */}
        <BeautyCard
          icon={<Sparkles size={18} />}
          title="毛发质量"
          score={82}
          status="good"
        >
          <DetailRow label="光泽度" value="光泽柔顺" status="good" />
          <DetailRow label="柔顺度" value="较为顺滑" status="good" />
          <DetailRow label="毛质密度" value="正常" status="good" />
          <DetailRow label="断裂情况" value="少量断毛" status="warning" />

          <div className="beauty-divider"><span><Sparkles size={14}/> 优化建议</span></div>
          <div className="beauty-suggest-list">
            <SuggestionItem index={1} text="适当补充卵磷脂和鱼油，提升毛发光泽" />
            <SuggestionItem index={2} text="使用宠物护毛素，减少毛发断裂" />
          </div>
        </BeautyCard>

        {/* 卡片2：皮肤状况 */}
        <BeautyCard
          icon={<Heart size={18} />}
          title="皮肤状况"
          score={70}
          status="warning"
        >
          <DetailRow label="皮肤干燥度" value="轻微干燥" status="warning" />
          <DetailRow label="皮屑情况" value="少量皮屑" status="warning" />
          <DetailRow label="红肿发炎" value="无" status="good" />
          <DetailRow label="油脂分泌" value="正常" status="good" />

          <div className="beauty-divider"><span><Sparkles size={14}/> 优化建议</span></div>
          <div className="beauty-suggest-list">
            <SuggestionItem index={1} text="秋冬季节注意皮肤保湿，可使用宠物润肤乳" />
            <SuggestionItem index={2} text="增加饮水量，改善皮肤干燥" />
            <SuggestionItem index={3} text="如皮屑持续增多，建议就医检查" />
          </div>
        </BeautyCard>

        {/* 卡片3：脱毛分析 */}
        <BeautyCard
          icon={<Wind size={18} />}
          title="脱毛分析"
          score={65}
          status="warning"
        >
          <DetailRow label="脱毛程度" value="换季脱毛中" status="warning" />
          <DetailRow label="脱毛类型" value="均匀脱毛" status="good" />
          <DetailRow label="局部秃毛" value="无" status="good" />
          <DetailRow label="毛根状态" value="健康" status="good" />

          <div className="beauty-divider"><span><Sparkles size={14}/> 优化建议</span></div>
          <div className="beauty-suggest-list">
            <SuggestionItem index={1} text="换季期间每天梳理2次，帮助去除浮毛" />
            <SuggestionItem index={2} text="如脱毛持续超过2个月，建议就医排查" />
            <SuggestionItem index={3} text="补充维生素B族，促进毛发生长" />
          </div>
        </BeautyCard>

        {/* 卡片4：洗护建议 */}
        <BeautyCard
          icon={<Droplets size={18} />}
          title="洗护建议"
          score={85}
          status="good"
        >
          <DetailRow label="洗澡频率" value="2-3周/次" status="good" />
          <DetailRow label="沐浴产品" value="宠物专用" status="good" />
          <DetailRow label="吹干程度" value="完全吹干" status="good" />
          <DetailRow label="护毛素" value="偶尔使用" status="warning" />

          <div className="beauty-divider"><span><Sparkles size={14}/> 优化建议</span></div>
          <div className="beauty-suggest-list">
            <SuggestionItem index={1} text="每次洗澡后使用护毛素，保护毛鳞片" />
            <SuggestionItem index={2} text="确保彻底吹干，避免皮肤病" />
            <SuggestionItem index={3} text="避免使用人用洗发水，会破坏皮肤酸碱平衡" />
          </div>
        </BeautyCard>

        {/* 卡片5：环境因素 */}
        <BeautyCard
          icon={<Sun size={18} />}
          title="环境因素"
          score={72}
          status="warning"
        >
          <DetailRow label="室内湿度" value="偏低" status="warning" />
          <DetailRow label="温度适应" value="良好" status="good" />
          <DetailRow label="日照时长" value="充足" status="good" />
          <DetailRow label="过敏源" value="未检测" status="warning" />

          <div className="beauty-divider"><span><Sparkles size={14}/> 优化建议</span></div>
          <div className="beauty-suggest-list">
            <SuggestionItem index={1} text="冬季室内使用加湿器，保持40-60%湿度" />
            <SuggestionItem index={2} text="建议做一次过敏源检测" />
            <SuggestionItem index={3} text="保持生活区域清洁，定期除螨" />
          </div>
        </BeautyCard>
      </section>

      {/* ═══ 美容护理小贴士 ═══ */}
      <section className="beauty-section beauty-tips-section">
        <h2 className="beauty-section-title">
          <span>📋</span> 美容护理小贴士
        </h2>
        <div className="beauty-tips-card">
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">🪮</span>
            <span className="beauty-tip-text">金毛建议每天梳毛1-2次，使用针梳+排梳组合</span>
          </div>
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">🛁</span>
            <span className="beauty-tip-text">洗澡水温保持在37-39°C，避免过热刺激皮肤</span>
          </div>
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">✂️</span>
            <span className="beauty-tip-text">定期修剪脚底毛和耳毛，预防打滑和耳道感染</span>
          </div>
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">💊</span>
            <span className="beauty-tip-text">换季期间补充鱼油和卵磷脂，帮助毛发健康生长</span>
          </div>
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">☀️</span>
            <span className="beauty-tip-text">适当晒太阳促进维生素D合成，但避免暴晒</span>
          </div>
        </div>
      </section>

      <div style={{ height: "32px" }} />
    </main>
  );
}
