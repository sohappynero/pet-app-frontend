import { useNavigate } from "react-router-dom";
import { useShell } from "../hooks/useShell";
import { ChevronRight, Crown, Sparkles, BarChart3, PawPrint, Heart } from "lucide-react";

export default function VipHub() {
  const navigate = useNavigate();
  const { selectedPet } = useShell();
  const petName = selectedPet?.name || "宠物";

  return (
    <div className="vip-zone">
      {/* 标题区 */}
      <div className="vz-greet">
        <h1 className="vz-greet__title">
          会员专区<span className="vz-greet__sparkle">✨</span>
          <span className="vz-greet__paw">🐾</span>
        </h1>
        <p className="vz-greet__sub">✦ 解锁更多 AI 陪伴能力 ✦</p>
      </div>

      {/* VIP 开通横条 - 毛玻璃风格 */}
      <button
        type="button"
        className="vz-banner"
        onClick={() => navigate("/app/mine/vip")}
      >
        <div className="vz-banner__icon-wrap">
          <div className="vz-banner__icon-inner">
            <Crown size={20} className="vz-banner__crown" />
            <Heart size={14} className="vz-banner__heart" />
            {/* 光晕环 */}
            <span className="vz-banner__ring" />
          </div>
        </div>
        <div className="vz-banner__body">
          <span className="vz-banner__title">{petName}的 <em>VIP</em> 小窝</span>
          <span className="vz-banner__desc">专属特权让我们更好地陪伴彼此</span>
        </div>
        <div className="vz-banner__btn">
          立即开通
          <ChevronRight size={16} />
        </div>
      </button>

      {/* 功能卡片列表 */}
      <div className="vz-cards">
        {/* AI 智能分析 */}
        <button
          type="button"
          className="vz-card"
          onClick={() => navigate("/app/insights/analysis")}
        >
          <div className="vz-card__icon vz-card__icon--chart">
            <Sparkles size={12} className="vz-card__icon-spark" />
            <BarChart3 size={22} className="vz-card__icon-main" />
          </div>
          <div className="vz-card__body">
            <h3 className="vz-card__title">AI 智能分析</h3>
            <p className="vz-card__desc">
              <span>♡ 健康评分</span>
              <span>⚖ 体重趋势</span>
              <span>🍽 饮食运动</span>
            </p>
          </div>
          <div className="vz-card__arrow">
            <ChevronRight size={20} />
          </div>
        </button>

        {/* 宠物心声 */}
        <button
          type="button"
          className="vz-card"
          onClick={() => navigate("/app/chat")}
        >
          <div className="vz-card__icon vz-card__icon--voice">
            <PawPrint size={24} />
          </div>
          <div className="vz-card__body">
            <h3 className="vz-card__title">宠物心声</h3>
            <p className="vz-card__desc">
              <span>👁️ 根据毛孩子照片读懂它的内心</span>
            </p>
          </div>
          <div className="vz-card__arrow">
            <ChevronRight size={20} />
          </div>
        </button>
      </div>
    </div>
  );
}
