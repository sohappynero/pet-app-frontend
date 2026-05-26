import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, KeyRound, LogIn } from "lucide-react";
import Mascot from "../components/Mascot";
import { login, fetchUserInfo } from "../lib/api";
import { setSessionUser, getSessionUser } from "../lib/session";

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!phone.trim() || !password) {
      setError("用户名或密码错误");
      return;
    }


    setLoading(true);
    try {
      const data = await login({ username: phone.trim(), password });
      setSuccess(data.message);

      // 先用登录返回的 JWT 信息建立基础 session
      setSessionUser({ phone: data.phone, nickname: data.nickname, token: data.token });

      // 登录成功后从后端获取完整用户信息（含头像等）
      try {
        const userInfo = await fetchUserInfo();
        const cur = getSessionUser();
        if (cur) {
          setSessionUser({
            ...cur,
            nickname: userInfo.nickname || cur.nickname,
            avatar: userInfo.avatar || cur.avatar,
          });
        }
      } catch (userInfoErr) {
        // 用户信息获取失败不影响登录，使用 JWT 中的基本信息即可
        console.warn("获取用户详细信息失败，使用默认信息:", userInfoErr);
      }

      setTimeout(() => navigate("/app"), 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("aborted") || msg.includes("timeout") || msg.includes("Failed to fetch")) {
        setError("连接服务器失败，请检查后端是否启动");
      } else {
        setError("用户名或密码错误");
      }
    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center py-10 px-4 overflow-x-hidden">
      <div className="bg-blob animate-float-slow" style={{ width: 320, height: 320, background: "#ffc8e8", top: -80, left: -100 }} />
      <div className="bg-blob animate-float" style={{ width: 260, height: 260, background: "#b4f0ff", bottom: -60, right: -80 }} />
      <span className="paw-deco" style={{ top: "12%", left: "8%" }}>🐾</span>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="hidden md:flex flex-col items-center gap-6 animate-fade-in">
            <Mascot size="lg" animate />
            <div className="text-center">
              <h1 className="text-4xl font-bold" style={{ background: "linear-gradient(135deg, #ff7cb8, #8c58ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                宠物健康屋
              </h1>
              <p className="text-base mt-2" style={{ color: "var(--text-sub)" }}>🐶 陪伴你和毛孩子的每一天 🐱</p>
            </div>
          </div>

          <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="flex justify-center mb-4 md:hidden"><Mascot size="sm" animate /></div>
            <div className="text-center mb-7">
              <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>欢迎回来 👋</h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-sub)" }}>登录后查看毛孩子健康状态</p>
            </div>

            {error && <div className="msg-error mb-4">⚠️ {error}</div>}
            {success && <div className="msg-success mb-4">🎉 {success}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="pet-label">用户名/手机号</label>

                <div className="login-input-wrap">
                  <span className="login-input-icon"><User size={18} /></span>
                  <input className="pet-input login-has-icon" type="text" placeholder="请输入用户名或手机号" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
              </div>

              <div>
                <label className="pet-label">密码</label>
                <div className="login-input-wrap">
                  <span className="login-input-icon"><KeyRound size={18} /></span>
                  <input className="pet-input login-has-icon" type="password" placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="pet-btn flex items-center justify-center gap-2 mt-2" disabled={loading}>
                <LogIn />
                {loading ? "登录中…" : "登 录"}
              </button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: "var(--text-sub)" }}>
              还没有账号？ <Link to="/register" className="pet-link">立即注册 🐾</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
