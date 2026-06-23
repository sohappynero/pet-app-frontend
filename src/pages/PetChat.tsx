/**
 * 会员中心页面
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, Heart, Smile, Sparkles,
  Crown, Info, Camera, Images, Loader2,
  X, Shield, HelpCircle, FileText, Lock,
  ChevronDown, Calendar, ScanLine, Stethoscope, Home, LockKeyhole, Wallet,
  Gem, Check, CreditCard, Smartphone, MessageCircle
} from "lucide-react";
import { useShell } from "../hooks/useShell";
import { getLocalAvatar } from "../lib/pet-avatar";
import { fetchPhotoMind } from "../lib/pet-mind.api";
import type { QuotaError } from "../lib/pet-mind.api";
import QuotaHintModal from "../components/PetChat/QuotaHintModal";

// VIP 特权配置
interface PrivilegeItem {
  id: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  bg: string;
}

const VIP_PRIVILEGES: PrivilegeItem[] = [
  { id: "emotion", icon: Smile, label: "情绪识别", desc: "读懂小情绪", color: "#A78BFA", bg: "#F3E8FF" },
];

export default function PetChat() {
  const navigate = useNavigate();
  const { selectedPet } = useShell();

  const [showPhotoMind, setShowPhotoMind] = useState(false);
  const [photoResult, setPhotoResult] = useState<{ text: string; photoUrl: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);
  const [activeCategory, setActiveCategory] = useState("overview");
  const [openFaq, setOpenFaq] = useState<string[]>(["q1"]);
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaErrorData, setQuotaErrorData] = useState<QuotaError | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // ====== 前端本地配额计数（从后端获取实际限额）======
  const QUOTA_STORAGE_KEY = "photo_mind_quota";
  const [photoQuotaLimit, setPhotoQuotaLimit] = useState<number>(5);
  const [photoQuotaUsed, setPhotoQuotaUsed] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
      if (!raw) return 0;
      const data = JSON.parse(raw);
      // 每月1号自动重置
      const now = new Date();
      const storedMonth = data.month; // "2026-06"
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      if (storedMonth !== currentMonth) return 0;
      return typeof data.used === "number" ? data.used : 0;
    } catch { return 0; }
  });

  // 从后端获取实际配额限额
  useEffect(() => {
    const fetchQuotaLimit = async () => {
      try {
        const token = (await import("../lib/session")).getSessionToken();
        const envBaseUrl = (import.meta as any)?.env?.VITE_API_BASE_URL || "";
        const baseUrl = String(envBaseUrl).replace(/\/$/, "");
        const resp = await fetch(`${baseUrl}/api/v1/payment/membership`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (resp.ok) {
          const data = await resp.json();
          const photoQuota = data.quotas?.find((q: any) => q.feature === "photo_emotion");
          if (photoQuota) {
            setPhotoQuotaLimit(photoQuota.limit === -1 ? 999999 : photoQuota.limit);
            // 同步后端实际使用量（比 localStorage 更准确）
            if (typeof photoQuota.used === "number") {
              setPhotoQuotaUsed(photoQuota.used);
              saveQuotaUsed(photoQuota.used);
            }
          }
        }
      } catch (e) {
        console.warn("[PetChat] 获取配额限额失败，使用默认值", e);
      }
    };
    fetchQuotaLimit();
  }, []);

  // 保存使用次数到 localStorage
  const saveQuotaUsed = useCallback((used: number) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify({ used, month }));
    setPhotoQuotaUsed(used);
  }, []);

  const photoQuotaRemaining = Math.max(0, photoQuotaLimit - photoQuotaUsed);

  const petName = selectedPet?.name || "宝贝";
  const petImage = selectedPet?.image_url || getLocalAvatar(selectedPet?.id ?? 0) || "";

  const handleFileUpload = async (file: File) => {
    if (!selectedPet) return;

    // ====== 前端配额预检（不依赖后端）======
    if (photoQuotaRemaining <= 0) {
      console.warn("[PhotoMind] 前端本地配额已用完，直接弹窗");
      setQuotaErrorData({
        type: "quota_exceeded",
        feature: "photo_emotion",
        used: photoQuotaUsed,
        limit: photoQuotaLimit,
        plan: "unknown",
        upgradeHint: "本月次数已用完，升级会员可获得更多使用次数",
      });
      setShowQuotaModal(true);
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetchPhotoMind({
        pet: selectedPet,
        imageFile: file,
      });
      if (res.success && res.result) {
        // 成功后递增本地计数
        const newUsed = photoQuotaUsed + 1;
        saveQuotaUsed(newUsed);
        console.log(`[PhotoMind] 分析成功，本月已用 ${newUsed}/${photoQuotaLimit} 次`);

        const text = `${res.result.expression}，${res.result.posture}，心情${res.result.mood}。${res.result.mindOs || ""}`;
        setPhotoResult({ text, photoUrl: res.photoUrl || URL.createObjectURL(file) });

        // 如果刚好用完最后一次，延迟弹窗提示
        if (newUsed >= photoQuotaLimit) {
          setTimeout(() => {
            setQuotaErrorData({
              type: "quota_exceeded",
              feature: "photo_emotion",
              used: newUsed,
              limit: photoQuotaLimit,
              plan: "unknown",
              upgradeHint: "本月次数已用完，升级会员可继续使用~",
            });
            setShowQuotaModal(true);
          }, 800);
        }
      } else if (res.quotaError) {
        // 后端返回的配额错误
        setQuotaErrorData(res.quotaError);
        setShowQuotaModal(true);
      } else {
        alert(res.error || "照片分析失败，请重试");
      }
    } catch (err) {
      console.error("心声解读失败:", err);
      alert("照片分析异常，请检查网络后重试");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="vip-page">
      {/* Header */}
      <header className="vip-header">
        <button className="vip-back" onClick={() => navigate(-1)}>
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 className="vip-header-title">宠物心声</h1>
        <button className="vip-right-btn" onClick={() => setShowBenefits(true)}>
          <Info size={13} />
          <span>权益说明</span>
        </button>
      </header>

      {/* Hero */}
      <section className="vip-hero">
        <div className="vip-hero-text">
          <h2 className="vip-hero-title">
            成为{petName}的守护天使
            <br />
            <span>解锁更多爱与陪伴</span>
          </h2>
          <p className="vip-hero-desc">记录每一刻，守护每一天</p>
        </div>
        <div className="vip-hero-visual">
          {petImage ? (
            <img src={petImage} alt={petName} className="vip-hero-pet-img" />
          ) : (
            <span className="vip-hero-pet-fallback">🐾</span>
          )}
        </div>
      </section>

      {/* Privileges */}
      <section className="vip-privileges">
        <h3 className="vip-section-title">
          <Crown size={15} />
          会员专属特权
        </h3>
        <div className="vip-privilege-grid">
          {VIP_PRIVILEGES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="vip-privilege-item"
                onClick={() => {
                  if (item.id === "emotion") setShowPhotoMind(prev => !prev);
                  if (item.id === "analysis") navigate("/app/insights");
                }}
              >
                <span className="vip-privilege-icon" style={{ background: item.bg, color: item.color }}>
                  <Icon size={22} />
                </span>
                <span className="vip-privilege-label">{item.label}</span>
                <span className="vip-privilege-desc">{item.desc}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 心声解读（情绪识别功能区） */}
      {showPhotoMind && (
        <section className="vip-photo-mind">
          <div className="vip-photo-mind-header">
            <h3 className="vip-section-title">
              <Smile size={15} />
              心声解读
            </h3>
            <span className={`vip-quota-hint ${photoQuotaRemaining <= 1 ? "warning" : ""}`}>
              {photoQuotaRemaining > 0 ? `剩余 ${photoQuotaRemaining}/${photoQuotaLimit} 次` : "次数已用完"}
            </span>
          </div>
          <div className="vip-photo-actions">
            <button type="button" className="vip-photo-btn" onClick={() => cameraRef.current?.click()}>
              <Camera size={18} />
              <span>拍照解读</span>
            </button>
            <button type="button" className="vip-photo-btn" onClick={() => galleryRef.current?.click()}>
              <Images size={18} />
              <span>选图解读</span>
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={cameraRef}
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />
          <input
            type="file"
            accept="image/*"
            ref={galleryRef}
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />
          {isAnalyzing && (
            <div className="vip-analyzing">
              <Loader2 size={18} className="spin" />
              <span>正在分析宠物心理活动...</span>
            </div>
          )}
          {photoResult && (
            <div className="vip-photo-result">
              <img src={photoResult.photoUrl} alt="宠物照片" />
              <p>{photoResult.text}</p>
            </div>
          )}
        </section>
      )}

      {/* Gift */}
      <section className="vip-gift">
        <div className="vip-gift-text">
          <h3>给你和{petName}的小礼物 🎁</h3>
          <p>首次开通会员赠送专属礼包</p>
          <button className="vip-gift-btn">查看礼包</button>
        </div>
      </section>

      {/* Voice */}
      <section className="vip-voice">
        <h3 className="vip-section-title">
          <Crown size={15} />
          会员心声
        </h3>
        <div className="vip-voice-list">
          <div className="vip-voice-item">
            <span className="vip-voice-avatar">🐱</span>
            <p>&ldquo;自从开通会员，AI分析帮了大忙，健康趋势一目了然~&rdquo;</p>
            <span>- 小鱼麻麻</span>
          </div>
          <div className="vip-voice-item">
            <span className="vip-voice-avatar">🐕</span>
            <p>&ldquo;情绪识别太神奇了，完全读懂了我家{petName}的小心思~&rdquo;</p>
            <span>- {petName}的铲屎官</span>
          </div>
        </div>
      </section>

      {/* 权益说明抽屉 */}
      {showBenefits && (
        <div className="vip-benefits-overlay" onClick={() => setShowBenefits(false)}>
          <div className="vip-benefits-drawer" onClick={(e) => e.stopPropagation()}>
            {/* 拖条 */}
            <div className="vip-benefits-handle" onClick={() => setShowBenefits(false)}>
              <span />
            </div>

            {/* 标题 */}
            <div className="vip-benefits-header">
              <h3>权益说明</h3>
              <button className="vip-benefits-close" onClick={() => setShowBenefits(false)}>
                <X size={18} />
              </button>
            </div>

            {/* 主体：左侧导航 + 右侧内容 */}
            <div className="vip-benefits-body">
              {/* 左侧导航 */}
              <nav className="vip-benefits-nav">
                {[
                  { id: "overview", label: "权益总览", icon: Crown },
                  { id: "rules", label: "使用规则", icon: Shield },
                  { id: "privacy", label: "隐私与数据", icon: Lock },
                  { id: "faq", label: "常见问题", icon: HelpCircle },
                ].map((cat) => {
                  const Icon = cat.icon;
                  const active = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`vip-benefits-nav-item ${active ? "active" : ""}`}
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      <span className="vip-benefits-nav-icon">
                        <Icon size={18} />
                      </span>
                      <span className="vip-benefits-nav-label">{cat.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* 右侧内容 */}
              <div className="vip-benefits-content">
                {activeCategory === "overview" && (
                  <>
                    <div className="vip-benefits-overview">
                      <div className="vip-benefits-overview-icon">
                        <Crown size={18} fill="#FB7185" />
                      </div>
                      <div>
                        <h4>权益总览</h4>
                        <p>不同会员等级，享受不同的宠爱特权</p>
                      </div>
                    </div>
                    <div className="vip-benefits-table">
                      <div className="vip-benefits-table-header">
                        <span>权益</span>
                        <span>免费版</span>
                        <span className="pro">宠物会员 Pro</span>
                        <span>家庭尊享版</span>
                      </div>
                      {[
                        { name: "AI健康分析", free: "每月 3 次", pro: "每月 60 次", family: "无限次" },
                        { name: "健康记录", free: "基础记录", pro: "+ 月度报告", family: "+ 年度总结" },
                        { name: "照片心理识别", free: "每月 5 次", pro: "每月 60 次", family: "每月 300 次" },
                        { name: "宠物数量", free: "1 只", pro: "最多 3 只", family: "无限宠物" },
                        { name: "PDF报告导出", free: "部分导出", pro: "支持导出", family: "支持导出" },
                        { name: "家庭共享账号", free: "—", pro: "—", family: "最多 3 账号" },
                        { name: "优先客服响应", free: "—", pro: "优先", family: "优先 + 专属" },
                        { name: "AI成本(预估)", free: "≈ ¥0.01/人/月", pro: "≈ ¥0.15/月", family: "≈ ¥0.5/月" },
                      ].map((row) => (
                        <div key={row.name} className="vip-benefits-table-row">
                          <span>{row.name}</span>
                          <span>{row.free}</span>
                          <span className="pro">{row.pro}</span>
                          <span>{row.family}</span>
                        </div>
                      ))}
                    </div>
                    <p className="vip-benefits-footer-tip">
                      <Heart size={12} fill="#FB7185" />
                      更多规则详情，可查看使用规则和常见问题哦~
                    </p>
                  </>
                )}

                {activeCategory === "rules" && (
                  <div className="vip-benefits-panel vip-rules-panel">
                    <div className="vip-rules-header">
                      <div>
                        <h4>这些小规则</h4>
                        <p>是为了更好地守护你和宝贝</p>
                      </div>
                      <span className="vip-rules-hero-emoji">🐱</span>
                    </div>
                    <div className="vip-rules-list">
                      {[
                        {
                          icon: Calendar,
                          title: "AI 分析次数说明",
                          desc: "免费版每月可使用 AI 健康分析 3 次，宠物会员 Pro 每月可使用 60 次，家庭尊享版不限次使用。每月 1 日自动刷新次数哦~",
                          note: "大多数家长每月实际使用不到 20 次",
                          color: "#FB7185",
                          bg: "#FFF0F3",
                        },
                        {
                          icon: ScanLine,
                          title: "照片情绪识别",
                          desc: "上传宠物照片后，我们会尝试分析开心、放松、紧张、害怕、兴奋等情绪状态。",
                          note: "温馨提示：情绪识别仅供参考，不能替代专业兽医诊断哦~",
                          color: "#A78BFA",
                          bg: "#F3E8FF",
                        },
                        {
                          icon: Stethoscope,
                          title: "宠物健康分析",
                          desc: "AI 会结合：体重、疫苗、驱虫、饮食、症状记录进行综合分析，分析结果用于健康管理参考。",
                          note: "如果宠物出现异常情况，请及时前往宠物医院。",
                          color: "#F5A962",
                          bg: "#FEF3E8",
                        },
                        {
                          icon: Home,
                          title: "多宠物说明",
                          desc: "免费版可管理 1 只宠物，会员 Pro 最多管理 3 只，家庭尊享版不限宠物数量。",
                          note: "适合：狗狗家庭、多猫家庭、猫狗混养家庭",
                          color: "#7EC8A0",
                          bg: "#E8F8F0",
                        },
                        {
                          icon: LockKeyhole,
                          title: "数据安全",
                          desc: "你记录的照片、健康记录、AI 分析结果，仅用于提供服务。未经允许，不会公开展示给其他用户。",
                          note: "",
                          color: "#6B8DD6",
                          bg: "#E8EFFF",
                        },
                        {
                          icon: Wallet,
                          title: "自动续费说明",
                          desc: "如果开启自动续费，将在到期前 24 小时自动扣费。可随时关闭，关闭后已购买时长仍可正常使用。",
                          note: "",
                          color: "#D4A574",
                          bg: "#FDF2EC",
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.title} className="vip-rules-card">
                            <span className="vip-rules-card-icon" style={{ background: item.bg, color: item.color }}>
                              <Icon size={20} />
                            </span>
                            <div className="vip-rules-card-body">
                              <strong>{item.title}</strong>
                              <p>{item.desc}</p>
                              {item.note && <span className="vip-rules-card-note">{item.note}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="vip-rules-footer">
                      <Heart size={14} fill="#FB7185" />
                      <span>诺怒希望每一次记录，都能让爱更有力量</span>
                    </div>
                  </div>
                )}

                {activeCategory === "privacy" && (
                  <div className="vip-benefits-panel vip-privacy-panel">
                    <div className="vip-privacy-header">
                      <h4>隐私与数据保护</h4>
                      <p>你和宠物的秘密，只属于你们</p>
                    </div>

                    <div className="vip-privacy-cards">
                      <div className="vip-privacy-card">
                        <div className="vip-privacy-card-icon">
                          <Lock size={18} />
                        </div>
                        <div className="vip-privacy-card-body">
                          <strong>数据使用说明</strong>
                          <p>
                            照片、健康记录、AI 分析结果<span className="vip-privacy-highlight">仅用于服务</span>，不公开，不会被其他用户看到。
                          </p>
                          <p>删除账号后，所有数据将在 30 天内彻底清除。</p>
                        </div>
                      </div>

                      <div className="vip-privacy-card">
                        <div className="vip-privacy-card-icon" style={{ background: "#F3E8FF", color: "#A78BFA" }}>
                          <Sparkles size={18} />
                        </div>
                        <div className="vip-privacy-card-body">
                          <strong>AI 分析与隐私</strong>
                          <p>
                            AI 分析仅参考你的数据生成报告，<span className="vip-privacy-highlight">不用于商业目的</span>。
                          </p>
                          <p>结果仅供参考，不是兽医诊断。</p>
                        </div>
                      </div>

                      <div className="vip-privacy-card">
                        <div className="vip-privacy-card-icon" style={{ background: "#FEF3E8", color: "#F5A962" }}>
                          <Home size={18} />
                        </div>
                        <div className="vip-privacy-card-body">
                          <strong>照片与共享</strong>
                          <p>
                            只有家庭共享成员可看到照片，每个家庭版账号<span className="vip-privacy-highlight">最多 3 人</span>共享。
                          </p>
                          <p>共享前需确认邀请，成员仅能查看无法导出。</p>
                        </div>
                      </div>
                    </div>

                    <button type="button" className="vip-privacy-contact">
                      <MessageCircle size={14} />
                      联系客服
                    </button>
                  </div>
                )}

                {activeCategory === "faq" && (
                  <div className="vip-benefits-panel vip-faq-panel">
                    <div className="vip-faq-header">
                      <div>
                        <h4>你关心的问题</h4>
                        <p>我们都准备好啦</p>
                      </div>
                      <span className="vip-faq-hero-emoji">🐶</span>
                    </div>
                    <div className="vip-faq-list">
                      {[
                        {
                          id: "q1",
                          q: "会员值得买吗？",
                          a: "如果你只是偶尔记录，免费版已经够用。如果你希望：长期记录健康变化、经常做 AI 分析、查看趋势报告、管理多只宠物，会员会更适合你哦~",
                        },
                        {
                          id: "q2",
                          q: "AI 分析准吗？",
                          a: "AI 会根据记录的数据进行分析，记录越完整，分析结果越准确。它更像一个 24 小时宠物健康助手，而不是兽医。",
                        },
                        {
                          id: "q3",
                          q: "换手机后会员还在吗？",
                          a: "会的！登录同一个账号即可恢复会员权益。",
                        },
                        {
                          id: "q4",
                          q: "家庭版怎么共享？",
                          a: "进入「我的」→「家庭共享」，邀请家人加入即可。最多支持 3 个共享账号。",
                        },
                        {
                          id: "q5",
                          q: "照片会泄露吗？",
                          a: "不会哦~照片仅用于情绪识别、写真生成、AI 分析，不会公开展示。",
                        },
                        {
                          id: "q6",
                          q: "会员到期怎么办？",
                          a: "会员到期后，已记录的数据不会消失，只是恢复到免费版权益。",
                        },
                        {
                          id: "q7",
                          q: "为什么会限制次数？",
                          a: "因为每次 AI 分析都会消耗模型资源。限制次数是为了保证每位宠物家长都能获得稳定服务。",
                        },
                      ].map((item, idx) => {
                        const isOpen = openFaq.includes(item.id);
                        return (
                          <div key={item.id} className={`vip-faq-item ${isOpen ? "open" : ""}`}>
                            <button
                              type="button"
                              className="vip-faq-question"
                              onClick={() =>
                                setOpenFaq((prev) =>
                                  isOpen ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                                )
                              }
                            >
                              <span className="vip-faq-number">Q{idx + 1}</span>
                              <span className="vip-faq-text">{item.q}</span>
                              <ChevronDown size={16} className="vip-faq-arrow" />
                            </button>
                            <div className="vip-faq-answer">
                              <p>{item.a}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="vip-faq-footer">
                      <span>还有其他问题？</span>
                      <button type="button" className="vip-faq-contact">联系客服</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <QuotaHintModal
        isOpen={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        quotaData={quotaErrorData}
        petImage={petImage}
        onUpgrade={() => {
          setShowQuotaModal(false);
          navigate("/app/mine/vip");
        }}
      />
    </main>
  );
}
