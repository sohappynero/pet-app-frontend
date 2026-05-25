import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiPhone, FiLock, FiUser, FiUserPlus, FiMessageSquare } from "react-icons/fi";
import Mascot from "../components/Mascot";
import { register, sendRegisterCode } from "../lib/api";


export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    phone: "",
    verify_code: "",
    nickname: "",
    password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => {
      setCountdown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSendCode = async () => {
    setError("");
    setSuccess("");

    if (!/^1\d{10}$/.test(form.phone.trim())) {
      setError("请输入正确的 11 位手机号（以 1 开头）。");
      return;
    }

    setSendingCode(true);
    try {
      const data = await sendRegisterCode({ phone: form.phone.trim() });
      const demoCode = data.data?.demo_code;
      const mode = data.data?.mode;
      setSuccess(
        demoCode
          ? `${data.message || "验证码已发送"} 测试验证码：${demoCode}`
          : mode === "tencent"
          ? data.message || "验证码已发送到你的手机，请注意查收短信。"
          : data.message || "验证码已发送"
      );

      setCountdown(60);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!/^1\d{10}$/.test(form.phone.trim())) {
      setError("请输入正确的 11 位手机号（以 1 开头）。");
      return;
    }
    if (!/^\d{6}$/.test(form.verify_code.trim())) {
      setError("请输入 6 位验证码。");
      return;
    }
    if (!form.nickname.trim()) {
      setError("请输入昵称。");
      return;
    }
    if (form.password.length < 6) {
      setError("密码长度至少 6 位。");
      return;
    }
    if (form.password !== form.confirm_password) {
      setError("两次输入的密码不一致。");
      return;
    }

    setLoading(true);
    try {
      const data = await register({
        phone: form.phone.trim(),
        verify_code: form.verify_code.trim(),
        nickname: form.nickname.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
      });
      setSuccess(data.message || "注册成功");
      setTimeout(() => navigate("/login"), 800);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex items-start justify-center py-10 px-4 overflow-x-hidden">
      <div className="bg-blob animate-float" style={{ width: 280, height: 280, background: "#ffc8e8", top: -60, right: -80 }} />
      <div className="bg-blob animate-float-slow" style={{ width: 240, height: 240, background: "#b4f0ff", bottom: -60, left: -80 }} />

      <div className="relative z-10 w-full max-w-4xl mt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="hidden md:flex flex-col items-center gap-5 pt-10 animate-fade-in">
            <Mascot size="lg" animate />
            <div className="text-center">
              <h1 className="text-3xl font-bold" style={{ background: "linear-gradient(135deg, #ff7cb8, #8c58ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                加入宠物健康屋
              </h1>
              <p className="text-sm mt-2" style={{ color: "var(--text-sub)" }}>和毛孩子一起开启健康之旅 💕</p>
            </div>
          </div>

          <div className="glass-card p-7 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="flex justify-center mb-3 md:hidden"><Mascot size="sm" animate /></div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>创建账号 🐾</h2>
            </div>

            {error && <div className="msg-error mb-4">⚠️ {error}</div>}
            {success && <div className="msg-success mb-4">🎉 {success}</div>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="pet-label">手机号 *</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--primary)" }} />
                  <input className="pet-input pl-10" type="tel" placeholder="请输入手机号" maxLength={11} value={form.phone} onChange={set("phone")} required />
                </div>
              </div>

              <div>
                <label className="pet-label">验证码 *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiMessageSquare className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--primary)" }} />
                    <input
                      className="pet-input pl-10"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="请输入 6 位验证码"
                      value={form.verify_code}
                      onChange={set("verify_code")}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    className="pet-btn secondary !w-auto px-3"
                    onClick={handleSendCode}
                    disabled={sendingCode || countdown > 0}
                  >
                    {sendingCode ? "发送中" : countdown > 0 ? `${countdown}s` : "发送验证码"}
                  </button>
                </div>
              </div>

              <div>
                <label className="pet-label">昵称 *</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--primary)" }} />
                  <input className="pet-input pl-10" type="text" placeholder="给自己起个可爱的名字" value={form.nickname} onChange={set("nickname")} required />
                </div>
              </div>

              <div>
                <label className="pet-label">密码 *（至少 6 位）</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--primary)" }} />
                  <input className="pet-input pl-10" type="password" placeholder="请设置密码" value={form.password} onChange={set("password")} required />
                </div>
              </div>

              <div>
                <label className="pet-label">确认密码 *</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--primary)" }} />
                  <input className="pet-input pl-10" type="password" placeholder="再输入一次密码" value={form.confirm_password} onChange={set("confirm_password")} required />
                </div>
              </div>

              <button type="submit" className="pet-btn flex items-center justify-center gap-2 mt-2" disabled={loading}>
                <FiUserPlus />
                {loading ? "注册中…" : "立即注册"}
              </button>
            </form>

            <p className="text-center text-sm mt-5" style={{ color: "var(--text-sub)" }}>
              已有账号？ <Link to="/login" className="pet-link">去登录 →</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
