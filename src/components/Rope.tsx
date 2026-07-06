import React from 'react';

interface RopeProps {
  isDragging: boolean;
  dragY: number;
  intensity?: number;
}

/**
 * 生成贝塞尔曲线 path d 属性（悬链线近似）
 * @param len 绳子长度
 * @param sag 下垂深度
 * @param offsetX 水平偏移（拖拽时弯曲）
 */
function cordPath(len: number = 38, sag: number = 3, offsetX: number = 0): string {
  const x1 = 16;
  const y1 = 0;
  // 控制点始终在起点终点正中间（保持直线）
  const cx = 16 + offsetX * 0.5;
  const cy = len * 0.5;
  const x2 = 16 + offsetX;
  const y2 = len;
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

const Rope: React.FC<RopeProps> = ({ isDragging, dragY, intensity = 0.15 }) => {
  const baseLen = Math.max(38, 38 + dragY * 0.15); // 大幅缩短拉伸
  const sag = 0; // 无弯曲
  const offsetX = 0; // 无水平偏移，保持直线
  const glowOpacity = 0.03 + intensity * 0.08;

  return (
    <div
      className={`cord-svg-wrap ${isDragging ? 'cord-svg-wrap--dragging' : ''}`}
      style={{
        transform: `translateY(${dragY * 0.15}px)`, // 缩短位移
        transition: isDragging
          ? 'none'
          : 'transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1)',
      }}
      aria-hidden="true"
    >
      <svg
        width="28"
        height={baseLen + 8}
        viewBox={`0 0 28 ${baseLen + 8}`}
        preserveAspectRatio="none"
        style={{ overflow: 'visible', display: 'block' }}
      >
        <defs>
          {/* 绳子渐变 — 金色到暖棕 */}
          <linearGradient id="ropeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8DCC8" />
            <stop offset="25%" stopColor="#DDD0B8" />
            <stop offset="55%" stopColor="#D0C4A8" />
            <stop offset="82%" stopColor="#C4B898" />
            <stop offset="100%" stopColor="#B8AC88" />
          </linearGradient>
          {/* 阴影 */}
          <filter id="ropeShadow" x="-50%" y="-10%" width="200%" height="130%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor={isDragging ? "rgba(180,140,80,0.3)" : "rgba(140,110,60,0.15)"} />
          </filter>
        </defs>
        {/* 绳子主体曲线 */}
        <path
          d={cordPath(baseLen, sag, offsetX)}
          fill="none"
          stroke="url(#ropeGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          filter="url(#ropeShadow)"
          style={{ transition: 'd 0.1s ease-out' }}
        />
        {/* 高光丝线 */}
        <path
          d={cordPath(baseLen, sag + 0.5, offsetX - 0.6)}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ transition: 'd 0.1s ease-out' }}
        />
        {/* 编织纹理线 */}
        <path
          d={cordPath(baseLen, sag - 0.3, offsetX + 0.4)}
          fill="none"
          stroke="rgba(120,100,60,0.08)"
          strokeWidth="1"
          strokeDasharray="3 4"
          strokeLinecap="round"
          style={{ transition: 'd 0.1s ease-out' }}
        />
      </svg>
    </div>
  );
};

export default Rope;
