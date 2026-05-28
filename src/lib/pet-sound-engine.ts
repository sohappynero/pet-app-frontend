/**
 * 宠物声音情绪规则引擎 v2
 * 
 * 核心改进：物种感知分析 —— 区分猫(dog)和猫(cat)的叫声特征差异
 * 
 * 【声学基础】猫 vs 狗叫声的本质区别：
 *   猫 meow:  基频 200-1000Hz | 单声时长 0.5-2s | 音调连续变化 | 谐波丰富 | 声音"悠长"
 *   狗 bark:  基频 100-800Hz  | 单声时长 0.1-0.5s | 脉冲式爆发 | 短促有力 | 声音"脆硬"
 * 
 * 因此：同一套音频特征值对猫和狗代表完全不同的含义！
 * 例如 avgPitch=500Hz 对狗来说算偏高(可能是兴奋/焦虑), 对猫来说是正常偏低(可能是平静)
 */

import type { PetEmotion, PetPersonality } from "../types";

// ============================================================
// 类型定义
// ============================================================

/** 宠物物种 */
export type PetSpecies = "dog" | "cat" | "other";

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
  /** 新增：脉冲指数 (0-1, 高=短促爆发式如狗叫, 低=平滑连续式如猫叫) */
  pulseIndex: number;
  /** 新增：谐波丰富度 (0-1, 高=谐波复杂如猫meow, 低=近纯音) */
  harmonicRichness: number;
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
  /** 检测到的物种类型（基于声学特征推断） */
  detectedSpecies?: "dog" | "cat";
}

// ============================================================
// 情绪规则定义
// ============================================================

interface EmotionRule {
  id: string;
  name: string;
  emotion: PetEmotion;
  condition: (f: AudioFeatures) => boolean;
  weight: number;
  description: string;
}

/**
 * ========== 犬类(Dog) 情绪规则 ==========
 * 
 * 狗的吠叫(bark)声学特征：
 * - 典型基频: 100-800 Hz（大型犬更低，小型犬更高）
 * - 单次吠叫: 0.1-0.5 秒，脉冲式爆发
 * - 连续吠叫时间隔: 0.2-1 秒
 * - 强度通常较高（尤其是警告/兴奋时）
 * - 低吼(growl): 50-300 Hz，持续型，震动感强
 */

const DOG_EMOTION_RULES: EmotionRule[] = [
  // ===== 兴奋 =====
  // 狗兴奋 = 高音调尖叫 + 高频重复短促吠叫（像看到主人回家）
  {
    id: "dog_excited_scream",
    name: "高频尖叫+快速重复",
    emotion: "excited",
    weight: 0.92,
    description: "高音调 + 多次短促吠叫 = 超级兴奋（见到主人/出去玩）",
    condition: (f) =>
      f.avgPitch > 600 && f.barkCount >= 6 && f.duration < 6 && f.pulseIndex > 0.6
  },
  {
    id: "dog_excited_high_intensity_repeat",
    name: "高强度节奏性吠叫",
    emotion: "excited",
    weight: 0.88,
    description: "大声 + 节奏性重复 = 兴奋期待",
    condition: (f) =>
      f.avgIntensity > 0.65 && f.barkCount >= 4 && f.hasRepeatPattern && f.pulseIndex > 0.5
  },
  {
    id: "dog_excited_short_bursts",
    name: "密集短促爆发",
    emotion: "excited",
    weight: 0.83,
    description: "密集短吠 + 高峰值 = 玩耍兴奋",
    condition: (f) =>
      f.barkCount >= 8 && f.duration < 6 && f.peakIntensity > 0.75
  },

  // ===== 开心 =====
  // 狗开心 = 中等音调 + 中等强度 + 偶尔轻吠 + 摇尾巴时的"哼唧"
  {
    id: "dog_happy_moderate_bark",
    name: "中等音调平稳吠叫",
    emotion: "happy",
    weight: 0.87,
    description: "中音调 + 平稳 = 开心满足（摇尾巴哼唧）",
    condition: (f) =>
      f.avgPitch >= 250 && f.avgPitch <= 600 &&
      f.frequencyVariability < 0.35 &&
      f.avgIntensity >= 0.35 && f.avgIntensity <= 0.6
  },
  {
    id: "dog_happy_gentle_rhythm",
    name: "温和有节奏轻吠",
    emotion: "happy",
    weight: 0.78,
    description: "节奏均匀 + 较轻 = 温和开心",
    condition: (f) =>
      f.hasRepeatPattern && f.frequencyVariability < 0.3 && f.avgIntensity < 0.55 && f.barkCount >= 3
  },

  // ===== 饥饿 =====
  // 狗饥饿 = 低沉持续性吠叫/哀鸣 + 盯着食盆 + 可能抓挠
  {
    id: "dog_hungry_low_persistent",
    name: "低沉持续吠叫",
    emotion: "hungry",
    weight: 0.91,
    description: "低音调 + 持续 = 饿了要吃的",
    condition: (f) =>
      f.avgPitch < 300 && f.duration > 2.5 && f.barkCount >= 3 && f.pulseIndex < 0.6
  },
  {
    id: "dog_hungry_whining",
    name: "哀鸣式高频变化",
    emotion: "hungry",
    weight: 0.86,
    description: "哀鸣音调起伏 = 讨食信号",
    condition: (f) =>
      f.avgPitch < 450 && f.frequencyVariability > 0.35 && f.avgIntensity > 0.3 && f.barkCount >= 2
  },

  // ===== 孤单 =====
  // 狗孤单 = 长声低沉哀嚎(howl) + 间歇性单声吠叫
  {
    id: "dog_lonely_long_howl",
    name: "长声低沉哀嚎",
    emotion: "lonely",
    weight: 0.90,
    description: "长声 + 低沉 + 单次 = 分离焦虑/孤独呼唤",
    condition: (f) =>
      f.duration > 3 && f.barkCount <= 2 && f.avgPitch < 400 && f.pulseIndex < 0.4
  },
  {
    id: "dog_lonely_soft_intermittent",
    name: "间歇性轻声吠叫",
    emotion: "lonely",
    weight: 0.80,
    description: "间歇性轻声 = 等待主人",
    condition: (f) =>
      f.barkCount >= 3 && f.avgIntensity < 0.4 && !f.hasRepeatPattern && f.avgPitch < 450
  },

  // ===== 焦虑 =====
  // 狗焦虑 = 快速不规律吠叫 + 高音调尖叫 + 来回走动
  {
    id: "dog_anxious_frantic",
    name: "急促不规律吠叫",
    emotion: "anxious",
    weight: 0.91,
    description: "快速不规律 = 不安紧张（分离焦虑/雷声恐惧）",
    condition: (f) =>
      f.barkCount >= 6 && f.frequencyVariability > 0.35 && f.avgIntensity > 0.45 && f.duration < 5
  },
  {
    id: "dog_anxious_high_sharp",
    name: "尖锐高音短吠",
    emotion: "anxious",
    weight: 0.85,
    description: "尖锐高频 = 受惊/警惕",
    condition: (f) =>
      f.maxPitch > 900 && f.peakIntensity > 0.65 && f.duration < 2.5 && f.pulseIndex > 0.6
  },
  {
    id: "dog_anxious_variable_pitch",
    name: "音调剧烈波动",
    emotion: "anxious",
    weight: 0.82,
    description: "音调大起大落 = 紧张不安",
    condition: (f) =>
      f.frequencyVariability > 0.45 && f.maxPitch - f.minPitch > 350
  },

  // ===== 愤怒 =====
  // 狗愤怒 = 低沉连续吼叫(growl/snarl) + 短促强力警告吠
  {
    id: "dog_angry_growl",
    name: "低沉持续怒吼",
    emotion: "angry",
    weight: 0.93,
    description: "低沉持续 = 愤怒警告（护食/领地）",
    condition: (f) =>
      f.avgPitch < 300 && f.duration > 1.5 && f.avgIntensity > 0.6 && f.barkCount <= 3 && f.pulseIndex < 0.4
  },
  {
    id: "dog_angry_loud_warning",
    name: "大声警告吠叫",
    emotion: "angry",
    weight: 0.88,
    description: "大声 + 短促 = 吓退/警告",
    condition: (f) =>
      f.peakIntensity > 0.8 && f.barkCount <= 3 && f.duration < 2 && f.avgPitch < 450
  },

  // ===== 平静（默认）=====
  {
    id: "dog_neutral_calm",
    name: "普通吠叫",
    emotion: "neutral",
    weight: 0.7,
    description: "普通状态",
    condition: (_f) => true
  }
];

/**
 * ========== 猫类(Cat) 情绪规则 ==========
 * 
 * 猫的叫声声学特征：
 * - meow 基频: 200-1000 Hz（母猫更高，公猫更低）
 * - 单次 meow: 0.5-2 秒，音调通常有滑动（升或降）
 * - 谐波结构丰富（比狗的bark复杂得多）
 * - purr（呼噜）: 25-150 Hz，持续型，有节拍感
 * - hiss/growl（哈气/低吼）: 低频，噪声为主
 */

const CAT_EMOTION_RULES: EmotionRule[] = [
  // ===== 兴奋 =====
  // 猫兴奋 = 高音调短促 chirp/chatter + 快速连续 meow（看到鸟/猎物时）
  {
    id: "cat_excited_chirp",
    name: "高频颤音/啾啾声",
    emotion: "excited",
    weight: 0.90,
    description: "高音调颤音 + 快速重复 = 猎物兴奋（看到鸟/激光笔）",
    condition: (f) =>
      f.avgPitch > 700 && f.barkCount >= 4 && f.duration < 5 && f.harmonicRichness > 0.5
  },
  {
    id: "cat_excited_high_pitch_meow",
    name: "高音调连续喵叫",
    emotion: "excited",
    weight: 0.85,
    description: "高音调 + 节奏感 = 兴奋期待",
    condition: (f) =>
      f.avgPitch > 550 && f.hasRepeatPattern && f.avgIntensity > 0.45 && f.frequencyVariability > 0.2
  },

  // ===== 开心 =====
  // 猫开心 = 中音调柔和 meow + 呼噜(purr)混合 + "闭眼喵"
  {
    id: "cat_happy_soft_meow",
    name: "柔和中等音调喵叫",
    emotion: "happy",
    weight: 0.88,
    description: "柔和中音调 = 开心满足（求关注/撒娇）",
    condition: (f) =>
      f.avgPitch >= 350 && f.avgPitch <= 750 &&
      f.frequencyVariability < 0.35 &&
      f.avgIntensity >= 0.25 && f.avgIntensity <= 0.55 &&
      f.harmonicRichness > 0.4
  },
  {
    id: "cat_happy_gentle_rhythm",
    name: "温和有节奏喵叫",
    emotion: "happy",
    weight: 0.80,
    description: "节奏均匀 + 谐波丰富 = 温和开心",
    condition: (f) =>
      f.hasRepeatPattern && f.frequencyVariability < 0.3 && f.harmonicRichness > 0.5
  },
  {
    id: "cat_happy_purr_like",
    name: "低频持续呼噜型",
    emotion: "happy",
    weight: 0.75,
    description: "低频持续 + 平稳 = 呼噜/满足",
    condition: (f) =>
      f.avgPitch < 400 && f.duration > 2 && f.frequencyVariability < 0.2 && f.avgIntensity < 0.5
  },

  // ===== 饥饿 =====
  // 猫饥饿 = 中高强度 meow + 大音调变化（经典的"喂我"叫声）
  {
    id: "cat_hungry_demanding_meow",
    name: "强烈要求式喵叫",
    emotion: "hungry",
    weight: 0.92,
    description: "中高音调 + 大音调变化 + 足够大声 = 饿了要吃（经典讨食叫）",
    condition: (f) =>
      f.avgPitch >= 400 && f.avgPitch <= 850 &&
      f.frequencyVariability > 0.35 && f.avgIntensity > 0.35 && f.duration > 1.5
  },
  {
    id: "cat_hungry_repeated_meow",
    name: "反复催促喵叫",
    emotion: "hungry",
    weight: 0.85,
    description: "反复中音调 = 讨食信号",
    condition: (f) =>
      f.avgPitch >= 350 && f.barkCount >= 4 && f.hasRepeatPattern && f.avgIntensity > 0.3
  },

  // ===== 孤单 =====
  // 猫孤单 = 长声拖尾 meow（音调下降）+ 轻柔呼唤
  {
    id: "cat_lonely_long_falling",
    name: "长声下降音喵叫",
    emotion: "lonely",
    weight: 0.89,
    description: "长声 + 中低音调 + 渐弱 = 孤独呼唤（找主人）",
    condition: (f) =>
      f.duration > 2 && f.barkCount <= 2 && f.avgPitch < 650 && f.avgIntensity < 0.5
  },
  {
    id: "cat_lonely_soft_meow",
    name: "轻柔间歇喵叫",
    emotion: "lonely",
    weight: 0.79,
    description: "轻柔间歇 = 无助/等待",
    condition: (f) =>
      f.barkCount >= 2 && f.avgIntensity < 0.4 && !f.hasRepeatPattern && f.avgPitch < 600
  },

  // ===== 焦虑 =====
  // 猫焦虑 = 高音调紧张 meow + 咆哮(yowl) + 不规律
  {
    id: "cat_anxious_tense",
    name: "紧张高音喵叫",
    emotion: "anxious",
    weight: 0.90,
    description: "高音调 + 音调不稳 = 紧张焦虑（环境变化/陌生访客）",
    condition: (f) =>
      f.frequencyVariability > 0.4 && f.maxPitch - f.minPitch > 300 && f.avgPitch > 450
  },
  {
    id: "cat_anxious_yowl",
    name: "长声嚎叫",
    emotion: "anxious",
    weight: 0.84,
    description: "较长 + 高变化 = 不安/发情/压力",
    condition: (f) =>
      f.duration > 2.5 && f.frequencyVariability > 0.35 && f.avgIntensity > 0.4
  },

  // ===== 愤怒 =====
  // 猫愤怒 = hiss（哈气）/growl（低吼）/snarl + 低频噪声
  {
    id: "cat_angry_hiss_growl",
    name: "哈气/低吼型",
    emotion: "angry",
    weight: 0.93,
    description: "低频 + 噪声感 + 较短 = 哈气/愤怒警告",
    condition: (f) =>
      f.avgPitch < 450 && f.duration > 0.8 && f.avgIntensity > 0.5 &&
      f.harmonicRichness < 0.4 && f.pulseIndex < 0.4
  },
  {
    id: "cat_angry_sudden_loud",
    name: "突然大声警告",
    emotion: "angry",
    weight: 0.86,
    description: "突然大声 + 短促 = 受惊攻击",
    condition: (f) =>
      f.peakIntensity > 0.8 && f.duration < 2 && f.barkCount <= 2 && f.harmonicRichness < 0.5
  },

  // ===== 平静（默认）=====
  {
    id: "cat_neutral_calm",
    name: "普通喵叫",
    emotion: "neutral",
    weight: 0.7,
    description: "普通状态",
    condition: (_f) => true
  }
];

/**
 * 根据物种获取对应的规则集
 */
function getRulesForSpecies(species: PetSpecies): EmotionRule[] {
  switch (species) {
    case "cat": return CAT_EMOTION_RULES;
    case "dog": return DOG_EMOTION_RULES;
    default:
      // other 类型默认用犬类规则（更通用）
      return DOG_EMOTION_RULES;
  }
}

// ============================================================
// 核心分析引擎
// ============================================================

/**
 * 分析音频特征，返回情绪推断结果
 * 
 * @param features 提取的音频特征
 * @param options 可选配置
 *   - species: 宠物物种 ("dog" | "cat" | "other") — 关键参数！决定使用哪套阈值
 *   - personality: 宠物性格（用于微调权重）
 * @returns 情绪分析结果
 */
export function analyzeEmotion(
  features: AudioFeatures,
  options?: {
    species?: PetSpecies;
    personality?: PetPersonality;
  }
): EmotionAnalysisResult {
  const species = options?.species || "dog";
  const personality = options?.personality;
  const rules = getRulesForSpecies(species);

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

  const matchedRules: string[] = [];

  // 应用每条规则（使用对应物种的规则集）
  for (const rule of rules) {
    if (rule.condition(features)) {
      let adjustedWeight = rule.weight;

      // 性格权重调整
      if (personality) {
        adjustedWeight = adjustWeightByPersonality(rule.emotion, personality, rule.weight);
      }

      emotionScores[rule.emotion] += adjustedWeight;

      // 排除默认规则不显示
      if (!rule.id.startsWith(species + "_neutral")) {
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

  // 基于声学特征检测物种（当 species="other" 时有用）
  const detectedSpecies = detectSpeciesFromAudio(features);

  const featureSummary = generateFeatureSummary(features, species);

  return {
    primaryEmotion,
    confidence,
    secondaryEmotion,
    emotionScores,
    matchedRules,
    featureSummary,
    detectedSpecies: species === "other" ? detectedSpecies : undefined
  };
}

/**
 * 基于音频声学特征自动推断物种类型
 * 用于 species="other" 或用户未指定时
 */
function detectSpeciesFromAudio(f: AudioFeatures): "dog" | "cat" | undefined {
  // 狗叫声典型特征: 高脉冲指数(短促爆发)、较低谐波、较短单声
  const dogScore =
    (f.pulseIndex > 0.5 ? 1 : 0) +
    (f.harmonicRichness < 0.4 ? 1 : 0) +
    (f.barkCount > 5 ? 1 : 0) +
    (f.avgIntensity > 0.5 ? 0.5 : 0);

  // 猫叫声典型特征: 低脉冲指数(平滑连续)、高谐波、较长单声、音调变化大
  const catScore =
    (f.pulseIndex < 0.45 ? 1 : 0) +
    (f.harmonicRichness > 0.45 ? 1 : 0) +
    (f.frequencyVariability > 0.25 ? 0.5 : 0) +
    (f.barkCount <= 4 && f.duration > 1 ? 0.5 : 0);

  if (dogScore > catScore + 1) return "dog";
  if (catScore > dogScore + 1) return "cat";
  return undefined; // 无法确定
}

/**
 * 根据宠物性格调整情绪权重
 */
function adjustWeightByPersonality(
  emotion: PetEmotion,
  personality: PetPersonality,
  baseWeight: number
): number {
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
 * 生成特征摘要文字（物种感知版）
 */
function generateFeatureSummary(f: AudioFeatures, species: PetSpecies): string {
  const parts: string[] = [];

  // 时长描述
  if (f.duration < 1.5) parts.push("短促");
  else if (f.duration < 4) parts.push("中等时长");
  else parts.push("较长");

  // 音调描述 — 猫狗基准不同！
  if (species === "cat") {
    // 猫的音调范围整体偏高
    if (f.avgPitch > 900) parts.push("尖锐高音");
    else if (f.avgPitch > 650) parts.push("偏高音调");
    else if (f.avgPitch < 350) parts.push("低沉");
    else parts.push("中等音调");
  } else {
    // 狗的音调范围整体偏低
    if (f.avgPitch > 700) parts.push("尖锐高音");
    else if (f.avgPitch > 400) parts.push("偏高");
    else if (f.avgPitch < 200) parts.push("很低沉");
    else parts.push("中等");
  }

  // 强度
  if (f.avgIntensity > 0.7) parts.push("响亮");
  else if (f.avgIntensity > 0.4) parts.push("中等音量");
  else parts.push("较轻");

  // 频率稳定性
  if (f.frequencyVariability > 0.4) parts.push("音调起伏大");
  else if (f.frequencyVariability < 0.2) parts.push("音调平稳");

  // 物种特有特征
  if (species === "dog") {
    if (f.pulseIndex > 0.6) parts.push("脉冲爆发式");
    else if (f.pulseIndex < 0.3) parts.push("拖长音");
  } else {
    if (f.harmonicRichness > 0.6) parts.push("谐波丰富");
    else if (f.harmonicRichness < 0.3) parts.push("噪声感强");
  }

  if (f.hasRepeatPattern) parts.push("有节奏");

  return parts.join("") || "普通";
}

// ============================================================
// 模拟音频特征生成（支持物种区分）
// ============================================================

/**
 * 生成模拟音频特征
 * @param species 宠物物种
 */
export function generateMockAudioFeatures(species: PetSpecies = "dog"): AudioFeatures {
  if (species === "cat") {
    return generateCatMockFeatures();
  }
  return generateDogMockFeatures();
}

/** 犬类模拟特征：脉冲式、较低谐波、短促有力 */
function generateDogMockFeatures(): AudioFeatures {
  const duration = 0.8 + Math.random() * 7;
  const avgPitch = 150 + Math.random() * 700; // 150-850 Hz
  const pitchSpread = Math.random() * 350;

  return {
    duration: Math.round(duration * 10) / 10,
    avgPitch: Math.round(avgPitch),
    maxPitch: Math.round(avgPitch + pitchSpread),
    minPitch: Math.round(Math.max(60, avgPitch - pitchSpread * 0.6)),
    avgIntensity: 0.25 + Math.random() * 0.7,
    peakIntensity: 0.45 + Math.random() * 0.55,
    frequencyVariability: Math.random(),
    hasRepeatPattern: Math.random() > 0.45,
    barkCount: Math.floor(1 + Math.random() * 12),
    pulseIndex: 0.4 + Math.random() * 0.55, // 狗偏高的脉冲指数
    harmonicRichness: 0.1 + Math.random() * 0.4, // 狗较低的谐波
  };
}

/** 猫类模拟特征：平滑连续、高谐波、音调变化丰富 */
function generateCatMockFeatures(): AudioFeatures {
  const duration = 1.2 + Math.random() * 6; // 猫的单声更长
  const avgPitch = 280 + Math.random() * 750; // 280-1030 Hz 整体偏高
  const pitchSpread = Math.random() * 450; // 猫的音调变化更大

  return {
    duration: Math.round(duration * 10) / 10,
    avgPitch: Math.round(avgPitch),
    maxPitch: Math.round(avgPitch + pitchSpread),
    minPitch: Math.round(Math.max(150, avgPitch - pitchSpread * 0.5)),
    avgIntensity: 0.18 + Math.random() * 0.6, // 猫整体稍轻
    peakIntensity: 0.35 + Math.random() * 0.55,
    frequencyVariability: 0.15 + Math.random() * 0.55, // 猫音调变化更大
    hasRepeatPattern: Math.random() > 0.5,
    barkCount: Math.floor(1 + Math.random() * 7), // 猫的叫声次数偏少
    pulseIndex: 0.05 + Math.random() * 0.45, // 猫偏低的脉冲指数（平滑连续）
    harmonicRichness: 0.4 + Math.random() * 0.55, // 猫更高的谐波丰富度
  };
}

/**
 * 基于指定情绪生成倾向性特征（物种感知版）
 * @param emotion 目标情绪
 * @param species 宠物物种
 */
export function generateFeaturesForEmotion(
  emotion: PetEmotion,
  species: PetSpecies = "dog"
): AudioFeatures {
  if (species === "cat") {
    return generateCatFeaturesForEmotion(emotion);
  }
  return generateDogFeaturesForEmotion(emotion);
}

/** 犬类按情绪生成特征 */
function generateDogFeaturesForEmotion(emotion: PetEmotion): AudioFeatures {
  const dogBase: Record<PetEmotion, () => AudioFeatures> = {
    excited: () => ({
      duration: 1 + Math.random() * 3.5,
      avgPitch: 550 + Math.random() * 400,
      maxPitch: 950 + Math.random() * 300,
      minPitch: 380 + Math.random() * 200,
      avgIntensity: 0.6 + Math.random() * 0.32,
      peakIntensity: 0.78 + Math.random() * 0.22,
      frequencyVariability: 0.2 + Math.random() * 0.25,
      hasRepeatPattern: true,
      barkCount: 6 + Math.floor(Math.random() * 8),
      pulseIndex: 0.6 + Math.random() * 0.35,
      harmonicRichness: 0.15 + Math.random() * 0.3,
    }),
    happy: () => ({
      duration: 0.8 + Math.random() * 3.5,
      avgPitch: 280 + Math.random() * 320,
      maxPitch: 550 + Math.random() * 200,
      minPitch: 180 + Math.random() * 150,
      avgIntensity: 0.35 + Math.random() * 0.25,
      peakIntensity: 0.5 + Math.random() * 0.28,
      frequencyVariability: 0.1 + Math.random() * 0.22,
      hasRepeatPattern: Math.random() > 0.35,
      barkCount: 2 + Math.floor(Math.random() * 5),
      pulseIndex: 0.35 + Math.random() * 0.35,
      harmonicRichness: 0.18 + Math.random() * 0.3,
    }),
    hungry: () => ({
      duration: 2 + Math.random() * 5,
      avgPitch: 140 + Math.random() * 180,
      maxPitch: 340 + Math.random() * 150,
      minPitch: 80 + Math.random() * 70,
      avgIntensity: 0.35 + Math.random() * 0.28,
      peakIntensity: 0.5 + Math.random() * 0.32,
      frequencyVariability: 0.25 + Math.random() * 0.3,
      hasRepeatPattern: Math.random() > 0.4,
      barkCount: 2 + Math.floor(Math.random() * 6),
      pulseIndex: 0.2 + Math.random() * 0.35,
      harmonicRichness: 0.12 + Math.random() * 0.28,
    }),
    lonely: () => ({
      duration: 2.5 + Math.random() * 6,
      avgPitch: 220 + Math.random() * 200,
      maxPitch: 400 + Math.random() * 150,
      minPitch: 120 + Math.random() * 100,
      avgIntensity: 0.22 + Math.random() * 0.25,
      peakIntensity: 0.35 + Math.random() * 0.23,
      frequencyVariability: 0.08 + Math.random() * 0.2,
      hasRepeatPattern: false,
      barkCount: 1 + Math.floor(Math.random() * 3),
      pulseIndex: 0.1 + Math.random() * 0.3,
      harmonicRichness: 0.2 + Math.random() * 0.3,
    }),
    anxious: () => ({
      duration: 1 + Math.random() * 4,
      avgPitch: 420 + Math.random() * 450,
      maxPitch: 950 + Math.random() * 300,
      minPitch: 220 + Math.random() * 200,
      avgIntensity: 0.45 + Math.random() * 0.32,
      peakIntensity: 0.68 + Math.random() * 0.3,
      frequencyVariability: 0.42 + Math.random() * 0.42,
      hasRepeatPattern: Math.random() > 0.5,
      barkCount: 5 + Math.floor(Math.random() * 8),
      pulseIndex: 0.5 + Math.random() * 0.42,
      harmonicRichness: 0.15 + Math.random() * 0.35,
    }),
    angry: () => ({
      duration: 1 + Math.random() * 3.5,
      avgPitch: 120 + Math.random() * 200,
      maxPitch: 320 + Math.random() * 150,
      minPitch: 60 + Math.random() * 70,
      avgIntensity: 0.62 + Math.random() * 0.33,
      peakIntensity: 0.82 + Math.random() * 0.18,
      frequencyVariability: 0.1 + Math.random() * 0.22,
      hasRepeatPattern: Math.random() > 0.65,
      barkCount: 1 + Math.floor(Math.random() * 4),
      pulseIndex: 0.1 + Math.random() * 0.3,
      harmonicRichness: 0.08 + Math.random() * 0.25,
    }),
    neutral: () => ({
      duration: 0.8 + Math.random() * 3,
      avgPitch: 280 + Math.random() * 280,
      maxPitch: 480 + Math.random() * 200,
      minPitch: 160 + Math.random() * 140,
      avgIntensity: 0.3 + Math.random() * 0.28,
      peakIntensity: 0.45 + Math.random() * 0.3,
      frequencyVariability: 0.12 + Math.random() * 0.22,
      hasRepeatPattern: Math.random() > 0.5,
      barkCount: 1 + Math.floor(Math.random() * 4),
      pulseIndex: 0.3 + Math.random() * 0.4,
      harmonicRichness: 0.2 + Math.random() * 0.35,
    }),
  };

  return dogBase[emotion]?.() || dogBase.neutral();
}

/** 猫类按情绪生成特征 */
function generateCatFeaturesForEmotion(emotion: PetEmotion): AudioFeatures {
  const catBase: Record<PetEmotion, () => AudioFeatures> = {
    excited: () => ({
      // 猫兴奋 = 高音调chirp/chatter + 快速重复
      duration: 1.2 + Math.random() * 3,
      avgPitch: 700 + Math.random() * 400,
      maxPitch: 1100 + Math.random() * 300,
      minPitch: 480 + Math.random() * 250,
      avgIntensity: 0.5 + Math.random() * 0.35,
      peakIntensity: 0.72 + Math.random() * 0.28,
      frequencyVariability: 0.3 + Math.random() * 0.3,
      hasRepeatPattern: true,
      barkCount: 4 + Math.floor(Math.random() * 6),
      pulseIndex: 0.15 + Math.random() * 0.35,
      harmonicRichness: 0.55 + Math.random() * 0.38,
    }),
    happy: () => ({
      // 猫开心 = 柔和meow + 可能带呼噜
      duration: 1 + Math.random() * 4,
      avgPitch: 400 + Math.random() * 300,
      maxPitch: 700 + Math.random() * 250,
      minPitch: 280 + Math.random() * 180,
      avgIntensity: 0.28 + Math.random() * 0.28,
      peakIntensity: 0.45 + Math.random() * 0.28,
      frequencyVariability: 0.12 + Math.random() * 0.25,
      hasRepeatPattern: Math.random() > 0.3,
      barkCount: 1 + Math.floor(Math.random() * 4),
      pulseIndex: 0.08 + Math.random() * 0.3,
      harmonicRichness: 0.5 + Math.random() * 0.42,
    }),
    hungry: () => ({
      // 猫饥饿 = 中高音调 + 夸张的音调变化（经典讨食叫）
      duration: 1.5 + Math.random() * 4.5,
      avgPitch: 450 + Math.random() * 380,
      maxPitch: 900 + Math.random() * 250,
      minPitch: 300 + Math.random() * 180,
      avgIntensity: 0.35 + Math.random() * 0.3,
      peakIntensity: 0.52 + Math.random() * 0.32,
      frequencyVariability: 0.38 + Math.random() * 0.35,
      hasRepeatPattern: Math.random() > 0.35,
      barkCount: 2 + Math.floor(Math.random() * 6),
      pulseIndex: 0.12 + Math.random() * 0.35,
      harmonicRichness: 0.45 + Math.random() * 0.38,
    }),
    lonely: () => ({
      // 猫孤单 = 长声下降meow
      duration: 2.5 + Math.random() * 5.5,
      avgPitch: 350 + Math.random() * 280,
      maxPitch: 580 + Math.random() * 200,
      minPitch: 220 + Math.random() * 150,
      avgIntensity: 0.2 + Math.random() * 0.25,
      peakIntensity: 0.34 + Math.random() * 0.22,
      frequencyVariability: 0.1 + Math.random() * 0.22,
      hasRepeatPattern: false,
      barkCount: 1 + Math.floor(Math.random() * 3),
      pulseIndex: 0.05 + Math.random() * 0.25,
      harmonicRichness: 0.48 + Math.random() * 0.38,
    }),
    anxious: () => ({
      // 猫焦虑 = 紧张meow/yowl
      duration: 1.5 + Math.random() * 4,
      avgPitch: 500 + Math.random() * 450,
      maxPitch: 1000 + Math.random() * 300,
      minPitch: 300 + Math.random() * 220,
      avgIntensity: 0.4 + Math.random() * 0.3,
      peakIntensity: 0.65 + Math.random() * 0.3,
      frequencyVariability: 0.42 + Math.random() * 0.4,
      hasRepeatPattern: Math.random() > 0.5,
      barkCount: 2 + Math.floor(Math.random() * 6),
      pulseIndex: 0.15 + Math.random() * 0.4,
      harmonicRichness: 0.35 + Math.random() * 0.4,
    }),
    angry: () => ({
      // 猫愤怒 = hiss/growl（低频噪声为主）
      duration: 0.8 + Math.random() * 3,
      avgPitch: 200 + Math.random() * 280,
      maxPitch: 420 + Math.random() * 200,
      minPitch: 100 + Math.random() * 120,
      avgIntensity: 0.55 + Math.random() * 0.35,
      peakIntensity: 0.78 + Math.random() * 0.22,
      frequencyVariability: 0.15 + Math.random() * 0.28,
      hasRepeatPattern: Math.random() > 0.65,
      barkCount: 1 + Math.floor(Math.random() * 3),
      pulseIndex: 0.05 + Math.random() * 0.28,
      harmonicRichness: 0.08 + Math.random() * 0.3,
    }),
    neutral: () => ({
      // 猫普通 = 标准meow
      duration: 1 + Math.random() * 3.5,
      avgPitch: 400 + Math.random() * 320,
      maxPitch: 680 + Math.random() * 240,
      minPitch: 260 + Math.random() * 180,
      avgIntensity: 0.25 + Math.random() * 0.28,
      peakIntensity: 0.42 + Math.random() * 0.3,
      frequencyVariability: 0.15 + Math.random() * 0.25,
      hasRepeatPattern: Math.random() > 0.5,
      barkCount: 1 + Math.floor(Math.random() * 4),
      pulseIndex: 0.1 + Math.random() * 0.35,
      harmonicRichness: 0.4 + Math.random() * 0.4,
    }),
  };

  return catBase[emotion]?.() || catBase.neutral();
}

// ============================================================
// Web Audio API 真实音频分析（增强版：物种感知特征提取）
// ============================================================

/**
 * 使用 Web Audio API 分析音频 Blob 的真实特征（v2 增强版）
 *
 * 增加两个关键新特征：
 * - pulseIndex: 脉冲指数 — 检测声音是短促爆发式(狗bark)还是平滑连续(猫meow)
 * - harmonicRichness: 谐波丰富度 — 检测声音谐波复杂度
 *
 * @param audioBlob 音频 Blob 对象
 * @returns 提取的音频特征
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

          const channelData = audioBuffer.getChannelData(0);
          const sampleRate = audioBuffer.sampleRate;
          const len = channelData.length;

          // === 基础特征计算 ===
          let sumSquares = 0;
          let maxAmp = 0;

          for (let i = 0; i < len; i++) {
            const v = channelData[i];
            sumSquares += v * v;
            const av = Math.abs(v);
            if (av > maxAmp) maxAmp = av;
          }

          const rms = Math.sqrt(sumSquares / len);

          // === 过零率 → 基频估算 ===
          let zeroCrossings = 0;
          for (let i = 1; i < len; i++) {
            if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) {
              zeroCrossings++;
            }
          }
          const estimatedFreq = (zeroCrossings * sampleRate) / (2 * len);

          // === 能量包络分析（用于计算 pulseIndex）===
          // 将音频分成小窗口，计算每个窗口的能量
          const windowSize = Math.floor(sampleRate * 0.02); // 20ms 窗口
          const energyEnvelope: number[] = [];
          for (let start = 0; start < len - windowSize; start += windowSize) {
            let windowEnergy = 0;
            for (let j = start; j < start + windowSize && j < len; j++) {
              windowEnergy += channelData[j] * channelData[j];
            }
            energyEnvelope.push(windowEnergy / windowSize);
          }

          // 计算 pulseIndex: 能量变化的尖锐程度
          // 狗叫 = 尖锐的能量峰值（高脉冲）；猫叫 = 平滑的能量过渡（低脉冲）
          let energyChanges = 0;
          let peakCount = 0;
          const avgEnergy = energyEnvelope.reduce((a, b) => a + b, 0) / (energyEnvelope.length || 1);

          for (let i = 1; i < energyEnvelope.length; i++) {
            const delta = Math.abs(energyEnvelope[i] - energyEnvelope[i - 1]);
            energyChanges += delta;
            // 检测局部峰值（能量突然升高后降低）
            if (
              i > 0 && i < energyEnvelope.length - 1 &&
              energyEnvelope[i] > energyEnvelope[i - 1] * 1.5 &&
              energyEnvelope[i] > energyEnvelope[i + 1] * 1.2 &&
              energyEnvelope[i] > avgEnergy * 1.5
            ) {
              peakCount++;
            }
          }

          const normalizedChange = energyEnvelope.length > 1
            ? energyChanges / (energyEnvelope.length - 1) / (avgEnergy + 1e-8)
            : 0;
          const pulseIndex = Math.min(1, normalizedChange * 0.15 + (peakCount / 10));

          // === 谐波丰富度估算 ===
          // 使用简化方法：计算波形的光滑度（光滑=纯音/少谐波, 粗糙=多谐波/噪声）
          // 通过二阶差分来衡量波形复杂度
          let secondDiffSum = 0;
          const sampleStep = Math.max(1, Math.floor(len / 5000)); // 采样加速
          for (let i = sampleStep; i < len - sampleStep; i += sampleStep) {
            const d2 = Math.abs(channelData[i - sampleStep] - 2 * channelData[i] + channelData[i + sampleStep]);
            secondDiffSum += d2;
          }
          const avgSecondDiff = secondDiffSum / Math.max(1, (len / sampleStep) - 2);
          // 归一化到 0-1 范围（越高越粗糙=越多的谐波成分）
          const harmonicRichness = Math.min(1, Math.max(0, avgSecondDiff * 8));

          // === 叫声次数估算（基于能量峰值）===
          const barkEstimate = Math.max(1, peakCount + Math.floor(audioBuffer.duration / 1.2));

          // === 频率变化率 ===
          // 用前半段和后半段的过零率差异来近似
          const halfLen = Math.floor(len / 2);
          let zcFirstHalf = 0;
          let zcSecondHalf = 0;
          for (let i = 1; i < halfLen; i++) {
            if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) zcFirstHalf++;
          }
          for (let i = halfLen + 1; i < len; i++) {
            if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) zcSecondHalf++;
          }
          const freqFirst = (zcFirstHalf * sampleRate) / (2 * halfLen);
          const freqSecond = (zcSecondHalf * sampleRate) / (2 * (len - halfLen));
          const freqVariability = Math.min(1, Math.abs(freqFirst - freqSecond) / (estimatedFreq + 1));

          resolve({
            duration: audioBuffer.duration,
            avgPitch: Math.round(Math.max(60, estimatedFreq * 2.2)),
            maxPitch: Math.round(Math.max(80, estimatedFreq * 3.5)),
            minPitch: Math.round(Math.max(40, estimatedFreq * 0.7)),
            avgIntensity: Math.min(1, rms * 3.5),
            peakIntensity: Math.min(1, maxAmp),
            frequencyVariability: Math.max(0.1, Math.min(1, freqVariability + rms * 1.5)),
            hasRepeatPattern: audioBuffer.duration > 1.5 && peakCount > 1,
            barkCount: barkEstimate,
            pulseIndex: Math.max(0, Math.min(1, pulseIndex)),
            harmonicRichness: Math.max(0, Math.min(1, harmonicRichness)),
          });
        } catch {
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
