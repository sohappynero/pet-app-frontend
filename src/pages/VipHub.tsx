import { useNavigate } from "react-router-dom";
import { useShell } from "../hooks/useShell";

export default function VipHub() {
  const navigate = useNavigate();
  const { selectedPet } = useShell();
  const petName = selectedPet?.name || "宠物";

  return (
    <div className="petos-page">
      <div className="petos-content">

        <div className="petos-greet">
          <div className="petos-greet__name">会员专区</div>
          <div className="petos-greet__hi" style={{ marginTop: 4 }}>解锁更多 AI 陪伴能力</div>
        </div>

        {/* 开通会员横条 */}
        <button
          type="button"
          className="petos-vip-banner"
          onClick={() => navigate("/app/mine/vip")}
        >
          <span className="petos-vip-banner__heart">♥</span>
          <span className="petos-vip-banner__body">
            <span className="petos-vip-banner__title">{petName}的VIP小窝</span>
            <span className="petos-vip-banner__desc">专属特权让我们更好地陪伴彼此</span>
          </span>
          <span className="petos-vip-banner__btn">立即开通</span>
        </button>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* AI 智能分析 */}
          <button
            type="button"
            className="petos-vip-card"
            onClick={() => navigate("/app/insights/analysis")}
          >
            <div className="petos-vip-card__icon">📊</div>
            <div className="petos-vip-card__body">
              <div className="petos-vip-card__title">AI 智能分析</div>
              <div className="petos-vip-card__desc">健康评分 · 体重趋势 · 饮食运动</div>
            </div>
            <div className="petos-vip-card__arrow">→</div>
          </button>

          {/* 宠物心声 */}
          <button
            type="button"
            className="petos-vip-card"
            onClick={() => navigate("/app/chat")}
          >
            <div className="petos-vip-card__icon">🐾</div>
            <div className="petos-vip-card__body">
              <div className="petos-vip-card__title">宠物心声</div>
              <div className="petos-vip-card__desc">识图 · 声音翻译 · 情绪对话</div>
            </div>
            <div className="petos-vip-card__arrow">→</div>
          </button>
        </div>
      </div>
    </div>
  );
}
