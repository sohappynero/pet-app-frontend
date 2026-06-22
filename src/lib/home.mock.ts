/* 首页 mock 数据层：类型 + localStorage 持久化 + 内容合成。
 * 本模块是前端独立闭环：等后端就绪只需用相同形状的实现替换它。
 * 不依赖 React，不依赖任何样式。
 */

export type CheckInAte = "normal" | "less" | "much";
export type CheckInActive = "normal" | "less" | "much";
export type CheckInMood = "happy" | "normal" | "low";
export type DigestMood = "happy" | "tired" | "normal";
export type TipCategory = "diet" | "exercise" | "health" | "environment";

export interface CheckInPhoto {
  url: string;
  takenAt: string;
}

export interface CheckInStatus {
  photoToday: CheckInPhoto | null;
  ate: CheckInAte | null;
  active: CheckInActive | null;
  mood: CheckInMood | null;
}

export interface DailyDigest {
  speaks: string;
  speaksMood: DigestMood;
  insights: string[];
  generatedAt: string;
}

export interface DailyTip {
  text: string;
  category: TipCategory;
}

export interface PetProfileLike {
  id: number;
  name: string;
  species: "dog" | "cat" | "other";
  breed: string;
  age: string;
  weight_kg: number | null;
}

const STORAGE_PREFIX = "checkin";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function nowIso(d: Date): string {
  return d.toISOString();
}

export function __checkInKey(petId: number, today: Date = new Date()): string {
  return `${STORAGE_PREFIX}:${petId}:${localDateKey(today)}`;
}

export function __resetCheckIn(petId: number, today: Date = new Date()): void {
  try {
    localStorage.removeItem(__checkInKey(petId, today));
  } catch {
    // localStorage 不可用时静默放过（SSR / 隐私模式）
  }
}

const EMPTY_STATUS: CheckInStatus = {
  photoToday: null,
  ate: null,
  active: null,
  mood: null,
};

function safeParseStatus(raw: string | null): CheckInStatus {
  if (!raw) return { ...EMPTY_STATUS };
  try {
    const parsed = JSON.parse(raw) as Partial<CheckInStatus>;
    return {
      photoToday: parsed.photoToday ?? null,
      ate: parsed.ate ?? null,
      active: parsed.active ?? null,
      mood: parsed.mood ?? null,
    };
  } catch {
    return { ...EMPTY_STATUS };
  }
}

function readStatus(petId: number, today: Date): CheckInStatus {
  try {
    return safeParseStatus(localStorage.getItem(__checkInKey(petId, today)));
  } catch {
    return { ...EMPTY_STATUS };
  }
}

function writeStatus(petId: number, today: Date, status: CheckInStatus): void {
  try {
    localStorage.setItem(__checkInKey(petId, today), JSON.stringify(status));
  } catch {
    // 配额满或被禁用时静默放过；mock 层不爆错
  }
}

export async function getCheckInStatus(
  petId: number,
  today: Date = new Date()
): Promise<CheckInStatus> {
  return readStatus(petId, today);
}

function speciesNoun(species: PetProfileLike["species"]): string {
  if (species === "dog") return "狗狗";
  if (species === "cat") return "猫猫";
  return "宝贝";
}

function isEmptyStatus(s: CheckInStatus): boolean {
  return (
    s.photoToday === null && s.ate === null && s.active === null && s.mood === null
  );
}

function hasPhotoOnly(s: CheckInStatus): boolean {
  return (
    s.photoToday !== null && s.ate === null && s.active === null && s.mood === null
  );
}

function hasAllSelections(s: CheckInStatus): boolean {
  return s.ate !== null && s.active !== null && s.mood !== null;
}

function composeSpeaks(
  pet: PetProfileLike,
  s: CheckInStatus
): { speaks: string; speaksMood: DigestMood } {
  if (isEmptyStatus(s)) {
    return { speaks: "今天还没见到你呢", speaksMood: "normal" };
  }
  if (hasPhotoOnly(s)) {
    return { speaks: "你拍了我啦，看我今天怎么样？", speaksMood: "happy" };
  }
  if (hasAllSelections(s)) {
    if (s.ate === "less" && s.mood === "low") {
      return { speaks: "今天没什么胃口，懒洋洋的", speaksMood: "tired" };
    }
    if (s.active === "much" && s.mood === "happy") {
      return { speaks: "今天玩得好开心！", speaksMood: "happy" };
    }
    if (s.mood === "low") {
      return { speaks: "今天有点没精神，多陪陪我", speaksMood: "tired" };
    }
    if (s.ate === "less") {
      return { speaks: "今天没什么胃口", speaksMood: "tired" };
    }
    if (s.active === "much") {
      return { speaks: "今天动得真起劲", speaksMood: "happy" };
    }
    return { speaks: "今天一切如常，挺好", speaksMood: "normal" };
  }
  // 部分完成
  const noun = speciesNoun(pet.species);
  return { speaks: `${noun}的今天还在记录中～`, speaksMood: "normal" };
}

function composeInsights(pet: PetProfileLike, s: CheckInStatus): string[] {
  if (isEmptyStatus(s)) return [];

  const lines: string[] = [];

  if (s.ate === "less") {
    lines.push(`${pet.name}今天进食偏少，留意 1-2 天是否恢复`);
  } else if (s.ate === "much") {
    lines.push(`${pet.name}今天进食偏多，注意控制零食`);
  }

  if (s.active === "less") {
    lines.push("活动量偏低，可以陪着多动一动");
  } else if (s.active === "much") {
    lines.push("活动量很足，记得给足饮水");
  }

  if (s.mood === "low") {
    lines.push("情绪偏低，留意是否身体不适");
  } else if (s.mood === "happy" && s.active === "much") {
    lines.push("精神状态在线，保持作息");
  }

  if (lines.length === 0 && pet.breed) {
    lines.push(`${pet.breed}通常对环境变化敏感，保持节奏稳定`);
  }

  return lines.slice(0, 3);
}

function composeTip(pet: PetProfileLike, s: CheckInStatus): DailyTip {
  if (isEmptyStatus(s)) {
    return { text: "拍张照片让我们认识一下吧", category: "environment" };
  }
  if (s.ate === "less") {
    return {
      text: `${pet.name}进食偏少，今天可以换个口味试试`,
      category: "diet",
    };
  }
  if (s.active === "less") {
    return { text: "今天活动量偏低，安排 10 分钟陪玩", category: "exercise" };
  }
  if (s.mood === "low") {
    return { text: "状态不太对，留意精神和体温", category: "health" };
  }
  return { text: "保持喂食与作息节奏", category: "environment" };
}
