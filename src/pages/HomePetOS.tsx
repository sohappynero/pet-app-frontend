import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, MessageCircle, Menu, Sparkles } from 'lucide-react';
import { useShell } from '../hooks/useShell';
import { fetchAnalysisDashboard, fetchReminders } from '../lib/api';
import type { Pet } from '../types';

// 4层架构组件
import PetBackground from '../components/PetBackground';
import GlassOverlay from '../components/GlassOverlay';
import Drawer from '../components/Drawer';
import LampSwitch from '../components/LampSwitch';
import '../styles/home-dashboard.css';

/* ---------- helpers ---------- */

function speciesEmoji(s: Pet['species']): string {
  if (s === 'dog') return '\uD83D\uDC15';
  if (s === 'cat') return '\uD83D\uDC08';
  return '\uD83E\uDD8A';
}

function petAvatarUrl(pet: Pet): string | null {
  return pet._resolved_avatar_url || pet.avatar_url || pet.image_url || null;
}

function genderLabel(g: Pet['gender']): string {
  if (g === 'male') return '公';
  if (g === 'female') return '母';
  return '--';
}

// 默认宠物背景图（用于全屏展示）
const DEFAULT_PET_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80', // 猫
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80', // 狗
];

/* ---------- main component ---------- */

export default function HomePetOS() {
  const navigate = useNavigate();
  const { pets, selectedPet, selectedPetId, setPetId, nickname } = useShell();

  // UI 状态
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [petBgIndex, setPetBgIndex] = useState(0);
  const [ambientIntensity, setAmbientIntensity] = useState(0);

  // 光源强度变化回调（来自 LampSwitch）— 上限提升到 0.25，让环境光可见
  const handleLightIntensityChange = React.useCallback(
    (intensity: number) => {
      setAmbientIntensity(intensity * 0.25); // 最大 0.25，温暖环境光覆盖
    },
    [],
  );

  // 数据状态
  const [reminderCount, setReminderCount] = useState<number>(0);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [descExpanded, setDescExpanded] = useState(false);

  // 加载数据
  useEffect(() => {
    if (!selectedPet) {
      setReminderCount(0);
      setRecordCount(0);
      return;
    }

    let cancelled = false;

    Promise.all([
      fetchAnalysisDashboard(selectedPet.id).catch((err) => {
        console.error('[HomeDashboard] fetchAnalysisDashboard error:', err);
        return null;
      }),
      fetchReminders(selectedPet.phone, selectedPetId ?? undefined, 'pending')
        .then((resp) => resp.data || [])
        .catch(() => []),
    ]).then(([dashboard, reminders]) => {
      if (cancelled) return;

      if (dashboard) {
        setRecordCount(
          dashboard.stats?.record_count ||
            dashboard.recent_records?.length ||
            0,
        );
      }
      setReminderCount(Array.isArray(reminders) ? reminders.length : 0);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedPet?.id, selectedPet?.phone, selectedPetId]);

  const url = selectedPet ? petAvatarUrl(selectedPet) : null;

  // 获取当前宠物背景图
  const currentPetBackground =
    url || DEFAULT_PET_BACKGROUNDS[petBgIndex % DEFAULT_PET_BACKGROUNDS.length];

  // 拉灯触发宠物切换
  const handleLampTrigger = () => {
    if (pets.length < 2) return;

    // 触发效果
    setIsDimmed(true);
    setIsTransitioning(true);

    setTimeout(() => {
      // 切换到下一个宠物
      const currentIndex = pets.findIndex((p) => p.id === selectedPetId);
      const nextIndex = (currentIndex + 1) % pets.length;
      setPetId(pets[nextIndex].id);
      setPetBgIndex(nextIndex);
    }, 300);

    setTimeout(() => {
      setIsDimmed(false);
      setIsTransitioning(false);
    }, 700);
  };

  /* ---- render ---- */

  // 无宠物空状态
  if (pets.length === 0) {
    return (
      <div className="immersive-page">
        <div className="immersive-empty">
          <span className="immersive-empty-icon" aria-hidden="true">
            🐾
          </span>
          <h2 className="immersive-empty-title">还没有添加宠物</h2>
          <p className="immersive-empty-desc">
            快来添加你的第一个毛孩子，开启智能健康之旅吧
          </p>
          <button
            type="button"
            className="immersive-empty-cta"
            onClick={() => navigate('/app/pets/add')}
          >
            添加我的宠物 →
          </button>
        </div>
      </div>
    );
  }

  if (!selectedPet) return null;

  return (
    <div className="immersive-page">
      {/* ===== Layer 1: 全屏宠物背景 ===== */}
      <PetBackground
        petImage={currentPetBackground}
        isDrawerOpen={isDrawerOpen}
        isDimmed={isDimmed}
        isTransitioning={isTransitioning}
      />

      {/* ===== Layer 2: 毛玻璃遮罩 ===== */}
      <GlassOverlay isVisible={isDrawerOpen} />

      {/* ===== Layer 3: UI层 ===== */}
      <div className="immersive-ui-layer">
        {/* 顶部状态栏 */}
        <header className="immersive-topbar">
          <button
            type="button"
            className="immersive-menu-btn"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="打开菜单"
          >
            <Menu size={22} color="#5D4E37" />
          </button>

          <div className="immersive-topbar-center">
            <Sparkles size={14} color="#E8B84A" />
            <span className="immersive-topbar-title" style={{ color: '#F5C56A', textShadow: '0 1px 6px rgba(80,40,10,0.25), 0 0 12px rgba(245,197,106,0.15)' }}>{selectedPet.name}，今天也要开心哦～</span>
          </div>

          <div style={{ width: 36 }} /> {/* 占位保持居中 */}
        </header>

        {/* 主内容区 - 宠物信息卡（底部浮起） */}
        <div className={`immersive-content ${isDrawerOpen ? 'dimmed' : ''}`}>
          <div className="immersive-pet-card immersive-pet-card--horizontal">
            {/* 左侧：宠物头像 */}
            <div className="immersive-avatar-section">
              {url ? (
                <img
                  src={url}
                  alt={selectedPet.name}
                  className="immersive-pet-avatar"
                />
              ) : (
                <div className="immersive-avatar-placeholder">
                  {speciesEmoji(selectedPet.species)}
                </div>
              )}
            </div>

            {/* 右侧：信息内容 */}
            <div className="immersive-info-section">
              {/* 标题行：名字 + 性别 + 收藏 */}
              <div className="immersive-header-row">
                <h1 className="immersive-pet-name">
                  {selectedPet.name}
                  <span className="pet-gender-symbol">
                    {selectedPet.gender === 'male' ? '♂' : selectedPet.gender === 'female' ? '♀' : ''}
                  </span>
                </h1>
                <button
                  type="button"
                  className={`immersive-fav-btn${isFav ? ' active' : ''}`}
                  onClick={() => setIsFav(!isFav)}
                  aria-label={isFav ? '取消收藏' : '收藏'}
                >
                  <Heart size={18} fill={isFav ? '#FFFFFF' : 'none'} stroke={isFav ? '#FFFFFF' : '#FF9EB5'} />
                </button>
              </div>

              {/* 品种行 */}
              <div className="immersive-breed-row">
                <MapPin size={13} color="#C4A882" />
                <span>{selectedPet.breed || '混血宠物'}</span>
              </div>

              {/* 属性标签组 */}
              <div className="immersive-tags-row">
                <div className="immersive-tag">
                  <span className="tag-label">性别</span>
                  <span className="tag-value">{genderLabel(selectedPet.gender)}</span>
                </div>
                <div className="immersive-tag">
                  <span className="tag-label">年龄</span>
                  <span className="tag-value">{selectedPet.age || '--'}</span>
                </div>
                <div className="immersive-tag">
                  <span className="tag-label">体重</span>
                  <span className="tag-value">
                    {selectedPet.weight_kg != null
                      ? `${selectedPet.weight_kg}kg`
                      : '--'}
                  </span>
                </div>
              </div>

              {/* 毛发颜色 + 体型 */}
              <div className="immersive-detail-row">
                <span>毛发颜色: {selectedPet.color || '奶油色'}</span>
                <span className="detail-sep">|</span>
                <span>体型: {selectedPet.size || '小型'}</span>
              </div>

              {/* 操作行：Read More + 聊天按钮 */}
              <div className="immersive-action-row">
                <button
                  type="button"
                  className="read-more-btn"
                  onClick={() => setDescExpanded(!descExpanded)}
                >
                  Read More &gt;
                </button>
                <button
                  type="button"
                  className="action-chat-btn"
                  onClick={() => navigate('/app/chat')}
                  aria-label="发消息"
                >
                  <MessageCircle size={17} color="#7C9885" />
                </button>
              </div>
            </div>

            {/* 右侧边缘：下拉切换提示 */}
            <div className="immersive-switch-hint">
              <span>下拉切换宠物</span>
              <span className="switch-arrow">⌄</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Ambient Layer: 全屏环境暖光（由猫爪灯驱动） ===== */}
      <div
        className="lamp-ambient-layer"
        style={{ '--ambient-opacity': ambientIntensity } as React.CSSProperties}
      />

      {/* ===== Layer 4: 左侧抽屉菜单 ===== */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        pets={pets}
        selectedPet={selectedPet}
      />

      {/* ===== Layer 4: 右侧猫爪拉灯系统（光源核心） ===== */}
      <LampSwitch onTrigger={handleLampTrigger} onLightIntensityChange={handleLightIntensityChange} />
    </div>
  );
}
