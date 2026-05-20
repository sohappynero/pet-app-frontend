import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  ShieldCheck,
  X,
  User,
  KeyRound,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { changePassword, updateProfile } from "../lib/api";
import { getSessionUser, setSessionUser } from "../lib/session";

export default function PrivacySettings() {
  const navigate = useNavigate();

  // 修改密码弹窗状态
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // 修改个人资料弹窗状态
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  const handleChangePwd = async () => {
    setPwdError("");
    if (!oldPwd || !newPwd || !confirmPwd) {
      setPwdError("请填写所有密码字段");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("两次输入的新密码不一致");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("新密码不能少于6位");
      return;
    }
    setPwdLoading(true);
    try {
      await changePassword({ old_password: oldPwd, new_password: newPwd });
      setPwdSuccess(true);
      setTimeout(() => {
        setShowPwdModal(false);
        setPwdSuccess(false);
        setOldPwd("");
        setNewPwd("");
        setConfirmPwd("");
      }, 1200);
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : "修改失败，请稍后重试");
    } finally {
      setPwdLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setProfileError("");
    if (!nickname.trim() && !avatar.trim()) {
      setProfileError("请至少填写昵称或头像地址");
      return;
    }
    setProfileLoading(true);
    try {
      await updateProfile({
        nickname: nickname.trim() || undefined,
        avatar: avatar.trim() || undefined,
      });
      // 同步更新 session 中的用户信息
      const cur = getSessionUser();
      if (cur) {
        setSessionUser({
          ...cur,
          nickname: nickname.trim() || cur.nickname,
          avatar: avatar.trim() || cur.avatar,
        });
        // 通知 AppShell 刷新 session 状态（如头像变化）
        window.dispatchEvent(new Event("pet-session-change"));
      }
      setProfileSuccess(true);
      setTimeout(() => {
        setShowProfileModal(false);
        setProfileSuccess(false);
        setNickname("");
        setAvatar("");
      }, 1200);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "修改失败，请稍后重试");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <main className="ps-page">
      {/* Hero */}
      <section className="ps-hero">
        <div className="ps-hero-bg">
          <div className="ps-hero-gradient" />
          <div className="ps-hero-orb ps-orb-1" />
          <div className="ps-hero-orb ps-orb-2" />
          <div className="ps-hero-dots" />
        </div>
        <div className="ps-hero-inner">
          <button type="button" className="ps-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div className="ps-hero-content">
            <div className="ps-hero-icon-wrap">
              <ShieldCheck size={22} />
            </div>
            <h1 className="ps-hero-title">隐私设置</h1>
            <p className="ps-hero-desc">守护您的数据安全</p>
          </div>
        </div>
      </section>

      {/* 安全等级卡片 */}
      <section className="ps-body">
        <div className="ps-security-card">
          <div className="ps-sec-left">
            <div className="ps-sec-icon-wrap">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="ps-sec-title">安全等级：<span className="ps-sec-level">高</span></p>
              <p className="ps-sec-desc">您的数据已受到最高级别保护 🔒</p>
            </div>
          </div>
          {/* 装饰浮动元素 */}
          <span className="ps-float-ele ps-fe-1">🔐</span>
          <span className="ps-float-ele ps-fe-2">🛡️</span>
        </div>

        {/* 账户安全设置列表 */}
        <div className="ps-card">
          <div className="ps-card-header">
            <div className="ps-card-tag">
              <Lock size={12} />
              账户安全
            </div>
            <ChevronRight size={14} className="ps-card-arrow" />
          </div>

          <div className="ps-setting-item">
            <div className="ps-setting-info">
              <div className="ps-setting-icon ps-si-pwd">
                <KeyRound size={16} />
              </div>
              <div>
                <p className="ps-setting-label">登录密码</p>
                <p className="ps-setting-hint">定期更换密码提高安全性</p>
              </div>
            </div>
            <button
              className="ps-action-btn"
              onClick={() => { setPwdError(""); setShowPwdModal(true); }}
            >
              修改
            </button>
          </div>

          <div className="ps-setting-divider" />

          <div className="ps-setting-item">
            <div className="ps-setting-info">
              <div className="ps-setting-icon ps-si-profile">
                <User size={16} />
              </div>
              <div>
                <p className="ps-setting-label">个人资料修改</p>
                <p className="ps-setting-hint">修改昵称、头像等个人信息</p>
              </div>
            </div>
            <button
              className="ps-action-btn"
              onClick={() => { setProfileError(""); setShowProfileModal(true); }}
            >
              修改
            </button>
          </div>
        </div>

        {/* 安全提示 */}
        <div className="ps-tip-card">
          <Sparkles size={14} className="ps-tip-icon" />
          <p className="ps-tip-text">
            小贴士：建议每 3 个月更换一次登录密码，使用字母+数字+特殊字符组合更安全哦 ✨
          </p>
        </div>
      </section>

      {/* 修改密码弹窗 */}
      {showPwdModal && (
        <div className="ps-modal-overlay">
          <div className="ps-modal">
            <div className="ps-modal-header">
              <h3 className="ps-modal-title">🔑 修改密码</h3>
              <button onClick={() => setShowPwdModal(false)} className="ps-modal-close">
                <X size={18} />
              </button>
            </div>
            <div className="ps-modal-body">
              <label className="ps-field-label">旧密码</label>
              <input type="password" placeholder="请输入当前密码"
                value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} className="ps-input" />
              <label className="ps-field-label">新密码（至少6位）</label>
              <input type="password" placeholder="请输入新密码"
                value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="ps-input" />
              <label className="ps-field-label">确认新密码</label>
              <input type="password" placeholder="请再次输入新密码"
                value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className="ps-input" />
            </div>
            {pwdError && <p className="ps-msg-error">{pwdError}</p>}
            {pwdSuccess && <p className="ps-msg-success">密码修改成功！✓</p>}
            <button onClick={handleChangePwd} disabled={pwdLoading || pwdSuccess}
              className="ps-submit-btn">
              {pwdLoading ? "提交中..." : pwdSuccess ? "修改成功 ✓" : "确认修改"}
            </button>
          </div>
        </div>
      )}

      {/* 修改个人资料弹窗 */}
      {showProfileModal && (
        <div className="ps-modal-overlay">
          <div className="ps-modal">
            <div className="ps-modal-header">
              <h3 className="ps-modal-title">👤 修改个人资料</h3>
              <button onClick={() => setShowProfileModal(false)} className="ps-modal-close">
                <X size={18} />
              </button>
            </div>
            <div className="ps-modal-body">
              <label className="ps-field-label">昵称</label>
              <input type="text" placeholder="新昵称（留空则不修改）"
                value={nickname} onChange={(e) => setNickname(e.target.value)}
                maxLength={20} className="ps-input" />
              <label className="ps-field-label">头像 URL</label>
              <input type="text" placeholder="头像图片URL（留空则不修改）"
                value={avatar} onChange={(e) => setAvatar(e.target.value)} className="ps-input" />
            </div>
            {profileError && <p className="ps-msg-error">{profileError}</p>}
            {profileSuccess && <p className="ps-msg-success">资料修改成功！✓</p>}
            <button onClick={handleUpdateProfile} disabled={profileLoading || profileSuccess}
              className="ps-submit-btn">
              {profileLoading ? "提交中..." : profileSuccess ? "修改成功 ✓" : "确认修改"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
