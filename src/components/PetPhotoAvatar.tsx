import { useState, useEffect } from "react";
import type { Pet, Species } from "../types";

/**
 * PetPhotoAvatar - 3D 溢出式宠物照片展示组件
 *
 * 上传真实照片后，宠物以大尺寸 3D 立体效果溢出容器边界，
 * 营造"从屏幕里探出来"的视觉冲击感（类似卡通.png中的布偶猫效果）。
 * 未上传时显示可爱的物种占位图。
 *
 * @param pet - 宠物对象
 * @param size - 尺寸变体：small | default | large | xl
 */
export default function PetPhotoAvatar({
  pet,
  size = "default",
  className = "",
}: {
  pet: { id?: number; species?: string; image_url?: string | null } | null | undefined;
  size?: "small" | "default" | "large" | "xl";
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  // 从 localStorage 读取本地保存的头像
  useEffect(() => {
    if (pet?.id) {
      try {
        const saved = localStorage.getItem(`pet_avatar_${pet.id}`);
        if (saved) setLocalUrl(saved);
      } catch {}
    }
  }, [pet?.id]);

  const imageUrl = pet?.image_url || localUrl;
  const species = (pet?.species || "dog") as Species;
  const hasImage = !!imageUrl && !imgError;

  // 重置加载状态当图片URL变化时
  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [imageUrl]);

  return (
    <div className={`ppa-scene ppa-scene-${size} ${className}`}>
      {/* 底部地面阴影 */}
      <div className="ppa-ground-shadow" />

      {/* 3D 图片主体 — 有照片时溢出容器 */}
      <div className={`ppa-figure ${hasImage ? "ppa-overflow-mode" : ""}`}>
        {hasImage ? (
          <>
            {/* 加载中占位 */}
            {!imgLoaded && (
              <div className="ppa-skeleton">
                <span className="ppa-skeleton-emoji">{getDefaultEmoji(species)}</span>
              </div>
            )}
            {/* 真实照片 — 大尺寸溢出显示 */}
            <img
              src={imageUrl}
              alt={species === "cat" ? "我的猫咪" : species === "other" ? "我的宠物" : "我的狗狗"}
              className={`ppa-photo-3d ${imgLoaded ? "loaded" : ""}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          /* 无照片时的可爱占位 */
          <div className="ppa-placeholder">
            <div className="ppa-placeholder-inner">
              <span className="ppa-placeholder-emoji">{getDefaultEmoji(species)}</span>
              <span className="ppa-placeholder-label">
                {species === "cat" ? "喵~" : species === "other" ? "🐾" : "汪!"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 浮动装饰粒子 */}
      <div className="ppa-particles">
        <span className="ppa-particle ppa-p-1">✨</span>
        <span className="ppa-particle ppa-p-2">💕</span>
        <span className="ppa-particle ppa-p-3">⭐</span>
      </div>
    </div>
  );
}

function getDefaultEmoji(species: Species): string {
  if (species === "cat") return "🐱";
  if (species === "other") return "🐰";
  return "🐕";
}
