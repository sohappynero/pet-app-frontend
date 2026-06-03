import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  ClipboardList,
  Droplet,
  FileText,
  Heart,
  Hospital,
  ImagePlus,
  PawPrint,
  Save,
  Scale,
  Sparkles,
  Stethoscope,
  Syringe,
  UserCheck,
  X,
} from "lucide-react";
import {
  createVaccine, createDeworming, createCheckup,
  createMedical, createObservation, createGrooming, createWeight,
  createDiet,
  fetchRecords, fetchWeights, fetchFeedings, fetchGroomings, getLocalToday,
} from "../lib/api";
import { useShell } from "../hooks/useShell";
import type { RecordType } from "../types";
import PetPhotoAvatar from "../components/PetPhotoAvatar";
import { getLocalAvatar } from "../lib/pet-avatar";

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
  { value: "weight" as RecordType, label: "体重", icon: <Scale size={14} />, color: "#f0932b", bg: "#fef9e7" },
  { value: "diet" as RecordType, label: "饮食", icon: <Heart size={14} />, color: "#E8590C", bg: "#FFF4EC" },
  { value: "observation" as RecordType, label: "日常观察", icon: <Heart size={14} />, color: "#00b894", bg: "#e8f8f0" },
];

// 排便情况合法值（与后端枚举 + 提示文案对齐）
const VALID_STOOL_VALUES = [
  "正常", "偏软", "软便",
  "稀", "稀便", "水样",
  "便秘", "带血", "便血",
];

// ═══════════════════════════════════════════
// 每种类型的字段配置：可见性 + 占位符文案
// ═══════════════════════════════════════════

const typeConfig: Record<RecordType, {
  pageTitle: string;
  heroDesc: string;
  // 通用字段
  titlePh: string;
  titleLabel: string;
  dateLabel: string;
  showNextDue: boolean;
  nextDuePh: string;
  nextDueLabel: string;
  hospital: boolean; hospitalPh: string; hospitalLabel: string;
  doctor: boolean; doctorPh: string;
  cost: boolean; costPh: string;
  weight: boolean;
  mood: boolean;
  appetite: boolean;
  symptom: boolean; symptomPh: string;
  treatment: boolean; treatmentPh: string;
  notePh: string;
  showImages: boolean;
  imageLabel: string;
  imagePh: string;
  // ── 后端专用字段 ──
  /** 疫苗：疫苗名称（替代通用title） */
  vaccineName?: boolean;
  vaccineNameLabel?: string;
  vaccineNamePh?: string;
  /** 疫苗：批号 */
  batchNumber?: boolean;
  batchNumberLabel?: string;
  batchNumberPh?: string;
  /** 驱虫：驱虫类型下拉选择 */
  dewormType?: boolean;
  dewormTypeLabel?: string;
  dewormTypeOptions?: { value: string; label: string }[];
  /** 体检：检查项目 */
  checkupProjects?: boolean;
  checkupProjectsPh?: string;
  checkupProjectsLabel?: string;
  /** 体检：检查结果 */
  checkupResult?: boolean;
  checkupResultPh?: string;
  checkupResultLabel?: string;
  /** 就诊：诊疗结果 */
  medicalResult?: boolean;
  medicalResultPh?: string;
  medicalResultLabel?: string;
  /** 观察：排便情况 */
  bowelMovement?: boolean;
  bowelMovementPh?: string;
}> = {
  // ─── 疫苗 ───
  vaccine: {
    pageTitle: "添加疫苗记录",
    heroDesc: "为宠物记录疫苗接种信息",
    titlePh: "",
    titleLabel: "疫苗名称",
    dateLabel: "接种日期",
    hospital: true, hospitalPh: "接种医院/诊所", hospitalLabel: "接种机构",
    doctor: false, doctorPh: "",
    cost: false, costPh: "",
    weight: false,
    mood: false,
    appetite: false,
    symptom: false, symptomPh: "",
    treatment: false, treatmentPh: "",
    notePh: "如：接种部位、反应情况等",
    showImages: true,
    imageLabel: "🖼️ 图片附件",
    imagePh: "粘贴图片链接，每行一个\n• 疫苗本内页照片\n• 接种凭证/发票\n• 药物包装",
    // 后端专用
    vaccineName: true,
    vaccineNameLabel: "疫苗名称",
    vaccineNamePh: "如：狂犬疫苗、猫三联、犬六联",
    batchNumber: true,
    batchNumberLabel: "疫苗批号",
    batchNumberPh: "疫苗包装上的批次号",
  },

  // ─── 驱虫 ───
  deworm: {
    pageTitle: "添加驱虫记录",
    heroDesc: "为宠物记录驱虫信息",
    titlePh: "",
    titleLabel: "药品名称",
    dateLabel: "驱虫日期",
    hospital: true, hospitalPh: "驱虫地点", hospitalLabel: "机构/地点",
    doctor: false, doctorPh: "",
    cost: true, costPh: "费用（元）",
    weight: false,
    mood: false,
    appetite: false,
    symptom: false, symptomPh: "",
    treatment: false, treatmentPh: "",
    notePh: "剂量、使用方式等备注信息",
    showImages: true,
    imageLabel: "🖼️ 图片附件",
    imagePh: "粘贴图片链接，每行一个\n• 驱虫药包装/说明书\n• 使用后照片",
    // 后端专用
    dewormType: true,
    dewormTypeLabel: "驱虫类型",
    dewormTypeOptions: [
      { value: "internal", label: "体内驱虫" },
      { value: "external", label: "体外驱虫" },
      { value: "broad_spectrum", label: "体内外同驱" },
      { value: "heartworm_prevention", label: "心丝虫预防" },
    ],
  },

  // ─── 体检 ───
  checkup: {
    pageTitle: "添加体检记录",
    heroDesc: "为宠物记录健康体检结果",
    titlePh: "",
    titleLabel: "体检标题",
    dateLabel: "体检日期",
    showNextDue: false,
    nextDuePh: "", nextDueLabel: "",
    hospital: true, hospitalPh: "体检机构", hospitalLabel: "体检机构",
    doctor: true, doctorPh: "检查医生",
    cost: false, costPh: "",
    weight: false,
    mood: false,
    appetite: false,
    symptom: false, symptomPh: "",
    treatment: false, treatmentPh: "",
    notePh: "其他备注",
    showImages: true,
    imageLabel: "🖼️ 图片附件",
    imagePh: "粘贴图片链接，每行一个\n• 血常规/生化化验单\n• B超/X光片\n• 体检报告",
    // 后端专用
    checkupProjects: true,
    checkupProjectsLabel: "检查项目",
    checkupProjectsPh: "如：血常规、B超、X光、心脏听诊...",
    checkupResult: true,
    checkupResultLabel: "检查结果",
    checkupResultPh: "检查结论摘要",
  },

  // ─── 就诊 ───
  visit: {
    pageTitle: "添加就诊记录",
    heroDesc: "为宠物记录就医诊疗信息",
    titlePh: "",
    titleLabel: "就诊标题",
    dateLabel: "就诊日期",
    showNextDue: false,
    nextDuePh: "", nextDueLabel: "",
    hospital: true, hospitalPh: "就诊医院", hospitalLabel: "就诊医院",
    doctor: true, doctorPh: "主治医生",
    cost: true, costPh: "费用（元）",
    weight: false,
    mood: false,
    appetite: false,
    symptom: true, symptomPh: "症状描述",
    treatment: true, treatmentPh: "治疗方案",
    notePh: "复诊安排、注意事项等",
    showImages: true,
    imageLabel: "🖼️ 图片附件",
    imagePh: "粘贴图片链接，每行一个\n• 患部特写\n• 处方单\n• 缴费单据",
    // 后端专用
    medicalResult: true,
    medicalResultLabel: "诊断结果",
    medicalResultPh: "医生的诊断结论",
  },

  // ─── 美容 ───
  beauty: {
    pageTitle: "添加美容记录",
    heroDesc: "为宠物记录美容护理信息",
    titlePh: "如：洗澡修剪 / 宠物SPA",
    titleLabel: "服务项目",
    dateLabel: "美容日期",
    showNextDue: false,
    nextDuePh: "", nextDueLabel: "",
    hospital: true, hospitalPh: "美容店/机构", hospitalLabel: "美容店/机构",
    doctor: false, doctorPh: "",
    cost: true, costPh: "费用（元）",
    weight: false,
    mood: false,
    appetite: false,
    symptom: false, symptomPh: "",
    treatment: false, treatmentPh: "",
    notePh: "服务详情：洗澡/剪毛/修甲等",
    showImages: true,
    imageLabel: "🖼️ 图片附件",
    imagePh: "粘贴图片链接，每行一个\n• 美容前照片\n• 美容后效果照",
  },

  // ─── 体重记录 ───
  weight: {
    pageTitle: "添加体重记录",
    heroDesc: "记录宠物体重变化，追踪健康趋势",
    titlePh: "体重记录",
    titleLabel: "记录标题（可选）",
    dateLabel: "称重日期",
    showNextDue: false,
    nextDuePh: "", nextDueLabel: "",
    hospital: false, hospitalPh: "", hospitalLabel: "",
    doctor: false, doctorPh: "",
    cost: false, costPh: "",
    weight: true,
    mood: false,
    appetite: false,
    symptom: false, symptomPh: "",
    treatment: false, treatmentPh: "",
    notePh: "如：空腹/饭后、称重设备等备注",
    showImages: true,
    imageLabel: "🖼️ 图片附件",
    imagePh: "粘贴图片链接，每行一个\n• 体重秤读数照片\n• 宠物体型对比照",
  },

  // ─── 饮食记录（与日常观察完全不同的字段集）──
  diet: {
    pageTitle: "添加饮食记录",
    heroDesc: "记录宠物的每日饮食情况与营养摄入",
    titlePh: "如：早餐狗粮100g + 鸡胸肉50g",
    titleLabel: "食物名称 / 内容",
    dateLabel: "喂食日期",
    showNextDue: false,
    nextDuePh: "", nextDueLabel: "",
    hospital: false, hospitalPh: "", hospitalLabel: "",
    doctor: false, doctorPh: "",
    cost: false, costPh: "",
    weight: false,
    mood: false,
    appetite: true,
    symptom: true, symptomPh: "食量(g)或份量（如：150g / 半碗 / 一包）",
    treatment: false, treatmentPh: "",
    notePh: "如：喂食时间、零食奖励、饮水情况、是否吃完等",
    showImages: true,
    imageLabel: "🖼️ 图片附件",
    imagePh: "粘贴图片链接，每行一次\n• 食物照片\n• 餐后状态",
  },

  // ─── 日常观察（对应 observation_records 表）──
  // DB: id, pet_id, observation_date(DATETIME必填),
  //     bowel_movements(ENUM正常/软便/便血/便秘), notes(TEXT)
  //     (精神状态→饮食记录、食欲→饮食记录、体重→体重记录、医院→不需要)
  observation: {
   pageTitle: "添加日常观察",
    heroDesc: "记录宠物每日排便等健康观察",
    titlePh: "",
    titleLabel: "简短摘要（可选）",
    dateLabel: "记录日期",
    showNextDue: false,
    nextDuePh: "", nextDueLabel: "",
    hospital: false, hospitalPh: "", hospitalLabel: "",   // 不需要医院
    doctor: false, doctorPh: "",
    cost: false, costPh: "",
    weight: false,
    mood: false,           // → 饮食记录已覆盖
    appetite: false,       // → 饮食记录已覆盖
    symptom: false, symptomPh: "",  // 已有专用排便字段
    treatment: false, treatmentPh: "",
    notePh: "其他备注...",
    showImages: true,
    imageLabel: "🖼️ 图片附件",
    imagePh: "粘贴图片链接，每行一个\n• 排便照片\n• 异常留证",
    // 后端专用 — 只保留排便
    bowelMovement: true,
    bowelMovementPh: "排便情况（正常/稀便/便秘/软便/便血）",
  },
};

// ═══════════════════════════════════════════
// 空表单 & 工具函数
// ═══════════════════════════════════════════

const emptyForm = {
  pet_id: "",
  record_type: "vaccine" as RecordType,
  // 通用字段
  title: "",              // 疫苗名称 / 药品名称 / 标题
  // 使用本地时区获取默认日期和时间
  ...(() => {
    const now = new Date();
    return {
      record_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      record_time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    };
  })(),
  hospital: "",           // → pet_hospital
  doctor: "",             // → doctor_advice (体检/就诊)
  symptom: "",            // → medical_result (就诊) / bowel_movements (观察)
  treatment: "",          // → treatment_plan (就诊)
  cost: "",
  weight_kg: "",
  mood: "",               // → mental_status (观察)
  appetite: "",           // → appetite_status (观察)
  note: "",               // → notes
  images_text: "",        // → photo_urls / check_up_photo_urls / medical_case_photo_urls
  // ── 后端专用字段 ──
  vaccine_name: "",       // 疫苗名称
  vaccine_batch_number: "", // 疫苗批号
  deworming_type: "",     // 驱虫类型 internal/external/broad_spectrum
  check_up_projects: "",  // 体检检查项目
  check_up_result: "",    // 体检结果
  medical_result: "",     // 就诊诊断结果
  bowel_movements: "",    // 观察排便情况
};

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
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{ id: string; file: File; preview: string }[]>([]);

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

  // 从 localStorage 读取已保存的头像（与 Pets.tsx / Reminders.tsx 保持一致）
  useEffect(() => {
    if (currentPet) {
      const saved = getLocalAvatar(currentPet.id);
      if (saved) setLocalAvatarUrl(saved);
    }
  }, [currentPet?.id, pets]);

  // 合并头像 URL（优先级：localStorage > _resolved_avatar_url > 原始数据）
  const displayPet = useMemo(() => {
    if (!currentPet) return null;
    const local = localAvatarUrl || getLocalAvatar(currentPet.id);
    if (local) return { ...currentPet, image_url: local };
    if (currentPet._resolved_avatar_url) return { ...currentPet, image_url: currentPet._resolved_avatar_url };
    return currentPet;
  }, [currentPet, localAvatarUrl, pets]);

  // URL 参数预填
  useEffect(() => {
    const updates: Partial<typeof emptyForm> = {};
    if (petIdParam && !form.pet_id) updates.pet_id = petIdParam;
    else if (pets.length > 0 && !form.pet_id) updates.pet_id = String(selectedPetId ?? pets[0].id);
    if (typeParam && recordTypes.some((t) => t.value === typeParam) && form.record_type !== typeParam) {
      updates.record_type = typeParam;
      // 切换类型时清空之前预填的标题，避免残留
      updates.title = "";
    }
    if (defaultTitle && !form.title) updates.title = defaultTitle;
    if (Object.keys(updates).length > 0) setForm((s) => ({ ...s, ...updates }));
  }, [petIdParam, typeParam, defaultTitle, pets, selectedPetId]);

  // 编辑模式回填 — 支持所有专用表（体重/饮食/美容/通用表）
  useEffect(() => {
    if (!editId) return;

    const typeFromUrl = params.get("type") as RecordType | null;
    const petId = selectedPetId ?? (pets.length > 0 ? pets[0].id : null);

    // 根据类型从对应表查询
    if ((typeFromUrl === "weight") && petId) {
      fetchWeights(petId)
        .then((res) => {
          const row = (Array.isArray(res) ? res : []).find((x: any) => x.id === editId);
          if (!row) return;
          setForm({
            ...emptyForm,
            pet_id: String(row.pet_id),
            record_type: "weight",
            title: `体重 ${row.weight_kg}kg`,
            record_date: row.record_date ? String(row.record_date).slice(0, 10) : getLocalToday(),
            weight_kg: String(row.weight_kg),
            note: row.notes || "",
          });
        })
        .catch(() => {});
    } else if ((typeFromUrl === "diet") && petId) {
      fetchFeedings(petId)
        .then((res) => {
          const row = (Array.isArray(res) ? res : []).find((x: any) => x.id === editId);
          if (!row) return;
          setForm({
            ...emptyForm,
            pet_id: String(row.pet_id),
            record_type: "diet",
            title: row.main_food_type || "",
            record_date: row.feeding_date ? String(row.feeding_date).slice(0, 10) : getLocalToday(),
            appetite: row.main_food_amount != null ? String(row.main_food_amount) : "",
            note: row.notes || "",
          });
        })
        .catch(() => {});
    } else if ((typeFromUrl === "beauty" || typeFromUrl === "grooming") && petId) {
      fetchGroomings(petId)
        .then((res) => {
          const row = (Array.isArray(res) ? res : []).find((x: any) => x.id === editId);
          if (!row) return;
          setForm({
            ...emptyForm,
            pet_id: String(row.pet_id),
            record_type: "beauty",
            title: row.services_performed?.length ? row.services_performed[0] : "美容护理",
            record_date: row.grooming_date ? String(row.grooming_date).slice(0, 10) : getLocalToday(),
            hospital: row.provider_name || "",
            cost: row.cost != null ? String(row.cost) : "",
            note: row.notes || "",
          });
        })
        .catch(() => {});
    } else if (phone) {
      // 其他类型（vaccine/deworm/checkup/visit/observation）→ 查通用表
      fetchRecords(phone)
        .then((res) => {
          const row = (res.data || []).find((x: any) => x.id === editId);
          if (!row) return;

          // 根据记录类型提取专用字段
          const rt = row.record_type || "observation";

          setForm({
            // ── 通用字段 ──
            pet_id: String(row.pet_id),
            record_type: rt,
            title: row.title || "",
            record_date: row.record_date ? String(row.record_date).slice(0, 10) : getLocalToday(),
            hospital: row.hospital || "",
            doctor: row.doctor || "",
            symptom: row.symptom || "",
            treatment: row.treatment || "",
            cost: row.cost != null ? String(row.cost) : "",
            weight_kg: row.weight_kg != null ? String(row.weight_kg) : "",
            mood: row.mood || "",
            appetite: row.appetite || "",
            note: row.note || "",
            images_text: Array.isArray(row.images) ? (row.images as string[]).join("\n") : (row.images || ""),

            // ── 疫苗专用 ──
            vaccine_name: row.title || row.vaccine_name || "",
            vaccine_batch_number: row.vaccine_batch_number || row.batch_number || "",

            // ── 驱虫专用 ──
            deworming_type: row.deworm_type || row.deworming_type || "",

            // ── 体检专用 ──
            check_up_projects: row.title || row.check_up_projects || row.checkup_projects || "",
            check_up_result: row.check_up_result || row.result || row.checkup_result || "",

            // ── 就诊专用 ──
            medical_result: row.medical_result || row.diagnosis || "",

            // ── 观察专用 ──
            bowel_movements: row.bowel_movements || row.symptom || "",
          });
        })
        .catch(() => {});
    }
  }, [editId, phone, selectedPetId, pets]);

  // 提交 — 按记录类型调用专用后端API
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pet_id) return;

    // 疫苗/驱虫/体检/就诊 需要标题或核心字段；体重只需weight_kg；饮食需要食物名/食量；观察至少填一个字段
    if (!["observation", "weight", "diet"].includes(form.record_type) && !form.title.trim()) return;
    // 体重记录必须填写体重数值
    if (form.record_type === "weight" && !form.weight_kg?.trim()) return;
    // 饮食记录需要填写食物名称或食量
    if (form.record_type === "diet" && !form.title?.trim() && !form.appetite?.trim() && !form.symptom?.trim()) return;
    // 观察至少填排便或备注
    if (form.record_type === "observation" &&
        !form.bowel_movements?.trim() && !form.note?.trim()) return;

    setSaving(true);
    setMessage("");

    const pid = Number(form.pet_id);
    const parseImages = () =>
      uploadedImages.length > 0
        ? uploadedImages.map((img) => img.preview)
        : form.images_text.split("\n").map((x) => x.trim()).filter(Boolean);

    try {
      // 纯日期（所有后端字段都是 date 类型，不接受时间部分）
      const recordDate = form.record_date || getLocalToday();

      switch (form.record_type) {
        case "vaccine": {
          await createVaccine({
            pet_id: pid,
            vaccine_name: form.title.trim() || form.vaccine_name.trim(),
            vaccine_date: recordDate,
            pet_hospital: form.hospital.trim() || undefined,
            vaccine_batch_number: form.vaccine_batch_number.trim() || undefined,
            photo_urls: parseImages(),
            notes: form.note.trim() || undefined,
          });
          break;
        }
        case "deworm": {
          await createDeworming({
            pet_id: pid,
            medication_name: form.title.trim(),  // 与后端Schema对齐
            deworming_date: recordDate,
            deworming_type: (form.deworming_type as any) || undefined,
            pet_hospital: form.hospital.trim() || undefined,
            cost: form.cost ? Number(form.cost) : undefined,
            photo_urls: parseImages(),
            notes: form.note.trim() || undefined,
          });
          break;
        }
        case "checkup": {
          await createCheckup({
            pet_id: pid,
            check_up_date: recordDate,
            pet_hospital: form.hospital.trim() || undefined,
            doctor_advice: form.doctor.trim() || undefined,
            check_up_projects: form.check_up_projects.trim() || undefined,
            check_up_result: form.check_up_result.trim() || undefined,
            check_up_photo_urls: parseImages(),
            notes: form.note.trim() || undefined,
          });
          break;
        }
        case "visit": {
          await createMedical({
            pet_id: pid,
            medical_date: recordDate,
            pet_hospital: form.hospital.trim() || undefined,
            medical_amount: form.cost ? Number(form.cost) : undefined,
            medical_result: form.medical_result.trim() || form.symptom.trim() || undefined,
            treatment_plan: form.treatment.trim() || undefined,
            medical_case_photo_urls: parseImages(),
            notes: form.note.trim() || undefined,
          });
          break;
        }
        case "beauty": {
          await createGrooming({
            pet_id: pid,
            grooming_date: recordDate,
            grooming_type: "bath",
            provider_name: form.hospital.trim() || undefined,
            cost: form.cost ? Number(form.cost) : undefined,
            services_performed: form.title.trim() ? [form.title.trim()] : ["洗澡"],
            before_photos: parseImages(),
            notes: form.note.trim() || `${form.title.trim() || "美容护理"} | 费用:${form.cost || "0"}元`,
          });
          break;
        }
        case "weight": {
          // 体重记录 → 使用专用 weight API 存入 pet_weight_records 表（不再混入 observation）
          if (!form.weight_kg) {
            throw new Error("请输入体重数值");
          }
          const wPayload = {
            pet_id: pid,
            record_date: form.record_date || getLocalToday(),  // 体重记录只需纯日期
            weight_kg: Number(form.weight_kg),
            body_condition_score: undefined,
            notes: form.note.trim() || `体重记录 ${form.weight_kg}kg`,
            photo_urls: parseImages(),
          };
          // 提交体重记录
          const wResult = await createWeight(wPayload);
          break;
        }
        case "diet": {
          // 饮食记录 → 存入 pet_feeding_records 表（独立表，不再混入 observation）
          if (!form.title.trim() && !form.appetite?.trim()) {
            throw new Error("请填写食物名称或食量");
          }
          await createDiet({
            pet_id: pid,
            feeding_date: form.record_date || getLocalToday(),
            feeding_time: form.record_time || undefined,
            meal_type: 'snack',  // 默认为零食/加餐
            main_food_type: form.title.trim() || undefined,
            main_food_amount: form.appetite ? parseFloat(form.appetite) : undefined,
            notes: form.note.trim() || `饮食记录：${form.title.trim() || ""}${form.appetite ? ` ${form.appetite}` : ""}`,
            photo_urls: parseImages(),
          } as any);
          break;
        }
        case "observation": {
          // 日常观察 → 后端 observation schema 字段：
          //   bowel_movements(排便) / notes(简短摘要+备注)
          // 注意：后端没有独立 title 字段，摘要存入 notes
          if (!form.title.trim()) {
            throw new Error("请填写简短摘要");
          }
          if (!form.bowel_movements.trim()) {
            throw new Error("请填写排便情况");
          }
          if (!VALID_STOOL_VALUES.includes(form.bowel_movements.trim())) {
            throw new Error("排便情况请选择标准值：正常 / 稀便 / 便秘 / 软便 / 便血 等");
          }

          // 排便情况：中文描述 → 后端枚举值
          const stoolMap: Record<string, string> = {
            "正常": "normal", "偏软": "soft", "软便": "soft",
            "稀": "loose", "稀便": "loose", "水样": "watery",
            "便秘": "constipated", "带血": "blood_present", "便血": "blood_present",
          };
          const rawStool = form.bowel_movements.trim();
          const stoolValue = stoolMap[rawStool] || rawStool;

          // 组合摘要：用户填的简短摘要 + 备注拼接为 notes
          let summaryNotes = "";
          if (form.title.trim()) summaryNotes += form.title.trim();
          if (form.note.trim()) {
            summaryNotes += (summaryNotes ? " | " : "") + form.note.trim();
          }

          await createObservation({
            pet_id: pid,
            observation_date: recordDate,
            bowel_movements: stoolValue,
            notes: summaryNotes || undefined,
          } as any);
          break;
        }
      }

      setMessage("记录添加成功 🎉");
      setForm(s => ({ ...emptyForm, pet_id: s.pet_id }));
      setTimeout(() => navigate("/app/records"), 800);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("[AddRecord] 提交失败:", err);
      setMessage(errMsg);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setForm((s) => {
      const next = { ...s, [field]: value };
      // 切换记录类型时，清空之前 URL 预填的标题，避免残留
      if (field === "record_type" && value !== s.record_type) {
        next.title = "";
      }
      return next;
    });
  };

  // ── 图片上传处理 ──
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImages((prev) => [...prev, { id, file, preview: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // ── 真正的摄像头拍摄（getUserMedia + Canvas 截帧）──
  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.playsInline = true;
      await video.play();
      // 延时让自动对焦完成
      await new Promise((r) => setTimeout(r, 500));
      // 截取当前帧到 canvas
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      // 立即关闭摄像头释放资源
      stream.getTracks().forEach((t) => t.stop());
      // 转 Blob → File → 加入预览列表
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const id = `cam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const file = new File([blob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
          const url = URL.createObjectURL(blob);
          setUploadedImages((prev) => [...prev, { id, file, preview: url }]);
        },
        "image/jpeg",
        0.92,
      );
    } catch {
      // 权限被拒绝或设备不支持摄像头 → 降级为系统文件选择器（带 capture）
      cameraInputRef.current?.click();
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
              {displayPet?.image_url ? (
                isNameCircleMarker(displayPet.image_url) ? (
                  <PetNameCircle name={displayPet.name} size={28} />
                ) : (
                  <img src={displayPet.image_url} alt={displayPet.name}
                    style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                )
              ) : (
                <PetNameCircle name={displayPet?.name || '宠物'} size={28} />
              )}
              <span>{displayPet?.name ?? "未选择"}</span>
              <PawPrint size={12} />
            </div>
          </div>
          <div className="ar-hero-pet-3d">
            <PetPhotoAvatar pet={displayPet} size="large" />
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

            {/* 标题/名称 — 根据类型显示不同标签 */}
            {form.record_type === "vaccine" ? (
              <div className="ar-field-group">
                <label className="ar-label"><Syringe size={13} /> 疫苗名称 <span className="ar-required">*</span></label>
                <input className="ar-input" placeholder={c.vaccineNamePh || "如：狂犬疫苗、猫三联"} value={form.title}
                  onChange={(e) => updateField("title", e.target.value)} required />
              </div>
            ) : form.record_type === "deworm" ? (
              <div className="ar-field-group">
                <label className="ar-label"><Sparkles size={13} /> 药品名称 <span className="ar-required">*</span></label>
                <input className="ar-input" placeholder="如：大宠爱、海乐妙、福来恩" value={form.title}
                  onChange={(e) => updateField("title", e.target.value)} required />
              </div>
            ) : form.record_type === "observation" ? (
              <div className="ar-field-group">
                <label className="ar-label"><Heart size={13} /> 简短摘要 <span className="ar-required">*</span></label>
                <input className="ar-input" placeholder="如：今天状态不错，一切正常" value={form.title}
                  onChange={(e) => updateField("title", e.target.value)} required />
              </div>
            ) : (
              <div className="ar-field-group">
                <label className="ar-label"><ClipboardList size={13} /> {c.titleLabel || "标题"} {!["beauty","weight","diet"].includes(form.record_type) && <span className="ar-required">*</span>}</label>
                <input className="ar-input" placeholder={c.titlePh || "填写记录标题"} value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  required={!["beauty","weight","diet"].includes(form.record_type)} />
              </div>
            )}

            {/* ── 疫苗专用字段 ── */}
            {form.record_type === "vaccine" && c.batchNumber && (
              <div className="ar-field-group">
                <label className="ar-label">📋 疫苗批号</label>
                <input className="ar-input" placeholder={c.batchNumberPh}
                  value={form.vaccine_batch_number} onChange={(e) => updateField("vaccine_batch_number", e.target.value)} />
              </div>
            )}

            {/* ── 驱虫类型下拉 ── */}
            {form.record_type === "deworm" && c.dewormType && (
              <div className="ar-field-group">
                <label className="ar-label">{c.dewormTypeLabel}</label>
                <div className="ar-select-wrap">
                  <select className="ar-select" value={form.deworming_type}
                    onChange={(e) => updateField("deworming_type", e.target.value)}>
                    <option value="">请选择驱虫类型</option>
                    {(c.dewormTypeOptions || []).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── 记录时间（所有类型通用）── */}
          <div className="ar-card">
            <div className="ar-card-header">
              <div className="ar-card-tag ar-tag-medical"><CalendarDays size={12} />{form.record_type === "deworm" ? "驱虫信息" : "记录时间"}</div>
            </div>

            {/* 日期 + 时间（并排） */}
            <div className="ar-grid-row">
              <div className="ar-field-group flex-1">
                <label className="ar-label"><CalendarDays size={13} /> {c.dateLabel} <span className="ar-required">*</span></label>
                <input className="ar-input" type="date" value={form.record_date}
                  onChange={(e) => updateField("record_date", e.target.value)} required />
              </div>
              <div className="ar-field-group flex-1">
                <label className="ar-label">🕐 时间</label>
                <input className="ar-input" type="time" value={form.record_time}
                  onChange={(e) => updateField("record_time", e.target.value)}
                  placeholder="如 14:30" />
              </div>
            </div>

            {/* 驱虫：机构/地点合并到此卡片 */}
            {form.record_type === "deworm" && c.hospital && (
              <div className="ar-field-group" style={{ marginTop: 12 }}>
                <label className="ar-label"><Hospital size={13} /> {c.hospitalLabel || "机构/地点"}</label>
                <input className="ar-input" placeholder={c.hospitalPh} value={form.hospital}
                  onChange={(e) => updateField("hospital", e.target.value)} />
              </div>
            )}
          </div>

          {/* ── 费用与机构（仅医疗/美容类记录需要，排除驱虫等只有一个字段的类型）── */}
          {(c.showNextDue || c.cost || c.doctor || (c.hospital && ["checkup", "visit", "beauty", "vaccine"].includes(form.record_type))) && (
            <div className="ar-card">
              <div className="ar-card-header">
                <div className="ar-card-tag ar-tag-detail"><FileText size={12} />费用与机构</div>
              </div>

              {/* 花费 + 医院（并排） */}
              <div className="ar-grid-row">
                {c.cost && (
                  <div className="ar-field-group flex-1">
                    <label className="ar-label">💰 花费（元）</label>
                    <input className="ar-input" type="number" step="0.01" placeholder={c.costPh}
                      value={form.cost} onChange={(e) => updateField("cost", e.target.value)} />
                  </div>
                )}
              </div>

              {/* 医院/机构（排除驱虫，驱虫已在"驱虫信息"卡片单独展示） */}
              {c.hospital && ["checkup", "visit", "beauty", "vaccine"].includes(form.record_type) && (
                <div className="ar-field-group">
                  <label className="ar-label"><Hospital size={13} /> {c.hospitalLabel || "机构"}</label>
                  <input className="ar-input" placeholder={c.hospitalPh} value={form.hospital}
                    onChange={(e) => updateField("hospital", e.target.value)} />
                </div>
              )}

              {/* 医生 — 体检/就诊需要 */}
              {c.doctor && (
                <div className="ar-field-group">
                  <label className="ar-label"><UserCheck size={13} /> 医{form.record_type === "checkup" ? "生建议" : "生"}</label>
                  <input className="ar-input"
                    placeholder={form.record_type === "checkup" ? "医生的建议与意见" : c.doctorPh}
                    value={form.doctor}
                    onChange={(e) => updateField("doctor", e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* ── 体检专用：检查项目 & 结果 ── */}
          {form.record_type === "checkup" && (c.checkupProjects || c.checkupResult) && (
            <div className="ar-card">
              <div className="ar-card-header">
                <div className="ar-card-tag ar-tag-medical"><Stethoscope size={12} />检查详情</div>
              </div>
              {c.checkupProjects && (
                <div className="ar-field-group">
                  <label className="ar-label"><ClipboardList size={13} /> {c.checkupProjectsLabel}</label>
                  <input className="ar-input" placeholder={c.checkupProjectsPh}
                    value={form.check_up_projects} onChange={(e) => updateField("check_up_projects", e.target.value)} />
                </div>
              )}
              {c.checkupResult && (
                <div className="ar-field-group">
                  <label className="ar-label"><FileText size={13} /> {c.checkupResultLabel}</label>
                  <textarea className="ar-textarea" rows={2} placeholder={c.checkupResultPh}
                    value={form.check_up_result} onChange={(e) => updateField("check_up_result", e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* ── 健康指标 — 体重/体检专用（observation 不走这里）── */}
          {(c.weight || c.mood || c.appetite) && (
            <div className="ar-card">
              <div className="ar-card-header">
                <div className="ar-card-tag ar-tag-status"><Scale size={12} />健康指标</div>
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
                    <label className="ar-label">❤️ 精神状态</label>
                    <input className="ar-input" placeholder="开心 / 一般 / 低落 / 兴奋"
                      value={form.mood} onChange={(e) => updateField("mood", e.target.value)} />
                  </div>
                )}
              </div>
              {c.appetite && (
                <div className="ar-field-group">
                  <label className="ar-label">🍽️ 食欲</label>
                  <input className="ar-input" placeholder="正常 / 较差 / 很好 / 不吃"
                    value={form.appetite} onChange={(e) => updateField("appetite", e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* ── 日常观察专用字段（独立卡片，不受 weight/mood/appetite 限制）── */}
          {form.record_type === "observation" && c.bowelMovement && (
            <div className="ar-card">
              <div className="ar-card-header">
                <div className="ar-card-tag ar-tag-status"><Heart size={12} />健康观察</div>
              </div>

              {/* 排便情况 */}
              <div className="ar-field-group">
                <label className="ar-label">💩 排便情况 <span className="ar-required">*</span></label>
                <input className={`ar-input ${form.bowel_movements.trim() && !VALID_STOOL_VALUES.includes(form.bowel_movements.trim()) ? 'ar-input-error' : ''}`}
                  placeholder={c.bowelMovementPh}
                  value={form.bowel_movements} onChange={(e) => updateField("bowel_movements", e.target.value)} />
                {form.bowel_movements.trim() && !VALID_STOOL_VALUES.includes(form.bowel_movements.trim()) && (
                  <p style={{ fontSize: 11, color: '#e74c3c', marginTop: 4 }}>⚠️ 请选择标准选项：正常 / 稀便 / 便秘 / 软便 / 便血</p>
                )}
                {!form.bowel_movements.trim() || VALID_STOOL_VALUES.includes(form.bowel_movements.trim()) ? (
                  <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>提示：正常 / 稀便 / 便秘 / 软便 / 便血</p>
                ) : null}
              </div>
            </div>
          )}

          {/* ── 就诊诊断 — 就诊/观察类型 ── */}
          {((c.symptom || c.treatment) && form.record_type !== "observation") && (
            <div className="ar-card">
              <div className="ar-card-header">
                <div className="ar-card-tag ar-tag-detail">
                  <Stethoscope size={12} />{c.treatment ? "诊断详情" : "症状描述"}
                </div>
              </div>

              {/* 就诊：诊断结果 */}
              {form.record_type === "visit" && c.medicalResult && (
                <div className="ar-field-group">
                  <label className="ar-label"><FileText size={13} /> {c.medicalResultLabel}</label>
                  <textarea className="ar-textarea" rows={2} placeholder={c.medicalResultPh}
                    value={form.medical_result} onChange={(e) => updateField("medical_result", e.target.value)} />
                </div>
              )}

              {c.symptom && form.record_type !== "observation" && (
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
            </div>
            <div className="ar-field-group">
              <label className="ar-label">📝 备注</label>
              <textarea className="ar-textarea ar-textarea-lg" rows={3} placeholder={c.notePh}
                value={form.note} onChange={(e) => updateField("note", e.target.value)} />
            </div>
            {c.showImages && (
              <div className="ar-field-group">
                <label className="ar-label">{c.imageLabel}（可选）</label>

                {/* 上传按钮区 */}
                <div className="ar-upload-actions">
                  <button type="button" className="ar-upload-btn" onClick={() => imageInputRef.current?.click()}>
                    <ImagePlus size={18} />
                    <span>上传图片</span>
                  </button>
                  <button type="button" className="ar-upload-btn ar-upload-camera" onClick={handleCameraCapture}>
                    <Camera size={18} />
                    <span>拍照</span>
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="sr-only"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="sr-only"
                  />
                </div>

                {/* 图片预览网格 */}
                {uploadedImages.length > 0 && (
                  <div className="ar-image-grid">
                    {uploadedImages.map((img) => (
                      <div key={img.id} className="ar-image-preview">
                        <img src={img.preview} alt="附件预览" />
                        <button type="button" className="ar-image-remove" onClick={() => removeImage(img.id)}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 提示文字 */}
                {uploadedImages.length === 0 && (
                  <p className="ar-upload-hint">支持 JPG、PNG、HEIC 格式</p>
                )}
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
