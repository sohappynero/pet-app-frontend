/**
 * MeltingBorder — 四周融化滴落边缘装饰
 * 仅生成 #FFE4BD 的融化边框层，不干涉内容区背景色
 */
import React from "react";

interface MeltingBorderProps {
  borderColor?: string;
  borderWidth?: number;
  meltStrength?: number;
  frequency?: number;
  seed?: number;
}

const MeltingBorder: React.FC<MeltingBorderProps> = ({
  borderColor = "#FFE4BD",
  borderWidth = 12,
  meltStrength = 55,
  frequency = 0.01,
  seed = 42,
}) => {
  const [size, setSize] = React.useState({ w: 390, h: 844 });

  React.useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const { w, h } = size;
  const fid = `mf-${seed}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <filter id={fid} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency={`${frequency * 1.2} ${frequency}`} numOctaves="4" seed={seed} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={meltStrength} xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>
        {/* 融化边框层 */}
        <rect x="0" y="0" width={w} height={h} rx="24" ry="24" fill={borderColor} filter={`url(#${fid})`} />
      </svg>
    </div>
  );
};

export default MeltingBorder;
