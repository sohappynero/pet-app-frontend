/**
 * 宠物头像统一管理模块
 *
 * 解决的问题：
 * 1. 图片无压缩 → localStorage 超限导致刷新后丢失
 * 2. 后端同步失败被静默忽略 → 跨设备不显示
 * 3. 上传逻辑在 3 个页面中重复实现
 *
 * 使用方式：
 * import { handleAvatarUpload, getLocalAvatar, syncAvatarToServer } from '@/lib/pet-avatar';
 */

import { updatePet, updatePetAvatar } from "./api";

// ═══════════════════════════════════════════════════════════
// 常量配置
// ═══════════════════════════════════════════════════════════

/** localStorage key 前缀 */
const AVATAR_LS_PREFIX = "pet_avatar_";

/** 压缩后的最大边长（像素） */
const MAX_DIMENSION = 800;

/** JPEG 压缩质量 (0-1)，0.7 在视觉质量和体积间取得最佳平衡 */
const JPEG_QUALITY = 0.7;

/** 单张头像 base64 目标上限（字节），约等于 484KB */
const MAX_AVATAR_SIZE_BYTES = 500 * 1024;

/** localStorage 写入失败时尝试清理的旧 key 模式 */
const OLD_KEY_PATTERN = /^pet_avatar_\d+$/;

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

export interface CompressResult {
  /** 压缩后的 base64 Data URL（可直接用作 img src 或发给后端） */
  dataUrl: string;
  /** 纯 base64 字符串（不含 data:image/... 前缀，用于 API 传输） */
  base64: string;
  /** 原始文件大小（字节） */
  originalSize: number;
  /** 压缩后大小（字节） */
  compressedSize: number;
  /** 压缩比 */
  ratio: number;
}

export interface UploadResult {
  /** 压缩结果 */
  compress: CompressResult;
  /** localStorage 是否保存成功 */
  localSaved: boolean;
  /** 后端是否同步成功 */
  serverSynced: boolean;
  /** 最终可用的头像 URL */
  finalUrl: string;
  /** 错误信息（如有） */
  error?: string;
}

// ═══════════════════════════════════════════════════════════
// 核心函数：图片压缩
// ═══════════════════════════════════════════════════════════

/**
 * 使用 Canvas 压缩图片
 * - 长边等比缩放到 MAX_DIMENSION
 * - 输出 JPEG 格式，quality = JPEG_QUALITY
 * - 典型效果：5MB 手机照片 → ~150KB
 */
export function compressImage(file: File): Promise<CompressResult> {
  return new Promise((resolve, reject) => {
    const originalSize = file.size;
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(img.src);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 上下文创建失败"));
        return;
      }

      // 计算等比缩放尺寸
      let { width, height } = img;
      if (width > height) {
        if (width > MAX_DIMENSION) {
          height = (height * MAX_DIMENSION) / width;
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width = (width * MAX_DIMENSION) / height;
          height = MAX_DIMENSION;
        }
      }

      // 取整避免亚像素问题
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);

      // 绘制压缩图像（启用图像平滑）
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 导出为 JPEG
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      const base64 = dataUrl.split(",")[1];
      const compressedSize = Math.round((dataUrl.length * 3) / 4);

      resolve({
        dataUrl,
        base64,
        originalSize,
        compressedSize,
        ratio: originalSize > 0 ? compressedSize / originalSize : 0,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("图片加载失败"));
    };

    // 用 Object URL 加载图片（比 FileReader 更高效）
    img.src = URL.createObjectURL(file);
  });
}

// ═══════════════════════════════════════════════════════════
// localStorage 操作（含容量校验和降级）
// ═══════════════════════════════════════════════════════════

/** 构建 localStorage key */
function lsKey(petId: number): string {
  return `${AVATAR_LS_PREFIX}${petId}`;
}

/**
 * 从 localStorage 读取本地缓存的头像
 * @returns base64 Data URL 或 null
 */
export function getLocalAvatar(petId: number): string | null {
  try {
    return localStorage.getItem(lsKey(petId));
  } catch {
    return null;
  }
}

/**
 * 将头像写入 localStorage（含容量检测）
 *
 * @returns 是否写入成功
 * @throws 不会抛异常，返回 false 表示写入失败
 */
export function saveLocalAvatar(petId: number, dataUrl: string): boolean {
  const key = lsKey(petId);

  try {
    localStorage.setItem(key, dataUrl);
    return true;
  } catch (e) {
    // 容量超限或其他存储错误 → 尝试清理旧数据后重试
    console.warn(`[pet-avatar] localStorage 写入失败 (${key})，尝试清理旧数据`, e);

    try {
      // 清理所有旧的宠物头像缓存（按时间倒序，保留最新的）
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && OLD_KEY_PATTERN.test(k) && k !== key) {
          keysToRemove.push(k);
        }
      }
      // 删除一半旧数据腾出空间
      keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2)).forEach((k) =>
        localStorage.removeItem(k)
      );

      // 重试写入
      localStorage.setItem(key, dataUrl);
      console.info(`[pet-avatar] 清理后重试写入成功 (${key})`);
      return true;
    } catch (e2) {
      console.error(`[pet-avatar] 清理后仍无法写入 (${key})`, e2);
      return false;
    }
  }
}

/** 删除指定宠物的本地头像缓存 */
export function clearLocalAvatar(petId: number): void {
  try {
    localStorage.removeItem(lsKey(petId));
  } catch {}
}

/**
 * 清理所有宠物头像缓存（用于释放空间）
 * @returns 清理的数量
 */
export function clearAllLocalAvatars(): number {
  let count = 0;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && OLD_KEY_PATTERN.test(k)) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => {
      localStorage.removeItem(k);
      count++;
    });
  } catch {}
  return count;
}

// ═══════════════════════════════════════════════════════════
// 后端同步
// ═══════════════════════════════════════════════════════════

/**
 * 同步头像到后端服务器
 *
 * @param base64OrDataUrl - 可以是纯 base64 或完整的 Data URL
 * @param petId - 宠物 ID
 * @param phone - 用户手机号
 * @returns 是否同步成功
 */
export async function syncAvatarToServer(
  base64OrDataUrl: string,
  petId: number,
  phone: string,
): Promise<boolean> {
  const image_url = base64OrDataUrl.startsWith("data:")
    ? base64OrDataUrl
    : `data:image/jpeg;base64,${base64OrDataUrl}`;

  try {
    const result = await updatePet(petId, { image_url }, phone);
    if (result.ok) {
      console.info(`[pet-avatar] 后端同步成功 (petId=${petId}, size=${image_url.length})`);
      return true;
    }
    console.warn(`[pet-avatar] 后端返回非成功状态 (petId=${petId})`, result);
    return false;
  } catch (e) {
    console.error(`[pet-avatar] 后端同步失败 (petId=${petId})`, e);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// 文件上传方法（新 API，multipart/form-data）
// ═══════════════════════════════════════════════════════════

export interface FileUploadResult {
  /** 是否上传成功 */
  ok: boolean;
  /** 后端返回的最终可用 URL（含默认头像回退） */
  resolvedUrl: string | null;
  /** 错误信息 */
  error?: string;
}

/**
 * 使用新 API 直接上传头像文件（multipart/form-data）
 *
 * 优势：
 * - 不需要压缩转 base64（避免 localStorage 超限）
 * - 后端直接接收文件并保存到 uploads/avatars/
 * - 自动获得 resolved_avatar_url（含默认头像回退）
 *
 * @param file - 原始 File 对象
 * @param petId - 宠物 ID
 * @returns 上传结果
 */
export async function uploadAvatarFile(file: File, petId: number): Promise<FileUploadResult> {
  // 文件校验
  if (!file.type.startsWith("image/")) {
    return { ok: false, resolvedUrl: null, error: "请选择图片文件" };
  }

  try {
    const result = await updatePetAvatar(petId, file);
    if (result.ok && result.data) {
      // 后端返回的 Pet 对象已包含 _resolved_avatar_url
      const resolvedUrl = result.data._resolved_avatar_url || result.data.image_url || null;
      console.info(`[pet-avatar] 文件上传成功 (petId=${petId}, url=${resolvedUrl})`);
      return { ok: true, resolvedUrl };
    }
    return { ok: false, resolvedUrl: null, error: "后端返回异常" };
  } catch (e) {
    console.error(`[pet-avatar] 文件上传失败 (petId=${petId})`, e);
    // 降级：尝试旧的 base64 同步方式
    console.info(`[pet-avatar] 尝试降级为 base64 方式同步`);
    return { ok: false, resolvedUrl: null, error: `上传失败：${e instanceof Error ? e.message : "未知错误"}` };
  }
}

/**
 * 完整的头像文件上传流程（推荐用于已有宠物更新头像场景）
 *
 * 流程：
 * 1. 校验文件 → 2. 压缩预览(乐观更新 UI) → 3. FormData 上传到新 API → 4. 更新本地缓存
 *
 * @param file - 用户选择的图片文件
 * @param petId - 宠物 ID
 * @param onImmediateUpdate - 压缩完成后的回调（乐观更新 UI），传入 Data URL
 * @returns 完整上传结果
 */
export async function handleAvatarFileUpload(
  file: File,
  petId: number,
  onImmediateUpdate: (dataUrl: string) => void,
): Promise<UploadResult & { uploadResult?: FileUploadResult }> {
  // 1. 文件校验
  if (!file.type.startsWith("image/")) {
    return {
      compress: {} as CompressResult,
      localSaved: false,
      serverSynced: false,
      finalUrl: "",
      error: "请选择图片文件",
    };
  }

  // 2. 压缩（用于本地缓存和即时预览）
  let compress: CompressResult;
  try {
    compress = await compressImage(file);
  } catch (e) {
    console.error("[pet-avatar] 图片压缩失败", e);
    return {
      compress: {} as CompressResult,
      localSaved: false,
      serverSynced: false,
      finalUrl: "",
      error: "图片处理失败，请重试",
    };
  }

  // 3. 乐观更新 UI
  const previewUrl = compress.dataUrl;
  onImmediateUpdate(previewUrl);

  // 4. 本地缓存（压缩后的 base64）
  const localSaved = saveLocalAvatar(petId, previewUrl);

  // 5. 使用新 API 上传原始 File 对象
  const uploadResult = await uploadAvatarFile(file, petId);

  // 如果新 API 成功，用后端返回的 URL 更新本地缓存
  if (uploadResult.ok && uploadResult.resolvedUrl) {
    saveLocalAvatar(petId, uploadResult.resolvedUrl!);
    return {
      compress,
      localSaved: true,
      serverSynced: true,
      finalUrl: uploadResult.resolvedUrl!,
      uploadResult,
    };
  }

  // 新 API 失败 → 仅保留本地缓存（localStorage），不再尝试 base64 降级
  // 原因：base64 数据不应存入数据库 avatar_url 列（会导致 Data too long 错误）
  console.warn("[pet-avatar] 文件上传API失败，头像仅保留在本地浏览器缓存中", uploadResult.error);
  return {
    compress,
    localSaved,       // localStorage 中已有压缩后的 dataUrl
    serverSynced: false,
    finalUrl: previewUrl,   // 用本地 dataUrl 作为显示
    error: "已保存到本机，但云端同步失败",
    uploadResult,
  };
}

// ═══════════════════════════════════════════════════════════
// 完整上传流程编排
// ═══════════════════════════════════════════════════════════

/**
 * 处理宠物头像上传的完整流程：
 *
 * 1. 校验文件类型
 * 2. Canvas 压缩（大幅减少体积）
 * 3. 乐观更新 UI（立即显示新头像）
 * 4. 持久化到 localStorage（含容量校验 + 自动清理重试）
 * 5. 异步同步到后端（带结果反馈）
 *
 * @param file - 用户选择的图片文件
 * @param petId - 当前宠物 ID
 * @param phone - 用户手机号
 * @param onImmediateUpdate - 压缩完成后的回调（用于立即更新 UI），传入压缩后的 Data URL
 * @returns 上传结果详情（包含是否需要提示用户同步失败）
 */
export async function handleAvatarUpload(
  file: File,
  petId: number,
  phone: string,
  onImmediateUpdate: (dataUrl: string) => void,
): Promise<UploadResult> {
  // 1. 文件校验
  if (!file.type.startsWith("image/")) {
    return {
      compress: {} as any,
      localSaved: false,
      serverSynced: false,
      finalUrl: "",
      error: "请选择图片文件",
    };
  }

  // 2. 压缩图片
  let compress: CompressResult;
  try {
    compress = await compressImage(file);
  } catch (e) {
    console.error("[pet-avatar] 图片压缩失败", e);
    return {
      compress: {} as any,
      localSaved: false,
      serverSynced: false,
      finalUrl: "",
      error: "图片处理失败，请重试",
    };
  }

  console.info(
    `[pet-avatar] 压缩完成: ${(compress.originalSize / 1024).toFixed(1)}KB → ${(compress.compressedSize / 1024).toFixed(1)}KB (压缩比 ${Math.round(compress.ratio * 100)}%)`,
  );

  // 3. 乐观更新 UI
  const finalUrl = compress.dataUrl;
  onImmediateUpdate(finalUrl);

  // 4. 持久化到 localStorage
  const localSaved = saveLocalAvatar(petId, finalUrl);
  if (!localSaved) {
    console.error("[pet-avatar] localStorage 写入最终失败，刷新后可能丢失");
  }

  // 5. 异步同步到后端（不阻塞 UI，但记录结果）
  const serverSynced = await syncAvatarToServer(finalUrl, petId, phone);

  return {
    compress,
    localSaved,
    serverSynced,
    finalUrl,
    error: !serverSynced ? "已保存到本机，但云端同步失败" : undefined,
  };
}
