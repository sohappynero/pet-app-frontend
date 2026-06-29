import React from 'react';

interface RopeProps {
  isDragging: boolean;
  dragY: number;
  intensity?: number;
}

const Rope: React.FC<RopeProps> = ({ isDragging, dragY, intensity = 0.15 }) => {
  const glowOpacity = 0.03 + intensity * 0.08;

  return (
    <div
      className={`mx-auto origin-top ${isDragging ? 'lamp-rope-glow warm' : 'lamp-rope-glow'}`}
      style={{
        width: '7px',
        height: `${Math.max(35, 35 + dragY)}px`,
        background: `repeating-linear-gradient(
          180deg,
          #E8DCC8 0px,
          #DDD0B8 3px,
          #D0C4A8 5px,
          #DDD0B8 7px,
          #E8DCC8 10px
        )`,
        borderRadius: '4px',
        transform: `translateY(${dragY * 0.5}px)`,
        opacity: isDragging ? 1 : 0.95,
        transition: isDragging
          ? 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)'
          : 'transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1), height 420ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        boxShadow: `inset 1px 0 0 rgba(255,255,255,0.2), inset -1px 0 0 rgba(0,0,0,0.05), 0 0 ${3 + intensity * 4}px rgba(200, 180, 150, ${glowOpacity})`,
      }}
    />
  );
};

export default Rope;
