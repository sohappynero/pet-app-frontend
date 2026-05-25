import type {
  ApiResp,
  DashboardData,
  HealthRecord,
  LoginResp,
  Pet,
  RecordType,
  Reminder,
  ReminderStatus,
} from "../types";
import { getLocalAvatar } from "./pet-avatar";
import { getSessionToken, setSessionUser, getSessionUser } from "./session";


const envBaseUrl = (import.meta as any)?.env?.VITE_API_BASE_URL || "";
const API_BASE_URL = String(envBaseUrl).replace(/\/$/, "");

// ============================================================
// JWT 工具函数（前端轻量解码，不验证签名）
// ============================================================

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 ? "=" .repeat(4 - padded.length % 4) : "";
  try {
    return atob(padded + padding);
  } catch {
    return "{}";
  }
}

function decodeJwtPayload(token: string): Record<string, any> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return {};
  }
}

// 全局刷新状态，防止并发刷新
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

// 导出刷新状态管理函数，供全局使用
export function getRefreshStatus() {
  return {
    isRefreshing,
    refreshSubscribers,
  };
}

export function setRefreshingStatus(status: boolean) {
  isRefreshing = status;
}

function createHeaders(init?: HeadersInit, useJson = true) {
  const token = getSessionToken();
  return {
    ...(useJson ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init || {}),
  };
}

// 刷新 Token 的函数
export async function refreshToken(): Promise<string> {
  try {
    // 后端要求在 body 中传递 refresh_token
    let refreshTokenStr = "";
    try { refreshTokenStr = localStorage.getItem("pet_refresh_token_v1") || ""; } catch {}

    const headers: Record<string, string> = {};
    if (refreshTokenStr) {
      headers["Content-Type"] = "application/json";
    } else {
      // 兜底：使用 Bearer token（旧逻辑）
      const token = getSessionToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers,
      body: JSON.stringify(refreshTokenStr ? { refresh_token: refreshTokenStr } : {}),
    });

    if (!response.ok) {
      throw new Error("Token 刷新失败");
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : null;

    const newToken = data?.access_token || data?.data?.access_token || "";
    if (!newToken) {
      throw new Error("Token 刷新返回无效");
    }

    // 如果后端返回了新的 refresh_token，也更新
    const newRefreshToken = data?.refresh_token;
    if (newRefreshToken) {
      try { localStorage.setItem("pet_refresh_token_v1", newRefreshToken); } catch {}
    }

    // 更新本地存储的 access_token
    const currentUser = getSessionUser();
    if (currentUser) {
      setSessionUser({
        ...currentUser,
        token: newToken,
      });
    }

    return newToken;
  } catch (error) {
    throw new Error(`Token 刷新失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

async function request<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const fullUrl = `${API_BASE_URL}${url}`;

  // 第一次尝试请求
  let res = await fetch(fullUrl, {
    headers: createHeaders(init?.headers),
    ...init,
  });

  // 如果收到 401 响应，尝试刷新 Token
  if (res.status === 401) {
    // 如果已经在刷新中，等待刷新完成
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        addRefreshSubscriber((newToken: string) => {
          // 使用新 Token 重试请求
          fetch(fullUrl, {
            headers: createHeaders(init?.headers, init?.headers?.['Content-Type'] === 'application/json'),
            ...init,
          })
          .then(newRes => {
            const contentType = newRes.headers.get("content-type") || "";
            const data = contentType.includes("application/json") ? newRes.json() : null;
            if (!newRes.ok || data?.ok === false) {
              const fallbackMessage = !newRes.ok ? `请求失败（HTTP ${newRes.status}）` : "请求失败";
              reject(new Error(data?.message || data?.detail || fallbackMessage));
            } else {
              resolve(data as T);
            }
          })
          .catch(reject);
        });
      });
    }

    // 开始刷新流程
    isRefreshing = true;

    try {
      const newToken = await refreshToken();

      // 通知所有等待的请求
      onRefreshed(newToken);

      // 使用新 Token 重试请求
      res = await fetch(fullUrl, {
        headers: createHeaders(init?.headers, init?.headers?.['Content-Type'] === 'application/json'),
        ...init,
      });
    } catch (refreshError) {
      // 刷新失败，跳转到登录页
      const user = getSessionUser();
      if (user) {
        // 可以在这里添加跳转到登录页的逻辑
        // window.location.href = '/login';
      }
      throw new Error("会话已过期，请重新登录");
    } finally {
      isRefreshing = false;
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok || data?.ok === false) {
    // 特殊处理 422 验证错误，显示详细信息
    if (res.status === 422 && data?.detail) {
      const detailMsg = Array.isArray(data.detail)
        ? data.detail.map((d: any) => {
            const loc = Array.isArray(d?.loc) ? d.loc.slice(1).join(".") : "";
            const msg = d?.msg || JSON.stringify(d);
            return loc ? `[${loc}] ${msg}` : msg;
          }).join("; ")
        : JSON.stringify(data.detail);
      console.error(`🌐 [API] 验证错误详情: ${detailMsg}`);
      throw new Error(`数据验证失败: ${detailMsg}`);
    }
    const fallbackMessage = !res.ok ? `请求失败（HTTP ${res.status}）` : "请求失败";
    throw new Error(data?.message || data?.detail || fallbackMessage);
  }
  return data as T;
}

function mapSpeciesToUi(species?: string): Pet["species"] {
  if (species === "犬") return "dog";
  if (species === "猫") return "cat";
  return "other";
}

function mapGenderToUi(gender?: string): Pet["gender"] {
  if (gender === "公") return "male";
  if (gender === "母") return "female";
  return "unknown";
}

export function mapUiSpeciesToApi(species: Pet["species"]) {
  if (species === "dog") return "犬";
  if (species === "cat") return "猫";
  return "其他";
}

function mapUiGenderToApi(gender: Pet["gender"]) {
  if (gender === "male") return "公";
  if (gender === "female") return "母";
  return "未知";
}

/** 检测是否为相对路径URL（需要拼接 API 基础地址） */
function isRelativePath(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/** 为相对路径 URL 拼接 API 基础地址 */
function resolveFullUrl(url: string | null): string | null {
  if (!url) return null;
  // Data URI / 完整 HTTP(S) URL → 直接使用
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // 相对路径 → 拼接 API 基础地址
  if (isRelativePath(url)) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

function normalizePet(raw: any): Pet {
  const birthDate = raw?.birth_date ? String(raw.birth_date).slice(0, 10) : null;
  const age = birthDate ? `${Math.max(0, new Date().getFullYear() - Number(birthDate.slice(0, 4)))}岁` : "--";
  // 优先级链：_resolved_avatar_url（后端解析后的默认头像）> avatar_url（后端原始值）> image_url（旧兼容）
  const resolvedUrl = resolveFullUrl(raw?._resolved_avatar_url || raw?.resolved_avatar_url || null);
  const rawAvatarUrl = resolveFullUrl(raw?.avatar_url || null);
  const imgUrl = resolveFullUrl(raw?.image_url || raw?.avatar || raw?.photo || raw?.image || null);
  return {
    id: Number(raw?.id || 0),
    phone: raw?.phone || "",
    name: raw?.pet_name || raw?.name || "",
    species: mapSpeciesToUi(raw?.species),
    breed: raw?.breed || "",
    gender: mapGenderToUi(raw?.gender),
    birthday: birthDate,
    age,
    weight_kg: raw?.weight ?? raw?.weight_kg ?? null,
    neutered: raw?.neutered_status === "已绝育" || raw?.neutered === true,
    notes: raw?.medical_history || raw?.notes || "",
    image_url: resolvedUrl || imgUrl,  // 有默认头像时优先使用
    avatar_url: rawAvatarUrl,
    _resolved_avatar_url: resolvedUrl,
    created_at: raw?.created_at || "",
  };
}

function toPetApiPayload(payload: Omit<Pet, "id" | "phone" | "age" | "created_at">) {
  return {
    pet_name: payload.name,
    species: mapUiSpeciesToApi(payload.species),
    breed: payload.breed || "",
    gender: mapUiGenderToApi(payload.gender),
    birth_date: payload.birthday ? `${payload.birthday}T00:00:00` : null,
    weight: payload.weight_kg,
    color: "",
    neutered_status: payload.neutered ? "已绝育" : "未绝育",
    pet_reg_id: null,

    adoption_date: null,
    allergy_history: "",
    medical_history: payload.notes || "",
    image_url: payload.image_url || null,
  };
}



export async function login(payload: { username: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: createHeaders(undefined, true),
    body: JSON.stringify(payload),
  });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    throw new Error("用户名或密码错误");
  }

  // 后端返回: { access_token, refresh_token, token_type, expires_in }
  // 用户信息 (phone/nickname) 在 JWT payload 中
  const accessToken = data?.access_token || data?.data?.access_token || "";
  const refreshTokenStr = data?.refresh_token || "";
  const claims = decodeJwtPayload(accessToken);
  const phone = claims?.phone || payload.username;
  const nickname = claims?.nickname || payload.username;

  // 将 refresh_token 存入 localStorage，供后续刷新使用
  if (refreshTokenStr) {
    try { localStorage.setItem("pet_refresh_token_v1", refreshTokenStr); } catch {}
  }

  return {
    ok: true,
    message: "登录成功",
    phone,
    nickname,
    pet_name: "",
    token: accessToken,
  } as LoginResp;
}


export async function sendRegisterCode(payload: { phone: string }) {
  try {
    return await request<ApiResp<{ phone: string; expire_seconds: number; mode?: string; demo_code?: string }>>(
      "/api/send-register-code",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes("HTTP 404")) {
      throw err;
    }
  }

  return {
    ok: true,
    message: "验证码已发送（兼容模式）",
    data: { phone: payload.phone, expire_seconds: 300, mode: "demo", demo_code: "123456" },
  } as ApiResp<{ phone: string; expire_seconds: number; mode?: string; demo_code?: string }>;
}


export function register(payload: {
  phone: string;
  nickname: string;
  password: string;
  confirm_password: string;
  verify_code: string;
  pet_name: string;
}) {
  return request<ApiResp>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      nickname: payload.nickname,
      phone: payload.phone,
      password: payload.password,
      avatar: null,
    }),
  });
}




export async function fetchPets(_phone?: string) {
  const res = await request<any>("/api/v1/pets");
  const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  // normalize + 合并 localStorage 头像缓存（解决后端不返回 image_url 时头像丢失）
  const pets = list.map(normalizePet).map((pet) => {
    if (!pet.image_url) {
      const local = getLocalAvatar(pet.id);
      if (local) return { ...pet, image_url: local };
    }
    return pet;
  });
  return {
    ok: true,
    message: "获取成功",
    data: pets,
  } as ApiResp<Pet[]>;
}

export async function createPet(payload: Omit<Pet, "id" | "age" | "created_at"> & { phone?: string }) {
  const { phone: _ignored, ...rest } = payload;
  const res = await request<any>("/api/v1/pets", {
    method: "POST",
    body: JSON.stringify(toPetApiPayload(rest)),
  });
  const raw = res?.data ?? res;
  return {
    ok: true,
    message: "新增成功",
    data: normalizePet(raw),
  } as ApiResp<Pet>;
}

export async function updatePet(
  id: number,
  payload: Omit<Pet, "id" | "phone" | "age" | "created_at">,
  _phone?: string
) {
  const res = await request<any>(`/api/v1/pets/${id}`, {
    method: "PUT",
    body: JSON.stringify(toPetApiPayload(payload)),
  });
  const raw = res?.data ?? res;
  return {
    ok: true,
    message: "更新成功",
    data: normalizePet(raw),
  } as ApiResp<Pet>;
}

export function deletePet(id: number, _phone?: string) {
  return request<ApiResp>(`/api/v1/pets/${id}`, { method: "DELETE" });
}

/**
 * 创建宠物（支持文件上传，使用 multipart/form-data）
 * 调用后端新接口 POST /api/v1/pets/create-with-avatar
 */
export async function createPetWithAvatar(payload: {
  pet_name: string;
  species: string;       // 中文：犬/猫/其他
  breed?: string | null;
  gender?: string;
  birth_date?: string | null;
  weight?: number | null;
  neutered?: boolean;
  notes?: string | null;
  avatarFile?: File | null;
}): Promise<ApiResp<Pet>> {
  const formData = new FormData();
  formData.append("pet_name", payload.pet_name);
  formData.append("species", payload.species);  // 前端需传中文值
  formData.append("breed", payload.breed?.trim() || "");
  formData.append("gender", payload.gender || "未知");
  formData.append("birth_date", payload.birth_date || "");
  if (payload.weight != null) formData.append("weight", String(payload.weight));
  formData.append("neutered_status", payload.neutered ? "已绝育" : "未绝育");
  if (payload.notes) formData.append("medical_history", payload.notes);
  if (payload.avatarFile) formData.append("avatar", payload.avatarFile);

  const fullUrl = `${API_BASE_URL}/api/v1/pets/create-with-avatar`;
  const token = getSessionToken();
  const res = await fetch(fullUrl, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });

  if (!res.ok) {
    const errData = res.headers.get("content-type")?.includes("application/json")
      ? await res.json().catch(() => null) : null;
    throw new Error(errData?.detail || `创建失败（HTTP ${res.status}）`);
  }
  const data = await res.json().catch(() => null);
  const raw = data?.data ?? data;
  return {
    ok: true,
    message: "创建成功",
    data: normalizePet(raw),
  } as ApiResp<Pet>;
}

/**
 * 更新/上传宠物头像（使用 multipart 文件上传）
 * 调用后端新接口 PUT /api/v1/pets/{pet_id}/avatar
 */
export async function updatePetAvatar(petId: number, file: File): Promise<ApiResp<Pet>> {
  const formData = new FormData();
  formData.append("avatar", file);

  const fullUrl = `${API_BASE_URL}/api/v1/pets/${petId}/avatar`;
  const token = getSessionToken();
  const res = await fetch(fullUrl, {
    method: "PUT",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });

  if (!res.ok) {
    const errData = res.headers.get("content-type")?.includes("application/json")
      ? await res.json().catch(() => null) : null;
    throw new Error(errData?.detail || `头像上传失败（HTTP ${res.status}）`);
  }
  const data = await res.json().catch(() => null);
  const raw = data?.data ?? data;
  return {
    ok: true,
    message: "头像更新成功",
    data: normalizePet(raw),
  } as ApiResp<Pet>;
}

export function switchPet(petId: number) {
  return request<ApiResp<{ pet_id: number }>>("/api/v1/pets/switch", {
    method: "POST",
    body: JSON.stringify({ pet_id: petId }),
  });
}



export function fetchRecords(phone: string, petId?: number, recordType?: RecordType | "all") {
  const params = new URLSearchParams({ phone });
  if (petId) params.set("pet_id", String(petId));
  if (recordType) params.set("record_type", recordType);
  return request<ApiResp<HealthRecord[]>>(`/api/v1/health/records?${params.toString()}`);
}

export function createRecord(payload: {
  phone: string;
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
}) {
  return request<ApiResp<HealthRecord>>("/api/v1/health/records", {
    method: "POST",
    body: JSON.stringify({ ...payload, type: payload.record_type }),
  });
}

export function updateRecord(
  id: number,
  payload: {
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
  },
  phone: string
) {
  const params = new URLSearchParams({ phone });
  return request<ApiResp<HealthRecord>>(`/api/v1/health/records/${id}?${params.toString()}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, type: payload.record_type }),
  });
}

export function deleteRecord(id: number, phone: string) {
  const params = new URLSearchParams({ phone });
  return request<ApiResp>(`/api/v1/health/records/${id}?${params.toString()}`, { method: "DELETE" });
}


function normalizeReminder(raw: any): Reminder {
  const remindAt: string = raw?.remind_at || raw?.due_date || "";
  const dueDate = remindAt ? remindAt.slice(0, 10) : "";
  const isCompleted: boolean = raw?.is_completed ?? false;
  return {
    id: Number(raw?.id || 0),
    user_id: raw?.user_id ? Number(raw.user_id) : undefined,
    pet_id: Number(raw?.pet_id || 0),
    title: raw?.title || "",
    content: raw?.content ?? null,
    remind_at: remindAt,
    due_date: dueDate,
    is_completed: isCompleted,
    completed_at: raw?.completed_at ?? null,
    status: isCompleted ? "done" : "pending",
    created_at: raw?.created_at || "",
    updated_at: raw?.updated_at || "",
  };
}

export async function fetchReminders(
  _phone?: string,
  petId?: number,
  status?: ReminderStatus | "all"
) {
  const params = new URLSearchParams();
  if (petId) params.set("pet_id", String(petId));
  // status → is_completed 映射（"all" 不传，"pending"→false，"done"→true）
  if (status === "pending") params.set("is_completed", "false");
  else if (status === "done") params.set("is_completed", "true");
  // 拉取全量（后端默认 page_size=10，传大页防截断）
  params.set("page", "1");
  params.set("page_size", "100");
  const raw = await request<any>(`/api/v1/reminders?${params.toString()}`);
  // 后端返回分页结构 { total, list, page, page_size }，展平为 ApiResp<Reminder[]>
  const list: any[] = raw?.list ?? raw?.data ?? (Array.isArray(raw) ? raw : []);
  return {
    ok: true,
    message: "获取成功",
    data: list.map(normalizeReminder),
  } as ApiResp<Reminder[]>;
}

export async function createReminder(payload: {
  phone?: string;
  pet_id: number;
  title: string;
  due_date: string;
  due_time?: string;
  content?: string;
  repeat?: string;
}) {
  const { phone: _ignored, due_date, due_time, repeat: _repeat, ...rest } = payload;
  const remindAt = `${due_date}T${due_time || "09:00"}:00`;
  const raw = await request<any>("/api/v1/reminders", {
    method: "POST",
    body: JSON.stringify({ ...rest, remind_at: remindAt }),
  });
  const item = raw?.data ?? raw;
  return {
    ok: true,
    message: "创建成功",
    data: normalizeReminder(item),
  } as ApiResp<Reminder>;
}

export async function updateReminder(
  id: number,
  payload: {
    title?: string;
    due_date?: string;
    due_time?: string;
    content?: string;
    repeat?: string;
    status?: ReminderStatus;
    is_completed?: boolean;
  },
  _phone?: string
) {
  const { due_date, due_time, repeat: _repeat, status, ...rest } = payload;
  const body: Record<string, any> = { ...rest };
  if (due_date) body.remind_at = `${due_date}T${due_time || "09:00"}:00`;
  if (status !== undefined) body.is_completed = status === "done";
  const raw = await request<any>(`/api/v1/reminders/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const item = raw?.data ?? raw;
  return {
    ok: true,
    message: "更新成功",
    data: normalizeReminder(item),
  } as ApiResp<Reminder>;
}

export async function completeReminder(id: number, _phone?: string) {
  const raw = await request<any>(`/api/v1/reminders/${id}/complete`, { method: "POST" });
  const item = raw?.data ?? raw;
  return {
    ok: true,
    message: "已完成",
    data: normalizeReminder(item),
  } as ApiResp<Reminder>;
}

export function deleteReminder(id: number, _phone?: string) {
  return request<ApiResp>(`/api/v1/reminders/${id}`, { method: "DELETE" });
}


export function fetchDashboard(phone: string, petId?: number) {
  const params = new URLSearchParams({ phone });
  if (petId) params.set("pet_id", String(petId));
  return request<ApiResp<DashboardData>>(`/api/v1/dashboard?${params.toString()}`);
}


export function changePassword(payload: { old_password: string; new_password: string }) {
  return request<ApiResp>("/api/v1/users/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updateProfile(payload: { nickname?: string; avatar?: string }) {
  return request<ApiResp<{ id: number; nickname: string; phone: string; avatar?: string }>>("/api/v1/users/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function submitFeedback(payload: {
  feedback_type: string;
  content: string;
  tags?: string[];
  contact?: string;
}) {
  return request<ApiResp>("/api/v1/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** 获取当前登录用户完整信息（昵称、头像等） */
export async function fetchUserInfo(): Promise<{
  id: number;
  nickname: string;
  phone: string;
  avatar?: string | null;
}> {
  const raw = await request<any>("/api/v1/users/me");
  return {
    id: raw?.id ?? raw?.data?.id ?? 0,
    nickname: raw?.nickname ?? raw?.data?.nickname ?? "",
    phone: raw?.phone ?? raw?.data?.phone ?? "",
    avatar: raw?.avatar ?? raw?.data?.avatar ?? null,
  };
}
