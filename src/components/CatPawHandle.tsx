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

  const tiltDeg = Math.min(dragY * 0.03, 3); // 大幅减小倾斜
  const stretchY = 1 + Math.min(dragY * 0.0005, 0.02); // 几乎不拉伸

  return (
    <div style={{ zIndex: 10 }}>
      {/* 吊坠整体 */}
      <div
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
        className="cursor-grab active:cursor-grabbing select-none touch-none"
        style={{
          transform: `translateY(${dragY * 0.85}px) rotateZ(${tiltDeg}deg) scaleY(${stretchY})`,
          transition: isDragging
            ? 'none'
            : 'transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          userSelect: 'none',
          touchAction: 'none',
          transformOrigin: 'top center',
          perspective: '400px',
        }}
      >
        {/* ====== 顶部金属连接小环 ====== */}
        <div className="flex justify-center" style={{ marginBottom: -6 }}>
          <svg width="16" height="13" viewBox="0 0 16 13">
            <ellipse
              cx="8"
              cy="7"
              rx="5.5"
              ry="5"
              fill="none"
              stroke="#C9A04E"
              strokeWidth="2.2"
            />
          </svg>
        </div>

        {/* ====== 吊坠本体 — 椭圆立体球体 ====== */}
        <div
          className="flex items-center justify-center relative overflow-hidden pendant-body-3d"
          style={{
            width: '56px',
            height: '62px',
            borderRadius: '50% / 55%',
            marginTop: -2, // 与小环紧密贴合
            background: `
              radial-gradient(ellipse at 32% 24%, rgba(255,245,225,0.95) 0%, transparent 58%),
              linear-gradient(
                158deg,
                #FFE8CC 0%,
                #FFD9A8 22%,
                #FFC485 48%,
                #F0A86A 72%,
                #E08845 92%,
                #D06828 100%
              )
            `,
            boxShadow: isDragging
              ? `0 0 ${18 + lightIntensity * 12}px rgba(255,140,100,0.42),
                 0 0 ${40 + lightIntensity * 15}px rgba(255,184,120,0.20),
                 0 12px 30px rgba(170,110,70,0.35),
                 0 6px 14px rgba(150,90,60,0.20),
                 inset 3px 3px 9px rgba(255,255,255,0.58),
                 inset -3px -4px 12px rgba(200,130,80,0.22)`
              : `0 0 14px rgba(255,184,130,0.30),
                 0 0 32px rgba(255,154,110,0.12),
                 0 10px 26px rgba(170,110,70,0.28),
                 0 5px 12px rgba(150,90,60,0.16),
                 inset 2.5px 2.5px 7px rgba(255,255,255,0.55),
                 inset -2.5px -3px 10px rgba(180,120,80,0.18)`,
            transition: isDragging
              ? 'box-shadow 150ms ease-out'
              : 'box-shadow 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* 底部反光条 */}
          <span
            className="absolute left-[10%] right-[10%] bottom-[6px] h-[2px] rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 30%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.18) 70%, transparent 100%)',
            }}
          />
          {/* 猫爪图标（保持不变） */}
          <PawIcon />
        </div>
      </div>
    </div>
  );
};

export default CatPawHandle;
