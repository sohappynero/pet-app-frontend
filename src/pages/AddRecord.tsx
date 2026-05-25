import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Droplet,
  FileText,
  Heart,
  Hospital,
  PawPrint,
  Save,
  Scale,
  Sparkles,
  Stethoscope,
  Syringe,
  UserCheck,
} from "lucide-react";
import { createRecord, fetchRecords, updateRecord } from "../lib/api";
import { useShell } from "../hooks/useShell";
import type { RecordType } from "../types";
import PetPhotoAvatar from "../components/PetPhotoAvatar";

// ═══════════════════════════════════════════
// 名字圆形头像工具（emoji 降级替换）
// ═══════════════════════════════════════════

function isNameCircleMarker(url?: string | null): boolean {
  return url === "__name_circle__";
}

function PetNameCircle({ name, size = 28 }: { name: string; size?: number }) {
  const char = (name || "宠").charAt(0).toUpperCase();
  return (
    <span className="pet-name-circle" style={{ width: size, height: size, fontSize: Math.round(size * 0.42), lineHeight: `${size}px` }}>
      {char}
    </span>
  );
}

// ═══════════════════════════════════════════
// 6 种记录类型定义（与 Records.tsx 筛选器对齐）
// ═══════════════════════════════════════════

const recordTypes = [
  { value: "vaccine" as RecordType, label: "疫苗", icon: <Syringe size={14} />, color: "#6c5ce7", bg: "#f3edfc" },
  { value: "deworm" as RecordType, label: "驱虫", icon: <Sparkles size={14} />, color: "#f5576c", bg: "#fff0f3" },
  { value: "checkup" as RecordType, label: "体检", icon: <Stethoscope size={14} />, color: "#74b9ff", bg: "#e8f4ff" },
  { value: "visit" as RecordType, label: "就诊", icon: <Hospital size={14} />, color: "#e17055", bg: "#fef0e8" },
  { value: "beauty" as RecordType, label: "美容", icon: <Droplet size={14} />, color: "#fd79a8", bg: "#fff0f5" },
  { value: "observation" as RecordType, label: "日常观察", icon: <Heart size={14} />, color: "#00b894", bg: "#e8f8f0" },
];

// ═══════════════════════════════════════════
// 每种类型的字段配置：可见性 + 占位符文案
// ═══════════════════════════════════════════

const typeConfig: Record<RecordType, {
  pageTitle: string;
  heroDesc: string;
  titlePh: string;
  dateLabel: string;
  showNextDue: boolean;
  nextDuePh: string;
  hospital: boolean; hospitalPh: string;
  doctor: boolean; doctorPh: string;
  cost: boolean; costPh: string;
  weight: boolean;
  mood: boolean;
  appetite: boolean;
  symptom: boolean; symptomPh: string;
  treatment: boolean; treatmentPh: string;
  notePh: string;
  imageLabel: string;
  imagePh: string;
}> = {
  // ─── 疫苗 ───
  vaccine: {
    pageTitle: "添加疫苗记录",
    heroDesc: "为宠物记录疫苗接种信息",
    titlePh: "如：狂犬疫苗第3针、猫三联第1针",
    dateLabel: "接种日期",
    showNextDue: true,
    nextDuePh: "下次接种提醒日期",
    hospital: true, hospitalPh: "接种医院/诊所",
    doctor: true, doctorPh: "接种医生",
    cost: true, costPh: "疫苗费用（元）",
    weight: false,
    mood: false,
    appetite: false,
    symptom: false, symptomPh: "",
    treatment: false, treatmentPh: "",
    notePh: "如：接种部位（左/右后腿）、反应情况等",
    showImages: true,
    imageLabel: "🖼️ 图片附件（疫苗本 / 接种证明 / 药物包装）",
    imagePh: "粘贴图片链接，每行一个，如：\n• 疫苗本内页照片\n• 接种凭证/发票\n• 疫苗药物包装\n留档备查用，可不填",
  },

  // ─── 驱虫 ───
  deworm: {
    pageTitle: "添加驱虫记录",
    heroDesc: "为宠物记录驱虫信息",
    titlePh: "如：体内驱虫 / 体外滴剂",
    dateLabel: "驱虫日期",
    showNextDue: true,
    nextDuePh: "下次驱虫提醒日期",
    hospital: true, hospitalPh: "驱虫地点（医院/药店/网购）",
    doctor: false, doctorPh: "",
    cost: true, costPh: "驱虫费用（元）",
    weight: false,
    mood: false,
    appetite: false,
    symptom: false, symptomPh: "",
    treatment: false, treatmentPh: "",
    notePh: "如：药物名称（大宠爱/海乐妙）、剂量、体内/体外",
    showImages: true,
    imageLabel: "🖼️ 图片附件（驱虫药物 / 使用记录）",
    imagePh: "粘贴图片链接，每行一个，如：\n• 驱虫药包装/说明书\n• 体外滴剂使用后照片\n• 方便下次回忆用药情况，可不填",
  },

  // ─── 体检 ───
  checkup: {
    pageTitle: "添加体检记录",
    heroDesc: "为宠物记录健康体检结果",
    titlePh: "如：年度全面体检 / 血常规检查",
    dateLabel: "体检日期",
    showNextDue: false,
    nextDuePh: "",
    hospital: true, hospitalPh: "体检机构名称",
    doctor: true, doctorPh: "检查医生",
    cost: true, costPh: "体检费用（元）",
    weight: true,
    mood: false,
    appetite: false,
    symptom: false, symptomPh: "",
    treatment: false, treatmentPh: "",
    notePh: "检查结果摘要：血常规/B超/X光/心脏听诊等",
    showImages: true,
    imageLabel: "🖼️ 图片附件（体检报告 / 检查单 / 影像）",
    imagePh: "粘贴图片链接，每行一个，如：\n• 血常规/生化化验单\n• B超/X光片\n• 体检报告首页\n方便日后对比健康状况，可不填",
  },

  // ─── 就诊 ───
  visit: {
    pageTitle: "添加就诊记录",
    heroDesc: "为宠物记录就医诊疗信息",
    titlePh: "如：皮肤病复诊 / 感冒发烧 / 洗牙",
    dateLabel: "就诊日期",
    showNextDue: false,
    nextDuePh: "",
    hospital: true, hospitalPh: "就诊医院",
    doctor: true, doctorPh: "主治医生",
    cost: true, costPh: "诊疗费用（元）",
    weight: false,
    mood: false,
    appetite: false,
    symptom: true, symptomPh: "症状描述（何时出现、持续多久）",
    treatment: true, treatmentPh: "治疗方案（用药/手术/医嘱）",
    notePh: "复诊安排、注意事项、医嘱等",
    showImages: true,
    imageLabel: "🖼️ 图片附件（患处照片 / 处方单 / 缴费凭证）",
    imagePh: "粘贴图片链接，每行一个，如：\n• 患部特写照片（皮肤/伤口等）\n• 医生开具的处方单\n• 医院缴费单据\n方便复诊时给医生参考，可不填",
  },

  // ─── 美容 ───
  beauty: {
    pageTitle: "添加美容记录",
    heroDesc: "为宠物记录美容护理信息",
    titlePh: "如：洗澡修剪 / 宠物SPA / 美毛护理",
    dateLabel: "美容日期",
    showNextDue: false,
    nextDuePh: "",
    hospital: true, hospitalPh: "美容店/机构名称",
    doctor: false, doctorPh: "",
    cost: true, costPh: "美容费用（元）",
    weight: false,
    mood: false,
    appetite: false,
    symptom: false, symptomPh: "",
    treatment: false, treatmentPh: "",
    notePh: "服务项目详情：洗澡/剪毛/修甲/拔耳毛/开结等",
    showImages: true,
    imageLabel: "🖼️ 图片附件（美容前后对比 / 造型展示）",
    imagePh: "粘贴图片链接，每行一个，如：\n• 美容前照片（脏/打结状态）\n• 美容后效果照\n• 特别造型展示\n记录毛孩子的变美过程，可不填",
  },

  // ─── 日常观察 ───
  observation: {
    pageTitle: "添加日常观察",
    heroDesc: "记录宠物的日常生活状态与健康观察",
    titlePh: "如：今日精神不错，排便正常",
    dateLabel: "记录日期",
    showNextDue: false,
    nextDuePh: "",
    hospital: false, hospitalPh: "",
    doctor: false, doctorPh: "",
    cost: false, costPh: "",
    weight: true,
    mood: true,
    appetite: true,
    symptom: true, symptomPh: "有无异常表现（可选，如呕吐/咳嗽/腹泻等）",
    treatment: false, treatmentPh: "",
    notePh: "其他想记录的内容...",
    showImages: true,
    imageLabel: "🖼️ 图片附件（今日生活照 / 异常情况留证）",
    imagePh: "粘贴图片链接，每行一个，如：\n• 今日可爱瞬间\n• 排便/进食情况\n• 身体异常（呕吐物/皮疹等）\n随手记录，可不填",
  },
};

// ═══════════════════════════════════════════
// 空表单 & 工具函数
// ═══════════════════════════════════════════

const emptyForm = {
  pet_id: "",
  record_type: "vaccine" as RecordType,
  title: "",
  record_date: new Date().toISOString().slice(0, 10),
  hospital: "",
  doctor: "",
  symptom: "",
  treatment: "",
  cost: "",
  weight_kg: "",
  mood: "",
  appetite: "",
  note: "",
  images_text: "",
  next_due_date: "",
};

function petEmoji(species?: string) {
  if (species === "cat") return "\u{1F431}";
  if (species === "other") return "\u{1F430}";
  return "\u{1F436}";
}

function cfg(t: RecordType) { return typeConfig[t]; }

// ═══════════════════════════════════════════
// 主组件
// ═══════════════════════════════════════════

export default function AddRecord() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = Number(params.get("edit") || 0) || null;

  const typeParam = params.get("type") as RecordType | null;
  const defaultTitle = params.get("default_title") || "";
  const petIdParam = params.get("pet_id");

  const { phone, pets, selectedPetId } = useShell();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const c = cfg(form.record_type);

  // 动态页面标题
  const pageTitle = useMemo(() => {
    if (editId) return "编辑记录";
    if (!typeParam) return "添加健康记录";
    if (c.pageTitle !== "添加日常观察" || !defaultTitle) return c.pageTitle;
    if (defaultTitle.includes("体重")) return "添加体重记录";
    if (defaultTitle.includes("饮食")) return "添加饮食记录";
    return c.pageTitle;
  }, [editId, typeParam, defaultTitle, c]);

  const currentPet = useMemo(
    () => pets.find((p) => p.id === Number(form.pet_id)) || pets[0] || null,
    [form.pet_id, pets]
  );

  // URL 参数预填
  useEffect(() => {
    const updates: Partial<typeof emptyForm> = {};
    if (petIdParam && !form.pet_id) updates.pet_id = petIdParam;
    else if (pets.length > 0 && !form.pet_id) updates.pet_id = String(selectedPetId ?? pets[0].id);
    if (typeParam && recordTypes.some((t) => t.value === typeParam) && form.record_type !== typeParam)
      updates.record_type = typeParam;
    if (defaultTitle && !form.title) updates.title = defaultTitle;
    if (Object.keys(updates).length > 0) setForm((s) => ({ ...s, ...updates }));
  }, [petIdParam, typeParam, defaultTitle, pets, selectedPetId]);

  // 编辑模式回填
  useEffect(() => {
    if (!editId) return;
    fetchRecords(phone).then((res) => {
      const row = (res.data || []).find((x: any) => x.id === editId);
      if (!row) return;
      setForm({
        pet_id: String(row.pet_id),
        record_type: row.record_type,
        title: row.title,
        record_date: row.record_date,
        hospital: row.hospital || "",
        doctor: row.doctor || "",
        symptom: row.symptom || "",
        treatment: row.treatment || "",
        cost: row.cost ? String(row.cost) : "",
        weight_kg: row.weight_kg ? String(row.weight_kg) : "",
        mood: row.mood || "",
        appetite: row.appetite || "",
        note: row.note || "",
        images_text: (row.images || []).join("\n"),
        next_due_date: row.next_due_date || "",
      });
    });
  }, [editId, phone]);

  // 提交
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pet_id || !form.title.trim()) return;

    setSaving(true);
    setMessage("");
    const payload = {
      record_type: form.record_type,
      title: form.title.trim(),
      record_date: form.record_date,
      hospital: form.hospital.trim(),
      doctor: form.doctor.trim(),
      symptom: form.symptom.trim(),
      treatment: form.treatment.trim(),
      cost: form.cost ? Number(form.cost) : 0,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      mood: form.mood.trim(),
      appetite: form.appetite.trim(),
      note: form.note.trim(),
      images: form.images_text.split("\n").map((x) => x.trim()).filter(Boolean),
      next_due_date: c.showNextDue ? (form.next_due_date || null) : null,
    };

    try {
      if (editId) {
        await updateRecord(editId, payload, phone);
        setMessage("记录更新成功 ✅");
      } else {
        await createRecord({ phone, pet_id: Number(form.pet_id), ...payload });
        setMessage("记录添加成功 🎉");
        setForm((s) => ({ ...emptyForm, pet_id: s.pet_id }));
      }
      setTimeout(() => navigate("/app/records"), 800);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((s) => ({ ...s, [field]: value }));

  // ═══ 渲染 ════════════════════════════════

  return (
    <main className="ar-page">
      {/* Hero */}
      <section className="ar-hero">
        <div className="ar-hero-bg">
          <div className="ar-hero-gradient" />
          <div className="ar-hero-orb ar-orb-1" />
          <div className="ar-hero-orb ar-orb-2" />
          <div className="ar-hero-dots" />
        </div>
        <div className="ar-hero-inner">
          <div className="ar-hero-left">
            <button type="button" className="ar-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </button>
            <div className="ar-hero-content">
              <div className="ar-hero-icon-wrap"><ClipboardList size={22} /></div>
              <h1 className="ar-hero-title">{pageTitle}</h1>
              <p className="ar-hero-desc">{c.heroDesc}</p>
            </div>
            <div className="ar-hero-pet-badge">
              {currentPet?.image_url ? (
                isNameCircleMarker(currentPet.image_url) ? (
                  <PetNameCircle name={currentPet.name} size={28} />
                ) : (
                  <img src={currentPet.image_url} alt={currentPet.name}
                    style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                )
              ) : currentPet?._resolved_avatar_url && !isNameCircleMarker(currentPet._resolved_avatar_url) ? (
                <img src={currentPet._resolved_avatar_url} alt={currentPet.name}
                  style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <PetNameCircle name={currentPet?.name || '宠物'} size={28} />
              )}
              <span>{currentPet?.name ?? "未选择"}</span>
              <PawPrint size={12} />
            </div>
          </div>
          <div className="ar-hero-pet-3d">
            <PetPhotoAvatar pet={currentPet} size="large" />
            <span className="ar-float-ele ar-fe-a">💉</span>
            <span className="ar-float-ele ar-fe-b">📋</span>
            <span className="ar-float-ele ar-fe-c">❤️</span>
            <span className="ar-float-ele ar-fe-d">✨</span>
          </div>
        </div>
      </section>

      {/* 表单区域 */}
      <section className="ar-form-section">
        {message && (
          <div className={`ar-toast ${message.includes("\u2705") || message.includes("\u{1F389}") ? "ar-toast-success" : ""}`}>
            {message}
          </div>
        )}

        <form onSubmit={onSubmit} className="ar-form">

          {/* ── 基础信息卡 ── */}
          <div className="ar-card">
            <div className="ar-card-header">
              <div className="ar-card-tag"><Sparkles size={12} />基础信息</div>
              <ChevronRight size={14} className="ar-card-header-arrow" />
            </div>

            {/* 宠物选择 */}
            <div className="ar-field-group">
              <label className="ar-label">选择宠物 <span className="ar-required">*</span></label>
              <div className="ar-select-wrap">
                <select className="ar-select" value={form.pet_id}
                  onChange={(e) => updateField("pet_id", e.target.value)} required>
                  {pets.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
            </div>

            {/* 记录类型选择 */}
            <div className="ar-field-group">
              <label className="ar-label">记录类型 <span className="ar-required">*</span></label>
              <div className="ar-type-grid">
                {recordTypes.map((t) => (
                  <button key={t.value} type="button"
                    className={`ar-type-chip ${form.record_type === t.value ? "active" : ""}`}
                    onClick={() => updateField("record_type", t.value)}
                    style={form.record_type === t.value ? { background: t.bg, color: t.color, borderColor: t.color } : {}}
                  >
                    {t.icon}<span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 标题 */}
            <div className="ar-field-group">
              <label className="ar-label">标题 <span className="ar-required">*</span></label>
              <input className="ar-input" placeholder={c.titlePh} value={form.title}
                onChange={(e) => updateField("title", e.target.value)} required />
            </div>
          </div>

          {/* ── 时间与费用 ── */}
          {(c.showNextDue || c.cost || c.hospital || c.doctor) && (
            <div className="ar-card">
              <div className="ar-card-header">
                <div className="ar-card-tag ar-tag-medical"><CalendarDays size={12} />时间与费用</div>
                <ChevronRight size={14} className="ar-card-header-arrow" />
              </div>

              {/* 日期行 + 花费（并排） */}
              <div className="ar-grid-row">
                <div className="ar-field-group flex-1">
                  <label className="ar-label"><CalendarDays size={13} /> {c.dateLabel} <span className="ar-required">*</span></label>
                  <input className="ar-input" type="date" value={form.record_date}
                    onChange={(e) => updateField("record_date", e.target.value)} required />
                </div>
                {c.cost && (
                  <div className="ar-field-group flex-1">
                    <label className="ar-label"><FileText size={13} /> 花费（元）</label>
                    <input className="ar-input" type="number" step="0.01" placeholder={c.costPh}
                      value={form.cost} onChange={(e) => updateField("cost", e.target.value)} />
                  </div>
                )}
              </div>

              {/* 医院/机构 */}
              {c.hospital && (
                <div className="ar-field-group">
                  <label className="ar-label"><Hospital size={13} /> {["vaccine","checkup","visit"].includes(form.record_type) ? "医院" : "机构"}</label>
                  <input className="ar-input" placeholder={c.hospitalPh} value={form.hospital}
                    onChange={(e) => updateField("hospital", e.target.value)} />
                </div>
              )}

              {/* 医生 — 仅疫苗/体检/就诊需要 */}
              {c.doctor && (
                <div className="ar-field-group">
                  <label className="ar-label"><UserCheck size={13} /> 医生</label>
                  <input className="ar-input" placeholder={c.doctorPh} value={form.doctor}
                    onChange={(e) => updateField("doctor", e.target.value)} />
                </div>
              )}

              {/* 下次提醒 — 疫苗/驱虫专用 */}
              {c.showNextDue && (
                <div className="ar-field-group">
                  <label className="ar-label"><CalendarDays size={13} /> 下次提醒日期</label>
                  <input className="ar-input" type="date" placeholder={c.nextDuePh}
                    value={form.next_due_date} onChange={(e) => updateField("next_due_date", e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* ── 健康指标 — 体检/日常观察专用 ── */}
          {(c.weight || c.mood || c.appetite) && (
            <div className="ar-card">
              <div className="ar-card-header">
                <div className="ar-card-tag ar-tag-status"><Scale size={12} />健康指标</div>
                <ChevronRight size={14} className="ar-card-header-arrow" />
              </div>

              <div className="ar-grid-row">
                {c.weight && (
                  <div className="ar-field-group flex-1">
                    <label className="ar-label"><Scale size={13} /> 体重(kg)</label>
                    <input className="ar-input" type="number" step="0.1" placeholder="如 5.5"
                      value={form.weight_kg} onChange={(e) => updateField("weight_kg", e.target.value)} />
                  </div>
                )}
                {c.mood && (
                  <div className="ar-field-group flex-1">
                    <label className="ar-label">❤️ 心情</label>
                    <input className="ar-input" placeholder="开心 / 一般 / 低落"
                      value={form.mood} onChange={(e) => updateField("mood", e.target.value)} />
                  </div>
                )}
              </div>
              {c.appetite && (
                <div className="ar-field-group">
                  <label className="ar-label">🍽️ 食欲</label>
                  <input className="ar-input" placeholder="正常 / 较差 / 很好"
                    value={form.appetite} onChange={(e) => updateField("appetite", e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* ── 就诊诊断 — 就诊类型专用 ── */}
          {(c.symptom || c.treatment) && (
            <div className="ar-card">
              <div className="ar-card-header">
                <div className="ar-card-tag ar-tag-detail">
                  <Stethoscope size={12} />{c.treatment ? "诊断详情" : "观察内容"}
                </div>
                <ChevronRight size={14} className="ar-card-header-arrow" />
              </div>
              {c.symptom && (
                <div className="ar-field-group">
                  <label className="ar-label">💪 症状描述</label>
                  <textarea className="ar-textarea" rows={2} placeholder={c.symptomPh}
                    value={form.symptom} onChange={(e) => updateField("symptom", e.target.value)} />
                </div>
              )}
              {c.treatment && (
                <div className="ar-field-group">
                  <label className="ar-label">⚕️ 治疗方案</label>
                  <textarea className="ar-textarea" rows={2} placeholder={c.treatmentPh}
                    value={form.treatment} onChange={(e) => updateField("treatment", e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* ── 备注与图片（所有类型通用）── */}
          <div className="ar-card">
            <div className="ar-card-header">
              <div className="ar-card-tag ar-tag-detail"><FileText size={12} />备注与附件</div>
              <ChevronRight size={14} className="ar-card-header-arrow" />
            </div>
            <div className="ar-field-group">
              <label className="ar-label">📝 备注</label>
              <textarea className="ar-textarea ar-textarea-lg" rows={3} placeholder={c.notePh}
                value={form.note} onChange={(e) => updateField("note", e.target.value)} />
            </div>
            {c.showImages && (
              <div className="ar-field-group">
                <label className="ar-label">{c.imageLabel}（可选）</label>
                <textarea className="ar-textarea" rows={2} placeholder={c.imagePh}
                  value={form.images_text} onChange={(e) => updateField("images_text", e.target.value)} />
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <button type="submit" className="ar-submit-btn" disabled={saving}>
            <Save size={16} />
            {saving ? "保存中..." : editId ? "更新记录" : "创建记录"}
          </button>
        </form>
      </section>
    </main>
  );
}
