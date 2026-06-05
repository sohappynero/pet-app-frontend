export type Species = "dog" | "cat" | "other";
export type Gender = "male" | "female" | "unknown";
export type RecordType = "vaccine" | "deworm" | "checkup" | "visit" | "beauty" | "weight" | "diet" | "observation";
export type ReminderStatus = "pending" | "done" | "cancelled";
export type ReminderRepeat = "once" | "daily" | "weekly" | "monthly";

// ============================================================
// AI 宠物情绪系统类型定义
// ============================================================

/** 宠物情绪类型 */
export type PetEmotion = "excited" | "anxious" | "hungry" | "lonely" | "angry" | "happy" | "neutral"
| "sleepy" | "playful" | "relaxed" | "sad" | "curious";

/** 消息来源类型 */
export type MessageSource = "human" | "pet" | "pet_translate" | "ai_photo_mind" | "ai_voice" | "human_to_pet";

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
  speciesMismatch?: boolean;
  detectedSpecies?: string;
}

/** 人话转宠物语结果 */
export interface HumanToPetResult {
  petLanguage: string;
  emoji: string;
  emotion: PetEmotion;
  originalText: string;
}

/** 聊天消息扩展 */
export interface ChatMessageExtra {
  // 照片心声
  photoMind?: PhotoMindResult;
  photoUrl?: string;
  
  // 声音翻译
  voiceResult?: VoiceTranslateResult;
  audioUrl?: string;
  
  // 人话转宠物语
  humanToPetResult?: HumanToPetResult;
  
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
  cost: number | null;
  weight_kg: number | null;
  mood: string;
  appetite: string;
  note: string;
  images: string[];
  created_at: string;
  /** 驱虫类型 (internal/external/broad_spectrum) - 仅 deworm 类型使用 */
  deworm_type?: string | null;
  /** 就诊/体检结果 - 仅 checkup/visit 类型使用 */
  medical_result?: string | null;
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

// ============================================================
// 健康记录详细类型（5种专用记录类型）
// ============================================================

/** 疫苗记录 */
export interface VaccineRecord {
  id: number;
  pet_id: number;
  vaccine_date?: string | null;
  pet_hospital?: string | null;
  vaccine_name?: string | null;
  vaccine_batch_number?: string | null;
  photo_urls?: string[];
  notes?: string | null;
  created_at?: string;
}

/** 驱虫记录 */
export interface DewormingRecord {
  id: number;
  pet_id: number;
  deworming_date?: string | null;
  deworming_type?: string | null;       // internal / external / broad_spectrum
  medication_name?: string | null;      // 药品名称（与ORM对齐）
  medication_brand?: string | null;     // 药品品牌
  dosage_mg_kg?: number | null;         // 剂量(mg/kg)
  effectiveness?: string | null;        // 效果评估
  pet_hospital?: string | null;
  cost?: number | null;                // 费用(元)
  deworming_medication_dosage?: string[] | null;
  photo_urls?: string[] | null;
  notes?: string | null;
  created_at?: string;
}

/** 体检记录 */
export interface CheckUpRecord {
  id: number;
  pet_id: number;
  check_up_date?: string | null;
  pet_hospital?: string | null;
  check_up_projects?: string | null;
  check_up_result?: string | null;
  doctor_advice?: string | null;
  check_up_photo_urls?: string[];
  notes?: string | null;
  created_at?: string;
}

/** 就诊记录 */
export interface MedicalRecord {
  id: number;
  pet_id: number;
  medical_date?: string | null;
  pet_hospital?: string | null;
  medical_amount?: number | null;
  medical_case_photo_urls?: string[];
  medical_result?: string | null;
  treatment_plan?: string | null;
  notes?: string | null;
  created_at?: string;
}

/** 观察记录 - 后端 observation_records 表 */
export interface ObservationRecord {
  id: number;
  pet_id: number;
  observation_date?: string | null;
  /** 食欲: excellent/good/normal/decreased/absent */
  appetite_status?: string | null;
  /** 情绪: happy/calm/anxious/aggressive/depressed/excited/fearful */
  mental_status?: string | null;
  /** 便便性状(布里斯托): normal/soft/loose/watery/constipated/blood_present */
  stool_consistency?: string | null;
  /** 排便次数/天 */
  stool_frequency?: number | null;
  /** 精力活跃度: very_high/high/normal/low/very_low */
  energy_level?: string | null;
  /** 当日体重(kg) */
  weight?: number | null;
  notes?: string | null;
  created_at?: string;
}

/** 美容医护记录 */
export interface GroomingRecord {
  id: number;
  pet_id: number;
  grooming_date?: string | null;
  grooming_type?: string | null;
  provider_name?: string | null;
  cost?: number | null;
  coat_condition?: string | null;
  coat_length?: string | null;
  matting_level?: number | null;
  shedding_level?: string | null;
  skin_condition?: string | null;
  dandruff_level?: string | null;
  services_performed?: string[] | null;
  products_used?: string[] | null;
  notes?: string | null;
  before_photos?: string[] | null;
  after_photos?: string[] | null;
  grooming_score?: number | null;
  ai_analysis?: Record<string, any> | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** 体重记录 - pet_weight_records 专用表 */
export interface WeightRecord {
  id: number;
  pet_id: number;
  record_date?: string;          // YYYY-MM-DD
  weight_kg?: number;            // 体重(kg)
  body_condition_score?: number | null;  // BCS 1-9
  body_fat_percent?: number | null;      // 体脂率%
  measurement_time?: string | null;      // 测量时间
  measurement_context?: string | null;    // fasting/post_meal/random
  weighing_device?: string | null;        // 称重设备
  bmi_value?: number | null;
  ideal_weight_min?: number | null;
  ideal_weight_max?: number | null;
  weight_trend?: string | null;
  trend_score?: number | null;
  notes?: string | null;
  photo_urls?: string[] | null;
  created_at?: string | null;
}

/** 饮食记录 - pet_feeding_records 专用表 */
export interface FeedingRecord {
  id: number;
  pet_id: number;
  feeding_date?: string;         // YYYY-MM-DD
  meal_type?: string;            // breakfast/lunch/dinner/snack/treat
  feeding_time?: string | null;  // HH:mm:ss
  main_food_type?: string | null;
  main_food_amount?: number | null;
  food_brand?: string | null;
  food_protein_pct?: number | null;
  food_calories?: number | null;
  protein_g?: number | null;
  fat_g?: number | null;
  carb_g?: number | null;
  fiber_g?: number | null;
  supplement_items?: { name: string; amount: string; type: string }[] | null;
  appetite_level?: string | null;
  eating_duration?: number | null;
  leftover_amount?: number | null;
  eating_behavior?: string | null;
  water_intake_ml?: number | null;
  nutrition_score?: number | null;
  ai_notes?: string | null;
  notes?: string | null;
  photo_urls?: string[] | null;
  created_at?: string | null;
}
