/**
 * useTypewriter - 打字机动画 Hook
 * 
 * 功能：
 * - 逐字显示文本，模拟打字效果
 * - 支持自定义打字速度（每字符延迟）
 * - 支持打字完成后回调
 * - 支持暂停/继续控制
 * - 支持光标闪烁效果
 */

import { useState, useEffect, useRef, useCallback } from "react";

interface UseTypewriterOptions {
  /** 打字速度：每字符延迟毫秒数（默认 45ms） */
  speed?: number;
  /** 开始前的初始延迟（默认 200ms） */
  initialDelay?: number;
  /** 是否自动开始（默认 true） */
  autoStart?: boolean;
  /** 是否显示光标（默认 true） */
  showCursor?: boolean;
  /** 光标字符（默认 "|"） */
  cursorChar?: string;
  /** 打字完成时的回调 */
  onComplete?: () => void;
}

interface UseTypewriterReturn {
  /** 当前已显示的文本 */
  displayedText: string;
  /** 是否正在打字 */
  isTyping: boolean;
  /** 打字是否完成 */
  isComplete: boolean;
  /** 当前光标状态 */
  cursorVisible: boolean;
  /** 手动开始打字 */
  start: () => void;
  /** 暂停打字 */
  pause: () => void;
  /** 继续打字 */
  resume: () => void;
  /** 重置并重新开始 */
  reset: (newText?: string) => void;
  /** 立即显示全部文本 */
  skipToEnd: () => void;
}

/**
 * 打字机动画 Hook
 * 
 * @param text 要逐字显示的完整文本
 * @param options 配置选项
 * @returns 打字机状态和控制方法
 */
export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): UseTypewriterReturn {
  const {
    speed = 45,
    initialDelay = 200,
    autoStart = true,
    showCursor = true,
    cursorChar = "|",
    onComplete,
  } = options;

  // 状态
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [hasStarted, setHasStarted] = useState(autoStart);

  // Refs
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textRef = useRef(text);
  const isPausedRef = useRef(false);

  // 同步外部 text 变化
  useEffect(() => {
    if (text !== textRef.current) {
      textRef.current = text;
      // 文本变化时重置
      reset(text);
    }
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  // 光标闪烁效果
  useEffect(() => {
    if (!showCursor || isComplete) return;

    cursorIntervalRef.current = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530); // 约 530ms 切换一次

    return () => {
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  }, [showCursor, isComplete]);

  /** 清理定时器 */
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /** 核心打字逻辑：打出下一个字符 */
  const typeNextChar = useCallback(() => {
    if (isPausedRef.current) return;

    const currentText = textRef.current;

    if (currentIndexRef.current < currentText.length) {
      const nextIndex = currentIndexRef.current + 1;
      currentIndexRef.current = nextIndex;
      setDisplayedText(currentText.substring(0, nextIndex));

      // 随机化打字速度，让效果更自然（±30% 波动）
      const randomSpeed = speed * (0.7 + Math.random() * 0.6);
      timeoutRef.current = setTimeout(typeNextChar, randomSpeed);
    } else {
      // 打字完成
      setIsTyping(false);
      setIsComplete(true);
      onComplete?.();
    }
  }, [speed, onComplete]);

  /** 开始打字 */
  const start = useCallback(() => {
    if (hasStarted && !isComplete) return; // 已开始且未完成则不重复启动
    
    clearTimers();
    
    // 先设置初始状态
    setDisplayedText("");
    setIsComplete(false);
    currentIndexRef.current = 0;
    isPausedRef.current = false;

    // 初始延迟后开始
    timeoutRef.current = setTimeout(() => {
      setIsTyping(true);
      typeNextChar();
    }, initialDelay);

    setHasStarted(true);
  }, [initialDelay, typeNextChar, clearTimers, hasStarted, isComplete]);

  /** 暂停 */
  const pause = useCallback(() => {
    isPausedRef.current = true;
    clearTimers();
    setIsTyping(false);
  }, [clearTimers]);

  /** 继续 */
  const resume = useCallback(() => {
    if (isComplete) return;
    isPausedRef.current = false;
    setIsTyping(true);
    typeNextChar();
  }, [typeNextChar, isComplete]);

  /** 重置 */
  const reset = useCallback((newText?: string) => {
    clearTimers();
    
    if (newText !== undefined) {
      textRef.current = newText;
    }

    setDisplayedText("");
    setIsTyping(false);
    setIsComplete(false);
    currentIndexRef.current = 0;
    isPausedRef.current = false;
    setHasStarted(false);

    if (autoStart) {
      timeoutRef.current = setTimeout(() => {
        setIsTyping(true);
        typeNextChar();
      }, initialDelay);
      setHasStarted(true);
    }
  }, [clearTimers, autoStart, initialDelay, typeNextChar]);

  /** 跳到结尾 */
  const skipToEnd = useCallback(() => {
    clearTimers();
    setDisplayedText(textRef.current);
    setIsTyping(false);
    setIsComplete(true);
    currentIndexRef.current = textRef.current.length;
  }, [clearTimers]);

  // 自动开始
  useEffect(() => {
    if (autoStart && text) {
      start();
    }
    
    return () => {
      clearTimers();
      if (cursorIntervalRef.current) {
        clearInterval(cursorIntervalRef.current);
      }
    };
  // 只在初始化时执行一次，后续通过 ref 管理
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    displayedText,
    isTyping,
    isComplete,
    cursorVisible,
    start,
    pause,
    resume,
    reset,
    skipToEnd,
  };

  /**
   * 使用示例：
   * 
   * const { displayedText, isTyping, isComplete, cursorVisible } = useTypewriter(
   *   "别拍了，我刚睡醒。",
   *   { speed: 50, onComplete: () => console.log("done!") }
   * );
   * 
   * <p>
   *   {displayedText}
   *   {!isComplete && cursorVisible && <span className="cursor">|</span>}
   * </p>
   */
}
