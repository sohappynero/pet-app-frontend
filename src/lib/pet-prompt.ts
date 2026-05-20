/**
 * AI 宠物心声 Prompt 工程模块
 * 包含人格引擎、情绪模板、Prompt 生成器
 */

import type { 
  Pet, 
  PetEmotion, 
  PetPersonality, 
  PetPersonalityConfig,
  PhotoMindResult,
  RoastResult,
  VoiceTranslateResult,
  InteractionSuggestion,
  PetSticker
} from "../types";

// ============================================================
// 宠物性格配置
// ============================================================

/** 宠物性格配置表 */
export const PET_PERSONALITY_CONFIGS: Record<PetPersonality, PetPersonalityConfig> = {
  energetic: {
    type: "energetic",
    traits: ["活泼好动", "精力充沛", "好奇心强", "爱冒险"],
    speechStyle: "话痨",
    catchphrases: ["冲冲冲！", "还有吗还有吗！", "太棒了！"]
  },
  calm: {
    type: "calm",
    traits: ["沉稳淡定", "不爱凑热闹", "独立自主", "优雅从容"],
    speechStyle: "高冷",
    catchphrases: ["哦...", "无聊...", "随便吧"]
  },
  playful: {
    type: "playful",
    traits: ["爱撒娇", "粘人", "会讨食", "会卖萌"],
    speechStyle: "撒娇",
    catchphrases: ["陪我玩嘛~", "摸摸头~", "好孤单哦~"]
  },
  shy: {
    type: "shy",
    traits: ["害羞怕生", "敏感细腻", "需要安全感", "依赖主人"],
    speechStyle: "贴心",
    catchphrases: ["有点怕怕...", "主人在就不怕了", "可以吗..."]
  },
  bossy: {
    type: "bossy",
    traits: ["霸道任性", "占有欲强", "爱发号施令", "很有主见"],
    speechStyle: "傲娇",
    catchphrases: ["这是我的！", "听我的！", "哼！"]
  },
  clingy: {
    type: "clingy",
    traits: ["粘人精", "分离焦虑", "需要关注", "爱刷存在感"],
    speechStyle: "撒娇",
    catchphrases: ["你在哪~", "别走别走！", "我想你啦~"]
  }
};

/** 根据宠物品种推断性格 */
export function inferPersonality(species: string, breed: string): PetPersonality {
  const lowerBreed = breed.toLowerCase();
  
  // 狗品种
  if (species === "dog") {
    if (lowerBreed.includes("金毛") || lowerBreed.includes("拉布拉多") || lowerBreed.includes("边牧")) {
      return "energetic";
    }
    if (lowerBreed.includes("柯基") || lowerBreed.includes("柴犬") || lowerBreed.includes("哈士奇")) {
      return "playful";
    }
    if (lowerBreed.includes("泰迪") || lowerBreed.includes("比熊") || lowerBreed.includes("马尔济斯")) {
      return "clingy";
    }
    if (lowerBreed.includes("法斗") || lowerBreed.includes("巴哥") || lowerBreed.includes("沙皮")) {
      return "calm";
    }
    return "playful";
  }
  
  // 猫品种
  if (species === "cat") {
    if (lowerBreed.includes("英短") || lowerBreed.includes("加菲") || lowerBreed.includes("布偶")) {
      return "calm";
    }
    if (lowerBreed.includes("美短") || lowerBreed.includes("狸花") || lowerBreed.includes("暹罗")) {
      return "playful";
    }
    if (lowerBreed.includes("波斯") || lowerBreed.includes("缅因") || lowerBreed.includes("挪威森林")) {
      return "shy";
    }
    if (lowerBreed.includes("无毛") || lowerBreed.includes("阿比")) {
      return "bossy";
    }
    return "calm";
  }
  
  return "playful";
}

// ============================================================
// 情绪模板
// ============================================================

/** 情绪标签映射 */
export const EMOTION_LABELS: Record<PetEmotion, string> = {
  excited: "超兴奋",
  anxious: "有点焦虑",
  hungry: "肚子饿",
  lonely: "好孤单",
  angry: "不开心",
  happy: "开心",
  neutral: "平静"
};

/** 情绪 Emoji */
export const EMOTION_EMOJIS: Record<PetEmotion, string> = {
  excited: "🤩",
  anxious: "😰",
  hungry: "🍖",
  lonely: "😢",
  angry: "😤",
  happy: "😊",
  neutral: "😐"
};

/** 情绪颜色 */
export const EMOTION_COLORS: Record<PetEmotion, string> = {
  excited: "#FF6B6B",
  anxious: "#FFE66D",
  hungry: "#FF9F43",
  lonely: "#74B9FF",
  angry: "#FF4757",
  happy: "#2ED573",
  neutral: "#A4B0BE"
};

/** 情绪到性格的语气映射 */
const EMOTION_TONE_MAP: Record<PetEmotion, Record<PetPersonality, string>> = {
  excited: {
    energetic: "超级兴奋地",
    calm: "稍微有点激动地",
    playful: "兴奋地蹭来蹭去",
    shy: "兴奋但有点紧张地",
    bossy: "趾高气扬地",
    clingy: "开心地围着转圈"
  },
  happy: {
    energetic: "开心地摇尾巴",
    calm: "满足地眯起眼睛",
    playful: "开心地打滚",
    shy: "害羞地蹭蹭",
    bossy: "得意地昂着头",
    clingy: "撒娇地蹭腿"
  },
  hungry: {
    energetic: "精神抖擞地讨食",
    calm: "淡定地看着你",
    playful: "卖萌讨食",
    shy: "小声哼唧",
    bossy: "霸道地要求喂食",
    clingy: "可怜巴巴地望着你"
  },
  lonely: {
    energetic: "到处找乐子",
    calm: "安静地等待",
    playful: "想找你玩",
    shy: "害怕地躲起来",
    bossy: "生气你不陪它",
    clingy: "一直缠着你"
  },
  anxious: {
    energetic: "坐立不安",
    calm: "警惕地观察四周",
    playful: "好奇又害怕",
    shy: "紧张地发抖",
    bossy: "烦躁地踱步",
    clingy: "紧紧跟着你"
  },
  angry: {
    energetic: "炸毛生气",
    calm: "冷淡地瞪着你",
    playful: "耍小脾气",
    shy: "委屈地生气",
    bossy: "非常不爽地吼叫",
    clingy: "赌气不理你"
  },
  neutral: {
    energetic: "东张西望",
    calm: "安静发呆",
    playful: "慵懒地打哈欠",
    shy: "警惕但平静",
    bossy: "高傲地巡视",
    clingy: "安静地陪着你"
  }
};

/** 获取特定情绪和性格下的语气描述 */
export function getEmotionTone(emotion: PetEmotion, personality: PetPersonality): string {
  return EMOTION_TONE_MAP[emotion]?.[personality] || "平静地";
}

// ============================================================
// 吐槽快捷指令
// ============================================================

export interface RoastQuickAction {
  id: string;
  label: string;
  icon: string;
  triggerContext?: Partial<{
    mood: string;
    timeOfDay: string;
    activityLevel: string;
  }>;
}

/** 预设吐槽快捷指令 */
export const ROAST_QUICK_ACTIONS: RoastQuickAction[] = [
  {
    id: "hungry",
    label: "肚子饿了",
    icon: "🍖",
    triggerContext: { mood: "饿了" }
  },
  {
    id: "play",
    label: "想玩耍",
    icon: "🎾",
    triggerContext: { activityLevel: "想玩" }
  },
  {
    id: "lonely",
    label: "好孤单",
    icon: "😢",
    triggerContext: { mood: "孤单" }
  },
  {
    id: "angry",
    label: "不开心",
    icon: "😤",
    triggerContext: { mood: "生气" }
  },
  {
    id: "sleepy",
    label: "困了",
    icon: "😴",
    triggerContext: { mood: "困" }
  },
  {
    id: "cold",
    label: "冷了",
    icon: "🥶",
    triggerContext: { mood: "冷" }
  }
];

// ============================================================
// 吐槽表情包/贴纸
// ============================================================

/** 宠物吐槽表情包 */
export const PET_ROAST_STICKERS: PetSticker[] = [
  // 通用
  { id: "stare", emoji: "👀", label: "盯着你", 适用性格: ["bossy", "calm"] },
  { id: "angry", emoji: "😤", label: "哼", 适用性格: ["bossy", "energetic"] },
  { id: "sad", emoji: "🥺", label: "可怜巴巴", 适用性格: ["playful", "clingy", "shy"] },
  { id: "love", emoji: "💕", label: "爱你", 适用性格: ["playful", "clingy"] },
  { id: "hungry", emoji: "🍖", label: "饿了", 适用性格: ["energetic", "playful"] },
  { id: "play", emoji: "🎾", label: "玩", 适用性格: ["energetic", "playful"] },
  { id: "sleep", emoji: "😴", label: "困了", 适用性格: ["calm", "shy"] },
  { id: "dance", emoji: "🕺", label: "开心", 适用性格: ["energetic", "playful"] },
  // 狗狗专属
  { id: "dog_wag", emoji: "🐕", label: "摇尾巴", 适用性格: ["energetic", "clingy"] },
  { id: "dog_tongue", emoji: "🐶", label: "吐舌头", 适用性格: ["playful"] },
  // 猫猫专属
  { id: "cat_angry", emoji: "🐱", label: "猫猫拳", 适用性格: ["bossy"] },
  { id: "cat_love", emoji: "😻", label: "亲亲", 适用性格: ["playful", "clingy"] },
];

/** 获取适用的表情包 */
export function getStickersForPersonality(personality: PetPersonality): PetSticker[] {
  return PET_ROAST_STICKERS.filter(
    s => !s.适用性格 || s.适用性格.includes(personality)
  );
}

// ============================================================
// Prompt 生成器
// ============================================================

/**
 * 构建照片心声 Prompt
 * 引导 AI 生成宠物的"内心 OS"
 */
export function buildPhotoMindPrompt(
  pet: Pet,
  personality: PetPersonality,
  imageDescription?: string
): string {
  const config = PET_PERSONALITY_CONFIGS[personality];
  const speciesName = pet.species === "dog" ? "狗狗" : pet.species === "cat" ? "猫咪" : "小可爱";
  
  return `你是${pet.name}，一只${pet.breed || speciesName}。

你的性格特点：${config.traits.join("、")}
你说话风格：${config.speechStyle}
你常说的话：${config.catchphrases.join("、")}

${imageDescription ? `你现在看到了自己的一张照片：${imageDescription}` : "请根据你的性格和当前状态，生成你的内心独白。"}

要求：
1. 用第一人称，像真正的宠物在思考
2. 不超过25个字
3. 要有${config.speechStyle}的语气
4. 可以带点情绪，比如傲娇、撒娇、吐槽
5. 要符合你的性格特点
6. 不要像AI助手那样说话
7. 可以带点宠物特有的小动作描述

直接输出内心OS，不要解释。`;
}

/**
 * 构建 AI 吐槽 Prompt
 * 根据宠物状态和用户行为生成吐槽
 */
export function buildRoastPrompt(
  pet: Pet,
  personality: PetPersonality,
  context: {
    mood?: string;
    lastInteractionDays?: number;
    activityLevel?: string;
    waterIntake?: string;
    sleepQuality?: string;
    appOpenFrequency?: string;
    timeOfDay?: string;
    quickAction?: string;
  }
): string {
  const config = PET_PERSONALITY_CONFIGS[personality];
  
  // 根据快捷指令调整上下文
  let moodHint = context.mood || "一般";
  if (context.quickAction === "hungry") moodHint = "肚子饿了";
  if (context.quickAction === "play") moodHint = "想玩耍";
  if (context.quickAction === "lonely") moodHint = "孤单想人陪";
  if (context.quickAction === "angry") moodHint = "不开心";
  if (context.quickAction === "sleepy") moodHint = "困了想睡觉";
  if (context.quickAction === "cold") moodHint = "觉得冷";
  
  const timeHint = context.timeOfDay || getTimeOfDay();
  
  const contextStr = `
宠物信息：
- 名字：${pet.name}
- 品种：${pet.breed || "未知"}
- 性格：${config.traits.join("、")}
- 说话风格：${config.speechStyle}

当前状态：
- 心情：${moodHint}
- 时间：${timeHint}
${context.lastInteractionDays !== undefined ? `- 距离上次互动：${context.lastInteractionDays}天` : ""}
${context.activityLevel ? `- 活动量：${context.activityLevel}` : ""}
${context.waterIntake ? `- 喝水量：${context.waterIntake}` : ""}
${context.sleepQuality ? `- 睡眠质量：${context.sleepQuality}` : ""}
`.trim();

  return `你是${pet.name}，一个有着${config.speechStyle}性格的小宠物。

${contextStr}

请用第一人称，生成一条宠物的"吐槽"或"心声"。
要求：
1. 长度控制在20个字以内
2. 符合宠物的性格特点
3. 要有${config.speechStyle}的语气
4. 可以表达不满、撒娇、抱怨、或者小期待
5. 不要像AI助手那样正式
6. 要接地气，像真正的宠物在想什么

直接输出吐槽内容，不要解释。`;
}

/** 获取当前时间段 */
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return "早上";
  if (hour >= 9 && hour < 12) return "上午";
  if (hour >= 12 && hour < 14) return "中午";
  if (hour >= 14 && hour < 18) return "下午";
  if (hour >= 18 && hour < 22) return "晚上";
  return "深夜";
}

/**
 * 构建声音翻译 Prompt
 * 分析音频特征后生成宠物语言
 */
export function buildVoiceTranslatePrompt(
  pet: Pet,
  personality: PetPersonality,
  emotion: PetEmotion,
  emotionScore: number
): string {
  const config = PET_PERSONALITY_CONFIGS[personality];
  const emotionLabel = EMOTION_LABELS[emotion];
  const speciesName = pet.species === "dog" ? "汪汪" : pet.species === "cat" ? "喵喵" : "吱吱";
  
  const confidence = emotionScore > 0.8 ? "非常确定" : emotionScore > 0.5 ? "有点" : "可能";
  
  return `你是${pet.name}，一只${pet.breed || speciesName}。

你的性格特点：${config.traits.join("、")}
你说话风格：${config.speechStyle}
你常说的话：${config.catchphrases.join("、")}

刚才你发出了${speciesName}叫的声音，
根据声音分析，你现在的情绪是：${confidence}${emotionLabel}（${Math.round(emotionScore * 100)}%置信度）

请用第一人称，生成你现在"想说的话"。
要求：
1. 长度控制在25个字以内
2. 用宠物的口吻，可以加"汪！"或"喵~"等叫声
3. 要有${config.speechStyle}的语气
4. 表达要自然，像宠物真的在说话
5. 可以带动作描写，比如"汪汪！摇尾巴"
6. 不要像AI助手那样正式

直接输出宠物语言，不要解释。`;
}

/**
 * 生成互动行为建议
 */
export function generateInteractionSuggestions(
  emotion: PetEmotion,
  personality: PetPersonality
): InteractionSuggestion[] {
  const suggestions: Record<PetEmotion, InteractionSuggestion[]> = {
    excited: [
      { action: "出门散步", description: "带它出去释放精力", icon: "🏃" },
      { action: "玩飞盘", description: "消耗它的热情", icon: "🥏" },
      { action: "训练互动", description: "趁它专注时训练", icon: "🎯" }
    ],
    happy: [
      { action: "抚摸奖励", description: "摸摸头或挠挠下巴", icon: "🤚" },
      { action: "一起玩耍", description: "陪它玩最喜欢的游戏", icon: "🎾" },
      { action: "拍照留念", description: "记录这美好时刻", icon: "📷" }
    ],
    hungry: [
      { action: "喂食", description: "检查食物是否充足", icon: "🍖" },
      { action: "添加零食", description: "可以给点健康小零食", icon: "🦴" },
      { action: "清洁水碗", description: "换上新鲜的水", icon: "💧" }
    ],
    lonely: [
      { action: "陪伴互动", description: "花15分钟陪它玩", icon: "🧸" },
      { action: "梳毛", description: "毛发护理增加亲密度", icon: "🪮" },
      { action: "语音安抚", description: "对它说说话让它安心", icon: "💬" }
    ],
    anxious: [
      { action: "轻声安抚", description: "用温柔的声音安慰它", icon: "🤗" },
      { action: "检查环境", description: "看看有没有让它害怕的东西", icon: "🔍" },
      { action: "给安全感", description: "把它抱到熟悉的地方", icon: "🏠" }
    ],
    angry: [
      { action: "给独立空间", description: "让它自己冷静一下", icon: "🚪" },
      { action: "检查身体", description: "看看有没有不舒服", icon: "🩺" },
      { action: "小零食哄", description: "用美食转移注意力", icon: "🍪" }
    ],
    neutral: [
      { action: "日常问候", description: "和它打个招呼", icon: "👋" },
      { action: "检查状态", description: "确认吃喝是否正常", icon: "📋" },
      { action: "简单互动", description: "陪它待一会儿", icon: "⏰" }
    ]
  };
  
  // 根据性格调整建议顺序
  const baseSuggestions = suggestions[emotion] || suggestions.neutral;
  
  if (personality === "clingy" || personality === "shy") {
    // 粘人或害羞的宠物优先陪伴建议
    return baseSuggestions.sort((a, b) => {
      if (a.action.includes("陪伴") || a.action.includes("安抚")) return -1;
      if (b.action.includes("陪伴") || b.action.includes("安抚")) return 1;
      return 0;
    });
  }
  
  if (personality === "bossy" || personality === "energetic") {
    // 霸道或活泼的宠物优先活动建议
    return baseSuggestions.sort((a, b) => {
      if (a.action.includes("出门") || a.action.includes("玩")) return -1;
      if (b.action.includes("出门") || b.action.includes("玩")) return 1;
      return 0;
    });
  }
  
  return baseSuggestions;
}

// ============================================================
// 模拟数据生成（用于演示/测试）
// ============================================================

/** 随机选择数组元素 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 模拟照片心声结果 */
export function mockPhotoMindResult(pet: Pet, personality: PetPersonality): PhotoMindResult {
  const config = PET_PERSONALITY_CONFIGS[personality];
  
  const expressions = ["眯眼微笑", "呆萌眨眼", "歪头卖萌", "严肃脸", "惊讶表情", "犯困打哈欠"];
  const postures = ["趴着", "坐着", "站着", "侧躺", "四脚朝天", "蜷缩"];
  
  // 根据性格生成不同的 OS
  const osTemplates: Record<PetPersonality, string[]> = {
    energetic: ["这角度拍我？再来一张！", "动起来！不要停！", "怎么还不带我出去玩！", "累了吗？本汪可是精力充沛！"],
    calm: ["哦，又是拍照...", "随便吧，反正我也习惯了", "这张还行吧...", "能不能让我再睡会儿..."],
    playful: ["看我看我！是不是超可爱~", "拍完了吗？快陪我玩！", "要摸摸~不要拍照！", "给个小零食我就配合~"],
    shy: ["别...别盯着我看啦...", "主人在就好~不怕了~", "这个姿势会不会很丑...", "抱抱我就不紧张了..."],
    bossy: ["哼，本主子赏脸给你拍", "这个角度更能突出我的帅气！", "你最好多拍几张！", "我是主角，要这样拍才对！"],
    clingy: ["只要主人在就好~", "你在拍我吗？好开心！", "不要走太远哦...", "摸我摸我~不要手机！"]
  };
  
  const os = randomPick(osTemplates[personality]);
  
  return {
    expression: randomPick(expressions),
    posture: randomPick(postures),
    mood: randomPick(["happy", "neutral", "excited"] as PetEmotion[]),
    moodScore: 0.6 + Math.random() * 0.4,
    mindOs: os,
    humorLevel: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low"
  };
}

/** 模拟吐槽结果 */
export function mockRoastResult(
  pet: Pet, 
  personality: PetPersonality,
  quickAction?: string
): RoastResult {
  // 根据快捷指令选择对应模板
  const actionTemplates: Record<string, Record<PetPersonality, string[]>> = {
    hungry: {
      energetic: ["汪汪汪！饭！饭！快给我！", "本汪的肚子已经抗议了！"],
      calm: ["哦...饭好了吗...", "随便吧，反正我也饿了..."],
      playful: ["摸摸~给饭饭~", "吃完还要玩球球！"],
      shy: ["主...主人...饿了...", "小声叫：可以吃饭了吗..."],
      bossy: ["给本汪准备好！这是命令！", "哼，到饭点了知道吗！"],
      clingy: ["饭饭~最爱主人了~", "主人喂的最好吃~"]
    },
    play: {
      energetic: ["球球！玩球球！冲鸭！", "跑起来！不要停！"],
      calm: ["嗯...玩一下也不是不行...", "随便吧，玩什么都行..."],
      playful: ["玩~玩~陪我玩嘛~", "最喜欢的游戏时间到啦！"],
      shy: ["可以...一起玩吗...", "有主人在就不怕了~"],
      bossy: ["听令！开始玩耍！", "本汪要玩最刺激的！"],
      clingy: ["一起玩！不要离开我！", "有主人在最开心~"]
    },
    lonely: {
      energetic: ["好无聊啊~有人吗~", "没人陪我都要发霉啦！"],
      calm: ["嗯...有点无聊...", "主人在哪呢..."],
      playful: ["陪陪我嘛~就一小会儿~", "想你想你想你！"],
      shy: ["主人在吗...有点怕...", "躲在这里等主人..."],
      bossy: ["怎么没人理我！", "哼！都不陪我！"],
      clingy: ["别走别走！抱抱！", "想你啦~你怎么才来~"]
    },
    angry: {
      energetic: ["哼！生气！不理你了！", "本汪很不爽！"],
      calm: ["哦...有点不高兴...", "随便吧...不想说话..."],
      playful: ["哼！不跟我玩！", "委屈巴巴..."],
      shy: ["呜...主人不喜欢我了吗...", "有点难过..."],
      bossy: ["气死我了！你给我等着！", "哼！非常不爽！"],
      clingy: ["不要不要不要！", "呜...你欺负我..."]
    },
    sleepy: {
      energetic: ["嗯...有点困了...", "再玩五分钟就睡！"],
      calm: ["嗯...困了...", "让我睡会儿..."],
      playful: ["好困~抱抱睡~", "陪我睡嘛~"],
      shy: ["睡了...别走开...", "抱着睡好不好..."],
      bossy: ["退下！本汪要睡了！", "嗯...困了..."],
      clingy: ["陪我睡~不要离开~", "一起睡好不好~"]
    },
    cold: {
      energetic: ["有点冷...可以抱抱吗...", "冷！需要温暖！"],
      calm: ["嗯...冷...", "找个暖和的地方..."],
      playful: ["冷~要抱抱取暖~", "钻被窝~"],
      shy: ["冷...主人在就不怕...", "抱抱我好不好..."],
      bossy: ["给本汪开暖气！", "冷冷冷！伺候好！"],
      clingy: ["抱抱~冷~", "和主人一起最暖和~"]
    }
  };
  
  // 通用模板
  const genericTemplates: Record<PetPersonality, string[]> = {
    energetic: [
      "主人！球呢？球球！我要玩球！",
      "天天在家都要发霉啦！",
      "我是拆家小能手，不是乖乖小宠物！",
      "汪汪汪！冲鸭！",
      "还有吗还有吗！"
    ],
    calm: [
      "无所谓，反正我只是想睡觉...",
      "你开心就好，我只想躺着",
      "饭点到了吗？我好像饿了...",
      "哦...",
      "随便吧..."
    ],
    playful: [
      "陪我玩嘛~就一小会儿~求求了~",
      "主人你是不是有别的宠物了！",
      "摸我摸我~不要看手机啦！",
      "给个小零食我就配合~",
      "快来快来~"
    ],
    shy: [
      "有点害怕...主人在吗...",
      "能抱抱我吗...我不舒服...",
      "外面好吵...躲一会儿...",
      "主人在就不怕了~",
      "可以吗..."
    ],
    bossy: [
      "这是我的位置！让开！",
      "听好了，本汪今天要吃罐头！",
      "你怎么还不喂我！反了你了！",
      "哼！本主子的地盘！",
      "给本汪准备最好的！"
    ],
    clingy: [
      "别走...别丢下我...",
      "想你啦~你怎么才来~",
      "抱抱~抱抱~就要抱抱！",
      "你在哪~我要跟着~",
      "不要离开我嘛~"
    ]
  };
  
  // 优先使用快捷指令对应的模板
  const templates = quickAction && actionTemplates[quickAction]
    ? actionTemplates[quickAction][personality] || genericTemplates[personality]
    : genericTemplates[personality];
  
  const message = randomPick(templates);
  
  // 根据快捷指令推断类型
  const typeMap: Record<string, RoastResult["roastType"]> = {
    hungry: "demand",
    play: "demand",
    lonely: "empathy",
    angry: "complaint",
    sleepy: "empathy",
    cold: "empathy"
  };
  
  return {
    roastMessage: message,
    roastType: typeMap[quickAction || ""] || randomPick(["complaint", "demand", "empathy", "tease"] as const),
    triggerReason: quickAction ? `用户触发：${quickAction}` : "随机生成",
    suggestedAction: getSuggestedAction(quickAction, personality)
  };
}

/** 获取建议动作 */
function getSuggestedAction(quickAction?: string, personality?: PetPersonality): string {
  const actionMap: Record<string, string> = {
    hungry: "准备食物",
    play: "陪它玩耍",
    lonely: "多陪伴",
    angry: "安抚情绪",
    sleepy: "让它休息",
    cold: "保暖"
  };
  return quickAction ? actionMap[quickAction] || "陪伴宠物" : "多陪陪它";
}

/** 模拟声音翻译结果 */
export function mockVoiceTranslateResult(pet: Pet, personality: PetPersonality): VoiceTranslateResult {
  const emotions: PetEmotion[] = ["excited", "happy", "hungry", "lonely", "anxious", "angry"];
  const emotion = randomPick(emotions);
  
  const languageTemplates: Record<PetEmotion, string[]> = {
    excited: ["汪汪汪！太开心了！", "喵喵喵！快快快！", "冲鸭冲鸭！！", "出去玩！出去玩！"],
    happy: ["喵~好舒服~", "汪！谢谢主人~", "嘿嘿，今天心情不错", "有人陪我真好~"],
    hungry: ["汪！饿了饿了！", "喵呜...肚子空空...", "饭饭！给我饭饭！", "还没吃吗..."],
    lonely: ["呜...陪我...", "汪汪？（主人在哪）", "好孤单啊...", "喵...我在这儿..."],
    anxious: ["呜...有点怕怕...", "汪汪！（什么声音！）", "喵...怎么这样...", "不对劲...小心点..."],
    angry: ["汪！！！（离我远点）", "哼！不高兴！", "喵！！（你烦不烦）", "生气的啦！不理你！"],
    neutral: ["嗯？怎么了？", "汪~", "喵~在呢~", "有事吗？"]
  };
  
  return {
    emotion,
    emotionScore: 0.6 + Math.random() * 0.4,
    aiLanguage: randomPick(languageTemplates[emotion]),
    suggestions: generateInteractionSuggestions(emotion, personality)
  };
}
