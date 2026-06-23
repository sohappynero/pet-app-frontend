import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  CalendarDays,
  Droplet,
  Eye,
  FileText,
  Heart,
  PawPrint,
  Pill,
  Scale,
  Sparkles,
  Star,
  Stethoscope,
  Syringe,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { 
  fetchGroomings, fetchWeights, fetchFeedings,
  fetchDewormings, fetchVaccines, fetchCheckups, fetchMedicals,
  fetchObservations,
  getLocalToday 
} from "../lib/api";
import type { FeedingRecord, ObservationRecord } from "../types";
import { useShell } from "../hooks/useShell";
import type { GroomingRecord, HealthRecord, RecordType, WeightRecord } from "../types";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import { getLocalAvatar } from "../lib/pet-avatar";

// ════════════════════════════════════
// 名字圆形头像工具
// ════════════════════════════════════

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

type HealthFilter = "all" | "weight" | "vaccine" | "deworm" | "diet" | "checkup" | "beauty" | "observation";

const filterItems: { key: HealthFilter; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { key: "all", label: "全部", icon: <Sparkles size={14} />, color: "#667eea", bg: "rgba(102,126,234,0.12)" },
  { key: "weight", label: "体重", icon: <Scale size={14} />, color: "#f0932b", bg: "rgba(240,147,43,0.12)" },
  { key: "vaccine", label: "疫苗", icon: <Syringe size={14} />, color: "#6c5ce7", bg: "rgba(108,92,231,0.12)" },
  { key: "deworm", label: "驱虫", icon: <Pill size={14} />, color: "#f5576c", bg: "rgba(245,87,108,0.12)" },
  { key: "diet", label: "饮食", icon: <Heart size={14} />, color: "#00b894", bg: "rgba(0,184,148,0.12)" },
  { key: "checkup", label: "体检", icon: <Stethoscope size={14} />, color: "#74b9ff", bg: "rgba(116,185,255,0.12)" },
  { key: "beauty", label: "美容", icon: <Sparkles size={14} />, color: "#fd79a8", bg: "rgba(253,121,168,0.12)" },
  { key: "observation", label: "日常观察", icon: <Eye size={14} />, color: "#6c5ce7", bg: "rgba(108,92,231,0.12)" },
];

function isDietRecord(record: HealthRecord) {
  // 仅当标题/备注/症状包含饮食相关关键词时归为饮食记录，不再强制把所有observation归为饮食
  const text = `${record.title || ""} ${record.note || ""} ${record.symptom || ""}`;
  return /饮食|喂食|粮|餐|食量|喝水|饮水/.test(text);
}

function isBeautyRecord(record: HealthRecord) {
  const text = `${record.title || ""} ${record.note || ""} ${record.symptom || ""}`;
  return /美容|洗浴|修剪|美容护理|毛发护理/.test(text) || record.record_type === "beauty";
}

function getRecordTitle(record: HealthRecord) {
  // 统一显示类型名称作为标题（与体重记录一致），不使用原始 record.title
  if (isBeautyRecord(record)) return "美容护理";
  const map: Record<string, string> = {
    vaccine: "疫苗接种",
    deworm: "驱虫护理",
    checkup: "体检记录",
    visit: "就诊记录",
    beauty: "美容护理",
    observation: "日常观察",
    external: "外部记录",
    weight: "体重记录",
    diet: "饮食记录",
  };
  return map[record.record_type] || "健康记录";
}

function getRecordSub(record: HealthRecord) {
  // 统一副标题逻辑：备注(note) 优先，没有再显示其他字段（与体重记录一致）
  
  // 工具函数：判断文本是否有意义（不是纯数字/ID/无意义关键字）
  const isMeaningfulText = (text?: string | null): boolean => {
    if (!text || !text.trim()) return false;
    const trimmed = text.trim();
    if (/^\d{1,3}$/.test(trimmed)) return false;
    if (/^机构:\s*\d+$/.test(trimmed)) return false;
    if (/^(费用|机构):\s*\d+(元)?$/.test(trimmed)) return false;
    // 过滤无意义关键字及 "external · 数字" 格式
    if (/^(external|internal|raw)$/i.test(trimmed)) return false;
    // 用更宽泛的匹配：包含 external/internal 后跟数字/符号就过滤
    if (/^(external|internal)\s*[\s·\-:_]\s*\d+/i.test(trimmed)) return false;
    // 过滤与类型名完全相同的内容（避免副标题重复标题）
    const typeLabels = ["疫苗接种", "驱虫护理", "体检记录", "就诊记录",
      "美容护理", "日常观察", "外部记录", "体重记录", "饮食记录"];
    if (typeLabels.includes(trimmed)) return false;
    return true;
  };

  // ══════════════════════════
  // 第1优先级：体重记录（特殊逻辑：重量值或自定义备注）
  // ══════════════════════════
  if (record.weight_kg !== null && !Number.isNaN(Number(record.weight_kg))
      && record.record_type !== "beauty" && !isBeautyRecord(record) && !isDietRecord(record)) {
    const notes = record.note || "";
    const autoTemplate = new RegExp(`^体重\\s+${record.weight_kg}kg`);
    if (notes && !autoTemplate.test(notes) && isMeaningfulText(notes))
      return notes.split('\n')[0].trim();
    return `${Number(record.weight_kg).toFixed(1)}kg`;
  }

  // ══════════════════════════
  // 第2优先级：饮食记录（解析食物+数量）
  // ══════════════════════════
  if (isDietRecord(record)) {
    const parts: string[] = [];
    if (record.note) {
      const foodMatch = record.note.match(/^([^\d]+)/);
      if (foodMatch && foodMatch[1].trim()) parts.push(foodMatch[1].trim());
    }
    if (record.appetite) parts.push(record.appetite);
    return parts.length > 0 ? parts.join(" ") : "";
  }

  // ══════════════════════════
  // 第3优先级：美容记录（解析 [美容] 结构化 notes）
  // ══════════════════════════
  if (record.record_type === "beauty" || isBeautyRecord(record)) {
    if (record.note?.includes("[美容]")) {
      const match = record.note.match(/\[美容\]\s*(.+?)(?:\s*[\|]|$)/);
      if (match && isMeaningfulText(match[1])) return match[1].trim();
    }
    if (isMeaningfulText(record.hospital)) return record.hospital!.trim();
    return "美容护理";
  }

  // ══════════════════════════
  // 第3.5优先级：日常观察（显示简短摘要 or 排便情况）
  // ══════════════════════════
  if (record.record_type === "observation") {
    // 优先显示用户填写的备注/摘要(note)
    if (isMeaningfulText(record.note)) return record.note!.split('\n')[0].trim().split(' | ')[0];
    // 没有备注时，用排便情况(symptom)代替（如"软便"、"便秘"）
    if (isMeaningfulText(record.symptom)) return record.symptom!.trim();
    return "";
  }

  // ══════════════════════════
  // 通用逻辑：所有其他类型统一为 note → hospital → symptom → ...
  // ══════════════════════════

  // 统一第1优先级：备注(note)
  if (isMeaningfulText(record.note)) {
    const sub = record.note!.split('\n')[0].trim();
    // 驱虫记录：如果 note 是驱虫类型名，拼接医院信息
    if (record.record_type === "deworm" && record.deworm_type && sub === record.deworm_type) {
      if (isMeaningfulText(record.hospital)) return `${sub} · ${record.hospital!.trim()}`;
    }
    return sub;
  }

  // 第2优先级：医院/机构(hospital)
  if (isMeaningfulText(record.hospital)) {
    const h = record.hospital!.trim();
    // 驱虫记录加前缀
    if (record.record_type === "deworm" && record.deworm_type)
      return `${record.deworm_type} · ${h}`;
    return h;
  }

  // 第3优先级：按类型显示特定字段
  if (record.record_type === "deworm" && record.deworm_type)
    return `${record.deworm_type}护理`;
  if (record.medical_result && isMeaningfulText(record.medical_result))
    return record.medical_result.split("\n")[0];
  if (isMeaningfulText(record.symptom)) return record.symptom!.trim();
  if (isMeaningfulText(record.treatment)) return record.treatment!.split("\n")[0];

  // 兜底：有 weight 但前面没匹配到
  if (record.weight_kg != null && !Number.isNaN(Number(record.weight_kg)))
    return `${Number(record.weight_kg).toFixed(1)}kg`;

  return "";
}

type IconInfo = { icon: React.ReactNode; bg: string; color: string; gradient: string };

function getIconInfo(record: HealthRecord): IconInfo {
  // 按优先级匹配类型图标
  if (record.record_type === "vaccine")
    return { icon: <Syringe size={20} />, bg: "#f0edfc", color: "#6c5ce7", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" };
  if (record.record_type === "deworm")
    return { icon: <Pill size={20} />, bg: "#fff0f3", color: "#f5576c", gradient: "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)" };
  if (record.record_type === "checkup")
    return { icon: <Stethoscope size={20} />, bg: "#eaf4ff", color: "#74b9ff", gradient: "linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)" };
  if (record.record_type === "beauty" || isBeautyRecord(record))
    return { icon: <Sparkles size={20} />, bg: "#fff0f5", color: "#fd79a8", gradient: "linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)" };
  if (record.record_type === "visit")
    return { icon: <Activity size={20} />, bg: "#fef0e8", color: "#e17055", gradient: "linear-gradient(135deg, #e17055 0%, #f6b93b 100%)" };
  if (record.weight_kg !== null && !Number.isNaN(Number(record.weight_kg)))
    return { icon: <Scale size={20} />, bg: "#fef9e7", color: "#f0932b", gradient: "linear-gradient(135deg, #f9ca24 0%, #f0932b 100%)" };
  if (isDietRecord(record))
    return { icon: <Heart size={20} />, bg: "#e8f8f0", color: "#00b894", gradient: "linear-gradient(135deg, #00b894 0%, #55efc4 100%)" };
  if (record.record_type === "observation")
    return { icon: <Eye size={20} />, bg: "#f0e8ff", color: "#6c5ce7", gradient: "linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)" };
  if (record.record_type === "external")
    return { icon: <FileText size={20} />, bg: "#fef9e7", color: "#e17055", gradient: "linear-gradient(135deg, #fdcb6e 0%, #e17055 100%)" };
  return { icon: <FileText size={20} />, bg: "#f5f0eb", color: "#8b7355", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" };
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function Records() {
  const navigate = useNavigate();
  const { phone, selectedPetId, selectedPet, pets } = useShell();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<HealthFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  const currentPet = useMemo(
    () => selectedPet || pets[0] || null,
    [selectedPet, pets]
  );

  // 确保记录页面也使用最新的头像显示
  const displayPet = useMemo(() => {
    if (!currentPet) return null;
    const local = getLocalAvatar(currentPet.id);
    return local ? { ...currentPet, image_url: local } : currentPet;
  }, [currentPet, pets]);

  useEffect(() => {
    setLoading(true);
    const petId = selectedPetId ?? undefined;
    // 加载所有专用表数据（美容 + 体重 + 饮食 + 驱虫 + 疫苗 + 体检 + 就诊 + 日常观察）
    Promise.all([
      petId ? fetchGroomings(petId).catch(() => []) : Promise.resolve([]),
      petId ? fetchWeights(petId).catch(() => []) : Promise.resolve([]),
      petId ? fetchFeedings(petId).catch(() => []) : Promise.resolve([]),
      petId ? fetchDewormings(petId).catch(() => []) : Promise.resolve([]),
      petId ? fetchVaccines(petId).catch(() => []) : Promise.resolve([]),
      petId ? fetchCheckups(petId).catch(() => []) : Promise.resolve([]),
      petId ? fetchMedicals(petId).catch(() => []) : Promise.resolve([]),
      petId ? fetchObservations(petId).catch(() => []) : Promise.resolve([]),
    ])
      .then(([groomingRecsRaw, weightRecsRaw, feedingRecsRaw, dewormRecsRaw, vaccineRecsRaw, checkupRecsRaw, medicalRecsRaw, observationRecsRaw]) => {
        // 统一解构：疫苗API返回分页对象{list}，其余返回裸数组
        const groomingRecs = Array.isArray(groomingRecsRaw) ? groomingRecsRaw : [];
        const weightRecs = Array.isArray(weightRecsRaw) ? weightRecsRaw : [];
        const feedingRecs = Array.isArray(feedingRecsRaw) ? feedingRecsRaw : [];
        const dewormRecs = Array.isArray(dewormRecsRaw) ? dewormRecsRaw : [];
        // 疫苗API返回 PagedVaccineRecords = {total, list, page, page_size}
        const vaccineRecs = Array.isArray(vaccineRecsRaw)
          ? vaccineRecsRaw
          : ((vaccineRecsRaw && vaccineRecsRaw.list) ? vaccineRecsRaw.list : []);
        const checkupRecs = Array.isArray(checkupRecsRaw) ? checkupRecsRaw : [];
        const medicalRecs = Array.isArray(medicalRecsRaw) ? medicalRecsRaw : [];
        const observationRecs = Array.isArray(observationRecsRaw) ? observationRecsRaw : [];
        // 1. 映射 GroomingRecord → HealthRecord
        const groomings: HealthRecord[] = (groomingRecs as GroomingRecord[]).map((g) => ({
          id: g.id,
          record_type: "beauty" as RecordType,
          record_date: g.grooming_date ? String(g.grooming_date).slice(0, 10) : getLocalToday(),
          title: g.services_performed?.length ? String(g.services_performed[0]) : "美容护理",
          hospital: g.provider_name || "",
          doctor: "", symptom: "", treatment: "",
          cost: g.cost ?? null,
          weight_kg: null, mood: "", appetite: "",
          note: g.notes || `${g.provider_name || "美容机构"} | ${g.cost ? g.cost + "元" : ""}`,
          images: g.before_photos || [],
        }));

        // 2. 映射 WeightRecord → HealthRecord
        // 标题固定为"体重记录"，用户自定义标题（如"空腹"）显示在副标题行
        const weights: HealthRecord[] = (weightRecs as WeightRecord[]).map((w) => ({
          id: w.id,
          record_type: "weight" as RecordType,
          record_date: w.record_date || getLocalToday(),
          title: "体重记录",
          hospital: w.weighing_device || "",
          doctor: "", symptom: "", treatment: "",
          cost: null,
          weight_kg: Number(w.weight_kg),
          mood: "", appetite: "",
          note: w.notes || `体重 ${w.weight_kg}kg${w.measurement_context ? ` (${w.measurement_context})` : ""}`,
          images: w.photo_urls || [],
        }));

        // 3. 映射 FeedingRecord → HealthRecord（diet 类型）
        // 标题固定为"饮食记录"，食物名+数量显示在副标题行
        const feedings: HealthRecord[] = (feedingRecs as FeedingRecord[]).map((f) => ({
          id: f.id,
          record_type: "diet" as RecordType,
          record_date: f.feeding_date ? String(f.feeding_date).slice(0, 10) : getLocalToday(),
          title: "饮食记录",
          hospital: "",
          doctor: "", symptom: "", treatment: "",
          cost: null,
          weight_kg: null, mood: "", appetite: f.main_food_amount ? String(f.main_food_amount) + 'g' : "",
          note: f.notes || `${f.main_food_type || ''}${f.main_food_amount ? ` ${f.main_food_amount}g` : ''}`,
          images: f.photo_urls || [],
        }));

        // 4. 映射 DewormingRecord → HealthRecord（deworm 类型）
        const dewormings: HealthRecord[] = (dewormRecs as any[]).map((d) => ({
          id: d.id,
          record_type: "deworm" as RecordType,
          record_date: d.deworming_date ? String(d.deworming_date).slice(0, 10) : getLocalToday(),
          title: d.medication_name || "驱虫记录",
          hospital: d.pet_hospital || "",
          doctor: "",
          deworm_type: d.deworming_type || "",
          symptom: "", treatment: "",
          cost: d.cost ?? null,
          weight_kg: null, mood: "", appetite: "",
          note: d.notes || `${d.medication_name || '驱虫'}${d.pet_hospital ? ` | ${d.pet_hospital}` : ''}${d.cost ? ` | ${d.cost}元` : ''}`,
          images: d.photo_urls || [],
        }));

        // 5. 映射 VaccineRecord → HealthRecord（vaccine 类型）
        const vaccines: HealthRecord[] = (vaccineRecs as any[]).map((v) => ({
          id: v.id,
          record_type: "vaccine" as RecordType,
          record_date: v.vaccine_date ? String(v.vaccine_date).slice(0, 10) : getLocalToday(),
          title: v.vaccine_name || "疫苗接种",
          hospital: v.pet_hospital || "",
          doctor: v.veterinarian || "",
          symptom: "", treatment: "",
          cost: null,
          weight_kg: null, mood: "", appetite: "",
          note: v.notes || `${v.vaccine_name || '疫苗'}${v.pet_hospital ? ` | ${v.pet_hospital}` : ''}`,
          images: v.photo_urls || [],
        }));

        // 6. 映射 CheckUpRecord → HealthRecord（checkup 类型）
        const checkups: HealthRecord[] = (checkupRecs as any[]).map((c) => ({
          id: c.id,
          record_type: "checkup" as RecordType,
          record_date: c.check_up_date ? String(c.check_up_date).slice(0, 10) : getLocalToday(),
          title: "体检记录",
          hospital: c.pet_hospital || "",
          doctor: c.veterinarian || "",
          symptom: "", treatment: "",
          cost: null,
          medical_result: c.check_up_result || c.medical_result || null,
          weight_kg: null, mood: "", appetite: "",
          note: c.notes || `${c.pet_hospital || '体检机构'} | ${c.doctor_advice || c.check_up_result || ''}`,
          images: c.check_up_photo_urls || [],
        }));

        // 7. 映射 MedicalRecord → HealthRecord（visit 类型）
        const medicals: HealthRecord[] = (medicalRecs as any[]).map((m) => ({
          id: m.id,
          record_type: "visit" as RecordType,
          record_date: m.medical_date ? String(m.medical_date).slice(0, 10) : getLocalToday(),
          title: m.chief_complaint || "就诊记录",
          hospital: m.pet_hospital || "",
          doctor: "",
          symptom: Array.isArray(m.symptoms) ? (m.symptoms as any[])?.map((s: any) => s.name || s).join(', ') : (m.chief_complaint || ""),
          treatment: m.treatment_plan || m.prescription || "",
          cost: m.medical_amount ?? null,
          weight_kg: null, mood: "", appetite: "",
          note: m.notes || `${m.diagnosis || m.chief_complaint || '就诊'}${m.medical_amount ? ` | ${m.medical_amount}元` : ''}`,
          images: m.medical_case_photo_urls || [],
        }));

        // 8. 映射 ObservationRecord → HealthRecord（observation 类型）
        // 后端字段: stool_consistency(便便性状) / stool_frequency(排便次数) / energy_level(精力) / mental_status(情绪)
        const observations: HealthRecord[] = (observationRecs as ObservationRecord[]).map((o) => {
          // 直接使用用户填写的 notes，不做过滤
          const displayNote = (o as any).notes?.trim() || "";

          // 翻译后端枚举值为中文
          const cMap: Record<string, string> = { normal: "正常", soft: "偏软", loose: "稀", watery: "水样", constipated: "便秘", blood_present: "带血" };
          const stoolText = (() => {
            const c = (o as any).stool_consistency;
            const f = (o as any).stool_frequency;
            if (!c && f == null) return "";
            const parts: string[] = [];
            if (c) parts.push(cMap[c] || c);
            if (f != null) parts.push(`${f}次/天`);
            return parts.join("，");
          })();

          return {
            id: o.id,
            record_type: "observation" as RecordType,
            record_date: o.observation_date ? String(o.observation_date).slice(0, 10) : getLocalToday(),
            title: "日常观察",
            hospital: "", doctor: "",
            symptom: stoolText || "",
            treatment: "",
            cost: null,
            weight_kg: o.weight ?? null,
            mood: (o as any).mental_status || "",
            appetite: o.appetite_status || "",
            note: displayNote,
            images: [],
          };
        });

        // 合并所有专用表数据
        setRecords([...groomings, ...weights, ...feedings, ...dewormings, ...vaccines, ...checkups, ...medicals, ...observations]);
      })
      .finally(() => setLoading(false));
  }, [phone, selectedPetId]);

  // 最新体重
  const latestWeight = useMemo(() => {
    const ws = records
      .filter((r) => r.weight_kg !== null && !Number.isNaN(Number(r.weight_kg)))
      .sort((a, b) => b.record_date.localeCompare(a.record_date));
    return ws[0]?.weight_kg ?? null;
  }, [records]);

  // 上次体重
  const prevWeight = useMemo(() => {
    const ws = records
      .filter((r) => r.weight_kg !== null && !Number.isNaN(Number(r.weight_kg)))
      .sort((a, b) => b.record_date.localeCompare(a.record_date));
    return ws[1]?.weight_kg ?? null;
  }, [records]);

  const weightDiff = useMemo(() => {
    if (latestWeight === null || prevWeight === null) return null;
    return (latestWeight - prevWeight).toFixed(1);
  }, [latestWeight, prevWeight]);

  const weightTrend = useMemo(() => {
    if (weightDiff === null) return "flat";
    if (Number(weightDiff) > 0) return "up";
    if (Number(weightDiff) < 0) return "down";
    return "flat";
  }, [weightDiff]);

  // 统计
  const stats = useMemo(() => {
    const vaccine = records.filter((r) => r.record_type === "vaccine").length;
    const deworm = records.filter((r) => r.record_type === "deworm").length;
    const checkup = records.filter((r) => r.record_type === "checkup").length;
    const beauty = records.filter((r) => isBeautyRecord(r)).length;
    return { vaccine, deworm, checkup, beauty, total: records.length };
  }, [records]);

  // XSS 安全清理：过滤 HTML 标签，只保留纯文本
  const sanitizeText = (text: string | null | undefined): string => {
    if (!text || !text.trim()) return "";
    // 移除所有 HTML/JS 标签和实体编码的尖括号
    return text.replace(/<[^>]*>/g, "").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").trim();
  };

  // 切换筛选时重置页码
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter]);

  // 过滤后排序
  const filteredRecords = useMemo(() => {
    const filtered = records.filter((record) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "weight")
        return record.weight_kg !== null && !Number.isNaN(Number(record.weight_kg));
      if (activeFilter === "vaccine") return record.record_type === "vaccine";
      if (activeFilter === "deworm") return record.record_type === "deworm";
      if (activeFilter === "checkup") return record.record_type === "checkup";
      if (activeFilter === "diet") return isDietRecord(record);
      if (activeFilter === "beauty") return isBeautyRecord(record);
      if (activeFilter === "observation") return record.record_type === "observation";
      return true;
    });
    return [...filtered].sort((a, b) => b.record_date.localeCompare(a.record_date));
  }, [records, activeFilter]);

  // 分页数据
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, currentPage]);

  return (
    <main className="h3d-page">
      {/* Hero 区域 */}
      <section className="h3d-hero">
        <div className="h3d-hero-bg">
          <div className="h3d-hero-gradient" />
          <div className="h3d-hero-orb h3d-orb-1" />
          <div className="h3d-hero-orb h3d-orb-2" />
          <div className="h3d-hero-orb h3d-orb-3" />
          <div className="h3d-hero-grid-pattern" />
        </div>

        <div className="h3d-hero-inner">
          <div className="h3d-hero-text">
            <div className="h3d-hero-badge">
              <FileText size={12} />
              <span>健康档案</span>
            </div>
            <h1 className="h3d-hero-title">
              健康记录
            </h1>
            <p className="h3d-hero-desc">
              {currentPet ? `${currentPet.name}的健康档案` : "宠物健康档案"}
            </p>

            {currentPet && (
              <button className="h3d-pet-btn" onClick={() => navigate("/app")}>
                {displayPet?.image_url ? (
                  isNameCircleMarker(displayPet.image_url) ? (
                    <PetNameCircle name={currentPet.name} size={28} />
                  ) : (
                    <img src={displayPet.image_url} alt={currentPet.name}
                      style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )
                ) : (
                  currentPet._resolved_avatar_url && !isNameCircleMarker(currentPet._resolved_avatar_url) ? (
                    <img src={currentPet._resolved_avatar_url} alt={currentPet.name}
                      style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <PetNameCircle name={currentPet.name} size={28} />
                  )
                )}
                <span>{currentPet.name}</span>
                <PawPrint size={12} />
              </button>
            )}
          </div>

          <div className="h3d-hero-visual">
              <div className="h3d-char-stage">
                <PetPhotoAvatar pet={displayPet} size="default" className="hero-circular-avatar" />
              </div>
          </div>

          {/* 浮动装饰 - 白色图标 + 彩色圆底 */}
          <span className="ph3d-float-deco ph3d-float-heart"><Heart size={20} fill="#fff" color="#fff" /></span>
          <span className="ph3d-float-deco ph3d-float-star"><Star size={18} fill="#fff" color="#fff" /></span>
          <span className="ph3d-float-deco ph3d-float-paw"><PawPrint size={18} color="#fff" /></span>
        </div>
      </section>

      {/* 体重追踪卡片 */}
      <section className="h3d-stats-section">
        <div className="h3d-weight-card">
          <div className="h3d-weight-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="h3d-weight-icon">
                <Scale size={20} />
              </div>
              <span className="h3d-weight-label">体重追踪</span>
            </div>
            <div className="h3d-weight-prev h3d-prev-inline">
              较上次{" "}
              {prevWeight !== null ? (
                <>
                  <strong>{Number(prevWeight).toFixed(1)}</strong> kg
                  {weightDiff !== null && (
                    <span className={`h3d-prev-diff h3d-prev-${weightTrend}`}>
                      {weightTrend === "up" && <TrendingUp size={11} />}
                      {weightTrend === "down" && <TrendingDown size={11} />}
                      {weightTrend === "flat" && <Minus size={11} />}
                      {Number(weightDiff) > 0 ? `+${weightDiff}` : weightDiff}
                    </span>
                  )}
                </>
              ) : (
                <strong style={{ color: "#bbb", fontWeight: 600 }}>--</strong>
              )}
            </div>
          </div>

          <div className="h3d-weight-body">
            <div className="h3d-weight-main">
              <span className="h3d-weight-value">
                {latestWeight !== null ? Number(latestWeight).toFixed(1) : "--"}
              </span>
              <span className="h3d-weight-unit">kg</span>
            </div>
          </div>

          <div className="h3d-weight-stats">
            <button
              className={`h3d-ws-item ${activeFilter === "vaccine" ? "active" : ""}`}
              onClick={() => setActiveFilter("vaccine")}
            >
              <Syringe size={14} className="h3d-ws-icon h3d-ws-vaccine" />
              <span className="h3d-ws-num">{stats.vaccine}</span>
              <span className="h3d-ws-label">疫苗</span>
            </button>
            <div className="h3d-ws-divider" />
            <button
              className={`h3d-ws-item ${activeFilter === "deworm" ? "active" : ""}`}
              onClick={() => setActiveFilter("deworm")}
            >
              <Pill size={14} className="h3d-ws-icon h3d-ws-deworm" />
              <span className="h3d-ws-num">{stats.deworm}</span>
              <span className="h3d-ws-label">驱虫</span>
            </button>
            <div className="h3d-ws-divider" />
            <button
              className={`h3d-ws-item ${activeFilter === "checkup" ? "active" : ""}`}
              onClick={() => setActiveFilter("checkup")}
            >
              <Stethoscope size={14} className="h3d-ws-icon h3d-ws-checkup" />
              <span className="h3d-ws-num">{stats.checkup}</span>
              <span className="h3d-ws-label">体检</span>
            </button>
            <div className="h3d-ws-divider" />
            <button
              className={`h3d-ws-item ${activeFilter === "beauty" ? "active" : ""}`}
              onClick={() => setActiveFilter("beauty")}
            >
              <Sparkles size={14} className="h3d-ws-icon h3d-ws-beauty" />
              <span className="h3d-ws-num">{stats.beauty}</span>
              <span className="h3d-ws-label">美容</span>
            </button>
          </div>
        </div>
      </section>

      {/* 筛选标签 */}
      <section className="h3d-filter-section">
        <div className="h3d-filter-scroll">
          {filterItems.map((item) => (
            <button
              key={item.key}
              className={`h3d-filter-item ${activeFilter === item.key ? "active" : ""}`}
              onClick={() => setActiveFilter(item.key)}
              style={activeFilter === item.key ? {
                background: item.bg,
                color: item.color,
                borderColor: item.color
              } : {}}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 记录列表 */}
      <section className="h3d-list-section">
        {loading ? (
          <div className="h3d-empty">
            <div className="h3d-empty-icon">
              <Activity size={28} />
            </div>
            <p>加载中...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="h3d-empty-fancy">
            <div className="h3d-empty-3d-scene">
              {/* 宠物照片头像 */}
              <PetPhotoAvatar pet={displayPet} size="small" />
              {/* 环绕的可爱元素 - Lucide 图标 + 彩色圆底 */}
              <span className="h3d-float-ele h3d-fe-1"><FileText size={16} color="#fff" /></span>
              <span className="h3d-float-ele h3d-fe-2"><Pill size={16} color="#fff" /></span>
              <span className="h3d-float-ele h3d-fe-3"><Heart size={16} color="#fff" /></span>
              <span className="h3d-float-ele h3d-fe-4"><Sparkles size={14} color="#fff" /></span>
              <span className="h3d-float-ele h3d-fe-5"><Syringe size={16} color="#fff" /></span>
            </div>

            <div className="h3d-empty-circle">
              <div className="h3d-empty-ring h3d-ring-1" />
              <div className="h3d-empty-ring h3d-ring-2" />
              <div className="h3d-empty-emoji"><Stethoscope size={22} color="#6c5ce7" /></div>
            </div>

            <h4 className="h3d-empty-title">暂无健康记录</h4>
            <p className="h3d-empty-desc">
              {currentPet
                ? `${currentPet.name}还没有健康记录哦，去首页添加吧`
                : "还没有任何健康记录，去首页添加吧"}
            </p>
          </div>
        ) : (
          <div className="h3d-record-list">
            {paginatedRecords.map((record) => {
              const { icon, bg, color, gradient } = getIconInfo(record);
              const sub = getRecordSub(record);
              return (
                <button
                  key={`${record.id}-${record.record_type}`}
                  className="h3d-record-item"
                  onClick={() => navigate(`/app/timeline/record/${record.id}?type=${record.record_type}`)}
                >
                  <div className="h3d-record-icon" style={{ background: bg }}>
                    <div className="h3d-record-icon-inner" style={{ background: gradient }}>
                      {icon}
                    </div>
                  </div>

                  <div className="h3d-record-content">
                    <strong className="h3d-record-title">{sanitizeText(getRecordTitle(record))}</strong>
                    {sub && <span className="h3d-record-sub">{sanitizeText(sub)}</span>}
                    <div className="h3d-record-date">
                      <CalendarDays size={12} className="h3d-record-date-icon" />
                      {record.record_date}
                    </div>
                  </div>

                  <div className="h3d-record-action">
                    <div className="h3d-action-btn" title="查看详情">
                      <PawPrint size={16} strokeWidth={2.5} />
                    </div>
                  </div>
                </button>
              );
            })}
            {totalPages > 1 && (
              <div className="h3d-pagination">
                <button
                  className="h3d-page-btn h3d-page-arrow"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="上一页"
                >
                  ‹
                </button>
                {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                  page === "..." ? (
                    <span key={`ellipsis-${idx}`} className="h3d-page-ellipsis">…</span>
                  ) : (
                    <button
                      key={page}
                      className={`h3d-page-btn ${currentPage === page ? "active" : ""}`}
                      onClick={() => setCurrentPage(page as number)}
                      aria-label={`第 ${page} 页`}
                      aria-current={currentPage === page ? "page" : undefined}
                    >
                      {page}
                    </button>
                  )
                )}
                <button
                  className="h3d-page-btn h3d-page-arrow"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="下一页"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
