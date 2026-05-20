import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  ClipboardList,
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

const recordTypes = [
  { value: "vaccine", label: "疫苗", icon: <Syringe size={14} />, color: "#6c5ce7", bg: "#f3edfc" },
  { value: "deworm", label: "驱虫", icon: <Sparkles size={14} />, color: "#f5576c", bg: "#fff0f3" },
  { value: "checkup", label: "体检", icon: <Stethoscope size={14} />, color: "#74b9ff", bg: "#e8f4ff" },
  { value: "visit", label: "就诊", icon: <Hospital size={14} />, color: "#e17055", bg: "#fef0e8" },
  { value: "observation", label: "日常观察", icon: <Heart size={14} />, color: "#00b894", bg: "#e8f8f0" },
];

function petEmoji(species?: string) {
  if (species === "cat") return "\u{1F431}";
  if (species === "other") return "\u{1F430}";
  return "\u{1F436}";
}

export default function AddRecord() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = Number(params.get("edit") || 0) || null;

  const { phone, pets, selectedPetId } = useShell();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const currentPet = useMemo(
    () => pets.find((p) => p.id === Number(form.pet_id)) || pets[0] || null,
    [form.pet_id, pets]
  );

  const showNextDue = useMemo(
    () => form.record_type === "vaccine" || form.record_type === "deworm",
    [form.record_type]
  );

  useEffect(() => {
    if (pets.length > 0 && !form.pet_id) {
      const fallback = selectedPetId ?? pets[0].id;
      setForm((s) => ({ ...s, pet_id: String(fallback) }));
    }
  }, [pets, selectedPetId, form.pet_id]);

  useEffect(() => {
    const initEdit = async () => {
      if (!editId) return;
      const res = await fetchRecords(phone);
      const row = (res.data || []).find((x) => x.id === editId);
      if (!row) return;

      setForm({
        pet_id: String(row.pet_id),
        record_type: row.record_type,
        title: row.title,
        record_date: row.record_date,
        hospital: row.hospital,
        doctor: row.doctor,
        symptom: row.symptom,
        treatment: row.treatment,
        cost: row.cost ? String(row.cost) : "",
        weight_kg: row.weight_kg ? String(row.weight_kg) : "",
        mood: row.mood,
        appetite: row.appetite,
        note: row.note,
        images_text: (row.images || []).join("\n"),
        next_due_date: row.next_due_date || "",
      });
    };
    initEdit();
  }, [editId, phone]);

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
      images: form.images_text
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
      next_due_date: showNextDue ? form.next_due_date || null : null,
    };

    try {
      if (editId) {
        await updateRecord(editId, payload, phone);
        setMessage("记录更新成功 \u2705");
      } else {
        await createRecord({
          phone,
          pet_id: Number(form.pet_id),
          ...payload,
        });
        setMessage("记录添加成功 \u{1F389}");
        setForm((s) => ({ ...emptyForm, pet_id: s.pet_id }));
      }
      setTimeout(() => navigate("/app/records"), 800);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((s) => ({ ...s, [field]: value }));
  };

  return (
    <main className="ar-page">
      {/* Hero 区域 */}
      <section className="ar-hero">
        <div className="ar-hero-bg">
          <div className="ar-hero-gradient" />
          <div className="ar-hero-orb ar-orb-1" />
          <div className="ar-hero-orb ar-orb-2" />
          <div className="ar-hero-dots" />
        </div>

        <div className="ar-hero-inner">
          {/* 左侧内容 */}
          <div className="ar-hero-left">
            <button type="button" className="ar-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} />
            </button>

            <div className="ar-hero-content">
              <div className="ar-hero-icon-wrap">
                <ClipboardList size={22} />
              </div>
              <h1 className="ar-hero-title">{editId ? "编辑记录" : "添加健康记录"}</h1>
              <p className="ar-hero-desc">为 {currentPet?.name ?? "宠物"} 记录健康档案</p>
            </div>

            <div className="ar-hero-pet-badge">
              <span className="ar-pet-emoji">{petEmoji(currentPet?.species)}</span>
              <span>{currentPet?.name ?? "未选择"}</span>
              <PawPrint size={12} />
            </div>
          </div>

          {/* 右侧 宠物照片头像 */}
          <div className="ar-hero-pet-3d">
            <PetPhotoAvatar pet={currentPet} size="large" />
            {/* 环绕的可爱元素 */}
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

          {/* 基础信息卡片 */}
          <div className="ar-card">
            <div className="ar-card-header">
              <div className="ar-card-tag">
                <Sparkles size={12} />
                基础信息
              </div>
              <ChevronRight size={14} className="ar-card-header-arrow" />
            </div>

            <div className="ar-field-group">
              <label className="ar-label">选择宠物</label>
              <div className="ar-select-wrap">
                <select
                  className="ar-select"
                  value={form.pet_id}
                  onChange={(e) => updateField("pet_id", e.target.value)}
                  required
                >
                  {pets.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="ar-field-group">
              <label className="ar-label">记录类型</label>
              <div className="ar-type-grid">
                {recordTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`ar-type-chip ${form.record_type === type.value ? "active" : ""}`}
                    onClick={() => updateField("record_type", type.value)}
                    style={form.record_type === type.value
                      ? { background: type.bg, color: type.color, borderColor: type.color }
                      : {}
                    }
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="ar-field-group">
              <label className="ar-label">标题 <span className="ar-required">*</span></label>
              <input
                className="ar-input"
                placeholder="例如：年度狂犬疫苗接种"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </div>
          </div>

          {/* 医疗信息卡片 */}
          <div className="ar-card">
            <div className="ar-card-header">
              <div className="ar-card-tag ar-tag-medical">
                <Stethoscope size={12} />
                医疗信息
              </div>
              <ChevronRight size={14} className="ar-card-header-arrow" />
            </div>

            <div className="ar-grid-row">
              <div className="ar-field-group flex-1">
                <label className="ar-label">
                  <CalendarDays size={13} /> 日期
                </label>
                <input
                  className="ar-input"
                  type="date"
                  value={form.record_date}
                  onChange={(e) => updateField("record_date", e.target.value)}
                  required
                />
              </div>

              <div className="ar-field-group flex-1">
                <label className="ar-label">
                  <FileText size={13} /> 花费（元）
                </label>
                <input
                  className="ar-input"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.cost}
                  onChange={(e) => updateField("cost", e.target.value)}
                />
              </div>
            </div>

            <div className="ar-grid-row">
              <div className="ar-field-group flex-1">
                <label className="ar-label">
                  <Hospital size={13} /> 医院
                </label>
                <input
                  className="ar-input"
                  placeholder="医院名称（可选）"
                  value={form.hospital}
                  onChange={(e) => updateField("hospital", e.target.value)}
                />
              </div>

              <div className="ar-field-group flex-1">
                <label className="ar-label">
                  <UserCheck size={13} /> 医生
                </label>
                <input
                  className="ar-input"
                  placeholder="医生姓名（可选）"
                  value={form.doctor}
                  onChange={(e) => updateField("doctor", e.target.value)}
                />
              </div>
            </div>

            {showNextDue && (
              <div className="ar-field-group">
                <label className="ar-label">
                  下次提醒日期
                </label>
                <input
                  className="ar-input"
                  type="date"
                  value={form.next_due_date}
                  onChange={(e) => updateField("next_due_date", e.target.value)}
                />
              </div>
            )}
          </div>

          {/* 状态观察卡片 */}
          <div className="ar-card">
            <div className="ar-card-header">
              <div className="ar-card-tag ar-tag-status">
                <Heart size={12} />
                状态观察
              </div>
              <ChevronRight size={14} className="ar-card-header-arrow" />
            </div>

            <div className="ar-grid-row">
              <div className="ar-field-group flex-1">
                <label className="ar-label">
                  <Scale size={13} /> 体重(kg)
                </label>
                <input
                  className="ar-input"
                  type="number"
                  step="0.1"
                  placeholder="如 5.5"
                  value={form.weight_kg}
                  onChange={(e) => updateField("weight_kg", e.target.value)}
                />
              </div>

              <div className="ar-field-group flex-1">
                <label className="ar-label">
                  ❤️ 心情
                </label>
                <input
                  className="ar-input"
                  placeholder="开心 / 一般 / 低落"
                  value={form.mood}
                  onChange={(e) => updateField("mood", e.target.value)}
                />
              </div>
            </div>

            <div className="ar-field-group">
              <label className="ar-label">🍽️ 食欲</label>
              <input
                className="ar-input"
                placeholder="正常 / 较差 / 很好"
                value={form.appetite}
                onChange={(e) => updateField("appetite", e.target.value)}
              />
            </div>
          </div>

          {/* 详细记录卡片 */}
          <div className="ar-card">
            <div className="ar-card-header">
              <div className="ar-card-tag ar-tag-detail">
                <FileText size={12} />
                详细记录
              </div>
              <ChevronRight size={14} className="ar-card-header-arrow" />
            </div>

            <div className="ar-field-group">
              <label className="ar-label">💪 症状描述</label>
              <textarea
                className="ar-textarea"
                rows={2}
                placeholder="记录观察到的症状..."
                value={form.symptom}
                onChange={(e) => updateField("symptom", e.target.value)}
              />
            </div>

            <div className="ar-field-group">
              <label className="ar-label">⚕️ 治疗方案</label>
              <textarea
                className="ar-textarea"
                rows={2}
                placeholder="医生建议的治疗方式..."
                value={form.treatment}
                onChange={(e) => updateField("treatment", e.target.value)}
              />
            </div>

            <div className="ar-field-group">
              <label className="ar-label">📝 备注</label>
              <textarea
                className="ar-textarea ar-textarea-lg"
                rows={3}
                placeholder="其他需要备注的信息..."
                value={form.note}
                onChange={(e) => updateField("note", e.target.value)}
              />
            </div>

            <div className="ar-field-group">
              <label className="ar-label">🖼️ 图片 URL（可选）</label>
              <textarea
                className="ar-textarea"
                rows={2}
                placeholder="每行一个图片链接..."
                value={form.images_text}
                onChange={(e) => updateField("images_text", e.target.value)}
              />
            </div>
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
