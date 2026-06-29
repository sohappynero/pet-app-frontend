import { useCallback, useRef, useState } from "react";
import type { Pet } from "../types";
import {
  Home,
  ClipboardList,
  Bot,
  Heart,
  UtensilsCrossed,
  Bell,
  ShoppingBag,
  Crown,
  Settings,
  ChevronRight,
  Star,
  X,
} from "lucide-react";

/* ============================================
 * SidebarPanel — 左侧半圆弧侧边栏 + 粉色拉绳
 *
 * 交互: 向左拖拽猫爪拉环 -> 超过阈值释放 -> 展开侧边栏
 * 视觉: 奶油色半圆弧面板 + 宠物信息头部 + 9个菜单项 + 粉色拉绳
 * ============================================ */

interface PullLampSwitcherProps {
  pets: Pet[];
  selectedPetId: number | null;
  selectedPet?: Pet;
  onSwitch: (nextPetId: number) => void;
}

/** 向左拖拽触发阈值 (px) */
const TRIGGER_THRESHOLD = 50;

/** 侧边栏收起时露出的宽度 */
const COLLAPSED_WIDTH = 52;

/** 侧边栏完全展开宽度 */
const EXPANDED_WIDTH = 380;

/* ---------- 菜单数据定义 ---------- */

interface MenuItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
}

function buildMenuItems(): MenuItem[] {
  return [
    { icon: <Home size={22} />, title: "我的宠物", subtitle: "宠物信息与管理" },
    { icon: <ClipboardList size={22} />, title: "健康记录", subtitle: "记录成长与健康" },
    { icon: <Bot size={22} />, title: "AI 智能分析", subtitle: "宠物健康小助手", badge: "AI" },
    { icon: <Heart size={22} />, title: "心情日记", subtitle: "记录每一天" },
    { icon: <UtensilsCrossed size={22} />, title: "喂食提醒", subtitle: "科学喂养提醒" },
    { icon: <Bell size={22} />, title: "提醒中心", subtitle: "重要事项提醒" },
    { icon: <ShoppingBag size={22} />, title: "商城中心", subtitle: "精选好物推荐" },
    { icon: <Crown size={22} />, title: "会员中心", subtitle: "专属特权福利" },
    { icon: <Settings size={22} />, title: "设置", subtitle: "账号与系统设置" },
  ];
}

/** 清理品种字符串：移除可能被误拼入的 UUID 与多余空白 */
function formatBreed(raw?: string | null): string {
  if (!raw) return "未知品种";
  return raw
    .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, "")
    .replace(/\s+/g, " ")
    .trim()
    || "未知品种";
}

export default function PullLampSwitcher({
  pets,
  selectedPetId,
  selectedPet,
  onSwitch,
}: PullLampSwitcherProps) {
  /* ---- 展开状态（默认展开） ---- */
  const [isOpen, setIsOpen] = useState(true);
  const [pullDist, setPullDist] = useState(0);
  const dragStateRef = useRef<"idle" | "dragging" | "ready">("idle");
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);

  /* ---- 切换宠物（复用原有逻辑） ---- */
  const switchToNext = useCallback(() => {
    if (pets.length < 2) return;
    const currentIndex = pets.findIndex((p) => p.id === selectedPetId);
    const nextIndex = (currentIndex + 1) % pets.length;
    onSwitch(pets[nextIndex].id);
  }, [pets, selectedPetId, onSwitch]);

  /* ====== Pointer Events 拖拽（向左） ====== */

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType !== "touch") return;
      e.preventDefault();
      isDraggingRef.current = true;
      startXRef.current = e.clientX;
      dragStateRef.current = "dragging";
      setPullDist(0);

      // 已展开状态下，向右拉收起
      if (isOpen) {
        startXRef.current = e.clientX;
      }

      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [isOpen]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();

      const delta = isOpen
        ? startXRef.current - e.clientX // 展开状态：向右拉为正（收起）
        : startXRef.current - e.clientX; // 收起状态：向左拉为正（展开）

      const clampedDelta = Math.max(0, Math.min(delta, 120));
      setPullDist(clampedDelta);

      if (clampedDelta >= TRIGGER_THRESHOLD) {
        dragStateRef.current = "ready";
      } else {
        dragStateRef.current = "dragging";
      }
    },
    [isOpen]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      if (pullDist >= TRIGGER_THRESHOLD) {
        if (isOpen) {
          setIsOpen(false); // 收起
        } else {
          setIsOpen(true); // 展开
          switchToNext();
        }
      }

      setPullDist(0);
      dragStateRef.current = "idle";

      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [pullDist, isOpen, switchToNext]
  );

  /* ---- 点击蒙层关闭 ---- */
  const handleOverlayClick = useCallback(() => {
    setIsOpen(false);
  }, []);

  /* ---- 当前选中宠物数据 ---- */
  const pet = selectedPet || pets.find((p) => p.id === selectedPetId);

  /* ---- 动态偏移计算 ---- */
  const panelTranslateX = isOpen
    ? 0
    : -(EXPANDED_WIDTH - COLLAPSED_WIDTH) + Math.min(pullDist, EXPANDED_WIDTH - COLLAPSED_WIDTH);

  const menuItems = buildMenuItems();

  /* ---- render ---- */
  return (
    <>
      {/* ====== 右侧蒙层 ====== */}
      <div
        className={`sidebar-overlay${isOpen ? " sidebar-overlay--visible" : ""}`}
        onClick={handleOverlayClick}
        aria-hidden={!isOpen}
      />

      {/* ====== 左侧半圆弧侧边栏 ====== */}
      <div
        className={`sidebar-panel ${isOpen ? "sidebar-panel--open" : ""} ${
          dragStateRef.current === "ready" ? "sidebar-panel--ready" : ""
        }`}
        role="navigation"
        aria-label="主菜单"
      >
        {/* 裁切容器 — 右侧大圆弧 */}
        <div className="sidebar-arc-clip">
          {/* ====== 收起模式：仅显示猫爪手柄 ====== */}
          {!isOpen && (
            <div className="sidebar-collapsed-handle">
              <button
                type="button"
                className="sidebar-paw-ring sidebar-paw-ring--collapsed"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                aria-label="向左拉动展开菜单"
                tabIndex={0}
              >
                <BigPawIcon />
              </button>
            </div>
          )}

          {/* ====== 展开模式：完整面板内容 ====== */}
          {isOpen && (
            <>
              {/* ✕ 关闭按钮 */}
              <button
                type="button"
                className="sidebar-close-btn"
                onClick={handleOverlayClick}
                aria-label="收起菜单"
              >
                <X size={18} strokeWidth={2.5} />
              </button>

              {/* 头部：宠物信息 */}
              <div className="sidebar-header">
                {/* 头像 */}
                <div className="sidebar-avatar-ring">
                  {pet?.avatar_url || pet?._resolved_avatar_url ? (
                    <img
                      src={pet.avatar_url || pet._resolved_avatar_url}
                      alt={pet.name}
                      className="sidebar-avatar-img"
                    />
                  ) : (
                    <div className="sidebar-avatar-placeholder">
                      {pet?.species === "cat" ? "\uD83D\uDC08" : pet?.species === "dog" ? "\uD83D\uDC15" : "\uD83E\uDD8A"}
                    </div>
                  )}
                  {/* 星星装饰 */}
                  <Star className="sidebar-avatar-star sidebar-avatar-star--1" size={14} fill="#F5B942" stroke="#F5B942" />
                  <Star className="sidebar-avatar-star sidebar-avatar-star--2" size={10} fill="#F5B942" stroke="#F5B942" />
                </div>

                {/* 名字行 */}
                <div className="sidebar-pet-name-row">
                  <span className="sidebar-pet-name">{pet?.name || "毛孩子"}</span>
                  <span className={`sidebar-gender-badge${pet?.gender === "male" ? " sidebar-gender-badge--male" : pet?.gender === "female" ? " sidebar-gender-badge--female" : ""}`}>
                    {pet?.gender === "male" ? "\u2642" : pet?.gender === "female" ? "\u2640" : ""}
                  </span>
                </div>

                {/* 品种标签 */}
                <div className="sidebar-breed-tag">
                  <span aria-hidden="true">📍</span>
                  {formatBreed(pet?.breed)}
                </div>
              </div>

              {/* 菜单列表 */}
              <nav className="sidebar-menu" aria-label="功能菜单">
                {menuItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="sidebar-menu-item"
                    role="menuitem"
                    data-index={idx}
                  >
                    <span className="sidebar-menu-icon">{item.icon}</span>
                    <div className="sidebar-menu-text">
                      <span className="sidebar-menu-title">{item.title}</span>
                      <span className="sidebar-menu-subtitle">{item.subtitle}</span>
                    </div>
                    {item.badge && (
                      <span className="sidebar-menu-badge">{item.badge}</span>
                    )}
                    <ChevronRight className="sidebar-menu-arrow" size={16} />
                  </div>
                ))}
              </nav>

              {/* 底部：提示文字 + 爪印装饰 */}
              <div className="sidebar-bottom-area">
                <span className="sidebar-hint-text">向左滑动 收起菜单~</span>
                <PawDecorations />

                {/* 拉绳 + 猫爪拉环 */}
                <div
                  className={`sidebar-cord-area ${dragStateRef.current === "ready" ? "sidebar-cord-area--ready" : ""}`}
                >
                  <div
                    className="sidebar-pink-cord"
                    style={{ height: `${60 + pullDist * 0.5}px` }}
                  />
                  <button
                    type="button"
                    className={`sidebar-paw-ring ${dragStateRef.current === "ready" ? "sidebar-paw-ring--ready" : ""}`}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    aria-label="向右拉动收起菜单"
                    tabIndex={0}
                  >
                    <BigPawIcon />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- 大号猫爪 SVG ---------- */

function BigPawIcon() {
  return (
    <svg
      className="big-paw-icon"
      width="40"
      height="40"
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <ellipse cx="50" cy="60" rx="24" ry="20" />
      <ellipse cx="20" cy="28" rx="11" ry="10" transform="rotate(-20 20 28)" />
      <ellipse cx="39" cy="12" rx="10" ry="9" transform="rotate(-8 39 12)" />
      <ellipse cx="61" cy="12" rx="10" ry="9" transform="rotate(8 61 12)" />
      <ellipse cx="80" cy="28" rx="11" ry="10" transform="rotate(20 80 28)" />
    </svg>
  );
}

/* ---------- 散落的爪印装饰 ---------- */

function PawDecorations() {
  return (
    <div className="sidebar-paw-decor" aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 100 100" fill="rgba(200,170,130,0.15)" className="paw-dec paw-dec--1">
        <ellipse cx="50" cy="58" rx="22" ry="18" />
        <ellipse cx="22" cy="28" rx="10" ry="9" transform="rotate(-20 22 28)" />
        <ellipse cx="40" cy="14" rx="9" ry="8" transform="rotate(-8 40 14)" />
        <ellipse cx="60" cy="14" rx="9" ry="8" transform="rotate(8 60 14)" />
        <ellipse cx="78" cy="28" rx="10" ry="9" transform="rotate(20 78 28)" />
      </svg>
      <svg width="14" height="14" viewBox="0 0 100 100" fill="rgba(200,170,130,0.10)" className="paw-dec paw-dec--2">
        <ellipse cx="50" cy="58" rx="22" ry="18" />
        <ellipse cx="22" cy="28" rx="10" ry="9" transform="rotate(-20 22 28)" />
        <ellipse cx="40" cy="14" rx="9" ry="8" transform="rotate(-8 40 14)" />
        <ellipse cx="60" cy="14" rx="9" ry="8" transform="rotate(8 60 14)" />
        <ellipse cx="78" cy="28" rx="10" ry="9" transform="rotate(20 78 28)" />
      </svg>
      <svg width="12" height="12" viewBox="0 0 100 100" fill="rgba(200,170,130,0.08)" className="paw-dec paw-dec--3">
        <ellipse cx="50" cy="58" rx="22" ry="18" />
        <ellipse cx="22" cy="28" rx="10" ry="9" transform="rotate(-20 22 28)" />
        <ellipse cx="40" cy="14" rx="9" ry="8" transform="rotate(-8 40 14)" />
        <ellipse cx="60" cy="14" rx="9" ry="8" transform="rotate(8 60 14)" />
        <ellipse cx="78" cy="28" rx="10" ry="9" transform="rotate(20 78 28)" />
      </svg>
    </div>
  );
}
