import { useState, useEffect } from "react";
import type { Pet, Species } from "../types";
import { getLocalAvatar } from "../lib/pet-avatar";

/**
 * 判断是否为"名字圆形头像"标记（后端返回的 __name_circle__）
 */
function isNameCircleMarker(url?: string | null): boolean {
  return url === "__name_circle__";
}

/**
 * 名字圆形头像 - 当后端返回 __name_circle__ 时渲染
 */
function PetNameCircle({ name, size = 120 }: { name: string; size?: number }) {
  const char = (name || "宠").charAt(0).toUpperCase();
  return (
    <span
      className="pet-name-circle"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        lineHeight: `${size}px`,
      }}
      title={name}
    >
      {char}
    </span>
  );
}

/**
 * PetPhotoAvatar - 3D 溢出式宠物照片展示组件
 *
 * 上传真实照片后，宠物以大尺寸 3D 立体效果溢出容器边界，
 * 营造"从屏幕里探出来"的视觉冲击感（类似卡通.png中的布偶猫效果）。
 * 未上传时显示物种默认头像或可爱的占位图。
 *
 * 头像优先级链：localStorage > _resolved_avatar_url(含默认品种图) > image_url > emoji
 *
 * @param pet - 宠物对象
 * @param size - 尺寸变体：small | default | large | xl
 */
export default function PetPhotoAvatar({
  pet,
  size = "default",
  className = "",
}: {
  pet: {
    id?: number;
    species?: string;
    image_url?: string | null;
    avatar_url?: string | null;
    _resolved_avatar_url?: string | null;
  } | null | undefined;
  size?: "small" | "default" | "large" | "xl";
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  // 从 localStorage 读取本地保存的头像
  // 依赖 pet.id + pet.image_url + pet._resolved_avatar_url：任一变化都重新检查缓存
  useEffect(() => {
    if (pet?.id) {
      const saved = getLocalAvatar(pet.id);
      setLocalUrl(saved);
    } else {
      setLocalUrl(null);
    }
  }, [pet?.id, pet?.image_url, pet?._resolved_avatar_url]);

  // 头像 URL 解析优先级：props传入的 image_url（最新） > 本地缓存 > 后端解析URL(含默认图)
  // 关键修复：外部传入的 image_url 优先级最高（因为可能包含刚上传的 dataUrl）
  const propsImageUrl = pet?.image_url || null;
  const resolvedImageUrl = propsImageUrl
    || localUrl
    || (pet as any)?._resolved_avatar_url
    || null;

  const imageUrl = resolvedImageUrl;
  const species = (pet?.species || "dog") as Species;
  const hasImage = !!imageUrl && !imgError;

  // 重置加载状态当图片URL变化时
  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
    // 强制重新加载图片
    if (imageUrl) {
      const img = new Image();
      img.onload = () => setImgLoaded(true);
      img.onerror = () => setImgError(true);
      img.src = imageUrl;
    }
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
                {isNameCircleMarker(imageUrl) || (!imageUrl && (pet as any)?._resolved_avatar_url === "__name_circle__") ? (
                  <PetNameCircle name={(pet as any)?.name || "宠物"} size={48} />
                ) : imageUrl || (pet as any)?._resolved_avatar_url ? (
                  <img
                    src={imageUrl || (pet as any)?._resolved_avatar_url}
                    alt={(pet as any)?.name || "宠物"}
                    style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <PetNameCircle name={(pet as any)?.name || "宠物"} size={48} />
                )}
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
          /* 无照片时的占位：优先用模板图，否则名字圆 */
          <div className="ppa-placeholder">
            <div className="ppa-placeholder-inner">
              {isNameCircleMarker(imageUrl) || (!imageUrl && (pet as any)?._resolved_avatar_url === "__name_circle__") ? (
                <PetNameCircle name={(pet as any)?.name || "宠物"} size={80} />
              ) : imageUrl || (pet as any)?._resolved_avatar_url ? (
                /* 有模板图 URL → 显示模板图 */
                <img
                  src={imageUrl || (pet as any)?._resolved_avatar_url}
                  alt={(pet as any)?.name || "宠物"}
                  style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover" }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector('.pet-name-circle')) {
                      const fb = document.createElement('span');
                      fb.className = 'pet-name-circle';
                      fb.style.cssText = 'width:80px;height:80px;font-size:34px;line-height:80px;';
                      fb.textContent = ((pet as any)?.name || '宠').charAt(0).toUpperCase();
                      parent.insertBefore(fb, e.currentTarget);
                    }
                  }}
                />
              ) : (
                /* 完全无头像数据 → 名字圆 */
                <PetNameCircle name={(pet as any)?.name || "宠物"} size={80} />
              )}
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
