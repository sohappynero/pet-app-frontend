import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Camera,
  ChevronRight,
  Clock,
  Droplet,
  Edit3,
  Eye,
  FileText,
  Heart,
  Hospital,
  MapPin,
  Pill,
  Scale,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
  UserCheck,
  XCircle,
} from "lucide-react";
import { fetchRecords, fetchWeights, fetchFeedings, fetchGroomings, fetchObservations, fetchDewormings, fetchVaccines, fetchCheckups, fetchMedicals } from "../lib/api";
import { useShell } from "../hooks/useShell";
import type { HealthRecord } from "../types";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import { getLocalAvatar } from "../lib/pet-avatar";
import "./RecordDetail.css";

// ══════════════════════════════════
// 工具函数
// ══════════════════════════════════

function isNameCircleMarker(url?: string | null): boolean {
  return url === "__name_circle__";
}

function PetNameCircle({ name, size = 36 }: { name: string; size?: number }) {
  const char = (name || "宠").charAt(0).toUpperCase();
  return (
    <span className="pet-name-circle" style={{ width: size, height: size, fontSize: Math.round(size * 0.42), lineHeight: `${size}px` }}>
      {char}
    </span>
  );
}

function isBeautyRecord(record: HealthRecord) {
  const text = `${record.title || ""} ${record.note || ""} ${record.symptom || ""}`;
  return /美容|洗浴|修剪|美容护理|毛发护理/.test(text) || record.record_type === "beauty";
}

function isDietRecord(record: HealthRecord) {
  const text = `${record.title || ""} ${record.note || ""} ${record.symptom || ""}`;
  return /饮食|喂食|粮|餐|食量|喝水|饮水/.test(text);
}

type IconInfo = { icon: React.ReactNode; bg: string; color: string; gradient: string; label: string };

function getRecordTypeInfo(record: HealthRecord): IconInfo {
  if (record.record_type === "vaccine")
    return { icon: <Syringe size={24} />, bg: "#f0edfc", color: "#6c5ce7", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", label: "疫苗接种" };
  if (record.record_type === "deworm")
    return { icon: <Pill size={24} />, bg: "#fff0f3", color: "#f5576c", gradient: "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)", label: "驱虫护理" };
  if (record.record_type === "checkup")
    return { icon: <Stethoscope size={24} />, bg: "#eaf4ff", color: "#74b9ff", gradient: "linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)", label: "健康体检" };
  if (record.record_type === "beauty" || isBeautyRecord(record))
    return { icon: <Sparkles size={24} />, bg: "#fff0f5", color: "#fd79a8", gradient: "linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)", label: "美容医护" };
  if (record.record_type === "visit")
    return { icon: <Activity size={24} />, bg: "#fef0e8", color: "#e17055", gradient: "linear-gradient(135deg, #e17055 0%, #f6b93b 100%)", label: "就诊记录" };
  if (record.record_type === "weight")
    return { icon: <Scale size={24} />, bg: "#fef9e7", color: "#f0932b", gradient: "linear-gradient(135deg, #f9ca24 0%, #f0932b 100%)", label: "体重记录" };
  if (record.record_type === "diet" || isDietRecord(record))
    return { icon: <Heart size={24} />, bg: "#e8f8f0", color: "#00b894", gradient: "linear-gradient(135deg, #00b894 0%, #55efc4 100%)", label: "饮食记录" };
  if (record.record_type === "observation")
    return { icon: <Eye size={24} />, bg: "#f0e8ff", color: "#6c5ce7", gradient: "linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)", label: "日常观察" };
  if (record.record_type === "external")
    return { icon: <FileText size={24} />, bg: "#fef9e7", color: "#e17055", gradient: "linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)", label: "外部记录" };
  if (record.weight_kg !== null && !Number.isNaN(Number(record.weight_kg)))
    return { icon: <Scale size={24} />, bg: "#fef9e7", color: "#f0932b", gradient: "linear-gradient(135deg, #f9ca24 0%, #f0932b 100%)", label: "体重记录" };
  if (isDietRecord(record))
    return { icon: <Heart size={24} />, bg: "#e8f8f0", color: "#00b894", gradient: "linear-gradient(135deg, #00b894 0%, #55efc4 100%)", label: "饮食记录" };
  return { icon: <FileText size={24} />, bg: "#f5f0eb", color: "#8b7355", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", label: "健康记录" };
}

// ══════════════════════════════════
// 详情字段组件
// ══════════════════════════════════

interface DetailFieldProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color?: string;
  fullWidth?: boolean; // 占满整行
}

function DetailField({ icon, label, value, color = "#667eea", fullWidth = false }: DetailFieldProps) {
  if (!value) return null;
  return (
    <div className={`rd-field${fullWidth ? " rd-field-full" : ""}`}>
      <div className="rd-field-icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="rd-field-content">
        <span className="rd-field-label">{label}</span>
        <span className="rd-field-value">{value}</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════
// 辅助组件 & 工具函数
// ══════════════════════════════════

/** 剪贴板/清单图标（替代 lucide-react 中不存在的 ClipboardIcon）*/
function ClipboardIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
  );
}

/** 格式化日期时间 */
function formatDateTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return dateStr;
  }
}

// ══════════════════════════════════
// 主页面组件
// ══════════════════════════════════

export default function RecordDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const recordTypeFromUrl = searchParams.get("type") as RecordType | null; // 从URL获取记录类型
  const { phone, pets, selectedPetId } = useShell();

  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取当前宠物信息（用于显示头像）
  const currentPet = useMemo(() => {
    if (!record) return null;
    return pets.find((p) => p.id === record.pet_id) || pets[0] || null;
  }, [record, pets]);

  const displayPet = useMemo(() => {
    if (!currentPet) return null;
    const local = getLocalAvatar(currentPet.id);
    return local ? { ...currentPet, image_url: local } : currentPet;
  }, [currentPet]);

  // 加载记录详情 — 根据 type 参数从正确的表查询
  useEffect(() => {
    if (!id) return;
    const targetId = Number(id);
    setLoading(true);

    const petId = selectedPetId ?? (pets.length > 0 ? pets[0].id : null);

    // 根据类型决定查询哪个表
    const type = recordTypeFromUrl;

    if (type === "weight" && petId) {
      // 体重记录 → 查 pet_weight_records 表
      fetchWeights(petId)
        .then((res) => {
          const found = (Array.isArray(res) ? res : []).find((r: any) => r.id === targetId);
          if (found) {
            const rawNotes = found.notes || "";
            setRecord({
              ...found,
              record_type: "weight",
              title: "体重记录",
              note: rawNotes,
              // 保存原始称重数据供详细信息区使用
              _rawWeighingDevice: found.weighing_device || "",
              _rawMeasurementContext: found.measurement_context || "",
            } as HealthRecord);
          } else {
            setRecord(null);
          }
        })
        .finally(() => setLoading(false));
    } else if (type === "diet" && petId) {
      // 饮食记录 → 查 pet_feeding_records 表
      fetchFeedings(petId)
        .then((res) => {
          const found = (Array.isArray(res) ? res : []).find((r: any) => r.id === targetId);
          if (found) {
            setRecord({
              ...found,
              record_type: "diet",
              record_date: found.feeding_date ? String(found.feeding_date).slice(0, 10) : "",
              title: "饮食记录",
              hospital: "",
              cost: null,
              weight_kg: null,
              mood: "",
              appetite: found.main_food_amount != null ? `${found.main_food_amount}g` : "",
              note: found.notes || `${found.main_food_type || ''}${found.main_food_amount ? ` ${found.main_food_amount}g` : ''}`,
              images: found.photo_urls || [],
              // 保存原始食物数据供详细信息区使用
              _rawFoodType: found.main_food_type || "",
              _rawFoodAmount: found.main_food_amount ?? null,
            } as HealthRecord);
          } else {
            setRecord(null);
          }
        })
        .finally(() => setLoading(false));
    } else if ((type === "beauty" || type === "grooming") && petId) {
      // 美容记录 → 查 pet_grooming_records 表
      fetchGroomings(petId)
        .then((res) => {
          const found = (Array.isArray(res) ? res : []).find((r: any) => r.id === targetId);
          if (found) {
            setRecord({
              ...found,
              id: found.id,
              record_type: "beauty",
              record_date: found.grooming_date ? String(found.grooming_date).slice(0, 10) : "",
              title: found.services_performed?.length ? String(found.services_performed[0]) : "美容护理",
              hospital: found.provider_name || "",
              cost: found.cost ?? null,
              note: found.notes || "",
              images: found.before_photos || [],
            } as HealthRecord);
          } else {
            setRecord(null);
          }
        })
        .finally(() => setLoading(false));
    } else if (type === "observation" && petId) {
      // 日常观察 → 查 observation_records 表
      fetchObservations(petId)
        .then((res) => {
          const rawData = Array.isArray(res) ? res : (res?.list ? res.list : []);
          const found = rawData.find((r: any) => r.id === targetId);
          if (found) {
            // 后端可能返回 bowel_movements(API层) 或 stool_consistency(DB列)，兼容两者
            const rawStool = found.bowel_movements || found.stool_consistency || "";

            // 排便情况翻译
            let stoolText = "";
            if (rawStool) {
              const cMap: Record<string, string> = { normal: "正常", soft: "偏软", loose: "稀", watery: "水样", constipated: "便秘", blood_present: "带血" };
              stoolText = cMap[rawStool] || rawStool;
            }

            // notes 直接显示用户输入内容（包含摘要+备注）
            const displayNote = found.notes?.trim() || "";

            setRecord({
              ...found,
              id: found.id,
              record_type: "observation",
              record_date: found.observation_date ? String(found.observation_date).slice(0, 10) : "",
              title: "日常观察",
              hospital: "", doctor: "",
              symptom: stoolText,
              treatment: "",
              cost: null,
              weight_kg: found.weight != null ? Number(found.weight) : null,
              mood: "",
              appetite: "",
              note: displayNote,
              images: [],
            } as HealthRecord);
          } else {
            setRecord(null);
          }
        })
        .finally(() => setLoading(false));
    } else if (type === "deworm" && petId) {
      // 驱虫记录 → 查 pet_deworming_records 表
      fetchDewormings(petId)
        .then((res) => {
          const found = (Array.isArray(res) ? res : []).find((r: any) => r.id === targetId);
          if (found) {
            setRecord({
              ...found,
              id: found.id,
              record_type: "deworm",
              record_date: found.deworming_date ? String(found.deworming_date).slice(0, 10) : "",
              title: found.medication_name || "驱虫护理",
              hospital: found.pet_hospital || "",
              deworm_type: found.deworming_type || "",
              cost: found.cost ?? null,
              weight_kg: null, mood: "", appetite: "",
              note: found.notes || `${found.medication_name||'驱虫'}${found.pet_hospital?` | ${found.pet_hospital}`:''}${found.cost?` | ${found.cost}元`:''}`,
              images: found.photo_urls || [],
            } as HealthRecord);
          } else {
            setRecord(null);
          }
        })
        .finally(() => setLoading(false));
    } else if (type === "vaccine" && petId) {
      // 疫苗记录 → 返回分页对象 {list: [...], total, page}
      fetchVaccines(petId)
        .then((res) => {
          const list = Array.isArray(res) ? res : ((res && res.list) ? res.list : []);
          const found = list.find((r: any) => r.id === targetId);
          if (found) {
            setRecord({
              ...found,
              id: found.id,
              record_type: "vaccine",
              record_date: found.vaccine_date ? String(found.vaccine_date).slice(0, 10) : "",
              title: found.vaccine_name || "疫苗接种",
              hospital: found.pet_hospital || found.hospital_name || "",
              cost: found.cost ?? null,
              weight_kg: null, mood: "", appetite: "",
              deworm_type: "",
              note: found.notes || `${found.vaccine_name||'疫苗'}${found.pet_hospital||found.hospital_name?` | ${found.pet_hospital||found.hospital_name}`:''}${found.cost?` | ${found.cost}元`:''}`,
              images: [],
            } as HealthRecord);
          } else {
            setRecord(null);
          }
        })
        .finally(() => setLoading(false));
    } else if (type === "checkup" && petId) {
      // 体检记录 → 查 check_up_records 表
      fetchCheckups(petId)
        .then((res) => {
          const found = (Array.isArray(res) ? res : []).find((r: any) => r.id === targetId);
          if (found) {
            setRecord({
              ...found,
              id: found.id,
              record_type: "checkup",
              record_date: found.check_up_date ? String(found.check_up_date).slice(0, 10) : "",
              title: found.check_up_items || "健康体检",
              hospital: found.pet_hospital || found.hospital_name || "",
              doctor: found.doctor || "",
              cost: found.cost ?? null,
              weight_kg: null, mood: "", appetite: "",
              deworm_type: "",
              note: found.notes || `${found.check_up_items||'体检'}${found.pet_hospital||found.hospital_name?` | ${found.pet_hospital||found.hospital_name}`:''}`,
              images: found.photo_urls || [],
            } as HealthRecord);
          } else {
            setRecord(null);
          }
        })
        .finally(() => setLoading(false));
    } else if (type === "visit" && petId) {
      // 就诊记录 → 查 medical_case_records 表
      fetchMedicals(petId)
        .then((res) => {
          const found = (Array.isArray(res) ? res : []).find((r: any) => r.id === targetId);
          if (found) {
            setRecord({
              ...found,
              id: found.id,
              record_type: "visit",
              record_date: found.medical_date ? String(found.medical_date).slice(0, 10) : "",
              title: found.chief_complaint || found.diagnosis || "就诊记录",
              hospital: found.pet_hospital || found.hospital_name || "",
              doctor: found.doctor || "",
              symptom: found.chief_complaint || found.symptom || "",
              treatment: found.treatment || "",
              cost: found.cost ?? null,
              weight_kg: null, mood: "", appetite: "",
              deworm_type: "",
              note: found.notes || `${found.chief_complaint||found.diagnosis||'就诊'}${found.treatment?` | 治疗:${found.treatment}`:''}`,
              images: found.photo_urls || [],
            } as HealthRecord);
          } else {
            setRecord(null);
          }
        })
        .finally(() => setLoading(false));
    } else {
      // 其他类型（vaccine/deworm/checkup/visit/observation）→ 查通用 health_records 表
      fetchRecords(phone)
        .then((res) => {
          const found = (res.data || []).find((r: HealthRecord) => r.id === targetId);
          setRecord(found || null);
        })
        .finally(() => setLoading(false));
    }
  }, [id, phone, recordTypeFromUrl, selectedPetId, pets]);

  // 安全处理 images 字段：后端可能返回JSON字符串而非数组（必须在条件返回之前，遵守Hooks规则）
  const safeImages = useMemo((): string[] => {
    const raw = record?.images;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw.trim()) {
      try { return JSON.parse(raw); } catch { return []; }
    }
    return [];
  }, [record?.images]);

  if (loading) {
    return (
      <main className="rd-page">
        <section className="rd-hero">
          <button type="button" className="rd-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <h1 className="rd-loading-text">加载中...</h1>
        </section>
      </main>
    );
  }

  if (!record) {
    return (
      <main className="rd-page">
        <section className="rd-hero">
          <button type="button" className="rd-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div className="rd-empty-state">
            <FileText size={48} color="#ddd" />
            <p>记录不存在或已被删除</p>
          </div>
        </section>
      </main>
    );
  }

  const typeInfo = getRecordTypeInfo(record);

  return (
    <main className="rd-page">
      {/* Hero 区域 */}
      <section className="rd-hero">
        <div className="rd-hero-bg">
          <div className="rd-hero-gradient" style={{ background: typeInfo.gradient }} />
          <div className="rd-hero-orb rd-orb-1" />
          <div className="rd-hero-orb rd-orb-2" />
        </div>

        <div className="rd-hero-inner">
          {/* 返回按钮 + 操作按钮 */}
          <div className="rd-header-row">
            <button type="button" className="rd-back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
              <span>返回</span>
            </button>

            <div className="rd-action-buttons">
              <button 
                type="button" 
                className="rd-action-btn rd-edit-btn"
                onClick={() => navigate(`/app/timeline/add-record?edit=${record.id}&type=${record.record_type}`)}
                title="编辑记录"
              >
                <Edit3 size={18} />
                <span>编辑</span>
              </button>
            </div>
          </div>

          {/* 类型图标 + 标题 */}
          <div className="rd-type-badge">
            <div className="rd-type-icon-wrap" style={{ background: typeInfo.gradient }}>
              {typeInfo.icon}
            </div>
            <span className="rd-type-label">{typeInfo.label}</span>
          </div>

          <h1 className="rd-title">
            {typeInfo.label}
          </h1>

          <div className="rd-date-row">
            <CalendarDays size={14} />
            <span>{record.record_date}</span>
            {displayPet && (
              <>
                <ChevronRight size={14} className="rd-chevron" />
                <span>{displayPet.name}</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 详细信息卡片 */}
      <section className="rd-content-section">
        <div className="rd-card">
          <div className="rd-card-header">
            <FileText size={16} />
            <span>详细信息</span>
          </div>

          <div className="rd-fields-grid">
            {/* ══ 疫苗专用字段 ══ */}
            {record.record_type === "vaccine" && (
              <>
                {/* 疫苗名称 (title) */}
                {record.title?.trim() && (
                  <DetailField
                    icon={<Syringe size={16} />}
                    label="疫苗名称"
                    value={record.title}
                    color="#6c5ce7"
                    fullWidth
                  />
                )}
                {/* 疫苗批号 */}
                {record.vaccine_batch_number && (
                  <DetailField
                    icon={<FileText size={16} />}
                    label="疫苗批号"
                    value={record.vaccine_batch_number}
                    color="#a29bfe"
                  />
                )}
              </>
            )}

            {/* ══ 驱虫专用字段 ══ */}
            {record.record_type === "deworm" && (
              <>
                {/* 药品名称 (title) */}
                {record.title?.trim() && (
                  <DetailField
                    icon={<Pill size={16} />}
                    label="药品名称"
                    value={record.title}
                    color="#f5576c"
                    fullWidth
                  />
                )}
                {/* 驱虫类型 */}
                {record.deworm_type && (
                  <DetailField
                    icon={<Activity size={16} />}
                    label="驱虫类型"
                    value={
                      record.deworm_type === "internal" ? "体内驱虫" :
                      record.deworm_type === "external" ? "体外驱虫" :
                      record.deworm_type === "broad_spectrum" ? "体内外同驱" :
                      record.deworm_type === "heartworm_prevention" ? "心丝虫预防" :
                      record.deworm_type
                    }
                    color="#fd79a8"
                  />
                )}
              </>
            )}

            {/* ══ 体检专用字段 ══ */}
            {record.record_type === "checkup" && (
              <>
                {/* 检查项目 (title) */}
                {record.title?.trim() && (
                  <DetailField
                    icon={<ClipboardIcon size={16} />}
                    label="检查项目"
                    value={record.title}
                    color="#74b9ff"
                    fullWidth
                  />
                )}
                {/* 检查结果 */}
                {(record as any).check_up_result && (
                  <DetailField
                    icon={<Stethoscope size={16} />}
                    label="检查结果"
                    value={(record as any).check_up_result}
                    color="#0984e3"
                    fullWidth
                  />
                )}
              </>
            )}

            {/* ══ 就诊专用字段 ══ */}
            {record.record_type === "visit" && (
              <>
                {/* 诊断结果 */}
                {record.symptom?.trim() && (
                  <DetailField
                    icon={<Stethoscope size={16} />}
                    label="诊断结果"
                    value={record.symptom}
                    color="#e17055"
                    fullWidth
                  />
                )}
                {/* 治疗方案 */}
                {record.treatment?.trim() && (
                  <DetailField
                    icon={<Heart size={16} />}
                    label="治疗方案"
                    value={record.treatment}
                    color="#00b894"
                    fullWidth
                  />
                )}
              </>
            )}

            {/* ══ 美容专用字段 ══ */}
            {(record.record_type === "beauty" || isBeautyRecord(record)) && (
              <>
                {/* 服务项目 (title) */}
                {record.title?.trim() && (
                  <DetailField
                    icon={<Sparkles size={16} />}
                    label="服务项目"
                    value={record.title}
                    color="#fd79a8"
                    fullWidth
                  />
                )}
              </>
            )}

            {/* ══ 饮食记录专用字段 ══ */}
            {(record.record_type === "diet" || isDietRecord(record)) && (
              <>
                {/* 食物类型 */}
                {(record as any)._rawFoodType && (
                  <DetailField
                    icon={<Heart size={16} />}
                    label="食物类型"
                    value={(record as any)._rawFoodType}
                    color="#00b894"
                  />
                )}
                {/* 喂食量 */}
                {record.appetite?.trim() && (
                  <DetailField
                    icon={<Heart size={16} />}
                    label="喂食量"
                    value={record.appetite}
                    color="#55efc4"
                  />
                )}
                {/* 食欲状态（从 note 提取） */}
                {record.note?.match(/(正常|良好|较差|旺盛|下降)/) && (() => {
                  const m = record.note.match(/(正常|良好|较差|旺盛|下降)/);
                  return m ? (
                    <DetailField
                      icon={<Droplet size={16} />}
                      label="食欲状态"
                      value={m[1]}
                      color="#00cec9"
                    />
                  ) : null;
                })()}
              </>
            )}

            {/* ══ 体重记录专用字段 ══ */}
            {record.record_type === "weight" && (
              <>
                {/* 体重值 — 大字强调显示 */}
                {record.weight_kg != null && !Number.isNaN(Number(record.weight_kg)) && (
                  <DetailField
                    icon={<Scale size={16} />}
                    label="体重值"
                    value={`${Number(record.weight_kg).toFixed(1)} kg`}
                    color="#f0932b"
                    fullWidth
                  />
                )}
                {/* 称重设备/方式 */}
                {(record as any)._rawWeighingDevice && (
                  <DetailField
                    icon={<Activity size={16} />}
                    label="称重设备"
                    value={(record as any)._rawWeighingDevice}
                    color="#e17055"
                  />
                )}
                {/* 测量上下文（如"空腹"、"晨起称重"）— 从 notes 或 measurement_context 提取 */}
                {(() => {
                  const ctx = (record as any)._rawMeasurementContext || "";
                  const notes = record.note || "";
                  // 如果 notes 不是自动模板，则显示为测量备注
                  const autoTemplate = new RegExp(`^体重\\s+${record.weight_kg}`);
                  const userNote = !autoTemplate.test(notes) ? notes.split('\n')[0].trim() : "";
                  const displayText = userNote || ctx;
                  return displayText ? (
                    <DetailField
                      icon={<Star size={16} />}
                      label="测量备注"
                      value={displayText}
                      color="#fdcb6e"
                      fullWidth
                    />
                  ) : null;
                })()}
              </>
            )}

            {/* ══ 观察记录专用字段 ══ */}
            {record.record_type === "observation" && (
              <>
                {/* 排便情况 — 始终显示（用户填了就展示） */}
                {(record as any).symptom && (
                  <DetailField
                    icon={<Activity size={16} />}
                    label="排便情况"
                    value={(record as any).symptom}
                    color="#a29bfe"
                  />
                )}
                {/* 简短摘要 / 备注 */}
                {record.note?.trim() && (
                  <DetailField
                    icon={<FileText size={16} />}
                    label="备注"
                    value={record.note}
                    color="#6c5ce7"
                    fullWidth
                  />
                )}
              </>
            )}

            {/* ══ 通用字段（所有类型共享）══ */}

            {/* 机构/医院 */}
            {(record.hospital || record.hospital?.trim()) && record.hospital.trim() !== "11" && (
              <DetailField
                icon={<Hospital size={16} />}
                label={
                  record.record_type === "beauty" || isBeautyRecord(record) ? "美容机构" :
                  record.record_type === "visit" ? "就诊医院" :
                  record.record_type === "checkup" ? "体检机构" :
                  record.record_type === "vaccine" ? "接种机构" :
                  record.record_type === "deworm" ? "驱虫地点" :
                  "服务机构"
                }
                value={record.hospital}
                color={typeInfo.color}
              />
            )}

            {/* 医生 */}
            {record.doctor?.trim() && (
              <DetailField
                icon={<UserCheck size={16} />}
                label={record.record_type === "checkup" ? "医生建议" : "主治医生"}
                value={record.doctor}
                color="#74b9ff"
              />
            )}

            {/* 费用 */}
            {record.cost != null && Number(record.cost) > 0 && (
              <DetailField
                icon={<Star size={16} />}
                label="费用"
                value={`¥${Number(record.cost).toFixed(2)}`}
                color="#f0932b"
              />
            )}

            {/* 体重 — 仅非 weight 类型显示（weight 已在专用区域显示） */}
            {record.weight_kg != null && !Number.isNaN(Number(record.weight_kg)) && record.record_type !== "weight" && (
              <DetailField
                icon={<Scale size={16} />}
                label="体重"
                value={`${Number(record.weight_kg).toFixed(1)} kg`}
                color="#f0932b"
              />
            )}

            {/* 心情状态 - 仅体重记录显示（观察记录已在专用区域展示） */}
            {record.mood?.trim() && record.record_type === "weight" && (
              <DetailField
                icon={<Heart size={16} />}
                label="精神状态"
                value={
                  record.mood === "happy" ? "开心" :
                  record.mood === "calm" ? "平静" :
                  record.mood === "anxious" ? "焦虑" :
                  record.mood === "excited" ? "兴奋" :
                  record.mood === "sad" ? "低落" :
                  record.mood
                }
                color="#fd79a8"
              />
            )}

            {/* 食欲状况 - 仅体重和饮食记录显示（观察记录已在专用区域展示） */}
            {record.appetite?.trim() && (record.record_type === "weight" || record.record_type === "diet") && (
              <DetailField
                icon={<Heart size={16} />}
                label="食欲状况"
                value={
                  record.appetite === "normal" ? "正常" :
                  record.appetite === "good" ? "良好" :
                  record.appetite === "poor" ? "较差" :
                  record.appetite === "increased" ? "旺盛" :
                  record.appetite === "reduced" ? "下降" :
                  record.appetite
                }
                color="#00b894"
              />
            )}

            {/* ══ 图片附件展示 ══ */}
            {safeImages.length > 0 && (
              <div className="rd-images-section">
                <div className="rd-images-header">
                  <Camera size={14} />
                  <span>图片附件 ({safeImages.length})</span>
                </div>
                <div className="rd-images-grid">
                  {safeImages.map((imgUrl: string, idx: number) => (
                    <div key={idx} className="rd-image-item">
                      <a href={imgUrl} target="_blank" rel="noopener noreferrer">
                        <img src={imgUrl} alt={`附件${idx + 1}`} onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══ 记录元信息 ══ */}
            {record.created_at && (
              <div className="rd-meta-section">
                <DetailField
                  icon={<Clock size={14} />}
                  label="创建时间"
                  value={formatDateTime(record.created_at)}
                  color="#b2bec3"
                />
                <DetailField
                  icon={<FileText size={14} />}
                  label="记录编号"
                  value={`#${record.id}`}
                  color="#b2bec3"
                />
              </div>
            )}
          </div>

          {/* 备注 - 仅显示用户真实填写的备注，过滤自动生成的模板 */}
          {(() => {
            const rawNote = record.note?.trim() || "";
            if (!rawNote) return null;
            // 过滤自动生成的模板备注（非用户真实输入）
            // 体重模板: "体重 X.Xkg" 或 "体重 X.Xkg (xxx)"
            if (record.record_type === "weight" && new RegExp(`^体重\\s+${record.weight_kg}kg`).test(rawNote)) return null;
            // 饮食模板: "牛肉3000g" / "饮食记录：牛肉3000g 正常"
            if (record.record_type === "diet") {
              // 如果 note 完全等于食物名+数量（自动生成），则不显示
              const foodTemplate = `${(record as any)._rawFoodType || ''}${(record as any)._rawFoodAmount ? ` ${(record as any)._rawFoodAmount}g` : ''}`;
              if (rawNote === foodTemplate || rawNote.startsWith(`饮食记录：`)) return null;
            }
            // 有真实内容才渲染
            return (
              <div className="rd-note-section">
                <div className="rd-note-header">
                  <FileText size={14} />
                  <span>备注信息</span>
                </div>
                <div className="rd-note-content">
                  {parseBeautyNote(record.note)}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* 底部操作栏 */}
      <section className="rd-bottom-actions">
        <button
          type="button"
          className="rd-primary-btn"
          onClick={() => navigate(`/app/timeline/add-record?edit=${record!.id}&type=${record!.record_type}`)}
        >
          <Edit3 size={18} />
          <span>编辑此记录</span>
        </button>
      </section>
    </main>
  );
}

// ══════════════════════════════════
// 辅助函数
// ══════════════════════════════════

function getRecordTitle(record: HealthRecord): string {
  if (record.title?.trim()) return record.title;
  if (isBeautyRecord(record)) return "美容护理";
  const map: Record<string, string> = {
    vaccine: "疫苗接种",
    deworm: "驱虫记录",
    checkup: "体检记录",
    visit: "就诊记录",
    beauty: "美容护理",
    observation: "日常观察",
    weight: "体重记录",
    diet: "饮食记录",
  };
  // 体重/饮食类型优先显示
  if (record.record_type === "weight") return record.title || `体重 ${record.weight_kg}kg`;
  if (record.record_type === "diet") return record.title || "饮食记录";
  return map[record.record_type] || "健康记录";
}

// 解析美容备注中的结构化数据
function parseBeautyNote(note: string): React.ReactNode {
  if (!note.includes("[美容]")) return note;
  
  const parts = note.split("|").map(p => p.trim());
  return (
    <div className="rd-beauty-note">
      {parts.map((part, i) => {
        const match = part.match(/^\[美容\]\s*(.+)$/);
        if (match) {
          return (
            <div key={i} className="rd-beauty-service">
              <Sparkles size={14} />
              <strong>服务项目：</strong>
              <span>{match[1]}</span>
            </div>
          );
        }
        
        const hospitalMatch = part.match(/^机构:(.+)$/);
        if (hospitalMatch) {
          return (
            <div key={i} className="rd-beauty-detail">
              <MapPin size={14} />
              <span>机构：{hospitalMatch[1]}</span>
            </div>
          );
        }
        
        const costMatch = part.match(/^费用:(\d+)元$/);
        if (costMatch) {
          return (
            <div key={i} className="rd-beauty-detail">
              <Star size={14} />
              <span>费用：¥{costMatch[1]}</span>
            </div>
          );
        }
        
        if (part) {
          return <div key={i} className="rd-beauty-other">{part}</div>;
        }
        return null;
      })}
    </div>
  );
}
