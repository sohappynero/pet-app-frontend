/**
 * 宠物 3D 卡通头像生成器组件
 * 提供完整的 UI 流程：上传 → 生成 → 保存
 */

import { useEffect, useRef, useState } from "react";
import {
  Wand2,
  Upload,
  Loader2,
  Check,
  X,
  Sparkles,
  Image as ImageIcon,
  RotateCcw,
  Download,
  Share2,
} from "lucide-react";
import { generate3DAvatar, saveGeneratedAvatar, getLocal3DAvatar } from "../lib/pet3d.api";
import { saveLocalAvatar } from "../lib/pet-avatar";

interface Pet3DAvatarGeneratorProps {
  /** 宠物信息 */
  pet: {
    id: number;
    name: string;
    species?: "dog" | "cat" | "other";
    image_url?: string | null;
  };
  /** 成功回调 */
  onSuccess?: (imageUrl: string) => void;
  /** 关闭回调 */
  onClose?: () => void;
  /** 尺寸大小 */
  size?: "sm" | "md" | "lg";
}

type GenerationStatus = "idle" | "uploading" | "generating" | "success" | "error";

export default function Pet3DAvatarGenerator({
  pet,
  onSuccess,
  onClose,
  size = "lg",
}: Pet3DAvatarGeneratorProps) {
  // 状态
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [progress, setProgress] = useState("");
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 加载已保存的 3D 头像
  useEffect(() => {
    const saved = getLocal3DAvatar(pet.id);
    if (saved) {
      setGeneratedImage(saved);
      setStatus("success");
    }
  }, [pet.id]);

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 预览原图
    const reader = new FileReader();
    reader.onload = (ev) => {
      setOriginalImage(ev.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // 开始生成
  const handleGenerate = async () => {
    if (!originalImage || !fileInputRef.current?.files?.[0]) return;

    setStatus("generating");
    setError(null);

    const file = fileInputRef.current.files[0];

    const result = await generate3DAvatar(
      file,
      {
        petName: pet.name,
        species: pet.species || "dog",
        background: "simple",
      },
      (msg) => setProgress(msg)
    );

    if (result.success && result.imageUrl) {
      setGeneratedImage(result.imageUrl);
      setStatus("success");
      saveGeneratedAvatar(pet.id, result.imageUrl);
      onSuccess?.(result.imageUrl);
    } else {
      setError(result.error || "生成失败");
      setStatus("error");
    }
  };

  // 重新开始
  const handleReset = () => {
    setStatus("idle");
    setOriginalImage(null);
    setGeneratedImage(null);
    setError(null);
    setProgress("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 下载图片
  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `${pet.name}_3d_avatar.png`;
    link.click();
  };

  // 保存为头像
  const handleSaveAsAvatar = () => {
    if (!generatedImage) return;

    // 通过统一模块保存（含容量校验和自动清理）
    saved = saveLocalAvatar(pet.id, generatedImage);
    onSuccess?.(generatedImage);
    onClose?.();
  };

  // 尺寸配置
  const sizeConfig = {
    sm: { preview: 120, icon: 24 },
    md: { preview: 200, icon: 32 },
    lg: { preview: 280, icon: 40 },
  }[size];

  return (
    <div className="pet3d-generator-overlay" onClick={onClose}>
      <div
        className="pet3d-generator-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: sizeConfig.preview + 80 }}
      >
        {/* 头部 */}
        <div className="pet3d-header">
          <div className="pet3d-header-icon">
            <Sparkles size={20} />
          </div>
          <div className="pet3d-header-text">
            <h3>3D 卡通头像生成</h3>
            <p>为 {pet.name} 生成 Pixar 风格头像</p>
          </div>
          <button className="pet3d-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="pet3d-content">
          {/* 步骤指示器 */}
          <div className="pet3d-steps">
            <div className={`pet3d-step ${status !== "idle" ? "active" : ""} ${originalImage ? "done" : ""}`}>
              <span className="pet3d-step-num">1</span>
              <span className="pet3d-step-label">上传照片</span>
            </div>
            <div className="pet3d-step-line" />
            <div className={`pet3d-step ${status === "generating" || status === "success" ? "active" : ""} ${status === "success" ? "done" : ""}`}>
              <span className="pet3d-step-num">2</span>
              <span className="pet3d-step-label">AI 生成</span>
            </div>
            <div className="pet3d-step-line" />
            <div className={`pet3d-step ${status === "success" ? "active done" : ""}`}>
              <span className="pet3d-step-num">3</span>
              <span className="pet3d-step-label">保存使用</span>
            </div>
          </div>

          {/* 图片预览区 */}
          <div className="pet3d-preview-area">
            {/* 原图预览 */}
            {originalImage && (
              <div className="pet3d-image-box pet3d-original">
                <span className="pet3d-image-label">原图</span>
                <img src={originalImage} alt="原图" />
              </div>
            )}

            {/* 生成结果 */}
            {generatedImage && (
              <div className="pet3d-image-box pet3d-result">
                <span className="pet3d-image-label">3D 卡通效果</span>
                <img src={generatedImage} alt="生成的3D头像" />
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </div>
            )}

            {/* 空状态 */}
            {!originalImage && !generatedImage && (
              <button
                className="pet3d-upload-area"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={sizeConfig.icon} />
                <span>点击上传宠物照片</span>
                <small>支持 JPG、PNG 格式</small>
              </button>
            )}

            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
          </div>

          {/* 进度提示 */}
          {status === "generating" && (
            <div className="pet3d-progress">
              <Loader2 size={20} className="pet3d-spin" />
              <span>{progress || "正在生成..."}</span>
            </div>
          )}

          {/* 错误提示 */}
          {status === "error" && error && (
            <div className="pet3d-error">
              <X size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="pet3d-footer">
          {status === "idle" && originalImage && (
            <>
              <button className="pet3d-btn pet3d-btn-secondary" onClick={handleReset}>
                <RotateCcw size={16} />
                重新选择
              </button>
              <button className="pet3d-btn pet3d-btn-primary" onClick={handleGenerate}>
                <Wand2 size={16} />
                开始生成
              </button>
            </>
          )}

          {status === "generating" && (
            <button className="pet3d-btn pet3d-btn-disabled" disabled>
              <Loader2 size={16} className="pet3d-spin" />
              生成中...
            </button>
          )}

          {status === "success" && (
            <>
              <button className="pet3d-btn pet3d-btn-secondary" onClick={handleReset}>
                <RotateCcw size={16} />
                再试一张
              </button>
              <button className="pet3d-btn pet3d-btn-download" onClick={handleDownload}>
                <Download size={16} />
                下载
              </button>
              <button className="pet3d-btn pet3d-btn-primary" onClick={handleSaveAsAvatar}>
                <Check size={16} />
                设为头像
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <button className="pet3d-btn pet3d-btn-secondary" onClick={handleReset}>
                <RotateCcw size={16} />
                重试
              </button>
            </>
          )}
        </div>
      </div>

      {/* 添加组件样式 */}
      <style>{`
        .pet3d-generator-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .pet3d-generator-modal {
          background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 24px;
          width: 100%;
          max-width: 400px;
          box-shadow: 
            0 25px 80px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
          overflow: hidden;
          animation: pet3dSlideIn 0.3s ease;
        }

        @keyframes pet3dSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .pet3d-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 20px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .pet3d-header-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .pet3d-header-text {
          flex: 1;
        }

        .pet3d-header-text h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: white;
        }

        .pet3d-header-text p {
          margin: 2px 0 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
        }

        .pet3d-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .pet3d-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .pet3d-content {
          padding: 20px;
        }

        .pet3d-steps {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .pet3d-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .pet3d-step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .pet3d-step.active .pet3d-step-num {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .pet3d-step.done .pet3d-step-num {
          background: #10b981;
          color: white;
        }

        .pet3d-step-label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          transition: color 0.3s;
        }

        .pet3d-step.active .pet3d-step-label,
        .pet3d-step.done .pet3d-step-label {
          color: rgba(255, 255, 255, 0.9);
        }

        .pet3d-step-line {
          width: 40px;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          margin-bottom: 18px;
        }

        .pet3d-preview-area {
          display: flex;
          gap: 12px;
          justify-content: center;
          min-height: 140px;
          align-items: center;
        }

        .pet3d-image-box {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
        }

        .pet3d-image-box img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pet3d-original {
          width: 100px;
          height: 100px;
        }

        .pet3d-result {
          width: 140px;
          height: 140px;
          box-shadow: 
            0 8px 32px rgba(102, 126, 234, 0.3),
            0 0 0 2px rgba(102, 126, 234, 0.5);
        }

        .pet3d-image-label {
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 10px;
          white-space: nowrap;
        }

        .pet3d-upload-area {
          width: 100%;
          height: 140px;
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.03);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.3s;
        }

        .pet3d-upload-area:hover {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
          color: white;
        }

        .pet3d-upload-area span {
          font-size: 14px;
          font-weight: 500;
        }

        .pet3d-upload-area small {
          font-size: 11px;
          opacity: 0.7;
        }

        .pet3d-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 12px;
          margin-top: 16px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
        }

        .pet3d-spin {
          animation: pet3dSpin 1s linear infinite;
        }

        @keyframes pet3dSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .pet3d-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          margin-top: 16px;
          color: #f87171;
          font-size: 13px;
        }

        .pet3d-footer {
          display: flex;
          gap: 10px;
          padding: 16px 20px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .pet3d-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .pet3d-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .pet3d-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
        }

        .pet3d-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }

        .pet3d-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .pet3d-btn-download {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .pet3d-btn-download:hover {
          background: rgba(16, 185, 129, 0.3);
        }

        .pet3d-btn-disabled {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.4);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

/**
 * 3D 卡通头像生成触发按钮
 * 集成到现有头像旁边的小按钮
 */
interface Generate3DButtonProps {
  pet: {
    id: number;
    name: string;
    species?: "dog" | "cat" | "other";
    image_url?: string | null;
  };
  onGenerated?: (imageUrl: string) => void;
}

export function Generate3DButton({ pet, onGenerated }: Generate3DButtonProps) {
  const [showGenerator, setShowGenerator] = useState(false);

  return (
    <>
      <button
        className="pet3d-trigger-btn"
        onClick={() => setShowGenerator(true)}
        title="生成 3D 卡通头像"
      >
        <Sparkles size={14} />
      </button>

      {showGenerator && (
        <Pet3DAvatarGenerator
          pet={pet}
          size="md"
          onSuccess={(url) => {
            onGenerated?.(url);
            setShowGenerator(false);
          }}
          onClose={() => setShowGenerator(false)}
        />
      )}

      <style>{`
        .pet3d-trigger-btn {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: 2px solid #1a1a2e;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10;
        }

        .pet3d-trigger-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.5);
        }
      `}</style>
    </>
  );
}
