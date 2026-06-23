import { ReactNode } from "react";

export interface HeroCardProps {
  label?: string;
  score: number | string;
  unit?: string;
  statusText?: string;
  /** 宠物形象。默认 emoji；项目里有真实照片可传 <img /> 或自定义节点 */
  petVisual?: ReactNode;
}

export default function HeroCard({
  label = "今日健康分",
  score,
  unit = "%",
  statusText = "状态正常",
  petVisual = "🐕",
}: HeroCardProps) {
  return (
    <div className="petos-hero-stack" data-testid="petos-hero-stack">
      <div className="petos-hero-photo" aria-hidden="true">
        {petVisual}
      </div>
      <section className="petos-hero" data-testid="petos-hero">
        <div className="petos-hero__label">{label}</div>
        <div className="petos-hero__score">
          <span className="petos-hero__num">{score}</span>
          {unit && <span className="petos-hero__unit">{unit}</span>}
        </div>
        <div className="petos-hero__status">{statusText}</div>
      </section>
    </div>
  );
}
