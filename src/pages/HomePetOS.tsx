import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, MessageCircle, Menu, Sparkles, Plus } from 'lucide-react';
import { useShell } from '../hooks/useShell';
import { fetchAnalysisDashboard, fetchReminders, fetchWeightChart } from '../lib/api';
import type { AnalysisDashboardData } from '../lib/api';
import type { Pet, Reminder } from '../types';

import PetBackground from '../components/PetBackground';
import GlassOverlay from '../components/GlassOverlay';
import Drawer from '../components/Drawer';
import LampSwitch from '../components/LampSwitch';
import '../styles/home-dashboard.css';

/* ---------- helpers ---------- */

/** 猫爪形状卡片组件 — SVG 绘制猫爪（暖橙色系：宽圆角掌心 + 顶部4个肉垫 + 掌心大垫） */
function PawCard({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  /* 150x118 画布：参考目标图配色 — 暖杏/琥珀/深棕 */
  return (
    <button
      type="button"
      className="group w-[48%] mr-auto relative transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
      style={{ background: 'transparent', border: 'none', padding: 0 }}
      onClick={onClick}
    >
      <svg viewBox="0 0 150 118" className="w-full h-auto" preserveAspectRatio="xMidYMid meet"
        style={{ filter: 'drop-shadow(0 3px 16px rgba(255,160,80,0.25))' }}
      >
        <defs>
          {/* 掌心渐变 — 暖杏色到浅琥珀 */}
          <linearGradient id="pawFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,225,190,0.30)" />
            <stop offset="50%" stopColor="rgba(255,210,170,0.22)" />
            <stop offset="100%" stopColor="rgba(245,195,155,0.14)" />
          </linearGradient>
          {/* 肉垫渐变 — 深棕橙 */}
          <radialGradient id="padGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="rgba(220,165,110,0.20)" />
            <stop offset="100%" stopColor="rgba(185,130,75,0.15)" />
          </radialGradient>
          {/* 掌心主垫渐变 — 更深的暖棕 */}
          <radialGradient id="mainPadGrad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgba(200,145,90,0.18)" />
            <stop offset="100%" stopColor="rgba(165,110,65,0.14)" />
          </radialGradient>
        </defs>

        {/* ====== 肉垫1 — 左上 (最左) ====== */}
        <ellipse cx="30" cy="28" rx="16" ry="20" fill="url(#padGrad)" stroke="rgba(255,210,150,0.35)" strokeWidth="1.3" />
        <ellipse cx="29" cy="30" rx="10" ry="13" fill="rgba(175,120,70,0.16)" />

        {/* ====== 肉垫2 — 上中偏左 ====== */}
        <ellipse cx="58" cy="17" rx="15" ry="19" fill="url(#padGrad)" stroke="rgba(255,210,150,0.35)" strokeWidth="1.3" />
        <ellipse cx="57" cy="19" rx="9.5" ry="12.5" fill="rgba(175,120,70,0.16)" />

        {/* ====== 肉垫3 — 上中偏右 ====== */}
        <ellipse cx="92" cy="17" rx="15" ry="19" fill="url(#padGrad)" stroke="rgba(255,210,150,0.35)" strokeWidth="1.3" />
        <ellipse cx="93" cy="19" rx="9.5" ry="12.5" fill="rgba(175,120,70,0.16)" />

        {/* ====== 肉垫4 — 右上 (最右) ====== */}
        <ellipse cx="120" cy="28" rx="16" ry="20" fill="url(#padGrad)" stroke="rgba(255,210,150,0.35)" strokeWidth="1.3" />
        <ellipse cx="121" cy="30" rx="10" ry="13" fill="rgba(175,120,70,0.16)" />

        {/* ====== 掌心主体 — 宽圆角矩形 + 顶部弧形连接4个肉垫 ====== */}
        <path d="
          M 24,34
          C 12,34   6,42   6,54
          C 6,72    10,94   20,104
          C 30,112  50,116  75,116
          C 100,116 120,112 130,104
          C 140,94  144,72  144,54
          C 144,42  138,34  126,34
          C 114,34  105,38   98,32
          C 92,26   85,22   75,22
          C 65,22   58,26   52,32
          C 45,38   36,34   24,34
          Z
        " fill="url(#pawFill)" stroke="rgba(255,215,155,0.40)" strokeWidth="1.4" />

        {/* ====== 掌心主垫（底部深色大椭圆）===== */}
        <ellipse cx="75" cy="86" rx="36" ry="23" fill="url(#mainPadGrad)" stroke="rgba(255,195,135,0.25)" strokeWidth="1.1" />
        <ellipse cx="75" cy="87" rx="27" ry="17" fill="rgba(160,105,60,0.15)" />

        {/* ====== 内容区域 ====== */}
        <foreignObject x="8" y="44" width="134" height="64">
          <div className="w-full h-full flex flex-col items-center justify-start pt-0.5 pointer-events-none"
            xmlns="http://www.w3.org/1999/xhtml"
          >
            {children}
          </div>
        </foreignObject>
      </svg>
    </button>
  );
}

function petAvatarUrl(pet: Pet): string | null {
  return pet._resolved_avatar_url || pet.avatar_url || pet.image_url || null;
}

function genderLabel(g: Pet['gender']): string {
  if (g === 'male') return '公';
  if (g === 'female') return '母';
  return '--';
}

function genderSymbol(g: Pet['gender']): string {
  if (g === 'male') return '♂';
  if (g === 'female') return '♀';
  return '';
}

function speciesEmoji(s: Pet['species']): string {
  if (s === 'dog') return '🐕';
  if (s === 'cat') return '🐈';
  return '🦊';
}

const DEFAULT_PET_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80',
];

/* ---------- main component ---------- */

export default function HomePetOS() {
  const navigate = useNavigate();
  const { pets, selectedPet, selectedPetId, setPetId } = useShell();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [petBgIndex, setPetBgIndex] = useState(0);
  const [ambientIntensity, setAmbientIntensity] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);
  const [dashboard, setDashboard] = useState<AnalysisDashboardData | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [weightPoints, setWeightPoints] = useState<Array<{ date: string; kg: number }>>([]);

  const handleLightIntensityChange = useCallback((intensity: number) => {
    setAmbientIntensity(intensity * 0.25);
  }, []);

  useEffect(() => {
    if (!selectedPet) return;
    let cancelled = false;

    Promise.all([
      fetchAnalysisDashboard(selectedPet.id).catch(() => null),
      fetchReminders(selectedPet.phone, selectedPetId ?? undefined, 'pending')
        .then((resp) => resp.data || [])
        .catch(() => [] as Reminder[]),
      fetchWeightChart(selectedPet.id).catch(() => ({ points: [] })),
    ]).then(([dashData, reminderList, weightData]) => {
      if (cancelled) return;
      setDashboard(dashData);
      setReminders(reminderList as Reminder[]);
      setWeightPoints(weightData.points || []);
    });

    return () => { cancelled = true; };
  }, [selectedPet?.id, selectedPet?.phone, selectedPetId]);

  const avatarUrl = selectedPet ? petAvatarUrl(selectedPet) : null;
  const currentPetBackground =
    avatarUrl || DEFAULT_PET_BACKGROUNDS[petBgIndex % DEFAULT_PET_BACKGROUNDS.length];

  const handleLampTrigger = () => {
    if (pets.length < 2) return;
    setIsDimmed(true);
    setIsTransitioning(true);

    setTimeout(() => {
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

  /* ---- empty state ---- */
  if (pets.length === 0) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-[var(--sg-bg)] font-['ZCOOL_KuaiLe',cursive]">
        <div className="relative z-20 flex flex-col items-center justify-center h-screen px-8 text-center">
          <span className="text-[56px] mb-4" aria-hidden="true">🐾</span>
          <h2 className="text-xl font-bold text-[var(--sg-primary)] mb-2">还没有添加宠物</h2>
          <p className="text-sm text-[var(--sg-muted)] leading-relaxed max-w-[260px] mb-6">
            快来添加你的第一个毛孩子，开启智能健康之旅吧
          </p>
          <button
            type="button"
            className="px-7 py-3 bg-gradient-to-br from-[var(--sg-accent)] to-[var(--sg-accent-light)] text-[var(--sg-primary)] border-none rounded-full text-[15px] font-semibold cursor-pointer shadow-[var(--sg-shadow-md)] transition-all duration-250 hover:translate-y-[-2px] hover:shadow-[var(--sg-shadow-lg)]"
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
    <div className="fixed inset-0 overflow-visible font-['ZCOOL_KuaiLe',cursive] bg-[var(--sg-bg)] pb-[120px] box-border">
      {/* Layer 1: 全屏宠物背景 */}
      <PetBackground
        petImage={currentPetBackground}
        isDrawerOpen={isDrawerOpen}
        isDimmed={isDimmed}
        isTransitioning={isTransitioning}
      />

      {/* Layer 2: 毛玻璃遮罩 */}
      <GlassOverlay isVisible={isDrawerOpen} />

      {/* Layer 3: UI层 */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col">
        {/* 顶部状态栏 */}
        <header className="flex items-center justify-between pt-12 px-5 pb-4 pointer-events-auto">
          <button
            type="button"
            className="w-11 h-11 flex items-center justify-center bg-white/[0.12] backdrop-blur-[20px] saturate-[1.15] rounded-[14px] border border-white/[0.18] cursor-pointer transition-all duration-200 shadow-[var(--sg-shadow-sm)] hover:bg-white/20 hover:scale-105"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="打开菜单"
          >
            <Menu size={22} color="#5D4E37" />
          </button>

          <div className="flex items-center gap-1.5">
            <Sparkles size={14} color="#E8B84A" />
            <span className="text-base font-bold text-[#F5C56A] tracking-wide" style={{ textShadow: '0 1px 6px rgba(80,40,10,0.25), 0 0 12px rgba(245,197,106,0.15)' }}>
              {selectedPet.name}，今天也要开心哦～
            </span>
          </div>

          <div className="w-9" />
        </header>

        {/* 仪表盘快捷卡片区 */}
        <div className={`px-5 pointer-events-auto transition-opacity duration-300 ${isDrawerOpen ? 'opacity-40' : ''}`} style={{ marginTop: 8 }}>
          {/* 待办提醒条 */}
          {reminders.length > 0 && (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3.5 py-2.5 mb-3 bg-white/[0.18] backdrop-blur-[16px] border border-white/[0.15] rounded-[14px] text-left"
              onClick={() => navigate('/app/mine/reminders')}
            >
              <span className="text-sm">🔔</span>
              <span className="flex-1 text-xs font-medium text-[#FFFDF8] truncate">
                {reminders[0]?.title || '待办提醒'}
              </span>
              <span className="text-[10px] text-[#E8DCC8] opacity-80">
                {reminders.length > 1 ? `等${reminders.length}项` : '查看'}
              </span>
            </button>
          )}

          {/* 健康评分 + 体重趋势 横排 */}
          {dashboard && (
            <div className="flex flex-col gap-2.5 mb-3">
              {/* 猫爪 SVG 形状定义 — 固定像素路径，真正的4个肉垫凸起 */}
              <svg width="0" height="0" aria-hidden="true">
                <defs>
                  <linearGradient id="pawFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.20)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
                  </linearGradient>
                  {/* 滤镜：柔光发光 */}
                  <filter id="pawGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
              </svg>

              {/* 健康评分 — 猫爪卡片 */}
              <PawCard onClick={() => navigate('/app/records')}>
                <span className="text-[10px] text-[#C4A882]/90 tracking-wide">健康评分</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[26px] font-bold text-[#FFFDF8] leading-none">{dashboard.overall_score ?? '--'}</span>
                  <span className="text-[11px] text-[#E8DCC8]/70 font-medium">分</span>
                </div>
                <svg viewBox="0 0 18 12" className="w-[16px] h-[11px] opacity-55 ml-auto self-end mb-1" fill="none" stroke="#7C9885" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2,9 5,4 9,7 13,2 16,5" />
                </svg>
              </PawCard>

              {/* 体重趋势 — 猫爪卡片 */}
              <PawCard onClick={() => navigate('/app/insights/weight')}>
                <span className="text-[10px] text-[#C4A882]/90 tracking-wide">体重趋势</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  {weightPoints.length > 0 ? (
                    <>
                      <span className="text-[26px] font-bold text-[#FFFDF8] leading-none">{weightPoints[weightPoints.length - 1].kg}</span>
                      <span className="text-[11px] text-[#E8DCC8]/70 font-medium">kg</span>
                    </>
                  ) : (
                    <span className="text-lg text-[#E8DCC8]/50">--</span>
                  )}
                </div>
                {weightPoints.length >= 2 ? (
                  <svg viewBox="0 0 70 24" className="absolute right-3 bottom-2 w-[38px] h-[14px] opacity-60">
                    <polyline
                      fill="none"
                      stroke="#7C9885"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={weightPoints.slice(-6).map((p, i, arr) => {
                        const minKg = Math.min(...arr.map(x => x.kg));
                        const maxKg = Math.max(...arr.map(x => x.kg));
                        const range = maxKg - minKg || 1;
                        const x = (i / (arr.length - 1)) * 64 + 3;
                        const y = 21 - ((p.kg - minKg) / range) * 17;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 22 11" className="absolute right-3 bottom-2.5 w-[17px] h-[9px] opacity-40" fill="none" stroke="#7C9885" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 7 Q6 2, 10 5 T19 5" />
                  </svg>
                )}
              </PawCard>
            </div>
          )}
        </div>

        {/* 主内容区 — 宠物信息卡（底部浮起） */}
        <div className={`flex-1 flex items-end px-3 mb-[12vh] mt-auto pointer-events-auto transition-opacity duration-300 ${isDrawerOpen ? 'opacity-40' : ''}`}>
          {/* 毛玻璃宠物信息卡 */}
          <div
            className="w-full max-w-[460px] mx-auto flex flex-row items-stretch gap-3.5 p-5 py-[30px] bg-white/[0.15] backdrop-blur-[20px] border border-white/[0.18] rounded-[20px] shadow-[0_12px_40px_rgba(0,0,0,0.08)] relative opacity-0 translate-y-[30px]"
            style={{ animation: 'card-enter 420ms cubic-bezier(0.2, 0.8, 0.2, 1) forwards' }}
          >
            {/* 方向光叠加 */}
            <div className="absolute top-0 right-0 bottom-0 w-[65%] pointer-events-none z-[1] opacity-80 mix-blend-screen bg-gradient-to-r from-transparent via-[rgba(255,230,200,0.03)] to-[rgba(255,214,165,0.09)]" />

            {/* 左侧：宠物头像 */}
            <div className="flex-shrink-0 pt-0.5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={selectedPet.name}
                  className="w-[76px] h-[76px] object-cover rounded-[var(--sg-radius-sm)] shadow-[var(--sg-shadow-md)] border-2 border-white/30"
                />
              ) : (
                <div className="w-[76px] h-[76px] flex items-center justify-center text-[34px] bg-gradient-to-br from-[rgba(255,228,188,0.5)] to-[rgba(255,214,165,0.4)] rounded-[var(--sg-radius-sm)] border-2 border-white/20">
                  {speciesEmoji(selectedPet.species)}
                </div>
              )}
            </div>

            {/* 右侧：信息内容 */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              {/* 名字 + 性别 + 收藏 */}
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-lg font-extrabold text-[#FFFDF8] tracking-tight" style={{ textShadow: '0 1px 4px rgba(80,50,20,0.12)' }}>
                  {selectedPet.name}
                  <span className="text-sm font-normal ml-0.5 opacity-80">{genderSymbol(selectedPet.gender)}</span>
                </h1>
                <button
                  type="button"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-[12px] border-[1.5px] cursor-pointer transition-all duration-200 hover:scale-105 bg-[rgba(100,220,200,0.2)] border-[rgba(100,220,200,0.3)]"
                  onClick={() => navigate('/app/pets/add')}
                  aria-label="添加宠物"
                >
                  <Plus size={16} strokeWidth={2.5} stroke="#5CE1B8" />
                  <span className="text-xs font-medium text-[#5CE1B8]">添加宠物</span>
                </button>
              </div>

              {/* 品种行 */}
              <div className="flex items-center gap-1 text-xs text-[#E8DCC8] mb-2">
                <MapPin size={13} color="#C4A882" />
                <span>{selectedPet.breed || '混血宠物'}</span>
              </div>

              {/* 属性标签组 */}
              <div className="flex gap-1.5 mb-2">
                {[
                  { label: '性别', value: genderLabel(selectedPet.gender) },
                  { label: '年龄', value: selectedPet.age || '--' },
                  { label: '体重', value: selectedPet.weight_kg != null ? `${selectedPet.weight_kg}kg` : '--' },
                ].map((tag) => (
                  <div key={tag.label} className="flex-1 flex flex-col items-center py-2 px-1.5 bg-white/[0.12] backdrop-blur-[12px] border border-white/[0.15] rounded-xl">
                    <span className="text-[10px] text-[#C4A882]">{tag.label}</span>
                    <span className="text-sm font-bold text-[#FFFDF8]">{tag.value}</span>
                  </div>
                ))}
              </div>

              {/* 毛发颜色 + 体型 */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#D8C8B0] mb-2.5">
                <span>毛发颜色: {(selectedPet as any).color || '奶油色'}</span>
                <span className="opacity-40">|</span>
                <span>体型: {(selectedPet as any).size || '小型'}</span>
              </div>

              {/* 操作行 */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.12]">
                <button
                  type="button"
                  className="text-[11.5px] font-bold text-[#E8DCC8] bg-transparent border-none cursor-pointer py-1 tracking-wide transition-colors duration-150 hover:text-[#FFFDF8]"
                  onClick={() => setDescExpanded(!descExpanded)}
                >
                  Read More &gt;
                </button>
                <button
                  type="button"
                  className="w-[34px] h-[34px] flex items-center justify-center bg-[rgba(124,152,133,0.12)] backdrop-blur-[12px] border border-[rgba(124,152,133,0.15)] rounded-full cursor-pointer transition-all duration-200 hover:bg-[rgba(124,152,133,0.22)] hover:scale-110"
                  onClick={() => navigate('/app/chat')}
                  aria-label="发消息"
                >
                  <MessageCircle size={17} color="#7C9885" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Ambient Layer */}
      <div
        className="lamp-ambient-layer"
        style={{ '--ambient-opacity': ambientIntensity } as React.CSSProperties}
      />

      {/* Layer 4a: 左侧抽屉 */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        pets={pets}
        selectedPet={selectedPet}
      />

      {/* Layer 4b: 右侧猫爪拉灯 */}
      <LampSwitch onTrigger={handleLampTrigger} onLightIntensityChange={handleLightIntensityChange} />
    </div>
  );
}
