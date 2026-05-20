import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  UtensilsCrossed,
  Dumbbell,
  Syringe,
  Heart,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { fetchRecords, updatePet } from "../lib/api";
import { useShell } from "../hooks/useShell";
import type { HealthRecord, RecordType } from "../types";
import PetPhotoAvatar from "../components/PetPhotoAvatar";

type AnalysisTab = "all" | "health" | "trend" | "diet" | "vaccine" | "exercise" | "beauty";

const tabItems: { key: AnalysisTab; label: string; count: number }[] = [
  { key: "all", label: "全部", count: 6 },
  { key: "health", label: "健康报告", count: 1 },
  { key: "trend", label: "趋势分析", count: 1 },
  { key: "diet", label: "饮食建议", count: 1 },
  { key: "vaccine", label: "疫苗提醒", count: 1 },
  { key: "exercise", label: "运动建议", count: 1 },
  { key: "beauty", label: "美容毛发", count: 1 },
];

const quickItems: { icon: React.ReactNode; label: string; color: string; bg: string; shadow: string; tab: AnalysisTab }[] = [
  {
    icon: <Activity size={24} />,
    label: "健康报告",
    color: "#ff6b81",
    bg: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)",
    shadow: "0 4px 16px rgba(255,107,129,0.35)",
    tab: "health",
  },
  {
    icon: <TrendingUp size={24} />,
    label: "体重趋势",
    color: "#54a0ff",
    bg: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    shadow: "0 4px 16px rgba(84,160,255,0.35)",
    tab: "trend",
  },
  {
    icon: <UtensilsCrossed size={24} />,
    label: "饮食分析",
    color: "#feca57",
    bg: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    shadow: "0 4px 16px rgba(254,202,87,0.35)",
    tab: "diet",
  },
  {
    icon: <Dumbbell size={24} />,
    label: "运动建议",
    color: "#a55eea",
    bg: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)",
    shadow: "0 4px 16px rgba(165,94,234,0.35)",
    tab: "exercise",
  },
  {
    icon: <Scissors size={24} />,
    label: "美容毛发",
    color: "#fd79a8",
    bg: "linear-gradient(135deg, #fdcbf5 0%, #fbc2eb 50%, #fd9fc7 100%)",
    shadow: "0 4px 16px rgba(253,121,168,0.35)",
    tab: "beauty",
  },
];

function petEmoji(species?: string) {
  if (species === "cat") return "🐱";
  if (species === "other") return "🐰";
  return "🐕";
}

/** localStorage key 前缀：按 pet id 存储本地头像 */
const AVATAR_LS_KEY = (petId: number) => `pet_avatar_${petId}`;

function getLocalAvatar(petId: number): string | null {
  try { return localStorage.getItem(AVATAR_LS_KEY(petId)); } catch { return null; }
}

function saveLocalAvatar(petId: number, url: string) {
  try { localStorage.setItem(AVATAR_LS_KEY(petId), url); } catch {}
}

/** 处理宠物头像上传 */
function handlePetAvatarUpload(
  e: React.ChangeEvent<HTMLInputElement>,
  pet: any,
  phone: string,
  onSuccess: (newImageUrl: string) => void,
) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("请选择图片文件");
    return;
  }
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const image_url = ev.target?.result as string;
    onSuccess(image_url);
    saveLocalAvatar(pet.id, image_url);
    try { await updatePet(pet.id, { image_url }, phone); } catch {}
  };
  reader.readAsDataURL(file);
}

// ── 状态图标 ──────────────────────────────────────────────
function StatusIcon({ status }: { status: "good" | "warning" | "danger" }) {
  if (status === "good")
    return <CheckCircle2 size={18} className="ai-status-icon ai-status-good" />;
  if (status === "warning")
    return <Clock size={18} className="ai-status-icon ai-status-warning" />;
  return <AlertCircle size={18} className="ai-status-icon ai-status-danger" />;
}

// ── 分析卡片组件 ─────────────────────────────────────────
function AnalysisCard({
  children,
  category,
}: {
  children: React.ReactNode;
  category: AnalysisTab;
}) {
  return <div className="ai-card" data-category={category}>{children}</div>;
}

function CardHeader({
  icon,
  title,
  date,
  score,
}: {
  icon: React.ReactNode;
  title: string;
  date: string;
  score: number;
}) {
  const scoreColor = score >= 80 ? "ai-score-good" : score >= 60 ? "ai-score-mid" : "ai-score-bad";

  return (
    <div className="ai-card-header">
      <div className="ai-card-header-left">
        <div className="ai-card-icon-wrap">{icon}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, flex: 1 }}>
          <h3 className="ai-card-title">{title}</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="ai-card-date">{date}</span>
          </div>
        </div>
      </div>
      <div className={`ai-score-badge ${scoreColor}`}>
        <strong>{score}</strong>分
      </div>
    </div>
  );
}

function CardSummary({ text }: { text: string }) {
  return <p className="ai-card-summary">{text}</p>;
}

function DetailRow({ label, value, status }: { label: string; value: string; status: "good" | "warning" | "danger" }) {
  return (
    <div className="ai-detail-row">
      <span className="ai-detail-label">{label}</span>
      <div className="ai-detail-right">
        <span className="ai-detail-value">{value}</span>
        <StatusIcon status={status} />
      </div>
    </div>
  );
}

function SuggestionItem({ index, text }: { index: number; text: string }) {
  return (
    <div className="ai-suggest-item">
      <span className="ai-suggest-num">{index}</span>
      <span className="ai-suggest-text">{text}</span>
    </div>
  );
}

export default function AiAnalysis() {
  const navigate = useNavigate();
  const { phone, selectedPetId, selectedPet, pets } = useShell();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AnalysisTab>("all");
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  const currentPet = useMemo(
    () => selectedPet || pets[0] || null,
    [selectedPet, pets]
  );

  // 初始化时从 localStorage 读取已保存的头像
  useEffect(() => {
    if (currentPet) {
      const saved = getLocalAvatar(currentPet.id);
      if (saved) setLocalAvatarUrl(saved);
    }
  }, [currentPet?.id]);

  // 合并本地存储的 avatar URL
  const displayPet = useMemo(() => {
    if (!currentPet) return null;
    const local = localAvatarUrl || getLocalAvatar(currentPet.id);
    return local ? { ...currentPet, image_url: local } : currentPet;
  }, [currentPet, localAvatarUrl]);

  useEffect(() => {
    setLoading(true);
    fetchRecords(phone, selectedPetId ?? undefined, "all")
      .then((res) => setRecords(res.data || []))
      .finally(() => setLoading(false));
  }, [phone, selectedPetId]);

  // ── 从真实数据生成智能分析 ────────────────────────────

  // 体重数据
  const weightRecords = useMemo(() =>
    records.filter(r => r.weight_kg !== null && !Number.isNaN(Number(r.weight_kg)))
      .sort((a, b) => b.record_date.localeCompare(a.record_date)),
    [records]
  );

  // 疫苗数据
  const vaccineRecords = useMemo(() =>
    records.filter(r => r.record_type === "vaccine")
      .sort((a, b) => b.record_date.localeCompare(a.record_date)),
    [records]
  );

  // 驱虫数据
  const dewormRecords = useMemo(() =>
    records.filter(r => r.record_type === "deworm")
      .sort((a, b) => b.record_date.localeCompare(a.record_date)),
    [records]
  );

  // 综合健康评分（基于数据丰富度）
  const overallScore = useMemo(() => {
    let score = 50;
    if (weightRecords.length > 0) score += 10;
    if (weightRecords.length >= 3) score += 5;
    if (vaccineRecords.length > 0) score += 10;
    if (dewormRecords.length > 0) score += 10;
    if (records.length >= 5) score += 10;
    // 基于时间新鲜度加分
    if (records.length > 0) {
      const latest = new Date(records[0].record_date);
      const daysDiff = Math.floor((Date.now() - latest.getTime()) / 86400000);
      if (daysDiff <= 30) score += 10;
      else if (daysDiff <= 90) score += 5;
    }
    return Math.min(Math.max(score, 40), 95);
  }, [records, weightRecords, vaccineRecords, dewormRecords]);

  // 体重趋势分析分数
  const weightScore = useMemo(() => {
    if (weightRecords.length === 0) return 60;
    if (weightRecords.length >= 1) return 78;
    return 70;
  }, [weightRecords]);

  // 疫苗提醒分数
  const vaccineScore = useMemo(() => {
    if (vaccineRecords.length === 0) return 45;
    const latest = new Date(vaccineRecords[0].record_date);
    const daysSince = Math.floor((Date.now() - latest.getTime()) / 86400000);
    if (daysSince > 365) return 40;
    if (daysSince > 180) return 55;
    return 60;
  }, [vaccineRecords]);

  // 饮食建议分数（模拟）
  const dietScore = 72;

  // 运动建议分数（模拟）
  const exerciseScore = 68;

  // 美容毛发分数（模拟）
  const beautyScore = 75;

  // 当前体重
  const currentWeight = weightRecords[0]?.weight_kg ?? null;
  const prevWeight = weightRecords[1]?.weight_kg ?? null;
  const weightDiff = currentWeight && prevWeight ? Number((currentWeight - prevWeight).toFixed(1)) : null;

  // 疫苗下次到期时间（模拟：最近疫苗 + 365天）
  const nextVaccineDue = vaccineRecords[0]
    ? (() => {
        const d = new Date(vaccineRecords[0].record_date);
        d.setFullYear(d.getFullYear() + 1);
        const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
        return `${diff}天后到期`;
      })()
    : "未知";

  // 下次体检时间
  const checkupRecords = records.filter(r => r.record_type === "checkup").sort(
    (a, b) => b.record_date.localeCompare(a.record_date)
  );
  const nextCheckup = checkupRecords[0]
    ? (() => {
        const d = new Date(checkupRecords[0].record_date);
        d.setMonth(d.getMonth() + 12);
        const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
        return `${Math.max(days, 30)}天后`;
      })()
    : "30天后";

  // 卡片是否显示（根据当前 tab）
  const isCardVisible = (category: string) =>
    activeTab === "all" || category === activeTab;

  return (
    <main className="ai-page">
      {/* ═══ Hero 区域 ═══ */}
      <section className="ai-hero">
        <div className="ai-hero-bg">
          <div className="ai-hero-gradient" />
          <div className="ai-hero-orb ai-orb-1" />
          <div className="ai-hero-orb ai-orb-2" />
          <div className="ai-hero-orb ai-orb-3" />
          <div className="ai-hero-grid-pattern" />
          {/* 浮动装饰 */}
          <span className="ai-float-deco ai-float-1">✨</span>
          <span className="ai-float-deco ai-float-3">⭐</span>
        </div>

        <button className="ai-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={22} strokeWidth={2.2} />
        </button>

        <h1 className="ai-hero-title">智能分析</h1>

        <div className="ai-hero-body">
          <div className="ai-hero-left">
            <div className="ai-avatar-wrap">
              <PetPhotoAvatar pet={displayPet || currentPet} size="default" className="hero-circular-avatar" />
            </div>
            <div className="ai-hero-info">
              <h2 className="ai-hero-subtitle">智能健康分析</h2>
              <p className="ai-hero-pet-name">
                {currentPet ? currentPet.name : "宠物"} · {currentPet?.name || "宝贝"}
              </p>
            </div>
          </div>

          <div className="ai-score-ring-wrap">
            <div className={`ai-overall-score ${overallScore >= 80 ? "score-high" : overallScore >= 60 ? "score-mid" : "score-low"} score-animated`}>
              <span className="ai-score-number">{overallScore}</span>
            </div>
            <span className="ai-score-orb ai-score-star">⭐</span>
            <span className="ai-score-orb ai-score-paw">🐾</span>
            <span className="ai-score-orb ai-score-heart">💖</span>
          </div>
        </div>

        <div className="ai-hero-search-bar">
          <input type="text" placeholder="搜索分析结果..." className="ai-search-input" readOnly />
        </div>
      </section>

      {/* ═══ Tab 栏 ═══ */}
      <section className="ai-tabs-section">
        <div className="ai-tabs-scroll">
          {tabItems.map((tab) => (
            <button
              key={tab.key}
              className={`ai-tab ${activeTab === tab.key ? "ai-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && <span className="ai-tab-count">({tab.count})</span>}
            </button>
          ))}
        </div>
      </section>

      {/* ═══ 快速分析入口 ═══ */}
      <section className="ai-quick-section">
        <h3 className="ai-section-title">快速分析</h3>
        <div className="ai-quick-grid">
          {quickItems.map((item) => (
            <button
              key={item.label}
              className="ai-quick-btn"
              style={{ background: item.bg, boxShadow: item.shadow }}
                onClick={() => item.tab === "beauty" ? navigate("/app/beauty-analysis") : setActiveTab(item.tab)}
            >
              <span className="ai-quick-icon" style={{ color: item.color }}>{item.icon}</span>
              <span className="ai-quick-label">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ═══ 分析卡片列表 ═══ */}
      <section className="ai-cards-section">

        {/* 卡片1：综合健康评分 - health */}
        {isCardVisible("health") && (
          <AnalysisCard category="health">
            <CardHeader
              icon={<Heart size={20} />}
              title="综合健康评分"
              date={new Date().toISOString().slice(0, 10)}
              score={overallScore}
            />
            <CardSummary text={overallScore >= 75 ? "宝贝整体健康状况良好，继续保持！" : "宝贝需要更多关注，请查看详细指标"} />

            <div className="ai-divider"><span>详细指标</span></div>

            <div className="ai-detail-list">
              <DetailRow label="体重状况" value={currentWeight ? `${Number(currentWeight).toFixed(1)}kg` : "暂无记录"} status={currentWeight ? "good" : "warning"} />
              <DetailRow label="食欲状况" value="良好" status="good" />
              <DetailRow label="精神状态" value="活泼" status="good" />
              <DetailRow label="毛发状况" value="光泽" status="good" />
            </div>

            <div className="ai-divider"><span>优化建议</span></div>

            <div className="ai-suggest-list">
              <SuggestionItem index={1} text="继续保持当前的饮食和运动习惯" />
              <SuggestionItem index={2} text="建议每周记录一次体重" />
              <SuggestionItem index={3} text="注意观察排便情况" />
            </div>
          </AnalysisCard>
        )}

        {/* 卡片2：体重趋势分析 - trend */}
        {isCardVisible("trend") && (
          <AnalysisCard category="trend">
            <CardHeader
              icon={<TrendingUp size={20} />}
              title="体重趋势分析"
              date={new Date().toISOString().slice(0, 10)}
              score={weightScore}
            />
            <CardSummary text={
              currentWeight
                ? `体重在正常范围内${weightDiff !== null ? (weightDiff > 0 ? `，略有上升趋势 (+${weightDiff}kg)` : weightDiff < 0 ? `，略有下降趋势 (${weightDiff}kg)` : "" ) : ""}`
                : "暂无足够体重数据进行趋势分析"
            } />

            <div className="ai-divider"><span>详细指标</span></div>

            <div className="ai-detail-list">
              <DetailRow label="当前体重" value={currentWeight ? `${Number(currentWeight).toFixed(1)}kg` : "--"} status="good" />
              <DetailRow label="理想体重" value={`${currentWeight ? (Number(currentWeight) * 0.96).toFixed(0) : '24'}-${currentWeight ? (Number(currentWeight) * 1.04).toFixed(0) : '26'}kg`} status="good" />
              <DetailRow label="月增长" value={weightDiff ? `${weightDiff > 0 ? '+' : ''}${(weightDiff * 3).toFixed(1)}kg` : "+0.3kg"} status="warning" />
              <DetailRow label="趋势判断" value={weightDiff && weightDiff > 0.3 ? "略增" : weightDiff && weightDiff < -0.3 ? "略降" : "稳定"} status="warning" />
            </div>

            <div className="ai-divider"><span>优化建议</span></div>

            <div className="ai-suggest-list">
              <SuggestionItem index={1} text="适当增加运动量，每天散步至少30分钟" />
              <SuggestionItem index={2} text="控制零食摄入量" />
              <SuggestionItem index={3} text="建议减少10%的日粮" />
            </div>
          </AnalysisCard>
        )}

        {/* 卡片3：饮食建议 - diet */}
        {isCardVisible("diet") && (
          <AnalysisCard category="diet">
            <CardHeader
              icon={<UtensilsCrossed size={20} />}
              title="饮食建议"
              date={new Date().toISOString().slice(0, 10)}
              score={dietScore}
            />
            <CardSummary text="营养摄入基本均衡，但蛋白质略显不足" />

            <div className="ai-divider"><span>详细指标</span></div>

            <div className="ai-detail-list">
              <DetailRow label="日粮类型" value="成犬粮" status="good" />
              <DetailRow label="喂食量" value={`${currentWeight ? Math.round(Number(currentWeight) * 12) : 300}g/天`} status="good" />
              <DetailRow label="蛋白质" value="偏低" status="warning" />
              <DetailRow label="纤维素" value="正常" status="good" />
            </div>

            <div className="ai-divider"><span>优化建议</span></div>

            <div className="ai-suggest-list">
              <SuggestionItem index={1} text="可适量添加鸡胸肉或鸡蛋补充蛋白质" />
              <SuggestionItem index={2} text="建议添加适量的蔬菜，如胡萝卜、南瓜" />
              <SuggestionItem index={3} text="保持充足饮水，每天至少500ml" />
            </div>
          </AnalysisCard>
        )}

        {/* 卡片4：运动建议 - exercise */}
        {isCardVisible("exercise") && (
          <AnalysisCard category="exercise">
            <CardHeader
              icon={<Dumbbell size={20} />}
              title="运动建议"
              date={new Date().toISOString().slice(0, 10)}
              score={exerciseScore}
            />
            <CardSummary text="运动量略显不足，需要加强锻炼" />

            <div className="ai-divider"><span>详细指标</span></div>

            <div className="ai-detail-list">
              <DetailRow label="当前运动" value="20分钟/天" status="warning" />
              <DetailRow label="推荐运动" value="60分钟/天" status="good" />
              <DetailRow label="运动类型" value="散步" status="good" />
              <DetailRow label="运动达标" value="33%" status="danger" />
            </div>

            <div className="ai-divider"><span>优化建议</span></div>

            <div className="ai-suggest-list">
              <SuggestionItem index={1} text="金毛属于中大型犬，每天需要至少60分钟运动" />
              <SuggestionItem index={2} text="建议早晚各散步一次，每次30分钟" />
              <SuggestionItem index={3} text="可以增加一些互动游戏，如捡球、飞盘" />
            </div>
          </AnalysisCard>
        )}

        {/* 卡片5：疫苗提醒 - vaccine */}
        {isCardVisible("vaccine") && (
          <AnalysisCard category="vaccine">
            <CardHeader
              icon={<Syringe size={20} />}
              title="疫苗提醒"
              date={new Date().toISOString().slice(0, 10)}
              score={vaccineScore}
            />
            <CardSummary text="狂犬疫苗即将到期，请及时补种" />

            <div className="ai-divider"><span>详细指标</span></div>

            <div className="ai-detail-list">
              <DetailRow label="狂犬疫苗" value={nextVaccineDue} status={vaccineScore < 50 ? "danger" : "warning"} />
              <DetailRow label="联苗" value={vaccineRecords.length > 0 ? "已接种" : "未接种"} status={vaccineRecords.length > 0 ? "good" : "danger"} />
              <DetailRow label="下次体检" value={nextCheckup} status="warning" />
              <DetailRow label="驱虫" value={dewormRecords.length > 0 ? "已做" : "未做"} status={dewormRecords.length > 0 ? "good" : "danger"} />
            </div>

            <div className="ai-divider"><span>优化建议</span></div>

            <div className="ai-suggest-list">
              <SuggestionItem index={1} text="请在一周内带宝贝接种狂犬疫苗" />
              <SuggestionItem index={2} text="体检前请提前预约" />
              <SuggestionItem index={3} text="驱虫建议每季度进行一次" />
            </div>
          </AnalysisCard>
        )}

        {/* 卡片6：美容毛发分析 - beauty */}
        {isCardVisible("beauty") && (
          <AnalysisCard category="beauty">
            <CardHeader
              icon={<Scissors size={20} />}
              title="美容毛发分析"
              date="2024-01-14"
              score={beautyScore}
            />
            <CardSummary text="毛发整体状态良好，但近期出现轻微打结，建议加强日常梳理" />

            <div className="ai-divider"><span>详细指标</span></div>

            <div className="ai-detail-list">
              <DetailRow label="毛发光泽度" value="良好" status="good" />
              <DetailRow label="打结情况" value="轻微打结" status="warning" />
              <DetailRow label="皮屑状况" value="无皮屑" status="good" />
              <DetailRow label="脱毛程度" value="换季脱毛" status="warning" />
            </div>

            <div className="ai-divider"><span>优化建议</span></div>

            <div className="ai-suggest-list">
              <SuggestionItem index={1} text="建议每天梳理毛发1-2次，预防打结" />
              <SuggestionItem index={2} text="换季期间适当补充鱼油，改善毛质" />
              <SuggestionItem index={3} text="每2-3周洗一次澡，使用宠物专用沐浴露" />
              <SuggestionItem index={4} text="定期修剪脚底毛和耳毛，保持清洁" />
            </div>
          </AnalysisCard>
        )}

      </section>

      {/* 底部留白 */}
      <div style={{ height: "32px" }} />
    </main>
  );
}
