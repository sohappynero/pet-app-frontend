/**
 * 宠物照片上传组件（增强版）
 * 
 * 功能：
 * - 拖拽上传：支持文件拖拽，带视觉反馈
 * - 点击选择：从相册选择图片
 * - 拍照上传：直接调用设备相机拍照
 * - 图片预览：选中后显示大图预览，支持删除/重新选择
 * - base64 编码：自动将图片转为 base64 格式输出
 * 
 * 设计风格：温暖治愈系宠物社交风格
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Image, Loader2, Camera, RotateCcw, ZoomIn } from "lucide-react";

// ============================================================
// 类型定义
// ============================================================

interface PhotoUploadResult {
  /** 原始 File 对象 */
  file: File;
  /** base64 编码字符串 */
  base64: string;
  /** Data URL 格式（可直接用于 img src） */
  dataUrl: string;
  /** 文件 MIME 类型 */
  mimeType: string;
  /** 文件大小（字节） */
  fileSize: number;
}

export interface PetPhotoUploaderProps {
  /** 上传完成回调（返回完整结果对象） */
  onUploadComplete?: (result: PhotoUploadResult) => void;
  /** 进度状态回调 */
  onProgress?: (status: string) => void;
  /** 取消/关闭回调 */
  onCancel?: () => void;
  /** 错误回调 */
  onError?: (error: string) => void;
  /** 最大文件大小（MB），默认 10MB */
  maxSize?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否显示相机按钮（默认 true） */
  showCameraButton?: boolean;
}

// ============================================================
// Loading 文案池
// ============================================================

const LOADING_MESSAGES = [
  "宝贝正在思考怎么形容这张脸...",
  "正在解读毛孩子的微表情...",
  "AI 正在分析情绪波动...",
  "让 AI 看看这张照片里的秘密...",
  "正在翻译宠物的内心 OS...",
];

// ============================================================
// 主组件
// ============================================================

export function PetPhotoUploader({
  onUploadComplete,
  onProgress,
  onCancel,
  onError,
  maxSize = 10,
  disabled = false,
  className = "",
  showCameraButton = true,
}: PetPhotoUploaderProps) {
  // 状态管理
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Loading 文案轮播效果
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [isProcessing]);

  // ============================================================
  // 核心方法：文件转 Base64
  // ============================================================

  /**
   * 将图片文件转换为 base64 编码
   * @returns Promise<{ base64: string; dataUrl: string }>
   */
  const convertToBase64 = useCallback(async (file: File): Promise<{
    base64: string;
    dataUrl: string;
  }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // 分离出纯 base64 部分（去除 data:image/xxx;base64, 前缀）
        const base64 = result.split(",")[1];
        resolve({ base64, dataUrl: result });
      };
      reader.onerror = () => reject(new Error("文件读取失败"));
      reader.readAsDataURL(file);
    });
  }, []);

  // ============================================================
  // 核心方法：文件验证与处理
  // ============================================================

  /**
   * 验证并处理选中的文件
   */
  const handleFile = useCallback(async (file: File): Promise<void> => {
    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      const msg = "请选择图片文件哦~ 支持 JPG、PNG、WebP 等格式";
      setErrorMsg(msg);
      onError?.(msg);
      return;
    }

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      const msg = `图片太大了喵~ 不能超过 ${maxSize}MB`;
      setErrorMsg(msg);
      onError?.(msg);
      return;
    }

    // 清除错误状态
    setErrorMsg(null);

    try {
      // 开始处理
      setIsProcessing(true);
      onProgress?.("正在处理图片...");

      // 转换为 base64
      const { base64, dataUrl } = await convertToBase64(file);

      // 更新状态
      setSelectedFile(file);
      setPreview(dataUrl);

      // 通知父组件完成
      const result: PhotoUploadResult = {
        file,
        base64,
        dataUrl,
        mimeType: file.type,
        fileSize: file.size,
      };

      onUploadComplete?.(result);
      onProgress?.("准备就绪！");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "图片处理失败";
      setErrorMsg(msg);
      onError?.(msg);
    } finally {
      setIsProcessing(false);
    }
  }, [maxSize, convertToBase64, onProgress, onUploadComplete, onError]);

  // ============================================================
  // 交互事件处理
  // ============================================================

  /** 点击选择文件（从相册） */
  const handleClick = () => {
    if (!disabled && !isProcessing) {
      fileInputRef.current?.click();
    }
  };

  /** 拍照按钮点击 */
  const handleCameraClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && !isProcessing) {
      cameraInputRef.current?.click();
    }
  };

  /** 相册文件 input change */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
    // 重置 input 以允许重复选择同一文件
    e.target.value = "";
  };

  /** 相机文件 input change */
  const handleCameraChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
    e.target.value = "";
  };

  // ========== 拖拽事件处理 ==========

  /** 拖拽进入区域 */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  }, [disabled, isProcessing]);

  /** 拖拽悬停 */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /** 拖拽离开区域 */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  /** 拖拽放置（核心事件） */
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isProcessing) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFile(files[0]);
    }
  }, [disabled, isProcessing, handleFile]);

  // ========== 清除/重置操作 ==========

  /** 清除当前选择的图片 */
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setSelectedFile(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    onCancel?.();
  }, [onCancel]);

  // 重新选择（保留清除逻辑）
  const handleRetake = useCallback(() => {
    handleClear({ stopPropagation: () => {} } as React.MouseEvent);
  }, [handleClear]);

  // ============================================================
  // 渲染
  // ============================================================

  return (
    <div className={`photo-uploader-wrapper ${className}`}>
      {/* ====== 隐藏的文件输入框 ====== */}
      
      {/* 相册输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="pu-hidden-input"
        disabled={disabled || isProcessing}
      />

      {/* 相机输入（capture="environment" 调用后置摄像头） */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraChange}
        className="pu-hidden-input"
        disabled={disabled || isProcessing}
      />

      {/* ====== 状态一：未选择图片时 → 显示上传区域 ====== */}
      
      {!preview && !isProcessing ? (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            pu-upload-zone
            ${isDragging ? "pu-drag-active" : ""}
            ${disabled ? "pu-disabled" : ""}
          `}
        >
          {/* 拖拽时的遮罩层 */}
          <div className={`pu-drag-overlay ${isDragging ? "visible" : ""}`}>
            <Image size={48} />
            <span>松开以上传照片</span>
          </div>

          {/* 默认内容 */}
          <div className="pu-upload-content">
            {/* 图标区域 */}
            <div className="pu-icon-circle">
              {isDragging ? (
                <Image size={28} className="text-white" />
              ) : (
                <>
                  <Upload size={26} />
                  {/* 浮动装饰元素 */}
                  <span className="pu-float-deco pu-deco-1">📸</span>
                  <span className="pu-float-deco pu-deco-2">🐾</span>
                  <span className="pu-float-deco pu-deco-3">✨</span>
                </>
              )}
            </div>

            {/* 文字提示 */}
            <p className="pu-hint-main">
              {isDragging ? "松开以上传" : "点击或拖拽上传照片"}
            </p>
            <p className="pu-hint-sub">
              支持 JPG、PNG、WebP，最大 {maxSize}MB
            </p>

            {/* 操作按钮组 */}
            <div className="pu-action-buttons">
              {/* 拍照按钮 */}
              {showCameraButton && (
                <button
                  type="button"
                  onClick={handleCameraClick}
                  className="pu-btn-camera"
                  title="拍照上传"
                >
                  <Camera size={16} />
                  <span>拍照</span>
                </button>
              )}

              {/* 选图按钮 */}
              <button
                type="button"
                className="pu-btn-gallery"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick();
                }}
                title="从相册选择"
              >
                <Image size={16} />
                <span>选图</span>
              </button>
            </div>
          </div>

          {/* 底部装饰渐变线 */}
          <div className="pu-bottom-glow" />
        </div>

      /* ====== 状态二：处理中 → 显示 Loading 动画 ====== */

      ) : isProcessing && !preview ? (
        <div className="pu-processing-zone">
          <div className="pu-loading-spinner">
            <Loader2 size={36} className="animate-spin" />
          </div>
          
          {/* Loading 文字（轮播切换） */}
          <div className="pu-loading-text-container">
            <p key={loadingMsgIndex} className="pu-loading-text">
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
          </div>

          {/* 进度指示点 */}
          <div className="pu-progress-dots">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className={`pu-dot ${i <= loadingMsgIndex % 3 ? "active" : ""}`}
              />
            ))}
          </div>
        </div>

      /* ====== 状态三：已选择 → 显示预览区域 ====== */

      ) : preview ? (
        <div className="pu-preview-zone">
          {/* 预览图片 */}
          <div className="pu-preview-image-wrap">
            <img
              src={preview}
              alt="宠物照片预览"
              className="pu-preview-image"
            />

            {/* 图片信息标签 */}
            <div className="pu-photo-info">
              <ZoomIn size={12} />
              <span>{selectedFile?.name || "pet_photo"}</span>
              <span className="pu-file-size">
                {selectedFile ? formatFileSize(selectedFile.fileSize) : ""}
              </span>
            </div>

            {/* Hover 蒙层 */}
            <div className="pu-preview-overlay">
              <div className="pu-overlay-actions">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="pu-overlay-btn pu-btn-retry"
                  title="重新选择"
                >
                  <RotateCcw size={18} />
                  <span>重拍/换图</span>
                </button>
                
                <button
                  type="button"
                  onClick={handleClear}
                  className="pu-overlay-btn pu-btn-delete"
                  title="删除"
                >
                  <X size={18} />
                  <span>删除</span>
                </button>
              </div>
            </div>
          </div>

          {/* 成功提示 */}
          <div className="pu-success-bar">
            <span>✅ 照片已就绪，可以开始解读心声了！</span>
          </div>

          {/* 错误提示 */}
          {errorMsg && (
            <div className="pu-error-bar">
              <span>⚠️ {errorMsg}</span>
            </div>
          )}
        </div>

      ) : null}
    </div>
  );
}

// ============================================================
// 工具函数
// ============================================================

/** 格式化文件大小 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
