/**
 * AI 宠物心声 API 服务层
 * 提供照片心声、AI吐槽、声音翻译的 AI 服务调用
 */

import type { 
  Pet, 
  PetEmotion, 
  PhotoMindResult, 
  RoastResult, 
  VoiceTranslateResult,
  PetPersonality 
} from "../types";
import { 
  buildPhotoMindPrompt, 
  buildRoastPrompt, 
  buildVoiceTranslatePrompt,
  inferPersonality,
  mockPhotoMindResult,
  mockRoastResult,
  mockVoiceTranslateResult,
  generateInteractionSuggestions,
  getStickersForPersonality
} from "./pet-prompt";
import {
  analyzeEmotion,
  generateFeaturesForEmotion,
  analyzeAudioBlob,
  type EmotionAnalysisResult
} from "./pet-sound-engine";

// API 配置
const AI_CHAT_API_URL = import.meta.env.VITE_AI_CHAT_API_URL || "";
const AI_CHAT_API_KEY = import.meta.env.VITE_AI_CHAT_API_KEY || "";

// 是否使用模拟数据（无 API 配置时）
const USE_MOCK = !AI_CHAT_API_URL || !AI_CHAT_API_KEY;

// ============================================================
// 通用 AI 调用
// ============================================================

interface AIChatRequest {
  model?: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

interface AIChatResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * 通用 AI 对话调用
 */
async function callAIChat(request: AIChatRequest): Promise<AIChatResponse> {
  if (USE_MOCK) {
    // 模拟模式，稍作延迟
    await delay(500 + Math.random() * 1000);
    return { success: true, content: "" };
  }

  try {
    const response = await fetch(`${AI_CHAT_API_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_CHAT_API_KEY}`,
      },
      body: JSON.stringify({
        model: request.model || "gpt-3.5-turbo",
        messages: request.messages,
        temperature: request.temperature ?? 0.8,
        max_tokens: request.max_tokens ?? 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 调用失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || "";
    
    return { success: true, content };
  } catch (error) {
    console.error("AI Chat API 调用失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI 服务暂时不可用"
    };
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
 * 上传宠物照片，获取心声解读
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
    
    // 1. 上传图片到服务器（如果有后端）
    let photoUrl = "";
    const imageBase64 = await fileToBase64(imageFile);
    photoUrl = base64ToDataUrl(imageBase64);
    
    // 如果有后端上传接口，可以使用以下代码
    // const uploadResp = await post<{ url: string }>("/api/upload", {
    //   file: imageBase64,
    //   pet_id: pet.id
    // });
    // photoUrl = uploadResp.data?.url || photoUrl;
    
    onProgress?.("正在分析照片...");
    await delay(500);
    
    // 2. 获取宠物性格
    const personality = customPersonality || inferPersonality(pet.species, pet.breed);
    
    onProgress?.("正在生成宠物心声...");
    
    // 3. 调用 AI 生成心声
    const prompt = buildPhotoMindPrompt(pet, personality);
    
    if (USE_MOCK) {
      // 模拟模式：使用预设模板
      await delay(800 + Math.random() * 1200);
      const mockResult = mockPhotoMindResult(pet, personality);
      return {
        success: true,
        result: mockResult,
        photoUrl
      };
    }
    
    const aiResponse = await callAIChat({
      messages: [
        { role: "system", content: "你是一个宠物心理分析师，擅长用宠物的视角解读照片。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.85,
      max_tokens: 150
    });
    
    if (!aiResponse.success || !aiResponse.content) {
      // 如果 AI 失败，使用模拟结果
      const mockResult = mockPhotoMindResult(pet, personality);
      return {
        success: true,
        result: mockResult,
        photoUrl
      };
    }
    
    // 4. 解析 AI 响应，生成完整结果
    const result = parsePhotoMindResponse(aiResponse.content, personality);
    
    onProgress?.("解读完成！");
    
    return {
      success: true,
      result,
      photoUrl
    };
    
  } catch (error) {
    console.error("照片心声生成失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成失败，请重试"
    };
  }
}

/**
 * 解析 AI 响应为标准格式
 */
function parsePhotoMindResponse(content: string, personality: PetPersonality): PhotoMindResult {
  const lines = content.split("\n").filter(l => l.trim());
  const osText = lines[0] || content.trim();
  
  // 随机生成表情和姿态
  const expressions = ["眯眼微笑", "呆萌眨眼", "歪头卖萌", "严肃脸", "惊讶表情", "犯困打哈欠"];
  const postures = ["趴着", "坐着", "站着", "侧躺", "四脚朝天", "蜷缩"];
  
  // 根据 OS 内容推断情绪
  let mood: PetEmotion = "neutral";
  if (osText.includes("开心") || osText.includes("好")) mood = "happy";
  else if (osText.includes("累") || osText.includes("困")) mood = "neutral";
  else if (osText.includes("兴奋") || osText.includes("玩")) mood = "excited";
  
  return {
    expression: expressions[Math.floor(Math.random() * expressions.length)],
    posture: postures[Math.floor(Math.random() * postures.length)],
    mood,
    moodScore: 0.6 + Math.random() * 0.4,
    mindOs: osText.substring(0, 50),
    humorLevel: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low"
  };
}

// ============================================================
// AI 吐槽 API（增强版）
// ============================================================

export interface RoastRequest {
  pet: Pet;
  context?: {
    mood?: string;
    lastInteractionDays?: number;
    activityLevel?: string;
    waterIntake?: string;
    sleepQuality?: string;
    appOpenFrequency?: string;
    timeOfDay?: string;
  };
  /** 快捷指令 ID */
  quickAction?: string;
  personality?: PetPersonality;
  onProgress?: (status: string) => void;
}

export interface RoastResponse {
  success: boolean;
  result?: RoastResult;
  /** 适用的表情包 */
  stickers?: ReturnType<typeof getStickersForPersonality>;
  error?: string;
}

/**
 * 获取 AI 宠物吐槽（增强版）
 */
export async function fetchPetRoast(request: RoastRequest): Promise<RoastResponse> {
  const { pet, context = {}, quickAction, personality: customPersonality, onProgress } = request;
  
  try {
    onProgress?.("正在分析宠物状态...");
    await delay(300);
    
    // 获取宠物性格
    const personality = customPersonality || inferPersonality(pet.species, pet.breed);
    
    // 如果有健康记录，使用真实数据
    let healthContext = context;
    if (!context.mood) {
      healthContext = { ...context, mood: "一般" };
    }
    
    onProgress?.("正在生成吐槽...");
    
    if (USE_MOCK) {
      await delay(600 + Math.random() * 800);
      const mockResult = mockRoastResult(pet, personality, quickAction);
      const stickers = getStickersForPersonality(personality);
      return { success: true, result: mockResult, stickers };
    }
    
    const prompt = buildRoastPrompt(pet, personality, {
      ...healthContext,
      quickAction
    });
    
    const aiResponse = await callAIChat({
      messages: [
        { role: "system", content: "你是一个俏皮的宠物，擅长用宠物的口吻表达不满和撒娇。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.9,
      max_tokens: 100
    });
    
    if (!aiResponse.success || !aiResponse.content) {
      const mockResult = mockRoastResult(pet, personality, quickAction);
      const stickers = getStickersForPersonality(personality);
      return { success: true, result: mockResult, stickers };
    }
    
    const result: RoastResult = {
      roastMessage: aiResponse.content.trim().substring(0, 50),
      roastType: "complaint",
      triggerReason: quickAction ? `快捷指令：${quickAction}` : "宠物的心情表达",
      suggestedAction: "多陪伴宠物"
    };
    
    const stickers = getStickersForPersonality(personality);
    
    onProgress?.("吐槽生成完毕！");
    
    return { success: true, result, stickers };
    
  } catch (error) {
    console.error("AI 吐槽生成失败:", error);
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
 * 上传宠物声音，获取翻译结果
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
    
    // 2. 上传音频（实际项目中需要上传到服务器）
    const audioUrl = URL.createObjectURL(audioFile);
    
    onProgress?.("正在分析音频...");
    await delay(500);
    
    // 3. 获取宠物性格
    const personality = customPersonality || inferPersonality(pet.species, pet.breed);
    
    onProgress?.("正在识别情绪...");
    await delay(800);
    
    // 4. 使用情绪规则引擎分析音频
    let emotion: PetEmotion;
    let emotionScore: number;
    let emotionAnalysis: EmotionAnalysisResult | null = null;
    
    try {
      // 尝试真实音频分析
      const audioFeatures = await analyzeAudioBlob(audioFile);
      emotionAnalysis = analyzeEmotion(audioFeatures, personality);
      emotion = emotionAnalysis.primaryEmotion;
      emotionScore = emotionAnalysis.confidence;
      console.log("[SoundEngine] 音频特征:", audioFeatures);
      console.log("[SoundEngine] 情绪分析:", {
        primary: emotion,
        confidence: Math.round(emotionScore * 100) + "%",
        rules: emotionAnalysis.matchedRules
      });
    } catch (error) {
      // 降级为模拟分析
      console.warn("[SoundEngine] 真实音频分析失败，使用模拟数据:", error);
      const features = generateFeaturesForEmotion("neutral");
      emotionAnalysis = analyzeEmotion(features, personality);
      emotion = emotionAnalysis.primaryEmotion;
      emotionScore = emotionAnalysis.confidence;
    }
    
    onProgress?.("正在生成宠物语言...");
    
    if (USE_MOCK) {
      await delay(1000 + Math.random() * 1000);
      const mockResult = mockVoiceTranslateResult(pet, personality);
      return { success: true, result: mockResult, audioUrl };
    }
    
    const prompt = buildVoiceTranslatePrompt(pet, personality, emotion, emotionScore);
    
    const aiResponse = await callAIChat({
      messages: [
        { role: "system", content: "你是一个宠物语言翻译专家，能准确翻译宠物的叫声含义。" },
        { role: "user", content: prompt }
      ],
      temperature: 0.85,
      max_tokens: 100
    });
    
    if (!aiResponse.success || !aiResponse.content) {
      const mockResult = mockVoiceTranslateResult(pet, personality);
      // 使用真实分析的情绪替换模拟的随机情绪
      return {
        success: true,
        result: {
          ...mockResult,
          emotion,
          emotionScore
        } as VoiceTranslateResult,
        audioUrl
      };
    }
    
    const result: VoiceTranslateResult = {
      emotion,
      emotionScore,
      aiLanguage: aiResponse.content.trim().substring(0, 50),
      suggestions: generateInteractionSuggestions(emotion, personality)
    };
    
    onProgress?.("翻译完成！");
    
    return { success: true, result, audioUrl };
    
  } catch (error) {
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
