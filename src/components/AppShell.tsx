import { useEffect, useMemo, useState, useCallback } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Bell, FileText, Heart, UserRound, MessageCircle } from "lucide-react";
import { fetchPets, fetchUserInfo } from "../lib/api";
import {
  clearSessionUser,
  getSelectedPetId,
  getSessionUser,
  setSessionUser,
  setSelectedPetId,
} from "../lib/session";
import { refreshTokenGlobal } from "../lib/auth";
import type { Pet } from "../types";

export interface ShellContext {
  phone: string;
  nickname: string;
  avatar?: string;
  pets: Pet[];
  selectedPetId: number | null;
  selectedPet: Pet | null;
  refreshPets: () => Promise<void>;
  setPetId: (id: number | null) => void;
  onLogout: () => void;
}


export default function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();

  // 使用 state 监听 session 变化（支持头像等更新后及时刷新）
  const [sessionUser, setSessionUserState] = useState(() => getSessionUser());
  const user = sessionUser;

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetIdState] = useState<number | null>(getSelectedPetId());

  // 监听 session 变化（跨组件更新如头像修改）
  useEffect(() => {
    const handler = () => setSessionUserState(getSessionUser());
    window.addEventListener("pet-session-change", handler);
    return () => window.removeEventListener("pet-session-change", handler);
  }, []);

  // 初始加载时从后端获取最新用户信息（处理刷新场景）
  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;
    fetchUserInfo()
      .then((info) => {
        if (cancelled || !info.nickname) return;
        setSessionUserState((prev) => ({
          ...prev,
          nickname: info.nickname || prev?.nickname || "",
          avatar: info.avatar ?? prev?.avatar,
          phone: info.phone || prev?.phone || "",
        }));
        // 同步更新 localStorage
        const cur = getSessionUser();
        if (cur) {
          setSessionUser({
            ...cur,
            nickname: info.nickname || cur.nickname,
            avatar: info.avatar ?? cur.avatar,
            phone: info.phone || cur.phone,
          });
        }
      })
      .catch(() => {
        // 获取失败不影响使用，使用 session 中已有信息
      });
    return () => { cancelled = true; };
  }, [user?.token]);

  const refreshPets = async () => {
    if (!user?.phone) return;
    const res = await fetchPets(user.phone);
    const next = res.data || [];
    setPets(next);

    const selectedStillExists = next.some((x) => x.id === selectedPetId);
    if (!selectedStillExists) {
      const first = next[0]?.id ?? null;
      setSelectedPetIdState(first);
      setSelectedPetId(first);
    }
  };

  useEffect(() => {
    refreshPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phone]);

  const selectedPet = useMemo(
    () => pets.find((x) => x.id === selectedPetId) || null,
    [pets, selectedPetId]
  );

  const setPetId = (id: number | null) => {
    setSelectedPetIdState(id);
    setSelectedPetId(id);
  };

  const onLogout = () => {
    clearSessionUser();
    navigate("/login");
  };

  // 处理 401 错误的函数
  const handleUnauthorized = useCallback(async () => {
    try {
      // 尝试刷新 Token
      await refreshTokenGlobal();
      // 刷新成功，继续执行原来的操作
      return true;
    } catch (error) {
      // 刷新失败，跳转到登录页
      clearSessionUser();
      navigate("/login");
      return false;
    }
  }, [navigate]);

  if (!user) return null;

  const path = location.pathname;
  const isOnboardingMode = pets.length === 0 && path === "/app";

  // 子详情页隐藏底部导航栏
  const hideTabBar = path.startsWith("/app/feedback") || path.startsWith("/app/help");

  return (
    <div className={`my-shell ${isOnboardingMode ? "onboarding-mode" : ""}`}>
      {!isOnboardingMode ? <div className="my-shell-blob pink" /> : null}
      {!isOnboardingMode ? <div className="my-shell-blob blue" /> : null}

      <div
        className={
          isOnboardingMode
            ? "app-shell-onboarding-wrap"
            : `mx-auto w-full max-w-[520px] px-3 pt-4 ${hideTabBar ? "pb-0" : "pb-2 sm:pb-2.5"} sm:pt-5 relative z-10 app-shell-wrap`
        }
      >
        <div className={`app-content ${isOnboardingMode ? "onboarding-content" : ""}`}>
          <Outlet
            context={{
              phone: user.phone,
              nickname: user.nickname,
              avatar: user.avatar,
              pets,
              selectedPetId,
              selectedPet,
              refreshPets,
              setPetId,
              onLogout,
            } satisfies ShellContext}
          />
        </div>
      </div>

      {!isOnboardingMode && !hideTabBar ? (
        <nav className="bottom-tabbar">
          <div className="bottom-tabbar-inner bottom-tabbar-5col">
            <NavLink to="/app/pets" className={({ isActive }) => `tab-item ${isActive ? "active" : ""}`}>
              <Heart size={22} strokeWidth={2.1} />
              <span>首页</span>
              <span className="tab-deco tab-deco-star">✦</span>
            </NavLink>

            <NavLink
              to="/app/records"
              className={`tab-item ${path.startsWith("/app/records") || path.startsWith("/app/add-record") ? "active" : ""}`}
            >
              <FileText size={22} strokeWidth={2.1} />
              <span>健康记录</span>
              <span className="tab-deco tab-deco-heart">♥</span>
            </NavLink>

            {/* 中间凸起的宠物聊天入口 */}
            <div className="tab-chat-center">
              <button type="button" className="tab-chat-btn" onClick={() => navigate("/app/chat")}>
                <MessageCircle size={24} strokeWidth={2.2} />
                <span>宠物聊天</span>
                <span className="tab-deco tab-deco-paw">🐾</span>
              </button>
            </div>

            <NavLink to="/app/reminders" className={({ isActive }) => `tab-item ${isActive ? "active" : ""}`}>
              <Bell size={22} strokeWidth={2.1} />
              <span>提醒</span>
              <span className="tab-deco tab-deco-dot">●</span>
            </NavLink>

            <NavLink to="/app/mine" className={({ isActive }) => `tab-item ${isActive ? "active" : ""}`}>
              <UserRound size={20} strokeWidth={2.1} />
              <span>我的</span>
              <span className="tab-deco tab-deco-paw">🐾</span>
            </NavLink>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
