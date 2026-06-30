import React, { useState, useCallback, useRef } from 'react';
import CatPawHandle from './CatPawHandle';
import Rope from './Rope';

export type LampState = 'idle' | 'dragging' | 'triggered' | 'transition';

interface LampSwitchProps {
  onTrigger: () => void;
  onLightIntensityChange?: (intensity: number) => void;
}

const MAX_DRAG = 120;
const TRIGGER_THRESHOLD = 55;

const LampSwitch: React.FC<LampSwitchProps> = ({
  onTrigger,
  onLightIntensityChange,
}) => {
  const [lampState, setLampState] = useState<LampState>('idle');
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number>(0);
  const isTriggeringRef = useRef(false);

  const lightIntensity =
    lampState === 'triggered'
      ? 1.0
      : lampState === 'dragging'
        ? Math.min(0.85, 0.22 + (dragY / MAX_DRAG) * 0.63)
        : lampState === 'transition'
          ? 0.5
          : 0.22;

  const glowIntensity = lightIntensity;

  React.useEffect(() => {
    onLightIntensityChange?.(lightIntensity);
  }, [lightIntensity, onLightIntensityChange]);

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    startYRef.current = e.clientY;
    setLampState('dragging');
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handleDragMove = useCallback(
    (e: React.PointerEvent) => {
      if (lampState !== 'dragging') return;
      e.preventDefault();
      const delta = Math.max(0, e.clientY - startYRef.current);
      const clampedDelta = Math.min(delta, MAX_DRAG);
      setDragY(clampedDelta);
      if (clampedDelta >= TRIGGER_THRESHOLD && !isTriggeringRef.current) {
        isTriggeringRef.current = true;
        setLampState('triggered');
      }
    },
    [lampState],
  );

  const handleDragEnd = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      if (lampState === 'triggered') {
        setLampState('transition');
        onTrigger();
        setTimeout(() => {
          setLampState('idle');
          setDragY(0);
          isTriggeringRef.current = false;
        }, 1200);
      } else {
        setLampState('idle');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setDragY(0);
            isTriggeringRef.current = false;
          });
        });
      }
    },
    [lampState, onTrigger],
  );

  const stateClass =
    lampState === 'dragging'
      ? 'dragging'
      : lampState === 'triggered'
        ? 'triggered'
        : '';

  return (
    <>
      {/* Light Cone */}
      <div className={`lamp-light-cone ${stateClass}`} />

      <div
        className={`fixed top-0 z-30 flex flex-col items-center ${lampState === 'transition' ? 'lamp-swing-dampen' : 'lamp-swing-idle'}`}
        style={{ right: '0px', width: '130px', paddingTop: '2px' }}
      >
        {/* 1. 顶座 */}
        <div
          style={{
            width: '28px',
            height: '10px',
            background: 'linear-gradient(180deg, #D4C4A8 0%, #BBA888 100%)',
            borderRadius: '10px 10px 4px 4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
            marginBottom: '1px',
          }}
        />

        {/* 2. 上方绳子 */}
        <Rope
          isDragging={lampState === 'dragging'}
          dragY={dragY}
          intensity={lightIntensity}
        />

        {/* 3. 灯罩 — 圆顶钟形，底部平直开口 */}
        <div className="relative mt-0.5">
          <div className={`lamp-glow-halo ${stateClass}`} />

          {/* 灯罩体 — 圆顶 + 底部平开口 */}
          <div
            className="relative flex items-center justify-center"
            style={{
              width: '90px',
              height: '62px',
              borderRadius: '50% 50% 8px 8px / 42% 42% 8px 8px',
              background: `linear-gradient(180deg,
                #FFF8F0 0%,
                #F5EDE0 20%,
                #EDE3D4 45%,
                #E5D8C6 70%,
                #DDD0BA 100%
              )`,
              border: '1.5px solid rgba(225, 210, 185, 0.6)',
              borderBottom: '3px solid rgba(210, 195, 168, 0.7)',
              boxShadow: lampState !== 'idle'
                ? `0 10px 40px rgba(255, 175, 60, 0.5),
                   0 4px 14px rgba(255, 150, 40, 0.25),
                   inset 0 -12px 20px rgba(255, 195, 100, 0.4),
                   inset 0 6px 12px rgba(255,255,255,0.35)`
                : `0 6px 28px rgba(255, 175, 60, 0.35),
                   0 3px 10px rgba(0,0,0,0.05),
                   inset 0 -10px 16px rgba(255, 195, 100, 0.28),
                   inset 0 6px 12px rgba(255,255,255,0.3)`,
              transition: 'box-shadow 300ms ease, transform 300ms ease',
              transform: lampState === 'dragging' ? 'scale(1.04)' : 'scale(1)',
            }}
          >
            {/* 猫爪印 */}
            <span
              className="pointer-events-none"
              style={{
                fontSize: '22px',
                opacity: 0.5,
                lineHeight: 1,
                marginTop: '4px',
              }}
              aria-hidden="true"
            >
              🐾
            </span>
            {/* 顶部高光 */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: '42px',
                height: '16px',
                top: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.6) 0%, transparent 70%)',
                borderRadius: '50%',
              }}
            />
          </div>

          {/* 底部开口发光 */}
          <div
            className="pointer-events-none mx-auto"
            style={{
              width: '90px',
              height: '10px',
              marginTop: '-1px',
              background: `linear-gradient(180deg,
                rgba(255, 200, 100, ${0.75 + glowIntensity * 0.2}) 0%,
                rgba(255, 175, 60, ${0.45 + glowIntensity * 0.2}) 60%,
                rgba(255, 155, 40, ${0.15 + glowIntensity * 0.1}) 100%
              )`,
              borderRadius: '0 0 4px 4px',
              boxShadow: `0 6px 24px rgba(255, 180, 70, ${0.45 + glowIntensity * 0.25}), 0 2px 8px rgba(255, 160, 50, 0.3)`,
            }}
          />

          {/* 灯下暖光辐射 — 向下扩散 */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: '-55px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '110px',
              height: '60px',
              background: `radial-gradient(ellipse 80% 100% at 50% 0%,
                rgba(255, 190, 80, ${0.5 + glowIntensity * 0.3}) 0%,
                rgba(255, 165, 55, ${0.28 + glowIntensity * 0.2}) 35%,
                rgba(255, 140, 40, ${0.1 + glowIntensity * 0.1}) 65%,
                transparent 100%)`,
              transition: 'background 300ms ease',
            }}
          />
          {/* 光粒子 */}
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: '-70px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90px',
              height: '50px',
              background: `radial-gradient(circle 2px at 18% 30%, rgba(255,215,130,${0.5 + glowIntensity * 0.3}) 0%, transparent 100%),
                radial-gradient(circle 2px at 75% 40%, rgba(255,195,90,${0.4 + glowIntensity * 0.25}) 0%, transparent 100%),
                radial-gradient(circle 1.5px at 42% 65%, rgba(255,225,150,${0.35 + glowIntensity * 0.2}) 0%, transparent 100%),
                radial-gradient(circle 2px at 82% 60%, rgba(255,205,120,${0.3 + glowIntensity * 0.2}) 0%, transparent 100%)`,
              opacity: lampState === 'idle' ? 0.6 : 1,
              transition: 'opacity 300ms ease',
            }}
          />
        </div>

        {/* 4. 下方编织绳连接猫爪 */}
        <div
          style={{
            width: '7px',
            height: `${140 + dragY * 0.4}px`,
            background: `repeating-linear-gradient(
              180deg,
              #E8DCC8 0px,
              #D8CCB4 3px,
              #C8BCA0 5px,
              #D8CCB4 7px,
              #E8DCC8 10px
            )`,
            borderRadius: '4px',
            transition: lampState === 'dragging' ? 'none' : 'height 420ms cubic-bezier(0.22, 0.61, 0.36, 1)',
            boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.2), inset -1px 0 0 rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.08)',
          }}
        />

        {/* 5. 猫爪吊坠 */}
        <CatPawHandle
          isDragging={lampState === 'dragging'}
          dragY={dragY}
          lightIntensity={lightIntensity}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />

        {/* "下拉切换宠物" — 双箭头上下叠加(加宽开角+灯光特效) + 文字两行 */}
        <div className="pointer-events-none flex flex-col items-center mt-2">
          <div className="flex flex-col items-center relative" style={{ animation: 'switch-hint-bounce 2s ease-in-out infinite' }}>
            {/* 光晕背景 */}
            <div className="absolute inset-0 rounded-full" style={{
              background: 'radial-gradient(circle, rgba(255,200,100,0.25) 0%, rgba(255,180,80,0.1) 50%, transparent 70%)',
              width: '50px', height: '40px', top: '-10px',
              filter: 'blur(4px)',
              animation: 'arrow-glow-pulse 2s ease-in-out infinite',
            }} />
            <span className="text-[20px] leading-none text-[rgba(255,220,150,1)] relative" style={{
              textShadow: `
                0 0 6px rgba(255,200,100,0.9),
                0 0 14px rgba(255,180,80,0.6),
                0 0 24px rgba(255,160,60,0.35)
              `,
              transform: 'scaleX(1.6)',
            }}>⌄</span>
            <span className="text-[20px] leading-none text-[rgba(255,220,150,1)] -mt-2 relative" style={{
              textShadow: `
                0 0 6px rgba(255,200,100,0.9),
                0 0 14px rgba(255,180,80,0.6),
                0 0 24px rgba(255,160,60,0.35)
              `,
              transform: 'scaleX(1.6)',
            }}>⌄</span>
          </div>
          <span className="text-[13px] font-medium text-white mt-3 tracking-wide leading-tight text-center" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            下拉切换<br/>宠物
          </span>
        </div>

        {/* 触发 ripple */}
        {lampState === 'triggered' && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              bottom: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '50px',
              height: '50px',
              animation: 'lamp-ripple 500ms ease-out forwards',
            }}
          />
        )}
      </div>
    </>
  );
};

export default LampSwitch;
