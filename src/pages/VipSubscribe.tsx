/**
 * 开通会员页面
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Heart, Gem, Crown, Smile, Activity, Sparkles } from "lucide-react";
import { useShell } from "../hooks/useShell";
import { getLocalAvatar } from "../lib/pet-avatar";
import { createOrder, pollOrderPaid, type PayDuration, type PayPlan } from "../lib/api";
import { ALIPAY_STATUS, canPayWithAlipay, payWithAlipay } from "../lib/alipay";

/** 单个时长档的价格展示文案 */
interface PlanPrice {
  /** 主价格，如 "¥15" */
  price: string;
  /** 价格后缀，如 "/月" */
  unit: string;
  /** 卡片主描述 */
  desc: string;
  /** 卡片副描述，折算或省钱提示 */
  sub: string;
}

interface Plan {
  id: string;
  name: string;
  tag: string;
  color: string;
  border: string;
  bg: string;
  /** 按时长分档的价格文案；免费版两档相同 */
  pricing: Record<PayDuration, PlanPrice>;
}

// 价格与后端 app/core/payment_config.py 的 PRICING 保持一致（后端以“分”为单位）
const PLANS: Plan[] = [
  {
    id: "free",
    name: "基础记录 免费版",
    tag: "",
    color: "#B5A090",
    border: "rgba(180,170,155,0.25)",
    bg: "linear-gradient(145deg, #FFFAF5, #FFF5EE)",
    pricing: {
      monthly: { price: "¥0", unit: "", desc: "永久免费", sub: "" },
      yearly: { price: "¥0", unit: "", desc: "永久免费", sub: "" },
    },
  },
  {
    id: "pro",
    name: "陪伴升级计划",
    tag: "推荐",
    color: "#FB7185",
    border: "rgba(251,113,133,0.45)",
    bg: "linear-gradient(145deg, #FFF0F3, #FFE8ED)",
    pricing: {
      monthly: { price: "¥15", unit: "/月", desc: "年付 ¥128 省 ¥52", sub: "按月付费，可随时取消" },
      yearly: { price: "¥128", unit: "/年", desc: "比月付省 ¥52", sub: "≈ ¥10.7/月" },
    },
  },
  {
    id: "family",
    name: "它的一生计划",
    tag: "",
    color: "#D4A574",
    border: "rgba(212,165,116,0.45)",
    bg: "linear-gradient(145deg, #FDF2EC, #F9E3D4)",
    pricing: {
      monthly: { price: "¥38", unit: "/月", desc: "年付 ¥328 省 ¥128", sub: "按月付费，可随时取消" },
      yearly: { price: "¥328", unit: "/年", desc: "比月付省 ¥128", sub: "≈ ¥27.3/月" },
    },
  },
];

const DURATIONS: Array<{ id: PayDuration; label: string }> = [
  { id: "monthly", label: "按月付费" },
  { id: "yearly", label: "按年付费" },
];

const FEATURES = [
  { name: "AI健康分析", free: "每月 3 次", pro: "每月 60 次", family: "无限次" },
  { name: "体重/症状趋势预测", free: "—", pro: "✓ 支持", family: "✓ 支持" },
  { name: "照片心理识别", free: "每月 5 次", pro: "每月 60 次", family: "每月 300 次" },
  { name: "多宠物对比分析", free: "1只宠物", pro: "最多 3 只", family: "无限宠物" },
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
  const [duration, setDuration] = useState<PayDuration>("monthly");
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState("");

  const petName = selectedPet?.name || "宝贝";
  const petImage = selectedPet?.image_url || getLocalAvatar(selectedPet?.id ?? 0) || "";
  const currentPlan = PLANS.find((p) => p.id === selectedPlan) || PLANS[1];
  const currentPrice = currentPlan.pricing[duration];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handlePay = async () => {
    if (paying) return;
    if (selectedPlan === "free") {
      showToast("免费版无需支付，直接使用即可");
      return;
    }
    if (!canPayWithAlipay()) {
      showToast("请在 App 内完成支付");
      return;
    }

    setPaying(true);
    try {
      const order = await createOrder({
        plan: selectedPlan as PayPlan,
        duration,
        pay_channel: "alipay",
      });
      if (!order.order_string) {
        showToast("下单失败，请稍后重试");
        return;
      }

      const result = await payWithAlipay(order.order_string);

      // 用户主动取消：静默返回，不打扰
      if (result.resultStatus === ALIPAY_STATUS.CANCELED) return;

      // 成功和处理中都要问服务端，SDK 的成功不等于会员已开通
      if (
        result.resultStatus === ALIPAY_STATUS.SUCCESS ||
        result.resultStatus === ALIPAY_STATUS.PROCESSING
      ) {
        showToast("支付完成，正在确认开通…");
        const finalOrder = await pollOrderPaid(order.order_no);
        if (finalOrder?.status === "paid") {
          showToast("开通成功，感谢你的支持");
          setTimeout(() => navigate(-1), 1200);
        } else {
          showToast("支付结果确认中，请稍后在会员页查看");
        }
        return;
      }

      showToast(result.memo || "支付未完成，请重试");
    } catch (e: any) {
      // 后端 503「支付服务暂不可用」/ 429「操作过于频繁」文案已由 api 层透出
      showToast(e?.message || "支付失败，请稍后重试");
    } finally {
      setPaying(false);
    }
  };

  return (
    <main className="vip-sub-page">
      {/* Header */}
      <header className="vip-sub-header">
        <button className="vip-sub-back" onClick={() => navigate(-1)}>
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 className="vip-sub-title">开通会员</h1>
      </header>

      {/* Hero */}
      <section className="vip-sub-hero">
        <div className="vip-sub-hero-text">
          <h2>
            选择适合你的<span>陪伴计划</span>
          </h2>
          <p>不同阶段的爱，都值得最棒的陪伴</p>
        </div>
        <div className="vip-sub-hero-img">
          {petImage ? (
            <img src={petImage} alt={petName} />
          ) : (
            <span>🐾</span>
          )}
        </div>
      </section>

      {/* 付费时长切换 */}
      <section className="vip-sub-duration">
        <div className="vip-sub-duration-group">
          {DURATIONS.map((d) => (
            <button
              type="button"
              key={d.id}
              className={`vip-sub-duration-btn ${duration === d.id ? "active" : ""}`}
              onClick={() => setDuration(d.id)}
            >
              {d.label}
              {d.id === "yearly" && <span className="vip-sub-duration-badge">更划算</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="vip-sub-plans">
        {PLANS.map((plan) => {
          const p = plan.pricing[duration];
          return (
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
                {p.price}
                <small>{p.unit}</small>
              </div>
              <p className="vip-sub-plan-desc">{p.desc}</p>
              <p className="vip-sub-plan-sub">{p.sub}</p>
            </button>
          );
        })}
      </section>

      {/* Features */}
      <section className="vip-sub-features">
        <h3 className="vip-sub-section-title">功能特权对比</h3>
        <div className="vip-sub-compare-cards">
          {FEATURES.map((f) => (
            <div key={f.name} className="vip-compare-item">
              <span className="vip-compare-name">{f.name}</span>
              <div className="vip-compare-values">
                <span className="vip-compare-val vip-compare-free">{f.free}</span>
                <span className="vip-compare-val vip-compare-pro">{f.pro}</span>
                <span className="vip-compare-val vip-compare-family">{f.family}</span>
              </div>
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
        <button
          className="vip-sub-pay-btn"
          onClick={handlePay}
          disabled={paying}
        >
          <Gem size={16} />
          {paying
            ? "支付处理中…"
            : selectedPlan === "free"
              ? "免费版无需支付"
              : `立即支付 ${currentPrice.price}${currentPrice.unit}`}
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

      {toast && <div className="qm-toast">{toast}</div>}
    </main>
  );
}
