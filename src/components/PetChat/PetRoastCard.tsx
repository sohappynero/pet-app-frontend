/**
 * AI 宠物吐槽卡片组件
 * 用于在聊天界面中展示宠物的 AI 生成吐槽/心声
 */

import { useState, useEffect, useRef } from "react";
import { 
  Heart, 
  Zap, 
  MessageCircle, 
  Lightbulb,
  Sparkles,
  Repeat,
  Share2,
  X
} from "lucide-react";
import type { RoastResult, PetEmotion, PetSticker, InteractionSuggestion } from "../../types";
import { EMOTION_EMOJIS, EMOTION_LABELS, EMOTION_COLORS } from "../../lib/pet-prompt";

// ============================================================
// 类型定义
// ============================================================

interface PetRoastCardProps {
  /** 吐槽结果数据 */
  result: RoastResult;
  /** 宠物名称 */
  petName: string;
  /** 宠物种类 */
  petSpecies: "dog" | "cat" | "other";
  /** 吐槽情绪（可选） */
  emotion?: PetEmotion;
  /** 时间戳 */
  timestamp?: string;
  /** 是否显示打字机动画 */
  typewriter?: boolean;
  /** 是否可展开详情 */
  expandable?: boolean;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 可用的表情包列表 */
  stickers?: PetSticker[];
  /** 关闭回调 */
  onClose?: () => void;
  /** 分享回调 */
  onShare?: (text: string) => void;
  /** 再来一条回调 */
  onRegenerate?: () => void;
  /** 发送表情包回调 */
  onSendSticker?: (sticker: PetSticker) => void;
  /** 执行建议动作回调 */
  onExecuteAction?: (action: string) => void;
}

// ============================================================
// 吐槽类型配置
// ============================================================

interface RoastTypeConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  gradient: string;
}

const ROAST_TYPE_CONFIGS: Record<RoastResult["roastType"], RoastTypeConfig> = {
  complaint: {
    label: "吐槽",
    color: "#EC4899",
    bgColor: "rgba(236, 72, 153, 0.08)",
    icon: "💬",
    gradient: "linear-gradient(135deg, #EC4899, #F472B6)"
  },
  demand: {
    label: "需求",
    color: "#F59E0B",
    bgColor: "rgba(245, 158, 11, 0.08)",
    icon: "🍖",
    gradient: "linear-gradient(135deg, #F59E0B, #FBBF24)"
  },
  empathy: {
    label: "心声",
    color: "#60A5FA",
    bgColor: "rgba(96, 165, 250, 0.08)",
    icon: "💭",
    gradient: "linear-gradient(135deg, #60A5FA, #93C5FD)"
  },
  tease: {
    label: "调侃",
    color: "#34D399",
    bgColor: "rgba(52, 211, 153, 0.08)",
    icon: "😜",
    gradient: "linear-gradient(135deg, #34D399, #6EE7B7)"
  }
};

// ============================================================
// 主组件
// ============================================================

export function PetRoastCard({
  result,
  petName,
  petSpecies,
  emotion,
  timestamp,
  typewriter = true,
  expandable = true,
  showActions = true,
  stickers = [],
  onClose,
  onShare,
  onRegenerate,
  onSendSticker,
  onExecuteAction
}: PetRoastCardProps) {
  // 状态管理
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(typewriter);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showEmojiReaction, setShowEmojiReaction] = useState(false);
  
  const typeRef = useRef<NodeJS.Timeout | null>(null);
  
  const typeConfig = ROAST_TYPE_CONFIGS[result.roastType];
  
  // ============================================================
  // 打字机动画效果
  // ============================================================

  useEffect(() => {
    if (!typewriter || !result.roastMessage) {
      setDisplayText(result.roastMessage);
      return;
    }

    let index = 0;
    const text = result.roastMessage;

    setIsTyping(true);

    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.substring(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
        
        // 打字完成后显示表情反应动画
        setTimeout(() => setShowEmojiReaction(true), 300);
      }
    }, 60); // 每个字符 60ms

    typeRef.current = typeInterval as unknown as NodeJS.Timeout;

    return () => {
      if (typeRef.current) clearInterval(typeRef.current);
    };
  }, [result.roastMessage, typewriter]);

  // ============================================================
  // 渲染函数
  // ============================================================

  /** 获取宠物前缀 */
  const getPetPrefix = (): string => {
    if (petSpecies === "cat") return "喵~ ";
    if (petSpecies === "other") return "🐰 ";
    return "汪！";
  };

  /** 处理分享 */
  const handleShare = () => {
    if (onShare) {
      onShare(`${getPetPrefix()}${result.roastMessage}`);
    } else {
      // 默认复制到剪贴板
      navigator.clipboard.writeText(`${petName}说：${result.roastMessage}`).then(() => {
        alert("已复制到剪贴板~");
      });
    }
  };

  /** 处理表情包选择 */
  const handleStickerSelect = (sticker: PetSticker) => {
    if (onSendSticker) {
      onSendSticker(sticker);
      setShowStickers(false);
    }
  };

  /** 处理执行建议动作 */
  const handleActionClick = (action: string) => {
    if (onExecuteAction) {
      onExecuteAction(action);
    } else {
      // 执行建议动作
    }
  };

  return (
    <div className="roast-card">
      {/* ====== 卡片头部：类型标签 + 触发原因 ====== */}
      <div className="roast-card-header" style={{ background: typeConfig.bgColor }}>
        <div className="roast-type-badge" style={{ 
          background: typeConfig.gradient,
          "--type-color": typeConfig.color 
        } as React.CSSProperties}>
          <span className="roast-type-icon">{typeConfig.icon}</span>
          <span className="roast-type-label">{typeConfig.label}</span>
        </div>

        {/* 触发原因提示 */}
        {result.triggerReason && (
          <div className="roast-trigger-hint">
            <Zap size={10} />
            <span>{result.triggerReason}</span>
          </div>
        )}

        {/* 时间戳 */}
        {timestamp && (
          <span className="roast-timestamp">{timestamp}</span>
        )}
      </div>

      {/* ====== 卡片主体：消息内容 ====== */}
      <div className="roast-card-body">
        {/* 消息前缀图标 + 内容 */}
        <div className="roast-message-wrap">
          {/* 思考气泡动画 */}
          <div className={`roast-think-bubble ${isTyping ? "thinking" : ""}`}>
            {isTyping ? (
              <>
                <Sparkles size={14} className="animate-pulse" style={{ color: typeConfig.color }} />
                <span>正在想...</span>
              </>
            ) : (
              <span style={{ color: typeConfig.color }}>💭</span>
            )}
          </div>

          {/* 主消息文字 */}
          <p className={`roast-message-text ${isTyping ? "typing" : ""}`} style={{ 
            color: isTyping ? "#A69076" : undefined 
          }}>
            {isTyping ? displayText : result.roastMessage}
          </p>

          {/* 打字光标 */}
          {isTyping && (
            <span className="roast-cursor-blink" style={{ backgroundColor: typeConfig.color }} />
          )}
        </div>

        {/* 表情反应动画（打字完成后） */}
        {showEmojiReaction && !isTyping && (
          <div className="roast-emoji-reaction">
            {emotion && (
              <span 
                className="roast-emotion-emoji"
                style={{ color: EMOTION_COLORS[emotion] }}
                role="img"
                aria-label={EMOTION_LABELS[emotion]}
              >
                {EMOTION_EMOJIS[emotion]}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ====== 展开的详情区域 ====== */}
      {expandable && isExpanded && (
        <div className="roast-card-details">
          {/* 建议动作 */}
          {result.suggestedAction && (
            <div className="roast-suggested-action">
              <Lightbulb size={14} style={{ color: "#D4A574" }} />
              <span className="roast-action-label">建议：</span>
              <button
                className="roast-action-btn"
                onClick={() => handleActionClick(result.suggestedAction!)}
              >
                {result.suggestedAction}
              </button>
            </div>
          )}

          {/* 表情包选择区 */}
          {stickers.length > 0 && (
            <div className="roast-stickers-area">
              <span className="roast-stickers-label">用表情回应：</span>
              <div className="roast-stickers-list">
                {stickers.slice(0, 4).map((sticker) => (
                  <button
                    key={sticker.id}
                    className="roast-sticker-chip"
                    onClick={() => handleStickerSelect(sticker)}
                    title={sticker.label}
                  >
                    <span className="roast-sticker-icon">{sticker.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====== 底部操作栏 ====== */}
      {showActions && (
        <div className="roast-card-footer">
          {/* 展开/收起按钮 */}
          {expandable && (
            <button
              className="roast-action-btn-small"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "收起" : "展开详情"}
            >
              <MessageCircle size={14} />
              <span>{isExpanded ? "收起" : "详情"}</span>
            </button>
          )}

          {/* 再来一条 */}
          {onRegenerate && (
            <button
              className="roast-action-btn-small roast-btn-regen"
              onClick={onRegenerate}
              title="再来一条吐槽"
            >
              <Repeat size={14} />
              <span>再来</span>
            </button>
          )}

          {/* 分享按钮 */}
          <button
            className="roast-action-btn-small"
            onClick={handleShare}
            title="分享这条吐槽"
          >
            <Share2 size={14} />
            <span>分享</span>
          </button>

          {/* 表情包按钮 */}
          {stickers.length > 0 && (
            <button
              className="roast-action-btn-small roast-btn-sticker"
              onClick={() => setShowStickers(!showStickers)}
              title="发送表情包"
            >
              <Heart size={14} />
              <span>回应</span>
            </button>
          )}

          {/* 关闭按钮 */}
          {onClose && (
            <button
              className="roast-action-btn-small roast-btn-close"
              onClick={onClose}
              title="关闭"
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* ====== 浮动表情包面板 ====== */}
      {showStickers && stickers.length > 0 && (
        <div className="roast-floating-stickers">
          <div className="roast-stickers-popup">
            <div className="roast-stickers-popup-header">
              <span>选择表情回应</span>
              <button onClick={() => setShowStickers(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="roast-stickers-grid">
              {stickers.map((sticker) => (
                <button
                  key={sticker.id}
                  className="roast-popup-sticker-item"
                  onClick={() => handleStickerSelect(sticker)}
                >
                  <span className="roast-popup-sticker-emoji">{sticker.emoji}</span>
                  <span className="roast-popup-sticker-label">{sticker.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 导出辅助组件：快捷吐槽指令栏
// ============================================================

interface QuickRoastBarProps {
  actions: Array<{
    id: string;
    label: string;
    icon: string;
    triggerContext?: Partial<{
      mood: string;
      timeOfDay: string;
      activityLevel: string;
    }>;
  }>;
  isLoading: boolean;
  onSelectAction: (actionId: string) => void;
}

export function QuickRoastBar({ actions, isLoading, onSelectAction }: QuickRoastBarProps) {
  return (
    <div className="quick-roast-bar">
      <span className="quick-roast-bar-title">💭 快捷吐槽：</span>
      <div className="quick-roast-actions">
        {actions.map((action) => (
          <button
            key={action.id}
            className="quick-roast-action-btn"
            onClick={() => onSelectAction(action.id)}
            disabled={isLoading}
            title={`${action.label} - 让${action.label === "肚子饿了" ? "它" : "毛孩子"}说说`}
          >
            <span className="quick-roast-icon">{action.icon}</span>
            <span className="quick-roast-label">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PetRoastCard;
