/**
 * 持久化存储桥接：Preferences ↔ localStorage
 *
 * Capacitor WebView 里 localStorage 可能被系统清理（导致关 App 后登录态丢失）。
 * 用 @capacitor/preferences（原生持久化）作为可靠存储，localStorage 作为同步读取的缓存层：
 *  - 启动时 hydrateFromPreferences() 把原生数据恢复到 localStorage
 *  - 之后同步的 getSessionUser()/getSessionToken() 读 localStorage 即可拿到数据
 *  - 写入时同时写两边，保证下次启动能从 Preferences 恢复
 */
import { Preferences } from "@capacitor/preferences";

// 需要持久化的 key（登录态相关）
const PERSIST_KEYS = ["pet_user_v1", "pet_refresh_token_v1"];

/**
 * App 启动时调用：从原生 Preferences 恢复数据到 localStorage。
 * 之后所有同步的 localStorage 读取就能拿到数据。
 */
export async function hydrateFromPreferences(): Promise<void> {
  for (const key of PERSIST_KEYS) {
    try {
      const { value } = await Preferences.get({ key });
      if (value !== null && value !== undefined) {
        localStorage.setItem(key, value);
      }
    } catch {
      /* 忽略，降级用 localStorage */
    }
  }
}

// 记录所有进行中的 Preferences 写入，供 flushPending() 等待落盘
const pendingWrites = new Set<Promise<unknown>>();

function track(p: Promise<unknown>): void {
  pendingWrites.add(p);
  p.finally(() => pendingWrites.delete(p));
}

/** 写入：同时写 localStorage（同步，即时生效）和 Preferences（异步，持久化） */
export function persistSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch {}
  track(Preferences.set({ key, value }).catch(() => {}));
}

/** 删除：同时清 localStorage 和 Preferences */
export function persistRemove(key: string): void {
  try { localStorage.removeItem(key); } catch {}
  track(Preferences.remove({ key }).catch(() => {}));
}

/**
 * 等待所有进行中的 Preferences 写入完成，确保数据真正落盘。
 * 在登录成功、跳转前调用，避免写入未完成就被杀进程导致登录态丢失。
 */
export async function flushPending(): Promise<void> {
  await Promise.all([...pendingWrites]);
}
