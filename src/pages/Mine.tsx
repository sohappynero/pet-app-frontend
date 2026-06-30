import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, LogOut, X } from "lucide-react";

import { fetchReminders } from "../lib/api";
import { useShell } from "../hooks/useShell";
import { getLocalAvatar } from "../lib/pet-avatar";

function isNameCircleMarker(url?: string | null): boolean {
  return url === "__name_circle__";
}

type MenuItem = {
  label: string;
  emoji: string;
  rightText?: string;
  to?: string;
  onClick?: () => void;
};

type FeatureItem = {
  id: string;
  label: string;
  emoji: string;
};

const FEATURE_LIST: FeatureItem[] = [
  { id: "funeral", label: "宠物殡葬", emoji: "🕊️" },
  { id: "tv", label: "宠物TV", emoji: "🎬" },
  { id: "food", label: "宠物食品", emoji: "🥫" },
  { id: "chat", label: "同城聊天", emoji: "💬" },
  { id: "hospital", label: "宠物医院", emoji: "🏥" },
  { id: "beauty", label: "美容预约", emoji: "✨" },
];

function ComingSoonModal({ feature, onClose }: { feature: FeatureItem; onClose: () => void }) {
  return (
    <div className="coming-soon-overlay" onClick={onClose}>
      <div className="coming-soon-modal" onClick={(e) => e.stopPropagation()}>
        <button className="coming-soon-close" onClick={onClose}><X size={20} /></button>
        <div className="coming-soon-emoji-wrap">
          <span className="coming-soon-emoji">{feature.emoji}</span>
          <span className="coming-soon-sparkle">✨</span>
          <span className="coming-soon-sparkle coming-soon-sparkle-2">⭐</span>
          <span className="coming-soon-sparkle coming-soon-sparkle-3">💫</span>
        </div>
        <h3 className="coming-soon-title">{feature.label}</h3>
        <p className="coming-soon-desc">功能即将上线<br />敬请期待~</p>
        <div className="coming-soon-pets"><span>🐕</span><span>🐱</span><span>🐰</span><span>🐹</span></div>
        <p className="coming-soon-hint">开发团队正在努力中 🚀</p>
        <button className="coming-soon-btn" onClick={onClose}>好的~ 知道啦 💕</button>
      </div>
    </div>
  );
}

export default function Mine() {
  const navigate = useNavigate();
  const { nickname, phone, pets, selectedPetId, avatar, onLogout, selectedPet } = useShell();
  const [pendingCount, setPendingCount] = useState(0);
  const [showFeatureModal, setShowFeatureModal] = useState<FeatureItem | null>(null);

  const currentPet = useMemo(
    () => pets.find((p) => p.id === selectedPetId) || pets[0] || null,
    [pets, selectedPetId]
  );

  const headerAvatarUrl = useMemo(() => {
    if (avatar && avatar.trim()) return avatar;
    if (currentPet) {
      const petUrl = getLocalAvatar(currentPet.id) || currentPet._resolved_avatar_url || currentPet.image_url;
      if (petUrl) return petUrl;
    }
    return null;
  }, [avatar, currentPet]);

  const useNameCircle = !headerAvatarUrl || isNameCircleMarker(headerAvatarUrl);

  useEffect(() => {
    if (pets.length === 0) { setPendingCount(0); return; }
    fetchReminders(phone, selectedPetId ?? undefined, "pending")
      .then((resp) => setPendingCount((resp.data || []).length));
  }, [phone, selectedPetId, pets.length]);

  const petCount = pets.length;
  const ownerName = (nickname || "").trim() || phone || "用户";

  const mainMenus: MenuItem[] = [
    { label: "我的宠物", emoji: "🐾", rightText: `${petCount} 只`, to: "/app/mine/pets" },
    { label: "提醒设置", emoji: "🔔", rightText: pendingCount > 0 ? `${pendingCount} 条` : "管理", to: "/app/mine/reminders" },
    { label: "会员中心", emoji: "👑", rightText: "查看", to: "/app/mine/vip" },
  ];

  const secondMenus: MenuItem[] = [
    { label: "功能投票", emoji: "🗳️", rightText: "参与", to: "/app/mine/feature-vote" },
    { label: "隐私设置", emoji: "🔒", rightText: "设置", to: "/app/mine/privacy" },
    { label: "帮助中心", emoji: "❓", rightText: "查看", to: "/app/mine/help" },
    { label: "吐槽中心", emoji: "💬", rightText: "反馈", to: "/app/mine/feedback" },
  ];

  return (
    <div className="petos-page">
      <div className="petos-content">

        {/* 用户信息卡 */}
        <div className="petos-mine-profile">
          <div className="petos-mine-avatar">
            {useNameCircle ? (
              <span className="petos-mine-avatar__letter">{(nickname || "宠").charAt(0)}</span>
            ) : (
              <img src={headerAvatarUrl!} alt="" />
            )}
          </div>
          <div className="petos-mine-info">
            <div className="petos-mine-info__name">{ownerName}</div>
            <div className="petos-mine-info__meta">{petCount > 0 ? `${petCount} 只宠物` : "暂无宠物"}</div>
          </div>
        </div>

        {/* 主菜单 */}
        <div className="petos-form-card">
          {mainMenus.map((item, idx) => (
            <div key={item.label}>
              <button type="button" className="petos-mine-row" onClick={() => item.to && navigate(item.to)}>
                <span className="petos-mine-row__emoji">{item.emoji}</span>
                <span className="petos-mine-row__label">{item.label}</span>
                <span className="petos-mine-row__right">
                  <span>{item.rightText}</span>
                  <ChevronRight size={14} />
                </span>
              </button>
              {idx !== mainMenus.length - 1 && <div className="petos-mine-divider" />}
            </div>
          ))}
        </div>

        {/* 更多服务 */}
        <div className="petos-mine-services">
          <div className="petos-mine-services__title">更多服务</div>
          <div className="petos-mine-services__grid">
            {FEATURE_LIST.map((f) => (
              <button key={f.id} type="button" className="petos-mine-service-card" onClick={() => setShowFeatureModal(f)}>
                <span className="petos-mine-service-card__emoji">{f.emoji}</span>
                <span className="petos-mine-service-card__label">{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 次级菜单 */}
        <div className="petos-form-card">
          {secondMenus.map((item, idx) => (
            <div key={item.label}>
              <button type="button" className="petos-mine-row" onClick={() => item.to && navigate(item.to)}>
                <span className="petos-mine-row__emoji">{item.emoji}</span>
                <span className="petos-mine-row__label">{item.label}</span>
                <span className="petos-mine-row__right">
                  <span>{item.rightText}</span>
                  <ChevronRight size={14} />
                </span>
              </button>
              {idx !== secondMenus.length - 1 && <div className="petos-mine-divider" />}
            </div>
          ))}
        </div>

        {/* 退出登录 */}
        <button type="button" className="petos-mine-logout" onClick={onLogout}>
          <LogOut size={16} /> 退出登录
        </button>
      </div>

      {showFeatureModal && <ComingSoonModal feature={showFeatureModal} onClose={() => setShowFeatureModal(null)} />}
    </div>
  );
}
