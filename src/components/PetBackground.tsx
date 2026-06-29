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
  // 规范：default scale(1), drawer: scale(1.08) blur(12px) brightness(0.65)
  const filterStyle = isDrawerOpen
    ? 'blur(12px) brightness(0.65) saturate(0.9)'
    : 'blur(0px) brightness(1.0) saturate(1.05)';
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
      {/* 氛围渐变遮罩 — 暖黄奶油色调叠层（目标设计风格） */}
      {/* 增强版：右侧暖光更强，模拟被灯照射的效果（参考图氛围） */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDrawerOpen
            ? 'radial-gradient(120% 100% at 85% 40%, rgba(255,220,150,0.15) 0%, rgba(247,231,211,0.32) 40%, rgba(180,160,130,0.20) 80%, rgba(150,130,100,0.12) 100%)'
            : 'radial-gradient(110% 105% at 85% 15%, rgba(255,225,165,0.22) 0%, rgba(255,240,215,0.18) 30%, rgba(255,225,180,0.14) 50%, rgba(250,220,195,0.10) 70%, transparent 92%)',
          transition: 'all 500ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />
    </div>
  );
};

export default PetBackground;
