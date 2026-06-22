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
