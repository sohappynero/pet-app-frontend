import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Droplet,
  FileText,
  Heart,
  PawPrint,
  Scale,
  Sparkles,
  Utensils,
  X,
  Activity,
  TrendingUp,
} from "lucide-react";
import { useShell } from "../hooks/useShell";
import { createRecord, fetchReminders, updatePet } from "../lib/api";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import { Generate3DButton } from "../components/Pet3DAvatarGenerator";

type QuickType = "weight" | "vaccine" | "deworm" | "checkup" | "diet" | "beauty" | null;

function petEmoji(species?: string) {
  if (species === "cat") return "🐱";
  if (species === "other") return "🐰";
  return "🐕";
}

/** localStorage key 前缀：按 pet id 存储本地头像 */
const AVATAR_LS_KEY = (petId: number) => `pet_avatar_${petId}`;

/** 读取本地存储的头像 */
function getLocalAvatar(petId: number): string | null {
  try { return localStorage.getItem(AVATAR_LS_KEY(petId)); } catch { return null; }
}

/** 保存本地头像 */
function saveLocalAvatar(petId: number, url: string) {
  try { localStorage.setItem(AVATAR_LS_KEY(petId), url); } catch {}
}

/** 处理宠物头像上传：读取文件 → 乐观更新 UI → 持久化 localStorage → 异步保存服务端 */
function handlePetAvatarUpload(
  e: React.ChangeEvent<HTMLInputElement>,
  pet: Pet,
  phone: string,
  onSuccess: (newImageUrl: string) => void,
) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("请选择图片文件");
    return;
  }
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const image_url = ev.target?.result as string;
    // 1. 乐观更新 UI
    onSuccess(image_url);
    // 2. 持久化到 localStorage（不依赖后端）
    saveLocalAvatar(pet.id, image_url);
    // 3. 尝试同步到后端（后端可能不保存，不影响前端展示）
    try { await updatePet(pet.id, { image_url }, phone); } catch {
      /* 后端失败不影响已保存的本地头像 */
    }
  };
  reader.readAsDataURL(file);
}

// ── 体重记录弹窗 ─────────────────────────────────────────────────────────────
function WeightModal({ petName, onClose, onSave }: { petName: string; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!weight) return;
    setSaving(true);
    await onSave({ record_type: "observation", title: `体重记录 ${weight}kg`, weight_kg: Number(weight), record_date: date.slice(0, 10), note });
    setSaving(false);
  };

  return (
    <div className="qm-overlay" onClick={onClose}>
      <div className="qm-sheet" onClick={e => e.stopPropagation()}>
        <div className="qm-header">
          <div className="qm-icon qm-icon-weight">
            <Scale size={20} />
          </div>
          <div className="qm-header-text">
            <h3 className="qm-title">添加体重记录</h3>
            <p className="qm-sub">为 {petName} 记录健康数据</p>
          </div>
          <button className="qm-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="qm-body">
          <div className="qm-field">
            <label className="qm-label">体重数值 (kg)</label>
            <div className="qm-input-wrapper">
              <input className="qm-input qm-input-main" type="number" step="0.1" placeholder="请输入体重" value={weight} onChange={e => setWeight(e.target.value)} />
              <span className="qm-unit">kg</span>
            </div>
          </div>
          <div className="qm-field">
            <label className="qm-label">记录时间</label>
            <input className="qm-input" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">备注 (选填)</label>
            <textarea className="qm-input qm-textarea" placeholder="添加备注..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="qm-footer">
          <button className="qm-btn-cancel" onClick={onClose}>取消</button>
          <button className="qm-btn-primary qm-btn-weight" disabled={saving || !weight} onClick={submit}>
            {saving ? "保存中..." : "保存记录"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 疫苗记录弹窗 ─────────────────────────────────────────────────────────────
function VaccineModal({ petName, onClose, onSave }: { petName: string; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [batch, setBatch] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name) return;
    setSaving(true);
    await onSave({ record_type: "vaccine", title: name, record_date: date.slice(0, 10), note: [batch ? `批次号：${batch}` : "", note].filter(Boolean).join("\n") });
    setSaving(false);
  };

  return (
    <div className="qm-overlay" onClick={onClose}>
      <div className="qm-sheet" onClick={e => e.stopPropagation()}>
        <div className="qm-header">
          <div className="qm-icon qm-icon-vaccine">
            <FileText size={20} />
          </div>
          <div className="qm-header-text">
            <h3 className="qm-title">添加疫苗记录</h3>
            <p className="qm-sub">为 {petName} 记录健康数据</p>
          </div>
          <button className="qm-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="qm-body">
          <div className="qm-field">
            <label className="qm-label">疫苗名称</label>
            <input className="qm-input" placeholder="如：狂犬疫苗、犬瘟热疫苗" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">接种时间</label>
            <input className="qm-input" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">疫苗批次号 (选填)</label>
            <input className="qm-input" placeholder="请输入批次号" value={batch} onChange={e => setBatch(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">备注 (选填)</label>
            <textarea className="qm-input qm-textarea" placeholder="添加备注..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="qm-footer">
          <button className="qm-btn-cancel" onClick={onClose}>取消</button>
          <button className="qm-btn-primary qm-btn-vaccine" disabled={saving || !name} onClick={submit}>
            {saving ? "保存中..." : "保存记录"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 驱虫记录弹窗 ─────────────────────────────────────────────────────────────
function DewormModal({ petName, onClose, onSave }: { petName: string; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [drug, setDrug] = useState("");
  const [date, setDate] = useState("");
  const [dewormType, setDewormType] = useState<"体内驱虫" | "体外驱虫">("体内驱虫");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!drug) return;
    setSaving(true);
    await onSave({ record_type: "deworm", title: drug, record_date: date.slice(0, 10), note: [dewormType, note].filter(Boolean).join("\n") });
    setSaving(false);
  };

  return (
    <div className="qm-overlay" onClick={onClose}>
      <div className="qm-sheet" onClick={e => e.stopPropagation()}>
        <div className="qm-header">
          <div className="qm-icon qm-icon-deworm">
            <Bell size={20} />
          </div>
          <div className="qm-header-text">
            <h3 className="qm-title">添加驱虫记录</h3>
            <p className="qm-sub">为 {petName} 记录健康数据</p>
          </div>
          <button className="qm-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="qm-body">
          <div className="qm-field">
            <label className="qm-label">驱虫药品名称</label>
            <input className="qm-input" placeholder="请输入驱虫药品名称" value={drug} onChange={e => setDrug(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">驱虫时间</label>
            <input className="qm-input" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">驱虫类型</label>
            <div className="qm-toggle-row">
              <button className={`qm-toggle ${dewormType === "体内驱虫" ? "active" : ""}`} onClick={() => setDewormType("体内驱虫")}>体内驱虫</button>
              <button className={`qm-toggle ${dewormType === "体外驱虫" ? "active" : ""}`} onClick={() => setDewormType("体外驱虫")}>体外驱虫</button>
            </div>
          </div>
          <div className="qm-field">
            <label className="qm-label">备注 (选填)</label>
            <textarea className="qm-input qm-textarea" placeholder="添加备注..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="qm-footer">
          <button className="qm-btn-cancel" onClick={onClose}>取消</button>
          <button className="qm-btn-primary qm-btn-deworm" disabled={saving || !drug} onClick={submit}>
            {saving ? "保存中..." : "保存记录"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 体检记录弹窗 ─────────────────────────────────────────────────────────────
function CheckupModal({ petName, onClose, onSave }: { petName: string; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [project, setProject] = useState("");
  const [hospital, setHospital] = useState("");
  const [date, setDate] = useState("");
  const [result, setResult] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!project) return;
    setSaving(true);
    await onSave({ record_type: "checkup", title: project, hospital, record_date: date.slice(0, 10), note: [result ? `体检结果：${result}` : "", note].filter(Boolean).join("\n") });
    setSaving(false);
  };

  return (
    <div className="qm-overlay" onClick={onClose}>
      <div className="qm-sheet" onClick={e => e.stopPropagation()}>
        <div className="qm-header">
          <div className="qm-icon qm-icon-checkup">
            <Activity size={20} />
          </div>
          <div className="qm-header-text">
            <h3 className="qm-title">添加体检记录</h3>
            <p className="qm-sub">为 {petName} 记录健康数据</p>
          </div>
          <button className="qm-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="qm-body">
          <div className="qm-field">
            <label className="qm-label qm-label-required">体检项目</label>
            <input className="qm-input" placeholder="如：全面体检、血液检查、X光检查" value={project} onChange={e => setProject(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label qm-label-required">医院/机构</label>
            <input className="qm-input" placeholder="请输入医院或体检机构名称" value={hospital} onChange={e => setHospital(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label qm-label-required">体检时间</label>
            <input className="qm-input" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">体检结果 (选填)</label>
            <input className="qm-input" placeholder="请输入体检结果" value={result} onChange={e => setResult(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">备注 (选填)</label>
            <textarea className="qm-input qm-textarea" placeholder="添加备注..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="qm-footer">
          <button className="qm-btn-cancel" onClick={onClose}>取消</button>
          <button className="qm-btn-primary qm-btn-checkup" disabled={saving || !project} onClick={submit}>
            {saving ? "保存中..." : "保存记录"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 饮食记录弹窗 ─────────────────────────────────────────────────────────────
function DietModal({ petName, onClose, onSave }: { petName: string; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [food, setFood] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!food) return;
    setSaving(true);
    await onSave({ record_type: "observation", title: `饮食记录：${food}`, appetite: amount, record_date: date.slice(0, 10), note });
    setSaving(false);
  };

  return (
    <div className="qm-overlay" onClick={onClose}>
      <div className="qm-sheet" onClick={e => e.stopPropagation()}>
        <div className="qm-header">
          <div className="qm-icon qm-icon-diet">
            <Heart size={20} />
          </div>
          <div className="qm-header-text">
            <h3 className="qm-title">添加饮食记录</h3>
            <p className="qm-sub">为 {petName} 记录健康数据</p>
          </div>
          <button className="qm-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="qm-body">
          <div className="qm-field">
            <label className="qm-label">食物名称</label>
            <input className="qm-input" placeholder="如：狗粮、鸡胸肉、罐头" value={food} onChange={e => setFood(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">食量</label>
            <input className="qm-input" placeholder="如：100g、半杯、一碗" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">喂食时间</label>
            <input className="qm-input" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">备注 (选填)</label>
            <textarea className="qm-input qm-textarea" placeholder="添加备注..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="qm-footer">
          <button className="qm-btn-cancel" onClick={onClose}>取消</button>
          <button className="qm-btn-primary qm-btn-diet" disabled={saving || !food} onClick={submit}>
            {saving ? "保存中..." : "保存记录"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 美容医护弹窗 ─────────────────────────────────────────────────────────────
function BeautyModal({ petName, onClose, onSave }: { petName: string; onClose: () => void; onSave: (d: any) => Promise<void> }) {
  const [project, setProject] = useState("");
  const [shop, setShop] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!project) return;
    setSaving(true);
    await onSave({ record_type: "visit", title: project, hospital: shop, record_date: date.slice(0, 10), note });
    setSaving(false);
  };

  return (
    <div className="qm-overlay" onClick={onClose}>
      <div className="qm-sheet" onClick={e => e.stopPropagation()}>
        <div className="qm-header">
          <div className="qm-icon qm-icon-beauty">
            <Droplet size={20} />
          </div>
          <div className="qm-header-text">
            <h3 className="qm-title">添加美容医护</h3>
            <p className="qm-sub">为 {petName} 记录健康数据</p>
          </div>
          <button className="qm-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="qm-body">
          <div className="qm-field">
            <label className="qm-label">护理项目</label>
            <input className="qm-input" placeholder="如：洗澡、剪毛、指甲修剪、牙齿清洁" value={project} onChange={e => setProject(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">美容机构/美容师</label>
            <input className="qm-input" placeholder="请输入美容机构或美容师名称" value={shop} onChange={e => setShop(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">护理时间</label>
            <input className="qm-input" type="datetime-local" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="qm-field">
            <label className="qm-label">备注 (选填)</label>
            <textarea className="qm-input qm-textarea" placeholder="添加备注..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
        </div>
        <div className="qm-footer">
          <button className="qm-btn-cancel" onClick={onClose}>取消</button>
          <button className="qm-btn-primary qm-btn-beauty" disabled={saving || !project} onClick={submit}>
            {saving ? "保存中..." : "保存记录"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 主页 ──────────────────────────────────────────────────────────────────────
export default function Pets() {
  const navigate = useNavigate();
  const { phone, pets, selectedPet, selectedPetId, setPetId, refreshPets } = useShell();
  const [switchOpen, setSwitchOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState<QuickType>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const currentPet = useMemo(() => selectedPet || pets[0] || null, [selectedPet, pets]);

  // 初始化时从 localStorage 读取已保存的头像
  useEffect(() => {
    if (currentPet) {
      const saved = getLocalAvatar(currentPet.id);
      if (saved) setLocalAvatarUrl(saved);
    }
  }, [currentPet?.id]);

  // 合并本地存储的 avatar URL（优先级：localStorage > 服务端数据）
  const displayPet = useMemo(() => {
    if (!currentPet) return null;
    const local = localAvatarUrl || getLocalAvatar(currentPet.id);
    return local ? { ...currentPet, image_url: local } : currentPet;
  }, [currentPet, localAvatarUrl]);

  const activePetId = selectedPetId ?? pets[0]?.id;
  const extraPetCount = Math.max(0, pets.length - 1);

  // 获取待处理提醒数
  useEffect(() => {
    if (!currentPet) return;
    const run = async () => {
      try {
        const remindersResp = await fetchReminders(phone, currentPet.id, "pending");
        const today = new Date().toISOString().slice(0, 10);
        const due = (remindersResp.data || []).filter((x: any) => x.due_date <= today);
        setPendingCount(due.length);
      } catch { /* ignore */ }
    };
    run();
  }, [phone, currentPet?.id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const handleSave = async (extra: any) => {
    if (!currentPet) return;
    await createRecord({
      phone,
      pet_id: currentPet.id,
      record_type: extra.record_type,
      title: extra.title || "",
      record_date: extra.record_date || new Date().toISOString().slice(0, 10),
      hospital: extra.hospital || "",
      doctor: "",
      symptom: "",
      treatment: "",
      cost: 0,
      weight_kg: extra.weight_kg ?? null,
      mood: "",
      appetite: extra.appetite || "",
      note: extra.note || "",
      images: [],
      next_due_date: null,
    });
    setQuickOpen(null);
    showToast("记录保存成功 ✓");
  };

  if (!currentPet) {
    return (
      <main className="pet-home-page">
        <section className="pet-home-empty">
          <div className="pet-home-empty-icon">
            <PawPrint size={22} />
          </div>
          <h3>还没有宠物档案</h3>
          <p>请先添加宠物后，再查看首页健康概览。</p>
          <button type="button" className="pet-home-view-all" onClick={() => navigate("/app?add=1")}>
            去添加宠物
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="ph3d-page">
      {/* ═══ 顶部 Hero 区域 - 3D宠物展示 ═══ */}
      <section className="ph3d-hero">
        <div className="ph3d-hero-bg">
          <div className="ph3d-hero-gradient" />
          <div className="ph3d-hero-orb ph3d-orb-1" />
          <div className="ph3d-hero-orb ph3d-orb-2" />
          <div className="ph3d-hero-orb ph3d-orb-3" />
          <div className="ph3d-hero-grid-pattern" />
        </div>
        
        <div className="ph3d-hero-inner">
          {/* 左侧文字 */}
          <div className="ph3d-hero-text">
            <div className="ph3d-hero-badge">
              <Sparkles size={12} />
              <span>健康管家</span>
            </div>
            <h1 className="ph3d-hero-title">
              宠物健康<br /><span className="ph3d-title-accent">管理中心</span>
            </h1>
            <p className="ph3d-hero-desc">为爱宠记录每一个健康时刻</p>
            
            {/* 当前宠物信息 */}
            <div className="ph3d-pet-card">
              <label htmlFor="pets-page-avatar-input" className="ph3d-pet-avatar-wrap" style={{ cursor: "pointer", position: "relative" }}>
                {displayPet?.image_url ? (
                  <img
                    src={displayPet.image_url}
                    alt={`${currentPet?.name} 头像`}
                    style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <span className="ph3d-pet-emoji">{petEmoji(currentPet.species)}</span>
                )}
                <span className="ph3d-pet-online" />
              </label>
              <input
                type="file"
                accept="image/*"
                id="pets-page-avatar-input"
                style={{ display: "none" }}
                onChange={(e) => handlePetAvatarUpload(e, currentPet, phone, (url) => { setLocalAvatarUrl(url); refreshPets(); })}
              />
              <div className="ph3d-pet-detail">
                <strong className="ph3d-pet-name">{currentPet?.name || '我的宠物'}</strong>
                <span className="ph3d-pet-meta">{currentPet?.breed || '健康档案'}</span>
              </div>
              <button type="button" className="ph3d-switch-btn" onClick={() => setSwitchOpen(true)}>
                {extraPetCount > 0 && <span className="ph3d-switch-badge">+{extraPetCount}</span>}
                <ChevronDown size={16} className={switchOpen ? "rotated" : ""} />
              </button>
            </div>
          </div>

          {/* 右侧宠物照片 - 圆形头像，照片完全填充 */}
          <div className="ph3d-hero-visual">
            <div className="ph3d-char-stage">
              {currentPet && (displayPet?.image_url || currentPet.image_url) ? (
                <img
                  src={(displayPet || currentPet).image_url}
                  alt={`${currentPet.name} 的照片`}
                  className="ph3d-pet-hero-img"
                />
              ) : null}
            </div>
            {/* 浮动装饰元素 */}
            <div className="ph3d-float-deco ph3d-float-heart"><Heart size={14} /></div>
            <div className="ph3d-float-deco ph3d-float-star"><Sparkles size={14} /></div>
            <div className="ph3d-float-deco ph3d-float-paw"><PawPrint size={14} /></div>
          </div>
        </div>
      </section>

      {/* ═══ 统计卡片区域 ═══ */}
      <section className="ph3d-stats-section">
        <div className="ph3d-section-head">
          <h3 className="ph3d-section-title">健康概览</h3>
          <button className="ph3d-more-btn" onClick={() => navigate("/app/records")}>
            查看详情 <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="ph3d-stats-grid">
          <article className="ph3d-stat-card ph3d-stat-health">
            <div className="ph3d-stat-icon-wrap health">
              <Heart size={20} />
              <div className="ph3d-icon-pulse" />
            </div>
            <div className="ph3d-stat-info">
              <strong className="ph3d-stat-value">0</strong>
              <span>健康评分</span>
            </div>
            <div className="ph3d-stat-trend up">
              <TrendingUp size={12} /> 良好
            </div>
          </article>

          <article className="ph3d-stat-card ph3d-stat-records">
            <div className="ph3d-stat-icon-wrap records">
              <FileText size={20} />
            </div>
            <div className="ph3d-stat-info">
              <strong className="ph3d-stat-value">0</strong>
              <span>总记录数</span>
            </div>
          </article>

          <article className="ph3d-stat-card ph3d-stat-weight">
            <div className="ph3d-stat-icon-wrap weight">
              <Scale size={20} />
            </div>
            <div className="ph3d-stat-info">
              <strong className="ph3d-stat-value">0</strong>
              <span>体重记录</span>
            </div>
          </article>

          <article className="ph3d-stat-card ph3d-stat-alerts">
            <div className="ph3d-stat-icon-wrap alerts">
              <Bell size={20} />
              {pendingCount > 0 && <span className="ph3d-stat-dot" />}
            </div>
            <div className="ph3d-stat-info">
              <strong className="ph3d-stat-value">{pendingCount || 0}</strong>
              <span>提醒事项</span>
            </div>
          </article>
        </div>
      </section>

      {/* ═══ 快速记录区域 ═══ */}
      <section className="ph3d-quick-section">
        <div className="ph3d-section-head">
          <h3 className="ph3d-section-title">快速记录</h3>
          <span className="ph3d-section-sub">一键记录宠物的健康数据</span>
        </div>
        
        <div className="ph3d-quick-grid">
          <button type="button" className="ph3d-quick-item" onClick={() => setQuickOpen("weight")}>
            <div className="ph3d-quick-icon ph3d-qi-weight">⚖️</div>
            <div className="ph3d-quick-text">
              <strong>体重记录</strong>
              <span>追踪体重变化</span>
            </div>
            <ChevronRight size={14} className="ph3d-arrow" />
          </button>

          <button type="button" className="ph3d-quick-item" onClick={() => setQuickOpen("vaccine")}>
            <div className="ph3d-quick-icon ph3d-qi-vaccine">💉</div>
            <div className="ph3d-quick-text">
              <strong>疫苗记录</strong>
              <span>疫苗接种历史</span>
            </div>
            <ChevronRight size={14} className="ph3d-arrow" />
          </button>

          <button type="button" className="ph3d-quick-item" onClick={() => setQuickOpen("deworm")}>
            <div className="ph3d-quick-icon ph3d-qi-deworm">💊</div>
            <div className="ph3d-quick-text">
              <strong>驱虫记录</strong>
              <span>定期驱虫提醒</span>
            </div>
            <ChevronRight size={14} className="ph3d-arrow" />
          </button>

          <button type="button" className="ph3d-quick-item" onClick={() => setQuickOpen("checkup")}>
            <div className="ph3d-quick-icon ph3d-qi-checkup">🩺</div>
            <div className="ph3d-quick-text">
              <strong>体检记录</strong>
              <span>定期健康检查</span>
            </div>
            <ChevronRight size={14} className="ph3d-arrow" />
          </button>

          <button type="button" className="ph3d-quick-item" onClick={() => setQuickOpen("diet")}>
            <div className="ph3d-quick-icon ph3d-qi-diet">🍖</div>
            <div className="ph3d-quick-text">
              <strong>饮食记录</strong>
              <span>营养摄入追踪</span>
            </div>
            <ChevronRight size={16} className="ph3d-arrow" />
          </button>

          <button type="button" className="ph3d-quick-item" onClick={() => setQuickOpen("beauty")}>
            <div className="ph3d-quick-icon ph3d-qi-beauty">✨</div>
            <div className="ph3d-quick-text">
              <strong>美容医护</strong>
              <span>日常护理记录</span>
            </div>
            <ChevronRight size={14} className="ph3d-arrow" />
          </button>

          {/* 智能分析入口 */}
          <button type="button" className="ph3d-quick-item ph3d-quick-item-glow" onClick={() => navigate("/app/ai-analysis")}>
            <div className="ph3d-quick-icon ph3d-qi-ai">🧠</div>
            <div className="ph3d-quick-text">
              <strong>智能分析</strong>
            </div>
            <ChevronRight size={14} className="ph3d-arrow" />
          </button>
        </div>
      </section>

      {/* 切换宠物弹窗 */}
      {switchOpen && (
        <div className="ph3d-modal-overlay" onClick={() => setSwitchOpen(false)}>
          <div className="ph3d-modal" onClick={e => e.stopPropagation()}>
            <div className="ph3d-modal-header">
              <div className="ph3d-modal-icon">
                <PawPrint size={20} />
              </div>
              <div>
                <h4 className="ph3d-modal-title">选择宠物</h4>
                <p className="ph3d-modal-sub">当前有 {pets.length} 只宠物</p>
              </div>
              <button type="button" className="ph3d-modal-close" onClick={() => setSwitchOpen(false)} aria-label="关闭">
                <X size={18} />
              </button>
            </div>
            <div className="ph3d-modal-list">
              {pets.map(p => {
                const active = p.id === activePetId;
                return (
                  <button key={p.id} type="button" className={`ph3d-modal-item ${active ? "active" : ""}`} onClick={() => { setPetId(p.id); setSwitchOpen(false); }}>
                    <span className="ph3d-modal-avatar">{petEmoji(p.species)}</span>
                    <div className="ph3d-modal-info">
                      <strong>{p.name}</strong>
                      <span>{p.breed || '宠物'}</span>
                    </div>
                    {active ? <span className="ph3d-modal-check"><Check size={15} /></span> : null}
                  </button>
                );
              })}
            </div>
            <button type="button" className="ph3d-add-pet-btn" onClick={() => { setSwitchOpen(false); navigate("/app?add=1"); }}>
              <PawPrint size={16} />
              添加新宠物
            </button>
          </div>
        </div>
      )}

      {/* 快速操作专属弹窗 */}
      {quickOpen === "weight"  && <WeightModal  petName={currentPet?.name || '我的宠物'} onClose={() => setQuickOpen(null)} onSave={handleSave} />}
      {quickOpen === "vaccine" && <VaccineModal petName={currentPet?.name || '我的宠物'} onClose={() => setQuickOpen(null)} onSave={handleSave} />}
      {quickOpen === "deworm"  && <DewormModal  petName={currentPet?.name || '我的宠物'} onClose={() => setQuickOpen(null)} onSave={handleSave} />}
      {quickOpen === "checkup" && <CheckupModal petName={currentPet?.name || '我的宠物'} onClose={() => setQuickOpen(null)} onSave={handleSave} />}
      {quickOpen === "diet"    && <DietModal    petName={currentPet?.name || '我的宠物'} onClose={() => setQuickOpen(null)} onSave={handleSave} />}
      {quickOpen === "beauty"  && <BeautyModal  petName={currentPet?.name || '我的宠物'} onClose={() => setQuickOpen(null)} onSave={handleSave} />}

      {/* Toast 提示 */}
      {toast && <div className="qm-toast">{toast}</div>}
    </main>
  );
}
