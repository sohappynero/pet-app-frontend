/**
 * 宠物 3D 卡通头像生成服务
 * 通过后端代理调用 AI 图像生成 API
 */

import { getSessionToken } from "./session";

export interface Generate3DAvatarOptions {
  petName?: string;
  species?: "dog" | "cat" | "other";
  background?: "simple" | "gradient" | "solid";
}

export interface Generate3DAvatarResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

/**
 * 构建 3D 卡通风格的提示词
 */
function buildPrompt(options: Generate3DAvatarOptions): string {
  const { petName = "pet", species = "dog", background = "simple" } = options;

  // 基础物种描述
  const speciesDesc = {
    dog: "cute fluffy dog",
    cat: "adorable fluffy cat", 
    other: "cute small pet animal"
  }[species];

  // 背景描述
  const bgDesc = {
    simple: "simple soft pastel background",
    gradient: "beautiful gradient background with soft colors",
    solid: "clean solid colored background"
  }[background];

  // 构建完整的提示词
  const prompt = [
    `${speciesDesc}`,
    `in Pixar 3D cartoon style`,
    `highly detailed 3D render`,
    `big expressive eyes`,
    `soft fluffy fur texture`,
    `cute and adorable expression`,
    `vibrant colors`,
    `smooth render quality`,
    `professional studio lighting`,
    `${bgDesc}`,
    `centered composition`,
    `high resolution`,
    `no text or watermark`
  ].join(", ");

  return prompt;
}

/**
 * 将图片文件转换为 base64 格式
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // 移除 data:image/...;base64, 前缀
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 将 base64 图片数据URL转换为可用于显示的 URL
 */
function base64ToDataUrl(base64: string, mimeType = "image/png"): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * 通过后端代理调用 AI 图像生成
 */
async function callImageGenAPI(
  imageBase64: string,
  prompt: string,
  onProgress?: (status: string) => void
): Promise<string> {
  onProgress?.("正在调用 AI 服务...");

  const token = getSessionToken();
  const response = await fetch("/api/v1/ai/generate-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ image: imageBase64, prompt }),
  });

  if (!response.ok) {
    if (import.meta.env.DEV) {
      return await mockGenerate3DAvatar(imageBase64, prompt, onProgress);
    }
    throw new Error(`AI 服务调用失败: ${response.status}`);
  }

  onProgress?.("正在生成 3D 卡通头像...");
  const data = await response.json();

  if (!data.success || !data.url) {
    if (import.meta.env.DEV) {
      return await mockGenerate3DAvatar(imageBase64, prompt, onProgress);
    }
    throw new Error(data.error || "生成失败，未获取到图片");
  }

  return data.url;
}

/**
 * 模拟生成（用于开发/测试环境）
 */
async function mockGenerate3DAvatar(
  imageBase64: string,
  _prompt: string,
  onProgress?: (status: string) => void
): Promise<string> {
  onProgress?.("正在分析宠物特征...");
  await delay(800);

  onProgress?.("正在生成 3D 卡通风格...");
  await delay(1000);

  onProgress?.("正在优化细节...");
  await delay(600);

  // 由于是模拟，直接返回处理后的图片
  // 实际应用中，这里会返回 AI 生成的图片 URL
  return base64ToDataUrl(imageBase64);
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 主函数：生成 3D 卡通风格宠物头像
 * 
 * @param imageFile - 用户上传的宠物照片文件
 * @param options - 生成选项
 * @param onProgress - 进度回调
 * @returns 生成结果
 */
export async function generate3DAvatar(
  imageFile: File,
  options: Generate3DAvatarOptions = {},
  onProgress?: (status: string) => void
): Promise<Generate3DAvatarResult> {
  try {
    // 1. 验证文件
    onProgress?.("正在验证图片...");
    
    if (!imageFile.type.startsWith("image/")) {
      return { success: false, error: "请选择图片文件" };
    }

    // 限制文件大小（10MB）
    if (imageFile.size > 10 * 1024 * 1024) {
      return { success: false, error: "图片大小不能超过 10MB" };
    }

    // 2. 转换为 base64
    onProgress?.("正在读取图片...");
    const imageBase64 = await fileToBase64(imageFile);

    // 3. 构建提示词
    const prompt = buildPrompt(options);

    // 4. 调用 AI API 生成
    const imageUrl = await callImageGenAPI(imageBase64, prompt, onProgress);

    onProgress?.("生成完成！");

    return { success: true, imageUrl };

  } catch (error) {
    console.error("生成 3D 头像失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成失败，请重试"
    };
  }
}

/**
 * 将生成的图片保存到本地存储
 */
export function saveGeneratedAvatar(petId: number, imageUrl: string): void {
  try {
    localStorage.setItem(`pet_3d_avatar_${petId}`, imageUrl);
  } catch (e) {
    console.error("保存头像失败:", e);
  }
}

/**
 * 获取本地保存的 3D 头像
 */
export function getLocal3DAvatar(petId: number): string | null {
  try {
    return localStorage.getItem(`pet_3d_avatar_${petId}`);
  } catch {
    return null;
  }
}

/**
 * 清除本地保存的 3D 头像
 */
export function clearLocal3DAvatar(petId: number): void {
  try {
    localStorage.removeItem(`pet_3d_avatar_${petId}`);
  } catch {}
}
