import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Bell,
  CalendarDays,
  Droplet,
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
import { fetchRecords } from "../lib/api";
import { useShell } from "../hooks/useShell";
import type { HealthRecord, RecordType } from "../types";
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

type HealthFilter = "all" | "weight" | "vaccine" | "deworm" | "diet" | "checkup" | "beauty";

const filterItems: { key: HealthFilter; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { key: "all", label: "全部", icon: <Sparkles size={14} />, color: "#667eea", bg: "rgba(102,126,234,0.12)" },
  { key: "weight", label: "体重", icon: <Scale size={14} />, color: "#f0932b", bg: "rgba(240,147,43,0.12)" },
  { key: "vaccine", label: "疫苗", icon: <Syringe size={14} />, color: "#6c5ce7", bg: "rgba(108,92,231,0.12)" },
  { key: "deworm", label: "驱虫", icon: <Bell size={14} />, color: "#f5576c", bg: "rgba(245,87,108,0.12)" },
  { key: "diet", label: "饮食", icon: <Heart size={14} />, color: "#00b894", bg: "rgba(0,184,148,0.12)" },
  { key: "checkup", label: "体检", icon: <Stethoscope size={14} />, color: "#74b9ff", bg: "rgba(116,185,255,0.12)" },
  { key: "beauty", label: "美容", icon: <Droplet size={14} />, color: "#fd79a8", bg: "rgba(253,121,168,0.12)" },
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
  if (record.title?.trim()) return record.title;
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

function getRecordSub(record: HealthRecord) {
  if (record.note?.trim()) return record.note.split("\n")[0];
  if (record.hospital?.trim()) return record.hospital;
  if (record.weight_kg !== null && record.weight_kg !== undefined)
    return `${record.weight_kg} kg`;
  return "";
}

type IconInfo = { icon: React.ReactNode; bg: string; color: string; gradient: string };

function getIconInfo(record: HealthRecord): IconInfo {
  // 按优先级匹配类型图标
  if (record.record_type === "vaccine")
    return { icon: <Syringe size={20} />, bg: "#f0edfc", color: "#6c5ce7", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" };
  if (record.record_type === "deworm")
    return { icon: <Bell size={20} />, bg: "#fff0f3", color: "#f5576c", gradient: "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)" };
  if (record.record_type === "checkup")
    return { icon: <Stethoscope size={20} />, bg: "#eaf4ff", color: "#74b9ff", gradient: "linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)" };
  if (record.record_type === "beauty" || isBeautyRecord(record))
    return { icon: <Droplet size={20} />, bg: "#fff0f5", color: "#fd79a8", gradient: "linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)" };
  if (record.record_type === "visit")
    return { icon: <Activity size={20} />, bg: "#fef0e8", color: "#e17055", gradient: "linear-gradient(135deg, #e17055 0%, #f6b93b 100%)" };
  if (record.weight_kg !== null && !Number.isNaN(Number(record.weight_kg)))
    return { icon: <Scale size={20} />, bg: "#fef9e7", color: "#f0932b", gradient: "linear-gradient(135deg, #f9ca24 0%, #f0932b 100%)" };
  if (isDietRecord(record))
    return { icon: <Heart size={20} />, bg: "#e8f8f0", color: "#00b894", gradient: "linear-gradient(135deg, #00b894 0%, #55efc4 100%)" };
  if (record.record_type === "observation")
    return { icon: <Heart size={20} />, bg: "#e8f8f0", color: "#00b894", gradient: "linear-gradient(135deg, #00cec9 0%, #81ecec 100%)" };
  return { icon: <FileText size={20} />, bg: "#f5f0eb", color: "#8b7355", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" };
}

function petEmoji(species?: string) {
  if (species === "cat") return "🐱";
  if (species === "other") return "🐰";
  return "🐕";
}

export default function Records() {
  const navigate = useNavigate();
  const { phone, selectedPetId, selectedPet, pets } = useShell();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<HealthFilter>("all");

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
    fetchRecords(phone, selectedPetId ?? undefined, "all")
      .then((res) => setRecords(res.data || []))
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
      return true;
    });
    return [...filtered].sort((a, b) => b.record_date.localeCompare(a.record_date));
  }, [records, activeFilter]);

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
            <div className="h3d-weight-icon">
              <Scale size={20} />
            </div>
            <span className="h3d-weight-label">体重追踪</span>
          </div>

          <div className="h3d-weight-body">
            <div className="h3d-weight-main">
              <span className="h3d-weight-value">
                {latestWeight !== null ? Number(latestWeight).toFixed(1) : "--"}
              </span>
              <span className="h3d-weight-unit">kg</span>
            </div>

            {weightDiff !== null && (
              <div className={`h3d-weight-trend h3d-trend-${weightTrend}`}>
                {weightTrend === "up" && <TrendingUp size={14} />}
                {weightTrend === "down" && <TrendingDown size={14} />}
                {weightTrend === "flat" && <Minus size={14} />}
                <span>{Number(weightDiff) > 0 ? `+${weightDiff}` : weightDiff} kg</span>
              </div>
            )}
          </div>

          <div className="h3d-weight-stats">
            <div className="h3d-ws-item">
              <Syringe size={14} className="h3d-ws-icon h3d-ws-vaccine" />
              <span className="h3d-ws-num">{stats.vaccine}</span>
              <span className="h3d-ws-label">疫苗</span>
            </div>
            <div className="h3d-ws-divider" />
            <div className="h3d-ws-item">
              <Bell size={14} className="h3d-ws-icon h3d-ws-deworm" />
              <span className="h3d-ws-num">{stats.deworm}</span>
              <span className="h3d-ws-label">驱虫</span>
            </div>
            <div className="h3d-ws-divider" />
            <div className="h3d-ws-item">
              <Stethoscope size={14} className="h3d-ws-icon h3d-ws-checkup" />
              <span className="h3d-ws-num">{stats.checkup}</span>
              <span className="h3d-ws-label">体检</span>
            </div>
            <div className="h3d-ws-divider" />
            <div className="h3d-ws-item">
              <Droplet size={14} className="h3d-ws-icon h3d-ws-beauty" />
              <span className="h3d-ws-num">{stats.beauty}</span>
              <span className="h3d-ws-label">美容</span>
            </div>
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
            {filteredRecords.map((record) => {
              const { icon, bg, color, gradient } = getIconInfo(record);
              const sub = getRecordSub(record);
              return (
                <button
                  key={record.id}
                  className="h3d-record-item"
                  onClick={() => navigate(`/app/add-record?edit=${record.id}`)}
                >
                  <div className="h3d-record-icon" style={{ background: bg }}>
                    <div className="h3d-record-icon-inner" style={{ background: gradient }}>
                      {icon}
                    </div>
                  </div>

                  <div className="h3d-record-content">
                    <strong className="h3d-record-title">{getRecordTitle(record)}</strong>
                    {sub && <span className="h3d-record-sub">{sub}</span>}
                    <div className="h3d-record-date">
                      <CalendarDays size={12} className="h3d-record-date-icon" />
                      {record.record_date}
                    </div>
                  </div>

                  <div className="h3d-record-arrow">
                    <PawPrint size={16} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
