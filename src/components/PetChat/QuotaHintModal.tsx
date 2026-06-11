/**
 * 配额用完提示弹窗 v3
 * 使用真实宠物照片 + 可怜巴巴效果（泪滴、颤抖、悲伤滤镜）
 */

import { X, Crown, Sparkles, Heart } from "lucide-react";
import type { QuotaError } from "../../lib/pet-mind.api";

interface QuotaHintModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotaData: QuotaError | null;
  onUpgrade: () => void;
  /** 宠物头像 URL，为空时降级显示默认占位符 */
  petImage?: string;
}

const FEATURE_NAMES: Record<string, string> = {
  photo_emotion: "心声解读",
  health_analysis: "健康分析",
};

/** 纯 CSS 泪滴组件（避免额外依赖） */
function Tear({ className }: { className: string }) {
  return (
    <span className={`qm-tear ${className}`} aria-hidden="true">
      💧
    </span>
  );
}

/** 默认占位头像：纯色圆形 + 爪印 emoji */
function DefaultPetPlaceholder() {
  return (
    <div className="qm-pet-placeholder" aria-hidden="true">
      🐾
    </div>
  );
}

export default function QuotaHintModal({
  isOpen,
  onClose,
  quotaData,
  onUpgrade,
  petImage,
}: QuotaHintModalProps) {
  if (!isOpen || !quotaData) return null;

  const featureName = FEATURE_NAMES[quotaData.feature] || quotaData.feature;
  const hasPetImage = !!petImage && petImage.trim() !== "";

  return (
    <div className="qm-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="qm-card"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* 关闭按钮 */}
        <button
          type="button"
          className="qm-close"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={15} />
        </button>

        {/* 顶部视觉区：渐变背景 + 宠物照片（可怜巴巴） + 装饰 */}
        <div className="qm-visual">
          <div className="qm-visual-bg" />

          {/* 宠物照片区域 */}
          <div className="qm-pet-wrap">
            {hasPetImage ? (
              <div className="qm-pet-photo-frame">
                {/* 悲伤滤镜叠加层 */}
                <div className="qm-sad-overlay" />
                {/* 宠物照片 */}
                <img
                  src={petImage}
                  alt=""
                  draggable={false}
                  className="qm-pet-photo"
                />
              </div>
            ) : (
              <DefaultPetPlaceholder />
            )}
            {/* 泪滴动画 */}
            <Tear className="t1" />
            <Tear className="t2" />
            <Tear className="t3" />
          </div>

          {/* 装饰光点 */}
          <div className="qm-sparkles" aria-hidden="true">
            <Sparkles size={12} className="qm-sparkle s1" />
            <Heart size={10} className="qm-sparkle s2" fill="#FBBF24" />
            <Sparkles size={8} className="qm-sparkle s3" />
            <Heart size={8} className="qm-sparkle s4" fill="#F9A8D4" />
          </div>
        </div>

        {/* 文字内容区 */}
        <div className="qm-body">
          <h3 className="qm-title">本月次数已经用完啦</h3>
          <p className="qm-desc">
            <span className="qm-feature">{featureName}</span>
            已使用 <strong>{quotaData.used}/{quotaData.limit}</strong> 次
          </p>

          {/* 进度环 + 次数展示 */}
          <div className="qm-progress-row">
            <div className="qm-ring">
              <svg viewBox="0 0 56 56" className="qm-ring-svg">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#F3E8FF" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="24" fill="none"
                  stroke="url(#qmGrad)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - Math.min(1, quotaData.used / quotaData.limit))}
                  className="qm-ring-fill"
                  transform="rotate(-90 28 28)"
                />
                <defs>
                  <linearGradient id="qmGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#F472B6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className="qm-ring-num">{quotaData.used}</span>
            </div>
            <div className="qm-progress-info">
              <span className="qm-progress-label">本月已用额度</span>
              <span className="qm-progress-bar-wrap">
                <span className="qm-progress-bar" style={{ width: `${Math.min(100, (quotaData.used / quotaData.limit) * 100)}%` }} />
              </span>
              <span className="qm-progress-detail">
                {quotaData.plan === "pro" ? "Pro会员" : quotaData.plan === "family" ? "家庭版" : "免费版"}每月 {quotaData.limit} 次 · 下月1日自动刷新
              </span>
            </div>
          </div>

          {/* 升级按钮 */}
          <button type="button" className="qm-btn-primary" onClick={onUpgrade}>
            <Crown size={16} />
            解锁会员 · 无限使用
          </button>

          <button type="button" className="qm-btn-ghost" onClick={onClose}>
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
}
