import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Bell,
  Share2,
  Brain,
  Shield,
  CircleHelp,
  MessageSquare,
  PawPrint,
  ChevronRight,
  LogOut,
  Star,
  X,
} from "lucide-react";

import { fetchReminders } from "../lib/api";
import { useShell } from "../hooks/useShell";

type MenuItem = {
  label: string;
  icon: ReactNode;
  rightText?: string;
  to?: string;
  onClick?: () => void;
  iconBg?: string;
  iconColor?: string;
};

/** 新功能项 */
type FeatureItem = {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
};

const FEATURE_LIST: FeatureItem[] = [
  { id: "funeral", label: "宠物殡葬", emoji: "🕊️", color: "#7D6E63", bgColor: "linear-gradient(135deg, #F5F0EB, #EBE5DE)" },
  { id: "tv", label: "宠物TV", emoji: "🎬", color: "#5C9BD1", bgColor: "linear-gradient(135deg, #E8F4FD, #D4ECFA)" },
  { id: "hospital", label: "宠物医院", emoji: "🏥", color: "#E85A71", bgColor: "linear-gradient(135deg, #FFE8ED, #FFD0D8)" },
  { id: "beauty", label: "美容预约", emoji: "✨", color: "#B87DE8", bgColor: "linear-gradient(135deg, #F3E8FD, #E8D4FB)" },
];

function MenuRow({ item }: { item: MenuItem }) {
  const navigate = useNavigate();
  const onPress = () => {
    if (item.to) navigate(item.to);
    else item.onClick?.();
  };

  return (
    <button
      className="mine-menu-row group"
      onClick={onPress}
    >
      <div className="mine-row-left">
        <span
          className="mine-icon-badge"
          style={{ background: item.iconBg || "#F5F0EB" }}
        >
          <span style={{ color: item.iconColor || "#8B7355" }}>
            {item.icon}
          </span>
        </span>
        <span className="mine-label">{item.label}</span>
      </div>
      <span className="mine-row-right">
        <span className="mine-right-text">{item.rightText || "查看"}</span>
        <ChevronRight size={16} className="mine-chevron" />
      </span>
    </button>
  );
}

/** 功能即将上线弹窗 */
function ComingSoonModal({ feature, onClose }: { feature: FeatureItem; onClose: () => void }) {
  return (
    <div className="coming-soon-overlay" onClick={onClose}>
      <div 
        className="coming-soon-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="coming-soon-close" onClick={onClose}>
          <X size={20} />
        </button>
        
        {/* 可爱的动画图标 */}
        <div className="coming-soon-emoji-wrap">
          <span className="coming-soon-emoji">{feature.emoji}</span>
          <span className="coming-soon-sparkle">✨</span>
          <span className="coming-soon-sparkle coming-soon-sparkle-2">⭐</span>
          <span className="coming-soon-sparkle coming-soon-sparkle-3">💫</span>
        </div>
        
        <h3 className="coming-soon-title">{feature.label}</h3>
        <p className="coming-soon-desc">
          功能即将上线
          <br />
          敬请期待~
        </p>
        
        <div className="coming-soon-pets">
          <span>🐕</span><span>🐱</span><span>🐰</span><span>🐹</span>
        </div>
        
        <p className="coming-soon-hint">开发团队正在努力中 🚀</p>
        
        <button className="coming-soon-btn" onClick={onClose}>
          好的~ 知道啦 💕
        </button>
      </div>
    </div>
  );
}

export default function Mine() {
  const { nickname, phone, pets, selectedPetId, avatar, onLogout } = useShell();
  const [pendingCount, setPendingCount] = useState(0);
  const [showFeatureModal, setShowFeatureModal] = useState<FeatureItem | null>(null);

  useEffect(() => {
    if (pets.length === 0) {
      setPendingCount(0);
      return;
    }

    const run = async () => {
      const remindersResp = await fetchReminders(phone, selectedPetId ?? undefined, "pending");
      const today = new Date().toISOString().slice(0, 10);
      const due = (remindersResp.data || []).filter((x) => x.due_date <= today);
      setPendingCount(due.length);
    };

    run();
  }, [phone, selectedPetId, pets.length]);

  const petCount = useMemo(() => pets.length, [pets]);
  const ownerName = (nickname || "").trim() || phone || "用户";

  /** 点击新功能 */
  const handleFeatureClick = (feature: FeatureItem) => {
    setShowFeatureModal(feature);
  };

  const mainMenus: MenuItem[] = [
    {
      label: "我的宠物",
      icon: <FileText size={18} />,
      rightText: `${petCount} 只`,
      to: "/app/pets",
      iconColor: "#6B5B4F",
      iconBg: "#F5F0EB",
    },
    {
      label: "健康报告",
      icon: <FileText size={18} />,
      rightText: "查看全部",
      to: "/app/records",
      iconColor: "#7D6E63",
      iconBg: "#F7F4F0",
    },
    {
      label: "提醒设置",
      icon: <Bell size={18} />,
      rightText: pendingCount > 0 ? `${pendingCount} 条` : "管理",
      to: "/app/reminders",
      iconColor: "#8B7355",
      iconBg: "#FAF8F5",
    },
    {
      label: "病历共享",
      icon: <Share2 size={18} />,
      rightText: "3 个",
      to: "/app/records",
      iconColor: "#9B8577",
      iconBg: "#F5F2EE",
    },
    {
      label: "智能分析",
      icon: <Brain size={18} />,
      rightText: "查看",
      to: "/app/records",
      iconColor: "#5C6B73",
      iconBg: "#F0F2F3",
    },
  ];

  const secondMenus: MenuItem[] = [
    {
      label: "隐私设置",
      icon: <Shield size={18} />,
      rightText: "设置",
      to: "/app/privacy",
      iconColor: "#6B5B4F",
      iconBg: "#F5F0EB",
    },
    {
      label: "帮助中心",
      icon: <CircleHelp size={18} />,
      rightText: "查看",
      to: "/app/help",
      iconColor: "#7D6E63",
      iconBg: "#F7F4F0",
    },
    {
      label: "吐槽中心",
      icon: <MessageSquare size={18} />,
      rightText: "反馈",
      to: "/app/feedback",
      iconColor: "#D4A574",
      iconBg: "#FBF6EF",
    },
  ];

  return (
    <main className="mine-page-container">
      {/* 页面标题区 */}
      <section className="mine-header">
        <h1 className="mine-title">我的</h1>
        <p className="mine-subtitle">宠物与账户管理</p>
      </section>

      {/* 用户信息卡片 */}
      <section className="mine-profile-card">
        <div className="mine-avatar-section">
          <div className="mine-avatar-container">
            {avatar ? (
              <img src={avatar} alt={ownerName} className="mine-user-avatar-img" />
            ) : (
              <PawPrint size={32} className="mine-avatar-icon" />
            )}
            <Star size={14} className="mine-star-deco" />
          </div>
        </div>

        <div className="mine-user-info">
          <h2 className="mine-username">{ownerName}</h2>
          <div className="mine-pet-info">
            <span>{petCount > 0 ? `${petCount} 只宠物` : '暂无宠物'}</span>
            <span className="mine-verified-badge">
              <Star size={12} fill="currentColor" />
              已认证
            </span>
          </div>
        </div>
      </section>

      {/* 主要菜单卡片 */}
      <section className="mine-card">
        {mainMenus.map((item, idx) => (
          <div key={item.label}>
            <MenuRow item={item} />
            {idx !== mainMenus.length - 1 && <div className="mine-divider" />}
          </div>
        ))}
      </section>

      {/* 新功能卡片 - 宠物殡葬/TV/医院/美容 */}
      <section className="mine-features-section">
        <h3 className="mine-features-title">🌟 更多服务</h3>
        <div className="mine-features-grid">
          {FEATURE_LIST.map((feature) => (
            <button
              key={feature.id}
              className="mine-feature-card"
              style={{ background: feature.bgColor }}
              onClick={() => handleFeatureClick(feature)}
            >
              <span className="mine-feature-emoji">{feature.emoji}</span>
              <span className="mine-feature-label">{feature.label}</span>
              <ChevronRight size={14} className="mine-feature-arrow" />
            </button>
          ))}
        </div>
      </section>

      {/* 次要菜单卡片 */}
      <section className="mine-card mine-card-secondary">
        {secondMenus.map((item, idx) => (
          <div key={item.label}>
            <MenuRow item={item} />
            {idx !== secondMenus.length - 1 && <div className="mine-divider" />}
          </div>
        ))}
      </section>

      {/* 退出登录 */}
      <section className="mine-logout-section">
        <button type="button" className="mine-logout-btn" onClick={onLogout}>
          <span className="mine-logout-icon-wrap">
            <LogOut size={18} />
          </span>
          <span>退出登录</span>
        </button>
      </section>

      {/* 功能即将上线弹窗 */}
      {showFeatureModal && (
        <ComingSoonModal feature={showFeatureModal} onClose={() => setShowFeatureModal(null)} />
      )}
    </main>
  );
}

