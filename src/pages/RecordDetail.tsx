import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Camera,
  ChevronRight,
  Clock,
  Droplet,
  Edit3,
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
import { fetchRecords } from "../lib/api";
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

  // 加载记录详情
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchRecords(phone)
      .then((res) => {
        const found = (res.data || []).find((r: HealthRecord) => r.id === Number(id));
        setRecord(found || null);
      })
      .finally(() => setLoading(false));
  }, [id, phone]);

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
                onClick={() => navigate(`/app/add-record?edit=${record.id}`)}
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
            {record.title || getRecordTitle(record)}
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

            {/* ══ 观察记录专用字段 ══ */}
            {record.record_type === "observation" && (
              <>
                {/* 观察摘要 (title) */}
                {record.title?.trim() && (
                  <DetailField
                    icon={<FileText size={16} />}
                    label="观察摘要"
                    value={record.title}
                    color="#00b894"
                    fullWidth
                  />
                )}
                {/* 排便情况 (symptom 映射) */}
                {record.symptom?.trim() && (
                  <DetailField
                    icon={<Activity size={16} />}
                    label="排便情况"
                    value={record.symptom}
                    color="#55efc4"
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

            {/* 体重 */}
            {record.weight_kg != null && !Number.isNaN(Number(record.weight_kg)) && (
              <DetailField
                icon={<Scale size={16} />}
                label="体重"
                value={`${Number(record.weight_kg).toFixed(1)} kg`}
                color="#f0932b"
              />
            )}

            {/* 心情状态 - 仅观察记录显示 */}
            {record.mood?.trim() && record.record_type === "observation" && (
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

            {/* 食欲状况 - 仅观察记录显示 */}
            {record.appetite?.trim() && record.record_type === "observation" && (
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
            {record.images && record.images.length > 0 && (
              <div className="rd-images-section">
                <div className="rd-images-header">
                  <Camera size={14} />
                  <span>图片附件 ({record.images.length})</span>
                </div>
                <div className="rd-images-grid">
                  {record.images.map((imgUrl: string, idx: number) => (
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

          {/* 备注 - 始终显示在最底部 */}
          {(record.note?.trim()) && (
            <div className="rd-note-section">
              <div className="rd-note-header">
                <FileText size={14} />
                <span>备注信息</span>
              </div>
              <div className="rd-note-content">
                {parseBeautyNote(record.note)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 底部操作栏 */}
      <section className="rd-bottom-actions">
        <button
          type="button"
          className="rd-primary-btn"
          onClick={() => navigate(`/app/add-record?edit=${record!.id}`)}
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
  };
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
