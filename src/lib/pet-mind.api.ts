/**
 * AI 宠物心声 API 服务层
 * 提供宠物聊天、照片心声、声音翻译、人话转宠物语的 AI 服务调用
 * 统一走后端 API (/api/v1/ai/*)，不再支持 Mock 模式
 */

import type {
  Pet,
  PetEmotion,
  PhotoMindResult,
  VoiceTranslateResult,
  HumanToPetResult,
  PetPersonality
} from "../types";
import { getSessionToken } from "./session";
import { fetchWithAITimeout } from "./api";

// 后端 API 基础地址（与 api.ts 保持一致）
const envBaseUrl = (import.meta as any)?.env?.VITE_API_BASE_URL || "";
const BACKEND_API_URL = String(envBaseUrl).replace(/\/$/, "");
import { inferPersonality } from "./pet-prompt";
import {
  analyzeEmotion,
  generateFeaturesForEmotion,
  analyzeAudioBlob,
  type EmotionAnalysisResult
} from "./pet-sound-engine";

// ============================================================
// 后端 AI 聊天接口调用
// ============================================================

interface BackendChatResponse {
  success: boolean;
  reply: string;
  emoji: string;
  emotion: string;
  error?: string;
}

/**
 * 与宠物聊天（调用后端 POST /api/v1/ai/chat）
 * 这是前端聊天功能的主要接口，走后端 AI 服务
 */
export async function chatWithPet(
  petId: number, 
  message: string, 
  history?: Array<{ role: string; content: string }>
): Promise<{
  success: boolean;
  reply?: string;
  emoji?: string;
  emotion?: string;
  error?: string;
}> {
  try {
    const token = getSessionToken();
    const url = `${BACKEND_API_URL}/api/v1/ai/chat`;
    
    const response = await fetchWithAITimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        pet_id: petId,
        message,
        history: history || undefined,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[Backend Chat] API 错误 ${response.status}:`, errText);
      return { success: false, error: `聊天请求失败（HTTP ${response.status}）` };
    }

    const data: BackendChatResponse = await response.json();

    if (data.success && data.reply) {
      return { success: true, reply: data.reply, emoji: data.emoji || "🐾", emotion: data.emotion || "happy" };
    }
    return { success: false, error: data.error || "返回数据异常" };

  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("[Backend Chat] 请求超时被中断");
      return { success: false, error: "请求超时，请重试" };
    }
    console.error("[Backend Chat] 请求异常:", error);
    return { success: false, error: error instanceof Error ? error.message : "网络请求失败" };
  }
}


/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 将文件转换为 base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 将 base64 转换为数据 URL
 */
function base64ToDataUrl(base64: string, mimeType = "image/jpeg"): string {
  return `data:${mimeType};base64,${base64}`;
}

// ============================================================
// 照片心声 API
// ============================================================

export interface PhotoMindRequest {
  pet: Pet;
  imageFile: File;
  personality?: PetPersonality;
  onProgress?: (status: string) => void;
}

/**
 * 上传宠物照片，获取心声解读（POST /api/v1/ai/photo-mind）
 */
export async function fetchPhotoMind(request: PhotoMindRequest): Promise<{
  success: boolean;
  result?: PhotoMindResult;
  photoUrl?: string;
  error?: string;
}> {
  const { pet, imageFile, personality: customPersonality, onProgress } = request;

  try {
    onProgress?.("正在上传照片...");

    // 1. 转换图片为 base64
    const imageBase64 = await fileToBase64(imageFile);
    const photoUrl = base64ToDataUrl(imageBase64);

    // 2. 获取宠物性格
    const personality = customPersonality || inferPersonality(pet.species, pet.breed);

    onProgress?.("正在分析照片...");

    // 3. 调用后端 AI 接口
    const token = getSessionToken();
    const response = await fetchWithAITimeout(`${BACKEND_API_URL}/api/v1/ai/photo-mind`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        pet_id: pet.id,
        image_base64: imageBase64,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[PhotoMind] 后端 API 错误 ${response.status}:`, errText);
      return { success: false, error: `照片分析失败（HTTP ${response.status}）` };
    }

    const data = await response.json();

    if (!data.success) {
      return { success: false, error: data.error || "后端返回异常" };
    }

    // 4. 解析后端返回的数据为标准格式
    const result: PhotoMindResult = {
      expression: data.expression || "眯眼微笑",
      posture: data.posture || "趴着",
      mood: (data.mood || "happy") as PetEmotion,
      moodScore: data.mood_score || 0.8,
      mindOs: data.mind_os || data.internal_thoughts || "主人拍我的时候，我正在想...",
      humorLevel: data.humor_level || "medium",
    };

    onProgress?.("解读完成！");

    return {
      success: true,
      result,
      photoUrl
    };

  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("[PhotoMind] 请求超时被中断");
      return { success: false, error: "请求超时，请重试" };
    }
    console.error("照片心声生成失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成失败，请重试"
    };
  }
}

// ============================================================
// 声音翻译 API
// ============================================================

export interface VoiceTranslateRequest {
  pet: Pet;
  audioFile: File;
  personality?: PetPersonality;
  onProgress?: (status: string) => void;
}

/**
 * 上传宠物声音，获取翻译结果（POST /api/v1/ai/voice-translate）
 */
export async function fetchVoiceTranslate(request: VoiceTranslateRequest): Promise<{
  success: boolean;
  result?: VoiceTranslateResult;
  audioUrl?: string;
  error?: string;
}> {
  const { pet, audioFile, personality: customPersonality, onProgress } = request;

  try {
    onProgress?.("正在上传音频...");

    // 1. 验证音频文件
    const validTypes = ["audio/mpeg", "audio/wav", "audio/mp3", "audio/m4a", "audio/x-m4a", "audio/ogg"];
    if (!validTypes.some(t => audioFile.type.includes(t.split("/")[1]))) {
      return { success: false, error: "不支持的音频格式，请上传 mp3、wav 或 m4a 文件" };
    }

    if (audioFile.size > 10 * 1024 * 1024) {
      return { success: false, error: "音频文件不能超过 10MB" };
    }

    // 2. 创建音频 URL 用于播放
    const audioUrl = URL.createObjectURL(audioFile);

    onProgress?.("正在分析音频...");

    // 3. 使用前端情绪引擎分析音频（保留客户端分析能力）
    let emotion: PetEmotion = "neutral";
    let emotionScore: number = 0.5;

    try {
      const audioFeatures = await analyzeAudioBlob(audioFile);
      const personality = customPersonality || inferPersonality(pet.species, pet.breed);
      const emotionAnalysis = analyzeEmotion(audioFeatures, personality);
      emotion = emotionAnalysis.primaryEmotion;
      emotionScore = emotionAnalysis.confidence;
      console.log("[SoundEngine] 音频特征:", audioFeatures);
      console.log("[SoundEngine] 情绪分析:", {
        primary: emotion,
        confidence: Math.round(emotionScore * 100) + "%",
        rules: emotionAnalysis.matchedRules
      });
    } catch (error) {
      console.warn("[SoundEngine] 音频分析失败，使用默认值:", error);
      const features = generateFeaturesForEmotion("neutral");
      const personality = customPersonality || inferPersonality(pet.species, pet.breed);
      const emotionAnalysis = analyzeEmotion(features, personality);
      emotion = emotionAnalysis.primaryEmotion;
      emotionScore = emotionAnalysis.confidence;
    }

    onProgress?.("正在生成翻译...");

    // 4. 调用后端 AI 接口进行翻译
    const token = getSessionToken();
    const response = await fetchWithAITimeout(`${BACKEND_API_URL}/api/v1/ai/voice-translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        pet_id: pet.id,
        emotion,
        emotion_score: emotionScore,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error(`[VoiceTranslate] 后端 API 错误 ${response.status}:`, errText);
      return { success: false, error: `声音翻译失败（HTTP ${response.status}）` };
    }

    const data = await response.json();

    // 详细日志：打印完整后端响应用于排查
    console.log("[VoiceTranslate] 后端完整响应:", JSON.stringify(data, null, 2));

    if (!data.success) {
      return { success: false, error: data.error || "后端返回异常" };
    }

    // 5. 解析后端返回的数据
    // 动态 fallback：根据情绪 + 品种生成不同默认文案（兼容多种写法）
    const speciesLower = (pet.species || "").toLowerCase();
    const isCat = ["cat", "猫", "猫咪", "feline"].some(s => speciesLower.includes(s));

    const emotionFallbacks: Record<string, { cat: string; dog: string }> = {
      excited: {
        cat: "喵喵！！（尾巴竖成天线，瞳孔放大）快看我快看我！我要玩！",
        dog: "汪汪汪！！（疯狂摇屁股扭屁股）出去玩！球球！现在！",
      },
      happy: {
        cat: "呼噜噜噜~（眯眼蹭你手心）嗯...这里好暖和...再挠挠下巴...",
        dog: "汪汪~摇得屁股都在晃！（扑上来舔脸）你回来了！最好的！",
      },
      hungry: {
        cat: "喵...（蹭腿，尾巴缠住脚踝）肚子空空的...那个罐罐的味道...",
        dog: "汪...汪...（盯着食盆流口水）肉肉...闻到了...好香...",
      },
      lonely: {
        cat: "...喵？（轻轻叫一声，耳朵转来转去）好安静啊...没人陪我踩奶...",
        dog: "...汪（趴在门口鼻子贴门缝）主人...什么时候回来...我想出门...",
      },
      anxious: {
        cat: "嘶——！（炸毛后退两步）刚才那个声音是什么？！",
        dog: "汪！汪！（竖起耳朵来回踱步）有情况！不对劲！需要确认一下！",
      },
      angry: {
        cat: "哈！！（飞机耳龇牙）够了！再过来我挠你了！",
        dog: "嗷呜——！（低吼露牙）这太过分了！我不高兴了！走开！",
      },
      sleepy: {
        cat: "呵...zzZ（身子一软瘫下来，眼皮粘在一起）这个阳光...正好睡觉...",
        dog: "呵......（打个大哈欠腿一伸趴下）困了...就在这儿眯一会儿...",
      },
      playful: {
        cat: "喵!!（突然从角落扑出来咬住脚踝）抓到啦！是我的了！",
        dog: "汪!!（原地蹦三圈高叼着球跑过来）来追我！快！我准备好了！",
      },
      neutral: {
        cat: "喵？（歪头，耳朵一抖一抖）嗯？叫我吗？",
        dog: "汪？（歪头看着，尾巴慢慢摇起来）嗯？有什么好事？",
      },
    };

    const resolvedEmotion = data.emotion || emotion;
    const fallbackSet = emotionFallbacks[resolvedEmotion] || emotionFallbacks["neutral"];
    const aiLanguage = data.ai_language?.trim()
      || data.suggestions?.[0]?.text
      || (isCat ? fallbackSet.cat : fallbackSet.dog);

    // 如果使用了 fallback，打印警告
    if (!data.ai_language?.trim()) {
      console.warn(`[VoiceTranslate] 后端 ai_language 为空，使用 ${resolvedEmotion} 情绪 fallback:`, aiLanguage);
    }

    const result: VoiceTranslateResult = {
      emotion: resolvedEmotion,
      emotionScore: data.emotion_score || emotionScore,
      aiLanguage: aiLanguage,
      suggestions: data.suggestions || [],
    };

    onProgress?.("翻译完成！");

    return { success: true, result, audioUrl };

  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("[VoiceTranslate] 请求超时被中断");
      return { success: false, error: "请求超时，请重试" };
    }
    console.error("声音翻译失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "翻译失败，请重试"
    };
  }
}

/**
 * 分析音频特征，返回情绪和置信度
 * 使用情绪规则引擎进行专业分析
 */
function analyzeAudioEmotion(audioBlob?: Blob, personality?: PetPersonality): { emotion: PetEmotion; score: number } {
  if (audioBlob) {
    // 使用真实音频分析（异步）
    // 这里返回一个基于分析的初始结果
    // 实际分析在 fetchVoiceTranslate 中异步执行
    return { emotion: "neutral", score: 0.5 };
  }
  
  // 无真实数据时使用模拟
  const features = generateFeaturesForEmotion("neutral");
  const analysis = analyzeEmotion(features, personality);
  return { emotion: analysis.primaryEmotion, score: analysis.confidence };
}


// ============================================================
// 人话转宠物语 API
// ============================================================

export interface HumanToPetRequest {
  pet: Pet;
  text: string;
  emotionHint?: string;
  onProgress?: (status: string) => void;
}

/** 人话转宠物语结果 */
export interface HumanToPetResult {
  petLanguage: string;    // 翻译后的宠物语言
  emoji: string;          // 表情符号
  emotion: PetEmotion;    // 情绪类型
  originalText: string;   // 原始文本（回显）
}

/**
 * 人话转宠物语（POST /api/v1/ai/human-to-pet）
 * 将主人的话翻译成宠物能理解的语言
 */
export async function translateHumanToPet(request: HumanToPetRequest): Promise<{
  success: boolean;
  result?: HumanToPetResult;
  error?: string;
}> {
  const { pet, text, emotionHint, onProgress } = request;

  try {
    onProgress?.("正在翻译成宠物语言...");

    // 优先调用后端接口
    const token = getSessionToken();
    const url = `${BACKEND_API_URL}/api/v1/ai/human-to-pet`;

    const response = await fetchWithAITimeout(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        pet_id: pet.id,
        text,
        emotion_hint: emotionHint || undefined,
      }),
    });

    if (response.ok) {
      const data = await response.json();

      if (data.success && data.pet_language) {
        // 校验：如果后端返回的内容看起来像规则/说明文字而非翻译，走降级
        const badPatterns = ["规则", "根据规则", "翻译成", "能理解", "拟声词", "动作描述", "保持", "直接输出", "控制"];
        const rawLang = data.pet_language.trim();
        if (badPatterns.some(p => rawLang.includes(p)) || rawLang.length > 50) {
          console.warn("[HumanToPet] 后端返回疑似规则文字，使用客户端降级");
          return fallbackHumanToPet(pet, text, onProgress);
        }

        onProgress?.("翻译完成！");
        return {
          success: true,
          result: {
            petLanguage: data.pet_language,
            emoji: data.emoji || "🐾",
            emotion: data.emotion || "neutral",
            originalText: data.original_text || text,
          },
        };
      }
    }

    // 后端失败或无响应，降级到客户端规则匹配
    console.warn("[HumanToPet] 后端返回失败，使用客户端降级:", !response.ok ? `HTTP ${response.status}` : "数据异常");
    return fallbackHumanToPet(pet, text, onProgress);

  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("[HumanToPet] 请求超时被中断，使用降级");
      return fallbackHumanToPet(pet, text, onProgress);
    }
    console.error("[HumanToPet] 请求异常:", error);
    // 网络错误时也使用降级策略
    return fallbackHumanToPet(pet, text, onProgress);
  }
}

/**
 * 客户端降级：基于关键词的人话转宠物语
 */
function fallbackHumanToPet(
  pet: Pet,
  text: string,
  onProgress?: (status: string) => void
): { success: true; result: HumanToPetResult } {
  onProgress?.("使用本地翻译规则...");

  // 兼容中英文品种标识（统一判断）
  const speciesLower = (pet.species || "").toLowerCase();
  const isCat = ["cat", "猫", "猫咪", "feline"].some(s => speciesLower.includes(s));
  const call = isCat ? "喵" : "汪";
  const lowerText = text.toLowerCase();

  let petLanguage = "";
  let emotion: PetEmotion = "neutral";
  let emoji = "🐾";

  // 关键词匹配翻译规则
  if (anyInclude(lowerText, ["吃", "饿", "饭", "罐头", "好吃", "美食"])) {
    petLanguage = isCat
      ? "喵呜~喵呜~（盯着一脸渴望，尾巴竖起）"
      : `${call}${call}！！（疯狂摇尾巴流口水，眼睛放光）`;
    emotion = "excited";
    emoji = "😋";
  } else if (anyInclude(lowerText, ["爱", "喜欢", "乖", "宝贝", "爱你", "亲亲"])) {
    petLanguage = isCat
      ? "呼噜呼噜~（蹭蹭主人手心，眯起眼睛）"
      : `摇尾巴！舔舔！（扑到主人身上，疯狂蹭）`;
    emotion = "happy";
    emoji = "💕";
  } else if (anyInclude(lowerText, ["玩", "出去", "散步", "公园", "球", "跑"])) {
    petLanguage = isCat
      ? "喵~（竖起尾巴抖动，瞳孔放大）"
      : `${call}${call}！${call}！（原地蹦跳转圈圈）`;
    emotion = "playful";
    emoji = "🎉";
  } else if (anyInclude(lowerText, ["睡", "困", "晚安", "休息"])) {
    petLanguage = isCat
      ? "嗯~zzZ（找个暖和的地方蜷缩起来）"
      : `呵...${call}...（打哈欠，趴下闭眼）`;
    emotion = "sleepy";
    emoji = "😴";
  } else if (anyInclude(lowerText, ["生气", "不要", "不行", "讨厌", "走开"])) {
    petLanguage = isCat
      ? "嘶~！（炸毛，转身背对）"
      : `${call}！${call}呜！（低吼，耳朵贴后）`;
    emotion = "angry";
    emoji = "💢";
  } else if (anyInclude(lowerText, ["好", "棒", "厉害", "聪明", "真乖"])) {
    petLanguage = isCat
      ? "喵~（高傲地扬起下巴，但尾巴在摇）"
      : `${call}${call}！（骄傲地挺胸，尾巴翘到天上）`;
    emotion = "happy";
    emoji = "✨";
  } else {
    // 默认：根据文本长度生成随机叫声
    const wordCount = text.length;
    const barkCount = Math.min(Math.max(1, Math.ceil(wordCount / 4)), 5);

    const dogBarks = ["汪", "汪汪", "呜", "嗷呜"];
    const catMeows = ["喵", "喵呜", "喵~", "呼噜"];

    const barks = isCat ? catMeows : dogBarks;
    let result = "";
    for (let i = 0; i < barkCount; i++) {
      result += barks[Math.floor(Math.random() * barks.length)];
      if (i < barkCount - 1) result += i < 2 ? "，" : "";
    }
    petLanguage = result + (isCat ? "~（歪头看着）" : "!（歪头摇尾巴）");
    emotion = "neutral";
  }

  // 模拟延迟
  const mockDelay = 300 + Math.random() * 500;
  const startTime = Date.now();

  return new Promise((resolve) => {
    const checkDone = () => {
      if (Date.now() - startTime >= mockDelay) {
        onProgress?.("翻译完成！");
        resolve({
          success: true,
          result: { petLanguage, emoji, emotion, originalText: text },
        });
      } else {
        requestAnimationFrame(checkDone);
      }
    };
    checkDone();
  }) as any;
}

/** 简单的数组包含检查 */
function anyInclude(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw));
}


// ============================================================
// 音频录制 API（第三阶段）
// ============================================================

export interface AudioRecorderOptions {
  onDataAvailable?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export class PetAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private options?: AudioRecorderOptions;

  /**
   * 检查是否支持录音
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * 请求麦克风权限
   */
  async requestPermission(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 开始录音
   */
  async startRecording(options?: AudioRecorderOptions): Promise<boolean> {
    this.options = options;
    
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
        this.options?.onDataAvailable?.(audioBlob);
      };
      
      this.mediaRecorder.onerror = (event) => {
        this.options?.onError?.(new Error('录音出错'));
      };
      
      this.mediaRecorder.start(100); // 每 100ms 采集一次数据
      return true;
    } catch (error) {
      this.options?.onError?.(error instanceof Error ? error : new Error('无法访问麦克风'));
      return false;
    }
  }

  /**
   * 停止录音
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  /**
   * 暂停录音
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * 恢复录音
   */
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * 获取录音时长（秒）
   */
  getDuration(): number {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      return (Date.now() - (this.mediaRecorder as any).startTime) / 1000;
    }
    return 0;
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.stopRecording();
    this.mediaRecorder = null;
    this.stream = null;
    this.audioChunks = [];
  }
}

// ============================================================
// 导出类型
// ============================================================

export type { PetPersonality };
