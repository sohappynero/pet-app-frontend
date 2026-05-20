/**
 * PhotoMindResult - 图片心声分析结果展示卡
 * 
 * 展示内容：
 * - 宠物照片缩略图 + 情绪/姿态标签
 * - 宠物内心 OS 文本（带打字机动画效果）
 * - 情绪评分可视化条
 * - 幽默程度指示器
 * - 互动建议操作按钮
 * 
 * 设计风格：温暖治愈系宠物社交风格，融合微信聊天卡片范式
 */

import { useState, useMemo } from "react";
import {
  Heart, Share2, RotateCcw, Sparkles,
  Smile, Frown, Meh, Laugh, Eye,
  Lightbulb, ChevronDown, ChevronUp, X
} from "lucide-react";
import type { PhotoMindResult } from "../../types";
import { useTypewriter } from "../../hooks/useTypewriter";

// ============================================================
// 类型定义
// ============================================================

export interface PhotoMindResultCardProps {
  /** 分析结果数据 */
  result: PhotoMindResult;
  /** 照片 URL */
  photoUrl?: string;
  /** 宠物名称 */
  petName?: string;
  /** 宠物种类 */
  petSpecies?: "cat" | "dog" | "other";
  /** 是否可展开详情（默认 true） */
  expandable?: boolean;
  /** 关闭回调 */
  onClose?: () => void;
  /** 分享回调 */
  onShare?: () => void;
  /** 重拍回调 */
  onRetake?: () => void;
}

// ============================================================
// 常量配置
// ============================================================

/** 情绪映射表 */
const EMOTION_CONFIG: Record<string, {
  emoji: string;
  label: string;
  color: string;
  bgGradient: string;
}> = {
  happy:     { emoji: "😊", label: "开心",   color: "#4ADE80", bgGradient: "linear-gradient(135deg, #4ADE80, #22C55E)" },
  excited:  { emoji: "🤩", label: "兴奋",   color: "#FBBF24", bgGradient: "linear-gradient(135deg, #FBBF24, #F59E0B)" },
  sleepy:   { emoji: "😴", label: "困困",   color: "#A78BFA", bgGradient: "linear-gradient(135deg, #A78BFA, #8B5CF6)" },
  relaxed:  { emoji: "😌", label: "放松",   color: "#60A5FA", bgGradient: "linear-gradient(135deg, #60A5FA, #3B82F6)" },
  curious:  { emoji: "🤔", label: "好奇",   color: "#F97316", bgGradient: "linear-gradient(135deg, #F97316, #EA580C)" },
  playful:  { emoji: "🎉", label: "活泼",   color: "#EC4899", bgGradient: "linear-gradient(135deg, #EC4899, #DB2777)" },
  sad:      { emoji: "😢", label: "委屈",   color: "#6366F1", bgGradient: "linear-gradient(135deg, #6366F1, #4F46E5)" },
  anxious:  { emoji: "😰", label: "紧张",   color: "#FB923C", bgGradient: "linear-gradient(135deg, #FB923C, #F97316)" },
  hungry:   { emoji: "😋", label: "饿了",   color: "#EF4444", bgGradient: "linear-gradient(135deg, #EF4444, #DC2626)" },
  lonely:   { emoji: "🥺", label: "孤单",   color: "#8B5CF6", bgGradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)" },
  angry:    { emoji: "😤", label: "生气",   color: "#EF4444", bgGradient: "linear-gradient(135deg, #EF4444, #DC2626)" },
  neutral:  { emoji: "😐", label: "平静",   color: "#9CA3AF", bgGradient: "linear-gradient(135deg, #9CA3AF, #6B7280)" },
};

/** 幽默程度映射 */
const HUMOR_CONFIG = {
  low:    { emoji: "😐", label: "一本正经", color: "#9CA3AF" },
  medium: { emoji: "😄", label: "有点意思", color: "#4ADE80" },
  high:   { emoji: "😂", label: "笑死我了", color: "#F59E0B" },
};

/** 默认互动建议（基于情绪生成） */
function generateSuggestions(mood: string): Array<{ icon: string; text: string }> {
  const suggestionMap: Record<string, Array<{ icon: string; text: string }>> = {
    happy:    [{ icon: "🎾", text: "陪它玩一会儿" }, { icon: "🍖", text: "给个零食奖励" }],
    excited:  [{ icon: "🏃", text: "出门遛一遛" }, { icon: "🎾", text: "玩丢球游戏" }],
    sleepy:   [{ icon: "🛏️", text: "让它安静休息" }, { icon: "🧸", text: "准备柔软小窝" }],
    relaxed:  [{ icon: "📷", text: "多拍几张美照" }, { icon: "✋", text: "轻轻抚摸它" }],
    curious:  [{ icon: "🔍", text: "看看它在看什么" }, { icon: "🎁", text: "给它新玩具" }],
    playful:  [{ icon: "🎮", text: "开始玩耍时间！" }, { icon: "🏆", text: "互动训练一下" }],
    sad:      [{ icon: "💕", text: "多抱抱安慰它" }, { icon: "🎵", text: "放首轻音乐" }],
    anxious:  [{ icon: "🤲", text: "轻声安抚它" }, { icon: "🏠", text: "给它安全空间" }],
    hungry:   [{ icon: "🥣", text: "开饭时间到！" }, { icon: "🍗", text: "加餐犒劳一下" }],
    lonely:   [{ icon: "👋", text: "多陪伴它" }, { icon: "💬", text: "和它说说话" }],
    angry:    [{ icon: "😌", text: "给它冷静空间" }, { icon: "🧘", text: "等它平静下来" }],
    neutral:  [{ icon: "✋", text: "摸摸它的头" }, { icon: "👀", text: "观察后续状态" }],
  };

  return suggestionMap[mood] || suggestionMap.neutral;
}

// ============================================================
// 主组件
// ============================================================

export function PhotoMindResultCard({
  result,
  photoUrl,
  petName = "宝贝",
  petSpecies = "dog",
  expandable = true,
  onClose,
  onShare,
  onRetake,
}: PhotoMindResultCardProps) {
  
  // 展开/折叠状态
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 获取情绪配置
  const emotionConfig = EMOTION_CONFIG[result.mood] || EMOTION_CONFIG.neutral;
  const humorConfig = HUMOR_CONFIG[result.humorLevel];

  // 生成建议
  const suggestions = useMemo(() => generateSuggestions(result.mood), [result.mood]);

  // 打字机效果
  const { displayedText, isTyping, isComplete, cursorVisible, skipToEnd } = useTypewriter(
    result.mindOs,
    {
      speed: 38,
      initialDelay: 300,
      autoStart: true,
      showCursor: true,
      cursorChar: "▊",
    }
  );

  return (
    <div className={`pmr-card ${isExpanded ? "pmr-expanded" : ""}`}>
      {/* ====== 卡片头部 ====== */}
      <div className="pmr-header">
        <div className="pmr-header-left">
          <span className="pmr-header-icon">📸</span>
          <span className="pmr-header-title">照片心声</span>
          {/* 情绪标签 */}
          <span className="pmr-emotion-badge" style={{ "--badge-color": emotionConfig.color } as React.CSSProperties}>
            {emotionConfig.emoji} {emotionConfig.label}
          </span>
        </div>

        <div className="pmr-header-right">
          {/* 幽默度 */}
          <span className="pmr-humor-tag">
            {humorConfig.emoji} {humorConfig.label}
          </span>

          {/* 展开/折叠按钮 */}
          {expandable && (
            <button
              className="pmr-expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "收起" : "展开详情"}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}

          {/* 关闭按钮 */}
          {onClose && (
            <button className="pmr-close-btn" onClick={onClose} title="关闭">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ====== 内容区域 ====== */}
      <div className="pmr-body">
        {/* 左侧：照片缩略图 */}
        <div className="pmr-photo-section">
          {photoUrl ? (
            <>
              <img
                src={photoUrl}
                alt={`${petName}的照片`}
                className="pmr-photo"
                loading="lazy"
              />
              {/* 照片上的标签叠加 */}
              <div className="pmr-photo-tags">
                <span className="pmr-photo-tag pmr-tag-expression">
                  {result.expression}
                </span>
                <span className="pmr-photo-tag pmr-tag-posture">
                  {result.posture}
                </span>
              </div>
            </>
          ) : (
            <div className="pmr-photo-placeholder">
              <Eye size={32} />
              <span>无图片</span>
            </div>
          )}
        </div>

        {/* 右侧：心声内容区 */}
        <div className="pmr-content-section">
          {/* 宠物内心 OS 标题 */}
          <div className="pmr-mind-header">
            <Heart size={14} className="pmr-mind-heart-icon" />
            <span className="pmr-mind-label">{petName}的内心OS</span>
          </div>

          {/* 内心 OS 文本（打字机效果） */}
          <div className="pmr-mind-text-box">
            <p className={`pmr-mind-text ${isComplete ? "pmr-complete" : ""}`}>
              {displayedText}
              {!isComplete && cursorVisible && <span className="pmr-cursor">▊</span>}
            </p>

            {/* 跳过按钮（正在打字时显示） */}
            {!isComplete && isTyping && (
              <button
                className="pmr-skip-btn"
                onClick={skipToEnd}
                title="跳过动画"
              >
                跳过 ▶
              </button>
            )}
          </div>

          {/* 情绪评分条 */}
          <div className="pmr-score-bar-wrap">
            <span className="pmr-score-label">心情指数</span>
            <div className="pmr-score-bar-track">
              <div
                className="pmr-score-bar-fill"
                style={{
                  width: `${Math.round(result.moodScore * 100)}%`,
                  background: emotionConfig.bgGradient,
                }}
              />
            </div>
            <span className="pmr-score-value" style={{ color: emotionConfig.color }}>
              {Math.round(result.moodScore * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* ====== 展开的详细区域 ====== */}
      {isExpanded && (
        <div className="pmr-detail-panel">
          {/* 详细分析信息 */}
          <div className="pmr-detail-grid">
            <div className="pmr-detail-item">
              <span className="pmr-detail-icon">😊</span>
              <span className="pmr-detail-label">表情</span>
              <span className="pmr-detail-value">{result.expression}</span>
            </div>
            <div className="pmr-detail-item">
              <span className="pmr-detail-icon">🦶</span>
              <span className="pmr-detail-label">姿态</span>
              <span className="pmr-detail-value">{result.posture}</span>
            </div>
            <div className="pmr-detail-item">
              <span className="pmr-detail-icon">{emotionConfig.emoji}</span>
              <span className="pmr-detail-label">情绪</span>
              <span className="pmr-detail-value" style={{ color: emotionConfig.color }}>
                {emotionConfig.label}
              </span>
            </div>
            <div className="pmr-detail-item">
              <span className="pmr-detail-icon">⭐</span>
              <span className="pmr-detail-label">幽默</span>
              <span className="pmr-detail-value" style={{ color: humorConfig.color }}>
                {humorConfig.label}
              </span>
            </div>
          </div>

          {/* 互动建议 */}
          <div className="pmr-suggestions">
            <div className="pmr-suggestions-title">
              <Lightbulb size={14} />
              <span>主人可以这样回应</span>
            </div>
            <div className="pmr-suggestions-list">
              {suggestions.map((s, i) => (
                <button key={i} className="pmr-suggestion-chip">
                  <span>{s.icon}</span>
                  <span>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====== 底部操作栏 ====== */}
      <div className="pmr-actions">
        {onShare && (
          <button className="pmr-action-btn pmr-action-share" onClick={onShare}>
            <Share2 size={15} />
            <span>分享到聊天</span>
          </button>
        )}

        {onRetake && (
          <button className="pmr-action-btn pmr-action-retake" onClick={onRetake}>
            <RotateCcw size={15} />
            <span>再拍一张</span>
          </button>
        )}

        <button className="pmr-action-btn pmr-action-favorite">
          <Sparkles size={15} />
          <span>收藏</span>
        </button>
      </div>

      {/* 底部装饰渐变线 */}
      <div className="pmr-bottom-glow" />
    </div>
  );
}

export default PhotoMindResultCard;
