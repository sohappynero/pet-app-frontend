/**
 * 统一图片选择工具
 *
 * Capacitor 原生 App 环境走 Camera 插件（原生 <input type=file> 在 WebView 里调不起相册/相机）；
 * Web 浏览器环境动态创建 <input type=file> 兜底。
 * 统一返回 File，用户取消返回 null，与原有 File 处理链路完全兼容。
 */
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

/** 将 dataURL 转成 File，复用现有 base64/File 处理链路 */
function dataUrlToFile(dataUrl: string, filename: string): File {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] || "image/jpeg";
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

/**
 * 统一取图。
 * @param source "camera" 拍照 / "photos" 从相册选择
 * @returns File；用户取消返回 null
 */
export async function pickImage(source: "camera" | "photos"): Promise<File | null> {
  // 原生 App(Capacitor)：用 Camera 插件
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
        quality: 85,
        allowEditing: false,
      });
      if (!photo.dataUrl) return null;
      return dataUrlToFile(photo.dataUrl, `pet_${Date.now()}.jpg`);
    } catch (e: any) {
      // 用户取消不算错误
      const msg = String(e?.message || e).toLowerCase();
      if (msg.includes("cancel") || msg.includes("denied")) return null;
      throw e;
    }
  }

  // Web 浏览器：动态创建 input
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (source === "camera") input.setAttribute("capture", "environment");
    input.onchange = () => resolve(input.files?.[0] || null);
    input.click();
  });
}

/**
 * 从相册多选图片。
 * Capacitor 原生走 Camera.pickImages，Web 走 <input type=file multiple>。
 * @returns File 数组；用户取消返回空数组
 */
export async function pickImages(): Promise<File[]> {
  // 原生 App(Capacitor)：用 pickImages 多选
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await Camera.pickImages({ quality: 85 });
      const files: File[] = [];
      for (let i = 0; i < result.photos.length; i++) {
        const photo = result.photos[i];
        // pickImages 返回 webPath/path，需 fetch 成 blob 再转 File
        const resp = await fetch(photo.webPath);
        const blob = await resp.blob();
        const ext = (photo.format || "jpg").replace("jpeg", "jpg");
        files.push(new File([blob], `pet_${Date.now()}_${i}.${ext}`, { type: blob.type || "image/jpeg" }));
      }
      return files;
    } catch (e: any) {
      const msg = String(e?.message || e).toLowerCase();
      if (msg.includes("cancel") || msg.includes("denied")) return [];
      throw e;
    }
  }

  // Web 浏览器：动态创建 multiple input
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = () => resolve(input.files ? Array.from(input.files) : []);
    input.click();
  });
}
