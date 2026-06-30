import React, { useEffect } from 'react';
import {
  Heart,
  FileText,
  Brain,
  Bell,
  Crown,
  Vote,
  Settings,
  X,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Pet } from '../types';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pets?: Pet[];
  selectedPet?: Pet | null;
  onPetSwitch?: (petId: string) => void;
}

const MENU_ITEMS = [
  { label: '我的宠物', key: 'pets', icon: 'pets', path: '/app/mine/pets', highlight: true },
  { label: '健康记录', key: 'health', icon: 'health', path: '/app/records' },
  { label: 'AI 分析', key: 'ai', icon: 'analysis', path: '/app/insights/analysis' },
  { label: '提醒中心', key: 'reminders', icon: 'bell', path: '/app/mine/reminders' },
  { label: '会员中心', key: 'vip', icon: 'crown', path: '/app/mine/vip' },
  { label: '功能投票', key: 'vote', icon: 'vote', path: '/app/mine/feature-vote' },
  { label: '设置', key: 'settings', icon: 'settings', path: '/app/mine/privacy' },
] as const;

/**
 * Layer 3 - 左侧玻璃抽屉菜单
 * - 宽度280px
 * - closed: translateX(-280px), open: translateX(0)
 * - glassmorphism 白色25%透明 + backdrop-blur 18px
 * - 圆角右侧24px
 * - 动画300ms ease-out
 *
 * 目标设计：9项菜单 + 底部切换宠物卡片（带头像）
 */
const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  pets = [],
  selectedPet,
  onPetSwitch,
}) => {
  const navigate = useNavigate();

  // 抽屉打开时给 body 添加 class，用于降低导航栏 z-index
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('drawer-open');
    } else {
      document.body.classList.remove('drawer-open');
    }
    return () => { document.body.classList.remove('drawer-open'); };
  }, [isOpen]);

  function petAvatarUrl(pet: Pet): string | null {
    return (pet as any)._resolved_avatar_url || pet.avatar_url || pet.image_url || null;
  }

  const handleMenuClick = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <>
      {/* 遮罩背景（点击关闭） */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
        onClick={onClose}
      />

      {/* 抽屉主体 */}
      <div
        className="fixed top-0 left-0 h-full"
        style={{
          width: '280px',
          zIndex: isOpen ? 9999 : 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(-280px)',
          backgroundColor: 'rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderTopRightRadius: '24px',
          borderBottomRightRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          borderLeft: 'none',
          transition: 'transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1)', /* 规范: UI 320ms + 统一easing */
          boxShadow: '-8px 8px 40px rgba(0, 0, 0, 0.08), inset 1px 0 0 rgba(255,255,255,0.15)', /* 规范shadow */
        }}
      >
        {/* ── 品牌区域：高级毛玻璃 Logo ── */}
        <div
          style={{
            position: 'relative',
            padding: '20px 16px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          {/* 右上角精致小星星装饰 */}
          <span
            style={{
              position: 'absolute',
              top: '14px',
              right: '18px',
              fontSize: '15px',
              color: '#FFB84D',
              filter: 'drop-shadow(0 2px 6px rgba(255,184,77,0.4))',
              pointerEvents: 'none',
              opacity: 0.8,
            }}
            aria-hidden="true"
          >
            ✦
          </span>

          {/* 品牌 Logo — 水晶毛玻璃徽章 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {/* CSS 猫爪图标 */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 255, 255, 0.35)',
                boxShadow: '0 4px 16px rgba(255,184,77,0.15), inset 0 1px 0 rgba(255,255,255,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* 内部渐变光晕 */}
              <div
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '-4px',
                  right: '-4px',
                  bottom: '-4px',
                  background: 'linear-gradient(135deg, rgba(255,184,77,0.3), rgba(255,143,185,0.2))',
                  borderRadius: '14px',
                  zIndex: -1,
                  filter: 'blur(6px)',
                }}
              />
              {/* 猫爪印 - CSS 绘制 */}
              <svg
                width="22" height="22" viewBox="0 0 24 24" fill="none"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(255,150,80,0.25))' }}
              >
                {/* 掌心 */}
                <ellipse cx="12" cy="17" rx="6" ry="5" fill="url(#pawGrad)" />
                {/* 四个肉垫 */}
                <circle cx="7" cy="10" r="3" fill="url(#pawGrad)" />
                <circle cx="12" cy="8" r="3" fill="url(#pawGrad)" />
                <circle cx="17" cy="10" r="3" fill="url(#pawGrad)" />
                <circle cx="9.5" cy="13.5" r="2.2" fill="url(#padGrad)" opacity="0.85" />
                <defs>
                  <linearGradient id="pawGrad" x1="6" y1="5" x2="18" y2="22">
                    <stop offset="0%" stopColor="#FFDCA0" />
                    <stop offset="100%" stopColor="#F5A623" />
                  </linearGradient>
                  <radialGradient id="padGrad">
                    <stop offset="0%" stopColor="#FF9EB5" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#FF8FA0" stopOpacity="0.7" />
                  </radialGradient>
                </defs>
              </svg>
            </div>

            {/* 品牌文字 */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                lineHeight: 1.15,
              }}
            >
              <span
                style={{
                  fontSize: '19px',
                  fontWeight: '800',
                  letterSpacing: '0.04em',
                  fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}
              >
                <span style={{ color: '#5D4037' }}>Pet</span>
                <span
                  style={{
                    background: 'linear-gradient(135deg, #FFB84D 0%, #FF8FB9 60%, #B388FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >Life</span>
              </span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: '600',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#C4A882',
                  marginTop: '1px',
                  marginLeft: '1px',
                }}
              >
                Pet Companion
              </span>
            </div>
          </div>
        </div>
        {/* 关闭按钮 */}
        <button
          type="button"
          className="drawer-close-btn-enhanced"
          onClick={onClose}
          aria-label="关闭菜单"
        >
          <X size={16} />
        </button>

        {/* 菜单项列表 */}
        <nav className="px-4 pt-2">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => handleMenuClick(item.path)}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 hover:bg-white/25 active:bg-white/35 group ${
                item.highlight ? 'drawer-menu-item--active' : ''
              }`}
            >
              <span className="drawer-menu-emoji" aria-hidden="true">
                {item.emoji}
              </span>
              <span
                className="text-[15px] font-medium"
                style={{ color: '#5D4E37' }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* 底部：切换宠物卡片 */}
        <div className="absolute bottom-8 left-4 right-4">
          <div
            className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-white/20 active:bg-white/30"
            style={{
              backgroundColor: 'rgba(255, 214, 165, 0.15)',
              border: '1px solid rgba(255, 214, 165, 0.25)',
            }}
            onClick={onClose}
          >
            {/* 宠物头像 */}
            <div
              className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/30"
              style={{ border: '2px solid rgba(255, 214, 165, 0.4)' }}
            >
              {selectedPet ? (
                <img
                  src={petAvatarUrl(selectedPet) || ''}
                  alt={selectedPet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg">
                  🐾
                </div>
              )}
            </div>

            {/* 文字区 */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[13px] font-semibold truncate"
                style={{ color: '#5D4E37' }}
              >
                切换宠物
              </p>
              <p
                className="text-[11px] truncate"
                style={{ color: '#B8956A' }}
              >
                {selectedPet?.name || '未选择'} {'>'}
              </p>
            </div>

            {/* 右箭头 */}
            <ChevronRight size={16} color="#C4A882" className="flex-shrink-0" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Drawer;
