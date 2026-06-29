/**
 * 开通会员页面
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Heart, Gem, Crown, Smile, Activity, Sparkles } from "lucide-react";
import { useShell } from "../hooks/useShell";
import { getLocalAvatar } from "../lib/pet-avatar";

interface Plan {
  id: string;
  name: string;
  price: string;
  unit: string;
  tag: string;
  desc: string;
  sub: string;
  color: string;
  border: string;
  bg: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "免费版",
    price: "¥0",
    unit: "",
    tag: "",
    desc: "永久免费",
    sub: "获客 + 数据积累",
    color: "#B5A090",
    border: "rgba(180,170,155,0.25)",
    bg: "linear-gradient(145deg, #FFFAF5, #FFF5EE)",
  },
  {
    id: "pro",
    name: "宠物会员 Pro",
    price: "¥15",
    unit: "/月",
    tag: "性价比之选",
    desc: "年付 ¥128 省 ¥52",
    sub: "≈ ¥10.7/月",
    color: "#FB7185",
    border: "rgba(251,113,133,0.45)",
    bg: "linear-gradient(145deg, #FFF0F3, #FFE8ED)",
  },
  {
    id: "family",
    name: "家庭尊享版",
    price: "¥38",
    unit: "/月",
    tag: "",
    desc: "年付 ¥328 省 ¥128",
    sub: "≈ ¥27.3/月",
    color: "#D4A574",
    border: "rgba(212,165,116,0.45)",
    bg: "linear-gradient(145deg, #FDF2EC, #F9E3D4)",
  },
];

const FEATURES = [
  { name: "AI健康分析", free: "每月 3 次", pro: "每月 60 次", family: "无限次" },
  { name: "健康记录", free: "基础记录", pro: "月度健康报告", family: "年度健康总结" },
  { name: "体重/症状趋势预测", free: "—", pro: "✓ 支持", family: "✓ 支持" },
  { name: "异常推送提醒", free: "趋势提醒", pro: "✓ 支持", family: "✓ 支持" },
  { name: "照片心理识别", free: "每月 5 次", pro: "每月 60 次", family: "每月 300 次" },
  { name: "情绪变化分析", free: "—", pro: "周趋势分析", family: "长期变化分析" },
  { name: "多宠物对比分析", free: "1只宠物", pro: "最多 3 只", family: "无限宠物" },
  { name: "家庭共享账号", free: "—", pro: "—", family: "最多 3 账号" },
  { name: "优先客服响应", free: "—", pro: "✓ 优先", family: "优先 + 专属" },
  { name: "PDF 报告导出", free: "部分导出", pro: "✓ 支持", family: "✓ 支持" },
];

const GIFTS = [
  { icon: "🖼️", label: "专属头像框" },
  { icon: "🌸", label: "限定壁纸" },
  { icon: "🐱", label: "宠物表情包" },
  { icon: "👑", label: "会员标识" },
];

/** 会员专属特权卡片 */
const PRIVILEGES = [
  { icon: Smile, title: "情绪识别", desc: "读懂小情绪" },
  { icon: Activity, title: "AI健康分析", desc: "深度分析健康状态" },
  { icon: Crown, title: "更多特权", desc: "敬请期待", highlight: true },
];

export default function VipSubscribe() {
  const navigate = useNavigate();
  const { selectedPet } = useShell();
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const petName = selectedPet?.name || "宝贝";
  const petImage = selectedPet?.image_url || getLocalAvatar(selectedPet?.id ?? 0) || "";
  const currentPlan = PLANS.find((p) => p.id === selectedPlan) || PLANS[1];

  const getHighlightCol = () => {
    if (selectedPlan === "free") return 1;
    if (selectedPlan === "family") return 3;
    return 2;
  };
  const highlightCol = getHighlightCol();
  const colNames = ["", "免费版", "Pro", "家庭版"];

  return (
    <main className="vip-sub-page">
      {/* Header */}
      <header className="vip-sub-header">
        <button className="vip-sub-back" onClick={() => navigate(-1)}>
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 className="vip-sub-title">开通会员</h1>
        <button className="vip-sub-restore">恢复购买</button>
      </header>

      {/* Hero */}
      <section className="vip-sub-hero">
        <div className="vip-sub-hero-text">
          <h2>
            选择适合你的<span>VIP小窝</span>
          </h2>
          <p>让爱与陪伴更长久</p>
        </div>
        <div className="vip-sub-hero-img">
          {petImage ? (
            <img src={petImage} alt={petName} />
          ) : (
            <span>🐾</span>
          )}
        </div>
      </section>

      {/* Plans */}
      <section className="vip-sub-plans">
        {PLANS.map((plan) => (
          <button
            type="button"
            key={plan.id}
            className={`vip-sub-plan ${selectedPlan === plan.id ? "active" : ""}`}
            style={{
              background: plan.bg,
              borderColor: plan.border,
            }}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.tag && <span className="vip-sub-plan-tag">{plan.tag}</span>}
            <h4>{plan.name}</h4>
            <div className="vip-sub-plan-price" style={{ color: plan.color }}>
              {plan.price}
              <small>{plan.unit}</small>
            </div>
            <p className="vip-sub-plan-desc">{plan.desc}</p>
            <p className="vip-sub-plan-sub">{plan.sub}</p>
          </button>
        ))}
      </section>

      {/* Features */}
      <section className="vip-sub-features">
        <h3 className="vip-sub-section-title">功能特权对比</h3>
        <div className="vip-sub-table">
          <div className="vip-sub-row vip-sub-header-row">
            <span>特权</span>
            {colNames.slice(1).map((name, idx) => (
              <span key={name} className={highlightCol === idx + 1 ? "highlight" : ""}>
                {name}
              </span>
            ))}
          </div>
          {FEATURES.map((f) => (
            <div key={f.name} className="vip-sub-row">
              <span>{f.name}</span>
              <span className={highlightCol === 1 ? "highlight" : ""}>{f.free}</span>
              <span className={highlightCol === 2 ? "highlight" : ""}>{f.pro}</span>
              <span className={highlightCol === 3 ? "highlight" : ""}>{f.family}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 会员专属特权卡片 */}
      <section className="vip-sub-privileges">
        <h3 className="vip-sub-section-title">
          <Sparkles size={14} fill="#FFB84D" color="#FFB84D" />
          会员专属特权
        </h3>
        <div className="vip-privilege-grid">
          {PRIVILEGES.map((p) => (
            <div key={p.title} className={`vip-privilege-card ${p.highlight ? "highlighted" : ""}`}>
              <div className="vp-icon-wrap">
                <p.icon size={22} className="vp-svg-icon" />
              </div>
              <span className="vp-title">{p.title}</span>
              <small className="vp-desc">{p.desc}</small>
            </div>
          ))}
        </div>
      </section>

      {/* Pay */}
      <section className="vip-sub-pay">
        <p className="vip-sub-pay-tip">年付比月付更划算，可随时取消自动续费</p>
        <button className="vip-sub-pay-btn">
          <Gem size={16} />
          {selectedPlan === "free"
            ? "免费版无需支付"
            : `立即支付 ${currentPlan.price}${currentPlan.unit}`}
        </button>
        <label className="vip-sub-agree">
          <input type="checkbox" defaultChecked />
          开通即表示同意《会员服务协议》和《自动续费协议》
        </label>
      </section>

      {/* Gifts */}
      <section className="vip-sub-gifts">
        <h3 className="vip-sub-section-title">
          <Heart size={14} fill="#FB7185" />
          开通即享 <span>专属礼包</span>
        </h3>
        <div className="vip-sub-gift-grid">
          {GIFTS.map((g) => (
            <div key={g.label} className="vip-sub-gift-item">
              <span>{g.icon}</span>
              <small>{g.label}</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
