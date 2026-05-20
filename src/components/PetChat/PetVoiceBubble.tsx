/**
 * 宠物声音消息气泡组件
 * 展示声音翻译结果：波形可视化 + 情绪指示器 + AI 翻译文案
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import type { VoiceTranslateResult, PetEmotion } from "../../types";
import { EMOTION_EMOJIS, EMOTION_LABELS, EMOTION_COLORS } from "../../lib/pet-prompt";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface PetVoiceBubbleProps {
  /** 声音翻译结果 */
  result: VoiceTranslateResult;
  /** 音频 URL */
  audioUrl?: string;
  /** 是否显示完整模式（默认紧凑） */
  expanded?: boolean;
}

/** 波形条数量 */
const WAVE_BAR_COUNT = 24;

/** 根据情绪生成随机波形数据 */
function generateWaveData(emotion: PetEmotion): number[] {
  // 不同情绪有不同的波形特征
  const basePatterns: Record<PetEmotion, number[]> = {
    excited: [0.9, 1.0, 0.8, 1.0, 0.7, 1.0, 0.85, 0.95, 0.75, 1.0, 0.8, 0.9,
              1.0, 0.85, 0.95, 0.8, 1.0, 0.7, 0.9, 1.0, 0.85, 0.75, 0.95, 0.8],
    happy: [0.6, 0.8, 0.5, 0.7, 0.4, 0.65, 0.55, 0.75, 0.45, 0.6, 0.5, 0.7,
            0.55, 0.8, 0.45, 0.65, 0.5, 0.75, 0.4, 0.6, 0.55, 0.7, 0.45, 0.65],
    hungry: [0.3, 0.2, 0.4, 0.15, 0.35, 0.25, 0.3, 0.2, 0.35, 0.25, 0.3, 0.2,
             0.35, 0.15, 0.3, 0.25, 0.4, 0.2, 0.3, 0.35, 0.25, 0.3, 0.2, 0.35],
    lonely: [0.2, 0.3, 0.15, 0.25, 0.2, 0.35, 0.18, 0.28, 0.22, 0.15, 0.25, 0.2,
             0.3, 0.18, 0.22, 0.28, 0.15, 0.25, 0.2, 0.3, 0.18, 0.22, 0.28, 0.16],
    anxious: [0.7, 0.4, 0.8, 0.3, 0.9, 0.35, 0.75, 0.45, 0.85, 0.3, 0.7, 0.5,
               0.8, 0.35, 0.65, 0.5, 0.9, 0.4, 0.7, 0.45, 0.8, 0.35, 0.75, 0.5],
    angry: [1.0, 0.8, 1.0, 0.6, 0.95, 0.7, 1.0, 0.5, 0.9, 0.75, 1.0, 0.6,
            0.85, 0.8, 1.0, 0.55, 0.9, 0.7, 1.0, 0.65, 0.88, 0.75, 0.95, 0.6],
    neutral: [0.4, 0.5, 0.35, 0.55, 0.42, 0.48, 0.38, 0.52, 0.44, 0.46, 0.4, 0.5,
              0.43, 0.47, 0.38, 0.52, 0.42, 0.48, 0.36, 0.54, 0.44, 0.46, 0.4, 0.5]
  };

  // 获取基础模式或默认使用 neutral
  const pattern = basePatterns[emotion] || basePatterns.neutral;

  // 添加一些随机变化
  return pattern.map(val => {
    const variation = (Math.random() - 0.5) * 0.2;
    return Math.max(0.1, Math.min(1.0, val + variation));
  });
}

export default function PetVoiceBubble({ result, audioUrl, expanded = false }: PetVoiceBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // 生成波形数据
  const waveData = generateWaveData(result.emotion);
  const emotionColor = EMOTION_COLORS[result.emotion] || "#A4B0BE";

  // 清理音频资源
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // 更新播放进度
  const updateTime = useCallback(() => {
    if (audioRef.current && isPlaying) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateTime);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateTime);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, updateTime]);

  // 切换播放/暂停
  const togglePlay = () => {
    if (!audioUrl) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || 0);
      };
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  // 切换静音
  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // 计算当前播放位置对应的波形高亮索引
  const getActiveBarIndex = (): number => {
    if (duration === 0) return -1;
    return Math.floor((currentTime / duration) * WAVE_BAR_COUNT);
  };

  const activeIndex = getActiveBarIndex();

  // 格式化时间
  const formatTime = (time: number): string => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 紧凑模式渲染
  if (!expanded) {
    return (
      <div className="pet-voice-bubble-compact">
        {/* 头部：情绪标签 + 翻译文本 */}
        <div className="pet-voice-header">
          <span 
            className="pet-voice-emotion-tag"
            style={{ 
              backgroundColor: `${emotionColor}20`,
              color: emotionColor,
              borderColor: `${emotionColor}40`
            }}
          >
            <span className="pet-voice-emotion-icon">
              {EMOTION_EMOJIS[result.emotion]}
            </span>
            {EMOTION_LABELS[result.emotion]}
            <span className="pet-voice-emotion-score">
              {Math.round(result.emotionScore * 100)}%
            </span>
          </span>
        </div>

        {/* 翻译文本 */}
        <p className="pet-voice-text">{result.aiLanguage}</p>

        {/* 音频播放区 */}
        {audioUrl && (
          <div className="pet-voice-player-mini" onClick={togglePlay}>
            <button 
              className={`pet-voice-play-btn ${isPlaying ? "playing" : ""}`}
              style={{ backgroundColor: `${emotionColor}20` }}
            >
              {isPlaying ? (
                <Pause size={14} style={{ color: emotionColor }} />
              ) : (
                <Play size={14} style={{ color: emotionColor }} fill={emotionColor} />
              )}
            </button>

            {/* 迷你波形 */}
            <div className="pet-voice-wave-mini">
              {waveData.map((height, i) => (
                <div
                  key={`wave-${i}`}
                  className="pet-voice-bar"
                  style={{
                    height: `${Math.max(height * 100, 12)}%`,
                    backgroundColor: i <= activeIndex && isPlaying 
                      ? emotionColor 
                      : `${emotionColor}50`,
                    transition: `background-color 0.1s ease`
                  }}
                />
              ))}
            </div>

            <span className="pet-voice-duration">
              {formatTime(duration)}
            </span>
          </div>
        )}

        {/* 互动建议 */}
        {result.suggestions && result.suggestions.length > 0 && (
          <div className="pet-voice-suggestions-mini">
            {result.suggestions.slice(0, 2).map((suggestion, idx) => (
              <span key={idx} className="pet-voice-suggestion-chip">
                {suggestion.icon} {suggestion.action}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 完整模式渲染
  return (
    <div className="pet-voice-bubble-expanded">
      {/* 头部区域 */}
      <div className="pet-voice-exp-header">
        <div className="pet-voice-exp-info">
          <span 
            className="pet-voice-exp-emotion-badge"
            style={{
              background: `linear-gradient(135deg, ${emotionColor}30, ${emotionColor}10)`,
              borderLeft: `3px solid ${emotionColor}`
            }}
          >
            <span className="pet-voice-exp-emotion-icon">
              {EMOTION_EMOJIS[result.emotion]}
            </span>
            <div className="pet-voice-exp-emotion-detail">
              <span className="pet-voice-exp-emotion-name">
                {EMOTION_LABELS[result.emotion]}
              </span>
              <span className="pet-voice-exp-confidence">
                置信度: {Math.round(result.emotionScore * 100)}%
              </span>
            </div>
          </span>
          
          {/* 情绪强度指示条 */}
          <div className="pet-voice-exp-intensity-bar">
            <div 
              className="pet-voice-exp-intensity-fill"
              style={{ 
                width: `${result.emotionScore * 100}%`, 
                backgroundColor: emotionColor 
              }}
            />
          </div>
        </div>
      </div>

      {/* 波形可视化 + 播放控制 */}
      {audioUrl && (
        <div className="pet-voice-exp-player">
          {/* 大型波形 */}
          <div className="pet-voice-exp-wave-container" onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}>
            <div className="pet-voice-exp-wave">
              {waveData.map((height, i) => (
                <div
                  key={`wave-exp-${i}`}
                  className={`pet-voice-exp-bar ${i <= activeIndex && isPlaying ? 'active' : ''}`}
                  style={{
                    height: `${Math.max(height * 100, 15)}%`,
                    backgroundColor: i <= activeIndex && isPlaying 
                      ? emotionColor 
                      : `${emotionColor}40`,
                    animationDelay: `${i * 0.03}s`,
                    ...(i <= activeIndex && isPlaying ? {
                      boxShadow: `0 0 8px ${emotionColor}60`
                    } : {})
                  }}
                />
              ))}
            </div>

            {/* 播放按钮覆盖层 */}
            {!isPlaying && (
              <div className="pet-voice-exp-play-overlay">
                <Play size={32} style={{ color: emotionColor }} fill={emotionColor} />
              </div>
            )}
          </div>

          {/* 控制栏 */}
          <div className="pet-voice-exp-controls">
            <button 
              className="pet-voice-exp-control-btn"
              onClick={togglePlay}
              style={{ color: emotionColor }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            
            <span className="pet-voice-exp-time-current" style={{ color: emotionColor }}>
              {formatTime(currentTime)}
            </span>

            {/* 进度条 */}
            <div 
              className="pet-voice-exp-progress"
              onClick={(e) => {
                if (!audioRef.current || !duration) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                audioRef.current.currentTime = percent * duration;
              }}
            >
              <div 
                className="pet-voice-exp-progress-fill"
                style={{ 
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : 0,
                  backgroundColor: emotionColor 
                }} 
              />
            </div>

            <span className="pet-voice-exp-time-total">
              {formatTime(duration)}
            </span>

            <button 
              className="pet-voice-exp-control-btn"
              onClick={toggleMute}
              style={{ opacity: isMuted ? 0.5 : 1 }}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* AI 翻译文本 */}
      <div className="pet-voice-exp-translation">
        <div className="pet-voice-exp-translation-label">🐾 翻译内容</div>
        <p className="pet-voice-exp-text">{result.aiLanguage}</p>
      </div>

      {/* 互动建议卡片 */}
      {result.suggestions && result.suggestions.length > 0 && (
        <div className="pet-voice-exp-suggestions">
          <div className="pet-voice-exp-suggestions-label">💡 互动建议</div>
          <div className="pet-voice-exp-suggestions-list">
            {result.suggestions.map((suggestion, idx) => (
              <div 
                key={idx} 
                className="pet-voice-exp-suggestion-card"
                style={{ borderTop: `2px solid ${idx === 0 ? emotionColor : 'transparent'}` }}
              >
                <span className="pet-voice-exp-suggestion-icon">{suggestion.icon}</span>
                <div className="pet-voice-exp-suggestion-content">
                  <span className="pet-voice-exp-suggestion-action">{suggestion.action}</span>
                  <span className="pet-voice-exp-suggestion-desc">{suggestion.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
