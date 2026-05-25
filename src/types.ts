export type Species = "dog" | "cat" | "other";
export type Gender = "male" | "female" | "unknown";
export type RecordType = "vaccine" | "deworm" | "checkup" | "visit" | "beauty" | "observation";
export type ReminderStatus = "pending" | "done" | "cancelled";
export type ReminderRepeat = "once" | "daily" | "weekly" | "monthly";

// ============================================================
// AI 宠物情绪系统类型定义
// ============================================================

/** 宠物情绪类型 */
export type PetEmotion = "excited" | "anxious" | "hungry" | "lonely" | "angry" | "happy" | "neutral"
| "sleepy" | "playful" | "relaxed" | "sad" | "curious";

/** 消息来源类型 */
export type MessageSource = "human" | "pet" | "pet_translate" | "ai_photo_mind" | "ai_roast" | "ai_voice";

/** 宠物性格类型 */
export type PetPersonality = "energetic" | "calm" | "playful" | "shy" | "bossy" | "clingy";

/** 聊天消息基础结构（供 PetChat 等页面扩展） */
export interface ChatMessage {
  id: number;
  type: "human" | "pet" | "pet_translate";
  text: string;
  emoji: string;
  time: string;
}

/** 宠物表情包/贴纸 */
export interface PetSticker {
  id: string;
  emoji: string;
  label: string;
  适用性格?: PetPersonality[];
}

/** 互动行为建议 */
export interface InteractionSuggestion {
  action: string;
  description: string;
  icon: string;
}

/** 声音翻译结果 */
export interface VoiceTranslateResult {
  emotion: PetEmotion;
  emotionScore: number;
  aiLanguage: string;
  suggestions: InteractionSuggestion[];
}

/** 照片心声结果 */
export interface PhotoMindResult {
  expression: string;
  posture: string;
  mood: PetEmotion;
  moodScore: number;
  mindOs: string;
  humorLevel: "low" | "medium" | "high";
}

/** AI 吐槽结果 */
export interface RoastResult {
  roastMessage: string;
  roastType: "complaint" | "demand" | "empathy" | "tease";
  triggerReason: string;
  suggestedAction?: string;
}

/** 聊天消息扩展 */
export interface ChatMessageExtra {
  // 照片心声
  photoMind?: PhotoMindResult;
  photoUrl?: string;
  
  // 声音翻译
  voiceResult?: VoiceTranslateResult;
  audioUrl?: string;
  
  // AI 吐槽
  roastResult?: RoastResult;
  
  // 情绪相关
  emotion?: PetEmotion;
}

/** 宠物人格配置 */
export interface PetPersonalityConfig {
  type: PetPersonality;
  traits: string[];
  speechStyle: "傲娇" | "撒娇" | "话痨" | "高冷" | "贴心";
  catchphrases: string[];
}

// ============================================================
// 原有类型定义
// ============================================================



export interface ApiResp<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
}

export interface LoginResp {
  ok: boolean;
  message: string;
  phone: string;
  nickname: string;
  pet_name: string;
  token?: string;
}


export interface Pet {
  id: number;
  phone: string;
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  birthday: string | null;
  age: string;
  weight_kg: number | null;
  neutered: boolean;
  notes: string;
  /** 宠物照片 URL（用户上传的真实宠物图片，前端历史字段） */
  image_url?: string | null;
  /** 后端原始头像 URL（来自 pets.avatar_url） */
  avatar_url?: string | null;
  /** 后端解析后的最终头像 URL（含默认品种头像回退） */
  _resolved_avatar_url?: string | null;
  created_at: string;
}

export interface HealthRecord {
  id: number;
  pet_id: number;
  record_type: RecordType;
  title: string;
  record_date: string;
  hospital: string;
  doctor: string;
  symptom: string;
  treatment: string;
  cost: number;
  weight_kg: number | null;
  mood: string;
  appetite: string;
  note: string;
  images: string[];
  next_due_date: string | null;
  created_at: string;
}

export interface Reminder {
  id: number;
  user_id?: number;
  pet_id: number;
  title: string;
  content?: string | null;
  /** 后端原始字段：提醒时间 datetime 字符串 */
  remind_at: string;
  /** 兼容字段：从 remind_at 截取前10位，供 Dashboard/Mine 比较 */
  due_date: string;
  is_completed: boolean;
  completed_at?: string | null;
  /** 前端本地展示用，后端不存储 */
  repeat?: ReminderRepeat;
  /** 由 is_completed 派生：false→"pending"，true→"done" */
  status: ReminderStatus;
  source_type?: "auto" | "manual";
  source_record_id?: number | null;
  created_at: string;
  updated_at?: string;
}

export interface DashboardData {
  pet_count: number;
  today_pending_reminders: number;
  recent_records: HealthRecord[];
  stats: {
    total_cost: number;
    visit_count: number;
    record_count: number;
    done_rate: number;
  };
}
