import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FileText,
  Bell,
  Share2,
  Brain,
  Shield,
  CircleHelp,
  PawPrint,
  ChevronRight,
  LogOut,
  Heart,
  CalendarDays,
  TriangleAlert,
  ArrowLeft,
  ArrowRight,
  Camera,
  Dog,
  Cat,
  Rabbit,
  Calendar,
  Check,
  AlertCircle,
  Star,
} from "lucide-react";

import { createPet, fetchReminders, updatePet } from "../lib/api";
import { useShell } from "../hooks/useShell";
import type { Gender, Species } from "../types";

type MenuItem = {
  label: string;
  icon: ReactNode;
  rightText?: string;
  to?: string;
  onClick?: () => void;
  iconColor?: string;
  iconBg?: string;
};

type OnboardingForm = {
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  birthday: string;
  color: string;
  bodySize: "small" | "medium" | "large";
  weight_kg: string;
  neutered: boolean;
  hasAllergy: boolean;
  allergyNotes: string;
  specialNotes: string;
  /** 宠物照片（本地 base64 预览） */
  image_url: string;
};

const defaultOnboardingForm: OnboardingForm = {
  name: "",
  species: "cat",
  breed: "",
  gender: "unknown",
  birthday: "",
  color: "白色",
  bodySize: "small",
  weight_kg: "",
  neutered: false,
  hasAllergy: false,
  allergyNotes: "",
  specialNotes: "",
  image_url: "",
};

const stepTitles: Record<number, string> = {
  1: "基础信息",
  2: "外观特征",
  3: "健康信息",
  4: "确认添加",
};

const colorOptions = ["白色", "黑色", "金色", "棕色", "灰色", "花色", "奶油色", "其他"];
const bodySizeOptions: Array<{ label: string; value: OnboardingForm["bodySize"] }> = [
  { label: "小型", value: "small" },
  { label: "中型", value: "medium" },
  { label: "大型", value: "large" },
];

const bodySizeHint: Record<OnboardingForm["bodySize"], string> = {
  small: "<10kg",
  medium: "10-25kg",
  large: ">25kg",
};

const breedOptionsBySpecies: Record<string, string[]> = {
  dog: [
    "金毛寻回犬", "拉布拉多", "柯基", "泰迪", "哈士奇",
    "柴犬", "边境牧羊犬", "德国牧羊犬", "萨摩耶", "比熊",
    "吉娃娃", "博美", "法斗", "阿拉斯加", "其他",
  ],
  cat: [
    "中华田园猫", "英短", "美短", "布偶猫", "暹罗猫",
    "波斯猫", "加菲猫", "缅因猫", "苏格兰折耳猫",
    "俄罗斯蓝猫", "无毛猫", "其他",
  ],
  other: ["兔子", "仓鼠", "豚鼠", "鹦鹉", "龙猫", "其他"],
};

function petAvatarEmoji(species: string) {
  if (species === "cat") return "🐱";
  if (species === "other") return "🐰";
  return "🐕";
}

/** 处理宠物头像上传：读取文件并转为 base64 预览 */
function handleAvatarUpload(
  e: React.ChangeEvent<HTMLInputElement>,
  setForm: React.Dispatch<React.SetStateAction<OnboardingForm>>
) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("请选择图片文件");
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    setForm((s) => ({ ...s, image_url: ev.target?.result as string }));
  };
  reader.readAsDataURL(file);
}

function MenuRow({ item }: { item: MenuItem }) {
  const navigate = useNavigate();
  const onPress = () => {
    if (item.to) navigate(item.to);
    else item.onClick?.();
  };

  return (
    <button className="dash-menu-row group" onClick={onPress}>
      <div className="dash-row-left">
        <span className="dash-icon-badge" style={{ background: item.iconBg || "#F5F0EB" }}>
          <span style={{ color: item.iconColor || "#8B7355" }}>
            {item.icon}
          </span>
        </span>
        <span className="dash-label">{item.label}</span>
      </div>
      <span className="dash-row-right">
        <span className="dash-right-text">{item.rightText || "查看"}</span>
        <ChevronRight size={16} className="dash-chevron" />
      </span>
    </button>
  );
}

export default function Dashboard() {
  const { nickname, pets, phone, selectedPetId, selectedPet, onLogout, refreshPets } = useShell();
  const navigate = useNavigate();
  const location = useLocation();

  const [pendingCount, setPendingCount] = useState(0);
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [guideForm, setGuideForm] = useState<OnboardingForm>(defaultOnboardingForm);
  const [guideMsg, setGuideMsg] = useState("");
  const [savingGuide, setSavingGuide] = useState(false);
  const [dashAvatarUrl, setDashAvatarUrl] = useState<string | null>(null);

  // 从 localStorage 读取本地保存的头像
  useEffect(() => {
    if (selectedPet) {
      try {
        const saved = localStorage.getItem(`pet_avatar_${selectedPet.id}`);
        if (saved) setDashAvatarUrl(saved);
      } catch {}
    }
  }, [selectedPet?.id]);

  // 合并显示用的头像 URL
  const displayDashAvatar = dashAvatarUrl || selectedPet?.image_url || null;

  // 当 URL 带 ?add=1 时，强制进入添加引导并清理参数
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "1") {
      setStep(1);
      setGuideForm(defaultOnboardingForm);
      setGuideMsg("");
      navigate("/app", { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (pets.length === 0 || step >= 1) {
      setPendingCount(0);
      return;
    }

    const run = async () => {
      const remindersResp = await fetchReminders(phone, selectedPetId ?? undefined, "pending");
      const today = new Date().toISOString().slice(0, 10);
      const due = (remindersResp.data || []).filter((x) => x.due_date <= today);
      setPendingCount(due.length);
    };
    run();
  }, [phone, selectedPetId, pets.length, step]);

  // 有宠物且不在引导流程中，自动跳首页（/app/pets）
  useEffect(() => {
    if (pets.length > 0 && step === 0 && !location.search.includes("add=1")) {
      navigate("/app/pets", { replace: true });
    }
  }, [pets.length, step, navigate, location.search]);

  const petCount = useMemo(() => pets.length, [pets]);
  const ownerName = useMemo(() => {
    const raw = (nickname || "").trim();
    if (!raw) return "用户";
    if (raw === phone || /^1\d{10}$/.test(raw)) return "用户";
    return raw;
  }, [nickname, phone]);

  const mainMenus: MenuItem[] = [
    {
      label: "我的宠物",
      icon: <FileText size={18} />,
      rightText: `${petCount} 只`,
      to: "/app/pets",
      iconColor: "#6B5B4F",
      iconBg: "#F5F0EB",
    },
    {
      label: "健康报告",
      icon: <FileText size={18} />,
      rightText: "查看全部",
      to: "/app/records",
      iconColor: "#7D6E63",
      iconBg: "#F7F4F0",
    },
    {
      label: "提醒设置",
      icon: <Bell size={18} />,
      rightText: pendingCount > 0 ? `${pendingCount} 条` : "管理",
      to: "/app/reminders",
      iconColor: "#8B7355",
      iconBg: "#FAF8F5",
    },
    {
      label: "病历共享",
      icon: <Share2 size={18} />,
      rightText: "3 个",
      to: "/app/records",
      iconColor: "#9B8577",
      iconBg: "#F5F2EE",
    },
    {
      label: "智能分析",
      icon: <Brain size={18} />,
      rightText: "查看",
      to: "/app/records",
      iconColor: "#5C6B73",
      iconBg: "#F0F2F3",
    },
  ];

  const secondMenus: MenuItem[] = [
    {
      label: "隐私设置",
      icon: <Shield size={18} />,
      rightText: "设置",
      to: "/app/privacy",
      iconColor: "#6B5B4F",
      iconBg: "#F5F0EB",
    },
    {
      label: "帮助中心",
      icon: <CircleHelp size={18} />,
      rightText: "查看",
      to: "/app/records",
      iconColor: "#7D6E63",
      iconBg: "#F7F4F0",
    },
  ];

  const nextStep = () => {
    if (step === 1 && !guideForm.name.trim()) {
      setGuideMsg("请先填写宠物名字");
      return;
    }
    if (step === 1 && !guideForm.breed.trim()) {
      setGuideMsg("请先选择宠物品种");
      return;
    }
    if (step === 1 && guideForm.gender === "unknown") {
      setGuideMsg("请先选择宠物性别");
      return;
    }
    setGuideMsg("");
    setStep((prev) => (prev < 4 ? ((prev + 1) as 0 | 1 | 2 | 3 | 4) : prev));
  };

  const prevStep = () => {
    setGuideMsg("");
    setStep((prev) => (prev > 1 ? ((prev - 1) as 0 | 1 | 2 | 3 | 4) : prev));
  };

  const submitGuide = async () => {
    if (!guideForm.name.trim()) {
      setStep(1);
      setGuideMsg("请先填写宠物名字");
      return;
    }

    const notes: string[] = [];
    if (guideForm.color.trim()) notes.push(`毛色：${guideForm.color.trim()}`);
    notes.push(
      `体型：${
        bodySizeOptions.find((x) => x.value === guideForm.bodySize)?.label || "未填写"
      }`
    );
    if (guideForm.hasAllergy) {
      notes.push(`过敏史：${guideForm.allergyNotes.trim() || "有过敏情况"}`);
    } else {
      notes.push("过敏史：无");
    }
    if (guideForm.specialNotes.trim()) notes.push(`特殊说明：${guideForm.specialNotes.trim()}`);

    setSavingGuide(true);
    setGuideMsg("");
    try {
      await createPet({
        name: guideForm.name.trim(),
        species: guideForm.species,
        breed: guideForm.breed.trim(),
        gender: guideForm.gender,
        birthday: guideForm.birthday || null,
        weight_kg: guideForm.weight_kg ? Number(guideForm.weight_kg) : null,
        neutered: guideForm.neutered,
        notes: notes.join("；"),
        image_url: guideForm.image_url || null,
      });
      await refreshPets();
      navigate("/app/pets");
    } catch (err) {
      setGuideMsg((err as Error).message || "添加失败，请稍后再试");
    } finally {
      setSavingGuide(false);
    }
  };

  const renderGuideStep = () => {
    if (step === 1) {
      return (
        <>
          <section className="pet-welcome-box">
            <div className="pet-welcome-icon"><PawPrint size={20} /></div>
            <div>
              <h4>欢迎来到宠物大家庭！</h4>
              <p>让我们先了解一下您的宠物基本信息</p>
            </div>
          </section>

          <section className="pet-avatar-upload">
            {/* 隐藏的文件输入 */}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              id="pet-avatar-input"
              onChange={(e) => handleAvatarUpload(e, setGuideForm)}
            />
            {/* 头像预览区 */}
            <label htmlFor="pet-avatar-input" className="pet-avatar-circle" style={{ cursor: "pointer" }}>
              {guideForm.image_url ? (
                <img
                  src={guideForm.image_url}
                  alt="宠物头像预览"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                />
              ) : (
                petAvatarEmoji(guideForm.species)
              )}
            </label>
            <label htmlFor="pet-avatar-input" className="pet-avatar-camera" aria-label="上传宠物头像" style={{ cursor: "pointer" }}>
              <Camera size={18} />
            </label>
            <p>{guideForm.image_url ? "点击更换头像" : "点击上传宠物头像"}</p>
          </section>

          <div>
            <label className="pet-label">宠物名称 <em>*</em></label>
            <input
              className="pet-input"
              placeholder="请输入宠物名称"
              value={guideForm.name}
              onChange={(e) => setGuideForm((s) => ({ ...s, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="pet-label">宠物类型 <em>*</em></label>
            <div className="pet-species-grid">
              <button
                type="button"
                className={`pet-species-card ${guideForm.species === "dog" ? "active" : ""}`}
                onClick={() => setGuideForm((s) => ({ ...s, species: "dog", breed: "" }))}
              >
                <Dog size={22} />
                <strong>狗狗</strong>
                {guideForm.species === "dog" ? <Check size={18} /> : null}
              </button>
              <button
                type="button"
                className={`pet-species-card ${guideForm.species === "cat" ? "active" : ""}`}
                onClick={() => setGuideForm((s) => ({ ...s, species: "cat", breed: "" }))}
              >
                <Cat size={22} />
                <strong>猫咪</strong>
                {guideForm.species === "cat" ? <Check size={18} /> : null}
              </button>
              <button
                type="button"
                className={`pet-species-card ${guideForm.species === "other" ? "active" : ""}`}
                onClick={() => setGuideForm((s) => ({ ...s, species: "other", breed: "" }))}
              >
                <Rabbit size={22} />
                <strong>其他</strong>
                {guideForm.species === "other" ? <Check size={18} /> : null}
              </button>
            </div>
          </div>

          <div>
            <label className="pet-label">品种 <em>*</em></label>
            <div className="pet-breed-flow">
              {(breedOptionsBySpecies[guideForm.species] || breedOptionsBySpecies.dog).map((breed) => (
                <button
                  key={breed}
                  type="button"
                  className={`pet-breed-chip ${guideForm.breed === breed ? "active" : ""}`}
                  onClick={() => setGuideForm((s) => ({ ...s, breed }))}
                >
                  {breed}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="pet-label">性别 <em>*</em></label>
            <div className="pet-gender-grid">
              <button
                type="button"
                className={`pet-gender-card ${guideForm.gender === "male" ? "active" : ""}`}
                onClick={() => setGuideForm((s) => ({ ...s, gender: "male" }))}
              >
                <span className="pet-gender-symbol">♂</span>
                <span>公</span>
              </button>
              <button
                type="button"
                className={`pet-gender-card ${guideForm.gender === "female" ? "active" : ""}`}
                onClick={() => setGuideForm((s) => ({ ...s, gender: "female" }))}
              >
                <span className="pet-gender-symbol">♀</span>
                <span>母</span>
              </button>
            </div>
          </div>

          <div>
            <label className="pet-label">出生日期</label>
            <label className="pet-date-wrap">
              <Calendar size={20} />
              <input
                className="pet-input pet-date-input"
                type="date"
                value={guideForm.birthday}
                onChange={(e) => setGuideForm((s) => ({ ...s, birthday: e.target.value }))}
              />
            </label>
          </div>
        </>
      );
    }

    if (step === 2) {
      return (
        <section className="pet-look-step">
          <div>
            <label className="pet-label">毛色</label>
            <div className="pet-look-chip-flow">
              {colorOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`pet-look-chip ${guideForm.color === item ? "active" : ""}`}
                  onClick={() => setGuideForm((s) => ({ ...s, color: item }))}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="pet-label">体型</label>
            <div className="pet-size-grid">
              {bodySizeOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`pet-size-card ${guideForm.bodySize === item.value ? "active" : ""}`}
                  onClick={() => setGuideForm((s) => ({ ...s, bodySize: item.value }))}
                >
                  <strong className="pet-size-title">{item.label}</strong>
                  <span className="pet-size-hint">{bodySizeHint[item.value]}</span>
                  {guideForm.bodySize === item.value ? <span className="pet-size-check">✓</span> : null}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="pet-label">体重 (kg)</label>
            <label className="pet-weight-wrap">
              <span className="pet-weight-icon">⚖</span>
              <input
                className="pet-input pet-weight-input"
                placeholder="请输入体重"
                value={guideForm.weight_kg}
                onChange={(e) => setGuideForm((s) => ({ ...s, weight_kg: e.target.value }))}
                type="number"
                step="0.1"
              />
              <span className="pet-weight-unit">kg</span>
            </label>
          </div>

          <div className="pet-tip-card">
            <span>!</span>
            <p>体型和体重信息有助于我们为您推荐合适的饮食和运动方案。</p>
          </div>
        </section>
      );
    }

    if (step === 3) {
      return (
        <section className="pet-health-step">
          <article className="pet-health-card">
            <div className="pet-health-left">
              <span className="pet-health-icon"><Heart size={22} /></span>
              <div>
                <h4>是否已绝育</h4>
                <p>帮助我们更好地了解宠物健康状况</p>
              </div>
            </div>
            <button
              type="button"
              className={`pet-health-switch ${guideForm.neutered ? "on" : ""}`}
              onClick={() => setGuideForm((s) => ({ ...s, neutered: !s.neutered }))}
              aria-label="切换是否已绝育"
            >
              <span />
            </button>
          </article>

          <article className="pet-health-card pet-health-card-alt">
            <div className="pet-health-card-row">
              <div className="pet-health-left">
                <span className={`pet-health-icon${guideForm.hasAllergy ? " alert" : ""}`}>
                  {guideForm.hasAllergy ? <AlertCircle size={22} /> : <CircleHelp size={22} />}
                </span>
                <div>
                  <h4>是否有过敏史</h4>
                  <p>了解过敏情况有助于饮食建议</p>
                </div>
              </div>
              <button
                type="button"
                className={`pet-health-switch ${guideForm.hasAllergy ? "on" : ""}`}
                onClick={() => setGuideForm((s) => ({ ...s, hasAllergy: !s.hasAllergy }))}
                aria-label="切换是否有过敏史"
              >
                <span />
              </button>
            </div>
            {guideForm.hasAllergy && (
              <textarea
                className="pet-input pet-allergy-textarea"
                placeholder="请描述宠物的过敏情况..."
                value={guideForm.allergyNotes}
                onChange={(e) => setGuideForm((s) => ({ ...s, allergyNotes: e.target.value }))}
              />
            )}
          </article>

          <div>
            <label className="pet-label">特殊说明</label>
            <textarea
              className="pet-input pet-special-textarea"
              placeholder="请描述宠物是否有慢性病、正在服用的药物、特殊护理需求等..."
              value={guideForm.specialNotes}
              onChange={(e) => setGuideForm((s) => ({ ...s, specialNotes: e.target.value }))}
            />
          </div>

          <div className="pet-tip-card pet-tip-card-alt">
            <span><Heart size={16} /></span>
            <p>这些健康信息将帮助我们为您提供更精准的健康建议和提醒服务。</p>
          </div>
        </section>
      );
    }

    return (
      <article className="pet-preview-card">
        <div className="pet-preview-header">
          <div className="pet-preview-avatar">
            <PawPrint size={20} color="#8B7355" />
          </div>
          <div>
            <h4>{guideForm.name || "未命名宠物"}</h4>
            <p>
              {(guideForm.species === "cat" && "猫猫") ||
                (guideForm.species === "dog" && "狗狗") ||
                "其他"}
              {guideForm.breed ? ` · ${guideForm.breed}` : ""}
            </p>
          </div>
        </div>

        <div className="pet-preview-grid">
          <div>
            <span>毛色</span>
            <strong>{guideForm.color || "未填写"}</strong>
          </div>
          <div>
            <span>体型</span>
            <strong>{bodySizeOptions.find((x) => x.value === guideForm.bodySize)?.label || "未填写"}</strong>
          </div>
          <div>
            <span>体重</span>
            <strong>{guideForm.weight_kg ? `${guideForm.weight_kg} kg` : "未填写"}</strong>
          </div>
          <div>
            <span>健康信息</span>
            <strong>
              {guideForm.neutered ? "已绝育" : "未绝育"} / {guideForm.hasAllergy ? "有过敏" : "无过敏"}
            </strong>
          </div>
        </div>
      </article>
    );
  };

  if (pets.length === 0 || step >= 1) {
    return (
      <main className="dash-page">
        {step === 0 ? (
          <section className="dash-welcome-screen">
            <header className="dash-welcome-header">
              <h2 className="dash-welcome-title">首页</h2>
              <p className="dash-welcome-sub">守护宠物健康</p>
            </header>

            <section className="dash-hero-card">
              <div className="dash-hero-avatar">
                <PawPrint size={36} />
                <Star size={16} className="dash-hero-star" />
              </div>
              <h3>欢迎使用宠物健康管家</h3>
              <p>让我们一起守护您宠物的健康</p>
            </section>

            <section className="dash-features-card">
              <h4>您可以在这里</h4>

              <div className="dash-features-list">
                <article className="dash-feature-item">
                  <span className="dash-feature-icon green"><Heart size={20} /></span>
                  <div>
                    <strong>记录健康数据</strong>
                    <p>体重、疫苗、驱虫、体检等全方位记录</p>
                  </div>
                </article>

                <article className="dash-feature-item">
                  <span className="dash-feature-icon blue"><CalendarDays size={20} /></span>
                  <div>
                    <strong>智能健康提醒</strong>
                    <p>再也不会错过疫苗、驱虫等重要日期</p>
                  </div>
                </article>

                <article className="dash-feature-item">
                  <span className="dash-feature-icon purple"><Brain size={20} /></span>
                  <div>
                    <strong>AI 健康分析</strong>
                    <p>智能分析宠物健康状况，提供专业建议</p>
                  </div>
                </article>

                <article className="dash-feature-item">
                  <span className="dash-feature-icon amber"><FileText size={20} /></span>
                  <div>
                    <strong>一键共享记录</strong>
                    <p>方便快捷地与兽医分享健康档案</p>
                  </div>
                </article>
              </div>
            </section>

            <button className="dash-tip-btn" type="button" onClick={() => setStep(1)}>
              <TriangleAlert size={18} />
              <span>添加您的第一只宠物，开启全方位的健康管理之旅</span>
            </button>

            <button className="dash-main-btn" type="button" onClick={() => setStep(1)}>
              <PawPrint size={22} />
              <span>添加我的第一只宠物</span>
            </button>
          </section>
        ) : (
          <section className="dash-add-screen">
            <header className="dash-add-topbar">
              <button
                type="button"
                className="dash-add-back"
                onClick={() => {
                  if (step > 1) prevStep();
                  else {
                    setStep(0);
                    setGuideMsg("");
                  }
                }}
              >
                <ArrowLeft size={24} />
              </button>
              <h3>添加宠物</h3>
              <span />
            </header>

            <section className="dash-add-meta">
              <div className="dash-add-step-title">{stepTitles[step]}</div>
              <div className="dash-add-step-index">{step}/4</div>
            </section>

            <div className="dash-add-progress">
              <span style={{ width: `${(step / 4) * 100}%` }} />
            </div>

            <section className="dash-add-scroll">{renderGuideStep()}</section>

            {guideMsg ? <div className="dash-msg-error">{guideMsg}</div> : null}

            <footer className="dash-add-footer">
              {step > 1 && step < 4 ? (
                <div className="dash-footer-grid">
                  <button type="button" className="dash-btn-prev" onClick={prevStep} disabled={savingGuide}>
                    <ArrowLeft size={20} />
                    <span>上一步</span>
                  </button>
                  <button type="button" className="dash-btn-next" onClick={nextStep} disabled={savingGuide}>
                    <span>下一步</span>
                    <ArrowRight size={22} />
                  </button>
                </div>
              ) : step < 4 ? (
                <button type="button" className="dash-btn-next" onClick={nextStep} disabled={savingGuide}>
                  <span>下一步</span>
                  <ArrowRight size={22} />
                </button>
              ) : (
                <button type="button" className="dash-btn-confirm" onClick={submitGuide} disabled={savingGuide}>
                  <span>{savingGuide ? "添加中..." : "确认添加"}</span>
                  <ArrowRight size={22} />
                </button>
              )}
            </footer>
          </section>
        )}
      </main>
    );
  }

  return (
    <main className="dash-page-container">
      {/* 页面标题区 */}
      <section className="dash-header">
        <h1 className="dash-title">首页</h1>
        <p className="dash-subtitle">宠物健康管理</p>
      </section>

      {/* 用户信息卡片 */}
      <section className="dash-profile-card">
        <div className="dash-avatar-section">
          <label htmlFor="dashboard-avatar-input" className="dash-avatar-container" style={{ cursor: "pointer", overflow: "hidden" }}>
            {displayDashAvatar ? (
              <img
                src={displayDashAvatar}
                alt={`${selectedPet?.name || '宠物'} 头像`}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              <>
                <PawPrint size={32} className="dash-avatar-icon" />
                <span
                  className="dash-avatar-camera"
                  aria-label="上传宠物照片"
                  title="点击更换宠物照片"
                >
                  <Camera size={12} />
                </span>
              </>
            )}
            <Star size={14} className="dash-star-deco" style={{ zIndex: 1 }} />
          </label>
          <input
            type="file"
            accept="image/*"
            id="dashboard-avatar-input"
            style={{ display: "none" }}
            onChange={(e) => {
              if (!selectedPet) return;
              const file = e.target.files?.[0];
              if (!file) return;
              if (!file.type.startsWith("image/")) {
                alert("请选择图片文件");
                return;
              }
              const reader = new FileReader();
              reader.onload = async (ev) => {
                const image_url = ev.target?.result as string;
                // 立即更新 UI + 持久化 localStorage
                setDashAvatarUrl(image_url);
                try { localStorage.setItem(`pet_avatar_${selectedPet.id}`, image_url); } catch {}
                // 尝试同步后端（不阻塞）
                try { await updatePet(selectedPet.id, { image_url }, phone); } catch {}
              };
              reader.readAsDataURL(file);
            }}
          />
        </div>

        <div className="dash-user-info">
          <h2 className="dash-username">{ownerName}</h2>
          <div className="dash-pet-info">
            <span>{petCount > 0 ? `${petCount} 只宠物` : '暂无宠物'}</span>
            <span className="dash-verified-badge">
              <Star size={12} fill="currentColor" />
              已认证
            </span>
          </div>
        </div>
      </section>

      {/* 主要菜单卡片 */}
      <section className="dash-card">
        {mainMenus.map((item, idx) => (
          <div key={item.label}>
            <MenuRow item={item} />
            {idx !== mainMenus.length - 1 && <div className="dash-divider" />}
          </div>
        ))}
      </section>

      {/* 次要菜单卡片 */}
      <section className="dash-card dash-card-secondary">
        {secondMenus.map((item, idx) => (
          <div key={item.label}>
            <MenuRow item={item} />
            {idx !== secondMenus.length - 1 && <div className="dash-divider" />}
          </div>
        ))}
      </section>

      {/* 退出登录 */}
      <section className="dash-logout-section">
        <button type="button" className="dash-logout-btn" onClick={onLogout}>
          <span className="dash-logout-icon-wrap">
            <LogOut size={18} />
          </span>
          <span>退出登录</span>
        </button>
      </section>
    </main>
  );
}
