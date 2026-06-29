import React from 'react';

interface RopeProps {
  isDragging: boolean;
  dragY: number;
  intensity?: number; // 0~1 光强
}

/**
 * Rope - 吊灯拉绳（#FFD6A5 暖色系）
 * - 默认高度 260px，拖拽时伸长
 * - 宽度 1.5px 纤细精致
 * - 配色：#FFD6A5 暖琥珀渐变（规范主色）
 * - 发光强度随光强增加
 */
const Rope: React.FC<RopeProps> = ({ isDragging, dragY, intensity = 0.15 }) => {
  // 规范 #FFD6A5 (255,214,165) → amber 变亮
  const warmShift = Math.min(1, intensity * 1.8);

  // rope 主色从 浅米白(#FFE8CC) 渐变到 #F5B942(amber)
  const topColorR = 255 - Math.round(warmShift * 0);
  const topColorG = 232 - Math.round(warmShift * 18);
  const topColorB = 204 - Math.round(warmShift * 39);

  const midColorR = 255 - Math.round(warmShift * 0);
  const midColorG = 222 - Math.round(warmShift * 28);
  const midColorB = 175 - Math.round(warmShift * 55);

  const bottomColorR = 245 + Math.round(warmShift * 10);
  const bottomColorG = 185 - Math.round(warmShift * 40);
  const bottomColorB = 66 + Math.round(warmShift * 20);

  const topColor = `rgb(${topColorR}, ${topColorG}, ${topColorB})`;
  const midColor = `rgb(${midColorR}, ${midColorG}, ${midColorB})`;
  const bottomColor = `rgb(${bottomColorR}, ${bottomColorG}, ${bottomColorB})`;

  // 发光效果强度
  const glowOpacity = 0.04 + warmShift * 0.22;
  const glowSpread = 3 + warmShift * 8;

  return (
    <div
      className={`w-[1.5px] mx-auto origin-top ${isDragging ? 'lamp-rope-glow warm' : 'lamp-rope-glow'}`}
      style={{
        height: `${Math.max(200, 200 + dragY)}px`, // 默认200px（从260→200：配合缩小的灯罩）
        background: `linear-gradient(180deg, 
          ${topColor} 0%, 
          ${midColor} ${Math.min(55, (dragY / 120) * 100)}%, 
          ${bottomColor} 100%
        )`,
        borderRadius: '1px',
        transform: `translateY(${dragY * 0.5}px)`,
        opacity: isDragging ? 1 : 0.88,
        transition: isDragging
          ? 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), background 180ms ease' /* micro 180ms */
          : 'transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1), height 420ms cubic-bezier(0.2, 0.8, 0.2, 1), background 320ms ease', /* page/UI */
        boxShadow: `0 0 ${glowSpread}px rgba(255, 214, 165, ${glowOpacity})`, /* #FFD6A5 */
      }}
    />
  );
};

export default Rope;
