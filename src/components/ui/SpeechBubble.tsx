import { CSSProperties } from "react";
import { useTypewriter } from "../../hooks/useTypewriter";

export type SpeechMood = "happy" | "tired" | "normal";

export interface SpeechBubbleProps {
  text: string;
  mood?: SpeechMood;
  /** 是否启用打字机效果，默认 true。设为 false 用于已读过的气泡或截图测试。 */
  typewriter?: boolean;
  /** 每字毫秒，默认 50ms（设计文档 6.6）。 */
  speed?: number;
  className?: string;
}

const moodTint: Record<SpeechMood, string> = {
  happy: "rgba(255, 184, 77, 0.22)",
  tired: "rgba(123, 199, 255, 0.20)",
  normal: "rgba(240, 235, 226, 0.85)",
};

export default function SpeechBubble({
  text,
  mood = "normal",
  typewriter = true,
  speed = 50,
  className,
}: SpeechBubbleProps) {
  const { displayedText } = useTypewriter(text, {
    speed,
    autoStart: typewriter,
    showCursor: false,
    initialDelay: 0,
  });
  const display = typewriter ? displayedText : text;

  const style: CSSProperties = {
    display: "inline-block",
    maxWidth: "min(78vw, 320px)",
    padding: "var(--space-3) var(--space-4)",
    borderRadius: "var(--radius-lg)",
    background: moodTint[mood],
    color: "var(--color-text-primary)",
    fontFamily: "var(--font-family)",
    fontSize: "var(--text-body)",
    fontWeight: 500,
    lineHeight: 1.5,
    boxShadow: "var(--shadow-card)",
  };

  return (
    <span
      className={className}
      style={style}
      data-testid="ui-speech-bubble"
      data-mood={mood}
      aria-live="polite"
    >
      {display}
    </span>
  );
}
