import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { createPetWithAvatar, mapUiSpeciesToApi } from "../lib/api";
import { useShell } from "../hooks/useShell";
import type { Gender } from "../types";

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

const stepTitles: Record<number, string> = { 1: "基础信息", 2: "外观特征", 3: "健康信息", 4: "确认添加" };
const stepEmojis: Record<number, string> = { 1: "📝", 2: "🎨", 3: "💊", 4: "✨" };
const colorOptions = ["白色", "黑色", "黄色", "棕色", "灰色", "花色", "奶油色", "其他"];
const bodySizeOptions = [
  { label: "小型", value: "small" as const },
  { label: "中型", value: "medium" as const },
  { label: "大型", value: "large" as const },
];
const bodySizeHint: Record<string, string> = { small: "≤10kg", medium: "10-25kg", large: "≥25kg" };
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

export default function Dashboard() {
  const { refreshPets } = useShell();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<OnboardingForm>(defaultForm);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [weightError, setWeightError] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof OnboardingForm>(key: K, value: OnboardingForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMsg("请选择图片文件"); return; }
    if (file.size > 5 * 1024 * 1024) { setMsg("图片大小不能超过 5MB"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setMsg("");
  };
  const clearAvatar = () => {
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
  };

  const submitGuide = async () => {
    if (!form.name.trim()) { setMsg("请输入宠物名字"); return; }
    if (!form.breed.trim()) { setMsg("请选择品种"); setStep(1); return; }
    if (form.gender === "unknown") { setMsg("请选择性别"); setStep(1); return; }
    setSaving(true);
    setMsg("");
    try {
      await createPetWithAvatar({
        pet_name: form.name.trim(),
        species: mapUiSpeciesToApi(form.species),
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
        ].filter(Boolean).join("\n") || null,
        avatarFile: avatarFile,
      });
      await refreshPets();
      navigate("/app");
    } catch (err: unknown) {
      const e = err as Error;
      setMsg(e.message || "添加失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const progressPct = ((step - 1) / 3) * 100;

  return (
    <div className="petos-page">
      <div className="petos-content" style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}>
        {/* 顶栏 */}
        <div className="petos-form-topbar">
          <button type="button" className="petos-form-topbar__back" onClick={() => navigate(-1)} aria-label="返回">←</button>
          <span className="petos-form-topbar__title">添加宠物</span>
          <div style={{ width: 36 }} />
        </div>

        {/* 步骤 + 进度 */}
        <div className="petos-form-step-header">
          <span className="petos-form-step-header__emoji">{stepEmojis[step]}</span>
          <div>
            <div className="petos-form-step-header__title">{stepTitles[step]}</div>
            <div className="petos-form-step-header__index">步骤 {step} / 4</div>
          </div>
        </div>
        <div className="petos-form-progress">
          <div className="petos-form-progress__fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* 错误提示 */}
        {msg && <div className="petos-form-error"><AlertCircle size={14} /> {msg}</div>}

        {/* 步骤内容 */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>

      {/* 底部按钮 */}
      <div className="petos-form-footer">
        {step < 4 ? (
          <div className="petos-form-footer__row">
            <button type="button" className="petos-form-btn-prev" disabled={step <= 1} onClick={prevStep}>← 上一步</button>
            <button type="button" className="petos-form-btn-next" onClick={nextStep}>下一步 →</button>
          </div>
        ) : (
          <button type="button" className="petos-form-btn-next" style={{ width: "100%" }} disabled={saving} onClick={submitGuide}>
            {saving ? "提交中..." : "✓ 确认添加"}
          </button>
        )}
      </div>
    </div>
  );

  function renderStep1() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div className="petos-form-card">
          <label className="petos-form-label">宠物名字 <span className="petos-form-required">*</span></label>
          <input className="petos-form-input" placeholder="给它取个可爱的名字吧～" value={form.name} maxLength={20} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div className="petos-form-card">
          <label className="petos-form-label">物种</label>
          <div className="petos-form-toggle-group">
            {(["dog", "cat", "other"] as Species[]).map((s) => (
              <button key={s} type="button" className={`petos-form-toggle${form.species === s ? " petos-form-toggle--on" : ""}`} onClick={() => { update("species", s); update("breed", ""); }}>
                {speciesEmoji(s)} {s === "dog" ? "狗狗" : s === "cat" ? "猫咪" : "其他"}
              </button>
            ))}
          </div>
        </div>
        <div className="petos-form-card">
          <label className="petos-form-label">品种 <span className="petos-form-required">*</span></label>
          <div className="petos-form-tags">
            {(breedBySpecies[form.species] || []).map((b) => (
              <button key={b} type="button" className={`petos-form-tag${form.breed === b ? " petos-form-tag--on" : ""}`} onClick={() => update("breed", b)}>{b}</button>
            ))}
          </div>
        </div>
        <div className="petos-form-card">
          <label className="petos-form-label">性别 <span className="petos-form-required">*</span></label>
          <div className="petos-form-gender-group">
            {([{ value: "male" as Gender, label: "♂ 男孩" }, { value: "female" as Gender, label: "♀ 女孩" }]).map((g) => (
              <button key={g.value} type="button" className={`petos-form-gender-btn${form.gender === g.value ? " petos-form-gender-btn--on" : ""}`} onClick={() => update("gender", g.value)}>{g.label}</button>
            ))}
          </div>
        </div>
        <div className="petos-form-card">
          <label className="petos-form-label">生日（选填）</label>
          <input type="date" className="petos-form-date-input" value={form.birthday} onChange={(e) => update("birthday", e.target.value)} />
        </div>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div className="petos-form-card">
          <label className="petos-form-label">🎨 毛发颜色</label>
          <div className="petos-form-tags">
            {colorOptions.map((c) => (
              <button key={c} type="button" className={`petos-form-tag${form.color === c ? " petos-form-tag--on" : ""}`} onClick={() => update("color", c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="petos-form-card">
          <label className="petos-form-label">📏 体型</label>
          <div className="petos-form-size-group">
            {bodySizeOptions.map((opt) => (
              <button key={opt.value} type="button" className={`petos-form-size-btn${form.bodySize === opt.value ? " petos-form-size-btn--on" : ""}`} onClick={() => update("bodySize", opt.value)}>
                <strong>{opt.label}</strong>
                <small>{bodySizeHint[opt.value]}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="petos-form-card">
          <label className="petos-form-label">⚖️ 体重（kg，选填）</label>
          <div className="petos-form-weight-wrap">
            <input className="petos-form-input" type="number" placeholder="例如: 5.5" step={0.1} value={form.weightKg} onChange={(e) => {
              const val = e.target.value;
              update("weightKg", val);
              if (!val || val.trim() === "") { setWeightError(""); return; }
              const w = parseFloat(val);
              if (isNaN(w) || w <= 0) { setWeightError("体重必须大于 0kg"); return; }
              if (form.bodySize === "small") { setWeightError(w > 10 ? "小型宠物体重大于 10kg，请确认" : ""); }
              else if (form.bodySize === "medium") { setWeightError(w < 10 ? "中型宠物体重小于 10kg" : w > 25 ? "中型宠物体重大于 25kg" : ""); }
              else if (form.bodySize === "large") { setWeightError(w < 25 ? "大型宠物体重小于 25kg" : ""); }
            }} />
            <span className="petos-form-weight-unit">kg</span>
          </div>
          {weightError ? <p className="petos-form-weight-error"><AlertCircle size={12} /> {weightError}</p> : <p className="petos-form-weight-hint">已根据体型设置合理范围</p>}
        </div>
        <div className="petos-form-tip"><span>💡</span>体型和体重有助于推荐更精准的健康建议。</div>
      </div>
    );
  }

  function renderStep3() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div className="petos-form-card">
          <div className="petos-form-switch-row">
            <div>
              <label className="petos-form-label" style={{ marginBottom: 0 }}>💉 是否绝育</label>
              <p className="petos-form-weight-hint">绝育有助于延长寿命</p>
            </div>
            <button type="button" className={`petos-form-switch${form.neutered ? " petos-form-switch--on" : ""}`} onClick={() => update("neutered", !form.neutered)}>
              <span className="petos-form-switch__thumb" />
            </button>
          </div>
        </div>
        <div className="petos-form-card">
          <div className="petos-form-switch-row">
            <div>
              <label className="petos-form-label" style={{ marginBottom: 0 }}>⚠️ 过敏情况</label>
              {!form.hasAllergy && <p className="petos-form-weight-hint">记录过敏原便于提醒</p>}
            </div>
            <button type="button" className={`petos-form-switch${form.hasAllergy ? " petos-form-switch--on" : ""}`} onClick={() => update("hasAllergy", !form.hasAllergy)}>
              <span className="petos-form-switch__thumb" />
            </button>
          </div>
          {form.hasAllergy && (
            <div style={{ marginTop: "var(--space-3)" }}>
              <textarea className="petos-form-textarea" placeholder="例如: 鸡肉、某些药物、花粉..." value={form.allergyNotes} onChange={(e) => update("allergyNotes", e.target.value)} />
            </div>
          )}
        </div>
        <div className="petos-form-card">
          <label className="petos-form-label">📝 特殊备注（选填）</label>
          <textarea className="petos-form-textarea" placeholder="性格、习惯、喜好..." value={form.specialNotes} onChange={(e) => update("specialNotes", e.target.value)} />
        </div>
      </div>
    );
  }

  function renderStep4() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        <div className="petos-form-card">
          <div className="petos-form-preview-header">
            <label className="petos-form-preview-avatar" onClick={() => avatarInputRef.current?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
              ) : (
                <span>{speciesEmoji(form.species)}</span>
              )}
              <span className="petos-form-avatar-overlay">📷 {avatarPreview ? "更换" : "上传"}</span>
            </label>
            <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarSelect} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "var(--text-h2)" }}>{form.name || "未命名"}</div>
              <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-caption)" }}>{form.breed || "未知品种"} · {mapGenderLabel(form.gender)}</div>
            </div>
          </div>
          {avatarFile && (
            <div className="petos-form-avatar-info">
              <span>📷 {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)}KB)</span>
              <button type="button" className="petos-form-avatar-remove" onClick={clearAvatar}>移除</button>
            </div>
          )}
          {!avatarFile && (
            <button type="button" className="petos-form-toggle petos-form-toggle--on" style={{ width: "100%", textAlign: "center", marginBottom: "var(--space-3)" }} onClick={() => avatarInputRef.current?.click()}>
              📷 上传宠物照片
            </button>
          )}
          <div className="petos-form-preview-grid">
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
            <div style={{ marginTop: "var(--space-3)", padding: "8px 12px", background: "var(--color-bg)", borderRadius: "var(--radius-sm)" }}>
              <span style={{ fontSize: "var(--text-micro)", color: "var(--color-text-tertiary)" }}>备注</span>
              <p style={{ margin: 0, fontSize: "var(--text-caption)", color: "var(--color-text-primary)" }}>{form.specialNotes}</p>
            </div>
          )}
        </div>
        <div className="petos-form-tip"><span>✅</span>确认无误后点击下方按钮完成添加。</div>
      </div>
    );
  }
}
