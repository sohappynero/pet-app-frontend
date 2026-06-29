import React from 'react';

interface CatPawHandleProps {
  isDragging: boolean;
  dragY: number;
  lightIntensity?: number;
  onDragStart: (e: React.PointerEvent) => void;
  onDragMove: (e: React.PointerEvent) => void;
  onDragEnd: (e: React.PointerEvent) => void;
}

const CatPawHandle: React.FC<CatPawHandleProps> = ({
  isDragging,
  dragY,
  lightIntensity = 0.15,
  onDragStart,
  onDragMove,
  onDragEnd,
}) => {
  const PawIcon = () => (
    <svg
      width="36"
      height="36"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="24" cy="34" rx="7.5" ry="6.5" fill="#F28B82" opacity="0.92" />
      <ellipse cx="24" cy="33.5" rx="5" ry="4" fill="#FFB4AC" opacity="0.45" />
      <ellipse cx="15" cy="21" rx="4" ry="4.8" fill="#F28B82" opacity="0.88" />
      <ellipse cx="14.6" cy="20.2" rx="2.4" ry="2.8" fill="#FFB4AC" opacity="0.4" />
      <ellipse cx="23" cy="15.5" rx="3.5" ry="4.2" fill="#F28B82" opacity="0.88" />
      <ellipse cx="22.6" cy="14.8" rx="2" ry="2.4" fill="#FFB4AC" opacity="0.4" />
      <ellipse cx="31" cy="15.5" rx="3.5" ry="4.2" fill="#F28B82" opacity="0.88" />
      <ellipse cx="30.6" cy="14.8" rx="2" ry="2.4" fill="#FFB4AC" opacity="0.4" />
      <ellipse cx="37.5" cy="21" rx="4" ry="4.8" fill="#F28B82" opacity="0.88" />
      <ellipse cx="37.1" cy="20.2" rx="2.4" ry="2.8" fill="#FFB4AC" opacity="0.4" />
    </svg>
  );

  return (
    <div style={{ zIndex: 10 }}>
      <div
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        className="cursor-grab active:cursor-grabbing select-none touch-none"
        style={{
          transform: `translateY(${dragY}px) scale(${isDragging ? 1.1 : 1})`,
          transition: isDragging
            ? 'none'
            : 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: '52px',
            height: '52px',
            background: 'radial-gradient(circle, #FFFCF6 35%, #FFF4E8 60%, #FFECD8 85%)',
            border: '2.5px solid rgba(230, 210, 180, 0.6)',
            boxShadow: isDragging
              ? `0 8px 30px rgba(180, 120, 60, 0.3), 0 4px 12px rgba(0,0,0,0.12), 0 0 ${16 + lightIntensity * 20}px rgba(255, 180, 100, ${0.1 + lightIntensity * 0.15})`
              : '0 6px 20px rgba(120, 80, 40, 0.18), 0 3px 8px rgba(0,0,0,0.08), 0 0 10px rgba(255, 200, 140, 0.08)',
            transition: isDragging
              ? 'box-shadow 150ms ease-out'
              : 'box-shadow 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <PawIcon />
        </div>
      </div>
    </div>
  );
};

export default CatPawHandle;
