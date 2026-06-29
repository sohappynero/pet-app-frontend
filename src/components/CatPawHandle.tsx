import React from 'react';

interface CatPawHandleProps {
  isDragging: boolean;
  dragY: number;
  lightIntensity?: number;
  onDragStart: (e: React.PointerEvent) => void;
  onDragMove: (e: React.PointerEvent) => void;
  onDragEnd: (e: React.PointerEvent) => void;
}

/**
 * CatPawHandle - 迷你猫爪吊坠（灯罩下方交互热区）
 * - 缩小至 32px 精致尺寸
 * - 拖动时 scale 放大 + 光晕增强
 * - 移除提示文字（空间紧凑）
 */
const CatPawHandle: React.FC<CatPawHandleProps> = ({
  isDragging,
  dragY,
  lightIntensity = 0.15,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  // 光强驱动的发光计算 — 暖金色调
  const glowColor =
    isDragging || lightIntensity > 0.3
      ? `rgba(240, 176, 70, ${0.3 + lightIntensity * 0.35})`
      : 'rgba(232, 212, 180, 0.2)';

  const glowSize = isDragging ? 70 : 50 + lightIntensity * 25;

  const PawIcon = () => (
    <svg
      width="32"
      height="32"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 掌垫 */}
      <ellipse cx="24" cy="34" rx="7.5" ry="6.5" fill="#E8A84C" opacity="0.9" />
      <ellipse cx="24" cy="33.5" rx="5" ry="4" fill="#F5D48C" opacity="0.5" />
      {/* 四个趾垫 */}
      <ellipse cx="15" cy="21" rx="4" ry="4.8" fill="#E8A84C" opacity="0.85" />
      <ellipse cx="14.6" cy="20.2" rx="2.4" ry="2.8" fill="#F5D48C" opacity="0.45" />
      <ellipse cx="23" cy="15.5" rx="3.5" ry="4.2" fill="#E8A84C" opacity="0.85" />
      <ellipse cx="22.6" cy="14.8" rx="2" ry="2.4" fill="#F5D48C" opacity="0.45" />
      <ellipse cx="31" cy="15.5" rx="3.5" ry="4.2" fill="#E8A84C" opacity="0.85" />
      <ellipse cx="30.6" cy="14.8" rx="2" ry="2.4" fill="#F5D48C" opacity="0.45" />
      <ellipse cx="37.5" cy="21" rx="4" ry="4.8" fill="#E8A84C" opacity="0.85" />
      <ellipse cx="37.1" cy="20.2" rx="2.4" ry="2.8" fill="#F5D48C" opacity="0.45" />
    </svg>
  );

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={{ zIndex: 10, top: '8px' }} /* 从-bottom-1改为top:8px：增加与灯罩间距 */
    >
      <div
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        className="cursor-grab active:cursor-grabbing select-none touch-none"
        style={{
          transform: `translateY(${dragY}px) scale(${isDragging ? 1.12 : 1})`,
          transition: isDragging
            ? 'none'
            : 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {/* 外圈光晕 */}
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            padding: '5px',
            background: `radial-gradient(circle, ${glowColor} 0%, transparent ${glowSize}%)`,
            boxShadow: isDragging
              ? `0 6px 24px rgba(240, 176, 70, ${0.3 + lightIntensity * 0.28}), 0 0 ${16 + lightIntensity * 24}px rgba(255, 200, 100, ${0.12 + lightIntensity * 0.18})`
              : `0 3px 12px rgba(0, 0, 0, 0.04), 0 0 10px ${glowColor}`,
            transition: isDragging
              ? 'box-shadow 150ms ease-out'
              : 'box-shadow 400ms cubic-bezier(0.34, 1.56, 0.64, 1), background 300ms ease',
          }}
        >
          <PawIcon />
        </div>
      </div>
    </div>
  );
};

export default CatPawHandle;
