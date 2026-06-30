import React from 'react';

interface PetBackgroundProps {
  petImage: string;
  isDrawerOpen: boolean;
  isDimmed: boolean;
  isTransitioning: boolean;
}

/**
 * Layer 1 - 全屏宠物背景层（清晰展示）
 *
 * 设计目标：宠物大图清晰可见，占据画面主体（参考目标设计）
 * - idle:     轻微提亮，无模糊（清晰展示宠物）
 * - drawer:   轻微模糊+暗化
 * - dimmed:   opacity 0.4 (灯触发时)
 */
const PetBackground: React.FC<PetBackgroundProps> = ({
  petImage,
  isDrawerOpen,
  isDimmed,
  isTransitioning,
}) => {
  // idle: 轻微模糊+适度亮色 — 背景作为氛围层，猫咪轮廓清晰可辨
  // drawer: 稍强模糊+微提亮 — 抽屉打开时背景适当弱化
  const filterStyle = isDrawerOpen
    ? 'blur(10px) brightness(0.82) saturate(0.96)'
    : 'blur(8px) brightness(0.78) saturate(0.92)';
  const scaleValue = isDrawerOpen ? 1.08 : 1; /* default=1, drawer open=1.08 */

  return (
    <div
      className="absolute inset-0 w-full h-full transition-all duration-[420ms]"
      style={{
        transform: `scale(${scaleValue})`,
        filter: filterStyle,
        opacity: isDimmed ? 0.4 : 1,
        transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      {/* 宠物背景图片 */}
      <div
        className="w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${petImage})`,
          transition: `opacity ${isTransitioning ? 500 : 0}ms ease-in-out`,
        }}
      />
      {/* 暖色暗角 — 深棕色四周渐暗，营造温馨包围感 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 65% at 50% 45%, transparent 15%, rgba(40,25,10,0.55) 60%, rgba(20,12,5,0.80) 100%)',
          transition: 'all 500ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />
      {/* 整体暖色调滤镜 — 琥珀色叠加 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(120,70,20,0.32) 0%, rgba(80,45,15,0.26) 50%, rgba(60,35,10,0.40) 100%)',
          mixBlendMode: 'multiply',
          transition: 'all 500ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />
      {/* 右上暖光源 — 模拟灯光照射 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDrawerOpen
            ? 'none'
            : 'radial-gradient(ellipse 55% 65% at 82% 12%, rgba(255,190,80,0.38) 0%, rgba(255,170,60,0.18) 35%, transparent 65%)',
          transition: 'all 500ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />
    </div>
  );
};

export default PetBackground;
