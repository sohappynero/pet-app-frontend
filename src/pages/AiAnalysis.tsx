import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { fetchRecords, fetchAnalysisDashboard, getLocalToday, type AnalysisDashboardData } from "../lib/api";
import { useShell } from "../hooks/useShell";
import type { HealthRecord, RecordType } from "../types";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import { getLocalAvatar } from "../lib/pet-avatar";
import type { QuotaError } from "../lib/pet-mind.api";
import QuotaHintModal from "../components/PetChat/QuotaHintModal";

type AnalysisTab = "all" | "health" | "trend" | "diet" | "vaccine" | "exercise" | "beauty";

const tabItems: { key: AnalysisTab; label: string; count?: number }[] = [
  { key: "all", label: "全部" },
  { key: "health", label: "健康报告" },
  { key: "trend", label: "趋势分析" },
  { key: "diet", label: "饮食建议" },
  { key: "vaccine", label: "疫苗提醒" },
  { key: "exercise", label: "运动建议" },
  { key: "beauty", label: "美容毛发" },
];

const quickItems: { icon: React.ReactNode; label: string; color: string; bg: string; shadow: string; tab: AnalysisTab }[] = [
  { icon: <Activity size={24} />, label: "健康报告", color: "#ff6b81", bg: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)", shadow: "0 4px 16px rgba(255,107,129,0.35)", tab: "health" },
  { icon: <TrendingUp size={24} />, label: "体重趋势", color: "#54a0ff", bg: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)", shadow: "0 4px 16px rgba(84,160,255,0.35)", tab: "trend" },
  { icon: <UtensilsCrossed size={24} />, label: "饮食分析", color: "#feca57", bg: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", shadow: "0 4px 16px rgba(254,202,87,0.35)", tab: "diet" },
  { icon: <Dumbbell size={24} />, label: "运动建议", color: "#a55eea", bg: "linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)", shadow: "0 4px 16px rgba(165,94,234,0.35)", tab: "exercise" },
  { icon: <Scissors size={24} />, label: "美容毛发", color: "#FF8A65", bg: "linear-gradient(135deg, #fdcbf5 0%, #fbc2eb 50%, #fd9fc7 100%)", shadow: "0 4px 16px rgba(253,121,168,0.35)", tab: "beauty" },
];

function StatusIcon({ status }: { status: "good" | "warning" | "danger" }) {
  if (status === "good") return <CheckCircle2 size={18} className="ai-status-icon ai-status-good" />;
  if (status === "warning") return <Clock size={18} className="ai-status-icon ai-status-warning" />;
  return <AlertCircle size={18} className="ai-status-icon ai-status-danger" />;
}

function AnalysisCard({ children, category }: { children: React.ReactNode; category: AnalysisTab }) {
  return <div className="ai-card" data-category={category}>{children}</div>;
}

function CardHeader({ icon, title, date, score }: { icon: React.ReactNode; title: string; date: string; score: number }) {
  const scoreColor = score >= 80 ? "ai-score-good" : score >= 60 ? "ai-score-mid" : "ai-score-bad";
  return (
    <div className="ai-card-header">
      <div className="ai-card-header-left">
        <div className="ai-card-icon-wrap">{icon}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, flex: 1 }}>
          <h3 className="ai-card-title">{title}</h3>
          <span className="ai-card-date">{date}</span>
        </div>
      </div>
      <div className={`ai-score-badge ${scoreColor}`}><strong>{score}</strong>分</div>
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
      <div className="ai-detail-right"><span className="ai-detail-value">{value}</span><StatusIcon status={status} /></div>
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

/** 根据分数返回状态 */
function _s(score: number): "good" | "warning" | "danger" {
  if (score >= 75) return "good";
  if (score >= 55) return "warning";
  return "danger";
}

export default function AiAnalysis() {
  const navigate = useNavigate();
  const { phone, selectedPetId, selectedPet, pets } = useShell();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AnalysisTab>("all");
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  // ── 后端真实数据 ──
  const [analysisData, setAnalysisData] = useState<AnalysisDashboardData | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaErrorData, setQuotaErrorData] = useState<QuotaError | null>(null);
  const [hintDismissed, setHintDismissed] = useState(false);

  const currentPet = useMemo(() => selectedPet || pets[0] || null, [selectedPet, pets]);

  useEffect(() => {
    if (currentPet) {
      const saved = getLocalAvatar(currentPet.id);
      if (saved) setLocalAvatarUrl(saved);
    }
  }, [currentPet?.id]);

  const displayPet = useMemo(() => {
    if (!currentPet) return null;
    const local = localAvatarUrl || getLocalAvatar(currentPet.id);
    return local ? { ...currentPet, image_url: local } : currentPet;
  }, [currentPet, localAvatarUrl]);

  // 获取健康记录（用于搜索/过滤等辅助功能）
  useEffect(() => {
    setLoading(true);
    fetchRecords(phone, selectedPetId ?? undefined, "all")
      .then((res) => setRecords(res.data || []))
      .finally(() => setLoading(false));
  }, [phone, selectedPetId]);

  // ── 核心：从后端获取AI分析真实数据 ──
  const effectivePetId = currentPet?.id || selectedPetId;
  useEffect(() => {
    if (!effectivePetId) {
      setAnalysisLoading(false);
      return;
    }
    setAnalysisLoading(true);
    setHintDismissed(false);
    fetchAnalysisDashboard(effectivePetId)
      .then((data) => setAnalysisData(data))
      .catch((err: any) => {
        if (err.status === 429 && err.quotaDetail) {
          setQuotaErrorData({
            type: "quota_exceeded",
            feature: err.quotaDetail.feature,
            used: err.quotaDetail.used,
            limit: err.quotaDetail.limit,
            plan: err.quotaDetail.plan,
            upgradeHint: err.quotaDetail.upgradeHint,
          });
          setShowQuotaModal(true);
        } else {
          console.error("分析数据获取失败:", err);
        }
      })
      .finally(() => setAnalysisLoading(false));
  }, [effectivePetId]);

  // 从后端数据派生各卡片分数（保证有值）
  const overallScore = analysisData?.overall_score ?? 0;
  const dims = analysisData?.dimensions;
  const weightScore = dims?.weight?.score ?? 60;
  const dietScore = dims?.diet?.score ?? 65;
  const exerciseScore = dims?.exercise?.score ?? 60;
  const immunityScore = dims?.immunity?.score ?? 70;
  const groomingScore = dims?.grooming?.score ?? 68;
  const mentalScore = dims?.mental?.score ?? 72;
  const vaccineScore = immunityScore;  // 疫苗用免疫维度分
  const beautyScore = groomingScore;   // 美容用毛发维度分

  // 体重详情
  const wd = analysisData?.weight_detail;
  const currentWeight = wd?.current_kg;
  const prevWeight = wd?.prev_kg;
  const weightDiff = wd?.diff_kg;

  // 疫苗提醒
  const vacAlerts = analysisData?.vaccine_alerts || [];
  const dewAlerts = analysisData?.deworm_alerts || [];

  // 建议
  const recs = analysisData?.recommendations || [];
  const dataSummary = analysisData?.data_summary;

  const isCardVisible = (cat: string) => activeTab === "all" || cat === activeTab;

  const isCardVisibleBySearch = (category: string) => {
    if (!searchTerm.trim()) return true;
    const t = searchTerm.toLowerCase();
    const map: Record<string, string[]> = {
      health: ["综合健康","健康","评分","体重","食欲","精神","毛发","建议","保持"],
      trend: ["体重趋势","体重","趋势","正常范围","理想体重","月增长"],
      diet: ["饮食建议","营养","蛋白质","纤维素","日粮","鸡胸肉","鸡蛋","蔬菜","饮水"],
      exercise: ["运动建议","运动","散步","达标","互动游戏","捡球","飞盘"],
      vaccine: ["疫苗提醒","狂犬疫苗","联苗","体检","驱虫","接种","预约"],
      beauty: ["美容毛发","毛发","光泽","打结","梳理","鱼油","洗澡","修剪","清洁"],
    };
    return (map[category] || []).some(text => text.includes(t));
  };

  return (
    <main className="ai-page">
      {/* Hero */}
      <section className="ai-hero">
        <div className="ai-hero-bg">
          <div className="ai-hero-gradient" />
          <div className="ai-hero-orb ai-orb-1" /><div className="ai-hero-orb ai-orb-2" /><div className="ai-hero-orb ai-orb-3" />
          <div className="ai-hero-grid-pattern" />
          <span className="ai-float-deco ai-float-1">✨</span><span className="ai-float-deco ai-float-3">⭐</span>
        </div>

        <button className="ai-back-btn" onClick={() => navigate("/app/insights")}><ArrowLeft size={22} strokeWidth={2.2} /></button>

        <h1 className="ai-hero-title">智能分析</h1>

        <div className="ai-hero-body">
          <div className="ai-hero-left">
            <div className="ai-avatar-wrap"><PetPhotoAvatar pet={displayPet || currentPet} size="default" className="hero-circular-avatar" /></div>
            <div className="ai-hero-info">
              <h2 className="ai-hero-subtitle">智能健康分析</h2>
              <p className="ai-hero-pet-name">{currentPet ? `${currentPet.name}` : "宠物"} · {currentPet?.name || "宝贝"}</p>
            </div>
          </div>
          <div className="ai-score-ring-wrap">
            {analysisLoading ? (
              <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #eee', borderTopColor: '#667eea', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <>
                <div className={`ai-overall-score ${overallScore >= 80 ? "score-high" : overallScore >= 60 ? "score-mid" : "score-low"} score-animated`}>
                  <span className="ai-score-number">{overallScore}</span>
                </div>
                <span className="ai-score-orb ai-score-star">⭐</span><span className="ai-score-orb ai-score-paw">🐾</span><span className="ai-score-orb ai-score-heart">💖</span>
              </>
            )}
          </div>
        </div>

        <div className="ai-hero-search-bar">
          <input type="text" placeholder="搜索分析结果..." className="ai-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </section>

      {/* 新数据提示 banner */}
      {!analysisLoading && analysisData?.hint === "has_new_data" && !hintDismissed && (
        <div className="ai-hint-banner">
          <AlertCircle size={16} />
          <span>{analysisData.hint_message || "您有新的健康记录，当前分数可能已不准确，建议重新生成"}</span>
          <button onClick={() => setHintDismissed(true)}>×</button>
        </div>
      )}

      {/* Tab */}
      <section className="ai-tabs-section">
        <div className="ai-tabs-scroll">
          {tabItems.map((tab) => (
            <button key={tab.key} className={`ai-tab ${activeTab === tab.key ? "ai-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Quick nav */}
      <section className="ai-quick-section">
        <h3 className="ai-section-title">快速分析</h3>
        <div className="ai-quick-grid">
          {quickItems.map((item) => (
            <button key={item.label} className="ai-quick-btn" style={{ background: item.bg, boxShadow: item.shadow }}
              onClick={() => {
                if (item.tab === "beauty") navigate("/app/insights/beauty");
                else if (item.tab === "trend") navigate("/app/insights/weight");
                else if (item.tab === "health") navigate("/app/insights/health");
                else if (item.tab === "diet") navigate("/app/insights/diet");
                else if (item.tab === "exercise") navigate("/app/insights/exercise");
                else setActiveTab(item.tab);
              }}>
              <span className="ai-quick-icon" style={{ color: item.color }}>{item.icon}</span>
              <span className="ai-quick-label">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ═══ 分析卡片 ═══ */}
      <section className="ai-cards-section">

        {/* 卡片1：综合健康评分 */}
        {isCardVisible("health") && isCardVisibleBySearch("health") && (
          <AnalysisCard category="health">
            <CardHeader icon={<Heart size={20} />} title="综合健康评分"
              date={analysisData?.generated_at?.slice(0,10) || getLocalToday()}
              score={overallScore} />
            <CardSummary text={
              analysisLoading ? "正在从数据库加载分析数据..." :
              overallScore >= 75 ? "宝贝整体健康状况良好，继续保持！" : "宝贝需要更多关注，请查看详细指标"
            } />

            {!analysisLoading && analysisData?.ai_summary && (
              <div className="ai-summary-block glass-panel" style={{
                margin: "12px 0",
                padding: "14px 16px",
                borderLeft: "3px solid #ff9a56",
                position: "relative",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <Sparkles size={16} color="#ff9a56" />
                  <strong style={{ fontSize: 13, color: "#7a4a1f" }}>AI 健康小助手</strong>
                  {analysisData.ai_summary_from_cache && (
                    <span style={{ fontSize: 11, opacity: 0.55, marginLeft: "auto" }}>今日已生成</span>
                  )}
                </div>
                <p style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "#5a3a1a",
                  margin: 0,
                  whiteSpace: "pre-line",
                }}>
                  {analysisData.ai_summary}
                </p>
              </div>
            )}

            {!analysisLoading && dims && (<>
              <div className="ai-divider"><span>详细指标</span></div>
              <div className="ai-detail-list">
                <DetailRow label="体重状况" value={currentWeight ? `${currentWeight}kg` : "暂无记录"} status={_s(weightScore)} />
                <DetailRow label="饮食营养" value={`${dietScore}分`} status={_s(dietScore)} />
                <DetailRow label="运动活力" value={`${exerciseScore}分`} status={_s(exerciseScore)} />
                <DetailRow label="免疫预防" value={`${immunityScore}分`} status={_s(immunityScore)} />
                <DetailRow label="美容毛发" value={`${groomingScore}分`} status={_s(groomingScore)} />
                <DetailRow label="精神情绪" value={`${mentalScore}分`} status={_s(mentalScore)} />
              </div>
            </>)}

            {!analysisLoading && recs.length > 0 && (<>
              <div className="ai-divider"><span>优化建议</span></div>
              <div className="ai-suggest-list">
                {recs.slice(0, 4).map((r, i) => <SuggestionItem key={i} index={i + 1} text={r.text} />)}
              </div>
            </>)}
          </AnalysisCard>
        )}

        {/* 卡片2：体重趋势分析 */}
        {isCardVisible("trend") && isCardVisibleBySearch("trend") && (
          <AnalysisCard category="trend">
            <CardHeader icon={<TrendingUp size={20} />} title="体重趋势分析"
              date={getLocalToday()} score={weightScore} />
            <CardSummary text={
              !analysisLoading && wd
                ? wd.status === "no_data" ? "暂无足够体重数据进行趋势分析"
                : `当前体重${currentWeight}kg，${weightDiff !== null && weightDiff !== undefined
                    ? (weightDiff > 0 ? `较上次上升 (+${weightDiff}kg)` : weightDiff < 0 ? `较上次下降 (${weightDiff}kg)` : "与上次持平")
                    : ""}`
                : "加载中..."
            } />

            {!analysisLoading && wd && wd.status !== "no_data" && (<>
              <div className="ai-divider"><span>详细指标</span></div>
              <div className="ai-detail-list">
                <DetailRow label="当前体重" value={`${currentWeight}kg`} status="good" />
                {prevWeight != null && <DetailRow label="上次体重" value={`${prevWeight}kg`} status="good" />}
                {weightDiff != null && <DetailRow label="变化量" value={`${weightDiff > 0 ? '+' : ''}${weightDiff}kg`}
                  status={Math.abs(weightDiff) > 0.5 ? "warning" : "good"} />}
                <DetailRow label="趋势判断"
                  value={wd.trend === "up" ? "略增" : wd.trend === "down" ? "略降" : "稳定"}
                  status={wd.trend === "stable" ? "good" : "warning"} />
                <DetailRow label="记录数量" value={`${wd.record_count || 0}条`} status={wd.record_count >= 3 ? "good" : "warning"} />
              </div>
              <div className="ai-divider"><span>优化建议</span></div>
              <div className="ai-suggest-list">
                <SuggestionItem index={1} text={weightDiff && weightDiff > 0.3 ? "适当增加运动量，每天散步至少30分钟" : "保持当前饮食习惯和运动频率"} />
                <SuggestionItem index={2} text="建议每周记录一次体重，持续追踪变化趋势" />
                <SuggestionItem index={3} text={wd.record_count < 3 ? "增加体重记录频次以获得更准确的趋势分析" : "体重波动在正常范围内，继续保持"} />
              </div>
            </>)}

            {!analysisLoading && wd?.status === "no_data" && (<>
              <div className="ai-divider"><span>提示</span></div>
              <div className="ai-suggest-list">
                <SuggestionItem index={1} text="尚未记录体重数据，请在添加记录时填写体重信息" />
                <SuggestionItem index={2} text="建议每周测量一次并记录，以便系统进行趋势分析" />
              </div>
            </>)}
          </AnalysisCard>
        )}

        {/* 卡片3：饮食建议 */}
        {isCardVisible("diet") && isCardVisibleBySearch("diet") && (
          <AnalysisCard category="diet">
            <CardHeader icon={<UtensilsCrossed size={20} />} title="饮食建议"
              date={getLocalToday()} score={dietScore} />
            <CardSummary text={!analysisLoading
              ? dietScore >= 75 ? "营养摄入状态良好，继续保持均衡饮食" : dietScore >= 55 ? "营养摄入一般，建议优化饮食结构" : "需要关注宝贝的饮食情况"
              : "加载中..."} />

            {!analysisLoading && dims?.diet && (<>
              <div className="ai-divider"><span>详细指标</span></div>
              <div className="ai-detail-list">
                <DetailRow label="饮食评分" value={`${dietScore}分`} status={_s(dietScore)} />
                <DetailRow label="样本数" value={`${dims.diet.detail.samples || 0}次观察`} status={dims.diet.detail.samples > 3 ? "good" : "warning"} />
              </div>
              <div className="ai-divider"><span>优化建议</span></div>
              <div className="ai-suggest-list">
                {dietScore < 65 ? (
                  <>
                    <SuggestionItem index={1} text="注意观察宝贝的食欲变化，如有异常请及时关注" />
                    <SuggestionItem index={2} text="可适量添加优质蛋白如鸡胸肉、鸡蛋补充营养" />
                    <SuggestionItem index={3} text="确保充足的饮水量，每日更换新鲜水源" />
                  </>
                ) : (
                  <>
                    <SuggestionItem index={1} text="继续保持当前的饮食结构和喂食规律" />
                    <SuggestionItem index={2} text="定期记录饮食情况以便追踪营养状态变化" />
                    <SuggestionItem index={3} text="保持充足饮水，每天更换新鲜水源" />
                  </>
                )}
              </div>
            </>)}
          </AnalysisCard>
        )}

        {/* 卡片4：运动建议 */}
        {isCardVisible("exercise") && isCardVisibleBySearch("exercise") && (
          <AnalysisCard category="exercise">
            <CardHeader icon={<Dumbbell size={20} />} title="运动建议"
              date={getLocalToday()} score={exerciseScore} />
            <CardSummary text={!analysisLoading
              ? exerciseScore >= 75 ? "运动状态活跃，精力充沛！" : exerciseScore >= 55 ? "运动量适中，可以适当加强锻炼" : "运动量偏少，建议增加活动时间"
              : "加载中..."} />

            {!analysisLoading && dims?.exercise && (<>
              <div className="ai-divider"><span>详细指标</span></div>
              <div className="ai-detail-list">
                <DetailRow label="活力评分" value={`${exerciseScore}分`} status={_s(exerciseScore)} />
                <DetailRow label="观察样本" value={`${dims.exercise.detail.samples || 0}次`} status="good" />
              </div>
              <div className="ai-divider"><span>优化建议</span></div>
              <div className="ai-suggest-list">
                <SuggestionItem index={1} text="每天保持规律的户外活动时间，建议30分钟以上" />
                <SuggestionItem index={2} text="可以增加互动游戏如捡球、飞盘等提升活动兴趣" />
                <SuggestionItem index={3} text="根据宠物年龄和品种调整运动强度，避免过度疲劳" />
              </div>
            </>)}
          </AnalysisCard>
        )}

        {/* 卡片5：疫苗提醒 */}
        {isCardVisible("vaccine") && isCardVisibleBySearch("vaccine") && (
          <AnalysisCard category="vaccine">
            <CardHeader icon={<Syringe size={20} />} title="疫苗提醒"
              date={getLocalToday()} score={vaccineScore} />
            <CardSummary text={!analysisLoading
              ? vacAlerts.some(v => v.status === "overdue") ? "有疫苗已过期，请尽快补种！"
                : vacAlerts.some(v => v.status === "approaching") ? "有疫苗即将到期，请注意安排接种"
                : vacAlerts.length > 0 ? "疫苗接种状态良好" : "暂无疫苗记录，建议咨询兽医"
              : "加载中..."} />

            {!analysisLoading && (<>
              <div className="ai-divider"><span>疫苗列表</span></div>
              <div className="ai-detail-list">
                {vacAlerts.length > 0 ? vacAlerts.map(v => (
                  <DetailRow key={v.id} label={v.name}
                    value={v.status === "overdue" ? `已过期${Math.abs(v.days_until ?? 0)}天` : v.status === "approaching" ? `${Math.abs(v.days_until ?? 0)}天后到期` : `${Math.abs(v.days_within ?? 0)}天内正常`}
                    status={v.status === "overdue" ? "danger" : v.status === "approaching" ? "warning" : "good"} />
                )) : (
                  <DetailRow label="狂犬疫苗" value={vacAlerts.length > 0 ? "已记录" : "未录入"} status={vacAlerts.length > 0 ? "good" : "danger"} />
                )}
                <DetailRow label="驱虫状态" value={dewAlerts.length > 0 ? `${dewAlerts.filter(d=>d.status!=='overdue').length}项有效` : dewAlerts.some(d=>d.status==='overdone') ? "有已过期" : "无记录"}
                  status={dewAlerts.some(d=>d.status==='overdone')?"danger":dewAlerts.length>0?"good":"warning"} />
                <DetailRow label="体检记录" value={`${dataSummary?.checkups||0}次`} status={(dataSummary?.checkups||0)>0?"good":"warning"} />
              </div>
              <div className="ai-divider"><span>优化建议</span></div>
              <div className="ai-suggest-list">
                {vacAlerts.filter(v => v.status === "overdue").length > 0 && (
                  <SuggestionItem index={1} text="发现过期疫苗！请在一周内联系兽医安排补种" />
                )}
                {vacAlerts.filter(v => v.status === "approaching").length > 0 && (
                  <SuggestionItem index={2} text="有疫苗即将到期，请提前预约接种时间" />
                )}
                <SuggestionItem index={3} text="驱虫建议每季度进行一次，体内体外同步进行" />
                <SuggestionItem index={4} text="体检建议每年至少1-2次全面检查" />
              </div>
            </>)}
          </AnalysisCard>
        )}

        {/* 卡片6：美容毛发 */}
        {isCardVisible("beauty") && isCardVisibleBySearch("beauty") && (
          <AnalysisCard category="beauty">
            <CardHeader icon={<Scissors size={20} />} title="美容毛发分析"
              date={getLocalToday()} score={beautyScore} />
            <CardSummary text={!analysisLoading
              ? beautyScore >= 75 ? "毛发整体状态良好！" : beautyScore >= 55 ? "毛发状态一般，建议加强日常护理" : "需要关注毛发健康"
              : "加载中..."} />

            {!analysisLoading && dims?.grooming && (<>
              <div className="ai-divider"><span>详细指标</span></div>
              <div className="ai-detail-list">
                <DetailRow label="美容评分" value={`${beautyScore}分`} status={_s(beautyScore)} />
                <DetailRow label="毛发光泽" value={dims.grooming.detail.latest_coat || "--"} status={_s(beautyScore)} />
              </div>
              <div className="ai-divider"><span>优化建议</span></div>
              <div className="ai-suggest-list">
                <SuggestionItem index={1} text="建议定期梳理毛发，预防打结和脱毛" />
                <SuggestionItem index={2} text="换季期间适当补充鱼油或卵磷脂改善毛质" />
                <SuggestionItem index={3} text="使用宠物专用洗护产品，避免人用沐浴露" />
              </div>
            </>)}
          </AnalysisCard>
        )}

      </section>

      <div style={{ height: "32px" }} />

      <QuotaHintModal
        isOpen={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        quotaData={quotaErrorData}
        onUpgrade={() => navigate("/app/mine/vip")}
      />
    </main>
  );
}
