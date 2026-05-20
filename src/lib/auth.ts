import { refreshToken, getRefreshStatus, setRefreshingStatus } from './api';
import { setSessionUser, getSessionUser } from './session';
import { useNavigate } from 'react-router-dom';

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

// 全局刷新 Token 的函数
export async function refreshTokenGlobal(): Promise<string> {
  try {
    const newToken = await refreshToken();
    onRefreshed(newToken);
    return newToken;
  } catch (error) {
    // 刷新失败，清除用户信息并跳转到登录页
    setSessionUser(null as any);
    const navigate = useNavigate();
    navigate('/login');
    throw new Error("会话已过期，请重新登录");
  }
}

// 检查并刷新 Token 的包装函数
export async function ensureValidToken(): Promise<string> {
  const user = getSessionUser();
  if (!user?.token) {
    throw new Error("未登录");
  }

  // 如果已经在刷新中，等待刷新完成
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      addRefreshSubscriber((newToken: string) => {
        resolve(newToken);
      });
    });
  }

  // 检查 token 是否即将过期（这里可以根据实际情况添加过期时间检查）
  // 目前简单处理，如果收到 401 再刷新
  
  return user.token;
}

// 导出刷新状态管理函数
export function getRefreshStatusGlobal() {
  return {
    isRefreshing,
    refreshSubscribers,
  };
}

export function setRefreshingStatusGlobal(status: boolean) {
  isRefreshing = status;
}