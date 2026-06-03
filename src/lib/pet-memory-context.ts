/**
 * AI 宠物长期记忆与上下文系统
 * 
 * 功能：
 * 1. 聊天消息 localStorage 持久化
 * 2. 宠物状态画像构建（基于健康数据、互动记录、时间等）
 * 3. 上下文感知的时间触发机制
 * 4. 互动行为追踪与分析
 */

import type { 
  Pet, 
  ChatMessage as BaseChatMessage,
  MessageSource,
  PhotoMindResult,
  VoiceTranslateResult,
  RoastResult,
  PetSticker,
  HealthRecord,
  PetEmotion,
  PetPersonality
} from "../types";

// ============================================================
// 类型定义
// ============================================================

/** 扩展的聊天消息类型（用于本地存储） */
export interface StoredChatMessage extends BaseChatMessage {
  source: MessageSource;
  photoMind?: PhotoMindResult;
  photoUrl?: string;
  voiceResult?: VoiceTranslateResult;
  audioUrl?: string;
  roastResult?: RoastResult;
  sticker?: PetSticker;
  emotion?: PetEmotion;
}

/** 互动事件记录 */
export interface InteractionEvent {
  id: string;
  type: "message_sent" | "message_received" | "photo_uploaded" | "voice_recorded" 
    | "roast_generated" | "sticker_sent" | "page_opened" | "manual_trigger";
  timestamp: number;
  petId: number;
  details?: Record<string, unknown>;
}

/** 宠物状态画像 */
export interface PetProfile {
  /** 宠物基础信息 */
  petId: number;
  petName: string;
  species: string;
  breed: string;
  personality: PetPersonality;
  
  /** 活跃度评估 */
  activityLevel: {
    score: number;           // 0-100
    label: "inactive" | "low" | "moderate" | "high" | "very_high";
    todayMessageCount: number;
    todayInteractionCount: number;
    lastInteractionTime?: number;
    idleMinutes: number;
  };
  
  /** 心情趋势 */
  moodTrend: {
    currentMood: PetEmotion;
    moodHistory: Array<{ mood: PetEmotion; timestamp: number; source: string }>;
    dominantMood: PetEmotion;
    moodStability: "stable" | "fluctuating" | "unstable";
  };
  
  /** 时间上下文 */
  timeContext: {
    timeOfDay: "morning" | "noon" | "afternoon" | "evening" | "night" | "midnight";
    dayOfWeek: string;
    isMealTime: boolean;
    isSleepTime: boolean;
    isWeekend: boolean;
    lastVisitHourAgo?: number;
  };
  
  /** 健康快照（最近一条记录） */
  healthSnapshot?: {
    lastRecordDate: string;
    weightKg?: number | null;
    appetite: string;
    overallMood: string;
    daysSinceLastCheckup?: number;
  };
  
  /** 对话主题统计 */
  topicSummary: {
    topics: Array<{ keyword: string; count: number; lastMentioned: number }>;
    recentKeywords: string[];
  };
  
  /** 记忆摘要（用于 Prompt 上下文） */
  memoryDigest: {
    totalMessages: number;
    firstInteractionDate?: string;
    favoriteActivity?: string;
    commonRequests: string[];
    personalityNotes: string[];
    recentHighlights: string[];   // 最近 5 条重要对话摘要
  };
}

/** 存储配置 */
export interface MemoryConfig {
  /** 最大保存消息数 */
  maxMessages: number;
  /** 最大保存互动事件数 */
  maxEvents: number;
  /** 消息过期时间（毫秒），默认 30 天 */
  messageExpiry: number;
  /** 自动保存间隔（毫秒），0 表示手动保存 */
  autoSaveInterval: number;
  /** 是否启用分析 */
  enableAnalytics: boolean;
}

// ============================================================
// 常量配置
// ============================================================

const STORAGE_PREFIX = "pet_chat_";
const STORAGE_MESSAGES = "_messages";
const STORAGE_EVENTS = "_events";
const STORAGE_PROFILE = "_profile";
const STORAGE_SETTINGS = "_settings";

export const DEFAULT_MEMORY_CONFIG: MemoryConfig = {
  maxMessages: 500,
  maxEvents: 1000,
  messageExpiry: 30 * 24 * 60 * 60 * 1000, // 30 天
  autoSaveInterval: 5000,                   // 5 秒自动保存
  enableAnalytics: true
};

// ============================================================
// 时间工具函数
// ============================================================

function getTimeOfDay(): PetProfile["timeContext"]["timeOfDay"] {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 9) return "morning";
  if (hour >= 9 && hour < 12) return "noon";
  if (hour >= 12 && hour < 14) return "afternoon";
  if (hour >= 14 && hour < 18) return "evening";
  if (hour >= 18 && hour < 22) return "night";
  return "midnight";
}

function getDayOfWeek(): string {
  const days = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return days[new Date().getDay()];
}

function isMealTime(): boolean {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  // 早饭 7-9，午饭 11-13，晚饭 18-20
  return (hour >= 7 && hour < 9) || (hour >= 11 && hour < 13) || (hour >= 18 && hour < 20);
}

function isSleepTime(): boolean {
  const hour = new Date().getHours();
  return hour >= 23 || hour < 6;
}

function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

// ============================================================
// 核心类：PetMemoryContext
// ============================================================

export class PetMemoryContext {
  private petId: number;
  private config: MemoryConfig;
  private messages: StoredChatMessage[] = [];
  private events: InteractionEvent[] = [];
  private profile: PetProfile | null = null;
  private saveTimer: NodeJS.Timeout | null = null;
  private dirty: boolean = false;
  private listeners: Array<(type: string, data?: unknown) => void> = [];

  constructor(petId: number, config: Partial<MemoryConfig> = {}) {
    this.petId = petId;
    this.config = { ...DEFAULT_MEMORY_CONFIG, ...config };
    
    // 从 localStorage 加载数据
    this.loadFromStorage();
  }

  // ============================================================
  // 消息管理 API
  // ============================================================

  /**
   * 获取所有消息（只读）
   */
  getMessages(): Readonly<StoredChatMessage[]> {
    return [...this.messages];
  }

  /**
   * 添加新消息
   */
  addMessage(msg: StoredChatMessage): void {
    this.messages.push(msg);
    this.dirty = true;
    
    // 记录互动事件
    this.recordEvent({
      type: msg.type === "human" ? "message_sent" : "message_received",
      details: { messageId: msg.id, source: msg.source }
    });
    
    // 触发自动保存
    this.scheduleAutoSave();
    
    // 通知监听器
    this.emit("messageAdded", msg);
  }

  /**
   * 批量设置消息（用于从存储恢复）
   */
  setMessages(messages: StoredChatMessage[]): void {
    this.messages = messages;
    this.dirty = true;
    this.scheduleAutoSave();
  }

  /**
   * 清空消息
   */
  clearMessages(): void {
    this.messages = [];
    this.events = [];
    this.profile = null;
    this.dirty = true;
    this.saveToStorage();
    this.emit("cleared");
  }

  /**
   * 删除单条消息
   */
  removeMessage(messageId: number): void {
    this.messages = this.messages.filter(m => m.id !== messageId);
    this.dirty = true;
    this.scheduleAutoSave();
  }

  /**
   * 获取最近 N 条消息
   */
  getRecentMessages(count: number): StoredChatMessage[] {
    return this.messages.slice(-count);
  }

  /**
   * 获取今天的消息数量
   */
  getTodayMessageCount(): number {
    const today = new Date().toDateString();
    return this.messages.filter(m => {
      try {
        return new Date(m.id).toDateString() === today;
      } catch {
        return false;
      }
    }).length;
  }

  // ============================================================
  // 互动事件追踪
  // ============================================================

  /**
   * 记录互动事件
   */
  recordEvent(event: Partial<InteractionEvent> & { type: InteractionEvent["type"] }): void {
    const fullEvent: InteractionEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      petId: this.petId,
      ...event
    };

    this.events.push(fullEvent);
    
    // 限制事件数量
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }
    
    this.dirty = true;
    this.emit("eventRecorded", fullEvent);
  }

  /**
   * 获取最近的互动事件
   */
  getRecentEvents(count: number, type?: InteractionEvent["type"]): InteractionEvent[] {
    let events = this.events;
    if (type) {
      events = events.filter(e => e.type === type);
    }
    return events.slice(-count);
  }

  /**
   * 获取距离上次互动的时间（分钟）
   */
  getIdleMinutes(): number {
    if (this.events.length === 0) return Infinity;
    
    const lastEvent = this.events[this.events.length - 1];
    return (Date.now() - lastEvent.timestamp) / (1000 * 60);
  }

  /**
   * 获取今天互动次数
   */
  getTodayInteractionCount(): number {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    return this.events.filter(e => e.timestamp >= todayStart.getTime()).length;
  }

  // ============================================================
  // 宠物状态画像构建
  // ============================================================

  /**
   * 构建完整的宠物状态画像
   */
  buildProfile(pet: Pet, personality: PetPersonality, healthRecords?: HealthRecord[]): PetProfile {
    const now = Date.now();
    
    // 1. 计算活跃度
    const todayMsgCount = this.getTodayMessageCount();
    const todayInteractions = this.getTodayInteractionCount();
    const idleMinutes = this.getIdleMinutes();
    
    let activityScore = Math.min(100, (todayMsgCount + todayInteractions) * 10);
    if (idleMinutes > 60) activityScore = Math.max(0, activityScore - (idleMinutes - 60));
    if (idleMinutes <= 10) activityScore += 20;
    
    let activityLabel: PetProfile["activityLevel"]["label"] = "inactive";
    if (activityScore >= 80) activityLabel = "very_high";
    else if (activityScore >= 60) activityLabel = "high";
    else if (activityScore >= 40) activityLabel = "moderate";
    else if (activityScore >= 20) activityLabel = "low";

    // 2. 分析心情趋势
    const moodHistory = this.extractMoodHistory();
    const dominantMood = this.calculateDominantMood(moodHistory);
    const moodStability = this.calculateMoodStability(moodHistory);

    // 3. 构建时间上下文
    const lastInteractionEvent = [...this.events].reverse().find(
      e => e.type !== "page_opened"
    );
    
    // 4. 健康快照
    const healthSnapshot = healthRecords && healthRecords.length > 0 
      ? this.buildHealthSnapshot(healthRecords)
      : undefined;

    // 5. 对话主题分析
    const topicSummary = this.analyzeTopics();

    // 6. 记忆摘要
    const memoryDigest = this.buildMemoryDigest(pet);

    this.profile = {
      petId: pet.id,
      petName: pet.name,
      species: pet.species,
      breed: pet.breed,
      personality,
      
      activityLevel: {
        score: Math.round(activityScore),
        label: activityLabel,
        todayMessageCount: todayMsgCount,
        todayInteractionCount: todayInteractions,
        lastInteractionTime: lastInteractionEvent?.timestamp,
        idleMinutes: Math.round(idleMinutes)
      },
      
      moodTrend: {
        currentMood: moodHistory[moodHistory.length - 1]?.mood || "neutral",
        moodHistory: moodHistory.slice(-20), // 只保留最近 20 条
        dominantMood,
        moodStability
      },
      
      timeContext: {
        timeOfDay: getTimeOfDay(),
        dayOfWeek: getDayOfWeek(),
        isMealTime: isMealTime(),
        isSleepTime: isSleepTime(),
        isWeekend: isWeekend(),
        lastVisitHourAgo: lastInteractionEvent 
          ? Math.round((now - lastInteractionEvent.timestamp) / (1000 * 60 * 60))
          : undefined
      },
      
      healthSnapshot,
      topicSummary,
      memoryDigest
    };
    
    this.dirty = true;
    this.saveToStorage();
    
    return this.profile;
  }

  /**
   * 获取当前画像（不重建）
   */
  getProfile(): PetProfile | null {
    return this.profile;
  }

  /**
   * 生成用于 AI Prompt 的上下文字符串
   */
  generatePromptContext(profile: PetProfile): string {
    const lines: string[] = [];
    
    lines.push(`【${profile.petName}的当前状态】`);
    
    // 活跃度
    const { activityLevel } = profile;
    lines.push(`- 活跃程度：${activityLevel.label} (${activityLevel.score}分)`);
    lines.push(`- 今日互动：${activityLevel.todayInteractionCount}次`);
    
    if (activityLevel.idleMinutes < 60) {
      lines.push(`- 最近刚互动过（${Math.round(activityLevel.idleMinutes)}分钟前）`);
    } else if (activityLevel.idleMinutes < 1440) {
      lines.push(`- 已有 ${Math.round(activityLevel.idleMinutes / 60)} 小时没互动了`);
    } else {
      lines.push(`- 已有 ${Math.round(activityLevel.idleMinutes / 1440)} 天没互动了`);
    }
    
    // 心情
    const { moodTrend } = profile;
    lines.push(`- 当前心情：${moodTrend.currentMood}`);
    lines.push(`- 心情稳定性：${moodTrend.moodStability}`);
    
    // 时间
    const { timeContext } = profile;
    const timeNames = {
      morning: "早上",
      noon: "上午",
      afternoon: "下午",
      evening: "傍晚",
      night: "晚上",
      midnight: "深夜/凌晨"
    };
    lines.push(`- 现在是：${timeContext.dayOfWeek} ${timeNames[timeContext.timeOfDay]}`);
    
    if (timeContext.isMealTime) lines.push("- 正好是饭点时间~");
    if (timeContext.isSleepTime) lines.push("- 应该睡觉了");
    if (timeContext.isWeekend) lines.push("- 今天是周末");
    
    // 记忆亮点
    if (profile.memoryDigest.recentHighlights.length > 0) {
      lines.push("\n【最近聊过的话题】");
      profile.memoryDigest.recentHighlights.forEach((h, i) => {
        lines.push(`${i + 1}. ${h}`);
      });
    }
    
    // 健康提示
    if (profile.healthSnapshot) {
      const hs = profile.healthSnapshot;
      lines.push("\n【健康提醒】");
      if (hs.daysSinceLastCheckup && hs.daysSinceLastCheckup > 30) {
        lines.push(`- 距离上次体检已经 ${hs.daysSinceLastCheckup} 天了`);
      }
      if (hs.appetite && hs.appetite.includes("差")) {
        lines.push("- 最近食欲不太好");
      }
    }
    
    return lines.join("\n");
  }

  // ============================================================
  // 内部方法：心情分析
  // ============================================================

  private extractMoodHistory(): Array<{ mood: PetEmotion; timestamp: number; source: string }> {
    const history: Array<{ mood: PetEmotion; timestamp: number; source: string }> = [];
    
    for (const msg of this.messages) {
      let mood: PetEmotion | null = null;
      let source = "";
      
      if (msg.source === "ai_photo_mind" && msg.photoMind) {
        mood = msg.photoMind.mood;
        source = "photo";
      } else if (msg.source === "ai_voice" && msg.voiceResult) {
        mood = msg.voiceResult.emotion;
        source = "voice";
      } else if (msg.source === "ai_roast" && msg.roastResult) {
        // 根据 roastType 推断情绪
        const typeMoodMap: Record<string, PetEmotion> = {
          complaint: "angry",
          demand: "hungry",
          empathy: "lonely",
          tease: "happy"
        };
        mood = typeMoodMap[msg.roastResult.roastType] || "neutral";
        source = "roast";
      }
      
      if (mood) {
        history.push({ mood, timestamp: msg.id, source });
      }
    }
    
    return history;
  }

  private calculateDominantMood(history: Array<{ mood: PetEmotion; timestamp: number }>): PetEmotion {
    if (history.length === 0) return "neutral";
    
    // 统计最近的心情出现频率（越近权重越高）
    const moodCounts: Record<string, number> = {};
    const now = Date.now();
    
    for (const entry of history) {
      const ageHours = (now - entry.timestamp) / (1000 * 60 * 60);
      // 24小时内权重为 1，之后衰减
      const weight = ageHours < 24 ? 1 : Math.max(0.1, 1 - ageHours / 168); // 一周内线性衰减
      
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + weight;
    }
    
    // 找出最高的
    let maxMood: PetEmotion = "neutral";
    let maxCount = 0;
    for (const [mood, count] of Object.entries(moodCounts)) {
      if (count > maxCount) {
        maxCount = count;
        maxMood = mood as PetEmotion;
      }
    }
    
    return maxMood;
  }

  private calculateMoodStability(history: Array<{ mood: PetEmotion; timestamp: number }>): PetProfile["moodTrend"]["moodStability"] {
    if (history.length < 3) return "stable";
    
    // 取最近的记录
    const recent = history.slice(-10);
    
    // 计算心情变化次数
    let changes = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i].mood !== recent[i - 1].mood) changes++;
    }
    
    const changeRate = changes / (recent.length - 1);
    
    if (changeRate > 0.6) return "unstable";
    if (changeRate > 0.3) return "fluctuating";
    return "stable";
  }

  // ============================================================
  // 内部方法：健康快照
  // ============================================================

  private buildHealthSnapshot(records: HealthRecord[]): PetProfile["healthSnapshot"] {
    // 排序获取最新记录
    const sorted = [...records].sort((a, b) => 
      new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
    );
    
    const latest = sorted[0];
    
    // 找最近的体检记录
    const lastCheckup = sorted.find(r => r.record_type === "checkup");
    const daysSinceCheckup = lastCheckup 
      ? Math.floor((Date.now() - new Date(lastCheckup.record_date).getTime()) / (1000 * 60 * 60 * 24))
      : undefined;
    
    return {
      lastRecordDate: latest?.record_date || "",
      weightKg: latest?.weight_kg,
      appetite: latest?.appetite || "正常",
      overallMood: latest?.mood || "正常",
      daysSinceLastCheckup: daysSinceCheckup
    };
  }

  // ============================================================
  // 内部方法：话题分析
  // ============================================================

  private analyzeTopics(): PetProfile["topicSummary"] {
    const keywordCounts: Record<string, { count: number; lastMentioned: number }> = {};
    
    // 关键词提取规则
    const keywords = [
      "吃", "饿", "饭", "罐头", "零食", "食物",
      "玩", "球", "散步", "公园", "跑", "玩具",
      "睡", "困", "觉", "休息",
      "抱", "摸", "亲", "爱",
      "洗澡", "美容", "医生", "打针"
    ];
    
    for (const msg of this.messages) {
      const text = msg.text.toLowerCase();
      for (const kw of keywords) {
        if (text.includes(kw)) {
          if (!keywordCounts[kw]) {
            keywordCounts[kw] = { count: 0, lastMentioned: 0 };
          }
          keywordCounts[kw].count++;
          keywordCounts[kw].lastMentioned = Math.max(keywordCounts[kw].lastMentioned, msg.id);
        }
      }
    }
    
    // 排序取前 10
    const sortedTopics = Object.entries(keywordCounts)
      .map(([keyword, data]) => ({ keyword, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // 提取最近关键词
    const recentKeywords = sortedTopics
      .filter(t => t.lastMentioned > Date.now() - 7 * 24 * 60 * 60 * 1000) // 一周内
      .map(t => t.keyword)
      .slice(0, 5);
    
    return {
      topics: sortedTopics,
      recentKeywords
    };
  }

  // ============================================================
  // 内部方法：记忆摘要
  // ============================================================

  private buildMemoryDigest(pet: Pet): PetProfile["memoryDigest"] {
    const totalMessages = this.messages.length;
    
    // 首次互动日期
    const firstMessage = this.messages[0];
    const firstInteractionDate = firstMessage 
      ? new Date(firstMessage.id).toLocaleDateString("zh-CN")
      : undefined;
    
    // 最常讨论的活动（从话题分析中提取）
    const topTopic = this.analyzeTopics().topics[0]?.keyword;
    
    // 常见请求模式
    const requestPatterns = this.extractRequestPatterns();
    
    // 性格笔记
    const personalityNotes = this.generatePersonalityNotes();
    
    // 最近高亮
    const recentHighlights = this.extractRecentHighlights();

    return {
      totalMessages,
      firstInteractionDate,
      favoriteActivity: topTopic,
      commonRequests: requestPatterns,
      personalityNotes,
      recentHighlights
    };
  }

  private extractRequestPatterns(): string[] {
    const patterns: Record<string, number> = {};
    
    for (const msg of this.messages) {
      if (msg.type !== "human") continue;
      
      const text = msg.text;
      if (text.includes("吃") || text.includes("饿") || text.includes("饭")) patterns["喜欢美食"]++;
      if (text.includes("玩") || text.includes("跑") || text.includes("散步")) patterns["爱运动"]++;
      if (text.includes("摸") || text.includes("抱") || text.includes("亲")) patterns["需要陪伴"]++;
      if (text.includes("漂亮") || text.includes("可爱") || text.includes("乖")) patterns["被夸奖"]++;
    }
    
    return Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([p]) => p);
  }

  private generatePersonalityNotes(): string[] {
    const notes: string[] = [];
    
    const avgResponseTime = this.calculateAverageResponseTime();
    if (avgResponseTime && avgResponseTime < 2000) {
      notes.push("响应很积极，可能性格活泼");
    } else if (avgResponseTime && avgResponseTime > 60000) {
      notes.push("响应较慢，可能比较独立或忙碌");
    }
    
    const stickerUsage = this.messages.filter(m => m.sticker).length;
    const totalPetMsgs = this.messages.filter(m => m.type !== "human").length;
    if (totalPetMsgs > 0 && stickerUsage / totalPetMsgs > 0.3) {
      notes.push("喜欢用表情表达情绪");
    }
    
    return notes;
  }

  private calculateAverageResponseTime(): number | null {
    let totalTime = 0;
    let count = 0;
    
    for (let i = 1; i < this.messages.length; i++) {
      if (this.messages[i].type !== "human" && this.messages[i - 1].type === "human") {
        totalTime += this.messages[i].id - this.messages[i - 1].id;
        count++;
      }
    }
    
    return count > 0 ? totalTime / count : null;
  }

  private extractRecentHighlights(): string[] {
    // 提取最近的重要消息作为记忆亮点
    const highlights: string[] = [];
    
    // 取最近的非普通聊天消息
    const importantMsgs = this.messages
      .filter(m => m.source.startsWith("ai_"))
      .slice(-5);
    
    for (const msg of importantMsgs) {
      let highlight = "";
      if (msg.source === "ai_photo_mind") {
        highlight = `拍照时说："${msg.text}"`;
      } else if (msg.source === "ai_roast") {
        highlight = `吐槽说："${msg.text}"`;
      } else if (msg.source === "ai_voice") {
        highlight = `声音翻译："${msg.text}"`;
      }
      
      if (highlight) highlights.push(highlight);
    }
    
    return highlights.slice(0, 5);
  }

  // ============================================================
  // 持久化方法
  // ============================================================

  /**
   * 保存到 localStorage
   */
  saveToStorage(): void {
    if (!this.dirty) return;
    
    try {
      const key = `${STORAGE_PREFIX}${this.petId}`;
      
      localStorage.setItem(
        key + STORAGE_MESSAGES,
        JSON.stringify(this.messages.slice(-this.config.maxMessages))
      );
      
      localStorage.setItem(
        key + STORAGE_EVENTS,
        JSON.stringify(this.events.slice(-this.config.maxEvents))
      );
      
      if (this.profile) {
        localStorage.setItem(key + STORAGE_PROFILE, JSON.stringify(this.profile));
      }
      
      this.dirty = false;
      // 已保存数据到 localStorage
    } catch (error) {
      console.error("[PetMemoryContext] 保存失败:", error);
    }
  }

  /**
   * 从 localStorage 加载
   */
  loadFromStorage(): void {
    try {
      const key = `${STORAGE_PREFIX}${this.petId}`;
      
      const messagesData = localStorage.getItem(key + STORAGE_MESSAGES);
      if (messagesData) {
        this.messages = JSON.parse(messagesData);
      }
      
      const eventsData = localStorage.getItem(key + STORAGE_EVENTS);
      if (eventsData) {
        this.events = JSON.parse(eventsData);
      }
      
      const profileData = localStorage.getItem(key + STORAGE_PROFILE);
      if (profileData) {
        this.profile = JSON.parse(profileData);
      }
      
      // 已从 localStorage 加载数据
    } catch (error) {
      console.error("[PetMemoryContext] 加载失败:", error);
    }
  }

  /**
   * 安排自动保存
   */
  private scheduleAutoSave(): void {
    if (this.config.autoSaveInterval <= 0) return;
    
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    
    this.saveTimer = setTimeout(() => {
      this.saveToStorage();
    }, this.config.autoSaveInterval);
  }

  // ============================================================
  // 事件监听
  // ============================================================

  on(callback: (type: string, data?: unknown) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private emit(type: string, data?: unknown): void {
    for (const listener of this.listeners) {
      try {
        listener(type, data);
      } catch (error) {
        console.error("[PetMemoryContext] 监听器错误:", error);
      }
    }
  }

  // ============================================================
  // 清理
  // ============================================================

  /**
   * 销毁实例
   */
  dispose(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    
    // 最后保存一次
    this.saveToStorage();
    
    this.listeners = [];
    // PetMemoryContext 已销毁
  }

  /**
   * 清除指定宠物的所有缓存数据
   */
  static clearPetData(petId: number): void {
    try {
      const key = `${STORAGE_PREFIX}${petId}`;
      localStorage.removeItem(key + STORAGE_MESSAGES);
      localStorage.removeItem(key + STORAGE_EVENTS);
      localStorage.removeItem(key + STORAGE_PROFILE);
    // 已清除指定宠物的所有缓存
    } catch (error) {
      console.error("[PetMemoryContext] 清除失败:", error);
    }
  }

  /**
   * 获取存储使用情况
   */
  getStorageStats(): { messageCount: number; eventCount: number; estimatedSizeKB: number } {
    try {
      const key = `${STORAGE_PREFIX}${this.petId}`;
      const msgData = localStorage.getItem(key + STORAGE_MESSAGES) || "[]";
      const evtData = localStorage.getItem(key + STORAGE_EVENTS) || "[]";
      
      return {
        messageCount: this.messages.length,
        eventCount: this.events.length,
        estimatedSizeKB: Math.round(
          (new Blob([msgData]).size + new Blob([evtData]).size) / 1024
        )
      };
    } catch {
      return { messageCount: 0, eventCount: 0, estimatedSizeKB: 0 };
    }
  }
}

// ============================================================
// 工厂函数
// ============================================================

/**
 * 创建或获取宠物的记忆上下文实例
 * 使用简单缓存避免重复创建
 */
const contextCache = new Map<number, PetMemoryContext>();

export function getOrCreateMemoryContext(
  petId: number, 
  config?: Partial<MemoryConfig>
): PetMemoryContext {
  const existing = contextCache.get(petId);
  if (existing) {
    return existing;
  }
  
  const ctx = new PetMemoryContext(petId, config);
  contextCache.set(petId, ctx);
  return ctx;
}

/**
 * 销毁并清理缓存的实例
 */
export function destroyMemoryContext(petId: number): void {
  const ctx = contextCache.get(petId);
  if (ctx) {
    ctx.dispose();
    contextCache.delete(petId);
  }
}
