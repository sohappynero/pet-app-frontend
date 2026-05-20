/**
 * 宠物声音情绪规则引擎
 * 基于音频特征（频率、音调、时长、强度）推断宠物情绪
 */

import type { PetEmotion, PetPersonality } from "../types";

// ============================================================
// 音频特征类型定义
// ============================================================

/** 音频分析特征 */
export interface AudioFeatures {
  /** 时长（秒） */
  duration: number;
  /** 平均音调 (Hz) */
  avgPitch: number;
  /** 最大音调 (Hz) */
  maxPitch: number;
  /** 最小音调 (Hz) */
  minPitch: number;
  /** 平均强度/振幅 (0-1) */
  avgIntensity: number;
  /** 峰值强度 (0-1) */
  peakIntensity: number;
  /** 频率变化率 (0-1, 越高表示声音越不稳定) */
  frequencyVariability: number;
  /** 是否有重复模式（如连续叫唤） */
  hasRepeatPattern: boolean;
  /** 叫声间隔数 */
  barkCount: number;
}

/** 情绪分析结果 */
export interface EmotionAnalysisResult {
  /** 主要情绪 */
  primaryEmotion: PetEmotion;
  /** 置信度 (0-1) */
  confidence: number;
  /** 次要情绪（如果有） */
  secondaryEmotion?: PetEmotion;
  /** 所有可能情绪及得分 */
  emotionScores: Record<PetEmotion, number>;
  /** 匹配的规则描述 */
  matchedRules: string[];
  /** 特征摘要 */
  featureSummary: string;
}

// ============================================================
// 情绪规则定义
// ============================================================

interface EmotionRule {
  id: string;
  name: string;
  emotion: PetEmotion;
  /** 规则条件函数 */
  condition: (features: AudioFeatures) => boolean;
  /** 权重 (0-1) */
  weight: number;
  /** 描述 */
  description: string;
}

/** 情绪规则库 */
const EMOTION_RULES: EmotionRule[] = [
  // ===== 兴奋类规则 =====
  {
    id: "excited_high_pitch_fast",
    name: "高音调快速叫声",
    emotion: "excited",
    weight: 0.9,
    description: "高音调 + 快速重复 = 超兴奋",
    condition: (f) => f.avgPitch > 800 && f.barkCount >= 5 && f.duration < 5
  },
  {
    id: "excited_high_intensity",
    name: "高强度持续叫声",
    emotion: "excited",
    weight: 0.85,
    description: "高强度 + 多次叫唤 = 兴奋期待",
    condition: (f) => f.avgIntensity > 0.7 && f.barkCount >= 4 && f.hasRepeatPattern
  },
  {
    id: "excited_short_bursts",
    name: "短促爆发式叫声",
    emotion: "excited",
    weight: 0.8,
    description: "短促多次 = 玩耍兴奋",
    condition: (f) => f.barkCount >= 6 && f.duration < 8 && f.peakIntensity > 0.8
  },

  // ===== 开心类规则 =====
  {
    id: "happy_moderate_tone",
    name: "中等音调平稳叫声",
    emotion: "happy",
    weight: 0.85,
    description: "平稳中音调 = 开心满足",
    condition: (f) => 
      f.avgPitch >= 300 && f.avgPitch <= 700 && 
      f.frequencyVariability < 0.3 && 
      f.avgIntensity >= 0.4 && f.avgIntensity <= 0.65
  },
  {
    id: "happy_gentle_rhythm",
    name: "温和有节奏的叫声",
    emotion: "happy",
    weight: 0.75,
    description: "节奏均匀 = 温和开心",
    condition: (f) => f.hasRepeatPattern && f.frequencyVariability < 0.25 && f.avgIntensity < 0.6
  },

  // ===== 饥饿类规则 =====
  {
    id: "hungry_low_persistent",
    name: "低沉持久叫声",
    emotion: "hungry",
    weight: 0.9,
    description: "低音调 + 持续 = 饿了要吃的",
    condition: (f) => f.avgPitch < 350 && f.duration > 3 && f.barkCount >= 2
  },
  {
    id: "hungry_whining",
    name: "哀鸣式叫声",
    emotion: "hungry",
    weight: 0.85,
    description: "低音调 + 高变化率 = 哀求讨食",
    condition: (f) => f.avgPitch < 400 && f.frequencyVariability > 0.4 && f.avgIntensity > 0.35
  },
  {
    id: "hungry_repeated_low",
    name: "反复低声叫唤",
    emotion: "hungry",
    weight: 0.8,
    description: "反复低声 = 讨食信号",
    condition: (f) => f.avgPitch < 400 && f.barkCount >= 4 && f.avgIntensity < 0.55
  },

  // ===== 孤单类规则 =====
  {
    id: "lonely_long_single",
    name: "长声单次哀鸣",
    emotion: "lonely",
    weight: 0.9,
    description: "长声单次 = 孤独呼唤",
    condition: (f) => f.duration > 2.5 && f.barkCount <= 2 && f.avgPitch < 500
  },
  {
    id: "lonely_soft_fading",
    name: "渐弱柔和叫声",
    emotion: "lonely",
    weight: 0.82,
    description: "渐弱 = 无助孤单",
    condition: (f) => f.avgIntensity < 0.45 && f.frequencyVariability < 0.25 && f.duration > 1.5
  },
  {
    id: "lonely_intermittent",
    name: "间歇性轻声叫唤",
    emotion: "lonely",
    weight: 0.78,
    description: "间歇性 = 等待回应",
    condition: (f) => f.barkCount >= 3 && f.avgIntensity < 0.4 && !f.hasRepeatPattern
  },

  // ===== 焦虑类规则 =====
  {
    id: "anxious_variable_pitch",
    name: "音调剧烈波动",
    emotion: "anxious",
    weight: 0.92,
    description: "音调不稳 = 紧张焦虑",
    condition: (f) => f.frequencyVariability > 0.5 && f.maxPitch - f.minPitch > 400
  },
  {
    id: "anxious_quick_bursts",
    name: "快速不规律叫声",
    emotion: "anxious",
    weight: 0.88,
    description: "快速不规律 = 不安紧张",
    condition: (f) => f.barkCount >= 5 && f.frequencyVariability > 0.4 && f.avgIntensity > 0.5
  },
  {
    id: "anxious_high_sharp",
    name: "尖锐高音叫声",
    emotion: "anxious",
    weight: 0.8,
    description: "尖锐高音 = 受惊害怕",
    condition: (f) => f.maxPitch > 1000 && f.peakIntensity > 0.7 && f.duration < 3
  },

  // ===== 愤怒类规则 =====
  {
    id: "angry_low_loud",
    name: "低沉大声吼叫",
    emotion: "angry",
    weight: 0.92,
    description: "低沉大声 = 愤怒警告",
    condition: (f) => f.avgPitch < 400 && f.avgIntensity > 0.7 && f.duration > 1
  },
  {
    id: "angry_growl_continuous",
    name: "持续低频吼声",
    emotion: "angry",
    weight: 0.87,
    description: "持续低频 = 生气的啦",
    condition: (f) => f.avgPitch < 350 && f.duration > 2 && f.avgIntensity > 0.6 && f.barkCount <= 3
  },
  {
    id: "angry_sudden_loud",
    name: "突然大声吠叫",
    emotion: "angry",
    weight: 0.83,
    description: "突然大声 = 吓退或生气",
    condition: (f) => f.peakIntensity > 0.85 && f.barkCount <= 2 && f.duration < 2
  },

  // ===== 平静类规则（默认） =====
  {
    id: "neutral_calm",
    name: "平静普通叫声",
    emotion: "neutral",
    weight: 0.7,
    description: "普通叫声 = 平静状态",
    condition: (f) => true // 默认匹配所有未匹配的情况
  }
];

// ============================================================
// 核心分析引擎
// ============================================================

/**
 * 分析音频特征，返回情绪推断结果
 * @param features 提取的音频特征
 * @param personality 宠物性格（可选，用于调整权重）
 * @returns 情绪分析结果
 */
export function analyzeEmotion(
  features: AudioFeatures, 
  personality?: PetPersonality
): EmotionAnalysisResult {
  // 初始化情绪得分
  const emotionScores: Record<PetEmotion, number> = {
    excited: 0,
    happy: 0,
    hungry: 0,
    lonely: 0,
    anxious: 0,
    angry: 0,
    neutral: 0
  };

  // 存储匹配的规则
  const matchedRules: string[] = [];

  // 应用每条规则
  for (const rule of EMOTION_RULES) {
    if (rule.condition(features)) {
      // 根据性格调整权重
      let adjustedWeight = rule.weight;

      if (personality) {
        adjustedWeight = adjustWeightByPersonality(rule.emotion, personality, rule.weight);
      }

      emotionScores[rule.emotion] += adjustedWeight;
      
      if (rule.id !== "neutral_calm") {
        matchedRules.push(`${rule.name}: ${rule.description}`);
      }
    }
  }

  // 归一化得分
  const totalScore = Object.values(emotionScores).reduce((sum, s) => sum + s, 0);
  
  for (const key of Object.keys(emotionScores) as PetEmotion[]) {
    emotionScores[key] = totalScore > 0 ? emotionScores[key] / totalScore : 1 / 7;
  }

  // 找出主要和次要情绪
  const sortedEmotions = (Object.entries(emotionScores) as [PetEmotion, number][])
    .sort((a, b) => b[1] - a[1]);

  const primaryEmotion = sortedEmotions[0][0];
  const confidence = sortedEmotions[0][1];
  const secondaryEmotion = sortedEmotions[1][1] > 0.15 ? sortedEmotions[1][0] : undefined;

  // 生成特征摘要
  const featureSummary = generateFeatureSummary(features);

  return {
    primaryEmotion,
    confidence,
    secondaryEmotion,
    emotionScores,
    matchedRules,
    featureSummary
  };
}

/**
 * 根据宠物性格调整情绪权重
 */
function adjustWeightByPersonality(
  emotion: PetEmotion, 
  personality: PetPersonality, 
  baseWeight: number
): number {
  // 性格与情绪的关联映射
  const personalityBoosts: Record<PetPersonality, Partial<Record<PetEmotion, number>>> = {
    energetic: { excited: 1.15, happy: 1.05, angry: 0.95 },
    calm: { neutral: 1.15, lonely: 0.95, excited: 0.9 },
    playful: { excited: 1.12, happy: 1.1, hungry: 1.05 },
    shy: { anxious: 1.15, lonely: 1.1, neutral: 1.05 },
    bossy: { angry: 1.15, hungry: 1.08, excited: 0.95 },
    clingy: { lonely: 1.18, hungry: 1.05, happy: 1.08 }
  };

  const boost = personalityBoosts[personality]?.[emotion];
  return boost ? baseWeight * boost : baseWeight;
}

/**
 * 生成特征摘要文字
 */
function generateFeatureSummary(features: AudioFeatures): string {
  const parts: string[] = [];

  if (features.duration < 2) parts.push("短促");
  else if (features.duration < 5) parts.push("中等时长");
  else parts.push("较长");

  if (features.avgPitch > 800) parts.push("尖锐");
  else if (features.avgPitch > 500) parts.push("偏高");
  else if (features.avgPitch < 350) parts.push("低沉");
  else parts.push("中等");

  if (features.avgIntensity > 0.7) parts.push("响亮");
  else if (features.avgIntensity > 0.4) parts.push("中等音量");
  else parts.append("较轻");

  if (features.frequencyVariability > 0.4) parts.push("起伏大");
  else if (features.frequencyVariability < 0.2) parts.push("平稳");

  if (features.hasRepeatPattern) parts.push("有节奏");

  return parts.join("") || "普通";
}

// ============================================================
// 模拟音频特征提取（演示用）
// ============================================================

/**
 * 生成模拟音频特征
 * 实际项目中应使用 Web Audio API 或后端音频处理
 */
export function generateMockAudioFeatures(): AudioFeatures {
  // 随机生成基础特征
  const duration = 1 + Math.random() * 8; // 1-9秒
  const avgPitch = 200 + Math.random() * 900; // 200-1100 Hz
  const pitchSpread = Math.random() * 400; // 0-400 Hz 变化范围
  
  return {
    duration: Math.round(duration * 10) / 10,
    avgPitch: Math.round(avgPitch),
    maxPitch: Math.round(avgPitch + pitchSpread),
    minPitch: Math.round(avgPitch - pitchSpread * 0.5),
    avgIntensity: 0.2 + Math.random() * 0.7,
    peakIntensity: 0.4 + Math.random() * 0.6,
    frequencyVariability: Math.random(),
    hasRepeatPattern: Math.random() > 0.5,
    barkCount: Math.floor(1 + Math.random() * 10)
  };
}

/**
 * 基于指定情绪生成倾向性特征
 * 用于演示或测试
 */
export function generateFeaturesForEmotion(emotion: PetEmotion): AudioFeatures {
  const base: Record<PetEmotion, () => AudioFeatures> = {
    excited: () => ({
      duration: 1.5 + Math.random() * 3,
      avgPitch: 750 + Math.random() * 400,
      maxPitch: 1100 + Math.random() * 300,
      minPitch: 500 + Math.random() * 200,
      avgIntensity: 0.65 + Math.random() * 0.3,
      peakIntensity: 0.8 + Math.random() * 0.2,
      frequencyVariability: 0.2 + Math.random() * 0.2,
      hasRepeatPattern: true,
      barkCount: 5 + Math.floor(Math.random() * 6)
    }),
    happy: () => ({
      duration: 1 + Math.random() * 4,
      avgPitch: 400 + Math.random() * 250,
      maxPitch: 600 + Math.random() * 200,
      minPitch: 280 + Math.random() * 150,
      avgIntensity: 0.4 + Math.random() * 0.25,
      peakIntensity: 0.55 + Math.random() * 0.25,
      frequencyVariability: 0.1 + Math.random() * 0.2,
      hasRepeatPattern: Math.random() > 0.3,
      barkCount: 2 + Math.floor(Math.random() * 4)
    }),
    hungry: () => ({
      duration: 2 + Math.random() * 5,
      avgPitch: 220 + Math.random() * 150,
      maxPitch: 380 + Math.random() * 150,
      minPitch: 150 + Math.random() * 80,
      avgIntensity: 0.35 + Math.random() * 0.25,
      peakIntensity: 0.5 + Math.random() * 0.3,
      frequencyVariability: 0.3 + Math.random() * 0.3,
      hasRepeatPattern: Math.random() > 0.4,
      barkCount: 2 + Math.floor(Math.random() * 5)
    }),
    lonely: () => ({
      duration: 2.5 + Math.random() * 6,
      avgPitch: 320 + Math.random() * 180,
      maxPitch: 450 + Math.random() * 150,
      minPitch: 200 + Math.random() * 100,
      avgIntensity: 0.25 + Math.random() * 0.25,
      peakIntensity: 0.38 + Math.random() * 0.22,
      frequencyVariability: 0.1 + Math.random() * 0.2,
      hasRepeatPattern: false,
      barkCount: 1 + Math.floor(Math.random() * 3)
    }),
    anxious: () => ({
      duration: 1 + Math.random() * 4,
      avgPitch: 550 + Math.random() * 450,
      maxPitch: 1000 + Math.random() * 300,
      minPitch: 300 + Math.random() * 200,
      avgIntensity: 0.5 + Math.random() * 0.3,
      peakIntensity: 0.72 + Math.random() * 0.28,
      frequencyVariability: 0.5 + Math.random() * 0.4,
      hasRepeatPattern: Math.random() > 0.5,
      barkCount: 4 + Math.floor(Math.random() * 6)
    }),
    angry: () => ({
      duration: 1 + Math.random() * 4,
      avgPitch: 180 + Math.random() * 180,
      maxPitch: 360 + Math.random() * 150,
      minPitch: 120 + Math.random() * 60,
      avgIntensity: 0.68 + Math.random() * 0.32,
      peakIntensity: 0.85 + Math.random() * 0.15,
      frequencyVariability: 0.15 + Math.random() * 0.2,
      hasRepeatPattern: Math.random() > 0.6,
      barkCount: 1 + Math.floor(Math.random() * 3)
    }),
    neutral: () => ({
      duration: 1 + Math.random() * 3,
      avgPitch: 380 + Math.random() * 250,
      maxPitch: 520 + Math.random() * 180,
      minPitch: 260 + Math.random() * 120,
      avgIntensity: 0.35 + Math.random() * 0.25,
      peakIntensity: 0.48 + Math.random() * 0.27,
      frequencyVariability: 0.15 + Math.random() * 0.2,
      hasRepeatPattern: Math.random() > 0.5,
      barkCount: 1 + Math.floor(Math.random() * 3)
    })
  };

  return base[emotion]?.() || base.neutral();
}

/**
 * 使用 Web Audio API 分析音频 Blob 的真实特征
 * 注意：这是一个简化版实现，实际项目可能需要更复杂的分析
 */
export async function analyzeAudioBlob(audioBlob: Blob): Promise<AudioFeatures> {
  return new Promise((resolve) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // 获取原始数据
          const channelData = audioBuffer.getChannelData(0);
          const sampleRate = audioBuffer.sampleRate;

          // 计算基本特征
          let sumSquares = 0;
          let maxAmplitude = 0;
          
          for (let i = 0; i < channelData.length; i++) {
            const absValue = Math.abs(channelData[i]);
            sumSquares += channelData[i] * channelData[i];
            if (absValue > maxAmplitude) maxAmplitude = absValue;
          }

          const rms = Math.sqrt(sumSquares / channelData.length); // RMS 强度

          // 简化的频率估计（使用过零率近似）
          let zeroCrossings = 0;
          for (let i = 1; i < channelData.length; i++) {
            if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) {
              zeroCrossings++;
            }
          }

          const estimatedFreq = (zeroCrossings * sampleRate) / (2 * channelData.length);

          resolve({
            duration: audioBuffer.duration,
            avgPitch: Math.round(estimatedFreq * 2), // 近似估算
            maxPitch: Math.round(estimatedFreq * 3),
            minPitch: Math.round(estimatedFreq * 0.8),
            avgIntensity: Math.min(1, rms * 3),
            peakIntensity: Math.min(1, maxAmplitude),
            frequencyVariability: Math.min(1, rms * 2 + Math.random() * 0.3),
            hasRepeatPattern: audioBuffer.duration > 1.5,
            barkCount: Math.max(1, Math.floor(audioBuffer.duration / 0.8))
          });
        } catch {
          // 解析失败时使用模拟数据
          resolve(generateMockAudioFeatures());
        } finally {
          audioContext.close();
        }
      };

      reader.onerror = () => resolve(generateMockAudioFeatures());
      reader.readAsArrayBuffer(audioBlob);

    } catch {
      resolve(generateMockAudioFeatures());
    }
  });
}
