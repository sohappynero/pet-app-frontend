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
          <p className="beauty-hero-hint">毛发评分：75分（中等水平）</p>
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
          <DetailRow label="柔顺度" value="轻度顺滑" status="good" />
          <DetailRow label="毛质密度" value="正常" status="good" />
          <DetailRow label="断裂情况" value="断毛率5-10%" status="warning" />

          <div className="beauty-divider"><span><Sparkles size={14}/> 优化建议</span></div>
          <div className="beauty-suggest-list">
            <SuggestionItem index={1} text="补充卵磷脂和鱼油，每周2-3次" />
            <SuggestionItem index={2} text="使用宠物护毛素，每次洗澡后使用" />
          </div>
        </BeautyCard>

        {/* 卡片2：皮肤状况 */}
        <BeautyCard
          icon={<Heart size={18} />}
          title="皮肤状况"
          score={70}
          status="warning"
        >
          <DetailRow label="皮肤干燥度" value="干燥度2级（轻度）" status="warning" />
          <DetailRow label="皮屑情况" value="皮屑覆盖率<10%" status="warning" />
          <DetailRow label="红肿发炎" value="无" status="good" />
          <DetailRow label="油脂分泌" value="正常" status="good" />

          <div className="beauty-divider"><span><Sparkles size={14}/> 优化建议</span></div>
          <div className="beauty-suggest-list">
            <SuggestionItem index={1} text="秋冬季节使用宠物润肤乳，每日1-2次" />
            <SuggestionItem index={2} text="每日饮水量>1000ml" />
            <SuggestionItem index={3} text="皮屑覆盖率>30%时，建议就医检查" />
          </div>
        </BeautyCard>

        {/* 卡片3：脱毛分析 */}
        <BeautyCard
          icon={<Wind size={18} />}
          title="脱毛分析"
          score={65}
          status="warning"
        >
          <DetailRow label="脱毛程度" value="每日掉毛量>50根" status="warning" />
          <DetailRow label="脱毛类型" value="均匀脱毛" status="good" />
          <DetailRow label="局部秃毛" value="无" status="good" />
          <DetailRow label="毛根状态" value="健康" status="good" />

          <div className="beauty-divider"><span><Sparkles size={14}/> 优化建议</span></div>
          <div className="beauty-suggest-list">
            <SuggestionItem index={1} text="每日梳理2次，每次15分钟" />
            <SuggestionItem index={2} text="脱毛持续>60天，建议就医排查" />
            <SuggestionItem index={3} text="补充维生素B族，每日1粒" />
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
          <DetailRow label="护毛素" value="使用频率<50%" status="warning" />

          <div className="beauty-divider"><span><Sparkles size={14}/> 优化建议</span></div>
          <div className="beauty-suggest-list">
            <SuggestionItem index={1} text="每次洗澡后使用护毛素，涂抹全身" />
            <SuggestionItem index={2} text="吹干至毛发蓬松，温度<40°C" />
            <SuggestionItem index={3} text="使用宠物专用洗发水，pH值5.5-6.5" />
          </div>
        </BeautyCard>

        {/* 卡片5：环境因素 */}
        <BeautyCard
          icon={<Sun size={18} />}
          title="环境因素"
          score={72}
          status="warning"
        >
          <DetailRow label="室内湿度" value="湿度<40%" status="warning" />
          <DetailRow label="温度适应" value="良好" status="good" />
          <DetailRow label="日照时长" value="充足" status="good" />
          <DetailRow label="过敏源" value="检测覆盖率<80%" status="warning" />

          <div className="beauty-divider"><span><Sparkles size={14}/> 优化建议</span></div>
          <div className="beauty-suggest-list">
            <SuggestionItem index={1} text="室内湿度保持在40-60%，每日监测" />
            <SuggestionItem index={2} text="每6个月进行一次过敏源检测" />
            <SuggestionItem index={3} text="每周清洁生活区域，除螨频率2次/月" />
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
            <span className="beauty-tip-text">金毛每日梳毛1-2次，每次15-20分钟</span>
          </div>
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">🛁</span>
            <span className="beauty-tip-text">洗澡水温37-39°C，使用温度计测量</span>
          </div>
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">✂️</span>
            <span className="beauty-tip-text">每2周修剪脚底毛和耳毛1次</span>
          </div>
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">💊</span>
            <span className="beauty-tip-text">换季期间每日补充鱼油和卵磷脂各1粒</span>
          </div>
          <div className="beauty-tip-item">
            <span className="beauty-tip-icon">☀️</span>
            <span className="beauty-tip-text">每日晒太阳15-30分钟，避开正午时段</span>
          </div>
        </div>
      </section>

      <div style={{ height: "32px" }} />
    </main>
  );
}
