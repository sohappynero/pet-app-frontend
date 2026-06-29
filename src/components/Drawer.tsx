import React from 'react';
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
  { label: '我的宠物', key: 'pets', emoji: '🐾', path: '/app/mine/pets', highlight: true },
  { label: '健康记录', key: 'health', emoji: '📋', path: '/app/records' },
  { label: 'AI 分析', key: 'ai', emoji: '📊', path: '/app/insights/analysis' },
  { label: '提醒中心', key: 'reminders', emoji: '🔔', path: '/app/mine/reminders' },
  { label: '会员中心', key: 'vip', emoji: '👑', path: '/app/mine/vip' },
  { label: '功能投票', key: 'vote', emoji: '🗳️', path: '/app/mine/feature-vote' },
  { label: '设置', key: 'settings', emoji: '⚙️', path: '/app/mine/privacy' },
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
        className="fixed top-0 left-0 h-full z-50"
        style={{
          width: '280px',
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
        {/* ── 品牌区域：Logo + 猫爪装饰 ── */}
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
          {/* 左上粉色猫爪装饰 — 参考图风格 */}
          <span
            style={{
              position: 'absolute',
              top: '14px',
              right: '16px',
              fontSize: '22px',
              filter: 'drop-shadow(0 2px 4px rgba(245,160,176,0.3))',
              transform: 'rotate(-15deg)',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            🐾
          </span>

          {/* 品牌 Logo — 高级简约风格 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFDCA0 0%, #F5B942 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                boxShadow: '0 2px 8px rgba(245,185,66,0.25)',
                flexShrink: 0,
              }}
            >
              🐱
            </div>
            <span
              style={{
                fontSize: '17px',
                fontWeight: '700',
                color: '#5D4E37',
                letterSpacing: '0.03em',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              }}
            >
              PetLife
            </span>
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
