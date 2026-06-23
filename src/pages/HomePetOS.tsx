import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassNav from "../components/petos/GlassNav";
import HeroCard from "../components/petos/HeroCard";
import PetSwitcher from "../components/petos/PetSwitcher";
import SpeechBubble from "../components/ui/SpeechBubble";
import { useShell } from "../hooks/useShell";
import {
  getCheckInStatus,
  getDailyDigest,
  postCheckIn,
  type CheckInStatus,
  type CheckInAte,
  type CheckInActive,
  type CheckInMood,
  type DailyDigest,
  type PetProfileLike,
} from "../lib/home.mock";
import type { Pet } from "../types";

function greet(now: Date = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 12) return "早安 ☀️";
  if (h >= 12 && h < 18) return "午安 🌤️";
  return "晚安 🌙";
}

function relativeTime(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, now.getTime() - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.floor(hr / 24);
  return `${day} 天前`;
}

function speciesEmoji(species: Pet["species"]): string {
  if (species === "dog") return "🐕";
  if (species === "cat") return "🐈";
  return "🐾";
}

function petVisualOf(pet: Pet) {
  const url = pet._resolved_avatar_url || pet.avatar_url || pet.image_url;
  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{ width: "100%", height: "100%", borderRadius: "9999px", objectFit: "cover" }}
      />
    );
  }
  return speciesEmoji(pet.species);
}

export default function HomePetOS() {
  const navigate = useNavigate();
  const { pets, selectedPet, selectedPetId, setPetId, nickname } = useShell();

  const [digest, setDigest] = useState<DailyDigest | null>(null);
  const [checkIn, setCheckIn] = useState<CheckInStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkinExpanded, setCheckinExpanded] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function petProfile(pet: Pet): PetProfileLike {
    return { id: pet.id, name: pet.name, species: pet.species, breed: pet.breed, age: pet.age, weight_kg: pet.weight_kg };
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPet) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const url = reader.result as string;
      const d = await postCheckIn(petProfile(selectedPet), { photoToday: { url, takenAt: new Date().toISOString() } });
      setDigest(d);
      const s = await getCheckInStatus(selectedPet.id);
      setCheckIn(s);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSelect = async (field: "ate" | "active" | "mood", value: string) => {
    if (!selectedPet) return;
    const d = await postCheckIn(petProfile(selectedPet), { [field]: value });
    setDigest(d);
    const s = await getCheckInStatus(selectedPet.id);
    setCheckIn(s);
  };

  useEffect(() => {
    if (!selectedPet) {
      setDigest(null);
      setCheckIn(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getDailyDigest({
        id: selectedPet.id,
        name: selectedPet.name,
        species: selectedPet.species,
        breed: selectedPet.breed,
        age: selectedPet.age,
        weight_kg: selectedPet.weight_kg,
      }),
      getCheckInStatus(selectedPet.id),
    ]).then(([d, c]) => {
      if (cancelled) return;
      setDigest(d);
      setCheckIn(c);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedPet?.id]);

  const greeting = useMemo(() => greet(), []);

  if (pets.length === 0) {
    return (
      <div className="petos-page">
        <div className="petos-content">
          <GlassNav />
          <div className="petos-empty-state">
            <div className="petos-empty-state__icon" aria-hidden="true">🐾</div>
            <h2 className="petos-empty-state__title">还没添加宠物</h2>
            <p className="petos-empty-state__desc">带它来认识 PetOS 吧～</p>
            <button
              type="button"
              className="petos-cta petos-empty-state__cta"
              onClick={() => navigate("/app/pets/add")}
            >
              <span>添加我的第一个宠物</span>
              <span className="petos-cta__arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPet) return null;

  const speaksText = digest?.speaks ?? "";
  const speaksMood = digest?.speaksMood ?? "normal";
  const bubbleTime = digest?.generatedAt ? relativeTime(digest.generatedAt) : "";
  const weightDisplay = selectedPet.weight_kg ?? "--";
  const hasPhoto = checkIn?.photoToday != null;
  const isAllDone = hasPhoto && checkIn?.ate != null && checkIn?.active != null && checkIn?.mood != null;

  return (
    <div className="petos-page">
      <div className="petos-content">
        <GlassNav onAddClick={() => navigate("/app/pets/add")} />

        <div className="petos-greet">
          <div className="petos-greet__hi">
            {greeting}，{nickname || "你好"}
          </div>
          <div className="petos-greet__name">
            {selectedPet.name}
            <em>。</em>
          </div>
        </div>

        {pets.length > 1 ? (
          <PetSwitcher
            pets={pets}
            selectedPetId={selectedPetId}
            onSelect={setPetId}
          />
        ) : null}

        <HeroCard score={100} unit="" statusText="状态正常" petVisual={petVisualOf(selectedPet)} />

        <div className="petos-quote">
          <div className="petos-quote__who">
            {selectedPet.name} · {bubbleTime || (loading ? "加载中" : "")}
          </div>
          {speaksText ? (
            <SpeechBubble text={speaksText} mood={speaksMood} typewriter={false} />
          ) : (
            <span style={{ color: "var(--color-text-tertiary)" }}>--</span>
          )}
        </div>

        <input ref={photoInputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handlePhoto} />
        <button type="button" className={hasPhoto ? "petos-cta petos-cta--done" : "petos-cta"} onClick={() => photoInputRef.current?.click()}>
          {hasPhoto && checkIn?.photoToday?.url ? (
            <img src={checkIn.photoToday.url} alt="" className="petos-cta__thumb" />
          ) : null}
          <span>{hasPhoto ? "今日已记录" : "📸 给我留个影"}</span>
          <span className="petos-cta__arrow">{hasPhoto ? "↻" : "→"}</span>
        </button>

        <div className="petos-checkin">
          {isAllDone && !checkinExpanded ? (
            <div className="petos-checkin__summary">
              <span className="petos-checkin__done">✓ 今日打卡完成</span>
              <button type="button" className="petos-checkin__edit" onClick={() => setCheckinExpanded(true)}>修改</button>
            </div>
          ) : (
            <>
              {isAllDone && (
                <div className="petos-checkin__summary">
                  <span className="petos-checkin__done">✓ 今日打卡完成</span>
                  <button type="button" className="petos-checkin__edit" onClick={() => setCheckinExpanded(false)}>收起</button>
                </div>
              )}
              <div className="petos-checkin__row">
                <div className="petos-checkin__label">🍽️ 吃了吗</div>
                <div className="petos-checkin__pills">
                  {([["normal", "正常"], ["less", "偏少"], ["much", "偏多"]] as [CheckInAte, string][]).map(([v, l]) => (
                    <button key={v} type="button" className={`petos-checkin__pill${checkIn?.ate === v ? " petos-checkin__pill--on" : ""}`} onClick={() => handleSelect("ate", v)}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="petos-checkin__row">
                <div className="petos-checkin__label">🏃 动了吗</div>
                <div className="petos-checkin__pills">
                  {([["normal", "正常"], ["less", "偏少"], ["much", "偏多"]] as [CheckInActive, string][]).map(([v, l]) => (
                    <button key={v} type="button" className={`petos-checkin__pill${checkIn?.active === v ? " petos-checkin__pill--on" : ""}`} onClick={() => handleSelect("active", v)}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="petos-checkin__row">
                <div className="petos-checkin__label">😊 状态如何</div>
                <div className="petos-checkin__pills">
                  {([["happy", "开心"], ["normal", "一般"], ["low", "低落"]] as [CheckInMood, string][]).map(([v, l]) => (
                    <button key={v} type="button" className={`petos-checkin__pill${checkIn?.mood === v ? " petos-checkin__pill--on" : ""}`} onClick={() => handleSelect("mood", v)}>{l}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="petos-stats">
          <div className="petos-stat petos-stat--blue">
            <div className="petos-stat__lbl">7 日体重</div>
            <div className="petos-stat__val">
              {weightDisplay}
              {selectedPet.weight_kg != null && <span className="petos-stat__unit">kg</span>}
            </div>
            <div className="petos-stat__delta">—</div>
          </div>
          <div className="petos-stat petos-stat--green">
            <div className="petos-stat__lbl">今日运动</div>
            <div className="petos-stat__val">
              35<span className="petos-stat__unit">min</span>
            </div>
            <div className="petos-stat__delta">达成 ✓</div>
          </div>
        </div>
      </div>
    </div>
  );
}
