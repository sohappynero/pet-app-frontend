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
          选择适合你的 <span className="vz-greet__sparkle">VIP</span> 小窝
        </h1>
        <p className="vz-greet__sub">让爱与陪伴更长久</p>
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
          <span className="vz-banner__title">选择适合你的 <em>陪伴计划</em></span>
          <span className="vz-banner__desc">不同阶段的爱，都值得最棒的陪伴</span>
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
