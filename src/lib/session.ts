const USER_KEY = "pet_user_v1";
const PET_KEY = "pet_selected_pet_id";

export interface SessionUser {
  phone: string;
  nickname: string;
  token?: string;
  avatar?: string;
}


export function getSessionUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSessionUser(user: SessionUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSessionUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PET_KEY);
}

export function getSelectedPetId(): number | null {
  const raw = localStorage.getItem(PET_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function setSelectedPetId(id: number | null) {
  if (id === null) {
    localStorage.removeItem(PET_KEY);
    return;
  }
  localStorage.setItem(PET_KEY, String(id));
}

export function getSessionToken(): string {
  return getSessionUser()?.token || "";
}
