/**
 * 平台判断工具
 *
 * 统一判断当前运行环境,供原生能力桥接（相机、存储）按平台分流。
 * - 鸿蒙 HAP 壳工程通过 ArkWeb 的 javaScriptProxy 向 window 注入 harmonyBridge 对象;
 *   存在该对象即判定为鸿蒙环境。
 * - 其余环境（Capacitor Android / Web 浏览器）沿用各自原有判断。
 */

/** 鸿蒙壳工程通过 javaScriptProxy 注入到 window 的原生桥接接口 */
export interface HarmonyBridge {
  /** 取图：source 为 "camera" 拍照 / "photos" 相册；返回 dataURL，取消返回空串 */
  pickImage(source: "camera" | "photos"): Promise<string>;
  /** 多选相册图片：返回 dataURL 数组的 JSON 字符串，取消返回 "[]" */
  pickImages(): Promise<string>;
  /** 持久化读取：无值返回 null */
  storageGet(key: string): Promise<string | null>;
  /** 持久化写入 */
  storageSet(key: string, value: string): Promise<void>;
  /** 持久化删除 */
  storageRemove(key: string): Promise<void>;
}

declare global {
  interface Window {
    harmonyBridge?: HarmonyBridge;
  }
}

/** 当前是否为鸿蒙环境（壳工程已注入 harmonyBridge） */
export function isHarmony(): boolean {
  return typeof window !== "undefined" && !!window.harmonyBridge;
}

/** 获取鸿蒙桥接对象；非鸿蒙环境返回 null */
export function getHarmonyBridge(): HarmonyBridge | null {
  return isHarmony() ? window.harmonyBridge! : null;
}
