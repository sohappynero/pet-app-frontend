import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AddPetPage.css";
import {
  PawPrint,
  ChevronRight,
  Vote,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Sparkles,
  CalendarDays,
  Camera,
} from "lucide-react";

import { createPet, createPetWithAvatar, mapUiSpeciesToApi } from "../lib/api";
import { useShell } from "../hooks/useShell";
import type { Gender } from "../types";

/* ── 类型定义 ── */
type Species = "dog" | "cat" | "other";

interface OnboardingForm {
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  birthday: string;
  color: string;
  bodySize: "small" | "medium" | "large";
  weightKg: string;
  neutered: boolean;
  hasAllergy: boolean;
  allergyNotes: string;
  specialNotes: string;
}

/* ── 默认表单 & 常量 ── */
const defaultForm: OnboardingForm = {
  name: "",
  species: "cat",
  breed: "",
  gender: "unknown",
  birthday: "",
  color: "白色",
  bodySize: "small",
  weightKg: "",
  neutered: false,
  hasAllergy: false,
  allergyNotes: "",
  specialNotes: "",
};

const stepTitles: Record<number, string> = {
  1: "基础信息",
  2: "外观特征",
  3: "健康信息",
  4: "确认添加",
};

const stepEmojis: Record<number, string> = {
  1: "📝",
  2: "🎨",
  3: "💊",
  4: "✨",
};

const colorOptions = [
  "白色", "黑色", "黄色", "棕色", "灰色", "花色", "奶油色", "其他",
];

const bodySizeOptions = [
  { label: "小型", value: "small" as const },
  { label: "中型", value: "medium" as const },
  { label: "大型", value: "large" as const },
];

const bodySizeHint: Record<string, string> = {
  small: "≤10kg",
  medium: "10-25kg",
  large: "≥25kg",
};

const breedBySpecies: Record<string, string[]> = {
  dog: ["金毛寻回犬", "拉布拉多", "柯基", "泰迪", "哈士奇", "柴犬", "边境牧羊犬", "德国牧羊犬", "萨摩耶", "比熊", "吉娃娃", "博美", "法斗", "阿拉斯加", "其他"],
  cat: ["中华田园猫", "英短", "美短", "布偶猫", "暹罗猫", "波斯猫", "加菲猫", "缅因猫", "苏格兰折耳猫", "俄罗斯蓝猫", "无毛猫", "其他"],
  other: ["兔子", "仓鼠", "豚鼠", "鹦鹉", "龙猫", "其他"],
};

function speciesEmoji(s: Species): string {
  return s === "dog" ? "🐕" : s === "cat" ? "🐱" : "🐰";
}

function mapGenderLabel(g: Gender): string {
  if (g === "male") return "公";
  if (g === "female") return "母";
  return "未知";
}

function mapSpeciesLabel(s: Species): string {
  return s === "dog" ? "犬" : s === "cat" ? "猫" : "其他";
}

/* ══════════════════ 组件 ══════════════════ */

export default function Dashboard() {
  const { pets, refreshPets } = useShell();
  const navigate = useNavigate();
  const location = useLocation();

  /* ── 状态 ── */
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardingForm>(defaultForm);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [weightError, setWeightError] = useState("");

  /* ── 头像上传状态 ── */
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  /* ── 进入添加模式 ── */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("add") === "1") {
      setIsAddingMode(true);
      setStep(1);
      setForm(defaultForm);
      setMsg("");
    }
  }, [location.search]);

  /* ── 有宠物且非添加模式 → 跳转宠物列表 ── */
  useEffect(() => {
    const isAddPage = location.search.includes("add=1");
    if (!isAddingMode && !isAddPage && pets.length > 0) {
      navigate("/app/pets", { replace: true });
    }
  }, [isAddingMode, pets.length, navigate, location.search]);

  /* ── 字段更新 helper ── */
  const update = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ── 下一步校验 ── */
  const nextStep = () => {
    setMsg("");
    if (step === 1) {
      if (!form.name.trim()) { setMsg("请输入宠物名字"); return; }
      if (!form.breed.trim()) { setMsg("请选择品种"); return; }
      if (form.gender === "unknown") { setMsg("请选择性别"); return; }
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  /* ── 头像选择处理 ── */
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMsg("请选择图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg("图片大小不能超过 5MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setMsg("");
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
  };

  /* ── 提交 ── */
  const submitGuide = async () => {
    if (!form.name.trim()) { setMsg("请输入宠物名字"); return; }
    // 二次校验 breed/gender 与 nextStep 第1步保持一致
    if (!form.breed.trim()) { setMsg("请选择品种"); setStep(1); return; }
    if (form.gender === "unknown") { setMsg("请选择性别"); setStep(1); return; }
    setSaving(true);
    setMsg("");
    try {
      // 使用 createPetWithAvatar 确保所有字段完整发送 + 支持头像
      await createPetWithAvatar({
        pet_name: form.name.trim(),
        species: mapUiSpeciesToApi(form.species),  // dog/cat/other → 后端转中文
        breed: form.breed?.trim() || "未填写",
        gender: form.gender === "male" ? "公" : form.gender === "female" ? "母" : "未知",
        birth_date: form.birthday || undefined,
        weight: form.weightKg ? parseFloat(form.weightKg) : null,
        neutered: form.neutered,
        notes: [
          form.color !== "白色" ? `毛发颜色: ${form.color}` : "",
          `体型: ${bodySizeOptions.find((o) => o.value === form.bodySize)?.label ?? ""}`,
          form.hasAllergy ? `过敏: ${form.allergyNotes || "是"}` : "",
          form.specialNotes ? `备注: ${form.specialNotes}` : "",
        ]
          .filter(Boolean)
          .join("\n") || null,
        avatarFile: avatarFile, // 支持创建宠物时同步上传头像
      });
      await refreshPets();
      navigate("/app/pets");
    } catch (err: unknown) {
      const e = err as Error;
      setMsg(e.message || "添加失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  /* ── 渲染各步骤内容 ── */
  const renderGuideStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="onboard-form">
            {/* 名字 */}
            <div className="onboard-card">
              <label className="onboard-label">
                <Sparkles size={14} /> 宠物名字 <span className="onboard-required">*</span>
              </label>
              <input
                className="onboard-input"
                placeholder="给它取个可爱的名字吧～"
                value={form.name}
                maxLength={20}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>


            {/* 物种 */}
            <div className="onboard-card">
              <label className="onboard-label"><PawPrint size={14} /> 物种</label>
              <div className="onboard-toggle-group">
                {(["dog", "cat", "other"] as Species[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`onboard-toggle${form.species === s ? " active" : ""}`}
                    onClick={() => { update("species", s); update("breed", ""); }}
                  >
                    {speciesEmoji(s)} {s === "dog" ? "狗狗" : s === "cat" ? "猫咪" : "其他"}
                  </button>
                ))}
              </div>
            </div>

            {/* 品种 */}
            <div className="onboard-card">
              <label className="onboard-label">
                品种 <span className="onboard-required">*</span>
              </label>
              <div className="onboard-tags-wrap">
                {(breedBySpecies[form.species] || []).map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`onboard-tag${form.breed === b ? " active" : ""}`}
                    onClick={() => update("breed", b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* 性别 */}
            <div className="onboard-card">
              <label className="onboard-label">
                性别 <span className="onboard-required">*</span>
              </label>
              <div className="onboard-gender-group">
                {([
                  { value: "male" as Gender, label: "♂ 男孩", icon: "💙" },
                  { value: "female" as Gender, label: "♀ 女孩", icon: "💗" },
                ]).map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    className={`onboard-gender-btn${form.gender === g.value ? " active" : ""}`}
                    onClick={() => update("gender", g.value)}
                  >
                    <span>{g.icon}</span> {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 生日 */}
            <div className="onboard-card">
              <label className="onboard-label"><CalendarDays size={14} /> 生日（选填）</label>
              <div className="onboard-date-wrap">
                <input
                  type="date"
                  className="onboard-date-input"
                  value={form.birthday}
                  onChange={(e) => update("birthday", e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="onboard-form">
            {/* 毛发颜色 */}
            <div className="onboard-card">
              <label className="onboard-label">🎨 毛发颜色</label>
              <div className="onboard-tags-wrap">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`onboard-tag onboard-color-tag${form.color === c ? " active" : ""}`}
                    onClick={() => update("color", c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* 体型 */}
            <div className="onboard-card">
              <label className="onboard-label">📏 体型</label>
              <div className="onboard-size-group">
                {bodySizeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`onboard-size-btn${form.bodySize === opt.value ? " active" : ""}`}
                    onClick={() => update("bodySize", opt.value)}
                  >
                    <strong>{opt.label}</strong>
                    <small>{bodySizeHint[opt.value]}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* 体重 — 联动体型校验 */}
            <div className="onboard-card">
              <label className="onboard-label">
                ⚖️ 体重（kg，选填）
                {form.bodySize === "small" && (
                  <span className="weight-range-hint">小于等于10kg</span>
                )}
                {form.bodySize === "medium" && (
                  <span className="weight-range-hint">10~25kg之间</span>
                )}
                {form.bodySize === "large" && (
                  <span className="weight-range-hint">大于等于25kg</span>
                )}
              </label>
              <div className={`onboard-weight-wrap${weightError ? " has-error" : ""}`}>
                <input
                  type="number"
                  className="onboard-weight-input"
                  placeholder="例如: 5.5"
                  min={form.bodySize === "medium" ? 10 : form.bodySize === "large" ? 25 : 0.1}
                  max={form.bodySize === "small" ? 10 : form.bodySize === "medium" ? 25 : 200}
                  step={0.1}
                  value={form.weightKg}
                  onChange={(e) => {
                    const val = e.target.value;
                    update("weightKg", val);
                    // 联动校验 — 负数/零/空/双向边界检查
                    if (!val || val.trim() === "") {
                      setWeightError("");
                      return;
                    }
                    const w = parseFloat(val);
                    if (isNaN(w) || w <= 0) {
                      setWeightError("体重必须大于 0kg");
                      return;
                    }
                    if (form.bodySize === "small") {
                      if (w > 10) setWeightError("小型宠物体重大于 10kg，请确认体型或体重");
                      else setWeightError("");
                    } else if (form.bodySize === "medium") {
                      if (w < 10) setWeightError("中型宠物体重小于 10kg，请确认体型或体重");
                      else if (w > 25) setWeightError("中型宠物体重大于 25kg，请确认体型或体重");
                      else setWeightError("");
                    } else if (form.bodySize === "large") {
                      if (w < 25) setWeightError("大型宠物体重小于 25kg，请确认体型或体重");
                      else setWeightError("");
                    }
                  }}
                />
                <span className="onboard-weight-unit">kg</span>
              </div>
              {weightError && (
                <p className="weight-error-text"><AlertCircle size={13} /> {weightError}</p>
              )}
              {!weightError && (
                <p className="weight-hint-text">已根据体型设置合理范围，如超出请先调整体型</p>
              )}
            </div>

            <div className="onboard-tip">
              <span>💡</span>
              <p>体型和体重信息有助于我们为你的宠物推荐更精准的健康建议和饮食方案。</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="onboard-form">
            {/* 绝育 */}
            <div className="onboard-card onboard-switch-card">
              <div className="onboard-switch-info">
                <label className="onboard-label" style={{ marginBottom: 0 }}>💉 是否绝育</label>
                <p className="onboard-switch-desc">绝育有助于延长寿命</p>
              </div>
              <button
                type="button"
                className={`onboard-switch${form.neutered ? " active" : ""}`}
                onClick={() => update("neutered", !form.neutered)}
              >
                <span className="onboard-switch-thumb" />
              </button>
            </div>

            {/* 过敏 */}
            <div className={`onboard-card onboard-allergy-card${form.hasAllergy ? " active" : ""}`}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: form.hasAllergy ? 12 : 0 }}>
                <div className="onboard-switch-info">
                  <label className="onboard-label" style={{ marginBottom: 0 }}>
                    {form.hasAllergy ? (
                      <span className="allergy-alert-icon">🔴</span>
                    ) : (
                      <span style={{ color: "#C4959E" }}>⚪</span>
                    )}{" "}
                    过敏情况
                  </label>
                  {!form.hasAllergy && <p className="onboard-switch-desc">记录过敏原便于提醒</p>}
                </div>
                <button
                  type="button"
                  className={`onboard-switch onboard-switch-warn${form.hasAllergy ? " active" : ""}`}
                  onClick={() => update("hasAllergy", !form.hasAllergy)}
                >
                  <span className="onboard-switch-thumb" />
                </button>
              </div>
              {form.hasAllergy && (
                <div className="allergy-expanded-content">
                  <div className="allergy-reminder">
                    <AlertCircle size={14} />
                    <span>请详细记录过敏原，我们会在相关提醒中自动标注避免接触。</span>
                  </div>
                  <textarea
                    className="onboard-textarea"
                    placeholder="例如: 鸡肉、某些药物、花粉、尘螨..."
                    value={form.allergyNotes}
                    onChange={(e) => update("allergyNotes", e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* 特殊备注 */}
            <div className="onboard-card">
              <label className="onboard-label">📝 特殊备注（选填）</label>
              <textarea
                className="onboard-textarea"
                placeholder="任何你想记录的信息：性格、习惯、喜好..."
                value={form.specialNotes}
                onChange={(e) => update("specialNotes", e.target.value)}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="onboard-form">
            <div className="onboard-preview">
              <div className="onboard-preview-header">
                {/* 可点击的头像上传区域 */}
                <label
                  className="onboard-preview-avatar"
                  style={{ cursor: "pointer", position: "relative", overflow: "hidden" }}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="宠物头像预览"
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
                    />
                  ) : (
                    <span>{speciesEmoji(form.species)}</span>
                  )}
                  <span
                    className="avatar-camera-overlay"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: "4px",
                      background: "rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  >
                    <Camera size={12} /> {avatarPreview ? "更换" : "上传"}
                  </span>
                </label>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarSelect}
                />
                <div>
                  <h4>{form.name || "未命名"}</h4>
                  <p>{form.breed || "未知品种"} · {mapGenderLabel(form.gender)}</p>
                </div>
              </div>

              {/* 已选头像提示 */}
              {avatarFile && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  padding: "8px 12px",
                  background: "rgba(124, 92, 255, 0.08)",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#5C3D99",
                }}>
                  <span>📷 已选择头像：{avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)}KB)</span>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); clearAvatar(); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#E85A71",
                      cursor: "pointer",
                      fontSize: 13,
                      padding: "2px 6px",
                    }}
                  >
                    移除
                  </button>
                </div>
              )}

              <div className="onboard-preview-grid">
                <div><span>物种</span><strong>{mapSpeciesLabel(form.species)}</strong></div>
                <div><span>性别</span><strong>{mapGenderLabel(form.gender)}</strong></div>
                <div><span>毛发</span><strong>{form.color}</strong></div>
                <div><span>体型</span><strong>{bodySizeOptions.find((o) => o.value === form.bodySize)?.label}</strong></div>
                <div><span>生日</span><strong>{form.birthday || "未设置"}</strong></div>
                <div><span>体重</span><strong>{form.weightKg ? `${form.weightKg} kg` : "未填写"}</strong></div>
                <div><span>绝育</span><strong>{form.neutered ? "是" : "否"}</strong></div>
                <div><span>过敏</span><strong>{form.hasAllergy ? "有" : "无"}</strong></div>
              </div>
              {form.specialNotes && (
                <div className="onboard-preview-notes">
                  <span className="onboard-notes-label">备注</span>
                  <p>{form.specialNotes}</p>
                </div>
              )}
            </div>

            <div className="onboard-tip onboard-tip-success">
              <span>✅</span>
              <p>确认无误后点击下方按钮完成添加。之后你可以在宠物详情页随时修改这些信息。</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  /* ── 进度条宽度 ── */
  const progressPct = ((step - 1) / 3) * 100;

  /* ── 主渲染：非添加模式 — Welcome 页 ── */
  if (!isAddingMode) {
    return (
      <main className="onboard-welcome-container">
        {/* 浮动装饰 */}
        <div className="floating-decorations" aria-hidden="true">
          <span className="float-item float-1">✨</span>
          <span className="float-item float-2">💖</span>
          <span className="float-item float-3">🌸</span>
          <span className="float-item float-4">⭐</span>
          <span className="float-item float-5">🎀</span>
          <span className="float-paw paw-1">🐾</span>
          <span className="float-paw paw-2">🐾</span>
          <span className="float-paw paw-3">🐾</span>
        </div>

        <div className="onboard-welcome-content">
          {/* Hero 区域 */}
          <section className="welcome-hero">
            <div className="welcome-emoji">🐾</div>
            <h1 className="welcome-title heartbeat-text">
              欢迎来到 <span className="title-accent">宠物管家</span>
            </h1>
            <p className="welcome-subtitle">让我们开始创建你的第一个宠物档案吧</p>
          </section>

          {/* 功能卡片 */}
          <div className="welcome-feature-cards">
            {[
              { icon: "❤️", title: "健康追踪", desc: "记录体重、疫苗、驱虫等健康数据" },
              { icon: "🔔", title: "智能提醒", desc: "自动提醒喂食、体检等重要事项" },
              { icon: "🧠", title: "AI 分析", desc: "基于数据的健康趋势分析与建议" },
              { icon: "📋", title: "健康记录", desc: "完整记录体检、疫苗、驱虫等健康档案" },
            ].map((f) => (
              <div className="feature-card" key={f.title}>
                <span className="feature-icon">{f.icon}</span>
                <div>
                  <strong>{f.title}</strong>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA 按钮 */}
          <button type="button" className="welcome-primary-btn" onClick={() => setIsAddingMode(true)}>
            <PawPrint size={20} /> 开始添加宠物
          </button>

          {/* 功能投票入口卡片 */}
          <button
            onClick={() => navigate("/app/feature-vote")}
            className="w-full rounded-2xl p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md text-left active:scale-[0.98] transition mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Vote className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">下一个功能你说了算</div>
                <div className="text-xs opacity-90 mt-0.5">参与投票，决定开发顺序</div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-80" />
            </div>
          </button>
        </div>
      </main>
    );
  }

  /* ── 四步引导界面 ── */
  return (
    <div className="onboard-add-container">
      {/* 浮动装饰（引导页也有） */}
      <div className="floating-decorations floating-subtle" aria-hidden="true">
        <span className="float-item float-1">✨</span>
        <span className="float-item float-3">🌸</span>
        <span className="float-item float-5">🎀</span>
        <span className="float-paw paw-1">🐾</span>
        <span className="float-paw paw-2">🐾</span>
      </div>

      {/* 顶部导航栏 */}
      <header className="onboard-topbar">
        <button type="button" className="onboard-back-btn" onClick={() => navigate("/app/pets")} aria-label="返回">
          <ArrowLeft size={20} />
        </button>
        <h3>添加宠物</h3>
        <div style={{ width: 38 }} />
      </header>

      {/* 步骤标题区 & 进度 */}
      <div className="onboard-step-header">
        <div className="step-info">
          <span className="step-emoji">{stepEmojis[step]}</span>
          <div>
            <div className="step-title">{stepTitles[step]}</div>
            <div className="step-index">步骤 {step} / 4</div>
          </div>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* 错误提示 */}
      {msg && (
        <div className="onboard-error-msg" role="alert">
          <AlertCircle size={14} /> {msg}
        </div>
      )}

      {/* 步骤内容区 */}
      <div className="onboard-scroll-area">{renderGuideStep()}</div>

      {/* 底部按钮 */}
      <footer className="onboard-footer">
        {step < 4 ? (
          <div className="footer-btn-row">
            <button
              type="button"
              className="btn-prev"
              disabled={step <= 1}
              onClick={prevStep}
            >
              <ArrowLeft size={18} /> 上一步
            </button>
            <button
              type="button"
              className="btn-next"
              onClick={nextStep}
            >
              下一步 <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn-confirm"
            disabled={saving}
            onClick={submitGuide}
          >
            {saving ? "提交中..." : <><Check size={20} /> 确认添加</>}
          </button>
        )}
      </footer>
    </div>
  );
}
