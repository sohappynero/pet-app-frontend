import React, { useState, useCallback, useRef } from 'react';
import CatPawHandle from './CatPawHandle';
import Rope from './Rope';

export type LampState = 'idle' | 'dragging' | 'triggered' | 'transition';

interface LampSwitchProps {
  onTrigger: () => void;
  onLightIntensityChange?: (intensity: number) => void;
}

// 拖拽配置
const MAX_DRAG = 120;
const TRIGGER_THRESHOLD = 80;

/**
 * LampSwitch — 迷你吊灯式猫爪拉灯
 *
 * 视觉核心：从右上角垂下的精致暖光吊灯
 * - 吸盘顶座：固定在天花板意象
 * - 细拉绳：金色渐变，随拖拽伸长
 * - 圆形灯罩：暖光发光体，带脉动光晕
 * - 猫爪吊坠：交互热区，拖拽触发切换
 *
 * 状态机：idle → dragging → triggered → transition → idle
 */
const LampSwitch: React.FC<LampSwitchProps> = ({
  onTrigger,
  onLightIntensityChange,
}) => {
  const [lampState, setLampState] = useState<LampState>('idle');
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef<number>(0);
  const isTriggeringRef = useRef(false);

  // 计算当前光强 (0~1) — 升级版：idle 更亮，dragging 范围更广
  const lightIntensity =
    lampState === 'triggered'
      ? 1.0
      : lampState === 'dragging'
        ? Math.min(0.85, 0.22 + (dragY / MAX_DRAG) * 0.63)
        : lampState === 'transition'
          ? 0.5
          : 0.22; // idle 从 0.15 → 0.22，灯始终有可见光晕

  // 光强变化回调
  React.useEffect(() => {
    onLightIntensityChange?.(lightIntensity);
  }, [lightIntensity, onLightIntensityChange]);

  const handleDragStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    startYRef.current = e.clientY;
    setLampState('dragging');
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
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
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      if (lampState === 'triggered') {
        setLampState('transition');
        onTrigger();

        setTimeout(() => {
          setLampState('idle');
          setDragY(0);
          isTriggeringRef.current = false;
        }, 500);
      } else {
        // 未达到触发阈值：先设 idle（让 CSS transition 启动），再用 rAF 延迟归零 dragY
        // 避免猫爪和绳子"瞬归"，让弹性回弹动画有机会播放
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

  // 灯罩发光强度
  const glowIntensity = lightIntensity;

  return (
    <>
      {/* Light Cone — 向下扩散光锥 */}
      <div className={`lamp-light-cone ${stateClass}`} />

      <div
        className={`fixed right-0 top-0 z-30 flex flex-col items-center lamp-swing-idle`}
        style={{ width: '86px', paddingTop: '2px' }}
      >
        {/* ── 1. 吸盘顶座（天花板固定点）── */}
        <div
          style={{
            width: '28px',
            height: '10px',
            background: 'linear-gradient(180deg, #C8B898 0%, #A89878 100%)',
            borderRadius: '14px 14px 6px 6px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15), 0 2px 3px rgba(120,90,40,0.10)',
            marginBottom: '3px',
          }}
        />

        {/* ── 2. 拉绳 ── */}
        <Rope
          isDragging={lampState === 'dragging'}
          dragY={dragY}
          intensity={lightIntensity}
        />

        {/* ── 3. 圆形灯罩 + Glow Halo 容器 ── */}
        <div className="relative mt-1">
          {/* Glow Halo — 围绕灯罩的脉动光晕（缩小） */}
          <div className={`lamp-glow-halo lamp-glow-halo--compact ${stateClass}`} />

            {/* 灯罩本体 — 精致小型奶油色钟形（右上角不遮挡宠物） */}
          <div
            className="rounded-full flex items-center justify-center relative"
            style={{
              width: '60px', /* 从80→60：精致小巧 */
              height: '52px', /* 从70→52 */
              borderRadius: '50% 50% 48% 48%', /* 钟形底部略平 */
              background: `radial-gradient(circle at 45% 32%,
                #FFFEFA 0%,
                #FFF9E8 12%,
                #FFECC8 30%, /* 规范primary色系 */
                #FFD6A5 55%, /* 规范 primary: #FFD6A5 */
                ${glowIntensity > 0.3 ? '#F5B942' : '#E8B84A'} 80%, /* amber */
                ${glowIntensity > 0.3 ? '#D49A20' : '#D4A855'} 100%
              )`,
              boxShadow: lampState !== 'idle'
                ? `0 0 60px rgba(255, 214, 165, 0.55), 0 0 120px rgba(255, 214, 165, 0.28), 0 0 180px rgba(255, 214, 165, 0.14)` /* 触发态: #FFD6A5 */
                : '0 0 40px rgba(255, 214, 165, 0.35), 0 0 80px rgba(255, 214, 165, 0.18), 0 0 120px rgba(255, 214, 165, 0.09)', /* idle态: #FFD6A5 */
              border: `2px solid ${lampState !== 'idle' ? 'rgba(240, 176, 70, 0.40)' : 'rgba(190, 155, 90, 0.35)'}`,
              transition: 'box-shadow 320ms cubic-bezier(0.2, 0.8, 0.2, 1), border-color 320ms cubic-bezier(0.2, 0.8, 0.2, 1), background 320ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1)', /* UI 320ms */
              transform: lampState === 'dragging' ? 'scale(1.05)' : 'scale(1)',
            }}
          >
            {/* ✨ 星星装饰图标 */}
            <span
              className="absolute pointer-events-none"
              style={{
                fontSize: '12px', /* 从16→12 */
                top: '4px', /* 从6→4 */
                left: '50%',
                transform: 'translateX(-50%)',
                opacity: 0.65 + glowIntensity * 0.30,
                filter: `drop-shadow(0 0 4px rgba(255, 210, 100, ${0.45 + glowIntensity * 0.40}))`,
                lineHeight: 1,
              }}
              aria-hidden="true"
            >
              ✨
            </span>
            {/* 灯罩内部高光 — 缩小 */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: '20px', /* 从26→20 */
                height: '10px', /* 从14→10 */
                top: '7px', /* 从10→7 */
                left: '16px', /* 从24→16 */
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.70) 0%, transparent 75%)',
              }}
            />

            {/* 猫爪图案在灯罩上 */}
            <span
              className="absolute pointer-events-none"
              style={{
                fontSize: '10px', /* 从13→10 */
                bottom: '4px', /* 从6→4 */
                right: '7px', /* 从10→7 */
                opacity: 0.45 + glowIntensity * 0.15,
                lineHeight: 1,
              }}
              aria-hidden="true"
            >
              🐾
            </span>
          </div>

          {/* 猫爪手柄（在灯罩下方） */}
          <CatPawHandle
            isDragging={lampState === 'dragging'}
            dragY={dragY}
            lightIntensity={lightIntensity}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
        </div>

        {/* 触发时的 ripple 效果 */}
        {lampState === 'triggered' && (
          <div
            className="absolute rounded-full pointer-events-none"
            style={{
              top: '28px',
              left: '50%',
              transform: 'translateX(-50%)',
            width: '36px',
                height: '36px',
              animation: 'lamp-ripple 500ms ease-out forwards',
            }}
          />
        )}
      </div>
    </>
  );
};

export default LampSwitch;
