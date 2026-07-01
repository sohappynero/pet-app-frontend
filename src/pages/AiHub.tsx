import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ImagePlus, ChevronLeft, RotateCcw } from "lucide-react";
import { useShell } from "../hooks/useShell";
import { getLocalAvatar } from "../lib/pet-avatar";
import { fetchPhotoMind } from "../lib/pet-mind.api";
import type { QuotaError } from "../lib/pet-mind.api";
import type { PhotoMindResult } from "../types";
import { PhotoMindResultCard } from "../components/PetChat/PhotoMindResult";
import QuotaHintModal from "../components/PetChat/QuotaHintModal";
import "../styles/ai-mind.css";

export default function AiHub() {
  const navigate = useNavigate();
  const { selectedPet } = useShell();
  const petName = selectedPet?.name || "宠物";

  // 分析状态
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // 照片心声分析结果
  const [photoResult, setPhotoResult] = useState<PhotoMindResult | null>(null);
  // 上传的照片 URL（用于预览）
  const [photoUrl, setPhotoUrl] = useState<string>("");
  // 配额弹窗
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaErrorData, setQuotaErrorData] = useState<QuotaError | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  /* ---- 照片上传 & 分析 ---- */
  const handlePhotoUpload = async (file: File) => {
    if (!selectedPet) return;
    setIsAnalyzing(true);
    setPhotoResult(null);
    setPhotoUrl(URL.createObjectURL(file));

    try {
      const res = await fetchPhotoMind({ pet: selectedPet, imageFile: file });
      if (res.success && res.result) {
        setPhotoResult(res.result);
      } else if (res.quotaError) {
        setQuotaErrorData(res.quotaError);
        setShowQuotaModal(true);
        setPhotoUrl("");
      } else {
        console.error("照片分析失败:", res.error);
        setPhotoUrl("");
      }
    } catch (err) {
      console.error("照片分析异常:", err);
      setPhotoUrl("");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ---- 拍照 / 相册点击 ---- */
  const handleCameraClick = () => cameraRef.current?.click();
  const handleGalleryClick = () => galleryRef.current?.click();

  /* ---- 重新拍照 ---- */
  const handleRetake = () => {
    setPhotoResult(null);
    setPhotoUrl("");
  };

  /* ---- 未选择宠物：空状态 ---- */
  if (!selectedPet) {
    return (
      <div className="ai-mind-page">
        <button className="ai-mind-back" onClick={() => navigate(-1)} aria-label="返回">
          <ChevronLeft size={22} />
        </button>

        <div className="ai-mind-lamp" aria-hidden="true">
          <div className="ai-mind-lamp__cord" />
          <div className="ai-mind-lamp__shade">
            <span className="ai-mind-lamp__paw">🐾</span>
            <div className="ai-mind-lamp__glow" />
          </div>
        </div>

        <div className="ai-mind-content">
          <div className="ai-mind-header">
            <h1 className="ai-mind-title">AI 心声<em>✨</em></h1>
            <p className="ai-mind-subtitle">🐾 用 AI 读懂 TA 的心 🐾</p>
          </div>
          <div className="ai-mind-paw-watermark" aria-hidden="true">🐾</div>
          <div className="ai-mind-guide">
            <p className="ai-mind-guide__line">请先选择一只宠物</p>
            <p className="ai-mind-guide__line">再回来和 TA 聊天吧～ 🐾</p>
          </div>
        </div>
      </div>
    );
  }

  /* ====== 主页面 ====== */
  return (
    <div className="ai-mind-page">
      <button className="ai-mind-back" onClick={() => navigate(-1)} aria-label="返回">
        <ChevronLeft size={22} />
      </button>

      {/* 吊灯装饰 */}
      <div className="ai-mind-lamp" aria-hidden="true">
        <div className="ai-mind-lamp__cord" />
        <div className="ai-mind-lamp__shade">
          <span className="ai-mind-lamp__paw">🐾</span>
          <div className="ai-mind-lamp__glow" />
        </div>
      </div>

      {/* ====== 有结果：展示 PhotoMindResultCard ====== */}
      {photoResult ? (
        <div className="ai-mind-content ai-mind-content--result">
          {/* 结果卡片头部操作栏 */}
          <div className="ai-mind-result-bar">
            <h1 className="ai-mind-result-title">AI 心声<em>✨</em></h1>
            <button
              type="button"
              className="ai-mind-retake-btn"
              onClick={handleRetake}
              aria-label="重新拍照"
            >
              <RotateCcw size={16} />
              <span>再拍一张</span>
            </button>
          </div>

          {/* 完整的 PhotoMindResult 卡片 */}
          <PhotoMindResultCard
            result={photoResult}
            photoUrl={photoUrl}
            petName={petName}
            petSpecies={(selectedPet.species as "cat" | "dog") || "other"}
            expandable
            onRetake={handleRetake}
          />
        </div>
      ) : (
        /* ====== 无结果：首页引导 UI ====== */
        <>
          <div className="ai-mind-content">
            {/* 标题区 */}
            <div className="ai-mind-header">
              <h1 className="ai-mind-title">AI 心声<em>✨</em></h1>
              <p className="ai-mind-subtitle">🐾 用 AI 读懂 TA 的心 🐾</p>
            </div>

            {/* 猫爪水印 */}
            <div className="ai-mind-paw-watermark" aria-hidden="true">🐾</div>

            {/* 引导文字 */}
            <div className="ai-mind-guide">
              <p className="ai-mind-guide__line">点击下方按钮</p>
              <p className="ai-mind-guide__line">上传照片让我看看吧～ 💛</p>
            </div>

            {/* 功能卡片 — 毛玻璃容器 */}
            <div className={`ai-mind-card-wrap ${isAnalyzing ? "ai-mind-card-wrap--analyzing" : ""}`}>
              <h2 className="ai-mind-card-title">
                {isAnalyzing ? "正在分析中..." : "选择一张照片 ✨"}
              </h2>

              {!isAnalyzing ? (
                <div className="ai-mind-actions">
                  {/* 拍照按钮 */}
                  <button
                    type="button"
                    className="ai-mind-action-btn"
                    onClick={handleCameraClick}
                    aria-label="拍照"
                  >
                    <div className="ai-mind-action-ico ai-mind-action-ico--camera">
                      <Camera size={28} strokeWidth={1.8} />
                    </div>
                    <span className="ai-mind-action-label">拍照</span>
                    <span className="ai-mind-action-desc">直接拍摄</span>
                  </button>

                  {/* 上传图片按钮 */}
                  <button
                    type="button"
                    className="ai-mind-action-btn"
                    onClick={handleGalleryClick}
                    aria-label="上传图片"
                  >
                    <div className="ai-mind-action-ico ai-mind-action-ico--gallery">
                      <ImagePlus size={28} strokeWidth={1.8} />
                    </div>
                    <span className="ai-mind-action-label">上传图片</span>
                    <span className="ai-mind-action-desc">从相册选择</span>
                  </button>
                </div>
              ) : (
                /* 分析中加载动画 */
                <div className="ai-mind-analyzing">
                  <div className="ai-mind-analyzing__spinner" />
                  <p className="ai-mind-analyzing__text">AI 正在解读 {petName} 的心声...</p>
                  <p className="ai-mind-analyzing__hint">请稍等片刻 ✨</p>
                </div>
              )}
            </div>
          </div>

          {/* 隐藏文件输入 */}
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="ai-mind-hidden-input"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="ai-mind-hidden-input"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.target.value = ""; }}
          />
        </>
      )}

      {/* 配额提示弹窗 */}
      {showQuotaModal && quotaErrorData && (
        <QuotaHintModal quota={quotaErrorData} onClose={() => setShowQuotaModal(false)} />
      )}
    </div>
  );
}
