import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  createReminder,
  fetchReminders,
  updateReminder,
} from "../lib/api";
import { useShell } from "../hooks/useShell";
import type { Reminder, ReminderRepeat } from "../types";
import {
  Bell, Plus, ChevronRight, CalendarDays,
  ChevronLeft, Clock, RefreshCw, AlignLeft, MapPin, FileText, Check, X,
  Sparkles, AlertCircle, CheckCircle2, Repeat, CalendarRange, PawPrint,
  Syringe, Stethoscope, Scale, UtensilsCrossed, Pin, Heart, Star, Pill,
} from "lucide-react";
import PetPhotoAvatar from "../components/PetPhotoAvatar";

type TabKey = "urgent" | "pending" | "weekly" | "done";

const TAB_LIST: { key: TabKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "urgent", label: "紧急", icon: <AlertCircle size={14} />, color: "#f5576c" },
  { key: "pending", label: "待办", icon: <Clock size={14} />, color: "#667eea" },
  { key: "weekly", label: "周期", icon: <Repeat size={14} />, color: "#00b894" },
  { key: "done", label: "已完成", icon: <CheckCircle2 size={14} />, color: "#a29bfe" },
];

const repeatOptions: { value: ReminderRepeat; label: string; icon: React.ReactNode }[] = [
  { value: "once", label: "不重复", icon: <FileText size={14} /> },
  { value: "daily", label: "每天", icon: <Repeat size={14} /> },
  { value: "weekly", label: "每周", icon: <CalendarRange size={14} /> },
  { value: "monthly", label: "每月", icon: <CalendarDays size={14} /> },
];

const weekdayOptions: { value: number; label: string }[] = [
  { value: 1, label: "一" },
  { value: 2, label: "二" },
  { value: 3, label: "三" },
  { value: 4, label: "四" },
  { value: 5, label: "五" },
  { value: 6, label: "六" },
  { value: 0, label: "日" },
];

const monthlyDayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

const categoryList = [
  { name: "疫苗", icon: <Syringe size={16} />, color: "#6c5ce7", bg: "rgba(108,92,231,0.12)" },
  { name: "驱虫", icon: <Bell size={16} />, color: "#f5576c", bg: "rgba(245,87,108,0.12)" },
  { name: "体检", icon: <Stethoscope size={16} />, color: "#74b9ff", bg: "rgba(116,185,255,0.12)" },
  { name: "体重", icon: <Scale size={16} />, color: "#f0932b", bg: "rgba(240,147,43,0.12)" },
  { name: "饮食", icon: <UtensilsCrossed size={16} />, color: "#00b894", bg: "rgba(0,184,148,0.12)" },
  { name: "美容护理", icon: <Sparkles size={16} />, color: "#fd79a8", bg: "rgba(253,121,168,0.12)" },
  { name: "其他", icon: <Pin size={16} />, color: "#8b7355", bg: "rgba(139,115,85,0.12)" },
];

function getCategoryInfo(title: string) {
  for (const cat of categoryList) {
    if (title.includes(cat.name)) return cat;
  }
  return categoryList[categoryList.length - 1];
}

/* ──────────────────── AddReminderPage ──────────────────── */
interface AddPageProps {
  pets: { id: number; name: string }[];
  phone: string;
  selectedPetId: number | null;
  onClose: () => void;
  onDone: () => void;
}

function AddReminderPage({ pets, phone, selectedPetId, onClose, onDone }: AddPageProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [repeat, setRepeat] = useState<ReminderRepeat>("once");
  const [weeklyDay, setWeeklyDay] = useState(1);
  const [monthlyDay, setMonthlyDay] = useState(1);
  const [desc, setDesc] = useState("");
  const [petId, setPetId] = useState(selectedPetId ? String(selectedPetId) : "");

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const formatTime = (date: Date) => {
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const parseTime = (time: string) => {
    const [h = "09", m = "00"] = time.split(":");
    return { hour: Number(h) || 9, minute: Number(m) || 0 };
  };

  const createDateWithTime = (base: Date, time: string) => {
    const { hour, minute } = parseTime(time);
    const next = new Date(base);
    next.setHours(hour, minute, 0, 0);
    return next;
  };

  const calcNextTrigger = () => {
    const now = new Date();
    const selectedTime = dueTime || "09:00";

    if (repeat === "daily") {
      const candidate = createDateWithTime(now, selectedTime);
      if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
      return candidate;
    }

    if (repeat === "weekly") {
      const diff = (weeklyDay - now.getDay() + 7) % 7;
      const candidate = new Date(now);
      candidate.setDate(candidate.getDate() + diff);
      const withTime = createDateWithTime(candidate, selectedTime);
      if (withTime <= now) withTime.setDate(withTime.getDate() + 7);
      return withTime;
    }

    if (repeat === "monthly") {
      const makeMonthlyDate = (year: number, month: number) => {
        const maxDay = new Date(year, month + 1, 0).getDate();
        const day = Math.min(monthlyDay, maxDay);
        return createDateWithTime(new Date(year, month, day), selectedTime);
      };

      let candidate = makeMonthlyDate(now.getFullYear(), now.getMonth());
      if (candidate <= now) {
        const nextMonthBase = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        candidate = makeMonthlyDate(nextMonthBase.getFullYear(), nextMonthBase.getMonth());
      }
      return candidate;
    }

    const today = formatDate(now);
    const [y, m, d] = (dueDate || today).split("-").map((x) => Number(x));
    const base = new Date(y, (m || 1) - 1, d || 1);
    let candidate = createDateWithTime(base, selectedTime);
    if (candidate <= now) {
      candidate = createDateWithTime(now, selectedTime);
      if (candidate <= now) candidate.setDate(candidate.getDate() + 1);
    }
    return candidate;
  };

  const handleSubmit = async () => {
    const finalTitle = category ? `${category}${title ? `：${title}` : ""}` : title.trim();
    if (!finalTitle || !petId) return;

    const trigger = calcNextTrigger();
    await createReminder({
      pet_id: Number(petId),
      title: finalTitle,
      due_date: formatDate(trigger),
      due_time: formatTime(trigger),
      repeat,
      content: desc.trim() || undefined,
    });
    onDone();
  };

  const selectedCat = categoryList.find(c => c.name === category);

  return (
    <div className="rm3d-add-page">
      {/* 顶部导航 */}
      <div className="rm3d-nav">
        <button className="rm3d-back-btn" onClick={onClose}>
          <ChevronLeft size={20} />
        </button>
        <h3 className="rm3d-nav-title">添加提醒</h3>
        <div style={{ width: 36 }} />
      </div>

      {/* Hero */}
      <div className="rm3d-add-hero">
        <div className="rm3d-add-hero-icon" style={{ background: selectedCat ? selectedCat.bg : 'rgba(102,126,234,0.12)', color: selectedCat?.color || '#667eea' }}>
          <Bell size={24} />
        </div>
        <div className="rm3d-add-hero-text">
          <h4>创建健康提醒</h4>
          <p>不会遗漏重要事项</p>
        </div>
      </div>

      {/* 表单 */}
      <div className="rm3d-form">
        {/* 提醒类型 */}
        <div className="rm3d-form-card">
          <div className="rm3d-form-label">
            <Sparkles size={14} />
            <span>提醒类型</span>
          </div>
          <div className="rm3d-cat-grid">
            {categoryList.map((cat) => (
              <button
                key={cat.name}
                type="button"
                className={`rm3d-cat-btn ${category === cat.name ? "active" : ""}`}
                style={category === cat.name ? { background: cat.bg, borderColor: cat.color, color: cat.color } : {}}
                onClick={() => setCategory(category === cat.name ? "" : cat.name)}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 提醒标题 */}
        <div className="rm3d-form-card">
          <div className="rm3d-form-label">
            <AlignLeft size={14} />
            <span>提醒标题</span>
          </div>
          <input
            className="rm3d-input"
            placeholder="请输入提醒标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* 重复设置 */}
        <div className="rm3d-form-card">
          <div className="rm3d-form-label">
            <Repeat size={14} />
            <span>重复设置</span>
          </div>
          <div className="rm3d-repeat-grid">
            {repeatOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`rm3d-repeat-btn ${repeat === opt.value ? "active" : ""}`}
                onClick={() => setRepeat(opt.value)}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 时间设置 */}
        <div className="rm3d-form-card">
          <div className="rm3d-form-label">
            <Clock size={14} />
            <span>提醒时间</span>
          </div>

          {repeat === "once" && (
            <>
              <div className="rm3d-input-wrap">
                <CalendarDays size={16} className="rm3d-input-icon" />
                <input
                  className="rm3d-input rm3d-input-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </>
          )}

          {repeat === "weekly" && (
            <div className="rm3d-weekday-grid">
              {weekdayOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`rm3d-weekday-btn ${weeklyDay === item.value ? "active" : ""}`}
                  onClick={() => setWeeklyDay(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {repeat === "monthly" && (
            <div className="rm3d-monthday-scroll">
              {monthlyDayOptions.map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`rm3d-monthday-btn ${monthlyDay === day ? "active" : ""}`}
                  onClick={() => setMonthlyDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>
          )}

          <div className="rm3d-input-wrap" style={{ marginTop: 12 }}>
            <Clock size={16} className="rm3d-input-icon" />
            <input
              className="rm3d-input rm3d-input-time"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
            />
          </div>
        </div>

        {/* 详细描述 */}
        <div className="rm3d-form-card">
          <div className="rm3d-form-label">
            <AlignLeft size={14} />
            <span>详细描述</span>
          </div>
          <textarea
            className="rm3d-textarea"
            placeholder="请输入详细描述（选填）"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
          />
        </div>

        {/* 宠物选择 */}
        {pets.length > 1 && (
          <div className="rm3d-form-card">
            <div className="rm3d-form-label">
              <PawPrint size={14} />
              <span>选择宠物</span>
            </div>
            <select
              className="rm3d-select"
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
            >
              <option value="">请选择宠物</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="rm3d-footer">
        <button className="rm3d-cancel-btn" onClick={onClose}>
          <X size={16} />
          <span>取消</span>
        </button>
        <button
          className="rm3d-submit-btn"
          onClick={handleSubmit}
          disabled={!title.trim() && !category}
        >
          <Check size={16} />
          <span>创建</span>
        </button>
      </div>
    </div>
  );
}

/* ──────────────────── Reminders 主页面 ──────────────────── */
export default function Reminders() {
  // 使用 AppShell 提供的 selectedPet（与 Pets.tsx 保持一致）
  const { phone, pets, selectedPet, selectedPetId } = useShell();
  const navigate = useNavigate();

  const [list, setList] = useState<Reminder[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "",
    due_date: "",
    repeat: "once" as ReminderRepeat,
    is_completed: false,
  });

  const petNameMap = useMemo(() => new Map(pets.map((x) => [x.id, x.name])), [pets]);
  // 与 Pets.tsx 保持一致：优先使用 AppShell 预计算的 selectedPet，降级到 pets[0]
  const currentPet = useMemo(() => selectedPet || pets[0] || null, [selectedPet, pets]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchReminders(phone, selectedPetId ?? undefined, "all");
      setList(res.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [phone, selectedPetId]);

  const urgentCount = list.filter((r) => r.status === "pending" && new Date(r.due_date) <= new Date()).length;
  const pendingCount = list.filter((r) => r.status === "pending").length;
  const weeklyCount = list.filter((r) => r.repeat === "weekly" && r.status === "pending").length;
  const doneCount = list.filter((r) => r.status === "done").length;

  const filteredList = useMemo(() => {
    if (activeTab === "urgent") return list.filter((r) => r.status === "pending" && new Date(r.due_date) <= new Date());
    if (activeTab === "pending") return list.filter((r) => r.status === "pending");
    if (activeTab === "weekly") return list.filter((r) => r.repeat === "weekly" && r.status === "pending");
    if (activeTab === "done") return list.filter((r) => r.status === "done");
    return list;
  }, [list, activeTab]);

  const onEdit = (item: Reminder) => {
    setEditingId(item.id);
    setEditForm({ title: item.title, due_date: item.due_date, repeat: item.repeat ?? "once", is_completed: item.is_completed });
  };

  const onSaveEdit = async () => {
    if (!editingId) return;
    await updateReminder(editingId, {
      title: editForm.title,
      due_date: editForm.due_date,
      is_completed: editForm.is_completed,
    });
    setEditingId(null);
    await load();
  };

  return (
    <>
      <main className="rm3d-page">
        {/* Hero */}
        <section className="rm3d-hero">
          <div className="rm3d-hero-bg">
            <div className="rm3d-hero-gradient" />
            <div className="rm3d-hero-orb rm3d-orb-1" />
            <div className="rm3d-hero-orb rm3d-orb-2" />
            <div className="rm3d-hero-grid-pattern" />
          </div>

          <div className="rm3d-hero-inner">
            <div className="rm3d-hero-text">
              <div className="rm3d-hero-badge">
                <Bell size={12} />
                <span>健康提醒</span>
              </div>
              <h1 className="rm3d-hero-title">提醒管理</h1>
              <p className="rm3d-hero-desc">管理宠物健康提醒，不会遗漏重要事项</p>

              <button className="rm3d-settings-btn" onClick={() => navigate("/app/reminder-settings")}>
                <Bell size={14} />
                <span>设置</span>
              </button>
            </div>

            <div className="rm3d-hero-visual">
              <div className="rm3d-char-stage">
                <PetPhotoAvatar pet={currentPet} size="default" className="hero-circular-avatar" />
              </div>
            </div>

            {/* 浮动装饰 - 白色图标 + 彩色圆底 */}
            <span className="ph3d-float-deco ph3d-float-heart"><Heart size={20} fill="#fff" color="#fff" /></span>
            <span className="ph3d-float-deco ph3d-float-star"><Star size={18} fill="#fff" color="#fff" /></span>
            <span className="ph3d-float-deco ph3d-float-paw"><PawPrint size={18} color="#fff" /></span>
          </div>
        </section>

        {/* 统计卡片 */}
        <section className="rm3d-stats-section">
          <div className="rm3d-stats-grid">
            <div className="rm3d-stat-card">
              <div className="rm3d-stat-icon rm3d-stat-urgent">
                <AlertCircle size={18} />
              </div>
              <div className="rm3d-stat-info">
                <strong>{urgentCount}</strong>
                <span>紧急</span>
              </div>
            </div>

            <div className="rm3d-stat-card">
              <div className="rm3d-stat-icon rm3d-stat-pending">
                <Clock size={18} />
              </div>
              <div className="rm3d-stat-info">
                <strong>{pendingCount}</strong>
                <span>待办</span>
              </div>
            </div>

            <div className="rm3d-stat-card">
              <div className="rm3d-stat-icon rm3d-stat-weekly">
                <Repeat size={18} />
              </div>
              <div className="rm3d-stat-info">
                <strong>{weeklyCount}</strong>
                <span>周期</span>
              </div>
            </div>

            <div className="rm3d-stat-card">
              <div className="rm3d-stat-icon rm3d-stat-done">
                <CheckCircle2 size={18} />
              </div>
              <div className="rm3d-stat-info">
                <strong>{doneCount}</strong>
                <span>已完成</span>
              </div>
            </div>
          </div>
        </section>

        {/* 添加按钮 */}
        <section className="rm3d-action-section">
          <button className="rm3d-add-btn" onClick={() => setShowAdd(true)}>
            <Plus size={18} />
            <span>添加提醒</span>
          </button>
        </section>

        {/* Tabs */}
        <section className="rm3d-tabs-section">
          <div className="rm3d-tabs">
            {TAB_LIST.map((tab) => (
              <button
                key={tab.key}
                className={`rm3d-tab ${activeTab === tab.key ? "active" : ""}`}
                style={activeTab === tab.key ? { color: tab.color, borderColor: tab.color } : {}}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 列表 */}
        <section className="rm3d-list-section">
          {loading ? (
            <div className="rm3d-empty">
              <div className="rm3d-empty-icon">
                <RefreshCw size={24} />
              </div>
              <p>加载中...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="rm3d-empty-fancy">
              <div className="rm3d-empty-3d-scene">
                {/* 宠物照片头像 */}
                <PetPhotoAvatar pet={currentPet} size="small" />
                {/* 环绕的可爱元素 - 全部白色图标 */}
                <span className="rm3d-float-ele rm3d-fe-1"><Bell size={16} color="#fff" /></span>
                <span className="rm3d-float-ele rm3d-fe-2"><Clock size={16} color="#fff" /></span>
                <span className="rm3d-float-ele rm3d-fe-3"><Pill size={16} color="#fff" /></span>
                <span className="rm3d-float-ele rm3d-fe-4"><Sparkles size={14} color="#fff" /></span>
                <span className="rm3d-float-ele rm3d-fe-5"><CalendarDays size={16} color="#fff" /></span>
              </div>

              <div className="rm3d-empty-circle">
                <div className="rm3d-empty-ring rm3d-ring-1" />
                <div className="rm3d-empty-ring rm3d-ring-2" />
                <div className="rm3d-empty-icon"><Bell size={28} color="#fff" /></div>
              </div>

              <h4 className="rm3d-empty-title">暂无提醒</h4>
              <p className="rm3d-empty-desc">
                {currentPet
                  ? `${currentPet.name}还没有健康提醒哦`
                  : "还没有任何健康提醒"}
              </p>
              <button className="rm3d-empty-add-btn" onClick={() => setShowAdd(true)}>
                <Plus size={14} />
                添加第一个提醒
              </button>
            </div>
          ) : (
            <div className="rm3d-reminder-list">
              {filteredList.map((item) => {
                const cat = getCategoryInfo(item.title);
                const petName = petNameMap.get(item.pet_id) || "";
                const isOverdue = new Date(item.due_date) <= new Date() && item.status === "pending";

                return (
                  <article key={item.id} className={`rm3d-reminder-item ${isOverdue ? "is-overdue" : ""} ${item.status === "done" ? "is-done" : ""}`}>
                    {editingId === item.id ? (
                      <div className="rm3d-edit-form">
                        <input
                          className="rm3d-edit-input"
                          value={editForm.title}
                          onChange={(e) => setEditForm((s) => ({ ...s, title: e.target.value }))}
                          placeholder="提醒内容"
                        />
                        <input
                          className="rm3d-edit-input"
                          type="date"
                          value={editForm.due_date}
                          onChange={(e) => setEditForm((s) => ({ ...s, due_date: e.target.value }))}
                        />
                        <select
                          className="rm3d-edit-select"
                          value={editForm.repeat}
                          onChange={(e) => setEditForm((s) => ({ ...s, repeat: e.target.value as ReminderRepeat }))}
                        >
                          <option value="once">一次</option>
                          <option value="daily">每天</option>
                          <option value="weekly">每周</option>
                          <option value="monthly">每月</option>
                        </select>
                        <select
                          className="rm3d-edit-select"
                          value={editForm.is_completed ? "done" : "pending"}
                          onChange={(e) => setEditForm((s) => ({ ...s, is_completed: e.target.value === "done" }))}
                        >
                          <option value="pending">待处理</option>
                          <option value="done">已完成</option>
                        </select>
                        <div className="rm3d-edit-actions">
                          <button className="rm3d-edit-save" onClick={onSaveEdit}>
                            <Check size={14} /> 保存
                          </button>
                          <button className="rm3d-edit-cancel" onClick={() => setEditingId(null)}>
                            <X size={14} /> 取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rm3d-reminder-icon" style={{ background: cat.bg }}>
                          <span style={{ fontSize: 20 }}>{cat.icon}</span>
                        </div>

                        <div className="rm3d-reminder-content">
                          <div className="rm3d-reminder-title-row">
                            <strong className="rm3d-reminder-title">{item.title}</strong>
                            {isOverdue && <span className="rm3d-overdue-badge">已逾期</span>}
                          </div>
                          <div className="rm3d-reminder-meta">
                            <span className="rm3d-reminder-repeat">
                              <Repeat size={12} />
                              {item.repeat === "once" ? "一次" : item.repeat === "daily" ? "每天" : item.repeat === "weekly" ? "每周" : "每月"}
                            </span>
                            {petName && <span className="rm3d-reminder-pet"><PawPrint size={12} />{petName}</span>}
                          </div>
                          <div className="rm3d-reminder-date">
                            <CalendarDays size={12} />
                            {item.due_date}
                            {item.due_time && ` ${item.due_time}`}
                          </div>
                        </div>

                        <button className="rm3d-edit-btn" onClick={() => onEdit(item)}>
                          <ChevronRight size={18} />
                        </button>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {showAdd && createPortal(
        <div className="rm3d-add-overlay">
          <AddReminderPage
            pets={pets}
            phone={phone}
            selectedPetId={selectedPetId}
            onClose={() => setShowAdd(false)}
            onDone={async () => { setShowAdd(false); await load(); }}
          />
        </div>,
        document.body
      )}
    </>
  );
}
