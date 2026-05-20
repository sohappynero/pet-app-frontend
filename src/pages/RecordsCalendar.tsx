import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchRecords } from "../lib/api";
import { useShell } from "../hooks/useShell";
import type { HealthRecord } from "../types";

type LegendItem = {
  key: string;
  label: string;
  colorClass: string;
};

type CalendarCell = {
  date: Date;
  day: number;
  inCurrentMonth: boolean;
  key: string;
};

const weekLabels = ["日", "一", "二", "三", "四", "五", "六"];

const legends: LegendItem[] = [
  { key: "weight", label: "体重", colorClass: "dot-weight" },
  { key: "vaccine", label: "疫苗", colorClass: "dot-vaccine" },
  { key: "deworm", label: "驱虫", colorClass: "dot-deworm" },
  { key: "checkup", label: "体检", colorClass: "dot-checkup" },
  { key: "diet", label: "饮食", colorClass: "dot-diet" },
];

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isDietRecord(record: HealthRecord) {
  const text = `${record.title || ""} ${record.note || ""} ${record.symptom || ""}`;
  return /饮食|喂食|粮|餐|食/.test(text) || record.record_type === "observation";
}

function getRecordTags(record: HealthRecord) {
  const tags: string[] = [];
  if (record.weight_kg !== null && !Number.isNaN(Number(record.weight_kg))) tags.push("weight");
  if (record.record_type === "vaccine") tags.push("vaccine");
  if (record.record_type === "deworm") tags.push("deworm");
  if (record.record_type === "checkup") tags.push("checkup");
  if (isDietRecord(record)) tags.push("diet");
  return tags;
}

export default function RecordsCalendar() {
  const navigate = useNavigate();
  const { phone, selectedPetId } = useShell();

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchRecords(phone, selectedPetId ?? undefined, "all");
        setRecords(Array.isArray(res.data) ? res.data : []);
      } catch {
        setRecords([]);
      }
    };
    load();
  }, [phone, selectedPetId]);

  const currentYear = cursorDate.getFullYear();
  const currentMonth = cursorDate.getMonth();

  const dateTagMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    records.forEach((record) => {
      const key = String(record.record_date || "").slice(0, 10);
      if (!key) return;
      const tags = getRecordTags(record);
      if (!tags.length) return;
      const set = map.get(key) ?? new Set<string>();
      tags.forEach((tag) => set.add(tag));
      map.set(key, set);
    });
    return map;
  }, [records]);

  const selectedDateRecords = useMemo(() => {
    return records
      .filter((item) => String(item.record_date || "").slice(0, 10) === selectedDateKey)
      .sort((a, b) => String(b.record_date || "").localeCompare(String(a.record_date || "")));
  }, [records, selectedDateKey]);

  const cells = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const result: CalendarCell[] = [];

    for (let i = 0; i < startWeekday; i += 1) {
      const day = prevMonthDays - startWeekday + i + 1;
      const date = new Date(currentYear, currentMonth - 1, day);
      result.push({ date, day, inCurrentMonth: false, key: toDateKey(date) });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(currentYear, currentMonth, day);
      result.push({ date, day, inCurrentMonth: true, key: toDateKey(date) });
    }

    const totalNeed = 42;
    let nextMonthDay = 1;
    while (result.length < totalNeed) {
      const date = new Date(currentYear, currentMonth + 1, nextMonthDay);
      result.push({ date, day: nextMonthDay, inCurrentMonth: false, key: toDateKey(date) });
      nextMonthDay += 1;
    }

    return result;
  }, [currentYear, currentMonth]);

  const selectedDateText = useMemo(() => {
    const [y = "", m = "", d = ""] = selectedDateKey.split("-");
    if (!y || !m || !d) return "当天";
    return `${y}年${Number(m)}月${Number(d)}日`;
  }, [selectedDateKey]);

  return (
    <main className="record-calendar-page">
      <header className="record-calendar-topbar">
        <button className="rc-back-btn" onClick={() => navigate("/app/records")}> 
          <ChevronLeft size={20} />
        </button>
        <h1>日历视图</h1>
        <span className="rc-topbar-placeholder" />
      </header>

      <section className="record-calendar-hero">
        <h2>日历视图</h2>
        <p>按日历查看健康记录</p>
      </section>

      <section className="record-calendar-month-bar">
        <button
          className="rc-month-switch"
          onClick={() => setCursorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          aria-label="上个月"
        >
          <ChevronLeft size={22} />
        </button>

        <strong>
          {currentYear}年 {currentMonth + 1}月
        </strong>

        <button
          className="rc-month-switch"
          onClick={() => setCursorDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
          aria-label="下个月"
        >
          <ChevronRight size={22} />
        </button>
      </section>

      <section className="record-calendar-grid-card">
        <div className="rc-week-row">
          {weekLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="rc-date-grid">
          {cells.map((cell) => {
            const tags = Array.from(dateTagMap.get(cell.key) || []);
            const isSelected = selectedDateKey === cell.key;
            const className = [
              "rc-date-cell",
              cell.inCurrentMonth ? "" : "is-out-month",
              isSelected ? "is-selected" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={cell.key}
                className={className}
                onClick={() => setSelectedDateKey(cell.key)}
                aria-label={cell.key}
              >
                <span>{cell.day}</span>
                {tags.length ? (
                  <div className="rc-cell-dots">
                    {tags.slice(0, 3).map((tag) => (
                      <i key={tag} className={`rc-dot ${`dot-${tag}`}`} />
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="rc-legend-row">
          {legends.map((item) => (
            <span key={item.key}>
              <i className={`rc-dot ${item.colorClass}`} />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      <section className="record-calendar-selected-info">
        <h3>{selectedDateText}</h3>
        {selectedDateRecords.length === 0 ? (
          <p>当天暂无健康记录</p>
        ) : (
          <div className="rc-selected-list">
            {selectedDateRecords.slice(0, 3).map((item) => (
              <button key={item.id} onClick={() => navigate(`/app/add-record?edit=${item.id}`)}>
                {item.title || "健康记录"}
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
