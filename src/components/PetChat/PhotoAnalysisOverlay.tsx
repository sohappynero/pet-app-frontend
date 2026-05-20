/**
 * PhotoAnalysisOverlay - 图片分析中的 Loading 覆盖层
 * 
 * 显示在照片上传完成、等待 AI 分析结果时的全屏/半屏状态。
 * 
 * 视觉效果：
 * - 中央显示上传的宠物照片（带呼吸光效边框）
 * - 下方 3 步进度指示器：[分析表情 ✅] → [理解情绪 ⏳] → [生成内心OS...]
 * - 底部显示有趣的 loading 文案轮播
 * - 半透明背景看到聊天界面
 */

import { useState, useEffect } from "react";
import { Loader2, Check, Sparkles } from "lucide-react";

// ============================================================
// 类型定义
// ============================================================

export interface PhotoAnalysisOverlayProps {
  /** 照片 URL（Data URL 或远程 URL） */
  photoUrl: string;
  /** 当前进度步骤（1-3） */
  currentStep?: number;
  /** 是否正在加载（控制显示/隐藏） */
  isActive: boolean;
}

// ============================================================
// 常量配置
// ============================================================

/** 分析步骤定义 */
const ANALYSIS_STEPS = [
  {
    id: 1,
    label: "分析表情",
    icon: "👁️",
    description: "识别面部微表情",
    duration: 1200,
  },
  {
    id: 2,
    label: "理解情绪",
    icon: "💭",
    description: "解读心理状态",
    duration: 1500,
  },
  {
    id: 3,
    label: "生成内心OS",
    icon: "✨",
    description: "翻译宠物语言",
    duration: 2000,
  },
];

/** Loading 文案池 */
const LOADING_MESSAGES = [
  "宝贝正在思考怎么形容这张脸...",
  "AI 正在解读毛孩子的微表情...",
  "正在翻译「汪汪/喵喵」的真正含义...",
  "别急，毛孩子正在组织语言...",
  "正在从宠物角度重新理解这张图...",
  "AI 正在努力听懂它的心声...",
  "让 AI 看看这张照片里藏着的秘密...",
  "正在连接宠物心灵频道...",
  "解读中... 看来它有很多话想说！",
  "马上就好，毛孩子快想好怎么说了~",
];

// ============================================================
// 主组件
// ============================================================

export function PhotoAnalysisOverlay({
  photoUrl,
  currentStep = 1,
  isActive,
}: PhotoAnalysisOverlayProps) {
  
  // Loading 文案轮播索引
  const [msgIndex, setMsgIndex] = useState(0);

  // 文案轮播定时器
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2800); // 每 2.8 秒切换一次

    return () => clearInterval(interval);
  }, [isActive]);

  // 不激活时不渲染
  if (!isActive) return null;

  return (
    <div className="analysis-overlay">
      {/* ====== 背景模糊层 ====== */}
      <div className="analysis-overlay-backdrop" />

      {/* ====== 内容区域 ====== */}
      <div className="analysis-overlay-content">
        
        {/* 照片展示区 */}
        <div className="analysis-photo-container">
          <img
            src={photoUrl}
            alt="待分析的宠物照片"
            className="analysis-photo"
          />
          {/* 呼吸光效边框 */}
          <div className="analysis-photo-breathe" />
          
          {/* 状态角标 */}
          <div className="analysis-photo-badge">
            <Loader2 size={12} className="animate-spin" />
            <span>分析中</span>
          </div>
        </div>

        {/* 进度步骤指示器 */}
        <div className="analysis-steps">
          {ANALYSIS_STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isPending = stepNumber > currentStep;

            return (
              <div key={step.id} className={`analysis-step ${isCurrent ? "current" : ""} ${isCompleted ? "completed" : ""} ${isPending ? "pending" : ""}`}>
                
                {/* 步骤圆圈 + 图标 */}
                <div className="analysis-step-circle">
                  {isCompleted ? (
                    <Check size={14} />
                  ) : (
                    <span>{step.icon}</span>
                  )}
                  
                  {/* 当前步骤的脉冲动画 */}
                  {isCurrent && (
                    <div className="analysis-step-pulse" />
                  )}
                </div>

                {/* 步骤文字 */}
                <span className="analysis-step-label">{step.label}</span>
              </div>
            );
          })}

          {/* 连接线 */}
          <div className="analysis-step-connector">
            <div
              className="analysis-step-progress"
              style={{
                width: `${((currentStep - 1) / (ANALYSIS_STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Loading 文字轮播 */}
        <div className="analysis-loading-text">
          <p key={msgIndex} className="analysis-loading-msg">
            <Sparkles size={13} className="analysis-loading-sparkle" />
            {LOADING_MESSAGES[msgIndex]}
          </p>
        </div>

        {/* 加载动画点 */}
        <div className="analysis-loading-dots">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className={`analysis-dot ${i === currentStep % 3 ? "active" : ""}`}
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default PhotoAnalysisOverlay;
